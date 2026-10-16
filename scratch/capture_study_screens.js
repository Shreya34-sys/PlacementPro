const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const JWT_SECRET = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
const studentToken = jwt.sign({
  id: '9d7febf4-c7ae-4ea4-8185-22337d470b91',
  email: 'abc@gmail.com',
  name: 'Student ABC',
  role: 'student'
}, JWT_SECRET, { expiresIn: '2h' });

const adminToken = jwt.sign({
  id: '8b964856-ee3c-45cd-a048-7d4a991734c3',
  email: 'pproadmin@gmail.com',
  name: 'Dr. S. Patil',
  role: 'admin'
}, JWT_SECRET, { expiresIn: '2h' });

const outputDir = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Student Study Materials Hub (Desktop)
  console.log('Capturing Study Materials Hub (Desktop)...');
  await page.setViewport({ width: 1400, height: 900 });
  await page.evaluateOnNewDocument((tok) => {
    localStorage.setItem('token', tok);
  }, studentToken);
  await page.goto('http://localhost:5000/study-materials', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, 'study_materials_hub_desktop.png'), fullPage: false });

  // 2. Tutorial Reader Page (Desktop 3-column) - Java JVM Architecture
  console.log('Capturing Java JVM Architecture...');
  await page.goto('http://localhost:5000/study-reader?subject=java&topic=jvm-jre-jdk-and-memory-architecture', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, 'study_reader_java_jvm.png'), fullPage: false });

  // 2b. Tutorial Reader Page - DSA Asymptotic Complexity & Master Theorem
  console.log('Capturing DSA Asymptotic Complexity & Master Theorem...');
  await page.goto('http://localhost:5000/study-reader?subject=dsa&topic=asymptotic-notations-master-theorem-complexity', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, 'study_reader_dsa.png'), fullPage: false });

  // 2c. Tutorial Reader Page - OS CPU Scheduling with Gantt chart
  console.log('Capturing OS CPU Scheduling with Gantt chart...');
  await page.goto('http://localhost:5000/study-reader?subject=os&topic=cpu-scheduling-algorithms-and-gantt-charts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, 'study_reader_os_scheduling.png'), fullPage: false });

  // 3. Tutorial Reader Page (Tablet 768px)
  console.log('Capturing Tutorial Reader Page (Tablet)...');
  await page.setViewport({ width: 768, height: 1024 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outputDir, 'study_reader_tablet.png'), fullPage: false });

  // 4. Tutorial Reader Page (Mobile 375px)
  console.log('Capturing Tutorial Reader Page (Mobile)...');
  await page.setViewport({ width: 375, height: 812 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outputDir, 'study_reader_mobile.png'), fullPage: false });

  // 5. Faculty Study Materials Studio (Desktop)
  console.log('Capturing Faculty Study Materials Studio...');
  const adminPage = await browser.newPage();
  await adminPage.setViewport({ width: 1400, height: 900 });
  await adminPage.evaluateOnNewDocument((tok) => {
    localStorage.setItem('adminToken', tok);
  }, adminToken);
  await adminPage.goto('http://localhost:5000/admin-study-materials', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await adminPage.screenshot({ path: path.join(outputDir, 'admin_study_materials.png'), fullPage: false });

  // Switch to Topic Studio Tab
  await adminPage.evaluate(() => {
    const tab = document.querySelector('.studio-tab-btn[data-tab="tab-editor"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await adminPage.screenshot({ path: path.join(outputDir, 'admin_study_editor_tab.png'), fullPage: false });

  // Switch to Notes & Handouts Tab
  await adminPage.evaluate(() => {
    const tab = document.querySelector('.studio-tab-btn[data-tab="tab-notes"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await adminPage.screenshot({ path: path.join(outputDir, 'admin_study_notes_tab.png'), fullPage: false });

  console.log('All screenshots captured successfully.');
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
