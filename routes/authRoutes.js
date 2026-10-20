// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const cvisualizeAuth = require('../controllers/cvisualizeAuthController');
const { verifyToken } = require('../middleware/authMiddleware');

// Standard Auth Endpoints
router.post('/signup', authController.signup);
router.post('/student-login', authController.studentLogin);
router.post('/admin-login', authController.adminLogin);
router.post('/admin-magic-link', authController.adminMagicLink);
router.get('/verify-magic', authController.verifyMagic);

// C-Visualize and API compatibility
router.post('/register', (req, res) => cvisualizeAuth.register(req, res));
router.post('/login', (req, res) => cvisualizeAuth.login(req, res));
router.post('/logout', (req, res) => cvisualizeAuth.logout(req, res));
router.get('/me', verifyToken, (req, res) => cvisualizeAuth.me(req, res));

// Google OAuth
const isGoogleAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

router.get(
    '/google',
    (req, res, next) => {
        if (!isGoogleAuthConfigured) {
            if (req.accepts('html')) {
                return res.redirect('/login?error=' + encodeURIComponent('Google login is currently unavailable. Please sign in with your email and password.'));
            }
            return res.status(503).json({
                success: false,
                message: 'Google login is currently unavailable. Please sign in with your email and password.'
            });
        }
        return passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false
        })(req, res, next);
    }
);

router.get(
    '/google/callback',
    (req, res, next) => {
        if (!isGoogleAuthConfigured) {
            return res.redirect('/login?error=' + encodeURIComponent('Google authentication is not configured.'));
        }
        return passport.authenticate('google', {
            session: false,
            failureRedirect: '/login?googleError=1'
        })(req, res, next);
    },
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

            // ADMIN GOOGLE LOGIN
            if (
                req.user.role === 'admin' ||
                req.user.role === 'ADMIN' ||
                req.user.email === process.env.ADMIN_EMAIL
            ) {
                console.log('Google Admin login:', req.user.email);
                const adminPort = process.env.ADMIN_PORT || 5001;
                const adminRedirect = process.env.VERCEL
                    ? `/admin-dashboard?token=${encodeURIComponent(token)}&type=admin`
                    : `http://localhost:${adminPort}/admin-dashboard?token=${encodeURIComponent(token)}&type=admin`;
                return res.redirect(adminRedirect);
            }

            // STUDENT GOOGLE LOGIN
            console.log('Google Student login:', req.user.email);
            const studentPort = process.env.STUDENT_PORT || process.env.PORT || 5000;
            const studentRedirect = process.env.VERCEL
                ? `/dashboard?token=${encodeURIComponent(token)}&type=student`
                : `http://localhost:${studentPort}/dashboard?token=${encodeURIComponent(token)}&type=student`;
            return res.redirect(studentRedirect);

        } catch (error) {
            console.error('GOOGLE CALLBACK ERROR:', error);
            return res.status(500).send(
                'Google authentication callback failed.'
            );
        }
    }
);

module.exports = router;
