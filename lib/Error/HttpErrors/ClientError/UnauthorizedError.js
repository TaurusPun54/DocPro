const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class UnauthorizedError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.Unauthorized,
    name = 'Unauthorized',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = UnauthorizedError;
