const token = localStorage.getItem('token');
if (!token) window.location.replace('/login');

const api = (path, options = {}) => fetch(path, {
  ...options,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
});

const assignmentList = document.getElementById('assignmentList');
const historyList = document.getElementById('historyList');

document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
document.getElementById('startLiveAiBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('startLiveAiBtn');
  btn.disabled = true;
  btn.textContent = 'Launching AI Interview Room...';
  try {
    const res = await api('/api/interviews/ai/default-assignment');
    const data = await res.json();
    if (data.assignmentId) {
      window.location.href = `/pages/interview-room.html?assignment=${encodeURIComponent(data.assignmentId)}&ai=true`;
    } else {
      throw new Error('Unable to launch interview assignment.');
    }
  } catch (err) {
    alert(err.message || 'Unable to start AI interview.');
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start AI HR Interview Now';
  }
});

async function loadDashboard() {
  assignmentList.innerHTML = '<div class="item">Loading assigned interviews...</div>';
  historyList.innerHTML = '<div class="item">Loading history...</div>';
  try {
    const response = await api('/api/interviews/student');
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load interviews.');
    renderAssignments(data.assignments || []);
    renderHistory(data.history || []);
  } catch (error) {
    assignmentList.innerHTML = `<div class="status error">${escapeHtml(error.message)}</div>`;
    historyList.innerHTML = '<div class="item">History unavailable.</div>';
  }
}

function renderAssignments(assignments) {
  const open = assignments.filter(item => item.availability === 'available');
  document.getElementById('assignedCount').textContent = open.length;
  const next = open.map(item => item.deadline).filter(Boolean).sort()[0];
  document.getElementById('deadlineText').textContent = next ? new Date(next).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'None';
  if (!assignments.length) {
    assignmentList.innerHTML = '<div class="item">No interviews assigned yet.</div>';
    return;
  }
  assignmentList.innerHTML = assignments.map(item => {
    const canOpen = item.availability === 'available';
    const deadline = item.deadline ? new Date(item.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline';
    return `
      <article class="item">
        <div class="item-head">
          <div>
            <span class="pill ${canOpen ? 'green' : item.availability === 'expired' ? 'red' : 'orange'}">${escapeHtml(item.availability.toUpperCase())}</span>
            <h3 style="margin-top:8px">${escapeHtml(item.title)}</h3>
            <p class="subtitle">${escapeHtml(item.description || 'Mock interview practice')}</p>
          </div>
          <a class="btn primary ${canOpen ? '' : 'hidden'}" href="/pages/interview-room.html?assignment=${encodeURIComponent(item.assignment_id)}">Enter Room</a>
        </div>
        <div class="meta">
          <span>${escapeHtml(labelCategory(item.category))}</span>
          <span>${item.question_count || 0} questions</span>
          <span>${item.attempts_used || 0}/${item.max_attempts} attempts used</span>
          <span>Deadline: ${escapeHtml(deadline)}</span>
        </div>
      </article>`;
  }).join('');
}

function renderHistory(history) {
  document.getElementById('submittedCount').textContent = history.filter(item => item.state !== 'started').length;
  if (!history.length) {
    historyList.innerHTML = '<div class="item">No interview attempts yet.</div>';
    return;
  }
  historyList.innerHTML = history.map(item => `
    <article class="item">
      <div class="item-head">
        <div>
          <span class="pill ${item.state === 'reviewed' ? 'green' : 'orange'}">${escapeHtml(item.state.toUpperCase())}</span>
          <h3 style="margin-top:8px">${escapeHtml(item.title)}</h3>
        </div>
        <strong>${item.total_score ?? '-'} / ${item.max_score ?? '-'}</strong>
      </div>
      <div class="meta">
        <span>${escapeHtml(labelCategory(item.category))}</span>
        <span>Started ${new Date(item.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
        <span>${item.submitted_at ? `Submitted ${new Date(item.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : 'In progress'}</span>
      </div>
    </article>
  `).join('');
}

function labelCategory(value) {
  return ({ hr: 'HR', technical: 'Technical', behavioral: 'Behavioral', company: 'Company-Specific' })[value] || 'Interview';
}
function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

loadDashboard();
