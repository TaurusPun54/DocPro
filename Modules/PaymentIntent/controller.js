/* eslint-disable no-undef */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

const validator = require('../../lib/Validator/validator');

// database
const User = require('../User/schema');
const UserDoc = require('../UserDocs/schema');
const DocumentType = require('../DocumentTypes/schema');
const PaymentIntent = require('../PaymentIntent/schema');

const httpStatusCodes = require('../../lib/Error/HttpErrors/httpstatuscodes');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

const createPaymentIntent = async (req) => {
  const { id, email, stripeCustomerId } = req.user;
  const { docId } = req.params;
  if (!docId) return new ClientError.NotFoundError('Not such user doc');

  const userdocData = await UserDoc.findById(docId);
  if (!userdocData) return new ClientError.NotFoundError('Not such user doc');

  if (userdocData.UserId.toString() !== id) return new ClientError.ForbiddenError('no access right');

  const errorArray = await validator.answerValidator(userdocData);
  if (errorArray.length !== 0) return new ClientError.BadRequestError(`Answers of no. ${errorArray.join(', ')} are invalid`);

  const documentType = await DocumentType.findOne({ _id: userdocData.DocType.toString(), active: true });
  // console.log(documentType)
  if (!documentType) return new ClientError.BadRequestError('This document are not valid');

  await UserDoc.findByIdAndUpdate(docId, { $set: { completedAt: Date.now() } })

  let customer = {};
  if (stripeCustomerId === '' || !stripeCustomerId) {
    customer = await stripe.customers.create({
      email: email,
    });
    // console.log(customer.id);
    await User.findByIdAndUpdate(id, { stripeCustomerId: customer.id });
    // const user = User.findById(id).select('+stripeCustomerId');
    // return user;
  }
  // return { message: `user with customerId: ${stripeCustomerId} started a payment intent` };
  const customerId = customer.id ?? stripeCustomerId;
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customerId},
    {apiVersion: '2024-06-20'}
  );
  const paymentIntent = await stripe.paymentIntents.create({
    // payment_method_types: ['card', 'apple_pay'],
    amount: parseInt(documentType.price.toString(), 10) * 100,
    currency: documentType.currency,
    customer: customerId,
    // eslint-disable-next-line camelcase
    automatic_payment_methods: {
      enabled: true,
    },
    description: `Purchase product: ${userdocData.docName}`,
    metadata: {
      userDocId: docId
    },
  });

  if (!paymentIntent || !ephemeralKey || !customerId) return new ServerError.InternalServerError('Cannot start a payment intent');

  const newPaymentIntent = new PaymentIntent({
    stripePaymentIntentId: paymentIntent.id,
    stripePaymentIntentClientSecret: paymentIntent.client_secret,
    stripeCustomerId: customerId,
    stripeCustomerEphemeralKey: ephemeralKey.secret,
    userDocId: docId,
    amount: parseInt(documentType.price.toString(), 10),
    currency: documentType.currency,
    status: paymentIntent.status
  });
  
  await newPaymentIntent.save();

  return {
    data: {
      paymentIntentClientSecret: paymentIntent.client_secret,
      customerEphemeralKeySecret: ephemeralKey.secret,
      customerId
    }
  }
};

const getPaymentIntent = async (req) => {
  const { id, stripeCustomerId } = req.user;
  const { paymentIntentId } = req.query;
  const regex = /^pi_[\w\d]{24}$/;
  if (!paymentIntentId || !regex.test(paymentIntentId)) return new ClientError.BadRequestError('Not a valid payment intent id');
  const record = await PaymentIntent.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!record) return new ClientError.NotFoundError('No such payment intent record');
  if (record.stripeCustomerId !== stripeCustomerId) return new ClientError.ForbiddenError('No access right');
  // if (record.status === 'requires_payment_method') return { message: 'Order still processing' }; statusCode: httpStatusCodes.Accepted,
  // if (record.status === 'succeeded') return {  }
  return { data: record };
}

module.exports = {
  createPaymentIntent,
  getPaymentIntent
};
