"use strict";
const Apify = require('apify');


const ITEM_BASEURL = 'https://www.koleimports.com/catalog/product/ajax';
const NO_RESULTS_MESSAGE_SELECTOR = '.dd-product-list .note-msg';

function getItemUrl(itemId) {
    return `${ITEM_BASEURL}?id=${itemId}&is_common=true`;
}

function getDepartmentPageUrl(departmentUrl, page) {
    return `${departmentUrl}?p=${page}`;
}

module.exports = async function (departmentUrl, callback) {
    Apify.main(async () => {
        const requestList = await Apify.openRequestList('categories', [
            new Apify.Request({
                url: getDepartmentPageUrl(departmentUrl, 1),
                userData: { pageType: 'page', pageNum: 1 },
            })
        ]);
        const requestQueue = await Apify.openRequestQueue();

        let weeklySpecialsPageCountAdded = false;

        const crawler = new Apify.CheerioCrawler({
//            maxRequestsPerCrawl: 10,
            minConcurrency: 3,
            maxConcurrency: 5,
            requestList,
            requestQueue,
            handlePageFunction: async ({ $, request }) => {
                if (request.userData.pageType === 'item') {
                    console.log(`Parsing item #${request.userData.itemId}`);
                    await parseItem($, request, callback);
                } else {
                    console.log(`Parsing page #${request.userData.pageNum}`);
                    await parsePage($, departmentUrl, request, requestQueue);
                }
            },
        });

        await crawler.run();
    });
}

async function parsePage($, departmentUrl, request, queue) {
    if ($(NO_RESULTS_MESSAGE_SELECTOR).length > 0) {
        console.log('Last page parsed');
    } else {
        await Promise.all($('a.quickview.product-image.popup-image').map((_, href) => {
            const itemId = $(href).attr('product-id');
            console.log(`Queueing item #${itemId}`);
            return queue.addRequest({
                url: getItemUrl(itemId),
                userData: { itemId, pageType: 'item' },
            });
        }).get());
        const newPageNum = request.userData.pageNum + 1;
        console.log(`Queueing ${getDepartmentPageUrl(departmentUrl, newPageNum)}`);
        await queue.addRequest({
            url: getDepartmentPageUrl(departmentUrl, newPageNum),
            userData: { pageType: 'page', pageNum: newPageNum },
        });
        console.log(`Page #${request.userData.pageNum} processed`);
    }
}

async function parseItem($, request, callback) {
    const getItemValueByName = (name) => {
        const label = $('strong').filter((_, elem) => $(elem).text().toLowerCase().includes('upc code'));
        if (label.length == 0) {
            throw `Invalid item block (${name}):\n${request.url}`;
        }
        return label.parent('.attribute').find('span').text();
    }; 
    const priceElem = $('.new-popup-unit-price')
    let priceStr = priceElem.text().slice(13).trim();
    if (priceStr === "") {
        const parentPriceElem = priceElem.parent().get(0);
        if (parentPriceElem.tagName === 'h2') {
            priceStr = $(parentPriceElem).text().slice(19).trim();
        } else {
            priceStr = $(parentPriceElem).text().slice(13).trim();
        }
    }
    const pricePerUnit = parseFloat(priceStr);
    if (!pricePerUnit) {
        throw `Invalid price per unit: ${pricePerUnit}`;
    }
    const item = {
        pricePerUnit,
        url: request.url,
        upc: getItemValueByName('upc code'),
        discountSite: 'Koleimports',
    }
    callback(item);
}

