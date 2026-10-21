const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
require('dotenv').config();

const backupDir = path.resolve(__dirname, '..', 'db-backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const mysqldumpBin = 'C:\\Program Files\\mysql-8.0.46-winx64\\bin\\mysqldump.exe';
if (!fs.existsSync(mysqldumpBin)) {
  console.error('mysqldump.exe not found at:', mysqldumpBin);
  process.exit(1);
}

// Create temporary secure config for client
const cnfPath = path.resolve(__dirname, 'temp_dump.cnf');
const cnfContent = `[client]
host=${process.env.DB_HOST || 'localhost'}
port=${process.env.DB_PORT || 3306}
user=${process.env.DB_USER || 'root'}
password="${(process.env.DB_PASSWORD || '').replace(/"/g, '\\"')}"
`;

fs.writeFileSync(cnfPath, cnfContent, { mode: 0o600 });

try {
  const databases = ['ppro', 'placementpro_simulation'];
  for (const db of databases) {
    console.log(`Starting mysqldump for database: ${db}...`);
    const dumpFile = path.join(backupDir, `${db}_backup.sql`);
    
    // Use --routines, --triggers, --events, --single-transaction, --hex-blob
    const args = [
      `--defaults-extra-file=${cnfPath}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
      '--hex-blob',
      '--add-drop-table',
      '--databases',
      db
    ];

    const stdout = execFileSync(mysqldumpBin, args, {
      maxBuffer: 100 * 1024 * 1024,
      encoding: 'utf8'
    });

    fs.writeFileSync(dumpFile, stdout, 'utf8');
    const stats = fs.statSync(dumpFile);
    console.log(`✔ Dump completed: ${dumpFile} (${(stats.size / 1024).toFixed(2)} KB)`);
  }
} catch (err) {
  console.error('✘ Dump failed:', err.message);
  process.exit(1);
} finally {
  if (fs.existsSync(cnfPath)) {
    fs.unlinkSync(cnfPath);
  }
}
