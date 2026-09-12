// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const authController = require('../controllers/authController');

// Standard Auth Endpoints
router.post('/signup', authController.signup);
router.post('/student-login', authController.studentLogin);
router.post('/admin-login', authController.adminLogin);
router.post('/admin-magic-link', authController.adminMagicLink);
router.get('/verify-magic', authController.verifyMagic);

// Google OAuth (Pure Stateless JWT Flow)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // Issue JWT token on successful Google Auth
        const token = jwt.sign(
            { id: req.user.id, role: req.user.role, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Redirect with token attached so frontend script can capture it
        if (req.user.email === process.env.ADMIN_EMAIL) {
            res.redirect(`/admin-dashboard?token=${token}`);
        } else {
            res.redirect(`/dashboard?token=${token}`);
        }
    }
);

module.exports = router;