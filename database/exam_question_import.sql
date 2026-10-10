USE ppro;

ALTER TABLE exam_questions
  ADD COLUMN explanation TEXT NULL,
  ADD COLUMN difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium';
