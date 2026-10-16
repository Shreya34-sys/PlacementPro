'use strict';

const pool = require('../../../config/db');

class ProjectRepo {
  async create({ userId, projectName, description }) {
    const [result] = await pool.query(
      'INSERT INTO projects (user_id, project_name, description) VALUES (?, ?, ?)',
      [userId, projectName, description || null]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return rows;
  }

  async update(id, userId, { projectName, description }) {
    await pool.query(
      'UPDATE projects SET project_name = COALESCE(?, project_name), description = COALESCE(?, description) WHERE id = ? AND user_id = ?',
      [projectName, description, id, userId]
    );
    return this.findById(id);
  }

  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new ProjectRepo();
