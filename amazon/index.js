"use strict";
const { producer, BUYBULK_QUEUE_NAME } = require('../common/rabbitmq');

(async function () {
    const channel = await consumer(BUYBULK_QUEUE_NAME);
    const testData = Buffer.from('test data');
}());
