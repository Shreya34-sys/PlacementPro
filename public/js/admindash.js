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
    tcs: 'TCS 2026 exam benchmarks: Added 15% more questions on Data Structures, Intermediate Memory Optimization, and TAC Verification.',
    persistent: 'Persistent Systems SPE Syllabus: Focus on Operating Systems, Multi-threading, DBMS Indexing, and System Design basics.',
    infosys: 'Infosys DSE Syllabus: High emphasis on Pseudocode debugging, Dynamic Programming, and SQL Join queries.'
  };
  textarea.value = presets[presetKey] || '';
}

function approveAlert(alertId) {
  const el = document.getElementById(alertId);
  if (el) {
    el.remove();
    alert('AI recommendation approved.');
  }
}

function rejectAlert(alertId) {
  document.getElementById(alertId)?.remove();
}

function loadAdminProfile() {
  try {
    const stored = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    const admin = stored ? JSON.parse(stored) : token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : {};
    const name = admin.name || admin.fullName || 'Admin';
    const role = admin.designation || 'Placement Officer';

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

    setVal('adminStatActiveDrives', stats.activeDrivesCount);
    setVal('adminStatDrivesMeta', `${stats.totalRegistrations} student registrations`);
    setVal('adminStatMarketAlerts', stats.pendingAlerts);
    setVal('adminStatAlertsMeta', stats.pendingAlerts > 0 ? 'Requires attention' : 'All synced');
    setVal('adminStatRagChunks', stats.ragChunks);
    setVal('adminStatRagMeta', stats.ragChunks > 0 ? 'Active knowledge base' : 'No ingested chunks');
    setVal('adminStatAvgReadiness', `${stats.avgReadiness}%`);
    setVal('adminStatBatchMeta', stats.avgReadiness > 0 ? 'Evaluated from tests & interviews' : 'Pending batch evaluations');

    const drivesList = document.getElementById('adminDrivesList');
    if (drivesList) {
      if (!Array.isArray(stats.drives) || stats.drives.length === 0) {
        drivesList.innerHTML = `
          <div style="padding: 32px; text-align: center; color: var(--text-muted, #64748b);">
            No campus placement drives currently registered in database.
          </div>
        `;
      } else {
        const colorClasses = ['blue', 'orange', 'indigo', 'green', 'purple'];
        drivesList.innerHTML = stats.drives.map((d, idx) => {
          const colorClass = colorClasses[idx % colorClasses.length];
          return `
            <div class="drive-item-row">
                <div class="drive-icon-box ${colorClass}">
                    <span>${escapeHtml(d.shortName)}</span>
                </div>
                <div class="drive-details">
                    <div class="drive-title-line">
                        <span class="company-name">${escapeHtml(d.name)}</span>
                        <span class="status-tag active">ACTIVE</span>
                    </div>
                    <div class="drive-sub">${escapeHtml(d.overview || 'Campus Placement Drive 2026')}</div>
                    <div class="drive-eligibility">Eligibility: Min CGPA ${d.minCgpa} | ${escapeHtml(d.branches)}</div>
                </div>
                <div class="drive-stats-right">
                    <span class="reg-count">${d.registeredCount} <small>registered</small></span>
                    <span class="eval-rounds">${d.roundsCount} Evaluated Rounds</span>
                </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error loading intelligence stats:', err);
    const drivesList = document.getElementById('adminDrivesList');
    if (drivesList) {
      drivesList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #ef4444; font-size: 0.875rem;">
          Failed to load placement drives from database. <button onclick="loadIntelligenceStats()" style="margin-left: 8px; text-decoration: underline; background: none; border: none; color: inherit; cursor: pointer;">Retry</button>
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

  document.getElementById('manageDrivesBtn')?.addEventListener('click', () => adminPage('/pages/admin-exams.html'));
  document.getElementById('createExamBtn')?.addEventListener('click', () => adminPage('/pages/admin-exam-builder.html'));
  document.getElementById('openProctoringBtn')?.addEventListener('click', () => adminPage('/pages/proctoring.html'));
  document.getElementById('openMarketStoreBtn')?.addEventListener('click', () => {
    const rag = document.getElementById('rag-market-ai');
    if (rag) {
      rag.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('aiPromptInput')?.focus();
    }
  });

  document.getElementById('runIngestionBtn')?.addEventListener('click', async () => {
    const promptInput = document.getElementById('aiPromptInput');
    const prompt = promptInput?.value.trim();
    if (!prompt) return alert('Enter or choose a prompt first.');
    const btn = document.getElementById('runIngestionBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Ingesting & Syncing...';
    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, drive: document.getElementById('ingestionDriveSelect')?.value })
      });
      const data = await res.json();
      if (data.success) {
        alert(`AI Ingestion completed! Added ${data.chunksAdded} chunk(s) to RAG Store.`);
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
