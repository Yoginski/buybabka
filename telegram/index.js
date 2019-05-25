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
        const text = `\`\`\`
${data.title}

UPC: ${data.upc}

Amazon  price: ${data.price}
Buybulk price: ${data.discountPrice}
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
        
        chan.ack(msg);
    });
}())
