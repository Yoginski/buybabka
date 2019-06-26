const Telegraf = require('telegraf');
const { amqpConnect, createConsumer } = require('./rabbitmq');


const CMD_EXCHANGE_NAME = 'commands';
const ITEM_QUEUE_NAME = 'telegram_compared';

 
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
            let discountPercent = 0;
            if (data.price > 0) {
                discountPercent = (data.price - data.discountPrice) / data.price * 100;
            }
            discountPercent = discountPercent.toFixed(2);
            console.log(`Discount for item with UPC ${data.upc}: ${discountPercent}`);
            if (discountPercent > 15) {
                const text = `\`\`\`
${data.title}

UPC: ${data.upc}

Real discount: ${discountPercent}%
Amazon  price: $${data.price}
Buybulk price: $${data.discountPrice}
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
            } else {
                console.log(`Discount is too low for UPC ${data.upc}: ${discountPercent}`);
            }
        } catch (e) {
            console.log(`Failed to process item with UPC ${data.upc}: ${e}`);
            throw e;
        }
        
        chan.ack(msg);
    });
}())
