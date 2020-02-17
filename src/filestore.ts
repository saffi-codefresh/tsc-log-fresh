import * as fs from 'fs';
import { Readable } from 'stream';
import { IStorage } from './iStorage';
import { promisify } from 'util';
export class FileStorage implements IStorage {
    async list(namepath: string): Promise<string[]> {
        const fname = `${this.dirpath}/${namepath}`;    
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(fname, (err, files) => {
                if (err) {
                    resolve([]);
                } else {
                    files.sort();
                    resolve(files.filter(it=>!it.endsWith('_')));
                }
            });
        });
    }

    dirpath: string;
    constructor(dirPath?: string) {
        this.dirpath = dirPath ? dirPath : './store';
        if (!fs.existsSync(this.dirpath)) {
            fs.mkdirSync(this.dirpath);
        }
    }
    async store(namepath: String, readable: Readable): Promise<void> {
        await this.mkdirs(namepath);
        const fname = `${this.dirpath}/${namepath}`;
        const bak = fname + '_';
        if (await promisify(fs.exists)( fname )){
            if (await promisify(fs.exists)(bak)) { 
             await promisify(fs.unlink)(bak);
            }

            await promisify(fs.rename)(fname, bak);
        } 

        const writable = fs.createWriteStream(fname, 'utf-8');
        readable.pipe(writable);        
    }

    private async mkdirs(namepath: String) {
        const dirPathEnd = namepath.lastIndexOf('/');
        if (dirPathEnd <= 0) return;
        let dir = namepath.slice(0, dirPathEnd);
        let parts = dir.split('/');
        let curPath = this.dirpath;
        for (let i = 0; i < parts.length; i++) {
            const x = await promisify(fs.exists)(curPath);
            !x?await promisify(fs.mkdir)(curPath):'';
            curPath += '/' + parts[i];
        }
        if (!await promisify(fs.exists)(curPath)) {
            await promisify(fs.mkdir)(curPath);
        }
    }

    async load(namepath: String): Promise<Readable> {
        const fname = `${this.dirpath}/${namepath}`;

        var readable = fs.createReadStream(fname, 'utf-8');
        return readable;
    }
}

