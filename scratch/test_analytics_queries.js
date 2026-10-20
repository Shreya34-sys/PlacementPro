const db = require('../config/db');

async function testAnalyticsQuery() {
  const userId = '9d7febf4-c7ae-4ea4-8185-22337d470b91';
  
  // 1. Overview counts
  const [totalStudents] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student']);
  const [activeStudents] = await db.query('SELECT COUNT(DISTINCT user_id) as count FROM preparation_question_activity');
  const [practiceQuestions] = await db.query('SELECT COUNT(DISTINCT question_key) as count FROM preparation_question_activity WHERE user_id = ?', [userId]);
  const [codingSubmissions] = await db.query('SELECT COUNT(*) as count FROM coding_submissions WHERE attempt_id IN (SELECT id FROM coding_attempts WHERE student_id = ?)', [userId]);
  const [compilerJobs] = await db.query('SELECT COUNT(*) as count, SUM(CASE WHEN status = \'compiled\' THEN 1 ELSE 0 END) as successful FROM compiler_jobs WHERE user_id = ? OR user_id IS NULL', [userId]);
  const [examAttempts] = await db.query('SELECT COUNT(*) as count, AVG(score) as avgScore FROM exam_attempts WHERE student_id = ? AND state IN (\'submitted\', \'auto_submitted\')', [userId]);
  const [versantAttempts] = await db.query('SELECT COUNT(*) as count, AVG(r.overall_score) as avgScore FROM versant_assignments a JOIN versant_results r ON r.assignment_id = a.id WHERE a.student_id = ? AND a.status = \'submitted\'', [userId]);
  const [interviews] = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN state = \'started\' THEN 1 ELSE 0 END) as upcoming, SUM(CASE WHEN state IN (\'submitted\', \'reviewed\') THEN 1 ELSE 0 END) as completed, AVG(total_score) as avgScore FROM interview_attempts WHERE student_id = ?', [userId]);
  const [placementDrives] = await db.query('SELECT COUNT(*) as count FROM drives WHERE student_id = ?', [userId]);
  
  console.log('Results:', {
    totalStudents: totalStudents[0].count,
    activeStudents: activeStudents[0].count,
    practiceQuestions: practiceQuestions[0].count,
    codingSubmissions: codingSubmissions[0].count,
    compilerJobs: compilerJobs[0],
    examAttempts: examAttempts[0],
    versantAttempts: versantAttempts[0],
    interviews: interviews[0],
    placementDrives: placementDrives[0].count
  });
  
  // 2. Activity over time (daily buckets)
  const [activityRows] = await db.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day, COUNT(*) as actions
    FROM preparation_question_activity
    WHERE user_id = ?
    GROUP BY day
    ORDER BY day ASC
  `, [userId]);
  console.log('Activity rows:', activityRows);
  
  // 3. Assessment attempts details
  const [examDetails] = await db.query(`
    SELECT a.id, a.exam_id, e.title, e.exam_type, a.score, a.warnings_count, a.state, a.submitted_at
    FROM exam_attempts a
    JOIN exams e ON e.id = a.exam_id
    WHERE a.student_id = ? AND a.state IN ('submitted', 'auto_submitted')
    ORDER BY a.submitted_at ASC
  `, [userId]);
  console.log('Exam details:', examDetails);
  
  process.exit(0);
}

testAnalyticsQuery().catch(err => { console.error(err); process.exit(1); });
