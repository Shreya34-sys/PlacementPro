const multer = require('multer');
const Interview = require('../models/interviewModel');
const {
  parseWorkbook,
  validateRows,
  buildTemplateWorkbook
} = require('../services/interviewImportService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(xlsx|xls)$/i.test(file.originalname)) return cb(null, true);
    const error = new Error('Only .xlsx and .xls files are supported.');
    error.status = 400;
    cb(error);
  }
});

exports.uploadImportFile = (req, res, next) => upload.single('file')(req, res, error => {
  if (error) error.status = 400;
  next(error);
});

exports.template = async (req, res, next) => {
  try {
    const buffer = await buildTemplateWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="placementpro-interview-template.xlsx"');
    res.send(buffer);
  } catch (error) { next(error); }
};

exports.previewImport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Upload an Excel file before previewing.' });
    res.json(await parseWorkbook(req.file.buffer, req.file.originalname));
  } catch (error) { next(error); }
};

exports.listSets = async (req, res, next) => {
  try { res.json(await Interview.listSets(req.user.id)); } catch (error) { next(error); }
};

exports.createSet = async (req, res, next) => {
  try {
    if (!String(req.body.title || '').trim()) return res.status(400).json({ message: 'Interview set title is required.' });
    res.status(201).json({ id: await Interview.createSet(req.user.id, req.body) });
  } catch (error) { next(error); }
};

exports.updateSet = async (req, res, next) => {
  try {
    const updated = await Interview.updateSet(req.user.id, req.params.setId, req.body);
    if (!updated) return res.status(404).json({ message: 'Interview set not found.' });
    res.sendStatus(204);
  } catch (error) { next(error); }
};

exports.removeSet = async (req, res, next) => {
  try {
    const removed = await Interview.removeSet(req.user.id, req.params.setId);
    if (!removed) return res.status(404).json({ message: 'Interview set not found.' });
    res.sendStatus(204);
  } catch (error) { next(error); }
};

exports.addQuestions = async (req, res, next) => {
  try {
    const validation = validateRows((Array.isArray(req.body.questions) ? req.body.questions : []).map((question, index) => ({
      __rowNumber: question.rowNumber || index + 2,
      question: question.question || question.questionText,
      referenceAnswer: question.referenceAnswer,
      evaluationCriteria: question.evaluationCriteria,
      category: question.category,
      topic: question.topic,
      difficulty: question.difficulty,
      marks: question.marks,
      preparationTimeSeconds: question.preparationTimeSeconds,
      answerTimeSeconds: question.answerTimeSeconds
    })));
    if (validation.errors.length) {
      return res.status(400).json({ message: 'Fix validation errors before saving.', errors: validation.errors, stats: validation.stats });
    }
    const count = await Interview.addQuestions(req.user.id, req.params.setId, validation.questions);
    res.status(201).json({ importedCount: count });
  } catch (error) { next(error); }
};

exports.assign = async (req, res, next) => {
  try {
    res.status(201).json({ id: await Interview.assign(req.user.id, req.params.setId, req.body) });
  } catch (error) { next(error); }
};

exports.studentDashboard = async (req, res, next) => {
  try { res.json(await Interview.studentDashboard(req.user.id)); } catch (error) { next(error); }
};

exports.assignmentQuestions = async (req, res, next) => {
  try {
    const questions = await Interview.questionsForAssignment(req.user.id, req.params.assignmentId);
    if (!questions.length) return res.status(404).json({ message: 'Interview assignment not found.' });
    res.json({ questions });
  } catch (error) { next(error); }
};

exports.startAttempt = async (req, res, next) => {
  try { res.status(201).json(await Interview.startAttempt(req.user.id, req.params.assignmentId)); } catch (error) { next(error); }
};

exports.saveAnswer = async (req, res, next) => {
  try {
    await Interview.saveAnswer(req.user.id, req.params.attemptId, req.body);
    res.sendStatus(204);
  } catch (error) { next(error); }
};

exports.recordEvent = async (req, res, next) => {
  try {
    await Interview.recordEvent(req.user.id, req.params.attemptId, req.body);
    res.sendStatus(204);
  } catch (error) { next(error); }
};

exports.submitAttempt = async (req, res, next) => {
  try { res.json(await Interview.submitAttempt(req.user.id, req.params.attemptId)); } catch (error) { next(error); }
};

exports.submissions = async (req, res, next) => {
  try { res.json(await Interview.adminSubmissions(req.user.id)); } catch (error) { next(error); }
};

exports.review = async (req, res, next) => {
  try {
    const review = await Interview.attemptReview(req.user.id, req.params.attemptId);
    if (!review) return res.status(404).json({ message: 'Submission not found.' });
    res.json(review);
  } catch (error) { next(error); }
};

exports.saveReview = async (req, res, next) => {
  try { res.json(await Interview.reviewAttempt(req.user.id, req.params.attemptId, req.body)); } catch (error) { next(error); }
};
