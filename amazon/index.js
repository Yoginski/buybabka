"use strict";
const { amqpInit, createConsumer } = require('../common/rabbitmq');

const SOURCE = 'amazon';

(async function () {
    await amqpInit();
    const { chan, consumer } = await createConsumer(SOURCE);
    consumer((msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content);
            if (content.source !== SOURCE) {
                console.log(content);
            }
            chan.ack(msg);
        } else {
            console.log('Null message received');
        }
    })
}());
