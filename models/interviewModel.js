const db = require('../config/db');
const { randomUUID } = require('crypto');

const CATEGORY = new Set(['hr', 'technical', 'behavioral', 'company']);
const DIFFICULTY = new Set(['easy', 'medium', 'hard']);

function category(value) { return CATEGORY.has(value) ? value : 'hr'; }
function difficulty(value) { return DIFFICULTY.has(value) ? value : 'medium'; }
function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function datetime(value) {
  if (!value) return null;
  return String(value).replace('T', ' ').slice(0, 19);
}

class Interview {
  static async ensureTables() {
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_sets (
      id CHAR(36) PRIMARY KEY, created_by CHAR(36) NOT NULL, title VARCHAR(180) NOT NULL, description TEXT NULL,
      category ENUM('hr','technical','behavioral','company') NOT NULL DEFAULT 'hr', company_name VARCHAR(120) NULL,
      status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
      default_preparation_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 30,
      default_answer_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 180,
      max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 1, deadline DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL, INDEX ix_interview_sets_status (status, deleted_at, deadline))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_questions (
      id CHAR(36) PRIMARY KEY, created_by CHAR(36) NOT NULL, question_text TEXT NOT NULL, reference_answer TEXT NULL,
      evaluation_criteria TEXT NULL, category ENUM('hr','technical','behavioral','company') NOT NULL DEFAULT 'hr',
      topic VARCHAR(120) NOT NULL DEFAULT 'General', difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
      marks DECIMAL(6,2) NOT NULL DEFAULT 10, preparation_time_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 30,
      answer_time_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 180, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME NULL,
      INDEX ix_interview_questions_category (category, topic, difficulty))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_set_questions (
      set_id CHAR(36) NOT NULL, question_id CHAR(36) NOT NULL, display_order SMALLINT UNSIGNED NOT NULL,
      PRIMARY KEY (set_id, question_id), UNIQUE KEY uq_interview_set_order (set_id, display_order))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_assignments (
      id CHAR(36) PRIMARY KEY, set_id CHAR(36) NOT NULL, assigned_by CHAR(36) NOT NULL,
      target_type ENUM('all','student','class') NOT NULL DEFAULT 'all', target_student_id CHAR(36) NULL,
      department VARCHAR(100) NULL, division VARCHAR(10) NULL, batch_year INT NULL, deadline DATETIME NULL,
      max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 1, status ENUM('draft','published','closed') NOT NULL DEFAULT 'published',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX ix_interview_assignment_visibility (status, target_type, deadline))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_attempts (
      id CHAR(36) PRIMARY KEY, assignment_id CHAR(36) NOT NULL, set_id CHAR(36) NOT NULL, student_id CHAR(36) NOT NULL,
      state ENUM('started','submitted','reviewed') NOT NULL DEFAULT 'started', started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME NULL, total_score DECIMAL(7,2) NULL, max_score DECIMAL(7,2) NULL, faculty_comments TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX ix_interview_attempt_student (student_id, state, submitted_at))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_answers (
      id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL, question_id CHAR(36) NOT NULL, answer_text MEDIUMTEXT NULL,
      transcript_source ENUM('speech','typed','mixed') NOT NULL DEFAULT 'typed', score DECIMAL(6,2) NULL, faculty_comments TEXT NULL,
      answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_interview_answer_question (attempt_id, question_id))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_results (
      id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL UNIQUE, total_score DECIMAL(7,2) NULL, max_score DECIMAL(7,2) NULL,
      status ENUM('submitted','reviewed') NOT NULL DEFAULT 'submitted', ai_feedback JSON NULL, faculty_summary TEXT NULL,
      reviewed_by CHAR(36) NULL, reviewed_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_monitoring_events (
      id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL, student_id CHAR(36) NOT NULL,
      event_type ENUM('camera_permission','microphone_permission','face_absent','multiple_faces','looking_away','visibility_hidden','fullscreen_exit','manual') NOT NULL,
      severity ENUM('info','low','medium','high') NOT NULL DEFAULT 'info', message VARCHAR(500) NOT NULL,
      metadata_json JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX ix_interview_events_attempt (attempt_id, created_at))`);
  }

  static normalizeQuestion(adminId, item = {}) {
    return {
      id: item.id || randomUUID(),
      createdBy: adminId,
      questionText: String(item.questionText || item.question || '').trim(),
      referenceAnswer: String(item.referenceAnswer || '').trim() || null,
      evaluationCriteria: String(item.evaluationCriteria || '').trim() || null,
      category: category(item.category),
      topic: String(item.topic || 'General').trim() || 'General',
      difficulty: difficulty(item.difficulty),
      marks: Math.max(1, number(item.marks, 10)),
      preparationTimeSeconds: Math.max(0, number(item.preparationTimeSeconds, 30)),
      answerTimeSeconds: Math.max(15, number(item.answerTimeSeconds, 180))
    };
  }

  static async listSets(adminId) {
    await Interview.ensureTables();
    const [rows] = await db.execute(`SELECT s.*, COUNT(sq.question_id) question_count,
      COUNT(DISTINCT a.id) assignment_count FROM interview_sets s
      LEFT JOIN interview_set_questions sq ON sq.set_id=s.id
      LEFT JOIN interview_assignments a ON a.set_id=s.id
      WHERE s.created_by=? AND s.deleted_at IS NULL GROUP BY s.id ORDER BY s.created_at DESC`, [adminId]);
    return rows;
  }

  static async createSet(adminId, payload) {
    await Interview.ensureTables();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const setId = randomUUID();
      await connection.execute(`INSERT INTO interview_sets
        (id, created_by, title, description, category, company_name, status, default_preparation_seconds, default_answer_seconds, max_attempts, deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        setId, adminId, String(payload.title || '').trim(), payload.description || null, category(payload.category),
        payload.companyName || null, payload.status === 'published' ? 'published' : 'draft',
        number(payload.defaultPreparationSeconds, 30), number(payload.defaultAnswerSeconds, 180),
        number(payload.maxAttempts, 1), datetime(payload.deadline)
      ]);
      const questions = Array.isArray(payload.questions) ? payload.questions : [];
      for (const [index, source] of questions.entries()) {
        const q = Interview.normalizeQuestion(adminId, source);
        if (!q.questionText) throw new Error('Question text is required.');
        await connection.execute(`INSERT INTO interview_questions
          (id, created_by, question_text, reference_answer, evaluation_criteria, category, topic, difficulty, marks, preparation_time_seconds, answer_time_seconds)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          q.id, adminId, q.questionText, q.referenceAnswer, q.evaluationCriteria, q.category, q.topic,
          q.difficulty, q.marks, q.preparationTimeSeconds, q.answerTimeSeconds
        ]);
        await connection.execute('INSERT INTO interview_set_questions (set_id, question_id, display_order) VALUES (?, ?, ?)', [setId, q.id, index + 1]);
      }
      await connection.commit();
      return setId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateSet(adminId, setId, payload) {
    await Interview.ensureTables();
    const [result] = await db.execute(`UPDATE interview_sets SET title=?, description=?, category=?, company_name=?, status=?,
      default_preparation_seconds=?, default_answer_seconds=?, max_attempts=?, deadline=?
      WHERE id=? AND created_by=? AND deleted_at IS NULL`, [
      String(payload.title || '').trim(), payload.description || null, category(payload.category), payload.companyName || null,
      ['draft', 'published', 'closed'].includes(payload.status) ? payload.status : 'draft',
      number(payload.defaultPreparationSeconds, 30), number(payload.defaultAnswerSeconds, 180), number(payload.maxAttempts, 1),
      datetime(payload.deadline), setId, adminId
    ]);
    return result.affectedRows === 1;
  }

  static async removeSet(adminId, setId) {
    await Interview.ensureTables();
    const [result] = await db.execute('UPDATE interview_sets SET deleted_at=NOW() WHERE id=? AND created_by=?', [setId, adminId]);
    return result.affectedRows === 1;
  }

  static async addQuestions(adminId, setId, questions) {
    await Interview.ensureTables();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[set]] = await connection.execute('SELECT id FROM interview_sets WHERE id=? AND created_by=? AND deleted_at IS NULL FOR UPDATE', [setId, adminId]);
      if (!set) throw Object.assign(new Error('Interview set not found.'), { status: 404 });
      const [[orderRow]] = await connection.execute('SELECT COALESCE(MAX(display_order),0) maxOrder FROM interview_set_questions WHERE set_id=?', [setId]);
      let order = Number(orderRow.maxOrder) + 1;
      for (const item of questions) {
        const q = Interview.normalizeQuestion(adminId, item);
        if (!q.questionText) throw new Error('Question text is required.');
        await connection.execute(`INSERT INTO interview_questions
          (id, created_by, question_text, reference_answer, evaluation_criteria, category, topic, difficulty, marks, preparation_time_seconds, answer_time_seconds)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          q.id, adminId, q.questionText, q.referenceAnswer, q.evaluationCriteria, q.category, q.topic, q.difficulty,
          q.marks, q.preparationTimeSeconds, q.answerTimeSeconds
        ]);
        await connection.execute('INSERT INTO interview_set_questions (set_id, question_id, display_order) VALUES (?, ?, ?)', [setId, q.id, order++]);
      }
      await connection.commit();
      return questions.length;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async assign(adminId, setId, payload) {
    await Interview.ensureTables();
    const assignmentId = randomUUID();
    await db.execute(`INSERT INTO interview_assignments
      (id, set_id, assigned_by, target_type, target_student_id, department, division, batch_year, deadline, max_attempts, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      assignmentId, setId, adminId, ['all', 'student', 'class'].includes(payload.targetType) ? payload.targetType : 'all',
      payload.targetStudentId || null, payload.department || null, payload.division || null, payload.batchYear || null,
      datetime(payload.deadline), number(payload.maxAttempts, 1), payload.status === 'draft' ? 'draft' : 'published'
    ]);
    return assignmentId;
  }

  static async studentDashboard(studentId) {
    await Interview.ensureTables();
    const [assignments] = await db.execute(`SELECT a.id assignment_id, a.deadline, a.max_attempts, s.id set_id, s.title, s.description,
      s.category, s.company_name, COUNT(q.question_id) question_count, COUNT(at.id) attempts_used,
      MAX(at.submitted_at) last_submitted_at,
      CASE WHEN a.deadline IS NOT NULL AND NOW()>a.deadline THEN 'expired'
           WHEN COUNT(at.id)>=a.max_attempts THEN 'completed' ELSE 'available' END availability
      FROM interview_assignments a JOIN interview_sets s ON s.id=a.set_id
      JOIN students st ON st.std_id=?
      LEFT JOIN interview_set_questions q ON q.set_id=s.id
      LEFT JOIN interview_attempts at ON at.assignment_id=a.id AND at.student_id=st.std_id
      WHERE a.status='published' AND s.status='published' AND s.deleted_at IS NULL
        AND (a.target_type='all' OR (a.target_type='student' AND a.target_student_id=st.std_id)
          OR (a.target_type='class' AND (a.department IS NULL OR a.department=st.department)
            AND (a.division IS NULL OR a.division=st.division) AND (a.batch_year IS NULL OR a.batch_year=st.batch_year)))
      GROUP BY a.id ORDER BY COALESCE(a.deadline, s.deadline), s.created_at DESC`, [studentId]);
    const [history] = await db.execute(`SELECT at.id attempt_id, at.state, at.started_at, at.submitted_at, r.total_score, r.max_score,
      s.title, s.category FROM interview_attempts at JOIN interview_sets s ON s.id=at.set_id
      LEFT JOIN interview_results r ON r.attempt_id=at.id WHERE at.student_id=? ORDER BY at.started_at DESC LIMIT 20`, [studentId]);
    return { assignments, history };
  }

  static async questionsForAssignment(studentId, assignmentId) {
    await Interview.ensureTables();
    const [rows] = await db.execute(`SELECT q.id, q.question_text, q.category, q.topic, q.difficulty, q.marks,
      q.preparation_time_seconds, q.answer_time_seconds, sq.display_order, s.title, s.description
      FROM interview_assignments a JOIN interview_sets s ON s.id=a.set_id
      JOIN students st ON st.std_id=?
      JOIN interview_set_questions sq ON sq.set_id=s.id JOIN interview_questions q ON q.id=sq.question_id
      WHERE a.id=? AND a.status='published' AND s.status='published'
        AND (a.target_type='all' OR (a.target_type='student' AND a.target_student_id=st.std_id)
          OR (a.target_type='class' AND (a.department IS NULL OR a.department=st.department)
            AND (a.division IS NULL OR a.division=st.division) AND (a.batch_year IS NULL OR a.batch_year=st.batch_year)))
      ORDER BY sq.display_order`, [studentId, assignmentId]);
    return rows;
  }

  static async startAttempt(studentId, assignmentId) {
    await Interview.ensureTables();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[assignment]] = await connection.execute(`SELECT a.*, s.status set_status FROM interview_assignments a
        JOIN interview_sets s ON s.id=a.set_id WHERE a.id=? AND a.status='published' AND s.status='published' FOR UPDATE`, [assignmentId]);
      if (!assignment) throw Object.assign(new Error('Interview assignment is not available.'), { status: 403 });
      if (assignment.deadline && new Date(assignment.deadline) < new Date()) throw Object.assign(new Error('Interview deadline has passed.'), { status: 403 });
      const [[countRow]] = await connection.execute('SELECT COUNT(*) attempts FROM interview_attempts WHERE assignment_id=? AND student_id=?', [assignmentId, studentId]);
      if (Number(countRow.attempts) >= assignment.max_attempts) throw Object.assign(new Error('Attempt limit reached.'), { status: 409 });
      const attemptId = randomUUID();
      await connection.execute('INSERT INTO interview_attempts (id, assignment_id, set_id, student_id) VALUES (?, ?, ?, ?)', [attemptId, assignmentId, assignment.set_id, studentId]);
      await connection.commit();
      return { attemptId, questions: await Interview.questionsForAssignment(studentId, assignmentId) };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async saveAnswer(studentId, attemptId, payload) {
    await Interview.ensureTables();
    const [valid] = await db.execute(`SELECT at.id FROM interview_attempts at JOIN interview_set_questions sq ON sq.set_id=at.set_id
      WHERE at.id=? AND at.student_id=? AND at.state='started' AND sq.question_id=? LIMIT 1`, [attemptId, studentId, payload.questionId]);
    if (!valid[0]) throw Object.assign(new Error('Active interview question not found.'), { status: 404 });
    await db.execute(`INSERT INTO interview_answers (id, attempt_id, question_id, answer_text, transcript_source)
      VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE answer_text=VALUES(answer_text), transcript_source=VALUES(transcript_source), answered_at=CURRENT_TIMESTAMP`, [
      randomUUID(), attemptId, payload.questionId, payload.answerText || '', ['speech', 'typed', 'mixed'].includes(payload.transcriptSource) ? payload.transcriptSource : 'typed'
    ]);
  }

  static async recordEvent(studentId, attemptId, event) {
    await Interview.ensureTables();
    const [valid] = await db.execute('SELECT id FROM interview_attempts WHERE id=? AND student_id=?', [attemptId, studentId]);
    if (!valid[0]) throw Object.assign(new Error('Attempt not found.'), { status: 404 });
    await db.execute(`INSERT INTO interview_monitoring_events (id, attempt_id, student_id, event_type, severity, message, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      randomUUID(), attemptId, studentId,
      ['camera_permission', 'microphone_permission', 'face_absent', 'multiple_faces', 'looking_away', 'visibility_hidden', 'fullscreen_exit', 'manual'].includes(event.eventType) ? event.eventType : 'manual',
      ['info', 'low', 'medium', 'high'].includes(event.severity) ? event.severity : 'info',
      String(event.message || 'Interview monitoring event.').slice(0, 500),
      event.metadata ? JSON.stringify(event.metadata) : null
    ]);
  }

  static async submitAttempt(studentId, attemptId) {
    await Interview.ensureTables();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[attempt]] = await connection.execute('SELECT * FROM interview_attempts WHERE id=? AND student_id=? FOR UPDATE', [attemptId, studentId]);
      if (!attempt) throw Object.assign(new Error('Attempt not found.'), { status: 404 });
      if (attempt.state !== 'started') { await connection.commit(); return attempt; }
      const [[scoreRow]] = await connection.execute(`SELECT SUM(q.marks) maxScore FROM interview_set_questions sq
        JOIN interview_questions q ON q.id=sq.question_id WHERE sq.set_id=?`, [attempt.set_id]);
      const maxScore = Number(scoreRow.maxScore || 0);
      await connection.execute('UPDATE interview_attempts SET state="submitted", submitted_at=NOW(), max_score=? WHERE id=?', [maxScore, attemptId]);
      await connection.execute(`INSERT INTO interview_results (id, attempt_id, max_score, status) VALUES (?, ?, ?, 'submitted')
        ON DUPLICATE KEY UPDATE max_score=VALUES(max_score), status='submitted'`, [randomUUID(), attemptId, maxScore]);
      await connection.commit();
      return { id: attemptId, state: 'submitted', maxScore };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async adminSubmissions(adminId) {
    await Interview.ensureTables();
    const [rows] = await db.execute(`SELECT at.id attempt_id, at.state, at.started_at, at.submitted_at, at.total_score, at.max_score,
      s.title, s.category, u.fullName student_name, u.email student_email, COUNT(ev.id) flag_count
      FROM interview_attempts at JOIN interview_sets s ON s.id=at.set_id JOIN users u ON u.id=at.student_id
      LEFT JOIN interview_monitoring_events ev ON ev.attempt_id=at.id
      WHERE s.created_by=? GROUP BY at.id ORDER BY at.started_at DESC`, [adminId]);
    return rows;
  }

  static async attemptReview(adminId, attemptId) {
    await Interview.ensureTables();
    const [[attempt]] = await db.execute(`SELECT at.*, s.title, s.category, u.fullName student_name, u.email student_email
      FROM interview_attempts at JOIN interview_sets s ON s.id=at.set_id JOIN users u ON u.id=at.student_id
      WHERE at.id=? AND s.created_by=?`, [attemptId, adminId]);
    if (!attempt) return null;
    const [answers] = await db.execute(`SELECT q.id question_id, q.question_text, q.reference_answer, q.evaluation_criteria, q.marks,
      a.answer_text, a.transcript_source, a.score, a.faculty_comments FROM interview_set_questions sq
      JOIN interview_questions q ON q.id=sq.question_id LEFT JOIN interview_answers a ON a.question_id=q.id AND a.attempt_id=?
      WHERE sq.set_id=? ORDER BY sq.display_order`, [attemptId, attempt.set_id]);
    const [events] = await db.execute('SELECT * FROM interview_monitoring_events WHERE attempt_id=? ORDER BY created_at', [attemptId]);
    return { attempt, answers, events };
  }

  static async reviewAttempt(adminId, attemptId, payload) {
    await Interview.ensureTables();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[attempt]] = await connection.execute(`SELECT at.id FROM interview_attempts at JOIN interview_sets s ON s.id=at.set_id WHERE at.id=? AND s.created_by=? FOR UPDATE`, [attemptId, adminId]);
      if (!attempt) throw Object.assign(new Error('Attempt not found.'), { status: 404 });
      let total = 0;
      for (const answer of Array.isArray(payload.answers) ? payload.answers : []) {
        const score = Math.max(0, number(answer.score, 0));
        total += score;
        await connection.execute('UPDATE interview_answers SET score=?, faculty_comments=? WHERE attempt_id=? AND question_id=?', [score, answer.facultyComments || null, attemptId, answer.questionId]);
      }
      await connection.execute('UPDATE interview_attempts SET state="reviewed", total_score=?, faculty_comments=? WHERE id=?', [total, payload.facultySummary || null, attemptId]);
      await connection.execute(`INSERT INTO interview_results (id, attempt_id, total_score, status, faculty_summary, reviewed_by, reviewed_at)
        VALUES (?, ?, ?, 'reviewed', ?, ?, NOW()) ON DUPLICATE KEY UPDATE total_score=VALUES(total_score), status='reviewed',
        faculty_summary=VALUES(faculty_summary), reviewed_by=VALUES(reviewed_by), reviewed_at=NOW()`, [randomUUID(), attemptId, total, payload.facultySummary || null, adminId]);
      await connection.commit();
      return { totalScore: total };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Interview;
