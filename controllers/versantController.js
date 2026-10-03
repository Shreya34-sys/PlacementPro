const fs = require('fs');
const path = require('path');
const model = require('../models/versantModel');
const scorer = require('../services/versantScoringService');

function adminId(req) { return req.user?.id || null; }
function studentId(req) { return req.user?.id; }

exports.adminTests = async (req, res, next) => {
  try { res.json(await model.listTests()); } catch (e) { next(e); }
};

exports.createTest = async (req, res, next) => {
  try {
    const { title, description, durationSeconds, passScore, cefrPassLevel } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Test title is required.' });
    const id = await model.createTest({
      title: title.trim(), description, durationSeconds, passScore, cefrPassLevel, createdBy: adminId(req)
    });
    res.status(201).json({ id, message: 'Versant test created.' });
  } catch (e) { next(e); }
};

exports.deleteTest = async (req, res, next) => {
  try {
    const deleted = await model.deleteTest(req.params.testId);
    if (!deleted) return res.status(404).json({ message: 'Test not found.' });

    const removeUploadedFile = fileRef => {
      if (!fileRef) return;
      const fileName = path.basename(String(fileRef));
      if (!fileName || fileName === '.' || fileName === '..') return;
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'versant', fileName);
      fs.unlink(filePath, () => {});
    };

    [...deleted.promptAudio, ...deleted.responseAudio].forEach(removeUploadedFile);
    res.json({ message: 'Versant test deleted successfully.' });
  } catch (e) { next(e); }
};

exports.getTest = async (req, res, next) => {
  try {
    const test = await model.getTest(req.params.testId);
    if (!test) return res.status(404).json({ message: 'Test not found.' });
    res.json(test);
  } catch (e) { next(e); }
};

exports.addQuestion = async (req, res, next) => {
  try {
    const { sectionId, questionText, expectedText, acceptedAnswers, responseSeconds, silenceSeconds, questionOrder, points } = req.body;
    if (!sectionId || !questionText?.trim()) return res.status(400).json({ message: 'Section and question text are required.' });
    let accepted = acceptedAnswers;
    if (Array.isArray(acceptedAnswers)) accepted = JSON.stringify(acceptedAnswers);
    const audio = req.file ? `/uploads/versant/${req.file.filename}` : null;
    const id = await model.addQuestion({
      sectionId, questionText: questionText.trim(), expectedText, acceptedAnswers: accepted,
      responseSeconds, silenceSeconds, questionOrder, points, promptAudioUrl: audio
    });
    res.status(201).json({ id, promptAudioUrl: audio });
  } catch (e) { next(e); }
};

exports.publish = async (req, res, next) => {
  try {
    const status = req.body.status || 'published';
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid test status.' });
    }
    await model.setTestStatus(req.params.testId, status);
    res.json({ message: status === 'published' ? 'Test published for all students.' : 'Test status updated.' });
  } catch (e) { next(e); }
};

// All published tests are visible to every authenticated student.
exports.studentTests = async (req, res, next) => {
  try { res.json(await model.listPublishedTests()); } catch (e) { next(e); }
};

// Creates the student's own attempt automatically. No access code and no admin assignment.
exports.startTest = async (req, res, next) => {
  try {
    const sid = studentId(req);
    if (!sid) return res.status(401).json({ message: 'Student authentication required.' });

    const test = await model.getPublishedTest(req.params.testId);
    if (!test) return res.status(404).json({ message: 'Published Versant test not found.' });

    const a = await model.getOrCreateAssignment(test.id, sid);
    if (!a) return res.status(500).json({ message: 'Could not create your test attempt.' });
    if (a.status === 'submitted' || a.status === 'expired') {
      return res.status(409).json({ message: 'You have already completed this test.' });
    }

    await model.startAssignment(a.id, sid);
    const questions = await model.getQuestionsForAssignment(a.id);

    res.json({
      assignment: { ...a, status: 'started' },
      questions: questions.map((q, i) => ({
        id: q.id, no: i + 1, sectionKey: q.section_key, sectionName: q.display_name,
        questionText: q.question_text, promptAudioUrl: q.prompt_audio_url,
        expectedText: q.expected_text, responseSeconds: q.response_seconds,
        silenceSeconds: q.silence_seconds, points: q.points
      }))
    });
  } catch (e) { next(e); }
};

exports.submitResponse = async (req, res, next) => {
  let tempFile = req.file?.path;
  try {
    const a = await model.getAssignmentForStudent(req.params.assignmentId, studentId(req));
    if (!a || a.status !== 'started') return res.status(409).json({ message: 'Test is not active.' });

    const question = await model.getQuestionForAssignment(a.id, req.body.questionId);
    if (!question) return res.status(404).json({ message: 'Question does not belong to this test.' });

    const current = Number(a.current_question_no || 0);
    const questionNo = Number(req.body.questionNo);
    if (questionNo !== current + 1 && current !== 0) {
      return res.status(409).json({ message: 'This question is not the next allowed question.' });
    }

    const score = await scorer.scoreResponse({
      filePath: tempFile,
      transcript: req.body.transcript || '',
      question,
      durationMs: Number(req.body.durationMs || 0),
      pauseCount: Number(req.body.pauseCount || 0),
      longestPauseMs: Number(req.body.longestPauseMs || 0)
    });

    const storedName = req.file ? path.basename(req.file.path) : null;
    await model.saveResponse({
      assignmentId: a.id, questionId: question.id, questionNo,
      audioPath: storedName ? `/uploads/versant/${storedName}` : null,
      transcript: score.transcript, responseText: req.body.responseText || score.transcript,
      durationMs: Number(req.body.durationMs || 0), wordsCount: score.words, wpm: score.wpm,
      pauseCount: Number(req.body.pauseCount || 0), longestPauseMs: Number(req.body.longestPauseMs || 0),
      speechScore: score.fluency, pronunciationScore: score.pronunciation,
      grammarScore: score.grammar, vocabularyScore: score.vocabulary,
      coherenceScore: score.coherence, exactScore: score.exact,
      totalScore: score.total, gradingJson: score
    });
    await model.advanceQuestion(a.id, studentId(req), questionNo);

    res.json({ questionNo, score, nextQuestionNo: questionNo + 1 });
  } catch (e) { next(e); }
  finally {
    if (tempFile) fs.unlink(tempFile, () => {});
  }
};

exports.submit = async (req, res, next) => {
  try {
    const a = await model.getAssignmentForStudent(req.params.assignmentId, studentId(req));
    if (!a) return res.status(404).json({ message: 'Test attempt not found.' });
    if (a.status === 'submitted') {
      const existing = await model.getResult(a.id, studentId(req));
      return res.json({ message: 'Versant test already submitted.', result: existing });
    }

    const questions = await model.getQuestionsForAssignment(a.id);
    const responses = await model.getResponses(a.id);
    const avg = (key) => {
      const vals = responses.map(x => Number(x[key])).filter(Number.isFinite);
      return vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0;
    };
    const overall = avg('total_score');
    const fluency = avg('speech_score');
    const pronunciation = avg('pronunciation_score');
    const grammar = avg('grammar_score');
    const vocabulary = avg('vocabulary_score');
    const sentenceMastery = avg('exact_score') || ((grammar + avg('coherence_score')) / 2);
    const coherence = avg('coherence_score');
    const wpm = avg('words_per_minute');
    const hesitations = responses.reduce((s, x) => s + Number(x.pause_count || 0), 0);
    const cefr = scorer.cefrFromScore(overall);
    const levels = ['A1','A2','B1','B2','C1'];
    const passed = overall >= Number(a.pass_score || 60) &&
      levels.indexOf(cefr) >= levels.indexOf(a.cefr_pass_level || 'B2');

    await model.saveResult({
      assignmentId: a.id, overallScore: overall, fluency, pronunciation, grammar,
      vocabulary, sentenceMastery, coherence, wpm, hesitations, cefr, passed
    });
    await model.submitAssignment(a.id, studentId(req));
    res.json({ message: 'Versant test submitted.', result: { overall, cefr, passed, questions: questions.length, answered: responses.length } });
  } catch (e) { next(e); }
};

exports.result = async (req, res, next) => {
  try {
    const r = await model.getResult(req.params.assignmentId, studentId(req));
    if (!r) return res.status(404).json({ message: 'Result not available.' });
    res.json(r);
  } catch (e) { next(e); }
};

exports.adminResult = async (req, res, next) => {
  try {
    const r = await model.getResult(req.params.assignmentId);
    if (!r) return res.status(404).json({ message: 'Result not available.' });
    const responses = await model.getResponses(req.params.assignmentId);
    res.json({ result: r, responses });
  } catch (e) { next(e); }
};

exports.assignments = async (req, res, next) => {
  try { res.json(await model.listAssignments(req.params.testId)); } catch (e) { next(e); }
};

exports.event = async (req, res, next) => {
  try {
    const a = await model.getAssignmentForStudent(req.params.assignmentId, studentId(req));
    if (!a) return res.status(404).json({ message: 'Test attempt not found.' });
    await model.addEvent(a.id, req.body.type || 'unknown', req.body.data || {});
    res.status(204).end();
  } catch (e) { next(e); }
};
