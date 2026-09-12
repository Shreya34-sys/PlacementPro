// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
// const User = require('../models/userModel');

// // Email Transporter setup
// const transporter = nodemailer.createTransport({   //Initializes your Nodemailer email engine using your Gmail credentials stored in .env.
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });



// exports.signup = async (req, res) => {
//     try {
//         const { name, fullName, email, password } = req.body;  //Destructures values sent from the frontend form. Sets studentName to whichever field contains the value (name or fullName).
//         const studentName = name || fullName;

//         if (!studentName || !email || !password) {  
//             return res.status(400).json({ message: 'All fields are required.' });
//         }

//         const existingUser = await User.findByEmail(email);    
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists with this email.' });  ////Queries MySQL to verify the email isn't already registered.
//         }

//         const hashedPassword = await bcrypt.hash(password, 10); ////Hashes the plain-text password with a cost factor of 10 rounds before storing it.
        
//         // Create user in DB
//         const result = await User.createStudent({   //Invokes userModel.js to write the new user record to MySQL.
//             fullName: studentName,
//             email,
//             password: hashedPassword
//         });

//         // Resolve user ID safely depending on whether ORM or mysql2/promise is used
//         const userId = result.id || result.insertId || result[0]?.insertId;

//         // Ensure JWT Secret exists
//         const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

//         // Sign Token
//         const token = jwt.sign(         //Creates a signed JWT token containing the user's ID and role, expiring in 24 hours.
//             { id: userId, role: 'student', email },
//             secret,
//             { expiresIn: '1d' }
//         );

//         // Send Email (Non-blocking catch)
//         if (typeof transporter !== 'undefined' && transporter) {    //Dispatches a welcome email. .catch() prevents an email delivery error from crashing the registration HTTP response.
//             transporter.sendMail({
//                 from: `"PlacementPro" <${process.env.EMAIL_USER}>`,
//                 to: email,
//                 subject: 'Welcome to PlacementPro!',
//                 text: `Hello ${studentName},\n\nWelcome to PlacementPro!`
//             }).catch(err => console.error('Email sending failed (non-critical):', err));
//         }

//         return res.status(201).json({       //Returns a 201 Created JSON payload with the authentication token and dashboard redirect path.
//             success: true,
//             token, 
//             redirect: '/dashboard',
//             message: 'Account created successfully!' 
//         });

//     } catch (error) {
//         // Detailed server logging for debugging
//         console.error('CRITICAL SIGNUP ERROR:', error.stack || error);
//         return res.status(500).json({ message: 'Server error during signup.', error: error.message });
//     }   //Handles unhandled runtime exceptions with a 500 Internal Server Error.
// };


// exports.studentLogin = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({ message: 'Email and password are required.' });
//         }

//         const user = await User.findByEmail(email);
        
//         // 1. Check if user exists and is a student
//         if (!user || user.role !== 'student') {
//             return res.status(400).json({ message: 'Invalid student credentials.' });
//         }

//         // 2. Prevent crash if user registered via Google OAuth (password is NULL)
//         if (!user.password) {
//             return res.status(400).json({ 
//                 message: 'This account was created using Google. Please log in with Google.' 
//             });
//         }

//         // 3. Compare hashed password safely
//         const isMatch = await bcrypt.compare(password, user.password);  //Validates the input password against the stored bcrypt hash.
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid student credentials.' });
//         }

//         // 4. Fallback for JWT secret
//         const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

//         const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '1d' });
        
//         return res.status(200).json({ token, redirect: '/dashboard' });   //Signs a fresh 24-hour JWT token and returns it alongside the client redirect path.

//     } catch (error) {
//         console.error('CRITICAL LOGIN ERROR:', error.stack || error);
//         return res.status(500).json({ message: 'Server error during login.', error: error.message });
//     }
// };

// // exports.adminLogin = async (req, res) => {
// //     try {
// //         const { email, password } = req.body;

// //         if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
// //             return res.status(403).json({ message: 'Unauthorized: Invalid Admin Credentials.' });
// //         }

// //         const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
// //         res.json({ token, redirect: '/admin-dashboard' });
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server error during admin login.' });
// //     }
// // };

// // exports.adminMagicLink = async (req, res) => {
// //     try {
// //         const { email } = req.body;
// //         if (email !== process.env.ADMIN_EMAIL) {
// //             return res.status(403).json({ message: 'Access denied for this email address.' });
// //         }

// //         const magicToken = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '15m' });
// //         const magicLink = `http://localhost:${process.env.PORT}/api/auth/verify-magic?token=${magicToken}`;

// //         await transporter.sendMail({
// //             from: `"PlacementPro Admin" <${process.env.EMAIL_USER}>`,
// //             to: email,
// //             subject: 'Admin Magic Login Link',
// //             html: `<p>Click the link below to log in as Admin:</p><a href="${magicLink}">Login to Admin Dashboard</a>`
// //         });

// //         res.json({ message: 'Magic link dispatched to admin email.' });
// //     } catch (error) {
// //         res.status(500).json({ message: 'Failed to send magic link.' });
// //     }
// // };

// exports.adminLogin = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({ message: 'Email and password are required.' });
//         }

//         // Fetch user from MySQL
//         const user = await User.findByEmail(email);

//         // Verify user exists and holds admin privileges
//         if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
//             return res.status(403).json({ message: 'Access denied: Invalid Admin Credentials.' });
//         }

//         // Verify password hash
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(403).json({ message: 'Access denied: Invalid Admin Credentials.' });
//         }

//         const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

//         // Sign JWT payload with explicit ID, email, and admin role
//         const token = jwt.sign(
//             { id: user.id, email: user.email, name: user.fullName, role: 'admin' }, 
//             secret, 
//             { expiresIn: '1d' }
//         );

//         res.json({ 
//             token, 
//             redirect: '/admin-dashboard',
//             admin: { id: user.id, name: user.fullName, email: user.email } 
//         });
//     } catch (error) {
//         console.error('ADMIN LOGIN ERROR:', error);
//         res.status(500).json({ message: 'Server error during admin login.' });
//     }
// };

// exports.adminMagicLink = async (req, res) => {
//     try {
//         const { email } = req.body;
//         const user = await User.findByEmail(email);

//         if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
//             return res.status(403).json({ message: 'Access denied for this email address.' });
//         }

//         const magicToken = jwt.sign(
//             { id: user.id, email: user.email, role: 'admin' }, 
//             process.env.JWT_SECRET, 
//             { expiresIn: '15m' }
//         );
//         const magicLink = `http://localhost:${process.env.PORT}/api/auth/verify-magic?token=${magicToken}`;

//         await transporter.sendMail({
//             from: `"PlacementPro Admin" <${process.env.EMAIL_USER}>`,
//             to: email,
//             subject: 'Admin Magic Login Link',
//             html: `<p>Click the link below to log in as Admin:</p><a href="${magicLink}">Login to Admin Dashboard</a>`
//         });

//         res.json({ message: 'Magic link dispatched to admin email.' });
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to send magic link.' });
//     }
// };






















// // Add/Replace exports.verifyMagic inside controllers/authController.js
// exports.verifyMagic = (req, res) => {
//     const { token } = req.query;
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         if (decoded.role === 'admin') {
//             // PASS THE TOKEN IN THE REDIRECT QUERY PARAMETER
//             res.redirect(`/admin-dashboard?token=${token}`);
//         } else {
//             res.status(403).send('Unauthorized Token.');
//         }
//     } catch (err) {
//         res.status(400).send('Invalid or expired magic link.');
//     }
// };








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

exports.verifyMagic = (req, res) => {
    const { token } = req.query;
    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
        const decoded = jwt.verify(token, secret);
        
        if (decoded.role === 'admin') {
            return res.redirect(`/admin-dashboard?token=${token}`);
        } else {
            return res.status(403).send('Unauthorized Token.');
        }
    } catch (err) {
        return res.status(400).send('Invalid or expired magic link.');
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