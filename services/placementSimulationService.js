const db = require('../config/placementSimulationDb');
const { randomUUID } = require('crypto');

const ALLOWED_MODULES = new Set(['aptitude','coding','resume','versant','interview','gd','essay','pseudocode','puzzle','custom']);

function normalizeModuleType(value) {
  const type = String(value || '').trim().toLowerCase();
  if (!ALLOWED_MODULES.has(type)) throw Object.assign(new Error('Unsupported module type.'), { status: 400 });
  return type;
}

function getLaunchUrl(round, simulationId, simulationRoundAttemptId = "") {
  const id = encodeURIComponent(round.assessment_id || '');
  const context = `simulationId=${encodeURIComponent(simulationId)}&simulationRoundId=${encodeURIComponent(round.id)}&simulationRoundAttemptId=${encodeURIComponent(simulationRoundAttemptId || "")}`;
  switch (round.module_type) {
    case 'aptitude': return `/pages/exam-guidelines.html?exam=${id}&${context}`;
    case 'coding': return `/coding-round?round=${id}&${context}`;
    case 'versant': return `/pages/versant-test.html?test=${id}&${context}`;
    case 'resume': return `/pages/resume-analyzer.html?${context}`;
    case 'interview': return `/pages/company-placement-student.html?simulation=${encodeURIComponent(simulationId)}&round=${encodeURIComponent(round.id)}&futureModule=interview`;
    case 'gd': return `/pages/company-placement-student.html?simulation=${encodeURIComponent(simulationId)}&round=${encodeURIComponent(round.id)}&futureModule=gd`;
    default: return `/pages/company-placement-student.html?simulation=${encodeURIComponent(simulationId)}&round=${encodeURIComponent(round.id)}&futureModule=${encodeURIComponent(round.module_type)}`;
  }
}

async function getRounds(companyId, connection = db, simulationOnly = false) {
  const scopeClause = simulationOnly ? " AND round_scope IN ('company','both')" : '';
  const [rows] = await connection.execute(
    `SELECT id, company_id, round_order, title, module_type, assessment_id, round_scope,
            passing_percent, is_mandatory, max_attempts, instructions
       FROM company_rounds WHERE company_id=?${scopeClause} ORDER BY round_order ASC`, [companyId]);
  return rows;
}

async function ensureRoundAttempts(connection, simulationId, studentId, rounds) {
  for (const [index, round] of rounds.entries()) {
    const [existing] = await connection.execute('SELECT id FROM simulation_round_attempts WHERE simulation_id=? AND round_id=? LIMIT 1', [simulationId, round.id]);
    if (!existing.length) {
      await connection.execute(
        `INSERT INTO simulation_round_attempts (id, simulation_id, round_id, student_id, attempt_number, status)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [randomUUID(), simulationId, round.id, String(studentId), index === 0 ? 'available' : 'locked']);
    }
  }
}

// Call this ONLY from a trusted server-side module result handler after its own result is verified.
// Never expose a public endpoint that accepts arbitrary scores from the browser.
async function recordVerifiedRoundResult({ simulationId, roundId, studentId, score, sourceModuleAttemptId }) {
  if (!simulationId || !roundId || !studentId || !Number.isFinite(Number(score))) {
    throw Object.assign(new Error('Missing or invalid verified result fields.'), { status: 400 });
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [simRows] = await connection.execute(
      'SELECT * FROM simulations WHERE id=? AND student_id=? FOR UPDATE', [simulationId, String(studentId)]);
    if (!simRows.length) throw Object.assign(new Error('Simulation not found.'), { status: 404 });
    const simulation = simRows[0];
    if (simulation.status !== 'in_progress') throw Object.assign(new Error('Simulation is not active.'), { status: 409 });
    const [roundRows] = await connection.execute("SELECT * FROM company_rounds WHERE id=? AND company_id=? AND round_scope IN ('company','both')", [roundId, simulation.company_id]);
    if (!roundRows.length) throw Object.assign(new Error('Round does not belong to this simulation.'), { status: 400 });
    const round = roundRows[0];
    const [attemptRows] = await connection.execute(
      `SELECT * FROM simulation_round_attempts WHERE simulation_id=? AND round_id=? AND student_id=?
       ORDER BY attempt_number DESC LIMIT 1 FOR UPDATE`, [simulationId, roundId, String(studentId)]);
    if (!attemptRows.length || !['started','available'].includes(attemptRows[0].status)) {
      throw Object.assign(new Error('Round is not eligible for result recording.'), { status: 409 });
    }
    const passed = Number(score) >= Number(round.passing_percent);
    await connection.execute(
      `UPDATE simulation_round_attempts SET score=?, passed=?, status=?, source_module_attempt_id=?, submitted_at=NOW()
       WHERE id=?`, [Number(score), passed ? 1 : 0, passed ? 'passed' : 'failed', sourceModuleAttemptId || null, attemptRows[0].id]);
    const rounds = await getRounds(simulation.company_id, connection, true);
    const currentIndex = rounds.findIndex(item => item.id === roundId);
    const nextRound = rounds[currentIndex + 1];
    const [attemptCountRows] = await connection.execute('SELECT COUNT(*) AS attempt_count FROM simulation_round_attempts WHERE simulation_id=? AND round_id=?', [simulationId, roundId]);
    const attemptsUsed = Number(attemptCountRows[0].attempt_count);
    const canRetry = !passed && attemptsUsed < Number(round.max_attempts);
    if (canRetry) {
      await connection.execute(
        `INSERT INTO simulation_round_attempts (id,simulation_id,round_id,student_id,attempt_number,status) VALUES (?,?,?,?,?,'available')`,
        [randomUUID(), simulationId, roundId, String(studentId), attemptsUsed + 1]);
      await connection.execute('UPDATE simulations SET current_round_order=? WHERE id=?', [round.round_order, simulationId]);
    } else if (!passed && Number(round.is_mandatory)) {
      await connection.execute("UPDATE simulations SET status='failed', completed_at=NOW() WHERE id=?", [simulationId]);
    } else if (nextRound) {
      await connection.execute(
        `UPDATE simulation_round_attempts SET status='available'
         WHERE simulation_id=? AND round_id=? AND status='locked'`, [simulationId, nextRound.id]);
      await connection.execute('UPDATE simulations SET current_round_order=? WHERE id=?', [nextRound.round_order, simulationId]);
    } else {
      await connection.execute("UPDATE simulations SET status='passed', completed_at=NOW() WHERE id=?", [simulationId]);
    }
    await connection.commit();
    return { passed, score: Number(score), canRetry, nextRoundId: passed && nextRound ? nextRound.id : null, simulationStatus: canRetry ? 'in_progress' : !passed && round.is_mandatory ? 'failed' : nextRound ? 'in_progress' : 'passed' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function bindModuleAttempt({ simulationRoundAttemptId, studentId, sourceModuleAttemptId, moduleType }) {
  if (!simulationRoundAttemptId || !studentId || !sourceModuleAttemptId) throw Object.assign(new Error('Missing module-attempt binding fields.'), { status: 400 });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(`SELECT a.id,a.status,a.student_id,r.module_type,s.status AS simulation_status
      FROM simulation_round_attempts a JOIN simulations s ON s.id=a.simulation_id
      JOIN company_rounds r ON r.id=a.round_id
      WHERE a.id=? AND a.student_id=? FOR UPDATE`, [simulationRoundAttemptId, String(studentId)]);
    if (!rows.length) throw Object.assign(new Error('Simulation round attempt was not found for this student.'), { status: 404 });
    const row = rows[0];
    if (row.simulation_status !== 'in_progress' || !['started','available'].includes(row.status)) throw Object.assign(new Error('Simulation round is not active.'), { status: 409 });
    if (moduleType && row.module_type !== moduleType) throw Object.assign(new Error('Module type does not match the configured round.'), { status: 400 });
    const [alreadyBound] = await connection.execute('SELECT id FROM simulation_round_attempts WHERE source_module_attempt_id=? AND id<>? LIMIT 1', [String(sourceModuleAttemptId), simulationRoundAttemptId]);
    if (alreadyBound.length) throw Object.assign(new Error('This assessment attempt is already linked to another simulation. Create a company-specific assessment attempt.'), { status: 409 });
    await connection.execute('UPDATE simulation_round_attempts SET source_module_attempt_id=?,status=\'started\',started_at=COALESCE(started_at,NOW()) WHERE id=?', [String(sourceModuleAttemptId), simulationRoundAttemptId]);
    await connection.commit();
    return { success: true };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

async function recordVerifiedRoundResultForSource({ sourceModuleAttemptId, studentId, score }) {
  const [rows] = await db.execute(`SELECT a.simulation_id,a.round_id FROM simulation_round_attempts a
    JOIN simulations s ON s.id=a.simulation_id
    WHERE a.source_module_attempt_id=? AND a.student_id=? AND s.status='in_progress'
    ORDER BY a.created_at DESC LIMIT 1`, [String(sourceModuleAttemptId), String(studentId)]);
  if (!rows.length) return null; // Ordinary independent practice: no simulation association; leave unchanged.
  return recordVerifiedRoundResult({ simulationId: rows[0].simulation_id, roundId: rows[0].round_id, studentId, score, sourceModuleAttemptId: String(sourceModuleAttemptId) });
}


// Trusted helper for modules whose result is produced synchronously (for example ATS).
// The attempt ID is validated against the authenticated student and the configured round.
async function recordVerifiedRoundResultForSimulationAttempt({ simulationRoundAttemptId, studentId, score, sourceModuleAttemptId }) {
  if (!simulationRoundAttemptId || !studentId || !Number.isFinite(Number(score))) {
    throw Object.assign(new Error('Missing or invalid verified simulation result fields.'), { status: 400 });
  }
  const [rows] = await db.execute(
    `SELECT a.simulation_id, a.round_id, a.student_id, a.status, r.module_type, s.status AS simulation_status
       FROM simulation_round_attempts a
       JOIN simulations s ON s.id=a.simulation_id
       JOIN company_rounds r ON r.id=a.round_id
      WHERE a.id=? AND a.student_id=? LIMIT 1`,
    [String(simulationRoundAttemptId), String(studentId)]
  );
  if (!rows.length) throw Object.assign(new Error('Simulation round attempt does not belong to this student.'), { status: 404 });
  const row = rows[0];
  if (row.module_type !== 'resume') throw Object.assign(new Error('This simulation round is not a Resume ATS round.'), { status: 400 });
  if (row.simulation_status !== 'in_progress' || !['started','available'].includes(row.status)) {
    throw Object.assign(new Error('This simulation round is not active.'), { status: 409 });
  }
  return recordVerifiedRoundResult({
    simulationId: row.simulation_id,
    roundId: row.round_id,
    studentId: String(studentId),
    score: Number(score),
    sourceModuleAttemptId: sourceModuleAttemptId || `resume:${simulationRoundAttemptId}`
  });
}

module.exports = { ALLOWED_MODULES, normalizeModuleType, getLaunchUrl, getRounds, ensureRoundAttempts, bindModuleAttempt, recordVerifiedRoundResult, recordVerifiedRoundResultForSource, recordVerifiedRoundResultForSimulationAttempt };
