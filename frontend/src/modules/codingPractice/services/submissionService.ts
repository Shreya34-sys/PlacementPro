import { collection, query, where, getDocs, orderBy, limit, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firestoreDb } from '../../../utils/firebase';
import { JudgeLanguage, RunCodeRequest, RunCodeResult, Submission, LeaderboardEntry } from '../types/problem';
import axios from 'axios';

// Get base URL for Firebase Cloud Functions
const getFunctionsUrl = () => {
  // If we are in development, use emulator URL
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5001/placementpro-22829/us-central1';
  }
  return `https://us-central1-placementpro-22829.cloudfunctions.net`;
};

export const getSubmissions = async (userId: string, problemId?: string): Promise<Submission[]> => {
  if (!firestoreDb) return [];
  
  const constraints = [where('userId', '==', userId)];
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

export const runCode = async (req: RunCodeRequest): Promise<RunCodeResult> => {
  const url = `${getFunctionsUrl()}/runCode`;
  const response = await axios.post(url, req);
  return response.data.result as RunCodeResult;
};

export const submitCode = async (req: SubmitCodeRequest): Promise<Submission> => {
  const url = `${getFunctionsUrl()}/submitSolution`;
  const response = await axios.post(url, req);
  return response.data.submission as Submission;
};
