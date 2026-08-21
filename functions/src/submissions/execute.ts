import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Request, Response } from 'express';
import {
  executeCode,
  getLanguages,
  normalizeOutput,
  JudgeStatus,
  SUPPORTED_LANGUAGES,
  Judge0Error,
} from './judge0Service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface EvaluationResult {
  status: JudgeStatus;
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  results: TestCaseResult[];
  errorMessage?: string;
}

interface TestCaseResult {
  input: string;
  expected: string;
  output: string;
  passed: boolean;
  status?: JudgeStatus;
  errorMessage?: string;
  runtime?: number;
  memory?: number;
}

// ---------------------------------------------------------------------------
// XP config
// ---------------------------------------------------------------------------

const XP_BY_DIFFICULTY: Record<string, number> = {
  Easy: 20,
  Medium: 40,
  Hard: 60,
  Expert: 80,
};

// ---------------------------------------------------------------------------
// Cloud Function: getJudgeLanguages
// ---------------------------------------------------------------------------

export const getJudgeLanguagesLogic = async (_req: Request, res: Response): Promise<void> => {
  try {
    const languages = await getLanguages();
    res.status(200).json({ languages });
  } catch (error) {
    console.error('[getJudgeLanguages] Failed to load language list:', error);
    // Always return the static fallback so the frontend is never broken
    res.status(200).json({ languages: SUPPORTED_LANGUAGES });
  }
};

// ---------------------------------------------------------------------------
// Cloud Function: runCode
// Runs user code.
//  • If the problem has visible test cases  → evaluate against them
//  • If no test cases (e.g. Codeforces)    → compile + execute with empty
//    stdin and return raw output so the user can at least see their program
//    compiles and runs correctly
// ---------------------------------------------------------------------------

export const runCodeLogic = async (req: Request, res: Response): Promise<void> => {
  const { problemId, language, languageId, code, customStdin } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!language || typeof language !== 'string') {
    res.status(400).json({ error: 'Missing or invalid parameter: language' });
    return;
  }
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing or invalid parameter: code' });
    return;
  }
  if (code.trim().length === 0) {
    res.status(400).json({ error: 'Source code cannot be empty.' });
    return;
  }
  if (code.length > 65_536) {
    res.status(400).json({ error: 'Source code exceeds the 64 KB limit.' });
    return;
  }

  // Resolve language ID — trust any positive integer (ID came from Judge0's own /languages list)
  const resolvedId = typeof languageId === 'number' && languageId > 0
    ? languageId
    : SUPPORTED_LANGUAGES.find((l) => l.key === language)?.id ?? 54;

  if (!Number.isInteger(resolvedId) || resolvedId <= 0) {
    res.status(400).json({ error: 'Invalid language ID.' });
    return;
  }

  // ── Custom stdin mode ───────────────────────────────────────────────────
  if (typeof customStdin === 'string') {
    try {
      const execution = await executeCode(code, language, customStdin, '', resolvedId);
      const result = {
        status:        execution.status,
        stdout:        execution.stdout,
        stderr:        execution.stderr        || '',
        compileOutput: execution.compileOutput || '',
        runtime:       execution.runtime,
        memory:        execution.memory,
      };
      res.status(200).json({ success: true, mode: 'custom', result });
    } catch (error) {
      handleExecutionError(error, res, 'run (custom stdin)');
    }
    return;
  }

  // ── Problem test-case mode ───────────────────────────────────────────────
  if (!problemId || typeof problemId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid parameter: problemId' });
    return;
  }

  try {
    const db = admin.firestore();

    // Try to load test cases — problem document is optional for Codeforces problems
    let testCases: TestCase[] = [];
    let problemData: admin.firestore.DocumentData | undefined;

    const problemSnap = await db.collection('problems').doc(problemId).get();
    if (problemSnap.exists) {
      problemData = problemSnap.data();
      const visibleCases  = await loadTestCases(problemId, false);
      const fallbackCases = buildFallbackVisibleCases(problemData);
      testCases = visibleCases.length > 0 ? visibleCases : fallbackCases;
    }

    // ── No test cases available (typical for Codeforces problems) ──────────
    // Just compile + run with empty stdin so the user can verify their code
    // compiles and produces output. We show a "Compile & Run" result rather
    // than an evaluation result.
    if (testCases.length === 0) {
      const execution = await executeCode(code, language, '', '', resolvedId);
      const compileRunResult = buildCompileRunResult(execution);
      res.status(200).json({ success: true, mode: 'compile_run', result: compileRunResult });
      return;
    }

    // ── Evaluate against visible test cases ─────────────────────────────
    const result = await evaluateTestCases({ code, language, languageId: resolvedId, testCases });
    res.status(200).json({ success: true, mode: 'testcases', result });
  } catch (error) {
    handleExecutionError(error, res, 'run');
  }
};

// ---------------------------------------------------------------------------
// Cloud Function: submitSolution
// Runs user code against ALL test cases and persists the submission.
// ---------------------------------------------------------------------------

export const submitSolutionLogic = async (req: Request, res: Response): Promise<void> => {
  const db = admin.firestore();
  const { userId, problemId, language, languageId, code } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid parameter: userId' });
    return;
  }
  if (!problemId || typeof problemId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid parameter: problemId' });
    return;
  }
  if (!language || typeof language !== 'string') {
    res.status(400).json({ error: 'Missing or invalid parameter: language' });
    return;
  }
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    res.status(400).json({ error: 'Source code cannot be empty.' });
    return;
  }
  if (code.length > 65_536) {
    res.status(400).json({ error: 'Source code exceeds the 64 KB limit.' });
    return;
  }

  const resolvedId = typeof languageId === 'number' && languageId > 0
    ? languageId
    : SUPPORTED_LANGUAGES.find((l) => l.key === language)?.id ?? 54;

  if (!Number.isInteger(resolvedId) || resolvedId <= 0) {
    res.status(400).json({ error: 'Invalid language ID.' });
    return;
  }

  try {
    const problemRef  = db.collection('problems').doc(problemId);
    const problemSnap = await problemRef.get();

    // For Codeforces problems the doc may not exist in the emulator — that is fine.
    // We still save the submission; we just can't award XP without difficulty data.
    const problem = problemSnap.exists ? (problemSnap.data() ?? {}) : {};

    const configuredCases = await loadTestCases(problemId, true);
    const fallbackCases   = buildFallbackVisibleCases(problem);
    const testCases       = configuredCases.length > 0 ? configuredCases : fallbackCases;

    // ── No test cases: compile + run only, mark as "Pending" (manual review) ──
    if (testCases.length === 0) {
      const execution   = await executeCode(code, language, '', '', resolvedId);
      const compileOnly = buildCompileRunResult(execution);

      // Determine a meaningful status from the compile/run result
      const submissionStatus: JudgeStatus =
        execution.status === 'Compilation Error' ? 'Compilation Error' :
        execution.status === 'Runtime Error'     ? 'Runtime Error'     :
        execution.status === 'Time Limit Exceeded' ? 'Time Limit Exceeded' :
        'Pending'; // No test cases to evaluate against → Pending

      const submissionId   = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const submissionData = {
        userId,
        problemId,
        language,
        languageId:    resolvedId,
        status:        submissionStatus,
        passedTests:   0,
        totalTests:    0,
        runtime:       execution.runtime,
        memory:        execution.memory,
        code,
        errorMessage:  execution.compileOutput || execution.stderr || null,
        stdout:        execution.stdout || null,
        submittedAt:   new Date().toISOString(),
        note:          'No test cases configured — submission saved for manual review.',
      };

      await db.collection('submissions').doc(submissionId).set(submissionData);

      // Still track attempt in progress even without test cases
      await trackAttempt(db, userId, problemId, language, submissionStatus, null, null);

      res.status(200).json({
        success: true,
        submission: { id: submissionId, ...submissionData },
        compileResult: compileOnly,
      });
      return;
    }

    const evaluation     = await evaluateTestCases({ code, language, languageId: resolvedId, testCases });
    const status         = evaluation.status;
    const firstFailure   = evaluation.results.find((r) => !r.passed);

    const submissionId   = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const submissionData = {
      userId,
      problemId,
      language,
      languageId:    resolvedId,
      status,
      passedTests:   evaluation.passedTests,
      totalTests:    evaluation.totalTests,
      runtime:       evaluation.runtime,
      memory:        evaluation.memory,
      code,
      errorMessage:  evaluation.errorMessage ?? firstFailure?.errorMessage ?? null,
      submittedAt:   new Date().toISOString(),
    };

    await db.collection('submissions').doc(submissionId).set(submissionData);

    // ── Update user progress & XP ─────────────────────────────────────────
    const accepted  = status === 'Accepted';
    const xpEarned  = await trackAttempt(db, userId, problemId, language, status, evaluation, problem);

    if (accepted && xpEarned > 0) {
      await updateUserStats(db, userId, xpEarned);
      if (problemSnap.exists) {
        await problemRef.set(
          { solvedCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
    }

    res.status(200).json({
      success: true,
      submission: { id: submissionId, ...submissionData },
    });
  } catch (error) {
    handleExecutionError(error, res, 'submit');
  }
};

// ---------------------------------------------------------------------------
// Core evaluation: run each test case through Judge0 and aggregate results
// ---------------------------------------------------------------------------

const evaluateTestCases = async ({
  code,
  language,
  languageId,
  testCases,
}: {
  code: string;
  language: string;
  languageId: number;
  testCases: TestCase[];
}): Promise<EvaluationResult> => {
  const results: TestCaseResult[] = [];
  let aggregateStatus: JudgeStatus = 'Accepted';
  let totalRuntime = 0;
  let maxMemory    = 0;

  for (const tc of testCases) {
    const execution = await executeCode(code, language, tc.input, tc.expectedOutput, languageId);
    const output    = execution.stdout ?? '';
    const passed    =
      execution.status === 'Accepted' &&
      normalizeOutput(output) === normalizeOutput(tc.expectedOutput);

    totalRuntime += execution.runtime;
    maxMemory     = Math.max(maxMemory, execution.memory);

    if (!passed && aggregateStatus === 'Accepted') {
      aggregateStatus = execution.status === 'Accepted' ? 'Wrong Answer' : execution.status;
    }

    results.push({
      input:        tc.input,
      expected:     tc.expectedOutput,
      output,
      passed,
      status:       execution.status,
      errorMessage: execution.compileOutput || execution.stderr || undefined,
      runtime:      execution.runtime,
      memory:       execution.memory,
    });

    // Stop early on hard errors — no point running more cases
    if (!passed && execution.status !== 'Wrong Answer') break;
  }

  return {
    status:       aggregateStatus,
    passedTests:  results.filter((r) => r.passed).length,
    totalTests:   testCases.length,
    runtime:      totalRuntime,
    memory:       maxMemory,
    results,
    errorMessage: results.find((r) => r.errorMessage)?.errorMessage,
  };
};

// ---------------------------------------------------------------------------
// Build a RunCodeResult from a single compile+run execution (no test cases)
// ---------------------------------------------------------------------------

const buildCompileRunResult = (execution: import('./judge0Service').JudgeExecutionResult) => ({
  status:        execution.status,
  stdout:        execution.stdout        || '',
  stderr:        execution.stderr        || '',
  compileOutput: execution.compileOutput || '',
  runtime:       execution.runtime,
  memory:        execution.memory,
});

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

const loadTestCases = async (problemId: string, includeHidden: boolean): Promise<TestCase[]> => {
  const db   = admin.firestore();
  const snap = await db.collection('testCases').doc(problemId).get();
  if (!snap.exists) return [];

  const data    = snap.data() ?? {};
  const visible = Array.isArray(data.visible) ? data.visible : [];
  const hidden  = includeHidden && Array.isArray(data.hidden) ? data.hidden : [];
  return [...visible, ...hidden].filter(isValidTestCase);
};

const buildFallbackVisibleCases = (problem: admin.firestore.DocumentData | undefined): TestCase[] => {
  if (!problem?.examples || !Array.isArray(problem.examples)) return [];
  return problem.examples
    .map((ex: { input?: string; output?: string }) => ({
      input:          ex.input          ?? '',
      expectedOutput: ex.output         ?? '',
    }))
    .filter(isValidTestCase);
};

const isValidTestCase = (tc: Partial<TestCase>): tc is TestCase =>
  typeof tc.input === 'string' && typeof tc.expectedOutput === 'string';

// ---------------------------------------------------------------------------
// Track attempt in userProgress — returns XP earned (0 if already solved)
// ---------------------------------------------------------------------------

const trackAttempt = async (
  db: admin.firestore.Firestore,
  userId: string,
  problemId: string,
  language: string,
  status: JudgeStatus,
  evaluation: EvaluationResult | null,
  problem: admin.firestore.DocumentData | null,
): Promise<number> => {
  const progressRef  = db.collection('userProgress').doc(userId).collection('problems').doc(problemId);
  const progressSnap = await progressRef.get();
  const prev         = progressSnap.exists ? (progressSnap.data() ?? {}) : {};

  const isAlreadySolved = Boolean(prev?.solved);
  const attempts        = ((prev?.attempts as number) ?? 0) + 1;
  const accepted        = status === 'Accepted';
  const xpEarned        = accepted && !isAlreadySolved ? (XP_BY_DIFFICULTY[(problem?.difficulty as string) ?? ''] ?? 20) : 0;
  const runtime         = evaluation?.runtime ?? 0;

  await progressRef.set({
    problemId,
    attempted:       true,
    solved:          isAlreadySolved || accepted,
    attempts,
    bestRuntime:     accepted
      ? Math.min(runtime, (prev?.bestRuntime as number) ?? Number.MAX_SAFE_INTEGER)
      : ((prev?.bestRuntime as number) ?? null),
    lastAttemptAt:   FieldValue.serverTimestamp(),
    lastSubmittedAt: FieldValue.serverTimestamp(),
    solvedAt:        accepted && !isAlreadySolved ? FieldValue.serverTimestamp() : (prev?.solvedAt ?? null),
    language,
    xpEarned:        ((prev?.xpEarned as number) ?? 0) + xpEarned,
  }, { merge: true });

  return xpEarned;
};

// ---------------------------------------------------------------------------
// User stats update (runs inside a Firestore transaction)
// ---------------------------------------------------------------------------

const updateUserStats = async (
  db: admin.firestore.Firestore,
  userId: string,
  xpEarned: number,
): Promise<void> => {
  const userRef = db.collection('users').doc(userId);
  await db.runTransaction(async (tx) => {
    const snap  = await tx.get(userRef);
    const today = new Date().toISOString().slice(0, 10);

    if (snap.exists) {
      const d                   = snap.data() ?? {};
      const currentXp           = (d.codingXp        as number) ?? 0;
      const currentSolved       = (d.problemsSolved   as number) ?? 0;
      const aptitudeScore       = (d.aptitudeScore    as number) ?? 0;
      const interviewScore      = (d.interviewScore   as number) ?? 0;
      const lastActivity        = d.lastCodingActivityDate as string | undefined;
      const streakIncrement     = lastActivity === today ? 0 : 1;
      const newCodingXp         = currentXp + xpEarned;

      tx.update(userRef, {
        codingXp:               newCodingXp,
        xp:                     FieldValue.increment(xpEarned),
        problemsSolved:         currentSolved + 1,
        streak:                 FieldValue.increment(streakIncrement),
        lastCodingActivityDate: today,
        totalPoints:            newCodingXp + aptitudeScore * 10 + interviewScore * 10,
        updatedAt:              FieldValue.serverTimestamp(),
      });
    } else {
      tx.set(userRef, {
        codingXp:               xpEarned,
        xp:                     xpEarned,
        problemsSolved:         1,
        streak:                 1,
        aptitudeScore:          0,
        interviewScore:         0,
        totalPoints:            xpEarned,
        lastCodingActivityDate: today,
        createdAt:              FieldValue.serverTimestamp(),
        updatedAt:              FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  });
};

// ---------------------------------------------------------------------------
// Centralised error handler — converts Judge0Error / network errors into
// clean HTTP responses that never leak credentials or internal details.
// ---------------------------------------------------------------------------

const handleExecutionError = (error: unknown, res: Response, context: string): void => {
  if (error instanceof Judge0Error) {
    const httpStatus = error.httpStatus === 429 ? 429 : 503;
    const message    = error.httpStatus === 429
      ? 'Rate limit reached. Please wait a moment before trying again.'
      : error.httpStatus === 401 || error.httpStatus === 403
        ? 'Code execution service is misconfigured. Please contact support.'
        : error.httpStatus === 504
          ? error.message   // timeout message is safe to expose
          : 'Code execution service is temporarily unavailable. Please try again.';

    console.error(`[${context}] Judge0Error (${error.httpStatus}):`, error.message);
    res.status(httpStatus).json({ error: message });
    return;
  }

  // Generic / unexpected errors — log detail server-side, show generic message to client
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Unexpected error:`, detail);
  res.status(500).json({ error: 'Code execution service is temporarily unavailable. Please try again.' });
};
