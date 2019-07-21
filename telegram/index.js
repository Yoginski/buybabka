"use strict";
const process = require('process');
const Telegraf = require('telegraf');
const { amqpConnect, createConsumer } = require('./rabbitmq');
const { processMessage } = require('./items');
const commands = require('./commands');


const ITEM_QUEUE_NAME = 'telegram_compared';

 
(async function () {
    const bot = new Telegraf(process.env.BOT_TOKEN);
    const conn = await amqpConnect();
    const { chan, consumer } = await createConsumer(conn, ITEM_QUEUE_NAME);
    consumer(processMessage.bind(null, bot, chan));
    commands(bot);
}())
