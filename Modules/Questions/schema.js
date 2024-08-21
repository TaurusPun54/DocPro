/* eslint-disable max-len */
const {
  Schema,
  model,
  Types: { ObjectId }
} = require('mongoose');

const QuestionSchema = new Schema(
  {
    type: { type: String, enum: ['text', 'textarea', 'mc', 'checkbox', 'radio', 'number', 'date', 'textbox'], required: true, immutable: true},
    question: { type: String, required: true, immutable: true},
    description: { type: String },
    placeholder: { type: String },
    options: { type: [{ type: String }], required: true, immutable: true },
    expected: { type: String, immutable: true },
    // only for 'radio' type, expect to get 'Yes' ot 'No'
    min: { type: String },
    max: { type: String },
    shape: { type: Object, required: true, immutable: true },
    DocType: { type: ObjectId, ref:'DocumentType', required: true, immutable: true},
    order: { type: Number, required: true, immutable: true},
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = model('Question', QuestionSchema);
