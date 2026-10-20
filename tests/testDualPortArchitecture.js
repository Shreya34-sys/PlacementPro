const http = require('http');

const STUDENT_BASE = 'http://127.0.0.1:5000';
const ADMIN_BASE = 'http://127.0.0.1:5001';

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING DUAL-PORT ARCHITECTURE VERIFICATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: STUDENT PANEL ON PORT 5000
    // ----------------------------------------------------
    console.log('--- TEST SUITE 1: Student Panel (Port 5000) ---');

    // 1. Landing Page
    const landing = await request(`${STUDENT_BASE}/`);
    assert(landing.statusCode === 200, 'Student landing page loads at http://localhost:5000/ (HTTP 200)');

    // 2. Student Login Page
    const stdLogin = await request(`${STUDENT_BASE}/login`);
    assert(stdLogin.statusCode === 200, 'Student login page loads at http://localhost:5000/login (HTTP 200)');

    // 3. Student Signup Page
    const stdSignup = await request(`${STUDENT_BASE}/signup`);
    assert(stdSignup.statusCode === 200, 'Student signup page loads at http://localhost:5000/signup (HTTP 200)');

    // 4. Student Navigation / Feature Pages
    const pages = ['/dashboard', '/coding-rounds', '/companies', '/company-prep', '/available-exams', '/study-materials'];
    for (const p of pages) {
      const res = await request(`${STUDENT_BASE}${p}`);
      assert(res.statusCode === 200, `Student feature page ${p} loads on port 5000 (HTTP 200)`);
    }

    // 5. Student Login API
    const loginRes = await request(`${STUDENT_BASE}/api/auth/student-login`, {
      method: 'POST',
      body: { email: 'student_test_abc@gmail.com', password: 'Student@123' }
    });
    assert(loginRes.statusCode === 200 && loginRes.json?.token, 'Student login succeeds via /api/auth/student-login on port 5000', `Status: ${loginRes.statusCode}`);
    const studentToken = loginRes.json?.token;

    // ----------------------------------------------------
    // TEST SUITE 2: STUDENT PORT SECURITY & ADMIN URL BLOCKING
    // ----------------------------------------------------
    console.log('\n--- TEST SUITE 2: Student Port Security & Route Guards ---');

    // 6. Block admin HTML pages on port 5000
    const adminPagesOnStudentPort = ['/admin-login', '/admindash', '/admin-dashboard', '/admin-coding-rounds', '/admin-exams', '/admin-interviews', '/versant-admin', '/proctoring'];
    for (const ap of adminPagesOnStudentPort) {
      const blocked = await request(`${STUDENT_BASE}${ap}`);
      assert(blocked.statusCode === 403, `Admin URL ${ap} is blocked with HTTP 403 on port 5000`, `Got status: ${blocked.statusCode}`);
    }

    // 7. Block admin APIs on port 5000
    const adminApisOnStudentPort = [
      { path: '/api/admin/intelligence-stats', method: 'GET' },
      { path: '/api/coding/admin/rounds', method: 'GET' },
      { path: '/api/interviews/admin/sets', method: 'GET' },
      { path: '/api/auth/admin-login', method: 'POST', body: { email: 'pproadmin@gmail.com', password: 'xyz' } }
    ];
    for (const api of adminApisOnStudentPort) {
      const blocked = await request(`${STUDENT_BASE}${api.path}`, { method: api.method, body: api.body });
      assert(blocked.statusCode === 403 && blocked.json?.success === false, `Admin API ${api.path} is blocked on port 5000 with HTTP 403 Forbidden`, `Got: ${blocked.statusCode}`);
    }

    // ----------------------------------------------------
    // TEST SUITE 3: ADMIN PANEL ON PORT 5001
    // ----------------------------------------------------
    console.log('\n--- TEST SUITE 3: Admin Panel (Port 5001) ---');

    // 8. Admin Root redirects to /admin-login
    const adminRoot = await request(`${ADMIN_BASE}/`);
    assert(adminRoot.statusCode === 302 && adminRoot.headers.location === '/admin-login', 'Admin root / redirects to /admin-login on port 5001 (HTTP 302)');

    // 9. Admin Login Page
    const adminLoginPage = await request(`${ADMIN_BASE}/admin-login`);
    assert(adminLoginPage.statusCode === 200, 'Admin login page loads at http://localhost:5001/admin-login (HTTP 200)');

    // 10. Student pages on Port 5001 redirect to Port 5000
    const studentUrlsOnAdminPort = ['/dashboard', '/coding-rounds', '/companies'];
    for (const su of studentUrlsOnAdminPort) {
      const redirected = await request(`${ADMIN_BASE}${su}`);
      assert(redirected.statusCode === 302 && redirected.headers.location?.includes('5000'), `Student page ${su} on port 5001 redirects to port 5000 (HTTP 302 -> ${redirected.headers.location})`);
    }

    // 11. Admin Pages load on Port 5001
    const adminHtmlPages = ['/admindash', '/admin-dashboard', '/admin-exams', '/admin-coding-rounds', '/admin-interviews', '/admin-question-import'];
    for (const ah of adminHtmlPages) {
      const res = await request(`${ADMIN_BASE}${ah}`);
      assert(res.statusCode === 200, `Admin page ${ah} loads on port 5001 (HTTP 200)`);
    }

    // 12. Admin Login API on Port 5001
    const badAdminLogin = await request(`${ADMIN_BASE}/api/auth/admin-login`, {
      method: 'POST',
      body: { email: 'pproadmin@gmail.com', password: 'wrongpassword' }
    });
    assert(badAdminLogin.statusCode === 403, 'Admin login with invalid password rejected (HTTP 403)');

    const adminLoginRes = await request(`${ADMIN_BASE}/api/auth/admin-login`, {
      method: 'POST',
      body: { email: 'pproadmin@gmail.com', password: 'pproadmin@123' }
    });
    assert(adminLoginRes.statusCode === 200 && adminLoginRes.json?.token, 'Admin login succeeds via /api/auth/admin-login on port 5001', `Status: ${adminLoginRes.statusCode}`);
    const adminToken = adminLoginRes.json?.token;

    // ----------------------------------------------------
    // TEST SUITE 4: ADMIN AUTHORIZATION & API SECURITY
    // ----------------------------------------------------
    console.log('\n--- TEST SUITE 4: Admin API Authorization & Token Role Verification ---');

    // 13. Admin API with valid Admin Token
    const adminStats = await request(`${ADMIN_BASE}/api/admin/intelligence-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminStats.statusCode === 200, 'Admin API /api/admin/intelligence-stats returns 200 with Admin token');

    const adminCodingRounds = await request(`${ADMIN_BASE}/api/coding/admin/rounds`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminCodingRounds.statusCode === 200 && Array.isArray(adminCodingRounds.json), `Admin API /api/coding/admin/rounds returns 200 with list of rounds (${adminCodingRounds.json?.length || 0} rounds)`);

    // 14. Admin API with Student Token -> MUST BE 403 FORBIDDEN
    const studentBlockedFromCodingAdmin = await request(`${ADMIN_BASE}/api/coding/admin/rounds`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentBlockedFromCodingAdmin.statusCode === 403, 'Admin coding API /api/coding/admin/rounds REJECTS student token with HTTP 403');

    const studentBlockedFromAdminStats = await request(`${ADMIN_BASE}/api/admin/intelligence-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentBlockedFromAdminStats.statusCode === 403, 'Admin intelligence API /api/admin/intelligence-stats REJECTS student token with HTTP 403');

    // 15. Admin API without Token -> MUST BE 401 UNAUTHORIZED
    const noTokenCoding = await request(`${ADMIN_BASE}/api/coding/admin/rounds`);
    assert(noTokenCoding.statusCode === 401, 'Admin API without token rejected with HTTP 401');

    // ----------------------------------------------------
    // TEST SUITE 5: CORS HEADERS BETWEEN ORIGINS
    // ----------------------------------------------------
    console.log('\n--- TEST SUITE 5: Cross-Origin Resource Sharing (CORS) ---');

    const corsFrom5000 = await request(`${ADMIN_BASE}/api/auth/admin-login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5000',
        'Access-Control-Request-Method': 'POST'
      }
    });
    assert(corsFrom5000.headers['access-control-allow-origin'] === 'http://localhost:5000' && corsFrom5000.headers['access-control-allow-credentials'] === 'true', 'Port 5001 allows CORS requests from http://localhost:5000 with credentials: true');

    const corsFrom5001 = await request(`${STUDENT_BASE}/api/coding/student/rounds`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5001',
        'Access-Control-Request-Method': 'GET'
      }
    });
    assert(corsFrom5001.headers['access-control-allow-origin'] === 'http://localhost:5001' && corsFrom5001.headers['access-control-allow-credentials'] === 'true', 'Port 5000 allows CORS requests from http://localhost:5001 with credentials: true');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
