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





-- database/schema.sql

-- 1. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    exam_id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    exam_type ENUM('mcq', 'theory', 'mixed') DEFAULT 'mcq',
    duration_minutes INT NOT NULL,
    total_questions INT DEFAULT 0,
    total_marks INT DEFAULT 0,
    passing_marks INT NOT NULL,
    created_by VARCHAR(36),
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    question_id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('mcq', 'theory') DEFAULT 'mcq',
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    marks INT DEFAULT 1,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);

-- 3. EXAM ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS exam_attempts (
    attempt_id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL,
    std_id VARCHAR(36) NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('in_progress', 'completed', 'disqualified') DEFAULT 'in_progress',
    warning_count INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (std_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. STUDENT ANSWERS TABLE
CREATE TABLE IF NOT EXISTS student_answers (
    answer_id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    selected_option ENUM('A', 'B', 'C', 'D'),
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(attempt_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

-- 5. PROCTORING LOGS TABLE (FOR PHASE 2)
CREATE TABLE IF NOT EXISTS proctoring_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL,
    violation_type ENUM('tab_switch', 'esc_fullscreen', 'multiple_faces', 'no_face', 'gaze_off', 'mobile_detected') NOT NULL,
    severity ENUM('low', 'medium', 'high') NOT NULL,
    snapshot_url VARCHAR(255) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(attempt_id) ON DELETE CASCADE
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