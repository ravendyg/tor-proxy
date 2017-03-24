FROM node:6-onbuild
EXPOSE 3014

ARG AUTH_TOKEN
ENV AUTH_TOKEN=$AUTH_TOKEN

RUN apt-get update && apt-get install tor -y
RUN npm i pm2@2.4.1