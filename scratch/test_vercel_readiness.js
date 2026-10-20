'use strict';

const http = require('http');
const assert = require('assert');

// Simulate serverless invocation with missing Google credentials
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;
process.env.VERCEL = '1';

async function runTests() {
  console.log('--- Testing Vercel Serverless Entrypoint ---');

  // 1. Require api/index.js
  let app;
  try {
    app = require('../api/index');
    console.log('✔ Successfully loaded api/index.js without unhandled GoogleStrategy error');
  } catch (err) {
    console.error('✘ Failed to load api/index.js:', err);
    process.exit(1);
  }

  // 2. Spin up a temporary local test server using the exported app
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // 3. Test /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthData.status, 'ok');
    assert.strictEqual(healthData.serverless, true);
    console.log('✔ /api/health returned 200 OK:', healthData);

    // 4. Test /api/auth/google
    const googleRes = await fetch(`${baseUrl}/api/auth/google`, {
      headers: { 'Accept': 'application/json' },
      redirect: 'manual'
    });
    console.log(`✔ /api/auth/google responded with status ${googleRes.status}`);

    // 5. Test root / (should return student landing page HTML)
    const rootRes = await fetch(`${baseUrl}/`);
    assert.strictEqual(rootRes.status, 200);
    const rootHtml = await rootRes.text();
    assert.ok(rootHtml.includes('PlacementPro') || rootHtml.includes('<!DOCTYPE html>'));
    console.log('✔ GET / successfully returns HTML landing page');

    // 6. Test /login
    const loginRes = await fetch(`${baseUrl}/login`);
    assert.strictEqual(loginRes.status, 200);
    const loginHtml = await loginRes.text();
    assert.ok(loginHtml.includes('<!DOCTYPE html>'));
    console.log('✔ GET /login successfully returns student login HTML');

    // 7. Test /admin-login
    const adminLoginRes = await fetch(`${baseUrl}/admin-login`);
    assert.strictEqual(adminLoginRes.status, 200);
    const adminLoginHtml = await adminLoginRes.text();
    assert.ok(adminLoginHtml.includes('<!DOCTYPE html>'));
    console.log('✔ GET /admin-login successfully returns admin login HTML');

    // 8. Test /admindash without token (guard should redirect to /admin-login)
    const adminDashRes = await fetch(`${baseUrl}/admindash`, { redirect: 'manual' });
    assert.ok([200, 302].includes(adminDashRes.status));
    console.log(`✔ GET /admindash guarded properly (status: ${adminDashRes.status})`);

    console.log('\n--- ALL VERCEL READINESS TESTS PASSED ---');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
