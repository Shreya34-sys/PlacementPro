'use strict';

const pool = require('../../../config/db');

class ArtifactRepo {
  async create({
    compilationJobId,
    phaseName,
    artifactType,
    artifactReferenceOrJson,
    status = 'success',
    producingTool = 'gcc',
  }) {
    const jsonStr = typeof artifactReferenceOrJson === 'object'
      ? JSON.stringify(artifactReferenceOrJson)
      : String(artifactReferenceOrJson || '');

    const [result] = await pool.query(
      `INSERT INTO compilation_artifacts 
      (compilation_job_id, phase_name, artifact_type, artifact_reference_or_json, status, producing_tool)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [compilationJobId, phaseName, artifactType, jsonStr, status, producingTool]
    );
    return result.insertId;
  }

  async findByJobId(jobId) {
    const [rows] = await pool.query(
      'SELECT id, compilation_job_id, phase_name, artifact_type, artifact_reference_or_json, status, producing_tool, created_at FROM compilation_artifacts WHERE compilation_job_id = ? ORDER BY id ASC',
      [jobId]
    );
    return rows.map((r) => {
      let parsed = r.artifact_reference_or_json;
      try {
        parsed = JSON.parse(r.artifact_reference_or_json);
      } catch (e) {}
      return {
        ...r,
        data: parsed,
      };
    });
  }

  async findByJobIdAndPhase(jobId, phaseName) {
    const [rows] = await pool.query(
      'SELECT * FROM compilation_artifacts WHERE compilation_job_id = ? AND phase_name = ?',
      [jobId, phaseName]
    );
    return rows.map((r) => {
      let parsed = r.artifact_reference_or_json;
      try {
        parsed = JSON.parse(r.artifact_reference_or_json);
      } catch (e) {}
      return {
        ...r,
        data: parsed,
      };
    });
  }
}

module.exports = new ArtifactRepo();
