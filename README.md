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

## run the tracker 
* npm run track
* npm run track -- -v    # verbose 
* the tracker pull the logs with timestamp and store them in the storage using one hour chunks
* the tracker tracks what was pulled and continues since last retrieved chunk.

## pull the logs, similar to docker logs
* npm logs chosen 
** pull all logs of container chosen
** Not yet supported : npm logs chosen --since DATE