FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm --quiet set progress=true
RUN npm install --only=prod --no-optional \
 && echo "Installed NPM packages:" \
 && npm list \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

COPY . ./

CMD [ "npm", "start" ]
