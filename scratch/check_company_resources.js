const db = require('../config/db');

async function main() {
  const [res] = await db.execute('SELECT * FROM company_resources LIMIT 10');
  console.log('COMPANY RESOURCES:', res);
  const [docs] = await db.execute('SELECT * FROM company_documents LIMIT 10');
  console.log('COMPANY DOCUMENTS:', docs);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
