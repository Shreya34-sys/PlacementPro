



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
});
