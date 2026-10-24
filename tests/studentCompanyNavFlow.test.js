'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const BASE_URL = 'http://127.0.0.1:5000';

test('Navigation Flow: Student Login -> Dashboard -> Company-Wise Preparation -> Company Directory -> Select Google -> Google Prep Kit', async () => {
  // Step 1: Create a test student and log in
  const uniqueEmail = `flow_student_${Date.now()}@example.com`;
  const password = 'StudentPassword@123';

  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Flow Test Student',
      email: uniqueEmail,
      password: password
    })
  });
  assert.equal(signupRes.status, 201, 'Student signup should succeed');
  const signupData = await signupRes.json();
  assert.ok(signupData.token, 'Signup should return JWT');

  // Perform Student Login via API
  const loginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: password
    })
  });
  assert.equal(loginRes.status, 200, 'Student login should succeed with HTTP 200');
  const loginData = await loginRes.json();
  assert.ok(loginData.token, 'Student login should return a valid JWT token');
  const token = loginData.token;

  // Step 2: Student Dashboard
  const dashRes = await fetch(`${BASE_URL}/dashboard`);
  assert.equal(dashRes.status, 200, 'Student Dashboard (/dashboard) should return HTTP 200');
  const dashHtml = await dashRes.text();

  // Step 3: Company-Wise Preparation link check on Dashboard
  // Verify Company-Wise Preparation card does NOT point directly to /company-prep
  assert.ok(
    !dashHtml.includes('href="/company-prep" class="launchpad-card"'),
    'Company-Wise Preparation card must NOT link directly to /company-prep'
  );
  // Verify Company-Wise Preparation card points to /companies
  assert.ok(
    dashHtml.includes('href="/companies" class="launchpad-card"') ||
    dashHtml.includes('id="launchpadCompanyPrep"'),
    'Company-Wise Preparation card must link to /companies'
  );
  assert.ok(
    dashHtml.includes('<h3>Company-Wise Preparation</h3>'),
    'Dashboard must display "Company-Wise Preparation" card'
  );

  // Step 4: Navigate to Company Directory (/companies)
  const companiesRes = await fetch(`${BASE_URL}/companies`);
  assert.equal(companiesRes.status, 200, 'Company Directory (/companies) should return HTTP 200');
  const companiesHtml = await companiesRes.text();
  assert.ok(companiesHtml.includes('Company Directory'), 'Company Directory page must have title');
  assert.ok(companiesHtml.includes('id="companyGrid"'), 'Company grid container must exist');

  // Verify Companies API returns Google
  const compApiRes = await fetch(`${BASE_URL}/api/companies`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(compApiRes.status, 200, 'Companies API should return HTTP 200');
  const compApiData = await compApiRes.json();
  assert.ok(compApiData.success, 'Companies API response should be successful');
  const googleCompany = compApiData.data.find(c => c.name.toLowerCase() === 'google' || c.short_name?.toLowerCase() === 'google');
  assert.ok(googleCompany, 'Google must exist in Company Directory list');

  // Step 5: Select Google -> Navigate to Google Prep Kit (/company-prep?company=Google)
  const googlePrepUrl = `${BASE_URL}/company-prep?company=Google`;
  const prepRes = await fetch(googlePrepUrl);
  assert.equal(prepRes.status, 200, 'Google Prep Kit (/company-prep?company=Google) should return HTTP 200');
  const prepHtml = await prepRes.text();

  assert.ok(prepHtml.includes('Google Preparation Kit'), 'Google prep kit page must contain Google Preparation Kit title');
  assert.ok(prepHtml.includes('Software Development Engineer (SDE)'), 'Contains SDE target role');
  assert.ok(prepHtml.includes('id="breadcrumbNav"'), 'Breadcrumb nav bar must exist');
  assert.ok(prepHtml.includes('href="/companies" id="breadcrumbCompanies"'), 'Breadcrumb must link back to Company Directory (/companies)');
  assert.ok(prepHtml.includes('href="/dashboard" id="breadcrumbDashboard"'), 'Breadcrumb must link back to Student Dashboard (/dashboard)');
});
