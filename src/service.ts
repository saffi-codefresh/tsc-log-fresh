import * as fs from 'fs';
import { DockerLogsTracker } from './dockerLogsTracker';
import { FileStorage } from './filestore';


export function startMain(verbose:boolean){
    let tracker = new DockerLogsTracker(new FileStorage('./store'), verbose);
    main(tracker);
}

async function  main(tracker: DockerLogsTracker) {
    let conf = readConf();
    tracker.start(conf, updateConf);
  }
  

export const confName = 'tracklog.conf';
function readConf() {
  // default if no conf
  if (!fs.existsSync(confName)) {
    let conf: object = {
      'chosen': '',
      'chosen2': '',
      'other': ''
    };
    fs.writeFileSync(confName, JSON.stringify(conf));
  }
  return JSON.parse(fs.readFileSync(confName, 'UTF8'))
}

async function updateConf(toupdate: any) {
  fs.writeFile(confName, JSON.stringify(toupdate), err => {
    if (err) {
      console.error(err)
      return
    }
  });

}


// startMain(true)
