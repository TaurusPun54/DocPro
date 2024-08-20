const express = require('express');

const router = express.Router();

const userRoute = require('../../Modules/User/routes');
const docRoute = require('../../Modules/DocumentTypes/routes');
const userDocRoute = require('../../Modules/UserDocs/routes');
const jwtRoute = require('../Auth/routes');

router.use('/jwt', jwtRoute);
router.use('/user', userRoute);
router.use('/document', docRoute);
router.use('/userdoc', userDocRoute);

module.exports = router;
