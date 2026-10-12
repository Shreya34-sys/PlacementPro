const assert = require('node:assert/strict');
const test = require('node:test');
const XLSX = require('xlsx');
const {
  REQUIRED_HEADERS,
  buildTemplateWorkbook,
  parseWorkbook
} = require('./excelQuestionImportService');

function makeWorkbook(rows, bookType = 'xlsx') {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Questions');
  return XLSX.write(workbook, { type: 'buffer', bookType });
}

test('parses every field from the generated aptitude template', async () => {
  const workbook = await buildTemplateWorkbook();
  const result = await parseWorkbook(workbook, 'placementpro-aptitude-template.xlsx');

  assert.equal(result.stats.validRows, 1);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.questions[0], {
    rowNumber: 2,
    question: 'If 20% of a number is 40, what is the number?',
    options: ['100', '200', '400', '800'],
    correctAnswer: 'B',
    explanation: '20% of 200 is 40.',
    topic: 'Quantitative Aptitude',
    difficulty: 'easy',
    marks: 4,
    negativeMarks: 1
  });
});

test('parses .xlsx and .xls, skipping the header and empty rows while preserving row numbers', async () => {
  const rows = [
    REQUIRED_HEADERS,
    ['Valid question', 'A', 'B', 'C', 'D', 'D', 'Explanation', 'Algebra', 'hard', 2, 0.5],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['Invalid question', 'A', 'B', 'C', 'D', 'E', '', 'Algebra', 'easy', 1, 0]
  ];

  for (const [bookType, filename] of [['xlsx', 'sample.xlsx'], ['biff8', 'sample.xls']]) {
    const result = await parseWorkbook(makeWorkbook(rows, bookType), filename);
    assert.deepEqual(result.questions.map(question => question.rowNumber), [2, 4]);
    assert.equal(result.questions[0].correctAnswer, 'D');
    assert.equal(result.stats.emptyRowsSkipped, 1);
    assert.equal(result.stats.validRows, 1);
    assert.equal(result.stats.errorRows, 1);
    assert.equal(result.stats.skippedRows, 2);
    assert.ok(result.errors.some(error => error.row === 4 && error.field === 'Correct Answer'));
    assert.equal(result.questions[0].negativeMarks, 0.5);
  }
});

test('reports missing required columns instead of saving unmapped rows', async () => {
  const result = await parseWorkbook(
    makeWorkbook([['Question', 'Option A'], ['Question text', 'Answer']]),
    'missing-columns.xlsx'
  );

  assert.equal(result.stats.validRows, 0);
  assert.ok(result.errors.some(error => error.field === 'Header' && error.message.includes('Correct Answer')));
});

test('accepts omitted optional columns and common alternative header labels', async () => {
  const result = await parseWorkbook(
    makeWorkbook([
      ['Question', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Answer'],
      ['What is 2 + 2?', '3', '4', '5', '6', '4'],
      ['', '', '', '', '', '']
    ]),
    'minimal-template.xlsx'
  );

  assert.equal(result.stats.validRows, 1);
  assert.equal(result.stats.emptyRowsSkipped, 1);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.questions[0], {
    rowNumber: 2,
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 'B',
    explanation: '',
    topic: 'General',
    difficulty: 'medium',
    marks: 1,
    negativeMarks: null
  });
});

test('rejects unsupported and unreadable Excel files with actionable errors', async () => {
  await assert.rejects(
    parseWorkbook(Buffer.from('not a workbook'), 'questions.csv'),
    /Upload an Excel file/
  );
  await assert.rejects(
    parseWorkbook(Buffer.from('not a workbook'), 'questions.xlsx'),
    /valid \.xlsx Excel workbook/
  );
});
