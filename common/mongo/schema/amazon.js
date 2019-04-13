const { Schema } = require('mongoose');

const AmazonItemSchema = new Schema({
  title: String,
});

module.exports = AmazonItemSchema;