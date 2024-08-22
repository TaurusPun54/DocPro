const httpStatusCodes = require('../httpstatuscodes');
const HttpErrors = require('../HttpErrors');

class ConflictError extends HttpErrors {
  constructor (
    message,
    statusCode = httpStatusCodes.Conflict,
    name = 'Conflict',
  ) {
    super(name, statusCode, message);
  }
}

module.exports = ConflictError;
