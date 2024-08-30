/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const Document = require('./schema');
const questionController = require('../Question/controller');
const { BadRequestError, ForbiddenError, NotFoundError, InternalServerError } = require('../../lib/Error/HttpErrors/index');

const createNewDocument = async (req) => {
  const { role } = req.user;
  if (role !== 'admin') return new ForbiddenError('No access right');

  const requiredKeys = ['categoy', 'title', 'description', 'price', 'currency', 'questions'];
  const incomeKeys = Object.keys(req.body);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const { categoy, title, description, price, currency, questions } = req.body;

  const titleDuplicate = await Document.findOne({ categoy, title });
  if (titleDuplicate) return new BadRequestError(`Document: ${title} under categoy: ${categoy} is already exist`);

  const acceptableCurrency = ['hkd', 'usd'];
  if (!acceptableCurrency.includes(currency)) return new BadRequestError(`Currency ${currency} is not acceptable`);

  const invalidQuestionsOrder = [];
  questions.forEach((q, i) => {
      if (!questionController.checkNewQuestionValid(q)) invalidQuestionsOrder.push(i + 1);
  });
  if (invalidQuestionsOrder.length > 0) return new BadRequestError(`Questions ${invalidQuestionsOrder.join(', ')} are invalid`);

  try {
    const documentToCreate = new Document({
      categoy,
      title,
      description: description ?? '',
      price,
      currency
    });
    const newDocument = await documentToCreate.save();
    questions.forEach(async (q, i) => { // q is object
      const payload = {...q, DocumentId: newDocument._id, order: i+1};
      // console.log(payload);
      await questionController.createNewQuestion(payload);
    });
    return { message: `New document: ${title} under categoy: ${categoy} created successfully` };
  } catch (error) {
    // console.log(error);
    return new InternalServerError('Error occurs during create new document');
  }
};

const getDocument = async (req) => {
  const { documentId, limit, page, sortBy, sortOrder } = req.query;
  if (!documentId) {
    const documents = await Document.find({ active: true })
    .skip(page ? ((limit && limit < 10 ? limit : 10) * (page - 1)) : 0)
    .limit(limit && limit < 10 ? limit : 10)
    .sort(sortOrder && (sortOrder === "1" || sortOrder === "-1") ? (sortBy ? { [sortBy] : parseInt(sortOrder, 10) } : { createdAt: parseInt(sortOrder, 10) }) : (sortBy ? { [sortBy] : 1 } : { createdAt: 1 }));
    return documents.map((doc) => {
      return { ...doc._doc, price: parseFloat(doc.price.toString()) }
    });
  };
  const documentData = await Document.findOne({ _id: documentId, active: true }).populate('questions');
  if (!documentData) return new NotFoundError('Document not found');
  const questions = documentData.questions.sort((a, b) => a.order - b.order);
  const data = { ...documentData._doc, questions }
  data.price = parseFloat(data.price.toString());
  return data;
}

module.exports = {
  createNewDocument,
  getDocument
};
