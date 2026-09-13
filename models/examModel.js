// const db = require('../config/db');
// const { v4: uuidv4 } = require('uuid');

// const ExamModel = {
//     async createExam(data) {
//         const examId = uuidv4();
//         const query = `
//             INSERT INTO exams (exam_id, title, subject, duration_minutes, total_questions, total_marks, passing_marks, created_by)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `;
//         await db.execute(query, [
//             examId,
//             data.title,
//             data.subject,
//             data.duration_minutes,
//             data.total_questions,
//             data.total_marks,
//             data.passing_marks,
//             data.created_by
//         ]);
//         return examId;
//     },

//     async saveQuestions(examId, questions) {
//         const query = `
//             INSERT INTO questions (question_id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;
//         for (const q of questions) {
//             await db.execute(query, [
//                 uuidv4(),
//                 examId,
//                 q.question_text,
//                 q.option_a,
//                 q.option_b,
//                 q.option_c,
//                 q.option_d,
//                 q.correct_option,
//                 q.marks || 1
//             ]);
//         }
//     },

//     async getExamById(examId) {
//         const [exam] = await db.execute('SELECT * FROM exams WHERE exam_id = ?', [examId]);
//         const [questions] = await db.execute('SELECT question_id, question_text, option_a, option_b, option_c, option_d, marks FROM questions WHERE exam_id = ?', [examId]);
//         return { exam: exam[0], questions };
//     },

//     async startAttempt(examId, stdId) {
//         const attemptId = uuidv4();
//         const query = `INSERT INTO exam_attempts (attempt_id, exam_id, std_id) VALUES (?, ?, ?)`;
//         await db.execute(query, [attemptId, examId, stdId]);
//         return attemptId;
//     },

//     async submitAttempt(attemptId, answers) {
//         let totalScore = 0;
//         for (const ans of answers) {
//             const [q] = await db.execute('SELECT correct_option, marks FROM questions WHERE question_id = ?', [ans.question_id]);
//             const isCorrect = q[0] && q[0].correct_option === ans.selected_option;
//             const marksAwarded = isCorrect ? q[0].marks : 0;
//             totalScore += marksAwarded;

//             await db.execute(
//                 `INSERT INTO student_answers (answer_id, attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?, ?)`,
//                 [uuidv4(), attemptId, ans.question_id, ans.selected_option, isCorrect]
//             );
//         }

//         await db.execute(
//             `UPDATE exam_attempts SET score = ?, status = 'completed', submitted_at = NOW() WHERE attempt_id = ?`,
//             [totalScore, attemptId]
//         );

//         return totalScore;
//     }
// };

// module.exports = ExamModel;






const db = require('../config/db');
const crypto = require('crypto');

const ExamModel = {
    getAllExams: async () => {
        const [exams] = await db.query(
            `SELECT exam_id AS id, title, subject, duration_minutes, total_questions, total_marks 
             FROM exams ORDER BY created_at DESC`
        );
        return exams;
    },

    getExamById: async (examId) => {
        const [[exam]] = await db.query(
            `SELECT exam_id AS id, title, duration_minutes, instructions FROM exams WHERE exam_id = ?`, 
            [examId]
        );
        return exam;
    },

    getQuestionsByExamId: async (examId) => {
        const [questions] = await db.query(
            `SELECT question_id AS id, question_text, option_a, option_b, option_c, option_d 
             FROM questions WHERE exam_id = ?`, 
            [examId]
        );
        return questions;
    },

    submitExamAttempt: async (examId, studentId, answers) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [questions] = await connection.query(
                `SELECT question_id, correct_option, marks FROM questions WHERE exam_id = ?`,
                [examId]
            );

            let earnedMarks = 0;
            let totalPossibleMarks = 0;

            const attemptId = crypto.randomUUID();
            await connection.query(
                `INSERT INTO exam_attempts (attempt_id, exam_id, std_id, status, submitted_at) VALUES (?, ?, ?, 'completed', NOW())`,
                [attemptId, examId, studentId]
            );

            for (const q of questions) {
                totalPossibleMarks += q.marks;
                const selectedOpt = answers[q.question_id] || null;
                const isCorrect = selectedOpt === q.correct_option;

                if (isCorrect) earnedMarks += q.marks;

                await connection.query(
                    `INSERT INTO student_answers (answer_id, attempt_id, question_id, selected_option, is_correct) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), attemptId, q.question_id, selectedOpt, isCorrect]
                );
            }

            const finalPercentage = totalPossibleMarks > 0 ? ((earnedMarks / totalPossibleMarks) * 100).toFixed(2) : 0;
            
            await connection.query(
                `UPDATE exam_attempts SET score = ? WHERE attempt_id = ?`,
                [finalPercentage, attemptId]
            );

            await connection.commit();
            return finalPercentage;

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
};

module.exports = ExamModel;