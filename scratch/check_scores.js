const db = require('../config/db');

async function main() {
  const [cols] = await db.execute('DESCRIBE exam_attempts');
  console.log('EXAM ATTEMPTS COLS:', cols.map(c => c.Field));
  const [rows] = await db.execute('SELECT COUNT(*) as count, AVG(score) as avgScore FROM exam_attempts WHERE state="submitted"');
  console.log('EXAM ATTEMPTS SUBMITTED:', rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
