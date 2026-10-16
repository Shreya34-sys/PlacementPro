async function testStdinCompile() {
  const code = `#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("Sum = %d\\n", a + b);
    } else {
        printf("Failed to read input\\n");
    }
    return 0;
}
`;

  // 1. Compile
  const compileRes = await fetch('http://127.0.0.1:5000/api/compiler/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceCode: code,
      standard: 'c17',
      optimization: '-O2'
    })
  });

  const compileData = await compileRes.json();
  console.log('COMPILATION:', compileData.success ? 'SUCCESS' : 'FAILED');
  console.log('JOB ID:', compileData.data.jobId);
  console.log('GCC VERSION:', compileData.data.compiler.version);
  console.log('TARGET ARCHITECTURE:', compileData.data.compiler.targetArchitecture);

  // 2. Execute with stdin
  const runRes = await fetch(`http://127.0.0.1:5000/api/compiler/compilations/${compileData.data.jobId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stdin: '42 58\n',
      timeoutMs: 5000
    })
  });

  const runData = await runRes.json();
  console.log('\nEXECUTION WITH STDIN (42 58):');
  console.log('HTTP Status:', runRes.status);
  console.log('Exit Code:', runData.data.exitCode);
  console.log('Stdout:', runData.data.stdout.trim());
  console.log('Execution Duration:', runData.data.durationMs, 'ms');
  console.log('Termination Reason:', runData.data.terminationReason);
}

testStdinCompile().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
