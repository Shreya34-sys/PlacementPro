'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const NotificationModel = require('../models/notificationModel');

const JWT_SECRET = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
const BASE_URL = 'http://127.0.0.1:5000';

test('Notifications: Table schema initialization in MySQL', async () => {
  await NotificationModel.ensureTable();
  const [rows] = await pool.query("SHOW TABLES LIKE 'notifications'");
  assert.equal(rows.length, 1, 'notifications table must exist in database');

  const [cols] = await pool.query('DESCRIBE notifications');
  const colNames = cols.map((c) => c.Field);
  assert.ok(colNames.includes('id'), 'has id column');
  assert.ok(colNames.includes('user_id'), 'has user_id column');
  assert.ok(colNames.includes('title'), 'has title column');
  assert.ok(colNames.includes('message'), 'has message column');
  assert.ok(colNames.includes('type'), 'has type column');
  assert.ok(colNames.includes('link'), 'has link column');
  assert.ok(colNames.includes('is_read'), 'has is_read column');
  assert.ok(colNames.includes('created_at'), 'has created_at column');
});

test('Notifications: Unauthenticated requests are rejected with 401', async () => {
  const res = await fetch(`${BASE_URL}/api/notifications`);
  assert.equal(res.status, 401, 'Unauthenticated request must return 401');
});

test('Notifications: Invalid token requests are rejected with 403', async () => {
  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: 'Bearer invalid_garbage_token' }
  });
  assert.equal(res.status, 403, 'Invalid token must return 403');
});

test('Notifications: Student gets real notifications and unread count', async () => {
  const testStudentId = 'test-student-notif-' + Date.now();
  const token = jwt.sign(
    { id: testStudentId, email: `${testStudentId}@example.com`, role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data), 'data must be an array of notifications');
  assert.ok(data.data.length > 0, 'new student must receive real contextual notifications');
  assert.ok(data.unreadCount > 0, 'unread count should match active unread notifications');
  assert.equal(data.unreadCount, data.data.length);

  // Verify notification fields
  const first = data.data[0];
  assert.ok(first.id, 'must have id');
  assert.ok(first.title, 'must have title');
  assert.ok(first.message, 'must have message');
  assert.equal(first.is_read, 0, 'starts unread');
  assert.equal(first.user_id, testStudentId, 'belongs strictly to this student');
});

test('Notifications: Mark single notification as read updates unread count', async () => {
  const testStudentId = 'test-student-mark-' + Date.now();
  const token = jwt.sign(
    { id: testStudentId, email: `${testStudentId}@example.com`, role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Fetch initial notifications
  const initRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const initData = await initRes.json();
  const initialUnread = initData.unreadCount;
  const targetNotif = initData.data[0];

  // Mark first notification as read
  const markRes = await fetch(`${BASE_URL}/api/notifications/${targetNotif.id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(markRes.status, 200);
  const markData = await markRes.json();
  assert.equal(markData.success, true);
  assert.equal(markData.unreadCount, initialUnread - 1);

  // Verify in database / subsequent fetch
  const verifyRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.unreadCount, initialUnread - 1);
  const updatedItem = verifyData.data.find((n) => n.id === targetNotif.id);
  assert.equal(updatedItem.is_read, 1);
});

test('Notifications: Mark all as read updates all items and sets unread to 0', async () => {
  const testStudentId = 'test-student-all-' + Date.now();
  const token = jwt.sign(
    { id: testStudentId, email: `${testStudentId}@example.com`, role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Initialize
  await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Mark all read
  const readAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(readAllRes.status, 200);
  const readAllData = await readAllRes.json();
  assert.equal(readAllData.success, true);
  assert.equal(readAllData.unreadCount, 0);

  // Verify subsequent fetch
  const verifyRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.unreadCount, 0);
  assert.ok(verifyData.data.every((n) => n.is_read === 1), 'all items must have is_read = 1');
});

test('Notifications: Admin notifications are role-specific and isolated', async () => {
  const testAdminId = 'test-admin-notif-' + Date.now();
  const adminToken = jwt.sign(
    { id: testAdminId, email: 'admin@example.com', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.length > 0, 'admin must receive notifications');
  // Check that admin receives admin-specific notifications
  const hasFacultyNotif = data.data.some((n) => n.title.includes('Faculty Intelligence'));
  assert.ok(hasFacultyNotif, 'admin receives faculty intelligence hub notification');
  assert.ok(data.data.every((n) => n.user_id === testAdminId), 'notifications belong strictly to admin');
});

test('Notifications: Empty state returns 0 notifications when user has none', async () => {
  const emptyUserId = 'test-empty-user-' + Date.now();
  const emptyToken = jwt.sign(
    { id: emptyUserId, email: 'empty@example.com', role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Mark as seeded, then clear all notifications for this user
  await NotificationModel.ensureContextualNotifications(emptyUserId, 'student');
  await NotificationModel.clearAll(emptyUserId);

  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${emptyToken}` }
  });
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.length, 0);
  assert.equal(data.unreadCount, 0);
});

test('Notifications: Page Shells include notification bell and dropdown components', async () => {
  // Test student dashboard served properly
  const studentRes = await fetch(`${BASE_URL}/dashboard`);
  const studentHtml = await studentRes.text();
  assert.ok(studentHtml.includes('notificationBtn'), 'stddash has notificationBtn');
  assert.ok(studentHtml.includes('notificationDropdownContainer'), 'stddash has notification container');
  assert.ok(studentHtml.includes('notificationDropdown'), 'stddash has notification dropdown');
  assert.ok(studentHtml.includes('/css/notifications.css'), 'stddash loads notifications.css');
  assert.ok(studentHtml.includes('/js/notifications.js'), 'stddash loads notifications.js');

  // Test admin dashboard served properly on admin port 5001
  const adminToken = jwt.sign({ id: 'adm-shell-test', email: 'admin@example.com', role: 'admin' }, JWT_SECRET);
  const adminRes = await fetch('http://127.0.0.1:5001/admin-dashboard', {
    headers: { Cookie: `adminToken=${adminToken}` }
  });
  const adminHtml = await adminRes.text();
  assert.ok(adminHtml.includes('notificationBtn'), 'admindash has notificationBtn');
  assert.ok(adminHtml.includes('notificationDropdownContainer'), 'admindash has notification container');
  assert.ok(adminHtml.includes('notificationDropdown'), 'admindash has notification dropdown');
  assert.ok(adminHtml.includes('/css/notifications.css'), 'admindash loads notifications.css');
  assert.ok(adminHtml.includes('/js/notifications.js'), 'admindash loads notifications.js');
});
