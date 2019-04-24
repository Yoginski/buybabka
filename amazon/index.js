"use strict";
const puppeteer = require('puppeteer');
const sleep = require('util').promisify(setTimeout);
const { amqpConnect, createPublisher, createConsumer } = require('./rabbitmq');


const EXCHANGE = 'items';
const SOURCE = 'amazon';
const SCREENSHOT_DIR = 'debug_screenshots';
const JOB_QUERY_INTERVAL = 1000; // RabbitMQ querying interval (ms)
const JOB_PROCESSING_INTERVAL = 2000; // Pause between parsing jobs (ms)
const CAPTCHA_RETRY_INTERVAL = 60000;


const setDeliveryCounry = async page => {
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
    await page.goto(`https://www.amazon.com/s?k=${upc}`);
    return page.evaluate(() => {
        try {
            const isNoResults = document
                .querySelector('#search').innerText
                .includes('No results for');
            if (isNoResults) {
                return {
                    success: true,
                    data: null,
                }
            }
            const item = document.querySelector('.s-result-list.sg-row > div')
            if (!item) {
                return {
                    success: false,
                    hint: 'noitemfound',
                    message: "couldn't find search result element",
                }
            }
            const asin = item.getAttribute('data-asin').trim();
            const priceStr = item.querySelector('.a-price > .a-offscreen').innerText.trim();
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
            return {
                success: true,
                data: {
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
}


(async function () {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await setDeliveryCounryWithRetries(page);

    const conn = await amqpConnect();
    const { chan, getter } = await createConsumer(conn, SOURCE);
    const { publisher } = await createPublisher(conn, EXCHANGE);

    while (true) {
        const msg = await getter()
        if (!msg) {
            await sleep(JOB_QUERY_INTERVAL);
            continue;
        }
        const content = JSON.parse(msg.content);
        if (content.source !== SOURCE) {
            const result = await parseUpc(page, content.upc);
            console.log(result);
            if (result.success) {
                if (result.data) {
                    const item = {
                        ...result.data,
                        source: SOURCE,
                        upc: content.upc,
                    }
                    await publisher(Buffer.from(JSON.stringify(item)));
                }
                await chan.ack(msg);
            } else {
                await page.screenshot({path: `${SCREENSHOT_DIR}/${content.upc}-${result.hint}.png`});
                console.log(`UPC #${content.upc} parsing error (${result.hint}): ${result.message}`);
                await chan.reject(msg);
            }
            await sleep(JOB_PROCESSING_INTERVAL);
        }
    };
}());
