'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const BASE_URL = 'http://127.0.0.1:5000';

test('Breadcrumbs: Google Prep Kit page serves on student portal port 5000', async () => {
  const res = await fetch(`${BASE_URL}/company-prep?company=Google`);
  assert.equal(res.status, 200, 'Company prep page should return HTTP 200');
  const html = await res.text();

  // 1. Verify Breadcrumb Nav exists
  assert.ok(html.includes('id="breadcrumbNav"'), 'Breadcrumb navigation bar must exist');

  // 2. Verify Item 1: Back to Dashboard -> /dashboard
  assert.ok(
    html.includes('href="/dashboard" id="breadcrumbDashboard"') ||
    html.includes('id="breadcrumbDashboard" href="/dashboard"'),
    'Back to Dashboard must point to relative internal route /dashboard'
  );

  // 3. Verify Item 2: Company Directory -> /companies
  assert.ok(
    html.includes('href="/companies" id="breadcrumbCompanies"') ||
    html.includes('id="breadcrumbCompanies" href="/companies"'),
    'Company Directory must point to relative internal route /companies'
  );

  // 4. Verify Item 3: Google Prep Kit is a span, not a link to Google Search
  assert.ok(
    html.includes('id="breadcrumbLabel" aria-current="page">Google Prep Kit</span>') ||
    html.includes('id="breadcrumbLabel"'),
    'Google Prep Kit must be the current-page label'
  );
  assert.ok(!html.includes('href="https://www.google.com"'), 'Must not link to google.com');
  assert.ok(!html.includes('href="https://google.com"'), 'Must not link to google.com search');

  // 5. Verify PlacementPro own preparation content is present
  assert.ok(html.includes('Google Preparation Kit'), 'Contains Google preparation kit title');
  assert.ok(html.includes('Software Development Engineer (SDE)'), 'Contains SDE target role');
  assert.ok(html.includes('Longest Increasing Subsequence'), 'Contains curated algorithmic problem');
  assert.ok(html.includes('Googliness'), 'Contains Googliness round overview');
});

test('Breadcrumbs: Target routes /dashboard and /companies resolve properly on student portal', async () => {
  // Check /dashboard
  const dashRes = await fetch(`${BASE_URL}/dashboard`);
  assert.equal(dashRes.status, 200, '/dashboard should resolve on port 5000');
  const dashHtml = await dashRes.text();
  assert.ok(dashHtml.includes('Student Dashboard') || dashHtml.includes('PlacementPro'), '/dashboard renders student portal');

  // Check /companies
  const compRes = await fetch(`${BASE_URL}/companies`);
  assert.equal(compRes.status, 200, '/companies should resolve on port 5000');
  const compHtml = await compRes.text();
  assert.ok(compHtml.includes('Company Directory'), '/companies renders company directory');
});

test('Breadcrumbs: Current-page label is non-clickable text and has no anchor tag', async () => {
  const res = await fetch(`${BASE_URL}/company-prep?company=Google`);
  const html = await res.text();

  // Extract the breadcrumb nav snippet
  const navStart = html.indexOf('id="breadcrumbNav"');
  assert.ok(navStart !== -1);
  const navEnd = html.indexOf('</nav>', navStart);
  assert.ok(navEnd !== -1);
  const navSnippet = html.slice(navStart, navEnd);

  // Assert item 3 is in a <span> tag and has no href
  assert.ok(navSnippet.includes('<span class="current" id="breadcrumbLabel"'), 'Current item is in a span');
  assert.ok(!navSnippet.match(/<a[^>]*id="breadcrumbLabel"/), 'breadcrumbLabel must not be an anchor tag');
  assert.ok(!navSnippet.match(/id="breadcrumbLabel"[^>]*href=/), 'breadcrumbLabel must not have an href');
});
