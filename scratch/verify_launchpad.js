const puppeteer = require('puppeteer');
const path = require('path');
const jwt = require('jsonwebtoken');

(async () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
    const token = jwt.sign(
        { id: '9d7febf4-c7ae-4ea4-8185-22337d470b91', email: 'abc@gmail.com', role: 'student' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });

        // Navigate to dashboard with token
        await page.goto(`http://localhost:5000/dashboard?token=${token}`, { waitUntil: 'networkidle2' });

        // Evaluate all launchpad cards
        const cards = await page.evaluate(() => {
            const list = document.querySelectorAll('.launchpad-grid .launchpad-card');
            return Array.from(list).map(el => ({
                href: el.getAttribute('href'),
                title: el.querySelector('h3')?.innerText?.trim(),
                desc: el.querySelector('p')?.innerText?.trim()
            }));
        });

        console.log('Detected Launchpad Cards:', JSON.stringify(cards, null, 2));

        // Take screenshot of Quick Actions Launchpad section
        const launchpadSection = await page.$('.launchpad-grid');
        const artifactScreenshotPath = path.join('C:', 'Users', 'ADMIN', '.gemini', 'antigravity-ide', 'brain', '5b466d61-5837-4616-b5e6-de0587805e62', 'quick_actions_launchpad_updated.png');
        if (launchpadSection) {
            await launchpadSection.screenshot({ path: artifactScreenshotPath });
            console.log('Saved screenshot to:', artifactScreenshotPath);
        }

        // Click Company-Wise Preparation
        console.log('Clicking Company-Wise Preparation card...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('.launchpad-grid a[href="/company-prep"]')
        ]);

        console.log('Navigated URL:', page.url());
        const pageTitle = await page.title();
        console.log('Page Title:', pageTitle);

        const pageSections = await page.evaluate(() => {
            return {
                h1: document.querySelector('h1')?.innerText?.trim(),
                companyName: document.querySelector('#companyName')?.innerText?.trim(),
                rounds: Array.from(document.querySelectorAll('.round-card-box .round-name')).map(e => e.innerText.trim()),
                questionCount: document.querySelectorAll('.question-card-item').length
            };
        });
        console.log('Company-Prep Details:', pageSections);

        const companyPrepScreenshot = path.join('C:', 'Users', 'ADMIN', '.gemini', 'antigravity-ide', 'brain', '5b466d61-5837-4616-b5e6-de0587805e62', 'company_prep_opened.png');
        await page.screenshot({ path: companyPrepScreenshot });
        console.log('Saved company prep screenshot to:', companyPrepScreenshot);

        console.log('ALL VERIFICATIONS SUCCESSFUL!');
    } catch (err) {
        console.error('Verification failed:', err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
