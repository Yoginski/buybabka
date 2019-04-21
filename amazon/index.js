"use strict";
const { amqpInit, createPublisher, createConsumer } = require('../common/rabbitmq');
const puppeteer = require('puppeteer');
const sleep = require('util').promisify(setTimeout);

(async () => {
})();


const SOURCE = 'amazon';


const setDeliveryCounry = async (page) => {
    await page.goto(`https://www.amazon.com/`);
    await page.waitFor('#nav-global-location-slot');
    await page.click('#nav-global-location-slot');
    await page.waitFor('#GLUXZipUpdateInput');
    await page.type('#GLUXZipUpdateInput', '90001');
    await page.click('#GLUXZipUpdate-announce')
}


const parseUpc = async (page, upc) => {
    await page.goto(`https://www.amazon.com/s?k=${upc}`);
    return page.evaluate(() => {
        try {
            const item = document.querySelector('.s-result-list.sg-row > div')
            if (!item) {
                return null
            }
            const asin = item.getAttribute('data-asin');
            const price = item.querySelector('.a-price > .a-offscreen').innerText.trim();
            const title = item.querySelector('.a-text-normal').innerText.trim();
            return {
                asin,
                price,
                title,
            };
        } catch (error) {
            return null
        }
    });
}


(async function () {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

    const page = await browser.newPage();
    await setDeliveryCounry(page);

    await amqpInit();
    const { chan, getter } = await createConsumer(SOURCE);
    const { publisher } = await createPublisher();
    while (true) {
        const msg = await getter()
        if (!msg) {
            sleep(1000);
            continue;
        }
        const content = JSON.parse(msg.content);
        if (content.source !== SOURCE) {
            const result = await parseUpc(page, content.upc);
            console.log(result);
            if (result) {
                result.source = SOURCE;
                publisher(Buffer.from(JSON.stringify(result)));
            }
        }
        chan.ack(msg);
    };
}());
