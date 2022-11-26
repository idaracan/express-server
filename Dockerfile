FROM node:18-buster

WORKDIR /usr/app
COPY ./ /usr/app

RUN npm install @mapbox/node-pre-gyp -g
COPY ./ .
RUN npm i
RUN npm rebuild
RUN npm run seed

CMD npm run serve