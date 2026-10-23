'use strict';
const mysql = require('mysql2/promise');

async function check() {
  try {
    const conn = await mysql.createConnection({
      host: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: 'kATmXHBV7UPMHc6.root',
      password: '96gu7BGfeH2YRwlq',
      database: 'ppro',
      ssl: { rejectUnauthorized: true }
    });
    const [rows] = await conn.query("SHOW TABLES LIKE 'compiler%'");
    console.log('Compiler tables in cloud DB:', rows);
    const [compRows] = await conn.query("SHOW TABLES LIKE 'compilation%'");
    console.log('Compilation tables in cloud DB:', compRows);
    await conn.end();
  } catch (e) {
    console.error('Cloud DB error:', e.message);
  }
}

check();
