



// Global Logout Handler Function
function handleStudentLogout() {
    // 1. Completely clear local and session storage
    localStorage.clear();
    sessionStorage.clear();

    // 2. Destroy history stack and force navigation back to login
    window.location.replace('/login');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check auth on load
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/login');
        return;
    }

    // --- 1. Theme Toggle Functionality ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // --- 2. Profile Dropdown Menu Handling ---
    const profileTrigger = document.getElementById('profileTrigger');
    const profileMenu = document.getElementById('profileMenu');
    const profileContainer = document.getElementById('profileDropdownContainer');

    if (profileTrigger && profileMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            profileMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (profileContainer && !profileContainer.contains(e.target)) {
                profileMenu.classList.remove('show');
                profileMenu.classList.remove('active');
            }
        });
    }

    // --- 3. Dynamic User Profile Fetching ---
    try {
        const response = await fetch('/api/student/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok && (result.data || result.student)) {
            const user = result.data || result.student;
            const fullName = user.full_name || user.fullName || user.name || 'Aaryan Yerudkar';
            const email = user.email || 'aaryanyerudkar@gmail.com';

            const initials = fullName
                ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : 'AY';

            const navAvatar = document.getElementById('navAvatar');
            const bodyAvatar = document.getElementById('bodyAvatar');
            const navUserName = document.getElementById('navUserName');
            const menuUserName = document.getElementById('menuUserName');
            const menuUserEmail = document.getElementById('menuUserEmail');
            const welcomeHeading = document.getElementById('welcomeHeading');

            if (navAvatar) navAvatar.textContent = initials;
            if (bodyAvatar) bodyAvatar.textContent = initials;
            if (navUserName) navUserName.textContent = fullName;
            if (menuUserName) menuUserName.textContent = fullName;
            if (menuUserEmail) menuUserEmail.textContent = email;
            if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${fullName}`;
        }
    } catch (error) {
        console.error('Error fetching student profile:', error);
    }

    // Event listener backup for logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleStudentLogout();
        });
    }
});