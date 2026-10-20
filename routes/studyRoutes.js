const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const studyController = require('../controllers/studyController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Storage configuration for study material notes (PDF, DOCX, PPTX)
const os = require('os');
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'study-materials')
  : path.join(__dirname, '../public/uploads/study-materials');

try {
  const fs = require('fs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (_) {}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `notes_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx', '.pptx', '.ppt', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];

  if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and PPTX lecture notes are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max limit
});

// Optional token extractor for student queries (reads token if present, does not reject if missing)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'placementpro_secret_key_@987#');
    } catch {}
  }
  next();
};

// --- PUBLIC & STUDENT STUDY APIS ---
router.get('/subjects', optionalAuth, studyController.listSubjects);
router.get('/subjects/:idOrCode', optionalAuth, studyController.getSubject);
router.get('/topics/:idOrSlug', optionalAuth, studyController.getTopic);
router.get('/search', optionalAuth, studyController.search);

// Authenticated Student Interactions
router.post('/bookmarks/:topicId', verifyToken, studyController.toggleBookmark);
router.get('/bookmarks', verifyToken, studyController.listBookmarks);
router.post('/progress/:topicId', verifyToken, studyController.updateProgress);
router.get('/recently-viewed', verifyToken, studyController.getRecentlyViewed);
router.get('/stats', verifyToken, studyController.getStudentStats);
router.get('/attachments/:id/download', optionalAuth, studyController.downloadAttachment);

// --- FACULTY / ADMIN APIS ---
router.get('/admin/overview', verifyToken, studyController.getAdminOverview);

// Subjects CRUD
router.post('/subjects', verifyToken, studyController.createSubject);
router.put('/subjects/:id', verifyToken, studyController.updateSubject);
router.delete('/subjects/:id', verifyToken, studyController.deleteSubject);

// Chapters CRUD
router.post('/chapters', verifyToken, studyController.createChapter);
router.put('/chapters/:id', verifyToken, studyController.updateChapter);
router.delete('/chapters/:id', verifyToken, studyController.deleteChapter);

// Topics CRUD
router.post('/topics', verifyToken, studyController.createTopic);
router.put('/topics/:id', verifyToken, studyController.updateTopic);
router.delete('/topics/:id', verifyToken, studyController.deleteTopic);

// Attachments Upload & Deletion
router.post('/attachments', verifyToken, upload.single('notesFile'), studyController.uploadAttachment);
router.delete('/attachments/:id', verifyToken, studyController.deleteAttachment);

module.exports = router;
