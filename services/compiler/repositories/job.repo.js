'use strict';

const pool = require('../../../config/db');

class JobRepo {
  async create({
    id,
    userId = null,
    projectId = null,
    sourceVersionId = null,
    compilerName = 'gcc',
    compilerVersion = 'Unavailable',
    targetArchitecture = 'Unavailable',
    optimizationLevel = '-O0',
    languageStandard = 'c17',
    status = 'queued',
  }) {
    await pool.query(
      `INSERT INTO compilation_jobs 
      (id, user_id, project_id, source_version_id, compiler_name, compiler_version, target_architecture, optimization_level, language_standard, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [
        id,
        userId,
        projectId,
        sourceVersionId,
        compilerName,
        compilerVersion,
        targetArchitecture,
        optimizationLevel,
        languageStandard,
        status,
      ]
    );
    return this.findById(id);
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM compilation_jobs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async updateStatus(id, { status, exitCode = null, durationMs = 0 }) {
    await pool.query(
      `UPDATE compilation_jobs 
       SET status = ?, exit_code = ?, duration_ms = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, exitCode, durationMs, id]
    );
    return this.findById(id);
  }

  async findByUserId(userId, limit = 20) {
    const [rows] = await pool.query(
      'SELECT * FROM compilation_jobs WHERE user_id = ? ORDER BY started_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }
}

module.exports = new JobRepo();
