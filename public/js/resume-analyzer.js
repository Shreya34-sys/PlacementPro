


document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('resumeFile');
    const fileName = document.getElementById('fileName');
    const form = document.getElementById('resumeForm');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeButtonMarkup = analyzeBtn.innerHTML;

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileName.textContent = fileInput.files[0].name;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files[0]) return alert('Please select a file.');

        const formData = new FormData();
        formData.append('resume', fileInput.files[0]);
        formData.append('jobDescription', document.getElementById('jobDescription').value);

        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/resume/analyze', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                renderResults(data.data);
            } else {
                alert(data.message || 'Failed to analyze resume.');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during analysis.');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = analyzeButtonMarkup;
        }
    });
function renderResults(result) {
    document.getElementById('atsScore').textContent =
        `${result.ats_score}%`;

    document.getElementById('skillsMatch').textContent =
        `${result.skills_match}%`;

    document.getElementById('keywordMatch').textContent =
        `${result.keyword_match}%`;

    document.getElementById('overallScoreBadge').textContent =
        `Score: ${result.ats_score}%`;

    // Missing Skills
    const missingList = document.getElementById('missingSkills');

    missingList.innerHTML = result.analysis_json.missing_skills
        .map(s => `<li><span>${s}</span></li>`)
        .join('');

    // Suggestions
    const suggestionsList = document.getElementById('suggestionsList');

    suggestionsList.innerHTML = result.analysis_json.suggestions
        .map(s => `<li><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"/></svg> ${s}</li>`)
        .join('');

    // General Feedback
    const feedbackList = document.getElementById('generalFeedback');

    feedbackList.innerHTML = result.analysis_json.general_feedback
        .map(f => `<li>${f}</li>`)
        .join('');

    // Optimized Resume
    const optBtn = document.getElementById('downloadOptimizedBtn');

    optBtn.disabled = false;

    optBtn.onclick = () => {
        const blob = new Blob(
            [result.rewritten_resume],
            { type: 'text/plain;charset=utf-8' }
        );

        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = 'Optimized_ATS_Resume.txt';

        link.click();

        URL.revokeObjectURL(link.href);
    };
}
});