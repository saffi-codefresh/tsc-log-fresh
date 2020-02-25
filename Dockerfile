FROM node:10.13.0-alpine
RUN mkdir -p /logfresh
COPY . /logfresh
WORKDIR /logfresh
RUN pwd
RUN ls -altr
RUN npm run installBuild 
CMD npm run start