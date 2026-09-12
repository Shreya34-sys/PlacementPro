// routes/viewRoutes.js
const express = require('express');
const path = require('path'); //Imports Node.js’s built-in utility for handling and resolving file system directory paths safely across operating systems (Windows, Mac, Linux).
const router = express.Router();

const pagesDir = path.join(__dirname, '../public/pages');

// Existing Auth Pages
router.get('/', (req, res) => res.sendFile(path.join(pagesDir, 'landing.html')));
router.get('/login', (req, res) => res.sendFile(path.join(pagesDir, 'stdlogin.html')));
router.get('/signup', (req, res) => res.sendFile(path.join(pagesDir, 'stdsignup.html')));
router.get('/admin-login', (req, res) => res.sendFile(path.join(pagesDir, 'adminlogin.html')));

// NEW: Dashboard Pages for Verification
router.get('/dashboard', (req, res) => res.sendFile(path.join(pagesDir, 'stddash.html')));
router.get('/admin-dashboard', (req, res) => res.sendFile(path.join(pagesDir, 'admindash.html')));

module.exports = router;




// __dirname: A built-in Node.js variable that gives the absolute path to the folder containing this current file (/routes).