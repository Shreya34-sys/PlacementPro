const db = require('../config/db');

async function testAdminAnalytics() {
  const [totalStudents] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student']);
  const [activeStudents] = await db.query('SELECT COUNT(DISTINCT user_id) as count FROM preparation_question_activity');
  const [practiceQuestions] = await db.query('SELECT COUNT(DISTINCT question_key) as count FROM preparation_question_activity');
  const [compilerJobs] = await db.query('SELECT COUNT(*) as count, SUM(CASE WHEN status = \'compiled\' THEN 1 ELSE 0 END) as successful FROM compiler_jobs');
  const [examAttempts] = await db.query('SELECT COUNT(*) as count, AVG(score) as avgScore FROM exam_attempts WHERE state IN (\'submitted\', \'auto_submitted\')');
  const [versantAttempts] = await db.query('SELECT COUNT(*) as count, AVG(r.overall_score) as avgScore FROM versant_assignments a JOIN versant_results r ON r.assignment_id = a.id WHERE a.status = \'submitted\'');
  const [interviews] = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN state = \'started\' THEN 1 ELSE 0 END) as upcoming, SUM(CASE WHEN state IN (\'submitted\', \'reviewed\') THEN 1 ELSE 0 END) as completed, AVG(total_score) as avgScore FROM interview_attempts');
  const [placementDrives] = await db.query('SELECT COUNT(*) as count FROM drives');

  console.log('Admin results:', {
    totalStudents: totalStudents[0].count,
    activeStudents: activeStudents[0].count,
    practiceQuestions: practiceQuestions[0].count,
    compilerJobs: compilerJobs[0],
    examAttempts: examAttempts[0],
    versantAttempts: versantAttempts[0],
    interviews: interviews[0],
    placementDrives: placementDrives[0].count
  });

  const [deptDistribution] = await db.query(`
    SELECT COALESCE(department, 'CSBS') as department, COUNT(*) as count
    FROM students
    GROUP BY department
  `);
  console.log('Department distribution:', deptDistribution);

  process.exit(0);
}

testAdminAnalytics().catch(err => { console.error(err); process.exit(1); });
