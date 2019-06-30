"use strict";
const puppeteer = require('puppeteer');
const sleep = require('util').promisify(setTimeout);
const { amqpConnect, createPublisher, createConsumer } = require('./rabbitmq');
const evasions = require('./evasions');


const EXCHANGE = 'items';
const QUEUE_NAME = 'amazon_comparer';
const ROUTING_KEY = 'amazon.compared';
const SCREENSHOT_DIR = 'debug_screenshots';
const JOB_QUERY_INTERVAL = 1000; // RabbitMQ querying interval (ms)
const JOB_PROCESSING_INTERVAL = 2000; // Pause between parsing jobs (ms)
const CAPTCHA_RETRY_INTERVAL = 120000;


const setDeliveryCounry = async page => {
    await sleep(1000);
    await page.goto(`https://www.amazon.com/`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/setDeliveryCountry-1.png` });
    await page.waitFor('#nav-global-location-slot', {visible: true});
    await page.click('#nav-global-location-slot');
    await page.waitFor('#GLUXZipUpdateInput', {visible: true});
    await page.type('#GLUXZipUpdateInput', '90001'); // Los Angeles
    await page.screenshot({ path: `${SCREENSHOT_DIR}/setDeliveryCountry-2.png` });
    await page.click('#GLUXZipUpdate-announce')
};


const setDeliveryCounryWithRetries = async page => {
    while (true) {
        try {
            await setDeliveryCounry(page);
            return;
        } catch (e) {
            console.log(e);
            await page.screenshot({path: `${SCREENSHOT_DIR}/setDeliveryCountry-error.png`});
            await sleep(CAPTCHA_RETRY_INTERVAL);
        }
    }
};


const parseUpc = async (page, upc) => {
    const url = `https://www.amazon.com/s?k=${upc}&s=price-asc-rank`;
    await page.goto(url);
    const result = page.evaluate(() => {
        try {
            const isNoResults = document
                .querySelector('#search').innerText
                .includes('No results for');
            if (isNoResults) {
                return {
                    success: true,
                    hint: 'nosuchitem',
                    data: null,
                }
            }
            const item = document.querySelector('.s-result-list.sg-row > div')
            if (!item) {
                return {
                    success: false,
                    hint: 'invalidsearchresult',
                    message: "couldn't find search result element",
                }
            }
            const asin = item.getAttribute('data-asin').trim();
            const priceTag = item.querySelector('.a-price > .a-offscreen')
                || item.querySelector('.a-spacing-top-mini .a-color-base');
            if (priceTag === null) {
                // TODO: check if it's really a free item
                return {
                    success: true,
                    hint: 'freeitem',
                    data: null,
                }
            }
            const priceStr = priceTag.innerText.trim()
            const relativeUrl = item.querySelector('.a-link-normal').getAttribute('href');
            const url = "https://www.amazon.com" + relativeUrl;
            let price = 0;
            if (priceStr.startsWith('$')) {
                price = parseFloat(priceStr.slice(1));
            } else {
                return {
                    success: false,
                    hint: 'invalidprice',
                    message: `invalid price: ${priceStr}`,
                }
            }

            const title = item.querySelector('.a-text-normal').innerText.trim();
            const ratingItem = item.querySelector('.a-spacing-top-micro .a-size-small');
            let rating = 0;
            let rates = 0;
            if (ratingItem) {
                const ratingValueItem = ratingItem.querySelector('span .a-icon-alt');
                if (ratingValueItem) {
                    const ratingValueMatch = ratingValueItem.innerText.match(/([\d\.]+) out of ([\d\.]+) stars/);
                    if (ratingValueMatch && ratingValueMatch.length === 3) {
                        rating = parseFloat(ratingValueMatch[1]).toFixed(1);
                    }
                }
                const ratingCountItem = ratingItem.querySelector('span .a-size-base');
                if (ratingCountItem) {
                    if (ratingCountItem.innerText.match(/\d+/)) {
                        rates = parseInt(ratingCountItem.innerText);
                    }
                }
            }
            return {
                success: true,
                hint: 'itemfound',
                data: {
                    rating,
                    rates,
                    url,
                    asin,
                    price,
                    title,
                },
            };
        } catch (err) {
            return {
                success: false,
                hint: 'error',
                message: err.toString(),
            }
        }
    });

//    if (result.data) result.data.url = url;
    return result;
}


(async function () {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

    const page = await browser.newPage();
    await evasions(page);
    await page.setViewport({ width: 1920, height: 1080 });
    await setDeliveryCounryWithRetries(page);

    const conn = await amqpConnect();
    const { chan, getter } = await createConsumer(conn, QUEUE_NAME);
    const { publisher } = await createPublisher(conn, EXCHANGE, ROUTING_KEY);

    while (true) {
        const msg = await getter()
        if (!msg) {
            await sleep(JOB_QUERY_INTERVAL);
            continue;
        }
        const content = JSON.parse(msg.content);
        const result = await parseUpc(page, content.upc);
        console.log(result);
        if (result.success) {
            if (result.data) {
                const item = {
                    ...result.data,
                    upc: content.upc,
                    discountPrice: content.pricePerUnit,
                    discountUrl: content.url,
                }
                console.log(item);
                await publisher(Buffer.from(JSON.stringify(item)));
            }
            await page.screenshot({path: `${SCREENSHOT_DIR}/${content.upc}-${result.hint}.png`});
            await chan.ack(msg);
        } else {
            await page.screenshot({path: `${SCREENSHOT_DIR}/${content.upc}-${result.hint}.png`});
            console.log(`UPC #${content.upc} parsing error (${result.hint}): ${result.message}`);
            await chan.reject(msg);
            console.log('Most likely a captcha (see screenshots)');
            await sleep(CAPTCHA_RETRY_INTERVAL);
        }
        await sleep(JOB_PROCESSING_INTERVAL);
    };
}());
