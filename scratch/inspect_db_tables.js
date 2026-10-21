const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    for (const db of ['ppro', 'placementpro_simulation']) {
      console.log(`=== Database: ${db} ===`);
      await conn.query(`USE \`${db}\``);
      const [tables] = await conn.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
      for (const t of tables) {
        const tableName = Object.values(t)[0];
        const [[countRow]] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
        console.log(`  - ${tableName}: ${countRow.cnt} rows`);
      }
    }
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
