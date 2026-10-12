const JSZip = require('jszip');

const REQUIRED_HEADERS = [
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Correct Answer',
  'Explanation',
  'Topic',
  'Difficulty',
  'Marks',
  'Negative Marks'
];

const HEADER_KEYS = {
  question: 'question',
  optiona: 'optionA',
  optionb: 'optionB',
  optionc: 'optionC',
  optiond: 'optionD',
  correctanswer: 'correctAnswer',
  correctoption: 'correctAnswer',
  correctchoice: 'correctAnswer',
  answer: 'correctAnswer',
  option1: 'optionA',
  option2: 'optionB',
  option3: 'optionC',
  option4: 'optionD',
  explanation: 'explanation',
  topic: 'topic',
  category: 'topic',
  difficulty: 'difficulty',
  level: 'difficulty',
  marks: 'marks',
  mark: 'marks',
  negativemarks: 'negativeMarks',
  negativemarking: 'negativeMarks'
};

const OPTION_INDEX = { A: 0, B: 1, C: 2, D: 3 };
const MAX_IMPORT_ROWS = 500;
const REQUIRED_HEADER_KEYS = [
  'question',
  'optionA',
  'optionB',
  'optionC',
  'optionD',
  'correctAnswer'
];

function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeText(value) {
  return clean(value).toLowerCase().replace(/\s+/g, ' ');
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseCorrectAnswer(value, options) {
  const raw = clean(value);
  const upper = raw.toUpperCase().replace(/^OPTION\s+/, '');
  if (OPTION_INDEX[upper] !== undefined) return OPTION_INDEX[upper];
  const optionTextIndex = options.findIndex(option => normalizeText(option) === normalizeText(raw));
  if (optionTextIndex >= 0) return optionTextIndex;
  const match = raw.match(/^[1-4]$/);
  if (match) return Number(raw) - 1;
  return null;
}

function validateQuestionRows(rows, { headerErrors = [], emptyRowsSkipped = 0 } = {}) {
  const errors = [...headerErrors];
  const questions = [];
  const validQuestions = [];
  const duplicateKeys = new Map();
  const negativeMarks = new Set();

  if (!rows.length) {
    errors.push({ row: 1, field: 'File', message: 'The spreadsheet does not contain any question rows.' });
    return {
      questions,
      validQuestions,
      errors,
      stats: { totalRows: 0, validRows: 0, errorRows: 0, emptyRowsSkipped, skippedRows: emptyRowsSkipped },
      negativeMarking: null
    };
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    errors.push({ row: 1, field: 'File', message: `A maximum of ${MAX_IMPORT_ROWS} questions can be imported at once.` });
  }

  rows.slice(0, MAX_IMPORT_ROWS).forEach((row, index) => {
    const rowNumber = row.__rowNumber || index + 2;
    const rowErrors = [];
    const question = clean(row.question);
    const options = [row.optionA, row.optionB, row.optionC, row.optionD].map(clean);
    const correctIndex = parseCorrectAnswer(row.correctAnswer, options);
    const marks = clean(row.marks) ? parseNumber(row.marks) : 1;
    const negative = parseNumber(row.negativeMarks);
    const difficulty = clean(row.difficulty || 'medium').toLowerCase();
    const topic = clean(row.topic || 'General');
    const duplicateKey = [question, ...options].map(normalizeText).join('|');

    if (!question) rowErrors.push({ field: 'Question', message: 'Question is required.' });
    options.forEach((option, optionIndex) => {
      if (!option) rowErrors.push({ field: `Option ${String.fromCharCode(65 + optionIndex)}`, message: 'All four options are required.' });
    });
    if (correctIndex === null || correctIndex < 0 || correctIndex > 3) {
      rowErrors.push({ field: 'Correct Answer', message: 'Use A, B, C, D, 1-4, or the exact option text.' });
    }
    if (marks === null || marks <= 0 || marks > 100) {
      rowErrors.push({ field: 'Marks', message: 'Marks must be a number greater than 0 and at most 100.' });
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      rowErrors.push({ field: 'Difficulty', message: 'Difficulty must be easy, medium, or hard.' });
    }
    if (negative !== null && (negative < 0 || negative > 100)) {
      rowErrors.push({ field: 'Negative Marks', message: 'Negative marks must be 0 or a positive number at most 100.' });
    }
    if (question && options.every(Boolean)) {
      if (duplicateKeys.has(duplicateKey)) {
        rowErrors.push({ field: 'Question', message: `Duplicate of row ${duplicateKeys.get(duplicateKey)}.` });
      } else {
        duplicateKeys.set(duplicateKey, rowNumber);
      }
    }
    if (negative !== null) negativeMarks.add(String(negative));

    rowErrors.forEach(error => errors.push({ row: rowNumber, ...error }));
    const parsedQuestion = {
      rowNumber,
      question,
      options,
      correctAnswer: correctIndex === null ? '' : String.fromCharCode(65 + correctIndex),
      explanation: clean(row.explanation),
      topic,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      marks: marks ?? 1,
      negativeMarks: negative
    };
    questions.push(parsedQuestion);
    if (!rowErrors.length) validQuestions.push(parsedQuestion);
  });

  if (negativeMarks.size > 1) {
    errors.push({
      row: 1,
      field: 'Negative Marks',
      message: 'This test system supports one negative marking value per exam. Use the same value in every row or set it once in the import form.'
    });
  }

  const rowsWithErrors = new Set(errors.filter(error => error.row > 1).map(error => error.row));
  const validRows = questions.length - rowsWithErrors.size;
  return {
    questions,
    validQuestions,
    errors,
    stats: {
      totalRows: rows.length,
      validRows,
      errorRows: rowsWithErrors.size,
      emptyRowsSkipped,
      skippedRows: rowsWithErrors.size + emptyRowsSkipped
    },
    negativeMarking: negativeMarks.size === 1 ? Number([...negativeMarks][0]) : null
  };
}

function rowsFromSheetJs(buffer) {
  const XLSX = require('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('The workbook has no worksheets.');
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: true });
  return rowsFromMatrix(matrix);
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function columnIndex(cellRef) {
  const letters = String(cellRef || '').replace(/[0-9]/g, '');
  return letters.split('').reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

async function rowsFromXlsxZip(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedXml = zip.file('xl/sharedStrings.xml') ? await zip.file('xl/sharedStrings.xml').async('text') : '';
  const sharedStrings = [];
  sharedXml.replace(/<si[\s\S]*?<\/si>/g, item => {
    const parts = [...item.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(match => decodeXml(match[1]));
    sharedStrings.push(parts.join(''));
    return item;
  });

  const workbookXml = await zip.file('xl/workbook.xml').async('text');
  const firstSheet = workbookXml.match(/<sheet[^>]+r:id="([^"]+)"/);
  const relId = firstSheet && firstSheet[1];
  let sheetPath = 'xl/worksheets/sheet1.xml';
  if (relId && zip.file('xl/_rels/workbook.xml.rels')) {
    const relsXml = await zip.file('xl/_rels/workbook.xml.rels').async('text');
    const relMatch = relsXml.match(new RegExp(`<Relationship[^>]+Id="${relId}"[^>]+Target="([^"]+)"`));
    if (relMatch) sheetPath = `xl/${relMatch[1].replace(/^\/?xl\//, '')}`;
  }

  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) return [];
  const sheetXml = await sheetFile.async('text');
  const matrix = [];
  sheetXml.replace(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g, (_, rowNumber, rowXml) => {
    const rowIndex = Number(rowNumber) - 1;
    matrix[rowIndex] = matrix[rowIndex] || [];
    rowXml.replace(/<c[^>]*r="([^"]+)"[^>]*(?:t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g, (cell, ref, type, cellXml) => {
      const valueMatch = cellXml.match(/<v[^>]*>([\s\S]*?)<\/v>/);
      const inlineMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      let value = valueMatch ? decodeXml(valueMatch[1]) : decodeXml(inlineMatch && inlineMatch[1]);
      if (type === 's') value = sharedStrings[Number(value)] || '';
      matrix[rowIndex][columnIndex(ref)] = value;
      return cell;
    });
    return rowXml;
  });

  return rowsFromMatrix(matrix);
}

function rowsFromMatrix(matrix) {
  const headerRowIndex = matrix.findIndex(row => row && row.some(cell => clean(cell)));
  if (headerRowIndex < 0) return { rows: [], headerErrors: [], emptyRowsSkipped: 0 };
  const headers = matrix[headerRowIndex].map(normalizeHeader);
  const mappedHeaders = headers.map(header => HEADER_KEYS[header] || null);
  const foundHeaders = new Set(mappedHeaders.filter(Boolean));
  const headerErrors = REQUIRED_HEADER_KEYS
    .filter(key => !foundHeaders.has(key))
    .map(key => ({
      row: headerRowIndex + 1,
      field: 'Header',
      message: `Required column "${REQUIRED_HEADERS.find((header, index) => HEADER_KEYS[normalizeHeader(header)] === key) || key}" is missing.`
    }));
  const rows = [];
  let emptyRowsSkipped = 0;
  for (let index = headerRowIndex + 1; index < matrix.length; index += 1) {
    const source = matrix[index] || [];
    if (!source.some(cell => clean(cell))) {
      emptyRowsSkipped += 1;
      continue;
    }
    const row = { __rowNumber: index + 1 };
    mappedHeaders.forEach((key, cellIndex) => {
      if (key) row[key] = source[cellIndex];
    });
    rows.push(row);
  }
  return { rows, headerErrors, emptyRowsSkipped };
}

async function parseWorkbook(buffer, filename = '') {
  const extension = filename.toLowerCase().split('.').pop();
  if (!['xlsx', 'xls'].includes(extension)) {
    const error = new Error('Upload an Excel file with .xlsx or .xls extension.');
    error.status = 400;
    throw error;
  }
  const signature = Buffer.from(buffer).subarray(0, 8);
  const isXlsx = signature[0] === 0x50 && signature[1] === 0x4b;
  const isXls = signature.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  const isXmlSpreadsheet = extension === 'xls' && /^\s*</.test(Buffer.from(buffer).toString('utf8', 0, 128));
  if ((extension === 'xlsx' && !isXlsx) || (extension === 'xls' && !isXls && !isXlsx && !isXmlSpreadsheet)) {
    const error = new Error(`The uploaded file does not contain a valid .${extension} Excel workbook.`);
    error.status = 400;
    throw error;
  }

  try {
    const parsed = rowsFromSheetJs(buffer);
    return validateQuestionRows(parsed.rows, parsed);
  } catch (error) {
    if (extension === 'xls') {
      const xlsError = new Error('The .xls file could not be parsed. Please confirm it is a valid Excel workbook or save it as .xlsx.');
      xlsError.status = 400;
      xlsError.cause = error;
      throw xlsError;
    }
    try {
      const parsed = await rowsFromXlsxZip(buffer);
      return validateQuestionRows(parsed.rows, parsed);
    } catch (fallbackError) {
      const parseError = new Error('The Excel file could not be read. Download the template and upload a valid .xlsx file.');
      parseError.status = 400;
      parseError.cause = fallbackError;
      throw parseError;
    }
  }
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildTemplateWorkbook() {
  const rows = [
    REQUIRED_HEADERS,
    [
      'If 20% of a number is 40, what is the number?',
      '100',
      '200',
      '400',
      '800',
      'B',
      '20% of 200 is 40.',
      'Quantitative Aptitude',
      'easy',
      '4',
      '1'
    ]
  ];
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, column) => {
      const ref = `${String.fromCharCode(65 + column)}${rowIndex + 1}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.folder('xl').file('workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Questions" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.folder('xl').folder('_rels').file('workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.folder('xl').folder('worksheets').file('sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = {
  REQUIRED_HEADERS,
  parseWorkbook,
  validateQuestionRows,
  buildTemplateWorkbook
};
