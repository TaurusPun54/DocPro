/* eslint-disable max-len */
const crypto = require('crypto');

// function getRandomIntInclusive(min, max) {
//   const minCeiled = Math.ceil(min);
//   const maxFloored = Math.floor(max);
//   // The maximum and the minimum are inclusive
//   return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
// }

const randomToken = () => {
  // const randomLength = getRandomIntInclusive(20, 64);
  const randomString = crypto.randomBytes(64).toString('hex');
  return randomString
};

module.exports = { randomToken };
