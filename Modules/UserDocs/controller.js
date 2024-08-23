/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const pdfFolder = 'pdfs';

const UserDoc = require('./schema');
const DocumentType = require('../DocumentTypes/schema');

const validator = require('../../lib/Validator/validator');

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
    docName: documentName ?? '',
    payload: { userAnswers },
    createdAt: Date.now(),
    editedAt: Date.now()
  });
  const saved = await draft.save();
  if (saved) return { data: saved };
};

const editUserDoc = async (req) => {
  // const { id } = req.user;
  const { docId } = req.params;
  const { docName, payload, finished } = req.body;
  // const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  if (!docId || !payload) return new ClientError.BadRequestError('Cannot save draft');
  const docExist = await UserDoc.findOne({ _id: docId, active: true });
  if (!docExist) return new ClientError.NotFoundError('Draft not found');
  if (docExist.completedAt !== null || docExist.paidAt !== null) return new ClientError.ForbiddenError('Cannot update a completed or paid doc');
  if (finished === false || !finished) {
    docExist.docName = docName ?? '';
    docExist.payload = payload;
    docExist.editedAt = Date.now();
    const edit = await docExist.save();
    if (edit) return { message: 'Draft saved' };
  }
  if (finished === true) {
    const errorArray = await validator.answerValidator(docExist);
    if (errorArray.length !== 0) return new ClientError.BadRequestError(`Answers of no. ${errorArray.join(', ')} are invalid`);
    docExist.docName = docName ?? '';
    docExist.payload = payload;
    docExist.editedAt = Date.now();
    docExist.completedAt = Date.now();
    const edit = await docExist.save();
    if (edit) return { message: 'This completed draft is saved and locked' };
  }
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

const getUserDocPDFBuffer = async (req, res) => {
  const { id } = req.user;
  const { docId } = req.query;

  const docRegex = /^([0-9a-fA-F]{24})$/;
  // const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  if (!docId || !docRegex.test(docId)) return new ClientError.BadRequestError('Please provide a valid doc id');

  const userDocData = await UserDoc.findOne({ _id: docId, active: true }).populate('DocTypeName questions');

  if (!userDocData) return new ClientError.NotFoundError('No such user doc');

  if (userDocData.UserId.toString() !== id) return new ClientError.ForbiddenError('No access right');

  if (userDocData.paidAt === null) return new ClientError.ForbiddenError('This doc is not paid');

  const documentQuestions = userDocData.questions.map((doc) => {
    const output = { type: doc.type, question: doc.question, options: doc.options, order: doc.order };
    return output;
  }).sort((a, b) => a.order - b.order);
  const documentTypeName = userDocData.DocTypeName.type;
  const { userAnswers } = userDocData.payload;

  const pdfbuffer = await new Promise((resolve) => {
    const pdf = new PDFDocument();
    const buffer = [];
    pdf.on('data', buffer.push.bind(buffer));
    pdf.on('end', () => {
      // eslint-disable-next-line no-undef
      const pdfData = Buffer.concat(buffer);
      resolve(pdfData);
    });
    pdf.pipe(fs.createWriteStream(path.join(pdfFolder, `${userDocData.docName ?? `Unnamed_${documentTypeName}`}.pdf`)));

    pdf.fontSize(40).text(`${userDocData.docName ?? 'Unnamed Doc'}`, 100, 100);
    documentQuestions.forEach((question, i) => {
      pdf.fontSize(25).text(`${question.order}.  ${question.question}`);
      if (question.options.length >= 1 && question.options[0] !== '') {
        const options = question.options.join(', ');
        pdf.fontSize(20).text(`options: ${options}`);
      }
      if (typeof(userAnswers[i]) === Array) {
        const ans = userAnswers[i].join(', ');
        pdf.fontSize(20).text(`Your answer: ${ans}`);
      }else pdf.fontSize(20).text(`Your answer: ${userAnswers[i]}`);
    });
    pdf.end();
  });

  fs.unlinkSync(path.join(pdfFolder, `${userDocData.docName ?? `Unnamed_${documentTypeName}`}.pdf`));
  return { pdfbuffer };

  // below will send a media type (whole pdf) as a response;
  // const pdfPath = path.join(pdfFolder, `${userDocData.docName ?? `Unnamed_${documentTypeName}`}.pdf`);
  // const pdfExist = fs.createReadStream(pdfPath);
  // if (!pdfExist) res.json({ message: 'No such pdf' })
  // if (pdfExist) {
  //   res.writeHead(200, {
  //     'Content-Type': 'application/pdf',
  //     'Content-Disposition': `attachment; filename=${userDocData.docName ?? `Unnamed_${documentTypeName}`}.pdf`,
  //     'Content-Transfer-Encoding': 'Binary'
  //   });
  
  //   pdfExist.pipe(res); 
  // }
}

module.exports = {
  createNewUserDoc,
  editUserDoc,
  getUserDoc,
  deleteUserDoc,
  getUserDocPDFBuffer
};
