// public/js/app.js
async function apiRequest(url, method = 'GET', body = null) {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(url, config);
    return await response.json();
}



document.addEventListener('DOMContentLoaded', () => {

    // Global Logout Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Clear stored authentication tokens
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            sessionStorage.clear();

            // Replace history entry and redirect to login page
            window.location.replace('/login');
        });
    }

});




// Automates Authenticated API Requests (apiRequest function):
// Instead of writing long fetch() code on every single web page, this helper function automatically grabs the saved JWT token from browser storage, attaches it to the request header (Authorization: Bearer <token>), and sends data to the backend.

// Handles Global Logout:
// It listens for clicks on any Logout button across the app, wipes out the saved JWT tokens from localStorage, and redirects the user safely back to the login screen.