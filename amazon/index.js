"use strict";
const { amqpInit, consumer, BUYBULK_QUEUE_NAME } = require('../common/rabbitmq');

(async function () {
    await amqpInit();
    const channel = await consumer(BUYBULK_QUEUE_NAME);
    channel.consume(BUYBULK_QUEUE_NAME, (msg) => {
        console.log(msg);
    })
}());
