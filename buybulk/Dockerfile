FROM apify/actor-node-basic

WORKDIR /usr/src/app/buybulk

COPY buybulk ./
COPY common /usr/src/app/common

RUN npm --quiet set progress=false
RUN npm link ../common
RUN npm install --only=prod --no-optional \
 && echo "Installed NPM packages:" \
 && npm list \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

CMD [ "npm", "start" ]
