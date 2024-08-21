const {
  Schema,
  model,
  Types: { Decimal128 }
} = require('mongoose');

const opts = { toJSON: { virtuals: true } };

const docTypeSchema = new Schema({
  type: { type: String, required: true, unique: true, immutable: true},
  description: { type: String },
  price: { type: Decimal128,  required: true },
  currency: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true }, opts
);

docTypeSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'DocType',
  options: { select: '-_id -DocType' }
})

module.exports = model('DocumentType', docTypeSchema);
