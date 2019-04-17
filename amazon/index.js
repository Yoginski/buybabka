"use strict";
const { amqpInit, createConsumer } = require('../common/rabbitmq');

const SOURCE = 'amazon';

(async function () {
    await amqpInit();
    const { chan, consumer } = await createConsumer(SOURCE);
    consumer((msg) => {
        const content = JSON.parse(msg.content);
        if (msg !== null && content.source !== SOURCE) {
            console.log(content);
            chan.ack(msg);
        }
        if (msg !== null) {
            const content = JSON.parse(msg.content);
            if (content.source !== SOURCE) {
                console.log(content);
            }
        } else {
            console.log('Null message received');
        }
    })
}());
