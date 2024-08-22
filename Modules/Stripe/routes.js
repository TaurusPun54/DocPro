/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

require('dotenv').config();

const stripeController = require('./controller');

// const warpper = require('../../lib/Wrapper/wrapper');

router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.listenWebHook);

module.exports = router;
