/* eslint-disable max-len */
const Ajv = require("ajv")
const ajv = new Ajv({allErrors: true}) // options can be passed, e.g. {allErrors: true}

function isValidDate(dateString) {
  const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/; // dd-mm-yyyy
  
  if (!datePattern.test(dateString)) return false;

  const [day, month, year] = dateString.match(datePattern).slice(1);

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (monthNum < 1 || monthNum > 12 || dayNum < 1) return false;

  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  if (monthNum === 2 && (yearNum % 4 === 0 ? dayNum > 29 : dayNum > 28)) return false;

  if (dayNum > daysInMonth) return false;

  return true;
}

const answerValidator = (schema, data, i) => {
  // console.log(schema.items[0]);
  let ajvSchema = {};
  if (schema.type === 'array') ajvSchema = { ...schema, items: schema.items[0] };
  else if (schema.type !== 'date') ajvSchema = { ...schema };
  if (schema.type !== 'date') {
    // console.log(ajvSchema);
    const validate = ajv.compile(ajvSchema);
    const valid = validate(data);
    if (!valid) {
      // console.log(`Ans ${i+1} is invalid`);
    }else {
      // console.log(`Ans ${i+1} is valid`);
    }
  }else {
    const valid = isValidDate(data);
    if (!valid) {
      // console.log(`Ans ${i+1} is invalid`);
    }else {
      // console.log(`Ans ${i+1} is valid`);
    }
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
