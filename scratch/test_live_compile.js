const http = require('http');

async function testCompile() {
  const code = `#include <stdio.h>

int main() {
    printf("PlacementPro + GCC Live Compilation Working!\\n");
    return 0;
}
`;

  const compileRes = await fetch('http://127.0.0.1:5000/api/compiler/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceCode: code,
      standard: 'c17',
      optimization: '-O0'
    })
  });

  const compileData = await compileRes.json();
  console.log('COMPILE HTTP STATUS:', compileRes.status);
  console.log('COMPILE SUCCESS:', compileData.success);

  if (!compileData.success) {
    console.error('COMPILE ERROR:', compileData.error || compileData.message);
    process.exit(1);
  }

  const data = compileData.data;
  console.log('JOB ID:', data.jobId);
  console.log('GCC VERSION:', data.compiler.version);
  console.log('PHASES:');
  console.log('  1. Lexical Analysis:', data.phases.lexical.status, `(${data.phases.lexical.artifact.tokens.length} tokens)`);
  console.log('  2. Syntax Analysis (AST):', data.phases.syntax.status);
  console.log('  3. Semantic Analysis:', data.phases.semantic.status);
  console.log('  4. Intermediate IR (GIMPLE):', data.phases.intermediate.status);
  console.log('  5. Code Optimization:', data.phases.optimization.status);
  console.log('  6. Target Code (Assembly):', data.phases.target_code.status);

  // Test execution
  const runRes = await fetch(`http://127.0.0.1:5000/api/compiler/compilations/${data.jobId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stdin: '',
      timeoutMs: 5000
    })
  });

  const runData = await runRes.json();
  console.log('\nRUN HTTP STATUS:', runRes.status);
  console.log('RUN SUCCESS:', runData.success);
  console.log('EXIT CODE:', runData.data.exitCode);
  console.log('STDOUT:', JSON.stringify(runData.data.stdout));
  console.log('DURATION:', runData.data.durationMs, 'ms');
  console.log('TERMINATION REASON:', runData.data.terminationReason);
}

testCompile().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
