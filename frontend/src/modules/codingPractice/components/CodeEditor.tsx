import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Spinner, Tab, Tabs, Alert } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import { Problem, Submission } from '../types/problem';

interface CodeEditorProps {
  problem: Problem;
  onRunCode: (code: string, language: string) => Promise<any>;
  onSubmit: (code: string, language: string) => Promise<Submission>;
  submissions: Submission[];
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input using cin\n    // Write output using cout\n    return 0;\n}`,
  python: `# Write your python solution here\nimport sys\n\ndef solve():\n    # Read from sys.stdin and print to stdout\n    pass\n\nif __name__ == '__main__':\n    solve()`,
  javascript: `// Write your javascript solution here\nconst fs = require('fs');\n\nfunction solve() {\n    // Read input and print output\n}\n\nsolve();`
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  problem,
  onRunCode,
  onSubmit,
  submissions,
}) => {
  const [language, setLanguage] = useState<'cpp' | 'python' | 'javascript'>('cpp');
  const [code, setCode] = useState('');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState('testcases');
  const [runResult, setRunResult] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<Submission | null>(null);

  // Load code from localstorage or set default starter code
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${problem.id}_${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(DEFAULT_STARTER_CODE[language] || '');
    }
  }, [problem.id, language]);

  const handleCodeChange = (value?: string) => {
    const currentCode = value || '';
    setCode(currentCode);
    localStorage.setItem(`code_${problem.id}_${language}`, currentCode);
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to default template?')) {
      const defaultCode = DEFAULT_STARTER_CODE[language] || '';
      setCode(defaultCode);
      localStorage.setItem(`code_${problem.id}_${language}`, defaultCode);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActivePanelTab('testcases');
    setRunResult(null);
    try {
      const res = await onRunCode(code, language);
      setRunResult(res);
    } catch (e) {
      setRunResult({ error: e instanceof Error ? e.message : 'Execution failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActivePanelTab('submissions');
    setSubmitResult(null);
    try {
      const res = await onSubmit(code, language);
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
            onChange={(e) => setLanguage(e.target.value as any)}
            className="fw-semibold"
          >
            <option value="cpp">C++ 17</option>
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript</option>
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
          language={language === 'cpp' ? 'cpp' : language}
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
                runResult.error ? (
                  <Alert variant="danger" className="py-2 mb-0 font-monospace">
                    <strong>Compilation/Execution Error:</strong>
                    <pre className="mb-0 mt-1 fs-9 text-wrap">{runResult.error}</pre>
                  </Alert>
                ) : (
                  <div>
                    <Alert variant={runResult.pass ? 'success' : 'danger'} className="py-2 mb-2 fw-bold">
                      {runResult.pass ? '✓ Test Cases Passed!' : '✗ Test Cases Failed!'}
                    </Alert>
                    <div className="bg-light p-2.5 rounded border font-monospace">
                      <div className="text-muted">Output:</div>
                      <pre className="mb-1 text-dark fs-9">{runResult.output}</pre>
                      {runResult.expected && (
                        <>
                          <div className="text-muted border-top pt-1 mt-1">Expected:</div>
                          <pre className="mb-0 text-secondary fs-9">{runResult.expected}</pre>
                        </>
                      )}
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
                    Runtime: {submitResult.runtime} ms • Memory: {submitResult.memory} KB
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
