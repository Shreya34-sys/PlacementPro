const db = require('../config/db');

async function main() {
  const [cols] = await db.execute('DESCRIBE documents');
  console.log('DOCUMENTS COLS:', cols.map(c => c.Field));
  const [docs] = await db.execute('SELECT COUNT(*) as count FROM documents');
  console.log('DOCUMENTS COUNT:', docs);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
