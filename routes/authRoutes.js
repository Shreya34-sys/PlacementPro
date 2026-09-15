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


// Google OAuth
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);



router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/login?googleError=1'
    }),
    (req, res) => {

        try {

            const secret = process.env.JWT_SECRET;

            if (!secret) {
                console.error('JWT_SECRET is missing from .env');
                return res.status(500).send('Server configuration error.');
            }

            console.log('Google callback user:', req.user);

            const token = jwt.sign(
                {
                    id: req.user.id,
                    role: req.user.role,
                    email: req.user.email
                },
                secret,
                {
                    expiresIn: '1d'
                }
            );

            // ==========================================
            // ADMIN GOOGLE LOGIN
            // ==========================================
            if (
                req.user.role === 'admin' ||
                req.user.role === 'ADMIN' ||
                req.user.email === process.env.ADMIN_EMAIL
            ) {

                console.log('Google Admin login:', req.user.email);

                return res.redirect(
                    `/admin-dashboard?token=${encodeURIComponent(token)}&type=admin`
                );
            }

            // ==========================================
            // STUDENT GOOGLE LOGIN
            // ==========================================
            console.log('Google Student login:', req.user.email);

            return res.redirect(
                `/dashboard?token=${encodeURIComponent(token)}&type=student`
            );

        } catch (error) {

            console.error('GOOGLE CALLBACK ERROR:', error);

            return res.status(500).send(
                'Google authentication callback failed.'
            );
        }
    }
);

module.exports = router;