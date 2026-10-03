-- PlacementPro: isolated Versant-style communication module
-- Published tests are available to every authenticated student.
-- No access codes and no manual student assignment are required.

CREATE TABLE IF NOT EXISTS versant_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  duration_seconds INT NOT NULL DEFAULT 1800,
  pass_score DECIMAL(5,2) NOT NULL DEFAULT 60,
  cefr_pass_level VARCHAR(10) NOT NULL DEFAULT 'B2',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vt_status (status)
);

CREATE TABLE IF NOT EXISTS versant_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  section_key ENUM('read_aloud','repeat_sentence','short_answer','sentence_build','story_retell','open_opinion') NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  section_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vsection (test_id, section_key),
  CONSTRAINT fk_vsection_test FOREIGN KEY (test_id) REFERENCES versant_tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS versant_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  question_text TEXT NOT NULL,
  prompt_audio_url VARCHAR(500) NULL,
  expected_text TEXT NULL,
  accepted_answers TEXT NULL,
  response_seconds INT NOT NULL DEFAULT 30,
  silence_seconds INT NOT NULL DEFAULT 7,
  question_order INT NOT NULL DEFAULT 1,
  points DECIMAL(6,2) NOT NULL DEFAULT 10,
  metadata_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vquestion_section FOREIGN KEY (section_id) REFERENCES versant_sections(id) ON DELETE CASCADE,
  INDEX idx_vquestion_section_order (section_id, question_order)
);

-- One row = one student's attempt at one published test.
-- It is created automatically when the student starts the test.
CREATE TABLE IF NOT EXISTS versant_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  student_id VARCHAR(100) NOT NULL,
  status ENUM('assigned','started','submitted','expired') NOT NULL DEFAULT 'assigned',
  started_at DATETIME NULL,
  submitted_at DATETIME NULL,
  current_question_no INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vassignment_student_test (test_id, student_id),
  CONSTRAINT fk_vassignment_test FOREIGN KEY (test_id) REFERENCES versant_tests(id) ON DELETE CASCADE,
  INDEX idx_vassignment_student (student_id),
  INDEX idx_vassignment_status (status)
);

CREATE TABLE IF NOT EXISTS versant_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  question_id INT NOT NULL,
  question_no INT NOT NULL,
  audio_path VARCHAR(500) NULL,
  transcript TEXT NULL,
  response_text TEXT NULL,
  duration_ms INT NULL,
  words_count INT NOT NULL DEFAULT 0,
  words_per_minute DECIMAL(7,2) NULL,
  pause_count INT NOT NULL DEFAULT 0,
  longest_pause_ms INT NOT NULL DEFAULT 0,
  speech_score DECIMAL(6,2) NULL,
  pronunciation_score DECIMAL(6,2) NULL,
  grammar_score DECIMAL(6,2) NULL,
  vocabulary_score DECIMAL(6,2) NULL,
  coherence_score DECIMAL(6,2) NULL,
  exact_score DECIMAL(6,2) NULL,
  total_score DECIMAL(6,2) NULL,
  grading_json JSON NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vresponse_assignment_question (assignment_id, question_id),
  CONSTRAINT fk_vresponse_assignment FOREIGN KEY (assignment_id) REFERENCES versant_assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_vresponse_question FOREIGN KEY (question_id) REFERENCES versant_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS versant_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  overall_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  fluency_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  pronunciation_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  grammar_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  vocabulary_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  sentence_mastery_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  coherence_score DECIMAL(6,2) NOT NULL DEFAULT 0,
  wpm DECIMAL(7,2) NOT NULL DEFAULT 0,
  hesitation_count INT NOT NULL DEFAULT 0,
  cefr_level VARCHAR(10) NOT NULL DEFAULT 'A1',
  passed TINYINT(1) NOT NULL DEFAULT 0,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vresult_assignment (assignment_id),
  CONSTRAINT fk_vresult_assignment FOREIGN KEY (assignment_id) REFERENCES versant_assignments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS versant_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vevent_assignment FOREIGN KEY (assignment_id) REFERENCES versant_assignments(id) ON DELETE CASCADE,
  INDEX idx_vevent_assignment_time (assignment_id, created_at)
);
