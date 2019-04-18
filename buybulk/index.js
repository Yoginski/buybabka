"use strict";
const { amqpInit, createPublisher } = require('../common/rabbitmq');
const { Buffer } = require('buffer');
//const parser = require('./parser');


const SOURCE = 'buybulk';

(async function () {
    await amqpInit();
    const { publisher } = await createPublisher();
    setInterval(
        () => publisher(Buffer.from(JSON.stringify({
            source: SOURCE,
            title: Date.now()
        }))),
        1000
    );
}());
