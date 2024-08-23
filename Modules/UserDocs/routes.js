/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

// middleware
const Auth = require('../../lib/Auth/accessTokenAuth');

const userDocController = require('./controller');

const warpper = require('../../lib/Wrapper/wrapper');

// create new user doc
router.post('/', Auth.AccAuth, warpper(userDocController.createNewUserDoc));

// edit existing user doc
router.put('/:docId([0-9a-fA-F]{24})', Auth.AccAuth, warpper(userDocController.editUserDoc));

// get existing user doc data
router.get('/', Auth.AccAuth, warpper(userDocController.getUserDoc));

// delete existing user doc
router.delete('/:docId([0-9a-fA-F]{24})', Auth.AccAuth, warpper(userDocController.deleteUserDoc));

// get paid user doc PDF buffer
router.get('/download', Auth.AccAuth, warpper(userDocController.getUserDocPDFBuffer));

module.exports = router;
