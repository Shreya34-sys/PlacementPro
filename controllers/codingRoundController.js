const CodingRound = require('../models/codingRoundModel');
const CodingAttempt = require('../models/codingAttemptModel');
const { evaluate, studentSafeResult } = require('../services/codingRunnerService');
const db = require('../config/db');
const { randomUUID } = require('crypto');

const severity = {
  tab_switch: 'medium', focus_lost: 'low', fullscreen_exit: 'medium',
  no_face: 'medium', multiple_faces: 'high', looking_away: 'medium',
  audio_spike: 'medium', background_voice: 'high', clipboard: 'medium',
  paste_burst: 'medium', manual: 'low'
};

function io(req) { return req.app.get('io')?.of('/coding'); }

function emit(req, event, payload, attemptId) {
  const namespace = io(req);
  if (namespace) {
    namespace.to(`round:${payload.roundId || ''}`).emit(event, payload);
    if (attemptId) namespace.to(`attempt:${attemptId}`).emit(event, payload);
  }
}

exports.adminList = async (req, res, next) => {
  try { res.json(await CodingRound.listForAdmin(req.user.id)); } catch (e) { next(e); }
};

exports.adminCreate = async (req, res, next) => {
  try {
    const required = ['title', 'startsAt', 'endsAt'];
    if (required.some(k => !req.body[k])) return res.status(400).json({ message: 'Title, start time and end time are required.' });
    res.status(201).json(await CodingRound.create(req.user.id, req.body));
  } catch (e) { next(e); }
};

exports.adminGet = async (req, res, next) => {
  try {
    const data = await CodingRound.getAdmin(req.params.roundId, req.user.id);
    if (!data) return res.status(404).json({ message: 'Coding round not found.' });
    res.json(data);
  } catch (e) { next(e); }
};

exports.adminAddQuestion = async (req, res, next) => {
  try {
    const round = await CodingRound.getAdmin(req.params.roundId, req.user.id);
    if (!round) return res.status(404).json({ message: 'Coding round not found.' });
    const q = req.body;
    if (!q.title || !q.problemStatement) {
      return res.status(400).json({ message: 'Question title and problem statement are required.' });
    }
    if (!Array.isArray(q.allowedLanguages) || q.allowedLanguages.length === 0) {
      return res.status(400).json({ message: 'Select at least one allowed language.' });
    }
    if (!Array.isArray(q.testCases) || q.testCases.length === 0) {
      return res.status(400).json({ message: 'At least one test case is required.' });
    }
    if (q.testCases.some(tc => typeof tc !== 'object' || tc === null || !('output' in tc))) {
      return res.status(400).json({ message: 'Every test case needs an expected output.' });
    }
    res.status(201).json({ id: await CodingRound.addQuestion(req.params.roundId, q) });
  } catch (e) { next(e); }
};


exports.adminUpdateQuestion = async (req, res, next) => {
  try {
    const round = await CodingRound.getAdmin(req.params.roundId, req.user.id);
    if (!round) return res.status(404).json({ message: 'Coding round not found.' });
    const q = req.body;
    if (!q.title || !q.problemStatement) return res.status(400).json({ message: 'Question title and problem statement are required.' });
    if (!Array.isArray(q.allowedLanguages) || !q.allowedLanguages.length) return res.status(400).json({ message: 'Select at least one allowed language.' });
    if (!Array.isArray(q.testCases) || !q.testCases.length) return res.status(400).json({ message: 'At least one test case is required.' });
    if (q.testCases.some(tc => !tc || typeof tc !== 'object' || !('output' in tc))) return res.status(400).json({ message: 'Every test case needs an expected output.' });
    const ok = await CodingRound.updateQuestion(req.params.roundId, req.params.questionId, q);
    if (!ok) return res.status(404).json({ message: 'Question not found.' });
    res.json({ message: 'Question saved.', id: req.params.questionId });
  } catch (e) { next(e); }
};

exports.adminAssign = async (req, res, next) => {
  try {
    const emails = Array.isArray(req.body.emails)
      ? req.body.emails
      : String(req.body.emails || '').split(/[,;\n]/);
    const result = await CodingRound.assignStudents(req.params.roundId, req.user.id, emails);
    if (!result) return res.status(404).json({ message: 'Coding round not found.' });
    res.status(201).json({ assignments: result });
  } catch (e) { next(e); }
};

exports.adminStatus = async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['draft', 'published', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    if (status === 'published') {
      const round = await CodingRound.getAdmin(req.params.roundId, req.user.id);
      if (!round) return res.status(404).json({ message: 'Coding round not found.' });
      if (!round.questions.length) {
        return res.status(400).json({ message: 'Add at least one coding question before publishing.' });
      }
      if (new Date(round.ends_at) <= new Date(round.starts_at)) {
        return res.status(400).json({ message: 'End time must be after start time.' });
      }
      for (const q of round.questions) {
        if (!Array.isArray(q.allowed_languages) || !q.allowed_languages.length) {
          return res.status(400).json({ message: `Select at least one language for "${q.title}".` });
        }
        if (!Array.isArray(q.test_cases) || !q.test_cases.length) {
          return res.status(400).json({ message: `Add at least one test case for "${q.title}".` });
        }
      }
    }

    const ok = await CodingRound.updateStatus(req.params.roundId, req.user.id, status);
    if (!ok) return res.status(404).json({ message: 'Coding round not found.' });
    res.json({ message: 'Status updated.' });
  } catch (e) { next(e); }
};

exports.adminDelete = async (req, res, next) => {
  try {
    const ok = await CodingRound.softDelete(req.params.roundId, req.user.id);
    if (!ok) return res.status(404).json({ message: 'Coding round not found.' });
    res.json({ message: 'Coding round deleted.' });
  } catch (e) { next(e); }
};

exports.studentList = async (req, res, next) => {
  try { res.json(await CodingRound.availableForStudent(req.user.id)); } catch (e) { next(e); }
};

exports.studentOpen = async (req, res, next) => {
  try {
    const data = await CodingRound.getForStudent(req.params.roundId, req.user.id);
    if (!data) return res.status(404).json({ message: 'Coding round not available.' });
    res.json(data);
  } catch (e) { next(e); }
};

exports.start = async (req, res, next) => {
  try {
    const attempt = await CodingAttempt.start(req.params.roundId, req.user.id);
    res.status(201).json(attempt);
  } catch (e) { next(e); }
};

exports.snapshot = async (req, res, next) => {
  try {
    const question = await CodingRound.getQuestion(req.body.questionId);
    const ownerAttempt = await CodingAttempt.ensureOwner(req.params.attemptId, req.user.id);
    if (!question || !ownerAttempt || question.round_id !== ownerAttempt.round_id) {
      return res.status(400).json({ message: 'Invalid question for this coding attempt.' });
    }
    if (!(question.allowed_languages || []).includes(req.body.language)) {
      return res.status(400).json({ message: 'Language is not allowed for this question.' });
    }

    const ok = await CodingAttempt.snapshot(
      req.params.attemptId, req.body.questionId, req.body.language,
      String(req.body.sourceCode || ''), req.user.id
    );
    if (!ok) return res.status(403).json({ message: 'Attempt is not active.' });

    const attempt = await CodingAttempt.ensureOwner(req.params.attemptId, req.user.id);
    emit(req, 'coding:code-update', {
      roundId: attempt.round_id, attemptId: attempt.id, studentId: req.user.id,
      questionId: req.body.questionId, language: req.body.language,
      sourceCode: String(req.body.sourceCode || '').slice(0, 50000)
    }, attempt.id);
    res.sendStatus(204);
  } catch (e) { next(e); }
};

exports.run = async (req, res, next) => {
  try {
    const attempt = await CodingAttempt.ensureOwner(req.params.attemptId, req.user.id);
    if (!attempt || attempt.state !== 'started') return res.status(403).json({ message: 'Attempt is not active.' });
    const question = await CodingRound.getQuestion(req.body.questionId);
    if (!question || question.round_id !== attempt.round_id) return res.status(404).json({ message: 'Question not found.' });

    const allowed = question.allowed_languages || [];
    if (!allowed.includes(req.body.language)) return res.status(400).json({ message: 'Language is not allowed for this question.' });

    const publicCases = question.test_cases.filter(tc => tc.is_hidden !== true);
    const result = await evaluate({
      sourceCode: req.body.sourceCode,
      language: req.body.language,
      testCases: publicCases,
      mode: 'run'
    });
    await CodingAttempt.submission(attempt.id, question.id, req.body.language, req.body.sourceCode, 'run', result);
    res.json({ ...studentSafeResult(result, 'run'), hidden: false });
  } catch (e) { next(e); }
};

exports.submitQuestion = async (req, res, next) => {
  try {
    const attempt = await CodingAttempt.ensureOwner(req.params.attemptId, req.user.id);
    if (!attempt || attempt.state !== 'started') return res.status(403).json({ message: 'Attempt is not active.' });
    const question = await CodingRound.getQuestion(req.body.questionId);
    if (!question || question.round_id !== attempt.round_id) return res.status(404).json({ message: 'Question not found.' });
    if (!(question.allowed_languages || []).includes(req.body.language)) return res.status(400).json({ message: 'Language is not allowed.' });

    const result = await evaluate({
      sourceCode: req.body.sourceCode,
      language: req.body.language,
      testCases: question.test_cases,
      mode: 'submit'
    });
    await CodingAttempt.submission(attempt.id, question.id, req.body.language, req.body.sourceCode, 'submit', result);

    emit(req, 'coding:submission', {
      roundId: attempt.round_id, attemptId: attempt.id, studentId: req.user.id,
      questionId: question.id, score: result.score, passedCount: result.passedCount,
      totalCount: result.totalCount, status: result.status
    }, attempt.id);
    res.json(studentSafeResult(result, 'submit'));
  } catch (e) { next(e); }
};

exports.submitRound = async (req, res, next) => {
  try {
    const result = await CodingAttempt.submit(req.params.attemptId, req.user.id);
    res.json(result);
  } catch (e) { next(e); }
};

exports.studentResult = async (req, res, next) => {
  try {
    const result = await CodingAttempt.result(req.params.attemptId, req.user.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    res.json(result);
  } catch (e) { next(e); }
};

exports.flag = async (req, res, next) => {
  try {
    const attempt = await CodingAttempt.ensureOwner(req.params.attemptId, req.user.id);
    if (!attempt || attempt.state !== 'started') return res.status(403).json({ message: 'Attempt is not active.' });

    const eventType = String(req.body.eventType || '');
    const message = String(req.body.message || '').trim();
    if (!severity[eventType] || !message) return res.status(400).json({ message: 'Valid eventType and message are required.' });

    const [duplicate] = await db.execute(`
      SELECT id FROM coding_proctor_flags
      WHERE attempt_id=? AND event_type=? AND message=? AND created_at >= DATE_SUB(NOW(), INTERVAL 2 SECOND)
      LIMIT 1
    `, [attempt.id, eventType, message]);
    if (duplicate.length) {
      const [current] = await db.execute('SELECT warnings_count, integrity_index FROM coding_attempts WHERE id=?', [attempt.id]);
      return res.json({ warningsCount: current[0].warnings_count, integrityIndex: current[0].integrity_index, duplicate: true });
    }

    const flagId = randomUUID();
    await db.execute(`
      INSERT INTO coding_proctor_flags
      (id, attempt_id, severity, event_type, message, evidence_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [flagId, attempt.id, severity[eventType], eventType, message, req.body.evidenceUrl || null]);

    await db.execute(`
      UPDATE coding_attempts a
      JOIN coding_rounds r ON r.id=a.round_id
      SET a.warnings_count=LEAST(a.warnings_count+1, r.max_warnings),
          a.integrity_index=GREATEST(
            a.integrity_index-CASE WHEN ?='high' THEN 20 WHEN ?='medium' THEN 10 ELSE 5 END,
            0
          )
      WHERE a.id=? AND a.state='started'
    `, [severity[eventType], severity[eventType], attempt.id]);

    const [updated] = await db.execute(
      'SELECT warnings_count, integrity_index FROM coding_attempts WHERE id=?',
      [attempt.id]
    );
    const warningsCount = Number(updated[0].warnings_count);
    const maxWarnings = Number(attempt.max_warnings);

    emit(req, 'coding:flag', {
      roundId: attempt.round_id, attemptId: attempt.id, studentId: req.user.id,
      flagId, eventType, severity: severity[eventType], message,
      warningsCount, integrityIndex: Number(updated[0].integrity_index)
    }, attempt.id);

    if (warningsCount >= maxWarnings) {
      const result = await CodingAttempt.submit(attempt.id, req.user.id);
      await db.execute(`UPDATE coding_attempts SET state='auto_submitted' WHERE id=?`, [attempt.id]);
      emit(req, 'coding:auto-submitted', { roundId: attempt.round_id, attemptId: attempt.id, reason: 'warning_limit' }, attempt.id);
      return res.json({ warningsCount, maxWarnings, autoSubmitted: true, result });
    }
    res.status(201).json({ warningsCount, maxWarnings, autoSubmitted: false });
  } catch (e) { next(e); }
};

exports.adminMonitor = async (req, res, next) => {
  try {
    const attempts = await CodingAttempt.adminAttempts(req.params.roundId, req.user.id);
    const flags = await CodingAttempt.adminFlags(req.params.roundId, req.user.id);
    res.json({ attempts, flags });
  } catch (e) { next(e); }
};

exports.adminResolveFlag = async (req, res, next) => {
  try {
    const result = await CodingAttempt.resolveFlag(req.params.flagId, req.user.id);
    if (!result) return res.status(404).json({ message: 'Flag not found or already resolved.' });
    emit(req, 'coding:warning-resolved', {
      roundId: result.round_id, attemptId: result.attempt_id,
      flagId: result.id, warningsCount: result.warnings_count,
      integrityIndex: result.integrity_index
    }, result.attempt_id);
    res.json(result);
  } catch (e) { next(e); }
};

exports.adminResults = async (req, res, next) => {
  try {
    const attempts = await CodingAttempt.adminAttempts(req.params.roundId, req.user.id);
    res.json(attempts.filter(a => ['submitted','auto_submitted','disqualified'].includes(a.state)));
  } catch (e) { next(e); }
};

exports.adminResultDetail = async (req, res, next) => {
  try {
    const result = await CodingAttempt.result(req.params.attemptId);
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    res.json(result);
  } catch (e) { next(e); }
};
