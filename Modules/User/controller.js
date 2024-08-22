/* eslint-disable max-len */
// dependencies
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// database
const User = require('./schema');
const DocumentType = require('../DocumentTypes/schema');

// error
const ClientError = require('../../lib/Error/HttpErrors/ClientError/ClientErrors');
const ServerError = require('../../lib/Error/HttpErrors/ServerError/ServerErrors');

// jwt
const jwt = require('../../lib/Auth/jwt');

const checkEmailAvailable = async (req) => {
  const { payload } = req.body;
  if (!payload) return new ClientError.ConflictError('email not valid');
  const { email } = payload;
  if (!email) return new ClientError.ConflictError('email not valid');
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) return new ClientError.ConflictError('email not valid');;
  const emailInUsed = await User.findOne({ email, active: true });
  if (emailInUsed) return new ClientError.ConflictError('email not valid');
  return { message: 'email ok' };
}

const getUserData = async (req) => {
  const { id } = req.user;
  if (!id) return new ClientError.UnauthorizedError('Unknown user');
  const data = await User.findById(id).populate('docs', '-payload -__v');
  // console.log(data);
  const docs = data.docs ?? [];
  
  // docs.filter((doc) => doc.active === true);
  const editable = [];
  const completed = [];
  const paid = [];
  // eslint-disable-next-line no-unused-vars
  const processDocument = async (doc) => {
    const doctype = await DocumentType.findById(doc.DocType.toString());
    const outputDoc = { ...doc._doc, DocType: doctype.type, DocTypeId: doctype._id };
    
    if (doc.paidAt) return outputDoc;
    if (doc.completedAt) return outputDoc;
    
    return outputDoc;
  };
  const filteredAndSearchedDocs = await Promise.all(
    docs.map(async (doc) => {
        if (doc.active === true) {
            // Perform database search for each doc
            const doctype = await DocumentType.findById(doc.DocType);
            // Check additional conditions in the database search result
            if (doctype) {
                return doc; // Return the document if the condition is met
            }
        }
        return null; // Return null for documents that don't meet the condition
    })
  );
  console.log(filteredAndSearchedDocs);
  const filteredDocs = (filteredAndSearchedDocs.filter(doc => doc !== null));
  console.log(filteredDocs)
  // filteredDocs.foreach(async (doc) => {
  //   const doctype = await DocumentType.findById(doc.DocType.toString());
  //   const outputDoc = doctype ? { ...doc._doc, DocType: doctype.type, DocTypeId: doctype._id } : {};
  //   if (outputDoc.paidAt && outputDoc.paidAt !== '') paid.push(outputDoc);
  //   else if (outputDoc.completedAt && outputDoc.completedAt !== '') completed.push(outputDoc);
  //   else editable.push(outputDoc);
  // })
  // console.log(filteredDocs);
  const processedDocs = await Promise.all(filteredDocs.map(async (doc) => {
    //console.log(doc.DocType);
    const doctype = await DocumentType.findById(doc.DocType);
    //console.log(doctype);
    const outputDoc = doctype ? { ...doc._doc, DocType: doctype.type, DocTypeId: doctype._id } : {};
    //console.log(outputDoc);
    
    // if (doc.paidAt !== '') return outputDoc;
    // if (doc.completedAt !== '') return outputDoc;
    
    return outputDoc;
  }));
  // console.log(processedDocs);
  processedDocs.forEach((outputDoc) => {
    if (outputDoc.paidAt && outputDoc.paidAt !== '') paid.push(outputDoc);
    else if (outputDoc.completedAt && outputDoc.completedAt !== '') completed.push(outputDoc);
    else editable.push(outputDoc);
  });
  // console.log(editable)
  const output = { ...data._doc };
  output.userDocs = {
    totalUserDocsCount: editable.length + completed.length + paid.length,
    paidUserDocsCount: paid.length,
    editable,
    completed,
    paid
  }
  return { data: output  };
}

const updateUserInfo = async (req) => {
  const { id } = req.user;
  const { payload } = req.body;
  if (!id || !payload) return new ClientError.BadRequestError('Missing data for update');
  const update = await User.findByIdAndUpdate(id, { $set: { info: payload } });
  if (update) return { message: 'user info updated' };
  return new ServerError.InternalServerError('update fail, try again');
}

const updateUserInfoByPatch = async (req) => {
  const { id } = req.user;
  const { payload } = req.body;
  if (!id || !payload) return new ClientError.BadRequestError('Missing data for update');
  const keys = Object.keys(payload);
  const user = await User.findById(id);
  if (!user) return new ClientError.NotFoundError('User not found');
  try {
    for (const prop of keys) {
      const updateField = {};
      updateField[`info.${prop}`] = payload[prop];
  
      await User.findByIdAndUpdate(id, { $set: updateField });
    }
    return { message: 'user info updated' };
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return new ServerError.InternalServerError('Update failed, please try again');
  }
};

const changePassword = async (req) => {
  const { id } = req.user;
  const { payload } = req.body;
  if (!id || !payload) return new ClientError.BadRequestError('cannot change password');

  const { currentPassword, newPassword } = payload;
  if (!currentPassword || !newPassword) return new ClientError.BadRequestError('Password required');

  const user = await User.findById(id, { active: true }).select('password');
  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) return new ClientError.UnauthorizedError('current Password not match');

  const passwordRegex = /^(?=.*\d)(?=.*[-_!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;
  if (!passwordRegex.test(newPassword)) return new ClientError.BadRequestError('New password not valid');

  const newpassword = await bcrypt.hash(newPassword, 10);
  const changePasswordSuccess = await User.findByIdAndUpdate(id, { $set: { password: newpassword } });
  if (changePasswordSuccess) return { message: 'Password changed' };
  return new ServerError.InternalServerError('change password fail, please try again');
}

const deleteUser = async (req) => {
  const { id } = req.user;
  await User.findByIdAndUpdate(id, { active: false, refreshToken: '' });
  return { message: 'User deleted' };
}

const register = async (req) => {
  const requiredKeys = ['email', 'password'];

  const incomeKeys = Object.keys(req.body);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new ClientError.BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const passwordRegex = /^(?=.*\d)(?=.*[-_!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;

  const { email, password, info } = req.body;

  if (!emailRegex.test(email)) return new ClientError.BadRequestError('Not a valid email');
  if (!passwordRegex.test(password)) return new ClientError.BadRequestError('Not a valid password format');

  const emailInUsed = await User.findOne({ email });
  if (emailInUsed) return new ClientError.UnauthorizedError('This email is already registered');
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    email,
    password: hashedPassword,
    info: info ?? {},
    role: 'user'
  })
  const user = await newUser.save();
  const randomString = crypto.randomBytes(64).toString('hex');

  const authPayload = {
    id: user._id,
    randomString
  }
  const acctoken = jwt.signacc(authPayload);
  const reftoken = jwt.signref(authPayload);
  const data = {
    id: user._id,
    customerId: user.stripeCustomerId ?? '',
    email: user.email,
    info: user.info,
    accessToken: acctoken,
    refreshToken: reftoken
  }
  return { message: 'sign up success', data };
};

// eslint-disable-next-line no-unused-vars
const login = async (req, res) => {
  const requiredKeys = ['email', 'password'];
  const incomeKeys = Object.keys(req.body);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new ClientError.BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  const { email, password } = req.body;
  if (!emailRegex.test(email)) return new ClientError.UnauthorizedError('login fail, email or password not valid');
  const userExist = await User.findOne({ email, active: true }).select('_id email password stripeCustomerId refreshtoken info');
  if (!userExist) return new ClientError.UnauthorizedError('login fail, email or password not valid');
  const passwordMatch = await bcrypt.compare(password, userExist.password);
  if (!passwordMatch) return new ClientError.UnauthorizedError('login fail, email or password not valid');

  const randomString = crypto.randomBytes(64).toString('hex');

  const authPayload = {
    id: userExist?._id,
    randomString
  }
  const acctoken = jwt.signacc(authPayload);
  const reftoken = jwt.signref(authPayload);
  const loginSuccess = await User.findByIdAndUpdate(userExist._id, { refreshToken: reftoken });
  if (loginSuccess) {
    const data = {
      id: userExist._id,
      customerId: userExist.stripeCustomerId ?? '',
      email: userExist.email,
      info: userExist.info,
      accessToken: acctoken,
      refreshToken: reftoken
    }
    // res.cookie('user', { acctoken, reftoken }, { maxAge: 900000, httpOnly: true });
    return {
      message: 'login success',
      data
    }
  }
  return new ServerError.InternalServerError('login fail, please try again');
}

const logout = async (req) => {
  const { id } = req.user;
  const logout = await User.findByIdAndUpdate(id, { $set: { refreshToken: '' } });
  if (logout) return { message: 'logout success' };
  return new ServerError.InternalServerError('logout fail, try again');
}


module.exports = {
  register,
  login,
  logout,
  updateUserInfo,
  updateUserInfoByPatch,
  changePassword,
  deleteUser,
  checkEmailAvailable,
  getUserData
};
