'use strict';

const pool = require('../../../config/db');

class ResultRepo {
  async create({
    compilationJobId,
    stdout = '',
    stderr = '',
    exitCode = 0,
    executionDurationMs = 0,
    terminationReason = 'normal',
  }) {
    const [result] = await pool.query(
      `INSERT INTO execution_results 
      (compilation_job_id, stdout, stderr, exit_code, execution_duration_ms, termination_reason)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [compilationJobId, stdout, stderr, exitCode, executionDurationMs, terminationReason]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM execution_results WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByJobId(jobId) {
    const [rows] = await pool.query(
      'SELECT * FROM execution_results WHERE compilation_job_id = ? ORDER BY id DESC',
      [jobId]
    );
    return rows;
  }
}

module.exports = new ResultRepo();
