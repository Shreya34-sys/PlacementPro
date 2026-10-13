const token = localStorage.getItem('token');
if (!token) window.location.replace('/login');

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get('assignment');
if (!assignmentId) window.location.replace('/pages/interviews.html');

const api = (path, options = {}) => fetch(path, {
  ...options,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
});

const state = {
  attemptId: null,
  questions: [],
  index: 0,
  answers: {},
  source: {},
  stream: null,
  faceMonitor: null,
  lookingAwayCount: 0,
  faceAbsentCount: 0,
  recognition: null,
  prepLeft: 0,
  answerLeft: 0,
  timer: null,
  events: []
};

document.getElementById('previewMediaBtn').addEventListener('click', enableMedia);
document.getElementById('startBtn').addEventListener('click', startInterview);
document.getElementById('saveAnswerBtn').addEventListener('click', saveCurrentAnswer);
document.getElementById('prevBtn').addEventListener('click', () => move(-1));
document.getElementById('nextBtn').addEventListener('click', () => move(1));
document.getElementById('submitBtn').addEventListener('click', submitInterview);
document.getElementById('speechBtn').addEventListener('click', toggleSpeech);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.attemptId) recordEvent('visibility_hidden', 'Browser tab became hidden during the interview.', 'medium');
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && state.attemptId) recordEvent('fullscreen_exit', 'Fullscreen mode was exited.', 'low');
});

async function enableMedia() {
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const video = document.getElementById('cameraPreview');
    video.srcObject = state.stream;
    document.getElementById('cameraFallback').classList.add('hidden');
    if (state.attemptId) recordEvent('camera_permission', 'Camera and microphone permission granted.', 'info');
    startFaceMonitor();
  } catch (error) {
    if (state.attemptId) recordEvent('camera_permission', 'Camera or microphone permission was not granted.', 'medium');
    alert('Camera/microphone permission was not granted. You can still type answers if allowed by your browser.');
  }
}

function startFaceMonitor() {
  if (!('FaceDetector' in window) || state.faceMonitor) {
    if (state.attemptId && !('FaceDetector' in window)) {
      recordEvent('manual', 'Browser face detection is not available; only tab and fullscreen events will be recorded.', 'info');
    }
    return;
  }
  const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
  const video = document.getElementById('cameraPreview');
  state.faceMonitor = setInterval(async () => {
    if (!state.attemptId || video.readyState < 2) return;
    try {
      const faces = await detector.detect(video);
      if (!faces.length) {
        state.faceAbsentCount += 1;
        if (state.faceAbsentCount === 4) recordEvent('face_absent', 'No face was detected for several checks. This may be due to lighting, camera angle, or accessibility needs.', 'low');
        return;
      }
      state.faceAbsentCount = 0;
      if (faces.length > 1) recordEvent('multiple_faces', 'More than one face may be visible. Faculty should review context before drawing conclusions.', 'medium');
      const face = faces[0].boundingBox;
      const centerX = face.x + face.width / 2;
      const ratio = centerX / Math.max(video.videoWidth || 1, 1);
      if (ratio < 0.25 || ratio > 0.75) {
        state.lookingAwayCount += 1;
        if (state.lookingAwayCount === 5) recordEvent('looking_away', 'Face position repeatedly drifted away from center. This is only an approximate gaze indicator.', 'low');
      } else {
        state.lookingAwayCount = 0;
      }
    } catch {
      clearInterval(state.faceMonitor);
      state.faceMonitor = null;
    }
  }, 3000);
}

async function startInterview() {
  try {
    await enableMedia();
    const response = await api(`/api/interviews/assignments/${assignmentId}/attempts`, { method: 'POST', body: '{}' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to start interview.');
    state.attemptId = data.attemptId;
    state.questions = data.questions || [];
    if (!state.questions.length) throw new Error('No questions are configured for this interview.');
    document.getElementById('consentPanel').classList.add('hidden');
    document.getElementById('roomPanel').classList.remove('hidden');
    renderQuestion();
    try { await document.documentElement.requestFullscreen(); } catch {}
  } catch (error) {
    alert(error.message);
  }
}

function renderQuestion() {
  clearInterval(state.timer);
  const question = state.questions[state.index];
  document.getElementById('roomTitle').textContent = question.title || 'Mock Interview';
  document.getElementById('questionMeta').textContent = `Question ${state.index + 1} of ${state.questions.length} - ${question.marks} marks`;
  document.getElementById('questionText').textContent = question.question_text;
  document.getElementById('questionTopic').textContent = `${labelCategory(question.category)} / ${question.topic} / ${question.difficulty}`;
  document.getElementById('answerText').value = state.answers[question.id] || '';
  state.prepLeft = Number(question.preparation_time_seconds || 0);
  state.answerLeft = Number(question.answer_time_seconds || 180);
  renderTimers();
  state.timer = setInterval(tick, 1000);
  renderPalette();
  document.getElementById('progressBar').style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
}

function tick() {
  if (state.prepLeft > 0) state.prepLeft -= 1;
  else if (state.answerLeft > 0) state.answerLeft -= 1;
  renderTimers();
  if (state.answerLeft === 0) saveCurrentAnswer();
}

function renderTimers() {
  document.getElementById('prepTimer').textContent = formatTime(state.prepLeft);
  document.getElementById('answerTimer').textContent = formatTime(state.answerLeft);
}

function renderPalette() {
  document.getElementById('palette').innerHTML = state.questions.map((question, index) =>
    `<button class="${index === state.index ? 'active' : ''} ${state.answers[question.id] ? 'answered' : ''}" data-index="${index}">${index + 1}</button>`
  ).join('');
  document.querySelectorAll('#palette button').forEach(button => button.addEventListener('click', () => {
    saveCurrentAnswer();
    state.index = Number(button.dataset.index);
    renderQuestion();
  }));
}

async function saveCurrentAnswer() {
  if (!state.attemptId) return;
  const question = state.questions[state.index];
  const text = document.getElementById('answerText').value.trim();
  state.answers[question.id] = text;
  await api(`/api/interviews/attempts/${state.attemptId}/answers`, {
    method: 'PUT',
    body: JSON.stringify({ questionId: question.id, answerText: text, transcriptSource: state.source[question.id] || 'typed' })
  });
  renderPalette();
}

async function move(delta) {
  await saveCurrentAnswer();
  state.index = Math.max(0, Math.min(state.questions.length - 1, state.index + delta));
  renderQuestion();
}

async function submitInterview() {
  if (!confirm('Submit this interview? You cannot edit answers after submission.')) return;
  await saveCurrentAnswer();
  const response = await api(`/api/interviews/attempts/${state.attemptId}/submit`, { method: 'POST', body: '{}' });
  const data = await response.json();
  if (!response.ok) return alert(data.message || 'Unable to submit interview.');
  alert('Interview submitted successfully.');
  clearInterval(state.faceMonitor);
  state.stream?.getTracks().forEach(track => track.stop());
  window.location.replace('/pages/interviews.html');
}

function toggleSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert('Speech recognition is not available in this browser. Please type your answer.');
  if (state.recognition) {
    state.recognition.stop();
    state.recognition = null;
    document.getElementById('speechBtn').textContent = 'Start Speech';
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';
  recognition.onresult = event => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript;
    const question = state.questions[state.index];
    state.source[question.id] = 'speech';
    document.getElementById('answerText').value = transcript;
  };
  recognition.onend = () => {
    state.recognition = null;
    document.getElementById('speechBtn').textContent = 'Start Speech';
  };
  state.recognition = recognition;
  recognition.start();
  document.getElementById('speechBtn').textContent = 'Stop Speech';
}

async function recordEvent(eventType, message, severity) {
  state.events.push({ eventType, message, severity, at: new Date() });
  document.getElementById('eventLog').innerHTML = state.events.slice(-6).map(event =>
    `<div class="item"><span class="pill ${event.severity === 'medium' ? 'orange' : ''}">${escapeHtml(event.severity)}</span><span>${escapeHtml(event.message)}</span><span class="subtitle">${event.at.toLocaleTimeString()}</span></div>`
  ).join('');
  try {
    await api(`/api/interviews/attempts/${state.attemptId}/events`, { method: 'POST', body: JSON.stringify({ eventType, message, severity }) });
  } catch {}
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
function labelCategory(value) { return ({ hr: 'HR', technical: 'Technical', behavioral: 'Behavioral', company: 'Company-Specific' })[value] || 'Interview'; }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value ?? ''; return div.innerHTML; }
