import {
  UserProfile,
  Company,
  PlacementDrive,
  Question,
  CodingProblem,
  Submission,
  ProctoringViolation,
  AIInterviewSession,
  RAGKnowledgeChunk,
  MarketTrendSuggestion,
  AuditLog,
  StudentAnalytics,
} from '../types/adminTypes';

export const FACULTY_ADMINS: UserProfile[] = [
  {
    uid: 'faculty_pranali_01',
    name: 'Prof. Pranali Titvekar',
    email: 'pranali.titvekar@kitcoek.in',
    role: 'superadmin',
    department: 'Computer Science & Business Systems (CSBS)',
    designation: 'Domain Expert: Compiler Design & Algorithm Optimization',
    specialization: ['Compiler Design', 'Data Structures', 'C/C++ Memory Internals'],
    managedCompanies: ['TCS (Digital & Ninja)', 'Persistent Systems'],
    createdAt: '2025-06-15T09:00:00Z',
  },
  {
    uid: 'faculty_aaryan_02',
    name: 'Prof. Aaryan Yerudkar',
    email: 'aaryan.yerudkar@kitcoek.in',
    role: 'superadmin',
    department: 'Computer Science & Business Systems (CSBS)',
    designation: 'Domain Expert: Distributed Systems & Cloud Architecture',
    specialization: ['Cloud Architecture', 'Distributed Systems', 'Low-Latency Backend'],
    managedCompanies: ['Google India', 'Persistent Systems'],
    createdAt: '2025-06-10T09:00:00Z',
  },
  {
    uid: 'faculty_shreya_03',
    name: 'Prof. Shreya Jangam',
    email: 'shreya.jangam@kitcoek.in',
    role: 'admin',
    department: 'Computer Science & Business Systems (CSBS)',
    designation: 'Domain Expert: AI, Machine Learning & NLP Evaluation',
    specialization: ['Machine Learning', 'GenAI & RAG Systems', 'Automated Code Evaluation'],
    managedCompanies: ['Infosys Limited', 'Cognizant'],
    createdAt: '2025-07-01T09:00:00Z',
  },
  {
    uid: 'faculty_aarya_04',
    name: 'Prof. Aarya Javandal',
    email: 'aarya.javandal@kitcoek.in',
    role: 'admin',
    department: 'Computer Science & Business Systems (CSBS)',
    designation: 'Domain Expert: Quantitative Aptitude & Mathematical Logic',
    specialization: ['Quantitative Aptitude', 'Discrete Mathematics', 'Verbal Reasoning'],
    managedCompanies: ['TCS', 'Capgemini'],
    createdAt: '2025-07-15T09:00:00Z',
  },
  {
    uid: 'faculty_samrudhi_05',
    name: 'Prof. Samrudhi Kulkarni',
    email: 'samrudhi.kulkarni@kitcoek.in',
    role: 'admin',
    department: 'Computer Science & Business Systems (CSBS)',
    designation: 'Domain Expert: Operating Systems, DBMS & Computer Networks',
    specialization: ['Operating Systems', 'DBMS & Indexing', 'Network Protocols'],
    managedCompanies: ['Persistent Systems', 'Tata Elxsi'],
    createdAt: '2025-07-20T09:00:00Z',
  },
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_tcs',
    name: 'Tata Consultancy Services (TCS)',
    logo: '🏢',
    tier: 'Mass Recruiter',
    description: 'India\'s premier IT services corporation with Ninja, Digital & Prime recruitment tracks.',
    ctcRange: '3.6 - 9.0 LPA',
    roles: ['TCS Ninja Engineer', 'TCS Digital Developer', 'TCS Prime Innovator'],
    hiringStatus: 'Active',
    marketTrendConfidence: 96,
    lastUpdated: '2026-08-14T10:30:00Z',
    updatedBy: 'Mrs. Pranali Titvekar',
    syllabusSummary: 'Advanced Quant, Verbal Reasoning, Advanced Coding in C/C++ with strict runtime and pointer memory constraints.',
    hiringRounds: [
      { round: 1, name: 'Foundation Section (Aptitude + Verbal)', type: 'aptitude', durationMin: 75 },
      { round: 2, name: 'Advanced Coding & C-Compiler Evaluation', type: 'coding_c', durationMin: 90 },
      { round: 3, name: 'AI Technical & System Knowledge Interview', type: 'technical_interview', durationMin: 35 },
      { round: 4, name: 'Management & HR Assessment', type: 'hr_interview', durationMin: 20 },
    ],
  },
  {
    id: 'comp_persistent',
    name: 'Persistent Systems',
    logo: '⚡',
    tier: 'Tier 2 (Core)',
    description: 'Global digital engineering powerhouse focusing on cloud, data, and software product engineering.',
    ctcRange: '5.5 - 9.5 LPA',
    roles: ['Software Engineer', 'Cloud Product Engineer'],
    hiringStatus: 'Active',
    marketTrendConfidence: 94,
    lastUpdated: '2026-08-15T14:15:00Z',
    updatedBy: 'Mrs. Pranali Titvekar',
    syllabusSummary: 'Core Computer Science (Compilers, OS, DBMS), DSA, C Pointer manipulation, Object-Oriented Design.',
    hiringRounds: [
      { round: 1, name: 'Core CS + Quantitative Assessment', type: 'aptitude', durationMin: 60 },
      { round: 2, name: 'C Language & Algorithm Hands-on Test', type: 'coding_c', durationMin: 60 },
      { round: 3, name: 'AI-Proctored Deep Technical Interview', type: 'technical_interview', durationMin: 45 },
    ],
  },
  {
    id: 'comp_google',
    name: 'Google India',
    logo: '🌐',
    tier: 'Tier 1 (Dream)',
    description: 'Global technology leader in search, AI, cloud computing, and developer infrastructure.',
    ctcRange: '22.0 - 45.0 LPA',
    roles: ['Software Engineer - Early Career', 'STEP Intern'],
    hiringStatus: 'Upcoming',
    marketTrendConfidence: 98,
    lastUpdated: '2026-08-12T16:00:00Z',
    updatedBy: 'Dr. S. K. Patil',
    syllabusSummary: 'Extensive algorithmic problem solving, graph algorithms, dynamic programming, system architecture, clean modular code.',
    hiringRounds: [
      { round: 1, name: 'Online Coding Challenge (2 Hard Problems)', type: 'coding_c', durationMin: 90 },
      { round: 2, name: 'Technical Round 1: Data Structures & C Optimization', type: 'technical_interview', durationMin: 45 },
      { round: 3, name: 'Technical Round 2: System Architecture & Concurrency', type: 'technical_interview', durationMin: 45 },
      { round: 4, name: 'Googliness & Leadership Fit', type: 'hr_interview', durationMin: 30 },
    ],
  },
  {
    id: 'comp_infosys',
    name: 'Infosys Limited',
    logo: '💠',
    tier: 'Mass Recruiter',
    description: 'Multinational digital services leader hiring for Systems Engineer, DSE, and Specialist Programmer.',
    ctcRange: '4.0 - 9.5 LPA',
    roles: ['Systems Engineer (SE)', 'Digital Specialist Engineer (DSE)', 'Specialist Programmer (SP)'],
    hiringStatus: 'Active',
    marketTrendConfidence: 92,
    lastUpdated: '2026-08-10T11:20:00Z',
    updatedBy: 'Dr. S. K. Patil',
    syllabusSummary: 'Mathematical reasoning, algorithmic puzzles, C/Java programming test, simulated behavioral interview.',
    hiringRounds: [
      { round: 1, name: 'Infosys Online Test (Aptitude & Technical)', type: 'aptitude', durationMin: 100 },
      { round: 2, name: 'C Language Hands-on Coding Round', type: 'coding_c', durationMin: 60 },
      { round: 3, name: 'AI Technical & HR Interview', type: 'technical_interview', durationMin: 30 },
    ],
  },
];

export const INITIAL_DRIVES: PlacementDrive[] = [
  {
    id: 'drive_tcs_2026',
    companyId: 'comp_tcs',
    companyName: 'Tata Consultancy Services (TCS)',
    roleTitle: 'TCS Digital / Ninja Campus Drive 2026',
    ctc: '7.5 LPA (Avg)',
    batch: '2026-27 Batch',
    status: 'active',
    startDate: '2026-08-20T09:00:00Z',
    deadline: '2026-08-28T23:59:00Z',
    eligibility: {
      minCgpa: 6.5,
      maxBacklogs: 0,
      allowedBranches: ['CSBS', 'CSE', 'IT', 'ENTC', 'Electrical'],
      allowedGenders: 'all',
    },
    roundsConfig: [
      { roundNumber: 1, name: 'Foundation Aptitude Test', type: 'aptitude', cutoffPercent: 65, isProctored: true },
      { roundNumber: 2, name: 'C Mini-Compiler Coding Challenge', type: 'c_compiler_test', cutoffPercent: 70, isProctored: true },
      { roundNumber: 3, name: 'AI Technical Mock Interview', type: 'ai_interview', cutoffPercent: 75, isProctored: true },
      { roundNumber: 4, name: 'Executive HR Round', type: 'hr_interview', cutoffPercent: 60, isProctored: false },
    ],
    registeredCount: 218,
    shortlistedCount: 142,
    placedCount: 0,
    createdBy: 'Mrs. Pranali Titvekar',
  },
  {
    id: 'drive_persistent_2026',
    companyId: 'comp_persistent',
    companyName: 'Persistent Systems',
    roleTitle: 'Software Product Engineer (SPE)',
    ctc: '8.5 LPA',
    batch: '2026-27 Batch',
    status: 'active',
    startDate: '2026-09-01T09:00:00Z',
    deadline: '2026-09-07T18:00:00Z',
    eligibility: {
      minCgpa: 7.0,
      maxBacklogs: 0,
      allowedBranches: ['CSBS', 'CSE', 'IT'],
      allowedGenders: 'all',
    },
    roundsConfig: [
      { roundNumber: 1, name: 'Core CS & Aptitude Screening', type: 'aptitude', cutoffPercent: 70, isProctored: true },
      { roundNumber: 2, name: 'C Coding with Memory & TAC Analysis', type: 'c_compiler_test', cutoffPercent: 75, isProctored: true },
      { roundNumber: 3, name: 'AI Technical Interview Simulation', type: 'ai_interview', cutoffPercent: 80, isProctored: true },
    ],
    registeredCount: 164,
    shortlistedCount: 98,
    placedCount: 0,
    createdBy: 'Mrs. Pranali Titvekar',
  },
  {
    id: 'drive_google_step_2026',
    companyId: 'comp_google',
    companyName: 'Google India',
    roleTitle: 'Software Engineer - Early Career 2026',
    ctc: '32.0 LPA',
    batch: '2026-27 Batch',
    status: 'draft',
    startDate: '2026-09-15T10:00:00Z',
    deadline: '2026-09-22T23:59:00Z',
    eligibility: {
      minCgpa: 8.5,
      maxBacklogs: 0,
      allowedBranches: ['CSBS', 'CSE', 'IT'],
      allowedGenders: 'all',
    },
    roundsConfig: [
      { roundNumber: 1, name: 'High-Scale Algorithmic Challenge', type: 'c_compiler_test', cutoffPercent: 85, isProctored: true },
      { roundNumber: 2, name: 'AI Technical Architecture Interview', type: 'ai_interview', cutoffPercent: 85, isProctored: true },
    ],
    registeredCount: 88,
    shortlistedCount: 0,
    placedCount: 0,
    createdBy: 'Dr. S. K. Patil',
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q_c_ptr_01',
    companyId: 'comp_tcs',
    category: 'C Internals',
    topic: 'Pointers & Memory Layout',
    difficulty: 'Medium',
    question: 'What will be the output of the following C statement on a 64-bit architecture?\nint arr[5] = {10, 20, 30, 40, 50};\nint *ptr = (int*)(&arr + 1);\nprintf("%d", *(ptr - 1));',
    options: ['10', '50', 'Garbage Value', 'Segmentation Fault'],
    correctIndex: 1,
    explanation: '&arr points to the entire array of 5 elements. &arr + 1 jumps past the array memory (by 20 bytes). ptr - 1 moves back by 4 bytes, pointing directly at the last element, which is arr[4] = 50.',
    tags: ['c_pointers', 'memory_arithmetic', 'tcs_nqt'],
    marketTrendVerified: true,
    addedBy: 'Mrs. Pranali Titvekar',
  },
  {
    id: 'q_compiler_ast_02',
    companyId: 'comp_persistent',
    category: 'Core CS',
    topic: 'Compiler Design & Three-Address Code',
    difficulty: 'Hard',
    question: 'During Intermediate Code Generation (ICG) for the expression "a = b * -c + b * -c", what is the minimum number of Three-Address Code (TAC) temporary variables required after Common Subexpression Elimination (CSE)?',
    options: ['1 temporary variable', '2 temporary variables', '3 temporary variables', '4 temporary variables'],
    correctIndex: 1,
    explanation: 'Without CSE, TAC needs 4 temporaries (t1=-c, t2=b*t1, t3=-c, t4=b*t3, t5=t2+t4). With CSE, subexpression b * -c is computed once (t1 = -c, t2 = b * t1), and then t3 = t2 + t2, requiring only 2 distinct intermediate temporary computations.',
    tags: ['tac_generation', 'ast_optimization', 'compiler_theory'],
    marketTrendVerified: true,
    addedBy: 'Mrs. Pranali Titvekar',
  },
  {
    id: 'q_quant_speed_03',
    companyId: 'comp_tcs',
    category: 'Quantitative Aptitude',
    topic: 'Time, Speed & Distance',
    difficulty: 'Medium',
    question: 'A train 180 meters long running at 72 km/h crosses another train 120 meters long running in the opposite direction at 54 km/h. What is the time taken to cross each other completely?',
    options: ['8.57 seconds', '7.20 seconds', '10.0 seconds', '12.4 seconds'],
    correctIndex: 0,
    explanation: 'Total distance = 180 + 120 = 300 meters. Relative speed = 72 + 54 = 126 km/h = 126 * (5/18) = 35 m/s. Time = 300 / 35 = 8.57 seconds.',
    tags: ['speed_distance', 'quant', 'tcs_foundation'],
    marketTrendVerified: true,
    addedBy: 'Prof. R. M. Kulkarni',
  },
  {
    id: 'q_dsa_trees_04',
    companyId: 'comp_google',
    category: 'Data Structures',
    topic: 'Binary Search Trees & Balancing',
    difficulty: 'Hard',
    question: 'In an AVL Tree, after inserting a node into the left subtree of the right child of node Z (RL Case), which rotation sequence is required to restore balance?',
    options: ['Single Left Rotation', 'Single Right Rotation', 'Right Rotation on Right Child, followed by Left Rotation on Z (Right-Left Double Rotation)', 'Left Rotation on Left Child, followed by Right Rotation on Z'],
    correctIndex: 2,
    explanation: 'For an RL (Right-Left) imbalance, a double rotation is necessary: first a Right Rotation on the right child to convert the shape to RR, followed by a Left Rotation on node Z to achieve AVL balance.',
    tags: ['avl_trees', 'rotations', 'google_dsa'],
    marketTrendVerified: true,
    addedBy: 'Dr. S. K. Patil',
  },
];

export const INITIAL_CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'prob_c_rev_words',
    title: 'In-Place Word Reversal via Pointer Manipulation',
    difficulty: 'Medium',
    category: 'Pointers & Memory',
    tags: ['C_Mini_Compiler', 'Pointer_Arithmetic', 'In_Place_Algorithm'],
    description: 'Given a character string, reverse the individual words in-place without allocating auxiliary arrays or using standard library string functions (such as `strcpy` or `strrev`). Your C program will be compiled and evaluated phase-by-phase through the PlacementPro C Mini-Compiler.',
    constraints: 'String length <= 1000 characters. Memory limit: O(1) auxiliary space. Must use pointer arithmetic.',
    inputFormat: 'A single line containing the space-separated sentence.',
    outputFormat: 'The transformed sentence with reversed words.',
    boilerplateCodeC: `#include <stdio.h>

void reverseString(char *start, char *end) {
    char temp;
    while (start < end) {
        temp = *start;
        *start = *end;
        *end = temp;
        start++;
        end--;
    }
}

void reverseWords(char *str) {
    char *wordStart = str;
    char *temp = str;
    
    while (*temp) {
        if (*temp == ' ') {
            reverseString(wordStart, temp - 1);
            wordStart = temp + 1;
        }
        temp++;
    }
    reverseString(wordStart, temp - 1);
}

int main() {
    char sentence[] = "KIT College PlacementPro 2026";
    printf("Original: %s\\n", sentence);
    reverseWords(sentence);
    printf("Transformed: %s\\n", sentence);
    return 0;
}`,
    sampleTestCases: [
      { input: 'hello placementpro world', output: 'olleh orptnemecalp dlrow', explanation: 'Each individual token word is reversed in-place.' },
      { input: 'computer science engineering', output: 'retupmoc ecneics gnireenigne', explanation: 'Pointers correctly locate whitespace delimiters.' },
    ],
    hiddenTestCases: [
      { input: 'a b c d', output: 'a b c d' },
      { input: 'three address code', output: 'eerht sserdda edoc' },
    ],
    cCompilerSpecificRequirements: {
      mustUsePointers: true,
      forbidStandardLibs: ['string.h'],
      maxAstDepth: 6,
      maxTACInstructions: 35,
    },
  },
  {
    id: 'prob_c_tac_calc',
    title: 'Polynomial Expression Evaluator & TAC Generator',
    difficulty: 'Hard',
    category: 'C Fundamentals',
    tags: ['TAC_Evaluation', 'Operator_Precedence', 'Compiler_Internals'],
    description: 'Implement a C function that parses and evaluates a simple arithmetic polynomial expression with operator precedence (*, +, -) and outputs the corresponding Three-Address Code representation steps.',
    constraints: 'Operands are single integers (0-9). Operators: +, -, *.',
    inputFormat: 'Arithmetic expression string: e.g. "3 + 4 * 2 - 5"',
    outputFormat: 'Calculated integer result along with intermediate TAC instructions.',
    boilerplateCodeC: `#include <stdio.h>

int evaluateTAC(const char *expr) {
    // Student implementation targeting PlacementPro C Compiler Engine
    int a = 3, b = 4, c = 2, d = 5;
    int t0 = b * c;
    int t1 = a + t0;
    int t2 = t1 - d;
    return t2;
}

int main() {
    int res = evaluateTAC("3 + 4 * 2 - 5");
    printf("Result: %d\\n", res);
    return 0;
}`,
    sampleTestCases: [
      { input: '3 + 4 * 2 - 5', output: '6', explanation: '3 + 8 - 5 = 6' },
    ],
    hiddenTestCases: [
      { input: '2 * 3 + 4 * 5', output: '26' },
    ],
  },
];

export const INITIAL_RAG_CHUNKS: RAGKnowledgeChunk[] = [
  {
    id: 'rag_01',
    companyId: 'comp_tcs',
    companyName: 'Tata Consultancy Services (TCS)',
    category: 'aptitude_patterns',
    sourceDocument: 'TCS_NQT_2026_Pattern_Analysis_KIT.pdf',
    rawText: 'TCS NQT 2026 has introduced mandatory Advanced Cognitive tests with 25 questions in 40 minutes. Major focus areas: Logarithms, Permutations & Combinations, Data Sufficiency, and Clock/Calendar problems.',
    tags: ['tcs_nqt', 'advanced_quant', 'syllabus_2026'],
    vectorEmbeddingId: 'emb_tcs_quant_901',
    ingestedAt: '2026-08-10T14:30:00Z',
    ingestedByFaculty: 'Mrs. Pranali Titvekar',
    aiSummarizedTakeaway: 'High priority on Advanced Permutations and Clock logic for TCS NQT 2026.',
    relevanceScore: 0.96,
  },
  {
    id: 'rag_02',
    companyId: 'comp_persistent',
    companyName: 'Persistent Systems',
    category: 'c_interview_questions',
    sourceDocument: 'Persistent_Technical_Interview_Transcripts_2025.docx',
    rawText: 'Interviewers frequently test candidates on C Memory Segments (Text, Data, BSS, Stack, Heap), Dangling Pointers, Function Pointers for callback implementations, and the 4 phases of compilation (Pre-processing, Compilation, Assembly, Linking).',
    tags: ['persistent', 'c_pointers', 'memory_segments', 'compiler_phases'],
    vectorEmbeddingId: 'emb_pers_c_902',
    ingestedAt: '2026-08-11T16:00:00Z',
    ingestedByFaculty: 'Mrs. Pranali Titvekar',
    aiSummarizedTakeaway: 'Persistent tech rounds heavily evaluate C memory architecture and compiler phases.',
    relevanceScore: 0.98,
  },
  {
    id: 'rag_03',
    companyId: 'comp_google',
    companyName: 'Google India',
    category: 'interview_experiences',
    sourceDocument: 'Google_STEP_Selected_Alumni_Notes.pdf',
    rawText: 'Google coding rounds focus heavily on optimal space-time complexities. Writing clean C++ or C with modular helpers and explaining Three-Address Code representation or pointer mechanics stands out positively in technical debriefs.',
    tags: ['google', 'complexity_analysis', 'clean_code'],
    vectorEmbeddingId: 'emb_goog_exp_903',
    ingestedAt: '2026-08-12T11:20:00Z',
    ingestedByFaculty: 'Dr. S. K. Patil',
    aiSummarizedTakeaway: 'Extreme emphasis on space complexity verification and modular pointer logic.',
    relevanceScore: 0.95,
  },
  {
    id: 'rag_04',
    companyId: 'comp_tcs',
    companyName: 'Tata Consultancy Services (TCS)',
    category: 'market_trends',
    sourceDocument: 'Industry_Campus_Hiring_Report_2026.pdf',
    rawText: 'IT recruiters are shifting away from generic trivia questions toward live code execution tests that verify the student understands what the compiler actually does with their syntax and data structures.',
    tags: ['market_trends', 'compiler_literacy', '2026_placement'],
    vectorEmbeddingId: 'emb_trend_ind_904',
    ingestedAt: '2026-08-14T09:45:00Z',
    ingestedByFaculty: 'Mrs. Pranali Titvekar',
    aiSummarizedTakeaway: 'Placement rounds require transparent compiler diagnosis rather than opaque pass/fail verdicts.',
    relevanceScore: 0.99,
  },
];

export const INITIAL_MARKET_SUGGESTIONS: MarketTrendSuggestion[] = [
  {
    id: 'sug_01',
    company: 'Tata Consultancy Services (TCS)',
    trendTitle: 'Auto-Upgrade TCS Digital Coding Pool to Include TAC Verification',
    detectedShift: 'TCS Digital 2026 exam benchmarks demonstrate a 25% higher candidate rejection rate for unoptimized intermediate memory code. Recruiter rubric prioritizes TAC efficiency.',
    recommendedAction: 'Apply 1-click update: Add 10 TAC evaluation questions to the active TCS drive and activate the In-House C Mini-Compiler report for all submissions.',
    impactScope: 'Coding Engine',
    confidence: 97,
    status: 'pending',
    detectedAt: '2026-08-16T08:30:00Z',
    suggestedChanges: {
      action: 'inject_c_tac_questions',
      count: 10,
      targetDriveId: 'drive_tcs_2026',
    },
  },
  {
    id: 'sug_02',
    company: 'Persistent Systems',
    trendTitle: 'Stricter Head-Pose & Voice AI Proctoring Thresholds',
    detectedShift: 'Persistent remote screening drives have adopted stricter multi-face and browser unfocus penalties with maximum 2 warnings before auto-submission.',
    recommendedAction: 'Lower tab-switch tolerance from 4 to 2 and flag suspicious head-pose deviations exceeding 30 degrees.',
    impactScope: 'Proctoring Rules',
    confidence: 93,
    status: 'pending',
    detectedAt: '2026-08-15T19:00:00Z',
    suggestedChanges: {
      tabSwitchLimit: 2,
      headPoseThresholdDeg: 30,
      autoDisqualify: false,
    },
  },
  {
    id: 'sug_03',
    company: 'Infosys Limited',
    trendTitle: 'Mandatory Dynamic Programming Submissions in C/C++',
    detectedShift: 'Infosys DSE track has added a 2nd coding problem centered on Memoization and 1D DP arrays.',
    recommendedAction: 'Insert 2 DP problems into the Infosys coding round bank.',
    impactScope: 'Aptitude Pool',
    confidence: 89,
    status: 'approved',
    detectedAt: '2026-08-14T12:00:00Z',
    suggestedChanges: {
      addedTopics: ['Dynamic Programming', 'Memoization'],
    },
  },
];

export const INITIAL_STUDENTS: StudentAnalytics[] = [
  {
    studentId: 'stud_aaryan_01',
    studentName: 'Aaryan Yerudkar',
    usn: '2425000402',
    branch: 'CSBS (Computer Science & Business Systems)',
    batch: 'TY C-16',
    cgpa: 8.82,
    readinessScore: 92,
    competencies: {
      aptitude: 94,
      cCompilerMastery: 96,
      dsa: 90,
      communication: 88,
      coreCS: 92,
    },
    topStrengths: [
      'C/C++ Memory Management',
      'Algorithms & Data Structures',
      'System Architecture & Concurrency',
      'Quantitative Reasoning'
    ],
    weakAreas: [
      'Advanced Dynamic Programming Graphs',
      'Verbal Speed Reading'
    ],
    testsAttempted: 12,
    codingProblemsSolved: 48,
    interviewsCompleted: 4,
    proctoringIntegrityIndex: 98,
    targetCompaniesEligibility: [
      { companyName: 'TCS (Digital/Prime)', eligible: true },
      { companyName: 'Persistent Systems', eligible: true },
      { companyName: 'Google India', eligible: true },
      { companyName: 'Infosys (DSE)', eligible: true },
    ],
    predictedTier: 'Tier 1',
    predictedPlacementTier: 'Tier-1 High CTC',
  },
  {
    studentId: 'stud_shreya_02',
    studentName: 'Shreya Jangam',
    usn: '2425000449',
    branch: 'CSBS (Computer Science & Business Systems)',
    batch: 'TY C-18',
    cgpa: 8.76,
    readinessScore: 90,
    competencies: {
      aptitude: 92,
      cCompilerMastery: 94,
      dsa: 89,
      communication: 91,
      coreCS: 87,
    },
    topStrengths: [
      'Object-Oriented Design',
      'Database Indexing & Queries',
      'Technical Communication',
      'Pointer & Struct Alignment'
    ],
    weakAreas: [
      'Complex Tree Balancing',
      'Low-Level Bit Manipulation'
    ],
    testsAttempted: 11,
    codingProblemsSolved: 44,
    interviewsCompleted: 3,
    proctoringIntegrityIndex: 100,
    targetCompaniesEligibility: [
      { companyName: 'TCS (Digital/Prime)', eligible: true },
      { companyName: 'Persistent Systems', eligible: true },
      { companyName: 'Google India', eligible: true },
      { companyName: 'Infosys (DSE)', eligible: true },
    ],
    predictedTier: 'Tier 1',
    predictedPlacementTier: 'Tier-1 High CTC',
  },
  {
    studentId: 'stud_aarya_03',
    studentName: 'Aarya Javandal',
    usn: '2425000121',
    branch: 'CSBS (Computer Science & Business Systems)',
    batch: 'TY C-06',
    cgpa: 8.65,
    readinessScore: 89,
    competencies: {
      aptitude: 88,
      cCompilerMastery: 92,
      dsa: 87,
      communication: 93,
      coreCS: 86,
    },
    topStrengths: [
      'Quantitative Aptitude & Time-Work',
      'Full-Stack Architecture',
      'Live Coding Explainability',
      'Operating System Scheduling'
    ],
    weakAreas: [
      'Graph Cycle Detection Algorithms',
      'Memory Leak Profiling'
    ],
    testsAttempted: 10,
    codingProblemsSolved: 40,
    interviewsCompleted: 3,
    proctoringIntegrityIndex: 96,
    targetCompaniesEligibility: [
      { companyName: 'TCS (Digital/Prime)', eligible: true },
      { companyName: 'Persistent Systems', eligible: true },
      { companyName: 'Google India', eligible: true },
      { companyName: 'Infosys (DSE)', eligible: true },
    ],
    predictedTier: 'Tier 1',
    predictedPlacementTier: 'Tier-1 High CTC',
  },
  {
    studentId: 'stud_samrudhi_04',
    studentName: 'Samrudhi Kulkarni',
    usn: '2425000508',
    branch: 'CSBS (Computer Science & Business Systems)',
    batch: 'TY C-22',
    cgpa: 8.70,
    readinessScore: 91,
    competencies: {
      aptitude: 90,
      cCompilerMastery: 93,
      dsa: 88,
      communication: 94,
      coreCS: 90,
    },
    topStrengths: [
      'DBMS Normalization & ACID',
      'Verbal Reasoning',
      'Modular Code Quality',
      'Three-Address Code Analysis'
    ],
    weakAreas: [
      'Divide and Conquer Optimization',
      'Socket Programming Edge Cases'
    ],
    testsAttempted: 11,
    codingProblemsSolved: 42,
    interviewsCompleted: 4,
    proctoringIntegrityIndex: 99,
    targetCompaniesEligibility: [
      { companyName: 'TCS (Digital/Prime)', eligible: true },
      { companyName: 'Persistent Systems', eligible: true },
      { companyName: 'Google India', eligible: true },
      { companyName: 'Infosys (DSE)', eligible: true },
    ],
    predictedTier: 'Tier 1',
    predictedPlacementTier: 'Tier-1 High CTC',
  },
  {
    studentId: 'stud_rohit_05',
    studentName: 'Rohit Deshmukh',
    usn: '2425000310',
    branch: 'CSE',
    batch: 'TY B-04',
    cgpa: 7.15,
    readinessScore: 72,
    competencies: {
      aptitude: 68,
      cCompilerMastery: 65,
      dsa: 74,
      communication: 76,
      coreCS: 78,
    },
    topStrengths: [
      'Relational Database Basics',
      'Computer Networking OSI Layers',
      'Standard Array Manipulations'
    ],
    weakAreas: [
      'Speed Aptitude / Fast Math',
      'Pointer Arithmetic & Memory Allocation',
      'Dynamic Programming Memoization'
    ],
    testsAttempted: 6,
    codingProblemsSolved: 22,
    interviewsCompleted: 1,
    proctoringIntegrityIndex: 88,
    targetCompaniesEligibility: [
      { companyName: 'TCS (Digital/Ninja)', eligible: true },
      { companyName: 'Persistent Systems', eligible: true },
      { companyName: 'Google India', eligible: false, gap: 'Min CGPA 8.5 required' },
      { companyName: 'Infosys (SE)', eligible: true },
    ],
    predictedTier: 'Tier 2',
    predictedPlacementTier: 'Tier-2 Core',
  },
];

export const INITIAL_PROCTORING_LOGS: ProctoringViolation[] = [
  {
    id: 'proc_log_101',
    studentId: 'stud_rohit_05',
    studentName: 'Rohit Deshmukh',
    usn: '2425000310',
    testId: 'test_tcs_foundation_01',
    driveName: 'TCS Digital / Ninja Campus Drive 2026',
    timestamp: '2026-08-16T09:42:15Z',
    violationType: 'tab_switch',
    severity: 'medium',
    confidence: 100,
    details: 'Browser focus lost for 4.2 seconds. Window blurred. Switched to external application.',
    status: 'flagged',
  },
  {
    id: 'proc_log_102',
    studentId: 'stud_rohit_05',
    studentName: 'Rohit Deshmukh',
    usn: '2425000310',
    testId: 'test_tcs_foundation_01',
    driveName: 'TCS Digital / Ninja Campus Drive 2026',
    timestamp: '2026-08-16T09:51:30Z',
    violationType: 'multiple_faces',
    severity: 'high',
    confidence: 92,
    details: 'AI Face Mesh detected 2 distinct facial contours in the webcam stream simultaneously for 6.8 seconds.',
    status: 'pending_review',
  },
  {
    id: 'proc_log_103',
    studentId: 'stud_aaryan_01',
    studentName: 'Aaryan Yerudkar',
    usn: '2425000402',
    testId: 'test_persistent_coding_01',
    driveName: 'Persistent Systems Software Product Engineer',
    timestamp: '2026-08-15T15:20:10Z',
    violationType: 'head_pose_deviation',
    severity: 'low',
    confidence: 76,
    details: 'Minor pitch/yaw angle shift (32 degrees) for 3 seconds while referencing scratchpad.',
    status: 'dismissed',
  },
];

export const INITIAL_INTERVIEW_SESSIONS: AIInterviewSession[] = [
  {
    id: 'int_sess_01',
    studentId: 'stud_aaryan_01',
    studentName: 'Aaryan Yerudkar',
    companyName: 'Persistent Systems',
    interviewerPersona: 'Staff Architect',
    conductedAt: '2026-08-15T16:30:00Z',
    durationMinutes: 28,
    overallScore: 93,
    breakdown: {
      technicalCorrectness: 95,
      cLanguageMastery: 96,
      problemSolvingMethodology: 92,
      speechClarityAndConfidence: 90,
      culturalFit: 94,
    },
    strengths: [
      'Exceptional depth in C Compiler phase transitions (Lexer, Parser, TAC optimization).',
      'Flawless explanation of stack vs heap pointer allocations and memory leakage prevention.',
      'Confident communication and structured responses.',
    ],
    weaknesses: [
      'Can provide slightly more detail on distributed system caching scenarios.',
    ],
    recommendation: 'Strong Hire',
    transcript: [
      {
        speaker: 'AI Interviewer',
        message: 'Welcome Aaryan. Let us begin by discussing intermediate code generation. When your C code generates Three-Address Code, how does the compiler represent temporary variables and what optimizations can be applied?',
        timestamp: '00:01:10',
      },
      {
        speaker: 'Student',
        message: 'In Three-Address Code, instructions contain at most three operands, typically formatted as x = y op z. The compiler allocates virtual temporary registers like t0, t1. We can optimize this via Common Subexpression Elimination, constant propagation, and dead code elimination before translating to machine assembly.',
        timestamp: '00:02:45',
        evaluationMetric: 'High Technical Accuracy (98%)',
      },
      {
        speaker: 'AI Interviewer',
        message: 'Excellent explanation. Now, how does pointer arithmetic differ when dereferencing an array of structs versus primitive integers in C memory?',
        timestamp: '00:04:10',
      },
      {
        speaker: 'Student',
        message: 'Pointer arithmetic increments by sizeof(DataType). For a struct of size 24 bytes, ptr + 1 advances the memory pointer address by exactly 24 bytes, adhering to structure alignment padding in memory.',
        timestamp: '00:05:30',
        evaluationMetric: 'Mastery of Memory Architecture (96%)',
      },
    ],
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_01',
    adminUid: 'faculty_pranali_01',
    adminName: 'Mrs. Pranali Titvekar',
    action: 'CREATE_DRIVE',
    targetCollection: 'drives',
    targetId: 'drive_tcs_2026',
    timestamp: '2026-08-14T10:15:00Z',
    details: 'Created TCS Digital/Ninja 2026 Campus Drive with 4 eligibility rounds and C-Compiler coding engine configuration.',
  },
  {
    id: 'aud_02',
    adminUid: 'faculty_pranali_01',
    adminName: 'Mrs. Pranali Titvekar',
    action: 'INGEST_RAG_KNOWLEDGE',
    targetCollection: 'ragChunks',
    targetId: 'rag_01',
    timestamp: '2026-08-14T11:00:00Z',
    details: 'Ingested TCS NQT 2026 Pattern Analysis PDF. Created 4 vector knowledge chunks.',
  },
  {
    id: 'aud_03',
    adminUid: 'faculty_tpo_head_02',
    adminName: 'Dr. S. K. Patil',
    action: 'APPROVE_MARKET_TREND',
    targetCollection: 'updateSuggestions',
    targetId: 'sug_03',
    timestamp: '2026-08-15T09:30:00Z',
    details: 'Approved Infosys DSE Dynamic Programming update suggestion. Automatically updated question pools.',
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_901',
    studentId: 'stud_aaryan_01',
    studentName: 'Aaryan Yerudkar',
    problemId: 'prob_c_rev_words',
    problemTitle: 'In-Place Word Reversal via Pointer Manipulation',
    language: 'c',
    code: '#include <stdio.h>\nvoid reverseWords(char *str) { ... }',
    verdict: 'Accepted',
    score: 100,
    submittedAt: '2026-08-15T14:30:00Z',
    compilerReport: {
      compilerVersion: 'KIT CSBS In-House C Mini-Compiler v2.4',
      status: 'SUCCESS',
      tokensCount: 28,
      tokensStream: [],
      astTree: {},
      symbolTable: [],
      threeAddressCode: ['t0 = str + 0', 't1 = *t0', 't2 = t1 == 0'],
      pseudoAssembly: ['lw $t0, 0($sp)', 'bne $t0, $zero, L1'],
      diagnostics: {
        passedTestCases: 4,
        totalTestCases: 4,
        executionTimeMs: 1.4,
        memoryAllocatedKb: 24,
        astDepth: 5,
        pedagogicalFeedback: 'Flawless pointer arithmetic and minimal Three-Address Code generation.',
      },
    },
  },
];

// Aliases for component usage
export const mockFaculty = FACULTY_ADMINS;
export const mockCompanies = INITIAL_COMPANIES;
export const mockDrives = INITIAL_DRIVES;
export const mockQuestions = INITIAL_QUESTIONS;
export const mockCodingProblems = INITIAL_CODING_PROBLEMS;
export const mockRAGChunks = INITIAL_RAG_CHUNKS;
export const mockMarketSuggestions = INITIAL_MARKET_SUGGESTIONS;
export const mockProctoringEvents = INITIAL_PROCTORING_LOGS;
export const mockStudentAnalytics = INITIAL_STUDENTS;
export const mockInterviewSessions = INITIAL_INTERVIEW_SESSIONS;
export const mockSubmissions = INITIAL_SUBMISSIONS;
export const mockAuditLogs = INITIAL_AUDIT_LOGS;


