const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class BadRequestError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.BadRequest,
    name = 'BadRequest',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = BadRequestError;
