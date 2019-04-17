"use strict";
const { amqpInit, createConsumer, BUYBULK_QUEUE_NAME } = require('../common/rabbitmq');

(async function () {
    await amqpInit();
    const { chan, consumer } = await createConsumer(BUYBULK_QUEUE_NAME);
    consumer((msg) => {
        if (msg !== null) {
            console.log(msg.content.toString());
            chan.ack(msg);
        }
    })
}());
