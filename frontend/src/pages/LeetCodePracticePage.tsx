import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Tabs, Tab, Form, Table, Alert, Accordion } from 'react-bootstrap';
import Editor from '@monaco-editor/react';

interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Array' | 'String' | 'Dynamic Programming' | 'Graph' | 'Tree' | 'Linked List';
  companies: string[];
  acceptanceRate: string;
  description: string;
  starterCode: Record<string, string>;
  testCases: { input: string; expected: string }[];
  editorial: {
    approach: string;
    timeComplexity: string;
    spaceComplexity: string;
    codeSnippet: string;
  };
}

const mockCodingProblems: CodingProblem[] = [
  {
    id: 'lc-1',
    title: '1. Two Sum',
    difficulty: 'Easy',
    category: 'Array',
    companies: ['Amazon', 'Google', 'Microsoft', 'TCS'],
    acceptanceRate: '52.4%',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) {\n      return [map.get(diff), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `def twoSum(nums, target):\n    hashmap = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in hashmap:\n            return [hashmap[diff], i]\n        hashmap[num] = i\n    return []`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (mp.count(diff)) return {mp[diff], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`
    },
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' },
      { input: 'nums = [3,3], target = 6', expected: '[0,1]' }
    ],
    editorial: {
      approach: 'Use a Hash Map to store numbers visited so far alongside their indices. For each number, check if (target - num) exists in the hash map.',
      timeComplexity: 'O(N) — Single pass through the array.',
      spaceComplexity: 'O(N) — Hash map stores at most N elements.',
      codeSnippet: 'const map = new Map(); map.set(num, index);'
    }
  },
  {
    id: 'lc-2',
    title: '3. Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'String',
    companies: ['Amazon', 'Microsoft', 'Infosys'],
    acceptanceRate: '34.8%',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  let left = 0, maxLen = 0;\n  const set = new Set();\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
      python: `def lengthOfLongestSubstring(s: str) -> int:\n    char_set = set()\n    left = max_len = 0\n    for right in range(len(s)):\n        while s[right] in char_set:\n            char_set.remove(s[left])\n            left += 1\n        char_set.add(s[right])\n        max_len = max(max_len, right - left + 1)\n    return max_len`,
      cpp: `// C++ Sliding Window Solution`
    },
    testCases: [
      { input: 's = "abcabcbb"', expected: '3' },
      { input: 's = "bbbbb"', expected: '1' }
    ],
    editorial: {
      approach: 'Sliding Window pattern using two pointers (left & right) and a Set to keep track of unique characters.',
      timeComplexity: 'O(N) — Each character is visited at most twice by left and right pointers.',
      spaceComplexity: 'O(K) — Set stores unique characters in current window.',
      codeSnippet: 'while (set.has(s[right])) set.delete(s[left++]);'
    }
  },
  {
    id: 'lc-3',
    title: '42. Trapping Rain Water',
    difficulty: 'Hard',
    category: 'Array',
    companies: ['Google', 'Amazon', 'Accenture'],
    acceptanceRate: '61.2%',
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    starterCode: {
      javascript: `function trap(height) {\n  let left = 0, right = height.length - 1;\n  let leftMax = 0, rightMax = 0, water = 0;\n  while (left < right) {\n    if (height[left] < height[right]) {\n      if (height[left] >= leftMax) leftMax = height[left];\n      else water += leftMax - height[left];\n      left++;\n    } else {\n      if (height[right] >= rightMax) rightMax = height[right];\n      else water += rightMax - height[right];\n      right--;\n    }\n  }\n  return water;\n}`,
      python: `def trap(height: List[int]) -> int:`,
      cpp: `// C++ Two Pointer Solution`
    },
    testCases: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', expected: '6' }
    ],
    editorial: {
      approach: 'Two-Pointer Technique maintaining left_max and right_max bounds to calculate trapped water in O(1) memory.',
      timeComplexity: 'O(N) — Single traversal from both ends.',
      spaceComplexity: 'O(1) — Constant memory space.',
      codeSnippet: 'water += leftMax - height[left];'
    }
  }
];

export const LeetCodePracticePage: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem>(mockCodingProblems[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'cpp'>('javascript');
  const [code, setCode] = useState<string>(mockCodingProblems[0].starterCode.javascript);
  
  // Editor Theme
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedDiff, setSelectedDiff] = useState<string>('All');

  // Code Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<{ pass: boolean; timeMs: number; output: string }[] | null>(null);
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('description');

  const handleSelectProblem = (p: CodingProblem) => {
    setSelectedProblem(p);
    setCode(p.starterCode[selectedLanguage] || p.starterCode['javascript']);
    setRunResults(null);
    setAiReview(null);
    setActiveTab('description');
  };

  const handleLanguageChange = (lang: 'javascript' | 'python' | 'cpp') => {
    setSelectedLanguage(lang);
    setCode(selectedProblem.starterCode[lang] || `// Write your ${lang} code here`);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setRunResults([
        { pass: true, timeMs: 48, output: '[0, 1]' },
        { pass: true, timeMs: 52, output: '[1, 2]' },
        { pass: true, timeMs: 45, output: '[0, 1]' }
      ]);
      setActiveTab('testcases');
    }, 1200);
  };

  const handleAiCodeReview = () => {
    setAiReview("AI Review:\n✓ Time Complexity is optimal O(N) using Hash Map.\n✓ Code is clean and handles edge cases properly.\n💡 Tip: Consider validating empty array input at function start for defensive programming.");
    setActiveTab('ai-review');
  };

  const filteredProblems = mockCodingProblems.filter((p) => {
    const matchTopic = selectedTopic === 'All' ? true : p.category === selectedTopic;
    const matchCompany = selectedCompany === 'All' ? true : p.companies.includes(selectedCompany);
    const matchDiff = selectedDiff === 'All' ? true : p.difficulty === selectedDiff;
    return matchTopic && matchCompany && matchDiff;
  });

  return (
    <Container fluid className="px-0">
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-code-square text-primary"></i> LeetCode-style Technical Coding Practice
          </h3>
          <p className="text-muted mb-0 fs-7">
            Solve topic-wise DSA problems, company specific interview questions, and receive instant AI code evaluations.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Badge bg="danger" className="px-3 py-2 fs-7 fw-bold shadow-sm">
            <i className="bi bi-fire me-1"></i> 14-Day Streak 🔥
          </Badge>
          <Badge bg="success-subtle" text="success" className="px-3 py-2 fs-7 fw-semibold border border-success-subtle">
            Solved: 106 / 150 Problems
          </Badge>
        </div>
      </div>

      {/* Daily Challenge Banner */}
      <Card className="shadow-sm border-0 mb-4 bg-gradient bg-primary text-white">
        <Card.Body className="p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white text-primary p-3 rounded-circle fw-bold fs-3 shadow-sm">
              <i className="bi bi-calendar-event"></i>
            </div>
            <div>
              <Badge bg="warning" text="dark" className="fw-bold mb-1">Daily Challenge (+50 XP)</Badge>
              <h5 className="fw-bold mb-0 text-white">42. Trapping Rain Water (Hard)</h5>
              <small className="opacity-90 fs-8">Tagged in Google, Amazon & Microsoft Recent Campus Rounds</small>
            </div>
          </div>

          <Button
            variant="light"
            className="fw-bold text-primary px-4 py-2"
            onClick={() => handleSelectProblem(mockCodingProblems[2])}
          >
            Solve Challenge
          </Button>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Left Column: Problem List & Filters */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white py-3 fw-bold fs-6">
              <i className="bi bi-funnel text-primary me-2"></i> Problem Explorer & Filters
            </Card.Header>
            <Card.Body className="p-3">
              <Row className="g-2 mb-3">
                <Col xs={4}>
                  <Form.Select
                    size="sm"
                    className="fs-8"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                  >
                    <option value="All">All Topics</option>
                    <option value="Array">Array</option>
                    <option value="String">String</option>
                    <option value="Dynamic Programming">DP</option>
                  </Form.Select>
                </Col>

                <Col xs={4}>
                  <Form.Select
                    size="sm"
                    className="fs-8"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                  >
                    <option value="All">All Companies</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Google">Google</option>
                    <option value="Microsoft">Microsoft</option>
                  </Form.Select>
                </Col>

                <Col xs={4}>
                  <Form.Select
                    size="sm"
                    className="fs-8"
                    value={selectedDiff}
                    onChange={(e) => setSelectedDiff(e.target.value)}
                  >
                    <option value="All">Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Form.Select>
                </Col>
              </Row>

              <div className="list-group list-group-flush border rounded overflow-hidden">
                {filteredProblems.map((p) => (
                  <button
                    key={p.id}
                    className={`list-group-item list-group-item-action p-3 d-flex flex-column gap-1 text-start ${
                      selectedProblem.id === p.id ? 'active bg-primary text-white' : ''
                    }`}
                    onClick={() => handleSelectProblem(p)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold fs-8">{p.title}</span>
                      <Badge bg={p.difficulty === 'Easy' ? 'success' : p.difficulty === 'Medium' ? 'warning' : 'danger'}>
                        {p.difficulty}
                      </Badge>
                    </div>
                    <div className={`fs-9 ${selectedProblem.id === p.id ? 'text-white-50' : 'text-muted'}`}>
                      Acceptance: {p.acceptanceRate} • {p.companies.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Code Editor & Problem Spec */}
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark fs-6">{selectedProblem.title}</span>
                <Badge bg={selectedProblem.difficulty === 'Easy' ? 'success' : selectedProblem.difficulty === 'Medium' ? 'warning' : 'danger'}>
                  {selectedProblem.difficulty}
                </Badge>
              </div>

              {/* Language Picker & Theme Controls */}
              <div className="d-flex align-items-center gap-2">
                <Form.Select
                  size="sm"
                  style={{ width: '130px' }}
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as any)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ 20</option>
                </Form.Select>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
                  title="Toggle Dark/Light Editor Theme"
                >
                  <i className={`bi ${editorTheme === 'vs-dark' ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
                </Button>
              </div>
            </Card.Header>

            {/* Monaco Code Editor Workspace */}
            <div className="bg-dark p-1">
              <Editor
                height="380px"
                language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                theme={editorTheme}
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            <Card.Footer className="bg-white py-2 px-3 d-flex justify-content-between align-items-center">
              <Button variant="outline-primary" size="sm" className="fw-bold fs-8" onClick={handleAiCodeReview}>
                <i className="bi bi-cpu me-1"></i> Request AI Code Review
              </Button>

              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" className="fw-bold fs-8" onClick={handleRunCode} disabled={isRunning}>
                  <i className="bi bi-play-fill me-1"></i> Run Code
                </Button>

                <Button variant="success" size="sm" className="fw-bold fs-8 px-3" onClick={handleRunCode} disabled={isRunning}>
                  {isRunning ? 'Submitting...' : 'Submit Solution'}
                </Button>
              </div>
            </Card.Footer>
          </Card>

          {/* Sub-Tabs: Description, Test Cases, Editorial, AI Review */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-2 px-3 border-bottom">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'description')}
                className="nav-tabs-sm border-0"
              >
                <Tab eventKey="description" title="Description" />
                <Tab eventKey="testcases" title="Test Cases & Output" />
                <Tab eventKey="editorial" title="Editorial Solution" />
                <Tab eventKey="ai-review" title="AI Code Review" />
              </Tabs>
            </Card.Header>

            <Card.Body className="p-3.5 fs-8">
              {activeTab === 'description' && (
                <div>
                  <p className="text-dark whitespace-pre-line mb-3">{selectedProblem.description}</p>
                  <h6 className="fw-bold text-dark fs-8 mb-2">Sample Test Cases:</h6>
                  {selectedProblem.testCases.map((tc, idx) => (
                    <div key={idx} className="bg-light p-2.5 rounded border mb-2 font-monospace">
                      <span className="text-muted d-block">Input: {tc.input}</span>
                      <strong className="text-dark">Expected: {tc.expected}</strong>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'testcases' && (
                <div>
                  {runResults ? (
                    <div>
                      <Alert variant="success" className="p-2 mb-3 fw-bold fs-8">
                        ✓ All {runResults.length} Test Cases Passed! (Runtime: 48 ms, Memory: 42.1 MB)
                      </Alert>

                      {runResults.map((r, i) => (
                        <div key={i} className="bg-light p-2.5 rounded border mb-2 font-monospace">
                          <span className="badge bg-success me-2">Testcase #{i + 1} Passed</span>
                          <span className="text-muted">Time: {r.timeMs}ms</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted text-center py-4">
                      Click 'Run Code' to execute test cases against the judge.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'editorial' && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">Approach Overview</h6>
                  <p className="text-secondary mb-3">{selectedProblem.editorial.approach}</p>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="bg-light p-2.5 rounded border">
                        <small className="text-muted d-block">Time Complexity</small>
                        <strong className="text-primary">{selectedProblem.editorial.timeComplexity}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light p-2.5 rounded border">
                        <small className="text-muted d-block">Space Complexity</small>
                        <strong className="text-success">{selectedProblem.editorial.spaceComplexity}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai-review' && (
                <div>
                  {aiReview ? (
                    <Alert variant="info" className="whitespace-pre-line mb-0 font-monospace">
                      {aiReview}
                    </Alert>
                  ) : (
                    <div className="text-muted text-center py-4">
                      Click 'Request AI Code Review' to get instant feedback on complexity and edge cases.
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
