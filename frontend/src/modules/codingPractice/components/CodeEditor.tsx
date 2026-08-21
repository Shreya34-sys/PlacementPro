import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Spinner, Tab, Tabs, Alert } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import { JudgeLanguage, Problem, RunCodeResult, Submission } from '../types/problem';
import { getJudgeLanguages } from '../services/submissionService';

interface CodeEditorProps {
  problem: Problem;
  onRunCode: (code: string, language: string, languageId?: number) => Promise<any>;
  onSubmit: (code: string, language: string, languageId?: number) => Promise<Submission>;
  submissions: Submission[];
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  c: `#include <stdio.h>\n\nint main(void) {\n    // Read input using scanf\n    // Write output using printf\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input using cin\n    // Write output using cout\n    return 0;\n}`,
  java: `import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}`,
  python: `# Write your python solution here\nimport sys\n\ndef solve():\n    # Read from sys.stdin and print to stdout\n    pass\n\nif __name__ == '__main__':\n    solve()`,
  javascript: `// Write your javascript solution here\nconst fs = require('fs');\n\nfunction solve() {\n    // Read input and print output\n}\n\nsolve();`,
  typescript: `// Write your TypeScript solution here\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\nconsole.log(input);`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // Write your solution here\n    }\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println()\n}`,
  rust: `use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    // Write your solution here\n}`,
  kotlin: `fun main() {\n    // Write your solution here\n}`,
};

const FALLBACK_LANGUAGES: JudgeLanguage[] = [
  { id: 50, name: 'C', key: 'c', monacoLanguage: 'c' },
  { id: 54, name: 'C++ 17', key: 'cpp', monacoLanguage: 'cpp' },
  { id: 62, name: 'Java', key: 'java', monacoLanguage: 'java' },
  { id: 71, name: 'Python 3', key: 'python', monacoLanguage: 'python' },
  { id: 63, name: 'JavaScript', key: 'javascript', monacoLanguage: 'javascript' },
  { id: 74, name: 'TypeScript', key: 'typescript', monacoLanguage: 'typescript' },
  { id: 51, name: 'C#', key: 'csharp', monacoLanguage: 'csharp' },
  { id: 60, name: 'Go', key: 'go', monacoLanguage: 'go' },
  { id: 73, name: 'Rust', key: 'rust', monacoLanguage: 'rust' },
  { id: 78, name: 'Kotlin', key: 'kotlin', monacoLanguage: 'kotlin' },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  problem,
  onRunCode,
  onSubmit,
  submissions,
}) => {
  const [language, setLanguage] = useState('cpp');
  const [languages, setLanguages] = useState<JudgeLanguage[]>(FALLBACK_LANGUAGES);
  const [code, setCode] = useState('');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState('testcases');
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const [submitResult, setSubmitResult] = useState<Submission | null>(null);

  useEffect(() => {
    getJudgeLanguages()
      .then((items) => {
        if (items.length > 0) setLanguages(items);
      })
      .catch(() => setLanguages(FALLBACK_LANGUAGES));
  }, []);

  // Load code from localstorage or set default starter code
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${problem.id}_${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(problem.starterCode?.[language] || DEFAULT_STARTER_CODE[language] || '');
    }
  }, [problem.id, language]);

  const handleCodeChange = (value?: string) => {
    const currentCode = value || '';
    setCode(currentCode);
    localStorage.setItem(`code_${problem.id}_${language}`, currentCode);
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to default template?')) {
      const defaultCode = problem.starterCode?.[language] || DEFAULT_STARTER_CODE[language] || '';
      setCode(defaultCode);
      localStorage.setItem(`code_${problem.id}_${language}`, defaultCode);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActivePanelTab('testcases');
    setRunResult(null);
    try {
      const res = await onRunCode(code, language, selectedLanguage.id);
      setRunResult(res);
    } catch (e) {
      setRunResult({
        status: 'Internal Error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        results: [],
        errorMessage: e instanceof Error ? e.message : 'Execution failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const selectedLanguage = languages.find((item) => item.key === language) || FALLBACK_LANGUAGES[1];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActivePanelTab('submissions');
    setSubmitResult(null);
    try {
      const res = await onSubmit(code, language, selectedLanguage.id);
      setSubmitResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '12px', height: '100%' }}>
      {/* Editor Header controls */}
      <Card.Header className="bg-white py-2 px-3 d-flex align-items-center justify-content-between border-bottom">
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            style={{ width: '130px' }}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="fw-semibold"
          >
            {languages.map((item) => (
              <option key={`${item.id}-${item.key}`} value={item.key}>
                {item.name}
              </option>
            ))}
          </Form.Select>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            title="Toggle theme"
          >
            <i className={`bi ${theme === 'vs-dark' ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
          </Button>

          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleResetCode}
            title="Reset code template"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </Button>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            className="fw-bold px-3 py-1.5 fs-8"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" /> Running
              </>
            ) : (
              <>
                <i className="bi bi-play-fill me-1"></i> Run
              </>
            )}
          </Button>

          <Button
            variant="success"
            size="sm"
            className="fw-bold px-3 py-1.5 fs-8"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" /> Submitting
              </>
            ) : (
              <>
                <i className="bi bi-cloud-arrow-up-fill me-1"></i> Submit
              </>
            )}
          </Button>
        </div>
      </Card.Header>

      {/* Editor Body */}
      <div className="flex-grow-1 bg-dark p-0" style={{ minHeight: '380px' }}>
        <MonacoEditor
          height="380px"
          language={selectedLanguage.monacoLanguage}
          theme={theme}
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Test cases and submissions panel */}
      <Card.Footer className="bg-white p-0 border-top">
        <Tabs
          activeKey={activePanelTab}
          onSelect={(k) => setActivePanelTab(k || 'testcases')}
          className="px-3 border-bottom nav-tabs-sm"
        >
          <Tab eventKey="testcases" title="Run Outputs" />
          <Tab eventKey="submissions" title="Submissions" />
        </Tabs>

        <div className="p-3 fs-8" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
          {activePanelTab === 'testcases' && (
            <div>
              {isRunning ? (
                <div className="text-muted text-center py-3">
                  <Spinner size="sm" animation="border" className="me-2" /> Running code against sample test cases...
                </div>
              ) : runResult ? (
                runResult.errorMessage ? (
                  <Alert variant="danger" className="py-2 mb-0 font-monospace">
                    <strong>Compilation/Execution Error:</strong>
                    <pre className="mb-0 mt-1 fs-9 text-wrap">{runResult.errorMessage}</pre>
                  </Alert>
                ) : (
                  <div>
                    <Alert variant={runResult.status === 'Accepted' ? 'success' : 'danger'} className="py-2 mb-2 fw-bold">
                      {runResult.status === 'Accepted' ? '✓ Sample Test Cases Passed!' : `✗ ${runResult.status}`}
                    </Alert>
                    <div className="d-grid gap-2">
                      {runResult.results.map((result, index) => (
                        <div key={`${problem.id}-run-${index}`} className="bg-light p-2.5 rounded border font-monospace">
                          <div className={result.passed ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                            Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                          </div>
                          <div className="text-muted">Input:</div>
                          <pre className="mb-1 text-dark fs-9 text-wrap">{result.input}</pre>
                          <div className="text-muted">Output:</div>
                          <pre className="mb-1 text-dark fs-9 text-wrap">{result.output}</pre>
                          <div className="text-muted border-top pt-1 mt-1">Expected:</div>
                          <pre className="mb-0 text-secondary fs-9 text-wrap">{result.expected}</pre>
                        </div>
                      ))}
                      <small className="text-muted">
                        Passed {runResult.passedTests}/{runResult.totalTests} tests • Runtime: {runResult.runtime} ms • Memory: {runResult.memory} KB
                      </small>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-muted text-center py-3">
                  Click 'Run' to execute test cases locally.
                </div>
              )}
            </div>
          )}

          {activePanelTab === 'submissions' && (
            <div>
              {isSubmitting ? (
                <div className="text-muted text-center py-3">
                  <Spinner size="sm" animation="border" className="me-2" /> Submitting solution to judge...
                </div>
              ) : submitResult ? (
                <div className="mb-3">
                  <Alert variant={submitResult.status === 'Accepted' ? 'success' : 'danger'} className="py-2.5 mb-2 fw-bold">
                    {submitResult.status === 'Accepted' ? (
                      <span>✓ Solution Accepted! (+100 XP)</span>
                    ) : (
                      <span>✗ {submitResult.status}</span>
                    )}
                  </Alert>
                  {submitResult.errorMessage && (
                    <pre className="bg-light p-2 rounded text-danger border fs-9 font-monospace text-wrap">{submitResult.errorMessage}</pre>
                  )}
                  <small className="text-muted">
                    Passed {submitResult.passedTests || 0}/{submitResult.totalTests || 0} tests • Runtime: {submitResult.runtime} ms • Memory: {submitResult.memory} KB
                  </small>
                </div>
              ) : null}

              {submissions.length === 0 ? (
                <div className="text-muted text-center py-2">
                  No submissions yet for this problem.
                </div>
              ) : (
                <div className="d-grid gap-2">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="d-flex align-items-center justify-content-between p-2 rounded border bg-light">
                      <div>
                        <Badge bg={sub.status === 'Accepted' ? 'success' : 'danger'} className="me-2">
                          {sub.status}
                        </Badge>
                        <small className="text-muted font-monospace">{sub.language}</small>
                      </div>
                      <small className="text-muted">
                        {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
};
