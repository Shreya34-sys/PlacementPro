const db = require('../config/db');

let tableReady;

async function ensureTable() {
  if (!tableReady) {
    tableReady = db.query(`CREATE TABLE IF NOT EXISTS preparation_question_activity (
      user_id VARCHAR(36) NOT NULL,
      question_key VARCHAR(100) NOT NULL,
      activity_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, question_key, activity_date),
      KEY idx_preparation_activity_user_date (user_id, activity_date),
      CONSTRAINT fk_preparation_activity_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
      .catch((error) => {
        tableReady = undefined;
        throw error;
      });
  }
  await tableReady;
}

async function recordQuestion(userId, questionKey, executor = db) {
  await ensureTable();
  await executor.execute(
    `INSERT IGNORE INTO preparation_question_activity (user_id, question_key, activity_date)
     VALUES (?, ?, CURRENT_DATE)`,
    [userId, String(questionKey)]
  );
}

function shiftDate(date, days) {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

async function getActivity(userId) {
  await ensureTable();
  const [[todayRow], [rows]] = await Promise.all([
    db.execute(`SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS today`),
    db.execute(`SELECT DATE_FORMAT(activity_date, '%Y-%m-%d') AS activity_date, COUNT(*) AS questions
      FROM preparation_question_activity
      WHERE user_id = ?
      GROUP BY activity_date
      ORDER BY activity_date DESC`, [userId])
  ]);

  const today = todayRow[0].today;
  const counts = new Map(rows.map((row) => [row.activity_date, Number(row.questions)]));
  const activeDates = new Set(counts.keys());
  const activeToday = activeDates.has(today);
  let currentDate = activeToday ? today : shiftDate(today, -1);
  let currentStreak = 0;
  while (activeDates.has(currentDate)) {
    currentStreak += 1;
    currentDate = shiftDate(currentDate, -1);
  }

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(today, index - 6);
    const questions = counts.get(date) || 0;
    return { date, questions, active: questions > 0 };
  });

  return { today, currentStreak, activeToday, questionsToday: counts.get(today) || 0, days };
}

module.exports = { ensureTable, recordQuestion, getActivity };
