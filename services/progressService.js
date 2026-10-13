const db = require('../config/db');
const preparationActivity = require('./preparationActivityService');

const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

async function optionalQuery(sql, params = []) {
  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return [];
    throw error;
  }
}

async function getSummary(userId) {
  const [examCounts, versantCounts, examRows, versantRows, activity] = await Promise.all([
    optionalQuery(`SELECT COUNT(*) AS total FROM exams WHERE status = 'published' AND deleted_at IS NULL`),
    optionalQuery(`SELECT COUNT(*) AS total FROM versant_tests WHERE status = 'published'`),
    optionalQuery(`SELECT a.id, a.exam_id AS module_id, e.title AS module_name, a.score,
        a.submitted_at, COALESCE(SUM(q.marks), 0) AS max_score
      FROM exam_attempts a
      JOIN exams e ON e.id = a.exam_id
      LEFT JOIN exam_questions q ON q.exam_id = e.id
      WHERE a.student_id = ? AND a.state IN ('submitted', 'auto_submitted')
      GROUP BY a.id, e.id
      ORDER BY a.submitted_at DESC`, [userId]),
    optionalQuery(`SELECT a.id, a.test_id AS module_id, t.title AS module_name,
        r.overall_score AS score, a.submitted_at
      FROM versant_assignments a
      JOIN versant_tests t ON t.id = a.test_id
      JOIN versant_results r ON r.assignment_id = a.id
      WHERE a.student_id = ? AND a.status = 'submitted'
      ORDER BY a.submitted_at DESC`, [userId]),
    preparationActivity.getActivity(userId)
  ]);

  const examModules = examRows.map((row) => {
    const maxScore = Number(row.max_score) || 0;
    const rawScore = Number(row.score) || 0;
    return {
      id: `exam:${row.module_id}`,
      name: row.module_name,
      score: clampPercent(maxScore > 0 ? (rawScore / maxScore) * 100 : rawScore),
      completedAt: row.submitted_at,
      type: 'exam'
    };
  });

  const versantModules = versantRows.map((row) => ({
    id: `versant:${row.module_id}`,
    name: row.module_name,
    score: clampPercent(row.score),
    completedAt: row.submitted_at,
    type: 'versant'
  }));

  const completedModules = [...examModules, ...versantModules]
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt));
  const scores = completedModules.map((module) => module.score);
  const latest = scores[0] ?? 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const available = Number(examCounts[0]?.total || 0) + Number(versantCounts[0]?.total || 0);

  return {
    score: { latest, best, average },
    modules: {
      completed: completedModules.length,
      total: available,
      percentage: available ? Math.min(100, (completedModules.length / available) * 100) : 0,
      items: completedModules
    },
    preparationActivity: activity,
    recentScores: completedModules.slice(0, 8)
  };
}

async function emitProgress(io, userId) {
  if (!io || !userId) return;
  const summary = await getSummary(userId);
  io.to(`user:${userId}`).emit('progress:update', summary);
}

module.exports = { getSummary, emitProgress };
