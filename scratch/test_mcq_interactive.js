const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const token = jwt.sign({
    id: '9d7febf4-c7ae-4ea4-8185-22337d470b91',
    email: 'abc@gmail.com',
    name: 'Student ABC',
    role: 'student'
  }, 'placementpro_secret_key_@987#');

  await page.evaluateOnNewDocument(t => localStorage.setItem('token', t), token);
  await page.goto('http://localhost:5000/study-reader?subject=dsa&topic=asymptotic-notations-master-theorem-complexity', { waitUntil: 'networkidle2' });

  const btn = await page.$('.mcq-reveal-btn');
  console.log('MCQ reveal button found:', Boolean(btn));

  if (btn) {
    const textBefore = await page.evaluate(el => el.textContent, btn);
    console.log('Button text before click:', textBefore);

    await btn.click();
    await new Promise(r => setTimeout(r, 200));

    const isVisible = await page.evaluate(() => {
      const expl = document.querySelector('.mcq-explanation');
      return expl && expl.style.display !== 'none';
    });
    console.log('MCQ explanation visible after click:', isVisible);

    const textAfter = await page.evaluate(el => el.textContent, btn);
    console.log('Button text after click:', textAfter);
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
