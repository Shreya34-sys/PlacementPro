USE ppro;

CREATE TABLE IF NOT EXISTS exam_question_imports (
  created_by VARCHAR(36) NOT NULL,
  file_hash CHAR(64) NOT NULL,
  exam_id CHAR(36) NULL,
  imported_count INT UNSIGNED NOT NULL DEFAULT 0,
  skipped_rows INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (created_by, file_hash),
  CONSTRAINT fk_exam_import_admin FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_import_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);
