'use strict';

const pool = require('../../../config/db');

class VersionRepo {
  async create({ projectId, sourceCode, languageStandard = 'c17' }) {
    const [rows] = await pool.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM source_versions WHERE project_id = ?',
      [projectId]
    );
    const versionNumber = rows[0].next_version;

    const [result] = await pool.query(
      'INSERT INTO source_versions (project_id, version_number, source_code, language_standard) VALUES (?, ?, ?, ?)',
      [projectId, versionNumber, sourceCode, languageStandard]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM source_versions WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByProjectId(projectId) {
    const [rows] = await pool.query(
      'SELECT * FROM source_versions WHERE project_id = ? ORDER BY version_number DESC',
      [projectId]
    );
    return rows;
  }

  async getLatestByProjectId(projectId) {
    const [rows] = await pool.query(
      'SELECT * FROM source_versions WHERE project_id = ? ORDER BY version_number DESC LIMIT 1',
      [projectId]
    );
    return rows[0] || null;
  }
}

module.exports = new VersionRepo();
