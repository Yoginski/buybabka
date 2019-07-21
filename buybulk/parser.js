"use strict";
const Apify = require('apify');

function getWeeklySpecialsPageUrl(departmentUrl, page) {
    return `${departmentUrl}?page=${page}`;
}

module.exports = async function (departmentUrl, callback) {
    Apify.main(async () => {
        const requestList = await Apify.openRequestList('categories', [
            getWeeklySpecialsPageUrl(departmentUrl, 1),
        ]);
        const requestQueue = await Apify.openRequestQueue();

        let weeklySpecialsPageCountAdded = false;

        const crawler = new Apify.CheerioCrawler({
//            maxRequestsPerCrawl: 5,
            minConcurrency: 1,
            maxConcurrency: 5,
            requestList,
            requestQueue,
            handlePageFunction: async ({ $ }) => {
                const script = $('div#items-page script').get(0).children[0].data;
                const untrimmedData = script.split("\n", 2)[1];
                const data = JSON.parse(
                    untrimmedData.substring(untrimmedData.indexOf('['), untrimmedData.length - 1)
                );
                data.forEach((d) => {
                    const {
                        savings,
                        price,
                        units,
                        url,
                        displayable_title,
                        regular_price,
                        price_per_unit,
                        average_rating,
                        rating_count,
                        picture_url,
                        quantity_available,
                        item_id,
                        case_id,
                        restricted_shipping,
                    } = d;
                    const item = {
                        savings,
                        price,
                        units,
                        url,
                        discountSite: 'Buybulk',
                        title: displayable_title,
                        upc: url.match(/https?:\/\/\w*\.?buybulkamerica\.com\/(\w+)\/.*/)[1],
                        regularPrice: regular_price,
                        pricePerUnit: price_per_unit,
                        averageRating: average_rating,
                        ratingCount: rating_count,
                        pictureUrl: picture_url,
                        quantityAvailable: quantity_available,
                        itemId: item_id,
                        caseId: case_id,
                        restrictedShipping: [ JSON.stringify(restricted_shipping) ],
                    };
                    callback(item);
                });

                const paginationLinks = $('div.pagination > a');
                const lastPageLink = paginationLinks.get(paginationLinks.length - 2);
                if (!weeklySpecialsPageCountAdded) {
                    const weeklySpecialsPageCount = parseInt($(lastPageLink).text());
                    weeklySpecialsPageCountAdded = true;
                    for (let i = 2; i <= weeklySpecialsPageCount; i++) {
                        const url = getWeeklySpecialsPageUrl(departmentUrl, i);
                        await requestQueue.addRequest({ url });
                    }
                }
            },
        });

        await crawler.run();
    });
}
