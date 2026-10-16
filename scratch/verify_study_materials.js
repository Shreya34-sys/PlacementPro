require('dotenv').config();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
const BASE_URL = 'http://localhost:5000';

// Student test token
const studentPayload = {
  id: '9d7febf4-c7ae-4ea4-8185-22337d470b91',
  email: 'abc@gmail.com',
  name: 'Student ABC',
  role: 'student'
};
const studentToken = jwt.sign(studentPayload, JWT_SECRET, { expiresIn: '2h' });

// Admin test token
const adminPayload = {
  id: '8b964856-ee3c-45cd-a048-7d4a991734c3',
  email: 'pproadmin@gmail.com',
  name: 'Admin Faculty',
  role: 'admin'
};
const adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '2h' });

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, headers: res.headers, data: json };
}

async function runVerification() {
  console.log('====================================================');
  console.log('PLACEMENTPRO - STUDY MATERIALS MODULE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Student Subject Listing
    console.log('\n--- 1. Testing Student Subject Catalog ---');
    const r1 = await request('/api/study/subjects');
    assert(r1.status === 200 && r1.data.success, 'GET /api/study/subjects returns 200 and success: true');
    assert(Array.isArray(r1.data.subjects) && r1.data.subjects.length >= 10, `Found ${r1.data.subjects?.length} subjects in catalog`);

    const hasCoreSubjects = ['DBMS', 'DSA', 'OS', 'CN', 'OOP', 'JAVA'].every(code => 
      r1.data.subjects.some(s => s.code.toUpperCase() === code)
    );
    assert(hasCoreSubjects, 'Catalog contains Core CS subjects (DBMS, DSA, OS, CN, OOP, Java)');

    // 2. Fetch Single Subject Tree
    console.log('\n--- 2. Testing Subject Tree & Syllabus ---');
    const r2 = await request('/api/study/subjects/dbms');
    assert(r2.status === 200 && r2.data.success, 'GET /api/study/subjects/dbms returns subject details');
    const dbmsChapters = r2.data.subject?.chapters || [];
    assert(dbmsChapters.length > 0, `DBMS has ${dbmsChapters.length} chapters populated`);

    const firstTopic = dbmsChapters[0]?.topics?.[0];
    assert(firstTopic && firstTopic.slug, `First topic identified: "${firstTopic?.title}" (slug: ${firstTopic?.slug})`);

    // 3. Fetch Single Topic Theory Content
    console.log('\n--- 3. Testing Single Topic Reading & Structure ---');
    const r3 = await request(`/api/study/topics/${firstTopic.slug}`);
    assert(r3.status === 200 && r3.data.success, `GET /api/study/topics/${firstTopic.slug} loads theory tutorial`);
    const topicData = r3.data.topic;
    assert(topicData.content && topicData.content.includes('<'), 'Topic contains rich HTML/theory content');
    assert(topicData.breadcrumbs && topicData.breadcrumbs.subject, 'Topic includes breadcrumb context');

    // 4. Topic Search
    console.log('\n--- 4. Testing Topic Concept Search ---');
    const r4 = await request('/api/study/search?q=acid');
    assert(r4.status === 200 && r4.data.success, 'GET /api/study/search?q=acid returns search results');
    assert(Array.isArray(r4.data.results) && r4.data.results.length > 0, `Search found ${r4.data.results?.length} matching topics`);

    // 5. Authenticated Student Interactions (Bookmark & Progress)
    console.log('\n--- 5. Testing Student Bookmark & Progress Tracking ---');
    // Toggle Bookmark
    const r5a = await request(`/api/study/bookmarks/${firstTopic.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(r5a.status === 200 && r5a.data.success, 'POST /api/study/bookmarks toggles bookmark');
    const isBookmarked = r5a.data.bookmarked;

    const r5b = await request('/api/study/bookmarks', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(r5b.status === 200 && r5b.data.success, 'GET /api/study/bookmarks returns student bookmarks list');
    const foundBm = (r5b.data.bookmarks || []).some(b => b.topic_id === firstTopic.id);
    assert(foundBm === isBookmarked, `Bookmark state matches: ${isBookmarked}`);

    // Update Progress (80%, completed: true)
    const r5c = await request(`/api/study/progress/${firstTopic.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ progressPercent: 100, isCompleted: true })
    });
    assert(r5c.status === 200 && r5c.data.success, 'POST /api/study/progress updates student reading progress to 100%');

    // Check Recently Viewed
    const r5d = await request('/api/study/recently-viewed', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(r5d.status === 200 && r5d.data.success, 'GET /api/study/recently-viewed lists recently read topics');
    assert((r5d.data.recent || []).length > 0, 'Recently viewed list has active entries');

    // Check Student Study Stats
    const r5e = await request('/api/study/stats', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(r5e.status === 200 && r5e.data.success, 'GET /api/study/stats returns progress analytics');
    assert(r5e.data.stats?.completedTopics >= 1, `Student completedTopics: ${r5e.data.stats?.completedTopics}`);

    // 6. Faculty / Admin Workflow (Draft/Publish/Unpublish & CRUD)
    console.log('\n--- 6. Testing Faculty Studio Workflow (Draft/Publish & Attachments) ---');
    const r6Overview = await request('/api/study/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(r6Overview.status === 200 && r6Overview.data.success, 'GET /api/study/admin/overview returns faculty studio overview');

    // Step A: Create Draft Subject
    const r6Sub = await request('/api/study/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Cloud Computing & Microservices',
        code: `CLOUD_TEST_${Date.now()}`,
        category: 'Systems',
        description: 'Automated test subject for cloud systems architecture',
        icon: 'cloud',
        color: '#0284c7',
        display_order: 99,
        status: 'draft' // DRAFT
      })
    });
    assert(r6Sub.status === 201 && r6Sub.data.success, 'Faculty creates new DRAFT subject');
    const newSubjectId = r6Sub.data.id;

    // Verify student CANNOT see this draft subject
    const r6StudentCheck = await request('/api/study/subjects');
    const studentSeesDraftSub = (r6StudentCheck.data.subjects || []).some(s => s.id === newSubjectId);
    assert(!studentSeesDraftSub, 'Student catalog hides draft subject (Student sees only published content)');

    // Step B: Create Chapter in new subject
    const r6Chap = await request('/api/study/chapters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        subject_id: newSubjectId,
        title: 'Microservices Design Patterns',
        description: 'API Gateway and Service Mesh patterns',
        display_order: 1,
        status: 'published'
      })
    });
    assert(r6Chap.status === 201 && r6Chap.data.success, 'Faculty creates chapter inside subject');
    const newChapterId = r6Chap.data.id;

    // Step C: Create Topic in Draft status
    const testSlug = `api-gateway-mesh-${Date.now()}`;
    const r6Topic = await request('/api/study/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        chapter_id: newChapterId,
        subject_id: newSubjectId,
        title: 'API Gateway & Service Mesh Architecture',
        slug: testSlug,
        estimated_reading_minutes: 6,
        display_order: 1,
        status: 'draft', // DRAFT
        summary: 'Theory tutorial covering reverse proxies, rate limiting, and mTLS',
        content: `
          <h2>API Gateway Design Pattern</h2>
          <div class="callout callout-def">
            <strong>Definition:</strong> An API Gateway serves as a single entry point for all client requests in a microservices ecosystem.
          </div>
          <p>It encapsulates the internal system architecture and provides an API that is tailored to each client.</p>
        `
      })
    });
    assert(r6Topic.status === 201 && r6Topic.data.success, 'Faculty creates new DRAFT topic');
    const newTopicId = r6Topic.data.id;

    // Verify Student gets 404 on draft topic
    const r6TopicStudentCheck = await request(`/api/study/topics/${testSlug}`);
    assert(r6TopicStudentCheck.status === 404, 'Student GET on draft topic returns 404 Not Found');

    // Step D: Publish Subject and Topic
    await request(`/api/study/subjects/${newSubjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'published' })
    });
    const r6PublishTopic = await request(`/api/study/topics/${newTopicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'published' })
    });
    assert(r6PublishTopic.status === 200 && r6PublishTopic.data.success, 'Faculty updates topic status to PUBLISHED');

    // Verify Student CAN now read the published topic
    const r6TopicStudentSuccess = await request(`/api/study/topics/${testSlug}`);
    assert(r6TopicStudentSuccess.status === 200 && r6TopicStudentSuccess.data.success, 'Student can now access and read the PUBLISHED topic');

    // Step E: Upload Attachment (PDF/DOCX Note)
    console.log('\n--- 7. Testing File Upload & Note Download ---');
    const tempFilePath = path.join(__dirname, 'test_lecture_notes.pdf');
    fs.writeFileSync(tempFilePath, '%PDF-1.4\n% PlacementPro Test Lecture Notes Sample\n%%EOF');

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileContent = fs.readFileSync(tempFilePath);
    
    // Construct multipart body
    let bodyBuffers = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="subject_id"\r\n\r\n${newSubjectId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="topic_id"\r\n\r\n${newTopicId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nMicroservices Reference Slides\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nComplete lecture handout for API Gateway patterns\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="notesFile"; filename="microservices_lecture_handout.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];
    const multipartBody = Buffer.concat(bodyBuffers);

    const r7Upload = await request('/api/study/attachments', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`
      },
      body: multipartBody
    });
    assert(r7Upload.status === 201 && r7Upload.data.success, 'Faculty uploads PDF lecture notes handout');
    const newAttachmentId = r7Upload.data.id;

    // Test Attachment Download
    const r7Download = await request(`/api/study/attachments/${newAttachmentId}/download`);
    assert(r7Download.status === 200, 'GET /api/study/attachments/:id/download serves file successfully');

    // Clean up temporary local test file
    try { fs.unlinkSync(tempFilePath); } catch (e) {}

    // Step F: Unpublish Topic
    console.log('\n--- 8. Testing Unpublish & Clean Deletion ---');
    await request(`/api/study/topics/${newTopicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'draft' })
    });
    const r8StudentAfterUnpublish = await request(`/api/study/topics/${testSlug}`);
    assert(r8StudentAfterUnpublish.status === 404, 'Unpublished topic becomes inaccessible to students immediately');

    // Step G: Delete Attachment, Topic, Chapter, and Subject
    const r8DelAtt = await request(`/api/study/attachments/${newAttachmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(r8DelAtt.status === 200, 'DELETE /api/study/attachments/:id deletes attachment');

    const r8DelTopic = await request(`/api/study/topics/${newTopicId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(r8DelTopic.status === 200, 'DELETE /api/study/topics/:id deletes topic');

    const r8DelChap = await request(`/api/study/chapters/${newChapterId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(r8DelChap.status === 200, 'DELETE /api/study/chapters/:id deletes chapter');

    const r8DelSub = await request(`/api/study/subjects/${newSubjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(r8DelSub.status === 200, 'DELETE /api/study/subjects/:id deletes subject');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed === 0) {
      console.log('ALL MODULE VERIFICATIONS COMPLETED SUCCESSFULLY!');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite encountered an unexpected error:', err);
    process.exit(1);
  }
}

runVerification();
