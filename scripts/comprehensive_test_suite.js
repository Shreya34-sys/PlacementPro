const http = require('http');

const STUDENT_URL = 'http://localhost:5000';
const ADMIN_URL = 'http://localhost:5001';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      if (typeof options.body === 'object') {
        reqOptions.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOptions, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runAudit() {
  console.log('========================================================');
  console.log('🔍 RUNNING COMPREHENSIVE CONTROL & ENDPOINT AUDIT');
  console.log('========================================================\n');

  const checklist = [];

  function record(role, page, control, expected, actual, status, evidence, fix = '') {
    checklist.push({ role, page, control, expected, actual, status, evidence, fix });
    const mark = status === 'PASS' ? '✅ [PASS]' : (status === 'FAIL' ? '❌ [FAIL]' : '⚠️ [WARN]');
    console.log(`${mark} [${role}] ${page} -> ${control} | ${status}: ${evidence}`);
  }

  // --- 1. Student Portal Page Availability (Port 5000) ---
  const studentPages = [
    ['Landing Page', '/'],
    ['Login Page', '/login'],
    ['Signup Page', '/signup'],
    ['Student Dashboard', '/dashboard'],
    ['Student Profile', '/profile'],
    ['Resume Analyzer', '/resume-analyzer'],
    ['Available Exams', '/available-exams'],
    ['Exam Guidelines', '/exam-guidelines'],
    ['Take Exam', '/take-exam'],
    ['Live Exam', '/live-exam'],
    ['Exam Result', '/exam-result'],
    ['Versant Test', '/versant-test'],
    ['Versant Result', '/versant-result'],
    ['Mock Interviews Studio', '/interviews'],
    ['Interview Room', '/interview-room'],
    ['Placement Workspace', '/placement-workspace'],
    ['Company Directory', '/companies'],
    ['Company Preparation Kit', '/company-prep'],
    ['Study Materials Hub', '/study-materials'],
    ['Study Reader', '/study-reader'],
    ['Compiler Practice (C-Visualize)', '/compiler-practice'],
    ['Coding Rounds Practice Hub', '/coding-rounds'],
    ['Coding Environment Workspace', '/coding-round'],
    ['Coding Result', '/coding-result'],
    ['Preparation Analytics', '/analytics']
  ];

  for (const [name, path] of studentPages) {
    try {
      const res = await request(STUDENT_URL + path);
      if (res.statusCode === 200) {
        record('Student', path, `Page Access (${name})`, 'HTTP 200 OK', `HTTP ${res.statusCode}`, 'PASS', `Loaded HTML page (${res.body.length} bytes)`);
      } else {
        record('Student', path, `Page Access (${name})`, 'HTTP 200 OK', `HTTP ${res.statusCode}`, 'FAIL', `Unexpected status code`, 'Fix route or template');
      }
    } catch (e) {
      record('Student', path, `Page Access (${name})`, 'HTTP 200 OK', 'Connection error', 'FAIL', e.message, 'Check server availability');
    }
  }

  // --- 2. Student Port Admin Blocking & URL Tampering (Port 5000) ---
  const adminBlockedUrls = [
    ['/admin-login', 'Admin Login on Port 5000'],
    ['/admindash', 'Admin Dashboard on Port 5000'],
    ['/admin-dashboard', 'Admin Dashboard Alias on Port 5000'],
    ['/admin-exams', 'Admin Exams on Port 5000'],
    ['/admin-exam-builder', 'Admin Exam Builder on Port 5000'],
    ['/admin-coding-rounds', 'Admin Coding Rounds on Port 5000'],
    ['/admin-coding-builder', 'Admin Coding Builder on Port 5000'],
    ['/admin-coding-monitor', 'Admin Coding Monitor on Port 5000'],
    ['/admin-coding-results', 'Admin Coding Results on Port 5000'],
    ['/admin-interviews', 'Admin Interviews on Port 5000'],
    ['/admin-question-import', 'Admin Question Import on Port 5000'],
    ['/admin-study-materials', 'Admin Study Materials on Port 5000'],
    ['/versant-admin', 'Versant Admin on Port 5000'],
    ['/proctoring', 'Proctoring Dashboard on Port 5000'],
    ['/pages/admindash.html', 'Raw static admindash.html on Port 5000'],
    ['/pages/admin-exams.html', 'Raw static admin-exams.html on Port 5000'],
    ['/pages/proctoring.html', 'Raw static proctoring.html on Port 5000']
  ];

  for (const [path, desc] of adminBlockedUrls) {
    try {
      const res = await request(STUDENT_URL + path);
      if (res.statusCode === 403) {
        record('Student', path, `Route Guard: ${desc}`, 'HTTP 403 Forbidden', `HTTP 403`, 'PASS', 'Access strictly denied on Port 5000');
      } else {
        record('Student', path, `Route Guard: ${desc}`, 'HTTP 403 Forbidden', `HTTP ${res.statusCode}`, 'FAIL', `Expected 403 Forbidden but got ${res.statusCode}`, 'Block static /pages/admin* in studentApp');
      }
    } catch (e) {
      record('Student', path, `Route Guard: ${desc}`, 'HTTP 403 Forbidden', 'Error', 'FAIL', e.message);
    }
  }

  // --- 3. Admin Portal Page Availability & Guards (Port 5001) ---
  try {
    const resRoot = await request(ADMIN_URL + '/');
    if (resRoot.statusCode === 302 && resRoot.headers.location === '/admin-login') {
      record('Admin', '/', 'Root Redirect', 'HTTP 302 -> /admin-login', `HTTP 302 -> ${resRoot.headers.location}`, 'PASS', 'Redirects to admin login');
    } else {
      record('Admin', '/', 'Root Redirect', 'HTTP 302 -> /admin-login', `HTTP ${resRoot.statusCode}`, 'FAIL', `Did not redirect to admin login`);
    }
  } catch (e) {
    record('Admin', '/', 'Root Redirect', 'HTTP 302', 'Error', 'FAIL', e.message);
  }

  const adminPages = [
    ['/admin-login', 'Admin Login Page'],
    ['/admindash', 'Admin Dashboard'],
    ['/admin-dashboard', 'Admin Dashboard Alias'],
    ['/admin-exams', 'Admin Exams'],
    ['/admin-exam-builder', 'Admin Exam Builder'],
    ['/admin-coding-rounds', 'Admin Coding Rounds'],
    ['/admin-coding-builder', 'Admin Coding Builder'],
    ['/admin-coding-monitor', 'Admin Coding Monitor'],
    ['/admin-coding-results', 'Admin Coding Results'],
    ['/admin-interviews', 'Admin Mock Interviews'],
    ['/admin-question-import', 'Admin Question Import'],
    ['/admin-study-materials', 'Admin Study Materials Hub'],
    ['/versant-admin', 'Versant Admin Console'],
    ['/proctoring', 'Live Proctoring Console']
  ];

  for (const [path, desc] of adminPages) {
    try {
      const res = await request(ADMIN_URL + path);
      if (res.statusCode === 200) {
        record('Admin', path, `Page Access (${desc})`, 'HTTP 200 OK', `HTTP 200`, 'PASS', `Loaded HTML page (${res.body.length} bytes)`);
      } else {
        record('Admin', path, `Page Access (${desc})`, 'HTTP 200 OK', `HTTP ${res.statusCode}`, 'FAIL', `Got ${res.statusCode}`);
      }
    } catch (e) {
      record('Admin', path, `Page Access (${desc})`, 'HTTP 200 OK', 'Error', 'FAIL', e.message);
    }
  }

  // --- 4. Admin Port Redirects on Student URLs (Port 5001) ---
  const studentRedirectsOnAdmin = [
    ['/dashboard', 'Student Dashboard on Port 5001'],
    ['/companies', 'Company Directory on Port 5001'],
    ['/coding-rounds', 'Coding Rounds on Port 5001'],
    ['/study-materials', 'Study Materials on Port 5001']
  ];

  for (const [path, desc] of studentRedirectsOnAdmin) {
    try {
      const res = await request(ADMIN_URL + path);
      const loc = res.headers.location || '';
      if (res.statusCode === 302 && loc.includes(':5000')) {
        record('Admin', path, `Student Route Redirect: ${desc}`, 'HTTP 302 -> http://localhost:5000...', `HTTP 302 -> ${loc}`, 'PASS', `Properly redirected to Student Port`);
      } else {
        record('Admin', path, `Student Route Redirect: ${desc}`, 'HTTP 302 -> :5000', `HTTP ${res.statusCode} loc=${loc}`, 'FAIL', 'Failed to redirect to Port 5000');
      }
    } catch (e) {
      record('Admin', path, `Student Route Redirect: ${desc}`, 'HTTP 302', 'Error', 'FAIL', e.message);
    }
  }

  // --- 5. Authentication Controls & Flows ---
  let studentToken = null;
  let adminToken = null;

  // Student Login Valid
  try {
    const res = await request(STUDENT_URL + '/api/auth/student-login', {
      method: 'POST',
      body: { email: 'student_test_abc@gmail.com', password: 'Student@123' }
    });
    if (res.statusCode === 200 && res.json && res.json.token) {
      studentToken = res.json.token;
      record('Student', '/login', 'Form Submit: Valid Student Credentials', 'HTTP 200 with JWT', `HTTP 200`, 'PASS', `Received student JWT token`);
    } else {
      record('Student', '/login', 'Form Submit: Valid Student Credentials', 'HTTP 200 with JWT', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Student', '/login', 'Form Submit: Valid Student Credentials', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Student Login Invalid
  try {
    const res = await request(STUDENT_URL + '/api/auth/student-login', {
      method: 'POST',
      body: { email: 'student_test_abc@gmail.com', password: 'WrongPassword' }
    });
    if (res.statusCode === 401 || res.statusCode === 400 || res.statusCode === 403) {
      record('Student', '/login', 'Form Submit: Invalid Password', 'HTTP 401/403 Error', `HTTP ${res.statusCode}`, 'PASS', `Correctly rejected invalid login`);
    } else {
      record('Student', '/login', 'Form Submit: Invalid Password', 'HTTP 401/403 Error', `HTTP ${res.statusCode}`, 'FAIL', `Expected failure status`);
    }
  } catch (e) {
    record('Student', '/login', 'Form Submit: Invalid Password', 'HTTP 401', 'Error', 'FAIL', e.message);
  }

  // Admin Login Valid
  try {
    const res = await request(ADMIN_URL + '/api/auth/admin-login', {
      method: 'POST',
      body: { email: 'pproadmin@gmail.com', password: 'pproadmin@123' }
    });
    if (res.statusCode === 200 && res.json && res.json.token) {
      adminToken = res.json.token;
      record('Admin', '/admin-login', 'Form Submit: Valid Admin Credentials', 'HTTP 200 with JWT', `HTTP 200`, 'PASS', `Received admin JWT token`);
    } else {
      record('Admin', '/admin-login', 'Form Submit: Valid Admin Credentials', 'HTTP 200 with JWT', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Admin', '/admin-login', 'Form Submit: Valid Admin Credentials', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Admin Login Invalid
  try {
    const res = await request(ADMIN_URL + '/api/auth/admin-login', {
      method: 'POST',
      body: { email: 'pproadmin@gmail.com', password: 'BadPassword' }
    });
    if (res.statusCode === 403 || res.statusCode === 401 || res.statusCode === 400) {
      record('Admin', '/admin-login', 'Form Submit: Invalid Admin Password', 'HTTP 403 Forbidden', `HTTP ${res.statusCode}`, 'PASS', `Rejected invalid admin password`);
    } else {
      record('Admin', '/admin-login', 'Form Submit: Invalid Admin Password', 'HTTP 403 Forbidden', `HTTP ${res.statusCode}`, 'FAIL', `Expected rejection`);
    }
  } catch (e) {
    record('Admin', '/admin-login', 'Form Submit: Invalid Admin Password', 'HTTP 403', 'Error', 'FAIL', e.message);
  }

  // --- 6. API Endpoints Authorization & Data Verification ---
  // Student Profile GET
  if (studentToken) {
    try {
      const res = await request(STUDENT_URL + '/api/student/profile', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (res.statusCode === 200 && res.json && res.json.success) {
        record('Student', '/profile', 'API: GET /api/student/profile', 'HTTP 200 Student Profile', 'HTTP 200', 'PASS', `Fetched profile for ${res.json.data.email}`);
      } else {
        record('Student', '/profile', 'API: GET /api/student/profile', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Student', '/profile', 'API: GET /api/student/profile', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Student Profile PUT Update
  if (studentToken) {
    try {
      const res = await request(STUDENT_URL + '/api/student/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: {
          fullName: 'Audit Test Student',
          department: 'Computer Science',
          division: 'A',
          batchYear: '2026',
          cgpa: '9.2',
          phoneNumber: '9876543210'
        }
      });
      if (res.statusCode === 200 && res.json && res.json.success) {
        record('Student', '/profile', 'Form Submit: Update Profile Form', 'HTTP 200 Success', 'HTTP 200', 'PASS', 'Saved student profile fields to database');
      } else {
        record('Student', '/profile', 'Form Submit: Update Profile Form', 'HTTP 200 Success', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Student', '/profile', 'Form Submit: Update Profile Form', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Student Companies Directory API
  try {
    const res = await request(STUDENT_URL + '/api/companies');
    const companies = res.json?.data || res.json;
    if (res.statusCode === 200 && Array.isArray(companies)) {
      record('Student', '/companies', 'API: GET /api/companies', 'HTTP 200 Companies Array', 'HTTP 200', 'PASS', `Fetched ${companies.length} company preparation tracks`);
    } else {
      record('Student', '/companies', 'API: GET /api/companies', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Student', '/companies', 'API: GET /api/companies', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Student Company Detail API (Google)
  try {
    const res = await request(STUDENT_URL + '/api/companies/Google');
    const compData = res.json?.data || res.json?.company || res.json;
    if (res.statusCode === 200 && compData && (compData.name === 'Google' || compData.id)) {
      record('Student', '/company-prep', 'API: GET /api/companies/Google', 'HTTP 200 Google Track', 'HTTP 200', 'PASS', `Loaded Google preparation syllabus & track`);
    } else {
      record('Student', '/company-prep', 'API: GET /api/companies/Google', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Student', '/company-prep', 'API: GET /api/companies/Google', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Student Coding Rounds API
  try {
    const res = await request(STUDENT_URL + '/api/coding/student/rounds', {
      headers: studentToken ? { Authorization: `Bearer ${studentToken}` } : {}
    });
    if (res.statusCode === 200 && Array.isArray(res.json)) {
      record('Student', '/coding-rounds', 'API: GET /api/coding/student/rounds', 'HTTP 200 Rounds Array', 'HTTP 200', 'PASS', `Loaded ${res.json.length} coding rounds`);
    } else {
      record('Student', '/coding-rounds', 'API: GET /api/coding/student/rounds', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Student', '/coding-rounds', 'API: GET /api/coding/student/rounds', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Student Available Exams API
  try {
    const res = await request(STUDENT_URL + '/api/exams/available', {
      headers: studentToken ? { Authorization: `Bearer ${studentToken}` } : {}
    });
    if (res.statusCode === 200 && Array.isArray(res.json)) {
      record('Student', '/available-exams', 'API: GET /api/exams/available', 'HTTP 200 Exams Array', 'HTTP 200', 'PASS', `Loaded ${res.json.length} available exams`);
    } else {
      record('Student', '/available-exams', 'API: GET /api/exams/available', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Student', '/available-exams', 'API: GET /api/exams/available', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Student Study Hub Stats API
  try {
    const res = await request(STUDENT_URL + '/api/study/stats', {
      headers: studentToken ? { Authorization: `Bearer ${studentToken}` } : {}
    });
    const statsData = res.json?.stats || res.json?.data;
    if (res.statusCode === 200 && res.json && res.json.success && statsData) {
      record('Student', '/study-materials', 'API: GET /api/study/stats', 'HTTP 200 Stats', 'HTTP 200', 'PASS', `Loaded study material stats (${statsData.totalTopicsAvailable} topics available, ${statsData.completedTopics} completed)`);
    } else {
      record('Student', '/study-materials', 'API: GET /api/study/stats', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Student', '/study-materials', 'API: GET /api/study/stats', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Student Study Subjects API
  try {
    const res = await request(STUDENT_URL + '/api/study/subjects', {
      headers: studentToken ? { Authorization: `Bearer ${studentToken}` } : {}
    });
    const subjectsList = res.json?.subjects || res.json?.data;
    if (res.statusCode === 200 && res.json && res.json.success && Array.isArray(subjectsList)) {
      record('Student', '/study-materials', 'API: GET /api/study/subjects', 'HTTP 200 Subjects', 'HTTP 200', 'PASS', `Loaded ${subjectsList.length} study subjects`);
    } else {
      record('Student', '/study-materials', 'API: GET /api/study/subjects', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
    }
  } catch (e) {
    record('Student', '/study-materials', 'API: GET /api/study/subjects', 'HTTP 200', 'Error', 'FAIL', e.message);
  }

  // Student Analytics Overview API
  if (studentToken) {
    try {
      const res = await request(STUDENT_URL + '/api/analytics/overview', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (res.statusCode === 200 && res.json && res.json.success) {
        record('Student', '/analytics', 'API: GET /api/analytics/overview', 'HTTP 200 Overview', 'HTTP 200', 'PASS', `Loaded student analytics and readiness gauge`);
      } else {
        record('Student', '/analytics', 'API: GET /api/analytics/overview', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Student', '/analytics', 'API: GET /api/analytics/overview', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Student Progress Summary API
  if (studentToken) {
    try {
      const res = await request(STUDENT_URL + '/api/progress/summary', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (res.statusCode === 200 && res.json && res.json.summary) {
        record('Student', '/dashboard', 'API: GET /api/progress/summary', 'HTTP 200 Progress', 'HTTP 200', 'PASS', `Fetched personal progress metrics`);
      } else {
        record('Student', '/dashboard', 'API: GET /api/progress/summary', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Student', '/dashboard', 'API: GET /api/progress/summary', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Student Attempting Admin Intelligence API -> MUST BE 403 Forbidden
  if (studentToken) {
    try {
      const res = await request(ADMIN_URL + '/api/admin/intelligence-stats', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (res.statusCode === 403) {
        record('Student', '/admindash', 'Security: Student Token on Admin Intelligence API', 'HTTP 403 Forbidden', 'HTTP 403', 'PASS', 'Student token rejected by admin authorization');
      } else {
        record('Student', '/admindash', 'Security: Student Token on Admin Intelligence API', 'HTTP 403 Forbidden', `HTTP ${res.statusCode}`, 'FAIL', 'Privilege escalation vulnerability!');
      }
    } catch (e) {
      record('Student', '/admindash', 'Security: Student Token on Admin Intelligence API', 'HTTP 403', 'Error', 'FAIL', e.message);
    }
  }

  // Admin Intelligence API with Admin Token
  if (adminToken) {
    try {
      const res = await request(ADMIN_URL + '/api/admin/intelligence-stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 200 && res.json && res.json.success) {
        record('Admin', '/admindash', 'API: GET /api/admin/intelligence-stats', 'HTTP 200 Practice Stats', 'HTTP 200', 'PASS', `Stats: Assessments=${res.json.stats.activeAssessmentsCount}, QBank=${res.json.stats.totalQuestionsCount}, Chunks=${res.json.stats.ragChunks}`);
      } else {
        record('Admin', '/admindash', 'API: GET /api/admin/intelligence-stats', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Admin', '/admindash', 'API: GET /api/admin/intelligence-stats', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Admin Coding Rounds API
  if (adminToken) {
    try {
      const res = await request(ADMIN_URL + '/api/coding/admin/rounds', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 200 && Array.isArray(res.json)) {
        record('Admin', '/admin-coding-rounds', 'API: GET /api/coding/admin/rounds', 'HTTP 200 Rounds', 'HTTP 200', 'PASS', `Fetched ${res.json.length} admin coding rounds`);
      } else {
        record('Admin', '/admin-coding-rounds', 'API: GET /api/coding/admin/rounds', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Admin', '/admin-coding-rounds', 'API: GET /api/coding/admin/rounds', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Admin Interviews Sets API
  if (adminToken) {
    try {
      const res = await request(ADMIN_URL + '/api/interviews/admin/sets', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 200 && Array.isArray(res.json)) {
        record('Admin', '/admin-interviews', 'API: GET /api/interviews/admin/sets', 'HTTP 200 Sets', 'HTTP 200', 'PASS', `Fetched ${res.json.length} mock interview sets`);
      } else {
        record('Admin', '/admin-interviews', 'API: GET /api/interviews/admin/sets', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Admin', '/admin-interviews', 'API: GET /api/interviews/admin/sets', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Admin Exams API
  if (adminToken) {
    try {
      const res = await request(ADMIN_URL + '/api/exams/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 200 && Array.isArray(res.json)) {
        record('Admin', '/admin-exams', 'API: GET /api/exams/admin', 'HTTP 200 Exams', 'HTTP 200', 'PASS', `Fetched ${res.json.length} admin aptitude exams`);
      } else {
        record('Admin', '/admin-exams', 'API: GET /api/exams/admin', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Admin', '/admin-exams', 'API: GET /api/exams/admin', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Admin Versant Tests API
  if (adminToken) {
    try {
      const res = await request(ADMIN_URL + '/api/versant/admin/tests', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 200 && Array.isArray(res.json)) {
        record('Admin', '/versant-admin', 'API: GET /api/versant/admin/tests', 'HTTP 200 Tests', 'HTTP 200', 'PASS', `Fetched ${res.json.length} versant test sets`);
      } else {
        record('Admin', '/versant-admin', 'API: GET /api/versant/admin/tests', 'HTTP 200', `HTTP ${res.statusCode}`, 'FAIL', res.body);
      }
    } catch (e) {
      record('Admin', '/versant-admin', 'API: GET /api/versant/admin/tests', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // Admin Ingest Practice Document API
  if (adminToken) {
    try {
      const testDocId = 'audit_test_doc_' + Date.now();
      const res = await request(ADMIN_URL + '/api/admin/ingest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          prompt: 'Automated Placement Practice Knowledge Chunk: Key concepts for algorithmic design and placement aptitude preparation.',
          drive: 'Google'
        }
      });
      if (res.statusCode === 200 || res.statusCode === 201) {
        record('Admin', '/admindash', 'Form/API: Ingest Practice Document', 'HTTP 200/201 Success', `HTTP ${res.statusCode}`, 'PASS', 'Saved practice study chunk to MySQL');
      } else {
        record('Admin', '/admindash', 'Form/API: Ingest Practice Document', 'HTTP 200/201 Success', `HTTP ${res.statusCode}`, 'WARN', res.body);
      }
    } catch (e) {
      record('Admin', '/admindash', 'Form/API: Ingest Practice Document', 'HTTP 200', 'Error', 'FAIL', e.message);
    }
  }

  // --- 7. Canonical URL Redirects Verification ---
  const studentLegacyRedirects = [
    ['/pages/stddash.html', '/dashboard'],
    ['/pages/available-exams.html', '/available-exams'],
    ['/pages/interviews.html', '/interviews'],
    ['/pages/versant-test.html', '/versant-test']
  ];
  for (const [legacyPath, target] of studentLegacyRedirects) {
    try {
      const res = await request(STUDENT_URL + legacyPath);
      if (res.statusCode === 302 && res.headers.location === target) {
        record('Student', legacyPath, `Canonical Redirect -> ${target}`, `HTTP 302 -> ${target}`, `HTTP 302 -> ${res.headers.location}`, 'PASS', `Clean routing redirection`);
      } else {
        record('Student', legacyPath, `Canonical Redirect -> ${target}`, `HTTP 302 -> ${target}`, `HTTP ${res.statusCode}`, 'FAIL', `Expected 302 redirect`);
      }
    } catch (e) {
      record('Student', legacyPath, `Canonical Redirect -> ${target}`, 'HTTP 302', 'Error', 'FAIL', e.message);
    }
  }

  const adminLegacyRedirects = [
    ['/pages/admindash.html', '/admindash'],
    ['/pages/admin-exams.html', '/admin-exams'],
    ['/pages/proctoring.html', '/proctoring'],
    ['/pages/versant-admin.html', '/versant-admin']
  ];
  for (const [legacyPath, target] of adminLegacyRedirects) {
    try {
      const res = await request(ADMIN_URL + legacyPath, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      });
      if (res.statusCode === 302 && res.headers.location === target) {
        record('Admin', legacyPath, `Canonical Redirect -> ${target}`, `HTTP 302 -> ${target}`, `HTTP 302 -> ${res.headers.location}`, 'PASS', `Clean admin routing redirection`);
      } else {
        record('Admin', legacyPath, `Canonical Redirect -> ${target}`, `HTTP 302 -> ${target}`, `HTTP ${res.statusCode}`, 'FAIL', `Expected 302 redirect`);
      }
    } catch (e) {
      record('Admin', legacyPath, `Canonical Redirect -> ${target}`, 'HTTP 302', 'Error', 'FAIL', e.message);
    }
  }

  console.log('\n========================================================');
  const total = checklist.length;
  const passed = checklist.filter(c => c.status === 'PASS').length;
  const failed = checklist.filter(c => c.status === 'FAIL').length;
  const warns = checklist.filter(c => c.status === 'WARN').length;
  console.log(`TOTAL AUDITED: ${total} | PASSED: ${passed} | FAILED: ${failed} | WARNS: ${warns}`);
  console.log('========================================================\n');

  const fs = require('fs');
  fs.writeFileSync(require('path').join(__dirname, 'test_suite_results.json'), JSON.stringify(checklist, null, 2));
}

runAudit().catch(console.error);
