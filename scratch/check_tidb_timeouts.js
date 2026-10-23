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

async function check() {
  const conn = await mysql.createConnection({
    host: envVars.CLOUD_DB_HOST,
    port: Number(envVars.CLOUD_DB_PORT || 4000),
    user: envVars.CLOUD_DB_USER,
    password: envVars.CLOUD_DB_PASSWORD,
    ssl: { rejectUnauthorized: true, ca: fs.readFileSync('certs/isrgrootx1.pem') }
  });
  const [vars] = await conn.query("SHOW VARIABLES LIKE '%max_allowed_packet%'");
  console.log(vars);
  const [vars2] = await conn.query("SHOW VARIABLES LIKE '%timeout%'");
  console.log(vars2);
  await conn.end();
}

check().catch(console.error);
