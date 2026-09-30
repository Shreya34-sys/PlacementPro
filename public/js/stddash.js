



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
//         if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
//     }

//     if (themeToggleBtn) {
//         themeToggleBtn.addEventListener('click', () => {
//             document.body.classList.toggle('dark-mode');
//             const isDark = document.body.classList.contains('dark-mode');
//             themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
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
  const token = localStorage.getItem('token');
  if (!token) return window.location.replace('/login');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const setTheme = dark => {
    document.body.classList.toggle('dark-mode', dark);
    if (themeToggleBtn) themeToggleBtn.textContent = dark ? '☀️' : '🌙';
  };
  setTheme(localStorage.getItem('theme') === 'dark');
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