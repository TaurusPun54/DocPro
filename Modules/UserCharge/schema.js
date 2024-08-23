/* eslint-disable max-len */
const {
  Schema,
  model,
} = require('mongoose');

const userChargeSchema = Schema({
  stripeChargeId: { type: String, required: true, unique: true, immutable: true },
  stripeCustomerId: { type: String, required: true, immutable: true},
  stripeCustomerPaymentMethod: { type: String, required: true, unique: true, immutable: true},
  status: { type: String }
}, { timestamps: true });

module.exports = model('UserCharge', userChargeSchema);
