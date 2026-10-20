const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');
require('dotenv').config();

(async () => {
  const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
  const token = jwt.sign(
    { id: '9d7febf4-c7ae-4ea4-8185-22337d470b91', email: 'abc@gmail.com', role: 'student', username: 'Student_Test' },
    secret,
    { expiresIn: '1d' }
  );

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // 1. Desktop View (1440 x 1200)
  await page.setViewport({ width: 1440, height: 1200 });
  await page.goto(`http://localhost:5000/analytics?token=${token}`, {
    waitUntil: 'networkidle2'
  });

  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scratch/analytics_desktop_full.png', fullPage: true });
  console.log('Saved scratch/analytics_desktop_full.png');

  // 2. Mobile View (390 x 844)
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: 'scratch/analytics_mobile_full.png', fullPage: true });
  console.log('Saved scratch/analytics_mobile_full.png');

  await browser.close();
  process.exit(0);
})();
