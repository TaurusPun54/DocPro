/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
require('dotenv').config();

// database
const User = require('../../Modules/User/schema');

// error
const ClientError = require('../Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../Error/HttpErrors/ServerError/ServerErrors');

// jwt
const jwt = require('./jwt');

const AccAuth = async (req, res, next) => {
  try {
    const toCheckAccToken = req?.header('Authorization')?.replace('Bearer ', '') || '';
    if (!toCheckAccToken) return next(new ClientError.UnauthorizedError('Unauthorized request with no token'));

    const validToken = jwt.verifyacc(toCheckAccToken);
    if (!validToken) return next(new ClientError.UnauthorizedError('Unauthorized request with unknown user'))

    const id = validToken?.id;
    const idRegex = /^([0-9a-fA-F]{24})$/
    if (!id || !idRegex.test(id)) return new ClientError.UnauthorizedError('Unauthorized logout action with incorrect user id');

    const validUser = await User.findOne({ _id: id, active: true });
    if (!validUser) return next(new ClientError.UnauthorizedError('Unauthorized request with unknown user'));

    // const role = validUser.role ?? 'user';
    // if (role === 'user' && req?.params?.id){
    //   if (req?.params?.id !== validToken?.id) return next(new ClientError.UnauthorizedError('Unauthorized request with incorrect user'))
    // }
    req.user = {
      id,
      StripeCustomerId: validUser.StripeCustomerId ?? '',
      role: validUser.role ?? 'user'
    };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return next(new ClientError.UnauthorizedError('Unauthorized request with expired token'));
    return next(new ClientError.UnauthorizedError('Authorize fail'));
  }
};

module.exports = {
  AccAuth,
};
