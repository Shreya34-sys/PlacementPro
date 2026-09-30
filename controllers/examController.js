const Exam = require('../models/examModel');
const Attempt = require('../models/attemptModel');
const db = require('../config/db');

exports.create = async (req, res, next) => {
  try { res.status(201).json({ id: await Exam.create(req.user.id, req.body) }); } catch (error) { next(error); }
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
  try { await Attempt.saveAnswer(req.params.attemptId, req.body.questionId, req.body.optionId, req.body.markedForReview); res.sendStatus(204); } catch (error) { next(error); }
};
exports.submit = async (req, res, next) => {
  try { res.json(await Attempt.submit(req.params.attemptId, Boolean(req.body.forced))); } catch (error) { next(error); }
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