/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

// middleware
const Auth = require('../../lib/Auth/accessTokenAuth');

const docController = require('./controller');

const warpper = require('../../lib/Wrapper/wrapper');

// create new doc
router.post('/', Auth.AccAuth, warpper(docController.createNewDoc));

// get doc with questions
router.get('/', Auth.AccAuth, warpper(docController.getDoc)) //:id([0-9a-fA-F]{24})?

module.exports = router;
