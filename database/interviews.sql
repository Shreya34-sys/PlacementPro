USE ppro;

CREATE TABLE IF NOT EXISTS interview_sets (
  id CHAR(36) PRIMARY KEY,
  created_by CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  category ENUM('hr','technical','behavioral','company') NOT NULL DEFAULT 'hr',
  company_name VARCHAR(120) NULL,
  status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  default_preparation_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  default_answer_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 180,
  max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 1,
  deadline DATETIME NULL,
  first_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'notify',
  second_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'fullscreen',
  third_warning_action ENUM('notify','fullscreen','terminate') NOT NULL DEFAULT 'terminate',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_interview_set_admin FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX ix_interview_sets_status (status, deleted_at, deadline)
);

CREATE TABLE IF NOT EXISTS interview_questions (
  id CHAR(36) PRIMARY KEY,
  created_by CHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  reference_answer TEXT NULL,
  evaluation_criteria TEXT NULL,
  category ENUM('hr','technical','behavioral','company') NOT NULL DEFAULT 'hr',
  topic VARCHAR(120) NOT NULL DEFAULT 'General',
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  marks DECIMAL(6,2) NOT NULL DEFAULT 10,
  preparation_time_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  answer_time_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 180,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_interview_question_admin FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX ix_interview_questions_category (category, topic, difficulty)
);

CREATE TABLE IF NOT EXISTS interview_set_questions (
  set_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (set_id, question_id),
  UNIQUE KEY uq_interview_set_order (set_id, display_order),
  CONSTRAINT fk_isq_set FOREIGN KEY (set_id) REFERENCES interview_sets(id) ON DELETE CASCADE,
  CONSTRAINT fk_isq_question FOREIGN KEY (question_id) REFERENCES interview_questions(id)
);

CREATE TABLE IF NOT EXISTS interview_assignments (
  id CHAR(36) PRIMARY KEY,
  set_id CHAR(36) NOT NULL,
  assigned_by CHAR(36) NOT NULL,
  target_type ENUM('all','student','class') NOT NULL DEFAULT 'all',
  target_student_id CHAR(36) NULL,
  department VARCHAR(100) NULL,
  division VARCHAR(10) NULL,
  batch_year INT NULL,
  deadline DATETIME NULL,
  max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('draft','published','closed') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_interview_assignment_set FOREIGN KEY (set_id) REFERENCES interview_sets(id) ON DELETE CASCADE,
  CONSTRAINT fk_interview_assignment_admin FOREIGN KEY (assigned_by) REFERENCES users(id),
  CONSTRAINT fk_interview_assignment_student FOREIGN KEY (target_student_id) REFERENCES students(std_id),
  INDEX ix_interview_assignment_visibility (status, target_type, deadline)
);

CREATE TABLE IF NOT EXISTS interview_attempts (
  id CHAR(36) PRIMARY KEY,
  assignment_id CHAR(36) NOT NULL,
  set_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  state ENUM('started','submitted','reviewed','terminated') NOT NULL DEFAULT 'started',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consent_accepted_at DATETIME NULL,
  submitted_at DATETIME NULL,
  total_score DECIMAL(7,2) NULL,
  max_score DECIMAL(7,2) NULL,
  faculty_comments TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_interview_attempt_assignment FOREIGN KEY (assignment_id) REFERENCES interview_assignments(id),
  CONSTRAINT fk_interview_attempt_set FOREIGN KEY (set_id) REFERENCES interview_sets(id),
  CONSTRAINT fk_interview_attempt_student FOREIGN KEY (student_id) REFERENCES students(std_id),
  INDEX ix_interview_attempt_student (student_id, state, submitted_at)
);

CREATE TABLE IF NOT EXISTS interview_answers (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  answer_text MEDIUMTEXT NULL,
  transcript_source ENUM('speech','typed','mixed') NOT NULL DEFAULT 'typed',
  audio_data LONGBLOB NULL,
  audio_mime_type VARCHAR(100) NULL,
  score DECIMAL(6,2) NULL,
  faculty_comments TEXT NULL,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_interview_answer_question (attempt_id, question_id),
  CONSTRAINT fk_interview_answer_attempt FOREIGN KEY (attempt_id) REFERENCES interview_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_interview_answer_question FOREIGN KEY (question_id) REFERENCES interview_questions(id)
);

CREATE TABLE IF NOT EXISTS interview_results (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL UNIQUE,
  total_score DECIMAL(7,2) NULL,
  max_score DECIMAL(7,2) NULL,
  status ENUM('submitted','reviewed') NOT NULL DEFAULT 'submitted',
  ai_feedback JSON NULL,
  faculty_summary TEXT NULL,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_interview_result_attempt FOREIGN KEY (attempt_id) REFERENCES interview_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_interview_result_admin FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS interview_monitoring_events (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  event_type ENUM('camera_permission','microphone_permission','face_absent','multiple_faces','looking_away','visibility_hidden','window_blur','fullscreen_exit','manual') NOT NULL,
  severity ENUM('info','low','medium','high') NOT NULL DEFAULT 'info',
  message VARCHAR(500) NOT NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_interview_event_attempt FOREIGN KEY (attempt_id) REFERENCES interview_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_interview_event_student FOREIGN KEY (student_id) REFERENCES students(std_id),
  INDEX ix_interview_events_attempt (attempt_id, created_at)
);
