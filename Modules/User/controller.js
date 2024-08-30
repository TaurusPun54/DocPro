/* eslint-disable max-len */
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = require('./schema');
const UserDocument = require('../UserDocument/schema');
const jwt = require('../../lib/Auth/jwt');

const { BadRequestError, UnauthorizedError, NotFoundError, ConflictError, InternalServerError } = require('../../lib/Error/HttpErrors/index');

const checkEmailAvailable = async (req) => {
  const { email } = req.body;
  // eslint-disable-next-line no-useless-escape
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!email || !emailRegex.test(email)) return new BadRequestError('email not valid');
  const emailInUsed = await User.findOne({ email: email.toLowerCase() });
  if (emailInUsed) return new ConflictError('email not valid');
  return { message: 'success' };
}

const getUserData = async (req) => {
  const { id } = req.user;
  if (!id) return new UnauthorizedError('Unknown user');
  const data = await User.findById(id);
  const docs = data.docs ?? [];
  
  // docs.filter((doc) => doc.active === true);
  const editable = [];
  const completed = [];
  const paid = [];
  // const processDocument = async (doc) => {
  //   const doctype = await DocumentType.findById(doc.DocType.toString());
  //   const outputDoc = { ...doc._doc, DocType: doctype.type, DocTypeId: doctype._id };
    
  //   if (doc.paidAt) return outputDoc;
  //   if (doc.completedAt) return outputDoc;
    
  //   return outputDoc;
  // };
  const filteredAndSearchedDocs = await Promise.all(
    docs.map(async (doc) => {
        if (doc.active === true) {
            // Perform database search for each doc
            const doctype = await Document.findById(doc.DocType);
            // Check additional conditions in the database search result
            if (doctype) {
                return doc; // Return the document if the condition is met
            }
        }
        return null; // Return null for documents that don't meet the condition
    })
  );
  //console.log(filteredAndSearchedDocs);
  const filteredDocs = (filteredAndSearchedDocs.filter(doc => doc !== null));
  // console.log(filteredDocs)
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
    const doctype = await Document.findById(doc.DocType);
    //console.log(doctype);
    const outputDoc = { ...doc._doc, DocType: doctype.type, DocTypeId: doctype._id };
    //console.log(outputDoc);
    
    // if (doc.paidAt !== '') return outputDoc;
    // if (doc.completedAt !== '') return outputDoc;
    
    return outputDoc;
  }));
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
  return data;
}

const updateUserInfo = async (req) => {
  const { id } = req.user;
  const info = req.body;
  const requiredKeys = ['name', 'dob', 'gender'];
  const incomeKeys = Object.keys(info);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  const update = await User.findByIdAndUpdate(id, { $set: { info } });
  if (update) return { message: 'success' };
  return new InternalServerError('update fail, try again');
}

const updateUserInfoByPatch = async (req) => {
  const { id } = req.user;
  const { payload } = req.body;
  if (!id || !payload) return new BadRequestError('Missing data for update');
  const keys = Object.keys(payload);
  const user = await User.findById(id);
  if (!user) return new NotFoundError('User not found');
  try {
    for (const prop of keys) {
      const updateField = {};
      updateField[`info.${prop}`] = payload[prop];
  
      await User.findByIdAndUpdate(id, { $set: updateField });
    }
    return { message: 'user info updated' };
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return new InternalServerError('Update failed, please try again');
  }
};

const changePassword = async (req) => {
  const { id } = req.user;

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return new BadRequestError('Password required');

  const user = await User.findById(id, { active: true }).select('password');
  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) return new BadRequestError('current Password not match');

  const passwordRegex = /^(?=.*\d)(?=.*[-_!@#$%^&?*])(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;
  if (!passwordRegex.test(newPassword) || newPassword === currentPassword) return new BadRequestError('New password not valid');

  const newpassword = await bcrypt.hash(newPassword, 10);
  const changePasswordSuccess = await User.findByIdAndUpdate(id, { $set: { password: newpassword } });
  if (changePasswordSuccess) return { message: 'success' };
  return new InternalServerError('change password fail, please try again');
}

const deleteUser = async (req) => {
  const { id } = req.user;
  await User.findByIdAndUpdate(id, { active: false, refreshToken: '' });
  await UserDocument.updateMany({ UserId: id }, { active: false });
  return { message: 'success' };
}

const register = async (req) => {
  const requiredKeys = ['email', 'password'];

  const incomeKeys = Object.keys(req.body);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  // eslint-disable-next-line no-useless-escape
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const passwordRegex = /^(?=.*\d)(?=.*[-_!@#$%^&?*])(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;

  const { email, password, info } = req.body;

  if (!emailRegex.test(email)) return new BadRequestError('Not a valid email');
  if (!passwordRegex.test(password)) return new BadRequestError('Not a valid password');

  const emailInUsed = await User.findOne({ email: email.toLowerCase() });
  if (emailInUsed) return new ConflictError('This email is already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    info: {
      name: info.name || '',
      dob: info.dob || '',
      gender: info.gender || ''
    },
    role: 'user'
  })
  await newUser.save();
  return { message: 'success' };
};

// eslint-disable-next-line no-unused-vars
const login = async (req, res) => {
  const requiredKeys = ['email', 'password'];
  const incomeKeys = Object.keys(req.body);
  const missingKeys = requiredKeys.filter((field) => !incomeKeys.includes(field));
  if (missingKeys.length > 0) return new BadRequestError(`Missing required data: ${missingKeys.join(', ')}`);

  // eslint-disable-next-line no-useless-escape
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const { email, password } = req.body;
  if (!emailRegex.test(email)) return new BadRequestError('login fail, email or password not valid');

  const userExist = await User.findOne({ email: email.toLowerCase(), active: true }).select('_id email password stripeCustomerId refreshtoken info');
  if (!userExist) return new UnauthorizedError('login fail, email or password not valid');
  const passwordMatch = await bcrypt.compare(password, userExist.password);
  if (!passwordMatch) return new UnauthorizedError('login fail, email or password not valid');

  const randomString = crypto.randomBytes(64).toString('hex');

  const authPayload = {
    id: userExist?._id,
    stripeCustomerId: userExist.stripeCustomerId ?? '',
    email: userExist.email,
    randomString
  }
  const acctoken = jwt.signacc(authPayload);
  const reftoken = jwt.signref(authPayload);
  const loginSuccess = await User.findByIdAndUpdate(userExist._id, { refreshToken: reftoken });
  if (loginSuccess) {
    // res.cookie('user', { acctoken, reftoken }, { maxAge: 900000, httpOnly: true });
    return { accessToken: acctoken, refreshToken: reftoken };
  }
  return new InternalServerError('login fail, please try again');
}

const logout = async (req) => {
  const { id } = req.user;
  const logout = await User.findByIdAndUpdate(id, { $set: { refreshToken: '' } });
  if (logout) return { message: 'logout success' };
  return new InternalServerError('logout fail, try again');
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
  getUserData,
};
