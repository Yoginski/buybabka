"use strict";
const { amqpInit, createPublisher } = require('../common/rabbitmq');
const { Buffer } = require('buffer');
const parser = require('./parser');


const SOURCE = 'buybulk';

(async function () {
    await amqpInit();
    const { publisher } = await createPublisher();
    parser(item => {
        item.source = SOURCE;
        publisher(Buffer.from(JSON.stringify(item)));
    });
}());
