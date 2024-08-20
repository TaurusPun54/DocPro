const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class ForbiddenError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.Forbidden,
    name = 'Forbidden',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = ForbiddenError;
