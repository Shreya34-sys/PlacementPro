const token = localStorage.getItem('adminToken');

if (!token) {
  window.location.replace('/admin-login');
}

const state = {
  questions: [],
  errors: [],
  fileErrors: [],
  importFingerprint: '',
  emptyRowsSkipped: 0,
  previewStats: null,
  saving: false
};

const uploadForm = document.getElementById('uploadForm');
const excelFile = document.getElementById('excelFile');
const fileName = document.getElementById('fileName');
const previewButton = document.getElementById('previewButton');
const saveButton = document.getElementById('saveButton');
const templateButton = document.getElementById('templateButton');
const previewList = document.getElementById('previewList');
const summaryPanel = document.getElementById('summaryPanel');
const errorsPanel = document.getElementById('errorsPanel');
const target = document.getElementById('target');
const examId = document.getElementById('examId');

function initDefaultDates() {
  const startsAtInput = document.getElementById('startsAt');
  const endsAtInput = document.getElementById('endsAt');
  if (startsAtInput && !startsAtInput.value) {
    const now = new Date();
    now.setSeconds(0, 0);
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - tzOffset);
    startsAtInput.value = localNow.toISOString().slice(0, 16);
  }
  if (endsAtInput && !endsAtInput.value) {
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    end.setSeconds(0, 0);
    const tzOffset = end.getTimezoneOffset() * 60000;
    const localEnd = new Date(end.getTime() - tzOffset);
    endsAtInput.value = localEnd.toISOString().slice(0, 16);
  }
}

function prefillTitleFromFile(file) {
  const titleInput = document.getElementById('title');
  if (file && titleInput && !titleInput.value.trim()) {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const cleanTitle = baseName.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanTitle) {
      titleInput.value = cleanTitle;
    }
  }
}

excelFile.addEventListener('change', () => {
  const file = excelFile.files[0];
  fileName.textContent = file ? file.name : 'No file selected';
  state.importFingerprint = '';
  state.questions = [];
  state.errors = [];
  state.fileErrors = [];
  state.emptyRowsSkipped = 0;
  state.previewStats = null;
  if (file) {
    prefillTitleFromFile(file);
    initDefaultDates();
  }
  renderSummary();
  renderErrors();
  renderPreview();
});

templateButton.addEventListener('click', async () => {
  setLoading(templateButton, true, 'Downloading...');
  try {
    const response = await fetch('/api/exams/import/template', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Unable to download the Excel template.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'placementpro-aptitude-template.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    state.errors = [{ row: 1, field: 'Template', message: error.message }];
    renderErrors();
  } finally {
    setLoading(templateButton, false, 'Download Excel Template');
  }
});

target.addEventListener('change', () => {
  document.querySelectorAll('.new-only').forEach(element => element.classList.toggle('hidden', target.value === 'existing'));
  document.querySelectorAll('.existing-only').forEach(element => element.classList.toggle('hidden', target.value !== 'existing'));
});

uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!excelFile.files[0]) return;
  setLoading(previewButton, true, 'Previewing...');

  const body = new FormData();
  body.append('file', excelFile.files[0]);

  try {
    const response = await fetch('/api/exams/import/preview', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to parse Excel file.');
    state.questions = data.questions || [];
    state.errors = data.errors || [];
    state.fileErrors = state.errors.filter(error => error.field === 'Header' || error.field === 'File');
    state.importFingerprint = data.importFingerprint || '';
    state.emptyRowsSkipped = data.stats?.emptyRowsSkipped || 0;
    state.previewStats = data.stats || null;
    if (data.negativeMarking !== null && data.negativeMarking !== undefined) {
      document.getElementById('negativeMarking').value = data.negativeMarking;
    }
    if (excelFile.files[0]) {
      prefillTitleFromFile(excelFile.files[0]);
    }
    initDefaultDates();
    renderSummary(data.stats);
    renderErrors();
    renderPreview();
  } catch (error) {
    state.questions = [];
    state.errors = [{ row: 1, field: 'File', message: error.message }];
    state.fileErrors = state.errors.slice();
    state.importFingerprint = '';
    state.previewStats = null;
    renderSummary();
    renderErrors();
    renderPreview();
  } finally {
    setLoading(previewButton, false, 'Preview Questions');
  }
});

previewList.addEventListener('input', event => {
  const card = event.target.closest('.preview-card');
  if (!card) return;
  updateQuestionFromCard(card);
});

previewList.addEventListener('change', event => {
  const card = event.target.closest('.preview-card');
  if (!card) return;
  updateQuestionFromCard(card);
});

previewList.addEventListener('click', event => {
  const removeButton = event.target.closest('.remove-import-row');
  if (!removeButton) return;
  const index = Number(removeButton.dataset.index);
  state.questions.splice(index, 1);
  state.errors = validateQuestions(state.questions);
  renderSummary();
  renderErrors();
  renderPreview();
});

saveButton.addEventListener('click', async () => {
  if (state.saving || !state.questions.length) return;
  const metadataErrors = validateSaveMetadata();
  if (metadataErrors.length) {
    state.errors = [
      ...metadataErrors.map(message => ({ row: 1, field: 'Question Set', message })),
      ...state.errors.filter(error => error.field !== 'Question Set')
    ];
    renderErrors();
    renderSummary();
    if (errorsPanel) errorsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  state.saving = true;
  setLoading(saveButton, true, 'Saving...');

  try {
    const response = await fetch('/api/exams/import/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(buildSavePayload())
    });
    const data = await response.json();
    if (!response.ok) {
      state.errors = data.errors || [];
      renderMetadataErrors(data.metadataErrors || []);
      if (!state.errors.length && data.message) {
        state.errors.push({ row: 1, field: 'Import Error', message: data.message });
      }
      renderErrors();
      renderSummary(data.stats);
      renderPreview();
      if (data.fingerprintErrors?.length) {
        state.errors.push(...data.fingerprintErrors.map(message => ({ row: 1, field: 'File', message })));
        renderErrors();
      }
      if (errorsPanel) errorsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (!data.duplicate && (!Number.isFinite(Number(data.importedCount)) || Number(data.importedCount) < 1)) {
      throw new Error(data.message || 'The server saved no questions.');
    }
    summaryPanel.classList.remove('hidden');
    summaryPanel.textContent = data.duplicate
      ? 'This file was already imported into this question set. No questions were added.'
      : `Success! ${data.importedCount} questions successfully imported. Redirecting to Question Bank...`;
    summaryPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    state.errors = data.errors || [];
    state.importFingerprint = '';
    renderErrors();
    renderPreviewControls();
    setTimeout(() => window.location.assign('/pages/admin-exams.html'), 1800);
  } catch (error) {
    state.errors = [{ row: 1, field: 'Save', message: error.message || 'Unable to save imported questions.' }];
    renderErrors();
    if (errorsPanel) errorsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } finally {
    state.saving = false;
    saveButton.textContent = 'Save Imported Questions';
    renderPreviewControls();
  }
});

async function loadExistingExams() {
  try {
    const response = await fetch('/api/exams/admin', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Unable to load existing question sets (HTTP ${response.status}).`);
    const exams = data;
    examId.innerHTML = exams.map(exam => `<option value="${escapeHtml(exam.id)}">${escapeHtml(exam.title)}</option>`).join('');
  } catch (error) {
    console.error('Unable to load question sets:', error);
    examId.innerHTML = '<option value="">Unable to load question sets</option>';
    state.errors = [{ row: 1, field: 'Question Set', message: error.message || 'Unable to load existing question sets.' }];
    renderErrors();
  }
}

function buildSavePayload() {
  return {
    importFingerprint: state.importFingerprint,
    emptyRowsSkipped: state.emptyRowsSkipped,
    target: target.value,
    examId: examId.value,
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    durationMinutes: Number(document.getElementById('durationMinutes').value),
    startsAt: document.getElementById('startsAt').value,
    endsAt: document.getElementById('endsAt').value,
    status: document.getElementById('status').value,
    negativeMarking: Number(document.getElementById('negativeMarking').value),
    questions: state.questions
  };
}

function validateSaveMetadata() {
  if (target.value === 'existing') {
    return examId.value ? [] : ['Choose an existing question set.'];
  }

  const errors = [];
  const title = document.getElementById('title').value.trim();
  const duration = Number(document.getElementById('durationMinutes').value);
  let startsAt = document.getElementById('startsAt').value;
  let endsAt = document.getElementById('endsAt').value;

  if (!startsAt || !endsAt) {
    initDefaultDates();
    startsAt = document.getElementById('startsAt').value;
    endsAt = document.getElementById('endsAt').value;
  }

  if (!title) errors.push('Question set title is required.');
  // Description is optional
  if (!Number.isFinite(duration) || duration < 1) errors.push('Duration must be at least 1 minute.');
  if (!startsAt) errors.push('Start date and time is required.');
  if (!endsAt) errors.push('End date and time is required.');
  if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
    errors.push('End date must be after start date.');
  }
  return errors;
}

function updateQuestionFromCard(card) {
  const index = Number(card.dataset.index);
  const question = state.questions[index];
  question.question = card.querySelector('.question-input').value.trim();
  question.options = [...card.querySelectorAll('.option-input')].map(input => input.value.trim());
  question.correctAnswer = card.querySelector('.correct-answer').value;
  question.explanation = card.querySelector('.explanation-input').value.trim();
  question.topic = card.querySelector('.topic-input').value.trim();
  question.difficulty = card.querySelector('.difficulty-input').value;
  question.marks = Number(card.querySelector('.marks-input').value);
  const negativeMarksValue = card.querySelector('.negative-marks-input').value;
  question.negativeMarks = negativeMarksValue === '' ? null : Number(negativeMarksValue);
  const rowNegativeMarks = [...new Set(state.questions
    .map(item => item.negativeMarks)
    .filter(value => value !== null && value !== undefined && Number.isFinite(Number(value)))
    .map(Number))];
  if (rowNegativeMarks.length === 1) {
    document.getElementById('negativeMarking').value = rowNegativeMarks[0];
  }
  state.errors = validateQuestions(state.questions);
  renderSummary();
  renderErrors();
  renderPreviewControls();
}

function renderSummary(stats) {
  if (stats) state.previewStats = stats;
  if (!state.questions.length && !stats) {
    summaryPanel.classList.add('hidden');
    return;
  }
  const activeStats = stats || state.previewStats;
  const invalidRows = new Set(state.errors.filter(error => error.row > 1).map(error => error.row));
  const totalRows = activeStats ? activeStats.totalRows : state.questions.length;
  const validRows = activeStats
    ? state.questions.filter(question => !invalidRows.has(question.rowNumber)).length
    : state.questions.length - invalidRows.size;
  const skippedRows = activeStats
    ? Math.max(0, totalRows - validRows) + state.emptyRowsSkipped
    : invalidRows.size + state.emptyRowsSkipped;
  summaryPanel.classList.remove('hidden');
  summaryPanel.textContent = `${totalRows} question rows parsed. ${validRows} valid; ${skippedRows} rows will be skipped. ${state.errors.length} validation issue${state.errors.length === 1 ? '' : 's'} found.`;
}

function renderMetadataErrors(metadataErrors) {
  if (!metadataErrors.length) return;
  state.errors = [
    ...metadataErrors.map(message => ({ row: 1, field: 'Question Set', message })),
    ...state.errors
  ];
}

function renderErrors() {
  if (!state.errors.length) {
    errorsPanel.classList.add('hidden');
    return;
  }
  errorsPanel.classList.remove('hidden');
  errorsPanel.innerHTML = `
    <strong>Validation issues:</strong>
    <ul>${state.errors.map(error => `<li>Row ${error.row}: ${escapeHtml(error.field)} - ${escapeHtml(error.message)}</li>`).join('')}</ul>
  `;
}

function renderPreview() {
  renderPreviewControls();
  if (!state.questions.length) {
    previewList.innerHTML = '<div class="empty-preview">Upload an Excel file to preview questions.</div>';
    return;
  }
  previewList.innerHTML = state.questions.map((question, index) => renderQuestionCard(question, index)).join('');
}

function renderPreviewControls() {
  const invalidRows = new Set(state.errors.filter(error => error.row > 1).map(error => error.row));
  const hasFileErrors = state.errors.some(error =>
    error.field === 'Header' || error.field === 'File' ||
    (error.row === 1 && error.field === 'Negative Marks')
  );
  const validQuestionCount = state.questions.filter(question => !invalidRows.has(question.rowNumber)).length;
  saveButton.disabled = state.saving || !state.importFingerprint || !validQuestionCount || hasFileErrors;
}

function validateQuestions(questions) {
  const errors = state.fileErrors.slice();
  const seen = new Map();
  questions.forEach((question, index) => {
    const row = question.rowNumber || index + 2;
    if (!question.question) errors.push({ row, field: 'Question', message: 'Question is required.' });
    question.options.forEach((option, optionIndex) => {
      if (!option) errors.push({ row, field: `Option ${String.fromCharCode(65 + optionIndex)}`, message: 'All four options are required.' });
    });
    if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
      errors.push({ row, field: 'Correct Answer', message: 'Choose A, B, C, or D.' });
    }
    if (!['easy', 'medium', 'hard'].includes(question.difficulty)) {
      errors.push({ row, field: 'Difficulty', message: 'Choose easy, medium, or hard.' });
    }
    if (!Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0) {
      errors.push({ row, field: 'Marks', message: 'Marks must be greater than 0.' });
    }
    if (question.negativeMarks !== null && question.negativeMarks !== undefined &&
      (!Number.isFinite(Number(question.negativeMarks)) || Number(question.negativeMarks) < 0 || Number(question.negativeMarks) > 100)) {
      errors.push({ row, field: 'Negative Marks', message: 'Negative marks must be 0 or a positive number at most 100.' });
    }
    const key = [question.question, ...question.options].map(value => String(value || '').trim().toLowerCase()).join('|');
    if (question.question && question.options.every(Boolean)) {
      if (seen.has(key)) errors.push({ row, field: 'Question', message: `Duplicate of row ${seen.get(key)}.` });
      else seen.set(key, row);
    }
  });
  const negativeMarkValues = new Set(questions
    .map(question => question.negativeMarks)
    .filter(value => value !== null && value !== undefined && Number.isFinite(Number(value)))
    .map(value => String(Number(value))));
  if (negativeMarkValues.size > 1) {
    errors.push({
      row: 1,
      field: 'Negative Marks',
      message: 'This test system supports one negative marking value per exam. Use the same value in every row or set it once in the import form.'
    });
  }
  return errors;
}

function renderQuestionCard(question, index) {
  const rowErrors = state.errors.filter(error => error.row === question.rowNumber);
  return `
    <article class="preview-card ${rowErrors.length ? 'has-error' : ''}" data-index="${index}">
      <div class="preview-top">
        <span class="row-pill">Row ${question.rowNumber}</span>
        <button class="btn btn-danger remove-import-row" type="button" data-index="${index}">Remove</button>
      </div>
      <div class="preview-fields">
        <div class="form-group">
          <label>Question</label>
          <textarea class="form-control question-input" rows="2">${escapeHtml(question.question)}</textarea>
        </div>
        <div class="option-editor-grid">
          ${question.options.map((option, optionIndex) => `
            <div class="option-editor">
              <label>Option ${String.fromCharCode(65 + optionIndex)}</label>
              <input class="form-control option-input" value="${escapeHtml(option)}">
            </div>
          `).join('')}
        </div>
        <div class="mini-grid">
          <div class="form-group">
            <label>Correct</label>
            <select class="form-control correct-answer">
              ${['A', 'B', 'C', 'D'].map(letter => `<option value="${letter}" ${question.correctAnswer === letter ? 'selected' : ''}>${letter}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Topic</label>
            <input class="form-control topic-input" value="${escapeHtml(question.topic)}">
          </div>
          <div class="form-group">
            <label>Difficulty</label>
            <select class="form-control difficulty-input">
              ${['easy', 'medium', 'hard'].map(level => `<option value="${level}" ${question.difficulty === level ? 'selected' : ''}>${level}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Marks</label>
            <input class="form-control marks-input" type="number" min="0.25" step="0.25" value="${escapeHtml(question.marks)}">
          </div>
          <div class="form-group">
            <label>Negative Marks</label>
            <input class="form-control negative-marks-input" type="number" min="0" max="100" step="0.25" value="${escapeHtml(question.negativeMarks ?? '')}">
          </div>
        </div>
        <div class="form-group">
          <label>Explanation</label>
          <textarea class="form-control explanation-input" rows="2">${escapeHtml(question.explanation || '')}</textarea>
        </div>
        ${rowErrors.length ? `<div class="row-errors">${rowErrors.map(error => `${escapeHtml(error.field)}: ${escapeHtml(error.message)}`).join('<br>')}</div>` : ''}
      </div>
    </article>
  `;
}

function setLoading(button, loading, text) {
  button.disabled = loading;
  button.textContent = text;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

initDefaultDates();
loadExistingExams();
