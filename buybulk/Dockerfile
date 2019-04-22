FROM apify/actor-node-basic

WORKDIR /usr/src/app/buybulk

COPY entrypoint.sh ./
RUN npm --quiet set progress=true

CMD [ "/bin/sh", "entrypoint.sh" ]
