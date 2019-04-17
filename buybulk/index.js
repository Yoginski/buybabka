"use strict";
const { amqpInit, createPublisher } = require('../common/rabbitmq');
const { Buffer } = require('buffer');
const parser = require('./parser');


const SOURCE = 'buybulk';

//parser(async (item) => {
(async function () {
    await amqpInit();
    const { publisher } = await createPublisher();
//    const testData = Buffer.from(JSON.stringify(Date.now()));
    setInterval(
        () => publisher(Buffer.from(JSON.stringify({
            source: SOURCE,
            title: Date.now()
        }))),
        1000
    );
}());
//});
