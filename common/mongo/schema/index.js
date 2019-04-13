const { model } = require('mongoose');

module.exports = {
    BuybulkItem: model('buybulkItem', require('buybulk')),
    AmazonItem: model('amazonItem', require('amazon')),
};