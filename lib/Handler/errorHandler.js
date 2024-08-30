/* eslint-disable no-unused-vars */
 const HttpErrors = require('../Error/HttpErrors/HttpErrors');
const { ErrorLogger } = require('../Logger/logger');

const ErrorHandler = (err, req, res, next) => {
  if (err instanceof HttpErrors) {
    // ErrorLogger(`${ err.message }`);
    return res.status(err.statusCode).json(`${ err.message }`);
  }
  // ErrorLogger(err.message);
  return res.status(500).json(err.message);
};

module.exports = ErrorHandler;
