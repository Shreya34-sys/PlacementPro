const token = localStorage.getItem('adminToken');
if (!token) location.replace('/admin-login');

const roundIdFromUrl = new URLSearchParams(location.search).get('round');
let roundId = roundIdFromUrl;
let currentQuestionId = null;
let caseSequence = 0;
const $ = id => document.getElementById(id);

function esc(value) {
  const d = document.createElement('div');
  d.textContent = value == null ? '' : String(value);
  return d.innerHTML;
}

function api(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  });
}

function addCase(input = '', output = '', hidden = false) {
  const id = ++caseSequence;
  const el = document.createElement('div');
  el.className = 'case';
  el.dataset.caseId = id;
  el.innerHTML = `
    <div class="case-grid">
      <label>Input<textarea class="case-in" rows="3" placeholder="Example: 2 7 11 15\n9">${esc(input)}</textarea></label>
      <label>Expected output<textarea class="case-out" rows="3" placeholder="Example: 0 1">${esc(output)}</textarea></label>
    </div>
    <label><input class="case-hidden" type="checkbox" ${hidden ? 'checked' : ''}> Hidden test case</label>
    <button type="button" class="ghost remove-case">Remove</button>`;
  el.querySelector('.remove-case').onclick = () => {
    el.remove();
    updateCaseNumbering();
  };
  $('cases').appendChild(el);
  updateCaseNumbering();
}

function updateCaseNumbering() {
  [...document.querySelectorAll('#cases .case')].forEach((el, i) => {
    el.querySelector('.remove-case').textContent = `Remove case ${i + 1}`;
  });
}

function collectQuestion() {
  const testCases = [...document.querySelectorAll('#cases .case')].map(c => ({
    input: c.querySelector('.case-in').value,
    output: c.querySelector('.case-out').value,
    is_hidden: c.querySelector('.case-hidden').checked
  }));

  return {
    title: $('qTitle').value.trim(),
    points: Number($('qPoints').value || 0),
    problemStatement: $('qStatement').value.trim(),
    constraintsText: $('qConstraints').value,
    inputFormat: $('qInput').value,
    outputFormat: $('qOutput').value,
    allowedLanguages: [...document.querySelectorAll('.lang:checked')].map(x => x.value),
    starterCode: {
      python: $('starterPython').value,
      java: $('starterJava').value,
      cpp: $('starterCpp').value,
      javascript: $('starterJavascript').value
    },
    testCases
  };
}

function validateQuestion(payload, quiet = false) {
  const fail = message => {
    if (!quiet) alert(message);
    return false;
  };
  if (!payload.title) return fail('Enter the question title.');
  if (!payload.problemStatement) return fail('Enter the problem statement.');
  if (!(payload.points > 0)) return fail('Points must be greater than 0.');
  if (!payload.allowedLanguages.length) return fail('Select at least one allowed language.');
  if (!payload.testCases.length) return fail('Add at least one test case.');
  if (payload.testCases.some(tc => !String(tc.output).trim())) return fail('Every test case needs an expected output.');
  return true;
}

function resetQuestionForm() {
  currentQuestionId = null;
  $('qTitle').value = '';
  $('qPoints').value = 100;
  $('qStatement').value = '';
  $('qConstraints').value = '';
  $('qInput').value = '';
  $('qOutput').value = '';
  $('starterPython').value = '# Write your solution here';
  $('starterJava').value = 'public class Main { public static void main(String[] args) { } }';
  $('starterCpp').value = '#include <bits/stdc++.h>\nusing namespace std;\nint main(){}';
  $('starterJavascript').value = "const fs = require('fs');\nconst input = fs.readFileSync(0,'utf8');";
  document.querySelectorAll('.lang').forEach(x => { x.checked = true; });
  $('cases').innerHTML = '';
  addCase();
  $('questionStatus').textContent = 'New question';
  $('addQuestion').textContent = 'Add Question';
  $('questionEditorHeading').textContent = 'Add coding question';
  window.scrollTo({ top: $('questionPanel').offsetTop, behavior: 'smooth' });
}

function fillQuestion(q) {
  currentQuestionId = q.id;
  $('qTitle').value = q.title || '';
  $('qPoints').value = q.points || 100;
  $('qStatement').value = q.problem_statement || '';
  $('qConstraints').value = q.constraints_text || '';
  $('qInput').value = q.input_format || '';
  $('qOutput').value = q.output_format || '';

  const allowed = Array.isArray(q.allowed_languages) ? q.allowed_languages : [];
  document.querySelectorAll('.lang').forEach(x => { x.checked = allowed.includes(x.value); });

  const starters = q.starter_code || {};
  $('starterPython').value = starters.python || '';
  $('starterJava').value = starters.java || '';
  $('starterCpp').value = starters.cpp || '';
  $('starterJavascript').value = starters.javascript || '';

  $('cases').innerHTML = '';
  const cases = Array.isArray(q.test_cases) ? q.test_cases : [];
  (cases.length ? cases : [{}]).forEach(tc => addCase(tc.input || '', tc.output || '', tc.is_hidden === true));
  $('questionStatus').textContent = `Editing question ${q.display_order || ''}`;
  $('addQuestion').textContent = 'Save Changes';
  $('questionEditorHeading').textContent = `Edit: ${q.title || 'Coding question'}`;
  window.scrollTo({ top: $('questionPanel').offsetTop, behavior: 'smooth' });
}

async function saveCurrentQuestion({ quiet = false } = {}) {
  if (!roundId) return false;
  const payload = collectQuestion();
  if (!validateQuestion(payload, quiet)) return false;

  try {
    const result = currentQuestionId
      ? await api(`/api/coding/admin/rounds/${roundId}/questions/${currentQuestionId}`, {
          method: 'PUT', body: JSON.stringify(payload)
        })
      : await api(`/api/coding/admin/rounds/${roundId}/questions`, {
          method: 'POST', body: JSON.stringify(payload)
        });

    currentQuestionId = result.id;
    $('questionStatus').textContent = currentQuestionId ? 'Question saved successfully.' : 'Question saved.';
    $('addQuestion').textContent = 'Save Changes';
    await loadRound();
    return true;
  } catch (error) {
    if (!quiet) alert(error.message || 'Unable to save question.');
    return false;
  }
}

async function loadRound() {
  if (!roundId) return;
  try {
    const x = await api(`/api/coding/admin/rounds/${roundId}`);
    $('title').value = x.title || '';
    $('description').value = x.description || '';
    $('instructions').value = x.instructions || '';
    $('duration').value = x.duration_minutes || 60;
    $('startsAt').value = toDateTimeLocal(x.starts_at);
    $('endsAt').value = toDateTimeLocal(x.ends_at);
    $('maxWarnings').value = x.max_warnings || 3;
    $('roundCode').textContent = `Access code: ${x.access_code || '—'}`;
    $('questionPanel').classList.remove('hidden');
    $('createRound').disabled = true;
    renderQuestionList(x.questions || []);
    $('publishRound').disabled = !(x.questions || []).length;
    return x;
  } catch (error) {
    alert(error.message || 'Unable to load coding round.');
  }
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderQuestionList(questions) {
  const host = $('questionList');
  host.innerHTML = '';
  questions.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'saved-question';
    card.innerHTML = `<div><strong>Q${index + 1}. ${esc(q.title)}</strong><div class="meta">${q.test_cases.length} test case(s) · ${q.points} points</div></div><button class="ghost edit-question" type="button">Edit</button>`;
    card.querySelector('.edit-question').onclick = () => fillQuestion(q);
    host.appendChild(card);
  });
}

$('addCase').onclick = () => addCase();
$('addQuestion').onclick = () => saveCurrentQuestion();
$('newQuestion').onclick = resetQuestionForm;

$('createRound').onclick = async () => {
  const payload = {
    title: $('title').value.trim(), description: $('description').value,
    instructions: $('instructions').value, durationMinutes: Number($('duration').value),
    startsAt: $('startsAt').value, endsAt: $('endsAt').value,
    maxWarnings: Number($('maxWarnings').value), accessCode: $('accessCode').value.trim() || undefined,
    faceDetectionEnabled: $('face').checked, audioMonitoringEnabled: $('audio').checked,
    tabLockEnabled: $('tab').checked, clipboardGuardEnabled: $('clipboard').checked, status: 'draft'
  };
  if (!payload.title || !payload.startsAt || !payload.endsAt) return alert('Fill title and schedule.');
  if (new Date(payload.endsAt) <= new Date(payload.startsAt)) return alert('End time must be after start time.');
  try {
    const r = await api('/api/coding/admin/rounds', { method: 'POST', body: JSON.stringify(payload) });
    roundId = r.id;
    $('roundCode').textContent = `Access code: ${r.accessCode}`;
    $('questionPanel').classList.remove('hidden');
    $('createRound').disabled = true;
    $('roundStatus').textContent = ' Round created.';
    history.replaceState({}, '', `?round=${roundId}`);
    resetQuestionForm();
  } catch (error) { alert(error.message || 'Create failed.'); }
};

$('publishRound').onclick = async () => {
  // If the admin filled a new/edited question and immediately clicks Publish,
  // save it first instead of silently publishing the previous state.
  const payload = collectQuestion();
  const hasUnsavedQuestion = payload.title || payload.problemStatement || document.querySelectorAll('#cases .case').length > 1 ||
    (document.querySelector('#cases .case .case-in')?.value || document.querySelector('#cases .case .case-out')?.value);

  if (hasUnsavedQuestion && !validateQuestion(payload, true)) {
    alert('Please complete or save the current question before publishing.');
    return;
  }
  if (hasUnsavedQuestion) {
    const saved = await saveCurrentQuestion();
    if (!saved) return;
  }

  try {
    await api(`/api/coding/admin/rounds/${roundId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: 'published' })
    });
    $('publishRound').disabled = true;
    $('questionStatus').textContent = 'Coding round published successfully.';
    alert('Coding round published.');
  } catch (error) { alert(error.message || 'Publish failed.'); }
};

$('assignStudents').onclick = async () => {
  if (!roundId) return alert('Create the round first.');
  const emails = $('inviteEmails').value.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
  if (!emails.length) return alert('Enter at least one email.');
  try {
    const d = await api(`/api/coding/admin/rounds/${roundId}/assign`, { method: 'POST', body: JSON.stringify({ emails }) });
    $('assignmentOutput').textContent = d.assignments.map(x => `${x.email} → ${x.assignmentCode}`).join('\n');
  } catch (error) { $('assignmentOutput').textContent = error.message || 'Assignment failed'; }
};

if (roundId) loadRound();
else addCase();
