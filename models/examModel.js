const db = require('../config/db');
const { randomUUID } = require('crypto');

class Exam {
  static async ensureImportColumns(connection = db) {
    const [columns] = await connection.execute(
      `SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND ((TABLE_NAME = 'exam_questions' AND COLUMN_NAME IN ('explanation', 'difficulty'))
           OR (TABLE_NAME = 'exams' AND COLUMN_NAME IN ('exam_type', 'instructions')))`
    );
    const existing = new Set(columns.map(column => `${column.TABLE_NAME}.${column.COLUMN_NAME}`));
    if (!existing.has('exam_questions.explanation')) {
      await connection.execute('ALTER TABLE exam_questions ADD COLUMN explanation TEXT NULL');
    }
    if (!existing.has('exam_questions.difficulty')) {
      await connection.execute("ALTER TABLE exam_questions ADD COLUMN difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium'");
    }
    if (!existing.has('exams.exam_type')) {
      await connection.execute("ALTER TABLE exams ADD COLUMN exam_type VARCHAR(32) NOT NULL DEFAULT 'aptitude'");
    }
    const instructionsCol = columns.find(c => c.TABLE_NAME === 'exams' && c.COLUMN_NAME === 'instructions');
    if (instructionsCol && instructionsCol.IS_NULLABLE === 'NO') {
      await connection.execute('ALTER TABLE exams MODIFY COLUMN instructions TEXT NULL');
    }
  }

  static async ensureImportTable(connection = db) {
    await connection.execute(`CREATE TABLE IF NOT EXISTS exam_question_imports (
      created_by VARCHAR(36) NOT NULL,
      file_hash CHAR(64) NOT NULL,
      exam_id CHAR(36) NULL,
      imported_count INT UNSIGNED NOT NULL DEFAULT 0,
      skipped_rows INT UNSIGNED NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (created_by, file_hash),
      CONSTRAINT fk_exam_import_admin FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_exam_import_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    )`);
  }

  static async claimImport(connection, adminId, payload) {
    if (!payload.importFingerprint) return null;
    const [result] = await connection.execute(
      `INSERT IGNORE INTO exam_question_imports (created_by, file_hash)
       VALUES (?, ?)`,
      [adminId, payload.importFingerprint]
    );
    if (result.affectedRows === 1) return null;

    const [[existing]] = await connection.execute(
      `SELECT exam_id, imported_count, skipped_rows
       FROM exam_question_imports WHERE created_by=? AND file_hash=? FOR UPDATE`,
      [adminId, payload.importFingerprint]
    );

    if (existing && existing.exam_id) {
      const [[activeExam]] = await connection.execute(
        'SELECT id, title FROM exams WHERE id=? AND deleted_at IS NULL',
        [existing.exam_id]
      );
      if (!activeExam) {
        await connection.execute(
          'DELETE FROM exam_question_imports WHERE created_by=? AND file_hash=?',
          [adminId, payload.importFingerprint]
        );
        await connection.execute(
          'INSERT INTO exam_question_imports (created_by, file_hash) VALUES (?, ?)',
          [adminId, payload.importFingerprint]
        );
        return null;
      }

      if (payload.target === 'existing' && String(payload.examId) === String(existing.exam_id)) {
        await connection.rollback();
        return {
          duplicate: true,
          id: existing.exam_id,
          importedCount: 0,
          skippedRows: 0,
          originalImportedCount: Number(existing.imported_count),
          originalSkippedRows: Number(existing.skipped_rows)
        };
      }

      return null;
    }

    return null;
  }

  static async completeImport(connection, adminId, examId, payload) {
    if (!payload.importFingerprint) return;
    await connection.execute(
      `INSERT INTO exam_question_imports (created_by, file_hash, exam_id, imported_count, skipped_rows)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         exam_id = VALUES(exam_id),
         imported_count = VALUES(imported_count),
         skipped_rows = VALUES(skipped_rows),
         created_at = CURRENT_TIMESTAMP`,
      [adminId, payload.importFingerprint, examId, payload.importedCount, payload.skippedRows || 0]
    );
  }

  static async create(adminId, payload) {
    const connection = await db.getConnection();
    try {
      const hasImportMetadata = payload.topics.some(topic =>
        topic.questions.some(question => question.explanation || question.difficulty)
      );
      if (hasImportMetadata) await Exam.ensureImportColumns(connection);
      if (payload.importFingerprint) await Exam.ensureImportTable(connection);
      await connection.beginTransaction();
      const duplicate = await Exam.claimImport(connection, adminId, payload);
      if (duplicate) return duplicate;
      const examId = randomUUID();
      await connection.execute(`INSERT INTO exams
        (id, created_by, title, exam_type, instructions, duration_minutes, starts_at, ends_at, status, negative_marking)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [examId, adminId, payload.title, payload.examType || payload.exam_type || 'aptitude', payload.instructions || '', payload.durationMinutes || 20,
          payload.startsAt, payload.endsAt, payload.status || 'draft', payload.negativeMarking || 0]);
      for (const [topicIndex, topic] of payload.topics.entries()) {
        const topicId = randomUUID();
        await connection.execute('INSERT INTO exam_topics (id, exam_id, name, display_order) VALUES (?, ?, ?, ?)', [topicId, examId, topic.name, topicIndex + 1]);
        for (const [questionIndex, question] of topic.questions.entries()) {
          const questionId = randomUUID();
          if (hasImportMetadata) {
            await connection.execute(`INSERT INTO exam_questions (id, exam_id, topic_id, question_text, explanation, difficulty, marks, display_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
              questionId,
              examId,
              topicId,
              question.text,
              question.explanation || null,
              question.difficulty || 'medium',
              question.marks,
              question.displayOrder || questionIndex + 1
            ]);
          } else {
            await connection.execute(`INSERT INTO exam_questions (id, exam_id, topic_id, question_text, marks, display_order)
              VALUES (?, ?, ?, ?, ?, ?)`, [questionId, examId, topicId, question.text, question.marks, question.displayOrder || questionIndex + 1]);
          }
          const correctCount = question.options.filter(option => option.isCorrect).length;
          if (correctCount !== 1) throw new Error('Each MCQ must have exactly one correct option.');
          for (const [optionIndex, option] of question.options.entries()) {
            await connection.execute('INSERT INTO question_options (id, question_id, option_text, is_correct, display_order) VALUES (?, ?, ?, ?, ?)',
              [randomUUID(), questionId, option.text, option.isCorrect, optionIndex + 1]);
          }
        }
      }
      await Exam.completeImport(connection, adminId, examId, payload);
      await connection.commit();
      return examId;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  static async appendQuestions(adminId, examId, payload) {
    const connection = await db.getConnection();
    try {
      await Exam.ensureImportColumns(connection);
      if (payload.importFingerprint) await Exam.ensureImportTable(connection);
      await connection.beginTransaction();
      const duplicate = await Exam.claimImport(connection, adminId, payload);
      if (duplicate) return duplicate;
      const [[exam]] = await connection.execute(
        'SELECT id FROM exams WHERE id=? AND created_by=? AND deleted_at IS NULL FOR UPDATE',
        [examId, adminId]
      );
      if (!exam) {
        const error = new Error('Question set not found.');
        error.status = 404;
        throw error;
      }

      if (payload.status) {
        await connection.execute('UPDATE exams SET status=? WHERE id=?', [payload.status, examId]);
      }
      if (payload.negativeMarking !== undefined && payload.negativeMarking !== null) {
        await connection.execute('UPDATE exams SET negative_marking=? WHERE id=?', [payload.negativeMarking, examId]);
      }

      const [topicRows] = await connection.execute(
        'SELECT id, name, display_order FROM exam_topics WHERE exam_id=? ORDER BY display_order',
        [examId]
      );
      const topicMap = new Map(topicRows.map(topic => [topic.name.toLowerCase(), topic]));
      let nextTopicOrder = topicRows.reduce((max, topic) => Math.max(max, topic.display_order), 0) + 1;
      const [[questionOrder]] = await connection.execute(
        'SELECT COALESCE(MAX(display_order), 0) AS maxOrder FROM exam_questions WHERE exam_id=?',
        [examId]
      );
      let nextQuestionOrder = Number(questionOrder.maxOrder) + 1;

      for (const topic of payload.topics) {
        let topicRow = topicMap.get(topic.name.toLowerCase());
        if (!topicRow) {
          topicRow = { id: randomUUID(), name: topic.name, display_order: nextTopicOrder++ };
          topicMap.set(topic.name.toLowerCase(), topicRow);
          await connection.execute(
            'INSERT INTO exam_topics (id, exam_id, name, display_order) VALUES (?, ?, ?, ?)',
            [topicRow.id, examId, topicRow.name, topicRow.display_order]
          );
        }

        for (const question of topic.questions) {
          const questionId = randomUUID();
          await connection.execute(`INSERT INTO exam_questions
            (id, exam_id, topic_id, question_text, explanation, difficulty, marks, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            questionId,
            examId,
            topicRow.id,
            question.text,
            question.explanation || null,
            question.difficulty || 'medium',
            question.marks,
            nextQuestionOrder++
          ]);
          const correctCount = question.options.filter(option => option.isCorrect).length;
          if (correctCount !== 1) throw new Error('Each MCQ must have exactly one correct option.');
          for (const [optionIndex, option] of question.options.entries()) {
            await connection.execute(
              'INSERT INTO question_options (id, question_id, option_text, is_correct, display_order) VALUES (?, ?, ?, ?, ?)',
              [randomUUID(), questionId, option.text, option.isCorrect, optionIndex + 1]
            );
          }
        }
      }

      await Exam.completeImport(connection, adminId, examId, payload);
      await connection.commit();
      return examId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async availableForStudent(studentId) {
    const [rows] = await db.execute(`SELECT e.id, e.title, e.duration_minutes, e.starts_at, e.ends_at,
     e.status, COUNT(q.id) AS questionCount, a.id AS attemptId, a.state AS attemptState,
      CASE WHEN a.id IS NOT NULL THEN 'completed' WHEN NOW() > e.ends_at THEN 'expired'
           WHEN NOW() < e.starts_at THEN 'upcoming' ELSE 'available' END AS availability
      FROM exams e LEFT JOIN exam_questions q ON q.exam_id=e.id
      LEFT JOIN exam_attempts a ON a.exam_id=e.id AND a.student_id=?
      WHERE e.status='published' AND e.deleted_at IS NULL GROUP BY e.id, a.id ORDER BY e.created_at DESC`, [studentId]);
    return rows;
  }

 static async remove(examId, adminId) {
    const [result] = await db.execute('UPDATE exams SET deleted_at=NOW() WHERE id=? AND created_by=? AND deleted_at IS NULL', [examId, adminId]);
    return result.affectedRows === 1;
  }

  static async updateStatus(examId, adminId, status) {
    const safeStatus = status === 'published' ? 'published' : 'draft';
    const [result] = await db.execute('UPDATE exams SET status=?, updated_at=NOW() WHERE id=? AND created_by=? AND deleted_at IS NULL', [safeStatus, examId, adminId]);
    return result.affectedRows === 1;
  }

  static async listForAdmin(adminId) {
    const [rows] = await db.execute(`SELECT e.id,e.title,e.status,e.duration_minutes,e.starts_at,e.ends_at,
      CASE WHEN NOW() > e.ends_at THEN 'expired' ELSE e.status END AS display_status,
      COUNT(q.id) AS question_count FROM exams e LEFT JOIN exam_questions q ON q.exam_id=e.id
        WHERE e.created_by=? AND e.deleted_at IS NULL GROUP BY e.id ORDER BY e.created_at DESC`, [adminId]);
    return rows;
  }

  static async studentExam(examId) {
    const [rows] = await db.execute(`SELECT q.id, q.question_text, q.marks, q.display_order, t.name AS topic,
      o.id AS option_id, o.option_text, o.display_order AS option_order
      FROM exam_questions q JOIN exam_topics t ON t.id=q.topic_id
      JOIN question_options o ON o.question_id=q.id WHERE q.exam_id=? ORDER BY q.display_order, o.display_order`, [examId]);
    const questions = new Map();
    rows.forEach(row => { if (!questions.has(row.id)) questions.set(row.id, { id: row.id, text: row.question_text, marks: row.marks, order: row.display_order, topic: row.topic, options: [] }); questions.get(row.id).options.push({ id: row.option_id, text: row.option_text }); });
    return [...questions.values()];
  }

  
}
module.exports = Exam;
