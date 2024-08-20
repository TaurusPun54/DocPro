const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class InternalServerError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.InternalServer,
    name = 'InternalServerError',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = InternalServerError;
