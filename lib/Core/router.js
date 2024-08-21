const express = require('express');

const router = express.Router();

const userRoute = require('../../Modules/User/routes');
const docTypeRoute = require('../../Modules/DocumentTypes/routes');
const userDocRoute = require('../../Modules/UserDocs/routes');
const jwtRoute = require('../Auth/routes');
const paymentIntentRoute = require('../../Modules/PaymentIntent/routes');

router.use((req, res, next) => {
  console.info(`${new Date().toISOString()}: ${req.method} | ${req.path} `) 
  return next()
})

router.use('/jwt', jwtRoute);
router.use('/user', userRoute);
router.use('/documentType', docTypeRoute);
router.use('/userDocument', userDocRoute);
router.use('/payment', paymentIntentRoute);

module.exports = router;
