/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

// middleware
const Auth = require('../../lib/Auth/accessTokenAuth');

const paymentController = require('./controller');

const warpper = require('../../lib/Wrapper/wrapper');

// payment intent
router.post('/:docId([0-9a-fA-F]{24})', Auth.AccAuth, warpper(paymentController.checkAns));

module.exports = router;
