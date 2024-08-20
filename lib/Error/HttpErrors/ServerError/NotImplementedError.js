const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class NotImplementedError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.NotImplemented,
    name = 'NotImplemented Error',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = NotImplementedError;
