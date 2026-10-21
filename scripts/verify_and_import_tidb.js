/**
 * verify_and_import_tidb.js
 * 
 * Safe migration helper:
 * 1. Verifies cloud connection over TLS.
 * 2. Confirms cloud target databases are fresh and empty (0 tables).
 * 3. Safely imports db-backup/*.sql dumps into cloud databases using local mysql.exe.
 * 4. Compares local vs cloud table lists and row counts (Read-Only on local DB).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Attempt to load .cloud-env if present
const cloudEnvPath = path.resolve(__dirname, '..', '.cloud-env');
if (fs.existsSync(cloudEnvPath)) {
  const content = fs.readFileSync(cloudEnvPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[k] = v;
      }
    }
  });
}

const MYSQL_EXE = 'C:\\Program Files\\mysql-8.0.46-winx64\\bin\\mysql.exe';
const PPRO_BACKUP = path.resolve(__dirname, '..', 'db-backup', 'ppro_backup.sql');
const SIM_BACKUP = path.resolve(__dirname, '..', 'db-backup', 'placementpro_simulation_backup.sql');

const CA_CERT_PATH = path.resolve(__dirname, '..', 'certs', 'isrgrootx1.pem');
const caCert = fs.existsSync(CA_CERT_PATH) ? fs.readFileSync(CA_CERT_PATH) : undefined;

const CLOUD_CONFIG = {
  host: process.env.CLOUD_DB_HOST || process.env.TIDB_HOST,
  port: Number(process.env.CLOUD_DB_PORT || process.env.TIDB_PORT || 4000),
  user: process.env.CLOUD_DB_USER || process.env.TIDB_USER,
  password: process.env.CLOUD_DB_PASSWORD || process.env.TIDB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ...(caCert ? { ca: caCert } : {})
  }
};

const LOCAL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

async function getTablesAndCounts(conn, dbName) {
  await conn.query(`USE \`${dbName}\``);
  const [rows] = await conn.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
  const tables = [];
  for (const r of rows) {
    const tableName = Object.values(r)[0];
    try {
      const [[countRow]] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
      tables.push({ name: tableName, count: Number(countRow.cnt) });
    } catch (e) {
      tables.push({ name: tableName, count: -1, error: e.message });
    }
  }
  return tables.sort((a, b) => a.name.localeCompare(b.name));
}

async function run() {
  console.log('==================================================');
  console.log('   PlacementPro TiDB Cloud Migration Verifier     ');
  console.log('==================================================\n');

  if (!CLOUD_CONFIG.host || !CLOUD_CONFIG.user || !CLOUD_CONFIG.password) {
    console.error('Error: Cloud database configuration is missing.');
    console.error('Please configure CLOUD_DB_HOST, CLOUD_DB_USER, and CLOUD_DB_PASSWORD in .cloud-env or environment variables.');
    process.exit(1);
  }

  if (!fs.existsSync(MYSQL_EXE)) {
    console.error(`Error: mysql.exe not found at ${MYSQL_EXE}`);
    process.exit(1);
  }
  if (!fs.existsSync(PPRO_BACKUP)) {
    console.error(`Error: Backup file not found at ${PPRO_BACKUP}`);
    process.exit(1);
  }
  if (!fs.existsSync(SIM_BACKUP)) {
    console.error(`Error: Backup file not found at ${SIM_BACKUP}`);
    process.exit(1);
  }

  console.log(`Connecting to Cloud Database: ${CLOUD_CONFIG.host}:${CLOUD_CONFIG.port} (User: ${CLOUD_CONFIG.user})...`);
  let cloudConn;
  try {
    cloudConn = await mysql.createConnection(CLOUD_CONFIG);
    console.log('✓ Successfully connected to TiDB Cloud with TLS.\n');
  } catch (err) {
    console.error('✗ Failed to connect to TiDB Cloud:', err.message);
    process.exit(1);
  }

  // Ensure logical databases exist
  await cloudConn.query('CREATE DATABASE IF NOT EXISTS `ppro` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await cloudConn.query('CREATE DATABASE IF NOT EXISTS `placementpro_simulation` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

  // Verify cloud databases are empty
  const cloudPproTables = await getTablesAndCounts(cloudConn, 'ppro');
  const cloudSimTables = await getTablesAndCounts(cloudConn, 'placementpro_simulation');

  const action = process.argv[2];

  if (action === 'check') {
    console.log(`Cloud 'ppro' table count: ${cloudPproTables.length}`);
    console.log(`Cloud 'placementpro_simulation' table count: ${cloudSimTables.length}`);
    await cloudConn.end();
    return;
  }

  if (cloudPproTables.length > 0 || cloudSimTables.length > 0) {
    if (action !== '--force-import') {
      console.warn('⚠️  Target cloud databases are NOT empty:');
      console.warn(`   - ppro: ${cloudPproTables.length} tables found`);
      console.warn(`   - placementpro_simulation: ${cloudSimTables.length} tables found`);
      console.warn('Safety guard active: Skipping import to avoid overwriting existing cloud tables.');
      console.warn('To verify row counts against local DB without importing, run with action "verify".');
    }
  }

  if (cloudPproTables.length === 0 && cloudSimTables.length === 0) {
    console.log('✓ Target cloud databases are completely empty.');
    console.log('Importing ppro_backup.sql into cloud ppro database...');

    // Use temporary cnf file for mysql.exe to avoid exposing password on CLI
    const cnfPath = path.resolve(__dirname, '..', `.cloud_temp_${Date.now()}.cnf`);
    let cnfContent = `[client]\nhost=${CLOUD_CONFIG.host}\nport=${CLOUD_CONFIG.port}\nuser="${CLOUD_CONFIG.user}"\npassword="${CLOUD_CONFIG.password}"\nssl-mode=REQUIRED\n`;
    if (fs.existsSync(CA_CERT_PATH)) {
      cnfContent += `ssl-ca="${CA_CERT_PATH.replace(/\\/g, '/')}"\n`;
    }
    fs.writeFileSync(cnfPath, cnfContent, { mode: 0o600 });

    try {
      console.log('Importing ppro...');
      const pproImport = spawnSync(MYSQL_EXE, [`--defaults-extra-file=${cnfPath}`, 'ppro'], {
        input: fs.readFileSync(PPRO_BACKUP),
        maxBuffer: 100 * 1024 * 1024
      });
      if (pproImport.status !== 0) {
        throw new Error(pproImport.stderr.toString());
      }
      console.log('✓ ppro import completed successfully.');

      console.log('Importing placementpro_simulation...');
      const simImport = spawnSync(MYSQL_EXE, [`--defaults-extra-file=${cnfPath}`, 'placementpro_simulation'], {
        input: fs.readFileSync(SIM_BACKUP),
        maxBuffer: 50 * 1024 * 1024
      });
      if (simImport.status !== 0) {
        throw new Error(simImport.stderr.toString());
      }
      console.log('✓ placementpro_simulation import completed successfully.\n');
    } finally {
      if (fs.existsSync(cnfPath)) fs.unlinkSync(cnfPath);
    }
  }

  // Now perform Verification: Compare Local vs Cloud
  console.log('Connecting to Local MySQL (READ ONLY) for verification...');
  let localConn;
  try {
    localConn = await mysql.createConnection(LOCAL_CONFIG);
    console.log('✓ Connected to Local MySQL.\n');
  } catch (err) {
    console.error('Notice: Could not connect to local MySQL to verify row counts:', err.message);
    await cloudConn.end();
    return;
  }

  console.log('Comparing Local ppro vs Cloud ppro:');
  const localPpro = await getTablesAndCounts(localConn, 'ppro');
  const cloudPpro = await getTablesAndCounts(cloudConn, 'ppro');

  const pproMap = new Map();
  localPpro.forEach(t => pproMap.set(t.name, { local: t.count, cloud: 0 }));
  cloudPpro.forEach(t => {
    if (pproMap.has(t.name)) {
      pproMap.get(t.name).cloud = t.count;
    } else {
      pproMap.set(t.name, { local: 'MISSING', cloud: t.count });
    }
  });

  let pproMatches = 0;
  let pproMismatches = 0;
  for (const [name, counts] of pproMap.entries()) {
    if (counts.local === counts.cloud) {
      pproMatches++;
    } else {
      pproMismatches++;
      console.log(`  Mismatch in table [${name}]: Local=${counts.local}, Cloud=${counts.cloud}`);
    }
  }
  console.log(`✓ ppro: ${localPpro.length} local tables, ${cloudPpro.length} cloud tables. Perfect matches: ${pproMatches}, Mismatches: ${pproMismatches}\n`);

  console.log('Comparing Local placementpro_simulation vs Cloud placementpro_simulation:');
  const localSim = await getTablesAndCounts(localConn, 'placementpro_simulation');
  const cloudSim = await getTablesAndCounts(cloudConn, 'placementpro_simulation');

  const simMap = new Map();
  localSim.forEach(t => simMap.set(t.name, { local: t.count, cloud: 0 }));
  cloudSim.forEach(t => {
    if (simMap.has(t.name)) {
      simMap.get(t.name).cloud = t.count;
    } else {
      simMap.set(t.name, { local: 'MISSING', cloud: t.count });
    }
  });

  let simMatches = 0;
  let simMismatches = 0;
  for (const [name, counts] of simMap.entries()) {
    if (counts.local === counts.cloud) {
      simMatches++;
    } else {
      simMismatches++;
      console.log(`  Mismatch in table [${name}]: Local=${counts.local}, Cloud=${counts.cloud}`);
    }
  }
  console.log(`✓ placementpro_simulation: ${localSim.length} local tables, ${cloudSim.length} cloud tables. Perfect matches: ${simMatches}, Mismatches: ${simMismatches}\n`);

  await localConn.end();
  await cloudConn.end();
  console.log('==================================================');
  console.log('               Verification Finished              ');
  console.log('==================================================');
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
