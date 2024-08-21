/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

// middleware
const Auth = require('../../lib/Auth/accessTokenAuth');

// controllers
const userController = require('./controller');

const RefreshRotation = require('../../lib/Auth/refreshTokenRotation');

const warpper = require('../../lib/Wrapper/wrapper');

// check email valid
router.post('/checkEmail', warpper(userController.checkEmailAvailable));

// sign up
router.post('/signup', warpper(userController.register));

// login
router.post('/login', warpper(userController.login));

// logout
router.post('/logout', Auth.AccAuth, warpper(userController.logout));

// get user data
router.get('/', Auth.AccAuth, warpper(userController.getUserData));

// update user
router.put('/', Auth.AccAuth, warpper(userController.updateUserInfo));

// update user by patch
router.patch('/', Auth.AccAuth, warpper(userController.updateUserInfoByPatch));

// forget and edit password
router.post('/forgetPassword', Auth.AccAuth, warpper(userController.changePassword));

// delete user
router.delete('/', Auth.AccAuth, warpper(userController.deleteUser));

// refresh token rotation
router.get('/refreshTokenRotation', warpper(RefreshRotation));

module.exports = router;
