const token = localStorage.getItem('token');
if (!token) window.location.replace('/login');

const params = new URLSearchParams(window.location.search);
let assignmentId = params.get('assignment');
const configuredSilenceThresholdMs = Math.min(6000, Math.max(1000,
  Number(params.get('silenceMs') || localStorage.getItem('interviewSilenceThresholdMs') || 2200)
));

const api = (path, options = {}) => fetch(path, {
  ...options,
  headers: {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  }
});

// HR Interview Stages
const HR_TOPICS = [
  { topic: 'Self-Introduction', category: 'hr', title: 'Candidate Introduction & Passion', defaultPrompt: 'Tell me about yourself, your educational journey, and what drives your passion in this field.' },
  { topic: 'Projects & Technical Experience', category: 'technical', title: 'Key Project & Problem Solving', defaultPrompt: 'Could you walk me through your most impactful project? What challenges did you encounter and how did you resolve them?' },
  { topic: 'Strengths & Weaknesses', category: 'hr', title: 'Self-Awareness & Growth Mindset', defaultPrompt: 'What would you consider your greatest professional strength, and what is one area you are actively working to improve?' },
  { topic: 'Teamwork & Collaboration', category: 'behavioral', title: 'Collaboration in Diverse Teams', defaultPrompt: 'Tell me about a time you worked in a team with differing opinions or technical disagreements. How did you handle it?' },
  { topic: 'Conflict Handling & Pressure', category: 'behavioral', title: 'Handling Tight Deadlines & Adversity', defaultPrompt: 'Describe a situation where you faced a tight deadline or high pressure. How did you prioritize your tasks to deliver successfully?' },
  { topic: 'Career Goals & Vision', category: 'hr', title: 'Long-term Aspirations & Culture Fit', defaultPrompt: 'Where do you see yourself in the next 3 to 5 years, and how do you plan to achieve those career goals?' },
  { topic: 'Behavioral & Situational (STAR)', category: 'behavioral', title: 'Learning from Setbacks', defaultPrompt: 'Can you share a time when a project or plan did not go as expected? What happened, what was your role, and what did you learn?' }
];

const state = {
  attemptId: null,
  questions: [],
  index: 0,
  answers: {},
  source: {},
  conversationHistory: [],
  currentTurnTranscript: '',
  hasSpokenInTurn: false,
  isListening: false,
  isAiSpeaking: false,
  aiVoiceEnabled: true,
  stream: null,
  socket: null,
  peerConnections: new Map(),
  pendingIce: new Map(),
  cameraRequestPending: false,
  cameraUnavailableRecorded: false,
  cameraPreflightMonitor: null,
  audioStream: null,
  faceMonitor: null,
  mediaHealthMonitor: null,
  lookingAwayCount: 0,
  faceAbsentCount: 0,
  recognition: null,
  recorder: null,
  audioContext: null,
  analyser: null,
  audioSource: null,
  audioLevelTimer: null,
  sessionClockTimer: null,
  sessionSeconds: 0,
  turnTimer: null,
  turnSecondsRemaining: 180,
  lastSpeechAt: 0,
  speechStartedAt: 0,
  silenceThresholdMs: configuredSilenceThresholdMs,
  voiceLevelThreshold: 0.035,
  recordingChunks: [],
  recordings: {},
  saving: false,
  starting: false,
  submitting: false,
  completed: false,
  monitoringStarted: false,
  fullscreenStarted: false,
  faceDetectorUnavailableLogged: false,
  faceMonitoringUnavailable: false,
  faceDetectorBackend: null,
  faceDetectorReady: false,
  faceDetectionRunning: false,
  consecutiveNoFace: 0,
  consecutiveMultipleFaces: 0,
  tabSwitchCooldownTimer: null,
  tabSwitchLocked: false,
  setupGracePeriodEnd: 0,
  warningsCount: 0,
  mediaTrackListeners: new WeakMap(),
  offline: !navigator.onLine,
  pageHideRecorded: false,
  focusLost: false,
  events: [],
  lastEventAt: {}
};

// UI Element Listeners
document.getElementById('previewMediaBtn').addEventListener('click', requestRequiredCameraAccess);
document.getElementById('exitInterviewBtn').addEventListener('click', event => {
  if (state.attemptId && !state.completed) {
    if (!confirm('Exit this active interview? Your recorded answers will be preserved.')) {
      event.preventDefault();
      return;
    }
    handlePageHide();
  }
  cleanupMedia();
});
window.addEventListener('beforeunload', () => cleanupMedia());
document.getElementById('rulesAcknowledged').addEventListener('change', onAcknowledgementChange);
document.getElementById('startConfirmation').addEventListener('input', updateStartAvailability);
document.getElementById('startBtn').addEventListener('click', startInterview);
document.getElementById('repeatQuestionBtn')?.addEventListener('click', repeatCurrentQuestion);
document.getElementById('skipQuestionBtn')?.addEventListener('click', skipCurrentQuestion);
document.getElementById('voiceToggleBtn')?.addEventListener('click', toggleAiVoice);
document.getElementById('doneSpeakingBtn')?.addEventListener('click', () => finishCandidateTurn());
document.getElementById('toggleTextInputBtn')?.addEventListener('click', toggleTextInput);
document.getElementById('saveAnswerBtn')?.addEventListener('click', () => saveCurrentTurn(true));
document.getElementById('submitBtn')?.addEventListener('click', finishInterviewWithFeedback);
document.getElementById('retakeInterviewBtn')?.addEventListener('click', () => window.location.reload());
document.getElementById('prevBtn')?.addEventListener('click', () => navigateQuestion(-1));
document.getElementById('nextBtn')?.addEventListener('click', () => navigateQuestion(1));

// Initialize assignment & preflight
(async function init() {
  if (!assignmentId) {
    try {
      const res = await api('/api/interviews/ai/default-assignment');
      const data = await res.json();
      if (data.assignmentId) {
        assignmentId = data.assignmentId;
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('assignment', assignmentId);
        window.history.replaceState({}, '', newUrl);
      }
    } catch (e) {
      console.warn('Unable to get default assignment:', e);
    }
  }

  // Pre-load speech synthesis voices
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  updateStartAvailability();
})();

// Consent & Camera preflight
function onAcknowledgementChange() {
  const acknowledged = document.getElementById('rulesAcknowledged').checked;
  const previewBtn = document.getElementById('previewMediaBtn');
  previewBtn.disabled = !acknowledged;
  if (acknowledged && !isCameraReady() && !state.cameraRequestPending) {
    requestRequiredCameraAccess();
  }
  updateStartAvailability();
}

function updateStartAvailability() {
  const acknowledged = document.getElementById('rulesAcknowledged').checked;
  const confirmationValue = document.getElementById('startConfirmation').value.trim().toUpperCase();
  const confirmationValid = confirmationValue === 'START';
  const startBtn = document.getElementById('startBtn');
  const previewBtn = document.getElementById('previewMediaBtn');
  previewBtn.disabled = !acknowledged;
  startBtn.disabled = !(acknowledged && confirmationValid && isCameraReady() && !state.starting);
}

function isCameraReady() {
  const track = state.stream?.getVideoTracks?.()[0];
  return Boolean(track && track.readyState === 'live' && track.enabled && !track.muted);
}

async function requestRequiredCameraAccess() {
  if (state.cameraRequestPending) return;
  state.cameraRequestPending = true;
  const statusEl = document.getElementById('preflightCameraStatus');
  const previewBox = document.getElementById('preflightCamera');
  const videoEl = document.getElementById('preflightCameraPreview');
  statusEl.textContent = 'Requesting camera access...';
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported in this browser.');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false
    });
    stopMediaStream(state.stream);
    state.stream = stream;
    bindMediaTracks(stream);
    videoEl.srcObject = stream;
    previewBox.classList.remove('hidden');
    statusEl.textContent = 'Camera ready';
    statusEl.classList.add('camera-ready');
    if (state.cameraPreflightMonitor) clearInterval(state.cameraPreflightMonitor);
    state.cameraPreflightMonitor = setInterval(() => {
      if (!isCameraReady()) {
        statusEl.textContent = 'Camera disconnected';
        statusEl.classList.remove('camera-ready');
        updateStartAvailability();
      }
    }, 1000);
  } catch (error) {
    let msg = 'Camera access denied.';
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      msg = 'Camera permission blocked. Please allow Camera for localhost in your browser settings and try again.';
    } else if (error.name === 'NotFoundError') {
      msg = 'No camera found. Please connect your webcam and try again.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      msg = 'The camera is already being used by another application. Please close other camera apps and retry.';
    } else if (error.message) {
      msg = error.message;
    }
    statusEl.textContent = msg;
    statusEl.classList.remove('camera-ready');
  } finally {
    state.cameraRequestPending = false;
    updateStartAvailability();
  }
}

// Start Interview Lifecycle
async function startInterview() {
  if (!assignmentId || state.starting || state.attemptId) return;
  state.starting = true;
  document.getElementById('startBtn').disabled = true;

  try {
    const response = await api(`/api/interviews/assignments/${assignmentId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({
        acknowledged: true,
        confirmation: 'START',
        cameraReady: isCameraReady()
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to start interview.');

    state.attemptId = data.attemptId;
    state.questions = (data.questions && data.questions.length) ? data.questions : HR_TOPICS.map((t, idx) => ({
      id: `ai-q-${idx}`,
      question_text: t.defaultPrompt,
      category: t.category,
      topic: t.topic,
      difficulty: 'medium',
      marks: 10
    }));

    if (state.cameraPreflightMonitor) clearInterval(state.cameraPreflightMonitor);
    state.cameraPreflightMonitor = null;

    document.getElementById('cameraPreview').srcObject = state.stream;
    document.getElementById('cameraStatus').textContent = 'Camera active';
    state.setupGracePeriodEnd = Date.now() + 10000;
    startMonitoring();
    startLiveStreamSignaling();
    initFaceDetector().then(() => startFaceMonitoring()).catch(err => console.warn('Face detection init:', err));
    attachAnswerFieldMonitoring();

    document.getElementById('consentPanel').classList.add('hidden');
    document.getElementById('roomPanel').classList.remove('hidden');

    // Start Session Clock
    startSessionClock();

    // Start Audio & Speech Systems
    await startAutomaticMicrophone();
    setupSpeechRecognition();

    // Kick off interview with Question 1
    state.index = 0;
    renderCurrentQuestion(true);

  } catch (error) {
    setRoomStatus(error.message, 'error');
  } finally {
    state.starting = false;
    updateStartAvailability();
  }
}

// Session Timer (overall duration)
function startSessionClock() {
  state.sessionSeconds = 0;
  if (state.sessionClockTimer) clearInterval(state.sessionClockTimer);
  state.sessionClockTimer = setInterval(() => {
    state.sessionSeconds += 1;
    const mins = String(Math.floor(state.sessionSeconds / 60)).padStart(2, '0');
    const secs = String(state.sessionSeconds % 60).padStart(2, '0');
    const el = document.getElementById('sessionTimer');
    if (el) el.textContent = `${mins}:${secs}`;
  }, 1000);
}

// Render Current Stage / Question
function renderCurrentQuestion(speakQuestion = false) {
  const currentQ = state.questions[state.index] || HR_TOPICS[Math.min(state.index, HR_TOPICS.length - 1)];
  const topicName = currentQ.topic || HR_TOPICS[state.index]?.topic || 'HR Interview';
  const questionText = currentQ.question_text || currentQ.questionText || HR_TOPICS[state.index]?.defaultPrompt;

  // Update UI headers
  document.getElementById('questionMeta').textContent = `Stage ${state.index + 1} of ${state.questions.length}`;
  document.getElementById('questionText').textContent = questionText;
  document.getElementById('questionTopic').textContent = `${(currentQ.category || 'hr').toUpperCase()} / ${topicName}`;

  document.getElementById('aiSpokenQuestionText').textContent = questionText;
  const progressPct = ((state.index + 1) / state.questions.length) * 100;
  document.getElementById('progressBar').style.width = `${progressPct}%`;
  document.getElementById('progressLabel').textContent = `Stage ${state.index + 1} of ${state.questions.length}: ${topicName}`;

  renderPalette();

  // Reset turn state
  state.currentTurnTranscript = '';
  state.hasSpokenInTurn = false;
  state.turnSecondsRemaining = 180;
  document.getElementById('liveTranscriptText').textContent = 'Waiting for you to begin speaking...';
  document.getElementById('liveTranscriptText').style.fontStyle = 'italic';
  document.getElementById('liveTranscriptText').style.color = '#334155';

  startTurnCountdown();

  if (speakQuestion) {
    const greeting = state.index === 0
      ? "Hello and welcome! I'm Sarah, your AI HR interviewer today. To get us started, could you please tell me about yourself, your educational journey, and what drives your passion in this field?"
      : questionText;
    speakAloud(greeting);
  }
}

function startTurnCountdown() {
  if (state.turnTimer) clearInterval(state.turnTimer);
  state.turnTimer = setInterval(() => {
    state.turnSecondsRemaining = Math.max(0, state.turnSecondsRemaining - 1);
    const m = String(Math.floor(state.turnSecondsRemaining / 60)).padStart(2, '0');
    const s = String(state.turnSecondsRemaining % 60).padStart(2, '0');
    const el = document.getElementById('answerTimer');
    if (el) el.textContent = `${m}:${s}`;
    if (state.turnSecondsRemaining === 0) {
      clearInterval(state.turnTimer);
      finishCandidateTurn('timeout');
    }
  }, 1000);
}

function renderPalette() {
  const palette = document.getElementById('palette');
  if (!palette) return;
  palette.innerHTML = state.questions.map((q, idx) => {
    const isCurrent = idx === state.index;
    const isAnswered = Boolean(state.answers[q.id]);
    const topic = q.topic || `Stage ${idx + 1}`;
    return `<button type="button" class="${isCurrent ? 'active' : ''} ${isAnswered ? 'answered' : ''}" data-idx="${idx}" title="${topic}">
      ${idx + 1}
    </button>`;
  }).join('');

  palette.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetIdx = Number(btn.dataset.idx);
      if (targetIdx !== state.index && !state.isAiSpeaking) {
        state.index = targetIdx;
        renderCurrentQuestion(true);
      }
    });
  });
}

// Text-to-Speech (TTS)
function speakAloud(text, onComplete) {
  if (!state.aiVoiceEnabled || !('speechSynthesis' in window)) {
    document.getElementById('aiTurnStatus').textContent = 'Candidate Turn';
    setVoiceStatus('Listening', 'green');
    startListening();
    if (onComplete) onComplete();
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch {}

  state.isAiSpeaking = true;
  stopListening(false);
  updateAiSpeechWaves(true);
  setVoiceStatus('AI Speaking', 'ai-speaking');
  document.getElementById('aiTurnStatus').textContent = 'Sarah Speaking...';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Zira') || v.name.includes('Victoria')) && v.lang.startsWith('en'))
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0];
  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.onend = () => {
    state.isAiSpeaking = false;
    updateAiSpeechWaves(false);
    setVoiceStatus('Listening', 'listening');
    document.getElementById('aiTurnStatus').textContent = 'Listening for Candidate';
    startListening();
    if (onComplete) onComplete();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    state.isAiSpeaking = false;
    updateAiSpeechWaves(false);
    setVoiceStatus('Listening', 'listening');
    document.getElementById('aiTurnStatus').textContent = 'Listening for Candidate';
    startListening();
    if (onComplete) onComplete();
  };

  window.speechSynthesis.speak(utterance);
}

function updateAiSpeechWaves(active) {
  const waves = document.getElementById('aiSpeechWaves');
  const avatar = document.getElementById('aiAvatar');
  if (waves) waves.classList.toggle('active', active);
  if (avatar) avatar.classList.toggle('speaking', active);
}

function toggleAiVoice() {
  state.aiVoiceEnabled = !state.aiVoiceEnabled;
  if (!state.aiVoiceEnabled && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    updateAiSpeechWaves(false);
    state.isAiSpeaking = false;
    startListening();
  }
  const label = document.getElementById('voiceToggleLabel');
  if (label) label.textContent = state.aiVoiceEnabled ? 'AI Voice: On' : 'AI Voice: Muted';
}

function repeatCurrentQuestion() {
  if (state.isAiSpeaking) return;
  const currentQ = state.questions[state.index];
  const questionText = currentQ?.question_text || currentQ?.questionText || HR_TOPICS[state.index]?.defaultPrompt;
  speakAloud(questionText);
}

async function skipCurrentQuestion() {
  if (state.isAiSpeaking) return;
  const currentQ = state.questions[state.index];
  state.answers[currentQ.id] = '[Skipped by candidate]';
  appendConversationBubble('student', 'I would like to skip this question and proceed to the next topic.');

  if (state.index + 1 >= state.questions.length) {
    finishInterviewWithFeedback();
    return;
  }

  state.index += 1;
  const nextQ = state.questions[state.index];
  const nextText = nextQ?.question_text || nextQ?.questionText || HR_TOPICS[state.index]?.defaultPrompt;

  document.getElementById('aiAckText').textContent = '"Understood, no problem at all. Let\'s move forward."';
  speakAloud(`Understood, no problem at all. ${nextText}`, () => {
    renderCurrentQuestion(false);
  });
}

// Speech-to-Text (STT) & Listening
function setupSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    console.warn('Web Speech Recognition unavailable. Will use server Whisper fallback.');
    return;
  }

  const recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        state.currentTurnTranscript += ' ' + event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    state.lastSpeechAt = Date.now();
    state.hasSpokenInTurn = true;
    const full = (state.currentTurnTranscript + ' ' + interim).trim();
    const liveBox = document.getElementById('liveTranscriptText');
    if (liveBox && full) {
      liveBox.textContent = `"${full}"`;
      liveBox.style.color = '#1e293b';
      liveBox.style.fontStyle = 'normal';
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return;
    console.warn('SpeechRecognition error:', event.error);
    if (event.error === 'not-allowed') {
      setMicError('Microphone access is blocked in your browser settings.');
      setVoiceStatus('Mic blocked', 'red');
    }
  };

  recognition.onend = () => {
    if (state.isListening && !state.completed && !state.isAiSpeaking) {
      try { recognition.start(); } catch {}
    }
  };

  state.recognition = recognition;
}

function startListening() {
  if (state.isAiSpeaking || state.completed) return;
  state.isListening = true;
  state.lastSpeechAt = Date.now();
  setVoiceStatus('Listening', 'listening');

  if (state.recognition) {
    try { state.recognition.start(); } catch {}
  }

  startMediaRecording();
}

function stopListening(stopRecognition = true) {
  state.isListening = false;
  if (stopRecognition && state.recognition) {
    try { state.recognition.stop(); } catch {}
  }
}

// MediaRecorder (audio file preservation)
function startMediaRecording() {
  if (!state.audioStream || (state.recorder && state.recorder.state === 'recording')) return;
  try {
    const mimeType = typeof MediaRecorder.isTypeSupported === 'function'
      ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/wav']
          .find(t => MediaRecorder.isTypeSupported(t)) || ''
      : '';
    const recorder = mimeType ? new MediaRecorder(state.audioStream, { mimeType }) : new MediaRecorder(state.audioStream);
    state.recordingChunks = [];
    recorder.ondataavailable = e => { if (e.data.size) state.recordingChunks.push(e.data); };
    recorder.start(1000);
    state.recorder = recorder;

    const ind = document.getElementById('recordingIndicator');
    if (ind) ind.classList.remove('hidden');
  } catch (err) {
    console.warn('MediaRecorder start failed:', err);
  }
}

function stopMediaRecording() {
  return new Promise(resolve => {
    const ind = document.getElementById('recordingIndicator');
    if (ind) ind.classList.add('hidden');

    if (!state.recorder || state.recorder.state !== 'recording') {
      resolve(null);
      return;
    }
    state.recorder.onstop = () => {
      const blob = new Blob(state.recordingChunks, { type: state.recorder.mimeType || 'audio/webm' });
      state.recorder = null;
      resolve(blob);
    };
    try { state.recorder.stop(); } catch { resolve(null); }
  });
}

// Voice Activity Detection (VAD)
async function startAutomaticMicrophone() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone recording is not available.');
    state.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    bindMediaTracks(state.audioStream);

    document.getElementById('micStatus').textContent = 'Mic active';
    setMicError('Microphone connected. Voice activity detection running.');
    setVoiceStatus('Mic ready', 'listening');

    // AudioContext VAD
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 1024;
    state.audioSource = state.audioContext.createMediaStreamSource(state.audioStream);
    state.audioSource.connect(state.analyser);

    if (state.audioLevelTimer) clearInterval(state.audioLevelTimer);
    state.audioLevelTimer = setInterval(checkVoiceActivity, 100);

  } catch (err) {
    document.getElementById('micStatus').textContent = 'Mic unavailable';
    setVoiceStatus('Mic error', 'red');
    setMicError(err.message || 'Microphone access denied. You can use text input.');
  }
}

function checkVoiceActivity() {
  if (!state.analyser || !state.attemptId || state.completed) return;
  const samples = new Uint8Array(state.analyser.fftSize);
  state.analyser.getByteTimeDomainData(samples);

  let sum = 0;
  for (const s of samples) {
    const norm = (s - 128) / 128;
    sum += norm * norm;
  }
  const rms = Math.sqrt(sum / samples.length);
  const meter = document.getElementById('voiceLevel');
  if (meter) meter.style.width = `${Math.min(100, Math.round(rms * 450))}%`;

  if (state.isAiSpeaking || !state.isListening) return;

  const now = Date.now();
  if (rms >= state.voiceLevelThreshold) {
    state.lastSpeechAt = now;
    state.hasSpokenInTurn = true;
    setVoiceStatus('Speaking', 'speaking');
    const cd = document.getElementById('silenceCountdownText');
    if (cd) cd.textContent = 'Speaking detected...';
    return;
  }

  // Silence threshold check
  if (state.hasSpokenInTurn) {
    const elapsed = now - state.lastSpeechAt;
    const remaining = Math.max(0, ((state.silenceThresholdMs - elapsed) / 1000)).toFixed(1);
    const cd = document.getElementById('silenceCountdownText');
    if (cd) cd.textContent = `Silence detected (${remaining}s remaining)...`;
    setVoiceStatus('Pause detected', 'silence');

    if (elapsed >= state.silenceThresholdMs) {
      const transcript = (state.currentTurnTranscript || '').trim();
      if (transcript.split(/\s+/).length >= 2) {
        finishCandidateTurn();
      }
    }
  } else {
    const cd = document.getElementById('silenceCountdownText');
    if (cd) cd.textContent = 'Listening for speech...';
  }
}

// Finish Candidate Turn and Call AI Conversation Endpoint
async function finishCandidateTurn(reason = 'normal') {
  if (state.saving || state.completed) return;
  state.saving = true;

  stopListening(true);
  const audioBlob = await stopMediaRecording();

  const currentQ = state.questions[state.index] || HR_TOPICS[state.index];
  let studentAnswer = (state.currentTurnTranscript || '').trim();
  const textInputVal = document.getElementById('answerText').value.trim();
  if (!studentAnswer && textInputVal) studentAnswer = textInputVal;

  if (!studentAnswer && reason !== 'timeout') {
    state.saving = false;
    startListening();
    return;
  }

  if (!studentAnswer && reason === 'timeout') {
    studentAnswer = '[Candidate provided brief response]';
  }

  // Update UI and local answer map
  state.answers[currentQ.id] = studentAnswer;
  state.conversationHistory.push({ role: 'student', text: studentAnswer });
  appendConversationBubble('student', studentAnswer);

  // Indicate AI Thinking
  setVoiceStatus('AI Thinking...', 'thinking');
  document.getElementById('aiTurnStatus').textContent = 'Sarah Analyzing Answer...';
  document.getElementById('aiAckText').textContent = '"Evaluating your response..."';

  // Save answer audio to database in background
  if (audioBlob) {
    saveAnswerAudio(currentQ.id, audioBlob, studentAnswer).catch(e => console.warn('Audio save:', e));
  }

  try {
    const converseRes = await api('/api/interviews/ai/converse', {
      method: 'POST',
      body: JSON.stringify({
        attemptId: state.attemptId,
        questionId: currentQ.id,
        studentAnswer,
        topicIndex: state.index,
        conversationHistory: state.conversationHistory,
        topic: currentQ.topic
      })
    });
    const data = await converseRes.json();

    const acknowledgement = data.acknowledgement || 'Thank you for that response.';
    const nextQuestion = data.questionText || HR_TOPICS[Math.min(state.index + 1, HR_TOPICS.length - 1)].defaultPrompt;
    const speechText = data.speechText || `${acknowledgement} ${nextQuestion}`;

    // Update conversation history
    state.conversationHistory.push({ role: 'interviewer', text: speechText });
    appendConversationBubble('interviewer', speechText);

    // If final topic was completed, transition to feedback
    if (data.isFinalQuestion || state.index + 1 >= state.questions.length) {
      document.getElementById('aiAckText').textContent = `"${acknowledgement}"`;
      document.getElementById('aiSpokenQuestionText').textContent = 'That concludes our core interview topics today. Thank you for your comprehensive answers.';

      speakAloud(`${acknowledgement} That concludes all our interview topics today. Thank you so much for your thoughtful answers. Let us now generate your comprehensive evaluation report.`, () => {
        finishInterviewWithFeedback();
      });
      return;
    }

    // Move to next stage
    state.index += 1;
    document.getElementById('aiAckText').textContent = `"${acknowledgement}"`;
    document.getElementById('aiSpokenQuestionText').textContent = nextQuestion;

    speakAloud(speechText, () => {
      renderCurrentQuestion(false);
    });

  } catch (err) {
    console.error('Converse API error:', err);
    // Graceful fallback
    state.index += 1;
    if (state.index >= state.questions.length) {
      finishInterviewWithFeedback();
    } else {
      renderCurrentQuestion(true);
    }
  } finally {
    state.saving = false;
  }
}

// Conversation Transcript Chat Stream
function appendConversationBubble(role, text) {
  const stream = document.getElementById('conversationStream');
  if (!stream) return;

  const bubble = document.createElement('div');
  bubble.className = `transcript-bubble ${role === 'interviewer' ? 'interviewer' : 'candidate'}`;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const authorName = role === 'interviewer' ? 'Sarah Jenkins (AI Recruiter)' : 'You (Candidate)';

  bubble.innerHTML = `
    <div class="bubble-author">
      <span>${authorName}</span>
      <span>${timeStr}</span>
    </div>
    <p class="bubble-text">${escapeHtml(text)}</p>
  `;

  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;

  const countBadge = document.getElementById('transcriptCountBadge');
  if (countBadge) {
    const exchanges = Math.floor(state.conversationHistory.length / 2);
    countBadge.textContent = `${exchanges} turn${exchanges === 1 ? '' : 's'}`;
  }
}

// Save answer audio to backend
async function saveAnswerAudio(questionId, blob, answerText) {
  if (!state.attemptId) return;
  const form = new FormData();
  form.append('questionId', questionId);
  form.append('answerText', answerText);
  form.append('transcriptSource', 'speech');
  form.append('audio', blob, `answer-${questionId}.webm`);

  await api(`/api/interviews/attempts/${state.attemptId}/answers`, {
    method: 'PUT',
    body: form
  });
}

// End Interview & Generate Comprehensive Feedback
async function finishInterviewWithFeedback() {
  if (state.submitting || state.completed) return;
  state.submitting = true;

  stopListening(true);
  cleanupMedia();
  if (state.sessionClockTimer) clearInterval(state.sessionClockTimer);
  if (state.turnTimer) clearInterval(state.turnTimer);

  document.getElementById('submitBtn').disabled = true;
  document.getElementById('roomPanel').classList.add('hidden');
  document.getElementById('completionPanel').classList.remove('hidden');

  const container = document.getElementById('feedbackReportContainer');
  container.innerHTML = `
    <div style="text-align:center; padding:40px 20px;">
      <div class="pill blue" style="font-size:14px; padding:8px 18px; margin-bottom:14px;">
        AI Interview Evaluation Engine Running...
      </div>
      <h3 style="margin:0 0 8px;">Analyzing communication, confidence, relevance &amp; structure...</h3>
      <p style="color:#64748b;">Generating your personalized feedback report powered by Groq LLM intelligence.</p>
    </div>
  `;

  try {
    const res = await api('/api/interviews/ai/feedback', {
      method: 'POST',
      body: JSON.stringify({
        attemptId: state.attemptId,
        conversationHistory: state.conversationHistory
      })
    });
    const data = await res.json();
    state.completed = true;

    renderFeedbackReport(data.feedback || {});

  } catch (err) {
    console.error('Feedback generation error:', err);
    container.innerHTML = `
      <div class="status error">Unable to generate feedback at this time: ${escapeHtml(err.message)}</div>
    `;
  } finally {
    state.submitting = false;
  }
}

function renderFeedbackReport(feedback) {
  const container = document.getElementById('feedbackReportContainer');
  if (!container) return;

  const scores = feedback.scores || {};
  const overall = feedback.overallScore || 75;
  const ratingText = overall >= 85 ? 'Outstanding · Job Ready' : overall >= 70 ? 'Strong Candidate · Placement Ready' : overall >= 55 ? 'Competent · Practice Recommended' : 'Developing · Additional Practice Needed';
  const ratingColor = overall >= 80 ? '#10b981' : overall >= 65 ? '#2563eb' : '#f59e0b';

  container.innerHTML = `
    <div class="feedback-hero">
      <div style="flex:1;">
        <span class="pill" style="background:rgba(255,255,255,0.15); color:#fff; margin-bottom:8px;">AI Evaluation Score</span>
        <h3 style="font-size:22px; margin:0 0 6px; color:#fff;">Placement Readiness Assessment</h3>
        <p style="margin:0; color:#cbd5e1; font-size:14px; line-height:1.5;">${escapeHtml(feedback.executiveSummary || 'Comprehensive evaluation completed across all core interview competencies.')}</p>
        <div style="margin-top:12px; display:inline-block; padding:4px 12px; border-radius:99px; background:${ratingColor}; color:#fff; font-size:13px; font-weight:700;">
          ${ratingText}
        </div>
      </div>
      <div class="score-circle-wrapper" style="border-color:${ratingColor};">
        <span class="score-circle-number">${overall}</span>
        <span class="score-circle-label">Overall</span>
      </div>
    </div>

    <!-- 5 Core Dimensions Grid -->
    <div class="feedback-dimensions-grid">
      <div class="dimension-card">
        <div class="dimension-header">
          <span>Communication</span>
          <strong style="color:#2563eb;">${scores.communication ?? 75}%</strong>
        </div>
        <div class="dimension-progress-bg"><div class="dimension-progress-fill" style="width:${scores.communication ?? 75}%;"></div></div>
        <span style="font-size:12px; color:#64748b;">Articulation, clarity &amp; pacing</span>
      </div>
      <div class="dimension-card">
        <div class="dimension-header">
          <span>Confidence</span>
          <strong style="color:#10b981;">${scores.confidence ?? 75}%</strong>
        </div>
        <div class="dimension-progress-bg"><div class="dimension-progress-fill" style="width:${scores.confidence ?? 75}%; background:#10b981;"></div></div>
        <span style="font-size:12px; color:#64748b;">Conviction &amp; steady presence</span>
      </div>
      <div class="dimension-card">
        <div class="dimension-header">
          <span>Relevance</span>
          <strong style="color:#8b5cf6;">${scores.relevance ?? 80}%</strong>
        </div>
        <div class="dimension-progress-bg"><div class="dimension-progress-fill" style="width:${scores.relevance ?? 80}%; background:#8b5cf6;"></div></div>
        <span style="font-size:12px; color:#64748b;">Direct answer alignment</span>
      </div>
      <div class="dimension-card">
        <div class="dimension-header">
          <span>Clarity</span>
          <strong style="color:#f59e0b;">${scores.clarity ?? 70}%</strong>
        </div>
        <div class="dimension-progress-bg"><div class="dimension-progress-fill" style="width:${scores.clarity ?? 70}%; background:#f59e0b;"></div></div>
        <span style="font-size:12px; color:#64748b;">Conciseness &amp; logic</span>
      </div>
      <div class="dimension-card">
        <div class="dimension-header">
          <span>Answer Structure</span>
          <strong style="color:#06b6d4;">${scores.answerStructure ?? 70}%</strong>
        </div>
        <div class="dimension-progress-bg"><div class="dimension-progress-fill" style="width:${scores.answerStructure ?? 70}%; background:#06b6d4;"></div></div>
        <span style="font-size:12px; color:#64748b;">STAR methodology &amp; flow</span>
      </div>
    </div>

    <!-- Strengths & Areas for Improvement -->
    <div class="feedback-sections-grid">
      <div class="feedback-column-card">
        <h4 style="color:#047857;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Key Strengths Demonstrated
        </h4>
        <ul class="feedback-bullets">
          ${(feedback.strengths || ['Clear vocal delivery', 'Positive professional attitude', 'Relevant educational examples']).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>

      <div class="feedback-column-card">
        <h4 style="color:#b45309;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Actionable Improvement Areas
        </h4>
        <ul class="feedback-bullets">
          ${(feedback.areasForImprovement || ['Structure behavioral answers with the STAR method (Situation, Task, Action, Result)', 'Provide more quantitative metrics to back up project claims', 'Maintain concise summaries to keep answers focused']).map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Helpers & UI utilities
function setVoiceStatus(text, type = 'orange') {
  const el = document.getElementById('voiceStatus');
  if (!el) return;
  el.textContent = text;
  el.className = `pill vad-status-pill ${type}`;
}

function setMicError(msg) {
  const el = document.getElementById('micErrorText');
  if (el) el.textContent = msg;
}

function setRoomStatus(msg, type = 'error') {
  const el = document.getElementById('roomStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
}

function toggleTextInput() {
  const textarea = document.getElementById('answerText');
  textarea.classList.toggle('hidden');
  if (!textarea.classList.contains('hidden')) {
    textarea.focus();
    textarea.removeAttribute('aria-hidden');
    textarea.removeAttribute('tabindex');
  } else {
    textarea.setAttribute('aria-hidden', 'true');
    textarea.setAttribute('tabindex', '-1');
  }
}

function navigateQuestion(delta) {
  const newIdx = state.index + delta;
  if (newIdx >= 0 && newIdx < state.questions.length && !state.isAiSpeaking) {
    state.index = newIdx;
    renderCurrentQuestion(true);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Monitoring, Face Detection & WebRTC camera streaming
let faceDetectorInstance = null;

async function initFaceDetector() {
  if (state.faceDetectorReady || state.faceMonitoringUnavailable) return;
  try {
    const vision = await import('/vendor/mediapipe/vision_bundle.mjs');
    const { FilesetResolver, FaceDetector } = vision;
    const fileset = await FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm');
    faceDetectorInstance = await FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.60
    });
    state.faceDetectorReady = true;
    state.faceDetectorBackend = 'mediapipe';
    console.log('[PROCTORING] MediaPipe FaceDetector loaded successfully.');
  } catch (err) {
    console.warn('[PROCTORING] MediaPipe face detector unavailable:', err.message);
    state.faceMonitoringUnavailable = true;
    recordEvent('manual', 'Camera-based checks are not supported in this browser.', 'info', { signal: 'face_detection_unavailable' });
  }
}

function startFaceMonitoring() {
  if (state.faceMonitor) clearInterval(state.faceMonitor);
  const video = document.getElementById('cameraPreview');
  let lastVideoTime = -1;

  state.faceMonitor = setInterval(async () => {
    if (!state.attemptId || state.completed || !state.faceDetectorReady || !faceDetectorInstance || state.faceDetectionRunning) return;
    if (Date.now() < state.setupGracePeriodEnd) return; // 10s initial grace period
    if (!isCameraReady() || !video || video.readyState < 2 || video.paused) return;

    state.faceDetectionRunning = true;
    try {
      const now = performance.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const detections = faceDetectorInstance.detectForVideo(video, now);
        const count = detections.detections?.length || 0;

        if (count === 0) {
          state.consecutiveNoFace = (state.consecutiveNoFace || 0) + 1;
          state.consecutiveMultipleFaces = 0;
          if (state.consecutiveNoFace === 4) { // 4 consecutive seconds without face
            recordEvent('face_absent', 'No face was detected in camera view.', 'low');
          }
        } else if (count > 1) {
          state.consecutiveMultipleFaces = (state.consecutiveMultipleFaces || 0) + 1;
          state.consecutiveNoFace = 0;
          if (state.consecutiveMultipleFaces === 2) { // 2 consecutive seconds with multiple faces
            recordEvent('multiple_faces', 'Multiple faces detected in camera view.', 'medium');
          }
        } else {
          // Exactly 1 face detected: normal recovery
          state.consecutiveNoFace = 0;
          state.consecutiveMultipleFaces = 0;
        }
      }
    } catch (e) {
      console.warn('[PROCTORING] Face detection error:', e.message);
    } finally {
      state.faceDetectionRunning = false;
    }
  }, 1000);
}

function attachAnswerFieldMonitoring() {
  const answerEl = document.getElementById('answerText');
  if (!answerEl || answerEl.dataset.monitored) return;
  answerEl.dataset.monitored = 'true';
  ['paste', 'copy', 'cut'].forEach(action => {
    answerEl.addEventListener(action, () => {
      if (!state.attemptId || state.completed) return;
      recordEvent('manual', `Answer-field ${action} action noted for faculty review.`, 'info', { signal: 'clipboard', action });
    });
  });
}

function startMonitoring() {
  if (state.monitoringStarted) return;
  state.monitoringStarted = true;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('pagehide', handlePageHide);
  bindMediaTracks(state.stream);
  state.mediaHealthMonitor = setInterval(checkCameraHealth, 1000);
}

function stopMonitoring() {
  if (state.faceMonitor) clearInterval(state.faceMonitor);
  if (state.mediaHealthMonitor) clearInterval(state.mediaHealthMonitor);
  if (state.tabSwitchCooldownTimer) clearTimeout(state.tabSwitchCooldownTimer);
  state.faceMonitor = null;
  state.mediaHealthMonitor = null;
  state.tabSwitchCooldownTimer = null;
  if (!state.monitoringStarted) return;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('blur', handleWindowBlur);
  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('pagehide', handlePageHide);
  state.monitoringStarted = false;
}

function bindMediaTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => {
    if (state.mediaTrackListeners.has(track)) return;
    const onEnded = () => {
      if (track.kind === 'video') {
        document.getElementById('cameraStatus').textContent = 'Camera unavailable';
        document.getElementById('cameraFallback').classList.remove('hidden');
        recordEvent('manual', 'Camera access ended during the interview.', 'info', { signal: 'media_track_ended' });
      } else {
        document.getElementById('micStatus').textContent = 'Mic unavailable';
        recordEvent('manual', 'Microphone access ended during the interview.', 'info', { signal: 'media_track_ended' });
      }
    };
    state.mediaTrackListeners.set(track, { onEnded });
    track.addEventListener('ended', onEnded, { once: true });
  });
}

function stopMediaStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
}

function checkCameraHealth() {
  if (!state.attemptId || state.completed) return;
  const track = state.stream?.getVideoTracks?.()[0];
  if (track && track.readyState === 'live' && track.enabled && !track.muted) {
    document.getElementById('cameraStatus').textContent = 'Camera active';
    document.getElementById('cameraFallback').classList.add('hidden');
  } else {
    document.getElementById('cameraStatus').textContent = 'Camera unavailable';
    document.getElementById('cameraFallback').classList.remove('hidden');
  }
}

function cleanupMedia() {
  stopMonitoring();
  stopListening(true);
  if (state.audioLevelTimer) clearInterval(state.audioLevelTimer);
  state.audioLevelTimer = null;
  if (state.cameraPreflightMonitor) clearInterval(state.cameraPreflightMonitor);
  state.cameraPreflightMonitor = null;
  stopMediaStream(state.stream);
  stopMediaStream(state.audioStream);
  state.stream = null;
  state.audioStream = null;
  if (state.socket) {
    try { state.socket.disconnect(); } catch {}
    state.socket = null;
  }
}

function startLiveStreamSignaling() {
  if (!state.attemptId || state.socket || typeof io !== 'function') return;
  state.socket = io({ auth: { token } });
  state.socket.on('connect', () => {
    state.socket.emit('join-attempt', state.attemptId);
  });
  state.socket.on('interview:warning-update', (data) => {
    if (!data || data.attemptId !== state.attemptId) return;
    if (typeof data.warningsCount === 'number') {
      state.warningsCount = data.warningsCount;
      if (data.warningsCount > 0) {
        displayWarningBanner(data.warningsCount, data.message, data.action);
        updateEventLogUI(data.eventType, data.severity, data.message);
      }
    }
    if (data.action === 'fullscreen') {
      requestInterviewFullscreen();
    }
    if (data.terminated) {
      handleInterviewTermination(data.message);
    }
  });
  state.socket.on('interview:terminated', (data) => {
    if (!data || data.attemptId !== state.attemptId) return;
    handleInterviewTermination(data.message);
  });
  state.socket.on('proctor:request-stream', ({ attemptId, viewerId } = {}) => {
    if (attemptId !== state.attemptId || !viewerId || !isCameraReady()) return;
    createLivePeer(viewerId).catch(e => console.warn('Peer create error:', e));
  });
  state.socket.on('proctor:stop-stream', ({ attemptId, viewerId } = {}) => {
    if (attemptId !== state.attemptId || !viewerId) return;
    closeLivePeer(viewerId);
  });
  state.socket.on('webrtc:answer', async ({ attemptId, answer, viewerId } = {}) => {
    if (attemptId !== state.attemptId || !answer || !viewerId) return;
    const peer = state.peerConnections.get(viewerId);
    if (!peer) return;
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
      const pending = state.pendingIce.get(viewerId) || [];
      for (const candidate of pending) await peer.addIceCandidate(candidate);
      state.pendingIce.delete(viewerId);
    } catch (e) {
      console.warn('Set remote desc error:', e);
    }
  });
  state.socket.on('webrtc:ice', async ({ attemptId, candidate, viewerId } = {}) => {
    if (attemptId !== state.attemptId || !candidate || !viewerId) return;
    const peer = state.peerConnections.get(viewerId);
    if (!peer || !peer.remoteDescription) {
      const pending = state.pendingIce.get(viewerId) || [];
      pending.push(candidate);
      state.pendingIce.set(viewerId, pending);
      return;
    }
    try { await peer.addIceCandidate(candidate); } catch {}
  });
}

async function createLivePeer(viewerId) {
  closeLivePeer(viewerId);
  const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  state.peerConnections.set(viewerId, peer);
  state.stream.getVideoTracks().forEach(track => peer.addTrack(track, state.stream));
  peer.onicecandidate = event => {
    if (event.candidate) state.socket?.emit('webrtc:ice', {
      attemptId: state.attemptId,
      viewerId,
      target: 'admin',
      candidate: event.candidate
    });
  };
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  state.socket?.emit('webrtc:offer', { attemptId: state.attemptId, viewerId, offer: peer.localDescription });
}

function closeLivePeer(viewerId) {
  const peer = state.peerConnections.get(viewerId);
  if (peer) {
    try { peer.close(); } catch {}
  }
  state.peerConnections.delete(viewerId);
  state.pendingIce.delete(viewerId);
}

function handlePageHide() {
  if (!state.attemptId || state.completed || state.pageHideRecorded) return;
  state.pageHideRecorded = true;
  recordEvent('manual', 'Interview page was left or refreshed while the attempt was active.', 'info', { signal: 'pagehide' }, true);
  cleanupMedia();
}

function handleVisibilityChange() {
  if (document.hidden && state.attemptId && !state.completed) {
    if (state.tabSwitchLocked) return;
    state.tabSwitchLocked = true;
    clearTimeout(state.tabSwitchCooldownTimer);
    state.tabSwitchCooldownTimer = setTimeout(() => { state.tabSwitchLocked = false; }, 5000);
    recordEvent('visibility_hidden', 'Browser tab became hidden during the interview.', 'medium');
  }
}

function handleWindowBlur() {
  if (!state.attemptId || state.completed || state.focusLost || state.tabSwitchLocked) return;
  state.focusLost = true;
  state.tabSwitchLocked = true;
  clearTimeout(state.tabSwitchCooldownTimer);
  state.tabSwitchCooldownTimer = setTimeout(() => { state.tabSwitchLocked = false; }, 5000);
  recordEvent('window_blur', 'Interview window lost focus during the interview.', 'medium');
}

function handleWindowFocus() { state.focusLost = false; }

function handleFullscreenChange() {
  if (state.fullscreenStarted && !document.fullscreenElement && state.attemptId && !state.completed) {
    state.fullscreenStarted = false;
    recordEvent('fullscreen_exit', 'Fullscreen mode was exited.', 'low');
  }
}

function requestInterviewFullscreen() {
  if (document.fullscreenElement) return;
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().then(() => {
      state.fullscreenStarted = true;
    }).catch(e => console.warn('Fullscreen request:', e));
  }
}

function displayWarningBanner(count, message, action) {
  let banner = document.getElementById('interviewWarningBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'interviewWarningBanner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    document.body.appendChild(banner);
  }
  const isTerminal = count >= 3 || action === 'terminate';
  Object.assign(banner.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(580px, calc(100vw - 32px))',
    zIndex: '99999',
    padding: '12px 20px',
    borderRadius: '10px',
    background: isTerminal ? '#fee2e2' : '#fef3c7',
    color: isTerminal ? '#991b1b' : '#92400e',
    border: isTerminal ? '1px solid #f87171' : '1px solid #fcd34d',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    textAlign: 'center',
    fontSize: '14px',
    lineHeight: '1.4',
    display: 'block'
  });
  const actionText = action === 'fullscreen' ? ' Fullscreen is required to continue.' : action === 'terminate' ? ' Session has been terminated.' : '';
  banner.innerHTML = `<strong>Integrity warning ${count}/3:</strong> ${escapeHtml(message)}${actionText}<br><span style="font-weight:400; font-size:12px; opacity:0.9;">Please remain visible on camera and active within this tab.</span>`;
  clearTimeout(state.warningBannerTimeout);
  if (!isTerminal) {
    state.warningBannerTimeout = setTimeout(() => {
      if (banner) banner.style.display = 'none';
    }, 7000);
  }
}

function updateEventLogUI(eventType, severity, message) {
  const eventLog = document.getElementById('eventLog');
  if (eventLog) {
    const emptyNotice = eventLog.querySelector('.monitoring-empty');
    if (emptyNotice) emptyNotice.remove();
    const item = document.createElement('div');
    item.className = 'item';
    const pillClass = severity === 'high' || severity === 'medium' ? 'orange' : '';
    item.innerHTML = `<span class="pill ${pillClass}">${escapeHtml(severity)}</span><strong>${escapeHtml(eventType)}</strong><span class="subtitle">${escapeHtml(message)} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>`;
    eventLog.prepend(item);
  }
  const statusPill = document.getElementById('monitoringStatus');
  if (statusPill && state.warningsCount > 0) {
    statusPill.textContent = `${state.warningsCount} integrity warning${state.warningsCount > 1 ? 's' : ''}`;
    statusPill.className = state.warningsCount >= 3 ? 'pill red' : 'pill orange';
  }
}

function handleInterviewTermination(reason) {
  if (state.completed) return;
  state.completed = true;
  stopMonitoring();
  cleanupMedia();
  if (state.sessionClockTimer) clearInterval(state.sessionClockTimer);
  if (state.turnTimer) clearInterval(state.turnTimer);

  document.getElementById('submitBtn').disabled = true;
  document.getElementById('roomPanel').classList.add('hidden');
  const completionPanel = document.getElementById('completionPanel');
  completionPanel.classList.remove('hidden');

  const statusPill = document.getElementById('monitoringStatus');
  if (statusPill) {
    statusPill.textContent = 'Session terminated';
    statusPill.className = 'pill red';
  }

  const msgEl = document.getElementById('completionMessage');
  if (msgEl) {
    msgEl.textContent = reason || 'The interview session ended after reaching the configured integrity warning limit. All previously recorded answers and audio responses have been securely preserved for faculty review.';
  }

  const container = document.getElementById('feedbackReportContainer');
  if (container) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 20px; background:#fff1f2; border:1px solid #fecdd3; border-radius:12px; margin-top:16px;">
        <h3 style="color:#9f1239; margin-top:0;">Practice Session Ended Early</h3>
        <p style="color:#4c0519; font-size:14px; max-width:560px; margin:0 auto 16px;">
          This practice session reached the configured monitoring threshold (3 warnings). PlacementPro is a practice and learning platform: your answers prior to termination were preserved and are available for review.
        </p>
        <span class="pill red" style="font-size:13px;">Terminated: 3 of 3 Warnings Reached</span>
      </div>
    `;
  }
}

async function recordEvent(eventType, message, severity, metadata, beacon = false) {
  if (!state.attemptId || state.completed) return;
  const isWarning = ['face_absent', 'multiple_faces', 'looking_away', 'visibility_hidden', 'window_blur', 'fullscreen_exit'].includes(eventType) ||
    (eventType === 'manual' && metadata?.signal === 'clipboard');
  const now = Date.now();
  if (isWarning && (now - (state.lastEventAt[eventType] || 0)) < 5000) {
    return; // Enforce 5s debouncing cooldown per warning type
  }
  state.lastEventAt[eventType] = now;

  const payload = { eventType, message, severity, metadata };
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(`/api/interviews/attempts/${state.attemptId}/events`, JSON.stringify(payload));
    return;
  }
  try {
    const res = await api(`/api/interviews/attempts/${state.attemptId}/events`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (typeof data.warningsCount === 'number') {
        state.warningsCount = data.warningsCount;
        if (data.warningsCount > 0) {
          displayWarningBanner(data.warningsCount, message, data.action);
          updateEventLogUI(eventType, severity, message);
        }
      }
      if (data.action === 'fullscreen') {
        requestInterviewFullscreen();
      }
      if (data.terminated || data.action === 'terminate') {
        handleInterviewTermination('The interview ended after reaching the configured integrity warning limit.');
      }
    }
  } catch (e) {
    console.warn('Record event error:', e);
  }
}
