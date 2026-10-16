const router = require('express').Router();
const passport = require('passport');
const admin = require('../controllers/adminController');

const auth = passport.authenticate('jwt', { session: false });
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'ADMIN')) return next();
  return res.sendStatus(403);
};

router.get('/intelligence-stats', auth, adminOnly, admin.getIntelligenceStats);
router.post('/ingest', auth, adminOnly, admin.ingest);

module.exports = router;
