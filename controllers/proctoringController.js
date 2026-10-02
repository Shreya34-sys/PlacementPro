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
      ORDER BY a.warnings_count DESC, a.started_at DESC
    `, [req.params.examId]);

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.flag = async (req, res, next) => {
  try {
    const eventType = req.body.eventType;
    const message = String(req.body.message || '').trim();
    const severity = req.body.severity || severityFor[eventType] || 'low';

    if (!eventType || !message) {
      return res.status(400).json({
        message: 'eventType and message are required.'
      });
    }

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
      return res.status(403).json({
        message: 'Active attempt not found.'
      });
    }

    /*
     * Safety net for duplicate browser events.
     * The live exam page has a single proctoring listener now,
     * but this also prevents two identical requests arriving at
     * the server in the same instant from becoming two warnings.
     */
    const [recentDuplicate] = await db.execute(
      `SELECT id
       FROM proctoring_flags
       WHERE attempt_id = ?
         AND event_type = ?
         AND message = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 1 SECOND)
       ORDER BY created_at DESC
       LIMIT 1`,
      [attempt.id, eventType, message]
    );

    if (recentDuplicate.length > 0) {
      const [current] = await db.execute(
        'SELECT warnings_count FROM exam_attempts WHERE id = ?',
        [attempt.id]
      );

      return res.status(200).json({
        warningsCount: Number(current[0]?.warnings_count || 0),
        maxWarnings: MAX_WARNINGS,
        autoSubmitted: false,
        duplicate: true
      });
    }

    const flagId = randomUUID();

    await db.execute(
      `INSERT INTO proctoring_flags
       (id, attempt_id, severity, event_type, message, evidence_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        flagId,
        attempt.id,
        severity,
        eventType,
        message,
        req.body.evidenceUrl || null
      ]
    );

    await db.execute(
      'UPDATE exam_attempts SET warnings_count = warnings_count + 1 WHERE id = ? AND state = "started"',
      [attempt.id]
    );

    const [updated] = await db.execute(
      'SELECT warnings_count FROM exam_attempts WHERE id = ?',
      [attempt.id]
    );

    const warningsCount = Number(updated[0]?.warnings_count || 0);
    const io = req.app.get('io');

    if (io) {
      io.to(`admin:exam:${attempt.exam_id}`).emit('proctor:flag', {
        attemptId: attempt.id,
        flagId,
        severity,
        message,
        eventType,
        warningsCount
      });
    }

    const autoSubmitted = warningsCount >= MAX_WARNINGS;

    if (autoSubmitted) {
      const result = await Attempt.submit(attempt.id, true);

      if (io) {
        io.to(`student:attempt:${attempt.id}`).emit(
          'exam:auto-submitted',
          result
        );
      }
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
    const [flags] = await db.execute(
      `SELECT f.id, f.attempt_id, a.exam_id, a.state, a.warnings_count
       FROM proctoring_flags f
       JOIN exam_attempts a ON a.id = f.attempt_id
       WHERE f.id = ?
         AND f.resolved_at IS NULL`,
      [req.params.flagId]
    );

    const flag = flags[0];

    if (!flag) {
      return res.status(404).json({
        message: 'Flag not found or already resolved.'
      });
    }

    await db.execute(
      `UPDATE proctoring_flags
       SET resolved_at = NOW(), resolved_by = ?
       WHERE id = ? AND resolved_at IS NULL`,
      [req.user.id, req.params.flagId]
    );

    /*
     * warnings_count represents unresolved/current warnings on the
     * attempt. Resolving one warning therefore removes one from it.
     * It can never go below zero.
     */
    await db.execute(
      `UPDATE exam_attempts
       SET warnings_count = GREATEST(warnings_count - 1, 0)
       WHERE id = ?`,
      [flag.attempt_id]
    );

    const [updated] = await db.execute(
      'SELECT warnings_count FROM exam_attempts WHERE id = ?',
      [flag.attempt_id]
    );

    const warningsCount = Number(updated[0]?.warnings_count || 0);
    const io = req.app.get('io');

    if (io) {
      io.to(`admin:exam:${flag.exam_id}`).emit(
        'proctor:warning-resolved',
        {
          attemptId: flag.attempt_id,
          flagId: flag.id,
          warningsCount
        }
      );
    }

    return res.status(200).json({
      attemptId: flag.attempt_id,
      flagId: flag.id,
      warningsCount,
      maxWarnings: MAX_WARNINGS
    });
  } catch (error) {
    next(error);
  }
};

exports.removeStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const flagId = req.body.flagId;

    if (!flagId) {
      return res.status(400).json({
        message: 'flagId is required to remove a student from the active assessment.'
      });
    }

    /*
     * IMPORTANT:
     * Removing a student from THIS assessment must NOT disable the
     * student's account. The old implementation set users.is_active=FALSE,
     * which prevented the student from accessing every future assessment.
     *
     * The flag identifies the exact attempt we need to terminate.
     */
    const [rows] = await db.execute(
      `SELECT f.id AS flag_id,
              f.attempt_id,
              f.resolved_at,
              a.exam_id,
              a.student_id,
              a.state
       FROM proctoring_flags f
       JOIN exam_attempts a ON a.id = f.attempt_id
       WHERE f.id = ?
         AND a.student_id = ?`,
      [flagId, studentId]
    );

    const record = rows[0];

    if (!record) {
      return res.status(404).json({
        message: 'The selected warning does not belong to this student.'
      });
    }

    if (record.state === 'started') {
      const result = await Attempt.submit(record.attempt_id, true);

      const io = req.app.get('io');

      if (io) {
        io.to(`student:attempt:${record.attempt_id}`).emit(
          'exam:auto-submitted',
          {
            ...result,
            reason: 'removed_by_admin'
          }
        );
      }
    }

    /*
     * Resolve all currently open flags for this attempt because the
     * attempt is no longer active.
     */
    await db.execute(
      `UPDATE proctoring_flags
       SET resolved_at = COALESCE(resolved_at, NOW()),
           resolved_by = CASE
             WHEN resolved_at IS NULL THEN ?
             ELSE resolved_by
           END
       WHERE attempt_id = ?
         AND resolved_at IS NULL`,
      [req.user.id, record.attempt_id]
    );

    /*
     * Do NOT set users.is_active=FALSE here.
     * The student's account remains valid for future assessments.
     *
     * This also repairs accounts that were disabled by the old
     * remove-student implementation.
     */
    await db.execute(
      `UPDATE users
       SET is_active = TRUE
       WHERE id = ? AND role = 'student'`,
      [studentId]
    );

    const io = req.app.get('io');

    if (io) {
      io.to(`admin:exam:${record.exam_id}`).emit(
        'proctor:student-removed',
        {
          attemptId: record.attempt_id,
          studentId
        }
      );
    }

    return res.status(200).json({
      message: 'Student removed from the current assessment.',
      attemptId: record.attempt_id,
      studentId,
      examId: record.exam_id
    });
  } catch (error) {
    next(error);
  }
};
