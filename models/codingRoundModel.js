const db = require('../config/db');
const { randomUUID } = require('crypto');

const LANGUAGES = {
  python: { judge0Id: 71, label: 'Python 3' },
  java: { judge0Id: 62, label: 'Java' },
  cpp: { judge0Id: 54, label: 'C++' },
  javascript: { judge0Id: 63, label: 'JavaScript (Node.js)' }
};

function normalizeLanguages(value) {
  if (Array.isArray(value)) return value.filter(x => LANGUAGES[x]);
  return Object.keys(LANGUAGES);
}

function parseJson(value, fallback = []) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

class CodingRound {
  static async create(adminId, payload) {
    const id = randomUUID();
    const accessCode = payload.accessCode || randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    await db.execute(`
      INSERT INTO coding_rounds
      (id, created_by, title, description, instructions, duration_minutes, starts_at, ends_at,
       max_warnings, face_detection_enabled, audio_monitoring_enabled, tab_lock_enabled,
       clipboard_guard_enabled, status, access_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, adminId, payload.title, payload.description || '', payload.instructions || '',
      Number(payload.durationMinutes || 60), payload.startsAt, payload.endsAt,
      Number(payload.maxWarnings || 3),
      payload.faceDetectionEnabled !== false,
      payload.audioMonitoringEnabled !== false,
      payload.tabLockEnabled !== false,
      payload.clipboardGuardEnabled !== false,
      payload.status || 'draft',
      accessCode
    ]);
    return { id, accessCode };
  }

  static async listForAdmin(adminId) {
    const [rows] = await db.execute(`
      SELECT r.*, COUNT(DISTINCT q.id) question_count,
             COUNT(DISTINCT a.id) attempt_count
      FROM coding_rounds r
      LEFT JOIN coding_questions q ON q.round_id = r.id
      LEFT JOIN coding_attempts a ON a.round_id = r.id
      WHERE r.created_by = ? AND r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `, [adminId]);
    return rows;
  }

  static async getAdmin(roundId, adminId) {
    const [rounds] = await db.execute(
      `SELECT * FROM coding_rounds WHERE id=? AND created_by=? AND deleted_at IS NULL`,
      [roundId, adminId]
    );
    if (!rounds[0]) return null;
    const [questions] = await db.execute(`
      SELECT q.*, tc.test_cases
      FROM coding_questions q
      LEFT JOIN coding_test_cases tc ON tc.question_id=q.id
      WHERE q.round_id=? ORDER BY q.display_order
    `, [roundId]);
    return {
      ...rounds[0],
      questions: questions.map(q => ({
        ...q,
        problem_statement: q.problem_statement == null ? '' : String(q.problem_statement),
        constraints_text: q.constraints_text == null ? '' : String(q.constraints_text),
        input_format: q.input_format == null ? '' : String(q.input_format),
        output_format: q.output_format == null ? '' : String(q.output_format),
        allowed_languages: parseJson(q.allowed_languages, Object.keys(LANGUAGES)),
        starter_code: parseJson(q.starter_code, {}),
        test_cases: parseJson(q.test_cases, [])
      }))
    };
  }

  static async addQuestion(roundId, payload) {
    const questionId = randomUUID();
    const [countRows] = await db.execute(
      'SELECT COALESCE(MAX(display_order),0)+1 AS next_order FROM coding_questions WHERE round_id=?',
      [roundId]
    );
    const order = Number(payload.displayOrder || countRows[0].next_order);
    const languages = normalizeLanguages(payload.allowedLanguages);
    if (!languages.length) throw Object.assign(
      new Error('At least one supported language is required.'),
      { status: 400 }
    );

    const testCases = Array.isArray(payload.testCases)
      ? payload.testCases
          .map(tc => ({
            input: String(tc?.input ?? ''),
            output: String(tc?.output ?? ''),
            is_hidden: tc?.is_hidden === true
          }))
      : [];

    if (!testCases.length) throw Object.assign(
      new Error('At least one test case with expected output is required.'),
      { status: 400 }
    );

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`
        INSERT INTO coding_questions
        (id, round_id, title, problem_statement, constraints_text, input_format,
         output_format, starter_code, allowed_languages, points, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        questionId, roundId, payload.title, payload.problemStatement,
        payload.constraintsText || '', payload.inputFormat || '', payload.outputFormat || '',
        JSON.stringify(payload.starterCode || {}),
        JSON.stringify(languages),
        Number(payload.points || 100),
        order
      ]);
      await connection.execute(
        'INSERT INTO coding_test_cases (id, question_id, test_cases) VALUES (?, ?, ?)',
        [randomUUID(), questionId, JSON.stringify(testCases)]
      );
      await connection.commit();
      return questionId;
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }



  static async updateQuestion(roundId, questionId, payload) {
    const languages = normalizeLanguages(payload.allowedLanguages);
    const testCases = Array.isArray(payload.testCases)
      ? payload.testCases.map(tc => ({
          input: String(tc?.input ?? ''),
          output: String(tc?.output ?? ''),
          is_hidden: tc?.is_hidden === true
        }))
      : [];
    if (!languages.length) throw Object.assign(new Error('At least one supported language is required.'), { status: 400 });
    if (!testCases.length || testCases.some(tc => !String(tc.output).trim() && tc.output !== '')) {
      throw Object.assign(new Error('At least one test case with expected output is required.'), { status: 400 });
    }

    const [owned] = await db.execute(`
      SELECT q.id FROM coding_questions q
      JOIN coding_rounds r ON r.id=q.round_id
      WHERE q.id=? AND q.round_id=? AND r.deleted_at IS NULL
    `, [questionId, roundId]);
    if (!owned[0]) return false;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`
        UPDATE coding_questions SET title=?, problem_statement=?, constraints_text=?,
          input_format=?, output_format=?, starter_code=?, allowed_languages=?, points=?
        WHERE id=? AND round_id=?
      `, [
        payload.title, payload.problemStatement, payload.constraintsText || '',
        payload.inputFormat || '', payload.outputFormat || '',
        JSON.stringify(payload.starterCode || {}), JSON.stringify(languages),
        Number(payload.points || 100), questionId, roundId
      ]);
      const [existingCases] = await connection.execute(
        'SELECT id FROM coding_test_cases WHERE question_id=? LIMIT 1', [questionId]
      );
      if (existingCases[0]) {
        await connection.execute(
          'UPDATE coding_test_cases SET test_cases=? WHERE question_id=?',
          [JSON.stringify(testCases), questionId]
        );
      } else {
        await connection.execute(
          'INSERT INTO coding_test_cases (id, question_id, test_cases) VALUES (?, ?, ?)',
          [randomUUID(), questionId, JSON.stringify(testCases)]
        );
      }
      await connection.commit();
      return true;
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally { connection.release(); }
  }

  static async updateStatus(roundId, adminId, status) {
    const [result] = await db.execute(
      `UPDATE coding_rounds SET status=? WHERE id=? AND created_by=? AND deleted_at IS NULL`,
      [status, roundId, adminId]
    );
    return result.affectedRows === 1;
  }

  static async softDelete(roundId, adminId) {
    const [result] = await db.execute(
      `UPDATE coding_rounds SET deleted_at=NOW(), status='closed'
       WHERE id=? AND created_by=? AND deleted_at IS NULL`,
      [roundId, adminId]
    );
    return result.affectedRows === 1;
  }

  static async availableForStudent(studentId) {
    const [rows] = await db.execute(`
      SELECT r.id, r.title, r.description, r.duration_minutes, r.starts_at, r.ends_at,
             r.max_warnings, r.face_detection_enabled, r.audio_monitoring_enabled,
             r.tab_lock_enabled, r.clipboard_guard_enabled, r.access_code,
             COUNT(DISTINCT q.id) question_count,
             a.id attempt_id, a.state attempt_state,
             CASE
               WHEN a.id IS NOT NULL THEN a.state
               WHEN NOW() < r.starts_at THEN 'upcoming'
               WHEN NOW() > r.ends_at THEN 'expired'
               ELSE 'available'
             END availability
      FROM coding_rounds r
      LEFT JOIN coding_questions q ON q.round_id=r.id
      LEFT JOIN coding_attempts a
        ON a.round_id=r.id AND a.student_id=?
      WHERE r.status='published'
        AND r.deleted_at IS NULL
        AND (
          NOT EXISTS (
            SELECT 1 FROM coding_round_assignments x
            WHERE x.round_id=r.id
          )
          OR EXISTS (
            SELECT 1
            FROM coding_round_assignments x
            WHERE x.round_id=r.id
              AND (
                x.student_id=?
                OR LOWER(x.invited_email)=LOWER(
                  (SELECT email FROM users WHERE id=?)
                )
              )
          )
        )
      GROUP BY r.id, a.id, a.state
      ORDER BY r.starts_at DESC
    `, [studentId, studentId, studentId]);

    return rows;
  }

  static async getForStudent(roundId, studentId) {
    const [rows] = await db.execute(`
      SELECT r.id, r.title, r.description, r.instructions, r.duration_minutes,
             r.starts_at, r.ends_at, r.max_warnings, r.face_detection_enabled,
             r.audio_monitoring_enabled, r.tab_lock_enabled, r.clipboard_guard_enabled,
             a.id attempt_id, a.state attempt_state
      FROM coding_rounds r
      LEFT JOIN coding_attempts a ON a.round_id=r.id AND a.student_id=?
      WHERE r.id=? AND r.status='published' AND r.deleted_at IS NULL
        AND (NOT EXISTS (SELECT 1 FROM coding_round_assignments x WHERE x.round_id=r.id)
             OR EXISTS (
               SELECT 1 FROM coding_round_assignments x
               WHERE x.round_id=r.id AND
                 (x.student_id=? OR LOWER(x.invited_email)=LOWER((SELECT email FROM users WHERE id=?)))
             ))
    `, [studentId, roundId, studentId, studentId]);
    if (!rows[0]) return null;

    const [questions] = await db.execute(`
      SELECT q.id, q.title, q.problem_statement, q.constraints_text, q.input_format,
             q.output_format, q.starter_code, q.allowed_languages, q.points, q.display_order
      FROM coding_questions q WHERE q.round_id=? ORDER BY q.display_order
    `, [roundId]);

    return {
      ...rows[0],
      questions: questions.map(q => ({
        ...q,
        starter_code: parseJson(q.starter_code, {}),
        allowed_languages: parseJson(q.allowed_languages, Object.keys(LANGUAGES))
      }))
    };
  }

  static async getQuestion(questionId) {
    const [rows] = await db.execute(`
      SELECT q.*, r.id round_id, r.status, r.max_warnings,
             r.duration_minutes, r.starts_at, r.ends_at
      FROM coding_questions q JOIN coding_rounds r ON r.id=q.round_id
      WHERE q.id=? AND r.deleted_at IS NULL
    `, [questionId]);
    if (!rows[0]) return null;
    const [cases] = await db.execute(
      'SELECT test_cases FROM coding_test_cases WHERE question_id=?',
      [questionId]
    );
    return {
      ...rows[0],
      starter_code: parseJson(rows[0].starter_code, {}),
      allowed_languages: parseJson(rows[0].allowed_languages, Object.keys(LANGUAGES)),
      test_cases: parseJson(cases[0]?.test_cases, [])
    };
  }

  static async publicTestCases(questionId) {
    const q = await this.getQuestion(questionId);
    return (q?.test_cases || []).map((tc, index) => ({ ...tc, index })).filter(tc => tc.is_hidden !== true);
  }


  static async assignStudents(roundId, adminId, emails) {
    const [round] = await db.execute(
      'SELECT id FROM coding_rounds WHERE id=? AND created_by=? AND deleted_at IS NULL',
      [roundId, adminId]
    );
    if (!round[0]) return null;
    const results = [];
    for (const raw of (emails || [])) {
      const email = String(raw || '').trim().toLowerCase();
      if (!email) continue;
      const [users] = await db.execute(
        `SELECT id FROM users WHERE LOWER(email)=? AND role='student' LIMIT 1`, [email]
      );
      const studentId = users[0]?.id || null;
      const code = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
      await db.execute(
        `INSERT INTO coding_round_assignments
         (id, round_id, student_id, invited_email, assignment_code)
         VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), roundId, studentId, email, code]
      );
      results.push({ email, studentId, assignmentCode: code });
    }
    return results;
  }

  static languages() { return LANGUAGES; }
}

module.exports = CodingRound;
