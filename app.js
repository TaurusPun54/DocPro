/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const router = require('./lib/Core/router');
require('./lib/DB/index');
// const HttpErrors = require('./lib/Error/HttpErrors/HttpErrors');

// const Logger = require('./lib/Logger/Logger');
const ResponseHandler = require('./lib/Handler/responseHandler');
const ErrorHandler = require('./lib/Handler/errorHandler');

const app = express();

app.use(express.json());
app.use('/api', router);

app.use(ResponseHandler);
app.use(ErrorHandler);

app.listen(process.env.LOCAL_HOST_PORT || 3000, () => {});
