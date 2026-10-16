require('dotenv').config();
const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');

(async () => {
  const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
  const token = jwt.sign(
    { id: '8b964856-ee3c-45cd-a048-7d4a991734c3', email: 'pproadmin@gmail.com', name: 'Dr. S. Patil', role: 'admin' },
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
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('request', req => {
    if (req.url().includes('intelligence-stats')) {
      console.log('REQ HEADERS:', JSON.stringify(req.headers(), null, 2));
    }
  });
  page.on('response', async res => {
    if (res.status() >= 400) {
      console.log('FAILED RESPONSE:', res.status(), res.url());
      try { console.log('BODY:', await res.text()); } catch {}
    }
  });

  // 1. Desktop View
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:5000/admin-login');
  await page.evaluate((tok) => {
    localStorage.setItem('adminToken', tok);
    localStorage.setItem('token', tok);
  }, token);
  await page.goto('http://localhost:5000/pages/admindash.html', {
    waitUntil: 'networkidle2'
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/admindash_improved_desktop.png', fullPage: true });
  console.log('Saved scratch/admindash_improved_desktop.png');

  // 2. Tablet View
  await page.setViewport({ width: 850, height: 900 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'scratch/admindash_improved_tablet.png', fullPage: true });
  console.log('Saved scratch/admindash_improved_tablet.png');

  // 3. Mobile View
  await page.setViewport({ width: 420, height: 850 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'scratch/admindash_improved_mobile.png', fullPage: true });
  console.log('Saved scratch/admindash_improved_mobile.png');

  // 4. Dark Mode View (Desktop 1400 x 900)
  await page.setViewport({ width: 1400, height: 900 });
  await page.evaluate(() => {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'scratch/admindash_improved_dark.png', fullPage: true });
  console.log('Saved scratch/admindash_improved_dark.png');

  await browser.close();
})();
