import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Tabs, Tab, Spinner, Modal } from 'react-bootstrap';
import Editor from '@monaco-editor/react';
import { mockCodingProblems, CodingProblem } from '../data/mockCodingProblems';

export const CodingRoundPage: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem>(mockCodingProblems[0]);
  const [language, setLanguage] = useState<string>('python');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [code, setCode] = useState<string>(selectedProblem.starterTemplates['python'] || '');
  
  // Execution Console State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<{
    status: 'idle' | 'success' | 'error' | 'accepted' | 'wrong';
    logs: string[];
    testResults?: { input: string; expected: string; actual: string; passed: boolean }[];
    execTimeMs?: number;
    memoryMb?: number;
  }>({
    status: 'idle',
    logs: ['Console initialized. Click "Run Code" or "Submit Code" to execute.']
  });

  const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState<boolean>(false);

  // Handle problem change
  const handleProblemChange = (problemId: string) => {
    const found = mockCodingProblems.find((p) => p.id === problemId);
    if (found) {
      setSelectedProblem(found);
      setCode(found.starterTemplates[language] || found.starterTemplates['python']);
      setConsoleOutput({
        status: 'idle',
        logs: [`Switched to problem: ${found.title}`]
      });
    }
  };

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(selectedProblem.starterTemplates[newLang] || '// Write your solution here');
  };

  // Simulate code execution
  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput({
      status: 'idle',
      logs: ['Compiling source code...', 'Allocating memory sandbox...']
    });

    setTimeout(() => {
      setIsRunning(false);

      // Simulate running against test cases
      // This page uses mock problems — no real Judge0 execution available here.
      // Display an honest message directing users to the real coding practice module.
      setConsoleOutput({
        status: 'idle',
        logs: [
          '⚠  This practice page uses sample problems for UI demo purposes.',
          '   Real code execution is available in the Coding Practice module.',
          '   Navigate to Practice → Coding Practice to run and submit code.',
          '',
          '   Code written here will not be evaluated by a compiler.',
        ],
      });
    }, 400);
  };

  const handleSubmitCode = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setConsoleOutput({
        status: 'idle',
        logs: [
          '⚠  Submission is not available in this demo practice page.',
          '   Navigate to Practice → Coding Practice to submit real solutions.',
          '   Your code will be compiled and evaluated against hidden test cases there.',
        ],
      });

      setShowSubmitSuccessModal(true);
    }, 1800);
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return <Badge bg="success" className="px-2 py-1 fs-8">Easy</Badge>;
      case 'Medium':
        return <Badge bg="warning" text="dark" className="px-2 py-1 fs-8">Medium</Badge>;
      case 'Hard':
        return <Badge bg="danger" className="px-2 py-1 fs-8">Hard</Badge>;
      default:
        return <Badge bg="secondary">Easy</Badge>;
    }
  };

  return (
    <Container fluid className="px-0">
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold text-dark mb-0">{selectedProblem.title}</h4>
            {getDifficultyBadge(selectedProblem.difficulty)}
            <Badge bg="primary">{selectedProblem.points} Points</Badge>
          </div>
          <small className="text-muted fs-8">
            Category: {selectedProblem.category} | Time Limit: {selectedProblem.timeLimit} | Memory: {selectedProblem.memoryLimit}
          </small>
        </div>

        {/* Problem Picker Dropdown */}
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            style={{ width: '260px' }}
            value={selectedProblem.id}
            onChange={(e) => handleProblemChange(e.target.value)}
          >
            {mockCodingProblems.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.difficulty}] {p.title}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <Row className="g-3">
        {/* Left Column: Problem Description & Examples */}
        <Col lg={5} xl={5}>
          <Card className="shadow-sm border-0 h-100 d-flex flex-column" style={{ minHeight: '680px' }}>
            <Card.Header className="bg-white py-2.5">
              <Tabs defaultActiveKey="description" id="problem-left-tabs" className="nav-tabs-sm">
                <Tab eventKey="description" title="Description" />
                <Tab eventKey="examples" title="Examples & Constraints" />
                <Tab eventKey="testcases" title="Sample Test Cases" />
              </Tabs>
            </Card.Header>

            <Card.Body className="p-3.5 overflow-auto flex-grow-1 fs-7 leading-relaxed" style={{ maxHeight: '620px' }}>
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">Problem Statement</h6>
                <div className="text-secondary whitespace-pre-wrap font-sans">
                  {selectedProblem.description}
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">Constraints</h6>
                <ul className="text-muted ps-3 mb-0">
                  {selectedProblem.constraints.map((c, idx) => (
                    <li key={idx} className="mb-1"><code>{c}</code></li>
                  ))}
                </ul>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold text-dark mb-2">Examples</h6>
                {selectedProblem.examples.map((ex, idx) => (
                  <div key={idx} className="bg-light p-3 rounded border mb-2 font-monospace">
                    <div className="mb-1"><strong>Input:</strong> <code>{ex.input}</code></div>
                    <div className="mb-1"><strong>Output:</strong> <code>{ex.output}</code></div>
                    {ex.explanation && (
                      <div className="text-muted fs-8"><strong>Explanation:</strong> {ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Code Editor & Execution Console */}
        <Col lg={7} xl={7}>
          <Card className="shadow-sm border-0 mb-3 overflow-hidden">
            {/* Editor Control Toolbar */}
            <Card.Header className="bg-dark text-white py-2.5 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-8 text-secondary text-uppercase fw-semibold">Language:</span>
                  <Form.Select
                    size="sm"
                    className="bg-secondary text-white border-secondary py-0 px-2 fs-8"
                    style={{ width: '130px' }}
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="python">Python 3</option>
                    <option value="cpp">C++ (GCC 11)</option>
                    <option value="java">Java 17</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="go">Go 1.20</option>
                  </Form.Select>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="fs-8 text-secondary text-uppercase fw-semibold">Theme:</span>
                  <Form.Select
                    size="sm"
                    className="bg-secondary text-white border-secondary py-0 px-2 fs-8"
                    style={{ width: '110px' }}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                  >
                    <option value="vs-dark">Dark</option>
                    <option value="light">Light</option>
                  </Form.Select>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-light"
                  size="sm"
                  className="py-1 px-2.5 fs-8"
                  onClick={() => setCode(selectedProblem.starterTemplates[language] || '')}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="py-1 px-3 fs-8 fw-semibold"
                  disabled={isRunning || isSubmitting}
                  onClick={handleRunCode}
                >
                  {isRunning ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1.5" />
                      Running...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-fill me-1 text-success"></i> Run Code
                    </>
                  )}
                </Button>

                <Button
                  variant="success"
                  size="sm"
                  className="py-1 px-3 fs-8 fw-bold"
                  disabled={isRunning || isSubmitting}
                  onClick={handleSubmitCode}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1.5" />
                      Judging...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload-fill me-1"></i> Submit Solution
                    </>
                  )}
                </Button>
              </div>
            </Card.Header>

            {/* Monaco Editor Container */}
            <div style={{ height: '380px' }} className="border-bottom">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                theme={theme}
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  lineNumbers: 'on',
                  padding: { top: 12, bottom: 12 }
                }}
              />
            </div>

            {/* Execution Console Output Panel */}
            <Card.Footer className="bg-dark text-white p-3 font-monospace fs-8" style={{ minHeight: '180px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary pb-1.5">
                <span className="text-secondary fw-bold text-uppercase d-flex align-items-center gap-1.5">
                  <i className="bi bi-terminal-fill text-info"></i> Output Console
                </span>
                {consoleOutput.status === 'accepted' && (
                  <Badge bg="success" className="px-2.5 py-1">
                    <i className="bi bi-check-circle-fill me-1"></i> ACCEPTED
                  </Badge>
                )}
                {consoleOutput.status === 'success' && (
                  <Badge bg="info" className="px-2.5 py-1">
                    <i className="bi bi-check2 me-1"></i> SAMPLE TEST CASES PASSED
                  </Badge>
                )}
              </div>

              <div className="overflow-auto" style={{ maxHeight: '130px' }}>
                {consoleOutput.logs.map((log, idx) => (
                  <div key={idx} className="mb-1 text-light opacity-90">
                    <span className="text-secondary me-2">&gt;</span>
                    {log}
                  </div>
                ))}

                {consoleOutput.testResults && (
                  <div className="mt-2 pt-2 border-top border-secondary">
                    <span className="text-info fw-bold d-block mb-1">Test Case Results:</span>
                    {consoleOutput.testResults.map((tr, idx) => (
                      <div key={idx} className="p-2 bg-secondary bg-opacity-20 rounded mb-1 border border-secondary">
                        <div className="d-flex justify-content-between text-success fw-bold">
                          <span>Case {idx + 1}: {tr.input}</span>
                          <span>PASSED <i className="bi bi-check-lg"></i></span>
                        </div>
                        <div className="text-secondary fs-8">Expected: {tr.expected} | Actual: {tr.actual}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Submission Success Modal */}
      <Modal show={showSubmitSuccessModal} onHide={() => setShowSubmitSuccessModal(false)} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="fs-6 fw-bold">
            <i className="bi bi-trophy-fill me-2"></i> Solution Accepted!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          <div className="mb-3">
            <i className="bi bi-check-circle-fill display-2 text-success"></i>
          </div>
          <h4 className="fw-bold text-dark mb-1">All Test Cases Passed</h4>
          <p className="text-muted fs-7 mb-4">
            Congratulations! You earned <strong className="text-success">+{selectedProblem.points} Points</strong> for solving this problem.
          </p>

          <div className="row g-2 bg-light p-3 rounded mb-4 text-center">
            <div className="col-6 border-end">
              <small className="text-muted d-block fs-8 text-uppercase fw-semibold">Runtime</small>
              <strong className="fs-5 text-dark">{consoleOutput.execTimeMs} ms</strong>
            </div>
            <div className="col-6">
              <small className="text-muted d-block fs-8 text-uppercase fw-semibold">Memory</small>
              <strong className="fs-5 text-dark">{consoleOutput.memoryMb} MB</strong>
            </div>
          </div>

          <Button variant="primary" className="w-100 fw-bold py-2" onClick={() => setShowSubmitSuccessModal(false)}>
            Continue to Next Problem
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};
