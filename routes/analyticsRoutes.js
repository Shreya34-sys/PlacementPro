'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Role-aware JWT auth middleware
const authenticateToken = (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to view analytics.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'placementpro_secret_key_@987#'
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token. Please log in again.'
    });
  }
};

router.get('/overview', authenticateToken, analyticsController.getAnalytics);
router.get('/', authenticateToken, analyticsController.getAnalytics);

module.exports = router;
