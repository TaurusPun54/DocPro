/* eslint-disable max-len */
require('dotenv').config();

const User = require('../../Modules/User/schema');
const { UnauthorizedError } = require('../Error/HttpErrors/index');
const jwt = require('./jwt');

const AccAuth = async (req, res, next) => {
  try {
    const toCheckAccToken = req?.header('Authorization')?.replace('Bearer ', '') || '';
    if (!toCheckAccToken) return next(new UnauthorizedError('Unauthorized request with no token'));

    const validToken = jwt.verifyacc(toCheckAccToken);
    if (!validToken) return next(new UnauthorizedError('Unauthorized request with unknown user'))

    const id = validToken?.id;
    const idRegex = /^([0-9a-fA-F]{24})$/
    if (!id || !idRegex.test(id)) return new UnauthorizedError('Unauthorized logout action with incorrect user id');

    const validUser = await User.findOne({ _id: id, active: true, refreshToken: { $ne: '' } }).select('_id email stripeCustomerId role');
    if (!validUser) return next(new UnauthorizedError('Unauthorized request with unknown user'));

    req.user = {
      id,
      email: validUser.email,
      stripeCustomerId: validUser.stripeCustomerId ?? '',
      role: validUser.role ?? 'user'
    };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return next(new UnauthorizedError('Unauthorized request with expired token'));
    return next(new UnauthorizedError('Authorize fail'));
  }
};

module.exports = {
  AccAuth,
};
