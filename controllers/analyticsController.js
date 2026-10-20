'use strict';

const db = require('../config/db');

// Helper to calculate date threshold based on filter
function getDateThreshold(range) {
  const now = new Date();
  if (range === '7d') {
    now.setDate(now.getDate() - 7);
    return now.toISOString().slice(0, 10);
  } else if (range === '30d') {
    now.setDate(now.getDate() - 30);
    return now.toISOString().slice(0, 10);
  } else if (range === '90d') {
    now.setDate(now.getDate() - 90);
    return now.toISOString().slice(0, 10);
  }
  return null; // 'all'
}

exports.getAnalytics = async (req, res, next) => {
  try {
    const user = req.user;
    const isAdmin = user.role === 'admin' || user.role === 'ADMIN';
    const range = req.query.range || '30d';
    const dateThreshold = getDateThreshold(range);

    // Strict authorization: logged-in student always gets their own ID.
    // Admin can only view a specific student if studentId is provided.
    const studentId = isAdmin && req.query.studentId ? req.query.studentId : user.id;

    // 1. Student Profile & Account Details
    const [userRows] = await db.query(
      'SELECT id, fullName, email, role, created_at FROM users WHERE id = ?',
      [studentId]
    );
    const studentProfile = userRows[0] || {
      id: studentId,
      fullName: user.fullName || 'Student',
      email: user.email || '',
      role: 'student',
      created_at: new Date()
    };

    // 2. Resume AI Analyzer Telemetry
    const [resumeRows] = await db.query(
      `SELECT id, file_name, ats_score, skills_match, keyword_match, formatting_status, created_at
       FROM resumes
       WHERE std_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId]
    );
    const resumeData = resumeRows[0] || null;

    // 3. Study Materials Reading Progress
    const [studyRows] = await db.query(
      `SELECT srp.id, srp.is_completed, srp.progress_percent, srp.last_read_at,
              st.title as topic_title, ss.name as subject_name
       FROM study_reading_progress srp
       JOIN study_topics st ON st.id = srp.topic_id
       JOIN study_subjects ss ON ss.id = srp.subject_id
       WHERE srp.user_id = ?
       ORDER BY srp.last_read_at DESC`,
      [studentId]
    );
    const studyTopicsTotal = studyRows.length;
    const studyTopicsCompleted = studyRows.filter(r => r.is_completed === 1).length;
    const avgStudyProgress = studyTopicsTotal > 0
      ? Number((studyRows.reduce((acc, r) => acc + Number(r.progress_percent || 0), 0) / studyTopicsTotal).toFixed(1))
      : 0;

    // 4. Versant Speech Test Telemetry
    const [versantRows] = await db.query(
      `SELECT va.id, va.status, va.submitted_at, vt.title,
              vr.overall_score, vr.fluency_score, vr.pronunciation_score,
              vr.grammar_score, vr.vocabulary_score, vr.sentence_mastery_score,
              vr.coherence_score, vr.cefr_level, vr.passed
       FROM versant_assignments va
       JOIN versant_tests vt ON vt.id = va.test_id
       LEFT JOIN versant_results vr ON vr.assignment_id = va.id
       WHERE va.student_id = ? AND va.status = 'submitted'
       ORDER BY va.submitted_at DESC`,
      [studentId]
    );
    const versantCompletedCount = versantRows.length;
    const latestVersant = versantRows[0] || null;

    // 5. Coding Rounds & Compiler Lab
    const [codingAttRows] = await db.query(
      `SELECT ca.id, ca.state, ca.final_score, ca.warnings_count, ca.submitted_at, cr.title as round_title
       FROM coding_attempts ca
       JOIN coding_rounds cr ON cr.id = ca.round_id
       WHERE ca.student_id = ?
       ORDER BY ca.started_at DESC`,
      [studentId]
    );

    const [codingSubRows] = await db.query(
      `SELECT cs.id, cs.status, cs.score, cs.created_at
       FROM coding_submissions cs
       JOIN coding_attempts ca ON ca.id = cs.attempt_id
       WHERE ca.student_id = ?`,
      [studentId]
    );
    const codingSubmissionsCount = codingSubRows.length;
    const codingAcceptedCount = codingSubRows.filter(s => s.status === 'accepted' || s.status === 'Accepted').length;

    const [compilerRows] = await db.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'compiled' THEN 1 ELSE 0 END) as successful,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM compiler_jobs
       WHERE user_id = ?`,
      [studentId]
    );
    const compilerTotal = Number(compilerRows[0]?.total || 0);
    const compilerSuccessful = Number(compilerRows[0]?.successful || 0);
    const compilerFailed = Number(compilerRows[0]?.failed || 0);

    // 6. Mock Interviews & Feedback
    const [interviewRows] = await db.query(
      `SELECT ia.id, ia.state, ia.total_score, ia.max_score, ia.created_at, ia.submitted_at,
              ir.ai_feedback, ir.faculty_summary
       FROM interview_attempts ia
       LEFT JOIN interview_results ir ON ir.attempt_id = ia.id
       WHERE ia.student_id = ?
       ORDER BY ia.created_at DESC`,
      [studentId]
    );
    const totalInterviews = interviewRows.length;
    const completedInterviews = interviewRows.filter(r => r.state === 'submitted' || r.state === 'reviewed').length;
    const upcomingInterviews = interviewRows.filter(r => r.state === 'started').length;

    const scoredInterviews = interviewRows.filter(r => r.total_score != null);
    const avgInterviewScore = scoredInterviews.length > 0
      ? Number((scoredInterviews.reduce((acc, r) => acc + Number(r.total_score), 0) / scoredInterviews.length).toFixed(1))
      : 0;

    const latestScoredInterview = interviewRows.find(r => r.ai_feedback != null) || interviewRows[0] || null;

    // 7. AI Proctored Exams & Aptitude Practice
    let examSql = `
      SELECT ea.id, ea.exam_id, ea.score, ea.warnings_count, ea.state, ea.submitted_at,
             e.title, e.exam_type
      FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.student_id = ? AND ea.state IN ('submitted', 'auto_submitted')
      ${dateThreshold ? 'AND ea.submitted_at >= ?' : ''}
      ORDER BY ea.submitted_at DESC
    `;
    const examParams = [studentId];
    if (dateThreshold) examParams.push(dateThreshold);
    const [examRows] = await db.query(examSql, examParams);

    const examsCompleted = examRows.length;
    const rawExamAvg = examsCompleted > 0
      ? Number((examRows.reduce((acc, r) => acc + Math.max(0, Number(r.score)), 0) / examsCompleted).toFixed(1))
      : 0;

    // Practice Questions Activity
    let pqaSql = `
      SELECT COUNT(DISTINCT question_key) as uniqueQuestions,
             COUNT(*) as totalActivityCount,
             MAX(created_at) as lastActivity
      FROM preparation_question_activity
      WHERE user_id = ?
      ${dateThreshold ? 'AND activity_date >= ?' : ''}
    `;
    const pqaParams = [studentId];
    if (dateThreshold) pqaParams.push(dateThreshold);
    const [pqaRows] = await db.query(pqaSql, pqaParams);
    const practiceQuestionsSolved = Number(pqaRows[0]?.uniqueQuestions || 0);

    // 8. Overall Preparation Progress Calculation (Clearly defined mathematical formula)
    // Module weights:
    // Aptitude Practice: 15% (Target: 50 practice questions)
    // Proctored Exams:   20% (Target: attempts + score)
    // Coding & Compiler: 15% (Target: coding submissions + compiler jobs)
    // Mock Interviews:   20% (Target: completed interviews + score)
    // Versant Speech:    10% (Target: completed test + score)
    // Study Materials:   10% (Target: topics read + progress)
    // Resume AI:         10% (Target: ATS score >= 75)

    const aptitudeProgress = Math.min(100, Math.round((practiceQuestionsSolved / 50) * 100));
    const examsProgress = Math.min(100, Math.round(
      (Math.min(10, examsCompleted) / 10) * 50 + (Math.min(100, rawExamAvg * 5)) * 0.5
    ));
    const codingProgress = Math.min(100, Math.round(
      Math.min(10, codingSubmissionsCount + compilerTotal) * 10
    ));
    const interviewProgress = Math.min(100, Math.round(
      (Math.min(5, completedInterviews) / 5) * 40 + (Math.min(100, avgInterviewScore)) * 0.6
    ));
    const versantProgress = latestVersant && latestVersant.overall_score != null
      ? Math.min(100, Math.round(Number(latestVersant.overall_score)))
      : (versantCompletedCount > 0 ? 50 : 0);
    const studyProgress = Math.min(100, Math.round(
      (Math.min(10, studyTopicsTotal) / 10) * 50 + avgStudyProgress * 0.5
    ));
    const resumeProgress = resumeData && resumeData.ats_score != null
      ? Math.min(100, Math.round(Number(resumeData.ats_score)))
      : 0;

    const overallScore = Number((
      aptitudeProgress * 0.15 +
      examsProgress * 0.20 +
      codingProgress * 0.15 +
      interviewProgress * 0.20 +
      versantProgress * 0.10 +
      studyProgress * 0.10 +
      resumeProgress * 0.10
    ).toFixed(1));

    const moduleProgressBreakdown = [
      { module: 'AI Proctored Exams', slug: 'exams', weight: '20%', progress: examsProgress, status: `${examsCompleted} tests completed` },
      { module: 'Mock Interviews', slug: 'interviews', weight: '20%', progress: interviewProgress, status: `${completedInterviews} completed, ${upcomingInterviews} active` },
      { module: 'Coding & Compiler', slug: 'coding', weight: '15%', progress: codingProgress, status: `${compilerTotal} compiler runs, ${codingSubmissionsCount} submissions` },
      { module: 'Aptitude Practice', slug: 'aptitude', weight: '15%', progress: aptitudeProgress, status: `${practiceQuestionsSolved} solved questions` },
      { module: 'Versant Speech Test', slug: 'versant', weight: '10%', progress: versantProgress, status: latestVersant ? `${latestVersant.overall_score}% score` : 'Not attempted' },
      { module: 'Study Materials', slug: 'study', weight: '10%', progress: studyProgress, status: `${studyTopicsTotal} topics tracked (${avgStudyProgress}% avg)` },
      { module: 'Resume AI Analyzer', slug: 'resume', weight: '10%', progress: resumeProgress, status: resumeData ? `${resumeData.ats_score}/100 ATS score` : 'No resume uploaded' }
    ];

    // 9. Active Practice Days, Streak & Last Activity
    const [activityDates] = await db.query(
      `SELECT DISTINCT DATE_FORMAT(activity_date, '%Y-%m-%d') as d
       FROM preparation_question_activity
       WHERE user_id = ?
       ORDER BY d DESC`,
      [studentId]
    );
    const activePracticeDays = activityDates.length;

    // Calculate streak
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const dateSet = new Set(activityDates.map(r => r.d));

    let checkDate = new Date();
    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      if (dateSet.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dStr === today) {
        // If today not active yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        if (!dateSet.has(checkDate.toISOString().slice(0, 10))) break;
      } else {
        break;
      }
    }

    // Determine absolute last activity timestamp
    const candidateTimestamps = [];
    if (pqaRows[0]?.lastActivity) candidateTimestamps.push(new Date(pqaRows[0].lastActivity));
    if (examRows[0]?.submitted_at) candidateTimestamps.push(new Date(examRows[0].submitted_at));
    if (interviewRows[0]?.created_at) candidateTimestamps.push(new Date(interviewRows[0].created_at));
    if (studyRows[0]?.last_read_at) candidateTimestamps.push(new Date(studyRows[0].last_read_at));
    if (resumeData?.created_at) candidateTimestamps.push(new Date(resumeData.created_at));

    const lastActivityTime = candidateTimestamps.length > 0
      ? new Date(Math.max(...candidateTimestamps.map(t => t.getTime()))).toISOString()
      : null;

    // 10. Student Activity Over Time (Daily Actions Trend)
    const [dailyPqa] = await db.query(
      `SELECT DATE_FORMAT(activity_date, '%Y-%m-%d') as date, COUNT(*) as questions
       FROM preparation_question_activity
       WHERE user_id = ?
       ${dateThreshold ? 'AND activity_date >= ?' : ''}
       GROUP BY date ORDER BY date ASC`,
      pqaParams
    );

    const [dailyExams] = await db.query(
      `SELECT DATE_FORMAT(submitted_at, '%Y-%m-%d') as date, COUNT(*) as exams
       FROM exam_attempts
       WHERE student_id = ? AND state IN ('submitted', 'auto_submitted')
       ${dateThreshold ? 'AND submitted_at >= ?' : ''}
       GROUP BY date ORDER BY date ASC`,
      examParams
    );

    const [dailyInterviews] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as interviews
       FROM interview_attempts
       WHERE student_id = ?
       ${dateThreshold ? 'AND created_at >= ?' : ''}
       GROUP BY date ORDER BY date ASC`,
      pqaParams
    );

    const activityMap = new Map();
    dailyPqa.forEach(r => activityMap.set(r.date, { date: r.date, questions: Number(r.questions), exams: 0, interviews: 0 }));
    dailyExams.forEach(r => {
      const ex = activityMap.get(r.date) || { date: r.date, questions: 0, exams: 0, interviews: 0 };
      ex.exams = Number(r.exams);
      activityMap.set(r.date, ex);
    });
    dailyInterviews.forEach(r => {
      const ex = activityMap.get(r.date) || { date: r.date, questions: 0, exams: 0, interviews: 0 };
      ex.interviews = Number(r.interviews);
      activityMap.set(r.date, ex);
    });

    const activityTimeline = Array.from(activityMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        totalActions: item.questions + item.exams + item.interviews
      }));

    // 11. Weak Topics Identification based on Actual Performance
    const [lowTopicRows] = await db.query(
      `SELECT et.name as topic_name, e.title as exam_title, ea.score, ea.warnings_count
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       JOIN exam_questions eq ON eq.exam_id = e.id
       JOIN exam_topics et ON et.id = eq.topic_id
       WHERE ea.student_id = ? AND ea.score <= 2.00
       GROUP BY et.name, e.title, ea.score, ea.warnings_count
       LIMIT 6`,
      [studentId]
    );

    const weakTopics = lowTopicRows.map(r => ({
      topic: r.topic_name,
      reason: `Low score (${Number(r.score).toFixed(1)}) in ${r.exam_title}`,
      severity: Number(r.score) < 0 ? 'critical' : 'moderate',
      recommendedAction: 'Practice topic questions'
    }));

    // If interview feedback shows low sub-dimensions, add them to weak topics
    if (latestScoredInterview && latestScoredInterview.ai_feedback && latestScoredInterview.ai_feedback.scores) {
      const scores = latestScoredInterview.ai_feedback.scores;
      if (scores.answerStructure != null && scores.answerStructure < 50) {
        weakTopics.push({
          topic: 'Interview Response Structure (STAR Method)',
          reason: `Scored ${scores.answerStructure}/100 in latest Mock AI interview`,
          severity: 'moderate',
          recommendedAction: 'Structure answers using Situation, Task, Action, Result'
        });
      }
      if (scores.relevance != null && scores.relevance < 50) {
        weakTopics.push({
          topic: 'Interview Prompt Relevance',
          reason: `Scored ${scores.relevance}/100 in latest Mock AI interview`,
          severity: 'moderate',
          recommendedAction: 'Directly address the specific project/technical prompt'
        });
      }
    }

    // 12. Personalized Recommendations Engine (Rule-based, 100% Genuine Data)
    const recommendations = [];

    if (weakTopics.length > 0) {
      recommendations.push({
        id: 'rec-weak-topics',
        module: 'Aptitude Practice',
        title: `Strengthen ${weakTopics[0].topic}`,
        description: `Your recent attempt scored ${weakTopics[0].reason}. Target these questions to build speed and accuracy.`,
        actionText: 'Practice Aptitude Tests',
        actionUrl: '/available-exams',
        priority: 'high'
      });
    }

    if (latestScoredInterview && latestScoredInterview.ai_feedback && latestScoredInterview.ai_feedback.areasForImprovement) {
      const topArea = latestScoredInterview.ai_feedback.areasForImprovement[0];
      recommendations.push({
        id: 'rec-interview',
        module: 'Mock Interviews',
        title: 'Refine Interview Technique',
        description: topArea,
        actionText: 'Launch Mock Interview',
        actionUrl: '/available-exams',
        priority: 'high'
      });
    } else if (completedInterviews === 0) {
      recommendations.push({
        id: 'rec-first-interview',
        module: 'Mock Interviews',
        title: 'Complete Your First AI Mock Interview',
        description: 'Practice answering behavioral and technical questions with real-time AI speech and posture feedback.',
        actionText: 'Start Mock Interview',
        actionUrl: '/available-exams',
        priority: 'medium'
      });
    }

    if (codingSubmissionsCount === 0) {
      recommendations.push({
        id: 'rec-coding',
        module: 'Coding Rounds',
        title: 'Submit Solutions in Coding Rounds',
        description: 'You have compiler runs in C-Visualize, but have not submitted competitive coding rounds yet. Tackle DSA challenges to verify test cases.',
        actionText: 'Open Coding Rounds',
        actionUrl: '/coding-rounds',
        priority: 'medium'
      });
    }

    const incompleteStudy = studyRows.find(s => s.is_completed === 0 && s.progress_percent > 0);
    if (incompleteStudy) {
      recommendations.push({
        id: 'rec-study',
        module: 'Study Materials',
        title: `Resume ${incompleteStudy.subject_name}`,
        description: `You are currently ${incompleteStudy.progress_percent}% through "${incompleteStudy.topic_title}". Complete this reading topic.`,
        actionText: 'Resume Reading',
        actionUrl: '/study-materials',
        priority: 'low'
      });
    }

    if (!resumeData) {
      recommendations.push({
        id: 'rec-resume',
        module: 'Resume AI Analyzer',
        title: 'Upload and Audit Your Resume',
        description: 'Get automated ATS score benchmarking, keyword gap analysis, and bullet-point rewriting.',
        actionText: 'Analyze Resume',
        actionUrl: '/dashboard#resumeSection',
        priority: 'medium'
      });
    } else if (resumeData.ats_score < 75) {
      recommendations.push({
        id: 'rec-resume-boost',
        module: 'Resume AI Analyzer',
        title: `Improve Resume ATS Score (${resumeData.ats_score}/100)`,
        description: `Your resume "${resumeData.file_name}" has ${resumeData.keyword_match}% keyword match. Incorporate suggested technical skills.`,
        actionText: 'Review Resume Feedback',
        actionUrl: '/dashboard#resumeSection',
        priority: 'medium'
      });
    }

    // 13. Recent Unified Activity Feed
    const recentFeed = [];

    examRows.slice(0, 4).forEach(e => {
      recentFeed.push({
        type: 'exam',
        title: e.title,
        subtitle: `${e.exam_type} test completed • Score: ${Number(e.score).toFixed(1)}`,
        date: e.submitted_at,
        badge: e.warnings_count > 0 ? `${e.warnings_count} Alerts` : 'Proctored Clean',
        badgeType: e.warnings_count > 0 ? 'warning' : 'success'
      });
    });

    versantRows.slice(0, 2).forEach(v => {
      recentFeed.push({
        type: 'versant',
        title: `Versant Speech: ${v.title}`,
        subtitle: `Spoken English assessed • Overall: ${Number(v.overall_score).toFixed(1)}% (${v.cefr_level || 'CEFR'})`,
        date: v.submitted_at,
        badge: v.passed ? 'Passed' : 'Needs Practice',
        badgeType: v.passed ? 'success' : 'warning'
      });
    });

    interviewRows.filter(i => i.state === 'submitted' || i.state === 'reviewed').slice(0, 3).forEach(i => {
      recentFeed.push({
        type: 'interview',
        title: 'AI Mock Interview Completed',
        subtitle: i.total_score != null ? `Awarded Score: ${Number(i.total_score).toFixed(1)}%` : 'Session evaluated',
        date: i.submitted_at || i.created_at,
        badge: i.state === 'reviewed' ? 'Faculty Reviewed' : 'AI Evaluated',
        badgeType: 'info'
      });
    });

    if (resumeData) {
      recentFeed.push({
        type: 'resume',
        title: `Resume Analyzed: ${resumeData.file_name}`,
        subtitle: `ATS Score: ${resumeData.ats_score}/100 • Formatting: ${resumeData.formatting_status}`,
        date: resumeData.created_at,
        badge: `${resumeData.ats_score}% ATS`,
        badgeType: resumeData.ats_score >= 75 ? 'success' : 'warning'
      });
    }

    studyRows.slice(0, 3).forEach(s => {
      recentFeed.push({
        type: 'study',
        title: s.topic_title,
        subtitle: `${s.subject_name} • ${s.progress_percent}% read`,
        date: s.last_read_at,
        badge: s.is_completed ? 'Completed' : 'In Progress',
        badgeType: s.is_completed ? 'success' : 'info'
      });
    });

    recentFeed.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Return Complete Personal Progress Response
    res.json({
      success: true,
      meta: {
        role: studentProfile.role,
        studentId: studentProfile.id,
        fullName: studentProfile.fullName,
        email: studentProfile.email,
        range,
        dateThreshold
      },
      readiness: {
        overallScore,
        calculationFormula: 'Weighted average: Exams (20%) + Mock Interviews (20%) + Coding & Compiler (15%) + Aptitude Practice (15%) + Versant (10%) + Study Materials (10%) + Resume AI (10%)',
        activePracticeDays,
        streak,
        lastActivityTime,
        moduleProgressBreakdown
      },
      modules: {
        coding: {
          compilerRuns: compilerTotal,
          compilerSuccessful,
          compilerFailed,
          compilerSuccessRate: compilerTotal > 0 ? Number(((compilerSuccessful / compilerTotal) * 100).toFixed(1)) : 0,
          codingAttemptsCount: codingAttRows.length,
          codingSubmissionsCount,
          codingAcceptedCount,
          attempts: codingAttRows.slice(0, 5)
        },
        aptitude: {
          questionsSolved: practiceQuestionsSolved,
          examsTaken: examsCompleted,
          averageScore: rawExamAvg,
          recentExams: examRows.slice(0, 5)
        },
        exams: {
          completedCount: examsCompleted,
          averageScore: rawExamAvg,
          history: examRows.slice(0, 10)
        },
        interviews: {
          totalCount: totalInterviews,
          completedCount: completedInterviews,
          upcomingCount: upcomingInterviews,
          averageScore: avgInterviewScore,
          latestFeedback: latestScoredInterview
        },
        versant: {
          completedCount: versantCompletedCount,
          latest: latestVersant
        },
        studyMaterials: {
          totalTopicsTracked: studyTopicsTotal,
          topicsCompleted: studyTopicsCompleted,
          averageProgress: avgStudyProgress,
          recentTopics: studyRows.slice(0, 5)
        },
        resume: resumeData
      },
      weakTopics,
      recommendations,
      activityTimeline,
      recentFeed: recentFeed.slice(0, 10)
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    next(error);
  }
};
