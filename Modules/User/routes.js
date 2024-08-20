/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

// middleware
const Auth = require('../../lib/Auth/accessTokenAuth');

// controllers
const userController = require('./controller');

const warpper = require('../../lib/Wrapper/wrapper');

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

// delete user
router.delete('/', Auth.AccAuth, warpper(userController.deleteUser));

module.exports = router;
