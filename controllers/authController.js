

// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


transporter.verify((error, success) => {
    if (error) {
        console.error('❌ GMAIL SMTP ERROR:', error);
    } else {
        console.log('✅ GMAIL SMTP CONNECTION SUCCESSFUL');
    }
});

// Helper function to safely extract inserted ID from MySQL result formats
const getInsertedId = (result) => {
    if (!result) return null;
    return result.id || result.insertId || (Array.isArray(result) && result[0]?.insertId);
};

exports.signup = async (req, res) => {
    try {
        const { name, fullName, email, password } = req.body;
        const studentName = name || fullName;

        if (!studentName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await User.createStudent({
            fullName: studentName,
            email,
            password: hashedPassword
        });

        const userId = getInsertedId(result);
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

        const token = jwt.sign(
            { id: userId, email, role: 'student' },
            secret,
            { expiresIn: '1d' }
        );

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter.sendMail({
                from: `"PlacementPro" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Welcome to PlacementPro!',
                text: `Hello ${studentName},\n\nWelcome to PlacementPro!`
            }).catch(err => console.error('Email sending failed (non-critical):', err));
        }

        return res.status(201).json({
            success: true,
            token,
            redirect: '/dashboard',
            message: 'Account created successfully!'
        });

    } catch (error) {
        console.error('CRITICAL SIGNUP ERROR:', error.stack || error);
        return res.status(500).json({ message: 'Server error during signup.', error: error.message });
    }
};

exports.studentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findByEmail(email);

        if (!user || user.role !== 'student') {
            return res.status(400).json({ message: 'Invalid student credentials.' });
        }

        if (!user.password) {
            return res.status(400).json({
                message: 'This account was created using Google. Please log in with Google.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid student credentials.' });
        }

        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            secret,
            { expiresIn: '1d' }
        );

        return res.status(200).json({ token, redirect: '/dashboard' });

    } catch (error) {
        console.error('CRITICAL LOGIN ERROR:', error.stack || error);
        return res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findByEmail(email);

        if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
            return res.status(403).json({ message: 'Access denied: Invalid Admin Credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(403).json({ message: 'Access denied: Invalid Admin Credentials.' });
        }

        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.fullName, role: 'admin' },
            secret,
            { expiresIn: '1d' }
        );

        return res.json({
            token,
            redirect: '/admin-dashboard',
            admin: { id: user.id, name: user.fullName, email: user.email }
        });
    } catch (error) {
        console.error('ADMIN LOGIN ERROR:', error);
        return res.status(500).json({ message: 'Server error during admin login.' });
    }
};

exports.adminMagicLink = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);

        if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
            return res.status(403).json({ message: 'Access denied for this email address.' });
        }

        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
        const magicToken = jwt.sign(
            { id: user.id, email: user.email, role: 'admin' },
            secret,
            { expiresIn: '15m' }
        );
        
        const port = process.env.PORT || 5000;
        const magicLink = `http://localhost:${port}/api/auth/verify-magic?token=${magicToken}`;

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: `"PlacementPro Admin" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Admin Magic Login Link',
                html: `<p>Click the link below to log in as Admin:</p><a href="${magicLink}">Login to Admin Dashboard</a>`
            });
        }

        return res.json({ message: 'Magic link dispatched to admin email.' });
    } catch (error) {
        console.error('MAGIC LINK ERROR:', error);
        return res.status(500).json({ message: 'Failed to send magic link.' });
    }
};


exports.verifyMagic = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Magic link token is missing.');
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

        // Verify token and expiration
        const decoded = jwt.verify(token, secret);

        // Token itself must contain admin role
        if (decoded.role !== 'admin') {
            return res.status(403).send('Unauthorized access.');
        }

        // Verify the user still exists in database
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(403).send('Admin account not found.');
        }

        // Verify database role
        if (user.role !== 'admin' && user.role !== 'ADMIN') {
            return res.status(403).send('Access denied. Admin rights required.');
        }

        // Everything is valid
        return res.redirect(
            `/admin-dashboard?token=${encodeURIComponent(token)}&type=admin`
        );

    } catch (err) {

        console.error('MAGIC TOKEN VERIFICATION ERROR:', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(400).send(
                'This magic link has expired. Please request a new one.'
            );
        }

        return res.status(400).send(
            'Invalid magic link.'
        );
    }
};














// Difference between password and user.password?
// password: The plain-text string typed by the user in the login form (e.g., "Pass@123").

// user.password: The secure, hashed string retrieved from your MySQL database (e.g., "$2b$10$e89b12d3...").

// bcrypt.compare(password, user.password) checks if the plain input matches the stored hash.

// 6. Difference between id vs user.id and password vs user.password?
// id / password: Local variables in your current function (usually representing incoming request data).

// user.id / user.password: Properties attached to the user object returned from your database model (SELECT * FROM users).







// Can we store multiple admins in .env using curly braces {}?
// No. .env files only read plain key-value text strings. You cannot store native JavaScript objects or sets in .env.

// Correct Alternatives:

// Comma-Separated String in .env:

// Code snippet
// ADMIN_EMAILS=admin1@app.com,admin2@app.com
// In code: process.env.ADMIN_EMAILS.split(',').includes(email)

// Database Role (Best Practice): Store users in MySQL and set their role column to 'admin'





// Code Range,Meaning,Common Examples
// 2xx (Success),Request succeeded,"200 OK, 201 Created"
// 4xx (Client Error),The user/frontend made a mistake,"400 Bad Request, 401 Unauthorized (missing token), 403 Forbidden (wrong role), 404 Not Found"
// 5xx (Server Error),Backend crash or database failure,500 Internal Server Error



// What are req, res, and req.body?
// req (Request): The incoming HTTP object containing headers, parameters, and client data.

// res (Response): The outgoing HTTP object used to send data/HTML back to the client (res.json(), res.status()).

// req.body: The parsed JSON object containing data submitted by the frontend form (e.g., { email, password }).





//Where are generated JWT tokens stored?Generation: Tokens are signed exclusively on the Backend (Node.js) using process.env.JWT_SECRET.Storage: Once sent to the user, tokens are stored on the user's device (Frontend) inside browser localStorage:Location in Browser: Press F12 in Chrome $\rightarrow$ Application tab $\rightarrow$ Local Storage $\rightarrow$ http://localhost:5000. You will see the key token with its JWT string value.