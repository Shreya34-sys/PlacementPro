const token = localStorage.getItem('adminToken');
if (!token) window.location.replace('/admin-login');

const api = (path, options = {}) => fetch(path, {
  ...options,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
});

const state = {
  sets: [],
  submissions: [],
  importQuestions: [],
  importErrors: [],
  activeReview: null,
  socket: null,
  liveAttemptId: null,
  micStatuses: {},
  livePeer: null,
  liveStream: null,
  pendingIce: []
};
const statusBox = document.getElementById('status');

document.getElementById('addQuestionBtn').addEventListener('click', () => addQuestionEditor());
document.getElementById('setForm').addEventListener('submit', saveSet);
document.getElementById('reloadSetsBtn').addEventListener('click', loadSets);
document.getElementById('reloadSubmissionsBtn').addEventListener('click', loadSubmissions);
document.getElementById('reloadLiveBtn')?.addEventListener('click', loadSubmissions);
document.getElementById('assignBtn').addEventListener('click', assignSet);
document.getElementById('templateBtn').addEventListener('click', downloadTemplate);
document.getElementById('importForm').addEventListener('submit', previewImport);
document.getElementById('saveImportBtn').addEventListener('click', saveImportedQuestions);

function addQuestionEditor(question = {}) {
  const root = document.getElementById('questionEditors');
  const el = document.createElement('section');
  el.className = 'question-editor';
  el.innerHTML = `
    <label>Question<textarea class="questionText" required>${escapeHtml(question.question || question.questionText || '')}</textarea></label>
    <div class="form-grid">
      <label>Category<select class="category">${options(['hr','technical','behavioral','company'], question.category || 'hr')}</select></label>
      <label>Topic<input class="topic" value="${escapeHtml(question.topic || 'General')}"></label>
      <label>Difficulty<select class="difficulty">${options(['easy','medium','hard'], question.difficulty || 'medium')}</select></label>
      <label>Marks<input class="marks" type="number" min="1" max="100" value="${escapeHtml(question.marks || 10)}"></label>
      <label>Prep Seconds<input class="prep" type="number" min="0" max="1800" value="${escapeHtml(question.preparationTimeSeconds ?? 30)}"></label>
      <label>Answer Seconds<input class="answer" type="number" min="15" max="3600" value="${escapeHtml(question.answerTimeSeconds || 180)}"></label>
    </div>
    <label>Reference Answer<textarea class="referenceAnswer">${escapeHtml(question.referenceAnswer || '')}</textarea></label>
    <label>Evaluation Criteria<textarea class="evaluationCriteria">${escapeHtml(question.evaluationCriteria || '')}</textarea></label>
    <button class="btn danger remove-question" type="button">Remove Question</button>
  `;
  el.querySelector('.remove-question').addEventListener('click', () => el.remove());
  root.appendChild(el);
}

async function saveSet(event) {
  event.preventDefault();
  const questions = [...document.querySelectorAll('.question-editor')].map(readQuestionEditor);
  if (document.getElementById('statusSelect').value === 'published' && !questions.length) {
    return showStatus('Add at least one question before publishing an interview set.', 'error');
  }
  const payload = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    category: document.getElementById('category').value,
    companyName: document.getElementById('companyName').value.trim(),
    status: document.getElementById('statusSelect').value,
    maxAttempts: Number(document.getElementById('maxAttempts').value),
    deadline: document.getElementById('deadline').value,
    firstWarningAction: document.getElementById('firstWarningAction').value,
    secondWarningAction: document.getElementById('secondWarningAction').value,
    thirdWarningAction: document.getElementById('thirdWarningAction').value,
    questions
  };
  try {
    const response = await api('/api/interviews/admin/sets', { method: 'POST', body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to save set.');
    showStatus('Interview set saved.', 'success');
    document.getElementById('setForm').reset();
    document.getElementById('questionEditors').innerHTML = '';
    addQuestionEditor();
    await loadSets();
  } catch (error) { showStatus(error.message, 'error'); }
}

function readQuestionEditor(editor) {
  return {
    questionText: editor.querySelector('.questionText').value.trim(),
    referenceAnswer: editor.querySelector('.referenceAnswer').value.trim(),
    evaluationCriteria: editor.querySelector('.evaluationCriteria').value.trim(),
    category: editor.querySelector('.category').value,
    topic: editor.querySelector('.topic').value.trim(),
    difficulty: editor.querySelector('.difficulty').value,
    marks: Number(editor.querySelector('.marks').value),
    preparationTimeSeconds: Number(editor.querySelector('.prep').value),
    answerTimeSeconds: Number(editor.querySelector('.answer').value)
  };
}

async function loadSets() {
  const response = await api('/api/interviews/admin/sets');
  const data = await response.json();
  if (!response.ok) return showStatus(data.message || 'Unable to load sets.', 'error');
  state.sets = data;
  renderSets();
  fillSetSelects();
}

function renderSets() {
  const root = document.getElementById('setList');
  if (!state.sets.length) {
    root.innerHTML = '<div class="item">No interview sets yet.</div>';
    return;
  }
  root.innerHTML = state.sets.map(set => `
    <article class="item">
      <div class="item-head">
        <div>
          <span class="pill ${set.status === 'published' ? 'green' : 'orange'}">${escapeHtml(set.status.toUpperCase())}</span>
          <h3 style="margin-top:8px">${escapeHtml(set.title)}</h3>
          <p class="subtitle">${escapeHtml(set.description || 'No description')}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn toggle-set" data-id="${escapeHtml(set.id)}" data-status="${escapeHtml(set.status)}">
            ${set.status === 'published' ? 'Move to Draft' : 'Publish & Schedule'}
          </button>
          <button class="btn danger delete-set" data-id="${escapeHtml(set.id)}">Delete</button>
        </div>
      </div>
      <div class="meta">
        <span>${labelCategory(set.category)}</span>
        <span>${set.question_count || 0} questions</span>
        <span>${set.assignment_count || 0} assignments</span>
        <span>${set.deadline ? new Date(set.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'No default deadline'}</span>
      </div>
    </article>
  `).join('');

  root.querySelectorAll('.toggle-set').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.id;
    const current = button.dataset.status;
    const nextStatus = current === 'published' ? 'draft' : 'published';
    const setObj = state.sets.find(s => s.id === id) || {};
    const response = await api(`/api/interviews/admin/sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: setObj.title,
        description: setObj.description,
        category: setObj.category,
        companyName: setObj.company_name,
        status: nextStatus,
        defaultPreparationSeconds: setObj.default_preparation_seconds,
        defaultAnswerSeconds: setObj.default_answer_seconds,
        maxAttempts: setObj.max_attempts,
        deadline: setObj.deadline,
        firstWarningAction: setObj.first_warning_action,
        secondWarningAction: setObj.second_warning_action,
        thirdWarningAction: setObj.third_warning_action
      })
    });
    if (!response.ok) return showStatus('Unable to update set status.', 'error');
    showStatus(`Interview set moved to ${nextStatus}.`, 'success');
    await loadSets();
  }));

  root.querySelectorAll('.delete-set').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('Delete this interview set?')) return;
    const response = await api(`/api/interviews/admin/sets/${button.dataset.id}`, { method: 'DELETE' });
    if (!response.ok) return showStatus('Unable to delete set.', 'error');
    showStatus('Interview set deleted.', 'success');
    await loadSets();
  }));
}

function fillSetSelects() {
  const html = state.sets.map(set => `<option value="${escapeHtml(set.id)}">${escapeHtml(set.title)}</option>`).join('');
  document.getElementById('assignSet').innerHTML = html;
  document.getElementById('importSet').innerHTML = html;
}

async function assignSet() {
  const setId = document.getElementById('assignSet').value;
  if (!setId) return showStatus('Create a set before assigning.', 'error');
  const payload = {
    targetType: document.getElementById('targetType').value,
    targetStudentId: document.getElementById('targetStudentId').value.trim(),
    department: document.getElementById('department').value.trim(),
    division: document.getElementById('division').value.trim(),
    batchYear: document.getElementById('batchYear').value ? Number(document.getElementById('batchYear').value) : null,
    maxAttempts: Number(document.getElementById('assignAttempts').value),
    deadline: document.getElementById('assignDeadline').value
  };
  if (payload.targetType === 'student' && !payload.targetStudentId) {
    return showStatus('Enter a student ID for a student-specific assignment.', 'error');
  }
  if (payload.targetType === 'class' && !payload.department && !payload.division && !payload.batchYear) {
    return showStatus('Choose a department, division, or batch year for a class assignment.', 'error');
  }
  const response = await api(`/api/interviews/admin/sets/${setId}/assignments`, { method: 'POST', body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) return showStatus(data.message || 'Unable to assign interview.', 'error');
  showStatus('Interview assigned.', 'success');
  await loadSets();
}

async function downloadTemplate() {
  const response = await fetch('/api/interviews/template', { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return showStatus('Unable to download template.', 'error');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'placementpro-interview-template.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function previewImport(event) {
  event.preventDefault();
  const file = document.getElementById('excelFile').files[0];
  if (!file) return;
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/interviews/import/preview', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const data = await response.json();
  if (!response.ok) return showStatus(data.message || 'Unable to preview import.', 'error');
  state.importQuestions = data.questions || [];
  state.importErrors = data.errors || [];
  renderImportPreview();
}

function renderImportPreview() {
  const errors = document.getElementById('importErrors');
  if (state.importErrors.length) {
    errors.classList.remove('hidden');
    errors.innerHTML = `<strong>Validation errors</strong><ul>${state.importErrors.map(error => `<li>Row ${error.row}: ${escapeHtml(error.field)} - ${escapeHtml(error.message)}</li>`).join('')}</ul>`;
  } else errors.classList.add('hidden');
  document.getElementById('saveImportBtn').disabled = !state.importQuestions.length || state.importErrors.length > 0;
  document.getElementById('importPreview').innerHTML = state.importQuestions.map((question, index) => `
    <section class="preview-question" data-index="${index}">
      <div class="item-head">
        <strong>Row ${question.rowNumber}</strong>
        <button class="btn danger remove-import" data-index="${index}" type="button">Remove</button>
      </div>
      <label>Question<textarea class="import-question" required>${escapeHtml(question.question)}</textarea></label>
      <div class="form-grid">
        <label>Category<select class="import-category">${options(['hr','technical','behavioral','company'], question.category)}</select></label>
        <label>Topic<input class="import-topic" value="${escapeHtml(question.topic)}"></label>
        <label>Difficulty<select class="import-difficulty">${options(['easy','medium','hard'], question.difficulty)}</select></label>
        <label>Marks<input class="import-marks" type="number" min="1" max="100" required value="${escapeHtml(question.marks)}"></label>
        <label>Prep Seconds<input class="import-prep" type="number" min="0" max="1800" required value="${escapeHtml(question.preparationTimeSeconds)}"></label>
        <label>Answer Seconds<input class="import-answer" type="number" min="15" max="3600" required value="${escapeHtml(question.answerTimeSeconds)}"></label>
      </div>
      <label>Reference Answer<textarea class="import-reference">${escapeHtml(question.referenceAnswer || '')}</textarea></label>
      <label>Criteria<textarea class="import-criteria">${escapeHtml(question.evaluationCriteria || '')}</textarea></label>
    </section>
  `).join('') || '<div class="item">No questions to preview.</div>';
  document.querySelectorAll('.remove-import').forEach(button => button.addEventListener('click', () => {
    const [removed] = state.importQuestions.splice(Number(button.dataset.index), 1);
    state.importErrors = state.importErrors.filter(error => error.row !== removed.rowNumber);
    renderImportPreview();
  }));
  document.querySelectorAll('.preview-question input, .preview-question textarea, .preview-question select')
    .forEach(field => field.addEventListener('input', clearImportValidation));
}

function clearImportValidation() {
  if (!state.importErrors.length) return;
  state.importErrors = [];
  document.getElementById('importErrors').classList.add('hidden');
  document.getElementById('saveImportBtn').disabled = !state.importQuestions.length;
}

async function saveImportedQuestions() {
  const setId = document.getElementById('importSet').value;
  if (!setId) return showStatus('Choose a set for imported questions.', 'error');
  const fields = [...document.querySelectorAll('.preview-question input, .preview-question textarea')];
  const invalid = fields.find(field => !field.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    return showStatus('Correct the highlighted question values before importing.', 'error');
  }
  const questions = [...document.querySelectorAll('.preview-question')].map(readImportQuestion);
  const response = await api(`/api/interviews/admin/sets/${setId}/questions`, { method: 'POST', body: JSON.stringify({ questions }) });
  const data = await response.json();
  if (!response.ok) {
    state.importErrors = data.errors || [];
    renderImportPreview();
    return showStatus(data.message || 'Unable to save imported questions.', 'error');
  }
  showStatus(`${data.importedCount} interview questions imported.`, 'success');
  state.importQuestions = [];
  state.importErrors = [];
  renderImportPreview();
  await loadSets();
}

function readImportQuestion(section) {
  return {
    question: section.querySelector('.import-question').value.trim(),
    referenceAnswer: section.querySelector('.import-reference').value.trim(),
    evaluationCriteria: section.querySelector('.import-criteria').value.trim(),
    category: section.querySelector('.import-category').value,
    topic: section.querySelector('.import-topic').value.trim(),
    difficulty: section.querySelector('.import-difficulty').value,
    marks: Number(section.querySelector('.import-marks').value),
    preparationTimeSeconds: Number(section.querySelector('.import-prep').value),
    answerTimeSeconds: Number(section.querySelector('.import-answer').value)
  };
}

async function loadSubmissions() {
  const response = await api('/api/interviews/admin/submissions');
  const data = await response.json();
  if (!response.ok) return showStatus(data.message || 'Unable to load submissions.', 'error');
  state.submissions = data;
  const root = document.getElementById('submissionList');
  if (!data.length) {
    root.innerHTML = '<div class="item">No submissions yet.</div>';
    return;
  }
  root.innerHTML = data.map(item => `
    <article class="item">
      <div class="item-head">
        <div>
          <span class="pill ${item.state === 'reviewed' ? 'green' : 'orange'}">${escapeHtml(item.state.toUpperCase())}</span>
          <h3 style="margin-top:8px">${escapeHtml(item.student_name || item.student_email)}</h3>
          <p class="subtitle">${escapeHtml(item.title)}</p>
        </div>
        <div class="toolbar"><button class="btn review-btn" data-id="${escapeHtml(item.attempt_id)}">Review</button>${item.state === 'started' ? `<button class="btn live-btn" data-id="${escapeHtml(item.attempt_id)}">Live camera</button>` : ''}</div>
      </div>
      <div class="meta"><span>${item.warning_count || 0} warnings</span><span>${item.flag_count || 0} monitoring events</span><span>${item.submitted_at ? new Date(item.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In progress'}</span></div>
    </article>
  `).join('');
  root.querySelectorAll('.review-btn').forEach(button => button.addEventListener('click', () => loadReview(button.dataset.id)));
  root.querySelectorAll('.live-btn').forEach(button => button.addEventListener('click', () => monitorAttempt(button.dataset.id)));
  renderLiveGrid();
}

async function loadReview(attemptId) {
  const response = await api(`/api/interviews/admin/attempts/${attemptId}`);
  const data = await response.json();
  if (!response.ok) return showStatus(data.message || 'Unable to load review.', 'error');
  state.activeReview = data;
  const panel = document.getElementById('reviewPanel');
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <h2>Review: ${escapeHtml(data.attempt.student_name)}</h2>
    <p class="subtitle">${escapeHtml(data.attempt.title)}. Review answers and monitoring flags separately. Flags are possible concerns only.</p>
    <div class="grid two" style="margin-top:16px">
      <div>${data.answers.map(answer => `
        <section class="review-answer" data-question="${escapeHtml(answer.question_id)}">
          <h3>${escapeHtml(answer.question_text)}</h3>
          <p class="subtitle"><strong>Criteria:</strong> ${escapeHtml(answer.evaluation_criteria || 'No criteria provided')}</p>
          <p>${escapeHtml(answer.answer_text || 'No answer submitted')}</p>
          ${answer.has_audio ? `<div class="review-recording"><button class="btn play-review-recording" type="button" data-question="${escapeHtml(answer.question_id)}">Load audio response</button><audio class="review-audio hidden" controls aria-label="Student audio response"></audio></div>` : ''}
          <details><summary>Reference answer</summary><p>${escapeHtml(answer.reference_answer || 'Not provided')}</p></details>
          <div class="form-grid two">
            <label>Score / ${escapeHtml(answer.marks)}<input class="score" type="number" min="0" max="${escapeHtml(answer.marks)}" step="0.25" value="${escapeHtml(answer.score || '')}"></label>
            <label>Comments<input class="comment" value="${escapeHtml(answer.faculty_comments || '')}"></label>
          </div>
        </section>`).join('')}</div>
      <div>
        <h3>Monitoring Events</h3>
        <div class="list" style="margin-top:12px">${data.events.map(event => `<div class="item"><span class="pill ${event.severity === 'high' || event.severity === 'medium' ? 'orange' : ''}">${escapeHtml(event.severity)}</span><strong>${escapeHtml(event.event_type)}</strong><span class="subtitle">${escapeHtml(event.message)} - ${new Date(event.created_at).toLocaleString()}</span></div>`).join('') || '<div class="item">No monitoring events.</div>'}</div>
      </div>
    </div>
    <label style="margin-top:16px">Faculty Summary<textarea id="facultySummary">${escapeHtml(data.attempt.faculty_comments || '')}</textarea></label>
    <button class="btn primary" id="saveReviewBtn" style="margin-top:16px">Save Review</button>
  `;
  document.getElementById('saveReviewBtn').addEventListener('click', saveReview);
  panel.querySelectorAll('.play-review-recording').forEach(button => button.addEventListener('click', () => loadReviewAudio(button)));
}

async function loadReviewAudio(button) {
  const player = button.parentElement.querySelector('.review-audio');
  button.disabled = true;
  button.textContent = 'Loading recording…';
  try {
    const response = await api(`/api/interviews/admin/attempts/${state.activeReview.attempt.id}/answers/${button.dataset.question}/audio`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Unable to load audio recording.');
    }
    const blob = await response.blob();
    if (player.dataset.objectUrl) URL.revokeObjectURL(player.dataset.objectUrl);
    const objectUrl = URL.createObjectURL(blob);
    player.dataset.objectUrl = objectUrl;
    player.src = objectUrl;
    player.classList.remove('hidden');
    button.textContent = 'Audio response loaded';
  } catch (error) {
    button.textContent = 'Retry audio response';
    showStatus(error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function saveReview() {
  const attemptId = state.activeReview.attempt.id;
  const answers = [...document.querySelectorAll('.review-answer')].map(section => ({
    questionId: section.dataset.question,
    score: Number(section.querySelector('.score').value || 0),
    facultyComments: section.querySelector('.comment').value.trim()
  }));
  const response = await api(`/api/interviews/admin/attempts/${attemptId}/review`, {
    method: 'POST',
    body: JSON.stringify({ answers, facultySummary: document.getElementById('facultySummary').value.trim() })
  });
  const data = await response.json();
  if (!response.ok) return showStatus(data.message || 'Unable to save review.', 'error');
  showStatus(`Review saved. Total score: ${data.totalScore}`, 'success');
  await loadSubmissions();
}

function ensureLiveSocket() {
  if (state.socket || typeof io !== 'function') return state.socket;
  state.socket = io({ auth: { token } });
  state.socket.on('webrtc:offer', handleLiveOffer);
  state.socket.on('webrtc:ice', handleLiveIce);
  state.socket.on('interview:student-online', ({ attemptId }) => {
    if (attemptId === state.liveAttemptId) state.socket.emit('monitor-attempt', attemptId);
  });
  state.socket.on('interview:mic-status', updateMicStatus);
  state.socket.on('interview:warning-update', updateLiveWarning);
  state.socket.on('connect_error', () => setLiveMeta('Live signaling connection failed.'));
  return state.socket;
}

function renderLiveGrid() {
  const root = document.getElementById('liveStudentGrid');
  if (!root) return;
  const live = state.submissions.filter(item => item.state === 'started');
  root.innerHTML = live.map(item => `
    <button type="button" class="live-student ${item.attempt_id === state.liveAttemptId ? 'active' : ''}" data-id="${escapeHtml(item.attempt_id)}">
      <strong>${escapeHtml(item.student_name || item.student_email)}</strong>
      <span>${escapeHtml(item.title)}</span>
      <span class="pill ${Number(item.warning_count || 0) >= 2 ? 'orange' : 'green'}">${item.warning_count || 0} warnings</span>
      <small>${escapeHtml(formatMicStatus(item.attempt_id))}</small>
    </button>
  `).join('') || '<div class="item">No interviews are currently in progress.</div>';
  root.querySelectorAll('.live-student').forEach(button => button.addEventListener('click', () => monitorAttempt(button.dataset.id)));
}

function monitorAttempt(attemptId) {
  if (!attemptId) return;
  ensureLiveSocket();
  closeLivePeer();
  state.liveAttemptId = attemptId;
  state.pendingIce = [];
  document.getElementById('liveFocusEmpty')?.classList.remove('hidden');
  setLiveMeta('Requesting the student camera stream...');
  renderLiveGrid();
  state.socket.emit('monitor-attempt', attemptId);
}

async function handleLiveOffer({ attemptId, offer, viewerId } = {}) {
  if (attemptId !== state.liveAttemptId || !offer) return;
  closeLivePeer(false);
  const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  state.livePeer = peer;
  peer.ontrack = event => {
    state.liveStream = event.streams[0];
    const video = document.getElementById('liveFocusVideo');
    if (video) {
      video.srcObject = state.liveStream;
      video.muted = true;
      video.play().catch(() => {});
    }
    document.getElementById('liveFocusEmpty')?.classList.add('hidden');
    setLiveMeta('Live camera connected. Video is not recorded.');
  };
  peer.onicecandidate = event => {
    if (event.candidate) state.socket?.emit('webrtc:ice', {
      attemptId,
      viewerId,
      target: 'student',
      candidate: event.candidate
    });
  };
  peer.onconnectionstatechange = () => {
    const status = peer.connectionState;
    if (['failed', 'disconnected', 'closed'].includes(status)) setLiveMeta(`Live camera ${status}.`);
    else setLiveMeta(`Live camera ${status}.`);
  };
  try {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    state.socket?.emit('webrtc:answer', { attemptId, viewerId, answer: peer.localDescription });
    while (state.pendingIce.length) await peer.addIceCandidate(state.pendingIce.shift());
  } catch (error) {
    closeLivePeer(false);
    setLiveMeta(error.message || 'Unable to connect the live camera.');
  }
}

async function handleLiveIce({ attemptId, candidate } = {}) {
  if (attemptId !== state.liveAttemptId || !candidate) return;
  if (!state.livePeer || !state.livePeer.remoteDescription) {
    state.pendingIce.push(candidate);
    return;
  }
  try { await state.livePeer.addIceCandidate(candidate); } catch {}
}

function closeLivePeer(clearAttempt = true) {
  if (state.livePeer) {
    try { state.livePeer.close(); } catch {}
  }
  state.livePeer = null;
  state.pendingIce = [];
  state.liveStream = null;
  const video = document.getElementById('liveFocusVideo');
  if (video) video.srcObject = null;
  if (clearAttempt && state.liveAttemptId && state.socket) state.socket.emit('stop-monitor-attempt', state.liveAttemptId);
  if (clearAttempt) state.liveAttemptId = null;
}

function updateLiveWarning(update) {
  const attempt = state.submissions.find(item => item.attempt_id === update.attemptId);
  if (attempt) {
    attempt.warning_count = update.warningsCount || attempt.warning_count || 0;
    if (update.terminated) attempt.state = 'terminated';
  }
  if (update.attemptId === state.liveAttemptId) {
    setLiveMeta(`${update.warningsCount || 0} warnings. Latest: ${update.message}`);
    if (update.terminated) {
      closeLivePeer();
      setLiveMeta('Interview ended by configured warning action. Saved answers were preserved.');
    }
  }
  renderLiveGrid();
  loadSubmissions().catch(() => {});
}

function updateMicStatus(update) {
  if (!update?.attemptId) return;
  state.micStatuses[update.attemptId] = update;
  if (update.attemptId === state.liveAttemptId) {
    const detail = update.detail ? ` (${update.detail})` : '';
    setLiveMeta(`Mic ${update.status}${detail}. Live video is not recorded.`);
  }
  renderLiveGrid();
}

function formatMicStatus(attemptId) {
  const mic = state.micStatuses[attemptId];
  if (!mic) return attemptId === state.liveAttemptId ? 'Connecting / mic pending' : 'Started';
  if (mic.status === 'speaking') return 'Speaking now';
  if (mic.status === 'silent') return 'Silent / listening';
  if (mic.status === 'error') return 'Mic error';
  if (mic.status === 'off') return 'Mic off';
  return 'Mic pending';
}

function setLiveMeta(message) {
  const meta = document.getElementById('liveFocusMeta');
  if (meta) meta.textContent = message;
}

function showStatus(message, type = 'success') {
  statusBox.className = `status ${type}`;
  statusBox.textContent = message;
}
function options(values, selected) { return values.map(value => `<option value="${value}" ${value === selected ? 'selected' : ''}>${labelCategory(value)}</option>`).join(''); }
function labelCategory(value) { return ({ hr: 'HR', technical: 'Technical', behavioral: 'Behavioral', company: 'Company-Specific', easy: 'Easy', medium: 'Medium', hard: 'Hard' })[value] || value; }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value ?? ''; return div.innerHTML; }

addQuestionEditor();
loadSets();
loadSubmissions();
window.addEventListener('beforeunload', () => closeLivePeer());
