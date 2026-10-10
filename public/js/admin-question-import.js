const token = localStorage.getItem('adminToken');

if (!token) {
  window.location.replace('/admin-login');
}

const state = {
  questions: [],
  errors: [],
  importToken: crypto.randomUUID(),
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

excelFile.addEventListener('change', () => {
  fileName.textContent = excelFile.files[0] ? excelFile.files[0].name : 'No file selected';
});

templateButton.addEventListener('click', async () => {
  setLoading(templateButton, true, 'Downloading...');
  try {
    const response = await fetch('/api/exams/import/template', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unable to download template.');
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
    if (data.negativeMarking !== null && data.negativeMarking !== undefined) {
      document.getElementById('negativeMarking').value = data.negativeMarking;
    }
    renderSummary(data.stats);
    renderErrors();
    renderPreview();
  } catch (error) {
    state.questions = [];
    state.errors = [{ row: 1, field: 'File', message: error.message }];
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
      renderErrors();
      renderPreview();
      return;
    }
    summaryPanel.classList.remove('hidden');
    summaryPanel.textContent = data.duplicate
      ? 'This import was already saved. No duplicate question set was created.'
      : `${data.importedCount} questions imported successfully.`;
    errorsPanel.classList.add('hidden');
    saveButton.disabled = true;
    setTimeout(() => window.location.assign('/pages/admin-exams.html'), 900);
  } catch (error) {
    state.errors = [{ row: 1, field: 'Save', message: error.message || 'Unable to save imported questions.' }];
    renderErrors();
  } finally {
    state.saving = false;
    setLoading(saveButton, false, 'Save Imported Questions');
  }
});

async function loadExistingExams() {
  try {
    const response = await fetch('/api/exams/admin', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unable to load existing sets.');
    const exams = await response.json();
    examId.innerHTML = exams.map(exam => `<option value="${escapeHtml(exam.id)}">${escapeHtml(exam.title)}</option>`).join('');
  } catch (error) {
    examId.innerHTML = '<option value="">Unable to load question sets</option>';
  }
}

function buildSavePayload() {
  return {
    importToken: state.importToken,
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
  state.errors = validateQuestions(state.questions);
  renderSummary();
  renderErrors();
  renderPreviewControls();
}

function renderSummary(stats) {
  if (!state.questions.length && !stats) {
    summaryPanel.classList.add('hidden');
    return;
  }
  const totalRows = stats ? stats.totalRows : state.questions.length;
  const validRows = stats ? stats.validRows : state.questions.length;
  summaryPanel.classList.remove('hidden');
  summaryPanel.textContent = `${totalRows} rows parsed. ${validRows} ready to import. ${state.errors.length} validation issue${state.errors.length === 1 ? '' : 's'} found.`;
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
    <strong>Fix these issues before saving:</strong>
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
  saveButton.disabled = !state.questions.length || state.errors.length > 0;
}

function validateQuestions(questions) {
  const errors = [];
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
    const key = [question.question, ...question.options].map(value => String(value || '').trim().toLowerCase()).join('|');
    if (question.question && question.options.every(Boolean)) {
      if (seen.has(key)) errors.push({ row, field: 'Question', message: `Duplicate of row ${seen.get(key)}.` });
      else seen.set(key, row);
    }
  });
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

loadExistingExams();
