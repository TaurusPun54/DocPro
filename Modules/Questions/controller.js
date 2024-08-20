/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const Question = require('./schema');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

const createNewQuestion = async (payload) => { //payload is object
  const requiredKeys = ['type', 'question', 'options', 'DocType', 'order'];

  const incomeKeys = Object.keys(payload);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new ClientError.BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const { type, question, options, expected, DocType, order } = payload;
  let shape;
  let newQuestion;
  if (expected && type === 'radio') {
    shape = {
      type: "array",
      minLength: 1,
      maxLength: 1,
      items: [{ type: "string", enum: [`${expected}`], nullable: false }],
      nullable: false,
    };
  }else {
    if (type === 'text') {
      shape = {
        type: "array",
        minLength: 1,
        maxLength: 1,
        items: [{ type: "string", maxLength: 1000, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'textbox') {
      shape = {
        type: "array",
        minLength: 1,
        maxLength: 10,
        items: [{ type: "string", maxLength: 1000, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'mc' || type === 'radio') {
      shape = {
        type: "array",
        minLength: 1,
        maxLength: 1,
        items: [{ type: "string", enum: options, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'checkbox') {
      shape = {
        type: "array",
        minLength: 1,
        maxLength: options.length,
        items: [{ type: "string", enum: options, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'number') {
      shape = {
        type: "array",
        minLength: 1,
        maxLength: 1,
        items: [{ type: "string", maxLength: 10, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'date') {
      shape = {
        type: "array",
        minLength: 1,
        maxLength: 1,
        items: [{ type: "string", format: 'date', nullable: false }],
        nullable: false,
      };
    }
  }
  newQuestion = new Question({
    type,
    question,
    options,
    expected: expected ?? '',
    shape,
    DocType,
    order
  });
  await newQuestion.save();
  return;
  // const orderExist = await Question.findOne({ Document, order });
};

module.exports = {
  createNewQuestion,
};

// if (type === 'int') {
//   const range = expected.substring(0, 1);
//   const value = expected.substring(1, expected.length + 1);
//   if (range === '<') {
//     shape = {
//       type: "array",
//       minLength: 1,
//       maxLength: 1,
//       items: [{ type: "string", nullable: false,  }],
//       nullable: false,
//     };
//   }
// }
