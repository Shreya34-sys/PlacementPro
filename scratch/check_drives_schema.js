const db = require('../config/db');

async function main() {
  const [cols] = await db.execute('DESCRIBE drives');
  console.log('DRIVES COLS:', cols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
  const [rCols] = await db.execute('DESCRIBE drive_rounds');
  console.log('DRIVE ROUNDS COLS:', rCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
