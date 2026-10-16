const db = require('../config/db');

async function main() {
  const [tables] = await db.execute('SHOW TABLES');
  console.log('TABLES:', tables.map(t => Object.values(t)[0]));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
