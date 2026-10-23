const db = require('../config/placementSimulationDb');
const coreDb = require('../config/db');
const { randomUUID } = require('crypto');
const { ALLOWED_MODULES, normalizeModuleType, getLaunchUrl, getRounds, ensureRoundAttempts } = require('../services/placementSimulationService');

const studentIdOf = req => String(req.user?.id ?? req.user?.userId ?? req.user?.sub ?? '');
const adminIdOf = req => String(req.user?.id ?? req.user?.userId ?? req.user?.email ?? 'admin');
const httpError = (message, status = 400) => Object.assign(new Error(message), { status });
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.adminListAssessments = asyncHandler(async (req, res) => {
  const type = String(req.params.moduleType || '').toLowerCase();
  let rows = [];
  if (type === 'aptitude') {
    [rows] = await coreDb.execute("SELECT id, title, status FROM exams WHERE deleted_at IS NULL AND status='published' AND NOW() BETWEEN starts_at AND ends_at ORDER BY created_at DESC LIMIT 300");
  } else if (type === 'coding') {
    [rows] = await coreDb.execute("SELECT id, title, status FROM coding_rounds WHERE deleted_at IS NULL AND status='published' AND NOW() BETWEEN starts_at AND ends_at ORDER BY created_at DESC LIMIT 300");
  } else if (type === 'versant') {
    [rows] = await coreDb.execute("SELECT id, title, status FROM versant_tests WHERE status='published' ORDER BY created_at DESC LIMIT 300");
  } else if (type !== 'resume') {
    throw httpError('This module does not have an existing assessment picker yet.', 400);
  }
  res.json(rows);
});

exports.adminListCompanies = asyncHandler(async (_req, res) => {
  const [rows] = await db.execute(`SELECT c.*, COUNT(r.id) AS round_count
    FROM companies c LEFT JOIN company_rounds r ON r.company_id=c.id AND r.round_scope IN ('company','both')
    WHERE c.status <> 'archived'
    GROUP BY c.id ORDER BY c.updated_at DESC`);
  res.json(rows);
});

exports.adminSimulationHistory = asyncHandler(async (_req, res) => {
  const [rows] = await db.execute(`SELECT s.id AS simulation_id, s.student_id, s.company_id, c.name AS company_name,
      s.status, s.started_at, s.completed_at,
      GROUP_CONCAT(CONCAT(r.round_order, '. ', r.title, ': ', a.status,
        IF(a.score IS NULL, '', CONCAT(' (', FORMAT(a.score, 2), '%)')))
        ORDER BY r.round_order SEPARATOR ' • ') AS round_summary
    FROM simulations s JOIN companies c ON c.id=s.company_id
    LEFT JOIN simulation_round_attempts a ON a.simulation_id=s.id
    LEFT JOIN company_rounds r ON r.id=a.round_id
    GROUP BY s.id, s.student_id, s.company_id, c.name, s.status, s.started_at, s.completed_at
    ORDER BY s.started_at DESC LIMIT 1000`);

  // Simulation records live in the simulation database, while student profiles
  // live in the main PlacementPro database. Resolve names without changing IDs
  // or the persistent history records.
  if (rows.length) {
    const studentIds = [...new Set(rows.map(row => String(row.student_id)).filter(Boolean))];
    if (studentIds.length) {
      const placeholders = studentIds.map(() => '?').join(',');
      const [students] = await coreDb.execute(
        `SELECT id, fullName FROM users WHERE id IN (${placeholders})`, studentIds
      );
      const namesById = new Map(students.map(student => [String(student.id), student.fullName]));
      for (const row of rows) {
        row.student_name = namesById.get(String(row.student_id)) || 'Name unavailable';
      }
    }
  }
  res.json(rows);
});

exports.adminCreateCompany = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 2 || name.length > 160) throw httpError('Company name must be between 2 and 160 characters.');
  const id = randomUUID();
  try {
    await db.execute('INSERT INTO companies (id,name,description,created_by) VALUES (?,?,?,?)', [id, name, String(req.body.description || '').trim() || null, adminIdOf(req)]);
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw httpError('A company with this name already exists.', 409); throw e; }
  const [rows] = await db.execute('SELECT * FROM companies WHERE id=?', [id]);
  res.status(201).json(rows[0]);
});

exports.adminUpdateCompany = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim() || null;
  if (name.length < 2 || name.length > 160) throw httpError('Company name must be between 2 and 160 characters.');
  try {
    const [result] = await db.execute('UPDATE companies SET name=?, description=? WHERE id=?', [name, description, req.params.companyId]);
    if (!result.affectedRows) throw httpError('Company not found.', 404);
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw httpError('A company with this name already exists.', 409); throw e; }
  const [rows] = await db.execute('SELECT * FROM companies WHERE id=?', [req.params.companyId]);
  res.json(rows[0]);
});

exports.adminDeleteCompany = asyncHandler(async (req, res) => {
  const companyId = req.params.companyId;
  const [companies] = await db.execute('SELECT id,status FROM companies WHERE id=?', [companyId]);
  if (!companies.length) throw httpError('Company simulation not found.', 404);
  const [history] = await db.execute('SELECT id FROM simulations WHERE company_id=? LIMIT 1', [companyId]);
  if (history.length) {
    // Preserve student attempt history and any active in-progress work. Hide this configuration
    // from new students and the active admin list rather than cascading away historical records.
    await db.execute("UPDATE companies SET status='archived' WHERE id=?", [companyId]);
    return res.json({ success: true, archived: true, message: 'Simulation removed from active listings. Student history was preserved.' });
  }
  await db.execute('DELETE FROM companies WHERE id=?', [companyId]); // company rounds cascade via FK
  res.json({ success: true, archived: false, message: 'Company simulation deleted.' });
});

exports.adminGetCompany = asyncHandler(async (req, res) => {
  const [companies] = await db.execute('SELECT * FROM companies WHERE id=?', [req.params.companyId]);
  if (!companies.length) throw httpError('Company not found.', 404);
  res.json({ company: companies[0], rounds: await getRounds(req.params.companyId) });
});

exports.adminSaveRound = asyncHandler(async (req, res) => {
  const companyId = req.params.companyId;
  const title = String(req.body.title || '').trim();
  const moduleType = normalizeModuleType(req.body.module_type);
  const roundScope = String(req.body.round_scope || 'company').toLowerCase();
  if (!['company','individual','both'].includes(roundScope)) throw httpError('Choose a valid round availability.');
  const roundOrder = Number(req.body.round_order);
  const passingPercent = Number(req.body.passing_percent);
  const maxAttempts = Number(req.body.max_attempts || 1);
  const assessmentId = String(req.body.assessment_id || '').trim() || null;
  if (!title || title.length > 160) throw httpError('Round title is required (maximum 160 characters).');
  if (!Number.isInteger(roundOrder) || roundOrder < 1 || roundOrder > 100) throw httpError('Round order must be a positive integer.');
  if (!Number.isFinite(passingPercent) || passingPercent < 0 || passingPercent > 100) throw httpError('Passing score must be between 0 and 100.');
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) throw httpError('Maximum attempts must be between 1 and 10.');
  const [company] = await db.execute('SELECT id,status FROM companies WHERE id=?', [companyId]);
  if (!company.length) throw httpError('Company not found.', 404);
  if (company[0].status === 'published') throw httpError('Unpublish the company before editing its rounds.', 409);
  const id = randomUUID();
  try {
    await db.execute(`INSERT INTO company_rounds
      (id,company_id,round_order,title,module_type,round_scope,assessment_id,passing_percent,is_mandatory,max_attempts,instructions)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [id, companyId, roundOrder, title, moduleType, roundScope, assessmentId, passingPercent, req.body.is_mandatory === false ? 0 : 1, maxAttempts, String(req.body.instructions || '').trim() || null]);
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw httpError('That round number is already used. Choose another order.', 409); throw e; }
  const [rows] = await db.execute('SELECT * FROM company_rounds WHERE id=?', [id]);
  res.status(201).json(rows[0]);
});

exports.adminUpdateRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  const title = String(req.body.title || '').trim();
  const moduleType = normalizeModuleType(req.body.module_type);
  const roundScope = String(req.body.round_scope || 'company').toLowerCase();
  if (!['company','individual','both'].includes(roundScope)) throw httpError('Choose a valid round availability.');
  const roundOrder = Number(req.body.round_order);
  const passingPercent = Number(req.body.passing_percent);
  const maxAttempts = Number(req.body.max_attempts || 1);
  if (!title || !Number.isInteger(roundOrder) || roundOrder < 1 || !Number.isFinite(passingPercent) || passingPercent < 0 || passingPercent > 100 || !Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) throw httpError('Invalid round settings.');
  const [found] = await db.execute('SELECT company_id FROM company_rounds WHERE id=?', [roundId]);
  if (!found.length) throw httpError('Round not found.', 404);
  const [company] = await db.execute('SELECT status FROM companies WHERE id=?', [found[0].company_id]);
  if (company[0]?.status === 'published') throw httpError('Unpublish the company before editing its rounds.', 409);
  try {
    await db.execute(`UPDATE company_rounds SET round_order=?,title=?,module_type=?,round_scope=?,assessment_id=?,passing_percent=?,is_mandatory=?,max_attempts=?,instructions=? WHERE id=?`,
      [roundOrder, title, moduleType, roundScope, String(req.body.assessment_id || '').trim() || null, passingPercent, req.body.is_mandatory === false ? 0 : 1, maxAttempts, String(req.body.instructions || '').trim() || null, roundId]);
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw httpError('That round number is already used.', 409); throw e; }
  const [rows] = await db.execute('SELECT * FROM company_rounds WHERE id=?', [roundId]);
  res.json(rows[0]);
});

exports.adminDeleteRound = asyncHandler(async (req, res) => {
  const [found] = await db.execute('SELECT company_id FROM company_rounds WHERE id=?', [req.params.roundId]);
  if (!found.length) throw httpError('Round not found.', 404);
  const [company] = await db.execute('SELECT status FROM companies WHERE id=?', [found[0].company_id]);
  if (company[0]?.status === 'published') throw httpError('Unpublish the company before editing its rounds.', 409);
  await db.execute('DELETE FROM company_rounds WHERE id=?', [req.params.roundId]);
  res.json({ success: true });
});

exports.adminPublishCompany = asyncHandler(async (req, res) => {
  const companyId = req.params.companyId;
  const [companies] = await db.execute('SELECT * FROM companies WHERE id=?', [companyId]);
  if (!companies.length) throw httpError('Company not found.', 404);
  const allRounds = await getRounds(companyId);
  const rounds = allRounds.filter(r => ['company','both'].includes(String(r.round_scope || 'company')));
  if (!rounds.length) throw httpError('Add at least one round marked Company-Wise or Both before publishing.');
  for (const r of rounds) {
    if (['aptitude','coding','versant'].includes(r.module_type) && !r.assessment_id) throw httpError(`Round ${r.round_order} needs an existing assessment ID.`);
    if (['aptitude','coding','versant'].includes(r.module_type) && Number(r.max_attempts) !== 1) throw httpError(`Round ${r.round_order}: the existing ${r.module_type} module currently supports one attempt per assessment. Set maximum attempts to 1.`);
    if (r.module_type === 'aptitude') { const [a] = await coreDb.execute("SELECT id FROM exams WHERE id=? AND deleted_at IS NULL AND status='published' AND NOW() BETWEEN starts_at AND ends_at", [r.assessment_id]); if (!a.length) throw httpError(`Round ${r.round_order}: choose a currently active, published aptitude exam.`); }
    if (r.module_type === 'coding') { const [a] = await coreDb.execute("SELECT id FROM coding_rounds WHERE id=? AND deleted_at IS NULL AND status='published' AND NOW() BETWEEN starts_at AND ends_at", [r.assessment_id]); if (!a.length) throw httpError(`Round ${r.round_order}: choose a currently active, published coding round.`); }
    if (r.module_type === 'versant') { const [a] = await coreDb.execute("SELECT id FROM versant_tests WHERE id=? AND status='published'", [r.assessment_id]); if (!a.length) throw httpError(`Round ${r.round_order}: choose a published Versant test.`); }
    if (!['aptitude','coding','resume','versant'].includes(r.module_type)) throw httpError(`Round ${r.round_order} uses '${r.module_type}', which is a future-module placeholder and cannot be published until that module is implemented.`);
  }
  const status = req.body.publish === false ? 'draft' : 'published';
  if (status === 'draft' && companies[0].status === 'published') {
    const [activeSims] = await db.execute("SELECT id FROM simulations WHERE company_id=? AND status='in_progress' LIMIT 1", [companyId]);
    if (activeSims.length) throw httpError('This company has active student simulations. Wait for them to finish before unpublishing or changing its rounds.', 409);
  }
  await db.execute('UPDATE companies SET status=?, config_version=config_version+1 WHERE id=?', [status, companyId]);
  res.json({ success: true, status, config_version: companies[0].config_version + 1 });
});

exports.aiSuggestRounds = asyncHandler(async (req, res) => {
  const companyName = String(req.body.companyName || '').trim();
  const role = String(req.body.role || '').trim();
  if (companyName.length < 2) throw httpError('Enter a company name.');
  const fallback = [
    { title: 'Aptitude Assessment', module_type: 'aptitude', passing_percent: 60, max_attempts: 1 },
    { title: 'Coding Assessment', module_type: 'coding', passing_percent: 50, max_attempts: 1 },
    { title: 'English Communication', module_type: 'versant', passing_percent: 60, max_attempts: 1 }
  ];
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.json({ source: 'template', note: 'AI key is not configured. Review this generic draft; it is not verified company-specific information.', rounds: fallback });
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: process.env.PLACEMENT_AI_MODEL || 'openai/gpt-oss-20b',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are an assistant that drafts placement simulation configurations for human review. Never claim a company hiring process is verified. Return only valid JSON: {"rounds":[{"title":"...","module_type":"aptitude|coding|resume|versant|interview|gd|essay|pseudocode|puzzle|custom","passing_percent":60,"max_attempts":1,"reason":"..."}]}. Use 2-5 plausible rounds. Prefer available module types aptitude,coding,resume,versant. Interview/GD/essay may be suggested as future modules but must be clearly noted as requiring implementation. Scores are suggestions only.' },
        { role: 'user', content: `Draft a possible placement simulation for company ${companyName}, role ${role || 'entry-level campus placement'}. Do not claim it is official or verified. Available modules: aptitude, coding, resume, versant. Optional future modules: interview, gd, essay, pseudocode, puzzle.` }
      ]
    });
    const raw = completion.choices?.[0]?.message?.content || '';
    const jsonText = raw.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) throw new Error('AI returned no JSON');
    const parsed = JSON.parse(jsonText);
    const rounds = (Array.isArray(parsed.rounds) ? parsed.rounds : []).slice(0, 8).map(r => ({
      title: String(r.title || 'Suggested Round').slice(0, 160),
      module_type: ALLOWED_MODULES.has(String(r.module_type || '').toLowerCase()) ? String(r.module_type).toLowerCase() : 'custom',
      passing_percent: Math.max(0, Math.min(100, Number(r.passing_percent) || 60)),
      max_attempts: Math.max(1, Math.min(10, Number.parseInt(r.max_attempts, 10) || 1)),
      reason: String(r.reason || '').slice(0, 500)
    }));
    if (!rounds.length) throw new Error('AI returned an empty round list');
    // Agent step 2: map suggestions only to currently available assessments whose title
    // explicitly includes this company name and which are not already assigned to a simulation.
    const companyNeedle = companyName.toLowerCase();
    for (const round of rounds) {
      round.assessment_id = null;
      round.assessment_title = null;
      if (!['aptitude','coding','versant'].includes(round.module_type)) {
        round.mapping_note = round.module_type === 'resume' ? 'Uses the existing Resume ATS upload flow.' : 'Future module: assessment mapping is not available yet.';
        continue;
      }
      let candidates = [];
      if (round.module_type === 'aptitude') {
        [candidates] = await coreDb.execute("SELECT id,title FROM exams WHERE deleted_at IS NULL AND status='published' AND NOW() BETWEEN starts_at AND ends_at ORDER BY created_at DESC LIMIT 300");
      } else if (round.module_type === 'coding') {
        [candidates] = await coreDb.execute("SELECT id,title FROM coding_rounds WHERE deleted_at IS NULL AND status='published' AND NOW() BETWEEN starts_at AND ends_at ORDER BY created_at DESC LIMIT 300");
      } else {
        [candidates] = await coreDb.execute("SELECT id,title FROM versant_tests WHERE status='published' ORDER BY created_at DESC LIMIT 300");
      }
      const [usedRows] = await db.execute('SELECT assessment_id FROM company_rounds WHERE module_type=? AND assessment_id IS NOT NULL', [round.module_type]);
      const used = new Set(usedRows.map(row => String(row.assessment_id)));
      const match = candidates.find(item => String(item.title || '').toLowerCase().includes(companyNeedle) && !used.has(String(item.id)));
      if (match) {
        round.assessment_id = String(match.id);
        round.assessment_title = String(match.title);
        round.mapping_note = 'Mapped to an unused, active assessment whose title includes the company name. Review before using.';
      } else {
        round.mapping_note = `No unused active assessment titled with “${companyName}” was found. Create a dedicated assessment for this company, then select it.`;
      }
    }
    res.json({ source: 'ai-agent-draft', note: 'AI drafted the rounds and checked for safe company-specific assessment matches. Review all details; this is not verified company policy and nothing is published automatically.', rounds });
  } catch (e) {
    res.json({ source: 'template-fallback', note: 'AI request failed; a generic draft is shown. Verify all rounds before publishing.', rounds: fallback });
  }
});

exports.studentListCompanies = asyncHandler(async (req, res) => {
  const studentId = studentIdOf(req);
  const [rows] = await db.execute(`SELECT c.id,c.name,c.description,c.config_version,COUNT(r.id) AS round_count,
      (SELECT s.id FROM simulations s WHERE s.company_id=c.id AND s.student_id=?
       ORDER BY CASE s.status WHEN 'passed' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'failed' THEN 2 ELSE 3 END, s.started_at DESC LIMIT 1) AS latest_simulation_id,
      (SELECT s.status FROM simulations s WHERE s.company_id=c.id AND s.student_id=?
       ORDER BY CASE s.status WHEN 'passed' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'failed' THEN 2 ELSE 3 END, s.started_at DESC LIMIT 1) AS latest_simulation_status
    FROM companies c JOIN company_rounds r ON r.company_id=c.id AND r.round_scope IN ('company','both')
    WHERE c.status='published' GROUP BY c.id ORDER BY c.name`, [studentId, studentId]);
  res.json(rows);
});

// Student history is read from persistent simulation/round-attempt rows; refreshing never resets it.
exports.studentHistory = asyncHandler(async (req, res) => {
  const studentId = studentIdOf(req);
  const [rows] = await db.execute(`SELECT s.id AS simulation_id, s.student_id, s.company_id, c.name AS company_name,
      s.status, s.started_at, s.completed_at,
      GROUP_CONCAT(CONCAT(r.round_order, '. ', r.title, ': ', a.status,
        IF(a.score IS NULL, '', CONCAT(' (', FORMAT(a.score, 2), '%)')))
        ORDER BY r.round_order SEPARATOR ' • ') AS round_summary
    FROM simulations s JOIN companies c ON c.id=s.company_id
    LEFT JOIN simulation_round_attempts a ON a.simulation_id=s.id
    LEFT JOIN company_rounds r ON r.id=a.round_id
    WHERE s.student_id=?
    GROUP BY s.id, s.student_id, s.company_id, c.name, s.status, s.started_at, s.completed_at
    ORDER BY s.started_at DESC`, [studentId]);
  res.json(rows);
});

exports.studentStartSimulation = asyncHandler(async (req, res) => {
  const studentId = studentIdOf(req);
  if (!studentId) throw httpError('Student identity is missing from the login token.', 401);
  const companyId = req.params.companyId;
  const [companies] = await db.execute("SELECT * FROM companies WHERE id=? AND status='published'", [companyId]);
  if (!companies.length) throw httpError('Company simulation is not available.', 404);

  // One company simulation attempt per student. Prefer an existing successful result when
  // older data contains duplicate rows; never silently create a new attempt after a result.
  const [existing] = await db.execute(`SELECT * FROM simulations WHERE student_id=? AND company_id=?
    ORDER BY CASE status WHEN 'passed' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'failed' THEN 2 ELSE 3 END, started_at DESC`, [studentId, companyId]);
  if (existing.length) {
    const successful = existing.find(s => s.status === 'passed');
    if (successful) throw httpError(`You have already attempted this ${companies[0].name} simulation and completed it. Another attempt is not allowed. Open your saved results instead.`, 409);
    const active = existing.find(s => s.status === 'in_progress');
    if (active) return res.json({ simulationId: active.id, resumed: true, message: 'Resuming your saved simulation progress.' });
    throw httpError(`You have already attempted this ${companies[0].name} simulation. Another attempt is not allowed. Open your saved results to review your history.`, 409);
  }

  const rounds = await getRounds(companyId, db, true);
  if (!rounds.length) throw httpError('This company has no rounds marked Company-Wise or Both.', 409);
  const simulationId = randomUUID();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Lock the company row so simultaneous start requests for the same student/company serialize.
    await connection.execute('SELECT id FROM companies WHERE id=? FOR UPDATE', [companyId]);
    const [race] = await connection.execute('SELECT id,status FROM simulations WHERE student_id=? AND company_id=? FOR UPDATE', [studentId, companyId]);
    if (race.length) {
      await connection.rollback();
      const existingRow = race.find(s => s.status === 'passed') || race.find(s => s.status === 'in_progress') || race[0];
      if (existingRow.status === 'in_progress') return res.json({ simulationId: existingRow.id, resumed: true });
      throw httpError('You have already attempted this company simulation. Another attempt is not allowed.', 409);
    }
    await connection.execute('INSERT INTO simulations (id,student_id,company_id,company_version,current_round_order) VALUES (?,?,?,?,1)', [simulationId, studentId, companyId, companies[0].config_version]);
    await ensureRoundAttempts(connection, simulationId, studentId, rounds);
    await connection.commit();
  } catch (e) {
    try { await connection.rollback(); } catch (_) {}
    if (e.status) throw e;
    throw e;
  } finally { connection.release(); }
  res.status(201).json({ simulationId, resumed: false });
});

exports.studentSimulationState = asyncHandler(async (req, res) => {
  const studentId = studentIdOf(req);
  const [simRows] = await db.execute(`SELECT s.*,c.name AS company_name,c.description AS company_description
    FROM simulations s JOIN companies c ON c.id=s.company_id WHERE s.id=? AND s.student_id=?`, [req.params.simulationId, studentId]);
  if (!simRows.length) throw httpError('Simulation not found.', 404);
  const simulation = simRows[0];
  const [passedSiblings] = await db.execute("SELECT id FROM simulations WHERE student_id=? AND company_id=? AND status='passed' LIMIT 1", [studentId, simulation.company_id]);
  const viewOnly = passedSiblings.length > 0 && simulation.status !== 'passed';
  const rounds = await getRounds(simulation.company_id, db, true);
  const [attempts] = await db.execute(`SELECT a.* FROM simulation_round_attempts a
    JOIN (SELECT round_id,MAX(attempt_number) AS latest_attempt FROM simulation_round_attempts WHERE simulation_id=? GROUP BY round_id) latest
    ON latest.round_id=a.round_id AND latest.latest_attempt=a.attempt_number WHERE a.simulation_id=?`, [simulation.id, simulation.id]);
  const byRound = new Map(attempts.map(a => [a.round_id, a]));
  res.json({ simulation, viewOnly, rounds: rounds.map(round => ({ ...round, attempt: byRound.get(round.id) || null, launchUrl: getLaunchUrl(round, simulation.id, byRound.get(round.id)?.id || '') })) });
});

exports.studentStartRound = asyncHandler(async (req, res) => {
  const studentId = studentIdOf(req);
  const { simulationId, roundId } = req.params;
  const [sims] = await db.execute('SELECT * FROM simulations WHERE id=? AND student_id=?', [simulationId, studentId]);
  if (!sims.length) throw httpError('Simulation not found.', 404);
  const sim = sims[0];
  if (sim.status === 'passed') throw httpError('You have already given and passed this company simulation. You cannot open the exam again; view your saved congratulations page and results.', 409);
  if (sim.status !== 'in_progress') throw httpError('You have already attempted this company simulation. You cannot open the exam again; view your saved results.', 409);
  const [passedSibling] = await db.execute("SELECT id FROM simulations WHERE student_id=? AND company_id=? AND status='passed' AND id<>? LIMIT 1", [studentId, sim.company_id, simulationId]);
  if (passedSibling.length) throw httpError('You have already completed this company simulation. Another attempt is not allowed; view your saved results instead.', 409);
  const rounds = await getRounds(sim.company_id, db, true);
  const index = rounds.findIndex(r => r.id === roundId);
  if (index < 0) throw httpError('Round not found in this company.', 404);
  const [latestRows] = await db.execute('SELECT * FROM simulation_round_attempts WHERE simulation_id=? AND round_id=? ORDER BY attempt_number DESC LIMIT 1', [simulationId, roundId]);
  if (!latestRows.length) throw httpError('Round progress record is missing.', 409);
  let attempt = latestRows[0];
  if (attempt.status === 'locked') throw httpError('This round is locked. Pass the previous mandatory round first.', 403);
  if (['passed','started'].includes(attempt.status)) {
    if (attempt.status === 'passed') throw httpError('You have already given and passed this round. You cannot open the exam again.', 409);
  } else if (attempt.status === 'failed') {
    const [countRows] = await db.execute('SELECT COUNT(*) AS n FROM simulation_round_attempts WHERE simulation_id=? AND round_id=?', [simulationId, roundId]);
    const round = rounds[index];
    if (Number(countRows[0].n) >= Number(round.max_attempts)) throw httpError('Maximum attempts for this round have been used.', 409);
    const nextAttemptNo = Number(countRows[0].n) + 1;
    const newId = randomUUID();
    await db.execute(`INSERT INTO simulation_round_attempts (id,simulation_id,round_id,student_id,attempt_number,status,started_at)
      VALUES (?,?,?,?,?,'started',NOW())`, [newId, simulationId, roundId, studentId, nextAttemptNo]);
    attempt = { id: newId, status: 'started', attempt_number: nextAttemptNo };
  } else {
    await db.execute("UPDATE simulation_round_attempts SET status='started',started_at=NOW() WHERE id=?", [attempt.id]);
    attempt.status = 'started';
  }
  const round = rounds[index];
  res.json({ attemptId: attempt.id, attemptNumber: attempt.attempt_number, moduleType: round.module_type, assessmentId: round.assessment_id, launchUrl: getLaunchUrl(round, simulationId, attempt.id), integrationNote: 'Round launch is configured. Final pass/fail must be recorded by a trusted server-side adapter in the assessment module.' });
});
