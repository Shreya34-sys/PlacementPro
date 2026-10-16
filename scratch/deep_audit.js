'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const BASE_URL = 'http://127.0.0.1:5000';

function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(urlPath, BASE_URL);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          url: urlPath
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        body: '',
        url: urlPath
      });
    });

    if (options.body) {
      req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
    }
    req.end();
  });
}

async function deepAudit() {
  console.log('=== STARTING DEEP END-TO-END QA AUDIT ===\n');

  const report = {
    auth: [],
    crud: [],
    endpoints: [],
    buttonAnalysis: [],
    summary: { passed: 0, failed: 0, blocked: 0, notTested: 0 }
  };

  // Helper to record
  function record(item) {
    if (item.status === 'PASS') report.summary.passed++;
    else if (item.status === 'FAIL') report.summary.failed++;
    else if (item.status === 'BLOCKED') report.summary.blocked++;
    else report.summary.notTested++;

    console.log(`[${item.status}] [${item.severity || 'INFO'}] ${item.category}: ${item.item} -> ${item.actual}`);
    return item;
  }

  // 1. AUTHENTICATION & TOKENS
  console.log('--- 1. Authenticating Roles ---');
  // Admin Login
  const adminLogin = await fetchUrl('/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: process.env.ADMIN_EMAIL || 'pproadmin@gmail.com', password: process.env.ADMIN_PASSWORD || 'pproadmin@123' }
  });
  let adminToken = null;
  try {
    const data = JSON.parse(adminLogin.body);
    adminToken = data.token;
  } catch (_) {}

  report.auth.push(record({
    category: 'Auth',
    item: 'Admin Login',
    endpoint: '/api/auth/admin-login',
    expected: 'Returns 200 with JWT token for admin',
    actual: adminLogin.statusCode === 200 && adminToken ? 'Admin authenticated with valid JWT' : `Failed HTTP ${adminLogin.statusCode}`,
    status: adminLogin.statusCode === 200 && adminToken ? 'PASS' : 'FAIL',
    severity: 'Critical'
  }));

  // Student Registration & Login
  const testEmail = `audit_student_${Date.now()}@example.com`;
  const stdSignup = await fetchUrl('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: `audit_${Date.now()}`, email: testEmail, password: 'password123' }
  });
  let studentToken = null;
  let studentId = null;
  try {
    const data = JSON.parse(stdSignup.body);
    studentToken = data.data?.token;
    studentId = data.data?.user?.id;
  } catch (_) {}

  report.auth.push(record({
    category: 'Auth',
    item: 'Student Registration',
    endpoint: '/api/v1/auth/register',
    expected: 'Returns 201 with created student profile & JWT',
    actual: stdSignup.statusCode === 201 && studentToken ? 'Student registered with valid JWT' : `Failed HTTP ${stdSignup.statusCode}`,
    status: stdSignup.statusCode === 201 && studentToken ? 'PASS' : 'FAIL',
    severity: 'Critical'
  }));

  // Role Access Guard: Student trying to access Admin API
  const studentAccessingAdmin = await fetchUrl('/api/exams/admin', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  report.auth.push(record({
    category: 'Auth Guard',
    item: 'Role Permission Isolation (Student -> Admin Exams)',
    endpoint: '/api/exams/admin',
    expected: 'Returns 403 Forbidden',
    actual: studentAccessingAdmin.statusCode === 403 ? 'Correctly rejected with 403 Forbidden' : `Unexpected HTTP ${studentAccessingAdmin.statusCode}`,
    status: studentAccessingAdmin.statusCode === 403 ? 'PASS' : 'FAIL',
    severity: 'High'
  }));

  // 2. FORM & CRUD WORKFLOWS (Disposable records only)
  console.log('\n--- 2. Form & CRUD Workflows ---');

  // CRUD 1: Exam Create & Delete (Admin)
  let createdExamId = null;
  if (adminToken) {
    const createExamRes = await fetchUrl('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'DISPOSABLE_AUDIT_EXAM',
        description: 'Audit test exam',
        durationMinutes: 30,
        passingPercentage: 60,
        topic: 'Aptitude',
        questions: [
          {
            text: 'What is 10 + 10?',
            options: ['10', '20', '30', '40'],
            correctOption: 1,
            explanation: '10 + 10 = 20'
          }
        ]
      }
    });

    try {
      const parsed = JSON.parse(createExamRes.body);
      createdExamId = parsed.examId || parsed.id || parsed.data?.id;
    } catch (_) {}

    report.crud.push(record({
      category: 'CRUD',
      item: 'Exam Creation (Admin)',
      endpoint: '/api/exams',
      expected: 'Creates exam in MySQL and returns 200/201',
      actual: createExamRes.statusCode === 200 || createExamRes.statusCode === 201 ? `Exam created with ID ${createdExamId}` : `HTTP ${createExamRes.statusCode}: ${createExamRes.body.slice(0, 80)}`,
      status: (createExamRes.statusCode === 200 || createExamRes.statusCode === 201) ? 'PASS' : 'FAIL',
      severity: 'Critical'
    }));

    // Verify in Student Available Exams
    if (studentToken && createdExamId) {
      const availExams = await fetchUrl('/api/exams/available', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      let found = false;
      try {
        const list = JSON.parse(availExams.body);
        found = (list.exams || list || []).some(e => e.id === createdExamId || e.title === 'DISPOSABLE_AUDIT_EXAM');
      } catch (_) {}

      report.crud.push(record({
        category: 'CRUD',
        item: 'Student Exam Visibility',
        endpoint: '/api/exams/available',
        expected: 'Created exam appears in student available exams',
        actual: found ? 'Exam visible to student' : 'Exam not found in list',
        status: found ? 'PASS' : 'FAIL',
        severity: 'High'
      }));
    }

    // Cleanup Exam
    if (createdExamId) {
      const delExam = await fetchUrl(`/api/exams/${createdExamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      report.crud.push(record({
        category: 'CRUD',
        item: 'Exam Deletion (Admin Cleanup)',
        endpoint: `/api/exams/${createdExamId}`,
        expected: 'Deletes exam and returns 200',
        actual: delExam.statusCode === 200 ? 'Exam deleted successfully' : `HTTP ${delExam.statusCode}`,
        status: delExam.statusCode === 200 ? 'PASS' : 'FAIL',
        severity: 'Medium'
      }));
    }
  }

  // CRUD 2: Interview Set Create & Delete (Admin)
  let createdSetId = null;
  if (adminToken) {
    const createSetRes = await fetchUrl('/api/interviews/admin/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'DISPOSABLE_AUDIT_SET',
        role: 'Software Engineer',
        roundType: 'Technical',
        questions: [
          { questionText: 'Explain the difference between process and thread.', durationSeconds: 60 }
        ]
      }
    });

    try {
      const parsed = JSON.parse(createSetRes.body);
      createdSetId = parsed.setId || parsed.id || parsed.data?.id;
    } catch (_) {}

    report.crud.push(record({
      category: 'CRUD',
      item: 'Interview Set Creation (Admin)',
      endpoint: '/api/interviews/admin/sets',
      expected: 'Creates interview set and returns 200/201',
      actual: createSetRes.statusCode === 200 || createSetRes.statusCode === 201 ? `Interview Set created with ID ${createdSetId}` : `HTTP ${createSetRes.statusCode}`,
      status: (createSetRes.statusCode === 200 || createSetRes.statusCode === 201) ? 'PASS' : 'FAIL',
      severity: 'High'
    }));

    if (createdSetId) {
      const delSet = await fetchUrl(`/api/interviews/admin/sets/${createdSetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      report.crud.push(record({
        category: 'CRUD',
        item: 'Interview Set Deletion (Admin Cleanup)',
        endpoint: `/api/interviews/admin/sets/${createdSetId}`,
        expected: 'Deletes interview set and returns 200',
        actual: delSet.statusCode === 200 ? 'Set deleted successfully' : `HTTP ${delSet.statusCode}`,
        status: delSet.statusCode === 200 ? 'PASS' : 'FAIL',
        severity: 'Medium'
      }));
    }
  }

  // CRUD 3: Coding Round Create & Delete (Admin)
  let createdRoundId = null;
  if (adminToken) {
    const createRoundRes = await fetchUrl('/api/coding/admin/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'DISPOSABLE_AUDIT_ROUND',
        description: 'Audit coding round',
        durationMinutes: 45,
        allowedLanguages: ['javascript', 'c', 'python']
      }
    });

    try {
      const parsed = JSON.parse(createRoundRes.body);
      createdRoundId = parsed.roundId || parsed.id || parsed.data?.id;
    } catch (_) {}

    report.crud.push(record({
      category: 'CRUD',
      item: 'Coding Round Creation (Admin)',
      endpoint: '/api/coding/admin/rounds',
      expected: 'Creates coding round and returns 200/201',
      actual: createRoundRes.statusCode === 200 || createRoundRes.statusCode === 201 ? `Round created with ID ${createdRoundId}` : `HTTP ${createRoundRes.statusCode}`,
      status: (createRoundRes.statusCode === 200 || createRoundRes.statusCode === 201) ? 'PASS' : 'FAIL',
      severity: 'High'
    }));

    if (createdRoundId) {
      const delRound = await fetchUrl(`/api/coding/admin/rounds/${createdRoundId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      report.crud.push(record({
        category: 'CRUD',
        item: 'Coding Round Deletion (Admin Cleanup)',
        endpoint: `/api/coding/admin/rounds/${createdRoundId}`,
        expected: 'Deletes coding round and returns 200',
        actual: delRound.statusCode === 200 ? 'Round deleted successfully' : `HTTP ${delRound.statusCode}`,
        status: delRound.statusCode === 200 ? 'PASS' : 'FAIL',
        severity: 'Medium'
      }));
    }
  }

  // CRUD 4: Compiler Project & Versions (Student)
  let createdProjId = null;
  if (studentToken) {
    const createProjRes = await fetchUrl('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: {
        projectName: 'Audit_C_Project',
        description: 'Audit project',
        initialSource: 'int main() { return 0; }',
        languageStandard: 'c17'
      }
    });

    try {
      const parsed = JSON.parse(createProjRes.body);
      createdProjId = parsed.data?.id;
    } catch (_) {}

    report.crud.push(record({
      category: 'CRUD',
      item: 'C-Visualize Project Creation (Student)',
      endpoint: '/api/v1/projects',
      expected: 'Creates project and returns 201 with project ID',
      actual: createProjRes.statusCode === 201 ? `Project created with ID ${createdProjId}` : `HTTP ${createProjRes.statusCode}`,
      status: createProjRes.statusCode === 201 ? 'PASS' : 'FAIL',
      severity: 'High'
    }));

    if (createdProjId) {
      // Save version
      const saveVerRes = await fetchUrl(`/api/v1/projects/${createdProjId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
        body: { sourceCode: 'int main() { printf("v2"); return 0; }', languageStandard: 'c17' }
      });
      report.crud.push(record({
        category: 'CRUD',
        item: 'C-Visualize Version Commit',
        endpoint: `/api/v1/projects/${createdProjId}/versions`,
        expected: 'Creates version 2 and returns 201',
        actual: saveVerRes.statusCode === 201 ? 'Version 2 created' : `HTTP ${saveVerRes.statusCode}`,
        status: saveVerRes.statusCode === 201 ? 'PASS' : 'FAIL',
        severity: 'Medium'
      }));

      // Delete project
      const delProj = await fetchUrl(`/api/v1/projects/${createdProjId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      report.crud.push(record({
        category: 'CRUD',
        item: 'C-Visualize Project Deletion',
        endpoint: `/api/v1/projects/${createdProjId}`,
        expected: 'Deletes project and returns 200',
        actual: delProj.statusCode === 200 ? 'Project deleted' : `HTTP ${delProj.statusCode}`,
        status: delProj.statusCode === 200 ? 'PASS' : 'FAIL',
        severity: 'Medium'
      }));
    }
  }

  // 3. COMPLETE ENDPOINT MATRIX
  console.log('\n--- 3. Verifying Complete Backend Endpoint Matrix ---');
  const ENDPOINT_MATRIX = [
    { cat: 'Exams', item: 'Student Available Exams', path: '/api/exams/available', method: 'GET', token: studentToken, expected: 200 },
    { cat: 'Exams', item: 'Admin Exams Listing', path: '/api/exams/admin', method: 'GET', token: adminToken, expected: 200 },
    { cat: 'Interviews', item: 'Student Dashboard Interviews', path: '/api/interviews/student', method: 'GET', token: studentToken, expected: 200 },
    { cat: 'Interviews', item: 'Admin Interview Sets', path: '/api/interviews/admin/sets', method: 'GET', token: adminToken, expected: 200 },
    { cat: 'Interviews', item: 'AI HR Default Assignment', path: '/api/interviews/ai/default-assignment', method: 'GET', token: studentToken, expected: 200 },
    { cat: 'Coding', item: 'Student Coding Rounds', path: '/api/coding/student/rounds', method: 'GET', token: studentToken, expected: 200 },
    { cat: 'Coding', item: 'Admin Coding Rounds', path: '/api/coding/admin/rounds', method: 'GET', token: adminToken, expected: 200 },
    { cat: 'Versant', item: 'Student Versant Tests', path: '/api/versant/student/tests', method: 'GET', token: studentToken, expected: 200 },
    { cat: 'Versant', item: 'Admin Versant Tests', path: '/api/versant/admin/tests', method: 'GET', token: adminToken, expected: 200 },
    { cat: 'Companies', item: 'Companies Catalog', path: '/api/companies', method: 'GET', token: null, expected: 200 },
    { cat: 'Study', item: 'Study Subjects Catalog', path: '/api/v1/study/subjects', method: 'GET', token: null, expected: 200 },
    { cat: 'Progress', item: 'Student Progress Summary', path: '/api/progress/summary', method: 'GET', token: studentToken, expected: 200 },
    { cat: 'Compiler', item: 'Compiler Toolchain Info', path: '/api/v1/compiler/info', method: 'GET', token: null, expected: 200 },
    { cat: 'Compiler', item: 'Compiler Sample Exercises', path: '/api/v1/compiler/exercises', method: 'GET', token: null, expected: 200 },
  ];

  for (const ep of ENDPOINT_MATRIX) {
    const headers = ep.token ? { Authorization: `Bearer ${ep.token}` } : {};
    const res = await fetchUrl(ep.path, { method: ep.method, headers });
    const isPass = res.statusCode === ep.expected;
    report.endpoints.push(record({
      category: ep.cat,
      item: ep.item,
      endpoint: ep.path,
      expected: `Returns HTTP ${ep.expected}`,
      actual: `Received HTTP ${res.statusCode}`,
      status: isPass ? 'PASS' : 'FAIL',
      severity: isPass ? 'Low' : 'High'
    }));
  }

  // 4. FRONTEND SCRIPT & BUTTON ANALYSIS
  console.log('\n--- 4. Client-Side Button & Event Binding Audit ---');
  const jsFiles = fs.readdirSync(path.join(__dirname, '../public/js'))
    .filter(f => f.endsWith('.js'));

  for (const jsFile of jsFiles) {
    const jsContent = fs.readFileSync(path.join(__dirname, '../public/js', jsFile), 'utf8');
    // Search for addEventListener
    const eventMatches = [...jsContent.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)\s*\.\s*addEventListener/g)];
    const clickMatches = [...jsContent.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)\s*\.\s*onclick/g)];
    const boundIds = [...new Set([...eventMatches.map(m => m[1]), ...clickMatches.map(m => m[1])])];

    report.buttonAnalysis.push({
      file: jsFile,
      boundElements: boundIds.length,
      sampleIds: boundIds.slice(0, 5)
    });
  }

  // Cleanup disposable student
  if (studentId) {
    await pool.query('DELETE FROM users WHERE id = ?', [studentId]).catch(() => {});
  }

  // Output Final Report JSON
  fs.writeFileSync(path.join(__dirname, 'deep_audit_report.json'), JSON.stringify(report, null, 2));
  console.log('\n=== DEEP AUDIT SUMMARY ===');
  console.log(`TOTAL PASSED: ${report.summary.passed}`);
  console.log(`TOTAL FAILED: ${report.summary.failed}`);
  console.log(`TOTAL BLOCKED: ${report.summary.blocked}`);
  console.log(`TOTAL NOT TESTED: ${report.summary.notTested}`);
}

deepAudit().then(() => process.exit(0)).catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
