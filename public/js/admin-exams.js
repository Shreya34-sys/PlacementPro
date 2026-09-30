// (async () => {
//   const token = localStorage.getItem('adminToken');
//   if (!token) return location.replace('/admin-login');
//   const root = document.querySelector('#testList');
//   const response = await fetch('/api/exams/admin', { headers: { Authorization: `Bearer ${token}` } });
//   if (!response.ok) { root.textContent = 'Unable to load tests.'; return; }
//   const exams = await response.json();
//  root.innerHTML = exams.map(exam => `<article class="card exam-card"><span class="pill ${exam.display_status === 'published' ? 'blue' : ''}">${exam.display_status.toUpperCase()}</span><h2>${escapeHtml(exam.title)}</h2><p>${exam.question_count} questions · ${exam.duration_minutes} minutes</p><p>${new Date(exam.starts_at).toLocaleString()} – ${new Date(exam.ends_at).toLocaleString()}</p><a class="outline" style="display:inline-block;width:auto;text-decoration:none" href="/pages/proctoring.html?exam=${encodeURIComponent(exam.id)}">Open Proctoring</a> <button class="outline delete-exam" data-exam-id="${exam.id}">Delete test</button></article>`).join('') || '<p>No aptitude tests created yet.</p>';
//   root.querySelectorAll('.delete-exam').forEach(button => button.onclick = async () => { if (!confirm('Delete this test? Students will no longer be able to open it.')) return; const result = await fetch(`/api/exams/${button.dataset.examId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!result.ok) return alert('Could not delete test.'); location.reload(); });
// })();
// function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }


(async () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return location.replace('/admin-login');

  const root = document.querySelector('#testList');

  try {
    const response = await fetch('/api/exams/admin', { 
      headers: { Authorization: `Bearer ${token}` } 
    });

    if (!response.ok) { 
      root.innerHTML = '<div class="empty-state"><p>Unable to load tests from server.</p></div>'; 
      return; 
    }

    const exams = await response.json();

    if (!exams || exams.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <h3>No aptitude tests created yet</h3>
          <p>Click "Create Aptitude Test" above to build your first assessment.</p>
        </div>
      `;
      return;
    }

    root.innerHTML = exams.map(exam => {
      const isPublished = exam.display_status === 'published';
      const statusClass = isPublished ? 'blue' : '';
      const startDate = new Date(exam.starts_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const endDate = new Date(exam.ends_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

      return `
        <article class="card exam-card">
          <span class="pill ${statusClass}">${escapeHtml(exam.display_status.toUpperCase())}</span>
          <h2>${escapeHtml(exam.title)}</h2>
          
          <div class="exam-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${exam.question_count} questions · ${exam.duration_minutes} mins</span>
          </div>

          <div class="exam-dates">
            <div><strong>Start:</strong> ${startDate}</div>
            <div><strong>End:</strong> ${endDate}</div>
          </div>

          <div class="exam-card-actions">
            <a class="outline action-link" href="/pages/proctoring.html?exam=${encodeURIComponent(exam.id)}">
              Open Proctoring
            </a>
            <button class="delete-exam" data-exam-id="${exam.id}">
              Delete
            </button>
          </div>
        </article>
      `;
    }).join('');

    root.querySelectorAll('.delete-exam').forEach(button => {
      button.onclick = async () => {
        if (!confirm('Delete this test? Students will no longer be able to open it.')) return;
        const result = await fetch(`/api/exams/${button.dataset.examId}`, { 
          method: 'DELETE', 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!result.ok) return alert('Could not delete test.');
        location.reload();
      };
    });

  } catch (error) {
    console.error(error);
    root.innerHTML = '<div class="empty-state"><p>An error occurred while loading tests.</p></div>';
  }
})();

function escapeHtml(value) {
  if (!value) return '';
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}