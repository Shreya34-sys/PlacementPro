import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Tabs, Tab, Form, Accordion, Alert, Modal } from 'react-bootstrap';

interface HRQuestion {
  id: string;
  category: 'Introduction' | 'Behavioral' | 'Situational' | 'Strengths/Weaknesses' | 'Career Goals';
  question: string;
  starTip: string;
  sampleAnswer: string;
  keyPointsToInclude: string[];
}

const mockHRQuestions: HRQuestion[] = [
  {
    id: 'hr-1',
    category: 'Introduction',
    question: 'Tell me about yourself and why you are interested in this position.',
    starTip: 'Present + Past + Future framework: Highlight relevant degree, technical projects, and passion for the company role.',
    sampleAnswer: 'I am a final-year Computer Science student passionate about full-stack engineering. Recently, I built a high-concurrency placement management portal that handled 1,000+ candidate applications. I am excited about this role because your company leads cloud innovation, where I can apply my React and Node skills.',
    keyPointsToInclude: ['Brief academic background', '1-2 key technical projects/internships', 'Why this specific company resonates with you']
  },
  {
    id: 'hr-2',
    category: 'Behavioral',
    question: 'Describe a time when you faced a major technical disagreement with a teammate.',
    starTip: 'Use STAR method: Situation (project context), Task (the conflict), Action (data-backed conversation), Result (successful compromise).',
    sampleAnswer: 'During our capstone project, my teammate wanted SQL while I favored MongoDB for dynamic JSON logs. I benchmarked query speed for both on sample data. Seeing that SQL suited our relational user schema better, we agreed on PostgreSQL, delivering the project 2 days ahead of deadline.',
    keyPointsToInclude: ['Focus on active listening & data', 'Never blame the teammate', 'Emphasize positive project outcome']
  },
  {
    id: 'hr-3',
    category: 'Situational',
    question: 'What would you do if you were assigned a critical bug fix in a technology you have never used before?',
    starTip: 'Focus on adaptability, resourcefulness, escalation when stuck, and rapid learning ability.',
    sampleAnswer: 'First, I would review existing code documentation and error logs. Second, I would spend 30 minutes reproducing the issue locally. If blocked, I would consult a senior engineer with a targeted question, and write tests to confirm the fix before deployment.',
    keyPointsToInclude: ['Methodical debugging process', 'Timeboxed self-learning', 'Knowing when to ask seniors efficiently']
  }
];

export const HrInterviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('question-bank');

  // Search & Filter for Questions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Mock HR Interview state
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQNum, setCurrentQNum] = useState(0);
  const [userSpokenAnswer, setUserSpokenAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);

  // Confidence Score stats
  const [confidenceScore, setConfidenceScore] = useState(88);
  const [positivityScore, setPositivityScore] = useState(92);
  const [eyeContactScore, setEyeContactScore] = useState(85);

  const mockInterviewStream = [
    "Tell me about yourself and your primary technical achievements.",
    "Can you share an instance where you worked under a tight deadline?",
    "Where do you see yourself in 3 years within our organization?"
  ];

  const handleStartMockInterview = () => {
    setIsInterviewActive(true);
    setCurrentQNum(0);
    setUserSpokenAnswer('');
    setInterviewFinished(false);
  };

  const handleRecordAnswer = () => {
    setIsAnswering(true);
    setTimeout(() => {
      setIsAnswering(false);
      setUserSpokenAnswer("I prioritize tasks by urgency and importance using Agile boards. In my last project, when the API specs changed two days before demo, I refactored the data mapping layer cleanly and passed all integration tests.");
    }, 3000);
  };

  const handleNextMockQuestion = () => {
    if (currentQNum < mockInterviewStream.length - 1) {
      setCurrentQNum((prev) => prev + 1);
      setUserSpokenAnswer('');
    } else {
      setIsInterviewActive(false);
      setInterviewFinished(true);
    }
  };

  const filteredQuestions = mockHRQuestions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) || q.sampleAnswer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' ? true : q.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <Container fluid className="px-0">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-person-bounding-box text-primary"></i> HR Interview & Behavioral Preparation
          </h3>
          <p className="text-muted mb-0 fs-7">
            Master HR rounds, behavioral STAR responses, situational dilemmas, and simulated AI recruiter interviews.
          </p>
        </div>

        <Button variant="primary" className="fw-bold px-3 py-2 shadow-sm" onClick={handleStartMockInterview}>
          <i className="bi bi-camera-video-fill me-1.5"></i> Launch Live AI HR Interview
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'question-bank')}
        className="mb-4 nav-tabs-custom"
      >
        <Tab eventKey="question-bank" title="HR Question Bank & STAR Method" />
        <Tab eventKey="situational" title="Behavioral & Situational Scenarios" />
        <Tab eventKey="mock-interview" title="Mock HR Interview Room" />
        <Tab eventKey="ai-feedback" title="AI Feedback & Confidence Analysis" />
      </Tabs>

      {/* TAB 1: QUESTION BANK */}
      {activeTab === 'question-bank' && (
        <div>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-3">
              <Row className="g-3">
                <Col md={8}>
                  <Form.Control
                    type="text"
                    placeholder="Search HR questions by keywords (e.g. teamwork, conflict, goals)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Introduction">Introduction</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Situational">Situational</option>
                    <option value="Strengths/Weaknesses">Strengths & Weaknesses</option>
                    <option value="Career Goals">Career Goals</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Accordion defaultActiveKey="hr-1" className="fs-8">
            {filteredQuestions.map((q) => (
              <Accordion.Item key={q.id} eventKey={q.id} className="mb-3 border rounded shadow-sm overflow-hidden">
                <Accordion.Header>
                  <div className="d-flex align-items-center gap-2 w-100 me-3">
                    <Badge bg="primary-subtle" text="primary" className="px-2.5 py-1">
                      {q.category}
                    </Badge>
                    <span className="fw-bold text-dark fs-7">{q.question}</span>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="p-4 bg-light">
                  <Alert variant="info" className="mb-3 fs-8 p-2.5 border-info-subtle">
                    <strong><i className="bi bi-star-fill text-warning me-1"></i> STAR Strategy Tip:</strong> {q.starTip}
                  </Alert>

                  <h6 className="fw-bold text-dark fs-8 mb-2">Key Talking Points to Cover:</h6>
                  <ul className="mb-3 ps-3">
                    {q.keyPointsToInclude.map((point, idx) => (
                      <li key={idx} className="text-secondary">{point}</li>
                    ))}
                  </ul>

                  <h6 className="fw-bold text-dark fs-8 mb-2">Model Answer Template:</h6>
                  <div className="bg-white p-3 rounded border text-dark fs-8 lh-base">
                    "{q.sampleAnswer}"
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      )}

      {/* TAB 2: BEHAVIORAL & SITUATIONAL SCENARIOS */}
      {activeTab === 'situational' && (
        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-diagram-3 text-primary me-2"></i> Situational Scenario #1
              </Card.Header>
              <Card.Body className="p-4">
                <Badge bg="warning-subtle" text="warning" className="mb-2">Conflict & Prioritization</Badge>
                <h6 className="fw-bold text-dark mb-2">
                  Scenario: Two senior team leads give you conflicting priority tasks with the same end-of-day deadline.
                </h6>
                <p className="text-muted fs-8 mb-4">
                  Which approach demonstrates the highest professional maturity and organizational awareness?
                </p>

                <div className="d-flex flex-column gap-2 mb-4">
                  {[
                    { text: 'A) Work on the task from the more senior manager first.', correct: false },
                    { text: 'B) Bring both leads together to transparently clarify impact, timeline, and trade-offs.', correct: true },
                    { text: 'C) Work late without telling anyone to complete both imperfectly.', correct: false }
                  ].map((option, idx) => (
                    <Button
                      key={idx}
                      variant={option.correct ? 'outline-success' : 'outline-secondary'}
                      className="text-start fs-8 p-2.5 fw-semibold"
                    >
                      {option.text}
                    </Button>
                  ))}
                </div>

                <Alert variant="success" className="fs-8 mb-0 p-2.5">
                  <strong>Recommended Answer (B):</strong> Clear alignment avoids missed expectations and ensures business priority drives execution.
                </Alert>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-chat-heart text-danger me-2"></i> STAR Answer Self-Evaluator
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column">
                <h6 className="fw-bold text-dark mb-2">Practice Prompt: "Tell me about a time you failed."</h6>
                <p className="text-muted fs-8 mb-3">
                  Type your draft response below. The AI scanner evaluates if you included ownership, lessons learned, and systemic improvement.
                </p>

                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="In my 3rd semester project, I miscalculated database indexing requirements..."
                  className="mb-3 fs-8"
                />

                <Button variant="primary" size="sm" className="fw-bold px-3 py-2 mt-auto">
                  <i className="bi bi-cpu me-1"></i> Analyze Answer Structure
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* TAB 3: MOCK HR INTERVIEW ROOM */}
      {activeTab === 'mock-interview' && (
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-dark text-white py-3 d-flex justify-content-between align-items-center">
            <span className="fw-bold"><i className="bi bi-camera-video me-2 text-danger"></i>AI HR Recruiter Live Room</span>
            <Badge bg="danger" className="px-3 py-1">LIVE SIMULATION</Badge>
          </Card.Header>
          <Card.Body className="p-4">
            {!isInterviewActive && !interviewFinished ? (
              <div className="text-center py-5">
                <i className="bi bi-person-badge display-1 text-primary d-block mb-3"></i>
                <h4 className="fw-bold text-dark mb-2">Interactive AI HR Mock Interview</h4>
                <p className="text-muted fs-7 max-w-xl mx-auto mb-4">
                  Test your real-time verbal answers, facial expression confidence, tone positivity, and STAR structured delivery under realistic camera conditions.
                </p>
                <Button variant="primary" size="lg" className="fw-bold px-5 py-2.5" onClick={handleStartMockInterview}>
                  Start HR Interview
                </Button>
              </div>
            ) : isInterviewActive ? (
              <Row className="g-4">
                <Col lg={7}>
                  <div className="bg-dark text-white rounded p-4 text-center min-vh-40 d-flex flex-column justify-content-center align-items-center relative">
                    <Badge bg="danger" className="position-absolute top-0 start-0 m-3 px-2 py-1">
                      <i className="bi bi-circle-fill me-1 fs-9"></i> REC
                    </Badge>
                    <i className="bi bi-person-circle display-2 text-secondary mb-3"></i>
                    <h5 className="fw-bold text-white mb-1">Senior HR Recruiter AI</h5>
                    <small className="text-white-50">Campus Hiring Panel</small>
                  </div>
                </Col>

                <Col lg={5} className="d-flex flex-column justify-content-between">
                  <div>
                    <Badge bg="primary" className="mb-2">Question {currentQNum + 1} of 3</Badge>
                    <h5 className="fw-bold text-dark mb-3">"{mockInterviewStream[currentQNum]}"</h5>

                    <Alert variant="secondary" className="fs-8">
                      <i className="bi bi-info-circle me-1"></i> Speak clearly into your mic. Structure answer using Situation -&gt; Action -&gt; Outcome.
                    </Alert>

                    {userSpokenAnswer && (
                      <div className="bg-light p-3 rounded border mb-3">
                        <small className="text-muted d-block fw-bold mb-1">Your Recorded Response Transcript:</small>
                        <p className="fs-8 text-dark mb-0">"{userSpokenAnswer}"</p>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant={isAnswering ? 'danger' : 'success'}
                      className="w-100 fw-bold py-2"
                      onClick={handleRecordAnswer}
                    >
                      <i className={`bi ${isAnswering ? 'bi-stop-fill' : 'bi-mic-fill'} me-1`}></i>
                      {isAnswering ? 'Recording...' : 'Record Voice Answer'}
                    </Button>

                    <Button
                      variant="primary"
                      className="w-100 fw-bold py-2"
                      onClick={handleNextMockQuestion}
                      disabled={!userSpokenAnswer}
                    >
                      Next Question <i className="bi bi-arrow-right me-1"></i>
                    </Button>
                  </div>
                </Col>
              </Row>
            ) : (
              <div className="text-center py-4">
                <i className="bi bi-check-circle-fill display-2 text-success mb-3"></i>
                <h3 className="fw-bold text-dark mb-2">Mock Interview Complete!</h3>
                <h2 className="fw-extrabold text-primary mb-3">Confidence Score: 88 / 100</h2>
                <Button variant="outline-primary" className="fw-bold px-4" onClick={() => setActiveTab('ai-feedback')}>
                  View Detailed AI Feedback
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* TAB 4: AI FEEDBACK & CONFIDENCE ANALYSIS */}
      {activeTab === 'ai-feedback' && (
        <Row className="g-4">
          <Col lg={4}>
            <Card className="shadow-sm border-0 text-center p-4 bg-primary bg-gradient text-white">
              <Card.Body>
                <span className="text-uppercase fw-bold opacity-75 fs-8">AI Overall Evaluation</span>
                <div className="display-3 fw-extrabold my-2">88%</div>
                <Badge bg="light" text="primary" className="fw-bold px-3 py-1 fs-7 mb-3">Strong Candidate</Badge>
                <p className="fs-8 opacity-90 mb-0">
                  You demonstrated excellent poise, polite demeanor, and strong project impact articulation.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-bar-chart-fill text-primary me-2"></i> Delivery & Emotional Parameters
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                    <span>Voice Confidence & Tone Clarity</span>
                    <span className="text-success">{confidenceScore}%</span>
                  </div>
                  <ProgressBar now={confidenceScore} variant="success" style={{ height: '8px' }} />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                    <span>Positivity & Enthusiasm Index</span>
                    <span className="text-info">{positivityScore}%</span>
                  </div>
                  <ProgressBar now={positivityScore} variant="info" style={{ height: '8px' }} />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                    <span>Eye Contact & Camera Engagement</span>
                    <span className="text-primary">{eyeContactScore}%</span>
                  </div>
                  <ProgressBar now={eyeContactScore} variant="primary" style={{ height: '8px' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};
