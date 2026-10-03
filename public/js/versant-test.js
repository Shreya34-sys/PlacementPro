const token = localStorage.getItem('token');

if (!token) {
    location.href = '/';
}

/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   API HELPER
   ========================================================= */

const api = async (url, opt = {}) => {
    opt.headers = {
        ...(opt.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(url, opt);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
};


/* =========================================================
   TEST STATE
   ========================================================= */

let assignment = null;
let questions = [];
let index = 0;

let media = null;
let recorder = null;
let chunks = [];

let startedAt = 0;
let answerStarted = 0;


/* =========================================================
   TIMERS / AUDIO STATE
   ========================================================= */

let timer = null;
let audioContext = null;
let analyser = null;

let silenceTimer = null;
let levelFrame = null;
let answerTimeout = null;
let recordingTimer = null;

let lastSoundAt = 0;
let speaking = false;


/* =========================================================
   RESPONSE STATE
   ========================================================= */

let responseSubmitting = false;
let finishing = false;

let startingTest = false;


/* =========================================================
   ONE-ATTEMPT STATE
   ========================================================= */

/*
 * This is only a browser-side protection.
 *
 * The REAL one-attempt protection must also be enforced
 * by the backend/database.
 *
 * localStorage is used instead of sessionStorage so that
 * refreshing/reopening the page does not reset the flag.
 */

function completedStorageKey(testId) {
    return `versant_completed_${testId}`;
}


function hasCompletedTest(testId) {
    return localStorage.getItem(
        completedStorageKey(testId)
    ) === 'true';
}


function markTestCompleted(testId) {
    if (!testId) {
        return;
    }

    localStorage.setItem(
        completedStorageKey(testId),
        'true'
    );
}


/* =========================================================
   SECTION INSTRUCTION AUDIO
   ========================================================= */

const SECTION_INSTRUCTIONS = {
    read_aloud:
        '/versant/uploads/instructions/read_aloud_instruction.mp3',

    repeat_sentence:
        '/versant/uploads/instructions/repeat_instruction.mp3',

    short_answer:
        '/versant/uploads/instructions/short_answer_instruction.mp3',

    sentence_build:
        '/versant/uploads/instructions/sentence_build_instruction.mp3',

    story_retell:
        '/versant/uploads/instructions/story_instruction.mp3',

    open_opinion:
        '/versant/uploads/instructions/opinion_instruction.mp3'
};


/*
 * Stores sections whose instruction has already
 * been successfully played during this attempt.
 *
 * Example:
 *
 * Repeat Sentence Q1
 * → instruction plays
 *
 * Repeat Sentence Q2
 * → instruction does not play again
 *
 * Short Answer Q1
 * → new instruction plays
 */

const playedInstructions = new Set();


/* =========================================================
   PLAY SECTION INSTRUCTION
   ========================================================= */

async function playSectionInstruction(sectionKey) {
    const key = String(sectionKey || '')
        .toLowerCase()
        .trim();

    if (!key) {
        console.warn(
            '[Versant] Missing section key.'
        );

        return;
    }

    /*
     * Do not play the same section instruction again.
     */
    if (playedInstructions.has(key)) {
        console.log(
            '[Versant] Instruction already played:',
            key
        );

        return;
    }

    const audioUrl = SECTION_INSTRUCTIONS[key];

    if (!audioUrl) {
        console.warn(
            '[Versant] No instruction audio configured for:',
            key
        );

        return;
    }

    console.log(
        '[Versant] Playing section instruction:',
        audioUrl
    );

    try {
        const audio = new Audio();

        audio.preload = 'auto';
        audio.src = audioUrl;

        audio.load();

        await audio.play();

        await new Promise((resolve) => {
            let finished = false;

            const finish = () => {
                if (finished) {
                    return;
                }

                finished = true;

                audio.removeEventListener(
                    'ended',
                    finish
                );

                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (_) {}

                resolve();
            };

            audio.addEventListener(
                'ended',
                finish,
                { once: true }
            );

            /*
             * Safety timeout.
             */
            setTimeout(
                finish,
                30000
            );
        });

        /*
         * Mark as played only after successful playback.
         */
        playedInstructions.add(key);

        console.log(
            '[Versant] Instruction finished:',
            key
        );

    } catch (error) {
        console.warn(
            '[Versant] Instruction audio could not play:',
            audioUrl,
            error
        );

        /*
         * Do not mark it as played if playback failed.
         */
    }
}


/* =========================================================
   LOAD PUBLISHED TESTS
   ========================================================= */

async function loadPublishedTests() {
    try {
        const tests = await api(
            '/api/versant/student/tests'
        );

        $('testsLoading').classList.add('hidden');

        if (!tests.length) {
            $('availableTests').innerHTML =
                '<p>No published Versant test is available right now.</p>';

            return;
        }

        $('availableTests').innerHTML = tests
            .map((test) => {

                const completed =
                    hasCompletedTest(test.id);

                return `
                    <div class="test-option">

                        <div>
                            <h2>${esc(test.title)}</h2>

                            <p>
                                ${esc(
                                    test.description ||
                                    'English communication assessment'
                                )}
                            </p>

                            <small>
                                ${test.question_count} questions ·
                                ${Math.floor(
                                    test.duration_seconds / 60
                                )} minutes ·
                                Pass score ${test.pass_score}
                            </small>
                        </div>

                        ${
                            completed
                                ? `
                                    <button
                                        type="button"
                                        disabled
                                    >
                                        Test Completed
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        onclick="startPublishedTest(${test.id})"
                                    >
                                        Begin Test
                                    </button>
                                `
                        }

                    </div>
                `;
            })
            .join('');

    } catch (error) {
        $('testsLoading').textContent =
            error.message;
    }
}


/* =========================================================
   START PUBLISHED TEST
   ========================================================= */

window.startPublishedTest = async (testId) => {

    /*
     * Prevent double-clicking.
     */
    if (startingTest) {
        return;
    }

    /*
     * Browser-side completed check.
     *
     * This prevents a second attempt after completion
     * even if the student refreshes the page.
     */
    if (hasCompletedTest(testId)) {
        $('gateMsg').textContent =
            'You have already completed this Versant test. You cannot attempt it again.';

        alert(
            'You have already completed this Versant test.\n\n' +
            'A second attempt is not allowed.'
        );

        return;
    }

    startingTest = true;

    const buttons =
        document.querySelectorAll(
            '#availableTests button'
        );

    buttons.forEach((button) => {
        button.disabled = true;
    });

    try {

        $('gateMsg').textContent =
            'Checking your test attempt...';

        /*
         * IMPORTANT:
         *
         * Backend is called BEFORE:
         *
         * - instruction audio
         * - microphone
         * - fullscreen
         * - actual exam
         *
         * Therefore, if the backend says the student
         * already completed the test, nothing starts.
         */
        const d = await api(
            '/api/versant/student/tests/' +
            testId +
            '/start',
            {
                method: 'POST'
            }
        );

        /*
         * Backend must return the newly created assignment.
         */
        assignment = d.assignment;
        questions = d.questions || [];

        if (!assignment) {
            throw new Error(
                'The server did not create a test attempt.'
            );
        }

        if (!questions.length) {
            throw new Error(
                'This test has no questions yet.'
            );
        }

        /*
         * New valid attempt.
         */
        playedInstructions.clear();

        /*
         * Start the actual test only after backend
         * has accepted the attempt.
         */
        await startTest();

    } catch (err) {

        console.error(
            '[Versant] Test start error:',
            err
        );

        /*
         * If backend rejected because the test was
         * already completed, remember it locally too.
         */
        const message =
            String(err.message || '')
                .toLowerCase();

        if (
            message.includes('already completed') ||
            message.includes('already complete') ||
            message.includes('second attempt') ||
            message.includes('cannot attempt again') ||
            message.includes('cannot attempt it again')
        ) {
            markTestCompleted(testId);

            $('gateMsg').textContent =
                'You have already completed this Versant test. You cannot attempt it again.';

            await loadPublishedTests();

            return;
        }

        $('gateMsg').textContent =
            err.message;

        buttons.forEach((button) => {
            button.disabled = false;
        });

    } finally {
        startingTest = false;
    }
};


/* =========================================================
   START TEST
   ========================================================= */

async function startTest() {
    $('testList').classList.add('hidden');
    $('test').classList.remove('hidden');

    $('testTitle').textContent =
        assignment.title;

    startedAt = Date.now();

    /*
     * Microphone setup.
     */
    try {
        await setupMic();

    } catch (error) {
        $('status').textContent =
            'Microphone access is required to continue.';

        alert(
            'Please allow microphone access and reload the test.'
        );

        throw error;
    }

    /*
     * Browser fullscreen.
     */
    try {
        await document.documentElement
            .requestFullscreen?.();

    } catch (_) {
        /*
         * Fullscreen can fail if browser blocks it.
         */
    }

    /*
     * Start first question.
     */
    showQuestion();

    /*
     * Overall test timer.
     */
    timer = setInterval(
        updateTimer,
        1000
    );

    /*
     * Proctoring events.
     */
    document.addEventListener(
        'visibilitychange',
        onVisibilityChange
    );

    document.addEventListener(
        'fullscreenchange',
        onFullscreenChange
    );

    window.addEventListener(
        'beforeunload',
        cleanup
    );
}


/* =========================================================
   MICROPHONE SETUP
   ========================================================= */

async function setupMic() {
    media = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },

        video: false
    });

    audioContext = new (
        window.AudioContext ||
        window.webkitAudioContext
    )();

    await audioContext.resume();

    const source =
        audioContext.createMediaStreamSource(
            media
        );

    analyser =
        audioContext.createAnalyser();

    analyser.fftSize = 512;

    source.connect(analyser);
}


/* =========================================================
   SHOW QUESTION
   ========================================================= */

function showQuestion() {
    clearQuestionTimers();

    const question =
        questions[index];

    if (!question) {
        finish();
        return;
    }

    chunks = [];
    recorder = null;

    responseSubmitting = false;
    speaking = false;

    $('counter').textContent =
        `Question ${index + 1} of ${questions.length} · ${question.sectionName}`;

    $('section').textContent =
        question.sectionName;

    $('prompt').textContent =
        question.questionText;

    $('bar').style.width =
        `${(index / questions.length) * 100}%`;

    $('status').textContent =
        'Get ready...';

    $('recordingState').textContent =
        'Preparing';

    $('recordingState').className = '';

    $('recordingTime').textContent =
        '0:00';

    $('recordingSize').textContent =
        '0 B';

    $('levelFill').style.width =
        '2%';

    $('micDot')
        .classList
        .remove('on');

    $('autoHint').textContent =
        getFlowHint(question);

    $('startAnswer')
        .classList
        .add('hidden');

    $('next')
        .classList
        .add('hidden');

    $('next').disabled = true;


    /* =====================================================
       QUESTION AUDIO
       ===================================================== */

    if (question.promptAudioUrl) {
        $('promptAudio').src =
            question.promptAudioUrl;

        $('promptAudio')
            .classList
            .remove('hidden');

    } else {
        $('promptAudio')
            .removeAttribute('src');

        $('promptAudio')
            .classList
            .add('hidden');
    }


    /*
     * Give the candidate a short preparation period,
     * then automatically start the response flow.
     */
    setTimeout(
        () => beginAutomatedResponse(question),
        900
    );
}


/* =========================================================
   FLOW HINT
   ========================================================= */

function getFlowHint(question) {
    const key =
        String(question.sectionKey || '')
            .toLowerCase();

    if (key === 'read_aloud') {
        return (
            'Read the sentence aloud after the recording cue.'
        );
    }

    if (key === 'repeat_sentence') {
        return (
            'Listen carefully, then repeat the sentence after the tone.'
        );
    }

    if (key === 'short_answer') {
        return (
            'Answer the question after the tone.'
        );
    }

    if (key === 'sentence_build') {
        return (
            'Say the complete sentence after the tone.'
        );
    }

    if (key === 'story_retell') {
        return (
            'Retell the story clearly after the tone.'
        );
    }

    return (
        'Give your opinion clearly after the tone.'
    );
}


/* =========================================================
   AUTOMATED RESPONSE FLOW
   ========================================================= */

async function beginAutomatedResponse(question) {
    if (
        finishing ||
        responseSubmitting ||
        !media
    ) {
        return;
    }


    /* =====================================================
       1. SECTION INSTRUCTION
       ===================================================== */

    await playSectionInstruction(
        question.sectionKey
    );


    if (
        finishing ||
        responseSubmitting
    ) {
        return;
    }


    /* =====================================================
       2. QUESTION AUDIO
       ===================================================== */

    if (question.promptAudioUrl) {
        try {
            const audio =
                $('promptAudio');

            audio.currentTime = 0;

            await audio.play();

            await new Promise((resolve) => {
                if (audio.ended) {
                    resolve();
                    return;
                }

                const done = () => {
                    audio.removeEventListener(
                        'ended',
                        done
                    );

                    resolve();
                };

                audio.addEventListener(
                    'ended',
                    done,
                    { once: true }
                );

                setTimeout(() => {
                    audio.removeEventListener(
                        'ended',
                        done
                    );

                    resolve();
                }, 20000);
            });

        } catch (error) {
            console.warn(
                '[Versant] Question audio could not play:',
                error
            );
        }
    }


    if (
        finishing ||
        responseSubmitting
    ) {
        return;
    }


    /* =====================================================
       3. BEEP
       ===================================================== */

    await playCue();


    /* =====================================================
       4. AUTOMATIC RECORDING
       ===================================================== */

    startRecorder(question);
}


/* =========================================================
   RECORDING CUE
   ========================================================= */

async function playCue() {
    try {
        if (!audioContext) {
            return;
        }

        await audioContext.resume();

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type =
            'sine';

        oscillator.frequency.value =
            880;

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.22,
            audioContext.currentTime + 0.015
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.22
        );

        oscillator
            .connect(gain)
            .connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.24
        );

    } catch (_) {
        /*
         * Ignore cue errors.
         */
    }
}


/* =========================================================
   START RECORDER
   ========================================================= */

function startRecorder(question) {
    chunks = [];

    answerStarted =
        Date.now();

    lastSoundAt =
        Date.now();

    speaking = false;

    const mime =
        MediaRecorder.isTypeSupported(
            'audio/webm;codecs=opus'
        )
            ? 'audio/webm;codecs=opus'
            : 'audio/webm';


    try {
        recorder =
            new MediaRecorder(
                media,
                {
                    mimeType: mime
                }
            );

    } catch (error) {
        $('status').textContent =
            'Your browser could not start audio recording.';

        return;
    }


    /* =====================================================
       AUDIO DATA
       ===================================================== */

    recorder.ondataavailable =
        (event) => {
            if (
                event.data &&
                event.data.size > 0
            ) {
                chunks.push(
                    event.data
                );

                $('recordingSize').textContent =
                    formatBytes(
                        chunks.reduce(
                            (total, chunk) =>
                                total + chunk.size,
                            0
                        )
                    );
            }
        };


    /* =====================================================
       RECORDING ERROR
       ===================================================== */

    recorder.onerror =
        () => {
            $('status').textContent =
                'Recording error. Please contact the test administrator.';

            clearQuestionTimers();
        };


    /* =====================================================
       RECORDING STOP
       ===================================================== */

    recorder.onstop =
        () => {
            clearQuestionTimers();

            $('micDot')
                .classList
                .remove('on');

            $('recordingState').textContent =
                chunks.length
                    ? 'Recording captured'
                    : 'No recording captured';

            $('recordingState').className =
                chunks.length
                    ? 'captured'
                    : 'error';

            $('status').textContent =
                chunks.length
                    ? 'Recording captured. Processing your response...'
                    : 'No audio was captured.';

            if (chunks.length) {
                uploadResponse();
            }
        };


    /* =====================================================
       START RECORDING
       ===================================================== */

    recorder.start(250);

    $('micDot')
        .classList
        .add('on');

    $('recordingState').textContent =
        'RECORDING';

    $('recordingState').className =
        'recording';

    $('status').textContent =
        'Speak now.';


    startRecordingTimer(
        question.responseSeconds || 30
    );

    startLevelMeter();

    startSilenceWatch(
        question.silenceSeconds || 7
    );


    /* =====================================================
       MAX RESPONSE TIME
       ===================================================== */

    answerTimeout =
        setTimeout(
            () => stopRecorder('time_limit'),
            (question.responseSeconds || 30) * 1000
        );
}


/* =========================================================
   STOP RECORDER
   ========================================================= */

function stopRecorder(reason = 'silence') {
    clearQuestionTimers();

    if (
        recorder?.state === 'recording'
    ) {
        $('status').textContent =
            reason === 'time_limit'
                ? 'Time limit reached. Processing...'
                : 'Silence detected. Processing...';

        recorder.stop();
    }
}


/* =========================================================
   RECORDING TIMER
   ========================================================= */

function startRecordingTimer(maxSeconds) {
    clearInterval(
        recordingTimer
    );

    recordingTimer =
        setInterval(() => {
            const elapsed =
                Math.floor(
                    (Date.now() - answerStarted) /
                    1000
                );

            $('recordingTime').textContent =
                formatSeconds(elapsed);

            if (elapsed >= maxSeconds) {
                clearInterval(
                    recordingTimer
                );
            }

        }, 250);
}


/* =========================================================
   MICROPHONE LEVEL METER
   ========================================================= */

function startLevelMeter() {
    cancelAnimationFrame(
        levelFrame
    );

    const data =
        new Uint8Array(
            analyser.frequencyBinCount
        );

    const draw = () => {
        if (
            !analyser ||
            recorder?.state !== 'recording'
        ) {
            return;
        }

        analyser.getByteTimeDomainData(
            data
        );

        let sum = 0;

        for (const value of data) {
            const normalized =
                (value - 128) / 128;

            sum +=
                normalized * normalized;
        }

        const rms =
            Math.sqrt(
                sum / data.length
            );

        const percentage =
            Math.min(
                100,
                Math.max(
                    2,
                    Math.round(
                        rms * 500
                    )
                )
            );

        $('levelFill').style.width =
            percentage + '%';

        levelFrame =
            requestAnimationFrame(draw);
    };

    levelFrame =
        requestAnimationFrame(draw);
}


/* =========================================================
   SILENCE DETECTION
   ========================================================= */

function startSilenceWatch(limit) {
    const data =
        new Uint8Array(
            analyser.frequencyBinCount
        );

    clearInterval(
        silenceTimer
    );

    silenceTimer =
        setInterval(() => {
            if (
                recorder?.state !== 'recording'
            ) {
                return;
            }

            analyser.getByteTimeDomainData(
                data
            );

            let sum = 0;

            for (const value of data) {
                const normalized =
                    (value - 128) / 128;

                sum +=
                    normalized * normalized;
            }

            const rms =
                Math.sqrt(
                    sum / data.length
                );

            if (rms > 0.035) {
                lastSoundAt =
                    Date.now();

                speaking = true;
            }

            if (
                speaking &&
                Date.now() - lastSoundAt >=
                limit * 1000
            ) {
                stopRecorder(
                    'silence'
                );
            }

        }, 150);
}


/* =========================================================
   UPLOAD RESPONSE
   ========================================================= */

async function uploadResponse() {
    if (
        responseSubmitting ||
        finishing
    ) {
        return;
    }

    responseSubmitting = true;

    const question =
        questions[index];

    if (!chunks.length) {
        responseSubmitting = false;

        $('status').textContent =
            'No recording was captured. This response cannot be submitted.';

        return;
    }

    const blob =
        new Blob(
            chunks,
            {
                type:
                    recorder?.mimeType ||
                    'audio/webm'
            }
        );

    const formData =
        new FormData();

    formData.append(
        'questionId',
        question.id
    );

    formData.append(
        'questionNo',
        index + 1
    );

    formData.append(
        'durationMs',
        Date.now() - answerStarted
    );

    formData.append(
        'pauseCount',
        0
    );

    formData.append(
        'longestPauseMs',
        0
    );

    formData.append(
        'audio',
        blob,
        `answer-${index + 1}.webm`
    );

    $('status').textContent =
        `Uploading ${(blob.size / 1024).toFixed(1)} KB and evaluating...`;


    try {
        const data =
            await api(
                `/api/versant/student/assignments/${assignment.id}/response`,
                {
                    method: 'POST',
                    body: formData
                }
            );

        const score =
            Number(
                data?.score?.total
            );

        $('status').textContent =
            Number.isFinite(score)
                ? `Response recorded · Score ${score.toFixed(0)}/100`
                : 'Response recorded successfully.';

        index++;

        if (
            index < questions.length
        ) {
            setTimeout(
                showQuestion,
                900
            );

        } else {
            await finish();
        }

    } catch (error) {
        responseSubmitting = false;

        $('status').textContent =
            error.message;

        $('recordingState').textContent =
            'Upload failed';

        $('recordingState').className =
            'error';
    }
}


/* =========================================================
   FINISH TEST
   ========================================================= */

async function finish() {
    if (finishing) {
        return;
    }

    finishing = true;

    clearInterval(timer);
    clearQuestionTimers();

    /*
     * If recording is still active, stop it first.
     * The onstop handler will continue the submission flow.
     */
    if (
        recorder?.state === 'recording'
    ) {
        recorder.stop();
        return;
    }

    try {
        await api(
            `/api/versant/student/assignments/${assignment.id}/submit`,
            {
                method: 'POST'
            }
        );

        /*
         * IMPORTANT:
         *
         * Mark the test as completed only AFTER
         * the server successfully submits the attempt.
         */
        markTestCompleted(
            assignment.test_id
        );

        cleanup();

        $('test')
            .classList
            .add('hidden');

        $('done')
            .classList
            .remove('hidden');

        $('resultLink').href =
            `/pages/versant-result.html?assignment=${assignment.id}`;

    } catch (error) {
        finishing = false;

        alert(
            error.message
        );
    }
}


/* =========================================================
   OVERALL TEST TIMER
   ========================================================= */

/* =========================================================
   OVERALL TEST TIMER
   ========================================================= */

function updateTimer() {
    if (!assignment) {
        return;
    }

    const elapsed =
        Math.floor(
            (Date.now() - startedAt) / 1000
        );

    /*
     * Backend may return either:
     *
     * durationSeconds
     *
     * or
     *
     * duration_seconds
     *
     * Support both.
     */
    const durationSeconds =
        Number(
            assignment.durationSeconds ??
            assignment.duration_seconds
        );

    /*
     * Prevent NaN from appearing on screen.
     */
    if (!Number.isFinite(durationSeconds)) {
        console.error(
            '[Versant] Invalid test duration:',
            assignment
        );

        $('timer').textContent = '00:00';

        return;
    }

    const left =
        Math.max(
            0,
            durationSeconds - elapsed
        );

    $('timer').textContent =
        `${String(
            Math.floor(left / 60)
        ).padStart(2, '0')}:${String(
            left % 60
        ).padStart(2, '0')}`;

    if (left <= 0) {
        finish();
    }
}

/* =========================================================
   CLEAR QUESTION TIMERS
   ========================================================= */

function clearQuestionTimers() {
    clearInterval(
        silenceTimer
    );

    clearInterval(
        recordingTimer
    );

    clearTimeout(
        answerTimeout
    );

    silenceTimer = null;
    recordingTimer = null;
    answerTimeout = null;

    cancelAnimationFrame(
        levelFrame
    );
}


/* =========================================================
   TAB SWITCH
   ========================================================= */

async function onVisibilityChange() {
    if (
        document.hidden &&
        assignment
    ) {
        await visibilityFlag(
            'tab_switch'
        );
    }
}


/* =========================================================
   FULLSCREEN EXIT
   ========================================================= */

async function onFullscreenChange() {
    if (
        assignment &&
        !document.fullscreenElement
    ) {
        await visibilityFlag(
            'fullscreen_exit'
        );
    }
}


/* =========================================================
   PROCTORING EVENT
   ========================================================= */

async function visibilityFlag(type) {
    try {
        await api(
            `/api/versant/student/assignments/${assignment.id}/event`,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    type
                })
            }
        );

    } catch (_) {
        /*
         * Ignore proctoring event errors.
         */
    }
}


/* =========================================================
   CLEANUP
   ========================================================= */

function cleanup() {
    clearQuestionTimers();

    clearInterval(
        timer
    );

    if (media) {
        media
            .getTracks()
            .forEach(
                (track) => track.stop()
            );
    }

    if (
        audioContext &&
        audioContext.state !== 'closed'
    ) {
        audioContext
            .close()
            .catch(() => {});
    }
}


/* =========================================================
   FORMAT SECONDS
   ========================================================= */

function formatSeconds(seconds) {
    const value =
        Math.max(
            0,
            Math.floor(
                Number(seconds) || 0
            )
        );

    return `${Math.floor(
        value / 60
    )}:${String(
        value % 60
    ).padStart(2, '0')}`;
}


/* =========================================================
   FORMAT FILE SIZE
   ========================================================= */

function formatBytes(bytes) {
    const value =
        Number(bytes) || 0;

    if (value < 1024) {
        return `${value} B`;
    }

    if (
        value <
        1024 * 1024
    ) {
        return `${(
            value / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        value / 1024 / 1024
    ).toFixed(2)} MB`;
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function esc(value) {
    return String(
        value ?? ''
    ).replace(
        /[&<>"']/g,
        (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character])
    );
}


/* =========================================================
   LOAD TESTS
   ========================================================= */

loadPublishedTests();