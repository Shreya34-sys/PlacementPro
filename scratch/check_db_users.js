const db = require('../config/db');

async function main() {
  const [cols] = await db.execute('DESCRIBE students');
  console.log('STUDENTS COLS:', cols.map(c => c.Field));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
