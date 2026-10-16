/**
 * PlacementPro - Faculty Study Materials Studio Client JS
 * Handles curriculum management, rich-text topic authoring, note uploads, and publishing.
 */

(function () {
  'use strict';

  // --- Auth & State ---
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (!token) {
    window.location.replace('/admin-login');
    return;
  }

  const state = {
    subjects: [],
    chaptersMap: {}, // subjectId -> chapters[]
    attachments: [],
    editingTopicId: null,
    editingSubjectId: null,
    editingChapterId: null,
    pendingDeleteAction: null
  };

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
    if (iconSvgMap[String(iconKey).toLowerCase()]) return iconSvgMap[String(iconKey).toLowerCase()];
    return escapeHtml(iconKey);
  }

  // Helper for API calls
  async function apiFetch(endpoint, options = {}) {
    const headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(endpoint, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const toastIcons = {
      info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      success: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      error: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    const icon = toastIcons[type] || toastIcons.info;

    toast.innerHTML = `<span style="display:inline-flex; align-items:center;">${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- User Profile & Theme Setup ---
  function initUserAndTheme() {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const name = payload.name || payload.email?.split('@')[0] || 'Faculty Member';
        const role = payload.role === 'admin' ? 'Placement Admin' : 'CSBS Faculty Lead';

        const nameEl = document.getElementById('navFacultyName');
        const roleEl = document.getElementById('navFacultyRole');
        const initialsEl = document.getElementById('navAvatarInitials');

        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = role;
        if (initialsEl) {
          const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          initialsEl.textContent = initials || 'FC';
        }
      }
    } catch (e) {
      console.warn('Could not parse auth payload:', e);
    }

    // Theme toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
      if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
      }
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        window.location.replace('/admin-login');
      });
    }
  }

  // --- Tab Navigation ---
  function initTabs() {
    const tabBtns = document.querySelectorAll('.studio-tab-btn');
    const tabPanels = document.querySelectorAll('.studio-tab-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const panel = document.getElementById(targetId);
        if (panel) panel.classList.add('active');
      });
    });

    const openTopicTabBtn = document.getElementById('openNewTopicTabBtn');
    if (openTopicTabBtn) {
      openTopicTabBtn.addEventListener('click', () => {
        const editorTabBtn = document.querySelector('.studio-tab-btn[data-tab="tab-editor"]');
        if (editorTabBtn) editorTabBtn.click();
      });
    }
  }

  // --- Load Studio Overview ---
  async function loadStudioOverview() {
    try {
      const data = await apiFetch('/api/study/admin/overview');
      if (!data.success || !data.overview) return;

      const { totalSubjects, totalChapters, totalTopics, totalAttachments, subjects, attachments } = data.overview;

      state.subjects = subjects || [];
      state.attachments = attachments || [];

      // Update KPI counters
      document.getElementById('kpiTotalSubjects').textContent = totalSubjects || 0;
      document.getElementById('kpiTotalChapters').textContent = totalChapters || 0;
      document.getElementById('kpiTotalTopics').textContent = totalTopics || 0;
      document.getElementById('kpiTotalAttachments').textContent = totalAttachments || 0;

      document.getElementById('badgeSubjectsCount').textContent = totalSubjects || 0;
      document.getElementById('badgeNotesCount').textContent = totalAttachments || 0;

      renderCurriculumTree();
      renderAttachmentsTable();
      populateSubjectDropdowns();
    } catch (err) {
      console.error('Failed to load studio overview:', err);
      showToast('Error loading studio data: ' + err.message, 'error');
    }
  }

  // --- Render Curriculum Tree ---
  function renderCurriculumTree() {
    const container = document.getElementById('subjectsHierarchyContainer');
    if (!container) return;

    const searchTerm = (document.getElementById('curriculumSearchInput')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('curriculumCategoryFilter')?.value || 'All';
    const statusFilter = document.getElementById('curriculumStatusFilter')?.value || 'All';

    let filtered = state.subjects.filter(s => {
      const matchSearch = !searchTerm ||
        s.name.toLowerCase().includes(searchTerm) ||
        (s.code && s.code.toLowerCase().includes(searchTerm)) ||
        (s.description && s.description.toLowerCase().includes(searchTerm));
      const matchCategory = categoryFilter === 'All' || s.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding: 48px; text-align: center; color: var(--studio-text-muted); background: var(--studio-card-bg); border-radius: 6px; border: 1px solid var(--studio-border);">
          <div style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--studio-text-muted);">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <h4 style="font-weight: 700; color: var(--studio-text); margin-bottom: 4px;">No matching subjects found</h4>
          <p style="font-size: 0.88rem;">Try adjusting your search criteria or click "+ Add Subject" to create one.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(subject => {
      const statusClass = subject.status === 'published' ? 'badge-published' : 'badge-draft';
      const statusText = subject.status === 'published' ? 'Published' : 'Draft';

      return `
        <div class="subject-card" data-subject-id="${subject.id}" id="subjectCard_${subject.id}">
          <div class="subject-header" onclick="window.StudioApp.toggleSubject('${subject.id}')">
            <div class="subject-header-left">
              <div class="subject-icon-box" style="background: ${subject.color || '#2563eb'}18; color: ${subject.color || '#2563eb'};">
                ${getSubjectIcon(subject.icon)}
              </div>
              <div class="subject-title-wrap">
                <h3>${escapeHtml(subject.name)} ${subject.code ? `<span style="font-size:0.8rem; font-weight:600; color:var(--studio-text-muted);">(${escapeHtml(subject.code)})</span>` : ''}</h3>
                <div class="subject-meta-tags">
                  <span class="badge-status ${statusClass}">${statusText}</span>
                  <span>•</span>
                  <span>${escapeHtml(subject.category || 'General')}</span>
                  <span>•</span>
                  <span>${subject.chapter_count || 0} Chapters</span>
                  <span>•</span>
                  <span>${subject.topic_count || 0} Topics</span>
                  <span>•</span>
                  <span>Order: ${subject.display_order || 0}</span>
                </div>
              </div>
            </div>

            <div class="subject-actions" onclick="event.stopPropagation()">
              <button type="button" class="action-btn-sm" onclick="window.StudioApp.openNewChapterModal('${subject.id}', '${escapeHtml(subject.name)}')">
                + Add Chapter
              </button>
              <button type="button" class="action-btn-sm" onclick="window.StudioApp.openEditSubjectModal('${subject.id}')">
                Edit
              </button>
              <button type="button" class="action-btn-sm action-btn-danger" onclick="window.StudioApp.confirmDeleteSubject('${subject.id}', '${escapeHtml(subject.name)}')">
                Delete
              </button>
              <span class="chevron" id="chevron_${subject.id}" style="display:inline-block; transition: transform 0.2s; font-size: 1.1rem; color: var(--studio-text-muted);">&rsaquo;</span>
            </div>
          </div>

          <div class="chapters-container" id="chaptersContainer_${subject.id}" style="display: none;">
            <div style="padding: 12px; text-align: center; color: var(--studio-text-muted); font-size: 0.85rem;">
              Click to load chapters...
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Expand / Collapse Subject & Fetch Chapters ---
  async function toggleSubject(subjectId) {
    const header = document.querySelector(`#subjectCard_${subjectId} .subject-header`);
    const container = document.getElementById(`chaptersContainer_${subjectId}`);
    const chevron = document.getElementById(`chevron_${subjectId}`);
    if (!container) return;

    if (container.style.display === 'block') {
      container.style.display = 'none';
      if (header) header.classList.remove('expanded');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
      return;
    }

    container.style.display = 'block';
    if (header) header.classList.add('expanded');
    if (chevron) chevron.style.transform = 'rotate(90deg)';

    // Load subject details
    try {
      container.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--studio-text-muted); font-size: 0.85rem;">Loading chapters & topics...</div>';
      const data = await apiFetch(`/api/study/subjects/${subjectId}`);
      if (!data.success || !data.subject) {
        container.innerHTML = '<div style="padding: 12px; color: var(--studio-danger); font-size: 0.85rem;">Failed to load chapters.</div>';
        return;
      }

      const chapters = data.subject.chapters || [];
      state.chaptersMap[subjectId] = chapters;

      if (chapters.length === 0) {
        container.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--studio-text-muted); font-size: 0.88rem;">
            No chapters added yet for this subject.
            <div style="margin-top: 8px;">
              <button type="button" class="action-btn-sm" onclick="window.StudioApp.openNewChapterModal('${subjectId}', '${escapeHtml(data.subject.name)}')">
                + Create First Chapter
              </button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = chapters.map(ch => {
        const chStatusClass = ch.status === 'published' ? 'badge-published' : 'badge-draft';
        const chStatusText = ch.status === 'published' ? 'Published' : 'Draft';
        const topics = ch.topics || [];

        return `
          <div class="chapter-item" id="chapterItem_${ch.id}">
            <div class="chapter-header" onclick="window.StudioApp.toggleChapterTopics('${ch.id}')">
              <div class="chapter-header-left">
                <span style="display:inline-flex; align-items:center; color: var(--studio-primary);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></span>
                <span class="chapter-title">${escapeHtml(ch.title)}</span>
                <span class="badge-status ${chStatusClass}">${chStatusText}</span>
                <span style="font-size: 0.75rem; color: var(--studio-text-muted);">(${topics.length} topics)</span>
              </div>
              <div class="chapter-actions" onclick="event.stopPropagation()">
                <button type="button" class="action-btn-sm" onclick="window.StudioApp.openNewTopicForChapter('${subjectId}', '${ch.id}')">
                  + Add Topic
                </button>
                <button type="button" class="action-btn-sm" onclick="window.StudioApp.openEditChapterModal('${ch.id}', '${subjectId}')">
                  Edit
                </button>
                <button type="button" class="action-btn-sm action-btn-danger" onclick="window.StudioApp.confirmDeleteChapter('${ch.id}', '${escapeHtml(ch.title)}')">
                  Delete
                </button>
              </div>
            </div>

            <div class="topics-list" id="topicsList_${ch.id}">
              ${topics.length === 0 ? `
                <div style="padding: 10px; text-align: center; color: var(--studio-text-muted); font-size: 0.82rem;">
                  No topics in this chapter yet. Click "+ Add Topic" to write one.
                </div>
              ` : topics.map(tp => {
                const tpStatusClass = tp.status === 'published' ? 'badge-published' : 'badge-draft';
                const tpStatusText = tp.status === 'published' ? 'Published' : 'Draft';
                return `
                  <div class="topic-row">
                    <div class="topic-row-left">
                      <span style="display:inline-flex; align-items:center; color: var(--studio-text-muted);"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span>
                      <div>
                        <div class="topic-title">${escapeHtml(tp.title)}</div>
                        <div class="topic-meta">
                          <span class="badge-status ${tpStatusClass}">${tpStatusText}</span>
                          <span>•</span>
                          <span>${tp.estimated_reading_minutes || 5} min read</span>
                          <span>•</span>
                          <span>Order: ${tp.display_order || 0}</span>
                          <span>•</span>
                          <span>Views: ${tp.views_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div class="topic-row-right" style="display: flex; gap: 6px;">
                      <a href="/study-reader?topic=${tp.slug || tp.id}" target="_blank" class="action-btn-sm" style="text-decoration:none;">
                        Preview &nearr;
                      </a>
                      <button type="button" class="action-btn-sm" onclick="window.StudioApp.editTopicInStudio('${tp.id}')">
                        Edit in Studio
                      </button>
                      <button type="button" class="action-btn-sm" onclick="window.StudioApp.toggleTopicPublish('${tp.id}', '${tp.status}')">
                        ${tp.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" class="action-btn-sm action-btn-danger" onclick="window.StudioApp.confirmDeleteTopic('${tp.id}', '${escapeHtml(tp.title)}')">
                        Delete
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('Failed to load chapters:', err);
      container.innerHTML = `<div style="padding: 12px; color: var(--studio-danger); font-size: 0.85rem;">Error loading chapters: ${escapeHtml(err.message)}</div>`;
    }
  }

  function toggleChapterTopics(chapterId) {
    const list = document.getElementById(`topicsList_${chapterId}`);
    if (list) {
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    }
  }

  // --- Populate Dropdowns for Subject / Chapter ---
  function populateSubjectDropdowns() {
    const topicSubjectSelect = document.getElementById('topicSubjectSelect');
    const attachSubjectSelect = document.getElementById('attachSubjectSelect');

    const optionsHtml = '<option value="">-- Choose Subject --</option>' +
      state.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${s.code || s.category || 'CS'})</option>`).join('');

    if (topicSubjectSelect) topicSubjectSelect.innerHTML = optionsHtml;
    if (attachSubjectSelect) attachSubjectSelect.innerHTML = optionsHtml;
  }

  // Handle changing subject in Topic Editor -> load Chapters
  async function handleSubjectChangeForTopic(subjectId, preselectedChapterId = null) {
    const chapterSelect = document.getElementById('topicChapterSelect');
    if (!chapterSelect) return;

    if (!subjectId) {
      chapterSelect.innerHTML = '<option value="">-- Choose Subject First --</option>';
      return;
    }

    try {
      chapterSelect.innerHTML = '<option value="">Loading chapters...</option>';
      const data = await apiFetch(`/api/study/subjects/${subjectId}`);
      const chapters = (data.success && data.subject?.chapters) || [];
      state.chaptersMap[subjectId] = chapters;

      if (chapters.length === 0) {
        chapterSelect.innerHTML = '<option value="">-- No chapters found (create one first) --</option>';
        return;
      }

      chapterSelect.innerHTML = '<option value="">-- Choose Chapter --</option>' +
        chapters.map(c => `<option value="${c.id}" ${preselectedChapterId === c.id ? 'selected' : ''}>${escapeHtml(c.title)}</option>`).join('');
    } catch (err) {
      chapterSelect.innerHTML = '<option value="">Failed to load chapters</option>';
      console.error(err);
    }
  }

  // Handle changing subject in Attachments Form -> load Topics
  async function handleSubjectChangeForAttachments(subjectId) {
    const topicSelect = document.getElementById('attachTopicSelect');
    if (!topicSelect) return;

    if (!subjectId) {
      topicSelect.innerHTML = '<option value="">-- Subject-wide Handout (No specific topic) --</option>';
      return;
    }

    try {
      const data = await apiFetch(`/api/study/subjects/${subjectId}`);
      const chapters = (data.success && data.subject?.chapters) || [];
      let allTopics = [];
      chapters.forEach(ch => {
        if (ch.topics) allTopics = allTopics.concat(ch.topics);
      });

      let options = '<option value="">-- Subject-wide Handout (No specific topic) --</option>';
      allTopics.forEach(tp => {
        options += `<option value="${tp.id}">${escapeHtml(tp.title)}</option>`;
      });
      topicSelect.innerHTML = options;
    } catch (err) {
      console.error(err);
    }
  }

  // --- Topic Editor Functions ---
  function initTopicEditor() {
    const subjectSelect = document.getElementById('topicSubjectSelect');
    const titleInput = document.getElementById('topicTitleInput');
    const slugInput = document.getElementById('topicSlugInput');
    const contentTextarea = document.getElementById('topicContentTextarea');
    const statusSelect = document.getElementById('topicStatusSelect');
    const readTimeInput = document.getElementById('topicReadTimeInput');
    const form = document.getElementById('topicEditorForm');

    // Subject change listener
    if (subjectSelect) {
      subjectSelect.addEventListener('change', (e) => {
        handleSubjectChangeForTopic(e.target.value);
        updateLivePreview();
      });
    }

    // Auto slug from title
    if (titleInput && slugInput) {
      titleInput.addEventListener('input', () => {
        if (!state.editingTopicId) {
          slugInput.value = titleInput.value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
        }
        updateLivePreview();
      });
    }

    if (contentTextarea) {
      contentTextarea.addEventListener('input', updateLivePreview);
    }
    if (readTimeInput) {
      readTimeInput.addEventListener('input', updateLivePreview);
    }
    if (statusSelect) {
      statusSelect.addEventListener('change', updateLivePreview);
    }

    // Toolbar actions
    const toolbarBtns = document.querySelectorAll('.toolbar-btn');
    toolbarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.getAttribute('data-format');
        insertFormatting(format);
      });
    });

    // Reset button
    const resetBtn = document.getElementById('btnResetTopicForm');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetTopicForm);
    }

    // Save as Draft button
    const draftBtn = document.getElementById('btnSaveTopicDraft');
    if (draftBtn) {
      draftBtn.addEventListener('click', () => {
        if (statusSelect) statusSelect.value = 'draft';
        if (form) form.requestSubmit();
      });
    }

    // Form submit
    if (form) {
      form.addEventListener('submit', handleTopicSubmit);
    }
  }

  function insertFormatting(format) {
    const textarea = document.getElementById('topicContentTextarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';

    switch (format) {
      case 'h2':
        replacement = `<h2>${selectedText || 'Section Heading'}</h2>\n`;
        break;
      case 'h3':
        replacement = `<h3>${selectedText || 'Sub-section Heading'}</h3>\n`;
        break;
      case 'bold':
        replacement = `<strong>${selectedText || 'Bold text'}</strong>`;
        break;
      case 'italic':
        replacement = `<em>${selectedText || 'Italic text'}</em>`;
        break;
      case 'ul':
        replacement = `<ul>\n  <li>${selectedText || 'Key point 1'}</li>\n  <li>Key point 2</li>\n</ul>\n`;
        break;
      case 'ol':
        replacement = `<ol>\n  <li>${selectedText || 'Step 1'}</li>\n  <li>Step 2</li>\n</ol>\n`;
        break;
      case 'def':
        replacement = `<div class="callout callout-def">\n  <strong>Definition:</strong> ${selectedText || 'A formal concise definition of this computer science concept.'}\n</div>\n`;
        break;
      case 'points':
        replacement = `<div class="callout callout-points">\n  <strong>Key Points to Remember:</strong>\n  <ul>\n    <li>${selectedText || 'Point 1: Core operational property'}</li>\n    <li>Point 2: Time and space considerations</li>\n  </ul>\n</div>\n`;
        break;
      case 'table':
        replacement = `<div class="table-responsive">\n  <table class="tutorial-table">\n    <thead>\n      <tr>\n        <th>Attribute / Dimension</th>\n        <th>Primary Approach</th>\n        <th>Alternative Approach</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>Time Complexity</td>\n        <td>O(1) Constant</td>\n        <td>O(log N) Logarithmic</td>\n      </tr>\n      <tr>\n        <td>Space Requirement</td>\n        <td>O(N) Allocated</td>\n        <td>O(1) In-place</td>\n      </tr>\n    </tbody>\n  </table>\n</div>\n`;
        break;
      case 'code':
        replacement = `<pre class="code-block"><button class="copy-btn">Copy</button><code>// Code or algorithm walkthrough\n${selectedText || 'public static void executeProcess() {\n    System.out.println("Executing algorithm...");\n}'}</code></pre>\n`;
        break;
      case 'link':
        const url = prompt('Enter link URL (e.g. https://...):', 'https://');
        if (url) {
          replacement = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText || 'Reference Link'}</a>`;
        } else {
          return;
        }
        break;
      case 'image':
        const imgUrl = prompt('Enter diagram/image URL:');
        if (imgUrl) {
          const caption = prompt('Enter diagram caption:') || 'Architectural Diagram';
          replacement = `<figure style="margin: 20px 0; text-align: center;">\n  <img src="${imgUrl}" alt="${caption}" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;">\n  <figcaption style="font-size: 0.85rem; color: #64748b; margin-top: 6px;">${caption}</figcaption>\n</figure>\n`;
        } else {
          return;
        }
        break;
      default:
        return;
    }

    textarea.setRangeText(replacement, start, end, 'end');
    textarea.focus();
    updateLivePreview();
  }

  function updateLivePreview() {
    const title = document.getElementById('topicTitleInput')?.value || 'Topic Title Preview';
    const readTime = document.getElementById('topicReadTimeInput')?.value || 5;
    const content = document.getElementById('topicContentTextarea')?.value || '<p style="color:var(--studio-text-muted);">Content will render here...</p>';
    const status = document.getElementById('topicStatusSelect')?.value || 'published';
    const subjectSelect = document.getElementById('topicSubjectSelect');
    const category = subjectSelect?.options[subjectSelect.selectedIndex]?.text || 'Core CS';

    const previewTitle = document.getElementById('previewTitle');
    const previewReadTime = document.getElementById('previewReadTime');
    const previewBody = document.getElementById('previewBody');
    const previewCategory = document.getElementById('previewCategory');
    const previewBadge = document.getElementById('previewStatusBadge');

    if (previewTitle) previewTitle.textContent = title;
    if (previewReadTime) previewReadTime.textContent = `${readTime} min read`;
    if (previewCategory) previewCategory.textContent = category;
    if (previewBody) previewBody.innerHTML = content;

    if (previewBadge) {
      if (status === 'published') {
        previewBadge.className = 'badge-status badge-published';
        previewBadge.textContent = 'Published';
      } else {
        previewBadge.className = 'badge-status badge-draft';
        previewBadge.textContent = 'Draft';
      }
    }
  }

  function resetTopicForm() {
    state.editingTopicId = null;
    document.getElementById('editTopicId').value = '';
    document.getElementById('editorHeading').textContent = 'Write New Theory Topic';
    document.getElementById('btnSaveTopicSubmit').textContent = 'Publish Topic';
    document.getElementById('topicEditorForm').reset();
    document.getElementById('topicSubjectSelect').value = '';
    document.getElementById('topicChapterSelect').innerHTML = '<option value="">-- Choose Subject First --</option>';
    document.getElementById('topicContentTextarea').value = '';
    const videoUrlEl = document.getElementById('topicVideoUrlInput');
    if (videoUrlEl) videoUrlEl.value = '';
    const videoSrcEl = document.getElementById('topicVideoSourceInput');
    if (videoSrcEl) videoSrcEl.value = '';
    const videoTitleEl = document.getElementById('topicVideoTitleInput');
    if (videoTitleEl) videoTitleEl.value = '';
    const videoObjEl = document.getElementById('topicVideoObjectiveInput');
    if (videoObjEl) videoObjEl.value = '';
    updateLivePreview();
  }

  async function editTopicInStudio(topicId) {
    try {
      showToast('Loading topic details...', 'info');
      const data = await apiFetch(`/api/study/topics/${topicId}`);
      if (!data.success || !data.topic) {
        showToast('Topic not found.', 'error');
        return;
      }

      const tp = data.topic;
      state.editingTopicId = tp.id;

      // Switch to Editor Tab
      const editorTabBtn = document.querySelector('.studio-tab-btn[data-tab="tab-editor"]');
      if (editorTabBtn) editorTabBtn.click();

      document.getElementById('editTopicId').value = tp.id;
      document.getElementById('editorHeading').textContent = `Edit Topic: ${tp.title}`;
      document.getElementById('btnSaveTopicSubmit').textContent = 'Update Topic';

      document.getElementById('topicSubjectSelect').value = tp.subject_id;
      await handleSubjectChangeForTopic(tp.subject_id, tp.chapter_id);

      document.getElementById('topicTitleInput').value = tp.title || '';
      document.getElementById('topicSlugInput').value = tp.slug || '';
      document.getElementById('topicReadTimeInput').value = tp.estimated_reading_minutes || 5;
      document.getElementById('topicOrderInput').value = tp.display_order || 0;
      document.getElementById('topicStatusSelect').value = tp.status || 'published';
      document.getElementById('topicSummaryInput').value = tp.summary || '';
      document.getElementById('topicContentTextarea').value = tp.content || '';

      const videoUrlEl = document.getElementById('topicVideoUrlInput');
      if (videoUrlEl) videoUrlEl.value = tp.video_url || '';
      const videoSrcEl = document.getElementById('topicVideoSourceInput');
      if (videoSrcEl) videoSrcEl.value = tp.video_source || '';
      const videoTitleEl = document.getElementById('topicVideoTitleInput');
      if (videoTitleEl) videoTitleEl.value = tp.video_title || '';
      const videoObjEl = document.getElementById('topicVideoObjectiveInput');
      if (videoObjEl) videoObjEl.value = tp.video_objective || '';

      updateLivePreview();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      showToast('Error editing topic: ' + err.message, 'error');
    }
  }

  async function openNewTopicForChapter(subjectId, chapterId) {
    resetTopicForm();
    const editorTabBtn = document.querySelector('.studio-tab-btn[data-tab="tab-editor"]');
    if (editorTabBtn) editorTabBtn.click();

    document.getElementById('topicSubjectSelect').value = subjectId;
    await handleSubjectChangeForTopic(subjectId, chapterId);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  async function handleTopicSubmit(e) {
    e.preventDefault();
    const subjectId = document.getElementById('topicSubjectSelect').value;
    const chapterId = document.getElementById('topicChapterSelect').value;
    const title = document.getElementById('topicTitleInput').value.trim();
    const slug = document.getElementById('topicSlugInput').value.trim();
    const readTime = Number(document.getElementById('topicReadTimeInput').value || 5);
    const displayOrder = Number(document.getElementById('topicOrderInput').value || 0);
    const status = document.getElementById('topicStatusSelect').value;
    const summary = document.getElementById('topicSummaryInput').value.trim();
    const content = document.getElementById('topicContentTextarea').value;

    const video_url = document.getElementById('topicVideoUrlInput')?.value.trim() || null;
    const video_source = document.getElementById('topicVideoSourceInput')?.value.trim() || null;
    const video_title = document.getElementById('topicVideoTitleInput')?.value.trim() || null;
    const video_objective = document.getElementById('topicVideoObjectiveInput')?.value.trim() || null;

    if (!subjectId || !chapterId || !title) {
      showToast('Subject, Chapter, and Title are required.', 'warning');
      return;
    }

    const payload = {
      subject_id: subjectId,
      chapter_id: chapterId,
      title,
      slug: slug || undefined,
      estimated_reading_minutes: readTime,
      display_order: displayOrder,
      status,
      summary,
      video_url,
      video_source,
      video_title,
      video_objective,
      content
    };

    try {
      const isEdit = Boolean(state.editingTopicId);
      const url = isEdit ? `/api/study/topics/${state.editingTopicId}` : '/api/study/topics';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.success) {
        showToast(isEdit ? 'Topic updated successfully!' : 'Topic created successfully!', 'success');
        resetTopicForm();
        loadStudioOverview();

        // Switch to curriculum tab
        const curriculumTabBtn = document.querySelector('.studio-tab-btn[data-tab="tab-curriculum"]');
        if (curriculumTabBtn) curriculumTabBtn.click();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save topic: ' + err.message, 'error');
    }
  }

  async function toggleTopicPublish(topicId, currentStatus) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await apiFetch(`/api/study/topics/${topicId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Topic is now ${newStatus}!`, 'success');
      loadStudioOverview();
    } catch (err) {
      showToast('Failed to change topic status: ' + err.message, 'error');
    }
  }

  // --- Attachments / Lecture Notes Management ---
  function initAttachments() {
    const attachSubjectSelect = document.getElementById('attachSubjectSelect');
    if (attachSubjectSelect) {
      attachSubjectSelect.addEventListener('change', (e) => {
        handleSubjectChangeForAttachments(e.target.value);
      });
    }

    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('notesFileInput');
    const fileLabel = document.getElementById('fileChosenLabel');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--studio-primary)';
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '';
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          updateFileNameLabel();
        }
      });

      fileInput.addEventListener('change', updateFileNameLabel);
    }

    function updateFileNameLabel() {
      if (fileInput.files.length > 0) {
        const f = fileInput.files[0];
        const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
        fileLabel.innerHTML = `Selected: <strong>${escapeHtml(f.name)}</strong> (${sizeMb} MB)`;
      } else {
        fileLabel.textContent = 'Click or Drag & Drop lecture notes file here';
      }
    }

    // Attachments Form submit
    const attachForm = document.getElementById('attachmentUploadForm');
    if (attachForm) {
      attachForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = document.getElementById('attachSubjectSelect').value;
        const topicId = document.getElementById('attachTopicSelect').value || null;
        const title = document.getElementById('attachTitleInput').value.trim();
        const description = document.getElementById('attachDescInput').value.trim();

        if (!subjectId || !title || !fileInput.files.length) {
          showToast('Subject, Title, and a Notes file are required.', 'warning');
          return;
        }

        const formData = new FormData();
        formData.append('notesFile', fileInput.files[0]);
        formData.append('subject_id', subjectId);
        if (topicId) formData.append('topic_id', topicId);
        formData.append('title', title);
        if (description) formData.append('description', description);

        const uploadBtn = document.getElementById('btnUploadAttachment');
        const origBtnText = uploadBtn.textContent;
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading notes...';

        try {
          const res = await apiFetch('/api/study/attachments', {
            method: 'POST',
            body: formData
          });

          if (res.success) {
            showToast('Lecture notes uploaded successfully!', 'success');
            attachForm.reset();
            fileLabel.textContent = 'Click or Drag & Drop lecture notes file here';
            loadStudioOverview();
          }
        } catch (err) {
          console.error(err);
          showToast('Upload failed: ' + err.message, 'error');
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = origBtnText;
        }
      });
    }

    const refreshAttachBtn = document.getElementById('btnRefreshAttachments');
    if (refreshAttachBtn) {
      refreshAttachBtn.addEventListener('click', loadStudioOverview);
    }
  }

  function renderAttachmentsTable() {
    const tbody = document.getElementById('attachmentsTableBody');
    if (!tbody) return;

    if (state.attachments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--studio-text-muted); padding: 32px;">
            No lecture notes uploaded yet. Use the upload form above to add PDF, DOCX, or PPTX handouts.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.attachments.map(att => {
      let typeClass = 'file-type-pdf';
      const ext = (att.file_type || '').toLowerCase();
      if (ext === 'docx' || ext === 'doc') typeClass = 'file-type-docx';
      if (ext === 'pptx' || ext === 'ppt') typeClass = 'file-type-pptx';

      const sizeKb = (att.file_size / 1024).toFixed(1);
      const sizeStr = Number(sizeKb) > 1024 ? `${(Number(sizeKb) / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
      const dateStr = att.created_at ? new Date(att.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

      return `
        <tr>
          <td>
            <strong>${escapeHtml(att.title)}</strong>
            ${att.description ? `<div style="font-size: 0.78rem; color: var(--studio-text-muted);">${escapeHtml(att.description)}</div>` : ''}
          </td>
          <td>
            <div>${escapeHtml(att.subject_name || 'Subject')}</div>
            ${att.topic_title ? `<span style="font-size: 0.75rem; color: var(--studio-text-muted);">↳ ${escapeHtml(att.topic_title)}</span>` : '<span style="font-size: 0.75rem; color: var(--studio-text-muted);">Subject-wide</span>'}
          </td>
          <td><span class="file-type-pill ${typeClass}">${escapeHtml(ext.toUpperCase() || 'FILE')}</span></td>
          <td>${sizeStr}</td>
          <td>${att.download_count || 0}</td>
          <td>${dateStr}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="/api/study/attachments/${att.id}/download" class="action-btn-sm" style="text-decoration:none;">
                Download
              </a>
              <button type="button" class="action-btn-sm action-btn-danger" onclick="window.StudioApp.confirmDeleteAttachment('${att.id}', '${escapeHtml(att.title)}')">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- Modals (Subject & Chapter) ---
  function initModals() {
    // Close modals
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
      });
    });

    // Subject Modal Open Buttons
    const openSubBtn = document.getElementById('openNewSubjectBtn');
    const createSubModalBtn = document.getElementById('btnCreateSubjectModal');
    if (openSubBtn) openSubBtn.addEventListener('click', () => openSubjectModal());
    if (createSubModalBtn) createSubModalBtn.addEventListener('click', () => openSubjectModal());

    // Subject Form Submit
    const subjectForm = document.getElementById('subjectModalForm');
    if (subjectForm) {
      subjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('modalSubjectId').value;
        const name = document.getElementById('subjectNameInput').value.trim();
        const code = document.getElementById('subjectCodeInput').value.trim();
        const category = document.getElementById('subjectCategorySelect').value;
        const description = document.getElementById('subjectDescInput').value.trim();
        const icon = document.getElementById('subjectIconInput').value.trim() || 'book';
        const color = document.getElementById('subjectColorInput').value || '#2563eb';
        const display_order = Number(document.getElementById('subjectOrderInput').value || 1);
        const status = document.getElementById('subjectStatusSelect').value;

        if (!name) {
          showToast('Subject name is required.', 'warning');
          return;
        }

        const payload = { name, code, category, description, icon, color, display_order, status };

        try {
          if (id) {
            await apiFetch(`/api/study/subjects/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Subject updated successfully!', 'success');
          } else {
            await apiFetch('/api/study/subjects', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Subject created successfully!', 'success');
          }
          document.getElementById('subjectModalOverlay').classList.remove('open');
          loadStudioOverview();
        } catch (err) {
          showToast('Failed to save subject: ' + err.message, 'error');
        }
      });
    }

    // Chapter Form Submit
    const chapterForm = document.getElementById('chapterModalForm');
    if (chapterForm) {
      chapterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('modalChapterId').value;
        const subject_id = document.getElementById('modalChapterSubjectId').value;
        const title = document.getElementById('chapterTitleInput').value.trim();
        const description = document.getElementById('chapterDescInput').value.trim();
        const display_order = Number(document.getElementById('chapterOrderInput').value || 1);
        const status = document.getElementById('chapterStatusSelect').value;

        if (!title || !subject_id) {
          showToast('Subject and Chapter title are required.', 'warning');
          return;
        }

        const payload = { subject_id, title, description, display_order, status };

        try {
          if (id) {
            await apiFetch(`/api/study/chapters/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Chapter updated successfully!', 'success');
          } else {
            await apiFetch('/api/study/chapters', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Chapter created successfully!', 'success');
          }
          document.getElementById('chapterModalOverlay').classList.remove('open');
          loadStudioOverview();
        } catch (err) {
          showToast('Failed to save chapter: ' + err.message, 'error');
        }
      });
    }

    // Delete Confirmation Button
    const confirmDeleteBtn = document.getElementById('btnConfirmDelete');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async () => {
        if (state.pendingDeleteAction) {
          await state.pendingDeleteAction();
          state.pendingDeleteAction = null;
          document.getElementById('deleteConfirmModalOverlay').classList.remove('open');
        }
      });
    }
  }

  function openSubjectModal(subject = null) {
    const modal = document.getElementById('subjectModalOverlay');
    const titleEl = document.getElementById('subjectModalTitle');
    const form = document.getElementById('subjectModalForm');
    form.reset();

    if (subject) {
      titleEl.textContent = `Edit Subject: ${subject.name}`;
      document.getElementById('modalSubjectId').value = subject.id;
      document.getElementById('subjectNameInput').value = subject.name || '';
      document.getElementById('subjectCodeInput').value = subject.code || '';
      document.getElementById('subjectCategorySelect').value = subject.category || 'Core CS';
      document.getElementById('subjectDescInput').value = subject.description || '';
      document.getElementById('subjectIconInput').value = subject.icon || 'book';
      document.getElementById('subjectColorInput').value = subject.color || '#2563eb';
      document.getElementById('subjectOrderInput').value = subject.display_order || 1;
      document.getElementById('subjectStatusSelect').value = subject.status || 'published';
    } else {
      titleEl.textContent = 'Add New Subject';
      document.getElementById('modalSubjectId').value = '';
      document.getElementById('subjectOrderInput').value = (state.subjects.length + 1) * 10;
    }

    modal.classList.add('open');
  }

  function openChapterModal(subjectId, subjectName, chapter = null) {
    const modal = document.getElementById('chapterModalOverlay');
    const titleEl = document.getElementById('chapterModalTitle');
    const form = document.getElementById('chapterModalForm');
    form.reset();

    document.getElementById('modalChapterSubjectId').value = subjectId;
    document.getElementById('chapterSubjectDisplay').value = subjectName;

    if (chapter) {
      titleEl.textContent = `Edit Chapter: ${chapter.title}`;
      document.getElementById('modalChapterId').value = chapter.id;
      document.getElementById('chapterTitleInput').value = chapter.title || '';
      document.getElementById('chapterDescInput').value = chapter.description || '';
      document.getElementById('chapterOrderInput').value = chapter.display_order || 1;
      document.getElementById('chapterStatusSelect').value = chapter.status || 'published';
    } else {
      titleEl.textContent = `Add Chapter to ${subjectName}`;
      document.getElementById('modalChapterId').value = '';
    }

    modal.classList.add('open');
  }

  // Confirmation helpers
  function confirmDeleteSubject(subjectId, subjectName) {
    const msg = `Are you sure you want to permanently delete the subject "${subjectName}"? All associated chapters and topics will also be removed.`;
    document.getElementById('deleteConfirmMessage').textContent = msg;
    state.pendingDeleteAction = async () => {
      try {
        await apiFetch(`/api/study/subjects/${subjectId}`, { method: 'DELETE' });
        showToast('Subject deleted successfully.', 'success');
        loadStudioOverview();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    };
    document.getElementById('deleteConfirmModalOverlay').classList.add('open');
  }

  function confirmDeleteChapter(chapterId, chapterTitle) {
    const msg = `Are you sure you want to permanently delete chapter "${chapterTitle}" and all topics inside it?`;
    document.getElementById('deleteConfirmMessage').textContent = msg;
    state.pendingDeleteAction = async () => {
      try {
        await apiFetch(`/api/study/chapters/${chapterId}`, { method: 'DELETE' });
        showToast('Chapter deleted successfully.', 'success');
        loadStudioOverview();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    };
    document.getElementById('deleteConfirmModalOverlay').classList.add('open');
  }

  function confirmDeleteTopic(topicId, topicTitle) {
    const msg = `Are you sure you want to delete topic "${topicTitle}"?`;
    document.getElementById('deleteConfirmMessage').textContent = msg;
    state.pendingDeleteAction = async () => {
      try {
        await apiFetch(`/api/study/topics/${topicId}`, { method: 'DELETE' });
        showToast('Topic deleted successfully.', 'success');
        loadStudioOverview();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    };
    document.getElementById('deleteConfirmModalOverlay').classList.add('open');
  }

  function confirmDeleteAttachment(attachmentId, title) {
    const msg = `Are you sure you want to delete the file "${title}"?`;
    document.getElementById('deleteConfirmMessage').textContent = msg;
    state.pendingDeleteAction = async () => {
      try {
        await apiFetch(`/api/study/attachments/${attachmentId}`, { method: 'DELETE' });
        showToast('Handout deleted successfully.', 'success');
        loadStudioOverview();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    };
    document.getElementById('deleteConfirmModalOverlay').classList.add('open');
  }

  // Filter toolbar bindings
  function initFilters() {
    const searchInput = document.getElementById('curriculumSearchInput');
    const catFilter = document.getElementById('curriculumCategoryFilter');
    const statusFilter = document.getElementById('curriculumStatusFilter');
    const refreshBtn = document.getElementById('btnRefreshCurriculum');

    if (searchInput) searchInput.addEventListener('input', renderCurriculumTree);
    if (catFilter) catFilter.addEventListener('change', renderCurriculumTree);
    if (statusFilter) statusFilter.addEventListener('change', renderCurriculumTree);
    if (refreshBtn) refreshBtn.addEventListener('click', loadStudioOverview);
  }

  // Expose global methods for inline HTML onclick handlers
  window.StudioApp = {
    toggleSubject,
    toggleChapterTopics,
    openEditSubjectModal: (id) => {
      const sub = state.subjects.find(s => s.id === id);
      if (sub) openSubjectModal(sub);
    },
    openNewChapterModal: (subjectId, subjectName) => openChapterModal(subjectId, subjectName),
    openEditChapterModal: (chapterId, subjectId) => {
      const sub = state.subjects.find(s => s.id === subjectId);
      const ch = (state.chaptersMap[subjectId] || []).find(c => c.id === chapterId);
      if (sub && ch) openChapterModal(subjectId, sub.name, ch);
    },
    confirmDeleteSubject,
    confirmDeleteChapter,
    confirmDeleteTopic,
    confirmDeleteAttachment,
    editTopicInStudio,
    openNewTopicForChapter,
    toggleTopicPublish
  };

  // --- Initial Bootstrap ---
  document.addEventListener('DOMContentLoaded', () => {
    initUserAndTheme();
    initTabs();
    initTopicEditor();
    initAttachments();
    initModals();
    initFilters();
    loadStudioOverview();
  });

})();
