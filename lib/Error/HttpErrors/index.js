const ClientError = require('./ClientError/ClientErrors');
const ServerError = require('./ServerError/ServerErrors');

module.exports = {
  ...ClientError,
  ...ServerError,
};
