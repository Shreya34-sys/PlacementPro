// DSA topic categories for PlacementPro-native problems
export const DSA_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Hashing',
  'Recursion', 'Backtracking', 'Sorting', 'Searching', 'Binary Tree',
  'BST', 'Heap', 'Priority Queue', 'Graph', 'Greedy', 'Dynamic Programming',
  'Bit Manipulation', 'Two Pointer', 'Sliding Window', 'Prefix Sum',
] as const;

export type DsaTopic = typeof DSA_TOPICS[number];

export const COMPANY_TAGS = [
  'Amazon', 'Google', 'Microsoft', 'TCS', 'Infosys',
  'Accenture', 'Wipro', 'Capgemini',
] as const;

export type CompanyTag = typeof COMPANY_TAGS[number];

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemTestCase {
  input: string;
  expectedOutput: string;
}

export interface Problem {
  id: string;                          // codeforces_{contestId}_{problemIndex} OR pp-{slug}
  source: 'codeforces' | 'placementpro';
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  tags: string[];                      // Codeforces tags (keep for CF problems)
  topics: string[];                    // DSA topics (PlacementPro)
  solvedCount: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;

  // Codeforces-specific (optional for PP problems)
  contestId?: number;
  problemIndex?: string;
  rating?: number | null;
  sourceUrl?: string;

  // PlacementPro-native fields
  slug?: string;
  description?: string;
  examples?: ProblemExample[];
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  starterCode?: Record<string, string>;
  companies?: CompanyTag[];
  timeLimitMs?: number;
  memoryLimitMb?: number;

  // Provider abstraction (internal)
  provider?: 'placementpro' | 'codeforces' | 'authorized-external';
  externalId?: string;
}

export interface UserProgress {
  problemId: string;
  solved: boolean;
  attempted: boolean;
  attempts: number;
  bestRuntime?: number;
  lastSubmittedAt: any;
  language: string;
  xpEarned?: number;
  solvedAt?: any;
}

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Internal Error'
  | 'Pending';

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  languageId?: number;
  status: SubmissionStatus;
  passedTests?: number;
  totalTests?: number;
  runtime: number;
  memory: number;
  submittedAt: any;
  code: string;
  errorMessage?: string;
  stdout?: string;
  stderr?: string;
}

export interface JudgeLanguage {
  id: number;
  name: string;
  key: string;
  monacoLanguage: string;
}

export interface RunCodeRequest {
  problemId: string;
  language: string;
  languageId?: number;
  code: string;
}

export interface TestCaseResult {
  input: string;
  expected: string;
  output: string;
  passed: boolean;
  status?: SubmissionStatus;
  errorMessage?: string;
  runtime?: number;
  memory?: number;
}

export interface RunCodeResult {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  results: TestCaseResult[];
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
