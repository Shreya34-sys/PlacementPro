CREATE TABLE IF NOT EXISTS preparation_question_activity (
  user_id VARCHAR(36) NOT NULL,
  question_key VARCHAR(100) NOT NULL,
  activity_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_key, activity_date),
  KEY idx_preparation_activity_user_date (user_id, activity_date),
  CONSTRAINT fk_preparation_activity_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
