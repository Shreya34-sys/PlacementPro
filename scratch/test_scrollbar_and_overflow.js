const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const JWT_SECRET = 'placementpro_secret_key_@987#';

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

const testPages = [
  { url: 'http://localhost:5000/study-materials', name: 'Study Materials Catalog Hub', role: 'student' },
  { url: 'http://localhost:5000/study-reader?subject=java&topic=jvm-jre-jdk-and-memory-architecture', name: 'Study Reader (Java JVM)', role: 'student' },
  { url: 'http://localhost:5000/study-reader?subject=dsa&topic=asymptotic-notations-master-theorem-complexity', name: 'Study Reader (DSA Master Theorem)', role: 'student' },
  { url: 'http://localhost:5000/study-reader?subject=os&topic=cpu-scheduling-algorithms-and-gantt-charts', name: 'Study Reader (OS CPU Scheduling)', role: 'student' },
  { url: 'http://localhost:5000/dashboard', name: 'Student Dashboard', role: 'student' },
  { url: 'http://localhost:5000/admin-study-materials', name: 'Faculty Study Studio', role: 'admin' },
  { url: 'http://localhost:5000/admindash', name: 'Admin Dashboard', role: 'admin' },
  { url: 'http://localhost:5000/interviews', name: 'Interviews Hub', role: 'student' }
];

const viewports = [
  { width: 1400, height: 900, name: 'Desktop (1400x900)' },
  { width: 768, height: 1024, name: 'Tablet (768x1024)' },
  { width: 375, height: 812, name: 'Mobile (375x812)' }
];

(async () => {
  console.log('====================================================');
  console.log('PLACEMENTPRO - SCROLLBAR & OVERFLOW AUDIT');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  let passedCount = 0;
  let failedCount = 0;

  await page.evaluateOnNewDocument((sTok, aTok) => {
    localStorage.setItem('token', sTok);
    localStorage.setItem('adminToken', aTok);
  }, studentToken, adminToken);

  for (const pageTest of testPages) {
    console.log(`\nTesting Page: ${pageTest.name}`);

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(pageTest.url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 400));

      // 1. Check Scrollbar styles
      const scrollbarProps = await page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const htmlStyle = window.getComputedStyle(document.documentElement);
        return {
          bodyScrollbarWidth: bodyStyle.scrollbarWidth,
          htmlScrollbarWidth: htmlStyle.scrollbarWidth,
          bodyMsOverflow: bodyStyle.msOverflowStyle,
          htmlMsOverflow: htmlStyle.msOverflowStyle
        };
      });

      // 2. Check Horizontal Overflow (scrollWidth vs clientWidth)
      const overflowMetrics = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientW = docEl.clientWidth;
        const hasHorizontalOverflow = scrollW > clientW + 1; // 1px threshold for sub-pixel anti-aliasing

        let offendingSelectors = [];
        if (hasHorizontalOverflow) {
          const allEls = document.querySelectorAll('*');
          for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.right > clientW + 2) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className ? '.' + String(el.className).split(' ')[0] : '';
              const id = el.id ? '#' + el.id : '';
              offendingSelectors.push(`${tag}${id}${cls} (right: ${Math.round(rect.right)}px vs clientWidth: ${clientW}px)`);
              if (offendingSelectors.length >= 3) break;
            }
          }
        }

        return {
          scrollW,
          clientW,
          hasHorizontalOverflow,
          offendingSelectors
        };
      });

      // 3. Test Scrollability (Ensure user can still scroll down with wheel/keyboard!)
      const canScroll = await page.evaluate(async () => {
        const initialY = window.scrollY;
        window.scrollBy({ top: 150, left: 0, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 100));
        const afterScrollY = window.scrollY;
        window.scrollTo({ top: initialY, left: 0, behavior: 'instant' }); // restore
        return {
          initialY,
          afterScrollY,
          scrolled: afterScrollY > initialY || document.documentElement.scrollHeight <= window.innerHeight + 10
        };
      });

      const scrollbarHidden = scrollbarProps.htmlScrollbarWidth === 'none' && scrollbarProps.bodyScrollbarWidth === 'none';
      const noOverflow = !overflowMetrics.hasHorizontalOverflow;
      const scrollingWorks = canScroll.scrolled;

      if (scrollbarHidden && noOverflow && scrollingWorks) {
        console.log(`  [PASS] ${vp.name}: No scrollbar visible, No horizontal overflow (${overflowMetrics.scrollW}px / ${overflowMetrics.clientW}px), Scrolling active.`);
        passedCount++;
      } else {
        console.error(`  [FAIL] ${vp.name}:`);
        if (!scrollbarHidden) console.error(`    - Scrollbar not hidden: html=${scrollbarProps.htmlScrollbarWidth}, body=${scrollbarProps.bodyScrollbarWidth}`);
        if (!noOverflow) console.error(`    - Horizontal overflow: scrollW=${overflowMetrics.scrollW}px vs clientW=${overflowMetrics.clientW}px. Offending:`, overflowMetrics.offendingSelectors);
        if (!scrollingWorks) console.error(`    - Page did not scroll`);
        failedCount++;
      }
    }
  }

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================');

  await browser.close();
  process.exit(failedCount > 0 ? 1 : 0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
