const db = require('../config/db');

const SECTION_DEFS = [
  ['read_aloud', 'Read Aloud', 1],
  ['repeat_sentence', 'Repeat Sentence', 2],
  ['short_answer', 'Short Answer', 3],
  ['sentence_build', 'Sentence Build', 4],
  ['story_retell', 'Story Retelling', 5],
  ['open_opinion', 'Open Opinion', 6]
];

async function createTest({ title, description, durationSeconds, passScore, cefrPassLevel, createdBy }) {
  const [r] = await db.execute(
    `INSERT INTO versant_tests
      (title, description, duration_seconds, pass_score, cefr_pass_level, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description || null, durationSeconds || 1800, passScore ?? 60, cefrPassLevel || 'B2', createdBy || null]
  );
  for (const [key, name, order] of SECTION_DEFS) {
    await db.execute(
      `INSERT INTO versant_sections (test_id, section_key, display_name, section_order)
       VALUES (?, ?, ?, ?)`,
      [r.insertId, key, name, order]
    );
  }
  return r.insertId;
}

async function listTests() {
  const [rows] = await db.execute(
    `SELECT t.*,
       (SELECT COUNT(*) FROM versant_questions q
        JOIN versant_sections s ON s.id=q.section_id WHERE s.test_id=t.id) question_count,
       (SELECT COUNT(*) FROM versant_assignments a WHERE a.test_id=t.id) attempt_count
     FROM versant_tests t ORDER BY t.created_at DESC`
  );
  return rows;
}

async function deleteTest(testId) {
  // Collect uploaded audio files first. Database rows are then removed in
  // dependency order so this also works with older Versant table schemas.
  const [promptRows] = await db.execute(
    `SELECT q.prompt_audio_url
     FROM versant_questions q
     JOIN versant_sections s ON s.id=q.section_id
     WHERE s.test_id=? AND q.prompt_audio_url IS NOT NULL`,
    [testId]
  );

  const [responseRows] = await db.execute(
    `SELECT r.audio_path
     FROM versant_responses r
     JOIN versant_assignments a ON a.id=r.assignment_id
     WHERE a.test_id=? AND r.audio_path IS NOT NULL`,
    [testId]
  );

  await db.execute(
    `DELETE FROM versant_results
     WHERE assignment_id IN (SELECT id FROM versant_assignments WHERE test_id=?)`,
    [testId]
  );
  await db.execute(
    `DELETE FROM versant_responses
     WHERE assignment_id IN (SELECT id FROM versant_assignments WHERE test_id=?)`,
    [testId]
  );
  await db.execute(
    `DELETE FROM versant_events
     WHERE assignment_id IN (SELECT id FROM versant_assignments WHERE test_id=?)`,
    [testId]
  );
  await db.execute(`DELETE FROM versant_assignments WHERE test_id=?`, [testId]);
  await db.execute(
    `DELETE FROM versant_questions
     WHERE section_id IN (SELECT id FROM versant_sections WHERE test_id=?)`,
    [testId]
  );
  await db.execute(`DELETE FROM versant_sections WHERE test_id=?`, [testId]);

  const [result] = await db.execute(`DELETE FROM versant_tests WHERE id=?`, [testId]);
  if (!result.affectedRows) return null;

  return {
    promptAudio: promptRows.map(r => r.prompt_audio_url).filter(Boolean),
    responseAudio: responseRows.map(r => r.audio_path).filter(Boolean)
  };
}

async function listPublishedTests() {
  const [rows] = await db.execute(
    `SELECT t.id, t.title, t.description, t.duration_seconds, t.pass_score,
            t.cefr_pass_level, t.status, t.created_at,
            (SELECT COUNT(*) FROM versant_questions q
             JOIN versant_sections s ON s.id=q.section_id WHERE s.test_id=t.id) question_count
     FROM versant_tests t
     WHERE t.status='published'
     ORDER BY t.created_at DESC`
  );
  return rows;
}

async function getSection(sectionId) {
  const [[section]] = await db.execute(
    `SELECT id, test_id, section_key, display_name
     FROM versant_sections WHERE id=?`,
    [sectionId]
  );
  return section || null;
}

async function getTest(testId) {
  const [[test]] = await db.execute(`SELECT * FROM versant_tests WHERE id=?`, [testId]);
  if (!test) return null;
  const [sections] = await db.execute(
    `SELECT * FROM versant_sections WHERE test_id=? ORDER BY section_order`, [testId]
  );
  for (const s of sections) {
    const [questions] = await db.execute(
      `SELECT id, section_id, question_text, prompt_audio_url, expected_text,
              accepted_answers, response_seconds, silence_seconds, question_order,
              points, metadata_json
       FROM versant_questions WHERE section_id=? ORDER BY question_order`,
      [s.id]
    );
    s.questions = questions;
  }
  test.sections = sections;
  return test;
}

async function addQuestion(data) {
  const [r] = await db.execute(
    `INSERT INTO versant_questions
      (section_id, question_text, prompt_audio_url, expected_text, accepted_answers,
       response_seconds, silence_seconds, question_order, points, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.sectionId, data.questionText, data.promptAudioUrl || null,
      data.expectedText || null, data.acceptedAnswers || null,
      data.responseSeconds || 30, data.silenceSeconds || 7,
      data.questionOrder || 1, data.points || 10,
      data.metadataJson ? JSON.stringify(data.metadataJson) : null
    ]
  );
  return r.insertId;
}

async function setTestStatus(testId, status) {
  await db.execute(`UPDATE versant_tests SET status=? WHERE id=?`, [status, testId]);
}

async function getPublishedTest(testId) {
  const [[test]] = await db.execute(
    `SELECT id, title, description, duration_seconds, pass_score, cefr_pass_level, status
     FROM versant_tests WHERE id=? AND status='published'`, [testId]
  );
  return test || null;
}

async function getOrCreateAssignment(testId, studentId) {
  // First try to find an existing attempt.
  let [[a]] = await db.execute(
    `SELECT a.*, t.title, t.duration_seconds, t.pass_score, t.cefr_pass_level, t.status AS test_status
     FROM versant_assignments a
     JOIN versant_tests t ON t.id=a.test_id
     WHERE a.test_id=? AND a.student_id=?`,
    [testId, studentId]
  );
  if (a) return a;

  // The unique(test_id, student_id) key prevents duplicate attempts if two requests arrive together.
  try {
    await db.execute(
      `INSERT INTO versant_assignments (test_id, student_id, status)
       VALUES (?, ?, 'assigned')`,
      [testId, studentId]
    );
  } catch (e) {
    if (e.code !== 'ER_DUP_ENTRY') throw e;
  }

  [[a]] = await db.execute(
    `SELECT a.*, t.title, t.duration_seconds, t.pass_score, t.cefr_pass_level, t.status AS test_status
     FROM versant_assignments a
     JOIN versant_tests t ON t.id=a.test_id
     WHERE a.test_id=? AND a.student_id=?`,
    [testId, studentId]
  );
  return a || null;
}

async function getAssignmentForStudent(id, studentId) {
  const [[a]] = await db.execute(
    `SELECT a.*, t.title, t.duration_seconds, t.pass_score, t.cefr_pass_level, t.status AS test_status
     FROM versant_assignments a JOIN versant_tests t ON t.id=a.test_id
     WHERE a.id=? AND a.student_id=?`,
    [id, studentId]
  );
  return a || null;
}

async function startAssignment(id, studentId) {
  await db.execute(
    `UPDATE versant_assignments
     SET status='started', started_at=COALESCE(started_at, NOW())
     WHERE id=? AND student_id=? AND status='assigned'`,
    [id, studentId]
  );
}

async function getQuestionsForAssignment(assignmentId) {
  const [[a]] = await db.execute(
    `SELECT test_id FROM versant_assignments WHERE id=?`, [assignmentId]
  );
  if (!a) return [];
  const [rows] = await db.execute(
    `SELECT q.*, s.section_key, s.display_name, s.section_order
     FROM versant_questions q
     JOIN versant_sections s ON s.id=q.section_id
     WHERE s.test_id=?
     ORDER BY s.section_order, q.question_order, q.id`,
    [a.test_id]
  );
  return rows;
}

async function getQuestionForAssignment(assignmentId, questionId) {
  const [[row]] = await db.execute(
    `SELECT q.*, s.section_key, s.display_name, s.section_order
     FROM versant_questions q JOIN versant_sections s ON s.id=q.section_id
     JOIN versant_assignments a ON a.test_id=s.test_id
     WHERE a.id=? AND q.id=?`,
    [assignmentId, questionId]
  );
  return row || null;
}

async function saveResponse(data) {
  const [r] = await db.execute(
    `INSERT INTO versant_responses
      (assignment_id, question_id, question_no, audio_path, transcript, response_text,
       duration_ms, words_count, words_per_minute, pause_count, longest_pause_ms,
       speech_score, pronunciation_score, grammar_score, vocabulary_score,
       coherence_score, exact_score, total_score, grading_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       transcript=VALUES(transcript), response_text=VALUES(response_text),
       duration_ms=VALUES(duration_ms), words_count=VALUES(words_count),
       words_per_minute=VALUES(words_per_minute), pause_count=VALUES(pause_count),
       longest_pause_ms=VALUES(longest_pause_ms), speech_score=VALUES(speech_score),
       pronunciation_score=VALUES(pronunciation_score), grammar_score=VALUES(grammar_score),
       vocabulary_score=VALUES(vocabulary_score), coherence_score=VALUES(coherence_score),
       exact_score=VALUES(exact_score), total_score=VALUES(total_score),
       grading_json=VALUES(grading_json)`,
    [
      data.assignmentId, data.questionId, data.questionNo, data.audioPath || null,
      data.transcript || null, data.responseText || null, data.durationMs || null,
      data.wordsCount || 0, data.wpm || null, data.pauseCount || 0, data.longestPauseMs || 0,
      data.speechScore ?? null, data.pronunciationScore ?? null, data.grammarScore ?? null,
      data.vocabularyScore ?? null, data.coherenceScore ?? null, data.exactScore ?? null,
      data.totalScore ?? null, data.gradingJson ? JSON.stringify(data.gradingJson) : null
    ]
  );
  return r.insertId;
}

async function advanceQuestion(assignmentId, studentId, nextQuestionNo) {
  await db.execute(
    `UPDATE versant_assignments
     SET current_question_no=GREATEST(current_question_no, ?)
     WHERE id=? AND student_id=? AND status='started'`,
    [nextQuestionNo, assignmentId, studentId]
  );
}

async function submitAssignment(assignmentId, studentId) {
  await db.execute(
    `UPDATE versant_assignments SET status='submitted', submitted_at=NOW()
     WHERE id=? AND student_id=? AND status IN ('started','assigned')`,
    [assignmentId, studentId]
  );
}

async function listAssignments(testId) {
  const [rows] = await db.execute(
    `SELECT a.*, u.fullName,
       r.overall_score, r.cefr_level, r.passed
     FROM versant_assignments a
     LEFT JOIN users u ON u.id=a.student_id
     LEFT JOIN versant_results r ON r.assignment_id=a.id
     WHERE a.test_id=? ORDER BY a.created_at DESC`,
    [testId]
  );
  return rows;
}

async function getResponses(assignmentId) {
  const [rows] = await db.execute(
    `SELECT r.*, q.question_text, s.section_key, s.display_name
     FROM versant_responses r
     JOIN versant_questions q ON q.id=r.question_id
     JOIN versant_sections s ON s.id=q.section_id
     WHERE r.assignment_id=? ORDER BY r.question_no`,
    [assignmentId]
  );
  return rows;
}

async function saveResult(data) {
  await db.execute(
    `INSERT INTO versant_results
      (assignment_id, overall_score, fluency_score, pronunciation_score,
       grammar_score, vocabulary_score, sentence_mastery_score, coherence_score,
       wpm, hesitation_count, cefr_level, passed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       overall_score=VALUES(overall_score), fluency_score=VALUES(fluency_score),
       pronunciation_score=VALUES(pronunciation_score), grammar_score=VALUES(grammar_score),
       vocabulary_score=VALUES(vocabulary_score), sentence_mastery_score=VALUES(sentence_mastery_score),
       coherence_score=VALUES(coherence_score), wpm=VALUES(wpm),
       hesitation_count=VALUES(hesitation_count), cefr_level=VALUES(cefr_level),
       passed=VALUES(passed)`,
    [data.assignmentId, data.overallScore, data.fluency, data.pronunciation,
     data.grammar, data.vocabulary, data.sentenceMastery, data.coherence,
     data.wpm, data.hesitations, data.cefr, data.passed ? 1 : 0]
  );
}

async function getResult(assignmentId, studentId = null) {
  const params = [assignmentId];
  let extra = '';
  if (studentId !== null) {
    extra = ' AND a.student_id=?';
    params.push(studentId);
  }
  const [[result]] = await db.execute(
    `SELECT r.*, a.test_id, a.student_id, t.title, t.pass_score, t.cefr_pass_level
     FROM versant_results r
     JOIN versant_assignments a ON a.id=r.assignment_id
     JOIN versant_tests t ON t.id=a.test_id
     WHERE r.assignment_id=?${extra}`, params
  );
  return result || null;
}

async function addEvent(assignmentId, type, data) {
  await db.execute(
    `INSERT INTO versant_events (assignment_id,event_type,event_data) VALUES (?,?,?)`,
    [assignmentId, type, data ? JSON.stringify(data) : null]
  );
}

module.exports = {
  createTest, listTests, deleteTest, listPublishedTests, getTest, getSection, addQuestion, setTestStatus,
  getPublishedTest, getOrCreateAssignment, getAssignmentForStudent,
  startAssignment, getQuestionsForAssignment, getQuestionForAssignment,
  saveResponse, advanceQuestion, submitAssignment, listAssignments,
  getResponses, saveResult, getResult, addEvent
};
