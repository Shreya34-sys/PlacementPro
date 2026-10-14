-- PlacementPro Coding / Technical Round module.
-- This schema is completely separate from the existing aptitude/Versant tables.

CREATE TABLE IF NOT EXISTS coding_rounds (
  id CHAR(36) PRIMARY KEY,
  created_by CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  instructions TEXT,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  max_warnings TINYINT UNSIGNED NOT NULL DEFAULT 3,
  face_detection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  audio_monitoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tab_lock_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  clipboard_guard_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  access_code VARCHAR(32) NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coding_round_admin FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT chk_coding_round_dates CHECK (ends_at > starts_at),
  UNIQUE KEY uq_coding_round_access_code (access_code),
  KEY ix_coding_round_visibility (status, deleted_at, starts_at, ends_at)
);

CREATE TABLE IF NOT EXISTS coding_questions (
  id CHAR(36) PRIMARY KEY,
  round_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  problem_statement LONGTEXT NOT NULL,
  constraints_text LONGTEXT,
  input_format LONGTEXT,
  output_format LONGTEXT,
  starter_code JSON NULL,
  allowed_languages JSON NOT NULL,
  points DECIMAL(7,2) NOT NULL DEFAULT 100,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coding_question_round FOREIGN KEY (round_id) REFERENCES coding_rounds(id) ON DELETE CASCADE,
  UNIQUE KEY uq_coding_question_order (round_id, display_order)
);

-- Test cases are intentionally stored as structured JSON beside each question.
-- Only public cases are sent to students. Hidden cases are never returned by
-- the student question endpoint.
CREATE TABLE IF NOT EXISTS coding_test_cases (
  id CHAR(36) PRIMARY KEY,
  question_id CHAR(36) NOT NULL,
  test_cases JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coding_cases_question FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coding_round_assignments (
  id CHAR(36) PRIMARY KEY,
  round_id CHAR(36) NOT NULL,
  student_id CHAR(36) NULL,
  invited_email VARCHAR(150) NULL,
  assignment_code VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_coding_assignment_round FOREIGN KEY (round_id) REFERENCES coding_rounds(id) ON DELETE CASCADE,
  CONSTRAINT fk_coding_assignment_student FOREIGN KEY (student_id) REFERENCES students(std_id) ON DELETE CASCADE,
  UNIQUE KEY uq_coding_assignment_code (assignment_code),
  KEY ix_coding_assignment_email (invited_email)
);

CREATE TABLE IF NOT EXISTS coding_attempts (
  id CHAR(36) PRIMARY KEY,
  round_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  state ENUM('started','submitted','auto_submitted','disqualified') NOT NULL DEFAULT 'started',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  warnings_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  integrity_index DECIMAL(5,2) NOT NULL DEFAULT 100,
  final_score DECIMAL(7,2) NULL,
  total_execution_ms BIGINT UNSIGNED NULL,
  total_memory_kb BIGINT UNSIGNED NULL,
  CONSTRAINT fk_coding_attempt_round FOREIGN KEY (round_id) REFERENCES coding_rounds(id) ON DELETE CASCADE,
  CONSTRAINT fk_coding_attempt_student FOREIGN KEY (student_id) REFERENCES students(std_id) ON DELETE CASCADE,
  UNIQUE KEY uq_coding_round_student (round_id, student_id)
);

CREATE TABLE IF NOT EXISTS coding_submissions (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  language VARCHAR(30) NOT NULL,
  source_code LONGTEXT NOT NULL,
  mode ENUM('run','submit') NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'queued',
  passed_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_count INT UNSIGNED NOT NULL DEFAULT 0,
  score DECIMAL(7,2) NOT NULL DEFAULT 0,
  execution_time_ms BIGINT UNSIGNED NULL,
  memory_kb BIGINT UNSIGNED NULL,
  result_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_coding_submission_attempt FOREIGN KEY (attempt_id) REFERENCES coding_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_coding_submission_question FOREIGN KEY (question_id) REFERENCES coding_questions(id),
  KEY ix_coding_submission_attempt (attempt_id, created_at)
);

CREATE TABLE IF NOT EXISTS coding_proctor_flags (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  severity ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  event_type ENUM(
    'tab_switch','focus_lost','fullscreen_exit','no_face','multiple_faces',
    'looking_away','audio_spike','background_voice','clipboard','paste_burst','manual'
  ) NOT NULL,
  message VARCHAR(500) NOT NULL,
  evidence_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  resolved_by CHAR(36) NULL,
  CONSTRAINT fk_coding_flag_attempt FOREIGN KEY (attempt_id) REFERENCES coding_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_coding_flag_admin FOREIGN KEY (resolved_by) REFERENCES users(id),
  KEY ix_coding_flag_attempt_time (attempt_id, created_at)
);

CREATE TABLE IF NOT EXISTS coding_code_snapshots (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  language VARCHAR(30) NOT NULL,
  source_code LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coding_snapshot_attempt FOREIGN KEY (attempt_id) REFERENCES coding_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_coding_snapshot_question FOREIGN KEY (question_id) REFERENCES coding_questions(id),
  UNIQUE KEY uq_coding_snapshot (attempt_id, question_id)
);
