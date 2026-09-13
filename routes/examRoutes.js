// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const examController = require('../controllers/examController');

// const upload = multer({ storage: multer.memoryStorage() });

// router.post('/create-rag', upload.single('syllabus'), examController.createExamWithRAG);
// router.get('/:id', examController.getExam);
// router.post('/start', examController.startExam);
// router.post('/submit', examController.submitExam);

// module.exports = router;

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, examController.getExams);
router.get('/:id', verifyToken, examController.getExamDetails);
router.post('/:id/submit', verifyToken, examController.submitExam);

module.exports = router;