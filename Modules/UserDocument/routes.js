/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

// middleware
const Auth = require('../../lib/Auth/accessTokenAuth');

const userDocController = require('./controller');

const warpper = require('../../lib/Wrapper/wrapper');

// create new user doc
router.post('/', Auth.AccAuth, warpper(userDocController.createUserDocument));

// edit existing user doc
router.put('/:userDocumentId([0-9a-fA-F]{24})', Auth.AccAuth, warpper(userDocController.updateUserDocument));

// get existing user doc data
router.get('/', Auth.AccAuth, warpper(userDocController.getUserDocument));

// delete existing user doc
router.delete('/:userDocumentId([0-9a-fA-F]{24})', Auth.AccAuth, warpper(userDocController.deleteUserDocument));

// get paid user doc PDF buffer
router.get('/download', Auth.AccAuth, warpper(userDocController.getUserDocumentPDFBuffer));

module.exports = router;
