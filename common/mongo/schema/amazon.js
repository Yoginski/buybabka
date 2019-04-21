const { Schema } = require('mongoose');

const AmazonItemSchema = new Schema({
  title: { type: String, required: true },
  asin: { type: String, required: true },
  upc: { type: String, required: true },
  price: { type: Number, required: true },
});

module.exports = AmazonItemSchema;