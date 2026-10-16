// PlacementPro - Study Materials Client Logic
const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

const iconSvgMap = {
  database: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
  cpu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"></path></svg>',
  network: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="6" height="6" x="16" y="16" rx="1"></rect><rect width="6" height="6" x="2" y="16" rx="1"></rect><rect width="6" height="6" x="9" y="2" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"></path></svg>',
  code: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
  layers: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>',
  book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'
};

function getSubjectIcon(iconKey) {
  if (!iconKey) return iconSvgMap.book;
  const key = String(iconKey).toLowerCase();
  return iconSvgMap[key] || iconSvgMap.book;
}

let allSubjects = [];
let activeCategory = 'All';

async function fetchStudyDashboard() {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. Fetch Student Overview Stats
  if (token) {
    try {
      const statsRes = await fetch('/api/study/stats', { headers });
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        document.getElementById('statTopicsCompleted').textContent = statsData.stats.completedTopics;
        document.getElementById('statBookmarksCount').textContent = statsData.stats.bookmarkedTopics;
        document.getElementById('statTotalTopics').textContent = statsData.stats.totalTopicsAvailable;
        document.getElementById('statOverallProgress').textContent = `${statsData.stats.overallProgress}%`;
      }

      // 2. Fetch Recently Viewed
      const recentRes = await fetch('/api/study/recently-viewed?limit=4', { headers });
      const recentData = await recentRes.json();
      if (recentData.success && recentData.recent && recentData.recent.length > 0) {
        const recentSec = document.getElementById('recentTopicsSection');
        const recentList = document.getElementById('recentTopicsList');
        recentSec.style.display = 'block';
        recentList.innerHTML = recentData.recent.map(r => `
          <a href="/study-reader?subject=${encodeURIComponent(r.subject_code)}&topic=${encodeURIComponent(r.topic_slug)}" class="recent-card">
            <span class="subject-code-tag" style="background:${escapeHtml(r.subject_color || '#2563eb')}20; color:${escapeHtml(r.subject_color || '#2563eb')}">
              ${escapeHtml(r.subject_name)}
            </span>
            <h4 class="recent-topic-title">${escapeHtml(r.topic_title)}</h4>
            <span class="recent-sub-text">
              ${r.is_completed ? '<span style="color:var(--study-success); font-weight:600;">Completed</span>' : `${r.progress_percent}% read`} • ${r.estimated_reading_minutes || 5} min
            </span>
          </a>
        `).join('');
      }

      // 3. Fetch Bookmarks
      const bmRes = await fetch('/api/study/bookmarks', { headers });
      const bmData = await bmRes.json();
      if (bmData.success && bmData.bookmarks && bmData.bookmarks.length > 0) {
        const bmSec = document.getElementById('bookmarksSection');
        const bmList = document.getElementById('bookmarksList');
        bmSec.style.display = 'block';
        bmList.innerHTML = bmData.bookmarks.slice(0, 4).map(b => `
          <a href="/study-reader?subject=${encodeURIComponent(b.subject_code)}&topic=${encodeURIComponent(b.topic_slug)}" class="recent-card">
            <span class="subject-code-tag" style="background:${escapeHtml(b.subject_color || '#2563eb')}20; color:${escapeHtml(b.subject_color || '#2563eb')}">
              ${escapeHtml(b.subject_name)}
            </span>
            <h4 class="recent-topic-title">${escapeHtml(b.topic_title)}</h4>
            <span class="recent-sub-text">Bookmarked • ${b.estimated_reading_minutes || 5} min</span>
          </a>
        `).join('');
      }
    } catch (e) {
      console.warn('Could not load student stats:', e);
    }
  }

  // 4. Fetch Subjects Catalog
  try {
    const res = await fetch('/api/study/subjects', { headers });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load subjects');

    allSubjects = data.subjects || [];
    renderSubjects();
  } catch (error) {
    console.error('Error fetching study subjects:', error);
    document.getElementById('subjectsGrid').innerHTML = `
      <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: #ef4444;">
        Failed to load study materials. <button onclick="fetchStudyDashboard()" style="margin-left: 8px; text-decoration: underline; background: none; border: none; color: inherit; cursor: pointer;">Retry</button>
      </div>
    `;
  }
}

function renderSubjects() {
  const container = document.getElementById('subjectsGrid');
  const search = document.getElementById('subjectSearchInput').value.trim().toLowerCase();

  let filtered = allSubjects.filter(sub => {
    const matchesCat = activeCategory === 'All' || sub.category === activeCategory;
    const matchesSearch = !search ||
      sub.name.toLowerCase().includes(search) ||
      sub.code.toLowerCase().includes(search) ||
      (sub.description && sub.description.toLowerCase().includes(search));
    return matchesCat && matchesSearch;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--study-text-muted);">
        <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px;">No subjects found matching your criteria</p>
        <p style="font-size: 0.875rem;">Try adjusting your search query or switching categories.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(sub => {
    const color = sub.color || '#2563eb';
    const progress = Number(sub.progress_percent || 0);
    const hasProgress = sub.completed_topics > 0;
    const ctaLabel = hasProgress ? 'Continue Reading &rarr;' : 'Start Reading &rarr;';

    return `
      <a href="/study-reader?subject=${encodeURIComponent(sub.code)}" class="subject-card">
        <div class="subject-card-header">
          <div class="subject-icon-box" style="background: ${escapeHtml(color)}18; color: ${escapeHtml(color)}; border-color: ${escapeHtml(color)}35;">
            ${getSubjectIcon(sub.icon)}
          </div>
          <div class="subject-title-area">
            <span class="subject-code-tag">${escapeHtml(sub.category || 'Core CS')}</span>
            <h3 class="subject-name">${escapeHtml(sub.name)}</h3>
          </div>
        </div>

        <p class="subject-desc">${escapeHtml(sub.description || 'Master key concepts, algorithms, theory, and interview fundamentals.')}</p>

        <div class="subject-meta-row">
          <span class="subject-meta-item">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            ${sub.chapter_count} Chapters
          </span>
          <span class="subject-meta-item">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${sub.topic_count} Topics
          </span>
          ${sub.attachment_count > 0 ? `
            <span class="subject-meta-item" style="color: #10b981;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              ${sub.attachment_count} Notes
            </span>
          ` : ''}
        </div>

        <div class="subject-progress-container">
          <div class="progress-label-line">
            <span>Reading Progress</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${progress}%; background: ${escapeHtml(color)};"></div>
          </div>
          <div style="margin-top: 14px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; font-weight: 700;">
            ${sub.code === 'compiler-design' ? `
              <span onclick="event.preventDefault(); window.location.href='/compiler-practice?subject=compiler-design';" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer;">
                ⚡ Practice (C-Visualize)
              </span>
            ` : '<span></span>'}
            <span style="color: ${escapeHtml(color)};">
              ${ctaLabel}
            </span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

// Live Search with Debounce for specific topic concepts
let searchTimeout = null;
async function performLiveSearch(query) {
  const resultsCard = document.getElementById('liveSearchResults');
  const resultsList = document.getElementById('searchResultsList');

  if (!query || query.length < 2) {
    resultsCard.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(`/api/study/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success && data.results && data.results.length > 0) {
      resultsCard.style.display = 'block';
      document.getElementById('searchResultsHeading').textContent = `Matching Topics & Concepts (${data.results.length})`;
      resultsList.innerHTML = data.results.map(r => `
        <a href="/study-reader?subject=${encodeURIComponent(r.subject_code)}&topic=${encodeURIComponent(r.slug)}" class="recent-card">
          <span class="subject-code-tag" style="background:${escapeHtml(r.subject_color || '#2563eb')}20; color:${escapeHtml(r.subject_color || '#2563eb')}">
            ${escapeHtml(r.subject_name)} &bull; ${escapeHtml(r.chapter_title)}
          </span>
          <h4 class="recent-topic-title">${escapeHtml(r.title)}</h4>
          <span class="recent-sub-text">${escapeHtml(r.summary || 'Detailed theory, architecture, and examples')}</span>
        </a>
      `).join('');
    } else {
      resultsCard.style.display = 'none';
    }
  } catch (e) {
    console.error('Search error:', e);
  }
}

// Profile & Theme Setup
function setupProfileAndTheme() {
  const themeToggle = document.getElementById('themeToggleBtn');
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  const profileTrigger = document.getElementById('profileTrigger');
  const profileMenu = document.getElementById('profileMenu');
  const profileContainer = document.getElementById('profileDropdownContainer');

  profileTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu?.classList.toggle('show');
    profileMenu?.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (profileContainer && !profileContainer.contains(e.target)) {
      profileMenu?.classList.remove('show', 'active');
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  });

  // Load student profile details
  if (token) {
    fetch('/api/student/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.data || res.student) {
          const user = res.data || res.student;
          const name = user.full_name || user.fullName || user.name || 'Student';
          const email = user.email || '';
          const initials = name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
          const elName = document.getElementById('navUserName');
          const elAvatar = document.getElementById('navAvatar');
          const elMenuName = document.getElementById('menuUserName');
          const elMenuEmail = document.getElementById('menuUserEmail');
          if (elName) elName.textContent = name;
          if (elAvatar) elAvatar.textContent = initials;
          if (elMenuName) elMenuName.textContent = name;
          if (elMenuEmail) elMenuEmail.textContent = email;
        }
      })
      .catch(() => {});
  }
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupProfileAndTheme();
  fetchStudyDashboard();

  // Category filter chips
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category;
      renderSubjects();
    });
  });

  // Search input handler
  const searchInput = document.getElementById('subjectSearchInput');
  searchInput?.addEventListener('input', (e) => {
    renderSubjects();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performLiveSearch(e.target.value.trim());
    }, 250);
  });
});
