/* eslint-disable max-len */
const { Schema, model } = require('mongoose');
const validator = require('../../lib/Validator/validator');

// eslint-disable-next-line no-unused-vars
const ClientErrors = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerErrors = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

// const UserSchema = new Schema(
//   {
//     email: { type: String, required: true, unique: true, immutable: true },
//     password: { type: String, required: true },
//     info: { type: Object },
//     StripeCustomerId: {
//       type: String,
//       default: '',
//       validate: {
//         validator: function(id) {
//           if (validator.isValidStripeCustomerId(id) && !this.isModified('StripeCustomerId')) return true;
//           return false;
//         },
//         message: 'Changes to customer Id is not allowed.'
//       }
//     },
//     refreshToken: { type: String, default: '' },
//     active: { type: Boolean, default: true },
//   }, 
//   { timestamps: true },
// );

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  unformattedEmail: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  info: {
    type: Object,
    default: {
      name: '',
      dob: '',
      gender: ''
    },
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
    required: true,
    immutable: true
  },
  stripeCustomerId: {
    type: String,
    default: '',
    select: false,
    validate: {
      validator: function (value) {
        if (this.isNew) return true;
        if (this.stripeCustomerId === '' && validator.isValidStripeCustomerId(value)) return true;
        return false;
      },
      message: 'stripeCustomerId cannot be updated'
    }
  },
  refreshToken: {
    type: String,
    default: '',
    select: false
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

userSchema.virtual('docs', {
  ref: 'UserDoc',
  localField: '_id',
  foreignField: 'UserId',
  //options: { select: '-DocType' }
})

userSchema.methods.updateInfo = async function(newInfo) {
    Object.keys(newInfo).forEach((key) => {
      this[key] = newInfo[key];
    });
    const updated =  await this.save();
    if(updated) return { message: 'User info updated' };
    return new ServerErrors.InternalServerError('Unknown error, cannot update user info');
}

module.exports = model('User', userSchema);
