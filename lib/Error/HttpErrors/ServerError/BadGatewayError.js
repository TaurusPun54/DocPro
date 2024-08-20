const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class BadGatewayError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.BadGateway,
    name = 'BadGateway',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = BadGatewayError;
