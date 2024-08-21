/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const Ajv = require("ajv")
const ajv = new Ajv({allErrors: true}) // options can be passed, e.g. {allErrors: true}

// database
// const UserDoc = require('../UserDocs/schema');
const DocumentType = require('../../Modules/DocumentTypes/schema');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

function isValidDate(dateString) {
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/; // yyyy-mm-dd
  
  if (!datePattern.test(dateString)) return false;

  const [year, month, day] = dateString.match(datePattern).slice(1);

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (monthNum < 1 || monthNum > 12 || dayNum < 1) return false;

  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  if (monthNum === 2 && (yearNum % 4 === 0 ? dayNum > 29 : dayNum > 28)) return false;

  if (dayNum > daysInMonth) return false;

  return true;
}

const isValidAnswer = async (schema, data, i) => {
  // console.log(schema.items[0]);
  let ajvSchema = {};
  if (schema.type === 'array') ajvSchema = { ...schema, items: schema.items[0] };
  else if (schema.type !== 'date') ajvSchema = { ...schema };
  if (schema.type !== 'date') {
    // console.log(ajvSchema);
    const validate = ajv.compile(ajvSchema);
    const valid = validate(data);
    if (!valid) {
      return i+1;
      // console.log(`Ans ${i+1} is invalid`);
    }
  }else {
    const valid = isValidDate(data);
    if (!valid) {
      return i+1;
      // console.log(`Ans ${i+1} is invalid`);
    }
  }
  // return;
}

const answerValidator = async(userdocData) => {
  const errorArray = [];

  const { DocType, payload } = userdocData;
  if (!DocType || !payload) return new ClientError.BadRequestError('This doc is invalid');
  const { userAnswers } = payload;
  const docData = await DocumentType.findOne({ _id: DocType, active: true }).populate('questions');
  const questions = docData.questions;
  questions.sort((a, b) => a.order - b.order);

  questions.forEach((question, i) => {
    //console.log(question.shape);
    const schema = question.shape;
    const data = userAnswers[i];
    const result = isValidAnswer(schema, data, i);
    if (result) errorArray.push(result);
  });
  return errorArray;
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
