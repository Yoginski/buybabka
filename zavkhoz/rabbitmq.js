"use strict";
const amqp = require('amqplib');
const process = require('process');
const console = require('console');
const sleep = require('util').promisify(setTimeout);


const RABBITMQ_URL = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : "amqp://rabbitmq";
const CONNECT_RETRIES = 10;


const amqpConnect = async function () {
    for (let i = 0; i < CONNECT_RETRIES; i++) {
        try {
            const conn = await amqp.connect(RABBITMQ_URL);
            console.log('Connected to RabbitMQ')
            return conn;
        } catch (e) {
            console.log(e);
            await sleep(3000);
        }
    }
    return Promise.reject("RabbitMQ connection retry limit exceeded");
}

const createConsumer = async function (conn, queue) {
    const chan = await conn.createChannel();
    return {
        chan,
        getter: chan.get.bind(chan, queue),
        consumer: chan.consume.bind(chan, queue),
    };
};

module.exports = {
    amqpConnect,
    createConsumer,
};
