const router = require('express').Router();
const passport = require('passport');
const interview = require('../controllers/interviewController');

const auth = passport.authenticate('jwt', { session: false });
const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.sendStatus(403);

router.get('/template', auth, adminOnly, interview.template);
router.post('/import/preview', auth, adminOnly, interview.uploadImportFile, interview.previewImport);

router.get('/admin/sets', auth, adminOnly, interview.listSets);
router.post('/admin/sets', auth, adminOnly, interview.createSet);
router.put('/admin/sets/:setId', auth, adminOnly, interview.updateSet);
router.delete('/admin/sets/:setId', auth, adminOnly, interview.removeSet);
router.post('/admin/sets/:setId/questions', auth, adminOnly, interview.addQuestions);
router.post('/admin/sets/:setId/assignments', auth, adminOnly, interview.assign);
router.get('/admin/submissions', auth, adminOnly, interview.submissions);
router.get('/admin/attempts/:attemptId', auth, adminOnly, interview.review);
router.post('/admin/attempts/:attemptId/review', auth, adminOnly, interview.saveReview);

router.get('/student', auth, interview.studentDashboard);
router.get('/assignments/:assignmentId/questions', auth, interview.assignmentQuestions);
router.post('/assignments/:assignmentId/attempts', auth, interview.startAttempt);
router.put('/attempts/:attemptId/answers', auth, interview.saveAnswer);
router.post('/attempts/:attemptId/events', auth, interview.recordEvent);
router.post('/attempts/:attemptId/submit', auth, interview.submitAttempt);

module.exports = router;
