const {
  Schema,
  model,
  Types: { Decimal128 }
} = require('mongoose');

const opts = { toJSON: { virtuals: true } };

const documentSchema = new Schema({
  categoy: { type: String, required: true, immutable: true },
  title: {type: String, required: true, immutable: true },
  description: { type: String },
  price: { type: Decimal128,  required: true },
  currency: { type: String, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true }, opts
);

documentSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'DocumentId',
  //options: { select: '-DocumentId' }
})

module.exports = model('Document', documentSchema);
