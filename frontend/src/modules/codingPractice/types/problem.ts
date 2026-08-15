export interface Problem {
  id: string; // codeforces_{contestId}_{problemIndex}
  source: 'codeforces' | 'placementpro';
  contestId: number;
  problemIndex: string;
  title: string;
  rating: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  tags: string[];
  solvedCount: number;
  sourceUrl: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UserProgress {
  problemId: string;
  solved: boolean;
  attempts: number;
  bestRuntime?: number;
  lastSubmittedAt: any;
  language: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Pending';
  runtime: number; // ms
  memory: number; // KB
  submittedAt: any;
  code: string;
  errorMessage?: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  problemsSolved: number;
  codingXp: number;
  streak: number;
}
