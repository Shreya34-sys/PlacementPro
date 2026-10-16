'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const compilerController = require('../controllers/compilerController');
const projectController = require('../controllers/projectController');
const cvisualizeAuth = require('../controllers/cvisualizeAuthController');
const { verifyToken } = require('../middleware/authMiddleware');

const compileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many compilation requests. Please wait a few moments before compiling again.'
  },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'placementpro_secret_key_@987#');
    } catch (_) {}
  }
  next();
};

// System information & health
router.get(['/info', '/compiler/info', '/health'], compilerController.getInfo);

// Exercises & Practice Catalog
router.get('/exercises', compilerController.getExercises);
router.get('/exercises/:id', compilerController.getExercise);

// Student Attempt History
router.get('/attempts', verifyToken, compilerController.getAttempts);
router.post('/attempts', verifyToken, compilerController.recordAttempt);

// Real Compilation & Execution
router.post('/compile', optionalAuth, compileLimiter, (req, res) => compilerController.compile(req, res));
router.post('/compilations/:id/run', optionalAuth, compileLimiter, (req, res) => compilerController.run(req, res));
router.post('/run/:id', optionalAuth, compileLimiter, (req, res) => compilerController.run(req, res));
router.post('/compilations/:id/cancel', optionalAuth, (req, res) => compilerController.cancel(req, res));
router.get('/compilations/:id', optionalAuth, (req, res) => compilerController.getCompilation(req, res));

// Artifacts and results
router.get('/compilations/:id/artifacts', optionalAuth, async (req, res) => {
  try {
    const job = await require('../services/compiler/compilerService').getJob(req.params.id, req.user?.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, data: job.artifacts });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.get('/compilations/:id/artifacts/:phase', optionalAuth, async (req, res) => {
  try {
    const job = await require('../services/compiler/compilerService').getJob(req.params.id, req.user?.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    const art = job.artifacts.find((a) => a.phase_name === req.params.phase);
    if (!art) return res.status(404).json({ success: false, error: `Artifact for phase '${req.params.phase}' not found` });
    res.json({ success: true, data: art });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.get('/compilations/:id/results', optionalAuth, async (req, res) => {
  try {
    const job = await require('../services/compiler/compilerService').getJob(req.params.id, req.user?.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, data: job.results });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Projects & Versions
router.get('/projects', optionalAuth, (req, res, next) => projectController.listProjects(req, res, next));
router.post('/projects', optionalAuth, (req, res, next) => projectController.createProject(req, res, next));
router.get('/projects/:id', optionalAuth, (req, res, next) => projectController.getProject(req, res, next));
router.put('/projects/:id', optionalAuth, (req, res, next) => projectController.updateProject(req, res, next));
router.delete('/projects/:id', optionalAuth, (req, res, next) => projectController.deleteProject(req, res, next));
router.get('/projects/:id/versions', optionalAuth, (req, res, next) => projectController.listVersions(req, res, next));
router.post('/projects/:id/versions', optionalAuth, (req, res, next) => projectController.saveVersion(req, res, next));
router.get('/versions/:id', optionalAuth, (req, res, next) => projectController.getVersion(req, res, next));

// Auth Endpoints (C-Visualize & PlacementPro compatible)
router.post('/auth/register', (req, res) => cvisualizeAuth.register(req, res));
router.post('/auth/login', (req, res) => cvisualizeAuth.login(req, res));
router.post('/auth/logout', (req, res) => cvisualizeAuth.logout(req, res));
router.get('/auth/me', optionalAuth, (req, res) => cvisualizeAuth.me(req, res));

module.exports = router;
