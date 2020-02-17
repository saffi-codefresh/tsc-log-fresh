#!/usr/bin/env node
import * as yargs from 'yargs';

import { DockerLogsTracker } from "./dockerLogsTracker";
import { FileStorage } from "./filestore";
import { startMain } from './service';
import { startDemo } from './demo';
const storage = new FileStorage('./store')

const tracker = new DockerLogsTracker(storage);

// yargs
// .scriptName("logs")
// .usage('$0 <cmd> [args]')
// .command('logs [name]', 'chosen', (yargs) => {
//   yargs.positional('name', {
//     type: 'string',
//     default: '',
//     describe: 'container'
//   })
// }, function (argv) {
//     const name = argv.$0;
//     console.log('dump ', name)
//    dump(name);
// })
// .help()
// .argv

function commandLine() {

  yargs
    .command('track', 'start the server', (yargs) => {

    }, (argv) => {
      if (argv.verbose) console.info(`start server on`)
      startMain(!!argv.verbose);
    })
    .command('demo', 'start the demo with two docker named chosen and chosen2', (yargs) => {

    }, (argv) => {
      if (argv.verbose) console.info(`start the demo`)
      startDemo();
    })
    .example('$0 start -v', 'start using tracklog.conf tracking docker show stdout verbose')
    .command('logs [name]', 'similar to docker logs {container}', (yargs) => {
      yargs
        .positional('name', {
          describe: 'container name',
          default: 'containerName'
        })
    }, (argv) => {
      if (argv.verbose) console.info(`docker logs ${argv.name}`)
      dump(`${argv.name}`);
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    })
    .argv

}

async function dump(name: string) {
  console.log('dump ', name)
  let data = await tracker.getLogs(name);
  data.pipe(process.stdout);
}

commandLine()