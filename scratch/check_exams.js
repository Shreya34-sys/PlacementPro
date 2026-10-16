const db = require('../config/db');

async function main() {
  const [cols] = await db.execute('DESCRIBE exams');
  console.log('EXAMS COLS:', cols.map(c => c.Field));
  const [rows] = await db.execute('SELECT * FROM exams LIMIT 5');
  console.log('EXAMS ROWS:', rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
