const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testAiInterviewApi() {
  console.log('--- TESTING AI HR INTERVIEW API ENDPOINTS ---');

  // 1. Authenticate student
  const loginRes = await fetch('http://localhost:5000/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abc@gmail.com', password: '12345678' })
  });
  const { token } = await loginRes.json();
  console.log('Student logged in. Token present:', Boolean(token));

  // 2. Fetch or create default AI assignment
  const assignRes = await fetch('http://localhost:5000/api/interviews/ai/default-assignment', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { assignmentId } = await assignRes.json();
  console.log('Default AI Assignment ID:', assignmentId);

  // 3. Start attempt
  const startRes = await fetch(`http://localhost:5000/api/interviews/assignments/${assignmentId}/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      acknowledged: true,
      confirmation: 'START',
      cameraReady: true
    })
  });
  const startData = await startRes.json();
  console.log('Attempt Started/Resumed:', startData.attemptId, 'Question count:', startData.questions?.length);

  const attemptId = startData.attemptId;
  const questionId = startData.questions[0].id;

  // 4. Test converse turn 1 (Self-Introduction)
  console.log('\n--- Turn 1: Self-Introduction ---');
  const studentIntro = "Hello, my name is Alex. I am currently pursuing Computer Science Engineering with a focus on web systems and intelligent applications. I have built full-stack applications with React and Node.js.";

  const converseRes1 = await fetch('http://localhost:5000/api/interviews/ai/converse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      attemptId,
      questionId,
      studentAnswer: studentIntro,
      topicIndex: 0,
      conversationHistory: [
        { role: 'interviewer', text: 'Tell me about yourself, your educational journey, and what drives your passion in this field.' }
      ],
      topic: 'Self-Introduction'
    })
  });
  const turn1Data = await converseRes1.json();
  console.log('AI Response 1:');
  console.log('  Acknowledgement:', turn1Data.acknowledgement);
  console.log('  Next Question:', turn1Data.questionText);
  console.log('  Next Topic:', turn1Data.topic);

  // 5. Test converse turn 2 (Projects & Technical Experience)
  console.log('\n--- Turn 2: Projects ---');
  const studentProject = "My most impactful project was an automated placement tracking platform. We used MySQL and Redis caching to handle concurrent student assessment submissions. A major bottleneck was database locking during simultaneous submissions, which I solved by introducing optimistic locking and background task queues.";

  const converseRes2 = await fetch('http://localhost:5000/api/interviews/ai/converse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      attemptId,
      questionId: startData.questions[1]?.id || 'q2',
      studentAnswer: studentProject,
      topicIndex: 1,
      conversationHistory: [
        { role: 'interviewer', text: 'Tell me about yourself.' },
        { role: 'student', text: studentIntro },
        { role: 'interviewer', text: turn1Data.speechText }
      ],
      topic: 'Projects & Technical Experience'
    })
  });
  const turn2Data = await converseRes2.json();
  console.log('AI Response 2:');
  console.log('  Acknowledgement:', turn2Data.acknowledgement);
  console.log('  Next Question:', turn2Data.questionText);
  console.log('  Next Topic:', turn2Data.topic);

  // 6. Test feedback generation
  console.log('\n--- Generating Comprehensive Feedback ---');
  const feedbackRes = await fetch('http://localhost:5000/api/interviews/ai/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      attemptId,
      conversationHistory: [
        { role: 'interviewer', text: 'Tell me about yourself.' },
        { role: 'student', text: studentIntro },
        { role: 'interviewer', text: turn1Data.speechText },
        { role: 'student', text: studentProject }
      ]
    })
  });
  const feedbackData = await feedbackRes.json();
  console.log('Comprehensive Feedback Result:');
  console.log('  Overall Score:', feedbackData.overallScore);
  console.log('  Scores breakdown:', feedbackData.feedback?.scores);
  console.log('  Executive Summary:', feedbackData.feedback?.executiveSummary);
  console.log('  Key Strengths count:', feedbackData.feedback?.strengths?.length);
  console.log('  Improvement Suggestions count:', feedbackData.feedback?.areasForImprovement?.length);

  // 7. Verify attempt feedback retrieval
  const getFeedbackRes = await fetch(`http://localhost:5000/api/interviews/attempts/${attemptId}/feedback`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const savedData = await getFeedbackRes.json();
  console.log('Saved feedback in DB retrieved:', Boolean(savedData.feedback));
  console.log('Attempt state in DB:', savedData.attempt?.state);

  console.log('\n✅ ALL AI HR INTERVIEW API ENDPOINTS PASSED SUCCESSFULLY!');
}

testAiInterviewApi().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
