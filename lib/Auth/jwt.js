/* eslint-disable no-undef */
/* eslint-disable max-len */
const jwt = require('jsonwebtoken');

const { JWT_ACCESS_SECRET_KEY, JWT_REFRESH_SECRET_KEY } = process.env;

const accTTL = '2m';
const refTTL = '1d';

const signacc = (payload) => jwt.sign(payload, JWT_ACCESS_SECRET_KEY, { expiresIn: accTTL });
const signref = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET_KEY, { expiresIn: refTTL });
const decode = (token) => jwt.decode(token);
const verifyacc = (token) => jwt.verify(token, JWT_ACCESS_SECRET_KEY);
const verifyref = (token) => jwt.verify(token, JWT_REFRESH_SECRET_KEY);

module.exports = {
  signacc,
  signref,
  decode,
  verifyacc,
  verifyref
};
