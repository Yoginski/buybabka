const amqp = require('amqplib');
const sleep = require('util').promisify(setTimeout);

const RABBITMQ_URL = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : "amqp://rabbitmq";
const EXCHANGE_NAME = 'items';
const EXCHANGE_TYPE = 'fanout';
const CONNECT_RETRIES = 10;
const QUEUES = [
    'buybulk',
    'amazon',
    'zavkhoz',
];

let conn = null;

const assertAMQP = async function (chan) {
    if (!await chan.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE))
        return Promise.reject(`Exchange "${EXCHANGE_NAME}" assertion failed!`);

    await Promise.all(QUEUES.map(q => chan.assertQueue(q)));
    await Promise.all(QUEUES.map(q => chan.bindQueue(q, EXCHANGE_NAME, q)));
}

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
    return Promise.reject("RabbitMQ connection retry limit exceeded");
}

const createPublisher = async function () {
    const chan = await conn.createChannel();
    await assertAMQP(chan);
    return {
        chan,
        publisher: chan.publish.bind(chan, EXCHANGE_NAME, ''),
    };
};

const createConsumer = async function (queue) {
    const chan = await conn.createChannel();
    await assertAMQP(chan);
    return {
        chan,
        getter: chan.get.bind(chan, queue),
        consumer: chan.consume.bind(chan, queue),
    };
};

module.exports = {
    amqpInit,
    createPublisher,
    createConsumer,
};
