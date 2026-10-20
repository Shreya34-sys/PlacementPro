'use strict';
require('dotenv').config();

const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';

const studentPayload = {
  id: '9d7febf4-c7ae-4ea4-8185-22337d470b91',
  fullName: 'abc',
  role: 'student',
  email: 'abc@gmail.com'
};

const studentToken = jwt.sign(studentPayload, JWT_SECRET, { expiresIn: '1h' });

function request(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('Testing student personal analytics endpoint...');
  const res = await request('/api/analytics/overview?range=30d', studentToken);
  console.log('Status:', res.status);
  console.log('Success:', res.body.success);
  console.log('Student:', res.body.meta.fullName, '(' + res.body.meta.email + ')');
  console.log('Readiness Score:', res.body.readiness.overallScore + '%');
  console.log('Calculation Formula:', res.body.readiness.calculationFormula);
  console.log('Module Breakdown:', res.body.readiness.moduleProgressBreakdown);
  console.log('Modules telemetry:');
  console.log('- Coding compiler runs:', res.body.modules.coding.compilerRuns);
  console.log('- Aptitude questions solved:', res.body.modules.aptitude.questionsSolved);
  console.log('- Exams completed:', res.body.modules.exams.completedCount);
  console.log('- Interviews completed:', res.body.modules.interviews.completedCount);
  console.log('- Versant overall score:', res.body.modules.versant.latest?.overall_score);
  console.log('- Study topics tracked:', res.body.modules.studyMaterials.totalTopicsTracked);
  console.log('- Resume ATS score:', res.body.modules.resume?.ats_score);
  console.log('Weak topics identified:', res.body.weakTopics);
  console.log('Personalized recommendations count:', res.body.recommendations.length);
  console.log('Recent feed items count:', res.body.recentFeed.length);

  if (res.status === 200 && res.body.readiness.overallScore > 0) {
    console.log('\n✓ Student Personal Progress Analytics API Verified Successfully!');
  } else {
    console.error('\n✗ Verification failed!');
    process.exit(1);
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
