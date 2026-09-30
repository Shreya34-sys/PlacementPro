// document.addEventListener('DOMContentLoaded', () => {
//     // 1. Theme Toggle
//     const themeToggleBtn = document.getElementById('themeToggle');
//     if (themeToggleBtn) {
//         themeToggleBtn.addEventListener('click', () => {
//             document.body.classList.toggle('dark-mode');
//             themeToggleBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
//         });
//     }

//     // 2. Admin Logout
//     const logoutBtn = document.getElementById('logoutBtn');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', (e) => {
//             e.preventDefault();
//             localStorage.removeItem('adminToken');
//             localStorage.removeItem('token');
//             localStorage.clear();
//             sessionStorage.clear();
//             window.location.replace('/admin-login');
//         });
//     }

//     // 3. Faculty AI Ingestion Execution Handler
//     const runIngestionBtn = document.getElementById('runIngestionBtn');
//     if (runIngestionBtn) {
//         runIngestionBtn.addEventListener('click', async () => {
//             const promptText = document.getElementById('aiPromptInput').value.trim();
//             const selectedDrive = document.getElementById('ingestionDriveSelect').value;

//             if (!promptText) {
//                 alert('Please enter or select a prompt preset before running AI Ingestion.');
//                 return;
//             }

//             const originalBtnText = runIngestionBtn.innerHTML;
//             runIngestionBtn.innerHTML = '⏳ Ingesting & Processing RAG...';
//             runIngestionBtn.disabled = true;

//             try {
//                 const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
//                 const response = await fetch('/api/admin/ingest', {
//                     method: 'POST',
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({ prompt: promptText, drive: selectedDrive })
//                 });

//                 if (response.ok) {
//                     alert('AI Ingestion successful! Question Bank and RAG Store updated.');
//                     document.getElementById('aiPromptInput').value = '';
//                 } else {
//                     alert('AI Ingestion complete. Mock vector chunks updated.');
//                 }
//             } catch (error) {
//                 console.warn('Ingestion simulated successfully.');
//                 alert('Ingestion completed! Question bank & RAG store populated.');
//             } finally {
//                 runIngestionBtn.innerHTML = originalBtnText;
//                 runIngestionBtn.disabled = false;
//             }
//         });
//     }
// });

// // Preset Prompt Loader
// function applyPreset(presetKey) {
//     const textarea = document.getElementById('aiPromptInput');
//     if (!textarea) return;

//     if (presetKey === 'tcs') {
//         textarea.value = "TCS 2026 exam benchmarks: Added 15% more questions on Data Structures, Intermediate Memory Optimization, and TAC Verification.";
//     } else if (presetKey === 'persistent') {
//         textarea.value = "Persistent Systems SPE Syllabus: Focus on Operating Systems, Multi-threading, DBMS Indexing, and System Design basics.";
//     } else if (presetKey === 'infosys') {
//         textarea.value = "Infosys DSE Syllabus: High emphasis on Pseudocode debugging, Dynamic Programming, and SQL Join queries.";
//     }
// }

// // Approve AI Market Alert Action
// function approveAlert(alertId) {
//     const alertElem = document.getElementById(alertId);
//     if (alertElem) {
//         alertElem.style.opacity = '0.4';
//         alertElem.style.pointerEvents = 'none';
//         setTimeout(() => {
//             alertElem.remove();
//             alert('AI Recommendation Approved and synced across all live test drives.');
//         }, 300);
//     }
// }

// // Reject AI Market Alert Action
// function rejectAlert(alertId) {
//     const alertElem = document.getElementById(alertId);
//     if (alertElem) {
//         alertElem.remove();
//     }
// }





// document.addEventListener('DOMContentLoaded', () => {
//     loadAdminProfile();
// });

// function loadAdminProfile() {
//     try {
//         // 1. Get token or admin profile from LocalStorage
//         const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
//         const storedAdminData = localStorage.getItem('adminUser'); // If stored during login

//         let name = 'Admin';
//         let designation = 'Placement Officer';

//         if (storedAdminData) {
//             // Option A: If you saved user object to localStorage during login
//             const admin = JSON.parse(storedAdminData);
//             name = admin.name || admin.fullName || name;
//             designation = admin.designation || admin.role || designation;
//         } else if (token) {
//             // Option B: Decode the payload directly from the JWT Token
//             const base64Url = token.split('.')[1];
//             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//             const jsonPayload = decodeURIComponent(
//                 atob(base64)
//                     .split('')
//                     .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
//                     .join('')
//             );

//             const decoded = JSON.parse(jsonPayload);
//             name = decoded.name || decoded.fullName || name;
//             designation = decoded.designation || decoded.role || designation;
//         }

//         // 2. Update top-right corner profile details
//         const nameEl = document.getElementById('navAdminName');
//         const roleEl = document.getElementById('navAdminRole');
//         const welcomeEl = document.getElementById('welcomeHeroHeading');

//         if (nameEl) nameEl.textContent = name;
//         if (roleEl) roleEl.textContent = designation;

//         // 3. Update Hero Banner Welcome Message
//         if (welcomeEl) welcomeEl.textContent = `Welcome back, ${name}`;

//     } catch (error) {
//         console.error('Error loading admin profile info:', error);
//     }
// }







function adminPage(path) { window.location.assign(path); }
function applyPreset(presetKey) {
  const textarea = document.getElementById('aiPromptInput'); if (!textarea) return;
  const presets = { tcs: 'TCS 2026 exam benchmarks: Added 15% more questions on Data Structures, Intermediate Memory Optimization, and TAC Verification.', persistent: 'Persistent Systems SPE Syllabus: Focus on Operating Systems, Multi-threading, DBMS Indexing, and System Design basics.', infosys: 'Infosys DSE Syllabus: High emphasis on Pseudocode debugging, Dynamic Programming, and SQL Join queries.' };
  textarea.value = presets[presetKey] || '';
}
function approveAlert(alertId) { const el = document.getElementById(alertId); if (el) { el.remove(); alert('AI recommendation approved.'); } }
function rejectAlert(alertId) { document.getElementById(alertId)?.remove(); }
function loadAdminProfile() {
  try {
    const stored = localStorage.getItem('adminUser'); const token = localStorage.getItem('adminToken');
    const admin = stored ? JSON.parse(stored) : token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : {};
    const name = admin.name || admin.fullName || 'Admin'; const role = admin.designation || 'Placement Officer';
    [['navAdminName', name], ['navAdminRole', role], ['welcomeHeroHeading', `Welcome back, ${name}`]].forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
  } catch (error) { console.error('Unable to load admin profile:', error); }
}
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken'); if (!token) return window.location.replace('/admin-login');
  loadAdminProfile();
  document.getElementById('themeToggle')?.addEventListener('click', () => { document.body.classList.toggle('dark-mode'); document.getElementById('themeToggle').textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙'; });
  document.getElementById('logoutBtn')?.addEventListener('click', () => { localStorage.removeItem('adminToken'); window.location.replace('/admin-login'); });
  document.getElementById('manageDrivesBtn')?.addEventListener('click', () => adminPage('/pages/admin-exams.html'));
  document.getElementById('createExamBtn')?.addEventListener('click', () => adminPage('/pages/admin-exam-builder.html'));
  document.getElementById('openProctoringBtn')?.addEventListener('click', () => adminPage('/pages/proctoring.html'));
  document.getElementById('runIngestionBtn')?.addEventListener('click', async () => {
    const prompt = document.getElementById('aiPromptInput')?.value.trim(); if (!prompt) return alert('Enter or choose a prompt first.');
    try { await fetch('/api/admin/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ prompt, drive: document.getElementById('ingestionDriveSelect')?.value }) }); alert('AI ingestion completed.'); } catch { alert('Unable to run AI ingestion.'); }
  });
});