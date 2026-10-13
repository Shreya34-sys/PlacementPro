const JSZip = require('jszip');

const HEADERS = [
  'Question',
  'Reference Answer',
  'Evaluation Criteria',
  'Category',
  'Topic',
  'Difficulty',
  'Marks',
  'Preparation Time Seconds',
  'Answer Time Seconds'
];

const HEADER_KEYS = {
  question: 'question',
  referenceanswer: 'referenceAnswer',
  evaluationcriteria: 'evaluationCriteria',
  category: 'category',
  topic: 'topic',
  difficulty: 'difficulty',
  marks: 'marks',
  preparationtimeseconds: 'preparationTimeSeconds',
  answertimeseconds: 'answerTimeSeconds'
};

function clean(value) { return String(value ?? '').trim(); }
function normalizeHeader(value) { return clean(value).toLowerCase().replace(/[^a-z]/g, ''); }
function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function normalizeCategory(value) {
  const category = clean(value || 'hr').toLowerCase();
  if (['hr', 'technical', 'behavioral'].includes(category)) return category;
  if (['company', 'company-specific', 'company specific'].includes(category)) return 'company';
  return category;
}

function validateRows(rows) {
  const errors = [];
  const questions = [];
  const seen = new Map();

  if (!rows.length) {
    errors.push({ row: 1, field: 'File', message: 'The spreadsheet does not contain any interview questions.' });
    return { questions, errors, stats: { totalRows: 0, validRows: 0, errorRows: 0 } };
  }

  rows.forEach((row, index) => {
    const rowNumber = row.__rowNumber || index + 2;
    const question = clean(row.question);
    const category = normalizeCategory(row.category);
    const difficulty = clean(row.difficulty || 'medium').toLowerCase();
    const marks = numberOrNull(row.marks);
    const prep = numberOrNull(row.preparationTimeSeconds);
    const answer = numberOrNull(row.answerTimeSeconds);
    const rowErrors = [];
    const duplicateKey = `${question.toLowerCase().replace(/\s+/g, ' ')}|${category}|${clean(row.topic || 'General').toLowerCase()}`;

    if (!question) rowErrors.push({ field: 'Question', message: 'Question text is required.' });
    if (!['hr', 'technical', 'behavioral', 'company'].includes(category)) rowErrors.push({ field: 'Category', message: 'Use HR, Technical, Behavioral, or Company-Specific.' });
    if (!['easy', 'medium', 'hard'].includes(difficulty)) rowErrors.push({ field: 'Difficulty', message: 'Use easy, medium, or hard.' });
    if (marks === null || marks <= 0 || marks > 100) rowErrors.push({ field: 'Marks', message: 'Marks must be a number from 1 to 100.' });
    if (prep !== null && (prep < 0 || prep > 1800)) rowErrors.push({ field: 'Preparation Time Seconds', message: 'Preparation time must be between 0 and 1800 seconds.' });
    if (answer !== null && (answer < 15 || answer > 3600)) rowErrors.push({ field: 'Answer Time Seconds', message: 'Answer time must be between 15 and 3600 seconds.' });
    if (question) {
      if (seen.has(duplicateKey)) rowErrors.push({ field: 'Question', message: `Duplicate of row ${seen.get(duplicateKey)}.` });
      else seen.set(duplicateKey, rowNumber);
    }

    rowErrors.forEach(error => errors.push({ row: rowNumber, ...error }));
    questions.push({
      rowNumber,
      question,
      referenceAnswer: clean(row.referenceAnswer),
      evaluationCriteria: clean(row.evaluationCriteria),
      category: ['hr', 'technical', 'behavioral', 'company'].includes(category) ? category : 'hr',
      topic: clean(row.topic || 'General'),
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      marks: marks ?? 10,
      preparationTimeSeconds: prep ?? 30,
      answerTimeSeconds: answer ?? 180
    });
  });

  const rowsWithErrors = new Set(errors.filter(error => error.row > 1).map(error => error.row));
  return { questions, errors, stats: { totalRows: rows.length, validRows: questions.length - rowsWithErrors.size, errorRows: rowsWithErrors.size } };
}

function rowsFromSheetJs(buffer) {
  const XLSX = require('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return rowsFromMatrix(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }));
}

function decodeXml(value) {
  return clean(value).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}
function columnIndex(cellRef) {
  return clean(cellRef).replace(/[0-9]/g, '').split('').reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}
async function rowsFromXlsxZip(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedXml = zip.file('xl/sharedStrings.xml') ? await zip.file('xl/sharedStrings.xml').async('text') : '';
  const shared = [];
  sharedXml.replace(/<si[\s\S]*?<\/si>/g, item => {
    shared.push([...item.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(match => decodeXml(match[1])).join(''));
    return item;
  });
  const sheetFile = zip.file('xl/worksheets/sheet1.xml');
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
      if (type === 's') value = shared[Number(value)] || '';
      matrix[rowIndex][columnIndex(ref)] = value;
      return cell;
    });
    return rowXml;
  });
  return rowsFromMatrix(matrix);
}

function rowsFromMatrix(matrix) {
  const rows = matrix.filter(row => row && row.some(cell => clean(cell)));
  if (!rows.length) return [];
  const keys = rows[0].map(header => HEADER_KEYS[normalizeHeader(header)] || null);
  return rows.slice(1).filter(row => row.some(cell => clean(cell))).map((row, index) => {
    const item = { __rowNumber: index + 2 };
    keys.forEach((key, columnIndexValue) => { if (key) item[key] = row[columnIndexValue]; });
    return item;
  });
}

async function parseWorkbook(buffer, filename = '') {
  const extension = filename.toLowerCase().split('.').pop();
  if (!['xlsx', 'xls'].includes(extension)) {
    const error = new Error('Upload an Excel file with .xlsx or .xls extension.');
    error.status = 400;
    throw error;
  }
  try {
    return validateRows(rowsFromSheetJs(buffer));
  } catch (error) {
    if (extension === 'xls') {
      const xlsError = new Error('Legacy .xls parsing requires the xlsx package. Please install dependencies or upload .xlsx.');
      xlsError.status = 400;
      throw xlsError;
    }
    try { return validateRows(await rowsFromXlsxZip(buffer)); }
    catch {
      const parseError = new Error('The Excel file could not be read. Download the template and upload a valid .xlsx file.');
      parseError.status = 400;
      throw parseError;
    }
  }
}

function escapeXml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
async function buildTemplateWorkbook() {
  const rows = [HEADERS, ['Tell me about yourself.', 'A concise profile, strengths, and placement goal.', 'Structure, clarity, confidence, relevance', 'HR', 'Introduction', 'easy', '10', '30', '180']];
  const sheetRows = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, column) => `<c r="${String.fromCharCode(65 + column)}${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`).join('')}</row>`).join('');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.folder('xl').file('workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Interview Questions" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.folder('xl').folder('_rels').file('workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.folder('xl').folder('worksheets').file('sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { parseWorkbook, validateRows, buildTemplateWorkbook };
