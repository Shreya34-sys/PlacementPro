const db = require('../config/db');
const { randomUUID } = require('crypto');

exports.getIntelligenceStats = async (req, res, next) => {
  try {
    // 1. Fetch practice companies (tracks) from MySQL for practice content organization
    const [companies] = await db.execute(`
      SELECT c.id, c.name, c.short_name, c.overview, c.rounds
      FROM companies c
      ORDER BY c.name ASC
    `);

    // 2. Real practice assessments count (exams + coding rounds)
    const [examCountRows] = await db.execute('SELECT COUNT(*) AS total FROM exams');
    const [codingCountRows] = await db.execute('SELECT COUNT(*) AS total FROM coding_rounds WHERE deleted_at IS NULL');
    const activeAssessmentsCount = Number(examCountRows[0]?.total || 0) + Number(codingCountRows[0]?.total || 0);

    // 3. Question bank items count (exam questions + coding questions)
    const [examQRows] = await db.execute('SELECT COUNT(*) AS total FROM questions');
    const [codingQRows] = await db.execute('SELECT COUNT(*) AS total FROM coding_questions');
    const totalQuestionsCount = Number(examQRows[0]?.total || 0) + Number(codingQRows[0]?.total || 0);

    // 4. Study & reference knowledge chunks count from documents table
    const [docRows] = await db.execute('SELECT COUNT(*) AS total FROM documents');
    const ragChunks = Number(docRows[0]?.total || 0);

    // 5. Total practice attempts across modules
    const [examAttemptRows] = await db.execute('SELECT COUNT(*) AS total FROM exam_attempts');
    const [codingAttemptRows] = await db.execute('SELECT COUNT(*) AS total FROM coding_attempts');
    const [interviewAttemptRows] = await db.execute('SELECT COUNT(*) AS total FROM interview_attempts');
    const totalPracticeAttempts = Number(examAttemptRows[0]?.total || 0) + Number(codingAttemptRows[0]?.total || 0) + Number(interviewAttemptRows[0]?.total || 0);

    // 6. Calculate actual average readiness from real completed student attempts
    const [examRows] = await db.execute('SELECT AVG(score) AS avgExamScore FROM exam_attempts WHERE state="submitted"');
    const [interviewRows] = await db.execute('SELECT AVG(total_score) AS avgInterviewScore FROM interview_attempts WHERE state IN ("submitted", "reviewed")');
    const [versantRows] = await db.execute('SELECT AVG(overall_score) AS avgVersantScore FROM versant_results');
    const [codingScoreRows] = await db.execute('SELECT AVG(final_score) AS avgCodingScore FROM coding_attempts WHERE state="submitted"');

    const scoresList = [];
    if (examRows[0]?.avgExamScore != null) scoresList.push(Number(examRows[0].avgExamScore));
    if (interviewRows[0]?.avgInterviewScore != null) scoresList.push(Number(interviewRows[0].avgInterviewScore));
    if (versantRows[0]?.avgVersantScore != null) scoresList.push(Number(versantRows[0].avgVersantScore));
    if (codingScoreRows[0]?.avgCodingScore != null) scoresList.push(Number(codingScoreRows[0].avgCodingScore));

    let avgReadiness = 0;
    if (scoresList.length > 0) {
      avgReadiness = Number((scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1));
    }

    // 7. Format company tracks for practice-only dashboard
    const tracksList = companies.map(c => {
      let rounds = c.rounds;
      if (typeof rounds === 'string') {
        try { rounds = JSON.parse(rounds); } catch {}
      }

      return {
        id: c.id,
        name: c.name,
        shortName: c.short_name || c.name.slice(0, 3).toUpperCase(),
        overview: c.overview || `Practice modules and interview test patterns for ${c.name}.`,
        roundsCount: Array.isArray(rounds) ? rounds.length : 3,
        status: 'PRACTICE'
      };
    });

    res.json({
      success: true,
      stats: {
        activeAssessmentsCount,
        totalQuestionsCount,
        totalPracticeAttempts,
        ragChunks,
        avgReadiness,
        tracks: tracksList,
        // Legacy keys preserved for backward compatibility
        activeDrivesCount: activeAssessmentsCount,
        totalRegistrations: totalPracticeAttempts,
        pendingAlerts: totalQuestionsCount,
        drives: tracksList
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.ingest = async (req, res, next) => {
  try {
    const { prompt, drive } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt text is required for AI ingestion.' });
    }

    // Find company if track key provided
    let companyId = null;
    if (drive) {
      const [comp] = await db.execute(
        'SELECT id FROM companies WHERE LOWER(name) LIKE ? OR LOWER(short_name) LIKE ? LIMIT 1',
        [`%${drive.toLowerCase()}%`, `%${drive.toLowerCase()}%`]
      );
      if (comp[0]) companyId = comp[0].id;
    }

    // Split into meaningful semantic knowledge chunks
    const paragraphs = prompt
      .split(/(?:\r?\n){2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 10);

    const chunks = paragraphs.length > 0 ? paragraphs : [prompt.trim()];

    for (const chunk of chunks) {
      const docId = randomUUID();
      const title = `${drive ? drive.toUpperCase() + ' ' : ''}Practice Pattern - ${chunk.slice(0, 45)}...`;
      await db.execute(
        `INSERT INTO documents (id, company_id, title, document_type, content)
         VALUES (?, ?, ?, 'syllabus', ?)`,
        [docId, companyId, title, chunk]
      );
    }

    const [countRows] = await db.execute('SELECT COUNT(*) AS total FROM documents');
    const totalChunks = Number(countRows[0]?.total || 0);

    res.status(201).json({
      success: true,
      message: `AI Ingestion complete. Added ${chunks.length} practice knowledge chunk(s) to RAG Store.`,
      chunksAdded: chunks.length,
      totalChunks
    });
  } catch (error) {
    next(error);
  }
};
