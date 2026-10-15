const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');
require('dotenv').config();

(async () => {
  const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
  const token = jwt.sign(
    { id: '9d7febf4-c7ae-4ea4-8185-22337d470b91', email: 'abc@gmail.com', role: 'student' },
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

  // 1. Desktop View (1280 x 900)
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`http://localhost:5000/dashboard?token=${token}`, {
    waitUntil: 'networkidle2'
  });
  console.log('Current URL after navigation:', page.url());

  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scratch/stddash_desktop.png', fullPage: true });
  console.log('Saved scratch/stddash_desktop.png');

  // 2. Mobile View (375 x 812 - iPhone)
  await page.setViewport({ width: 375, height: 812 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/stddash_mobile.png', fullPage: true });
  console.log('Saved scratch/stddash_mobile.png');

  // 3. Verification of DOM elements
  const check = await page.evaluate(() => {
    return {
      url: window.location.href,
      learningWidgetExists: !!document.querySelector('.learning-widget'),
      liveProgressCardExists: !!document.querySelector('.live-progress-card'),
      scoreActivityHeading: Array.from(document.querySelectorAll('h1, h2, h3')).some(h => /score and module activity/i.test(h.textContent)),
      solvedModulesListExists: !!document.querySelector('#solvedModulesList'),
      recentScoresListExists: !!document.querySelector('#recentScoresList'),
      welcomeCardExists: !!document.querySelector('.welcome-card'),
      statCardsCount: document.querySelectorAll('.stat-card').length,
      launchpadExists: !!document.querySelector('.launchpad-grid'),
      targetCompaniesExists: !!document.querySelector('.company-grid-card'),
      upcomingInterviewsExists: !!document.querySelector('.sidebar-column'),
      overviewCardExists: !!document.querySelector('.overview-card')
    };
  });
  console.log('DOM checks:', JSON.stringify(check, null, 2));

  await browser.close();
})();
