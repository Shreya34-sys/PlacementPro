const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const c = require('../controllers/codingRoundController');

const router = express.Router();

const admin = [verifyToken, verifyAdmin];
const student = [verifyToken];

router.get('/admin/rounds', ...admin, c.adminList);
router.post('/admin/rounds', ...admin, c.adminCreate);
router.get('/admin/rounds/:roundId', ...admin, c.adminGet);
router.post('/admin/rounds/:roundId/questions', ...admin, c.adminAddQuestion);
router.put('/admin/rounds/:roundId/questions/:questionId', ...admin, c.adminUpdateQuestion);
router.post('/admin/rounds/:roundId/assign', ...admin, c.adminAssign);
router.patch('/admin/rounds/:roundId/status', ...admin, c.adminStatus);
router.delete('/admin/rounds/:roundId', ...admin, c.adminDelete);
router.get('/admin/rounds/:roundId/monitor', ...admin, c.adminMonitor);
router.get('/admin/rounds/:roundId/results', ...admin, c.adminResults);
router.get('/admin/attempts/:attemptId/result', ...admin, c.adminResultDetail);
router.patch('/admin/flags/:flagId/resolve', ...admin, c.adminResolveFlag);

router.get('/student/rounds', ...student, c.studentList);
router.get('/student/rounds/:roundId', ...student, c.studentOpen);
router.post('/student/rounds/:roundId/start', ...student, c.start);
router.post('/student/attempts/:attemptId/snapshot', ...student, c.snapshot);
router.post('/student/attempts/:attemptId/run', ...student, c.run);
router.post('/student/attempts/:attemptId/submit-question', ...student, c.submitQuestion);
router.post('/student/attempts/:attemptId/submit', ...student, c.submitRound);
router.get('/student/attempts/:attemptId/result', ...student, c.studentResult);
router.post('/student/attempts/:attemptId/flag', ...student, c.flag);

module.exports = router;
