
require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const setupSockets = require('./config/socket');

const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examRoutes = require('./routes/examRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const versantRoutes = require('./routes/versantRoutes');
const progressRoutes = require('./routes/progressRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();
const server = http.createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors({ origin: true, credentials: true }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait a few minutes and try again.' }
});

app.use(generalLimiter);
app.use('/vendor/mediapipe', express.static(path.join(__dirname, 'node_modules/@mediapipe/tasks-vision')));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

setupSockets(server, app);

const v1Router = express.Router();
v1Router.use('/auth', authLimiter, authRoutes);
v1Router.use('/student', studentRoutes);
v1Router.use('/resume', resumeRoutes);
v1Router.use('/exams', examRoutes);
v1Router.use('/companies', companyRoutes);
v1Router.use('/versant', versantRoutes);
v1Router.use('/progress', progressRoutes);
v1Router.use('/interviews', interviewRoutes);

app.use('/api/v1', v1Router);
app.use('/api/exams', examRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/versant', versantRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/', viewRoutes);

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Unexpected server error.'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
