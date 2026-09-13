// const ExamModel = require('../models/examModel');
// const { GoogleGenAI } = require('@google/genai');
// const pdfParse = require('pdf-parse');

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// exports.createExamWithRAG = async (req, res) => {
//     try {
//         const { title, subject, duration_minutes, passing_marks, created_by, num_questions } = req.body;
//         if (!req.file) return res.status(400).json({ error: 'Syllabus PDF is required.' });

//         const pdfData = await pdfParse(req.file.buffer);
//         const prompt = `
//             Generate exactly ${num_questions || 5} MCQs based on:
//             ${pdfData.text.substring(0, 8000)}
//             Return ONLY a JSON array of objects with keys: question_text, option_a, option_b, option_c, option_d, correct_option (A/B/C/D), marks (number).
//         `;

//         const response = await ai.models.generateContent({
//             model: 'gemini-2.5-flash',
//             contents: prompt,
//         });

//         const rawText = response.text.trim().replace(/^```json/g, '').replace(/```$/g, '').trim();
//         const generatedQuestions = JSON.parse(rawText);
//         const totalMarks = generatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

//         const examId = await ExamModel.createExam({
//             title,
//             subject,
//             duration_minutes,
//             total_questions: generatedQuestions.length,
//             total_marks: totalMarks,
//             passing_marks,
//             created_by
//         });

//         await ExamModel.saveQuestions(examId, generatedQuestions);
//         res.status(201).json({ message: 'Exam created successfully', examId });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to generate exam.' });
//     }
// };

// exports.getExam = async (req, res) => {
//     try {
//         const data = await ExamModel.getExamById(req.params.id);
//         res.status(200).json(data);
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to load exam.' });
//     }
// };

// exports.startExam = async (req, res) => {
//     try {
//         const { exam_id, std_id } = req.body;
//         const attemptId = await ExamModel.startAttempt(exam_id, std_id);
//         res.status(200).json({ attemptId });
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to start attempt.' });
//     }
// };

// exports.submitExam = async (req, res) => {
//     try {
//         const { attempt_id, answers } = req.body;
//         const score = await ExamModel.submitAttempt(attempt_id, answers);
//         res.status(200).json({ message: 'Submitted', score });
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to submit exam.' });
//     }
// };









const ExamModel = require('../models/examModel');

exports.getExams = async (req, res) => {
    try {
        const exams = await ExamModel.getAllExams();
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching exams' });
    }
};

exports.getExamDetails = async (req, res) => {
    try {
        const examId = req.params.id;
        const exam = await ExamModel.getExamById(examId);

        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        const questions = await ExamModel.getQuestionsByExamId(examId);
        res.json({ ...exam, questions });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching exam questions' });
    }
};

exports.submitExam = async (req, res) => {
    try {
        const examId = req.params.id;
        const studentId = req.user.id;
        const { answers } = req.body;

        const score = await ExamModel.submitExamAttempt(examId, studentId, answers);
        res.json({ message: 'Exam submitted successfully', score });
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit exam', error: err.message });
    }
};