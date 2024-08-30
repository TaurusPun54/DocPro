const express = require('express');

const router = express.Router();

const UserRoute = require('../../Modules/User/routes');
const DocumentRoute = require('../../Modules/Document/routes');
const UserDocumentRoute = require('../../Modules/UserDocument/routes');
const PaymentIntentRoute = require('../../Modules/PaymentIntent/routes');

router.use((req, res, next) => {
  console.info(`${new Date().toISOString()}: ${req.method} | ${req.path} `) 
  return next()
})

router.use('/user', UserRoute);
router.use('/document', DocumentRoute);
router.use('/userDocument', UserDocumentRoute);
router.use('/payment', PaymentIntentRoute);

module.exports = router;
