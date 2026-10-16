require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign(
  { id: '9d7febf4-c7ae-4ea4-8185-22337d470b91', role: 'student', email: 'abc@gmail.com' },
  process.env.JWT_SECRET || 'placementpro_secret_key_@987#'
);

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/progress/summary',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('PROGRESS SUMMARY:', data);
  });
});

req.on('error', err => console.error(err));
req.end();
