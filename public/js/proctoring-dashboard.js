(() => {
  // ============================================================
  // ADMIN AUTHENTICATION
  // ============================================================

  const proctoringAdminToken =
    localStorage.getItem('adminToken') || localStorage.getItem('token');

  if (!proctoringAdminToken) {
    location.replace('/admin-login');
    return;
  }

  // Active exam ID (may be read from URL or auto-selected)
  let examId = new URLSearchParams(location.search).get('exam');

  // ============================================================
  // SOCKET.IO
  // ============================================================

  const socket = io({
    auth: {
      token: proctoringAdminToken
    }
  });

  // ============================================================
  // WEBRTC STORAGE & STATE
  // ============================================================

  const peers = {};
  const peerStreams = {};
  const pendingIceCandidates = {};
  const onlineStudents = new Set();
  let availableExams = [];

  // ============================================================
  // API REQUEST HELPER
  // ============================================================

  const request = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${proctoringAdminToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  };

  // ============================================================
  // HTML ESCAPE
  // ============================================================

  const esc = (value) => {
    const element = document.createElement('div');
    element.textContent = value ?? '';
    return element.innerHTML;
  };

  // ============================================================
  // CREATE WEBRTC PEER
  // ============================================================

  function createPeer(attemptId, viewerId) {
    // Close old peer if one already exists
    if (peers[attemptId]) {
      try {
        peers[attemptId].close();
      } catch (_) {}
    }

    pendingIceCandidates[attemptId] = [];

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    });

    peers[attemptId] = pc;

    // ========================================================
    // RECEIVE STUDENT CAMERA STREAM
    // ========================================================

    pc.ontrack = (event) => {
      console.log('ADMIN: Student camera stream received ontrack for:', attemptId);
      const stream = event.streams?.[0];
      if (!stream) {
        console.warn('ADMIN: ontrack event did not include stream for attempt:', attemptId);
        return;
      }

      peerStreams[attemptId] = stream;

      const video = document.getElementById(`feed-${attemptId}`);
      if (video) {
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.play().catch((error) => {
          console.warn('ADMIN video play error:', error);
        });
      }

      const placeholder = document.getElementById(`feed-placeholder-${attemptId}`);
      if (placeholder) {
        placeholder.style.display = 'none';
      }

      const camBadge = document.getElementById(`cam-badge-${attemptId}`);
      if (camBadge) {
        camBadge.textContent = 'Camera Live';
        camBadge.className = 'status-badge status-cam-live';
      }
    };

    // ========================================================
    // SEND ICE CANDIDATES TO STUDENT
    // ========================================================

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      socket.emit('webrtc:ice', {
        attemptId,
        candidate: event.candidate,
        target: 'student',
        viewerId
      });
    };

    // ========================================================
    // WEBRTC CONNECTION STATE
    // ========================================================

    pc.onconnectionstatechange = () => {
      console.log(`ADMIN WebRTC connectionState [${attemptId}]:`, pc.connectionState);

      if (pc.connectionState === 'connected') {
        const placeholder = document.getElementById(`feed-placeholder-${attemptId}`);
        if (placeholder) placeholder.style.display = 'none';

        const camBadge = document.getElementById(`cam-badge-${attemptId}`);
        if (camBadge) {
          camBadge.textContent = 'Camera Live';
          camBadge.className = 'status-badge status-cam-live';
        }
      } else if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed' ||
        pc.connectionState === 'disconnected'
      ) {
        if (!peerStreams[attemptId]) {
          const placeholder = document.getElementById(`feed-placeholder-${attemptId}`);
          if (placeholder) {
            placeholder.style.display = 'flex';
            const text = placeholder.querySelector('.placeholder-text');
            if (text) text.textContent = 'Feed disconnected';
          }
        }
      }
    };

    return pc;
  }

  // ============================================================
  // LOAD EXAMS FOR ASSESSMENT SELECTOR
  // ============================================================

  async function initExams() {
    try {
      const response = await request('/api/exams/admin');
      if (!response.ok) {
        console.warn('Could not load exams for admin:', response.status);
        return;
      }

      availableExams = await response.json();
      const examSelect = document.getElementById('examSelect');

      if (!examSelect) return;

      examSelect.innerHTML = '';

      if (!availableExams.length) {
        examSelect.innerHTML = '<option value="">No assessments available</option>';
        return;
      }

      availableExams.forEach((exam) => {
        const opt = document.createElement('option');
        opt.value = exam.id;
        opt.textContent = `${exam.title} (${exam.display_status || exam.status || 'published'})`;
        examSelect.appendChild(opt);
      });

      // If examId is in URL, select it; otherwise select first exam
      const found = availableExams.find((e) => e.id === examId);
      if (found) {
        examSelect.value = examId;
      } else {
        examId = availableExams[0].id;
        examSelect.value = examId;
        const newUrl = `${location.pathname}?exam=${encodeURIComponent(examId)}`;
        window.history.replaceState({}, '', newUrl);
      }

      updateExamTitleHeader();

      // Watch selected exam on socket
      socket.emit('watch-exam', examId);

      // Listener for changing exams
      examSelect.onchange = () => {
        const selectedId = examSelect.value;
        if (!selectedId || selectedId === examId) return;

        // Cleanup existing streams
        Object.keys(peers).forEach((key) => {
          try {
            peers[key].close();
          } catch (_) {}
          delete peers[key];
          delete peerStreams[key];
        });

        examId = selectedId;
        const newUrl = `${location.pathname}?exam=${encodeURIComponent(examId)}`;
        window.history.replaceState({}, '', newUrl);

        updateExamTitleHeader();
        socket.emit('watch-exam', examId);
        refresh();
      };
    } catch (err) {
      console.error('Error initializing exams:', err);
    }
  }

  function updateExamTitleHeader() {
    const subtitle = document.getElementById('examSubtitle');
    if (!subtitle) return;

    const current = availableExams.find((e) => e.id === examId);
    if (current) {
      subtitle.textContent = `Supervising: ${current.title} · Highest severity alerts and student feeds appear first.`;
    } else {
      subtitle.textContent = 'Highest severity alerts and student feeds appear first.';
    }
  }

  // ============================================================
  // REFRESH ADMIN DASHBOARD
  // ============================================================

  async function refresh() {
    if (!examId) return;

    try {
      const [activeResponse, flagsResponse] = await Promise.all([
        request(`/api/exams/${examId}/proctoring/active-attempts`),
        request(`/api/exams/${examId}/proctoring/flags`)
      ]);

      if (!activeResponse.ok || !flagsResponse.ok) {
        console.error(
          'Proctoring API error:',
          activeResponse.status,
          flagsResponse.status
        );
        return;
      }

      const active = await activeResponse.json();
      const flags = await flagsResponse.json();

      // Track online status from response
      active.forEach((attempt) => {
        if (attempt.isOnline) {
          onlineStudents.add(attempt.attempt_id);
        }
      });

      // --------------------------------------------------------
      // UPDATE FLAG SEVERITY COUNTERS
      // --------------------------------------------------------

      const highCount = flags.filter((f) => f.severity === 'high').length;
      const mediumCount = flags.filter((f) => f.severity === 'medium').length;
      const lowCount = flags.filter((f) => f.severity === 'low').length;

      const statBoxes = document.querySelectorAll('#flagStats b');
      if (statBoxes.length >= 3) {
        statBoxes[0].textContent = highCount;
        statBoxes[1].textContent = mediumCount;
        statBoxes[2].textContent = lowCount;
      }

      // --------------------------------------------------------
      // UPDATE ACTIVE STUDENT COUNT BADGE
      // --------------------------------------------------------

      const activeCountBadge = document.getElementById('activeCountBadge');
      if (activeCountBadge) {
        activeCountBadge.textContent = `${active.length} Active Student${active.length === 1 ? '' : 's'}`;
      }

      // --------------------------------------------------------
      // MAP FLAGS BY ATTEMPT
      // --------------------------------------------------------

      const flagsByAttempt = new Map();
      flags.forEach((flag) => {
        if (!flagsByAttempt.has(flag.attempt_id)) {
          flagsByAttempt.set(flag.attempt_id, []);
        }
        flagsByAttempt.get(flag.attempt_id).push(flag);
      });

      const container = document.querySelector('#studentFeeds');
      if (!container) return;

      // --------------------------------------------------------
      // RENDER STUDENT CARDS
      // --------------------------------------------------------

      if (active.length === 0) {
        container.innerHTML =
          '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted, #64748b); padding: 48px 20px; font-weight: 500;">No students are currently taking this assessment.</p>';
        return;
      }

      container.innerHTML = active
        .map((attempt) => {
          const attemptFlags = flagsByAttempt.get(attempt.attempt_id) || [];
          const primaryFlag = attemptFlags[0] || null;
          const warningCount = Number(attempt.warnings_count || 0);

          const isOnline =
            attempt.isOnline !== undefined
              ? attempt.isOnline
              : onlineStudents.has(attempt.attempt_id);

          const hasStream = Boolean(peerStreams[attempt.attempt_id]);

          let cameraText = 'Camera Off';
          let cameraClass = 'status-cam-off';

          if (hasStream) {
            cameraText = 'Camera Live';
            cameraClass = 'status-cam-live';
          } else if (attempt.cameraStatus === 'active' || isOnline) {
            cameraText = 'Connecting…';
            cameraClass = 'status-cam-live';
          }

          return `
            <article
              class="card feed ${primaryFlag ? `severity-${esc(primaryFlag.severity)}` : ''}"
              data-attempt-card="${esc(attempt.attempt_id)}"
            >
              <div class="feed-video-wrap">
                <video
                  id="feed-${esc(attempt.attempt_id)}"
                  class="video"
                  autoplay
                  playsinline
                  muted
                ></video>
                <div
                  id="feed-placeholder-${esc(attempt.attempt_id)}"
                  class="feed-video-placeholder"
                  style="display: ${hasStream ? 'none' : 'flex'};"
                >
                  <div class="feed-spinner" style="display: ${isOnline ? 'block' : 'none'};"></div>
                  <span class="placeholder-text">${isOnline ? 'Waiting for camera feed…' : 'Student is offline'}</span>
                </div>
              </div>

              <div class="details">
                <div class="feed-meta-row">
                  <b>${esc(attempt.fullName)}</b>
                  <div class="status-badges-group">
                    <span
                      id="conn-badge-${esc(attempt.attempt_id)}"
                      class="status-badge ${isOnline ? 'status-online' : 'status-offline'}"
                    >
                      ${isOnline ? '● Online' : '○ Offline'}
                    </span>
                    <span
                      id="cam-badge-${esc(attempt.attempt_id)}"
                      class="status-badge ${cameraClass}"
                    >
                      ${cameraText}
                    </span>
                  </div>
                </div>

                <div class="alert-counts" style="margin: 6px 0 10px 0;">
                  <span class="alert-count-pill">
                    <small
                      class="warning-count"
                      data-warning-attempt="${esc(attempt.attempt_id)}"
                    >
                      Warnings: <strong>${warningCount}/3</strong>
                    </small>
                    ${
                      attemptFlags.length > 0
                        ? ` · <span style="color: var(--danger, #ef4444); font-size: 11px; font-weight: 700;">${attemptFlags.length} active flag(s)</span>`
                        : ''
                    }
                  </span>
                </div>

                <p style="margin: 6px 0 14px 0; font-size: 13px; color: ${primaryFlag ? 'var(--danger, #ef4444)' : 'var(--text-muted, #64748b)'};">
                  ${primaryFlag ? esc(primaryFlag.message) : 'No current integrity flags.'}
                </p>

                <p style="margin: 0; display: flex; gap: 8px; flex-wrap: wrap;">
                  <button
                    class="outline monitor"
                    data-attempt="${esc(attempt.attempt_id)}"
                    style="flex: 1; padding: 10px 14px; font-size: 13px; margin-top: 0;"
                  >
                    Monitor live camera
                  </button>

                  ${
                    primaryFlag
                      ? `
                        <button
                          class="outline resolve"
                          data-flag="${esc(primaryFlag.id)}"
                          data-attempt="${esc(attempt.attempt_id)}"
                          style="flex: 1; padding: 10px 14px; font-size: 13px; margin-top: 0;"
                        >
                          Resolve
                        </button>
                      `
                      : ''
                  }

                  ${
                    primaryFlag
                      ? `
                        <button
                          class="outline remove"
                          data-student="${esc(attempt.student_id)}"
                          data-flag="${esc(primaryFlag.id)}"
                          style="flex: 1; padding: 10px 14px; font-size: 13px; margin-top: 0; color: var(--danger, #ef4444); border-color: #fecaca;"
                        >
                          Remove student
                        </button>
                      `
                      : ''
                  }
                </p>
              </div>
            </article>
          `;
        })
        .join('');

      // ========================================================
      // RESTORE EXISTING WEBRTC STREAMS ON RENDERED ELEMENTS
      // ========================================================

      Object.entries(peerStreams).forEach(([attemptId, stream]) => {
        const video = document.getElementById(`feed-${attemptId}`);
        const placeholder = document.getElementById(`feed-placeholder-${attemptId}`);

        if (video && stream) {
          video.srcObject = stream;
          video.autoplay = true;
          video.playsInline = true;
          video.muted = true;
          video.play().catch(() => {});
          if (placeholder) placeholder.style.display = 'none';

          const camBadge = document.getElementById(`cam-badge-${attemptId}`);
          if (camBadge) {
            camBadge.textContent = 'Camera Live';
            camBadge.className = 'status-badge status-cam-live';
          }
        }
      });

      // ========================================================
      // AUTO-REQUEST CAMERA FEEDS FOR ONLINE STUDENTS
      // ========================================================

      active.forEach((attempt) => {
        const isOnline =
          attempt.isOnline !== undefined
            ? attempt.isOnline
            : onlineStudents.has(attempt.attempt_id);

        if (isOnline && !peerStreams[attempt.attempt_id]) {
          socket.emit('monitor-attempt', attempt.attempt_id);
        }
      });

      // ========================================================
      // MONITOR LIVE CAMERA BUTTON HANDLER
      // ========================================================

      document.querySelectorAll('.monitor').forEach((button) => {
        button.onclick = () => {
          const attemptId = button.dataset.attempt;
          if (!attemptId) return;

          console.log('ADMIN manually requesting student stream:', attemptId);
          button.textContent = 'Requesting…';
          socket.emit('monitor-attempt', attemptId);
          setTimeout(() => {
            button.textContent = 'Monitor live camera';
          }, 2000);
        };
      });

      // ========================================================
      // RESOLVE WARNING BUTTON HANDLER
      // ========================================================

      document.querySelectorAll('.resolve').forEach((button) => {
        button.onclick = async () => {
          const flagId = button.dataset.flag;
          if (!flagId) return;

          button.disabled = true;
          button.textContent = 'Resolving…';

          try {
            const response = await request(
              `/api/exams/proctoring/flags/${encodeURIComponent(flagId)}/resolve`,
              { method: 'PATCH' }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
              alert(result.message || 'Could not resolve this warning.');
              button.disabled = false;
              button.textContent = 'Resolve';
              return;
            }

            console.log('WARNING RESOLVED:', result);
            await refresh();
          } catch (error) {
            console.error('Resolve warning error:', error);
            alert('Could not resolve this warning.');
            button.disabled = false;
            button.textContent = 'Resolve';
          }
        };
      });

      // ========================================================
      // REMOVE STUDENT BUTTON HANDLER
      // ========================================================

      document.querySelectorAll('.remove').forEach((button) => {
        button.onclick = async () => {
          const studentId = button.dataset.student;
          const flagId = button.dataset.flag;

          if (!confirm('Remove this student and terminate their current assessment?')) {
            return;
          }

          button.disabled = true;
          button.textContent = 'Removing…';

          try {
            const response = await request(
              `/api/exams/proctoring/students/${encodeURIComponent(studentId)}/remove`,
              {
                method: 'PATCH',
                body: JSON.stringify({ flagId })
              }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
              alert(result.message || 'Could not remove the student.');
              button.disabled = false;
              button.textContent = 'Remove student';
              return;
            }

            console.log('Student removed successfully.');
            await refresh();
          } catch (error) {
            console.error('Remove student error:', error);
            alert('Could not remove the student.');
            button.disabled = false;
            button.textContent = 'Remove student';
          }
        };
      });
    } catch (error) {
      console.error('Proctoring refresh error:', error);
    }
  }

  // ============================================================
  // SOCKET.IO EVENT HANDLERS
  // ============================================================

  // Student came online
  socket.on('proctor:student-online', (data) => {
    console.log('ADMIN: Student came online:', data);
    if (data?.attemptId) {
      onlineStudents.add(data.attemptId);

      const connBadge = document.getElementById(`conn-badge-${data.attemptId}`);
      if (connBadge) {
        connBadge.textContent = '● Online';
        connBadge.className = 'status-badge status-online';
      }

      const placeholder = document.getElementById(`feed-placeholder-${data.attemptId}`);
      if (placeholder && !peerStreams[data.attemptId]) {
        const spinner = placeholder.querySelector('.feed-spinner');
        if (spinner) spinner.style.display = 'block';
        const text = placeholder.querySelector('.placeholder-text');
        if (text) text.textContent = 'Waiting for camera feed…';
      }

      // Auto request stream
      socket.emit('monitor-attempt', data.attemptId);
    }
    refresh();
  });

  // Student joined attempt
  socket.on('proctor:student-joined', (data) => {
    console.log('ADMIN: Student joined exam:', data);
    if (data?.attemptId) {
      onlineStudents.add(data.attemptId);
      socket.emit('monitor-attempt', data.attemptId);
    }
    refresh();
  });

  // Student went offline / disconnected
  socket.on('proctor:student-offline', (data) => {
    console.log('ADMIN: Student went offline:', data);
    if (data?.attemptId) {
      onlineStudents.delete(data.attemptId);

      const connBadge = document.getElementById(`conn-badge-${data.attemptId}`);
      if (connBadge) {
        connBadge.textContent = '○ Offline';
        connBadge.className = 'status-badge status-offline';
      }

      const camBadge = document.getElementById(`cam-badge-${data.attemptId}`);
      if (camBadge) {
        camBadge.textContent = 'Camera Off';
        camBadge.className = 'status-badge status-cam-off';
      }

      const placeholder = document.getElementById(`feed-placeholder-${data.attemptId}`);
      if (placeholder) {
        placeholder.style.display = 'flex';
        const spinner = placeholder.querySelector('.feed-spinner');
        if (spinner) spinner.style.display = 'none';
        const text = placeholder.querySelector('.placeholder-text');
        if (text) text.textContent = 'Student is offline';
      }

      if (peers[data.attemptId]) {
        try {
          peers[data.attemptId].close();
        } catch (_) {}
        delete peers[data.attemptId];
      }
      delete peerStreams[data.attemptId];
    }
  });

  // Student submitted their exam
  socket.on('proctor:student-submitted', (data) => {
    console.log('ADMIN: Student submitted assessment:', data);
    if (data?.attemptId) {
      onlineStudents.delete(data.attemptId);
      if (peers[data.attemptId]) {
        try {
          peers[data.attemptId].close();
        } catch (_) {}
        delete peers[data.attemptId];
      }
      delete peerStreams[data.attemptId];
    }
    refresh();
  });

  // Camera status broadcast
  socket.on('proctor:camera-status', (data) => {
    console.log('ADMIN: Student camera status update:', data);
    if (data?.attemptId) {
      const camBadge = document.getElementById(`cam-badge-${data.attemptId}`);
      if (camBadge) {
        if (data.status === 'active') {
          camBadge.textContent = peerStreams[data.attemptId] ? 'Camera Live' : 'Camera Active';
          camBadge.className = 'status-badge status-cam-live';
        } else {
          camBadge.textContent = 'Camera Off';
          camBadge.className = 'status-badge status-cam-off';
        }
      }
    }
  });

  // Real-time proctoring flag
  socket.on('proctor:flag', () => {
    console.log('ADMIN: New proctoring flag received.');
    refresh();
  });

  // Real-time warning resolved
  socket.on('proctor:warning-resolved', (data) => {
    console.log('ADMIN: Warning resolved event:', data);
    refresh();
  });

  // Real-time student removed
  socket.on('proctor:student-removed', () => {
    console.log('ADMIN: Student was removed from assessment.');
    refresh();
  });

  // ============================================================
  // WEBRTC SIGNALING: RECEIVE OFFER FROM STUDENT
  // ============================================================

  socket.on('webrtc:offer', async ({ attemptId, offer, viewerId }) => {
    if (!attemptId || !offer) return;

    console.log('ADMIN received WebRTC offer for attempt:', attemptId);

    try {
      const pc = createPeer(attemptId, viewerId);

      await pc.setRemoteDescription(offer);

      while (pendingIceCandidates[attemptId]?.length) {
        const candidate = pendingIceCandidates[attemptId].shift();
        await pc.addIceCandidate(candidate);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc:answer', {
        attemptId,
        answer: pc.localDescription,
        viewerId
      });

      console.log('ADMIN sent WebRTC answer for:', attemptId);
    } catch (error) {
      console.error('ADMIN WebRTC offer handling error:', error);
    }
  });

  // ============================================================
  // WEBRTC SIGNALING: RECEIVE ICE CANDIDATE
  // ============================================================

  socket.on('webrtc:ice', async ({ attemptId, candidate }) => {
    if (!attemptId || !candidate) return;

    const pc = peers[attemptId];

    if (!pc || !pc.remoteDescription) {
      pendingIceCandidates[attemptId] ||= [];
      pendingIceCandidates[attemptId].push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('ADMIN ICE error:', error);
    }
  });

  // ============================================================
  // INITIALIZATION
  // ============================================================

  initExams().then(() => {
    refresh();
  });

  // Refresh every 8 seconds as safety net
  setInterval(refresh, 8000);
})();