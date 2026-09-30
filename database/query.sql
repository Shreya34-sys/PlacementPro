USE ppro;


CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    googleId VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. RECREATE ADMINS TABLE (Using adm_id)
CREATE TABLE admins (
    adm_id VARCHAR(36) PRIMARY KEY,
    designation VARCHAR(100),
    department VARCHAR(100),
    FOREIGN KEY (adm_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 3. RECREATE STUDENTS TABLE (Using std_id)
CREATE TABLE students (
    std_id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(150),
    department VARCHAR(100),
    division VARCHAR(10),
    batch_year INT,
    cgpa DECIMAL(3,2),
    phone_number VARCHAR(15),
    FOREIGN KEY (std_id) REFERENCES users(id) ON DELETE CASCADE
);


















CREATE TABLE resume_analyses (
    resumeid VARCHAR(36) PRIMARY KEY,
    std_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    ats_score INT NOT NULL,
    skills_match INT NOT NULL,
    keyword_match INT NOT NULL,
    formatting_status VARCHAR(50),
    analysis_json JSON NOT NULL,
    rewritten_resume TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (std_id) REFERENCES users(id) ON DELETE CASCADE
);



-- PlacementPro AI-proctored aptitude module. All primary keys are UUID strings.
CREATE TABLE exams (
  id CHAR(36) PRIMARY KEY,
  created_by CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  instructions TEXT NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  negative_marking DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_warnings TINYINT UNSIGNED NOT NULL DEFAULT 3,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_exam_admin FOREIGN KEY (created_by) REFERENCES users(id),
  CHECK (ends_at > starts_at)
);

CREATE TABLE exam_topics (
  id CHAR(36) PRIMARY KEY,
  exam_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT fk_topic_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  UNIQUE KEY uq_exam_topic_order (exam_id, display_order)
);

CREATE TABLE exam_questions (
  id CHAR(36) PRIMARY KEY,
  exam_id CHAR(36) NOT NULL,
  topic_id CHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  marks DECIMAL(5,2) NOT NULL DEFAULT 1,
  display_order SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT fk_question_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_topic FOREIGN KEY (topic_id) REFERENCES exam_topics(id),
  UNIQUE KEY uq_exam_question_order (exam_id, display_order)
);

CREATE TABLE question_options (
  id CHAR(36) PRIMARY KEY,
  question_id CHAR(36) NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  display_order TINYINT UNSIGNED NOT NULL,
  CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_question_option_order (question_id, display_order)
);

CREATE TABLE exam_attempts (
  id CHAR(36) PRIMARY KEY,
  exam_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  state ENUM('started','submitted','auto_submitted') NOT NULL DEFAULT 'started',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  warnings_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  score DECIMAL(7,2) NULL,
  UNIQUE KEY uq_exam_student_attempt (exam_id, student_id),
  CONSTRAINT fk_attempt_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
  CONSTRAINT fk_attempt_student FOREIGN KEY (student_id) REFERENCES students(std_id)
);

CREATE TABLE attempt_answers (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  option_id CHAR(36) NULL,
  marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attempt_question (attempt_id, question_id),
  CONSTRAINT fk_answer_attempt FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES exam_questions(id),
  CONSTRAINT fk_answer_option FOREIGN KEY (option_id) REFERENCES question_options(id)
);

CREATE TABLE proctoring_flags (
  id CHAR(36) PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  severity ENUM('high','medium','low') NOT NULL,
  event_type ENUM('tab_switch','camera_off','multiple_faces','no_face','mobile_detected','clipboard','focus_lost','manual') NOT NULL,
  message VARCHAR(500) NOT NULL,
  evidence_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  resolved_by CHAR(36) NULL,
  CONSTRAINT fk_flag_attempt FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_flag_admin FOREIGN KEY (resolved_by) REFERENCES users(id),
  KEY ix_flags_severity_time (severity, created_at)
);




ALTER TABLE exams ADD COLUMN deleted_at DATETIME NULL AFTER updated_at;
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX ix_exams_visibility ON exams (status, deleted_at, starts_at, ends_at);