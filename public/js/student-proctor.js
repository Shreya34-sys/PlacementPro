(() => {
  const studentAuthToken = localStorage.getItem('token');
  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get('attempt');
  const cameraVideo = document.getElementById('camera');
  const cameraStatus = document.getElementById('cameraStatus');
  const retryCameraButton = document.getElementById('retryCamera');
  const warningBox = document.getElementById('warning');

  if (!studentAuthToken || !attemptId || !cameraVideo) {
    console.error(
      'Student proctoring could not start: missing authentication, attempt ID, or camera element.'
    );
    return;
  }

  const socket = io({ auth: { token: studentAuthToken } });

  let cameraStream = null;
  let peerConnection = null;
  let remoteDescriptionSet = false;

  let lastWarningAt = 0;
  let lastViolationType = null;

  let detectionTimer = null;
  let faceDetector = null;
  let objectDetector = null;
  let detectionRunning = false;

  const pendingIceCandidates = [];

  const WARNING_COOLDOWN_MS = 5000;

  // ============================================================
  // TAB SWITCH PROTECTION
  // One tab switch = ONE warning
  // ============================================================

  let tabSwitchLocked = false;
  let tabSwitchUnlockTimer = null;

  // ============================================================
  // CAMERA STATUS
  // ============================================================

  function setCameraStatus(message, type = '') {
    if (!cameraStatus) return;

    cameraStatus.textContent = message;
    cameraStatus.dataset.state = type;
  }

  function showRetry(show) {
    if (retryCameraButton) {
      retryCameraButton.hidden = !show;
    }
  }

  // ============================================================
  // WARNING DISPLAY
  // ============================================================

  function updateWarning(message, count) {
    if (!warningBox) return;

    warningBox.textContent = `Integrity warning ${count}/3: ${message}`;
    warningBox.classList.remove('hidden');
  }

  // ============================================================
  // FORCE SUBMIT
  // ============================================================

  async function submitForced() {
    try {
      const response = await fetch(
        `/api/exams/attempts/${attemptId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentAuthToken}`
          },
          body: JSON.stringify({ forced: true })
        }
      );

      const result = await response.json().catch(() => ({}));

      window.location.replace(
        `/pages/exam-result.html?attempt=${encodeURIComponent(
          result.id || attemptId
        )}`
      );
    } catch (error) {
      console.error('Forced submit error:', error);
    }
  }

  // ============================================================
  // SEND PROCTORING WARNING
  // ============================================================

  async function sendFlag(eventType, message, severity = 'medium') {
    const now = Date.now();

    // Global warning cooldown
    if (!attemptId || now - lastWarningAt < WARNING_COOLDOWN_MS) {
      return false;
    }

    // Reserve warning slot BEFORE API request
    // This prevents duplicate warnings from simultaneous events.
    lastWarningAt = now;

    try {
      const response = await fetch(
        `/api/exams/attempts/${attemptId}/flags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentAuthToken}`
          },
          body: JSON.stringify({
            eventType,
            message,
            severity
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      const count = Number(data.warningsCount || 0);

      if (count) {
        updateWarning(message, count);
      }

      // Automatically submit after 3 warnings
      if (data.autoSubmitted || count >= 3) {
        await submitForced();
      }

      return true;
    } catch (error) {
      console.error('Proctoring flag error:', error);
      return false;
    }
  }

  // ============================================================
  // LIST CAMERA DEVICES
  // ============================================================

  async function listCameraDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      return devices.filter(
        (device) => device.kind === 'videoinput'
      );
    } catch (_) {
      return [];
    }
  }

  // ============================================================
  // START STUDENT CAMERA
  // ============================================================

  async function startStudentCamera() {
    showRetry(false);

    setCameraStatus('Requesting camera permission…');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus(
        'Camera API is unavailable in this browser.',
        'error'
      );

      showRetry(true);
      return;
    }

    try {
      // --------------------------------------------------------
      // CAMERA ONLY
      // Do NOT request microphone.
      // --------------------------------------------------------

      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { ideal: 'user' }
          },
          audio: false
        });
      } catch (firstError) {
        console.warn(
          'Preferred camera request failed:',
          firstError.name,
          firstError.message
        );

        // Simple fallback
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      cameraVideo.srcObject = cameraStream;
      cameraVideo.muted = true;
      cameraVideo.autoplay = true;
      cameraVideo.playsInline = true;

      await cameraVideo.play();

      const track = cameraStream.getVideoTracks()[0];

      if (track) {
        track.addEventListener('ended', () => {
          setCameraStatus(
            'Camera stopped. Please reconnect the camera.',
            'error'
          );

          showRetry(true);

          sendFlag(
            'camera_off',
            'Student camera stopped.',
            'high'
          );
        });
      }

      // Join Socket.IO attempt room
      socket.emit('join-attempt', attemptId);

      setCameraStatus(
        'Camera is active and being monitored.',
        'ok'
      );

      console.log(
        'STUDENT CAMERA: started successfully.',
        track?.label || ''
      );

      // Start AI proctoring
      startAiProctoring();

    } catch (error) {
      console.error('CAMERA ERROR:', error);
      console.error('Camera error name:', error.name);
      console.error('Camera error message:', error.message);

      const devices = await listCameraDevices();

      let message = 'Camera could not be started.';

      if (error.name === 'NotFoundError') {
        message = devices.length
          ? 'A camera was detected, but the browser could not open it. Close Camera/Zoom/Teams/OBS and retry.'
          : 'No camera device was found. Connect/enable your webcam and retry.';

      } else if (
        error.name === 'NotAllowedError' ||
        error.name === 'SecurityError'
      ) {
        message =
          'Camera permission is blocked. Allow Camera for localhost and retry.';

      } else if (
        error.name === 'NotReadableError' ||
        error.name === 'TrackStartError'
      ) {
        message =
          'The camera is already being used by another application. Close it and retry.';
      }

      setCameraStatus(message, 'error');

      showRetry(true);

      alert(
        `${message}\n\n${error.name}: ${error.message}`
      );

      await sendFlag(
        'camera_off',
        `Camera failed: ${error.name}`,
        'high'
      );
    }
  }

  // ============================================================
  // LOAD AI MODELS
  // ============================================================

  async function loadAiModels() {
    try {
      // MediaPipe is served locally by server.js
      const vision = await import(
        '/vendor/mediapipe/vision_bundle.mjs'
      );

      const {
        FilesetResolver,
        FaceDetector,
        ObjectDetector
      } = vision;

      const fileset =
        await FilesetResolver.forVisionTasks(
          '/vendor/mediapipe/wasm'
        );

      // Face detector
      faceDetector =
        await FaceDetector.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
            },

            runningMode: 'VIDEO',

            minDetectionConfidence: 0.60
          }
        );

      // Object detector
      objectDetector =
        await ObjectDetector.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite'
            },

            runningMode: 'VIDEO',

            scoreThreshold: 0.55,

            maxResults: 5
          }
        );

      return true;

    } catch (error) {
      console.error(
        'AI proctoring model load failed:',
        error
      );

      setCameraStatus(
        'Camera is active. AI detection could not load; check internet/model access.',
        'error'
      );

      return false;
    }
  }

  // ============================================================
  // MOBILE PHONE DETECTION
  // ============================================================

  function getMobileDetection(detections) {
    return (
      detections?.detections || []
    ).some((detection) =>
      (detection.categories || []).some(
        (category) => {
          const name = String(
            category.categoryName || ''
          ).toLowerCase();

          return (
            name === 'cell phone' ||
            name === 'mobile phone' ||
            name.includes('cell phone')
          );
        }
      )
    );
  }

  // ============================================================
  // AI DETECTION
  // ============================================================

  async function runDetection() {
    if (
      detectionRunning ||
      !cameraVideo ||
      cameraVideo.readyState < 2 ||
      !faceDetector ||
      !objectDetector
    ) {
      return;
    }

    detectionRunning = true;

    try {
      const timestamp = performance.now();

      const faceResult =
        faceDetector.detectForVideo(
          cameraVideo,
          timestamp
        );

      const objectResult =
        objectDetector.detectForVideo(
          cameraVideo,
          timestamp
        );

      const faceCount =
        faceResult?.detections?.length || 0;

      const mobileVisible =
        getMobileDetection(objectResult);

      let violation = null;

      // --------------------------------------------------------
      // NO FACE
      // --------------------------------------------------------

      if (faceCount === 0) {
        violation = {
          eventType: 'no_face',
          message:
            'Student face is not visible in the camera.',
          severity: 'medium'
        };

      // --------------------------------------------------------
      // MULTIPLE FACES
      // --------------------------------------------------------

      } else if (faceCount > 1) {
        violation = {
          eventType: 'multiple_faces',
          message:
            `${faceCount} faces detected. Only the student may be visible.`,
          severity: 'high'
        };

      // --------------------------------------------------------
      // MOBILE PHONE
      // --------------------------------------------------------

      } else if (mobileVisible) {
        violation = {
          eventType: 'mobile_detected',
          message:
            'Mobile phone detected in the camera view.',
          severity: 'high'
        };
      }

      // --------------------------------------------------------
      // SEND ONLY CONTROLLED WARNINGS
      // --------------------------------------------------------

      if (violation) {

        if (
          violation.eventType !== lastViolationType ||
          Date.now() - lastWarningAt >= WARNING_COOLDOWN_MS
        ) {
          lastViolationType =
            violation.eventType;

          await sendFlag(
            violation.eventType,
            violation.message,
            violation.severity
          );
        }

      } else {
        lastViolationType = null;
      }

    } catch (error) {
      console.error(
        'AI detection error:',
        error
      );

    } finally {
      detectionRunning = false;
    }
  }

  // ============================================================
  // START AI PROCTORING
  // ============================================================

  async function startAiProctoring() {
    if (detectionTimer) {
      clearInterval(detectionTimer);
    }

    const loaded = await loadAiModels();

    if (!loaded) {
      return;
    }

    setCameraStatus(
      'Camera active • Face and mobile detection enabled.',
      'ok'
    );

    await runDetection();

    detectionTimer =
      setInterval(runDetection, 1200);
  }

  // ============================================================
  // CLOSE WEBRTC PEER
  // ============================================================

  function closePeer() {
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch (_) {}
    }

    peerConnection = null;
    remoteDescriptionSet = false;

    pendingIceCandidates.length = 0;
  }

  // ============================================================
  // COPY / CUT / PASTE / CONTEXT MENU
  // ============================================================

  [
    'copy',
    'cut',
    'paste',
    'contextmenu',
    'selectstart',
    'dragstart'
  ].forEach((eventName) => {

    document.addEventListener(
      eventName,
      (event) => {

        event.preventDefault();

        sendFlag(
          'clipboard',
          `${eventName} action attempted.`,
          'medium'
        );
      }
    );
  });

  // ============================================================
  // RESTRICTED KEYBOARD SHORTCUTS
  // ============================================================

  document.addEventListener(
    'keydown',
    (event) => {

      const restrictedKeys = [
        'c',
        'x',
        'v',
        'u',
        's',
        'p'
      ];

      if (
        (event.ctrlKey || event.metaKey) &&
        restrictedKeys.includes(
          event.key.toLowerCase()
        )
      ) {

        event.preventDefault();

        sendFlag(
          'clipboard',
          'Restricted keyboard shortcut attempted.',
          'medium'
        );
      }
    }
  );

  // ============================================================
  // TAB SWITCH DETECTION
  //
  // IMPORTANT:
  // One tab switch should create ONLY ONE warning.
  // ============================================================

  document.addEventListener(
    'visibilitychange',
    () => {

      // Only react when the exam tab becomes hidden
      if (!document.hidden) {
        return;
      }

      // If already locked, ignore duplicate event
      if (tabSwitchLocked) {
        console.log(
          'Duplicate tab-switch event ignored.'
        );
        return;
      }

      // Lock immediately
      tabSwitchLocked = true;

      console.log(
        'TAB SWITCH DETECTED - sending ONE warning.'
      );

      sendFlag(
        'tab_switch',
        'Student left or hid the exam tab.',
        'medium'
      );

      // Unlock after a short period.
      // This allows a completely new tab switch
      // later to generate another warning.
      clearTimeout(tabSwitchUnlockTimer);

      tabSwitchUnlockTimer = setTimeout(
        () => {
          tabSwitchLocked = false;

          console.log(
            'Tab-switch warning lock released.'
          );
        },
        1500
      );
    }
  );

  // ============================================================
  // WEBRTC: ADMIN REQUESTS STUDENT CAMERA
  // ============================================================

  socket.on(
    'proctor:request-stream',
    async () => {

      if (!cameraStream) {
        console.warn(
          'Admin requested stream, but camera is not ready.'
        );
        return;
      }

      closePeer();

      peerConnection =
        new RTCPeerConnection({
          iceServers: [
            {
              urls:
                'stun:stun.l.google.com:19302'
            }
          ]
        });

      // Add camera tracks
      cameraStream
        .getTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            cameraStream
          );
        });

      // ICE candidate
      peerConnection.onicecandidate =
        (event) => {

          if (event.candidate) {

            socket.emit(
              'webrtc:ice',
              {
                attemptId,
                candidate: event.candidate,
                target: 'admin'
              }
            );
          }
        };

      peerConnection.onconnectionstatechange =
        () => {

          console.log(
            'STUDENT WebRTC state:',
            peerConnection.connectionState
          );
        };

      // Create offer
      const offer =
        await peerConnection.createOffer();

      await peerConnection.setLocalDescription(
        offer
      );

      socket.emit(
        'webrtc:offer',
        {
          attemptId,
          offer:
            peerConnection.localDescription
        }
      );
    }
  );

  // ============================================================
  // WEBRTC: RECEIVE ADMIN ANSWER
  // ============================================================

  socket.on(
    'webrtc:answer',
    async ({
      attemptId: answerAttemptId,
      answer
    }) => {

      if (
        answerAttemptId !== attemptId ||
        !peerConnection ||
        !answer
      ) {
        return;
      }

      try {

        await peerConnection.setRemoteDescription(
          answer
        );

        remoteDescriptionSet = true;

        // Add ICE candidates that arrived early
        while (
          pendingIceCandidates.length
        ) {

          await peerConnection.addIceCandidate(
            pendingIceCandidates.shift()
          );
        }

      } catch (error) {

        console.error(
          'Student WebRTC answer error:',
          error
        );
      }
    }
  );

  // ============================================================
  // WEBRTC: RECEIVE ICE CANDIDATE
  // ============================================================

  socket.on(
    'webrtc:ice',
    async ({
      attemptId: iceAttemptId,
      candidate
    }) => {

      if (
        iceAttemptId !== attemptId ||
        !candidate
      ) {
        return;
      }

      // Remote description not ready yet
      if (
        !peerConnection ||
        !remoteDescriptionSet
      ) {

        pendingIceCandidates.push(
          candidate
        );

        return;
      }

      try {

        await peerConnection.addIceCandidate(
          candidate
        );

      } catch (error) {

        console.error(
          'Student ICE error:',
          error
        );
      }
    }
  );

  // ============================================================
  // RETRY CAMERA BUTTON
  // ============================================================

  retryCameraButton?.addEventListener(
    'click',
    startStudentCamera
  );

  // ============================================================
  // CLEANUP
  // ============================================================

  window.addEventListener(
    'beforeunload',
    () => {

      if (detectionTimer) {
        clearInterval(detectionTimer);
      }

      if (tabSwitchUnlockTimer) {
        clearTimeout(
          tabSwitchUnlockTimer
        );
      }

      cameraStream
        ?.getTracks()
        .forEach((track) => track.stop());

      closePeer();
    }
  );

  // ============================================================
  // START
  // ============================================================

  startStudentCamera();

})();