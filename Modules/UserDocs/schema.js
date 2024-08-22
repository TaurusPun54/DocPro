/* eslint-disable max-len */
const {
  Schema,
  model,
  Types: { ObjectId }
} = require('mongoose');
// const { validate } = require('../DocumentTypes/schema');

function validateDateUpdate (field, value) {
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}\+\d{2}:\d{2}$/;
  const isValidDateFormat = dateFormatRegex.test(value);
  if (this.isNew) return true;
  if (field === '' && isValidDateFormat) return true;
  return false;
}

const UserDocsSchema = Schema(
  {
    DocType: { type: ObjectId, ref: 'DocumentType', required: true, immutable: true },
    UserId: { type: ObjectId, ref: 'User', required: true, immutable: true },
    docName: { type: String },
    payload: { type: Object, required: true },
    createdAt: { type: Date, get: (createdAt) => createdAt.toLocaleDateString("sp-MX"), immutable: true },
    editedAt: { type: Date, get: (editedAt) => editedAt.toLocaleDateString("sp-MX") },
    completedAt: { type: Date, default: '', get: (completedAt) => completedAt?.toLocaleDateString("sp-MX"), validate: { validator: function(value) {
      return validateDateUpdate(this.completedAt, value);
    }, message: 'completedAt should not be updated after set' } },
    paidAt: { type: Date, default: '', get: (paidAt) => paidAt?.toLocaleDateString("sp-MX"), validate: { validator: function(value) {
      return validateDateUpdate(this.completedAt, value);
    }, message: 'paidAtAt should not be updated after set' } },
    deletedAt: { type: Date, default: '', get: (deletedAt) => deletedAt?.toLocaleDateString("sp-MX"), validate: { validator: function(value) {
      return validateDateUpdate(this.completedAt, value);
    }, message: 'deletedAt should not be updated after set' } },
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
