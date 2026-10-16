-- PlacementPro Study Materials Schema
-- Theory-based curriculum, tutorial chapters, rich topics, notes attachments, bookmarks, and student reading progress

CREATE TABLE IF NOT EXISTS study_subjects (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL DEFAULT 'Core CS',
  description TEXT NULL,
  icon VARCHAR(100) NOT NULL DEFAULT 'book',
  color VARCHAR(50) NOT NULL DEFAULT '#2563eb',
  display_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX ix_study_subjects_status (status, deleted_at, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS study_chapters (
  id CHAR(36) PRIMARY KEY,
  subject_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX ix_study_chapters_subject (subject_id, status, deleted_at, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS study_topics (
  id CHAR(36) PRIMARY KEY,
  chapter_id CHAR(36) NOT NULL,
  subject_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  summary TEXT NULL,
  video_url VARCHAR(500) NULL,
  video_title VARCHAR(255) NULL,
  video_source VARCHAR(120) NULL,
  video_objective TEXT NULL,
  estimated_reading_minutes INT NOT NULL DEFAULT 5,
  display_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  created_by CHAR(36) NOT NULL,
  views_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX ix_study_topics_lookup (subject_id, chapter_id, status, deleted_at, display_order),
  INDEX ix_study_topics_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS study_attachments (
  id CHAR(36) PRIMARY KEY,
  subject_id CHAR(36) NOT NULL,
  topic_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  download_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX ix_study_attach_subject (subject_id, topic_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS study_bookmarks (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  topic_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_study_user_topic_bookmark (user_id, topic_id),
  INDEX ix_study_bookmarks_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS study_reading_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  subject_id CHAR(36) NOT NULL,
  topic_id CHAR(36) NOT NULL,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  progress_percent INT NOT NULL DEFAULT 0,
  last_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_study_user_topic_progress (user_id, topic_id),
  INDEX ix_study_progress_user (user_id, subject_id, last_read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
