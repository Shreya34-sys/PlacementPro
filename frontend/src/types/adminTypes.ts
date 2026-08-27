export type Role = 'student' | 'admin' | 'superadmin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  photoUrl?: string;
  department: string;
  createdAt: string;
  // Student-specific fields
  usn?: string;
  cgpa?: number;
  backlogs?: number;
  branch?: string;
  batch?: string;
  resumeUrl?: string;
  skills?: string[];
  readinessScore?: number;
  status?: 'active' | 'placed' | 'under_review';
  // Admin-specific fields
  designation?: string;
  specialization?: string[];
  managedCompanies?: string[];
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  tier: 'Tier 1 (Dream)' | 'Tier 2 (Core)' | 'Mass Recruiter' | 'Product Tech';
  description: string;
  ctcRange: string;
  roles: string[];
  hiringStatus: 'Active' | 'Upcoming' | 'Closed' | 'Draft';
  marketTrendConfidence: number;
  lastUpdated: string;
  updatedBy: string;
  syllabusSummary: string;
  hiringRounds: {
    round: number;
    name: string;
    type: 'aptitude' | 'coding_c' | 'technical_interview' | 'hr_interview';
    durationMin: number;
  }[];
}

export interface PlacementDrive {
  id: string;
  companyId: string;
  companyName: string;
  roleTitle: string;
  ctc: string;
  batch: string;
  status: 'draft' | 'active' | 'evaluating' | 'completed';
  startDate: string;
  deadline: string;
  eligibility: {
    minCgpa: number;
    maxBacklogs: number;
    allowedBranches: string[];
    allowedGenders?: 'all' | 'female_only' | 'male_only';
  };
  roundsConfig: {
    roundNumber: number;
    name: string;
    type: 'aptitude' | 'c_compiler_test' | 'technical_test' | 'ai_interview' | 'hr_interview';
    cutoffPercent: number;
    isProctored: boolean;
  }[];
  registeredCount: number;
  shortlistedCount: number;
  placedCount: number;
  createdBy: string;
}

export interface Question {
  id: string;
  companyId?: string;
  category: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability' | 'C Internals' | 'Core CS' | 'Data Structures';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tags: string[];
  marketTrendVerified: boolean;
  addedBy: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'C Fundamentals' | 'Pointers & Memory' | 'Linked Lists' | 'Strings' | 'Dynamic Programming' | 'Trees';
  tags: string[];
  description: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  boilerplateCodeC: string;
  solutionCodeC?: string;
  sampleTestCases: { input: string; output: string; explanation?: string }[];
  hiddenTestCases: { input: string; output: string }[];
  cCompilerSpecificRequirements?: {
    mustUsePointers?: boolean;
    forbidStandardLibs?: string[];
    maxAstDepth?: number;
    maxTACInstructions?: number;
  };
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  problemId: string;
  problemTitle: string;
  language: 'c' | 'cpp' | 'java' | 'python';
  code: string;
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Memory Error';
  score: number;
  submittedAt: string;
  compilerReport?: CCompilerReport;
}

export interface CCompilerReport {
  compilerVersion: string;
  status: 'SUCCESS' | 'ERROR';
  tokensCount: number;
  tokensStream: { type: string; value: string; line: number; col: number }[];
  astTree: any;
  symbolTable: { identifier: string; kind: string; type: string; scope: string; memoryOffset: string }[];
  threeAddressCode: string[];
  pseudoAssembly: string[];
  diagnostics: {
    passedTestCases: number;
    totalTestCases: number;
    executionTimeMs: number;
    memoryAllocatedKb: number;
    astDepth: number;
    pedagogicalFeedback: string;
  };
}

export interface ProctoringViolation {
  id: string;
  studentId: string;
  studentName: string;
  usn: string;
  testId: string;
  driveName: string;
  timestamp: string;
  violationType: 'tab_switch' | 'multiple_faces' | 'no_face_detected' | 'voice_detected' | 'unauthorized_shortcut' | 'head_pose_deviation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  details: string;
  status: 'pending_review' | 'flagged' | 'dismissed' | 'disqualified';
  aiConfidence?: number;
}

export type ProctoringEvent = ProctoringViolation;

export interface AIInterviewSession {
  id: string;
  studentId: string;
  studentName: string;
  companyName: string;
  interviewerPersona: 'Tough Technical Lead' | 'Staff Architect' | 'HR Director' | 'Algorithmic Specialist';
  conductedAt: string;
  durationMinutes: number;
  overallScore: number; // 0-100
  breakdown: {
    technicalCorrectness: number;
    cLanguageMastery: number;
    problemSolvingMethodology: number;
    speechClarityAndConfidence: number;
    culturalFit: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Strong Hire' | 'Hire' | 'Borderline' | 'Reject';
  transcript: {
    speaker: 'AI Interviewer' | 'Student';
    message: string;
    timestamp: string;
    evaluationMetric?: string;
  }[];
}

export interface RAGKnowledgeChunk {
  id: string;
  companyId?: string;
  companyName: string;
  category: 'interview_experiences' | 'aptitude_patterns' | 'c_interview_questions' | 'market_trends' | 'syllabus_breakdown';
  sourceDocument: string;
  rawText: string;
  tags: string[];
  vectorEmbeddingId: string;
  ingestedAt: string;
  ingestedByFaculty: string;
  aiSummarizedTakeaway: string;
  relevanceScore: number;
}

export interface MarketTrendSuggestion {
  id: string;
  company: string;
  trendTitle: string;
  detectedShift: string;
  recommendedAction: string;
  impactScope: 'Aptitude Pool' | 'Coding Engine' | 'AI Interview Module' | 'Proctoring Rules' | 'Eligibility';
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  detectedAt: string;
  suggestedChanges: Record<string, any>;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminName: string;
  action: string;
  targetCollection: string;
  targetId: string;
  timestamp: string;
  details: string;
}

export interface StudentAnalytics {
  studentId: string;
  studentName: string;
  usn: string;
  branch: string;
  batch: string;
  cgpa: number;
  readinessScore: number;
  competencies: {
    aptitude: number;
    cCompilerMastery: number;
    dsa: number;
    communication: number;
    coreCS: number;
  };
  topStrengths?: string[];
  weakAreas?: string[];
  testsAttempted: number;
  codingProblemsSolved: number;
  interviewsCompleted: number;
  proctoringIntegrityIndex: number; // 0-100
  targetCompaniesEligibility: { companyName: string; eligible: boolean; gap?: string }[];
  predictedTier: 'Tier 1' | 'Tier 2' | 'Mass Recruiter';
  predictedPlacementTier?: string;
}
