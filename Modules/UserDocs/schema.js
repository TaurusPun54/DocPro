/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const {
  Schema,
  model,
  Types: { ObjectId }
} = require('mongoose');
// const { validate } = require('../DocumentTypes/schema');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

function validateDateUpdate (field, value) {
  console.log(field);
  console.log(value);
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  const dateTimeString = new Date(value).toISOString();
  const isValidDateFormat = dateFormatRegex.test(dateTimeString);
  console.log(isValidDateFormat);
  if (this.isNew) return true;
  if ((field === null || field === '' || field === undefined) && isValidDateFormat) return true;
  return false;
}

// get: (createdAt) => createdAt.toLocaleDateString("sp-MX"),
const UserDocsSchema = Schema(
  {
    DocType: { type: ObjectId, ref: 'DocumentType', required: true, immutable: true },
    UserId: { type: ObjectId, ref: 'User', required: true, immutable: true },
    docName: { type: String },
    payload: { type: Object, required: true },
    createdAt: { type: Date, immutable: true },
    editedAt: { type: Date },
    completedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    active: { type: Boolean, default: true }
  },
);

UserDocsSchema.virtual('DocTypeName', {
  ref: 'DocumentType',
  localField: 'DocType',
  foreignField: '_id',
  justOne: true,
  options: { select: 'type' }
});

UserDocsSchema.virtual('questions', {
  ref: 'Question',
  localField: 'DocType',
  foreignField: 'DocType',
  justOne: false,
  // options: { select: '-_id -DocType type question description placeholder min max options expected shape order' },
  // match: { active: true }
})

module.exports = model('UserDoc', UserDocsSchema);
