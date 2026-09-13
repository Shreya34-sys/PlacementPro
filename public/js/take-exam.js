let questions = [];
let currentIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeRemaining = 0;
let examId = new URLSearchParams(window.location.search).get('id');

async function initExam() {
    const token = localStorage.getItem('token');
    if (!token || !examId) {
        alert('Invalid session or exam ID.');
        window.location.href = '/pages/available-exams.html';
        return;
    }

    try {
        const res = await fetch(`/api/exams/${examId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch exam paper');

        document.getElementById('examTitle').innerText = data.title;
        questions = data.questions || [];
        timeRemaining = (data.duration_minutes || 30) * 60;

        startTimer();
        renderQuestion();
    } catch (err) {
        alert(err.message);
        window.location.href = '/pages/available-exams.html';
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const secs = (timeRemaining % 60).toString().padStart(2, '0');
        document.getElementById('timerDisplay').innerText = `${mins}:${secs}`;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time limit reached. Submitting test automatically.');
            submitExam();
        }
    }, 1000);
}

function renderQuestion() {
    const q = questions[currentIndex];
    const container = document.getElementById('questionContainer');
    const selectedOption = userAnswers[q.id];

    container.innerHTML = `
        <span style="font-size:0.85rem; color:#64748b; font-weight:600;">Question ${currentIndex + 1} of ${questions.length}</span>
        <h3 style="margin: 0.75rem 0 1.5rem 0; font-size:1.15rem; color:#0f172a;">${q.question_text}</h3>
        <div>
            ${['option_a', 'option_b', 'option_c', 'option_d'].map((key, i) => {
                const optText = q[key];
                const letter = String.fromCharCode(65 + i);
                if (!optText) return '';
                return `
                    <label class="option-label">
                        <input type="radio" name="option" value="${letter}" ${selectedOption === letter ? 'checked' : ''} onchange="saveAnswer(${q.id}, '${letter}')">
                        <span><strong>${letter}.</strong> ${optText}</span>
                    </label>
                `;
            }).join('')}
        </div>
    `;

    document.getElementById('prevBtn').disabled = currentIndex === 0;
    if (currentIndex === questions.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'block';
    } else {
        document.getElementById('nextBtn').style.display = 'block';
        document.getElementById('submitBtn').style.display = 'none';
    }
}

function saveAnswer(questionId, option) {
    userAnswers[questionId] = option;
}

function navigateQuestion(direction) {
    currentIndex += direction;
    renderQuestion();
}

async function submitExam() {
    clearInterval(timerInterval);
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`/api/exams/${examId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ answers: userAnswers })
        });

        const result = await res.json();
        if (res.ok) {
            alert(`Assessment submitted! Score: ${result.score}%`);
            window.location.href = '/dashboard';
        } else {
            alert(result.message || 'Submission failed.');
        }
    } catch (err) {
        alert('Server connection error during submission.');
    }
}

initExam();