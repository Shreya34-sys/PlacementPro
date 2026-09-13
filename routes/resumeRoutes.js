const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const passport = require('../config/passport');
const resumeController = require('../controllers/resumeController');

// Serve Page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/resume-analyzer.html'));
});

// Multer Configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(pdf|docx|txt)$/i)) {
            return cb(new Error('Please upload a PDF, DOCX, or TXT file'));
        }
        cb(null, true);
    }
});

// Protect endpoint with Passport JWT
router.post('/analyze', 
    passport.authenticate('jwt', { session: false }), 
    upload.single('resume'), 
    resumeController.analyzeResume
);

module.exports = router;