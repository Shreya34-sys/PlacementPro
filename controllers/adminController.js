const db = require('../config/db');
const { randomUUID } = require('crypto');

exports.getIntelligenceStats = async (req, res, next) => {
  try {
    // 1. Fetch real companies and student registration counts from MySQL
    const [companies] = await db.execute(`
      SELECT c.id, c.name, c.short_name, c.overview, c.eligibility_rules, c.rounds,
        COUNT(d.id) AS registered_count
      FROM companies c
      LEFT JOIN drives d ON d.company_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    // 2. Total registrations count
    const [regRows] = await db.execute('SELECT COUNT(*) AS total FROM drives');
    const totalRegistrations = Number(regRows[0]?.total || 0);

    // 3. RAG Knowledge Chunks count from documents table
    const [docRows] = await db.execute('SELECT COUNT(*) AS total FROM documents');
    const ragChunks = Number(docRows[0]?.total || 0);

    // 4. Calculate actual average readiness from real completed attempts
    const [examRows] = await db.execute('SELECT AVG(score) AS avgExamScore FROM exam_attempts WHERE state="submitted"');
    const [interviewRows] = await db.execute('SELECT AVG(total_score) AS avgInterviewScore FROM interview_attempts WHERE state IN ("submitted", "reviewed")');
    const [versantRows] = await db.execute('SELECT AVG(overall_score) AS avgVersantScore FROM versant_results');

    const scoresList = [];
    if (examRows[0]?.avgExamScore != null) scoresList.push(Number(examRows[0].avgExamScore));
    if (interviewRows[0]?.avgInterviewScore != null) scoresList.push(Number(interviewRows[0].avgInterviewScore));
    if (versantRows[0]?.avgVersantScore != null) scoresList.push(Number(versantRows[0].avgVersantScore));

    let avgReadiness = 0;
    if (scoresList.length > 0) {
      avgReadiness = Number((scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1));
    }

    // 5. Normalizing drives list for the dashboard
    const drivesList = companies.map(c => {
      let eligibility = c.eligibility_rules;
      if (typeof eligibility === 'string') {
        try { eligibility = JSON.parse(eligibility); } catch {}
      }
      let rounds = c.rounds;
      if (typeof rounds === 'string') {
        try { rounds = JSON.parse(rounds); } catch {}
      }

      const minCgpa = eligibility?.minCgpa || 6.5;
      const branches = Array.isArray(eligibility?.branches) && eligibility.branches.length
        ? eligibility.branches.join(', ')
        : 'CSBS, CSE, IT';

      return {
        id: c.id,
        name: c.name,
        shortName: c.short_name || c.name.slice(0, 3).toUpperCase(),
        overview: c.overview,
        minCgpa,
        branches,
        roundsCount: Array.isArray(rounds) ? rounds.length : 3,
        registeredCount: Number(c.registered_count || 0),
        status: 'ACTIVE'
      };
    });

    res.json({
      success: true,
      stats: {
        activeDrivesCount: companies.length,
        totalRegistrations,
        pendingAlerts: 0,
        ragChunks,
        avgReadiness,
        drives: drivesList
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

    // Find company if drive key provided
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
      const title = `${drive ? drive.toUpperCase() + ' ' : ''}Hiring Benchmark - ${chunk.slice(0, 45)}...`;
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
      message: `AI Ingestion complete. Added ${chunks.length} knowledge chunk(s) to RAG Store.`,
      chunksAdded: chunks.length,
      totalChunks
    });
  } catch (error) {
    next(error);
  }
};
