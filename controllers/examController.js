const Exam = require('../models/examModel');
const Attempt = require('../models/attemptModel');
const db = require('../config/db');
const progressService = require('../services/progressService');
const {
  parseWorkbook,
  validateQuestionRows,
  buildTemplateWorkbook
} = require('../services/excelQuestionImportService');

const completedImports = new Map();

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function validateImportMetadata(body) {
  const errors = [];
  const target = body.target === 'existing' ? 'existing' : 'new';
  const status = body.status === 'published' ? 'published' : 'draft';
  const durationMinutes = numberOrDefault(body.durationMinutes, 20);
  const negativeMarking = numberOrDefault(body.negativeMarking, 0);
  const startsAt = String(body.startsAt || '').replace('T', ' ');
  const endsAt = String(body.endsAt || '').replace('T', ' ');

  if (target === 'existing') {
    if (!body.examId) errors.push('Choose an existing question set.');
  } else {
    if (!String(body.title || '').trim()) errors.push('Question set title is required.');
    if (!String(body.description || body.instructions || '').trim()) errors.push('Description or instructions are required.');
    if (!durationMinutes || durationMinutes < 1) errors.push('Duration must be at least 1 minute.');
    if (!startsAt) errors.push('Start date and time is required.');
    if (!endsAt) errors.push('End date and time is required.');
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) errors.push('End date must be after start date.');
  }

  if (negativeMarking < 0 || negativeMarking > 100) errors.push('Negative marking must be between 0 and 100.');

  return {
    errors,
    metadata: {
      target,
      examId: body.examId,
      title: String(body.title || '').trim(),
      instructions: String(body.description || body.instructions || '').trim(),
      durationMinutes,
      startsAt: startsAt ? `${startsAt.length === 16 ? startsAt + ':00' : startsAt}` : '',
      endsAt: endsAt ? `${endsAt.length === 16 ? endsAt + ':00' : endsAt}` : '',
      status,
      negativeMarking
    }
  };
}

function buildTopics(questions) {
  let displayOrder = 1;
  const topicMap = new Map();
  questions.forEach(question => {
    const topicName = question.topic || 'General';
    if (!topicMap.has(topicName)) topicMap.set(topicName, { name: topicName, questions: [] });
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(String(question.correctAnswer || '').toUpperCase());
    topicMap.get(topicName).questions.push({
      text: question.question,
      explanation: question.explanation || null,
      difficulty: question.difficulty || 'medium',
      marks: Number(question.marks),
      displayOrder: displayOrder++,
      options: question.options.map((option, index) => ({
        text: option,
        isCorrect: index === correctIndex
      }))
    });
  });
  return [...topicMap.values()];
}

function rowsFromSubmittedQuestions(questions) {
  return (Array.isArray(questions) ? questions : []).map((question, index) => ({
    __rowNumber: question.rowNumber || index + 2,
    question: question.question,
    optionA: question.options && question.options[0],
    optionB: question.options && question.options[1],
    optionC: question.options && question.options[2],
    optionD: question.options && question.options[3],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    topic: question.topic,
    difficulty: question.difficulty,
    marks: question.marks,
    negativeMarks: question.negativeMarks
  }));
}

exports.create = async (req, res, next) => {
  try { res.status(201).json({ id: await Exam.create(req.user.id, req.body) }); } catch (error) { next(error); }
};

exports.template = async (req, res, next) => {
  try {
    const buffer = await buildTemplateWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="placementpro-aptitude-template.xlsx"');
    res.send(buffer);
  } catch (error) { next(error); }
};

exports.previewImport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Upload an Excel file before previewing.' });
    const result = await parseWorkbook(req.file.buffer, req.file.originalname);
    res.json(result);
  } catch (error) { next(error); }
};

exports.saveImport = async (req, res, next) => {
  try {
    const importToken = String(req.body.importToken || '');
    if (importToken && completedImports.has(importToken)) {
      return res.status(200).json({
        id: completedImports.get(importToken),
        duplicate: true,
        importedCount: 0,
        message: 'This import was already saved.'
      });
    }

    const { errors: metadataErrors, metadata } = validateImportMetadata(req.body);
    const validation = validateQuestionRows(rowsFromSubmittedQuestions(req.body.questions));
    if (metadataErrors.length || validation.errors.length) {
      return res.status(400).json({
        message: 'Fix validation errors before saving.',
        metadataErrors,
        errors: validation.errors,
        stats: validation.stats
      });
    }

    const topics = buildTopics(validation.questions);
    const examId = metadata.target === 'existing'
      ? await Exam.appendQuestions(req.user.id, metadata.examId, {
        status: metadata.status,
        negativeMarking: metadata.negativeMarking,
        topics
      })
      : await Exam.create(req.user.id, {
        title: metadata.title,
        instructions: metadata.instructions,
        durationMinutes: metadata.durationMinutes,
        startsAt: metadata.startsAt,
        endsAt: metadata.endsAt,
        status: metadata.status,
        negativeMarking: metadata.negativeMarking,
        topics
      });

    if (importToken) {
      completedImports.set(importToken, examId);
      setTimeout(() => completedImports.delete(importToken), 15 * 60 * 1000).unref();
    }

    res.status(201).json({
      id: examId,
      importedCount: validation.questions.length,
      errors: validation.errors,
      message: `Imported ${validation.questions.length} questions successfully.`
    });
  } catch (error) { next(error); }
};

exports.listForAdmin = async (req, res, next) => {
  try { res.json(await Exam.listForAdmin(req.user.id)); } catch (error) { next(error); }
};

exports.listAvailable = async (req, res, next) => {
  try { res.json(await Exam.availableForStudent(req.user.id)); } catch (error) { next(error); }
};
exports.open = async (req, res, next) => {
  try {
   const [exam] = await db.execute(`SELECT id,title,instructions,duration_minutes,starts_at,ends_at,status FROM exams
      WHERE id=? AND status='published' AND deleted_at IS NULL AND NOW() BETWEEN starts_at AND ends_at`, [req.params.examId]);
    if (!exam[0]) return res.status(403).json({ message: 'This exam is not currently open.' });
    res.json({ exam: exam[0], questions: await Exam.studentExam(req.params.examId) });
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => { try { const removed = await Exam.remove(req.params.examId, req.user.id); if (!removed) return res.status(404).json({ message: 'Exam not found.' }); res.sendStatus(204); } catch (error) { next(error); } };
exports.start = async (req, res, next) => {
  try { res.status(201).json(await Attempt.start(req.params.examId, req.user.id)); } catch (error) { next(error); }
};
exports.answer = async (req, res, next) => {
  try {
    await Attempt.saveAnswerForUser(
      req.params.attemptId,
      req.user.id,
      req.body.questionId,
      req.body.optionId,
      req.body.markedForReview
    );
    await progressService.emitProgress(req.app.get('io'), req.user.id);
    res.sendStatus(204);
  } catch (error) { next(error); }
};
exports.submit = async (req, res, next) => {
  try {
    const result = await Attempt.submitForUser(req.params.attemptId, req.user.id, Boolean(req.body.forced));
    if (result && result.state !== 'started') {
      await progressService.emitProgress(req.app.get('io'), req.user.id);
    }
    res.json(result);
  } catch (error) { next(error); }
};
exports.result = async (req, res, next) => {
  try {
    const [summary] = await db.execute(`SELECT a.score,a.state,e.title, COUNT(q.id) question_count,
      SUM(CASE WHEN o.is_correct=1 THEN 1 ELSE 0 END) correct_count FROM exam_attempts a JOIN exams e ON e.id=a.exam_id
      JOIN exam_questions q ON q.exam_id=e.id LEFT JOIN attempt_answers aa ON aa.attempt_id=a.id AND aa.question_id=q.id
      LEFT JOIN question_options o ON o.id=aa.option_id WHERE a.id=? GROUP BY a.id`, [req.params.attemptId]);
    const [topics] = await db.execute(`SELECT t.name, SUM(q.marks) available_marks,
      COALESCE(SUM(CASE WHEN o.is_correct=1 THEN q.marks ELSE 0 END),0) earned_marks FROM exam_attempts a
      JOIN exam_questions q ON q.exam_id=a.exam_id JOIN exam_topics t ON t.id=q.topic_id
      LEFT JOIN attempt_answers aa ON aa.attempt_id=a.id AND aa.question_id=q.id LEFT JOIN question_options o ON o.id=aa.option_id
      WHERE a.id=? GROUP BY t.id ORDER BY t.display_order`, [req.params.attemptId]);
    res.json({ summary: summary[0], topics });
  } catch (error) { next(error); }
};
