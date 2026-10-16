const db = require('../config/db');

async function main() {
  const [sets] = await db.execute('SELECT id, created_by, title, category, company_name, status, deadline, deleted_at FROM interview_sets');
  console.log('SETS:', sets);
  const [assignments] = await db.execute('SELECT id, set_id, assigned_by, target_type, target_student_id, deadline, max_attempts, status FROM interview_assignments');
  console.log('ASSIGNMENTS:', assignments);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
