const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('=== STARTING AUTOMATED COMPREHENSIVE QA AUDIT ===\n');
  const results = [];

  function record(id, category, item, expected, actual, pass, details = '') {
    results.push({ id, category, item, expected, actual, pass, details });
    const mark = pass ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${id}: ${category} - ${item} -> Expected: ${expected}, Got: ${actual} ${details ? '(' + details + ')' : ''}`);
  }

  // 1. Health Checks
  try {
    const h5000 = await request('http://localhost:5000/api/health');
    record('TC-01', 'Health', 'Student Server Health', 200, h5000.statusCode, h5000.statusCode === 200);
    const h5001 = await request('http://localhost:5001/api/health');
    record('TC-02', 'Health', 'Admin Server Health', 200, h5001.statusCode, h5001.statusCode === 200);
  } catch (err) {
    record('TC-01', 'Health', 'Server Reachability', 'Connected', err.message, false);
  }

  // 2. Student Portal Page Routes (Port 5000)
  const studentPages = [
    '/',
    '/login',
    '/signup',
    '/dashboard',
    '/profile',
    '/resume-analyzer',
    '/available-exams',
    '/exam-guidelines',
    '/take-exam',
    '/live-exam',
    '/exam-result',
    '/versant-test',
    '/versant-tests',
    '/versant-result',
    '/interviews',
    '/interview-room',
    '/placement-workspace',
    '/companies',
    '/company-prep',
    '/study-materials',
    '/study-reader',
    '/compiler-practice',
    '/study-practice',
    '/compiler',
    '/analytics',
    '/coding-rounds',
    '/coding-round',
    '/coding-result',
    '/company-placement-student',
    '/company-placement'
  ];

  let pId = 10;
  for (const page of studentPages) {
    try {
      const res = await request(`http://localhost:5000${page}`);
      const pass = res.statusCode >= 200 && res.statusCode < 400;
      record(`TC-${pId++}`, 'Student Pages', `GET ${page}`, '200/302', res.statusCode, pass);
    } catch (err) {
      record(`TC-${pId++}`, 'Student Pages', `GET ${page}`, '200', err.message, false);
    }
  }

  // 3. Admin Portal Page Routes (Port 5001)
  const adminPages = [
    '/admin-login',
    '/admindash',
    '/admin-dashboard',
    '/admin-exams',
    '/admin-exam-builder',
    '/admin-coding-rounds',
    '/admin-coding-builder',
    '/admin-coding-monitor',
    '/admin-coding-results',
    '/admin-interviews',
    '/admin-question-import',
    '/admin-study-materials',
    '/versant-admin',
    '/proctoring',
    '/live-proctoring',
    '/coding-result',
    '/company-placement-admin',
    '/company-placement-manager',
    '/analytics'
  ];

  let aId = 50;
  for (const page of adminPages) {
    try {
      const res = await request(`http://localhost:5001${page}`);
      const pass = res.statusCode >= 200 && res.statusCode < 400;
      record(`TC-${aId++}`, 'Admin Pages', `GET ${page}`, '200/302', res.statusCode, pass);
    } catch (err) {
      record(`TC-${aId++}`, 'Admin Pages', `GET ${page}`, '200', err.message, false);
    }
  }

  // 4. Security & Role Isolation Checks
  const secAdminPagesOnStudent = ['/admindash', '/admin-exams', '/admin-login', '/versant-admin', '/api/admin/intelligence-stats'];
  let sId = 80;
  for (const ap of secAdminPagesOnStudent) {
    try {
      const res = await request(`http://localhost:5000${ap}`);
      const pass = res.statusCode === 403;
      record(`TC-${sId++}`, 'Security Isolation', `Block Admin route on Port 5000: ${ap}`, 403, res.statusCode, pass);
    } catch (err) {
      record(`TC-${sId++}`, 'Security Isolation', `Block Admin route on Port 5000: ${ap}`, 403, err.message, false);
    }
  }

  // 5. Auth Flow & Disposable Account Creation
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testStudentEmail = `qa_test_student_${randomSuffix}@placementpro.edu`;
  const testPassword = 'Password@123';
  let studentToken = null;

  try {
    const signupRes = await request('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `QA Student ${randomSuffix}`,
        email: testStudentEmail,
        password: testPassword
      }
    });
    let signupData = {};
    try { signupData = JSON.parse(signupRes.body); } catch (_) {}
    studentToken = signupData.token;
    record('TC-90', 'Auth Journey', 'Student Registration', '201 with Token', `${signupRes.statusCode} Token: ${Boolean(studentToken)}`, signupRes.statusCode === 201 && Boolean(studentToken));
  } catch (err) {
    record('TC-90', 'Auth Journey', 'Student Registration', '201', err.message, false);
  }

  // 6. Student Login
  try {
    const loginRes = await request('http://localhost:5000/api/auth/student-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: testStudentEmail,
        password: testPassword
      }
    });
    let loginData = {};
    try { loginData = JSON.parse(loginRes.body); } catch (_) {}
    if (loginData.token) studentToken = loginData.token;
    record('TC-91', 'Auth Journey', 'Student Login', '200 with Token', `${loginRes.statusCode} Token: ${Boolean(loginData.token)}`, loginRes.statusCode === 200 && Boolean(loginData.token));
  } catch (err) {
    record('TC-91', 'Auth Journey', 'Student Login', '200', err.message, false);
  }

  // 7. Admin Login (Port 5001)
  let adminToken = null;
  try {
    const adminLoginRes = await request('http://localhost:5001/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'pproadmin@gmail.com',
        password: 'pproadmin@123'
      }
    });
    let adminData = {};
    try { adminData = JSON.parse(adminLoginRes.body); } catch (_) {}
    adminToken = adminData.token;
    record('TC-92', 'Auth Journey', 'Admin Login', '200 with Token', `${adminLoginRes.statusCode} Token: ${Boolean(adminToken)}`, adminLoginRes.statusCode === 200 && Boolean(adminToken));
  } catch (err) {
    record('TC-92', 'Auth Journey', 'Admin Login', '200', err.message, false);
  }

  // 8. Authenticated Student APIs (Port 5000)
  if (studentToken) {
    const studentAPIs = [
      { name: 'Student Profile', url: 'http://localhost:5000/api/student/profile' },
      { name: 'Available Exams', url: 'http://localhost:5000/api/exams/available' },
      { name: 'Study Subjects', url: 'http://localhost:5000/api/study/subjects' },
      { name: 'Company Directory', url: 'http://localhost:5000/api/companies' },
      { name: 'Student Mock Interviews', url: 'http://localhost:5000/api/interviews/student' },
      { name: 'Student Coding Rounds', url: 'http://localhost:5000/api/coding/student/rounds' },
      { name: 'Progress Summary', url: 'http://localhost:5000/api/progress/summary' },
      { name: 'Student Analytics', url: 'http://localhost:5000/api/analytics' }
    ];

    let apiId = 100;
    for (const api of studentAPIs) {
      try {
        const res = await request(api.url, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        const pass = res.statusCode === 200;
        record(`TC-${apiId++}`, 'Student API', api.name, 200, res.statusCode, pass);
      } catch (err) {
        record(`TC-${apiId++}`, 'Student API', api.name, 200, err.message, false);
      }
    }
  }

  // 9. Authenticated Admin APIs (Port 5001)
  if (adminToken) {
    const adminAPIs = [
      { name: 'Admin Intelligence Stats', url: 'http://localhost:5001/api/admin/intelligence-stats' },
      { name: 'Admin Exams List', url: 'http://localhost:5001/api/exams/admin' },
      { name: 'Admin Interview Sets', url: 'http://localhost:5001/api/interviews/admin/sets' },
      { name: 'Admin Coding Rounds', url: 'http://localhost:5001/api/coding/admin/rounds' },
      { name: 'Admin Versant Tests', url: 'http://localhost:5001/api/versant/admin/tests' },
      { name: 'Admin Companies', url: 'http://localhost:5001/api/companies' }
    ];

    let admApiId = 120;
    for (const api of adminAPIs) {
      try {
        const res = await request(api.url, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const pass = res.statusCode === 200;
        record(`TC-${admApiId++}`, 'Admin API', api.name, 200, res.statusCode, pass);
      } catch (err) {
        record(`TC-${admApiId++}`, 'Admin API', api.name, 200, err.message, false);
      }
    }
  }

  // 10. Summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== QA AUDIT COMPLETE ===`);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
}

run();
