"use strict";
const process = require('process');
const Telegraf = require('telegraf');
const { amqpConnect, createConsumer } = require('./rabbitmq');


const CMD_EXCHANGE_NAME = 'commands';
const ITEM_QUEUE_NAME = 'telegram_compared';
const DISCOUNT_PERCENT_THRESHOLD = process.env.DISCOUNT_PERCENT_THRESHOLD || 20;
const DISCOUNT_AMT_THRESHOLD = process.env.DISCOUNT_PERCENT_THRESHOLD || 2.5;

 
const itemMenu = (urls) => Telegraf.Extra
    .markdown()
    .markup(m => m.inlineKeyboard(
        urls.map(({ name, url }) =>
            m.urlButton(name, url)
        )
    ));


(async function () {
    const bot = new Telegraf(process.env.BOT_TOKEN);
    const conn = await amqpConnect();
    const { chan, consumer } = await createConsumer(conn, ITEM_QUEUE_NAME);
    consumer(async (msg) => {
        const data = JSON.parse(msg.content);
        try {
            let discountAmt = data.price - data.discountPrice;

            let discountPercent = 0;
            if (data.price > 0) {
                discountPercent = discountAmt / data.price * 100;
            }

            console.log(`Discount for item with UPC ${data.upc}: $${discountAmt}/${discountPercent}%`);
            if (discountPercent < DISCOUNT_PERCENT_THRESHOLD) {
                console.log(`Discount percent is less than the threshold (${DISCOUNT_PERCENT_THRESHOLD}%) for UPC ${data.upc}`);
            } else if (discountAmt < DISCOUNT_AMT_THRESHOLD) {
                console.log(`Discount amount is less than the threshold ($${DISCOUNT_AMT_THRESHOLD}) for UPC ${data.upc}`);
            } else {
                console.log(`Discount is fine for UPC ${data.upc}`);
                const text = `\`\`\`
${data.title}

UPC: ${data.upc}

Discount %:    ${discountPercent.toFixed(2)}%
Discount USD:  $${discountAmt.toFixed(2)}
Amazon  price: $${data.price.toFixed(2)}
Buybulk price: $${data.discountPrice.toFixed(2)}
\`\`\``;
                const result = await bot.telegram.sendMessage(
                    process.env.CHANNEL_ID,
                    text,
                    itemMenu([
                        { name: 'Amazon', url: data.url || 'http://no.url' },
                        { name: 'Buybulk', url: data.discountUrl || 'http://no.url' },
                    ])
                );
                console.log(result);
            }
        } catch (e) {
            console.log(`Failed to process item with UPC ${data.upc}: ${e}`);
            throw e;
        }
        
        chan.ack(msg);
    });
}())
