/* eslint-disable max-len */
const {
  Schema,
  model,
  Types: { ObjectId }
} = require('mongoose');

const QuestionSchema = new Schema(
  {
    type: { type: String, enum: ['text', 'textarea', 'textbox', 'mc', 'checkbox', 'radio', 'number', 'date'], required: true, immutable: true},
    question: { type: String, required: true, immutable: true},
    description: { type: String },
    placeholder: { type: String },
    options: { type: [{ type: String }], required: true, immutable: true },
    shape: { type: Object, required: true, immutable: true },
    DocumentId: { type: ObjectId, ref:'Document', required: true, immutable: true},
    order: { type: Number, required: true, immutable: true},
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = model('Question', QuestionSchema);
