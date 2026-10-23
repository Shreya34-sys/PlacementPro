const fs = require('fs');
const mysql = require('mysql2/promise');

const envVars = {};
fs.readFileSync('.cloud-env', 'utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const idx = t.indexOf('=');
    if (idx > -1) envVars[t.substring(0, idx).trim()] = t.substring(idx + 1).trim();
  }
});

async function run() {
  const conn = await mysql.createConnection({
    host: envVars.CLOUD_DB_HOST,
    port: Number(envVars.CLOUD_DB_PORT || 4000),
    user: envVars.CLOUD_DB_USER,
    password: envVars.CLOUD_DB_PASSWORD,
    ssl: { rejectUnauthorized: true, ca: fs.readFileSync('certs/isrgrootx1.pem') }
  });

  console.log('Testing session variables in TiDB...');
  try {
    await conn.query('SET foreign_key_checks = 0');
    console.log('SET foreign_key_checks = 0 SUCCESS');
  } catch (e) {
    console.log('SET foreign_key_checks = 0 FAILED:', e.message);
  }

  try {
    await conn.query('SET tidb_enable_foreign_key = OFF');
    console.log('SET tidb_enable_foreign_key = OFF SUCCESS');
  } catch (e) {
    console.log('SET tidb_enable_foreign_key = OFF FAILED:', e.message);
  }

  // Test creating test tables with char(36) and varchar(36)
  await conn.query('USE ppro');
  try {
    await conn.query('DROP TABLE IF EXISTS test_child');
    await conn.query('DROP TABLE IF EXISTS test_parent');
    await conn.query('CREATE TABLE test_child (id CHAR(36), parent_id CHAR(36), CONSTRAINT fk_test FOREIGN KEY (parent_id) REFERENCES test_parent(id))');
    await conn.query('CREATE TABLE test_parent (id VARCHAR(36) PRIMARY KEY)');
    console.log('Test parent with varchar(36) created successfully under tidb_enable_foreign_key = OFF!');
  } catch (e) {
    console.log('Test parent creation FAILED:', e.message);
  } finally {
    await conn.query('DROP TABLE IF EXISTS test_child');
    await conn.query('DROP TABLE IF EXISTS test_parent');
  }

  await conn.end();
}

run().catch(console.error);
