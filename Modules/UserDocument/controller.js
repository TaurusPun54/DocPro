/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const pdfFolder = 'pdfs';

const UserDocument = require('./schema');
const Document = require('../Document/schema');

const validator = require('../../lib/Validator/validator');

// error
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } = require('../../lib/Error/HttpErrors/index');

const createUserDocument = async (req) => {
  const { id } = req.user;

  const requiredKeys = ['DocumentId', 'documentName', 'userAnswers'];
  const incomeKeys = Object.keys(req.body);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const { DocumentId, documentName, userAnswers } = req.body;

  const documentExist = await Document.findById(DocumentId).populate('questions');
  if (!documentExist) return new BadRequestError('Invalid DocumentId');

  const questionIds = documentExist.questions.map((question) => {
    return question._id.toString();
  });

  if (userAnswers.length !== questionIds.length) return new BadRequestError('Invalid user answers');

  const errorArray = [];
  userAnswers.forEach((obj, i) => {
    if (typeof(obj) !== 'object') {
      errorArray.push(i+1);
      return;
    };
    if (!obj.questionId || !/^([0-9a-fA-F]{24})$/.test(obj.questionId)) {
      errorArray.push(i+1);
      return;
    };
    if (!questionIds.includes(obj.questionId)) {
      errorArray.push(i+1);
      return;
    };
  });

  if (errorArray.length > 0) return new BadRequestError(`Answers ${errorArray.join(', ')} are invalid`);

  const newUserDocument = new UserDocument({
    DocumentId: documentExist._id,
    UserId: id,
    documentName: documentName?.toString() ?? 'Unnamed draft',
    userAnswers,
    createdAt: Date.now(),
    editedAt: Date.now()
  });
  const saved = await newUserDocument.save();
  if (saved) return { message: 'success' };
};

const updateUserDocument = async (req) => {
  const { userDocumentId } = req.params;
  const { documentName, userAnswers, isFinished } = req.body;
  // const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  if (!userDocumentId || !userAnswers) return new BadRequestError('Cannot save draft without id and answers');
  const userDocumentExist = await UserDocument.findOne({ _id: userDocumentId, active: true });
  if (!userDocumentExist) return new NotFoundError('Draft not found');
  if (userDocumentExist.completedAt !== null || userDocumentExist.paidAt !== null) return new ForbiddenError('Cannot update a completed or paid document');

  const documentExist = await Document.findById(userDocumentExist.DocumentId).populate('questions');
  if (!documentExist) return new BadRequestError('Invalid DocumentId');

  const questionIds = documentExist.questions.map((question) => {
    return question._id.toString();
  });

  if (userAnswers.length !== questionIds.length) return new BadRequestError('Invalid user answers');

  const errorArray = [];
  userAnswers.forEach((obj, i) => {
    if (typeof(obj) !== 'object') {
      errorArray.push(i+1);
      return;
    };
    if (!obj.questionId || !/^([0-9a-fA-F]{24})$/.test(obj.questionId)) {
      errorArray.push(i+1);
      return;
    };
    if (!questionIds.includes(obj.questionId)) {
      errorArray.push(i+1);
      return;
    };
  });

  if (errorArray.length > 0) return new BadRequestError(`Answers ${errorArray.join(', ')} are invalid`);

  if (isFinished === 1) {
    const errorArray = await validator.answerValidator(userDocumentExist.DocumentId, userAnswers);
    if (errorArray.length !== 0) return new BadRequestError(`Answers of no. ${errorArray.join(', ')} are invalid`);
    await UserDocument.findByIdAndUpdate(userDocumentId, {
      documentName: documentName.toString() ?? 'Unnamed draft',
      userAnswers: userAnswers,
      editedAt: Date.now(),
      completedAt: Date.now()
    })
    // userDocumentExist.documentName = documentName.toString() ?? 'Unnamed draft';
    // userDocumentExist.userAnswers = userAnswers;
    // userDocumentExist.editedAt = Date.now();
    // userDocumentExist.completedAt = Date.now();
    // await userDocumentExist.save();
    return { message: 'success' };
  };
  userDocumentExist.documentName = documentName.toString() ?? 'Unnamed draft';
  userDocumentExist.userAnswers = userAnswers;
  userDocumentExist.editedAt = Date.now();
  const editSuccess = await userDocumentExist.save();
  if (editSuccess) return { message: 'success' };
};

const getUserDocument = async (req) => {
  const { id } = req.user;
  if (!id) return new UnauthorizedError('Cannot get document of unknown user');
  const { userDocumentId, limit, page, sortBy, sortOrder, documentName, documentStatus } = req.query;
  if (!userDocumentId) {
    const query = { UserId: id, active: true };

    if (documentName) query.documentName = { $regex: documentName, $options: 'i' };

    if (documentStatus === "paid") query.paidAt = { $ne: null };
    else if (documentStatus === "completed") query.completedAt = { $ne: null };

    const documents = await UserDocument.find(query)
    .select('-userAnswers')
    .skip(page ? ((limit && limit < 10 ? limit : 10) * (page - 1)) : 0)
    .limit(limit && limit < 10 ? limit : 10)
    .sort(sortOrder && (sortOrder === "1" || sortOrder === "-1") ? (sortBy ? { [sortBy] : parseInt(sortOrder, 10) } : { createdAt: parseInt(sortOrder, 10) }) : (sortBy ? { [sortBy] : 1 } : { createdAt: 1 }));
    return documents;
  }
  if (userDocumentId && !/^([0-9a-fA-F]{24})$/.test(userDocumentId)) return new BadRequestError('User document id not valid');
  const userDocumentExist = await UserDocument.findOne({ _id: userDocumentId, active: true }).select('-__v -active').populate('title questions');
  if (!userDocumentExist) return new NotFoundError('Not such user document');
  const title = userDocumentExist?.title?.title;
  const questions = userDocumentExist?.questions?.sort((a, b) => a.order - b.order);
  return {...userDocumentExist._doc, title, questions }
}

const deleteUserDocument = async (req) => {
  const { userDocumentId } = req.params;
  if (!userDocumentId) return new NotFoundError('User document not found');

  const userDocumentExist = await UserDocument.findOne({ _id: userDocumentId, active: true, paidAt: { $eq: null } });
  if (!userDocumentExist) return new NotFoundError('User document not found');

  // if (userDocumentExist.paidAt !== null) return new BadRequestError('Cannot delete a paid user document');

  const deleteSuccess = await UserDocument.findByIdAndUpdate(userDocumentId, { active: false, deletedAt: Date.now() });
  if (deleteSuccess) return { message: 'success' };
}

const getUserDocumentPDFBuffer = async (req, res) => {
  const { id } = req.user;
  const { userDocumentId } = req.query;
  // const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  if (!userDocumentId || !/^([0-9a-fA-F]{24})$/.test(userDocumentId)) return new BadRequestError('Please provide a valid user document id');

  const userDocumentExist = await UserDocument.findOne({ _id: userDocumentId, active: true }).populate('title questions');

  if (!userDocumentExist) return new NotFoundError('No such user document found');

  if (userDocumentExist.UserId.toString() !== id) return new ForbiddenError('No access right');

  // if (userDocumentExist.paidAt === null) return new ForbiddenError('This user document is not paid');

  const documentQuestions = userDocumentExist.questions.map((obj) => {
    return { type: obj.type, question: obj.question, options: obj.options, order: obj.order };
  }).sort((a, b) => a.order - b.order);
  const { title } = userDocumentExist.title;
  const { userAnswers } = userDocumentExist;

  const pdfbuffer = await new Promise((resolve) => {
    const pdf = new PDFDocument();
    const buffer = [];
    pdf.on('data', buffer.push.bind(buffer));
    pdf.on('end', () => {
      const pdfData = Buffer.concat(buffer);
      resolve(pdfData);
    });
    pdf.pipe(fs.createWriteStream(path.join(pdfFolder, `${userDocumentExist.documentName ?? `Unnamed_${title}`}.pdf`)));

    pdf.fontSize(40).text(`${userDocumentExist.documentName ?? 'Unnamed Document'}`, 100, 100);
    documentQuestions.forEach((obj, i) => {
      pdf.fontSize(25).text(`${obj.order}.  ${obj.question}`);
      if (obj.options.length >= 1 && obj.options[0] !== '') {
        const options = obj.options.join(', ');
        pdf.fontSize(20).text(`options: ${options}`);
      }
      if (typeof(userAnswers[i].answer) === Array) {
        const ans = userAnswers[i].answer.join(', ');
        pdf.fontSize(20).text(`Your answer: ${ans}`);
      }else pdf.fontSize(20).text(`Your answer: ${userAnswers[i].answer}`);
    });
    pdf.end();
  });

  fs.unlinkSync(path.join(pdfFolder, `${userDocumentExist.documentName ?? `Unnamed_${title}`}.pdf`));
  return { pdfbuffer };

  // below will send a media type (whole pdf) as a response;
  // const pdfPath = path.join(pdfFolder, `${userDocumentExist.documentName ?? `Unnamed_${title}`}.pdf`);
  // const pdfExist = fs.createReadStream(pdfPath).on('end', () => fs.unlinkSync(path.join(pdfFolder, `${userDocumentExist.documentName ?? `Unnamed_${title}`}.pdf`)));
  // if (!pdfExist) res.json({ message: 'No such pdf' })
  // if (pdfExist) {
  //   res.writeHead(200, {
  //     'Content-Type': 'application/pdf',
  //     'Content-Disposition': `attachment; filename=${userDocumentExist.documentName ?? `Unnamed_${title}`}.pdf`,
  //     'Content-Transfer-Encoding': 'Binary'
  //   });
  
  //   pdfExist.pipe(res); 
  // }
}

module.exports = {
  createUserDocument,
  updateUserDocument,
  getUserDocument,
  deleteUserDocument,
  getUserDocumentPDFBuffer
};
