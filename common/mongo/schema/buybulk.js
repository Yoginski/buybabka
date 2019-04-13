const { Schema } = require('mongoose');

const BuybulkItemSchema = new Schema({
  title: String,
  itemId: Number,
  caseId: Number,
  url: String,

  price: Number,
  units: Number,
  quantityAvailable: Number,

  pricePerUnit: Number,
  regularPrice: Number,
  savings: Number,

  averageRating: Number,
  ratingCount: Number,

  pictureUrl: String,
  restrictedShipping: [ String ],
});

module.exports = BuybulkItemSchema;