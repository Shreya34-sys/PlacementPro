'use strict';
require('dotenv').config();

const db = require('../config/db');

async function testStudentAnalytics() {
  const studentId = '9d7febf4-c7ae-4ea4-8185-22337d470b91';
  console.log('Testing student ID:', studentId);

  // 1. User profile
  const [userRows] = await db.query(
    'SELECT id, fullName, email, role, created_at FROM users WHERE id = ?',
    [studentId]
  );
  console.log('User:', userRows[0]);

  // 2. Resume AI Analyzer
  const [resumeRows] = await db.query(
    'SELECT id, file_name, ats_score, skills_match, keyword_match, formatting_status, created_at FROM resumes WHERE std_id = ? ORDER BY created_at DESC LIMIT 1',
    [studentId]
  );
  console.log('Resume:', resumeRows[0] || 'None');

  // 3. Study Materials Progress
  const [studyRows] = await db.query(`
    SELECT srp.id, srp.is_completed, srp.progress_percent, srp.last_read_at,
           st.title as topic_title, ss.name as subject_name
    FROM study_reading_progress srp
    JOIN study_topics st ON st.id = srp.topic_id
    JOIN study_subjects ss ON ss.id = srp.subject_id
    WHERE srp.user_id = ?
    ORDER BY srp.last_read_at DESC
  `, [studentId]);
  console.log('Study Topics count:', studyRows.length);

  // 4. Versant Speech Test
  const [versantRows] = await db.query(`
    SELECT va.id, va.status, va.submitted_at, vt.title,
           vr.overall_score, vr.fluency_score, vr.pronunciation_score,
           vr.grammar_score, vr.vocabulary_score, vr.sentence_mastery_score,
           vr.coherence_score, vr.cefr_level, vr.passed
    FROM versant_assignments va
    JOIN versant_tests vt ON vt.id = va.test_id
    LEFT JOIN versant_results vr ON vr.assignment_id = va.id
    WHERE va.student_id = ?
    ORDER BY va.created_at DESC
  `, [studentId]);
  console.log('Versant assignments count:', versantRows.length);

  // 5. Coding & Compiler
  const [codingAttRows] = await db.query(`
    SELECT ca.id, ca.state, ca.final_score, ca.warnings_count, ca.submitted_at, cr.title as round_title
    FROM coding_attempts ca
    JOIN coding_rounds cr ON cr.id = ca.round_id
    WHERE ca.student_id = ?
    ORDER BY ca.started_at DESC
  `, [studentId]);
  console.log('Coding attempts count:', codingAttRows.length);

  const [compilerRows] = await db.query(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'compiled' THEN 1 ELSE 0 END) as successful,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM compiler_jobs
    WHERE user_id = ?
  `, [studentId]);
  console.log('Compiler jobs for student:', compilerRows[0]);

  // 6. Mock Interviews & Feedback
  const [interviewRows] = await db.query(`
    SELECT ia.id, ia.state, ia.total_score, ia.max_score, ia.created_at, ia.submitted_at,
           ir.ai_feedback, ir.faculty_summary
    FROM interview_attempts ia
    LEFT JOIN interview_results ir ON ir.attempt_id = ia.id
    WHERE ia.student_id = ?
    ORDER BY ia.created_at DESC
  `, [studentId]);
  console.log('Interview sessions count:', interviewRows.length);

  // 7. Aptitude & Exams
  const [examRows] = await db.query(`
    SELECT ea.id, ea.exam_id, ea.score, ea.warnings_count, ea.state, ea.submitted_at,
           e.title, e.exam_type
    FROM exam_attempts ea
    JOIN exams e ON e.id = ea.exam_id
    WHERE ea.student_id = ?
    ORDER BY ea.submitted_at DESC
  `, [studentId]);
  console.log('Exam attempts count:', examRows.length);

  // 8. Practice question activity
  const [pqaRows] = await db.query(`
    SELECT COUNT(DISTINCT question_key) as uniqueQuestions,
           COUNT(*) as totalActivityCount,
           MAX(created_at) as lastActivity
    FROM preparation_question_activity
    WHERE user_id = ?
  `, [studentId]);
  console.log('Practice questions:', pqaRows[0]);

  // 9. Weak Topics derived from low scoring exams
  const [lowExams] = await db.query(`
    SELECT ea.id, ea.score, e.title, et.name as topic_name
    FROM exam_attempts ea
    JOIN exams e ON e.id = ea.exam_id
    JOIN exam_questions eq ON eq.exam_id = e.id
    JOIN exam_topics et ON et.id = eq.topic_id
    WHERE ea.student_id = ? AND ea.score <= 2.00
    GROUP BY et.name, e.title, ea.id, ea.score
    LIMIT 6
  `, [studentId]);
  console.log('Identified weak topics from real attempts:', lowExams);

  process.exit(0);
}

testStudentAnalytics().catch(err => {
  console.error(err);
  process.exit(1);
});
