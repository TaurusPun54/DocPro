/* eslint-disable max-len */
const {
  Schema,
  model,
  Types: { ObjectId }
} = require('mongoose');

const validator = require('../../lib/Validator/validator')

const UserDocumentSchema = Schema(
  {
    DocumentId: { type: ObjectId, ref: 'Document', required: true, immutable: true },
    UserId: { type: ObjectId, ref: 'User', required: true, immutable: true },
    documentName: { type: String, required: true },
    userAnswers: { type: [{
      questionId: { type: ObjectId, ref:'Question', required: true, immutable: true },
      answer: { type: Schema.Types.Mixed, required: true }
    }], required: true },
    createdAt: { type: Date, required: true, immutable: true },
    editedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null, validate: {
      validator: function(value) {
      if (this.isNew) return true;
      return validator.isValidateDateUpdate(this.completedAt, value)
    }, message: 'completedAt should not be updated after set' },
  },
    paidAt: { type: Date, default: null, validate: {
      validator: function(value) {
      if (this.isNew) return true;
      return validator.isValidateDateUpdate(this.paidAt, value)
    }, message: 'paidAt should not be updated after set' },
  },
    deletedAt: { type: Date, default: null, validate: {
      validator: function(value) {
      if (this.isNew) return true;
      return validator.isValidateDateUpdate(this.deletedAt, value)
    }, message: 'deletedAt should not be updated after set' },
  },
    active: { type: Boolean, default: true }
  },
);

UserDocumentSchema.virtual('title', {
  ref: 'Document',
  localField: 'DocumentId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'title' }
});

UserDocumentSchema.virtual('questions', {
  ref: 'Question',
  localField: 'DocumentId',
  foreignField: 'DocumentId',
  justOne: false,
  // options: { select: '-_id -DocType type question description placeholder min max options expected shape order' },
  // match: { active: true }
})

module.exports = model('UserDocument', UserDocumentSchema);
