"use strict";
const { amqpInit, producer, BUYBULK_QUEUE_NAME } = require('../common/rabbitmq');

(async function () {
    await amqpInit();
    const channel = await producer(BUYBULK_QUEUE_NAME);
    const testData = Buffer.from('test data');
    setInterval(
        channel.sendToQueue.bind(channel, BUYBULK_QUEUE_NAME, testData),
        1000
    );
}());
