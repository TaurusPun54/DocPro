/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

// middleware
const Auth = require('../../lib/Auth/accessTokenAuth');

const docController = require('./controller');

const warpper = require('../../lib/Wrapper/wrapper');

// create new doc
router.post('/', Auth.AccAuth, warpper(docController.createNewDocument));

// get doc with questions
router.get('/', Auth.AccAuth, warpper(docController.getDocument)) //:id([0-9a-fA-F]{24})?

module.exports = router;
