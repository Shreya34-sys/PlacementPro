const mysql = require('../config/db');

async function check() {
  const [cols] = await mysql.query(`
    SELECT 
      k.TABLE_NAME, 
      k.COLUMN_NAME, 
      c1.COLUMN_TYPE AS referencing_type,
      c1.COLLATION_NAME AS referencing_collation,
      k.REFERENCED_TABLE_NAME, 
      k.REFERENCED_COLUMN_NAME,
      c2.COLUMN_TYPE AS referenced_type,
      c2.COLLATION_NAME AS referenced_collation
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.COLUMNS c1 
      ON k.TABLE_SCHEMA = c1.TABLE_SCHEMA AND k.TABLE_NAME = c1.TABLE_NAME AND k.COLUMN_NAME = c1.COLUMN_NAME
    JOIN information_schema.COLUMNS c2 
      ON k.REFERENCED_TABLE_SCHEMA = c2.TABLE_SCHEMA AND k.REFERENCED_TABLE_NAME = c2.TABLE_NAME AND k.REFERENCED_COLUMN_NAME = c2.COLUMN_NAME
    WHERE k.TABLE_SCHEMA = 'ppro' AND k.REFERENCED_TABLE_NAME IS NOT NULL
  `);
  const incompatible = cols.filter(c => c.referencing_type !== c.referenced_type || c.referencing_collation !== c.referenced_collation);
  console.log('Total FKs:', cols.length);
  console.log('Incompatible FKs:', JSON.stringify(incompatible, null, 2));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
