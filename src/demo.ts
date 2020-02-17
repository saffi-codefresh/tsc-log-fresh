import { spawn, exec } from 'child_process';
import { startMain } from './service';

export function startDemo() {
    exec('docker run --name chosen  -d busybox  sh -c "while true; do date ; sleep .5; done"');
    exec('docker run --name chosen2  -d busybox  sh -c "while true; do date ; echo "two"; sleep .5; done"');
    startMain(true)
}

// startDemo()