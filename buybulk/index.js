"use strict";
const { producer, BUYBULK_QUEUE_NAME } = require('../common/rabbitmq');

(async function () {
    const channel = await producer(BUYBULK_QUEUE_NAME);
    const testData = Buffer.from('test data');
    setInterval(
        channel.sendToQueue.bind(channel, BUYBULK_QUEUE_NAME, testData),
        1000
    );
}());
