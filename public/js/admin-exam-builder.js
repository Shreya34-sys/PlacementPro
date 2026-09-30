

const token = localStorage.getItem('adminToken');

if (!token) {
    window.location.replace('/admin-login');
}

const topicsRoot = document.getElementById('topics');
const addTopicButton = document.getElementById('addTopic');
const examForm = document.getElementById('examForm');

function questionHtml() {
    const groupName = `correct-${crypto.randomUUID()}`;

    return `
        <fieldset class="question">
            <div class="question-header-row">
                <div class="form-group" style="margin: 0;">
                    <label>Question Text</label>
                    <textarea class="question-text" required placeholder="Enter question statement..."></textarea>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label>Marks</label>
                    <input class="question-marks" type="number" min="0.25" step="0.25" value="4" required>
                </div>
            </div>

            <label>Answer Options</label>
            <div class="options-grid">
                ${[0, 1, 2, 3].map((_, index) => `
                    <div class="option-row">
                        <label class="opt-label">Opt ${String.fromCharCode(65 + index)}</label>
                        <input class="option-text" required placeholder="Option ${String.fromCharCode(65 + index)} content">
                        <label class="correct-check-wrap">
                            <input
                                type="radio"
                                class="correct-option"
                                name="${groupName}"
                                ${index === 0 ? 'checked' : ''}
                            >
                            Correct
                        </label>
                    </div>
                `).join('')}
            </div>

            <button class="btn btn-danger remove-question" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Remove Question
            </button>
        </fieldset>
    `;
}

function addTopic() {
    const topic = document.createElement('section');
    topic.className = 'card topic';

    topic.innerHTML = `
        <div class="form-group">
            <label>Topic Module Name</label>
            <input class="topic-name" required placeholder="e.g., Logical Reasoning, Quantitative Aptitude">
        </div>

        <div class="questions">
            ${questionHtml()}
        </div>

        <div class="topic-actions">
            <button class="btn btn-outline add-question" type="button">
                + Add Another Question
            </button>

            <button class="btn btn-danger remove-topic" type="button">
                Remove Topic Module
            </button>
        </div>
    `;

    topicsRoot.appendChild(topic);
}

addTopicButton.addEventListener('click', addTopic);

topicsRoot.addEventListener('click', (event) => {
    const topic = event.target.closest('.topic');

    if (!topic) return;

    if (event.target.classList.contains('add-question') || event.target.closest('.add-question')) {
        topic.querySelector('.questions')
            .insertAdjacentHTML('beforeend', questionHtml());
    }

    if (event.target.classList.contains('remove-question') || event.target.closest('.remove-question')) {
        const questionCard = event.target.closest('.question');
        if (questionCard) questionCard.remove();
    }

    if (event.target.classList.contains('remove-topic') || event.target.closest('.remove-topic')) {
        topic.remove();
    }
});

/* Automatically initialize one topic card on page load */
addTopic();

examForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Global counter to ensure displayOrder is unique across all topics for this exam
    let globalDisplayOrder = 1;

    const topics = [...document.querySelectorAll('.topic')].map((topic) => ({
        name: topic.querySelector('.topic-name').value.trim(),

        questions: [...topic.querySelectorAll('.question')].map((question) => {
            const currentOrder = globalDisplayOrder++;

            return {
                text: question.querySelector('.question-text').value.trim(),
                marks: Number(question.querySelector('.question-marks').value),
                displayOrder: currentOrder,

                options: [...question.querySelectorAll('.option-text')].map(
                    (input, optionIndex) => ({
                        text: input.value.trim(),
                        isCorrect: question
                            .querySelectorAll('.correct-option')[optionIndex]
                            .checked
                    })
                )
            };
        })
    }));

    const getValue = (id) => document.getElementById(id).value;

    const payload = {
        title: getValue('title').trim(),
        instructions: getValue('instructions').trim(),
        durationMinutes: Number(getValue('durationMinutes')),
        startsAt: getValue('startsAt').replace('T', ' ') + ':00',
        endsAt: getValue('endsAt').replace('T', ' ') + ':00',
        negativeMarking: Number(getValue('negativeMarking')),
        status: getValue('status'),
        topics
    };

    try {
        const response = await fetch('/api/exams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Unable to save test.');
            return;
        }

        alert(`Test saved as ${payload.status}.`);
        window.location.assign('/pages/admin-exams.html');
    } catch (error) {
        console.error(error);
        alert('Could not save the test.');
    }
});