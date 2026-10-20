const mysql = require('mysql2/promise');
require('dotenv').config();

function getSimSslConfig() {
  const useSsl = process.env.SIM_DB_SSL === 'true' || process.env.DB_SSL === 'true' || process.env.TIDB_ENABLE_SSL === 'true';
  if (useSsl) {
    const ssl = { rejectUnauthorized: (process.env.SIM_DB_SSL_REJECT_UNAUTHORIZED || process.env.DB_SSL_REJECT_UNAUTHORIZED) !== 'false' };
    const ca = process.env.SIM_DB_CA || process.env.DB_CA;
    if (ca) ssl.ca = ca;
    return ssl;
  }
  return undefined;
}

// Intentionally separate from the existing PlacementPro database.
const pool = mysql.createPool({
  host: process.env.SIM_DB_HOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.SIM_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.SIM_DB_USER || process.env.DB_USER || 'root',
  password: process.env.SIM_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
  database: process.env.SIM_DB_NAME || 'placementpro_simulation',
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: getSimSslConfig()
});

// Auto-check and initialize database schema if missing
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.SIM_DB_HOST || process.env.DB_HOST || 'localhost',
      port: Number(process.env.SIM_DB_PORT || process.env.DB_PORT || 3306),
      user: process.env.SIM_DB_USER || process.env.DB_USER || 'root',
      password: process.env.SIM_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
      ssl: getSimSslConfig(),
      multipleStatements: true
    });
    const dbName = process.env.SIM_DB_NAME || 'placementpro_simulation';
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${dbName}\``);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        description TEXT NULL,
        status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
        config_version INT NOT NULL DEFAULT 1,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_company_name (name)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS company_rounds (
        id CHAR(36) PRIMARY KEY,
        company_id CHAR(36) NOT NULL,
        round_order INT NOT NULL,
        title VARCHAR(160) NOT NULL,
        module_type ENUM('aptitude','coding','resume','versant','interview','gd','essay','pseudocode','puzzle','custom') NOT NULL,
        round_scope ENUM('company','individual','both') NOT NULL DEFAULT 'company',
        assessment_id VARCHAR(160) NULL,
        passing_percent DECIMAL(5,2) NOT NULL DEFAULT 60.00,
        is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
        max_attempts INT NOT NULL DEFAULT 1,
        instructions TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_round_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY uq_company_order (company_id, round_order),
        INDEX idx_round_company (company_id)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS simulations (
        id CHAR(36) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        company_id CHAR(36) NOT NULL,
        company_version INT NOT NULL,
        current_round_order INT NOT NULL DEFAULT 1,
        status ENUM('in_progress','passed','failed','abandoned') NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        CONSTRAINT fk_sim_company FOREIGN KEY (company_id) REFERENCES companies(id),
        INDEX idx_sim_student (student_id),
        INDEX idx_sim_company_student (company_id, student_id)
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS simulation_round_attempts (
        id CHAR(36) PRIMARY KEY,
        simulation_id CHAR(36) NOT NULL,
        round_id CHAR(36) NOT NULL,
        student_id VARCHAR(100) NOT NULL,
        attempt_number INT NOT NULL DEFAULT 1,
        status ENUM('locked','available','started','passed','failed','skipped') NOT NULL DEFAULT 'available',
        score DECIMAL(7,2) NULL,
        passed TINYINT(1) NULL,
        source_module_attempt_id VARCHAR(160) NULL,
        started_at TIMESTAMP NULL,
        submitted_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_attempt_sim FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
        CONSTRAINT fk_attempt_round FOREIGN KEY (round_id) REFERENCES company_rounds(id),
        UNIQUE KEY uq_sim_round_attempt (simulation_id, round_id, attempt_number),
        INDEX idx_round_attempt_sim (simulation_id),
        INDEX idx_round_attempt_student (student_id)
      ) ENGINE=InnoDB;
    `);
    await conn.end();
  } catch (err) {
    // Non-fatal if DB is already active or credentials have specific database scope
  }
})();

module.exports = pool;
