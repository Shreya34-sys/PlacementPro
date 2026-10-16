const db = require('../config/db');

async function main() {
  const [drives] = await db.execute('SELECT * FROM drives LIMIT 10');
  console.log('DRIVES:', drives);
  const [companies] = await db.execute('SELECT * FROM companies LIMIT 10');
  console.log('COMPANIES:', companies);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
