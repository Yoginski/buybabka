"use strict";
const process = require('process');
const { Buffer } = require('buffer');
const parser = require('./parser');


const DEPARTMENT_URL = process.env.DEPARTMENT_URL || 'https://www.koleimports.com/limitedtimeoffers';


(async function () {
    parser(DEPARTMENT_URL, item => {
        console.log(item);
    });
}());
