import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Request, Response } from 'express';
import { executeCode, getLanguages, normalizeOutput, JudgeStatus } from './judge0Service';

interface TestCase {
  input: string;
  expectedOutput: string;
}

const XP_BY_DIFFICULTY: Record<string, number> = {
  Easy: 20,
  Medium: 40,
  Hard: 60,
  Expert: 80,
};

export const getJudgeLanguagesLogic = async (_req: Request, res: Response) => {
  const languages = await getLanguages();
  res.status(200).json({ languages });
};

export const runCodeLogic = async (req: Request, res: Response) => {
  const { problemId, language, languageId, code } = req.body;

  if (!problemId || !language || !code) {
    res.status(400).json({ error: 'Missing required parameters: problemId, language, code' });
    return;
  }

  try {
    const db = admin.firestore();
    const problemSnap = await db.collection('problems').doc(problemId).get();
    if (!problemSnap.exists) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const visibleCases = await loadTestCases(problemId, false);
    const fallbackCases = buildFallbackVisibleCases(problemSnap.data());
    const testCases = visibleCases.length > 0 ? visibleCases : fallbackCases;

    if (testCases.length === 0) {
      res.status(400).json({ error: 'No visible test cases are configured for this problem.' });
      return;
    }

    const result = await evaluateTestCases({ code, language, languageId, testCases });
    res.status(200).json({ success: true, result });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error running code:', errorMsg);
    res.status(500).json({ error: 'Code execution service is temporarily unavailable. Please try again.' });
  }
};

export const submitSolutionLogic = async (req: Request, res: Response) => {
  const db = admin.firestore();
  const { userId, problemId, language, languageId, code } = req.body;

  if (!userId || !problemId || !language || !code) {
    res.status(400).json({ error: 'Missing required parameters: userId, problemId, language, code' });
    return;
  }

  try {
    const problemRef = db.collection('problems').doc(problemId);
    const problemSnap = await problemRef.get();

    if (!problemSnap.exists) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const problem = problemSnap.data() || {};
    const configuredCases = await loadTestCases(problemId, true);
    const fallbackCases = buildFallbackVisibleCases(problem);
    const testCases = configuredCases.length > 0 ? configuredCases : fallbackCases;

    if (testCases.length === 0) {
      res.status(400).json({ error: 'No test cases are configured for this problem.' });
      return;
    }

    const evaluation = await evaluateTestCases({ code, language, languageId, testCases });
    const status = evaluation.status;
    const firstFailure = evaluation.results.find((result) => !result.passed);

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const submissionRef = db.collection('submissions').doc(submissionId);

    const submissionData = {
      userId,
      problemId,
      language,
      languageId: languageId || null,
      status,
      passedTests: evaluation.passedTests,
      totalTests: evaluation.totalTests,
      runtime: evaluation.runtime,
      memory: evaluation.memory,
      code,
      errorMessage: evaluation.errorMessage || firstFailure?.errorMessage || null,
      submittedAt: new Date().toISOString(),
    };

    await submissionRef.set(submissionData);

    const progressRef = db.collection('userProgress').doc(userId).collection('problems').doc(problemId);
    const progressSnap = await progressRef.get();
    const previousProgress = progressSnap.exists ? progressSnap.data() : {};
    const isAlreadySolved = Boolean(previousProgress?.solved);
    const attempts = (previousProgress?.attempts || 0) + 1;
    const accepted = status === 'Accepted';
    const xpEarned = accepted && !isAlreadySolved ? (XP_BY_DIFFICULTY[problem.difficulty] || 20) : 0;

    await progressRef.set({
      problemId,
      attempted: true,
      solved: isAlreadySolved || accepted,
      attempts,
      bestRuntime: accepted
        ? Math.min(evaluation.runtime, previousProgress?.bestRuntime || Number.MAX_SAFE_INTEGER)
        : (previousProgress?.bestRuntime || null),
      lastAttemptAt: FieldValue.serverTimestamp(),
      lastSubmittedAt: FieldValue.serverTimestamp(),
      solvedAt: accepted && !isAlreadySolved ? FieldValue.serverTimestamp() : previousProgress?.solvedAt || null,
      language,
      xpEarned: (previousProgress?.xpEarned || 0) + xpEarned,
    }, { merge: true });

    if (accepted && !isAlreadySolved) {
      await updateUserStats(db, userId, xpEarned);
      await problemRef.set({ solvedCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    res.status(200).json({
      success: true,
      submission: {
        id: submissionId,
        ...submissionData,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error executing submission:', errorMsg);
    res.status(500).json({ error: 'Code execution service is temporarily unavailable. Please try again.' });
  }
};

const loadTestCases = async (problemId: string, includeHidden: boolean): Promise<TestCase[]> => {
  const db = admin.firestore();
  const testCaseSnap = await db.collection('testCases').doc(problemId).get();
  if (!testCaseSnap.exists) return [];

  const data = testCaseSnap.data() || {};
  const visible = Array.isArray(data.visible) ? data.visible : [];
  const hidden = includeHidden && Array.isArray(data.hidden) ? data.hidden : [];
  return [...visible, ...hidden].filter(isValidTestCase);
};

const buildFallbackVisibleCases = (problem: admin.firestore.DocumentData | undefined): TestCase[] => {
  if (!problem?.examples || !Array.isArray(problem.examples)) return [];

  return problem.examples
    .map((example: { input?: string; output?: string }) => ({
      input: example.input || '',
      expectedOutput: example.output || '',
    }))
    .filter(isValidTestCase);
};

const isValidTestCase = (testCase: Partial<TestCase>): testCase is TestCase => (
  typeof testCase.input === 'string' && typeof testCase.expectedOutput === 'string'
);

const evaluateTestCases = async ({
  code,
  language,
  languageId,
  testCases,
}: {
  code: string;
  language: string;
  languageId?: number;
  testCases: TestCase[];
}) => {
  const results = [];
  let aggregateStatus: JudgeStatus = 'Accepted';
  let runtime = 0;
  let memory = 0;

  for (const testCase of testCases) {
    const execution = await executeCode(code, language, testCase.input, testCase.expectedOutput, languageId);
    const output = execution.stdout || '';
    const passed = execution.status === 'Accepted' && normalizeOutput(output) === normalizeOutput(testCase.expectedOutput);

    runtime += execution.runtime;
    memory = Math.max(memory, execution.memory);

    if (!passed && aggregateStatus === 'Accepted') {
      aggregateStatus = execution.status === 'Accepted' ? 'Wrong Answer' : execution.status;
    }

    results.push({
      input: testCase.input,
      expected: testCase.expectedOutput,
      output,
      passed,
      status: execution.status,
      errorMessage: execution.compileOutput || execution.stderr,
      runtime: execution.runtime,
      memory: execution.memory,
    });

    if (!passed && execution.status !== 'Wrong Answer') {
      break;
    }
  }

  return {
    status: aggregateStatus,
    passedTests: results.filter((result) => result.passed).length,
    totalTests: testCases.length,
    runtime,
    memory,
    results,
    errorMessage: results.find((result) => result.errorMessage)?.errorMessage,
  };
};

const updateUserStats = async (db: admin.firestore.Firestore, userId: string, xpEarned: number) => {
  const userRef = db.collection('users').doc(userId);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const today = new Date().toISOString().slice(0, 10);

    if (userSnap.exists) {
      const userData = userSnap.data() || {};
      const currentXp = userData.codingXp || 0;
      const currentSolved = userData.problemsSolved || 0;
      const aptitudeScore = userData.aptitudeScore || 0;
      const interviewScore = userData.interviewScore || 0;
      const lastCodingActivityDate = userData.lastCodingActivityDate;
      const streakIncrement = lastCodingActivityDate === today ? 0 : 1;
      const newCodingXp = currentXp + xpEarned;

      transaction.update(userRef, {
        codingXp: newCodingXp,
        xp: FieldValue.increment(xpEarned),
        problemsSolved: currentSolved + 1,
        streak: FieldValue.increment(streakIncrement),
        lastCodingActivityDate: today,
        totalPoints: newCodingXp + (aptitudeScore * 10) + (interviewScore * 10),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.set(userRef, {
        codingXp: xpEarned,
        xp: xpEarned,
        problemsSolved: 1,
        streak: 1,
        aptitudeScore: 0,
        interviewScore: 0,
        totalPoints: xpEarned,
        lastCodingActivityDate: today,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  });
};
