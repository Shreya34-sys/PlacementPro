require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const setupSockets = require('./config/socket');
const attachCodingSockets = require('./config/codingSocket');

const authRoutes = require('./routes/authRoutes');
const studentViewRoutes = require('./routes/studentViewRoutes');
const adminViewRoutes = require('./routes/adminViewRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examRoutes = require('./routes/examRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const progressRoutes = require('./routes/progressRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const versantRoutes = require('./routes/versantRoutes');
const codingRoutes = require('./routes/codingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studyRoutes = require('./routes/studyRoutes');
const compilerRoutes = require('./routes/compilerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const companyPlacementRoutes = require('./routes/companyPlacementRoutes');

// Parse CLI flags and port configuration
const args = process.argv.slice(2);
const runStudentOnly = args.includes('--student');
const runAdminOnly = args.includes('--admin');
const runBoth = (!runStudentOnly && !runAdminOnly) || args.includes('--both');

const STUDENT_PORT = parseInt(process.env.STUDENT_PORT || process.env.PORT || '5000', 10);
const ADMIN_PORT = parseInt(process.env.ADMIN_PORT || '5001', 10);

const allowedOrigins = [
  `http://localhost:${STUDENT_PORT}`,
  `http://127.0.0.1:${STUDENT_PORT}`,
  `http://localhost:${ADMIN_PORT}`,
  `http://127.0.0.1:${ADMIN_PORT}`
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.apps.googleusercontent.com')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie']
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait a few minutes and try again.' },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});

// Safe Health Check Helper
function setupHealthRoute(app) {
  app.get(['/api/health', '/health'], async (req, res) => {
    let dbStatus = 'untested';
    try {
      const pool = require('./config/db');
      await Promise.race([
        pool.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
      ]);
      dbStatus = 'connected';
    } catch (_) {
      dbStatus = 'disconnected';
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      serverless: Boolean(process.env.VERCEL),
      database: dbStatus,
      auth: {
        googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      }
    });
  });
}

// ==========================================
// 1. STUDENT APPLICATION (PORT 5000)
// ==========================================
function createStudentApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
  }));
  app.use(cors(corsOptions));
  app.use(generalLimiter);
  setupHealthRoute(app);
  app.use('/vendor/mediapipe', express.static(path.join(__dirname, 'node_modules/@mediapipe/tasks-vision')));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  // Security Guard: Intercept ANY admin pages, APIs, or static admin HTML on Student Server
  app.use((req, res, next) => {
    if (app.get('isUnified') || process.env.VERCEL) {
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
      p === '/live-proctoring' ||
      p.startsWith('/pages/admin') ||
      p.startsWith('/pages/admindash') ||
      p === '/pages/company-placement-admin.html' ||
      p === '/pages/versant-admin.html' ||
      p === '/pages/proctoring.html' ||
      p.startsWith('/api/admin') ||
      p.startsWith('/api/coding/admin') ||
      p.startsWith('/api/interviews/admin') ||
      p.startsWith('/api/exams/admin') ||
      p.startsWith('/api/placement-simulation/admin') ||
      p.startsWith('/api/v1/placement-simulation/admin') ||
      p === '/api/auth/admin-login' ||
      p === '/api/auth/admin-magic-link' ||
      p.startsWith('/api/v1/admin')
    ) {
      if (p.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Admin APIs cannot be accessed from the Student portal. Please use http://localhost:${ADMIN_PORT}`
        });
      }
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
            <p>The Admin Panel runs strictly on a separate dedicated port (Port ${ADMIN_PORT}). Direct admin access is prohibited on the Student Panel.</p>
            <p>Student users cannot gain Admin access by changing the URL.</p>
            <div class="actions">
              <a href="/dashboard" class="btn-primary">Return to Student Dashboard</a>
              <a href="http://localhost:${ADMIN_PORT}/admin-login" class="btn-secondary">Go to Admin Portal (${ADMIN_PORT})</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }
    next();
  });

  // Canonical redirects for legacy /pages/*.html on Student App
  app.use((req, res, next) => {
    const p = req.path;
    if (p.startsWith('/pages/')) {
      const legacyMap = {
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
      if (legacyMap[p]) {
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        return res.redirect(legacyMap[p] + query);
      }
    }
    next();
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(passport.initialize());

  const v1Router = express.Router();
  v1Router.use('/auth', authLimiter, authRoutes);
  v1Router.use('/student', studentRoutes);
  v1Router.use('/resume', resumeRoutes);
  v1Router.use('/exams', examRoutes);
  v1Router.use('/companies', companyRoutes);
  v1Router.use('/placement-simulation', companyPlacementRoutes);
  v1Router.use('/versant', versantRoutes);
  v1Router.use('/progress', progressRoutes);
  v1Router.use('/interviews', interviewRoutes);
  v1Router.use('/coding', codingRoutes);
  v1Router.use('/study', studyRoutes);
  v1Router.use('/analytics', analyticsRoutes);
  v1Router.use('/compiler', compilerRoutes);
  v1Router.use('/', compilerRoutes);

  app.use('/api/v1', v1Router);
  app.use('/api/exams', examRoutes);
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/versant', versantRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/placement-simulation', companyPlacementRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/coding', codingRoutes);
  app.use('/api/study', studyRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/compiler', compilerRoutes);
  app.use('/api', compilerRoutes);

  // Student HTML view routes (with 403 block on admin URLs)
  app.use('/', studentViewRoutes);

  app.use((error, req, res, next) => {
    console.error('[Student Server Error]', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Unexpected server error.'
    });
  });

  return app;
}

// ==========================================
// 2. ADMIN APPLICATION (PORT 5001)
// ==========================================
function createAdminApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
  }));
  app.use(cors(corsOptions));
  app.use(generalLimiter);
  setupHealthRoute(app);
  app.use('/vendor/mediapipe', express.static(path.join(__dirname, 'node_modules/@mediapipe/tasks-vision')));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  // Canonical redirects for legacy /pages/*.html on Admin App
  app.use((req, res, next) => {
    const p = req.path;
    if (p.startsWith('/pages/')) {
      const legacyMap = {
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
      if (legacyMap[p]) {
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        return res.redirect(legacyMap[p] + query);
      }
      // Redirect student pages on admin port to student server
      const studentPages = ['stddash', 'available-exams', 'interviews', 'versant-test', 'companies', 'coding-rounds', 'study-materials', 'company-placement-student', 'company-placement'];
      if (studentPages.some(s => p.includes(s))) {
        return res.redirect(`http://localhost:${STUDENT_PORT}${req.originalUrl}`);
      }
    }
    next();
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(passport.initialize());

  const v1Router = express.Router();
  v1Router.use('/auth', authLimiter, authRoutes);
  v1Router.use('/admin', adminRoutes);
  v1Router.use('/coding', codingRoutes);
  v1Router.use('/exams', examRoutes);
  v1Router.use('/interviews', interviewRoutes);
  v1Router.use('/study', studyRoutes);
  v1Router.use('/analytics', analyticsRoutes);
  v1Router.use('/student', studentRoutes);
  v1Router.use('/versant', versantRoutes);
  v1Router.use('/companies', companyRoutes);
  v1Router.use('/placement-simulation', companyPlacementRoutes);
  v1Router.use('/compiler', compilerRoutes);

  app.use('/api/v1', v1Router);
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/coding', codingRoutes);
  app.use('/api/exams', examRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/study', studyRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/versant', versantRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/placement-simulation', companyPlacementRoutes);
  app.use('/api/compiler', compilerRoutes);

  // Admin HTML view routes (redirects / to /admin-login, protects admin pages)
  app.use('/', adminViewRoutes);

  app.use((error, req, res, next) => {
    console.error('[Admin Server Error]', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Unexpected server error.'
    });
  });

  return app;
}

// ==========================================
// 3. UNIFIED APPLICATION (SERVERLESS / VERCEL)
// ==========================================
function createUnifiedApp() {
  const app = createStudentApp();
  app.set('isUnified', true);

  // Mount Admin API routes
  app.use('/api/admin', adminRoutes);

  // Mount Admin View routes
  app.use('/', adminViewRoutes);

  return app;
}

// ==========================================
// 4. SERVER INITIALIZATION & LIFECYCLE
// ==========================================
let sharedIo = null;

// Initialize Docker compiler worker manager
function checkCompilerWorker() {
  const workerManager = require('./services/compiler/workerManager');
  workerManager.ensureWorkerRunning().catch(err => {
    console.warn('[Startup] Compiler worker check failed:', err.message);
  });
}

if (require.main === module && !process.env.VERCEL) {
  if (runBoth || runStudentOnly) {
    const studentApp = createStudentApp();
    const studentServer = http.createServer(studentApp);
    sharedIo = setupSockets(studentServer, studentApp, sharedIo);
    attachCodingSockets(studentApp.get('io'));

    studentServer.listen(STUDENT_PORT, () => {
      console.log(`[Student Server] Running on http://localhost:${STUDENT_PORT}`);
      checkCompilerWorker();
    });
  }

  if (runBoth || runAdminOnly) {
    const adminApp = createAdminApp();
    const adminServer = http.createServer(adminApp);
    sharedIo = setupSockets(adminServer, adminApp, sharedIo);
    attachCodingSockets(adminApp.get('io'));

    adminServer.listen(ADMIN_PORT, () => {
      console.log(`[Admin Server] Running on http://localhost:${ADMIN_PORT}`);
      console.log(`[Admin Portal] Access at http://localhost:${ADMIN_PORT}/admin-login`);
    });
  }
}

const defaultApp = (process.env.VERCEL || process.env.UNIFIED_SERVER) ? createUnifiedApp() : createStudentApp();

module.exports = defaultApp;
module.exports.createStudentApp = createStudentApp;
module.exports.createAdminApp = createAdminApp;
module.exports.createUnifiedApp = createUnifiedApp;
