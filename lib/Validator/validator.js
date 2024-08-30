/* eslint-disable max-len */
const Ajv = require("ajv")
const ajv = new Ajv({allErrors: true}) // options can be passed, e.g. {allErrors: true}

// database
const Document = require('../../Modules/Document/schema');
const { BadRequestError } = require('../Error/HttpErrors/index');

function isValidDate(dateString, minDate, maxDate) {
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

  if (datePattern.test(minDate) && dateString < minDate) return false;

  if (datePattern.test(maxDate) && dateString > maxDate) return false;

  return true;
}

const isValidAnswer = async (schema, data, i) => {
  if (data === null) return i+1;
  let ajvSchema = {};
  if (schema.type === 'array') ajvSchema = { ...schema, items: schema.items[0] };
  else ajvSchema = { ...schema };
  
  if (schema.type === 'date') {
    const valid = isValidDate(data, ajvSchema.minimum, ajvSchema.maximum);
    if (!valid) return i+1;
    return;
  }
  const validate = ajv.compile(ajvSchema);
  const valid = validate(data);
  if (!valid) return i+1;
  return;
}

const answerValidator = async(DocumentId, userAnswers) => {
  const errorArray = [];

  if (!DocumentId || !userAnswers) return new BadRequestError('This document is invalid');
  const documentExist = await Document.findOne({ _id: DocumentId, active: true }).populate('questions');
  const documentQuestions = documentExist.questions.sort((a, b) => a.order - b.order);

  documentQuestions.forEach(async (question, i) => {
    const questionShape = question.shape;
    const { answer } = userAnswers.find((obj) => obj.questionId.toString() === question._id.toString()) ?? null;
    const result = await isValidAnswer(questionShape, answer, i);
    if (result) errorArray.push(result);
  });
  return errorArray;
}

function isValidStripeCustomerId (id) {
  const regex = /^(cus_[a-zA-Z0-9]{14})$/
  if (!regex.test(id) || !id) return false;
  return true;
};

function isValidateDateUpdate (field, value) {
  // console.log(field);
  // console.log(value);
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  const dateTimeString = value?.toISOString() ?? null;
  // console.log(isValidDateFormat);
  if (field === null && value === null) return true;
  if (field === null && dateFormatRegex.test(dateTimeString)) return true;
  return false;
}

module.exports = {
  isValidStripeCustomerId,
  isValidateDateUpdate,
  answerValidator
};
