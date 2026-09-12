// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Configure Multer storage for Resumes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/resumes'); // Ensure public/uploads/resumes directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `resume-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Routes
router.get('/profile', verifyToken, studentController.getProfile);
router.put('/profile', verifyToken, studentController.updateProfile);
router.post('/resume', verifyToken, upload.single('resumeFile'), studentController.uploadResume);

module.exports = router;