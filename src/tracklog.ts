#!/usr/bin/env node
import * as yargs from 'yargs';

import { DockerLogsTracker } from "./dockerLogsTracker";
import { FileStorage } from "./filestore";
import { startMain } from './service';
import { startDemo } from './demo';
const storage = new FileStorage('./store')

const tracker = new DockerLogsTracker(storage);
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
    .command('logs <name> [options]', 'similar to docker logs {container}', (yargs) => {
      return yargs
        .positional('name', {
          describe: 'container name',
          default: 'containerName'
        }).option('since', {
          alias: 's',
          type: 'string',
          description: 'logs Show logs since timestamp (e.g. 2013-01-02T13:23:37) '
        })
        .option('until', {
          alias: 'u',
          type: 'string',
          description: 'logs Show logs before a timestamp (e.g. 2013-01-02T13:23:37) '
        }).option('verbose', {
          alias: 'v',
          type: 'boolean',
          description: 'Run with verbose logging'
        })
    }, (argv) => {
      if (argv.verbose) console.info(`docker logs ${argv.name}`)
      dump(`${argv.name}`, argv.since, argv.until, argv.verbose);
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    })    
    .help()
    .argv

}

async function dump(name: string, sinceStr?:string, untilStr?:string, verbose?:boolean) {
  let  since:number|undefined;
  let  until:number|undefined;
  console.log('got  ', name, sinceStr, untilStr);
  since = sinceStr?Date.parse(sinceStr):undefined;
  until = untilStr?Date.parse(untilStr):undefined;
  console.log('dump ', name, since, until, verbose);
  let data = await tracker.getLogs(name, since, until, verbose);
  data.pipe(process.stdout);
}

// dump('chosen', '2020-02-18T21:10:39', '2020-02-18T21:10:39', true)
startDemo()
commandLine()



