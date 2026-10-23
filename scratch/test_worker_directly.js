'use strict';
require('dotenv').config();
const crypto = require('crypto');
const worker = require('../services/compiler/worker.client');

async function main() {
  try {
    console.log('Testing worker info...');
    const info = await worker.info();
    console.log('Worker Info:', info);

    const jobId = crypto.randomUUID();
    const sourceCode = '#include <stdio.h>\n\nint main(void) {\n    printf("Hello World\\n");\n    return 0;\n}\n';

    console.log('Compiling "Hello World" in isolated sandbox...');
    const comp = await worker.compile({
      jobId,
      sourceCode,
      standard: 'c17',
      optimization: '-O0'
    });

    console.log('Compilation success:', comp.success);
    console.log('Linking success:', comp.linkingSuccess);

    console.log('Running program in isolated sandbox...');
    const runResult = await worker.run({
      jobId,
      stdin: '',
      timeoutMs: 5000
    });

    console.log('Run result:', runResult);
  } catch (err) {
    console.error('Worker test failed:', err);
  }
}

main();
