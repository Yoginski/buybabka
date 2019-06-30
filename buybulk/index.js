"use strict";
const process = require('process');
const { Buffer } = require('buffer');
const parser = require('./parser');
const { amqpConnect, createPublisher } = require('./rabbitmq');


const EXCHANGE = 'items';
const ROUTING_KEY = 'buybulk.new';
const DEPARTMENT_URL = process.env.DEPARTMENT_URL || 'https://www.buybulkamerica.com/weekly_specials';


(async function () {
    const conn = await amqpConnect();
    const { publisher } = await createPublisher(conn, EXCHANGE, ROUTING_KEY);
    parser(DEPARTMENT_URL, item => {
        publisher(Buffer.from(JSON.stringify(item)));
    });
}());
