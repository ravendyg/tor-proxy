FROM node:6-onbuild
EXPOSE 3014

RUN apt-get update && apt-get install tor -y