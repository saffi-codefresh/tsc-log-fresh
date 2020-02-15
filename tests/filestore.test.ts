
import { expect } from 'chai';
import 'mocha';
import str from 'string-to-stream'
import streamToString from 'stream-to-string'
import { FileStorage } from '../src/filestore';
import { Readable , Writable} from 'stream';
import * as stream from 'stream';
import {Duplex, Transform} from 'stream';
import streamEqual from 'stream-equal';
import { read } from 'fs';



const createCounterReader = (limit:number) => {
  let count = 0;
  return new Readable({
    objectMode: false,
    read() {
      const value = count < limit ? ` ${count.toString()}` : null;
      count += 1;
      this.push(value);
    },
  });
};


class MyTransform extends Transform {
  constructor(options?: stream.TransformOptions) {
    super(options);
  }
  _transform(chunk: any, encoding: string, callback: stream.TransformCallback) {
    this.push(chunk);
  }
}
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
      expect( files== [] ).to.true;
    } );
    it('list used ', async () => {
      const storage = new FileStorage("used");
      var readable:Readable= Readable.from("text");
      await storage.store('hello',  readable);  
      var files = await storage.list("");
      expect( files== ["hello"] ).to.true;
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
    
    it('checking medium', async () => {
      const storage = new FileStorage();
      const size = 100000;
      const key = `medium${size}`;
      expect( await compareStore(storage, key, createCounterReader(size), createCounterReader(size)) ).to.true;
    } );
    // it('checking xmedium', async () => {
    //   const storage = new FileStorage();
    //   const size = 100000;
    //   const key = `xmedium${size}`;
    //   expect( await compareStore(storage, key, createCounterReader(size), createCounterReader(size+1)) ).to.false;
    // } );
    // it('checking large', async () => {
    //   const storage = new FileStorage();
    //   const size = 10000000;
    //   const key = `large${size}`;
    //   expect( await compareStore(storage, key, createCounterReader(size), createCounterReader(size)) ).to.true;
    // } );
  });

async function compareStore(storage: FileStorage, key: string, source: Readable, compared: Readable) :Promise<boolean>{
    await storage.store(key, source);
    const loaded = await storage.load(key);
    // return compare2(loaded, compared);
    
    return streamEqual(loaded, compared);
}


function compare2(loaded: Readable, compared: Readable): boolean | PromiseLike<boolean> {
    return new Promise<boolean>((resolve) => {
      var cnt: number = 0;
      var result = true;
      var buffer2 = "";
      var pos1=0;
      var pos2=0;
      var buffer1 = "";

    //   var doneCnt=2;
    //   compared.on('end', () => {
    //     loaded.resume();
    //     checkSlice();
    //     whenDone();
    //     });
    //   loaded.on('end', () => {
    //     compared.resume();
    //     checkSlice();
    //     whenDone();
    // });
    Promise.all([
      new Promise<boolean>((resolve1 )=>{
        loaded.on('data', (chunk) => {
        
          buffer1 += chunk.toString();
          
          checkSlice();
          buffer1=buffer1.slice(pos1);
          pos1=0;
          
          if(buffer2.length<=buffer1.length){
            if (compared.isPaused()) compared.resume();
            // loaded.pause();
          }
        });
        loaded.on("end", ()=>{
          if (compared.isPaused()) compared.resume();
            resolve1();
          });
      }),
      new Promise<boolean>((resolve2 )=>{      

        compared.on('data', (chunk) => {    
          const newchunk = chunk.toString();

          buffer2 += newchunk;
          checkSlice();
          buffer2=buffer2.slice(pos2);
          pos2=0;
          if(buffer2.length>buffer1.length){
            if (loaded.isPaused()) loaded.resume();
            compared.pause();
          }

        });
        compared.on("end", ()=>{
          if (loaded.isPaused()) loaded.resume();
            resolve2();
          });
      })
    ])
    .then(()=>{ 
      whenDone();
    });

    function whenDone() {
      checkSlice();
      if (buffer2.length != pos2) {
        console.log(`ended too soon pos2 ${pos2} some left ${buffer2.slice(pos2)}`);
        result = false;
      }
      else if (buffer1.length != pos1) {
        console.log(`ended too soon pos1  ${pos1} compared left ${buffer1.slice(pos1)}`);
        result = false;
      }
      else {
        const left = compared.read();
        if (left != null) {
          console.log(`compared not empty  ${left.toString()}`);
          result = false;
        }
      }
      resolve(result);
      console.log(`processed ${cnt}`);
      return result;
    }

    function checkSlice() {
      const sliceSize = Math.min(buffer2.length - pos2, buffer1.length - pos1);
      cnt += sliceSize;
      if (sliceSize > 0) {
        const sliced1 = buffer1.slice(pos1, pos1+sliceSize);
        const sliced2 = buffer2.slice(pos2, pos2 + sliceSize);
        pos1 += sliceSize;
        pos2 += sliceSize;
        if (sliced1 != sliced2) {
          console.log(`no match ${sliced1} with ${sliced2}`);
          result = false;
          resolve(result);
        }
      }
    }
  }

  )};
 

function readableToString(readable:Readable): Promise<string>{
  return new Promise((resolve, reject) => {
    let data = '';
    readable.on('data', function (chunk) {
      data += chunk;
    });
    readable.on('end', function () {
      resolve(data);
    });
    readable.on('error', function (err) {
      reject(err);
    });
  });
}

async function readableToString2(readable:Readable) :Promise<string>{
  let result = '';
  for await (const chunk of readable) {
    result += chunk;
  }
  return result;
}