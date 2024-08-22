/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-undef */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

// const User = require('../User/schema');
const UserDoc = require('../UserDocs/schema');
const PaymentIntent = require('../PaymentIntent/schema');
const UserCharge = require('../UserCharge/schema');

const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

const listenWebHook = async (req) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return new ClientError.ForbiddenError('No valid stripe signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    if (!event) return new ClientError.BadRequestError('No stripe event found');
  } catch (e) {
    return new ServerError.InternalServerError(`WebHook Error: ${e.message}`);
  }

  const chargeEvents = ['charge.succeeded', 'charge.expired', 'charge.failed', 'charge.pending'];
  const paymentIntentEvents = ['payment_intent.succeeded', 'payment_intent.canceled', 'payment_intent.payment_failed'];

  if (chargeEvents.includes(event.type)) {
    console.log(`Event : ${event.type} is triggered`);
    const chargeEvent = event.data.object;
    // const chargeObject = await stripe.charges.retrieve(chargeSucceededSession.id);
    const newCharge = new UserCharge({
      stripeChargeId: chargeEvent.id,
      stripeCustomerId: chargeEvent.customer,
      stripeCustomerPaymentMethod: chargeEvent.payment_method,
      status: chargeEvent.status
    });
    await newCharge.save();
    const paymentIntentRecord = await PaymentIntent.findOne({ stripePaymentIntentId: chargeEvent.payment_intent })
    await UserDoc.findByIdAndUpdate(paymentIntentRecord.userDocId, { $set: { paidAt: Date.now() } });
  }else if (paymentIntentEvents.includes(event.type)) {
    console.log(`Event : ${event.type} is triggered`);
    const paymentIntentEvent = event.data.object;
    await PaymentIntent.findOneAndUpdate({ stripePaymentIntentId: paymentIntentEvent.id }, { $set: { status: paymentIntentEvent.status } });
  }else console.log(`Event : ${event.type} is triggered`);
  // switch (event.type) {
  //   case 'charge.succeeded':
  //     console.log(`Event : ${event.type} is triggered`);
  //     const chargeSucceededSession = event.data.object;
  //     // const chargeObject = await stripe.charges.retrieve(chargeSucceededSession.id);
  //     const newCharge = new UserCharge({
  //       stripeChargeId: chargeSucceededSession.id,
  //       stripeCustomerId: chargeSucceededSession.customer,
  //       stripeCustomerPaymentMethod: chargeSucceededSession.payment_method,
  //       status: chargeSucceededSession.status
  //     });
  //     await newCharge.save();
  //     const paymentIntentRecord = await PaymentIntent.findOne({ stripePaymentIntentId: chargeSucceededSession.payment_intent })
  //     await UserDoc.findByIdAndUpdate(paymentIntentRecord.userDocId, { $set: { paidAt: Date.now() } });
  //     break;
  //   case 'payment_intent.succeeded':
  //     console.log(`Event : ${event.type} is triggered`);
  //     const paymentIntentSucceeded = event.data.object;
  //     await PaymentIntent.findOneAndUpdate({ stripePaymentIntentId: paymentIntentSucceeded.id }, { $set: { status: paymentIntentSucceeded.status } });
  //     break;
  //   default:
  //     console.log(`Event : ${event.type} is triggered`);
  //     break;
  // }
}

module.exports = {
  listenWebHook
};
