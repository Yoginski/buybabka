"use strict";
const { dbInit, AmazonItem, BuybulkItem } = require('../common/mongo');
const { amqpInit, createConsumer } = require('../common/rabbitmq');


const SOURCES_TO_MODELS = {
    amazon: AmazonItem,
    buybulk: BuybulkItem,
};

(async function() {
    await amqpInit();
    await dbInit();
    const { chan, consumer } = await createConsumer('zavkhoz');
    consumer((msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content);
            const model = SOURCES_TO_MODELS[content.source]
            if (model) {
                new model(content)
                    .save()
                    .then(record => {
//                        console.log(`Saved ${record.title}`);
                        chan.ack(msg);
                    })
                    .catch(console.log.bind(console));
            } else {
                console.log(`Unrecognized message source: "${content.source}"`);
            }
        } else {
            console.log('Null message received');
        }
    })
}());