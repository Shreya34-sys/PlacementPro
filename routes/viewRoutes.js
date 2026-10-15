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

// Friendly URLs for existing student and faculty pages used by navigation.
const pageRoutes = {
  '/profile': 'stdprofile.html',
  '/resume-analyzer': 'resume-analyzer.html',
  '/available-exams': 'available-exams.html',
  '/exam-guidelines': 'exam-guidelines.html',
  '/take-exam': 'take-exam.html',
  '/live-exam': 'live-exam.html',
  '/exam-result': 'exam-result.html',
  '/versant-test': 'versant-test.html',
  '/versant-result': 'versant-result.html',
  '/interviews': 'interviews.html',
  '/interview-room': 'interview-room.html',
  '/placement-workspace': 'placement-workspace.html',
  '/admin-interviews': 'admin-interviews.html',
  '/admin-question-import': 'admin-question-import.html',
  '/versant-admin': 'versant-admin.html',
  '/proctoring': 'proctoring.html',
  '/companies': 'companies.html',
  '/company-prep': 'company-prep.html'
};
for (const [route, filename] of Object.entries(pageRoutes)) {
  router.get(route, (_req, res) => res.sendFile(path.join(pagesDir, filename)));
}


router.get('/admin-exams', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin-exams.html'));
});
router.get('/admin-exam-builder', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin-exam-builder.html'));
});
router.get('/live-proctoring', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'proctoring.html'));
});

module.exports = router;




// __dirname: A built-in Node.js variable that gives the absolute path to the folder containing this current file (/routes).
