require('dotenv').config();
const db = require('../config/db');

async function migrate() {
  const [cols] = await db.execute(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_topics'
  `);
  const names = cols.map(c => c.COLUMN_NAME);

  if (!names.includes('video_url')) {
    await db.execute(`ALTER TABLE study_topics ADD COLUMN video_url VARCHAR(500) NULL AFTER summary`);
    console.log('Added video_url');
  }
  if (!names.includes('video_title')) {
    await db.execute(`ALTER TABLE study_topics ADD COLUMN video_title VARCHAR(255) NULL AFTER video_url`);
    console.log('Added video_title');
  }
  if (!names.includes('video_source')) {
    await db.execute(`ALTER TABLE study_topics ADD COLUMN video_source VARCHAR(120) NULL AFTER video_title`);
    console.log('Added video_source');
  }
  if (!names.includes('video_objective')) {
    await db.execute(`ALTER TABLE study_topics ADD COLUMN video_objective TEXT NULL AFTER video_source`);
    console.log('Added video_objective');
  }

  // Ensure Discrete Mathematics subject exists
  const [dm] = await db.execute(`SELECT id FROM study_subjects WHERE code = 'discrete-mathematics' AND deleted_at IS NULL`);
  if (!dm.length) {
    const { randomUUID } = require('crypto');
    const [admins] = await db.execute(`SELECT id FROM users WHERE role IN ('admin', 'faculty') LIMIT 1`);
    const authorId = admins[0]?.id || '8b964856-ee3c-45cd-a048-7d4a991734c3';

    await db.execute(`
      INSERT INTO study_subjects (id, name, code, category, description, icon, color, display_order, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `, [
      randomUUID(),
      'Discrete Mathematics',
      'discrete-mathematics',
      'Theory',
      'Set theory, propositional logic, relations, combinatorics, graph theory, and recurrence relations for algorithmic analysis.',
      'layers',
      '#7c3aed',
      15,
      authorId
    ]);
    console.log('Added Discrete Mathematics subject');
  }

  console.log('Migration verified successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
