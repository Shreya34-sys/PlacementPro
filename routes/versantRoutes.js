const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const c = require('../controllers/versantController');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'versant');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.webm').toLowerCase();
    const safe = ['.webm','.wav','.mp3','.m4a','.ogg','.mp4'].includes(ext) ? ext : '.webm';
    cb(null, `versant-${Date.now()}-${Math.random().toString(36).slice(2)}${safe}`);
  }
});

const audioUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^audio\//i.test(file.mimetype) || /^(video\/webm|application\/octet-stream)$/i.test(file.mimetype);
    cb(ok ? null : new Error('Only audio/webm recordings are allowed.'), ok);
  }
});

router.get('/admin/tests', verifyToken, verifyAdmin, c.adminTests);
router.post('/admin/tests', verifyToken, verifyAdmin, c.createTest);
router.get('/admin/tests/:testId', verifyToken, verifyAdmin, c.getTest);
router.delete('/admin/tests/:testId', verifyToken, verifyAdmin, c.deleteTest);
router.post('/admin/tests/:testId/questions', verifyToken, verifyAdmin, audioUpload.single('promptAudio'), c.addQuestion);
router.patch('/admin/tests/:testId/status', verifyToken, verifyAdmin, c.publish);
router.get('/admin/tests/:testId/assignments', verifyToken, verifyAdmin, c.assignments);
router.get('/admin/assignments/:assignmentId/result', verifyToken, verifyAdmin, c.adminResult);

router.get('/student/tests', verifyToken, c.studentTests);
router.post('/student/tests/:testId/start', verifyToken, c.startTest);
router.post('/student/assignments/:assignmentId/response', verifyToken, audioUpload.single('audio'), c.submitResponse);
router.post('/student/assignments/:assignmentId/submit', verifyToken, c.submit);
router.get('/student/assignments/:assignmentId/result', verifyToken, c.result);
router.post('/student/assignments/:assignmentId/event', verifyToken, c.event);

module.exports = router;
