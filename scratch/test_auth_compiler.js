const jwt = require('jsonwebtoken');

async function testAuth() {
  const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
  const validToken = jwt.sign(
    { id: 1, email: 'student@example.com', role: 'student', username: 'student' },
    secret,
    { expiresIn: '1h' }
  );

  // 1. Unauthenticated request to /api/compiler/projects should return 401
  const unauthRes = await fetch('http://127.0.0.1:5000/api/compiler/projects', {
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Unauthenticated /projects status:', unauthRes.status);
  if (unauthRes.status !== 401) {
    console.error('Expected 401 for unauthenticated request!');
    process.exit(1);
  }

  // 2. Authenticated compile with validToken
  const authCompileRes = await fetch('http://127.0.0.1:5000/api/compiler/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`
    },
    body: JSON.stringify({
      sourceCode: '#include <stdio.h>\nint main() { printf("Auth OK\\n"); return 0; }',
      standard: 'c17',
      optimization: '-O0'
    })
  });
  const authData = await authCompileRes.json();
  console.log('Authenticated compile status:', authCompileRes.status, 'success:', authData.success);

  if (!authData.success) {
    console.error('Authenticated compilation failed!');
    process.exit(1);
  }

  console.log('ALL AUTH CHECKS PASSED!');
}

testAuth();
