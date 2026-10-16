-- PlacementPro: C-Visualize & Compiler Practice Schema
-- Non-destructive migration compatible with MySQL 8.0+

CREATE TABLE IF NOT EXISTS compiler_jobs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    source_code MEDIUMTEXT NOT NULL,
    compiler_name VARCHAR(50) NOT NULL DEFAULT 'gcc',
    compiler_version VARCHAR(50) NULL,
    target_architecture VARCHAR(50) NULL,
    optimization_level VARCHAR(10) DEFAULT '-O0',
    language_standard VARCHAR(20) DEFAULT 'c17',
    status ENUM('queued', 'compiling', 'compiled', 'failed', 'timeout') NOT NULL DEFAULT 'queued',
    exit_code BIGINT DEFAULT NULL,
    duration_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compiler_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_compiler_jobs_user (user_id),
    INDEX idx_compiler_jobs_status (status),
    INDEX idx_compiler_jobs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS compiler_artifacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(64) NOT NULL,
    phase_name VARCHAR(50) NOT NULL,
    artifact_type VARCHAR(50) NOT NULL,
    artifact_json LONGTEXT,
    status ENUM('success', 'failed', 'unavailable', 'blocked') NOT NULL DEFAULT 'success',
    producing_tool VARCHAR(100) DEFAULT 'gcc',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compiler_artifacts_job FOREIGN KEY (job_id) REFERENCES compiler_jobs(id) ON DELETE CASCADE,
    INDEX idx_compiler_artifacts_job (job_id),
    INDEX idx_compiler_artifacts_phase (phase_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS compiler_execution_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(64) NOT NULL,
    stdin TEXT NULL,
    stdout MEDIUMTEXT NULL,
    stderr MEDIUMTEXT NULL,
    exit_code BIGINT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    termination_reason VARCHAR(50) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compiler_exec_job FOREIGN KEY (job_id) REFERENCES compiler_jobs(id) ON DELETE CASCADE,
    INDEX idx_compiler_exec_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS compiler_exercise_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    exercise_id VARCHAR(100) NOT NULL,
    job_id VARCHAR(64) NULL,
    status ENUM('in_progress', 'compiled', 'passed', 'failed') NOT NULL DEFAULT 'in_progress',
    test_results_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_compiler_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_compiler_attempts_job FOREIGN KEY (job_id) REFERENCES compiler_jobs(id) ON DELETE SET NULL,
    INDEX idx_compiler_attempts_user (user_id, exercise_id),
    INDEX idx_compiler_attempts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- C-Visualize Projects & Versioning
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    project_name VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_projects_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS source_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    source_code MEDIUMTEXT NOT NULL,
    language_standard VARCHAR(20) DEFAULT 'c17',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_versions_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_versions_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS compilation_jobs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    project_id INT NULL,
    source_version_id INT NULL,
    compiler_name VARCHAR(50) NOT NULL DEFAULT 'gcc',
    compiler_version VARCHAR(50),
    target_architecture VARCHAR(50),
    optimization_level VARCHAR(10) DEFAULT '-O0',
    language_standard VARCHAR(20) DEFAULT 'c17',
    status ENUM('queued', 'compiling', 'compiled', 'failed', 'timeout') NOT NULL DEFAULT 'queued',
    exit_code BIGINT DEFAULT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_ms INT DEFAULT 0,
    CONSTRAINT fk_compilation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_compilation_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_compilation_version FOREIGN KEY (source_version_id) REFERENCES source_versions(id) ON DELETE SET NULL,
    INDEX idx_compilation_user (user_id),
    INDEX idx_compilation_project (project_id),
    INDEX idx_compilation_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS compilation_artifacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compilation_job_id VARCHAR(64) NOT NULL,
    phase_name VARCHAR(50) NOT NULL,
    artifact_type VARCHAR(50) NOT NULL,
    artifact_reference_or_json LONGTEXT,
    status ENUM('success', 'failed', 'unavailable', 'blocked') NOT NULL DEFAULT 'success',
    producing_tool VARCHAR(100) DEFAULT 'gcc',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_artifacts_job FOREIGN KEY (compilation_job_id) REFERENCES compilation_jobs(id) ON DELETE CASCADE,
    INDEX idx_artifacts_job (compilation_job_id),
    INDEX idx_artifacts_phase (phase_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS execution_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compilation_job_id VARCHAR(64) NOT NULL,
    stdout MEDIUMTEXT,
    stderr MEDIUMTEXT,
    exit_code BIGINT DEFAULT 0,
    execution_duration_ms INT DEFAULT 0,
    termination_reason VARCHAR(50) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_execution_job FOREIGN KEY (compilation_job_id) REFERENCES compilation_jobs(id) ON DELETE CASCADE,
    INDEX idx_execution_job (compilation_job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
