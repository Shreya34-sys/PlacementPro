const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body, json });
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
  console.log('=== VERIFYING COMPANY PLACEMENT MODULE ===');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('✅ [PASS] ' + message);
      passed++;
    } else {
      console.error('❌ [FAIL] ' + message);
      failed++;
    }
  }

  try {
    // 1. Verify Student View
    const stdPage = await request('http://localhost:5000/company-placement');
    assert(stdPage.status === 200 && stdPage.body.includes('Company Placement Simulation'), 'Student /company-placement page loads HTTP 200');

    const stdPage2 = await request('http://localhost:5000/company-placement-student');
    assert(stdPage2.status === 200 && stdPage2.body.includes('Company Placement Simulation'), 'Student /company-placement-student page loads HTTP 200');

    // 2. Verify Admin View on Port 5001
    const adminPage = await request('http://localhost:5001/company-placement-admin');
    assert(adminPage.status === 200 && adminPage.body.includes('Company Placement Manager'), 'Admin /company-placement-admin page loads HTTP 200 on port 5001');

    // 3. Verify Admin URL is blocked on Port 5000
    const blockedPage = await request('http://localhost:5000/company-placement-admin');
    assert(blockedPage.status === 403, 'Admin page is blocked with HTTP 403 on student port 5000');

    // 4. Verify Admin API is blocked on Port 5000
    const blockedApi = await request('http://localhost:5000/api/placement-simulation/admin/companies');
    assert(blockedApi.status === 403, 'Admin API is blocked with HTTP 403 on student port 5000');

    // 5. Test Admin Login and API calls
    const adminLogin = await request('http://localhost:5001/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'pproadmin@gmail.com', password: 'pproadmin@123' }
    });
    assert(adminLogin.status === 200 && adminLogin.json && adminLogin.json.token, 'Admin login succeeds on port 5001');
    const adminToken = adminLogin.json.token;

    // 6. Test Admin List Companies
    const adminCompanies = await request('http://localhost:5001/api/placement-simulation/admin/companies', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminCompanies.status === 200 && Array.isArray(adminCompanies.json), 'Admin can list simulation companies (HTTP 200)');

    // 7. Test Admin List Assessments
    const adminAssessments = await request('http://localhost:5001/api/placement-simulation/admin/assessments/aptitude', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAssessments.status === 200 && Array.isArray(adminAssessments.json), 'Admin can list aptitude assessments for round picker (HTTP 200)');

    // 8. Test Student Login and Student Simulation Listing
    const studentLogin = await request('http://localhost:5000/api/auth/student-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'teststudent@example.com', password: 'password123' }
    });
    let studentToken = null;
    if (studentLogin.status === 200 && studentLogin.json?.token) {
      studentToken = studentLogin.json.token;
    } else {
      // Create student or try demo student
      const demoLogin = await request('http://localhost:5000/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'student@placementpro.edu', password: 'password123' }
      });
      if (demoLogin.status === 200 && demoLogin.json?.token) {
        studentToken = demoLogin.json.token;
      }
    }

    if (studentToken) {
      const stdCompanies = await request('http://localhost:5000/api/placement-simulation/student/companies', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert(stdCompanies.status === 200 && Array.isArray(stdCompanies.json), 'Student can list published simulation companies (HTTP 200)');
    }

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
  } catch (err) {
    console.error('Test error:', err);
  }
}

run();
