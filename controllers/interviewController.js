const multer = require('multer');
const Interview = require('../models/interviewModel');
const {
  parseWorkbook,
  validateRows,
  buildTemplateWorkbook
} = require('../services/interviewImportService');
const {
  generateNextQuestion,
  generateComprehensiveFeedback,
  transcribeAudio
} = require('../services/aiInterviewService');

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
  try { res.status(201).json(await Interview.startAttempt(req.user.id, req.params.assignmentId, req.body)); } catch (error) { next(error); }
};

exports.saveAnswer = async (req, res, next) => {
  try {
    await Interview.saveAnswer(req.user.id, req.params.attemptId, req.body, req.file
      ? { buffer: req.file.buffer, mimeType: req.file.mimetype }
      : null);
    res.sendStatus(204);
  } catch (error) { next(error); }
};

async function sendAnswerAudio(req, res, isAdmin) {
  const audio = await Interview.answerAudio(req.user.id, req.params.attemptId, req.params.questionId, isAdmin);
  if (!audio) return res.status(404).json({ message: 'No saved audio recording was found.' });
  res.set({
    'Content-Type': audio.audio_mime_type || 'application/octet-stream',
    'Content-Length': audio.audio_data.length,
    'Cache-Control': 'private, no-store'
  });
  return res.send(audio.audio_data);
}

exports.studentAudio = async (req, res, next) => {
  try { await sendAnswerAudio(req, res, false); } catch (error) { next(error); }
};

exports.reviewAudio = async (req, res, next) => {
  try { await sendAnswerAudio(req, res, true); } catch (error) { next(error); }
};

exports.recordEvent = async (req, res, next) => {
  try {
    const result = await Interview.recordEvent(req.user.id, req.params.attemptId, req.body);
    const io = req.app.get('io');
    if (io) {
      io.to(`admin:attempt:${req.params.attemptId}`).emit('interview:warning-update', {
        attemptId: req.params.attemptId,
        eventType: req.body.eventType,
        severity: req.body.severity,
        message: req.body.message,
        warningsCount: result.warningsCount || 0,
        action: result.action || null,
        terminated: Boolean(result.terminated)
      });
      if (result.terminated) {
        io.to(`student:attempt:${req.params.attemptId}`).emit('interview:terminated', {
          attemptId: req.params.attemptId,
          message: 'The interview ended after the configured monitoring warning action. Saved answers were preserved.'
        });
      }
    }
    res.json(result);
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

exports.defaultAiAssignment = async (req, res, next) => {
  try {
    const assignmentId = await Interview.getOrCreateAiHrAssignment();
    res.json({ assignmentId });
  } catch (error) { next(error); }
};

exports.aiConverse = async (req, res, next) => {
  try {
    const { attemptId, questionId, studentAnswer, topicIndex, conversationHistory, topic } = req.body;
    const studentName = req.user.name || req.user.std_name || 'Candidate';

    if (attemptId && questionId && studentAnswer) {
      await Interview.saveAnswer(req.user.id, attemptId, {
        questionId,
        answerText: studentAnswer,
        transcriptSource: 'speech'
      }).catch(err => console.warn('Answer save in converse:', err.message));
    }

    const result = await generateNextQuestion({
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      studentAnswer: studentAnswer || '',
      currentTopicIndex: typeof topicIndex === 'number' ? topicIndex : 0,
      studentName
    });

    res.json(result);
  } catch (error) { next(error); }
};

exports.aiFeedback = async (req, res, next) => {
  try {
    const { attemptId, conversationHistory } = req.body;
    const studentName = req.user.name || req.user.std_name || 'Candidate';

    const feedback = await generateComprehensiveFeedback({
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      studentName
    });

    if (attemptId) {
      await Interview.saveAiFeedback(attemptId, feedback).catch(err => console.warn('Save AI feedback:', err.message));
    }

    res.json({ success: true, feedback, overallScore: feedback.overallScore });
  } catch (error) { next(error); }
};

exports.attemptFeedback = async (req, res, next) => {
  try {
    const row = await Interview.getAttemptFeedback(req.user.id, req.params.attemptId, req.user.role === 'admin');
    if (!row) return res.status(404).json({ message: 'Feedback not found.' });
    let feedback = row.ai_feedback;
    if (typeof feedback === 'string') {
      try { feedback = JSON.parse(feedback); } catch {}
    }
    res.json({ feedback, attempt: row });
  } catch (error) { next(error); }
};

exports.aiTranscribe = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Audio file required for transcription.' });
    const text = await transcribeAudio(req.file.buffer, req.file.mimetype);
    res.json({ text });
  } catch (error) { next(error); }
};
