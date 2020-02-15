
import { expect } from 'chai';
import 'mocha';
import str from 'string-to-stream'
import streamToString from 'stream-to-string'
import { FileStorage } from '../src/filestore';
import { Readable, Writable } from 'stream';
import * as stream from 'stream';
import { Duplex, Transform } from 'stream';
import streamEqual from 'stream-equal';
import { read } from 'fs';
import { DockerLogsTracker } from '../src/dockerLogsTracker';




async function writeRead(text: string): Promise<string> {
  const filepath = 'hello';
  const storage = new FileStorage();
  var readable: Readable = Readable.from(text);
  await storage.store(filepath, readable);
  const resultStream = await storage.load('hello');
  return await streamToString(resultStream);
}

describe('Store and load dir data',
  () => {
    it('store ', async () => {
      const dirname = 'dir';
      const storage = new FileStorage();
      const tracker = new DockerLogsTracker(storage);
      const emptylist = await tracker.getLogs(dirname);
      // let empty = await streamToString(emptylist);
      // expect(empty.length).to.equal(0);
      await storage.store(dirname + '/a2', Readable.from("a2"));
      await storage.store(dirname + '/a1', Readable.from("a1"));
      const fullist = await tracker.getLogs(dirname);
      let merged = await streamToString(fullist);
      expect(merged).to.equal('a1a2');
    });
  });

// describe('check store retrieve ',
//   () => {

//     it('list ', async () => {
//       const storage = new FileStorage("unused");
//       var files = await storage.list("");
//       expect(files == []).to.true;
//     });
//     it('list used ', async () => {
//       const storage = new FileStorage("used");
//       var readable: Readable = Readable.from("text");
//       await storage.store('hello', readable);
//       var files = await storage.list("");
//       expect(files == ["hello"]).to.true;
//     });
   
//   });
