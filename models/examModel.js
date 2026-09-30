const db = require('../config/db');
const { randomUUID } = require('crypto');

class Exam {
  static async create(adminId, payload) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const examId = randomUUID();
      await connection.execute(`INSERT INTO exams
        (id, created_by, title, instructions, duration_minutes, starts_at, ends_at, status, negative_marking)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [examId, adminId, payload.title, payload.instructions, payload.durationMinutes,
          payload.startsAt, payload.endsAt, payload.status || 'draft', payload.negativeMarking || 0]);
      for (const [topicIndex, topic] of payload.topics.entries()) {
        const topicId = randomUUID();
        await connection.execute('INSERT INTO exam_topics (id, exam_id, name, display_order) VALUES (?, ?, ?, ?)', [topicId, examId, topic.name, topicIndex + 1]);
        for (const [questionIndex, question] of topic.questions.entries()) {
          const questionId = randomUUID();
          await connection.execute(`INSERT INTO exam_questions (id, exam_id, topic_id, question_text, marks, display_order)
            VALUES (?, ?, ?, ?, ?, ?)`, [questionId, examId, topicId, question.text, question.marks, question.displayOrder || questionIndex + 1]);
          const correctCount = question.options.filter(option => option.isCorrect).length;
          if (correctCount !== 1) throw new Error('Each MCQ must have exactly one correct option.');
          for (const [optionIndex, option] of question.options.entries()) {
            await connection.execute('INSERT INTO question_options (id, question_id, option_text, is_correct, display_order) VALUES (?, ?, ?, ?, ?)',
              [randomUUID(), questionId, option.text, option.isCorrect, optionIndex + 1]);
          }
        }
      }
      await connection.commit();
      return examId;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
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