"use strict";
const { dbInit, AmazonItem, BuybulkItem } = require('./mongo');
const { amqpConnect, createConsumer } = require('./rabbitmq');


const QUEUE_NAME = 'zavkhoz';
const SOURCES_TO_MODELS = {
    'amazon.compared': AmazonItem,
    'buybulk.new': BuybulkItem,
};


(async function() {
    await dbInit();
    const conn = await amqpConnect();
    const { chan, consumer } = await createConsumer(conn, QUEUE_NAME);
    consumer((msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content);
            const model = SOURCES_TO_MODELS[msg.fields.routingKey]
            if (model) {
                new model(content)
                    .save()
                    .then(record => {
                        console.log(`Saved ${record.title}`);
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