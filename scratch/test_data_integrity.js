const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';

async function run() {
  console.log('--- STARTING DATA INTEGRITY & AUDIT VERIFICATION ---');

  // 1. Get student and admin users
  const [students] = await db.execute('SELECT id, email, role FROM users WHERE email = "abc@gmail.com" LIMIT 1');
  const [admins] = await db.execute('SELECT id, email, role FROM users WHERE email = "pproadmin@gmail.com" LIMIT 1');

  if (!students.length || !admins.length) {
    throw new Error('Test users not found in database.');
  }

  const student = students[0];
  const admin = admins[0];

  const studentToken = jwt.sign({ id: student.id, email: student.email, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  const BASE_URL = 'http://localhost:5000';

  const authFetch = (path, token, options = {}) => fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  // FLOW A: Admin creates draft interview -> student should NOT see it
  console.log('\n[TEST A] Admin creates DRAFT interview...');
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createRes = await authFetch('/api/interviews/admin/sets', adminToken, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Integrity Test - Microsoft SDE Interview',
      companyName: 'Microsoft',
      description: 'System design and algorithms',
      category: 'technical',
      status: 'draft',
      deadline: tomorrow,
      questions: [
        { questionText: 'Explain LRU cache implementation.', referenceAnswer: 'Hash map + doubly linked list' }
      ]
    })
  });

  const createData = await createRes.json();
  console.log('Create Response:', createRes.status, createData);
  if (!createData.id) throw new Error('Failed to create interview set');
  const testSetId = createData.id;

  // Check student endpoint
  let studentRes = await authFetch('/api/interviews/student', studentToken);
  let studentData = await studentRes.json();
  const foundDraft = (studentData.assignments || []).find(a => a.set_id === testSetId || a.title.includes('Integrity Test'));
  console.log('Does draft interview appear for student?', foundDraft ? 'YES (FAIL!)' : 'NO (CORRECT!)');
  if (foundDraft) throw new Error('FAIL: Draft interview appeared for student!');

  // FLOW B: Admin publishes it -> student SHOULD see it
  console.log('\n[TEST B] Admin publishes interview...');
  const updateRes = await authFetch(`/api/interviews/admin/sets/${testSetId}`, adminToken, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Integrity Test - Microsoft SDE Interview',
      companyName: 'Microsoft',
      description: 'System design and algorithms',
      category: 'technical',
      status: 'published',
      deadline: tomorrow,
      questions: [
        { questionText: 'Explain LRU cache implementation.', referenceAnswer: 'Hash map + doubly linked list' }
      ]
    })
  });
  console.log('Publish Response:', updateRes.status);

  studentRes = await authFetch('/api/interviews/student', studentToken);
  studentData = await studentRes.json();
  const foundPublished = (studentData.assignments || []).find(a => a.set_id === testSetId);
  console.log('Does published interview appear for student?', foundPublished ? 'YES (CORRECT!)' : 'NO (FAIL!)');
  if (!foundPublished) throw new Error('FAIL: Published interview did NOT appear for student!');
  console.log('Details:', {
    title: foundPublished.title,
    company: foundPublished.company_name,
    deadline: foundPublished.deadline,
    status: foundPublished.availability
  });

  // FLOW C: Admin updates schedule / title -> student sees updated values
  console.log('\n[TEST C] Admin updates title and deadline...');
  const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await authFetch(`/api/interviews/admin/sets/${testSetId}`, adminToken, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Integrity Test - Microsoft SDE Updated Schedule',
      companyName: 'Microsoft',
      description: 'System design and algorithms updated',
      category: 'technical',
      status: 'published',
      deadline: dayAfterTomorrow,
      questions: [
        { questionText: 'Explain LRU cache implementation.', referenceAnswer: 'Hash map + doubly linked list' }
      ]
    })
  });

  studentRes = await authFetch('/api/interviews/student', studentToken);
  studentData = await studentRes.json();
  const foundUpdated = (studentData.assignments || []).find(a => a.set_id === testSetId);
  console.log('Updated title for student:', foundUpdated?.title);
  if (foundUpdated?.title !== 'Integrity Test - Microsoft SDE Updated Schedule') {
    throw new Error('FAIL: Student did not receive updated title!');
  }
  console.log('Updated deadline for student:', foundUpdated?.deadline);

  // FLOW D: Admin deletes/cancels it -> student no longer sees it
  console.log('\n[TEST D] Admin deletes interview set...');
  const delRes = await authFetch(`/api/interviews/admin/sets/${testSetId}`, adminToken, {
    method: 'DELETE'
  });
  console.log('Delete Response:', delRes.status);

  studentRes = await authFetch('/api/interviews/student', studentToken);
  studentData = await studentRes.json();
  const foundDeleted = (studentData.assignments || []).find(a => a.set_id === testSetId);
  console.log('Does deleted interview appear for student?', foundDeleted ? 'YES (FAIL!)' : 'NO (CORRECT!)');
  if (foundDeleted) throw new Error('FAIL: Deleted interview still appeared for student!');

  // FLOW E: Intelligence stats endpoint
  console.log('\n[TEST E] Admin Intelligence Stats API...');
  const statsRes = await authFetch('/api/admin/intelligence-stats', adminToken);
  const statsData = await statsRes.json();
  console.log('Intelligence Stats:', statsData.stats);
  if (!statsData.success || !statsData.stats) throw new Error('FAIL: Intelligence stats failed');
  console.log('Real DB Active Drives:', statsData.stats.activeDrivesCount);
  console.log('Real DB Registrations:', statsData.stats.totalRegistrations);
  console.log('Real DB RAG Chunks:', statsData.stats.ragChunks);
  console.log('Real DB Avg Readiness:', statsData.stats.avgReadiness);

  // FLOW F: Exams Draft vs Published lifecycle
  console.log('\n[TEST F] Exam Draft vs Published Lifecycle...');
  const [exams] = await db.execute('SELECT id, title, status FROM exams WHERE deleted_at IS NULL LIMIT 1');
  if (exams.length) {
    const testExam = exams[0];
    console.log(`Testing Exam: "${testExam.title}" (Current: ${testExam.status})`);

    // Toggle to draft
    await authFetch(`/api/exams/${testExam.id}/status`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'draft' })
    });

    let availRes = await authFetch('/api/exams/available', studentToken);
    let availExams = await availRes.json();
    let isAvailAsDraft = availExams.some(e => e.id === testExam.id);
    console.log('Is exam available to student while DRAFT?', isAvailAsDraft ? 'YES (FAIL!)' : 'NO (CORRECT!)');
    if (isAvailAsDraft) throw new Error('FAIL: Draft exam appeared for student!');

    // Toggle to published
    await authFetch(`/api/exams/${testExam.id}/status`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' })
    });

    availRes = await authFetch('/api/exams/available', studentToken);
    availExams = await availRes.json();
    let isAvailAsPublished = availExams.some(e => e.id === testExam.id);
    console.log('Is exam available to student while PUBLISHED?', isAvailAsPublished ? 'YES (CORRECT!)' : 'NO (FAIL!)');
    if (!isAvailAsPublished) throw new Error('FAIL: Published exam did not appear for student!');
  }

  console.log('\n--- ALL DATA INTEGRITY VERIFICATIONS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
