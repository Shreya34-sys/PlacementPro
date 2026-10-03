const token = localStorage.getItem('token');
const id = new URLSearchParams(location.search).get('assignment');
const $ = x => document.getElementById(x);

if (!token || !id) {
    location.href = '/';
} else {
    loadResult();
}

async function loadResult() {
    const cached = sessionStorage.getItem(`versant_result_${id}`);

    if (cached) {
        try {
            const quick = JSON.parse(cached);
            if (quick && quick.overall !== undefined) {
                renderResult({
                    overall_score: quick.overall,
                    cefr_level: quick.cefr,
                    passed: quick.passed
                }, true);
            }
        } catch (_) {}
    }

    let lastMessage = 'Result is being prepared...';

    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            const r = await fetch(
                `/api/versant/student/assignments/${id}/result`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const d = await r.json().catch(() => ({}));

            if (r.ok && d && d.overall_score !== undefined) {
                renderResult(d);
                sessionStorage.removeItem(`versant_result_${id}`);
                return;
            }

            lastMessage = d.message || 'Result is being prepared...';
        } catch (e) {
            lastMessage = e.message || 'Could not load the result.';
        }

        if (attempt < 5) {
            $('status').textContent =
                `${lastMessage} Retrying (${attempt + 1}/5)...`;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    $('status').textContent = lastMessage;
}

function renderResult(d, partial = false) {
    $('score').textContent =
        `${Number(d.overall_score || 0).toFixed(1)}/100`;

    $('cefr').textContent =
        `CEFR ${d.cefr_level || 'A1'} · ${d.passed ? 'PASS' : 'NOT PASSED'}`;

    if (partial) {
        $('metrics').innerHTML =
            '<div><b>Final result</b><strong>Preparing...</strong></div>';
        $('status').textContent =
            'Your final result is being prepared.';
        return;
    }

    const items = [
        ['Fluency', d.fluency_score],
        ['Pronunciation', d.pronunciation_score],
        ['Grammar', d.grammar_score],
        ['Vocabulary', d.vocabulary_score],
        ['Sentence Mastery', d.sentence_mastery_score],
        ['Coherence', d.coherence_score],
        ['Speaking Rate', `${Number(d.wpm || 0).toFixed(1)} WPM`],
        ['Hesitations', d.hesitation_count]
    ];

    $('metrics').innerHTML = items.map(([a, b]) =>
        `<div><b>${esc(a)}</b><strong>${typeof b === 'number' ? Number(b).toFixed(1) : esc(b)}</strong></div>`
    ).join('');

    $('status').textContent = 'Result loaded successfully.';
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}
