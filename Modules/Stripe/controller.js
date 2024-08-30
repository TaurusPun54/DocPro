/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-undef */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

const UserDocument = require('../UserDocument/schema');
const PaymentIntent = require('../PaymentIntent/schema');
const UserCharge = require('../UserCharge/schema');

const { BadRequestError, ForbiddenError, InternalServerError } = require('../../lib/Error/HttpErrors/index');

const listenWebHook = async (req) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return new ForbiddenError('No valid stripe signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    if (!event) return new BadRequestError('No stripe event found');

    const chargeEvents = ['charge.succeeded', 'charge.expired', 'charge.failed'];
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
      if (event.type === 'charge.succeeded') {
        await UserDocument.findByIdAndUpdate(paymentIntentRecord.userDocumentId, { $set: { paidAt: Date.now() } });
      }
      return;
    }
    if (paymentIntentEvents.includes(event.type)) {
      console.log(`Event : ${event.type} is triggered`);
      const paymentIntentEvent = event.data.object;
      await PaymentIntent.findOneAndUpdate({ stripePaymentIntentId: paymentIntentEvent.id }, { $set: { status: paymentIntentEvent.status } });
      return;
    }
    console.log(`Event : ${event.type} is triggered`);
  } catch (e) {
    return new InternalServerError(`WebHook Error: ${e.message}`);
  }
}

module.exports = {
  listenWebHook
};
