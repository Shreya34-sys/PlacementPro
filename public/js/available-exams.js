(async () => {
  const token = localStorage.getItem('token');
  const root = document.querySelector('#examList');

  try {
    const response = await fetch('/api/exams/available', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      root.innerHTML = `
        <div class="empty-state">
          <p>Please sign in to view assessments.</p>
        </div>
      `;
      return;
    }

    const exams = await response.json();

    if (!exams || exams.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <h3>No assessments available</h3>
          <p>There are no active or upcoming assessments assigned to you right now.</p>
        </div>
      `;
      return;
    }

    root.innerHTML = exams.map(exam => {
      const canOpen = exam.availability === 'available';
      const label = exam.availability.toUpperCase();
      const startDate = new Date(exam.starts_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const endDate = new Date(exam.ends_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

      return `
        <article class="card exam-card">
          <span class="pill ${canOpen ? 'blue' : ''}">${label}</span>
          <h2>${escapeHtml(exam.title)}</h2>
          
          <div class="exam-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${exam.questionCount} questions · ${exam.duration_minutes} minutes</span>
          </div>

          <div class="exam-dates">
            <div><strong>Starts:</strong> ${startDate}</div>
            <div><strong>Ends:</strong> ${endDate}</div>
          </div>

          ${canOpen ? 
            `<a class="primary" href="/pages/exam-guidelines.html?exam=${exam.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              View Rules &amp; Start
            </a>` : 
            `<button class="outline" disabled>Exam cannot be opened</button>`
          }
        </article>
      `;
    }).join('');

  } catch (error) {
    console.error(error);
    root.innerHTML = `
      <div class="empty-state">
        <p>An error occurred while loading available assessments.</p>
      </div>
    `;
  }
})();

function escapeHtml(value) {
  if (!value) return '';
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}