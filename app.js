/* eslint-disable no-undef */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const router = require('./lib/Core/router');
require('./lib/DB/index');
const ResponseHandler = require('./lib/Handler/responseHandler');
const ErrorHandler = require('./lib/Handler/errorHandler');
const stripeController = require('./Modules/Stripe/controller');

const app = express();

// eslint-disable-next-line max-len
app.post('/webhook', express.raw({ type: 'application/json' }), stripeController.listenWebHook);

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.use(ResponseHandler);
app.use(ErrorHandler);

app.listen(process.env.LOCAL_HOST_PORT || 3000, () => {});
