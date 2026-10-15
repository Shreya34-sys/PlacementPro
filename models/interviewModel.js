const db = require('../config/db');
const { randomUUID } = require('crypto');

const CATEGORY = new Set(['hr', 'technical', 'behavioral', 'company']);
const DIFFICULTY = new Set(['easy', 'medium', 'hard']);
const WARNING_ACTIONS = new Set(['notify', 'fullscreen', 'terminate']);
const WARNING_EVENT_TYPES = new Set(['face_absent', 'multiple_faces', 'looking_away', 'visibility_hidden', 'window_blur', 'fullscreen_exit']);

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
function warningAction(value, fallback) {
  return WARNING_ACTIONS.has(value) ? value : fallback;
}
function isWarningEvent(event) {
  return WARNING_EVENT_TYPES.has(event?.eventType) || (event?.eventType === 'manual' && event?.metadata?.signal === 'clipboard');
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
      first_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'notify',
      second_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'fullscreen',
      third_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'terminate',
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
      state ENUM('started','submitted','reviewed','terminated') NOT NULL DEFAULT 'started', started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consent_accepted_at DATETIME NULL, submitted_at DATETIME NULL, total_score DECIMAL(7,2) NULL, max_score DECIMAL(7,2) NULL, faculty_comments TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX ix_interview_attempt_student (student_id, state, submitted_at))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_answers (
      id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL, question_id CHAR(36) NOT NULL, answer_text MEDIUMTEXT NULL,
      transcript_source ENUM('speech','typed','mixed') NOT NULL DEFAULT 'typed', audio_data LONGBLOB NULL, audio_mime_type VARCHAR(100) NULL,
      score DECIMAL(6,2) NULL, faculty_comments TEXT NULL,
      answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_interview_answer_question (attempt_id, question_id))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_results (
      id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL UNIQUE, total_score DECIMAL(7,2) NULL, max_score DECIMAL(7,2) NULL,
      status ENUM('submitted','reviewed') NOT NULL DEFAULT 'submitted', ai_feedback JSON NULL, faculty_summary TEXT NULL,
      reviewed_by CHAR(36) NULL, reviewed_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS interview_monitoring_events (
      id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL, student_id CHAR(36) NOT NULL,
      event_type ENUM('camera_permission','microphone_permission','face_absent','multiple_faces','looking_away','visibility_hidden','window_blur','fullscreen_exit','manual') NOT NULL,
      severity ENUM('info','low','medium','high') NOT NULL DEFAULT 'info', message VARCHAR(500) NOT NULL,
      metadata_json JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX ix_interview_events_attempt (attempt_id, created_at))`);
    await Interview.ensureAnswerAudioColumns();
    await Interview.ensureAttemptConsentColumn();
    await Interview.ensureMonitoringSchema();
  }

  static async ensureMonitoringSchema() {
    if (!this.monitoringSchemaReady) {
      this.monitoringSchemaReady = (async () => {
        const [setColumns] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='interview_sets'
            AND COLUMN_NAME IN ('first_warning_action','second_warning_action','third_warning_action')`);
        const setExisting = new Set(setColumns.map(column => column.COLUMN_NAME));
        const setAdditions = [];
        if (!setExisting.has('first_warning_action')) setAdditions.push("ADD COLUMN first_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'notify' AFTER deadline");
        if (!setExisting.has('second_warning_action')) setAdditions.push("ADD COLUMN second_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'fullscreen' AFTER first_warning_action");
        if (!setExisting.has('third_warning_action')) setAdditions.push("ADD COLUMN third_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'terminate' AFTER second_warning_action");
        if (setAdditions.length) await db.execute(`ALTER TABLE interview_sets ${setAdditions.join(', ')}`);
        await db.execute("ALTER TABLE interview_attempts MODIFY state ENUM('started','submitted','reviewed','terminated') NOT NULL DEFAULT 'started'");
        await db.execute("ALTER TABLE interview_monitoring_events MODIFY event_type ENUM('camera_permission','microphone_permission','face_absent','multiple_faces','looking_away','visibility_hidden','window_blur','fullscreen_exit','manual') NOT NULL");
      })().catch(error => {
        this.monitoringSchemaReady = null;
        throw error;
      });
    }
    await this.monitoringSchemaReady;
  }

  static async ensureAttemptConsentColumn() {
    if (!this.attemptConsentSchemaReady) {
      this.attemptConsentSchemaReady = (async () => {
        const [columns] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='interview_attempts' AND COLUMN_NAME='consent_accepted_at'`);
        if (!columns.length) await db.execute('ALTER TABLE interview_attempts ADD COLUMN consent_accepted_at DATETIME NULL AFTER started_at');
      })().catch(error => {
        this.attemptConsentSchemaReady = null;
        throw error;
      });
    }
    await this.attemptConsentSchemaReady;
  }

  static async ensureAnswerAudioColumns() {
    if (!this.answerAudioSchemaReady) {
      this.answerAudioSchemaReady = (async () => {
        const [columns] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='interview_answers'
            AND COLUMN_NAME IN ('audio_data','audio_mime_type')`);
        const existing = new Set(columns.map(column => column.COLUMN_NAME));
        const additions = [];
        if (!existing.has('audio_data')) additions.push('ADD COLUMN audio_data LONGBLOB NULL');
        if (!existing.has('audio_mime_type')) additions.push('ADD COLUMN audio_mime_type VARCHAR(100) NULL');
        if (additions.length) await db.execute(`ALTER TABLE interview_answers ${additions.join(', ')}`);
      })().catch(error => {
        this.answerAudioSchemaReady = null;
        throw error;
      });
    }
    await this.answerAudioSchemaReady;
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
        (id, created_by, title, description, category, company_name, status, default_preparation_seconds, default_answer_seconds,
          max_attempts, deadline, first_warning_action, second_warning_action, third_warning_action)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        setId, adminId, String(payload.title || '').trim(), payload.description || null, category(payload.category),
        payload.companyName || null, payload.status === 'published' ? 'published' : 'draft',
        number(payload.defaultPreparationSeconds, 30), number(payload.defaultAnswerSeconds, 180),
        number(payload.maxAttempts, 1), datetime(payload.deadline),
        warningAction(payload.firstWarningAction, 'notify'),
        warningAction(payload.secondWarningAction, 'fullscreen'),
        warningAction(payload.thirdWarningAction, 'terminate')
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
      default_preparation_seconds=?, default_answer_seconds=?, max_attempts=?, deadline=?,
      first_warning_action=?, second_warning_action=?, third_warning_action=?
      WHERE id=? AND created_by=? AND deleted_at IS NULL`, [
      String(payload.title || '').trim(), payload.description || null, category(payload.category), payload.companyName || null,
      ['draft', 'published', 'closed'].includes(payload.status) ? payload.status : 'draft',
      number(payload.defaultPreparationSeconds, 30), number(payload.defaultAnswerSeconds, 180), number(payload.maxAttempts, 1),
      datetime(payload.deadline),
      warningAction(payload.firstWarningAction, 'notify'),
      warningAction(payload.secondWarningAction, 'fullscreen'),
      warningAction(payload.thirdWarningAction, 'terminate'),
      setId, adminId
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

  static async startAttempt(studentId, assignmentId, consent = {}) {
    await Interview.ensureTables();
    if (!consent || consent.acknowledged !== true || consent.cameraReady !== true || typeof consent.confirmation !== 'string' ||
      consent.confirmation.trim().toUpperCase() !== 'START') {
      throw Object.assign(new Error('Acknowledge the interview guidelines, allow camera access, and type START to begin.'), { status: 400 });
    }
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[assignment]] = await connection.execute(`SELECT a.*, s.status set_status, s.deadline set_deadline
        FROM interview_assignments a JOIN interview_sets s ON s.id=a.set_id
        JOIN students st ON st.std_id=?
        WHERE a.id=? AND a.status='published' AND s.status='published' AND s.deleted_at IS NULL
          AND (a.target_type='all'
            OR (a.target_type='student' AND a.target_student_id=st.std_id)
            OR (a.target_type='class' AND (a.department IS NULL OR a.department=st.department)
              AND (a.division IS NULL OR a.division=st.division)
              AND (a.batch_year IS NULL OR a.batch_year=st.batch_year)))
        FOR UPDATE`, [studentId, assignmentId]);
      if (!assignment) throw Object.assign(new Error('Interview assignment is not available.'), { status: 403 });
      if (assignment.deadline && new Date(assignment.deadline) < new Date()) throw Object.assign(new Error('Interview deadline has passed.'), { status: 403 });
      if (assignment.set_deadline && new Date(assignment.set_deadline) < new Date()) throw Object.assign(new Error('Interview deadline has passed.'), { status: 403 });
      const [[countRow]] = await connection.execute('SELECT COUNT(*) attempts FROM interview_attempts WHERE assignment_id=? AND student_id=?', [assignmentId, studentId]);
      if (Number(countRow.attempts) >= assignment.max_attempts) throw Object.assign(new Error('Attempt limit reached.'), { status: 409 });
      const [[activeAttempt]] = await connection.execute(`SELECT id FROM interview_attempts
        WHERE assignment_id=? AND student_id=? AND state='started' LIMIT 1 FOR UPDATE`, [assignmentId, studentId]);
      if (activeAttempt) {
        const [questions] = await connection.execute(`SELECT q.id, q.question_text, q.category, q.topic, q.difficulty, q.marks,
          q.preparation_time_seconds, q.answer_time_seconds, sq.display_order, s.title, s.description
          FROM interview_set_questions sq
          JOIN interview_questions q ON q.id=sq.question_id
          JOIN interview_sets s ON s.id=sq.set_id
          WHERE sq.set_id=? AND q.deleted_at IS NULL ORDER BY sq.display_order`, [assignment.set_id]);
        await connection.commit();
        return { attemptId: activeAttempt.id, questions, resumed: true };
      }
      const [questions] = await connection.execute(`SELECT q.id, q.question_text, q.category, q.topic, q.difficulty, q.marks,
        q.preparation_time_seconds, q.answer_time_seconds, sq.display_order, s.title, s.description
        FROM interview_set_questions sq
        JOIN interview_questions q ON q.id=sq.question_id
        JOIN interview_sets s ON s.id=sq.set_id
        WHERE sq.set_id=? AND q.deleted_at IS NULL ORDER BY sq.display_order`, [assignment.set_id]);
      if (!questions.length) throw Object.assign(new Error('This interview does not have any available questions.'), { status: 409 });
      const attemptId = randomUUID();
      await connection.execute(`INSERT INTO interview_attempts
        (id, assignment_id, set_id, student_id, consent_accepted_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [attemptId, assignmentId, assignment.set_id, studentId]);
      await connection.commit();
      return { attemptId, questions };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async saveAnswer(studentId, attemptId, payload, audio = null) {
    await Interview.ensureTables();
    if (!payload || !/^[0-9a-f-]{36}$/i.test(String(payload.questionId || '')) ||
      typeof payload.answerText !== 'string' || !['speech', 'typed', 'mixed'].includes(payload.transcriptSource)) {
      throw Object.assign(new Error('Answer details are invalid.'), { status: 400 });
    }
    const [valid] = await db.execute(`SELECT at.id FROM interview_attempts at JOIN interview_set_questions sq ON sq.set_id=at.set_id
      WHERE at.id=? AND at.student_id=? AND at.state='started' AND sq.question_id=? LIMIT 1`, [attemptId, studentId, payload.questionId]);
    if (!valid[0]) throw Object.assign(new Error('Active interview question not found.'), { status: 404 });
    await db.execute(`INSERT INTO interview_answers
      (id, attempt_id, question_id, answer_text, transcript_source, audio_data, audio_mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE answer_text=VALUES(answer_text),
      transcript_source=VALUES(transcript_source), audio_data=COALESCE(VALUES(audio_data), audio_data),
      audio_mime_type=COALESCE(VALUES(audio_mime_type), audio_mime_type), answered_at=CURRENT_TIMESTAMP`, [
      randomUUID(), attemptId, payload.questionId, payload.answerText || '',
      payload.transcriptSource,
      audio?.buffer || null, audio?.mimeType || null
    ]);
  }

  static async answerAudio(userId, attemptId, questionId, isAdmin = false) {
    await Interview.ensureTables();
    const [rows] = await db.execute(`SELECT answer.audio_data, answer.audio_mime_type FROM interview_answers answer
      JOIN interview_attempts attempt ON attempt.id=answer.attempt_id
      JOIN interview_sets interview_set ON interview_set.id=attempt.set_id
      WHERE attempt.id=? AND answer.question_id=?
        AND ${isAdmin ? 'interview_set.created_by=?' : 'attempt.student_id=?'} LIMIT 1`,
    [attemptId, questionId, userId]);
    return rows[0]?.audio_data ? rows[0] : null;
  }

  static async recordEvent(studentId, attemptId, event) {
    await Interview.ensureTables();
    const expectedSeverity = {
      camera_permission: 'info',
      microphone_permission: 'info',
      face_absent: 'low',
      multiple_faces: 'medium',
      looking_away: 'low',
      visibility_hidden: 'medium',
      window_blur: 'medium',
      fullscreen_exit: 'low',
      manual: 'info'
    };
    const manualSignals = new Set(['clipboard', 'media_track_ended', 'media_unavailable', 'pagehide', 'offline', 'online', 'face_detection_unavailable', 'face_detection_error']);
    const message = typeof event?.message === 'string' ? event.message.trim() : '';
    if (!Object.prototype.hasOwnProperty.call(expectedSeverity, event?.eventType) ||
      event.severity !== expectedSeverity[event.eventType] || !message || message.length > 500 ||
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(message)) {
      throw Object.assign(new Error('Monitoring event details are invalid.'), { status: 400 });
    }
    if (event.eventType === 'manual' && (!event.metadata || typeof event.metadata !== 'object' || Array.isArray(event.metadata))) {
      throw Object.assign(new Error('Monitoring signal details are required.'), { status: 400 });
    }
    let metadata = null;
    if (event.metadata !== undefined && event.metadata !== null) {
      if (typeof event.metadata !== 'object' || Array.isArray(event.metadata)) {
        throw Object.assign(new Error('Monitoring event metadata must be an object.'), { status: 400 });
      }
      if (event.eventType === 'manual') {
        if (!manualSignals.has(event.metadata.signal)) {
          throw Object.assign(new Error('Monitoring signal is invalid.'), { status: 400 });
        }
        const allowedFields = event.metadata.signal === 'clipboard' ? ['signal', 'action'] : ['signal'];
        if (Object.keys(event.metadata).some(key => !allowedFields.includes(key)) ||
          (event.metadata.signal === 'clipboard' && !['copy', 'paste', 'cut'].includes(event.metadata.action))) {
          throw Object.assign(new Error('Monitoring signal details are invalid.'), { status: 400 });
        }
        const expectedMessages = {
          clipboard: `Answer-field ${event.metadata.action} action noted for faculty review.`,
          media_track_ended: ['Camera access ended during the interview.', 'Microphone access ended during the interview.'],
          media_unavailable: ['Required camera access is unavailable during the interview.', 'Audio recording is unavailable on this device or browser.'],
          pagehide: 'Interview page was left or refreshed while the attempt was active.',
          offline: 'Browser network connection became unavailable during the interview.',
          online: 'Browser network connection is available again.',
          face_detection_unavailable: 'Camera-based checks are not supported in this browser.',
          face_detection_error: [
            'Camera-based checks could not be started in this browser.',
            'Camera-based checks stopped because the browser could not analyze the preview.'
          ]
        }[event.metadata.signal];
        if (!(Array.isArray(expectedMessages) ? expectedMessages.includes(message) : expectedMessages === message)) {
          throw Object.assign(new Error('Monitoring signal message does not match its details.'), { status: 400 });
        }
      }
      metadata = JSON.stringify(event.metadata);
      if (metadata.length > 2000) throw Object.assign(new Error('Monitoring event metadata is too large.'), { status: 400 });
    }
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[attempt]] = await connection.execute(
        `SELECT at.id, at.set_id, s.first_warning_action, s.second_warning_action, s.third_warning_action
          FROM interview_attempts at JOIN interview_sets s ON s.id=at.set_id
          WHERE at.id=? AND at.student_id=? AND at.state="started" FOR UPDATE`,
        [attemptId, studentId]
      );
      if (!attempt) throw Object.assign(new Error('Active interview not found.'), { status: 404 });
      await connection.execute(`INSERT INTO interview_monitoring_events (id, attempt_id, student_id, event_type, severity, message, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        randomUUID(), attemptId, studentId, event.eventType, event.severity, message, metadata
      ]);
      let warningsCount = 0;
      let action = null;
      let terminated = false;
      if (isWarningEvent(event)) {
        const [[countRow]] = await connection.execute(
          `SELECT COUNT(*) warningsCount FROM interview_monitoring_events
            WHERE attempt_id=? AND (event_type IN ('face_absent','multiple_faces','looking_away','visibility_hidden','window_blur','fullscreen_exit')
              OR (event_type='manual' AND JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.signal'))='clipboard'))`,
          [attemptId]
        );
        warningsCount = Number(countRow.warningsCount || 0);
        action = [attempt.first_warning_action, attempt.second_warning_action, attempt.third_warning_action][Math.min(warningsCount, 3) - 1] || null;
        if (action === 'terminate') {
          await Interview.finishAttempt(connection, attemptId, attempt.set_id, 'terminated');
          terminated = true;
        }
      }
      await connection.commit();
      return { warningsCount, action, terminated };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async submitAttempt(studentId, attemptId) {
    await Interview.ensureTables();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[attempt]] = await connection.execute('SELECT * FROM interview_attempts WHERE id=? AND student_id=? FOR UPDATE', [attemptId, studentId]);
      if (!attempt) throw Object.assign(new Error('Attempt not found.'), { status: 404 });
      if (attempt.state !== 'started') { await connection.commit(); return attempt; }
      const maxScore = await Interview.finishAttempt(connection, attemptId, attempt.set_id, 'submitted');
      await connection.commit();
      return { id: attemptId, state: 'submitted', maxScore };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async finishAttempt(connection, attemptId, setId, state) {
    const [[scoreRow]] = await connection.execute(`SELECT SUM(q.marks) maxScore FROM interview_set_questions sq
      JOIN interview_questions q ON q.id=sq.question_id WHERE sq.set_id=?`, [setId]);
    const maxScore = Number(scoreRow.maxScore || 0);
    await connection.execute('UPDATE interview_attempts SET state=?, submitted_at=COALESCE(submitted_at, NOW()), max_score=? WHERE id=?', [state, maxScore, attemptId]);
    await connection.execute(`INSERT INTO interview_results (id, attempt_id, max_score, status, faculty_summary)
      VALUES (?, ?, ?, 'submitted', ?) ON DUPLICATE KEY UPDATE max_score=VALUES(max_score), status='submitted',
      faculty_summary=COALESCE(faculty_summary, VALUES(faculty_summary))`, [
      randomUUID(), attemptId, maxScore,
      state === 'terminated' ? 'Interview ended automatically after configured monitoring warnings. Saved answers were preserved.' : null
    ]);
    return maxScore;
  }

  static async adminSubmissions(adminId) {
    await Interview.ensureTables();
    const [rows] = await db.execute(`SELECT at.id attempt_id, at.state, at.started_at, at.submitted_at, at.total_score, at.max_score,
      s.title, s.category, u.fullName student_name, u.email student_email,
      COUNT(ev.id) flag_count,
      SUM(CASE WHEN ev.event_type IN ('face_absent','multiple_faces','looking_away','visibility_hidden','window_blur','fullscreen_exit')
        OR (ev.event_type='manual' AND JSON_UNQUOTE(JSON_EXTRACT(ev.metadata_json, '$.signal'))='clipboard') THEN 1 ELSE 0 END) warning_count
      FROM interview_attempts at JOIN interview_sets s ON s.id=at.set_id JOIN users u ON u.id=at.student_id
      LEFT JOIN interview_monitoring_events ev ON ev.attempt_id=at.id
      WHERE s.created_by=? GROUP BY at.id ORDER BY at.started_at DESC`, [adminId]);
    return rows;
  }

  static async canMonitorAttempt(adminId, attemptId) {
    await Interview.ensureTables();
    const [[attempt]] = await db.execute(`SELECT at.id, at.state FROM interview_attempts at
      JOIN interview_sets s ON s.id=at.set_id WHERE at.id=? AND s.created_by=? LIMIT 1`, [attemptId, adminId]);
    return attempt || null;
  }

  static async canStudentStreamAttempt(studentId, attemptId) {
    await Interview.ensureTables();
    const [[attempt]] = await db.execute(
      'SELECT id, state FROM interview_attempts WHERE id=? AND student_id=? LIMIT 1',
      [attemptId, studentId]
    );
    return attempt || null;
  }

  static async attemptReview(adminId, attemptId) {
    await Interview.ensureTables();
    const [[attempt]] = await db.execute(`SELECT at.*, s.title, s.category, u.fullName student_name, u.email student_email
      FROM interview_attempts at JOIN interview_sets s ON s.id=at.set_id JOIN users u ON u.id=at.student_id
      WHERE at.id=? AND s.created_by=?`, [attemptId, adminId]);
    if (!attempt) return null;
    const [answers] = await db.execute(`SELECT q.id question_id, q.question_text, q.reference_answer, q.evaluation_criteria, q.marks,
      a.answer_text, a.transcript_source, a.score, a.faculty_comments, (a.audio_data IS NOT NULL) has_audio FROM interview_set_questions sq
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

  static async getOrCreateAiHrAssignment() {
    await Interview.ensureTables();
    const [existing] = await db.execute(`SELECT a.id assignment_id, s.id set_id
      FROM interview_assignments a
      JOIN interview_sets s ON s.id = a.set_id
      WHERE s.title = 'AI HR Interactive Mock Interview'
        AND a.status = 'published' AND s.deleted_at IS NULL
      LIMIT 1`);
    if (existing[0]) {
      return existing[0].assignment_id;
    }

    const [admins] = await db.execute(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
    const adminId = admins[0]?.id || '8b964856-ee3c-45cd-a048-7d4a991734c3';

    const setId = randomUUID();
    await db.execute(`INSERT INTO interview_sets
      (id, created_by, title, description, category, status, default_preparation_seconds, default_answer_seconds, max_attempts)
      VALUES (?, ?, ?, ?, 'hr', 'published', 0, 180, 99)`,
      [setId, adminId, 'AI HR Interactive Mock Interview', 'Real-time conversational AI HR mock interview with live voice activity detection, dynamic follow-up questions, and instant executive feedback.']);

    const HR_QUESTIONS = [
      {
        text: 'Tell me about yourself, your educational journey, and what drives your passion in this field.',
        topic: 'Self-Introduction', category: 'hr', order: 1
      },
      {
        text: 'Could you walk me through your most impactful project? What challenges did you encounter and how did you resolve them?',
        topic: 'Projects & Technical Experience', category: 'technical', order: 2
      },
      {
        text: 'What would you consider your greatest professional strength, and what is one area you are actively working to improve?',
        topic: 'Strengths & Weaknesses', category: 'hr', order: 3
      },
      {
        text: 'Tell me about a time you worked in a team with differing opinions or technical disagreements. How did you handle it?',
        topic: 'Teamwork & Collaboration', category: 'behavioral', order: 4
      },
      {
        text: 'Describe a situation where you faced a tight deadline or high pressure. How did you prioritize your tasks to deliver successfully?',
        topic: 'Conflict Handling & Pressure', category: 'behavioral', order: 5
      },
      {
        text: 'Where do you see yourself in the next 3 to 5 years, and how do you plan to achieve those career goals?',
        topic: 'Career Goals & Vision', category: 'hr', order: 6
      },
      {
        text: 'Can you share a time when a project or plan did not go as expected? What happened, what was your role, and what did you learn?',
        topic: 'Behavioral & Situational (STAR)', category: 'behavioral', order: 7
      }
    ];

    for (const q of HR_QUESTIONS) {
      const qId = randomUUID();
      await db.execute(`INSERT INTO interview_questions
        (id, created_by, question_text, category, topic, difficulty, marks, preparation_time_seconds, answer_time_seconds)
        VALUES (?, ?, ?, ?, ?, 'medium', 10, 0, 180)`,
        [qId, adminId, q.text, q.category, q.topic]);
      await db.execute(`INSERT INTO interview_set_questions
        (set_id, question_id, display_order) VALUES (?, ?, ?)`,
        [setId, qId, q.order]);
    }

    const assignmentId = randomUUID();
    await db.execute(`INSERT INTO interview_assignments
      (id, set_id, assigned_by, target_type, max_attempts, status)
      VALUES (?, ?, ?, 'all', 99, 'published')`,
      [assignmentId, setId, adminId]);

    return assignmentId;
  }

  static async saveAiFeedback(attemptId, feedback) {
    await Interview.ensureTables();
    const overallScore = Number(feedback?.overallScore || 0);
    const feedbackJson = JSON.stringify(feedback);
    const summary = feedback?.executiveSummary || 'AI HR Mock Interview Completed.';

    await db.execute(`UPDATE interview_attempts
      SET state='submitted', total_score=?, submitted_at=COALESCE(submitted_at, NOW())
      WHERE id=?`, [overallScore, attemptId]);

    await db.execute(`INSERT INTO interview_results
      (id, attempt_id, total_score, status, ai_feedback, faculty_summary)
      VALUES (?, ?, ?, 'submitted', ?, ?)
      ON DUPLICATE KEY UPDATE
        total_score=VALUES(total_score),
        status='submitted',
        ai_feedback=VALUES(ai_feedback),
        faculty_summary=VALUES(faculty_summary),
        updated_at=CURRENT_TIMESTAMP`,
      [randomUUID(), attemptId, overallScore, feedbackJson, summary]);

    return { overallScore };
  }

  static async getAttemptFeedback(userId, attemptId, isAdmin = false) {
    await Interview.ensureTables();
    const [rows] = await db.execute(`SELECT at.id, at.state, at.started_at, at.submitted_at, at.total_score, at.max_score,
      s.title, s.category, r.ai_feedback, r.faculty_summary, r.status result_status
      FROM interview_attempts at
      JOIN interview_sets s ON s.id=at.set_id
      LEFT JOIN interview_results r ON r.attempt_id=at.id
      WHERE at.id=? ${isAdmin ? '' : 'AND at.student_id=?'} LIMIT 1`,
      isAdmin ? [attemptId] : [attemptId, userId]);
    return rows[0] || null;
  }
}

module.exports = Interview;
