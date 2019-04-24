"use strict";
const { model, connect } = require('mongoose');


const MONGODB_URL = process.env.MONGODB_URL ? process.env.MONGODB_URL : "mongodb://db/buybabka";
const CONNECT_RETRIES = 10;

const dbInit = async function () {
    for (let i = 0; i < CONNECT_RETRIES; i++) {
        try {
            await connect(MONGODB_URL, {useNewUrlParser: true});
            console.log('Connected to Mongodb')
            return
        } catch (e) {
            console.log(e);
            await sleep(3000);
        }
    }
}

module.exports = {
    dbInit,
    BuybulkItem: model('buybulkItem', require('./schema/buybulk')),
    AmazonItem: model('amazonItem', require('./schema/amazon')),
};