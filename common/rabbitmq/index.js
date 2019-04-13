const amqp = require('amqplib');
const sleep = require('util').promisify(setTimeout);

const RABBITMQ_URL = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : "amqp://rabbitmq";
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

const producer = async function (queueName) {
    const chan = await conn.createChannel();
    const ok = await chan.assertQueue(queueName);
    if (!ok) {
        return Promise.reject('Queue assertion failed!');
    }
    return chan;
};

const consumer = async function (queueName) {
    const chan = await conn.createChannel();
    const ok = await chan.assertQueue(queueName);
    if (!ok) {
        return Promise.reject('Queue assertion failed!');
    }
    return chan;
};

module.exports = {
    amqpInit,
    producer,
    consumer,

    BUYBULK_QUEUE_NAME: 'buybulk',
    AMAZON_QUEUE_NAME: 'amazon',
}
