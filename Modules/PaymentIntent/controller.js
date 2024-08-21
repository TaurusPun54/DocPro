/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const validator = require('../../lib/Validator/validator');

// database
const UserDoc = require('../UserDocs/schema');
const DocumentType = require('../DocumentTypes/schema');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

const createPaymentIntent = async (req) => {
  const { id } = req.user;
  const { docId } = req.params;
  if (!docId) return new ClientError.NotFoundError('Not such user doc');

  const userdocData = await UserDoc.findById(docId);
  if (!userdocData) return new ClientError.NotFoundError('Not such user doc');
  if (userdocData.UserId.toString() !== id) return new ClientError.ForbiddenError('no access right');

  // let errorArray = [];
  // const { DocType, payload } = userdocData;
  // if (!DocType || !payload) return new ClientError.BadRequestError('This doc is invalid');
  // const { userAnswers } = payload;
  // const docData = await DocumentType.findOne({ _id: DocType, active: true }).populate('questions');
  // const questions = docData.questions;
  // questions.sort((a, b) => a.order - b.order);
  // console.log(`There are total ${questions.length} questions`);
  // questions.forEach((question, i) => {
  //   //console.log(question.shape);
  //   const schema = question.shape;
  //   const data = userAnswers[i];
  //   const result = validator.answerValidator(schema, data, i);
  //   if (result) errorArray.push(result);
  // });
  // console.log(errorArray);
  const errorArray = await Promise(validator.answerValidator(userdocData));
  if (errorArray.length === 0) return { message: 'All answer valid' };
  return new ClientError.BadRequestError(`Answers of no. ${errorArray.join(', ')} are invalid`);
};

module.exports = {
  createPaymentIntent,
};
