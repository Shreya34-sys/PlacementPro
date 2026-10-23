const db = require('../config/db');
const { randomUUID } = require('crypto');

class CodingAttempt {
  static async start(roundId, studentId) {
    const [existing] = await db.execute(
      'SELECT * FROM coding_attempts WHERE round_id=? AND student_id=?',
      [roundId, studentId]
    );
    if (existing[0]) return existing[0];

    const [round] = await db.execute(
      `SELECT id, status, starts_at, ends_at FROM coding_rounds
       WHERE id=? AND status='published' AND deleted_at IS NULL`,
      [roundId]
    );
    if (!round[0]) {
      const e = new Error('Coding round is not available.');
      e.status = 404; throw e;
    }
    const now = new Date();
    if (now < new Date(round[0].starts_at) || now > new Date(round[0].ends_at)) {
      const e = new Error('Coding round is outside its scheduled time.');
      e.status = 403; throw e;
    }

    const id = randomUUID();
    await db.execute(
      `INSERT INTO coding_attempts (id, round_id, student_id) VALUES (?, ?, ?)`,
      [id, roundId, studentId]
    );
    return { id, round_id: roundId, student_id: studentId, state: 'started', warnings_count: 0 };
  }

  static async ensureOwner(attemptId, studentId) {
    const [rows] = await db.execute(
      `SELECT a.*, r.max_warnings, r.duration_minutes, r.ends_at
       FROM coding_attempts a JOIN coding_rounds r ON r.id=a.round_id
       WHERE a.id=? AND a.student_id=?`,
      [attemptId, studentId]
    );
    return rows[0] || null;
  }

  static async snapshot(attemptId, questionId, language, sourceCode, studentId) {
    const attempt = await this.ensureOwner(attemptId, studentId);
    if (!attempt || !['started'].includes(attempt.state)) return false;
    await db.execute(`
      INSERT INTO coding_code_snapshots (id, attempt_id, question_id, language, source_code)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE language=VALUES(language), source_code=VALUES(source_code), updated_at=CURRENT_TIMESTAMP
    `, [randomUUID(), attemptId, questionId, language, sourceCode]);
    return true;
  }

  static async submission(attemptId, questionId, language, sourceCode, mode, result) {
    const id = randomUUID();
    await db.execute(`
      INSERT INTO coding_submissions
      (id, attempt_id, question_id, language, source_code, mode, status, passed_count,
       total_count, score, execution_time_ms, memory_kb, result_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, attemptId, questionId, language, sourceCode, mode, result.status,
      result.passedCount, result.totalCount, result.score,
      result.executionTimeMs || null, result.memoryKb || null,
      JSON.stringify(result.results || [])
    ]);
    return id;
  }

  static async submit(attemptId, studentId) {
    const attempt = await this.ensureOwner(attemptId, studentId);
    if (!attempt) {
      const e = new Error('Attempt not found.'); e.status = 404; throw e;
    }
    if (attempt.state !== 'started') return attempt;

    // Pick exactly one (latest) submitted score per question. Using the
    // submission id as a tie-breaker avoids duplicate rows when two requests
    // arrive in the same MySQL timestamp.
    const [submissions] = await db.execute(`
      SELECT s.question_id, s.score, s.created_at, s.id
      FROM coding_submissions s
      WHERE s.attempt_id=? AND s.mode='submit'
      ORDER BY s.question_id, s.created_at DESC, s.id DESC
    `, [attemptId]);

    const latestByQuestion = new Map();
    for (const row of submissions) {
      if (!latestByQuestion.has(row.question_id)) {
        latestByQuestion.set(row.question_id, row);
      }
    }

    const [questions] = await db.execute(
      'SELECT id, points FROM coding_questions WHERE round_id=?',
      [attempt.round_id]
    );

    const maxPoints = questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
    const earned = questions.reduce((sum, q) => {
      const submission = latestByQuestion.get(q.id);
      return sum + (submission
        ? Number(submission.score || 0) * Number(q.points || 0) / 100
        : 0);
    }, 0);

    const finalScore = maxPoints > 0 ? Number(((earned / maxPoints) * 100).toFixed(2)) : 0;
    const state = 'submitted';

    await db.execute(
      `UPDATE coding_attempts
       SET state=?, submitted_at=NOW(), final_score=?
       WHERE id=? AND state='started'`,
      [state, finalScore, attemptId]
    );

    return { ...attempt, state, final_score: finalScore };
  }

  static async result(attemptId, studentId = null) {
    const where = studentId ? 'AND a.student_id=?' : '';
    const params = studentId ? [attemptId, studentId] : [attemptId];

    const [summary] = await db.execute(`
      SELECT a.id attempt_id, a.state, a.started_at, a.submitted_at, a.warnings_count,
             a.integrity_index, a.final_score, a.total_execution_ms, a.total_memory_kb,
             r.id round_id, r.title, u.fullName student_name, u.email student_email
      FROM coding_attempts a
      JOIN coding_rounds r ON r.id=a.round_id
      JOIN users u ON u.id=a.student_id
      WHERE a.id=? ${where}
    `, params);

    if (!summary[0]) return null;

    const [questions] = await db.execute(`
      SELECT id, title, points, display_order
      FROM coding_questions
      WHERE round_id=?
      ORDER BY display_order
    `, [summary[0].round_id]);

    const [submissions] = await db.execute(`
      SELECT s.question_id, s.score, s.passed_count, s.total_count, s.status,
             s.execution_time_ms, s.memory_kb, s.created_at, s.id
      FROM coding_submissions s
      WHERE s.attempt_id=? AND s.mode='submit'
      ORDER BY s.question_id, s.created_at DESC, s.id DESC
    `, [attemptId]);

    const latestByQuestion = new Map();
    for (const row of submissions) {
      if (!latestByQuestion.has(row.question_id)) {
        latestByQuestion.set(row.question_id, row);
      }
    }

    return {
      summary: summary[0],
      questions: questions.map(q => {
        const s = latestByQuestion.get(q.id);
        return {
          id: q.id,
          title: q.title,
          points: q.points,
          score: s?.score ?? null,
          passed_count: s?.passed_count ?? 0,
          total_count: s?.total_count ?? 0,
          status: s?.status ?? 'Not submitted',
          execution_time_ms: s?.execution_time_ms ?? null,
          memory_kb: s?.memory_kb ?? null
        };
      })
    };
  }

  static async adminAttempts(roundId, adminId) {
    const [rows] = await db.execute(`
      SELECT a.id attempt_id, a.student_id, u.fullName, u.email, a.state,
             a.started_at, a.submitted_at, a.warnings_count, a.integrity_index,
             a.final_score, MAX(s.created_at) last_code_update
      FROM coding_attempts a
      JOIN coding_rounds r ON r.id=a.round_id AND r.created_by=? AND r.deleted_at IS NULL
      JOIN users u ON u.id=a.student_id
      LEFT JOIN coding_submissions s ON s.attempt_id=a.id
      WHERE a.round_id=?
      GROUP BY a.id, a.student_id, u.fullName, u.email, a.state,
               a.started_at, a.submitted_at, a.warnings_count, a.integrity_index, a.final_score
      ORDER BY a.warnings_count DESC, a.started_at DESC
    `, [adminId, roundId]);
    return rows;
  }

  static async adminFlags(roundId, adminId) {
    const [rows] = await db.execute(`
      SELECT f.*, a.student_id, u.fullName, u.email
      FROM coding_proctor_flags f
      JOIN coding_attempts a ON a.id=f.attempt_id
      JOIN coding_rounds r ON r.id=a.round_id AND r.created_by=? AND r.deleted_at IS NULL
      JOIN users u ON u.id=a.student_id
      WHERE a.round_id=? AND f.resolved_at IS NULL
      ORDER BY FIELD(f.severity,'high','medium','low'), f.created_at DESC
    `, [adminId, roundId]);
    return rows;
  }

  static async resolveFlag(flagId, adminId) {
    const [rows] = await db.execute(`
      SELECT f.*, a.round_id, a.warnings_count
      FROM coding_proctor_flags f JOIN coding_attempts a ON a.id=f.attempt_id
      JOIN coding_rounds r ON r.id=a.round_id
      WHERE f.id=? AND r.created_by=? AND f.resolved_at IS NULL
    `, [flagId, adminId]);
    if (!rows[0]) return null;
    await db.execute(
      'UPDATE coding_proctor_flags SET resolved_at=NOW(), resolved_by=? WHERE id=? AND resolved_at IS NULL',
      [adminId, flagId]
    );
    await db.execute(
      'UPDATE coding_attempts SET warnings_count=GREATEST(warnings_count-1,0), integrity_index=LEAST(GREATEST(integrity_index+5,0),100) WHERE id=?',
      [rows[0].attempt_id]
    );
    const [updated] = await db.execute(
      'SELECT warnings_count, integrity_index FROM coding_attempts WHERE id=?',
      [rows[0].attempt_id]
    );
    return { ...rows[0], ...updated[0] };
  }
}

module.exports = CodingAttempt;
