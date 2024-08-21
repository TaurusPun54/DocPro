/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const DocumentType = require('./schema');
const Question = require('../Questions/schema');

const questionController = require('../Questions/controller');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

const createNewDoc = async (req) => {
  const { role } = req.user;
  if (role !== 'admin') return new ClientError.ForbiddenError('No access right');
  const { type, description, price, currency } = req.body.documentType;
  const questions = req.body.questions; //questions is array of object
  if (!type || !price || !currency) return new ClientError.BadRequestError('Missing required data, cannot create new Doc');
  const typeExist = await DocumentType.findOne({ type });
  if (typeExist) return new ClientError.BadRequestError('This document type already created');
  try {
    const docToCreate = new DocumentType({
      type,
      description: description ?? '',
      price,
      currency
    });
    const newDoc = await docToCreate.save();
    questions.forEach(async (q, i) => { // q is object
      const payload = {...q, DocType: newDoc._id, order: i+1};
      await questionController.createNewQuestion(payload);
    });
    return { message: 'Doc created' };
  } catch (error) {
    // console.log(error);
    return new ServerError.InternalServerError('Error occurs');
  }
};

const getDoc = async (req) => {
  const { documentTypeId } = req.query;
  if (!documentTypeId) {
    const docs = await DocumentType.find({ active: true });
    if (docs.length > 1) {
      const items = docs.map((doc) => {
        return {
          _id: doc._id,
          name: doc.type,
          description: doc.description ?? '',
          price: doc.price,
          currency: doc.currency,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }
      });
      return { items };
    }
    return { data: [{
          _id: docs[0]._id,
          name: docs[0].type,
          description: docs[0].description ?? '',
          price: docs[0].price,
          currency: docs[0].currency,
          createdAt: docs[0].createdAt,
          updatedAt: docs[0].updatedAt
    }] }
    // return { docs };
  }
  // if (!type) return new ClientError.BadRequestError('Cannot get without doc id');
  const docData = await DocumentType.findOne({ _id: documentTypeId, active: true }).populate('questions');
  if (!docData) return new ClientError.NotFoundError('Document not found');
  const questions = docData.questions
  // console.log(questions);
  questions.sort((a, b) => a.order - b.order);
  const data = { ...docData._doc, questions }
  return { data };
}

module.exports = {
  createNewDoc,
  getDoc
};
