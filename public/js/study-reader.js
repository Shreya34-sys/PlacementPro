// PlacementPro - Study Material Tutorial Reader Logic
const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
const params = new URLSearchParams(window.location.search);
const subjectParam = params.get('subject') || 'dbms';
let currentTopicSlug = params.get('topic') || '';
let currentSubject = null;
let currentTopicData = null;
let tocObserver = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

async function loadReader() {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. Fetch Subject Hierarchy
  try {
    const res = await fetch(`/api/study/subjects/${encodeURIComponent(subjectParam)}`, { headers });
    const data = await res.json();
    if (!res.ok || !data.success || !data.subject) {
      document.getElementById('articleBody').innerHTML = `
        <div style="padding: 40px; text-align: center; color: #ef4444;">
          Subject "${escapeHtml(subjectParam)}" could not be found. <a href="/study-materials" style="text-decoration: underline;">Return to Subject Hub</a>
        </div>
      `;
      return;
    }

    currentSubject = data.subject;
    renderSidebar(currentSubject);

    // Determine which topic to open
    if (!currentTopicSlug) {
      for (const ch of (currentSubject.chapters || [])) {
        if (ch.topics && ch.topics.length > 0) {
          currentTopicSlug = ch.topics[0].slug || ch.topics[0].id;
          break;
        }
      }
    }

    if (currentTopicSlug) {
      await loadTopicContent(currentTopicSlug);
    } else {
      document.getElementById('articleBody').innerHTML = `
        <div style="padding: 48px; text-align: center; color: var(--study-text-muted);">
          No published topics available for this subject yet.
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading subject:', err);
  }
}

function renderSidebar(subject) {
  document.getElementById('sidebarSubjectName').textContent = subject.name;
  document.getElementById('breadSubject').innerHTML = `<a href="/study-materials">${escapeHtml(subject.name)}</a>`;

  const modeNav = document.getElementById('subjectModeNav');
  if (modeNav) {
    if (subject.code === 'compiler-design') {
      modeNav.style.display = 'inline-flex';
    } else {
      modeNav.style.display = 'none';
    }
  }

  const container = document.getElementById('sidebarChaptersList');
  if (!subject.chapters || !subject.chapters.length) {
    container.innerHTML = `<div style="padding: 20px; color: var(--study-text-muted); font-size: 0.85rem;">No chapters defined yet.</div>`;
    return;
  }

  const practiceBannerHtml = subject.code === 'compiler-design' ? `
    <div style="padding: 12px 14px; margin: 10px 12px 14px 12px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 8px;">
      <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: #1e40af; letter-spacing: 0.5px; margin-bottom: 4px;">Interactive Lab</div>
      <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">C-Visualize Workspace</div>
      <p style="font-size: 0.75rem; color: #475569; margin: 0 0 8px 0; line-height: 1.4;">Inspect 6 compiler phases, edit C code, and run programs live.</p>
      <a href="/compiler-practice?subject=compiler-design" style="display: block; text-align: center; padding: 6px 10px; background: #2563eb; color: #ffffff; font-size: 0.78rem; font-weight: 700; border-radius: 6px; text-decoration: none;">
        Open Compiler Workspace &rarr;
      </a>
    </div>
  ` : '';

  container.innerHTML = practiceBannerHtml + subject.chapters.map(ch => {
    const topicsHtml = (ch.topics || []).map(t => {
      const isCurrent = t.slug === currentTopicSlug || t.id === currentTopicSlug;
      return `
        <li class="sidebar-topic-item ${isCurrent ? 'active' : ''} ${t.is_completed ? 'completed' : ''}" data-topic-id="${t.id}" data-topic-slug="${t.slug}">
          <a href="/study-reader?subject=${encodeURIComponent(subject.code)}&topic=${encodeURIComponent(t.slug)}" onclick="switchTopic(event, '${t.slug}')">
            <span>${escapeHtml(t.title)}</span>
            ${t.is_completed ? '<span class="check-icon" title="Completed"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : ''}
          </a>
        </li>
      `;
    }).join('');

    return `
      <div class="sidebar-chapter-group">
        <div class="sidebar-chapter-title">
          <span>${escapeHtml(ch.title)}</span>
          <span style="font-size: 0.75rem;">${(ch.topics || []).length}</span>
        </div>
        <ul class="sidebar-topics-list">
          ${topicsHtml || '<li style="padding: 8px 24px; font-size: 0.8rem; color: var(--study-text-muted);">No topics</li>'}
        </ul>
      </div>
    `;
  }).join('');
}

async function loadTopicContent(topicSlugOrId) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await fetch(`/api/study/topics/${encodeURIComponent(topicSlugOrId)}`, { headers });
    const data = await res.json();
    if (!res.ok || !data.success || !data.topic) {
      document.getElementById('articleBody').innerHTML = `
        <div style="padding: 40px; text-align: center; color: #ef4444;">
          Topic not found or currently in draft.
        </div>
      `;
      return;
    }

    currentTopicData = data.topic;
    currentTopicSlug = currentTopicData.slug;

    // Update Browser title & URL without reloading
    document.title = `${currentTopicData.title} - ${currentTopicData.subject_name} | PlacementPro`;
    window.history.replaceState({}, '', `/study-reader?subject=${encodeURIComponent(currentSubject.code)}&topic=${encodeURIComponent(currentTopicData.slug)}`);

    // Update Breadcrumbs
    document.getElementById('breadcrumbsNav').innerHTML = `
      <a href="/dashboard">Home</a>
      <span class="sep">&rsaquo;</span>
      <a href="/study-materials">Study Materials</a>
      <span class="sep">&rsaquo;</span>
      <a href="/study-materials">${escapeHtml(currentTopicData.subject_name)}</a>
      <span class="sep">&rsaquo;</span>
      <span>${escapeHtml(currentTopicData.chapter_title)}</span>
      <span class="sep">&rsaquo;</span>
      <span class="current">${escapeHtml(currentTopicData.title)}</span>
    `;

    // Article Header
    document.getElementById('articleCategoryPill').textContent = currentTopicData.subject_name;
    document.getElementById('articleTitle').textContent = currentTopicData.title;
    
    const readMinutes = currentTopicData.estimated_reading_minutes || 5;
    const readTimeEl = document.getElementById('articleReadTimeText');
    if (readTimeEl) {
      readTimeEl.textContent = `${readMinutes} min read`;
    }

    document.getElementById('articleAuthor').textContent = currentTopicData.author_name ? `By ${currentTopicData.author_name}` : 'PlacementPro Faculty';
    document.getElementById('articleViews').textContent = `${currentTopicData.views_count || 1} views`;

    // Article Content Body
    const bodyEl = document.getElementById('articleBody');
    bodyEl.innerHTML = currentTopicData.content || '<p>No content has been added to this tutorial yet.</p>';

    // Auto-wrap all tutorial tables in a responsive horizontal-scrolling container
    bodyEl.querySelectorAll('table').forEach(tbl => {
      tbl.classList.add('tutorial-table');
      if (!tbl.parentElement.classList.contains('table-responsive')) {
        const wrap = document.createElement('div');
        wrap.className = 'table-responsive';
        tbl.parentNode.insertBefore(wrap, tbl);
        wrap.appendChild(tbl);
      }
    });

    // Add Copy buttons to any code blocks
    bodyEl.querySelectorAll('pre').forEach(pre => {
      pre.classList.add('code-block');
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        const codeText = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(codeText);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
      });
      pre.style.position = 'relative';
      pre.appendChild(copyBtn);
    });

    // Wire interactive MCQ practice question reveals
    bodyEl.querySelectorAll('.mcq-reveal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const expl = btn.parentElement.querySelector('.mcq-explanation');
        if (expl) {
          const isHidden = expl.style.display === 'none' || getComputedStyle(expl).display === 'none';
          expl.style.display = isHidden ? 'block' : 'none';
          btn.textContent = isHidden ? 'Hide Explanation' : 'Show Answer & Detailed Explanation';
        }
      });
    });

    // Build Table of Contents for Desktop Right Column
    buildTableOfContents(bodyEl, currentTopicData.video_url);

    // Update Video Lecture Section
    const videoSec = document.getElementById('videoLectureSection');
    if (currentTopicData.video_url) {
      videoSec.style.display = 'block';
      const badgeEl = document.getElementById('videoSourceBadge');
      const tagEl = document.getElementById('videoChannelTag');
      const titleEl = document.getElementById('videoTitle');
      const objEl = document.getElementById('videoObjective');
      const playerContainer = document.getElementById('videoPlayerContainer');

      if (badgeEl) badgeEl.textContent = 'Curriculum Video Lecture';
      if (tagEl) tagEl.textContent = currentTopicData.video_source || 'NPTEL / Academic Channel';
      if (titleEl) titleEl.textContent = currentTopicData.video_title || `${currentTopicData.title} - Video Lecture`;
      if (objEl) {
        objEl.textContent = currentTopicData.video_objective 
          ? `Learning Objective: ${currentTopicData.video_objective}` 
          : 'Learning Objective: Comprehensive visual walkthrough of the theory, architecture, and step-by-step problem solving.';
      }

      const rawUrl = String(currentTopicData.video_url).trim();
      let embedUrl = rawUrl;
      try {
        if (rawUrl.includes('youtube.com/watch')) {
          const u = new URL(rawUrl);
          const v = u.searchParams.get('v');
          if (v) embedUrl = `https://www.youtube-nocookie.com/embed/${v}`;
        } else if (rawUrl.includes('youtu.be/')) {
          const parts = rawUrl.split('youtu.be/');
          const v = parts[1]?.split(/[?#]/)[0];
          if (v) embedUrl = `https://www.youtube-nocookie.com/embed/${v}`;
        }
      } catch (_) {}

      if (embedUrl.includes('/embed/')) {
        playerContainer.innerHTML = `
          <iframe 
            src="${escapeHtml(embedUrl)}" 
            title="${escapeHtml(currentTopicData.video_title || currentTopicData.title)}" 
            loading="lazy" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        `;
      } else {
        playerContainer.innerHTML = `
          <div class="video-external-card">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            <p style="font-size:0.9rem; color:var(--study-text); margin:0;">Official academic video lecture available on verified provider.</p>
            <a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer" class="video-external-btn">
              <span>Watch Lecture on Official Channel</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        `;
      }
    } else {
      videoSec.style.display = 'none';
    }

    // Update Bookmark state
    updateBookmarkUI(currentTopicData.is_bookmarked);

    // Update Completed state
    const isCompleted = currentTopicData.reading_progress?.is_completed;
    updateCompletedUI(isCompleted);

    // Update Attachments / Lecture Notes section
    const attachSec = document.getElementById('topicAttachmentsSection');
    const attachList = document.getElementById('topicAttachmentsList');
    if (currentTopicData.attachments && currentTopicData.attachments.length > 0) {
      attachSec.style.display = 'block';
      attachList.innerHTML = currentTopicData.attachments.map(att => {
        const type = (att.file_type || '').toLowerCase();
        const sizeMb = (att.file_size / (1024 * 1024)).toFixed(1);
        return `
          <div class="attachment-item-row">
            <div class="attach-file-info">
              <span class="attach-badge ${type}">${escapeHtml(type.toUpperCase())}</span>
              <div>
                <strong>${escapeHtml(att.title)}</strong>
                <div style="font-size: 0.8rem; color: var(--study-text-muted);">${escapeHtml(att.original_name)} • ${sizeMb} MB</div>
              </div>
            </div>
            <a href="/api/study/attachments/${encodeURIComponent(att.id)}/download" class="btn-reader-action" target="_blank" style="text-decoration: none;">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download</span>
            </a>
          </div>
        `;
      }).join('');
    } else {
      attachSec.style.display = 'none';
    }

    // Previous and Next Topic Navigation
    const prevLink = document.getElementById('prevTopicLink');
    const nextLink = document.getElementById('nextTopicLink');

    if (currentTopicData.prevTopic) {
      prevLink.style.display = 'flex';
      document.getElementById('prevTopicTitle').textContent = currentTopicData.prevTopic.title;
      prevLink.onclick = (e) => switchTopic(e, currentTopicData.prevTopic.slug);
    } else {
      prevLink.style.display = 'none';
    }

    if (currentTopicData.nextTopic) {
      nextLink.style.display = 'flex';
      document.getElementById('nextTopicTitle').textContent = currentTopicData.nextTopic.title;
      nextLink.onclick = (e) => switchTopic(e, currentTopicData.nextTopic.slug);
    } else {
      nextLink.style.display = 'none';
    }

    // Update sidebar active selection
    document.querySelectorAll('.sidebar-topic-item').forEach(item => {
      const match = item.dataset.topicSlug === currentTopicData.slug || item.dataset.topicId === currentTopicData.id;
      item.classList.toggle('active', match);
      if (match) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    // Close mobile drawer if opened
    document.getElementById('readerSidebar')?.classList.remove('open');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Error loading topic content:', err);
  }
}

// Dynamic Table of Contents Generator
function buildTableOfContents(bodyEl, hasVideo = false) {
  const tocNav = document.getElementById('articleTocNav');
  const tocAside = document.getElementById('readerToc');
  if (!tocNav || !tocAside) return;

  if (tocObserver) {
    tocObserver.disconnect();
    tocObserver = null;
  }

  const headings = Array.from(bodyEl.querySelectorAll('h2, h3'));
  if (!headings || headings.length === 0) {
    tocNav.innerHTML = '<span style="font-size: 0.8rem; color: var(--study-text-muted); padding: 4px 8px;">Overview</span>';
    return;
  }

  tocNav.innerHTML = '';
  headings.forEach((h, index) => {
    if (!h.id) {
      h.id = 'section-' + (index + 1);
    }
    const isH3 = h.tagName.toLowerCase() === 'h3';
    const link = document.createElement('a');
    link.href = `#${h.id}`;
    link.className = `toc-link ${isH3 ? 'toc-sub' : ''}`;
    link.textContent = h.textContent.trim();
    link.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
    tocNav.appendChild(link);
  });

  // Add Video Lecture section link to Table of Contents if available
  if (hasVideo) {
    const videoLink = document.createElement('a');
    videoLink.href = '#videoLectureSection';
    videoLink.className = 'toc-link';
    videoLink.textContent = 'Video Lecture';
    videoLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('videoLectureSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
      videoLink.classList.add('active');
    });
    tocNav.appendChild(videoLink);
  }

  // Highlight first link initially
  const firstLink = tocNav.querySelector('.toc-link');
  if (firstLink) firstLink.classList.add('active');

  // Scroll spy via IntersectionObserver
  if ('IntersectionObserver' in window) {
    tocObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.toc-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-60px 0px -75% 0px' });

    headings.forEach(h => tocObserver.observe(h));
    const videoSec = document.getElementById('videoLectureSection');
    if (videoSec && hasVideo) tocObserver.observe(videoSec);
  }
}

function switchTopic(event, slug) {
  if (event) event.preventDefault();
  loadTopicContent(slug);
}

function updateBookmarkUI(bookmarked) {
  const icon = document.getElementById('bookmarkIcon');
  const text = document.getElementById('bookmarkText');
  const btn = document.getElementById('bookmarkBtn');
  if (bookmarked) {
    btn.classList.add('active');
    icon.setAttribute('fill', 'currentColor');
    text.textContent = 'Bookmarked';
  } else {
    btn.classList.remove('active');
    icon.setAttribute('fill', 'none');
    text.textContent = 'Bookmark';
  }
}

function updateCompletedUI(completed) {
  const btn = document.getElementById('markCompletedBtn');
  const text = document.getElementById('completedBtnText');
  if (completed) {
    btn.style.background = '#059669';
    btn.style.borderColor = '#059669';
    btn.style.color = '#ffffff';
    text.textContent = 'Completed';
  } else {
    btn.style.background = 'rgba(16, 185, 129, 0.08)';
    btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    btn.style.color = '#059669';
    text.textContent = 'Mark as Read';
  }
}

// Bookmark click toggle handler
document.getElementById('bookmarkBtn')?.addEventListener('click', async () => {
  if (!token) {
    alert('Please log in as a student to save bookmarks.');
    return;
  }
  if (!currentTopicData) return;

  try {
    const res = await fetch(`/api/study/bookmarks/${encodeURIComponent(currentTopicData.id)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      updateBookmarkUI(data.bookmarked);
    }
  } catch (e) {
    console.error('Bookmark toggle failed:', e);
  }
});

// Mark as Completed click handler
document.getElementById('markCompletedBtn')?.addEventListener('click', async () => {
  if (!token) {
    alert('Please log in as a student to track reading progress.');
    return;
  }
  if (!currentTopicData) return;

  const currentlyCompleted = currentTopicData.reading_progress?.is_completed;
  const nextCompletedState = !currentlyCompleted;

  try {
    const res = await fetch(`/api/study/progress/${encodeURIComponent(currentTopicData.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isCompleted: nextCompletedState, progressPercent: nextCompletedState ? 100 : 50 })
    });
    const data = await res.json();
    if (data.success) {
      if (!currentTopicData.reading_progress) currentTopicData.reading_progress = {};
      currentTopicData.reading_progress.is_completed = data.isCompleted;
      updateCompletedUI(data.isCompleted);

      // Also update sidebar checkmark
      document.querySelectorAll(`.sidebar-topic-item[data-topic-id="${currentTopicData.id}"]`).forEach(el => {
        el.classList.toggle('completed', data.isCompleted);
      });
    }
  } catch (e) {
    console.error('Progress update failed:', e);
  }
});

// Sidebar Filter
document.getElementById('sidebarSearch')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll('.sidebar-topic-item').forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = (!q || text.includes(q)) ? 'block' : 'none';
  });
});

// Mobile Sidebar Drawer Toggle & Backdrop Click
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const readerSidebar = document.getElementById('readerSidebar');

sidebarToggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  readerSidebar?.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (readerSidebar && readerSidebar.classList.contains('open') && !readerSidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
    readerSidebar.classList.remove('open');
  }
});

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  loadReader();
});
