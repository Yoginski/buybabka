const { Schema } = require('mongoose');

const BuybulkItemSchema = new Schema({
  title: { type: String, required: true },
  upc: { type: String, required: true },
  itemId: { type: Number, required: true },
  caseId: { type: Number, required: true },
  url: { type: String, required: true },

  price: { type: Number, required: true },
  units: { type: Number, required: true },
  quantityAvailable: { type: Number, required: true },

  pricePerUnit: { type: Number, required: true },
  regularPrice: { type: Number, required: false },
  savings: { type: Number, required: true },

  averageRating: { type: Number, required: false },
  ratingCount: { type: Number, required: false },

  pictureUrl: { type: String, required: true },
  restrictedShipping: [ String ],
});

module.exports = BuybulkItemSchema;