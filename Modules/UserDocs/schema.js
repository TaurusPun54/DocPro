/* eslint-disable max-len */
const {
  Schema,
  model,
  Types: { ObjectId }
} = require('mongoose');

const UserDocsSchema = Schema(
  {
    DocType: { type: ObjectId, ref: 'DocumentType', required: true, immutable: true },
    UserId: { type: ObjectId, ref: 'User', required: true, immutable: true },
    docName: { type: String },
    payload: { type: Object, required: true },
    createdAt: { type: Date, get: (createdAt) => createdAt.toLocaleDateString("sp-MX"), immutable: true },
    editedAt: { type: Date, get: (editedAt) => editedAt.toLocaleDateString("sp-MX") },
    completedAt: { type: Date, get: (completedAt) => completedAt?.toLocaleDateString("sp-MX"), immutable: true },
    paidAt: { type: Date, get: (paidAt) => paidAt?.toLocaleDateString("sp-MX"), immutable: true },
    deletedAt: { type: Date, get: (deletedAt) => deletedAt?.toLocaleDateString("sp-MX") },
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
  options: { select: '-_id -DocType type question options expected shape order' },
  // match: { active: true }
})

module.exports = model('UserDoc', UserDocsSchema);
