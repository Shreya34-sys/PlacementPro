const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load .cloud-env
const envVars = {};
fs.readFileSync(path.resolve(__dirname, '..', '.cloud-env'), 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > -1) {
      envVars[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
});

const CA_CERT_PATH = path.resolve(__dirname, '..', 'certs', 'isrgrootx1.pem');

async function test() {
  const conn = await mysql.createConnection({
    host: envVars.CLOUD_DB_HOST,
    port: Number(envVars.CLOUD_DB_PORT || 4000),
    user: envVars.CLOUD_DB_USER,
    password: envVars.CLOUD_DB_PASSWORD,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(CA_CERT_PATH)
    }
  });

  console.log('Connected to TiDB Cloud!');
  const [vars] = await conn.query("SHOW VARIABLES LIKE '%foreign_key%'");
  console.log('Foreign key variables:', vars);

  await conn.end();
}

test().catch(console.error);
