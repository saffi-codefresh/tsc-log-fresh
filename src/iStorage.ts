import { Writable, Readable } from 'stream';

export interface IStorage{
    store(key: String, readable: Readable): Promise<void>;
    load(key: String): Promise<Readable> ;
    list(key:string):Promise<string []>
}
