const db = require('../config/db');
const { randomUUID } = require('crypto');

class Attempt {
    static async start(examId, studentId) {
        const [existingRows] = await db.execute(
            'SELECT id, state FROM exam_attempts WHERE exam_id = ? AND student_id = ?',
            [examId, studentId]
        );

        if (existingRows.length > 0) {
            const error = new Error('You have already attempted this assessment.');
            error.status = 409;
            throw error;
        }

        const attemptId = randomUUID();

        await db.execute(
            `INSERT INTO exam_attempts (id, exam_id, student_id, state)
             VALUES (?, ?, ?, 'started')`,
            [attemptId, examId, studentId]
        );

        return {
            id: attemptId,
            exam_id: examId,
            student_id: studentId,
            state: 'started'
        };
    }

    static async saveAnswer(attemptId, questionId, optionId, markedForReview = false) {
        await db.execute(
            `INSERT INTO attempt_answers
                (id, attempt_id, question_id, option_id, marked_for_review)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                option_id = VALUES(option_id),
                marked_for_review = VALUES(marked_for_review),
                answered_at = CURRENT_TIMESTAMP`,
            [
                randomUUID(),
                attemptId,
                questionId,
                optionId || null,
                Boolean(markedForReview)
            ]
        );
    }

    static async submit(attemptId, forced = false) {
        const [attemptRows] = await db.execute(
            'SELECT * FROM exam_attempts WHERE id = ?',
            [attemptId]
        );

        const attempt = attemptRows[0];

        if (!attempt || attempt.state !== 'started') {
            return attempt;
        }

        const [scoreRows] = await db.execute(
            `SELECT COALESCE(
                SUM(
                    CASE
                        WHEN option_row.is_correct = 1 THEN question.marks
                        WHEN answer.option_id IS NULL THEN 0
                        ELSE -exam.negative_marking
                    END
                ), 0
            ) AS score
            FROM exam_attempts attempt
            JOIN exams exam ON exam.id = attempt.exam_id
            JOIN exam_questions question ON question.exam_id = exam.id
            LEFT JOIN attempt_answers answer
                ON answer.attempt_id = attempt.id
                AND answer.question_id = question.id
            LEFT JOIN question_options option_row
                ON option_row.id = answer.option_id
            WHERE attempt.id = ?`,
            [attemptId]
        );

        const state = forced ? 'auto_submitted' : 'submitted';
        const score = scoreRows[0].score;

        await db.execute(
            `UPDATE exam_attempts
             SET state = ?, submitted_at = NOW(), score = ?
             WHERE id = ?`,
            [state, score, attemptId]
        );

        return {
            ...attempt,
            state,
            score
        };
    }
}

module.exports = Attempt;