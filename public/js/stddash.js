



// // Global Logout Handler Function
// function handleStudentLogout() {
//     // 1. Completely clear local and session storage
//     localStorage.clear();
//     sessionStorage.clear();

//     // 2. Destroy history stack and force navigation back to login
//     window.location.replace('/login');
// }

// document.addEventListener('DOMContentLoaded', async () => {
//     // Check auth on load
//     const token = localStorage.getItem('token');
//     if (!token) {
//         window.location.replace('/login');
//         return;
//     }

//     // --- 1. Theme Toggle Functionality ---
//     const themeToggleBtn = document.getElementById('themeToggleBtn');
    
//     if (localStorage.getItem('theme') === 'dark') {
//         document.body.classList.add('dark-mode');
//         if (themeToggleBtn) themeToggleBtn.textContent = 'Light theme';
//     }

//     if (themeToggleBtn) {
//         themeToggleBtn.addEventListener('click', () => {
//             document.body.classList.toggle('dark-mode');
//             const isDark = document.body.classList.contains('dark-mode');
//             themeToggleBtn.textContent = isDark ? 'Light theme' : 'Dark theme';
//             localStorage.setItem('theme', isDark ? 'dark' : 'light');
//         });
//     }

//     // --- 2. Profile Dropdown Menu Handling ---
//     const profileTrigger = document.getElementById('profileTrigger');
//     const profileMenu = document.getElementById('profileMenu');
//     const profileContainer = document.getElementById('profileDropdownContainer');

//     if (profileTrigger && profileMenu) {
//         profileTrigger.addEventListener('click', (e) => {
//             e.stopPropagation();
//             profileMenu.classList.toggle('show');
//             profileMenu.classList.toggle('active');
//         });

//         document.addEventListener('click', (e) => {
//             if (profileContainer && !profileContainer.contains(e.target)) {
//                 profileMenu.classList.remove('show');
//                 profileMenu.classList.remove('active');
//             }
//         });
//     }

//     // --- 3. Dynamic User Profile Fetching ---
//     try {
//         const response = await fetch('/api/student/profile', {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         const result = await response.json();

//         if (response.ok && (result.data || result.student)) {
//             const user = result.data || result.student;
//             const fullName = user.full_name || user.fullName || user.name || 'Aaryan Yerudkar';
//             const email = user.email || 'aaryanyerudkar@gmail.com';

//             const initials = fullName
//                 ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
//                 : 'AY';

//             const navAvatar = document.getElementById('navAvatar');
//             const bodyAvatar = document.getElementById('bodyAvatar');
//             const navUserName = document.getElementById('navUserName');
//             const menuUserName = document.getElementById('menuUserName');
//             const menuUserEmail = document.getElementById('menuUserEmail');
//             const welcomeHeading = document.getElementById('welcomeHeading');

//             if (navAvatar) navAvatar.textContent = initials;
//             if (bodyAvatar) bodyAvatar.textContent = initials;
//             if (navUserName) navUserName.textContent = fullName;
//             if (menuUserName) menuUserName.textContent = fullName;
//             if (menuUserEmail) menuUserEmail.textContent = email;
//             if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${fullName}`;
//         }
//     } catch (error) {
//         console.error('Error fetching student profile:', error);
//     }

//     // Event listener backup for logout button
//     const logoutBtn = document.getElementById('logoutBtn');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', (e) => {
//             e.preventDefault();
//             handleStudentLogout();
//         });
//     }
// });





function handleStudentLogout() {
  localStorage.removeItem('token');
  sessionStorage.clear();
  window.location.replace('/login');
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlToken = new URLSearchParams(window.location.search).get('token');
  if (urlToken) localStorage.setItem('token', urlToken);
  const token = localStorage.getItem('token');
  if (!token) return window.location.replace('/login');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const setTheme = dark => {
    document.body.classList.toggle('dark-mode', dark);
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>'
        : '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>';
      themeToggleBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggleBtn.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    }
  };
  setTheme(localStorage.getItem('theme') === 'dark');
  themeToggleBtn?.setAttribute('aria-label', document.body.classList.contains('dark-mode') ? 'Switch to light theme' : 'Switch to dark theme');
  themeToggleBtn?.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    setTheme(dark);
  });

  const profileTrigger = document.getElementById('profileTrigger');
  const profileMenu = document.getElementById('profileMenu');
  const profileContainer = document.getElementById('profileDropdownContainer');
  profileTrigger?.addEventListener('click', event => { event.stopPropagation(); profileMenu?.classList.toggle('show'); });
  document.addEventListener('click', event => { if (profileContainer && !profileContainer.contains(event.target)) profileMenu?.classList.remove('show'); });

  document.getElementById('logoutBtn')?.addEventListener('click', event => { event.preventDefault(); handleStudentLogout(); });
  try {
    const response = await fetch('/api/student/profile', { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok) return;
    const user = result.data || result.student || {};
    const name = user.full_name || user.fullName || user.name || 'Student';
    const email = user.email || '';
    const initials = name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    [['navAvatar', initials], ['bodyAvatar', initials], ['navUserName', name], ['menuUserName', name], ['menuUserEmail', email], ['welcomeHeading', `Welcome back, ${name}`]].forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
  } catch (error) { console.error('Unable to load student profile:', error); }
});
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('studentNavigation');
  const navToggle = document.getElementById('mobileNavToggle');
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a[href]').forEach(link => {
    const href = new URL(link.href, window.location.origin);
    if (href.pathname.replace(/\/$/, '') === path) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      link.closest('.dropdown')?.querySelector('.dropdown-toggle')?.classList.add('active');
    }
  });
  navToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') || false;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  function alignMegaMenu(megaMenu) {
    if (!megaMenu || window.innerWidth <= 680) {
      if (megaMenu) megaMenu.style.left = '';
      return;
    }
    megaMenu.style.left = '0px';
    const rect = megaMenu.getBoundingClientRect();
    const rightOverflow = rect.right - (window.innerWidth - 16);
    if (rightOverflow > 0) {
      megaMenu.style.left = `${-rightOverflow}px`;
    }
    const updated = megaMenu.getBoundingClientRect();
    if (updated.left < 16) {
      megaMenu.style.left = `${16 - rect.left}px`;
    }
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    });
  }

  document.querySelectorAll('.dropdown-toggle').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const dropdown = button.closest('.dropdown');
      const wasOpen = dropdown.classList.contains('open');

      closeAllDropdowns();
      document.getElementById('profileMenu')?.classList.remove('show', 'active');

      if (!wasOpen) {
        dropdown.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        const mega = dropdown.querySelector('.mega-menu');
        if (mega) alignMegaMenu(mega);
      } else {
        dropdown.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.dropdown')) {
      closeAllDropdowns();
    }
    if (nav && navToggle && !nav.contains(event.target) && !navToggle.contains(event.target)) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      closeAllDropdowns();
      document.getElementById('profileMenu')?.classList.remove('show', 'active');
      if (nav && navToggle && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  window.addEventListener('resize', () => {
    const openMega = document.querySelector('.dropdown.open > .mega-menu');
    if (openMega) alignMegaMenu(openMega);
  });

  document.querySelectorAll('.nav-dropdown-menu a').forEach(link => {
    link.addEventListener('click', () => {
      closeAllDropdowns();
    });
  });

  // Initialize Upcoming Interviews
  loadUpcomingInterviews();

  // Socket.IO real-time refresh
  if (typeof window.io === 'function') {
    try {
      const socket = window.io({ auth: { token }, reconnection: true });
      socket.on('interview:changed', () => {
        loadUpcomingInterviews();
      });
    } catch (_) {}
  }

  // Periodic fallback refresh
  window.setInterval(loadUpcomingInterviews, 15000);
});

// --- Dynamic Real Upcoming Interviews Loader ---
function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatInterviewSchedule(deadline) {
  if (!deadline) {
    return {
      badgeClass: 'badge blue-bg-badge',
      badgeText: 'Flexible Schedule'
    };
  }

  const d = new Date(deadline);
  const now = new Date();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isToday = d.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  let badgeText = '';
  let badgeClass = 'badge blue-bg-badge';

  if (isToday) {
    badgeText = `Today • ${timeStr}`;
    badgeClass = 'badge orange-bg-badge';
  } else if (isTomorrow) {
    badgeText = `Tomorrow • ${timeStr}`;
    badgeClass = 'badge blue-bg-badge';
  } else {
    badgeText = `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • ${timeStr}`;
    badgeClass = 'badge blue-bg-badge';
  }

  return { badgeClass, badgeText };
}

function getCompanyInitial(name, category) {
  if (name && name.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  if (category === 'technical') return 'T';
  if (category === 'behavioral') return 'B';
  return 'AI';
}

async function loadUpcomingInterviews() {
  const container = document.getElementById('upcomingInterviewsList');
  const badge = document.getElementById('upcomingInterviewsBadge');
  if (!container) return;

  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/interviews/student', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const assignments = Array.isArray(data.assignments) ? data.assignments : [];

    // Filter only real, active, upcoming scheduled interviews for this student:
    // 1. availability must be 'available' (not expired, not completed, not deleted, not draft)
    // 2. exclude the generic on-demand sandbox practice unless specifically scheduled with a deadline
    const upcoming = assignments.filter(item => {
      if (item.availability !== 'available') return false;
      if (item.title === 'AI HR Interactive Mock Interview' && !item.deadline) return false;
      return true;
    });

    if (badge) {
      badge.textContent = `${upcoming.length} Scheduled`;
      badge.className = upcoming.length > 0 ? 'badge blue-badge' : 'badge grey-bg';
    }

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="card empty-state-card" style="text-align: center; padding: 28px 16px; border: 1px dashed var(--border-color); border-radius: 12px; background: var(--bg-surface);">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.75" style="margin: 0 auto 10px; opacity: 0.6; display: block; color: var(--text-secondary);">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p style="font-weight: 600; margin: 0; font-size: 14px; color: var(--text-primary);">No upcoming interviews scheduled.</p>
          <p style="font-size: 12px; margin-top: 4px; margin-bottom: 0; color: var(--text-secondary);">Interviews published by faculty or recruiters will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = upcoming.map(item => {
      const schedule = formatInterviewSchedule(item.deadline);
      const estMinutes = Math.max(15, Math.round(((item.default_preparation_seconds || 30) + (item.default_answer_seconds || 180)) * (item.question_count || 3) / 60));
      const initial = getCompanyInitial(item.company_name, item.category);
      const isAi = item.category === 'hr' || (item.title && item.title.toLowerCase().includes('ai'));
      const roomUrl = `/pages/interview-room.html?assignment=${encodeURIComponent(item.assignment_id)}${isAi ? '&ai=true' : ''}`;
      const subtitle = (item.company_name ? `${escapeHtml(item.company_name)} • ` : '') +
        `${escapeHtml(item.category ? item.category.toUpperCase() : 'GENERAL')} (${item.question_count || 0} questions)`;

      return `
        <div class="card interview-card">
          <div class="interview-meta">
            <span class="${schedule.badgeClass}">${escapeHtml(schedule.badgeText)}</span>
            <span class="time-left">
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <circle cx="12" cy="13" r="8"/>
                <path d="M12 9v4l3 2M9 2h6"/>
              </svg> ${estMinutes} mins
            </span>
          </div>
          <div class="interview-details">
            <div class="company-icon-box" style="font-size: 15px; font-weight: 700; color: var(--primary); background: rgba(59, 130, 246, 0.1);">
              ${escapeHtml(initial)}
            </div>
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${subtitle}</p>
            </div>
          </div>
          <div class="interview-footer">
            <span>
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <rect x="3" y="7" width="18" height="14" rx="3"/>
                <path d="M12 3v4M8 13h.01M16 13h.01M8 17h8"/>
              </svg> ${isAi ? 'AI Voice Interviewer' : 'Interview Room'}
            </span>
            <a class="btn btn-secondary-sm" href="${roomUrl}" style="text-decoration:none;">Join Room</a>
          </div>
        </div>
      `;
    }).join('');

    // Update NEXT UP in Overview Card if exists
    const nextUpTitle = document.getElementById('overviewNextUpTitle');
    const nextUpSub = document.getElementById('overviewNextUpSub');
    if (nextUpTitle && upcoming[0]) {
      nextUpTitle.textContent = upcoming[0].title;
      if (nextUpSub) {
        nextUpSub.textContent = `${upcoming[0].company_name ? upcoming[0].company_name + ' • ' : ''}${upcoming[0].category.toUpperCase()} interview`;
      }
    }
  } catch (err) {
    console.error('Error loading upcoming interviews:', err);
    container.innerHTML = `
      <div class="card empty-state-card" style="text-align: center; padding: 20px 16px;">
        <p style="font-size: 13px; color: #ef4444; margin-bottom: 8px;">Unable to load upcoming interviews.</p>
        <button class="btn btn-secondary-sm" onclick="loadUpcomingInterviews()">Retry</button>
      </div>
    `;
  }
}
