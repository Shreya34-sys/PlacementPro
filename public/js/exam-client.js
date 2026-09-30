// const qs = new URLSearchParams(location.search); const examId = qs.get('exam'); const token = localStorage.getItem('token');
// const api = (url, options = {}) => fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
// let exam, questions, attempt, index = 0, answers = {}, marked = new Set(), endAt, submitted = false;
// async function load() { const r = await api(`/api/exams/${examId}`); if (!r.ok) return alert('This exam is unavailable.'); ({ exam, questions } = await r.json()); }
// async function begin() {
//   try { await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => { const video = document.querySelector('#camera'); if (video) { video.srcObject = stream; video.play(); } }); }
//   catch { alert('A working camera and microphone are required to begin this assessment.'); return; }
//   if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
//   const r = await api(`/api/exams/${examId}/attempts`, { method: 'POST' }); attempt = await r.json();
//   location.href = `/pages/live-exam.html?exam=${examId}&attempt=${attempt.id}`;
// }
// function emitFlag(eventType, message, severity) { if (!attempt || submitted) return; api(`/api/exams/attempts/${attempt.id}/flags`, { method: 'POST', body: JSON.stringify({ eventType, message, severity }) }).then(r => r.json()).then(data => { const box = document.querySelector('#warning'); if (box) { box.textContent = `Integrity warning ${data.warningsCount}/3: ${message}`; box.classList.remove('hidden'); } if (data.autoSubmitted) submit(true); }).catch(() => {}); }
// async function submit(forced = false) { if (submitted) return; submitted = true; const r = await api(`/api/exams/attempts/${attempt.id}/submit`, { method: 'POST', body: JSON.stringify({ forced }) }); const result = await r.json(); window.location.replace(
//     `/pages/exam-result.html?attempt=${result.id || attempt.id}`
// ); }
// function render() { const q = questions[index]; document.querySelector('#examTitle').textContent = exam.title; document.querySelector('#questionNo').textContent = `Question ${index + 1}`; document.querySelector('#questionText').textContent = q.text; document.querySelector('#topic').textContent = q.topic; document.querySelector('#progress').textContent = `Question ${index + 1} of ${questions.length}`; document.querySelector('#bar').style.width = `${(Object.keys(answers).length / questions.length) * 100}%`;
//   document.querySelector('#options').innerHTML = q.options.map((o, i) => `<label class="option ${answers[q.id] === o.id ? 'selected' : ''}"><input type="radio" name="option" value="${o.id}" ${answers[q.id] === o.id ? 'checked' : ''}> ${String.fromCharCode(65 + i)}. ${o.text}</label>`).join('');
//   document.querySelectorAll('input[name=option]').forEach(input => input.onchange = () => { answers[q.id] = input.value; save(false); render(); });
//   document.querySelector('#paletteButtons').innerHTML = questions.map((item, i) => `<button class="${answers[item.id] ? 'answered' : ''} ${marked.has(item.id) ? 'marked' : ''} ${i === index ? 'active' : ''}" data-i="${i}">${i + 1}</button>`).join(''); document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { index = +b.dataset.i; render(); });
// }
// function save(mark) { const q = questions[index]; if (mark) marked.add(q.id); api(`/api/exams/attempts/${attempt.id}/answers`, { method: 'PUT', body: JSON.stringify({ questionId: q.id, optionId: answers[q.id], markedForReview: marked.has(q.id) }) }); }
// function countdown() { const remaining = Math.max(0, Math.floor((endAt - Date.now()) / 1000)); document.querySelector('#timer').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`; if (!remaining) submit(true); }
// async function live() { await load(); attempt = { id: qs.get('attempt') }; endAt = Math.min(new Date(exam.ends_at).getTime(), Date.now() + exam.duration_minutes * 60000); render(); countdown(); setInterval(countdown, 1000); document.querySelector('#previous').onclick = () => { if (index) { index--; render(); } }; document.querySelector('#next').onclick = () => { save(false); if (index < questions.length - 1) { index++; render(); } }; document.querySelector('#mark').onclick = () => { save(true); if (index < questions.length - 1) { index++; render(); } }; document.querySelectorAll('#submit,#finalize').forEach(button => button.onclick = () => confirm('Submit this assessment?') && submit()); ['visibilitychange','copy','paste','cut'].forEach(event => document.addEventListener(event, () => { if (event === 'visibilitychange' ? document.hidden : true) emitFlag(event === 'visibilitychange' ? 'tab_switch' : 'clipboard', event === 'visibilitychange' ? 'Tab/application focus was lost.' : 'Clipboard action attempted.'); })); document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) emitFlag('focus_lost', 'Full-screen mode exited.'); }); const socket = io({ auth: { token } }); socket.emit('join-attempt', attempt.id); socket.on('exam:auto-submitted', () => submit(true)); }
// if (location.pathname.endsWith('exam-guidelines.html')) { load().then(() => { document.querySelector('#title').textContent = exam.title; document.querySelector('#intro').textContent = exam.instructions; document.querySelector('#duration').textContent = `${exam.duration_minutes} min`; document.querySelector('#questions').textContent = questions.length; document.querySelector('#start').onclick = begin; }); } else live();






// Parse query parameters and retrieve authorization token
const qs = new URLSearchParams(location.search);
const examId = qs.get('exam');
const token = localStorage.getItem('token');

// Utility API wrapper
const api = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

// State variables
let exam;
let questions;
let attempt;
let index = 0;
let answers = {};
let marked = new Set();
let endAt;
let submitted = false;

/**
 * Fetch exam details and questions from API
 */
async function load() {
  const r = await api(`/api/exams/${examId}`);
  if (!r.ok) return alert('This exam is unavailable.');
  ({ exam, questions } = await r.json());
}

/**
 * Request proctoring permissions and initiate exam attempt
 */
async function begin() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const video = document.querySelector('#camera');
    if (video) {
      video.srcObject = stream;
      video.play();
    }
  } catch {
    alert('A working camera and microphone are required to begin this assessment.');
    return;
  }

  if (document.documentElement.requestFullscreen) {
    await document.documentElement.requestFullscreen();
  }

  const r = await api(`/api/exams/${examId}/attempts`, { method: 'POST' });
  attempt = await r.json();
  location.href = `/pages/live-exam.html?exam=${examId}&attempt=${attempt.id}`;
}

/**
 * Emit proctoring violations/warnings to the backend
 */
function emitFlag(eventType, message, severity) {
  if (!attempt || submitted) return;

  api(`/api/exams/attempts/${attempt.id}/flags`, {
    method: 'POST',
    body: JSON.stringify({ eventType, message, severity })
  })
    .then((r) => r.json())
    .then((data) => {
      const box = document.querySelector('#warning');
      if (box) {
        box.textContent = `Integrity warning ${data.warningsCount}/3: ${message}`;
        box.classList.remove('hidden');
      }
      if (data.autoSubmitted) submit(true);
    })
    .catch(() => {});
}

/**
 * Submit exam attempt and navigate to results page
 */
async function submit(forced = false) {
  if (submitted) return;
  submitted = true;

  const r = await api(`/api/exams/attempts/${attempt.id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ forced })
  });
  const result = await r.json();

  window.location.replace(`/pages/exam-result.html?attempt=${result.id || attempt.id}`);
}

/**
 * Render question text, options, progress bar, and navigation palette
 */
function render() {
  const q = questions[index];

  document.querySelector('#examTitle').textContent = exam.title;
  document.querySelector('#questionNo').textContent = `Question ${index + 1}`;
  document.querySelector('#questionText').textContent = q.text;
  document.querySelector('#topic').textContent = q.topic;
  document.querySelector('#progress').textContent = `Question ${index + 1} of ${questions.length}`;
  document.querySelector('#bar').style.width = `${(Object.keys(answers).length / questions.length) * 100}%`;

  // Options List
  document.querySelector('#options').innerHTML = q.options
    .map(
      (o, i) => `
      <label class="option ${answers[q.id] === o.id ? 'selected' : ''}">
        <input type="radio" name="option" value="${o.id}" ${answers[q.id] === o.id ? 'checked' : ''}> 
        ${String.fromCharCode(65 + i)}. ${o.text}
      </label>`
    )
    .join('');

  document.querySelectorAll('input[name=option]').forEach((input) => {
    input.onchange = () => {
      answers[q.id] = input.value;
      save(false);
      render();
    };
  });

  // Question Palette Buttons
  document.querySelector('#paletteButtons').innerHTML = questions
    .map(
      (item, i) => `
      <button class="${answers[item.id] ? 'answered' : ''} ${marked.has(item.id) ? 'marked' : ''} ${i === index ? 'active' : ''}" data-i="${i}">
        ${i + 1}
      </button>`
    )
    .join('');

  document.querySelectorAll('[data-i]').forEach((b) => {
    b.onclick = () => {
      index = +b.dataset.i;
      render();
    };
  });
}

/**
 * Save current answer state or mark for review
 */
function save(mark) {
  const q = questions[index];
  if (mark) marked.add(q.id);

  api(`/api/exams/attempts/${attempt.id}/answers`, {
    method: 'PUT',
    body: JSON.stringify({
      questionId: q.id,
      optionId: answers[q.id],
      markedForReview: marked.has(q.id)
    })
  });
}

/**
 * Countdown timer loop
 */
function countdown() {
  const remaining = Math.max(0, Math.floor((endAt - Date.now()) / 1000));
  document.querySelector('#timer').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  if (!remaining) submit(true);
}

/**
 * Main live exam engine
 */
async function live() {
  await load();
  attempt = { id: qs.get('attempt') };
  endAt = Math.min(new Date(exam.ends_at).getTime(), Date.now() + exam.duration_minutes * 60000);

  render();
  countdown();
  setInterval(countdown, 1000);

  // Navigation Event Handlers
  document.querySelector('#previous').onclick = () => {
    if (index) {
      index--;
      render();
    }
  };

  document.querySelector('#next').onclick = () => {
    save(false);
    if (index < questions.length - 1) {
      index++;
      render();
    }
  };

  document.querySelector('#mark').onclick = () => {
    save(true);
    if (index < questions.length - 1) {
      index++;
      render();
    }
  };

  document.querySelectorAll('#submit, #finalize').forEach((button) => {
    button.onclick = () => confirm('Submit this assessment?') && submit();
  });

  // Proctoring Event Listeners
  ['visibilitychange', 'copy', 'paste', 'cut'].forEach((event) => {
    document.addEventListener(event, () => {
      if (event === 'visibilitychange' ? document.hidden : true) {
        emitFlag(
          event === 'visibilitychange' ? 'tab_switch' : 'clipboard',
          event === 'visibilitychange' ? 'Tab/application focus was lost.' : 'Clipboard action attempted.'
        );
      }
    });
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      emitFlag('focus_lost', 'Full-screen mode exited.');
    }
  });

  // Socket connection for remote auto-submission
  const socket = io({ auth: { token } });
  socket.emit('join-attempt', attempt.id);
  socket.on('exam:auto-submitted', () => submit(true));
}

// Router initialization based on active route
if (location.pathname.endsWith('exam-guidelines.html')) {
  load().then(() => {
    document.querySelector('#title').textContent = exam.title;
    document.querySelector('#intro').textContent = exam.instructions;
    document.querySelector('#duration').textContent = `${exam.duration_minutes} min`;
    document.querySelector('#questions').textContent = questions.length;
    document.querySelector('#start').onclick = begin;
  });
} else {
  live();
}



