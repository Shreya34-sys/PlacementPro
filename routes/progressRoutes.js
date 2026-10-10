const express = require('express');
const passport = require('passport');
const progressController = require('../controllers/progressController');

const router = express.Router();
const auth = passport.authenticate('jwt', { session: false });

router.get('/summary', auth, progressController.summary);

module.exports = router;
