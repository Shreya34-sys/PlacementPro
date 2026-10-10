// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');
const resumeController = require('../controllers/resumeController');
const { verifyToken } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const name = String(file.originalname || '').toLowerCase();

    if (allowed.includes(file.mimetype) || name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt')) {
        cb(null, true);
        return;
    }

    cb(new Error('Only PDF, DOCX, and TXT files are allowed!'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Routes
router.get('/profile', verifyToken, studentController.getProfile);
router.put('/profile', verifyToken, studentController.updateProfile);
router.post('/resume', verifyToken, upload.single('resumeFile'), studentController.uploadResume);
router.post('/resume/analyze', verifyToken, upload.single('resume'), resumeController.analyzeResume);

module.exports = router;