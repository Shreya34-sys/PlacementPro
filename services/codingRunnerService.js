// const CodingRound = require('../models/codingRoundModel');

// const LANGUAGE_IDS = Object.fromEntries(
//   Object.entries(CodingRound.languages()).map(([key, value]) => [key, value.judge0Id])
// );

// const PISTON_LANGUAGES = {
//   python: { language: 'python', version: process.env.PISTON_PYTHON_VERSION || '3.10.0' },
//   java: { language: 'java', version: process.env.PISTON_JAVA_VERSION || '15.0.2' },
//   cpp: { language: 'c++', version: process.env.PISTON_CPP_VERSION || '10.2.0' },
//   javascript: { language: 'javascript', version: process.env.PISTON_JAVASCRIPT_VERSION || '18.15.0' }
// };

// function normaliseOutput(value) {
//   return String(value ?? '')
//     .replace(/\r\n/g, '\n')
//     .split('\n')
//     .map(line => line.trimEnd())
//     .join('\n')
//     .trim();
// }

// function runnerName() {
//   const configured = String(process.env.CODING_RUNNER || 'piston').trim().toLowerCase();
//   return configured === 'judge0' ? 'judge0' : 'piston';
// }

// function timeoutMs() {
//   return Math.max(5000, Number(process.env.CODING_RUNNER_TIMEOUT_MS || 30000));
// }

// async function postJson(url, options = {}) {
//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), timeoutMs());
//   try {
//     const response = await fetch(url, { ...options, signal: controller.signal });
//     const body = await response.text();
//     if (!response.ok) {
//       throw new Error(`Code runner rejected the request (${response.status}): ${body.slice(0, 500)}`);
//     }
//     try { return JSON.parse(body); }
//     catch { throw new Error('Code runner returned invalid JSON.'); }
//   } catch (error) {
//     if (error.name === 'AbortError') throw new Error('Code execution timed out.');
//     throw error;
//   } finally {
//     clearTimeout(timeout);
//   }
// }

// async function submitToPiston(sourceCode, language, stdin) {
//   const config = PISTON_LANGUAGES[language];
//   if (!config) throw new Error(`Unsupported coding language: ${language}`);

//   const base = (process.env.PISTON_URL || 'https://emkc.org/api/v2/piston').replace(/\/$/, '');
//   const body = await postJson(`${base}/execute`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
//     body: JSON.stringify({
//       language: config.language,
//       version: config.version,
//       files: [{ name: language === 'java' ? 'Main.java' : undefined, content: String(sourceCode) }],
//       stdin: String(stdin ?? ''),
//       args: [],
//       compile_timeout: 10000,
//       run_timeout: 10000,
//       run_memory_limit: Number(process.env.CODING_MEMORY_LIMIT_KB || 131072) * 1024
//     })
//   });

//   const compile = body.compile || {};
//   const run = body.run || {};
//   return {
//     stdout: run.stdout || '',
//     stderr: run.stderr || '',
//     compile_output: compile.output || compile.stderr || '',
//     status: run.code === 0 ? { description: 'Accepted' } : { description: 'Runtime Error' },
//     time: run.time || null,
//     memory: run.memory ? Math.round(Number(run.memory) / 1024) : null,
//     exitCode: run.code,
//     signal: run.signal || null
//   };
// }

// async function submitToJudge0(sourceCode, language, stdin) {
//   const languageId = LANGUAGE_IDS[language];
//   if (!languageId) throw new Error(`Unsupported coding language: ${language}`);

//   const url = (process.env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/$/, '');
//   const apiKey = process.env.JUDGE0_API_KEY || '';
//   const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
//   if (apiKey) headers['X-Auth-Token'] = apiKey;

//   return postJson(`${url}/submissions?base64_encoded=false&wait=true`, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({
//       source_code: String(sourceCode),
//       language_id: languageId,
//       stdin: String(stdin ?? ''),
//       cpu_time_limit: Number(process.env.CODING_CPU_LIMIT || 2),
//       memory_limit: Number(process.env.CODING_MEMORY_LIMIT_KB || 131072)
//     })
//   });
// }

// async function submitToRunner(sourceCode, language, stdin) {
//   if (runnerName() === 'judge0') return submitToJudge0(sourceCode, language, stdin);
//   return submitToPiston(sourceCode, language, stdin);
// }

// async function runOne(sourceCode, language, testCase) {
//   const result = await submitToRunner(sourceCode, language, testCase.input || '');
//   const actual = result.stdout || '';
//   const expected = testCase.output || '';
//   const compileError = result.compile_output || '';
//   const runtimeError = result.stderr || '';
//   const status = result.status?.description || 'Unknown';

//   return {
//     passed: status === 'Accepted' && normaliseOutput(actual) === normaliseOutput(expected),
//     input: testCase.input || '',
//     expectedOutput: expected,
//     actualOutput: actual,
//     status,
//     compileError,
//     runtimeError,
//     executionTimeMs: result.time ? Math.round(Number(result.time) * 1000) : null,
//     memoryKb: result.memory || null
//   };
// }

// async function evaluate({ sourceCode, language, testCases, mode }) {
//   if (!PISTON_LANGUAGES[language]) throw new Error(`Unsupported coding language: ${language}`);
//   if (!String(sourceCode || '').trim()) throw new Error('Source code is empty.');
//   if (!Array.isArray(testCases) || testCases.length === 0) throw new Error('No test cases configured.');

//   const selected = mode === 'run'
//     ? testCases.filter(tc => tc.is_hidden !== true)
//     : testCases;
//   if (!selected.length) throw new Error('No public test cases configured for Run.');

//   const results = [];
//   for (const testCase of selected) results.push(await runOne(sourceCode, language, testCase));

//   const passedCount = results.filter(r => r.passed).length;
//   const totalCount = results.length;
//   return {
//     status: passedCount === totalCount ? 'Accepted' : 'Failed',
//     passedCount,
//     totalCount,
//     score: totalCount ? Number(((passedCount / totalCount) * 100).toFixed(2)) : 0,
//     executionTimeMs: results.reduce((n, r) => n + Number(r.executionTimeMs || 0), 0),
//     memoryKb: results.reduce((n, r) => Math.max(n, Number(r.memoryKb || 0)), 0),
//     results
//   };
// }

// function studentSafeResult(result, mode) {
//   if (mode === 'run') return result;
//   return {
//     ...result,
//     results: result.results.map((item, index) => ({
//       case: index + 1,
//       passed: item.passed,
//       status: item.status,
//       compileError: item.compileError || '',
//       runtimeError: item.runtimeError || '',
//       executionTimeMs: item.executionTimeMs,
//       memoryKb: item.memoryKb
//     }))
//   };
// }

// module.exports = { evaluate, studentSafeResult };



const CodingRound = require('../models/codingRoundModel');

const LANGUAGE_IDS = Object.fromEntries(
  Object.entries(CodingRound.languages()).map(([key, value]) => [
    key,
    value.judge0Id
  ])
);

/* =========================================================
   JDoodle language configuration
   ========================================================= */

const JDOODLE_LANGUAGES = {
  python: {
    language: 'python3',
    versionIndex: process.env.JDOODLE_PYTHON_VERSION_INDEX || '0'
  },

  java: {
    language: 'java',
    versionIndex: process.env.JDOODLE_JAVA_VERSION_INDEX || '0'
  },

  cpp: {
    language: 'cpp17',
    versionIndex: process.env.JDOODLE_CPP_VERSION_INDEX || '0'
  },

  javascript: {
    language: 'nodejs',
    versionIndex:
      process.env.JDOODLE_JAVASCRIPT_VERSION_INDEX || '0'
  }
};


/* =========================================================
   OUTPUT NORMALIZATION
   ========================================================= */

function normaliseOutput(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}


/* =========================================================
   RUNNER CONFIGURATION
   ========================================================= */

function runnerName() {
  return String(
    process.env.CODING_RUNNER || 'jdoodle'
  )
    .trim()
    .toLowerCase();
}


function timeoutMs() {
  return Math.max(
    5000,
    Number(
      process.env.CODING_RUNNER_TIMEOUT_MS || 30000
    )
  );
}


/* =========================================================
   GENERIC POST JSON
   ========================================================= */

async function postJson(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs()
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(
        `Code runner rejected the request (${response.status}): ${body.slice(
          0,
          500
        )}`
      );
    }

    try {
      return JSON.parse(body);
    } catch {
      throw new Error(
        'Code runner returned invalid JSON.'
      );
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'Code execution timed out.'
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}


/* =========================================================
   JDOODLE EXECUTION
   ========================================================= */

async function submitToJdoodle(
  sourceCode,
  language,
  stdin
) {
  const config =
    JDOODLE_LANGUAGES[language];

  if (!config) {
    throw new Error(
      `Unsupported coding language: ${language}`
    );
  }

  const clientId = String(
    process.env.JDOODLE_CLIENT_ID || ''
  ).trim();

  const clientSecret = String(
    process.env.JDOODLE_CLIENT_SECRET || ''
  ).trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      'JDoodle is selected, but JDOODLE_CLIENT_ID or JDOODLE_CLIENT_SECRET is missing in .env.'
    );
  }

  const url = (
    process.env.JDOODLE_URL ||
    'https://api.jdoodle.com/v1/execute'
  ).replace(/\/$/, '');

  const body = await postJson(url, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },

    body: JSON.stringify({
      clientId,

      clientSecret,

      script: String(sourceCode),

      language: config.language,

      versionIndex: String(
        config.versionIndex
      ),

      stdin: String(stdin ?? '')
    })
  });


  /*
   * JDoodle normally returns:
   *
   * {
   *   output: "...",
   *   statusCode: 200,
   *   memory: "...",
   *   cpuTime: "..."
   * }
   */

  const output = String(
    body.output || ''
  );

  const statusCode =
    body.statusCode === undefined
      ? null
      : Number(body.statusCode);

  const successful =
    statusCode === 200 ||
    (
      statusCode === null &&
      !body.error
    );

  const errorText =
    body.error ||
    body.errorMessage ||
    (!successful ? output : '');

  return {
    stdout: successful
      ? output
      : '',

    stderr: errorText,

    compile_output: errorText,

    status: {
      description: successful
        ? 'Accepted'
        : 'Runtime Error'
    },

    time:
      body.cpuTime != null
        ? Number(body.cpuTime)
        : null,

    memory:
      body.memory != null
        ? Number(body.memory)
        : null,

    exitCode:
      successful ? 0 : 1,

    signal: null
  };
}


/* =========================================================
   JUDGE0 - OPTIONAL
   ========================================================= */

async function submitToJudge0(
  sourceCode,
  language,
  stdin
) {
  const languageId =
    LANGUAGE_IDS[language];

  if (!languageId) {
    throw new Error(
      `Unsupported coding language: ${language}`
    );
  }

  const url = (
    process.env.JUDGE0_URL ||
    'https://ce.judge0.com'
  ).replace(/\/$/, '');

  const apiKey =
    process.env.JUDGE0_API_KEY || '';

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  if (apiKey) {
    headers['X-Auth-Token'] =
      apiKey;
  }

  return postJson(
    `${url}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',

      headers,

      body: JSON.stringify({
        source_code:
          String(sourceCode),

        language_id:
          languageId,

        stdin:
          String(stdin ?? ''),

        cpu_time_limit:
          Number(
            process.env.CODING_CPU_LIMIT || 2
          ),

        memory_limit:
          Number(
            process.env.CODING_MEMORY_LIMIT_KB ||
            131072
          )
      })
    }
  );
}


/* =========================================================
   SELECT RUNNER
   ========================================================= */

async function submitToRunner(
  sourceCode,
  language,
  stdin
) {
  const runner =
    runnerName();


  if (runner === 'jdoodle') {
    return submitToJdoodle(
      sourceCode,
      language,
      stdin
    );
  }


  if (runner === 'judge0') {
    return submitToJudge0(
      sourceCode,
      language,
      stdin
    );
  }


  /*
   * IMPORTANT:
   * Do NOT silently use Piston.
   */

  if (runner === 'piston') {
    throw new Error(
      'Piston public API is no longer supported. Use CODING_RUNNER=jdoodle or CODING_RUNNER=judge0.'
    );
  }


  throw new Error(
    `Unsupported CODING_RUNNER "${runner}". Use "jdoodle" or "judge0".`
  );
}


/* =========================================================
   RUN ONE TEST CASE
   ========================================================= */

async function runOne(
  sourceCode,
  language,
  testCase
) {
  const result =
    await submitToRunner(
      sourceCode,
      language,
      testCase.input || ''
    );

  const actual =
    result.stdout || '';

  const expected =
    testCase.output || '';

  const compileError =
    result.compile_output || '';

  const runtimeError =
    result.stderr || '';

  const status =
    result.status?.description ||
    'Unknown';


  return {
    passed:
      status === 'Accepted' &&
      normaliseOutput(actual) ===
        normaliseOutput(expected),

    input:
      testCase.input || '',

    expectedOutput:
      expected,

    actualOutput:
      actual,

    status,

    compileError,

    runtimeError,

    executionTimeMs:
      result.time != null
        ? Math.round(
            Number(result.time) * 1000
          )
        : null,

    memoryKb:
      result.memory != null
        ? Number(result.memory)
        : null
  };
}


/* =========================================================
   EVALUATE
   ========================================================= */

async function evaluate({
  sourceCode,
  language,
  testCases,
  mode
}) {
  if (!JDOODLE_LANGUAGES[language]) {
    throw new Error(
      `Unsupported coding language: ${language}`
    );
  }


  if (
    !String(sourceCode || '').trim()
  ) {
    throw new Error(
      'Source code is empty.'
    );
  }


  if (
    !Array.isArray(testCases) ||
    testCases.length === 0
  ) {
    throw new Error(
      'No test cases configured.'
    );
  }


  /*
   * RUN:
   * public test cases only.
   *
   * SUBMIT:
   * public + hidden test cases.
   */

  const selected =
    mode === 'run'
      ? testCases.filter(
          tc => tc.is_hidden !== true
        )
      : testCases;


  if (!selected.length) {
    throw new Error(
      'No public test cases configured for Run.'
    );
  }


  const results = [];


  for (
    const testCase of selected
  ) {
    results.push(
      await runOne(
        sourceCode,
        language,
        testCase
      )
    );
  }


  const passedCount =
    results.filter(
      result => result.passed
    ).length;

  const totalCount =
    results.length;


  return {
    status:
      passedCount === totalCount
        ? 'Accepted'
        : 'Failed',

    passedCount,

    totalCount,

    score:
      totalCount
        ? Number(
            (
              (passedCount /
                totalCount) *
              100
            ).toFixed(2)
          )
        : 0,

    executionTimeMs:
      results.reduce(
        (total, result) =>
          total +
          Number(
            result.executionTimeMs || 0
          ),
        0
      ),

    memoryKb:
      results.reduce(
        (max, result) =>
          Math.max(
            max,
            Number(
              result.memoryKb || 0
            )
          ),
        0
      ),

    results
  };
}


/* =========================================================
   STUDENT-SAFE RESULT
   ========================================================= */

function studentSafeResult(
  result,
  mode
) {
  /*
   * RUN:
   * Public input/output can be displayed.
   *
   * SUBMIT:
   * Hidden input/output must NEVER be returned.
   */

  if (mode === 'run') {
    return result;
  }


  return {
    ...result,

    results:
      result.results.map(
        (item, index) => ({
          case: index + 1,

          passed:
            item.passed,

          status:
            item.status,

          compileError:
            item.compileError || '',

          runtimeError:
            item.runtimeError || '',

          executionTimeMs:
            item.executionTimeMs,

          memoryKb:
            item.memoryKb
        })
      )
  };
}


module.exports = {
  evaluate,
  studentSafeResult
};
