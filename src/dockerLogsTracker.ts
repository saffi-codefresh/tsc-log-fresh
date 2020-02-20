
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { IStorage } from './iStorage';
import { FileStorage } from './filestore';
import { PassThrough, Readable } from 'stream'
import * as fs from 'fs';
import { findSourceMap } from 'module';
import { type } from 'os';

interface IObjectHash {
    [indexer: string]: object;
}


export class DockerLogsTracker {
    tasks: IObjectHash = {};
    tasksPipe: IObjectHash = {};
    lastDoneSlice: { [indexer: string]: string } = {};
    currentSlice: { [indexer: string]: string } = {};
    storage: IStorage;
    updateConf?: ((c: any) => Promise<void>);
    verbose: boolean;
    constructor(storage: IStorage, verbose = false) {
        this.storage = storage;
        this.verbose = verbose;
    }

    async start(conf: any, updateConf?: (c: any) => Promise<void>) {
        this.updateConf = updateConf;
        var logTasks: Promise<void>[] = [];

        Object.entries(conf).forEach(kv => {
            let key = kv[0];
            let value = kv[1];
            if (typeof (value) == 'string') {
                this.lastDoneSlice[kv[0]] = value;
                if (value) {
                    let since = new Date(Date.parse(value));
                    logTasks.push(this.trackTask(key, since));
                }
                else {
                    logTasks.push(this.trackTask(key));
                }
            }
        });
        Promise.all(logTasks).then(() => console.log("=============================== Started. =============================="));
    }


    async trackTask(name: string, since?: Date): Promise<void> {
        const sinceStr = since ? `--since ${since.toISOString().split('.')[0]}Z` : '';
        // we track the last ended slice.
        this.currentSlice[name] = this.lastDoneSlice[name] ;

        let shellCmd = `docker logs ${name} -f -t ${sinceStr}`;
        const task = spawn(shellCmd, {
            shell: true,
            cwd: '.'
        });
        this.setUpStoragePipeSwitchPerHour(name, task);

        task.on('exit', function (code, signal) {
            console.log('child process exited with ' +
                `code ${code} and signal ${signal}`);
        });
        this.tasks[name] = task;
    }


    private setUpStoragePipeSwitchPerHour(name: string, task: ChildProcessWithoutNullStreams) {
        const verbose: boolean = this.verbose;
        const trackLatest = new PassThrough();
        let lastPipe = new PassThrough();
        let nextPipe = new PassThrough();
        let nameToStore = `${name}/logs`;
        console.log(`Tracking: ${name}`);

        /**
        * update the last retried time so if we run again we would not need to load all the logs that were already loaded
        */
        let updateTimeSlice = async (latestDateStr: string) => {
            this.lastDoneSlice[name] = this.currentSlice[name];            
            this.currentSlice[name] = latestDateStr;            
            if (this.updateConf) {
                this.updateConf(this.lastDoneSlice);
                if(verbose){
                    console.log(`confUpdated ${name}`)
                }
            }    
        }

        this.storage.store(nameToStore, lastPipe);

        trackLatest.on('data', (chunk) => {
            const dateStr: string = chunk.toString().slice(0, 19)+"Z";
            // todo - add validatation 
            let validated = Date.parse(dateStr);//
            if (validated) {
                const perHour = dateStr.split(':').slice(0, 1).join('_') + "_00_00Z";
                // per min
                // const perHour = dateStr.split(':').slice(0, 2).join('_') + "_00Z";
                const perHourName = `${name}/logs-${perHour}`;
                if (nameToStore != perHourName) {
                    let oldPipe = lastPipe;
                    let nameWas = nameToStore;
                    lastPipe = nextPipe;
                    nameToStore = perHourName;
                    nextPipe = new PassThrough()
                    if (verbose) {
                        console.log(`${dateStr}  switch ${nameWas} to ${nameToStore}`);
                    }
                    oldPipe.end(); // make sure we are close 
                    this.storage.store(nameToStore, lastPipe);
                    updateTimeSlice(dateStr);
                }
            }
            lastPipe.write(chunk); // several lines 
            if (verbose) {
                console.log(`${nameToStore}: ${dateStr}`);
            }
        });
        trackLatest.on('end', () => {
            console.log(`Closing ${name}. Check if the container is running`);
        });
        task.stdout.pipe(trackLatest);
    }

    async getLogs(name: string, since?: number, until?: number, verbose?: boolean): Promise<Readable> {
        const files = await this.storage.list(name);

        const toMerge: Readable[] = [];
        const filesToInclude: string[] = [];
        for (let file of files) {
            if (this.checkFilenameIcluded(file, since, until, verbose)) {
                filesToInclude.push(file);
                if (verbose) {
                    console.log(`include: ${name}/${file}`, file);
                }
            }
        }
        for (let file of filesToInclude) {
            let current = await this.storage.load(`${name}/${file}`);
            toMerge.push(current);
        }
        return this.merge(...toMerge);
    }

    merge (...streams: Readable[]):Readable  {
        let pass = new PassThrough();
        let n = streams.length;
        if (!n) {
            pass.end();
            return pass;
        }
        for (let i=1;i<n-1;i++){
            streams[i-1].once('end', () => streams[i].pipe(pass, {end:false}));
        }
        streams[n-1].once('end', () => pass.emit('end'));
        streams[0].pipe(pass, { end: false });
        return pass;
    }

    private checkFilenameIcluded(file: string, since?: number, until?: number, verbose?: boolean) {
        const fileDate = file.replace(/_/g, ':').replace('logs-', '');
        let startTimePlus = Date.parse(fileDate);
        if (startTimePlus) {
            if (since) {
                if (startTimePlus < since - 60000) {
                    if (verbose) {
                        console.log("since: skip ", file);
                    }
                    // continue;
                    return false;
                }
            }
            if (until) {
                if (startTimePlus > until) {
                    if (verbose) {
                        console.log("until: skip ", file);
                    }
                    // continue;
                    return false;
                }
            }
        }
        return true;
    }
}

