import { collection, query, where, getDocs, orderBy, limit, QueryConstraint } from 'firebase/firestore';
import { firestoreDb } from '../../../utils/firebase';
import { JudgeLanguage, RunCodeRequest, RunCodeResult, Submission, LeaderboardEntry } from '../types/problem';
import axios from 'axios';

// Get base URL for Firebase Cloud Functions
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

const getFunctionsUrl = () => {
  const projectId = FIREBASE_PROJECT_ID || 'placementpro-22829';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://127.0.0.1:5001/${projectId}/us-central1`;
  }
  return `https://us-central1-${projectId}.cloudfunctions.net`;
};

export const getSubmissions = async (userId: string, problemId?: string): Promise<Submission[]> => {
  if (!firestoreDb) return [];
  
  const constraints: QueryConstraint[] = [where('userId', '==', userId)];
  if (problemId) {
    constraints.push(where('problemId', '==', problemId));
  }
  constraints.push(orderBy('submittedAt', 'desc'));

  const q = query(collection(firestoreDb, 'submissions'), ...constraints);
  const snapshot = await getDocs(q);

  const submissions: Submission[] = [];
  snapshot.forEach((docSnap) => {
    submissions.push({
      id: docSnap.id,
      ...docSnap.data()
    } as Submission);
  });
  return submissions;
};

export const getLeaderboard = async (limitCount = 20): Promise<LeaderboardEntry[]> => {
  if (!firestoreDb) return [];

  // Query users ordered by codingXp or problemsSolved
  const q = query(
    collection(firestoreDb, 'users'),
    orderBy('codingXp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  const leaderboard: LeaderboardEntry[] = [];
  
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    // Only include users who have actually started solving coding problems (XP > 0)
    if (data.codingXp !== undefined) {
      leaderboard.push({
        userId: docSnap.id,
        name: data.name,
        avatarUrl: data.avatarUrl,
        role: data.role || 'student',
        problemsSolved: data.problemsSolved || 0,
        codingXp: data.codingXp || 0,
        streak: data.streak || 0,
      });
    }
  });

  // Fallback mock leaderboard if Firestore is empty/clean initially
  if (leaderboard.length === 0) {
    return [
      { userId: 'mock-1', name: 'Aakash Verma', role: 'student', problemsSolved: 142, codingXp: 7100, streak: 12 },
      { userId: 'mock-2', name: 'Divya Sharma', role: 'student', problemsSolved: 128, codingXp: 6400, streak: 8 },
      { userId: 'mock-3', name: 'Rohan Gupta', role: 'student', problemsSolved: 106, codingXp: 5300, streak: 14 },
      { userId: 'mock-4', name: 'Sneha Patil', role: 'student', problemsSolved: 98, codingXp: 4900, streak: 4 },
      { userId: 'mock-5', name: 'Vikram Singh', role: 'student', problemsSolved: 84, codingXp: 4200, streak: 0 },
    ];
  }

  return leaderboard;
};

export interface SubmitCodeRequest {
  userId: string;
  problemId: string;
  language: string;
  languageId?: number;
  code: string;
}

export const getJudgeLanguages = async (): Promise<JudgeLanguage[]> => {
  const url = `${getFunctionsUrl()}/getJudgeLanguages`;
  const response = await axios.get(url);
  return response.data.languages as JudgeLanguage[];
};

export interface RunCustomStdinRequest {
  language: string;
  languageId?: number;
  code: string;
  customStdin: string;
}

export interface CustomStdinResult {
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  runtime: number;
  memory: number;
}

export const runCode = async (req: RunCodeRequest): Promise<RunCodeResult> => {
  const url = `${getFunctionsUrl()}/runCode`;
  try {
    const response = await axios.post(url, req);
    const data = response.data;

    // compile_run mode: no test cases (Codeforces problem) — wrap into RunCodeResult shape
    if (data.mode === 'compile_run') {
      const r = data.result as CustomStdinResult;
      const isError = r.status === 'Compilation Error' || r.status === 'Runtime Error';
      return {
        status:       r.status as RunCodeResult['status'],
        passedTests:  0,
        totalTests:   0,
        runtime:      r.runtime,
        memory:       r.memory,
        results:      [],
        errorMessage: isError
          ? (r.compileOutput || r.stderr || r.status)
          : undefined,
        // Attach stdout so the UI can show it even with 0 test cases
        stdout:  r.stdout,
        stderr:  r.stderr,
        compileOutput: r.compileOutput,
      } as RunCodeResult & { stdout?: string; stderr?: string; compileOutput?: string };
    }

    return data.result as RunCodeResult;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = (err.response?.data as { error?: string })?.error
        || 'Unable to execute code right now. Please try again in a moment.';
      throw new Error(msg);
    }
    throw err;
  }
};

export const runCodeWithStdin = async (req: RunCustomStdinRequest): Promise<CustomStdinResult> => {
  const url = `${getFunctionsUrl()}/runCode`;
  try {
    const response = await axios.post(url, req);
    const data = response.data;

    // Backend may return compile_run mode even for custom stdin if problem doc missing
    if (data.mode === 'compile_run' || data.mode === 'custom') {
      return data.result as CustomStdinResult;
    }
    return data.result as CustomStdinResult;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = (err.response?.data as { error?: string })?.error
        || 'Unable to execute code right now. Please try again in a moment.';
      throw new Error(msg);
    }
    throw err;
  }
};

export const submitCode = async (req: SubmitCodeRequest): Promise<Submission> => {
  const url = `${getFunctionsUrl()}/submitSolution`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    let msg = 'Unable to submit code right now. Please try again in a moment.';
    try {
      const body = await response.json() as { error?: string };
      if (body?.error) msg = body.error;
    } catch { /* ignore parse errors */ }
    throw new Error(msg);
  }

  const data = await response.json();
  return data.submission as Submission;
};
