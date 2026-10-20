function adminPage(path) {
  window.location.assign(path);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function applyPreset(presetKey) {
  const textarea = document.getElementById('aiPromptInput');
  if (!textarea) return;
  const presets = {
    tcs: 'TCS NQT practice syllabus: Numerical Ability, Verbal Ability, Reasoning, and Hands-on Coding questions on Arrays, HashMaps, and Strings.',
    persistent: 'Persistent Systems Core CS: Operating Systems, Multi-threading, DBMS Indexing, and System Design practice questions.',
    infosys: 'Infosys Aptitude & DSE: Pseudocode debugging, Dynamic Programming, and SQL Join problem sets.'
  };
  textarea.value = presets[presetKey] || '';
}

function loadAdminProfile() {
  try {
    const stored = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    const admin = stored ? JSON.parse(stored) : token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : {};
    const name = admin.name || admin.fullName || 'Administrator';
    const role = admin.designation || 'Placement Admin / Faculty';

    [['navAdminName', name], ['navAdminRole', role], ['welcomeHeroHeading', `Welcome back, ${name}`]].forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    const initials = name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'AD';
    const avatarEl = document.getElementById('navAvatarInitials');
    if (avatarEl) avatarEl.textContent = initials;
  } catch (error) {
    console.error('Unable to load admin profile:', error);
  }
}

async function loadIntelligenceStats() {
  const token = localStorage.getItem('adminToken');
  if (!token) return;
  try {
    const res = await fetch('/api/admin/intelligence-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch intelligence stats');
    const data = await res.json();
    if (!data.success || !data.stats) return;

    const stats = data.stats;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Practice Assessments metric
    const assessmentsCount = stats.activeAssessmentsCount ?? stats.activeDrivesCount ?? 0;
    setVal('adminStatAssessments', assessmentsCount);
    setVal('adminStatAssessmentsMeta', `${assessmentsCount} Active Tests & Rounds`);
    setVal('adminStatActiveDrives', assessmentsCount);
    setVal('adminStatDrivesMeta', `${stats.totalPracticeAttempts ?? stats.totalRegistrations ?? 0} Student Practice Attempts`);

    // Question Bank Items metric
    const questionsCount = stats.totalQuestionsCount ?? stats.pendingAlerts ?? 0;
    setVal('adminStatQuestions', questionsCount);
    setVal('adminStatQuestionsMeta', `${questionsCount} Questions in Bank`);
    setVal('adminStatMarketAlerts', questionsCount);
    setVal('adminStatAlertsMeta', `${questionsCount} Questions in Bank`);

    // RAG Knowledge Chunks metric
    setVal('adminStatRagChunks', stats.ragChunks ?? 0);
    setVal('adminStatRagMeta', stats.ragChunks > 0 ? 'Active Study Knowledge Base' : 'No ingested chunks');

    // Average Readiness Score metric
    const avgScore = stats.avgReadiness ?? 0;
    setVal('adminStatAvgReadiness', `${avgScore}%`);
    setVal('adminStatBatchMeta', avgScore > 0 ? `${stats.totalPracticeAttempts ?? 0} Student Attempts Evaluated` : 'Pending Student Attempts');
    setVal('heroAvgReadinessText', `${avgScore > 0 ? avgScore : '88.5'}% Benchmark`);

    // Render Company-Pattern Practice Tracks
    const tracksContainer = document.getElementById('adminTracksList') || document.getElementById('adminDrivesList');
    const tracks = stats.tracks || stats.drives || [];

    if (tracksContainer) {
      if (!Array.isArray(tracks) || tracks.length === 0) {
        tracksContainer.innerHTML = `
          <div style="padding: 32px; text-align: center; color: var(--text-muted, #64748b);">
            No company practice modules currently configured.
          </div>
        `;
      } else {
        const colorClasses = ['blue', 'orange', 'indigo', 'green', 'purple'];
        tracksContainer.innerHTML = tracks.map((t, idx) => {
          const colorClass = colorClasses[idx % colorClasses.length];
          return `
            <div class="drive-item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-color, #f1f5f9);">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div class="drive-icon-box ${colorClass}" style="width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem;">
                        <span>${escapeHtml(t.shortName)}</span>
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="font-size: 0.95rem; color: var(--text-primary, #0f172a);">${escapeHtml(t.name)}</strong>
                            <span class="status-tag" style="background: rgba(59, 130, 246, 0.1); color: #2563eb; font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 4px;">PRACTICE TRACK</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted, #64748b); margin-top: 2px;">${escapeHtml(t.overview || `Preparation modules for ${t.name} test patterns`)}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary, #0f172a);">${t.roundsCount} Practice Rounds</div>
                    <a href="/admin-exams" style="font-size: 0.78rem; color: #2563eb; text-decoration: none; font-weight: 600;">Manage Content &rarr;</a>
                </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error loading intelligence stats:', err);
    const container = document.getElementById('adminTracksList') || document.getElementById('adminDrivesList');
    if (container) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #ef4444; font-size: 0.875rem;">
          Failed to load practice tracks from database. <button onclick="loadIntelligenceStats()" style="margin-left: 8px; text-decoration: underline; background: none; border: none; color: inherit; cursor: pointer;">Retry</button>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return window.location.replace('/admin-login');

  loadAdminProfile();
  loadIntelligenceStats();

  const themeToggle = document.getElementById('themeToggle');
  const updateThemeIcon = () => {
    const dark = document.body.classList.contains('dark-mode');
    if (!themeToggle) return;
    themeToggle.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>';
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    themeToggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  };
  updateThemeIcon();
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    updateThemeIcon();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.replace('/admin-login');
  });

  document.getElementById('manageDrivesBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    adminPage('/admin-exams');
  });

  document.getElementById('runIngestionBtn')?.addEventListener('click', async () => {
    const promptInput = document.getElementById('aiPromptInput');
    const prompt = promptInput?.value.trim();
    if (!prompt) return alert('Enter or choose a practice prompt first.');
    const btn = document.getElementById('runIngestionBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Ingesting Practice Content...';
    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, drive: document.getElementById('ingestionDriveSelect')?.value })
      });
      const data = await res.json();
      if (data.success) {
        alert(`AI Ingestion completed! Added ${data.chunksAdded} practice chunk(s) to RAG Store.`);
        if (promptInput) promptInput.value = '';
        loadIntelligenceStats();
      } else {
        alert(data.message || 'Unable to run AI ingestion.');
      }
    } catch {
      alert('Unable to run AI ingestion.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const links = [...document.querySelectorAll('.subnav-bar a.subnav-item')];
  const activate = () => {
    const target = window.location.hash || '#command-center';
    links.forEach(link => {
      const active = link.getAttribute('href') === target;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  activate();
  window.addEventListener('hashchange', activate);
});
