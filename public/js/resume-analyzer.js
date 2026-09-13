


document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('resumeFile');
    const fileName = document.getElementById('fileName');
    const form = document.getElementById('resumeForm');
    const analyzeBtn = document.getElementById('analyzeBtn');

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
        analyzeBtn.textContent = '🔄 Analyzing...';

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
            analyzeBtn.textContent = '🤖 Analyze Resume';
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
        .map(s => `<li><span>❌ ${s}</span></li>`)
        .join('');

    // Suggestions
    const suggestionsList = document.getElementById('suggestionsList');

    suggestionsList.innerHTML = result.analysis_json.suggestions
        .map(s => `<li>✓ ${s}</li>`)
        .join('');

    // General Feedback
    const feedbackList = document.getElementById('generalFeedback');

    feedbackList.innerHTML = result.analysis_json.general_feedback
        .map(f => `<li>📌 ${f}</li>`)
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