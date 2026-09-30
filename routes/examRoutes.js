// const router = require('express').Router();
// const passport = require('passport');
// const exam = require('../controllers/examController');
// const proctor = require('../controllers/proctoringController');
// const auth = passport.authenticate('jwt', { session: false });
// const adminOnly = (req,res,next) => req.user.role === 'admin' ? next() : res.sendStatus(403);
// router.post('/', auth, adminOnly, exam.create);
// router.get('/admin', auth, adminOnly, exam.listForAdmin);
// router.get('/available', auth, exam.listAvailable);
// router.delete('/:examId', auth, adminOnly, exam.remove);
// router.get('/:examId', auth, exam.open);
// router.post('/:examId/attempts', auth, exam.start);
// router.put('/attempts/:attemptId/answers', auth, exam.answer);
// router.post('/attempts/:attemptId/submit', auth, exam.submit);
// router.get('/attempts/:attemptId/result', auth, exam.result);
// router.post('/attempts/:attemptId/flags', auth, proctor.flag);
// router.get('/:examId/proctoring/flags', auth, adminOnly, proctor.liveFlags);
// router.patch('/proctoring/flags/:flagId/resolve', auth, adminOnly, proctor.resolve);
// router.patch('/proctoring/students/:studentId/remove', auth, adminOnly, proctor.removeStudent);

// router.get('/admin-exams', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin-exams.html'));
// });
// router.get('/admin-exam-builder', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin-exam-builder.html'));
// });
// router.get('/live-proctoring', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'proctoring.html'));
// });

// module.exports = router;






const router=require('express').Router();
const passport=require('passport');
const exam=require('../controllers/examController');
const proctor=require('../controllers/proctoringController');
const auth=passport.authenticate('jwt',{session:false});
const adminOnly=(req,res,next)=>req.user.role==='admin'?next():res.sendStatus(403);
router.post('/',auth,adminOnly,exam.create); router.get('/admin',auth,adminOnly,exam.listForAdmin); router.get('/available',auth,exam.listAvailable);
router.get('/:examId/proctoring/active-attempts',auth,adminOnly,proctor.activeAttempts);
router.get('/:examId/proctoring/flags',auth,adminOnly,proctor.liveFlags);
router.patch('/proctoring/flags/:flagId/resolve',auth,adminOnly,proctor.resolve);
router.patch('/proctoring/students/:studentId/remove',auth,adminOnly,proctor.removeStudent);
router.delete('/:examId',auth,adminOnly,exam.remove); router.get('/:examId',auth,exam.open); router.post('/:examId/attempts',auth,exam.start);
router.put('/attempts/:attemptId/answers',auth,exam.answer); router.post('/attempts/:attemptId/submit',auth,exam.submit); router.get('/attempts/:attemptId/result',auth,exam.result); router.post('/attempts/:attemptId/flags',auth,proctor.flag);
module.exports=router;