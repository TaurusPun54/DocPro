/* eslint-disable max-len */
require('dotenv').config();
const crypto = require('crypto');

const User = require('../../Modules/User/schema');
const { UnauthorizedError } = require('../Error/HttpErrors/index');
const jwt = require('./jwt');

const RefreshRotation = async (req) => {
  try {
    const toCheckRefToken = req?.header('Authorization')?.replace('Bearer ', '') || '';
    if (!toCheckRefToken) return new UnauthorizedError('Unauthorized rotation request with no refreshtoken');

    const validToken = jwt.verifyref(toCheckRefToken);
    if (!validToken) return new UnauthorizedError('Invalid refreshtoken, login again');
    // console.log(validToken.exp);

    const id = validToken?.id;
    const idRegex = /^([0-9a-fA-F]{24})$/
    if (!id || !idRegex.test(id)) return new UnauthorizedError('Unauthorized logout action with incorrect user id');

    const validUser = await User.findOne({ _id: id, refreshToken: toCheckRefToken, active: true });
    if (!validUser) return new UnauthorizedError('Refreshtoken not match, login again');

    const randomString = crypto.randomBytes(64).toString('hex');

    const authPayload = {
      id,
      stripeCustomerId: validToken.stripeCustomerId,
      email: validToken.email,
      randomString
    }

    const reSignRefPayload = {
      id,
      stripeCustomerId: validToken.stripeCustomerId,
      email: validToken.email,
      randomString,
      exp: validToken.exp
    }

    const acctoken = jwt.signacc(authPayload);
    const reftoken = jwt.reSignref(reSignRefPayload);
    // console.log(jwt.decode(reftoken));

    const refreshSuccess = await User.findByIdAndUpdate(id, { refreshToken: reftoken });

    if (refreshSuccess) return { accessToken: acctoken, refreshToken: reftoken };
  } catch (e) {
    // console.log(e);
    if (e.name === 'TokenExpiredError') return new UnauthorizedError('refresh token expired, login again');
    return new UnauthorizedError('Authorize fail');
  }
};

module.exports = RefreshRotation;
