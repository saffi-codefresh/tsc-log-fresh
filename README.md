# tsc-log-fresh

## Pre install
* instal node and npm
* install typescript from the project directory:
** npm i typescript -g
** npm i  typescript  ts-node nodemon @types/node

## Install dependencies & build
* npm install
* npm run build

## Run demo
* npm run demo
** The demp create/run two dockers that echo time twice per sec.
*** chosen
*** chosen2
** then it track them and (an addionaly it tries to pull non exisent container
*** other


## Run the tracker service
* npm run track
* npm run track -- -v    # verbose 
** The tracker pull the logs with timestamp and store them in the storage using one hour chunks
** The tracker tracks what was pulled and continues since last retrieved chunk.
* The tracked containers are specified in a conf file: tracklog.conf
* The file stores the last "hour" retrieved which enables incremental pull

## Pull the logs, similar to docker logs
* npm logs chosen 
** Pull all logs of container named "chosen"
** optional: --since DATE --until Date, which provide a range which include that time.

## Examples for pulling logs on container
* npm logs chosen
* or or a slice larger then a specified range by
** npm run tracker -- logs chosen2  --since "2020-02-17T19:15:33" --until "2020-02-17T19:15:33" --verbose
** npm run tracker -- logs chosen --since 2020-02-18T00:00:00


## Demo
* npm run demo
* The demo starts two containers named "chosen" "chosen2"
* It watch and pull all the logs.
* It fails to connect to a non existent container "other".
* Each containers writes two log lines of current time per sec.
* A subsiquent call to get the logs would show that

## Under the hood
* Each specified container logs are piped into storage (file)
* the storage file is swapped evey about 1 hour of log time - called slice.
* If the process is stopped the retrieval  of the logs continues from the last stored complete slice.
* when we ask for the logs from the storage, It merges the slices into a single pipe retreiving the logs as one.
