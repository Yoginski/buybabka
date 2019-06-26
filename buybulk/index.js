"use strict";
const { Buffer } = require('buffer');
const parser = require('./parser');
const { amqpConnect, createPublisher } = require('./rabbitmq');


const EXCHANGE = 'items';
const ROUTING_KEY = 'buybulk.new';
const DEPARTMENT_URL = 'https://www.buybulkamerica.com/health-beauty';


(async function () {
    const conn = await amqpConnect();
    const { publisher } = await createPublisher(conn, EXCHANGE, ROUTING_KEY);
    parser(DEPARTMENT_URL, item => {
        publisher(Buffer.from(JSON.stringify(item)));
    });
}());
