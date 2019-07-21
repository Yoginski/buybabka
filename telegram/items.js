"use strict";
const process = require('process');
const Telegraf = require('telegraf');


const ITEM_QUEUE_NAME = 'telegram_compared';

const DISCOUNT_PERCENT_THRESHOLD = process.env.DISCOUNT_PERCENT_THRESHOLD || 20;
const DISCOUNT_AMT_THRESHOLD = process.env.DISCOUNT_PERCENT_THRESHOLD || 2.5;

const RATES_THRESHOLD = process.env.RATES_THRESHOLD || 30;
const RATING_THRESHOLD = process.env.RATING_THRESHOLD || 3;

const RATING_GOOD_EMOJI = '🌕';
const RATING_BAD_EMOJI = '🌑';
const RATING_HALF_EMOJI = '🌗';


const itemMenu = (urls) => Telegraf.Extra
    .markdown()
    .markup(m => m.inlineKeyboard(
        urls.map(({ name, url }) =>
            m.urlButton(name, url)
        )
    ));


async function processMessage(bot, chan, msg) {
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
        } else if (data.rating < RATES_THRESHOLD) {
            console.log(`Need more rates (${RATES_THRESHOLD}) for UPC ${data.upc} (has ${data.rating})`);
        } else if (data.rates < RATING_THRESHOLD) {
            console.log(`Rating is too low (${RATING_THRESHOLD}) for UPC ${data.upc} (has ${data.rates})`);
        } else {
            console.log(`Discount is fine for UPC ${data.upc}`);
            if (data.rating > 5) {
                console.log(`POSSIBLE BUG: rating for UPC ${data.upc} is higher than 5 (${data.rating})`)
                data.rating = 5;
            }
            const emojiRating = toEmojiRating(data.rating);
            const text = `
*${data.discountSite}*

*${data.title}*

\`\`\`
${emojiRating} (${data.rates})

UPC: ${data.upc}

Discount %:      ${discountPercent.toFixed(2)}%
Discount USD:    $${discountAmt.toFixed(2)}

Amazon  price:   $${data.price.toFixed(2)}
${data.discountSite} price:   $${data.discountPrice.toFixed(2)}
\`\`\``;
            const result = await bot.telegram.sendMessage(
                process.env.CHANNEL_ID,
                text,
                itemMenu([
                    { name: 'Amazon', url: data.url || 'http://no.url' },
                    { name: data.discountSite, url: data.discountUrl || 'http://no.url' },
                ])
            );
            console.log(result);
        }
    } catch (e) {
        console.log(`Failed to process item with UPC ${data.upc}: ${e}`);
        throw e;
    }

    await chan.ack(msg);
}


function toEmojiRating(rating) {
    let emojiRating = '';
    const intPart = Math.floor(rating);
    const decPart = rating - intPart;
    emojiRating += RATING_GOOD_EMOJI.repeat(intPart);
    if (decPart > 0) {
        emojiRating += RATING_HALF_EMOJI;
    }
    emojiRating += RATING_BAD_EMOJI.repeat(5 - Math.ceil(rating));
    return emojiRating;
}

module.exports = {
    processMessage
};
