/* eslint-disable max-len */
const {
  Schema,
  model,
  Types: { Decimal128 }
} = require('mongoose');

const paymentIntentSchema = new Schema({
  stripePaymentIntentId: { type: String, required: true, unique: true, immutable: true},
  stripePaymentIntentClientSecret: { type: String, required: true, unique: true, immutable: true},
  stripeCustomerId: { type: String, required: true, immutable: true},
  stripeCustomerEphemeralKey: { type: String, required: true, immutable: true},
  userDocId: { type: String, required: true, immutable: true},
  amount: { type: Decimal128, required: true, immutable: true },
  currency: { type: String, required: true, immutable: true },
  status: { type: String }
});

module.exports = model('PaymentIntent', paymentIntentSchema);
