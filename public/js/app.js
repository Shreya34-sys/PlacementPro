// // public/js/app.js
// async function apiRequest(url, method = 'GET', body = null) {
//     const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
//     const headers = {
//         'Content-Type': 'application/json'
//     };

//     if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//     }

//     const config = { method, headers };
//     if (body) config.body = JSON.stringify(body);

//     const response = await fetch(url, config);
//     return await response.json();
// }

// document.addEventListener('DOMContentLoaded', () => {

//     // Global Logout Handler
//     const logoutBtn = document.getElementById('logoutBtn');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', (e) => {
//             e.preventDefault();

//             // Clear stored authentication tokens
//             localStorage.removeItem('token');
//             localStorage.removeItem('adminToken');
//             sessionStorage.clear();

//             // Replace history entry and redirect to login page
//             window.location.replace('/login');
//         });
//     }

// });





// const { GoogleGenAI } = require('@google/genai');
// require('dotenv').config();

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// async function testKey() {
//   try {
//     const response = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: 'Respond with "Key is working!" if you receive this message.',
//     });
//     console.log('SUCCESS:', response.text);
//   } catch (err) {
//     console.error('API ERROR:', err.message);
//   }
// }

//testKey();

// Automates Authenticated API Requests (apiRequest function):
// Instead of writing long fetch() code on every single web page, this helper function automatically grabs the saved JWT token from browser storage, attaches it to the request header (Authorization: Bearer <token>), and sends data to the backend.

// Handles Global Logout:
// It listens for clicks on any Logout button across the app, wipes out the saved JWT tokens from localStorage, and redirects the user safely back to the login screen.








// Shared browser helper. Exam-specific Socket.IO and proctoring logic stays in exam-client.js.
async function apiRequest(url, method = 'GET', body = null) {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  const headers = { Accept: 'application/json' };
  if (body !== null) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
    credentials: 'same-origin'
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status}).`);
    error.status = response.status;
    error.data = payload;
    throw error;
  }
  return payload;
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', event => {
    event.preventDefault();
    const wasAdmin = Boolean(localStorage.getItem('adminToken'));
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    sessionStorage.clear();
    window.location.replace(wasAdmin ? '/admin-login' : '/login');
  });
});