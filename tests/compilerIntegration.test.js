const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');

// Compiler Services
const tokenAnalyzer = require('../services/compiler/token-analyzer');
const astGenerator = require('../services/compiler/ast-generator');
const semanticAnalyzer = require('../services/compiler/semantic-analyzer');
const irExtractor = require('../services/compiler/ir-extractor');
const optimizationComparator = require('../services/compiler/optimization-comparator');
const assemblyAnalyzer = require('../services/compiler/assembly-analyzer');
const { parseDiagnostics } = require('../services/compiler/diagnostics');
const { EXERCISES, getAllExercises, getExerciseById } = require('../services/compiler/sampleExercises');
const worker = require('../services/compiler/worker.client');
const pool = require('../config/db');

// Sample C Program for Testing
const SAMPLE_C_PROGRAM = `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    int x = 10;
    int y = 20;
    int sum = add(x, y);
    printf("Sum is %d\\n", sum);
    return 0;
}
`;

test('Phase 1: Tokenizer produces structured tokens, keywords, and stream', async () => {
  const result = tokenAnalyzer.analyze(SAMPLE_C_PROGRAM);
  assert.ok(result, 'Lexical analysis result should exist');
  assert.ok(Array.isArray(result.tokens), 'tokens should be an array');
  assert.ok(result.tokens.length > 10, 'should generate tokens');
  assert.ok(result.summary, 'summary should be present');
  assert.ok(result.summary.keywords > 0, 'should detect C keywords like int, return');
  assert.ok(result.summary.identifiers > 0, 'should detect identifiers like add, main, x, y');
});

test('Phase 2: AST Generator parses functions, declarations, and statements', async () => {
  const result = astGenerator.generate(SAMPLE_C_PROGRAM);
  assert.ok(result, 'AST generation result should exist');
  assert.equal(result.status, 'success', 'AST parser should return status=success');
  assert.equal(result.ast.type, 'TranslationUnit', 'Root AST node should be TranslationUnit');
  assert.ok(Array.isArray(result.ast.children), 'AST root children should be an array');
  assert.ok(result.ast.children.length >= 2, 'should parse add and main function definitions');
});

test('Phase 3: Semantic Analyzer builds symbol tables and scopes', async () => {
  const astResult = astGenerator.generate(SAMPLE_C_PROGRAM);
  const semantics = semanticAnalyzer.analyze(astResult.ast, []);
  assert.ok(semantics, 'Semantic analysis result should exist');
  assert.ok(Array.isArray(semantics.symbolTables), 'symbolTables should be an array');
  assert.ok(semantics.totalSymbols > 0, 'should discover symbols');
  
  // Verify Global Scope contains functions
  const globalScope = semantics.symbolTables.find(s => s.scopeName === 'Global Scope');
  assert.ok(globalScope, 'Global Scope must be present');
  assert.ok(globalScope.symbols['add'], 'Symbol "add" should be present in global scope');
  assert.ok(globalScope.symbols['main'], 'Symbol "main" should be present in global scope');
});

test('Phase 4: IR Extractor parses 3-address code representations', async () => {
  const mockGimple = `int add (int a, int b)
{
  int D.1233;
  D.1233 = a + b;
  return D.1233;
}

int main ()
{
  int D.1234;
  int sum;
  int y;
  int x;

  <bb 2> :
  x = 10;
  y = 20;
  sum = add (x, y);
  printf ("Sum is %d\\n", sum);
  D.1234 = 0;
  return D.1234;
}`;
  const ir = irExtractor.extract(mockGimple, '16.2.0');
  assert.ok(ir, 'IR result should exist');
  assert.equal(ir.status, 'success');
  assert.ok(Array.isArray(ir.functions), 'functions should be extracted');
  assert.equal(ir.functions.length, 2, 'should extract add and main functions');
  assert.ok(ir.totalInstructions > 0, 'should count instructions');
});

test('Phase 5: Optimization Comparator generates meaningful diff and metric analysis', async () => {
  const gimpleO0 = `main ()
{
  int D.1234;
  int x;
  x = 10 + 20;
  return x;
}`;

  const gimpleO2 = `main ()
{
  return 30;
}`;

  const comparison = optimizationComparator.compare(gimpleO0, gimpleO2, '', '-O2');
  assert.ok(comparison, 'Comparison result should exist');
  assert.ok(Array.isArray(comparison.detectedTransformations), 'transformations should be an array');
  assert.ok(comparison.instructionMetrics, 'metrics should be calculated');
});

test('Phase 6: Assembly Analyzer inspects x86_64 instructions with explanations', async () => {
  const asmText = `main:
.LFB0:
    pushq   %rbp
    movq    %rsp, %rbp
    movl    $10, %eax
    popq    %rbp
    ret`;
  const result = assemblyAnalyzer.analyze(asmText, {
    targetArchitecture: 'x86_64-linux-gnu',
    compilerVersion: '16.2.0',
    flags: ['-O0']
  });
  assert.ok(result, 'Assembly analysis result should exist');
  assert.ok(Array.isArray(result.parsedLines), 'parsedLines should exist');
  assert.ok(result.parsedLines.length >= 4, 'should parse pushq, movq, movl, ret');
  assert.ok(result.instructionDictionary, 'instruction dictionary should exist');
});

test('Diagnostics: Parse GCC error outputs into structured line/col/level/message', async () => {
  const mockGccErr = `program.c:6:5: error: expected ';' before 'int'
    6 |     int y = 20;
      |     ^~~
program.c:8:12: warning: unused variable 'unused' [-Wunused-variable]
    8 |     int unused = 5;
      |         ^~~~~~`;
  const diagnostics = parseDiagnostics(mockGccErr, 'program.c');
  assert.ok(Array.isArray(diagnostics));
  assert.equal(diagnostics.length, 2);
  assert.equal(diagnostics[0].severity, 'error');
  assert.equal(diagnostics[0].line, 6);
  assert.equal(diagnostics[1].severity, 'warning');
  assert.equal(diagnostics[1].line, 8);
});

test('Educational Practice: Exercises list includes beginner, intermediate, and advanced', async () => {
  const exercises = EXERCISES;
  assert.ok(Array.isArray(exercises));
  assert.ok(exercises.length >= 10, 'Should have at least 10 sample exercises');

  const difficulties = new Set(exercises.map(e => e.difficulty));
  assert.ok(difficulties.has('beginner'), 'Should have beginner exercises');
  assert.ok(difficulties.has('intermediate'), 'Should have intermediate exercises');
  assert.ok(difficulties.has('advanced'), 'Should have advanced exercises');

  // Verify debugging lab exercises are included
  const debuggingEx = exercises.filter(e => e.isDebuggingExercise);
  assert.ok(debuggingEx.length >= 3, 'Should have syntax, semantic, and linker debugging exercises');

  // Check specific exercise retrieval
  const helloWorld = getExerciseById('hello_world');
  assert.ok(helloWorld);
  assert.equal(helloWorld.id, 'hello_world');
  assert.ok(helloWorld.starterCode.includes('main'));
});

test('Sandbox Security: Worker fail-closed behavior when worker is unconfigured or offline', async () => {
  // worker.compile must throw or reject cleanly when worker is offline/unreachable
  // and MUST NOT compile or execute code on the host machine.
  const originalUrl = process.env.COMPILER_WORKER_URL;
  try {
    process.env.COMPILER_WORKER_URL = 'http://127.0.0.1:59999';
    await worker.compile({
      jobId: '12345678-1234-1234-1234-123456789abc',
      sourceCode: 'int main() { return 0; }',
      standard: 'c11',
      optimization: '-O0'
    });
    assert.fail('Should have failed because isolated Docker worker is offline');
  } catch (err) {
    // Assert that error cleanly states worker unavailability and refuses host execution
    assert.ok(
      err.message.toLowerCase().includes('unavailable') || 
      err.message.toLowerCase().includes('fetch failed') || 
      err.message.toLowerCase().includes('refus'),
      `Expected fail-closed error message, got: ${err.message}`
    );
  } finally {
    process.env.COMPILER_WORKER_URL = originalUrl;
  }
});

test('Database Schema: Verify compiler and C-Visualize tables exist in ppro database', async () => {
  const [tables] = await pool.execute(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN (
        'compiler_jobs', 'compiler_artifacts', 'compiler_execution_results', 'compiler_exercise_attempts',
        'projects', 'source_versions', 'compilation_jobs', 'compilation_artifacts', 'execution_results'
      )
  `);
  
  const tableNames = tables.map(r => r.TABLE_NAME);
  assert.ok(tableNames.includes('compiler_jobs'), 'compiler_jobs must exist');
  assert.ok(tableNames.includes('compiler_artifacts'), 'compiler_artifacts must exist');
  assert.ok(tableNames.includes('compiler_execution_results'), 'compiler_execution_results must exist');
  assert.ok(tableNames.includes('compiler_exercise_attempts'), 'compiler_exercise_attempts must exist');
  assert.ok(tableNames.includes('projects'), 'projects must exist');
  assert.ok(tableNames.includes('source_versions'), 'source_versions must exist');
  assert.ok(tableNames.includes('compilation_jobs'), 'compilation_jobs must exist');
  assert.ok(tableNames.includes('compilation_artifacts'), 'compilation_artifacts must exist');
  assert.ok(tableNames.includes('execution_results'), 'execution_results must exist');
});

test('HTTP Routes: Verify /api/compiler endpoints against running server', async () => {
  // Query /api/compiler/info
  const infoData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:5000/api/compiler/info', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  assert.equal(infoData.success, true);
  assert.equal(infoData.data.compiler, 'gcc');
  assert.ok(Array.isArray(infoData.data.supportedStandards));
  assert.ok(Array.isArray(infoData.data.supportedOptimizations));
});

test('Page Shell: Verify /compiler-practice page is served properly', async () => {
  const pageHtml = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:5000/compiler-practice', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, html: data }));
    }).on('error', reject);
  });

  assert.equal(pageHtml.statusCode, 200);
  assert.ok(pageHtml.html.includes('C-Visualize'));
  assert.ok(pageHtml.html.includes('id="monaco-editor-container"'));
  assert.ok(pageHtml.html.includes('id="btn-compile-visualize"'));
  assert.ok(pageHtml.html.includes('id="btn-run-program"'));
  assert.ok(pageHtml.html.includes('Back to Theory'));
});

test('Backend API: Auth and Project/Version Management Lifecycle', async () => {
  const testUser = `test_student_${Date.now()}`;
  const regRes = await fetch('http://127.0.0.1:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUser,
      email: `${testUser}@example.com`,
      password: 'password123'
    })
  });
  const regData = await regRes.json();
  assert.equal(regRes.status, 201);
  assert.equal(regData.success, true);
  const token = regData.data.token;
  assert.ok(token);

  // /auth/me
  const meRes = await fetch('http://127.0.0.1:5000/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  assert.equal(meRes.status, 200);
  assert.equal(meData.data.user.username, testUser);

  // /projects create
  const projRes = await fetch('http://127.0.0.1:5000/api/v1/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      projectName: 'Binary Search Implementation',
      description: 'Practice project for compiler visualizer',
      initialSource: 'int main() { return 0; }',
      languageStandard: 'c17'
    })
  });
  const projData = await projRes.json();
  assert.equal(projRes.status, 201);
  assert.ok(projData.data.id);

  // /projects/:id/versions save
  const verRes = await fetch(`http://127.0.0.1:5000/api/v1/projects/${projData.data.id}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      sourceCode: 'int main() { printf("v2\\n"); return 0; }',
      languageStandard: 'c17'
    })
  });
  const verData = await verRes.json();
  assert.equal(verRes.status, 201);
  assert.equal(verData.data.version_number, 2);

  // /projects list
  const listRes = await fetch('http://127.0.0.1:5000/api/v1/projects', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  assert.equal(listRes.status, 200);
  assert.ok(listData.data.some(p => p.id === projData.data.id));
});

test.after(async () => {
  try {
    await pool.end();
  } catch (_) {}
});
