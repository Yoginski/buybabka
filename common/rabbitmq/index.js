const amqp = require('amqplib');
const sleep = require('util').promisify(setTimeout);

const RABBITMQ_URL = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : "amqp://rabbitmq";
const EXCHANGE_NAME = 'items';
const EXCHANGE_TYPE = 'fanout';
const CONNECT_RETRIES = 10;

let conn = null;

const amqpInit = async function () {
    for (let i = 0; i < CONNECT_RETRIES; i++) {
        try {
            conn = await amqp.connect(RABBITMQ_URL);
            console.log('Connected to RabbitMQ')
            return
        } catch (e) {
            console.log(e);
            await sleep(3000);
        }
    }
}

const createPublisher = async function () {
    const chan = await conn.createChannel();
    if (!await chan.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE))
        return Promise.reject(`Exchange "${EXCHANGE_NAME}" assertion failed!`);
    return {
        chan,
        publisher: chan.publish.bind(chan, EXCHANGE_NAME, ''),
    };
};

const createConsumer = async function (queue) {
    const chan = await conn.createChannel();
    if (!await chan.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE))
        return Promise.reject(`Exchange "${EXCHANGE_NAME}" assertion failed!`);
    if (!await chan.assertQueue(queue))
        return Promise.reject(`Queue ${queue} assertion failed!`);
    if (!await chan.bindQueue(queue, EXCHANGE_NAME, queue))
        return Promise.reject(`Queue ${queue} binding failed!`);
    return {
        chan,
        consumer: chan.consume.bind(chan, queue),
    };
};

module.exports = {
    amqpInit,
    createPublisher,
    createConsumer,
};
