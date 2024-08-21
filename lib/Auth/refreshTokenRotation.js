/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
require('dotenv').config();

// crypto
const crypto = require('crypto');
//const randomToken = require('../Security/crypto');

// database
const User = require('../../Modules/User/schema');

// error
const ClientError = require('../Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../Error/HttpErrors/ServerError/ServerErrors');

// jwt
const jwt = require('./jwt');

const RefreshRotation = async (req) => {
  try {
    const toCheckRefToken = req?.header('Authorization')?.replace('Bearer ', '') || '';
    if (!toCheckRefToken) return new ClientError.UnauthorizedError('Unauthorized rotation request with no refreshtoken');

    const validToken = jwt.verifyref(toCheckRefToken);
    if (!validToken) return new ClientError.UnauthorizedError('Invalid refreshtoken, login again');
    // console.log(validToken.exp);

    const id = validToken?.id;
    const idRegex = /^([0-9a-fA-F]{24})$/
    if (!id || !idRegex.test(id)) return new ClientError.UnauthorizedError('Unauthorized logout action with incorrect user id');

    const validUser = await User.findOne({ _id: id, refreshToken: toCheckRefToken, active: true });
    if (!validUser) return new ClientError.UnauthorizedError('Refreshtoken not match, login again');

    const randomString = crypto.randomBytes(64).toString('hex');;

    const authPayload = {
      id,
      randomString
    }

    const reSignRefPayload = {
      id,
      randomString,
      exp: validToken.exp
    }

    const acctoken = jwt.signacc(authPayload);
    const reftoken = jwt.reSignref(reSignRefPayload);
    // console.log(jwt.decode(reftoken));

    const refreshSuccess = await User.findByIdAndUpdate(id, { refreshToken: reftoken });

    if (refreshSuccess) return { data: { accessToken: acctoken, refreshToken: reftoken } };
  } catch (e) {
    // console.log(e);
    if (e.name === 'TokenExpiredError') return new ClientError.UnauthorizedError('refresh token expired, login again');
    return new ClientError.UnauthorizedError('Authorize fail');
  }
};

module.exports = RefreshRotation;
