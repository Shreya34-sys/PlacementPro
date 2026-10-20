const express = require('express');
const path = require('path');
const router = express.Router();

const pagesDir = path.join(__dirname, '../public/pages');

// Middleware: Intercept ANY admin pages accessed on Student port and return 403 Forbidden
router.use((req, res, next) => {
  if (req.app.get('isUnified') || process.env.VERCEL) {
    return next();
  }
  const p = req.path;
  if (
    p.startsWith('/admin') ||
    p.startsWith('/admindash') ||
    p === '/versant-admin' ||
    p === '/company-placement-admin' ||
    p === '/company-placement-manager' ||
    p === '/proctoring' ||
    p === '/live-proctoring'
  ) {
    const adminPort = process.env.ADMIN_PORT || 5001;
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>403 Forbidden - Admin Access Restricted</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #1e293b; border: 1px solid #ef4444; border-radius: 12px; max-width: 500px; width: 100%; padding: 32px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
          h2 { color: #ef4444; margin-top: 0; font-size: 1.5rem; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
          .actions { margin-top: 24px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
          a { text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 10px 18px; border-radius: 8px; transition: opacity 0.2s; }
          .btn-primary { background: #3b82f6; color: #fff; }
          .btn-secondary { background: #334155; color: #f8fafc; }
          a:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>403 Forbidden: Admin Access Restricted</h2>
          <p>The Admin Panel runs strictly on a separate dedicated port (Port ${adminPort}). Direct admin access is prohibited on the Student Panel.</p>
          <p>Student users cannot gain Admin access by changing the URL.</p>
          <div class="actions">
            <a href="/dashboard" class="btn-primary">Return to Student Dashboard</a>
            <a href="http://localhost:${adminPort}/admin-login" class="btn-secondary">Go to Admin Portal (${adminPort})</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  next();
});

// Student Pages
router.get('/', (req, res) => res.sendFile(path.join(pagesDir, 'landing.html')));
router.get('/login', (req, res) => res.sendFile(path.join(pagesDir, 'stdlogin.html')));
router.get('/signup', (req, res) => res.sendFile(path.join(pagesDir, 'stdsignup.html')));
router.get('/dashboard', (req, res) => res.sendFile(path.join(pagesDir, 'stddash.html')));

const studentPages = {
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
  '/companies': 'companies.html',
  '/company-prep': 'company-prep.html',
  '/study-materials': 'study-materials.html',
  '/study-reader': 'study-reader.html',
  '/compiler-practice': 'compiler-practice.html',
  '/study-practice': 'compiler-practice.html',
  '/compiler.html': 'compiler-practice.html',
  '/compiler': 'compiler-practice.html',
  '/analytics': 'analytics.html',
  '/coding-rounds': 'coding-rounds.html',
  '/coding-round': 'coding-round.html',
  '/coding-result': 'coding-result.html',
  '/company-placement-student': 'company-placement-student.html',
  '/company-placement': 'company-placement-student.html'
};

for (const [route, filename] of Object.entries(studentPages)) {
  router.get(route, (_req, res) => res.sendFile(path.join(pagesDir, filename)));
}

// Canonical redirects for legacy /pages/*.html URLs
const legacyStudentPageRedirects = {
  '/pages/stddash.html': '/dashboard',
  '/pages/stdlogin.html': '/login',
  '/pages/stdsignup.html': '/signup',
  '/pages/available-exams.html': '/available-exams',
  '/pages/exam-guidelines.html': '/exam-guidelines',
  '/pages/take-exam.html': '/take-exam',
  '/pages/live-exam.html': '/live-exam',
  '/pages/exam-result.html': '/exam-result',
  '/pages/interviews.html': '/interviews',
  '/pages/interview-room.html': '/interview-room',
  '/pages/versant-test.html': '/versant-test',
  '/pages/versant-result.html': '/versant-result',
  '/pages/companies.html': '/companies',
  '/pages/company-prep.html': '/company-prep',
  '/pages/study-materials.html': '/study-materials',
  '/pages/study-reader.html': '/study-reader',
  '/pages/compiler-practice.html': '/compiler-practice',
  '/pages/coding-rounds.html': '/coding-rounds',
  '/pages/coding-round.html': '/coding-round',
  '/pages/coding-result.html': '/coding-result',
  '/pages/analytics.html': '/analytics',
  '/pages/placement-workspace.html': '/placement-workspace',
  '/pages/company-placement-student.html': '/company-placement-student',
  '/pages/company-placement.html': '/company-placement-student'
};

for (const [rawPath, targetPath] of Object.entries(legacyStudentPageRedirects)) {
  router.get(rawPath, (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(targetPath + query);
  });
}

module.exports = router;
