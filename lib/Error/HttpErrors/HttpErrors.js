class HttpErrors extends Error {
  constructor(name, statusCode, message) {
    super(`${name} : ${message}`);

    // Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.statusCode = statusCode;

    // Error.captureStackTrace(this);
  }
}

module.exports = HttpErrors;
