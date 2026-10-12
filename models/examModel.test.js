const assert = require('node:assert/strict');
const test = require('node:test');
const Exam = require('./examModel');

test('ensures importer columns exist in both current and legacy exam schemas', async () => {
  const statements = [];
  const connection = {
    async execute(sql) {
      statements.push(sql);
      if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) return [[], []];
      return [{ affectedRows: 1 }, []];
    }
  };

  await Exam.ensureImportColumns(connection);

  assert.ok(statements.some(sql => sql.includes('ALTER TABLE exam_questions ADD COLUMN explanation')));
  assert.ok(statements.some(sql => sql.includes('ALTER TABLE exam_questions ADD COLUMN difficulty')));
  assert.ok(statements.some(sql => sql.includes('ALTER TABLE exams ADD COLUMN exam_type')));
});

test('does not attempt to add importer columns already present in the database', async () => {
  const statements = [];
  const connection = {
    async execute(sql) {
      statements.push(sql);
      if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) {
        return [[
          { TABLE_NAME: 'exam_questions', COLUMN_NAME: 'explanation' },
          { TABLE_NAME: 'exam_questions', COLUMN_NAME: 'difficulty' },
          { TABLE_NAME: 'exams', COLUMN_NAME: 'exam_type' }
        ], []];
      }
      return [{ affectedRows: 1 }, []];
    }
  };

  await Exam.ensureImportColumns(connection);

  assert.equal(statements.length, 1);
});

test('creates a durable per-admin import fingerprint table', async () => {
  let schemaStatement = '';
  const connection = {
    async execute(sql) {
      schemaStatement = sql;
      return [{ affectedRows: 0 }, []];
    }
  };

  await Exam.ensureImportTable(connection);

  assert.match(schemaStatement, /PRIMARY KEY \(created_by, file_hash\)/);
  assert.match(schemaStatement, /exam_id CHAR\(36\) NULL/);
  assert.match(schemaStatement, /imported_count INT UNSIGNED/);
});
