const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : "amqp://rabbitmq";

const producer = function (queueName) {
    const conn = await amqp.connect(RABBITMQ_URL);
    const buybulkChannel = conn.createChannel();
    const ok = await buybulkChannel.assertQueue(queueName);
    if (!ok) {
        return Promise.reject('Queue assertion failed!');
    }
    return buybulkChannel;
};

const consumer = function (queueName) {
    const conn = await amqp.connect('amqp://rabbitmq');
    const buybulkChannel = conn.createChannel();
    const ok = await buybulkChannel.assertQueue(queueName);
    if (!ok) {
        return Promise.reject('Queue assertion failed!');
    }
    return buybulkChannel;
};

module.exports = {
    producer,
    consumer,
    
    BUYBULK_QUEUE_NAME = 'buybulk',
    AMAZON_QUEUE_NAME = 'amazon',
}