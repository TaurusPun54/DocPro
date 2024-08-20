const express = require('express');

const router = express.Router();

const RefreshRotation = require('./refreshTokenRotation');

const warpper = require('../Wrapper/wrapper');

router.get('/', warpper(RefreshRotation));

module.exports = router;
