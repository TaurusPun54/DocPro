/* eslint-disable max-len */
const Question = require('./schema');

const checkNewQuestionValid = (payload) => {
  // console.log(payload);
  const requiredKeys = ['type', 'question'];
  const incomeKeys = Object.keys(payload);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return false;

  const { type, question, description, placeholder, options, expected, min, max } = payload;

  if (![question, description, placeholder].every((value) => (value === undefined ||  (value && typeof(value) === 'string')))) return false;

  if (question.length > 1000 || description?.length > 1000 || placeholder?.length > 1000) return false;

  if ((type === 'mc' || type === 'radio' || type === 'checkbox') && (!options || !Array.isArray(options))) {
    return false;
  }

  if (type === 'checkbox' && (min || max)) {
    if (min && parseInt(min, 10) < 1) return false;
    if (max && parseInt(max, 10) > options.length) return false;
  }

  if (type === 'text' || type === 'textarea' && (min || max)) {
    if (min && parseInt(min, 10) < 1) return false;
    if (max && parseInt(max, 10) > 1000) return false;
  }

  if (type === 'number' && (min || max)) {
    if (min && parseFloat(min) < 1) return false;
    if (max && parseFloat(max) > Number.MAX_SAFE_INTEGER) return false;
  }

  if (expected) {
    if (type !== 'radio') return false;
    if (typeof(expected) !== 'string') return false;
    if (options?.length > 0 && !options.includes(expected)) return false;
  }

  return true;
}

const createNewQuestion = async (payload) => { //payload is object
  const { type, question, description, placeholder, options, expected, DocumentId, order, min, max } = payload;
  let shape;
  let newQuestion;
  if (expected && type === 'radio') {
    shape = {
      type: "string",
      enum: [`${expected}`],
      nullable: false,
    };
  }else {
    if (type === 'text' || type === 'textarea') {
      shape = {
        type: "string",
        minLength: parseInt(min, 10) || 1,
        maxLength: parseInt(max, 10) || 1000,
        nullable: false,
      };
    }
    if (type === 'textbox') {
      shape = {
        type: "array",
        minLength: parseInt(min, 10) || 1,
        maxLength: parseInt(max, 10) || 10,
        items: [{ type: "string", maxLength: 1000, nullable: false }],
        nullable: false,
      };
    }
    if (type === 'mc' || type === 'radio') {
      shape = {
        type: "string",
        enum: options,
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
        minimum: parseFloat(min) || 1,
        maximum: parseFloat(max) || Number.MAX_SAFE_INTEGER,
        nullable: false,
      };
    }
    if (type === 'date') {
      shape = {
        type: "date",
        minimum: min ?? 'N/A',
        maximum: max ?? 'N/A',
        nullable: false,
      };
    }
  }
  newQuestion = new Question({
    type,
    question,
    description: description ?? 'This is a description',
    placeholder: placeholder ?? 'Please enter your text here',
    options: options ?? [''],
    shape,
    DocumentId,
    order
  });
  await newQuestion.save();
  return;
};

module.exports = {
  createNewQuestion,
  checkNewQuestionValid,
};
