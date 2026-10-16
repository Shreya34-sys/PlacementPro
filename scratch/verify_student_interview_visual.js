require('dotenv').config();
const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');

(async () => {
  const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
  const studentToken = jwt.sign(
    { id: '9d7febf4-c7ae-4ea4-8185-22337d470b91', email: 'abc@gmail.com', role: 'student' },
    secret,
    { expiresIn: '1d' }
  );
  const adminToken = jwt.sign(
    { id: '8b964856-ee3c-45cd-a048-7d4a991734c3', email: 'pproadmin@gmail.com', role: 'admin' },
    secret,
    { expiresIn: '1d' }
  );

  const BASE_URL = 'http://localhost:5000';

  console.log('1. Admin publishes real scheduled interview...');
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createRes = await fetch(`${BASE_URL}/api/interviews/admin/sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Amazon SDE-1 Technical Round',
      companyName: 'Amazon',
      description: 'System design, trees, dynamic programming',
      category: 'technical',
      status: 'published',
      deadline: tomorrow,
      defaultPreparationSeconds: 30,
      defaultAnswerSeconds: 180,
      questions: [
        { questionText: 'Design a scalable rate limiter.', referenceAnswer: 'Token bucket / leaky bucket' }
      ]
    })
  });
  const createData = await createRes.json();
  const setId = createData.id;
  console.log('Created and published interview setId:', setId);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Navigate to student dashboard
  await page.goto(`${BASE_URL}/dashboard?token=${studentToken}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: 'scratch/stddash_with_real_interview.png', fullPage: true });
  console.log('Saved scratch/stddash_with_real_interview.png');

  // Now delete the interview
  console.log('2. Admin deletes the interview...');
  await fetch(`${BASE_URL}/api/interviews/admin/sets/${setId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  // Wait for Socket.IO broadcast or reload
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: 'scratch/stddash_empty_interviews.png', fullPage: true });
  console.log('Saved scratch/stddash_empty_interviews.png');

  await browser.close();
  console.log('Visual verification complete!');
  process.exit(0);
})();
