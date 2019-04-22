FROM node:10

WORKDIR /usr/src/app/zavkhoz

COPY entrypoint.sh ./
RUN npm --quiet set progress=true

CMD [ "/bin/sh", "entrypoint.sh" ]