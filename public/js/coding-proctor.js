(() => {
  const token = localStorage.getItem('token');
  const roundId = new URLSearchParams(location.search).get('round');

  let attemptId = null;
  let config = null;
  let stream = null;
  let screenStream = null;
  let socket = null;
  let peer = null;

  const notice = document.querySelector('#proctorNotice');
  const video = document.querySelector('#camera');
  const status = document.querySelector('#cameraStatus');

  const lastFlag = new Map();
  let attentionCooldownUntil = 0;
  let finishingRedirect = false;

  async function boot() {
    if (!token || !roundId) return;

    const response = await fetch(
      `/api/coding/student/rounds/${encodeURIComponent(roundId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) return;

    config = await response.json();
    attemptId = config.attempt_id;

    if (!attemptId) {
      setTimeout(boot, 700);
      return;
    }

    if (config.attempt_state !== 'started') return;

    if (config.tab_lock_enabled) {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) attentionFlag(
          'tab_switch',
          'You left the coding exam tab.'
        );
      });

      window.addEventListener('blur', () => attentionFlag(
        'focus_lost',
        'Exam window lost focus.'
      ));

      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) attentionFlag(
          'fullscreen_exit',
          'You left full-screen mode.'
        );
      });
    }

    if (config.clipboard_guard_enabled) {
      ['copy', 'cut', 'contextmenu'].forEach(eventName => {
        document.addEventListener(eventName, event => {
          event.preventDefault();
          flag('clipboard', 'Clipboard/context-menu action was blocked.');
        });
      });

      document.addEventListener('paste', event => {
        event.preventDefault();
        flag('paste_burst', 'Paste action was blocked inside the coding assessment.');
      });
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: !!config.audio_monitoring_enabled
      });

      video.srcObject = stream;
      status.textContent = config.audio_monitoring_enabled
        ? 'Camera + microphone active'
        : 'Camera active';
      notice.textContent = 'Coding environment ready.';
      notice.className = 'proctor-notice ok';

      // Browsers normally allow fullscreen only from a user gesture.
      // The first interaction therefore retries fullscreen legitimately.
      const enterFullscreen = () => {
        if (
          config.tab_lock_enabled &&
          !document.fullscreenElement &&
          document.documentElement.requestFullscreen
        ) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      };
      document.addEventListener('click', enterFullscreen, { once: true });
      document.addEventListener('keydown', enterFullscreen, { once: true });

      if (config.face_detection_enabled) startFaceDetection();
      if (config.audio_monitoring_enabled) startAudioMonitor();

      startStreamSignaling();
    } catch (error) {
      console.warn('Coding proctor media error:', error);
      status.textContent = 'Camera/microphone unavailable';
      notice.textContent =
        'Camera/microphone permission is required for this coding assessment.';
      notice.className = 'proctor-notice bad';
      flag(
        'focus_lost',
        'Required camera or microphone permission is unavailable.'
      );
    }
  }

  // One physical focus/tab/fullscreen incident must produce one warning.
  function attentionFlag(type, message) {
    const now = Date.now();
    if (now < attentionCooldownUntil) return;
    attentionCooldownUntil = now + 1800;
    flag(type, message);
  }

  async function flag(type, message, cooldownMs = 2500) {
    if (!attemptId) return;

    const key = `${type}|${message}`;
    const now = Date.now();
    if (lastFlag.get(key) && now - lastFlag.get(key) < cooldownMs) return;
    lastFlag.set(key, now);

    try {
      const response = await fetch(
        `/api/coding/student/attempts/${encodeURIComponent(attemptId)}/flag`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ eventType: type, message })
        }
      );

      if (!response.ok) return;

      const result = await response.json();
      document.querySelector('#warningCounter').textContent =
        `Warnings: ${result.warningsCount}/${result.maxWarnings}`;

      notice.textContent =
        `Warning ${result.warningsCount}/${result.maxWarnings}: ${message}`;
      notice.className = 'proctor-notice warn';

      if (result.autoSubmitted && !finishingRedirect) {
        finishingRedirect = true;
        notice.textContent = 'Warning limit reached. Round submitted.';
        setTimeout(() => {
          location.href =
            `/coding-result?attempt=${encodeURIComponent(attemptId)}`;
        }, 900);
      }
    } catch (error) {
      console.warn('Coding proctor warning failed:', error);
    }
  }

  async function startFaceDetection() {
    try {
      const mod = await import('/vendor/mediapipe/vision_bundle.mjs');
      const { FaceDetector, FilesetResolver } = mod;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
      );

      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.55
      });

      let noFaceSince = 0;
      let awaySince = 0;
      let lastDetection = 0;

      const tick = () => {
        if (
          video.readyState >= 2 &&
          Date.now() - lastDetection > 500 &&
          !finishingRedirect
        ) {
          lastDetection = Date.now();

          try {
            const result = detector.detectForVideo(video, lastDetection);
            const count = result.detections?.length || 0;

            if (count === 0) {
              if (!noFaceSince) noFaceSince = Date.now();
              if (Date.now() - noFaceSince > 2000) {
                flag('no_face', 'No face detected.', 8000);
              }
            } else {
              noFaceSince = 0;

              if (count > 1) {
                flag('multiple_faces', 'Multiple faces detected.', 8000);
              } else {
                const box = result.detections[0].boundingBox;
                const centered =
                  box.originX > video.videoWidth * 0.2 &&
                  box.originX + box.width < video.videoWidth * 0.8;

                if (!centered) {
                  if (!awaySince) awaySince = Date.now();
                  if (Date.now() - awaySince > 3000) {
                    flag(
                      'looking_away',
                      'Face appears turned away from the screen.',
                      8000
                    );
                  }
                } else {
                  awaySince = 0;
                }
              }
            }
          } catch (error) {
            console.warn('Face detection frame failed:', error);
          }
        }

        requestAnimationFrame(tick);
      };

      tick();
    } catch (error) {
      // The exam can still run if the optional local face model fails to load.
      console.warn('Face model unavailable:', error);
    }
  }

  function startAudioMonitor() {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass || !stream) return;

      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      let lastSpike = 0;

      setInterval(() => {
        if (finishingRedirect) return;

        analyser.getByteTimeDomainData(data);

        let sum = 0;
        for (const value of data) {
          const n = (value - 128) / 128;
          sum += n * n;
        }

        const rms = Math.sqrt(sum / data.length);

        if (rms > 0.25 && Date.now() - lastSpike > 6000) {
          lastSpike = Date.now();
          flag('audio_spike', 'Unusual microphone volume detected.', 6000);
        }
      }, 500);
    } catch (error) {
      console.warn('Audio monitor unavailable:', error);
    }
  }

  function startStreamSignaling() {
    socket = io('/coding', { auth: { token } });
    socket.emit('join-attempt', attemptId);

    socket.on('coding:request-stream', async () => {
      try {
        await createPeerAndOffer();
      } catch (error) {
        console.warn('WebRTC stream failed:', error);
      }
    });

    socket.on('webrtc:answer', async data => {
      try {
        await peer?.setRemoteDescription(data.answer);
      } catch (error) {
        console.warn('WebRTC answer failed:', error);
      }
    });

    socket.on('webrtc:ice', async data => {
      try {
        if (data.candidate) await peer?.addIceCandidate(data.candidate);
      } catch (error) {
        console.warn('WebRTC ICE failed:', error);
      }
    });
  }

  async function createPeerAndOffer() {
    peer?.close();

    peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    const tracks = [];
    if (stream) tracks.push(...stream.getTracks());
    if (screenStream) tracks.push(...screenStream.getTracks());

    tracks.forEach(track => peer.addTrack(track, track.kind === 'video' ? (
      screenStream?.getVideoTracks().includes(track) ? screenStream : stream
    ) : stream));

    peer.onicecandidate = event => {
      if (event.candidate) {
        socket?.emit('webrtc:ice', {
          attemptId,
          candidate: event.candidate,
          target: 'admin'
        });
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket?.emit('webrtc:offer', { attemptId, offer });
  }

  document.getElementById('shareScreenBtn')?.addEventListener(
    'click',
    async () => {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        document.getElementById('shareScreenBtn').textContent =
          'Screen sharing active';

        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          document.getElementById('shareScreenBtn').textContent =
            'Share screen with proctor';
          screenStream = null;
        });

        // If a proctor is already connected, renegotiate immediately.
        if (socket && peer) await createPeerAndOffer();
      } catch (error) {
        notice.textContent = 'Screen sharing was not started.';
        notice.className = 'proctor-notice warn';
      }
    }
  );

  window.addEventListener('beforeunload', () => {
    clearInterval();
    screenStream?.getTracks().forEach(track => track.stop());
    stream?.getTracks().forEach(track => track.stop());
    peer?.close();
  });

  boot();
})();
