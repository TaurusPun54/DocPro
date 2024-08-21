/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const Question = require('./schema');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

const createNewQuestion = async (payload) => { //payload is object
  const requiredKeys = ['type', 'question', 'DocType', 'order'];

  const incomeKeys = Object.keys(payload);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new ClientError.BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const { type, question, options, expected, DocType, order, min, max, description, placeholder } = payload;
  let shape;
  let newQuestion;
  if (expected && type === 'radio') {
    shape = {
      type: "string",
      enum: [`${expected}`],
      // minLength: 1,
      // maxLength: 1,
      // items: [{ type: "string", enum: [`${expected}`], nullable: false }],
      nullable: false,
    };
  }else {
    if (type === 'text' || type === 'textarea') {
      shape = {
        type: "string",
        minLength: parseInt(min, 10) || 1,
        maxLength: parseInt(max, 10) || 1000,
        // items: [{ type: "string", maxLength: 1000, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'textbox') {
      shape = {
        type: "array",
        minLength: 1,
        maxLength: 10,
        items: [{ type: "string", maxLength: 100, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'mc' || type === 'radio') {
      shape = {
        type: "string",
        enum: options,
        // minLength: 1,
        // maxLength: 1,
        // items: [{ type: "string", enum: options, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'checkbox') {
      shape = {
        type: "array",
        minLength: parseInt(min, 10) || 1,
        maxLength: parseInt(max, 10) || options.length,
        items: [{ type: "string", enum: options, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'number') {
      shape = {
        type: "number",
        minimum: parseInt(min, 10) || 1,
        maximum: parseInt(max, 10) || 999999999,
        nullable: false,
      };
    }
    if (type === 'date') {
      shape = {
        type: "date",
        // minLength: 1,
        // maxLength: 1,
        // items: [{ type: "string", format: 'date', nullable: false }],
        nullable: false,
      };
    }
  }
  newQuestion = new Question({
    type,
    question,
    description: description ?? '',
    placeholder: placeholder ?? '',
    options: options ?? [''],
    expected: expected ?? '',
    min: min ?? 'N/A',
    max: max ?? 'N/A',
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
