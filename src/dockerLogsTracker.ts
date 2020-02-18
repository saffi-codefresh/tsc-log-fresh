
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
    sinceSlice: { [indexer: string]: string } = {};
    storage: IStorage;
    confUpdate?: ((c: any) => Promise<void>);
    verbose: boolean;
    constructor(storage: IStorage, verbose = false) {
        this.storage = storage;
        this.verbose = verbose;
    }

    async start(conf: any, confupdate?: (c: any) => Promise<void>) {
        this.confUpdate = confupdate;
        var logTasks: Promise<void>[] = [];
        Object.entries(conf).forEach(kv => {
            let key = kv[0];
            let value = kv[1];
            if (typeof (value) == 'string') {
                this.sinceSlice[kv[0]] = value;
                if (value) {
                    let since = new Date(Date.parse(value));
                    logTasks.push(this.logTask(key, since));
                }
                else {
                    logTasks.push(this.logTask(key));
                }
            }
        });
        Promise.all(logTasks).then(() => console.log("=============================== Started. =============================="));
    }


    async logTask(name: string, since?: Date): Promise<void> {
        const sinceStr = since ? `--since ${since.toISOString()}` : '';

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
        this.tasks['test'] = task;
    }


    private setUpStoragePipeSwitchPerHour(name: string, task: ChildProcessWithoutNullStreams) {
        const trackLatest = new PassThrough();
        let lastPipe = new PassThrough();
        let nameToStore = `${name}/logs`;
        let lastTimeSlice = '';
        let verbose: boolean = this.verbose;
        console.log(`Tracking: ${name}`);

        /**
        * update the lasest updated time so if we run again we would not need to load all the logs that were already loaded
        */
        let updateTimeSlice = async(lastTimeSliceParam: string, name: string, latestDateStr: string)=>{
            if (!lastTimeSliceParam) return;
            if (this.sinceSlice[name]==lastTimeSliceParam) return;
            this.sinceSlice[name] = lastTimeSliceParam;
            if (this.confUpdate) {
                this.confUpdate(this.sinceSlice);
            }
            lastTimeSlice = latestDateStr.split(".")[0];
        }

        this.storage.store(nameToStore, lastPipe);
        
        trackLatest.on('data', (chunk) => {
            const dateStr: string = chunk.toString().slice(0, 31);
            // todo - add validatation 
            let validated = true;
            if (validated) {
                // const perHour = dateStr.split(':').slice(0, 1).join('_') + "_00_00";
                const perHour = dateStr.split(':').slice(0, 2).join('_') + "_00";
                const perHourName = `${name}/logs-${perHour}`;
                if (nameToStore != perHourName) {
                    if (verbose) {
                        console.log(`${dateStr}  switch ${nameToStore} to ${dateStr}`);
                    }
                    let oldPipe = lastPipe;
                    lastPipe = new PassThrough();
                    oldPipe.end() 
                    this.storage.store(perHourName, lastPipe);
                    if (verbose) {
                        console.log(`${dateStr}  switched ${nameToStore} to ${dateStr}`);
                    }
                    nameToStore = perHourName;
                    updateTimeSlice(lastTimeSlice, name, dateStr);
                }
            }
            lastPipe.write(chunk);
            if (verbose) {
                console.log(`${nameToStore} ${dateStr}`);
            }
        });
        trackLatest.on('end', () => {
            console.log(`Closing ${name}. Check if the container is running`);
        });
        task.stdout.pipe(trackLatest);
    }

    async getLogs(name: string): Promise<Readable> {
        const files = await this.storage.list(name);
        const toMerge: Readable[] = [];
        for (let i in files) {
            let file = files[i];
            let current = await this.storage.load(`${name}/${file}`);
            toMerge.push(current);
        }
        return this.merge(...toMerge);
    }

    merge = (...streams: Readable[]) => {
        let pass = new PassThrough()
        let waiting = streams.length
        if (!waiting) {
            pass.end();
        }
        for (let stream of streams) {
            pass = stream.pipe(pass, { end: false })
            stream.once('end', () => --waiting === 0 && pass.emit('end'))
        }
        return pass
    }


}

