"use strict";
const Apify = require('apify');

function getWeeklySpecialsPageUrl(page) {
    return `https://www.buybulkamerica.com/weekly_specials?page=${page}`;
}

module.exports = async function (callback) {
    Apify.main(async () => {
        const requestList = await Apify.openRequestList('categories', [
            getWeeklySpecialsPageUrl(1),
        ]);
        const requestQueue = await Apify.openRequestQueue();

        let weeklySpecialsPageCountAdded = false;

        const crawler = new Apify.CheerioCrawler({
            //        maxRequestsPerCrawl: 10,
            minConcurrency: 20,
            maxConcurrency: 30,
            requestList,
            requestQueue,
            handlePageFunction: async ({ $ }) => {
                const script = $('div#items-page script').get(0).children[0].data;
                const untrimmedData = script.split("\n", 2)[1];
                const data = JSON.parse(
                    untrimmedData.substring(untrimmedData.indexOf('['), untrimmedData.length - 1)
                );
                data.forEach((d) => {
                    callback(d);
                });

                const paginationLinks = $('div.pagination > a');
                const lastPageLink = paginationLinks.get(paginationLinks.length - 2);
                if (!weeklySpecialsPageCountAdded) {
                    const weeklySpecialsPageCount = parseInt($(lastPageLink).text());
                    weeklySpecialsPageCountAdded = true;
                    for (let i = 2; i <= weeklySpecialsPageCount; i++) {
                        const url = getWeeklySpecialsPageUrl(i);
                        await requestQueue.addRequest({ url });
                    }
                }
            },
        });

        await crawler.run();
    });
}
