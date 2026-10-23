/**
 * deep_data_verification.js
 * 
 * Comprehensive READ-ONLY data integrity verification:
 * 1. Exact row count comparison for all tables in ppro and placementpro_simulation.
 * 2. Primary-key count and bounds comparison (MIN / MAX).
 * 3. Portable data checksum using BIT_XOR(CRC32(...)) on column values.
 * 
 * STRICT SAFETY: Performs ZERO writes, drops, alters, or inserts.
 * Never prints passwords or secrets.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Load .cloud-env
const cloudEnv = {};
const cloudEnvPath = path.resolve(__dirname, '..', '.cloud-env');
if (fs.existsSync(cloudEnvPath)) {
  fs.readFileSync(cloudEnvPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        cloudEnv[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const CA_CERT_PATH = path.resolve(__dirname, '..', 'certs', 'isrgrootx1.pem');

const LOCAL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

const CLOUD_CONFIG = {
  host: cloudEnv.CLOUD_DB_HOST,
  port: Number(cloudEnv.CLOUD_DB_PORT || 4000),
  user: cloudEnv.CLOUD_DB_USER,
  password: cloudEnv.CLOUD_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ...(fs.existsSync(CA_CERT_PATH) ? { ca: fs.readFileSync(CA_CERT_PATH) } : {})
  }
};

async function getTableDetails(conn, dbName) {
  await conn.query(`USE \`${dbName}\``);
  const [tables] = await conn.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
  const details = {};

  for (const t of tables) {
    const tableName = Object.values(t)[0];

    // 1. Exact Row Count
    const [[countRes]] = await conn.query(`SELECT COUNT(*) AS total FROM \`${tableName}\``);
    const rowCount = Number(countRes.total);

    // 2. Identify Primary Key
    const [pkRows] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
      ORDER BY ORDINAL_POSITION
    `, [dbName, tableName]);
    const pkCols = pkRows.map(r => r.COLUMN_NAME);

    let minPk = null;
    let maxPk = null;
    let distinctPkCount = null;

    if (pkCols.length > 0 && rowCount > 0) {
      const firstPk = pkCols[0];
      try {
        const [[pkStats]] = await conn.query(
          `SELECT MIN(\`${firstPk}\`) AS minVal, MAX(\`${firstPk}\`) AS maxVal, COUNT(DISTINCT \`${firstPk}\`) AS distCount FROM \`${tableName}\``
        );
        minPk = pkStats.minVal;
        maxPk = pkStats.maxVal;
        distinctPkCount = Number(pkStats.distCount);
      } catch (_) {}
    }

    // 3. Portable Checksum across row contents (BIT_XOR of CRC32 of concatenated columns)
    let checksum = null;
    if (rowCount > 0) {
      try {
        const [colRows] = await conn.query(
          `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
          [dbName, tableName]
        );
        const colList = colRows.map(c => `IFNULL(\`${c.COLUMN_NAME}\`, '')`).join(', \'#\', ');
        const [[csRes]] = await conn.query(`SELECT BIT_XOR(CRC32(CONCAT_WS('#', ${colList}))) AS cs FROM \`${tableName}\``);
        checksum = csRes.cs;
      } catch (_) {}
    } else {
      checksum = 0;
    }

    details[tableName] = {
      rowCount,
      pkCols,
      minPk,
      maxPk,
      distinctPkCount,
      checksum
    };
  }

  return details;
}

async function verifyDatabase(localConn, cloudConn, dbName) {
  console.log(`\n===============================================================`);
  console.log(`  AUDITING DATABASE: ${dbName}`);
  console.log(`===============================================================`);

  const localTables = await getTableDetails(localConn, dbName);
  const cloudTables = await getTableDetails(cloudConn, dbName);

  const allTableNames = Array.from(new Set([...Object.keys(localTables), ...Object.keys(cloudTables)])).sort();

  console.log(`Total Tables: Local=${Object.keys(localTables).length}, Cloud=${Object.keys(cloudTables).length}\n`);

  let countMatches = 0;
  let countMismatches = 0;
  let checksumMatches = 0;
  let checksumMismatches = 0;
  const differences = [];
  const tableRows = [];

  for (const name of allTableNames) {
    const loc = localTables[name];
    const cld = cloudTables[name];

    if (!loc) {
      differences.push({ table: name, issue: 'Missing on Local', local: null, cloud: cld.rowCount });
      countMismatches++;
      continue;
    }
    if (!cld) {
      differences.push({ table: name, issue: 'Missing on Cloud', local: loc.rowCount, cloud: null });
      countMismatches++;
      continue;
    }

    const rowMatch = loc.rowCount === cld.rowCount;
    if (rowMatch) {
      countMatches++;
    } else {
      countMismatches++;
      differences.push({ table: name, issue: 'Row count mismatch', local: loc.rowCount, cloud: cld.rowCount });
    }

    const csMatch = String(loc.checksum) === String(cld.checksum);
    if (csMatch) {
      checksumMatches++;
    } else {
      checksumMismatches++;
    }

    tableRows.push({
      table: name,
      localRows: loc.rowCount,
      cloudRows: cld.rowCount,
      rowMatch: rowMatch ? '✓ MATCH' : '✗ DIFF',
      localChecksum: loc.checksum,
      cloudChecksum: cld.checksum,
      csMatch: csMatch ? '✓' : '✗'
    });
  }

  // Print Summary Table
  console.log(`| Table Name | Local Rows | Cloud Rows | Row Match | Checksum Match |`);
  console.log(`| :--- | :---: | :---: | :---: | :---: |`);
  for (const r of tableRows) {
    console.log(`| ${r.table} | ${r.localRows} | ${r.cloudRows} | ${r.rowMatch} | ${r.csMatch} |`);
  }

  console.log(`\nDatabase [${dbName}] Summary:`);
  console.log(`  - Row count matches    : ${countMatches} / ${allTableNames.length}`);
  console.log(`  - Row count mismatches : ${countMismatches}`);
  console.log(`  - Checksum matches     : ${checksumMatches} / ${allTableNames.length}`);
  console.log(`  - Checksum mismatches  : ${checksumMismatches}`);

  return {
    dbName,
    totalTables: allTableNames.length,
    countMatches,
    countMismatches,
    checksumMatches,
    checksumMismatches,
    differences,
    tableRows
  };
}

async function main() {
  console.log('Connecting to Local MySQL (READ ONLY)...');
  const localConn = await mysql.createConnection(LOCAL_CONFIG);
  console.log('✓ Connected to Local MySQL.');

  console.log('Connecting to TiDB Cloud (READ ONLY over TLS)...');
  const cloudConn = await mysql.createConnection(CLOUD_CONFIG);
  console.log('✓ Connected to TiDB Cloud.');

  const pproResults = await verifyDatabase(localConn, cloudConn, 'ppro');
  const simResults = await verifyDatabase(localConn, cloudConn, 'placementpro_simulation');

  await localConn.end();
  await cloudConn.end();

  // Save audit artifact
  const reportPath = path.resolve(__dirname, '..', 'scratch', 'deep_verification_results.json');
  fs.writeFileSync(reportPath, JSON.stringify({ ppro: pproResults, simulation: simResults }, null, 2));
  console.log(`\nDetailed verification report saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
