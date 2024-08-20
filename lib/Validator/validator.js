function isValidStripeCustomerId (id) {
  const regex = /^(cus_[a-zA-Z0-9]{14})$/
  if (!regex.test(id) || !id) return false;
  return true;
};

module.exports = {
  isValidStripeCustomerId,
};
