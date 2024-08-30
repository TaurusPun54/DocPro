/* eslint-disable no-undef */
/* eslint-disable max-len */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('../User/schema');
const UserDocument = require('../UserDocument/schema');
const Document = require('../Document/schema');
const PaymentIntent = require('../PaymentIntent/schema');
const { BadRequestError, ForbiddenError, NotFoundError, InternalServerError } = require('../../lib/Error/HttpErrors/index');

const createPaymentIntent = async (req) => {
  const { id, email, stripeCustomerId } = req.user;
  const { userDocumentId } = req.params;

  if (!userDocumentId) return new NotFoundError('Not such user document');

  const userDocumentData = await UserDocument.findById(userDocumentId);

  if (!userDocumentData) return new NotFoundError('Not such user document');
  if (userDocumentData.UserId.toString() !== id) return new ForbiddenError('No access right');
  if (userDocumentData.paidAt !== null) return new ForbiddenError('Cannot purchase a paid document');
  if (userDocumentData.completedAt === null) return new ForbiddenError('This document is not completed, purchase not allowed');

  const document = await Document.findOne({ _id: userDocumentData.DocumentId.toString(), active: true });
  // console.log(document)
  if (!document) return new BadRequestError('This user document are not valid');

  let customer = {};
  if (stripeCustomerId === '' || !stripeCustomerId) {
    customer = await stripe.customers.create({
      email: email,
    });
    await User.findByIdAndUpdate(id, { stripeCustomerId: customer.id });
  }
  // return { message: `user with customerId: ${stripeCustomerId} started a payment intent` };
  const customerId = customer.id ?? stripeCustomerId;

  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customerId},
    {apiVersion: process.env.STRIPE_EPHEMERALKEY_API_VERSION || '2024-06-20'}
  );

  const paymentIntent = await stripe.paymentIntents.create({
    // payment_method_types: ['card', 'apple_pay'],
    amount: parseFloat(document.price.toString()) * 100,
    currency: document.currency,
    customer: customerId,
    // eslint-disable-next-line camelcase
    automatic_payment_methods: {
      enabled: true,
    },
  });

  if (!paymentIntent || !ephemeralKey || !customerId) return new InternalServerError(`Fail to start a new payment intent`);

  const newPaymentIntent = new PaymentIntent({
    stripePaymentIntentId: paymentIntent.id,
    // stripePaymentIntentClientSecret: paymentIntent.client_secret,
    stripeCustomerId: customerId,
    stripeCustomerEphemeralKey: ephemeralKey.secret,
    userDocumentId: userDocumentId,
    amount: parseFloat(document.price.toString()),
    currency: document.currency,
    status: paymentIntent.status
  });
  
  await newPaymentIntent.save();

  return {
    paymentIntentClientSecret: paymentIntent.client_secret,
    customerEphemeralKeySecret: ephemeralKey.secret,
    customerId
  }
};

const getPaymentIntent = async (req) => {
  const { stripeCustomerId } = req.user;
  const { stripePaymentIntentId } = req.query;
  const regex = /^pi_[\w\d]{24}$/;
  if (!stripePaymentIntentId || !regex.test(stripePaymentIntentId)) return new NotFoundError('No such payment intent record');
  const record = await PaymentIntent.findOne({ stripePaymentIntentId }).select('-stripeCustomerEphemeralKey');
  if (!record) return new NotFoundError('No such payment intent record');
  if (record.stripeCustomerId !== stripeCustomerId) return new ForbiddenError('No access right');
  return { ...record._doc, amount: parseFloat(record.amount.toString()) };
}

module.exports = {
  createPaymentIntent,
  getPaymentIntent
};
