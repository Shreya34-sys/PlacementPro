const db = require('../config/db');
const Attempt = require('../models/attemptModel');
const { randomUUID } = require('crypto');

const MAX_WARNINGS = 3;
const severityFor = {
  camera_off: 'high',
  multiple_faces: 'high',
  no_face: 'medium',
  mobile_detected: 'high',
  tab_switch: 'medium',
  clipboard: 'medium',
  focus_lost: 'low',
  manual: 'low'
};

exports.activeAttempts = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.id AS attempt_id, a.student_id, u.fullName, s.division,
             a.warnings_count, a.started_at
      FROM exam_attempts a
      JOIN users u ON u.id = a.student_id
      LEFT JOIN students s ON s.std_id = a.student_id
      WHERE a.exam_id = ?
        AND a.state = 'started'
        AND u.is_active = TRUE
      ORDER BY a.warnings_count DESC, a.started_at DESC
    `, [req.params.examId]);

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.flag = async (req, res, next) => {
  try {
    const [attempts] = await db.execute(
      `SELECT a.*, e.max_warnings
       FROM exam_attempts a
       JOIN exams e ON e.id = a.exam_id
       WHERE a.id = ?
         AND a.student_id = ?
         AND a.state = 'started'`,
      [req.params.attemptId, req.user.id]
    );

    const attempt = attempts[0];
    if (!attempt) {
      return res.status(403).json({ message: 'Active attempt not found.' });
    }

    const severity = req.body.severity || severityFor[req.body.eventType] || 'low';

    await db.execute(
      `INSERT INTO proctoring_flags
       (id, attempt_id, severity, event_type, message, evidence_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        attempt.id,
        severity,
        req.body.eventType,
        req.body.message,
        req.body.evidenceUrl || null
      ]
    );

    await db.execute(
      'UPDATE exam_attempts SET warnings_count = warnings_count + 1 WHERE id = ?',
      [attempt.id]
    );

    const [updated] = await db.execute(
      'SELECT warnings_count FROM exam_attempts WHERE id = ?',
      [attempt.id]
    );

    const warningsCount = Number(updated[0].warnings_count || 0);
    const io = req.app.get('io');

    io.to(`admin:exam:${attempt.exam_id}`).emit('proctor:flag', {
      attemptId: attempt.id,
      severity,
      message: req.body.message,
      eventType: req.body.eventType,
      warningsCount
    });

    // Proctoring rule: exactly 3 warnings means automatic submission.
    const autoSubmitted = warningsCount >= MAX_WARNINGS;

    if (autoSubmitted) {
      const result = await Attempt.submit(attempt.id, true);
      io.to(`student:attempt:${attempt.id}`).emit('exam:auto-submitted', result);
    }

    return res.status(201).json({
      warningsCount,
      maxWarnings: MAX_WARNINGS,
      autoSubmitted
    });
  } catch (error) {
    next(error);
  }
};

exports.liveFlags = async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT f.*, a.student_id, u.fullName
      FROM proctoring_flags f
      JOIN exam_attempts a ON a.id = f.attempt_id
      JOIN users u ON u.id = a.student_id
      WHERE a.exam_id = ?
        AND f.resolved_at IS NULL
      ORDER BY FIELD(f.severity, 'high', 'medium', 'low'), f.created_at DESC
    `, [req.params.examId]);

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.resolve = async (req, res, next) => {
  try {
    await db.execute(
      'UPDATE proctoring_flags SET resolved_at = NOW(), resolved_by = ? WHERE id = ?',
      [req.user.id, req.params.flagId]
    );
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

exports.removeStudent = async (req, res, next) => {
  try {
    await db.execute(
      "UPDATE users SET is_active = FALSE WHERE id = ? AND role = 'student'",
      [req.params.studentId]
    );

    if (req.body.flagId) {
      await db.execute(
        'UPDATE proctoring_flags SET resolved_at = NOW(), resolved_by = ? WHERE id = ?',
        [req.user.id, req.body.flagId]
      );
    }

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
