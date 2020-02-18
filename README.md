# tsc-log-fresh

## pre install
* instal node and npm
* install typescript from the project directory:
** npm i typescript -g
** npm i  typescript  ts-node nodemon @types/node

## install dependencies & build
* npm install
* npm run build

## run demo
* npm run demo
** The demp create/run two dockers that echo time twice per sec.
*** chosen
*** chosen2
** then it track them and (an addionaly it tries to pull non exisent container
*** other

## npm run 
* show all options

## run the tracker service
* npm run track
* npm run track -- -v    # verbose 
* the tracker pull the logs with timestamp and store them in the storage using one hour chunks
* the tracker tracks what was pulled and continues since last retrieved chunk.
* The tracked containers are specified in a conf file: tracklog.conf
* The file stores the last "hour" retrieved which enables incremental pull

## pull the logs, similar to docker logs
* npm logs chosen 
** pull all logs of container chosen
** optional: --since DATE --until Date, which provide a range which include that time.

## Examples for pulling logs on container
* npm run tracker -- logs chosen2  --since "2020-02-17T19:15:33" --until "2020-02-17T19:15:33" --verbose
* npm run tracker -- logs chosen --since 2020-02-18T00:00:00
* npm logs chosen


## Demo
* npm run demo
* starts two containers "chosen" "chosen2"
* track them and additional non existent container "other"
* the containers writes two log lines per sec.
* 