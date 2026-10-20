const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const router = express.Router();

const pagesDir = path.join(__dirname, '../public/pages');

// Helper to extract JWT token from request
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
  if (req.cookies && req.cookies.adminToken) return req.cookies.adminToken;
  if (req.headers && req.headers.cookie) {
    const m = req.headers.cookie.match(/(?:^|;\s*)adminToken=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  if (req.query && req.query.token) return req.query.token;
  return null;
}

// Server-side guard for protected admin pages
function adminPageGuard(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987';
      const decoded = jwt.verify(token, secret);
      if (decoded.role !== 'admin' && decoded.role !== 'ADMIN') {
        return res.status(403).redirect('/admin-login?error=forbidden');
      }
    } catch (_) {
      // Invalid token -> redirect to admin login
      return res.redirect('/admin-login?error=invalid_token');
    }
  }
  next();
}

// Root of Admin Panel redirects to admin-login only when on dedicated admin port
router.get('/', (req, res, next) => {
  const adminPort = String(process.env.ADMIN_PORT || '5001');
  const host = req.headers.host || '';
  if (host.includes(`:${adminPort}`)) {
    return res.redirect('/admin-login');
  }
  next();
});

// Admin Login Page
router.get('/admin-login', (req, res) => res.sendFile(path.join(pagesDir, 'adminlogin.html')));

// Backwards-compatible /login redirect to student portal when on dedicated admin port
router.get('/login', (req, res, next) => {
  const adminPort = String(process.env.ADMIN_PORT || '5001');
  const host = req.headers.host || '';
  if (host.includes(`:${adminPort}`)) {
    const studentPort = process.env.STUDENT_PORT || process.env.PORT || 5000;
    return res.redirect(`http://localhost:${studentPort}/login`);
  }
  next();
});

// Admin Dashboard Pages
router.get(['/admindash', '/admin-dashboard'], adminPageGuard, (req, res) => {
  res.sendFile(path.join(pagesDir, 'admindash.html'));
});

// Admin Feature Pages
const adminPages = {
  '/admin-exams': 'admin-exams.html',
  '/admin-exam-builder': 'admin-exam-builder.html',
  '/admin-coding-rounds': 'admin-coding-rounds.html',
  '/admin-coding-builder': 'admin-coding-builder.html',
  '/admin-coding-monitor': 'admin-coding-monitor.html',
  '/admin-coding-results': 'admin-coding-results.html',
  '/admin-interviews': 'admin-interviews.html',
  '/admin-question-import': 'admin-question-import.html',
  '/admin-study-materials': 'admin-study-materials.html',
  '/versant-admin': 'versant-admin.html',
  '/proctoring': 'proctoring.html',
  '/live-proctoring': 'proctoring.html',
  '/coding-result': 'coding-result.html', // supports ?admin=1
  '/company-placement-admin': 'company-placement-admin.html',
  '/company-placement-manager': 'company-placement-admin.html'
};

for (const [route, filename] of Object.entries(adminPages)) {
  router.get(route, adminPageGuard, (_req, res) => res.sendFile(path.join(pagesDir, filename)));
}

// Canonical redirects for legacy /pages/*.html admin pages
const legacyAdminPageRedirects = {
  '/pages/admindash.html': '/admindash',
  '/pages/admin-dashboard.html': '/admin-dashboard',
  '/pages/admin-exams.html': '/admin-exams',
  '/pages/admin-exam-builder.html': '/admin-exam-builder',
  '/pages/admin-coding-rounds.html': '/admin-coding-rounds',
  '/pages/admin-coding-builder.html': '/admin-coding-builder',
  '/pages/admin-coding-monitor.html': '/admin-coding-monitor',
  '/pages/admin-coding-results.html': '/admin-coding-results',
  '/pages/admin-interviews.html': '/admin-interviews',
  '/pages/admin-question-import.html': '/admin-question-import',
  '/pages/admin-study-materials.html': '/admin-study-materials',
  '/pages/versant-admin.html': '/versant-admin',
  '/pages/proctoring.html': '/proctoring',
  '/pages/company-placement-admin.html': '/company-placement-admin',
  '/pages/company-placement-manager.html': '/company-placement-admin'
};

for (const [rawPath, targetPath] of Object.entries(legacyAdminPageRedirects)) {
  router.get(rawPath, adminPageGuard, (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(targetPath + query);
  });
}

// Redirect any student-only practice/dashboard pages on admin port back to student portal
const studentRedirectRoutes = [
  '/dashboard',
  '/take-exam',
  '/live-exam',
  '/exam-guidelines',
  '/coding-rounds',
  '/coding-round',
  '/companies',
  '/company-prep',
  '/company-placement',
  '/company-placement-student',
  '/study-materials',
  '/study-reader',
  '/compiler-practice',
  '/compiler',
  '/profile',
  '/resume-analyzer',
  '/analytics',
  '/placement-workspace',
  '/pages/stddash.html',
  '/pages/available-exams.html',
  '/pages/exam-guidelines.html',
  '/pages/take-exam.html',
  '/pages/live-exam.html',
  '/pages/exam-result.html',
  '/pages/interviews.html',
  '/pages/interview-room.html',
  '/pages/versant-test.html',
  '/pages/versant-result.html',
  '/pages/companies.html',
  '/pages/company-prep.html',
  '/pages/company-placement-student.html',
  '/pages/company-placement.html',
  '/pages/study-materials.html',
  '/pages/study-reader.html',
  '/pages/compiler-practice.html',
  '/pages/coding-rounds.html',
  '/pages/coding-round.html',
  '/pages/coding-result.html',
  '/pages/analytics.html',
  '/pages/placement-workspace.html'
];

studentRedirectRoutes.forEach(route => {
  router.get(route, (req, res) => {
    const studentPort = process.env.STUDENT_PORT || process.env.PORT || 5000;
    res.redirect(`http://localhost:${studentPort}${req.originalUrl}`);
  });
});

module.exports = router;
