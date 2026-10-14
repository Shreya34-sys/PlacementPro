const token = localStorage.getItem('token');
if (!token) window.location.replace('/login');

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get('assignment');
if (!assignmentId) window.location.replace('/pages/interviews.html');
const configuredSilenceThresholdMs = Math.min(8000, Math.max(1000,
  Number(params.get('silenceMs') || localStorage.getItem('interviewSilenceThresholdMs') || 2500)
));

const api = (path, options = {}) => fetch(path, {
  ...options,
  headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}`, ...(options.headers || {}) }
});

const state = {
  attemptId: null,
  questions: [],
  index: 0,
  answers: {},
  source: {},
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
  autoRecording: false,
  speechActive: false,
  audioContext: null,
  analyser: null,
  audioSource: null,
  audioLevelTimer: null,
  recordingTimer: null,
  recordingStartedAt: null,
  lastSpeechAt: 0,
  speechStartedAt: 0,
  silenceThresholdMs: configuredSilenceThresholdMs,
  speechStartThresholdMs: 350,
  voiceLevelThreshold: 0.035,
  recordingChunks: [],
  recordings: {},
  saving: false,
  starting: false,
  timedOut: false,
  submitting: false,
  completed: false,
  prepLeft: 0,
  answerLeft: 0,
  timer: null,
  questionClocks: {},
  activeQuestionId: null,
  monitoringStarted: false,
  fullscreenStarted: false,
  faceDetectorUnavailableLogged: false,
  faceMonitoringUnavailable: false,
  faceDetectorBackend: null,
  faceDetectorReady: null,
  faceDetectionRunning: false,
  mediaTrackListeners: new WeakMap(),
  offline: !navigator.onLine,
  pageHideRecorded: false,
  focusLost: false,
  events: [],
  lastEventAt: {}
};

document.getElementById('previewMediaBtn').addEventListener('click', requestRequiredCameraAccess);
document.getElementById('exitInterviewBtn').addEventListener('click', event => {
  if (state.attemptId && !state.completed) {
    if (!confirm('Exit this active interview? Your saved answers will remain, but this attempt will stay in progress.')) {
      event.preventDefault();
      return;
    }
    handlePageHide();
  }
  cleanupMedia();
});
document.getElementById('rulesAcknowledged').addEventListener('change', onAcknowledgementChange);
document.getElementById('startConfirmation').addEventListener('input', updateStartAvailability);
document.getElementById('startBtn').addEventListener('click', startInterview);
document.getElementById('saveAnswerBtn').addEventListener('click', () => {
  saveCurrentAnswer().catch(error => setAnswerStatus(`Unable to save answer: ${error.message}`, 'error'));
});
document.getElementById('prevBtn').addEventListener('click', () => {
  move(-1).catch(error => setAnswerStatus(`Unable to save answer: ${error.message}`, 'error'));
});
document.getElementById('nextBtn').addEventListener('click', () => {
  move(1).catch(error => setAnswerStatus(`Unable to save answer: ${error.message}`, 'error'));
});
document.getElementById('submitBtn').addEventListener('click', submitInterview);

function updateStartAvailability() {
  const confirmed = document.getElementById('startConfirmation').value.trim().toUpperCase() === 'START';
  const acknowledged = document.getElementById('rulesAcknowledged').checked;
  document.getElementById('startBtn').disabled = !acknowledged || !confirmed || !isCameraReady() || state.starting || state.submitting || Boolean(state.attemptId);
  document.getElementById('previewMediaBtn').disabled = !acknowledged || state.cameraRequestPending || isCameraReady() || state.starting || Boolean(state.attemptId);
}

function onAcknowledgementChange() {
  if (!document.getElementById('rulesAcknowledged').checked && !state.attemptId) {
    const hadCamera = Boolean(state.stream);
    if (hadCamera) cleanupMedia();
    setCameraPermissionStatus('Camera access required', '');
    document.getElementById('previewMediaBtn').textContent = 'Request required camera access';
    if (hadCamera) {
      setRoomStatus('Camera access stopped because the guideline acknowledgement was withdrawn. Acknowledge the guidelines and request access again.', 'error');
    }
  }
  updateStartAvailability();
}

async function requestRequiredCameraAccess() {
  if (!state.attemptId && !document.getElementById('rulesAcknowledged').checked) {
    setRoomStatus('Please read and acknowledge the interview guidelines before requesting camera access.', 'error');
    return;
  }
  if (state.cameraRequestPending || state.attemptId) return;
  state.cameraRequestPending = true;
  if (state.stream && !isCameraReady()) {
    stopMediaStream(state.stream);
    state.stream = null;
    if (state.cameraPreflightMonitor) clearInterval(state.cameraPreflightMonitor);
    state.cameraPreflightMonitor = null;
  }
  document.getElementById('previewMediaBtn').textContent = 'Requesting camera accessâ€¦';
  updateStartAvailability();
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not available in this browser.');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (!isCameraReady(stream)) {
      stopMediaStream(stream);
      throw new Error('The camera did not provide a live, enabled video stream. Check the device and retry.');
    }
    if (state.stream) stopMediaStream(state.stream);
    state.stream = stream;
    state.cameraUnavailableRecorded = false;
    state.cameraPreflightMonitor = setInterval(checkPreflightCamera, 500);
    document.getElementById('preflightCameraPreview').srcObject = stream;
    document.getElementById('cameraPreview').srcObject = stream;
    document.getElementById('preflightCamera').classList.remove('hidden');
    document.getElementById('cameraFallback').classList.add('hidden');
    document.getElementById('cameraStatus').textContent = 'Camera ready';
    setCameraPermissionStatus('Camera ready', 'camera-ready');
    setRoomStatus('Camera access is ready. The preview is local only; webcam video is never recorded or uploaded.', 'success');
    document.getElementById('previewMediaBtn').textContent = 'Camera access ready';
  } catch (error) {
    state.stream = null;
    if (state.cameraPreflightMonitor) clearInterval(state.cameraPreflightMonitor);
    state.cameraPreflightMonitor = null;
    document.getElementById('preflightCameraPreview').srcObject = null;
    document.getElementById('cameraPreview').srcObject = null;
    document.getElementById('preflightCamera').classList.add('hidden');
    document.getElementById('cameraFallback').classList.remove('hidden');
    document.getElementById('cameraStatus').textContent = 'Camera unavailable';
    setCameraPermissionStatus('Camera denied', 'camera-denied');
    document.getElementById('previewMediaBtn').textContent = 'Retry required camera access';
    setRoomStatus(`${error.message || 'Camera permission was not granted.'} Camera access is required to start. You can retry after allowing camera access in your browser.`, 'error');
  } finally {
    state.cameraRequestPending = false;
    updateStartAvailability();
  }
}

function setCameraPermissionStatus(message, statusClass) {
  const status = document.getElementById('preflightCameraStatus');
  status.textContent = message;
  status.classList.remove('camera-ready', 'camera-denied');
  if (statusClass) status.classList.add(statusClass);
}

function isCameraReady(stream = state.stream) {
  return Boolean(stream?.getVideoTracks?.().some(track =>
    track.readyState === 'live' && track.enabled && !track.muted
  ));
}

function checkPreflightCamera() {
  if (state.attemptId || !state.stream) return;
  if (!isCameraReady()) {
    document.getElementById('cameraStatus').textContent = 'Camera unavailable';
    document.getElementById('cameraFallback').classList.remove('hidden');
    document.getElementById('preflightCamera').classList.add('hidden');
    setCameraPermissionStatus('Camera denied', 'camera-denied');
    document.getElementById('previewMediaBtn').textContent = 'Retry required camera access';
    updateStartAvailability();
    return;
  }
  document.getElementById('preflightCamera').classList.remove('hidden');
  setCameraPermissionStatus('Camera ready', 'camera-ready');
  document.getElementById('cameraStatus').textContent = 'Camera ready';
  updateStartAvailability();
}

async function createFaceDetectorBackend() {
  if ('FaceDetector' in window) {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
    return {
      type: 'native',
      detect: async video => (await detector.detect(video)).map(face => ({ boundingBox: face.boundingBox }))
    };
  }
  const vision = await import('/vendor/mediapipe/vision_bundle.mjs');
  const fileset = await vision.FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm');
  const detector = await vision.FaceDetector.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
    },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.6
  });
  return {
    type: 'mediapipe',
    detect: async video => (detector.detectForVideo(video, performance.now()).detections || []).map(face => {
      const box = face.boundingBox || {};
      return { boundingBox: { x: box.originX || 0, y: box.originY || 0, width: box.width || 0, height: box.height || 0 } };
    })
  };
}

async function startFaceMonitor() {
  if (!state.attemptId || !state.monitoringStarted || !state.stream || state.faceMonitor) return;
  try {
    if (!state.faceDetectorReady) state.faceDetectorReady = createFaceDetectorBackend();
    state.faceDetectorBackend = await state.faceDetectorReady;
  } catch {
    state.faceDetectorReady = null;
    state.faceDetectorBackend = null;
    if (!state.faceDetectorUnavailableLogged) {
      state.faceDetectorUnavailableLogged = true;
      state.faceMonitoringUnavailable = true;
      updateMonitoringStatus('Camera checks are not supported in this browser.');
      recordEvent('manual', 'Camera-based checks are not supported in this browser.', 'info', { signal: 'face_detection_unavailable' });
    }
    return;
  }
  const video = document.getElementById('cameraPreview');
  state.faceMonitoringUnavailable = false;
  updateMonitoringStatus(`Session notes active; ${state.faceDetectorBackend.type === 'mediapipe' ? 'MediaPipe' : 'browser'} camera checks active.`);
  const check = async () => {
    if (!state.attemptId || video.readyState < 2 || state.faceDetectionRunning) return;
    state.faceDetectionRunning = true;
    try {
      const faces = await state.faceDetectorBackend.detect(video);
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
      failFaceMonitor('Camera-based checks stopped because the browser could not analyze the preview.');
    } finally {
      state.faceDetectionRunning = false;
    }
  };
  state.faceMonitor = setInterval(check, 3000);
  check();
}

function failFaceMonitor(message) {
  if (state.faceMonitor) clearInterval(state.faceMonitor);
  state.faceMonitor = null;
  state.faceMonitoringUnavailable = true;
  updateMonitoringStatus(message);
  if (!state.faceDetectorUnavailableLogged) {
    state.faceDetectorUnavailableLogged = true;
    recordEvent('manual', message, 'info', { signal: 'face_detection_error' });
  }
}

async function startInterview() {
  updateStartAvailability();
  if (document.getElementById('startBtn').disabled || state.attemptId) return;
  if (!isCameraReady()) {
    setCameraPermissionStatus('Camera denied', 'camera-denied');
    setRoomStatus('A live, enabled camera stream is required. Request or retry camera access before starting.', 'error');
    updateStartAvailability();
    return;
  }
  const button = document.getElementById('startBtn');
  state.starting = true;
  button.disabled = true;
  try {
    if (!isCameraReady()) throw new Error('The required camera stream is no longer available. Request camera access again before starting.');
    const response = await api(`/api/interviews/assignments/${assignmentId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({
        acknowledged: document.getElementById('rulesAcknowledged').checked,
        confirmation: document.getElementById('startConfirmation').value,
        cameraReady: isCameraReady()
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to start interview.');
    state.attemptId = data.attemptId;
    state.questions = data.questions || [];
    if (!state.questions.length) throw new Error('No questions are configured for this interview.');
    if (state.cameraPreflightMonitor) clearInterval(state.cameraPreflightMonitor);
    state.cameraPreflightMonitor = null;
    document.getElementById('cameraPreview').srcObject = state.stream;
    document.getElementById('cameraStatus').textContent = 'Camera ready';
    startMonitoring();
    startLiveStreamSignaling();
    recordEvent('camera_permission', 'Required camera access was granted before the interview started.', 'info');
    state.offline = !navigator.onLine;
    document.getElementById('consentPanel').classList.add('hidden');
    document.getElementById('roomPanel').classList.remove('hidden');
    renderQuestion();
    await startAutomaticMicrophone();
    try {
      await document.documentElement.requestFullscreen();
      state.fullscreenStarted = Boolean(document.fullscreenElement);
    } catch {
      state.fullscreenStarted = false;
    }
  } catch (error) {
    setRoomStatus(error.message, 'error');
  } finally {
    state.starting = false;
    updateStartAvailability();
  }
}

function startMonitoring() {
  if (state.monitoringStarted) return;
  state.monitoringStarted = true;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('pagehide', pauseRoom);
  window.addEventListener('pageshow', resumeRoom);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);
  bindMediaTracks(state.stream);
  state.mediaHealthMonitor = setInterval(checkCameraHealth, 1000);
  startFaceMonitor();
}

function stopMonitoring() {
  if (state.faceMonitor) clearInterval(state.faceMonitor);
  if (state.mediaHealthMonitor) clearInterval(state.mediaHealthMonitor);
  if (state.timer) clearInterval(state.timer);
  state.faceMonitor = null;
  state.mediaHealthMonitor = null;
  state.timer = null;
  if (!state.monitoringStarted) return;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('blur', handleWindowBlur);
  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('pagehide', pauseRoom);
  window.removeEventListener('pageshow', resumeRoom);
  window.removeEventListener('pagehide', handlePageHide);
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('online', handleOnline);
  state.monitoringStarted = false;
}

function bindMediaTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => {
    if (state.mediaTrackListeners.has(track)) return;
    const onEnded = () => {
      const device = track.kind === 'video' ? 'Camera' : 'Microphone';
      if (track.kind === 'video') {
        state.faceMonitoringUnavailable = true;
        document.getElementById('cameraStatus').textContent = 'Camera unavailable';
        document.getElementById('cameraFallback').classList.remove('hidden');
        if (state.faceMonitor) clearInterval(state.faceMonitor);
        state.faceMonitor = null;
        updateMonitoringStatus('Camera track ended; camera checks stopped.');
        markCameraUnavailable('Camera access ended during the interview.', 'media_track_ended');
      } else {
        document.getElementById('micStatus').textContent = 'Mic unavailable';
        recordEvent('manual', 'Microphone access ended during the interview.', 'info', { signal: 'media_track_ended' });
      }
    };
    const onMute = () => {
      if (track.kind === 'video') markCameraUnavailable('Required camera access is unavailable during the interview.', 'media_unavailable');
    };
    const onUnmute = () => {
      if (track.kind === 'video') restoreCameraReady();
    };
    state.mediaTrackListeners.set(track, { onEnded, onMute, onUnmute });
    if (track.readyState === 'ended') {
      onEnded();
      return;
    }
    track.addEventListener('ended', onEnded, { once: true });
    track.addEventListener('mute', onMute);
    track.addEventListener('unmute', onUnmute);
  });
}

function stopMediaStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => {
    const listeners = state.mediaTrackListeners.get(track);
    if (listeners) {
      track.removeEventListener('ended', listeners.onEnded);
      track.removeEventListener('mute', listeners.onMute);
      track.removeEventListener('unmute', listeners.onUnmute);
      state.mediaTrackListeners.delete(track);
    }
    track.stop();
  });
}

function checkCameraHealth() {
  if (!state.attemptId || state.completed) return;
  const track = state.stream?.getVideoTracks?.()[0];
  if (track && track.readyState === 'live' && track.enabled && !track.muted) {
    restoreCameraReady();
    return;
  }
  const ended = !track || track.readyState === 'ended';
  const message = ended
    ? 'Camera access ended during the interview.'
    : 'Required camera access is unavailable during the interview.';
  markCameraUnavailable(message, ended ? 'media_track_ended' : 'media_unavailable');
}

function markCameraUnavailable(message, signal) {
  document.getElementById('cameraStatus').textContent = 'Camera unavailable';
  document.getElementById('cameraFallback').classList.remove('hidden');
  updateMonitoringStatus('Required camera unavailable; a session note is being recorded.');
  if (state.cameraUnavailableRecorded) return;
  state.cameraUnavailableRecorded = true;
  recordEvent('manual', message, 'info', { signal });
}

function restoreCameraReady() {
  if (!isCameraReady()) return;
  state.cameraUnavailableRecorded = false;
  document.getElementById('cameraStatus').textContent = 'Camera ready';
  document.getElementById('cameraFallback').classList.add('hidden');
  updateMonitoringStatus(state.faceMonitoringUnavailable
    ? 'Session notes active; camera checks unavailable.'
    : 'Session notes active; required camera ready.');
}

function cleanupMedia() {
  stopQuestionRecording('cleanup');
  stopSpeechActivityDetection(true);
  closeLiveStreamSignaling();
  if (state.cameraPreflightMonitor) clearInterval(state.cameraPreflightMonitor);
  state.cameraPreflightMonitor = null;
  stopMediaStream(state.stream);
  state.stream = null;
  document.getElementById('preflightCameraPreview').srcObject = null;
  document.getElementById('cameraPreview').srcObject = null;
  document.getElementById('preflightCamera').classList.add('hidden');
}

function startLiveStreamSignaling() {
  if (!state.attemptId || state.socket || typeof io !== 'function') return;
  state.socket = io({ auth: { token } });
  state.socket.on('connect', () => {
    state.socket.emit('join-attempt', state.attemptId);
  });
  state.socket.on('proctor:request-stream', ({ attemptId, viewerId } = {}) => {
    if (attemptId !== state.attemptId || !viewerId || !isCameraReady()) return;
    createLivePeer(viewerId).catch(() => updateMonitoringStatus('Live faculty camera connection could not be started.'));
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
      await peer.setRemoteDescription(answer);
      const pending = state.pendingIce.get(viewerId) || [];
      while (pending.length) await peer.addIceCandidate(pending.shift());
      state.pendingIce.delete(viewerId);
    } catch {
      closeLivePeer(viewerId);
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
  state.socket.on('interview:terminated', ({ message } = {}) => {
    completeTerminatedInterview(message || 'The interview ended after the configured monitoring warning action. Saved answers were preserved.');
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
  peer.onconnectionstatechange = () => {
    if (['closed', 'failed', 'disconnected'].includes(peer.connectionState)) closeLivePeer(viewerId);
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

function closeLiveStreamSignaling() {
  state.peerConnections.forEach((_, viewerId) => closeLivePeer(viewerId));
  if (state.socket) {
    try { state.socket.disconnect(); } catch {}
  }
  state.socket = null;
}

function completeTerminatedInterview(message) {
  if (state.completed) return;
  state.completed = true;
  stopMonitoring();
  cleanupMedia();
  document.getElementById('roomPanel').classList.add('hidden');
  document.getElementById('completionPanel').classList.remove('hidden');
  document.getElementById('completionMessage').textContent = message;
  document.getElementById('completionStats').innerHTML = '<span>Ended by configured warning action</span><span>Saved answers preserved</span>';
}

function handlePageHide() {
  if (!state.attemptId || state.completed || state.pageHideRecorded) return;
  state.pageHideRecorded = true;
  recordEvent('manual', 'Interview page was left or refreshed while the attempt was active.', 'info', { signal: 'pagehide' }, true);
}

function handleOffline() {
  if (!state.attemptId || state.completed || state.offline) return;
  state.offline = true;
  recordEvent('manual', 'Browser network connection became unavailable during the interview.', 'info', { signal: 'offline' });
}

function handleOnline() {
  if (!state.attemptId || state.completed || !state.offline) return;
  state.offline = false;
  recordEvent('manual', 'Browser network connection is available again.', 'info', { signal: 'online' });
}

function updateMonitoringStatus(message) {
  const status = document.getElementById('monitoringStatus');
  status.textContent = message;
  status.classList.toggle('monitoring-warning', state.faceMonitoringUnavailable);
}

function handleVisibilityChange() {
  if (document.hidden && state.attemptId && !state.completed) {
    recordEvent('visibility_hidden', 'Browser tab became hidden during the interview.', 'medium');
  }
}

function handleWindowBlur() {
  if (!state.attemptId || state.completed || state.focusLost) return;
  state.focusLost = true;
  recordEvent('window_blur', 'Interview window lost focus during the interview.', 'medium');
}

function handleWindowFocus() {
  state.focusLost = false;
}

function handleFullscreenChange() {
  if (state.fullscreenStarted && !document.fullscreenElement && state.attemptId && !state.completed) {
    state.fullscreenStarted = false;
    recordEvent('fullscreen_exit', 'Fullscreen mode was exited.', 'low');
  }
}

function pauseRoom() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
  if (state.faceMonitor) clearInterval(state.faceMonitor);
  state.faceMonitor = null;
}

function resumeRoom() {
  if (!state.attemptId || state.completed) return;
  state.pageHideRecorded = false;
  if (!state.timer && !state.questionClocks[state.activeQuestionId]?.timedOut) state.timer = setInterval(tick, 250);
  if (state.stream) startFaceMonitor();
  tick();
}

function renderQuestion() {
  clearInterval(state.timer);
  const question = state.questions[state.index];
  state.activeQuestionId = question.id;
  document.getElementById('roomTitle').textContent = question.title || 'Mock Interview';
  document.getElementById('questionMeta').textContent = `Question ${state.index + 1} of ${state.questions.length} - ${question.marks} marks`;
  document.getElementById('questionText').textContent = question.question_text;
  document.getElementById('questionTopic').textContent = `${labelCategory(question.category)} / ${question.topic} / ${question.difficulty}`;
  document.getElementById('answerText').value = state.answers[question.id] || '';
  document.getElementById('answerSaveStatus').textContent = state.answers[question.id] ? 'Voice answer saved' : 'Waiting for speech after preparation time.';
  state.speechStartedAt = 0;
  state.lastSpeechAt = Date.now();
  document.getElementById('recordingTimer').textContent = '00:00';
  document.getElementById('voiceLevel').style.width = '0%';
  setVoiceStatus(state.audioStream ? 'Silent' : 'Mic waiting', state.audioStream ? 'orange' : 'orange');
  document.getElementById('recordingPlayback').classList.add('hidden');
  document.getElementById('recordingPlayback').removeAttribute('src');
  if (!state.questionClocks[question.id]) {
    const now = Date.now();
    const prepMs = Number(question.preparation_time_seconds || 0) * 1000;
    const answerMs = Number(question.answer_time_seconds || 180) * 1000;
    state.questionClocks[question.id] = {
      prepDeadline: now + prepMs,
      answerDeadline: now + prepMs + answerMs,
      timedOut: false
    };
  }
  updateQuestionClock();
  if (!state.questionClocks[question.id].timedOut) state.timer = setInterval(tick, 250);
  renderPalette();
  const progress = ((state.index + 1) / state.questions.length) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;
  document.querySelector('.progress[role="progressbar"]').setAttribute('aria-valuenow', String(Math.round(progress)));
  document.getElementById('progressLabel').textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  document.getElementById('prevBtn').disabled = state.index === 0;
  document.getElementById('nextBtn').disabled = state.index === state.questions.length - 1;
  if (state.questionClocks[question.id].timedOut) {
    stopQuestionRecording('time');
    setAnswerStatus('Answer time ended. Voice answer is saved when available.', 'error');
    saveCurrentAnswer().catch(error => setAnswerStatus(`Unable to save answer: ${error.message}`, 'error'));
  }
  if (state.recordings[question.id]) showRecording(question.id);
  else loadSavedRecording(question.id);
}

function tick() {
  const clock = state.questionClocks[state.activeQuestionId];
  if (!clock) return;
  updateQuestionClock();
  if (state.answerLeft === 0 && !clock.timedOut) {
    clock.timedOut = true;
    clearInterval(state.timer);
    state.timer = null;
    stopQuestionRecording('time');
    saveCurrentAnswer().catch(error => setAnswerStatus(`Unable to save answer: ${error.message}`, 'error'));
  }
}

function updateQuestionClock() {
  const clock = state.questionClocks[state.activeQuestionId];
  if (!clock) return;
  const now = Date.now();
  state.prepLeft = Math.max(0, Math.ceil((clock.prepDeadline - now) / 1000));
  state.answerLeft = Math.max(0, Math.ceil((clock.answerDeadline - Math.max(now, clock.prepDeadline)) / 1000));
  renderTimers();
}

function renderTimers() {
  document.getElementById('prepTimer').textContent = formatTime(state.prepLeft);
  document.getElementById('answerTimer').textContent = formatTime(state.answerLeft);
}

function renderPalette() {
  document.getElementById('palette').innerHTML = state.questions.map((question, index) =>
    `<button type="button" aria-label="Question ${index + 1}${state.answers[question.id] ? ', answered' : ''}" aria-current="${index === state.index ? 'step' : 'false'}" class="${index === state.index ? 'active' : ''} ${state.answers[question.id] ? 'answered' : ''}" data-index="${index}">${index + 1}</button>`
  ).join('');
  document.querySelectorAll('#palette button').forEach(button => button.addEventListener('click', () => {
    moveTo(Number(button.dataset.index)).catch(error => setAnswerStatus(`Unable to save answer: ${error.message}`, 'error'));
  }));
}

async function saveCurrentAnswer() {
  if (!state.attemptId || state.completed) return;
  if (state.saving) await state.saving;
  const question = state.questions[state.index];
  const recording = state.recordings[question.id];
  const text = state.answers[question.id] || (recording?.saved || recording?.blob ? 'Voice answer recorded' : '');
  state.answers[question.id] = text;
  return saveAnswerForQuestion(question.id, recording?.blob || null, text);
}

async function saveAnswerForQuestion(questionId, blob = null, answerText = 'Voice answer recorded') {
  if (!state.attemptId || state.completed) return;
  if (state.saving) await state.saving;
  const form = new FormData();
  form.append('questionId', questionId);
  form.append('answerText', answerText);
  form.append('transcriptSource', state.source[questionId] || 'speech');
  if (blob) {
    form.append('audio', blob, `answer-${questionId}.${audioExtension(blob.type)}`);
  }
  let resolveSave;
  state.saving = new Promise(resolve => { resolveSave = resolve; });
  setAnswerStatus('Saving voice answer...');
  try {
    const response = await api(`/api/interviews/attempts/${state.attemptId}/answers`, { method: 'PUT', body: form });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Unable to save answer.');
    }
    if (state.recordings[questionId]) {
      state.recordings[questionId].blob = null;
      state.recordings[questionId].saved = true;
    }
    state.answers[questionId] = answerText;
    setAnswerStatus('Voice answer saved');
    renderPalette();
  } finally {
    resolveSave();
    state.saving = null;
  }
}

async function move(delta) {
  if (state.recorder?.state === 'recording') {
    stopQuestionRecording('move');
    await waitForRecorderStop();
  }
  await saveCurrentAnswer();
  await moveTo(Math.max(0, Math.min(state.questions.length - 1, state.index + delta)), true);
}

async function moveTo(index, answerAlreadySaved = false) {
  if (index === state.index) return Promise.resolve();
  if (state.recorder?.state === 'recording') {
    stopQuestionRecording('move');
    await waitForRecorderStop();
  }
  if (!answerAlreadySaved) await saveCurrentAnswer();
  state.index = index;
  renderQuestion();
}

async function submitInterview() {
  if (!state.attemptId || state.submitting || state.completed) return;
  if (state.recorder?.state === 'recording') {
    stopQuestionRecording('submit');
    await waitForRecorderStop();
  }
  const currentQuestion = state.questions[state.index];
  state.answers[currentQuestion.id] = state.answers[currentQuestion.id] || '';
  const unanswered = state.questions.filter(question => !String(state.answers[question.id] || '').trim()).length;
  const confirmation = unanswered
    ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway? You cannot edit answers after submission.`
    : 'Submit this interview? You cannot edit answers after submission.';
  if (!confirm(confirmation)) return;
  state.submitting = true;
  document.getElementById('submitBtn').disabled = true;
  try {
    await saveCurrentAnswer();
    const response = await api(`/api/interviews/attempts/${state.attemptId}/submit`, { method: 'POST', body: '{}' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to submit interview.');
    state.completed = true;
    stopMonitoring();
    cleanupMedia();
    document.getElementById('roomPanel').classList.add('hidden');
    document.getElementById('completionPanel').classList.remove('hidden');
    document.getElementById('completionMessage').textContent = data.message || 'Your answers have been submitted for faculty review.';
    document.getElementById('completionStats').innerHTML = `<span>${state.questions.length} questions</span><span>${state.questions.length - unanswered} answered</span>`;
  } catch (error) {
    setRoomStatus(error.message, 'error');
    setAnswerStatus(error.message, 'error');
    document.getElementById('submitBtn').disabled = false;
  } finally {
    state.submitting = false;
  }
}

async function startAutomaticMicrophone() {
  if (!window.MediaRecorder) {
    setAnswerStatus('Audio recording is not supported in this browser.', 'error');
    setVoiceStatus('Mic unsupported', 'red');
    setMicError('Audio recording is not supported in this browser.');
    if (state.attemptId) recordEvent('manual', 'Audio recording is unavailable on this device or browser.', 'info', { signal: 'media_unavailable' });
    return;
  }
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone recording is not available in this browser.');
    state.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    bindMediaTracks(state.audioStream);
    document.getElementById('micStatus').textContent = 'Mic on';
    setMicError('Microphone is active. Voice answers are saved securely for faculty review.');
    setVoiceStatus('Silent', 'orange');
    recordEvent('microphone_permission', 'Microphone access was granted for automatic voice answers.', 'info');
    setupSpeechActivityDetection();
    emitMicStatus('silent');
  } catch (error) {
    document.getElementById('micStatus').textContent = 'Mic unavailable';
    stopMediaStream(state.audioStream);
    state.audioStream = null;
    setVoiceStatus('Mic error', 'red');
    setMicError(error.message || 'Unable to start microphone recording.');
    if (state.attemptId) {
      recordEvent('microphone_permission', 'Microphone permission was unavailable or not granted.', 'info');
      recordEvent('manual', 'Audio recording is unavailable on this device or browser.', 'info', { signal: 'media_unavailable' });
    }
    setAnswerStatus(error.message || 'Unable to start microphone recording.', 'error');
    emitMicStatus('error', error.message || 'Microphone unavailable.');
  }
}

function setupSpeechActivityDetection() {
  stopSpeechActivityDetection(false);
  state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = 1024;
  state.audioSource = state.audioContext.createMediaStreamSource(state.audioStream);
  state.audioSource.connect(state.analyser);
  state.audioLevelTimer = setInterval(checkSpeechActivity, 120);
  checkSpeechActivity();
}

function checkSpeechActivity() {
  if (!state.analyser || !state.attemptId || state.completed) return;
  const samples = new Uint8Array(state.analyser.fftSize);
  state.analyser.getByteTimeDomainData(samples);
  let sum = 0;
  for (const sample of samples) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / samples.length);
  document.getElementById('voiceLevel').style.width = `${Math.min(100, Math.round(rms * 420))}%`;
  const now = Date.now();
  if (rms >= state.voiceLevelThreshold && state.prepLeft === 0 && state.answerLeft > 0) {
    state.lastSpeechAt = now;
    if (!state.speechStartedAt) state.speechStartedAt = now;
    if (!state.autoRecording && now - state.speechStartedAt >= state.speechStartThresholdMs) startQuestionRecording();
    if (state.autoRecording && !state.speechActive) {
      state.speechActive = true;
      setVoiceStatus('Speaking', 'green');
      emitMicStatus('speaking');
    }
    return;
  }
  state.speechStartedAt = 0;
  if (state.autoRecording && now - state.lastSpeechAt >= state.silenceThresholdMs) {
    stopQuestionRecording('silence');
    return;
  }
  if (!state.autoRecording) {
    setVoiceStatus('Silent', 'orange');
    emitMicStatus('silent');
  } else if (state.speechActive) {
    state.speechActive = false;
    setVoiceStatus('Pause detected', 'orange');
    emitMicStatus('silent');
  }
}

function startQuestionRecording() {
  if (state.autoRecording || !state.audioStream || !state.questions[state.index] || state.questionClocks[state.activeQuestionId]?.timedOut) return;
  try {
    const mimeType = typeof MediaRecorder.isTypeSupported === 'function'
      ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find(type => MediaRecorder.isTypeSupported(type))
      : '';
    const recorder = mimeType ? new MediaRecorder(state.audioStream, { mimeType }) : new MediaRecorder(state.audioStream);
    state.recordingChunks = [];
    const questionId = state.questions[state.index].id;
    recorder.ondataavailable = event => {
      if (event.data.size) state.recordingChunks.push(event.data);
    };
    recorder.onerror = event => {
      setAnswerStatus(event.error?.message || 'Audio recording failed.', 'error');
      setVoiceStatus('Mic error', 'red');
      setMicError(event.error?.message || 'Audio recording failed.');
      state.recorder = null;
      state.autoRecording = false;
      emitMicStatus('error', event.error?.message || 'Audio recording failed.');
    };
    recorder.onstop = async () => {
      const blob = new Blob(state.recordingChunks, { type: recorder.mimeType || 'audio/webm' });
      state.recorder = null;
      state.autoRecording = false;
      state.speechActive = false;
      stopRecordingTimer();
      if (blob.size > 0) {
        state.recordings[questionId] = { blob, saved: false, extension: audioExtension(blob.type) };
        state.answers[questionId] = 'Voice answer recorded';
        state.source[questionId] = 'speech';
        document.getElementById('answerText').value = state.answers[questionId];
        await saveAnswerForQuestion(questionId, blob);
        showRecording(questionId, blob);
      }
      setVoiceStatus('Saved', 'green');
      emitMicStatus('silent');
    };
    state.recorder = recorder;
    state.autoRecording = true;
    state.speechActive = true;
    state.recordingStartedAt = Date.now();
    recorder.start(1000);
    startRecordingTimer();
    setVoiceStatus('Speaking', 'green');
    setAnswerStatus('Recording voice answer...');
    emitMicStatus('speaking');
  } catch (error) {
    setVoiceStatus('Mic error', 'red');
    setMicError(error.message || 'Unable to begin voice recording.');
    setAnswerStatus(error.message || 'Unable to begin voice recording.', 'error');
    emitMicStatus('error', error.message || 'Unable to begin voice recording.');
  }
}

function stopQuestionRecording(reason = 'manual') {
  if (state.recorder?.state === 'recording') {
    setAnswerStatus(reason === 'time' ? 'Answer time ended. Saving voice answer...' : 'Saving voice answer...');
    state.recorder.stop();
  }
}

function waitForRecorderStop() {
  if (!state.recorder || state.recorder.state !== 'recording') return Promise.resolve();
  return new Promise(resolve => {
    const recorder = state.recorder;
    const done = () => {
      recorder.removeEventListener('stop', done);
      resolve();
    };
    recorder.addEventListener('stop', done);
  });
}

function stopSpeechActivityDetection(stopStream = true) {
  if (state.audioLevelTimer) clearInterval(state.audioLevelTimer);
  state.audioLevelTimer = null;
  stopRecordingTimer();
  if (state.audioSource) {
    try { state.audioSource.disconnect(); } catch {}
  }
  state.audioSource = null;
  state.analyser = null;
  if (state.audioContext) state.audioContext.close().catch(() => {});
  state.audioContext = null;
  if (stopStream) {
    stopMediaStream(state.audioStream);
    state.audioStream = null;
    document.getElementById('micStatus').textContent = 'Mic off';
    emitMicStatus('off');
  }
}

function startRecordingTimer() {
  stopRecordingTimer();
  state.recordingTimer = setInterval(updateRecordingTimer, 250);
  updateRecordingTimer();
}

function stopRecordingTimer() {
  if (state.recordingTimer) clearInterval(state.recordingTimer);
  state.recordingTimer = null;
}

function updateRecordingTimer() {
  const seconds = state.recordingStartedAt ? Math.floor((Date.now() - state.recordingStartedAt) / 1000) : 0;
  document.getElementById('recordingTimer').textContent = formatTime(seconds);
}

function setVoiceStatus(message, color = '') {
  const status = document.getElementById('voiceStatus');
  if (!status) return;
  status.textContent = message;
  status.className = `pill ${color}`.trim();
}

function setMicError(message) {
  const el = document.getElementById('micErrorText');
  if (el) el.textContent = message || '';
}

function emitMicStatus(status, detail = '') {
  if (!state.socket || !state.attemptId) return;
  state.socket.emit('interview:mic-status', {
    attemptId: state.attemptId,
    questionId: state.activeQuestionId,
    status,
    detail
  });
}

function audioExtension(mimeType) {
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

async function showRecording(questionId, localBlob = null) {
  const audio = document.getElementById('recordingPlayback');
  try {
    let blob = localBlob || state.recordings[questionId]?.playbackBlob || state.recordings[questionId]?.blob;
    if (!blob && state.recordings[questionId]?.saved) {
      const response = await api(`/api/interviews/attempts/${state.attemptId}/answers/${questionId}/audio`);
      if (!response.ok) throw new Error('Saved recording is unavailable.');
      blob = await response.blob();
    }
    if (!blob) return;
    if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
    const objectUrl = URL.createObjectURL(blob);
    audio.dataset.objectUrl = objectUrl;
    audio.src = objectUrl;
    audio.classList.remove('hidden');
  } catch (error) {
    setAnswerStatus(error.message, 'error');
  }
}

async function loadSavedRecording(questionId) {
  if (!state.attemptId) return;
  try {
    const response = await api(`/api/interviews/attempts/${state.attemptId}/answers/${questionId}/audio`);
    if (!response.ok) return;
    const blob = await response.blob();
    state.recordings[questionId] = { blob: null, saved: true, extension: audioExtension(blob.type), playbackBlob: blob };
    state.answers[questionId] = 'Voice answer recorded';
    renderPalette();
    if (state.questions[state.index]?.id === questionId) showRecording(questionId, blob);
  } catch {}
}

function setAnswerStatus(message, type = '') {
  const status = document.getElementById('answerSaveStatus');
  status.textContent = message;
  status.classList.toggle('error-text', type === 'error');
}

function setRoomStatus(message, type = '') {
  const status = document.getElementById('roomStatus');
  status.textContent = message;
  status.classList.toggle('hidden', !message);
  status.classList.toggle('error', type === 'error');
  status.classList.toggle('success', type === 'success');
}

async function recordEvent(eventType, message, severity, metadata = null, keepalive = false) {
  if (!state.attemptId || !state.monitoringStarted || state.completed) return false;
  const now = Date.now();
  const last = state.lastEventAt[eventType] || 0;
  if (['multiple_faces', 'looking_away', 'face_absent'].includes(eventType) && now - last < 60000) return;
  state.lastEventAt[eventType] = now;
  const entry = { eventType, message, severity, at: new Date(), status: 'Recordingâ€¦' };
  state.events.push(entry);
  renderEventLog();
  try {
    const response = await api(`/api/interviews/attempts/${state.attemptId}/events`, {
      method: 'POST',
      body: JSON.stringify({ eventType, message, severity, ...(metadata ? { metadata } : {}) }),
      ...(keepalive ? { keepalive: true } : {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'The server did not accept this monitoring note.');
    }
    entry.status = data.warningsCount ? `Warning ${data.warningsCount}/3` : 'Event Recorded';
    updateMonitoringStatus(state.faceMonitoringUnavailable
      ? 'Session notes active; camera checks unavailable.'
      : 'Session notes active.');
    renderEventLog();
    handleWarningAction(data, message);
    return true;
  } catch (error) {
    entry.status = `Event could not be recorded${error.message ? `: ${error.message}` : '.'}`;
    updateMonitoringStatus('A session note could not be recorded.');
    document.getElementById('monitoringStatus').classList.add('monitoring-warning');
    renderEventLog();
    return false;
  }
}

function handleWarningAction(data, message) {
  if (!data?.action || !data.warningsCount) return;
  const actionText = {
    notify: 'Please stay focused in the interview room. This is a review flag, not proof of misconduct.',
    fullscreen: 'Please return to fullscreen and continue. This is a review flag, not proof of misconduct.',
    terminate: 'The interview is ending after the configured warning action. Saved answers are preserved.'
  }[data.action] || 'Monitoring warning recorded for faculty review.';
  alert(`Warning ${data.warningsCount}/3: ${message}\n\n${actionText}`);
  if (data.action === 'fullscreen' && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      state.fullscreenStarted = true;
    }).catch(() => {});
  }
  if (data.terminated || data.action === 'terminate') {
    completeTerminatedInterview('The interview ended after the configured monitoring warning action. Saved answers were preserved for faculty review.');
  }
}

function renderEventLog() {
  const log = document.getElementById('eventLog');
  log.innerHTML = state.events.slice(-6).map(event =>
    `<div class="item"><span class="pill ${event.status === 'Event Recorded' || event.status.startsWith('Warning') ? 'green' : event.status.startsWith('Event could not') ? 'red' : 'orange'}">${escapeHtml(event.status)}</span><span>${escapeHtml(event.message)}</span><span class="subtitle">${event.at.toLocaleTimeString()}</span></div>`
  ).join('') || '<p class="monitoring-empty">No session notes yet.</p>';
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
function labelCategory(value) { return ({ hr: 'HR', technical: 'Technical', behavioral: 'Behavioral', company: 'Company-Specific' })[value] || 'Interview'; }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value ?? ''; return div.innerHTML; }
