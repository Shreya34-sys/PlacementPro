const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');

(async () => {
  const secret = 'placementpro_secret_key_@987#';
  const token = jwt.sign(
    { id: 1, email: 'pproadmin@gmail.com', name: 'Dr. S. Patil', role: 'admin' },
    secret,
    { expiresIn: '1d' }
  );

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Desktop View
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(`http://localhost:5000/pages/admindash.html?token=${token}&type=admin`, {
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
