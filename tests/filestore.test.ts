
import { expect } from 'chai';
import 'mocha';
import str from 'string-to-stream'
import streamToString from 'stream-to-string'
import { FileStorage } from '../src/filestore';
import { Readable , Writable} from 'stream';
import * as stream from 'stream';
import streamEqual from 'stream-equal';
import { read } from 'fs';



const createCounterReader = (limit:number) => {
  let count = 0;
  return new Readable({
    objectMode: true,
    read() {
      const value = count < limit ? ` ${count.toString()}` : null;
      count += 1;
      this.push(value);
    },
  });
};


async function writeRead(text : string):Promise<string>{
  const storage = new FileStorage();
  var readable:Readable= Readable.from(text);
  await storage.store('hello',  readable);
  const resultStream  = await storage.load('hello');
  return await streamToString(resultStream);
}

describe('Store and load data', 
  () => { 
    it('should write and read same', async () => {
    const v = "hello world";
    const resultPromise = writeRead(v);
      resultPromise.then(
            result=>{
              expect(result).to.equal(v);
             console.log(`result ${result}`);
      })
    }); 
});

describe('check store retrieve ', 
  () => {
    
    it('list ', async () => {
      const storage = new FileStorage("unused");
      var files = await storage.list("");
      expect( files.length ).to.equal(0);
    } );
    it('list used ', async () => {
      const storage = new FileStorage("used");
      var readable:Readable= Readable.from("text");
      await storage.store('hello',  readable);  
      var files = await storage.list("");
      expect( files ).to.deep.equal(['hello']);
    } );
    it('negative test first', async () => {
      const storage = new FileStorage();
      expect( await compareStore(storage, "shouldfail", createCounterReader(11), createCounterReader(10)) ).to.false;
      expect( await compareStore(storage, "shouldfail2", createCounterReader(10), createCounterReader(11)) ).to.false;
    } );
    it('positive simple', async () => {
      const storage = new FileStorage();
      expect( await compareStore(storage, "shouldSucceed", createCounterReader(11), createCounterReader(11)) ).to.true;
    } );
    it('checking small', async () => {
      const storage = new FileStorage();
      const size = 1000;
      const key = `small${size}`;
      expect( await compareStore(storage, key, createCounterReader(size), createCounterReader(size)) ).to.true;
    } );
    
    // it('checking medium', async () => {
    //   const storage = new FileStorage();
    //   const size = 100000;
    //   const key = `medium${size}`;
    //   expect( await compareStore(storage, key, createCounterReader(size), createCounterReader(size)) ).to.true;
    // } );
  });

async function compareStore(storage: FileStorage, key: string, source: Readable, compared: Readable) :Promise<boolean>{
    await storage.store(key, source);
    const loaded = await storage.load(key);
    // return compare2(loaded, compared);
    
    return streamEqual(loaded, compared);
}


async function readableToString2(readable:Readable) :Promise<string>{
  let result = '';
  for await (const chunk of readable) {
    result += chunk;
  }
  return result;
}