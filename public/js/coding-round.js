let token = localStorage.getItem('token');
if (!token) location.replace('/login');

const roundId = new URLSearchParams(location.search).get('round');
let data = null;
let attempt = null;
let editor = null;
let questionIndex = 0;
let timer = null;
let snapshotTimer = null;
let remaining = 0;
let socket = null;
let finishing = false;
let executing = false;
const drafts = new Map();

const $ = id => document.getElementById(id);

(async function bootCodingRound() {
  try {
    if (!roundId) throw new Error('Coding round ID is missing.');

    const response = await fetch(
      `/api/coding/student/rounds/${encodeURIComponent(roundId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'Unable to open round.');

    data = payload;
    $('roundTitle').textContent = data.title || 'Coding Round';

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('This coding round has no questions yet.');
    }

    // A submitted/auto-submitted attempt must never be reopened as an editor.
    if (data.attempt_id && data.attempt_state !== 'started') {
      location.replace(`/coding-result?attempt=${encodeURIComponent(data.attempt_id)}`);
      return;
    }

    if (data.attempt_id && data.attempt_state === 'started') {
      attempt = { id: data.attempt_id };
    } else {
      const startResponse = await fetch(
        `/api/coding/student/rounds/${encodeURIComponent(roundId)}/start`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const started = await startResponse.json().catch(() => ({}));
      if (!startResponse.ok) {
        throw new Error(started.message || 'Unable to start coding round.');
      }
      attempt = started;

      if (attempt.state && attempt.state !== 'started') {
        location.replace(`/coding-result?attempt=${encodeURIComponent(attempt.id)}`);
        return;
      }
    }

    remaining = Math.max(
      0,
      Math.floor((new Date(data.ends_at).getTime() - Date.now()) / 1000)
    );

    $('warningCounter').textContent =
      `Warnings: ${attempt.warnings_count || 0}/${data.max_warnings || 3}`;

    renderNav();
    await loadQuestion();
    startTimer();
    startAutosave();

    socket = io('/coding', { auth: { token } });
    socket.emit('join-attempt', attempt.id);
    socket.on('coding:auto-submitted', () => finish(true));
    socket.on('coding:warning-resolved', d => {
      if (d.attemptId === attempt.id) {
        $('warningCounter').textContent =
          `Warnings: ${d.warningsCount}/${data.max_warnings || 3}`;
      }
    });
  } catch (error) {
    alert(error.message || 'Unable to open coding round.');
    location.href = '/coding-rounds';
  }
})();

function startTimer() {
  updateTimer();
  timer = setInterval(() => {
    remaining -= 1;
    updateTimer();

    if (remaining <= 0) {
      clearInterval(timer);
      finish(true);
    }
  }, 1000);
}

function updateTimer() {
  const safe = Math.max(0, remaining);
  $('timer').textContent =
    `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function renderNav() {
  $('questionNav').innerHTML = data.questions.map((q, i) =>
    `<button type="button" data-question-index="${i}" class="${i === 0 ? 'active' : ''}">
      Q${i + 1}. ${esc(q.title)}
    </button>`
  ).join('');

  document.querySelectorAll('[data-question-index]').forEach(button => {
    button.onclick = async () => {
      if (finishing) return;
      await saveSnapshot();
      questionIndex = Number(button.dataset.questionIndex);

      document.querySelectorAll('[data-question-index]')
        .forEach(x => x.classList.remove('active'));
      button.classList.add('active');

      await loadQuestion();
    };
  });
}

async function loadQuestion() {
  const q = data.questions[questionIndex];
  if (!q) return;

  $('questionTitle').textContent = q.title || '';
  $('problemStatement').innerHTML =
    esc(q.problem_statement ?? q.problemStatement ?? '').replace(/\n/g, '<br>');
  $('constraints').textContent = q.constraints_text ?? q.constraintsText ?? '—';
  $('inputFormat').textContent = q.input_format ?? q.inputFormat ?? '—';
  $('outputFormat').textContent = q.output_format ?? q.outputFormat ?? '—';

  const languages = Array.isArray(q.allowed_languages) ? q.allowed_languages : [];
  $('language').innerHTML = languages.map(l =>
    `<option value="${esc(l)}">${esc(l)}</option>`
  ).join('');

  await new Promise(resolve => requireMonaco(resolve));

  if (editor) {
    // Keep the editor instance stable and only replace its model.
    const language = $('language').value;
    const modelLanguage = monacoLanguage(language);
    const currentValue = editor.getValue();

    if (currentValue.trim()) {
      drafts.set(`${q.id}:${editor.getModelLanguageId?.() || ''}`, currentValue);
    }

    editor.setValue(getDraftOrStarter(q, language));
    window.monaco.editor.setModelLanguage(editor.getModel(), modelLanguage);
    return;
  }

  const language = $('language').value;
  editor = window.monaco.editor.create($('editor'), {
    value: getDraftOrStarter(q, language),
    language: monacoLanguage(language),
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14
  });

  $('language').onchange = async () => {
    if (!editor) return;

    const question = data.questions[questionIndex];
    const oldLanguage = editor.getModel()?.getLanguageId();
    drafts.set(`${question.id}:${oldLanguage}`, editor.getValue());

    const newLanguage = $('language').value;
    editor.setValue(getDraftOrStarter(question, newLanguage));
    window.monaco.editor.setModelLanguage(
      editor.getModel(),
      monacoLanguage(newLanguage)
    );
  };
}

function getDraftOrStarter(question, language) {
  const draft = drafts.get(`${question.id}:${monacoLanguage(language)}`);
  if (draft !== undefined) return draft;
  return question.starter_code?.[language] ?? question.starterCode?.[language] ?? '';
}

function monacoLanguage(language) {
  return language === 'cpp' ? 'cpp'
    : language === 'java' ? 'java'
    : language === 'python' ? 'python'
    : 'javascript';
}

$('runBtn').onclick = () => execute('run');
$('submitQuestionBtn').onclick = () => execute('submit');

async function execute(mode) {
  if (!editor || !attempt || finishing || executing) return;

  const q = data.questions[questionIndex];
  const sourceCode = editor.getValue();
  if (!sourceCode.trim()) {
    $('consoleOutput').textContent = 'Write some code first.';
    editor.focus();
    return;
  }

  executing = true;
  $('runBtn').disabled = true;
  $('submitQuestionBtn').disabled = true;
  $('consoleOutput').textContent = mode === 'run'
    ? 'Running public/sample test cases…\nPlease wait.'
    : 'Evaluating hidden test cases…\nPlease wait.';

  try {
    const response = await fetch(
      `/api/coding/student/attempts/${encodeURIComponent(attempt.id)}/${mode === 'run' ? 'run' : 'submit-question'}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId: q.id, language: $('language').value, sourceCode })
      }
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      $('consoleOutput').textContent = result.message || 'Execution failed.';
      return;
    }

    const lines = [
      result.status || 'Completed',
      `Passed ${result.passedCount || 0}/${result.totalCount || 0} test cases`,
      `Score: ${Number(result.score || 0).toFixed(2)}%`,
      ''
    ];

    (result.results || []).forEach((item, index) => {
      lines.push(mode === 'run'
        ? `Case ${index + 1}: ${item.passed ? 'PASS' : 'FAIL'}`
        : `Case ${item.case || index + 1}: ${item.passed ? 'PASS' : 'FAIL'}`);
      if (mode === 'run') {
        if (item.actualOutput !== undefined) lines.push(`Output: ${item.actualOutput || '(empty)'}`);
        if (item.expectedOutput !== undefined) lines.push(`Expected: ${item.expectedOutput || '(empty)'}`);
      }
      if (item.compileError) lines.push(`Compile: ${item.compileError}`);
      if (item.runtimeError) lines.push(`Runtime: ${item.runtimeError}`);
    });

    $('consoleOutput').textContent = lines.join('\n');
    await saveSnapshot();
  } catch (error) {
    $('consoleOutput').textContent = error.message || 'Unable to contact the coding runner.';
  } finally {
    executing = false;
    $('runBtn').disabled = false;
    $('submitQuestionBtn').disabled = false;
  }
}

$('finalSubmitBtn').onclick = () => finish(false);

async function finish(auto = false) {
  if (!attempt || finishing) return;

  if (!auto && !confirm(
    'Finish this coding round? You cannot submit more code afterward.'
  )) return;

  finishing = true;
  clearInterval(timer);
  clearInterval(snapshotTimer);
  await saveSnapshot();

  try {
    const response = await fetch(
      `/api/coding/student/attempts/${encodeURIComponent(attempt.id)}/submit`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      finishing = false;
      alert(result.message || 'Submit failed.');
      return;
    }

    location.href =
      `/coding-result?attempt=${encodeURIComponent(attempt.id)}`;
  } catch (error) {
    finishing = false;
    alert(error.message || 'Submit failed.');
  }
}

let saving = false;

async function saveSnapshot() {
  if (!editor || !attempt || finishing || saving) return false;

  const q = data.questions[questionIndex];
  if (!q) return false;

  saving = true;
  const sourceCode = editor.getValue();

  try {
    const response = await fetch(
      `/api/coding/student/attempts/${encodeURIComponent(attempt.id)}/snapshot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: q.id,
          language: $('language').value,
          sourceCode
        })
      }
    );
    return response.ok;
  } catch {
    return false;
  } finally {
    saving = false;
  }
}

function startAutosave() {
  clearInterval(snapshotTimer);
  snapshotTimer = setInterval(() => saveSnapshot(), 5000);
}

function requireMonaco(callback) {
  if (window.monaco) return callback();

  if (typeof window.require !== 'function') {
    throw new Error('Code editor failed to load. Check your internet connection.');
  }

  window.require.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
    }
  });

  window.require(['vs/editor/editor.main'], callback);
}

function esc(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

window.addEventListener('beforeunload', () => {
  clearInterval(timer);
  clearInterval(snapshotTimer);
});
