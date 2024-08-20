const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const answerValidator = (schema, data) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    console.log(validate.errors)
    return validate.errors;
  }
  return;
}

function isValidStripeCustomerId (id) {
  const regex = /^(cus_[a-zA-Z0-9]{14})$/
  if (!regex.test(id) || !id) return false;
  return true;
};

module.exports = {
  isValidStripeCustomerId,
  answerValidator
};
