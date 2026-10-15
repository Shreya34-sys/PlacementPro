const router = require('express').Router();
const passport = require('passport');
const interview = require('../controllers/interviewController');
const multer = require('multer');

const auth = passport.authenticate('jwt', { session: false });
const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.sendStatus(403);
const studentOnly = (req, res, next) => req.user.role === 'student' ? next() : res.sendStatus(403);
const answerAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^audio\/(webm|ogg|mp4|mpeg|wav|x-wav|aac|3gpp)(?:;.*)?$/i.test(file.mimetype)) return cb(null, true);
    const error = new Error('Use a supported audio recording format.');
    error.status = 400;
    cb(error);
  }
});
const uploadAnswerAudio = answerAudio.single('audio');

function handleAnswerUpload(req, res, next) {
  uploadAnswerAudio(req, res, error => {
    if (error) error.status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    next(error);
  });
}

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
router.get('/admin/attempts/:attemptId/answers/:questionId/audio', auth, adminOnly, interview.reviewAudio);
router.post('/admin/attempts/:attemptId/review', auth, adminOnly, interview.saveReview);

router.get('/student', auth, studentOnly, interview.studentDashboard);
router.get('/assignments/:assignmentId/questions', auth, studentOnly, interview.assignmentQuestions);
router.post('/assignments/:assignmentId/attempts', auth, studentOnly, interview.startAttempt);
router.put('/attempts/:attemptId/answers', auth, studentOnly, handleAnswerUpload, interview.saveAnswer);
router.get('/attempts/:attemptId/answers/:questionId/audio', auth, studentOnly, interview.studentAudio);
router.post('/attempts/:attemptId/events', auth, studentOnly, interview.recordEvent);
router.post('/attempts/:attemptId/submit', auth, studentOnly, interview.submitAttempt);

// AI HR Interactive Voice Interview routes
router.get('/ai/default-assignment', auth, studentOnly, interview.defaultAiAssignment);
router.post('/ai/converse', auth, studentOnly, interview.aiConverse);
router.post('/ai/feedback', auth, studentOnly, interview.aiFeedback);
router.get('/attempts/:attemptId/feedback', auth, interview.attemptFeedback);
router.post('/ai/transcribe', auth, studentOnly, handleAnswerUpload, interview.aiTranscribe);

module.exports = router;
