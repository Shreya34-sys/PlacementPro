require('dotenv').config();
const db = require('../config/db');

(async () => {
  const [tables] = await db.execute("SHOW TABLES LIKE 'study_%'");
  console.log('Tables found:');
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [count] = await db.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
    console.log(`- ${tableName}: ${count[0].cnt} records`);
  }
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
