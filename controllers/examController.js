const Exam = require('../models/examModel');
const Attempt = require('../models/attemptModel');
const db = require('../config/db');
const { createHash } = require('crypto');
const progressService = require('../services/progressService');
const {
  parseWorkbook,
  validateQuestionRows,
  buildTemplateWorkbook
} = require('../services/excelQuestionImportService');

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

  let startsAt = String(body.startsAt || '').replace('T', ' ');
  let endsAt = String(body.endsAt || '').replace('T', ' ');

  if (!startsAt) {
    const now = new Date();
    startsAt = now.toISOString().slice(0, 19).replace('T', ' ');
  }
  if (!endsAt) {
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    endsAt = end.toISOString().slice(0, 19).replace('T', ' ');
  }

  const title = String(body.title || '').trim();

  if (target === 'existing') {
    if (!body.examId) errors.push('Choose an existing question set.');
  } else {
    if (!title) errors.push('Question set title is required.');
    // Description is optional per requirements
    if (!durationMinutes || durationMinutes < 1) errors.push('Duration must be at least 1 minute.');
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      errors.push('End date must be after start date.');
    }
  }

  if (negativeMarking < 0 || negativeMarking > 100) errors.push('Negative marking must be between 0 and 100.');

  return {
    errors,
    metadata: {
      target,
      examId: body.examId,
      title: title || 'Aptitude Practice Set ' + new Date().toISOString().slice(0, 10),
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
    res.json({
      ...result,
      importFingerprint: createHash('sha256').update(req.file.buffer).digest('hex')
    });
  } catch (error) { next(error); }
};

exports.saveImport = async (req, res, next) => {
  try {
    const { errors: metadataErrors, metadata } = validateImportMetadata(req.body);
    const validation = validateQuestionRows(rowsFromSubmittedQuestions(req.body.questions));
    const importFingerprint = String(req.body.importFingerprint || '').toLowerCase();
    const fingerprintError = /^[a-f0-9]{64}$/.test(importFingerprint)
      ? []
      : ['The uploaded file fingerprint is missing or invalid. Preview the file again before saving.'];
    const fileErrors = validation.errors.filter(error =>
      error.field === 'Header' || error.field === 'File' ||
      (error.row === 1 && error.field === 'Negative Marks')
    );
    const skippedEmptyRows = Math.max(0, Math.min(5000, numberOrDefault(req.body.emptyRowsSkipped, 0)));
    if (metadataErrors.length || fingerprintError.length || fileErrors.length) {
      console.warn('Aptitude question import validation failed.', {
        adminId: req.user.id,
        metadataErrors,
        questionErrors: validation.errors.map(({ row, field, message }) => ({ row, field, message })),
        invalidFingerprint: fingerprintError.length > 0
      });
      return res.status(400).json({
        message: metadataErrors.length
          ? metadataErrors.join('. ')
          : fingerprintError.length
            ? 'Preview the uploaded workbook again before saving.'
            : 'The spreadsheet is missing required columns or contains a file-level validation error.',
        metadataErrors,
        errors: validation.errors,
        stats: { ...validation.stats, skippedRows: validation.stats.skippedRows + skippedEmptyRows },
        fingerprintErrors: fingerprintError
      });
    }

    if (!validation.validQuestions.length) {
      console.warn('Aptitude question import contained no valid questions.', {
        adminId: req.user.id,
        questionErrors: validation.errors.map(({ row, field, message }) => ({ row, field, message }))
      });
      return res.status(400).json({
        message: 'No valid questions were available to save.',
        errors: validation.errors,
        stats: { ...validation.stats, skippedRows: validation.stats.skippedRows + skippedEmptyRows }
      });
    }

    const topics = buildTopics(validation.validQuestions);
    const importPayload = {
      importFingerprint,
      importedCount: validation.validQuestions.length,
      skippedRows: validation.stats.skippedRows + skippedEmptyRows
    };
    const saved = metadata.target === 'existing'
      ? await Exam.appendQuestions(req.user.id, metadata.examId, {
        status: metadata.status,
        negativeMarking: metadata.negativeMarking,
        topics,
        ...importPayload
      })
      : await Exam.create(req.user.id, {
        title: metadata.title,
        instructions: metadata.instructions,
        durationMinutes: metadata.durationMinutes,
        startsAt: metadata.startsAt,
        endsAt: metadata.endsAt,
        status: metadata.status,
        negativeMarking: metadata.negativeMarking,
        topics,
        ...importPayload
      });
    if (saved && saved.duplicate) {
      return res.status(200).json({
        ...saved,
        errors: [],
        message: 'This file was already imported. No questions were added.'
      });
    }

    res.status(201).json({
      id: saved,
      importedCount: validation.validQuestions.length,
      skippedRows: validation.stats.skippedRows + skippedEmptyRows,
      errors: validation.errors,
      stats: {
        ...validation.stats,
        validRows: validation.validQuestions.length,
        skippedRows: validation.stats.skippedRows + skippedEmptyRows
      },
      message: `Imported ${validation.validQuestions.length} questions. Skipped ${validation.stats.skippedRows + skippedEmptyRows} rows.`
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
