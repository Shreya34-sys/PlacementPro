(() => {
  // ============================================================
  // ADMIN AUTHENTICATION
  // ============================================================

  const proctoringAdminToken =
    localStorage.getItem('adminToken');

  const examId =
    new URLSearchParams(location.search).get('exam');

  if (!proctoringAdminToken || !examId) {
    location.replace('/admin-login');
    return;
  }

  // ============================================================
  // SOCKET.IO
  // ============================================================

  const socket = io({
    auth: {
      token: proctoringAdminToken
    }
  });

  // ============================================================
  // WEBRTC STORAGE
  // ============================================================

  const peers = {};
  const peerStreams = {};
  const pendingIceCandidates = {};

  // ============================================================
  // API REQUEST HELPER
  // ============================================================

  const request = (url, options = {}) => {
    return fetch(url, {
      ...options,

      headers: {
        Authorization:
          `Bearer ${proctoringAdminToken}`,

        'Content-Type':
          'application/json',

        ...(options.headers || {})
      }
    });
  };

  // ============================================================
  // HTML ESCAPE
  // ============================================================

  const esc = (value) => {
    const element =
      document.createElement('div');

    element.textContent =
      value ?? '';

    return element.innerHTML;
  };

  // ============================================================
  // CREATE WEBRTC PEER
  // ============================================================

  function createPeer(attemptId) {

    // Close old peer if one already exists
    if (peers[attemptId]) {
      try {
        peers[attemptId].close();
      } catch (_) {}
    }

    pendingIceCandidates[attemptId] = [];

    const pc =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              'stun:stun.l.google.com:19302'
          }
        ]
      });

    peers[attemptId] = pc;

    // ========================================================
    // RECEIVE STUDENT CAMERA STREAM
    // ========================================================

    pc.ontrack = (event) => {

      const video =
        document.getElementById(
          `feed-${attemptId}`
        );

      const stream =
        event.streams?.[0];

      if (!video || !stream) {
        console.warn(
          'Admin video element or stream missing:',
          attemptId
        );

        return;
      }

      peerStreams[attemptId] =
        stream;

      video.srcObject =
        stream;

      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;

      video.play().catch(
        (error) => {
          console.warn(
            'Admin video play error:',
            error
          );
        }
      );

      console.log(
        'ADMIN: Student camera stream received:',
        attemptId
      );
    };

    // ========================================================
    // SEND ICE CANDIDATES TO STUDENT
    // ========================================================

    pc.onicecandidate =
      (event) => {

        if (!event.candidate) {
          return;
        }

        socket.emit(
          'webrtc:ice',
          {
            attemptId,

            candidate:
              event.candidate,

            target:
              'student'
          }
        );
      };

    // ========================================================
    // WEBRTC CONNECTION STATE
    // ========================================================

    pc.onconnectionstatechange =
      () => {

        console.log(
          `ADMIN WebRTC ${attemptId}:`,
          pc.connectionState
        );

        if (
          pc.connectionState ===
            'failed' ||
          pc.connectionState ===
            'closed'
        ) {

          console.warn(
            'ADMIN: WebRTC connection ended:',
            attemptId
          );
        }
      };

    return pc;
  }

  // ============================================================
  // REFRESH ADMIN DASHBOARD
  // ============================================================

  async function refresh() {

    try {

      const [
        activeResponse,
        flagsResponse
      ] = await Promise.all([

        request(
          `/api/exams/${examId}/proctoring/active-attempts`
        ),

        request(
          `/api/exams/${examId}/proctoring/flags`
        )

      ]);

      // --------------------------------------------------------
      // CHECK API RESPONSE
      // --------------------------------------------------------

      if (
        !activeResponse.ok ||
        !flagsResponse.ok
      ) {

        console.error(
          'Proctoring API error:',
          activeResponse.status,
          flagsResponse.status
        );

        return;
      }

      const active =
        await activeResponse.json();

      const flags =
        await flagsResponse.json();

      // --------------------------------------------------------
      // MAP FLAGS BY ATTEMPT
      // --------------------------------------------------------

      const byAttempt =
        new Map(
          flags.map(
            (flag) => [
              flag.attempt_id,
              flag
            ]
          )
        );

      const container =
        document.querySelector(
          '#studentFeeds'
        );

      if (!container) {
        return;
      }

      // --------------------------------------------------------
      // CREATE STUDENT CARDS
      // --------------------------------------------------------

      container.innerHTML =
        active
          .map((attempt) => {

            const flag =
              byAttempt.get(
                attempt.attempt_id
              );

            const warningCount =
              Number(
                attempt.warnings_count || 0
              );

            return `
              <article
                class="card feed ${
                  flag
                    ? `severity-${esc(flag.severity)}`
                    : ''
                }"
              >

                <video
                  id="feed-${esc(attempt.attempt_id)}"
                  class="video"
                  autoplay
                  playsinline
                  muted
                ></video>

                <div class="details">

                  <b>
                    ${esc(attempt.fullName)}
                  </b>

                  <p>
                    ${
                      flag
                        ? esc(flag.message)
                        : 'No current integrity flags.'
                    }
                  </p>

                  <small
                    class="warning-count"
                    data-warning-attempt="${esc(
                      attempt.attempt_id
                    )}"
                  >
                    Warnings:
                    ${warningCount}/3
                  </small>

                  <p>

                    <button
                      class="outline monitor"
                      data-attempt="${esc(
                        attempt.attempt_id
                      )}"
                    >
                      Monitor live camera
                    </button>

                    ${
                      flag
                        ? `
                          <button
                            class="outline resolve"
                            data-flag="${esc(flag.id)}"
                            data-attempt="${esc(
                              attempt.attempt_id
                            )}"
                          >
                            Resolve
                          </button>
                        `
                        : ''
                    }

                    ${
                      flag
                        ? `
                          <button
                            class="outline remove"
                            data-student="${esc(
                              attempt.student_id
                            )}"
                            data-flag="${esc(flag.id)}"
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
          .join('') ||
        '<p>No students are currently taking this assessment.</p>';

      // ========================================================
      // RESTORE EXISTING WEBRTC STREAMS
      // ========================================================

      Object.entries(
        peerStreams
      ).forEach(
        ([attemptId, stream]) => {

          const video =
            document.getElementById(
              `feed-${attemptId}`
            );

          if (!video || !stream) {
            return;
          }

          video.srcObject =
            stream;

          video.autoplay = true;
          video.playsInline = true;
          video.muted = true;

          video.play().catch(
            () => {}
          );
        }
      );

      // ========================================================
      // MONITOR LIVE CAMERA BUTTON
      // ========================================================

      document
        .querySelectorAll('.monitor')
        .forEach((button) => {

          button.onclick = () => {

            const attemptId =
              button.dataset.attempt;

            if (!attemptId) {
              return;
            }

            console.log(
              'ADMIN requesting student stream:',
              attemptId
            );

            socket.emit(
              'monitor-attempt',
              attemptId
            );
          };

        });

      // ========================================================
      // RESOLVE WARNING BUTTON
      // ========================================================

      document
        .querySelectorAll('.resolve')
        .forEach((button) => {

          button.onclick =
            async () => {

              const flagId =
                button.dataset.flag;

              const attemptId =
                button.dataset.attempt;

              if (!flagId) {
                console.error(
                  'Resolve failed: flag ID missing.'
                );

                return;
              }

              // Prevent double clicks
              button.disabled = true;

              const originalText =
                button.textContent;

              button.textContent =
                'Resolving...';

              try {

                console.log(
                  'ADMIN resolving warning:',
                  flagId
                );

                const response =
                  await request(
                    `/api/exams/proctoring/flags/${encodeURIComponent(
                      flagId
                    )}/resolve`,
                    {
                      method: 'PATCH'
                    }
                  );

                const result =
                  await response
                    .json()
                    .catch(() => ({}));

                if (!response.ok) {

                  console.error(
                    'Resolve API failed:',
                    response.status,
                    result
                  );

                  alert(
                    result.message ||
                    'Could not resolve this warning.'
                  );

                  button.disabled = false;
                  button.textContent =
                    originalText;

                  return;
                }

                console.log(
                  'WARNING RESOLVED:',
                  result
                );

                // The backend returns the new count.
                // Refresh dashboard so the new count
                // is displayed immediately.
                await refresh();

              } catch (error) {

                console.error(
                  'Resolve warning error:',
                  error
                );

                alert(
                  'Could not resolve this warning.'
                );

                button.disabled = false;
                button.textContent =
                  originalText;
              }

            };

        });

      // ========================================================
      // REMOVE STUDENT BUTTON
      // ========================================================

      document
        .querySelectorAll('.remove')
        .forEach((button) => {

          button.onclick =
            async () => {

              const studentId =
                button.dataset.student;

              const flagId =
                button.dataset.flag;

              if (
                !confirm(
                  'Remove this student and resolve this flag?'
                )
              ) {
                return;
              }

              button.disabled = true;

              try {

                const response =
                  await request(
                    `/api/exams/proctoring/students/${encodeURIComponent(
                      studentId
                    )}/remove`,
                    {
                      method: 'PATCH',

                      body:
                        JSON.stringify({
                          flagId
                        })
                    }
                  );

                const result =
                  await response
                    .json()
                    .catch(() => ({}));

                if (!response.ok) {

                  console.error(
                    'Remove student failed:',
                    response.status,
                    result
                  );

                  alert(
                    result.message ||
                    'Could not remove the student.'
                  );

                  button.disabled = false;

                  return;
                }

                console.log(
                  'Student removed successfully.'
                );

                await refresh();

              } catch (error) {

                console.error(
                  'Remove student error:',
                  error
                );

                alert(
                  'Could not remove the student.'
                );

                button.disabled = false;
              }

            };

        });

    } catch (error) {

      console.error(
        'Proctoring refresh error:',
        error
      );
    }
  }

  // ============================================================
  // WATCH THIS EXAM
  // ============================================================

  socket.emit(
    'watch-exam',
    examId
  );

  // ============================================================
  // REAL-TIME NEW WARNING
  // ============================================================

  socket.on(
    'proctor:flag',
    () => {

      console.log(
        'ADMIN: New proctoring warning received.'
      );

      refresh();
    }
  );

  // ============================================================
  // REAL-TIME WARNING RESOLVED
  // ============================================================

  socket.on(
    'proctor:warning-resolved',
    (data) => {

      console.log(
        'ADMIN: Warning resolved:',
        data
      );

      /*
       * Backend sends:
       *
       * {
       *   attemptId,
       *   flagId,
       *   warningsCount
       * }
       */

      if (
        data?.attemptId &&
        typeof data.warningsCount !==
          'undefined'
      ) {

        const countElement =
          document.querySelector(
            `[data-warning-attempt="${CSS.escape(
              String(data.attemptId)
            )}"]`
          );

        if (countElement) {

          countElement.textContent =
            `Warnings: ${Number(
              data.warningsCount
            )}/3`;
        }
      }

      // Refresh because the warning itself
      // should also disappear from the card.
      refresh();
    }
  );

  // ============================================================
  // WEBRTC OFFER FROM STUDENT
  // ============================================================

  socket.on(
    'webrtc:offer',
    async ({
      attemptId,
      offer
    }) => {

      if (!attemptId || !offer) {
        return;
      }

      console.log(
        'ADMIN received WebRTC offer for:',
        attemptId
      );

      try {

        const pc =
          createPeer(attemptId);

        // Student's offer
        await pc.setRemoteDescription(
          offer
        );

        // Add ICE candidates that arrived
        // before the remote description.
        while (
          pendingIceCandidates[attemptId]
            ?.length
        ) {

          const candidate =
            pendingIceCandidates[
              attemptId
            ].shift();

          await pc.addIceCandidate(
            candidate
          );
        }

        // Create answer
        const answer =
          await pc.createAnswer();

        await pc.setLocalDescription(
          answer
        );

        // Send answer back to student
        socket.emit(
          'webrtc:answer',
          {
            attemptId,

            answer:
              pc.localDescription
          }
        );

        console.log(
          'ADMIN sent WebRTC answer for:',
          attemptId
        );

      } catch (error) {

        console.error(
          'ADMIN WebRTC offer error:',
          error
        );
      }
    }
  );

  // ============================================================
  // WEBRTC ICE CANDIDATE
  // ============================================================

  socket.on(
    'webrtc:ice',
    async ({
      attemptId,
      candidate
    }) => {

      if (!attemptId || !candidate) {
        return;
      }

      const pc =
        peers[attemptId];

      // If peer isn't ready yet, save candidate.
      if (
        !pc ||
        !pc.remoteDescription
      ) {

        pendingIceCandidates[
          attemptId
        ] ||= [];

        pendingIceCandidates[
          attemptId
        ].push(candidate);

        return;
      }

      try {

        await pc.addIceCandidate(
          candidate
        );

      } catch (error) {

        console.error(
          'ADMIN ICE error:',
          error
        );
      }
    }
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  refresh();

  // Refresh every 10 seconds
  setInterval(
    refresh,
    10000
  );

})();