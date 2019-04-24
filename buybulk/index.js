"use strict";
const { Buffer } = require('buffer');
const parser = require('./parser');
const { amqpConnect, createPublisher } = require('./rabbitmq');


const EXCHANGE = 'items';
const SOURCE = 'buybulk';


(async function () {
    const conn = await amqpConnect();
    const { publisher } = await createPublisher(conn, EXCHANGE);
    parser(item => {
        item.source = SOURCE;
        publisher(Buffer.from(JSON.stringify(item)));
    });
}());
