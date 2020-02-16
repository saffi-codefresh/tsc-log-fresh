import * as fs from 'fs';
import { Readable } from 'stream';
import { IStorage } from './iStorage';
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
        this.mkdirs(namepath);
        const fname = `${this.dirpath}/${namepath}`;
        fs.exists(fname, (x) => x ? fs.renameSync(fname, fname + '_') : '');

        var writable = fs.createWriteStream(fname, 'utf-8');
        readable.pipe(writable);

    }

    private mkdirs(namepath: String) {
        const dirPathEnd = namepath.lastIndexOf('/');
        if (dirPathEnd <= 0) return;
        let dir = namepath.slice(0, dirPathEnd);
        let parts = dir.split('/');
        let curPath = this.dirpath;
        for (let i = 0; i < parts.length; i++) {
            if (!fs.existsSync(curPath)) {
                fs.mkdirSync(curPath);
            }
            curPath += '/' + parts[i];
        }
        if (!fs.existsSync(curPath)) {
            fs.mkdirSync(curPath);
        }
    }

    async load(namepath: String): Promise<Readable> {
        const fname = `${this.dirpath}/${namepath}`;

        var readable = fs.createReadStream(fname, 'utf-8');
        return readable;
    }
}

