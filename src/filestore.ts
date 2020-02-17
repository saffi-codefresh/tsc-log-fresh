import * as fs from 'fs';
import { Readable } from 'stream';
import { IStorage } from './iStorage';
import { promisify } from 'util';
import path = require('path');
export class FileStorage implements IStorage {
    async list(namepath: string): Promise<string[]> {
        const fname = `${this.dirpath}/${namepath}`;
        try {
            let files = await promisify(fs.readdir)(fname);
            files.sort();
            return files.filter(it => !it.endsWith('_'));
        }
        catch (e) {
            return [];
        }
    }

    dirpath: string;
    constructor(dirPath?: string) {
        this.dirpath = dirPath ? dirPath : './store';
    }

    async store(namepath: string, readable: Readable): Promise<void> {
        const fname = `${this.dirpath}/${namepath}`;
        new Promise<void>(()=>{
        const basepath = path.dirname(fname);
        fs.mkdirSync(basepath, { recursive: true });
        const bak = fname + '_';
        try {
            fs.unlinkSync(bak);
        }
        catch (e) {}            
        try {
            fs.renameSync(fname, bak);
        }
        catch (e) {}            
        })
        
        const writable = fs.createWriteStream(fname, 'utf-8');
        readable.pipe(writable);
    }

    async load(namepath: String): Promise<Readable> {
        const fname = `${this.dirpath}/${namepath}`;

        var readable = fs.createReadStream(fname, 'utf-8');
        return readable;
    }
}

