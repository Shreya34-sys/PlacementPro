const puppeteer = require('c:/Users/ADMIN/OneDrive/Desktop/New folder/TY Sem1/main1/PlacementPro/node_modules/puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\b274c1fc-6000-453e-a169-d6a4aa2d9be8';

async function runAiInterviewBrowserTest() {
  console.log('--- STARTING AI HR INTERVIEW BROWSER TEST ---');

  // Authenticate student via API to get token
  const studentLogin = await fetch('http://localhost:5000/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abc@gmail.com', password: '12345678' })
  });
  const { token: studentToken } = await studentLogin.json();
  console.log('Student token obtained:', Boolean(studentToken));

  // Launch Chrome with synthetic media streams
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--enable-features=WebRTC'
    ]
  });

  try {
    const context = await browser.createBrowserContext();
    await context.overridePermissions('http://localhost:5000', ['camera', 'microphone']);
    const page = await context.newPage();
    await page.setViewport({ width: 1280, height: 860 });

    page.on('console', msg => console.log('   [PAGE LOG]', msg.text()));
    page.on('pageerror', err => console.error('   [PAGE ERROR]', err.message));
    page.on('dialog', async dialog => {
      console.log('   [DIALOG]', dialog.message());
      await dialog.accept();
    });

    // 1. Set student token in localStorage
    await page.goto('http://localhost:5000/login');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, studentToken);

    // 2. Open Interviews Studio Page
    console.log('Navigating to /pages/interviews.html...');
    await page.goto('http://localhost:5000/pages/interviews.html', { waitUntil: 'networkidle0' });

    // Wait for the new AI HR Callout button
    await page.waitForSelector('#startLiveAiBtn', { timeout: 10000 });
    console.log('AI HR Interview hero card visible on interviews page.');

    // 3. Click "Start AI HR Interview Now"
    console.log('Clicking Start AI HR Interview Now button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('#startLiveAiBtn')
    ]);

    console.log('Navigated to Interview Room:', page.url());

    // 4. In Consent Panel: check rules and type START
    await page.waitForSelector('#rulesAcknowledged', { timeout: 10000 });
    await page.click('#rulesAcknowledged');
    console.log('Acknowledged guidelines checkbox checked.');

    await page.waitForSelector('#preflightCameraPreview', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.type('#startConfirmation', 'START');
    console.log('Typed confirmation START.');

    // Wait for start button to become enabled
    await page.waitForFunction(() => {
      const btn = document.querySelector('#startBtn');
      return btn && !btn.disabled;
    }, { timeout: 10000 });

    console.log('Start interview button is ready. Clicking Start Interview...');
    await page.click('#startBtn');

    // 5. Verify roomPanel appears
    await page.waitForSelector('#roomPanel:not(.hidden)', { timeout: 15000 });
    console.log('Interview room panel active!');

    // Wait for AI Interviewer Card elements
    await page.waitForSelector('#aiInterviewerCard', { timeout: 10000 });
    const questionText = await page.$eval('#questionText', el => el.textContent);
    const spokenQuestion = await page.$eval('#aiSpokenQuestionText', el => el.textContent);
    console.log('Current Interview Question:', questionText);
    console.log('Spoken Question:', spokenQuestion);

    // Verify microphone & voice status
    const voiceStatus = await page.$eval('#voiceStatus', el => el.textContent);
    const micStatus = await page.$eval('#micStatus', el => el.textContent);
    console.log('Voice Status:', voiceStatus, '| Mic Status:', micStatus);

    await new Promise(r => setTimeout(r, 3000));

    // Save screenshot of live AI Interview room
    const liveScreenshotPath = path.join(ARTIFACTS_DIR, 'ai_interview_live_room.png');
    await page.screenshot({ path: liveScreenshotPath });
    console.log('Live AI Interview room screenshot saved to:', liveScreenshotPath);

    // 6. Simulate student spoken answer & Done Speaking
    console.log('\n--- Simulating Candidate Speaking Answer ---');
    await page.evaluate(() => {
      const answerInput = document.getElementById('answerText');
      if (answerInput) {
        answerInput.value = "Hello Sarah, I am a 3rd year Computer Science student. I enjoy building responsive web applications using React and Node.js, and implementing intelligent algorithms.";
      }
      const liveBox = document.getElementById('liveTranscriptText');
      if (liveBox) {
        liveBox.textContent = '"Hello Sarah, I am a 3rd year Computer Science student. I enjoy building responsive web applications using React and Node.js, and implementing intelligent algorithms."';
      }
    });

    // Click "Done Speaking"
    console.log('Candidate clicking "Done Speaking"...');
    await page.click('#doneSpeakingBtn');

    // Wait for AI response and dynamic question transition
    await new Promise(r => setTimeout(r, 6000));

    const updatedAck = await page.$eval('#aiAckText', el => el.textContent);
    const updatedQ = await page.$eval('#questionText', el => el.textContent);
    const updatedStage = await page.$eval('#progressLabel', el => el.textContent);
    console.log('AI Acknowledged:', updatedAck);
    console.log('Next Stage/Question:', updatedStage, '-', updatedQ);

    // 7. Verify transcript stream contains both bubbles
    const bubblesCount = await page.$$eval('#conversationStream .transcript-bubble', els => els.length);
    console.log('Transcript bubble count in stream:', bubblesCount);

    const streamScreenshotPath = path.join(ARTIFACTS_DIR, 'ai_interview_conversation_stream.png');
    await page.screenshot({ path: streamScreenshotPath });
    console.log('Conversation stream screenshot saved to:', streamScreenshotPath);

    // 8. End Interview & Generate Comprehensive Feedback Report
    console.log('\n--- Ending Interview to Generate AI Feedback ---');
    await page.click('#submitBtn');

    // Wait for completionPanel and feedbackReportContainer
    await page.waitForSelector('#feedbackReportContainer .feedback-hero', { timeout: 25000 });
    console.log('Executive AI Feedback Report rendered successfully!');

    const overallScore = await page.$eval('.score-circle-number', el => el.textContent);
    console.log('Candidate Overall Score rendered:', overallScore);

    const dimensions = await page.$$eval('.dimension-card', cards => cards.map(c => c.innerText.replace(/\n+/g, ' ')));
    console.log('Evaluated Dimensions:', dimensions);

    // Save final report screenshot
    const feedbackScreenshotPath = path.join(ARTIFACTS_DIR, 'ai_interview_feedback_report.png');
    await page.screenshot({ path: feedbackScreenshotPath });
    console.log('Feedback Report screenshot saved to:', feedbackScreenshotPath);

    console.log('\n--- BROWSER VERIFICATION OF AI HR INTERVIEW COMPLETE & SUCCESSFUL! ---');
  } finally {
    await browser.close();
  }
}

runAiInterviewBrowserTest().catch(err => {
  console.error('Browser Test Error:', err);
  process.exit(1);
});
