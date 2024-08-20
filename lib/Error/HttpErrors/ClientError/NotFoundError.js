const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class NotFoundError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.NotFound,
    name = 'Not found',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = NotFoundError;
