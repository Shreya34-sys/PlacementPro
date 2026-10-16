'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const BASE_URL = 'http://127.0.0.1:5000';

const PAGES = [
  '/',
  '/login',
  '/signup',
  '/admin-login',
  '/dashboard',
  '/admindash',
  '/profile',
  '/resume-analyzer',
  '/available-exams',
  '/exam-guidelines',
  '/take-exam',
  '/live-exam',
  '/exam-result',
  '/versant-test',
  '/versant-result',
  '/interviews',
  '/interview-room',
  '/placement-workspace',
  '/admin-interviews',
  '/admin-question-import',
  '/versant-admin',
  '/proctoring',
  '/companies',
  '/company-prep',
  '/study-materials',
  '/study-reader',
  '/admin-study-materials',
  '/compiler-practice',
  '/admin-exams',
  '/admin-exam-builder',
  '/live-proctoring',
  '/admin-coding-rounds',
  '/admin-coding-builder',
  '/admin-coding-monitor',
  '/admin-coding-results',
  '/coding-rounds',
  '/coding-round',
  '/coding-result'
];

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

async function runAudit() {
  console.log('=== STARTING PLACEMENTPRO COMPREHENSIVE QA AUDIT ===\n');
  const results = {
    pages: [],
    deadLinks: [],
    missingAssets: [],
    brokenButtons: [],
    apiEndpoints: [],
    authChecks: [],
    dbIntegrity: []
  };

  // 1. Page Availability & Static Asset Checks
  console.log('--- 1. Testing Page Availability & Asset Links ---');
  for (const pageRoute of PAGES) {
    const res = await fetchUrl(pageRoute);
    const pageResult = {
      route: pageRoute,
      status: res.statusCode,
      ok: res.statusCode === 200,
      brokenAssets: [],
      placeholderLinks: [],
      forms: [],
      buttonsCount: 0
    };

    if (res.statusCode === 200) {
      // Check assets: script src, link href, img src
      const scriptMatches = [...res.body.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/gi)];
      const cssMatches = [...res.body.matchAll(/<link\s+[^>]*href=["']([^"']+\.css[^"']*)["']/gi)];
      const imgMatches = [...res.body.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/gi)];

      const allAssets = [
        ...scriptMatches.map(m => m[1]),
        ...cssMatches.map(m => m[1]),
        ...imgMatches.map(m => m[1])
      ].filter(src => !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:'));

      for (const asset of allAssets) {
        // Resolve asset relative to public or root
        const assetPath = asset.startsWith('/') ? asset : `/${asset}`;
        const assetRes = await fetchUrl(assetPath);
        if (assetRes.statusCode !== 200 && assetRes.statusCode !== 304) {
          pageResult.brokenAssets.push({ asset, status: assetRes.statusCode });
          results.missingAssets.push({ page: pageRoute, asset, status: assetRes.statusCode });
        }
      }

      // Check placeholder links: href="#" or href=""
      const linkMatches = [...res.body.matchAll(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gis)];
      for (const m of linkMatches) {
        const href = m[1].trim();
        const text = m[2].replace(/<[^>]+>/g, '').trim().slice(0, 30);
        if (href === '#' || href === '' || href.startsWith('javascript:void')) {
          pageResult.placeholderLinks.push({ text: text || '(icon/image)', href });
          results.deadLinks.push({ page: pageRoute, text: text || '(icon)', href });
        }
      }

      // Detect button elements
      const buttonMatches = [...res.body.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gis)];
      pageResult.buttonsCount = buttonMatches.length;

      // Check forms
      const formMatches = [...res.body.matchAll(/<form\b([^>]*)>(.*?)<\/form>/gis)];
      for (const f of formMatches) {
        const attrs = f[1];
        const actionMatch = attrs.match(/action=["']([^"']+)["']/i);
        const methodMatch = attrs.match(/method=["']([^"']+)["']/i);
        pageResult.forms.push({
          action: actionMatch ? actionMatch[1] : '(none/JS handler)',
          method: methodMatch ? methodMatch[1].toUpperCase() : 'GET'
        });
      }
    }

    results.pages.push(pageResult);
    const statusLabel = res.statusCode === 200 ? 'PASS' : 'FAIL';
    console.log(`[${statusLabel}] Route: ${pageRoute.padEnd(25)} HTTP ${res.statusCode} (Buttons: ${pageResult.buttonsCount}, Broken Assets: ${pageResult.brokenAssets.length}, Dead Links: ${pageResult.placeholderLinks.length})`);
  }

  // 2. Authentication & Authorization Checks
  console.log('\n--- 2. Testing Auth APIs & Role Protections ---');
  // Student registration
  const testStudentUser = `audit_std_${Date.now()}`;
  const testStudentEmail = `${testStudentUser}@example.com`;
  const regRes = await fetchUrl('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      username: testStudentUser,
      email: testStudentEmail,
      password: 'password123'
    }
  });
  let studentToken = null;
  let studentId = null;
  try {
    const parsed = JSON.parse(regRes.body);
    studentToken = parsed.data?.token;
    studentId = parsed.data?.user?.id;
    results.authChecks.push({ check: 'Student Registration', pass: regRes.statusCode === 201, details: regRes.statusCode });
    console.log(`[${regRes.statusCode === 201 ? 'PASS' : 'FAIL'}] Student Registration: HTTP ${regRes.statusCode}`);
  } catch (e) {
    results.authChecks.push({ check: 'Student Registration', pass: false, details: e.message });
  }

  // Student login
  const loginRes = await fetchUrl('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      usernameOrEmail: testStudentEmail,
      password: 'password123'
    }
  });
  results.authChecks.push({ check: 'Student Login (/api/v1/auth/login)', pass: loginRes.statusCode === 200, details: loginRes.statusCode });
  console.log(`[${loginRes.statusCode === 200 ? 'PASS' : 'FAIL'}] Student Login (/api/v1/auth/login): HTTP ${loginRes.statusCode}`);

  // Admin login check
  const adminLoginRes = await fetchUrl('/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      email: process.env.ADMIN_EMAIL || 'pproadmin@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'pproadmin@123'
    }
  });
  let adminToken = null;
  try {
    const adminParsed = JSON.parse(adminLoginRes.body);
    adminToken = adminParsed.token;
    results.authChecks.push({ check: 'Admin Login (/api/auth/admin-login)', pass: adminLoginRes.statusCode === 200 && Boolean(adminToken), details: adminLoginRes.statusCode });
    console.log(`[${adminLoginRes.statusCode === 200 ? 'PASS' : 'FAIL'}] Admin Login: HTTP ${adminLoginRes.statusCode} Token: ${Boolean(adminToken)}`);
  } catch (e) {
    results.authChecks.push({ check: 'Admin Login', pass: false, details: e.message });
    console.log(`[FAIL] Admin Login: ${e.message}`);
  }

  // Profile lookup with student token
  if (studentToken) {
    const profileRes = await fetchUrl('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    console.log(`[${profileRes.statusCode === 200 ? 'PASS' : 'FAIL'}] Student Profile (/api/v1/auth/me): HTTP ${profileRes.statusCode}`);
    results.authChecks.push({ check: 'Auth Me endpoint', pass: profileRes.statusCode === 200, details: profileRes.statusCode });
  }

  // Protected route unauthorized rejection test
  const unauthRes = await fetchUrl('/api/v1/projects');
  const unauthProtected = unauthRes.statusCode === 401;
  console.log(`[${unauthProtected ? 'PASS' : 'FAIL'}] Unauthenticated route guard (/api/v1/projects): HTTP ${unauthRes.statusCode} (Expected 401)`);
  results.authChecks.push({ check: 'Unauthenticated API rejection', pass: unauthProtected, details: unauthRes.statusCode });

  // 3. API Endpoints Map & Validation
  console.log('\n--- 3. Testing Core API Endpoints ---');
  const API_TESTS = [
    { name: 'Compiler Info', path: '/api/v1/compiler/info', method: 'GET', expectStatus: 200 },
    { name: 'Study Subjects', path: '/api/v1/study/subjects', method: 'GET', expectStatus: 200 },
    { name: 'Companies Catalog', path: '/api/companies', method: 'GET', expectStatus: 200 },
    { name: 'Available Exams', path: '/api/exams/available', method: 'GET', headers: studentToken ? { 'Authorization': `Bearer ${studentToken}` } : {}, expectStatus: 200 },
    { name: 'Coding Rounds Catalog', path: '/api/coding/rounds', method: 'GET', headers: studentToken ? { 'Authorization': `Bearer ${studentToken}` } : {}, expectStatus: 200 },
    { name: 'Interviews Available', path: '/api/interviews/available', method: 'GET', headers: studentToken ? { 'Authorization': `Bearer ${studentToken}` } : {}, expectStatus: 200 },
    { name: 'Versant Available Tests', path: '/api/versant/tests', method: 'GET', headers: studentToken ? { 'Authorization': `Bearer ${studentToken}` } : {}, expectStatus: 200 },
    { name: 'Student Progress Overview', path: '/api/progress/overview', method: 'GET', headers: studentToken ? { 'Authorization': `Bearer ${studentToken}` } : {}, expectStatus: 200 },
    { name: 'Admin Exam List', path: '/api/exams', method: 'GET', headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}, expectStatus: 200 },
    { name: 'Admin Interview Questions', path: '/api/interviews/admin/questions', method: 'GET', headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}, expectStatus: 200 }
  ];

  for (const t of API_TESTS) {
    const res = await fetchUrl(t.path, { method: t.method, headers: t.headers });
    let isOk = res.statusCode === t.expectStatus;
    let jsonOk = false;
    try {
      const parsed = JSON.parse(res.body);
      jsonOk = Boolean(parsed);
    } catch (_) {}
    results.apiEndpoints.push({ name: t.name, path: t.path, status: res.statusCode, ok: isOk, json: jsonOk });
    console.log(`[${isOk ? 'PASS' : 'FAIL'}] API: ${t.name.padEnd(26)} ${t.path.padEnd(32)} HTTP ${res.statusCode} JSON: ${jsonOk}`);
  }

  // 4. Database Data Integrity Check
  console.log('\n--- 4. Checking Database Tables & Records ---');
  try {
    const [counts] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as usersCount,
        (SELECT COUNT(*) FROM exams) as examsCount,
        (SELECT COUNT(*) FROM questions) as questionsCount,
        (SELECT COUNT(*) FROM study_subjects) as subjectsCount,
        (SELECT COUNT(*) FROM study_topics) as topicsCount,
        (SELECT COUNT(*) FROM companies) as companiesCount,
        (SELECT COUNT(*) FROM interview_questions) as interviewQuestionsCount,
        (SELECT COUNT(*) FROM coding_questions) as codingQuestionsCount,
        (SELECT COUNT(*) FROM compiler_jobs) as compilerJobsCount
    `);
    const c = counts[0];
    results.dbIntegrity = c;
    console.log(`[PASS] DB Records -> Users: ${c.usersCount}, Exams: ${c.examsCount}, Questions: ${c.questionsCount}, Subjects: ${c.subjectsCount}, Topics: ${c.topicsCount}, Companies: ${c.companiesCount}, InterviewQs: ${c.interviewQuestionsCount}, CodingQs: ${c.codingQuestionsCount}`);
  } catch (err) {
    console.error(`[FAIL] DB query error:`, err.message);
  }

  // 5. Cleanup Test Records
  if (studentId) {
    try {
      await pool.query('DELETE FROM users WHERE id = ?', [studentId]);
      console.log(`[CLEANUP] Deleted test student user ID ${studentId}`);
    } catch (_) {}
  }

  // Save audit data to file for reporting
  const outputPath = path.join(__dirname, 'audit_report_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nAudit data written to ${outputPath}`);
  console.log('=== AUDIT FINISHED ===');
}

runAudit().then(() => process.exit(0)).catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
