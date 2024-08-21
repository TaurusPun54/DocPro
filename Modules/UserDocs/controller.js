/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const UserDoc = require('./schema');
const DocumentType = require('../DocumentTypes/schema');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

const createNewUserDoc = async (req) => {
  const { id } = req.user;
  const { payload } = req.body;

  const requiredKeys = ['DocumentTypeId', 'documentName', 'userAnswers'];
  const incomeKeys = Object.keys(payload);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new ClientError.BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const { DocumentTypeId, documentName, userAnswers } = payload;

  const docExist = await DocumentType.findById(DocumentTypeId);
  if (!docExist) return new ClientError.BadRequestError('Not such doc type found');
  const draft = new UserDoc({
    DocType: docExist._id,
    UserId: id,
    docName: documentName,
    payload: { userAnswers },
    createdAt: Date.now(),
    editedAt: Date.now()
  });
  const saved = await draft.save();
  if (saved) return { message: 'New draft created' };
};

const editUserDoc = async (req) => {
  // const { id } = req.user;
  const { docId } = req.params;
  const { docName, payload } = req.body;
  if (!docId || !payload || !docName) return new ClientError.BadRequestError('Cannot edit draft');
  const docExist = await UserDoc.findOne({ _id: docId, active: true });
  if (!docExist) return new ClientError.NotFoundError('Draft not found');
  if (docExist.completedAt || docExist.paidAt) return new ClientError.ForbiddenError('This doc already completed')
    docExist.docName = docName;
    docExist.payload = payload;
    docExist.editedAt = Date.now();
  const edit = await docExist.save();
  if (edit) return { message: 'Draft saved' };
};

const getUserDoc = async (req) => {
  const { id } = req.user;
  if (!id) return new ClientError.UnauthorizedError('Cannot get docs of unknown user');
  const { docId } = req.query;
  if (!docId || docId.length !== 24) return new ClientError.BadRequestError('Cannot get unknown user doc');
  const doc = await UserDoc.findOne({ _id: docId, active: true }).select('-__v -active').populate('DocTypeName questions');
  if (!doc) return new ClientError.NotFoundError('Not such user doc');
  const DocType = doc?.DocTypeName?.type;
  const questions = doc?.questions;
  questions?.sort((a, b) => a.order - b.order);
  return { data: { ...doc._doc, DocType, questions } }
}

const deleteUserDoc = async (req) => {
  const { docId } = req.params;
  if (!docId) return new ClientError.NotFoundError('User doc not found');

  const docExist = await UserDoc.findOne({ _id: docId, active: true });
  if (!docExist) return new ClientError.NotFoundError('User doc not found');

  if (docExist.paidAt) return new ClientError.BadRequestError('Cannot delete a paid doc');

  const toDelete = await UserDoc.findByIdAndUpdate(docId, { active: false, deletedAt: Date.now() });
  if (toDelete) return { message: 'User doc deleted' };
}

module.exports = {
  createNewUserDoc,
  editUserDoc,
  getUserDoc,
  deleteUserDoc
};
