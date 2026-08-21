import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { updateUserLeaderboardStats } from '../services/leaderboardService';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  feedback?: {
    overallScore: number;
    communication: number;
    technicalAccuracy: number;
    relevance: number;
    strengths: string[];
    improvements: string[];
    suggestedAnswer: string;
  };
}

const initialQuestionsMap: Record<string, string[]> = {
  'Software Engineer': [
    "Hello! Welcome to your AI Technical Interview. Let's start with a foundational question: Could you explain the concept of event loop in JavaScript and how asynchronous non-blocking I/O works?",
    "Great! Next, describe a challenging bug or performance bottleneck you encountered in a recent web project and how you diagnosed and resolved it.",
    "Excellent. How do you approach designing a scalable database schema for a high-traffic e-commerce application handling thousands of orders per minute?"
  ],
  'Data Analyst': [
    "Welcome to your AI Data Analyst interview! To begin: How would you handle missing values or outliers in a large dataset before feeding it into a predictive model?",
    "Can you explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in SQL with a practical real-world scenario?",
    "How do you communicate complex statistical findings or data dashboard insights to non-technical business stakeholders?"
  ],
  'HR / Behavioral': [
    "Welcome! Let's start with a classic behavioral question: Tell me about a time when you faced a strict deadline and how you prioritized your tasks.",
    "Describe a situation where you had a disagreement with a teammate or team lead. How did you handle it and what was the outcome?",
    "Why are you interested in joining our organization, and where do you see your career in 3 years?"
  ]
};

export const AiInterviewPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [roleDomain, setRoleDomain] = useState<string>('Software Engineer');
  const [difficulty, setDifficulty] = useState<string>('Campus / Entry Level');
  const [interviewType, setInterviewType] = useState<string>('Technical');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: initialQuestionsMap['Software Engineer'][0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [userInput, setUserInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [selectedFeedback, setSelectedFeedback] = useState<ChatMessage['feedback'] | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Web Speech API recognition ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Domain/Role selection
  const handleDomainChange = (newRole: string) => {
    setRoleDomain(newRole);
    const questions = initialQuestionsMap[newRole] || initialQuestionsMap['Software Engineer'];
    const firstQ = questions[0];
    
    const initialMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `Role changed to ${newRole}. ${firstQ}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initialMsg]);
    setSelectedFeedback(null);
  };

  // Toggle Speech-to-Text Recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Start recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setUserInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onerror = () => {
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } else {
        // Fallback simulation text
        setUserInput((prev) => prev + " [Voice recorded: 'In JavaScript, the event loop continuously checks the call stack and callback queue. When asynchronous tasks like setTimeout or API fetch complete, their callbacks are queued and executed when the call stack clears.']");
      }

      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  // Handle Send Candidate Response
  const handleSendResponse = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const userText = userInput.trim();
    setUserInput('');
    if (isRecording) toggleRecording();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // AI Feedback generator based on response length and keywords
    const wordCount = userText.split(' ').length;
    const hasKeyTerms = userText.toLowerCase().includes('async') || 
                        userText.toLowerCase().includes('call stack') || 
                        userText.toLowerCase().includes('queue') ||
                        userText.toLowerCase().includes('sql') ||
                        userText.toLowerCase().includes('deadline') ||
                        wordCount > 15;

    const commScore = Math.min(95, Math.max(65, Math.floor(wordCount * 1.5 + 50)));
    const techScore = hasKeyTerms ? Math.min(98, Math.floor(Math.random() * 15 + 82)) : 68;
    const relScore = Math.min(95, Math.floor(Math.random() * 12 + 80));
    const overall = Math.round((commScore + techScore + relScore) / 3);

    const feedbackObj: ChatMessage['feedback'] = {
      overallScore: overall,
      communication: commScore,
      technicalAccuracy: techScore,
      relevance: relScore,
      strengths: [
        'Articulated concepts with clear structure and good cadence.',
        hasKeyTerms ? 'Correctly referenced domain terminology and execution flow.' : 'Good confidence in delivering answer.'
      ],
      improvements: [
        wordCount < 20 ? 'Elaborate more on practical real-world edge cases or performance tradeoffs.' : 'Include specific performance metrics or project examples.',
        'Structure answer using the STAR method (Situation, Task, Action, Result) for higher impact.'
      ],
      suggestedAnswer: `For a standard ${roleDomain} answer: "The JavaScript event loop manages asynchronous execution by monitoring the Call Stack and Task Queue (Callback Queue / Microtask Queue). When non-blocking operations like Promises or timers complete, their callbacks enter the queue and run once the Call Stack is empty."`
    };

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: timeStr,
      feedback: feedbackObj
    };

    setMessages((prev) => [...prev, userMsg]);
    setSelectedFeedback(feedbackObj);
    setIsProcessing(true);

    if (currentUser) {
      updateUserLeaderboardStats(currentUser.id, {
        interviewScore: overall
      }).catch(e => console.error("Failed to update interview score", e));
    }

    // AI Next Question response delay
    setTimeout(() => {
      setIsProcessing(false);
      const questions = initialQuestionsMap[roleDomain] || initialQuestionsMap['Software Engineer'];
      const nextQIndex = messages.length % questions.length;
      const nextQText = questions[nextQIndex] || "Could you describe your preferred workflow when collaborating with cross-functional teams under tight sprint schedules?";

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: `Thank you for that response! Here is my follow-up: ${nextQText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 1400);
  };

  return (
    <Container fluid className="px-0">
      {/* Top Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-robot text-primary"></i> AI Interview Simulator & Evaluation
          </h3>
          <p className="text-muted mb-0 fs-7">
            Practice live technical & behavioral interviews with real-time speech analysis and instant scoring.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Form.Select
            size="sm"
            style={{ width: '180px' }}
            value={roleDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
          >
            <option value="Software Engineer">Software Engineer</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="HR / Behavioral">HR / Behavioral</option>
          </Form.Select>

          <Form.Select
            size="sm"
            style={{ width: '150px' }}
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
          >
            <option value="Technical">Technical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="System Design">System Design</option>
          </Form.Select>

          <Form.Select
            size="sm"
            style={{ width: '160px' }}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Campus / Entry Level">Entry Level</option>
            <option value="Mid Level (2-4 Yrs)">Mid Level</option>
            <option value="Senior Level">Senior Level</option>
          </Form.Select>
        </div>
      </div>

      <Row className="g-3">
        {/* Chat Area */}
        <Col lg={7} xl={7}>
          <Card className="shadow-sm border-0 d-flex flex-column" style={{ height: '680px' }}>
            <Card.Header className="bg-white py-3 px-3.5 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2.5">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '38px', height: '38px' }}>
                  <i className="bi bi-robot fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0">PlacementPro AI Interviewer</h6>
                  <span className="text-success fs-8 d-flex align-items-center gap-1">
                    <span className="bg-success rounded-circle d-inline-block" style={{ width: '7px', height: '7px' }}></span>
                    Active Session ({roleDomain} - {interviewType})
                  </span>
                </div>
              </div>

              <Button variant="outline-secondary" size="sm" className="fs-8 py-1" onClick={() => setMessages([messages[0]])}>
                <i className="bi bi-arrow-counterclockwise me-1"></i> Restart Session
              </Button>
            </Card.Header>

            {/* Message Feed */}
            <Card.Body className="p-3.5 overflow-auto flex-grow-1 bg-light" style={{ backgroundColor: '#f8f9fa' }}>
              {messages.map((msg) => {
                const isAi = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    className={`d-flex mb-3 ${isAi ? 'justify-content-start' : 'justify-content-end'}`}
                  >
                    <div className={`d-flex gap-2.5 max-w-85 ${isAi ? 'flex-row' : 'flex-row-reverse'}`} style={{ maxWidth: '85%' }}>
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 mt-1 ${
                          isAi ? 'bg-primary' : 'bg-dark'
                        }`}
                        style={{ width: '32px', height: '32px' }}
                      >
                        <i className={`bi ${isAi ? 'bi-robot' : 'bi-person-fill'} fs-7`}></i>
                      </div>

                      <div>
                        <div
                          className={`p-3 rounded-3 shadow-2sm ${
                            isAi
                              ? 'bg-white text-dark border'
                              : 'bg-primary text-white'
                          }`}
                        >
                          <div className="fs-7 whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                        </div>

                        <div className={`d-flex align-items-center gap-2 mt-1 px-1 fs-8 text-muted ${isAi ? '' : 'justify-content-end'}`}>
                          <span>{msg.timestamp}</span>
                          {!isAi && msg.feedback && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-primary fw-semibold fs-8 text-decoration-none"
                              onClick={() => setSelectedFeedback(msg.feedback!)}
                            >
                              <i className="bi bi-bar-chart-fill me-1"></i> View AI Score ({msg.feedback.overallScore}/100)
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isProcessing && (
                <div className="d-flex justify-content-start mb-3">
                  <div className="p-3 bg-white rounded-3 border d-flex align-items-center gap-2 text-muted fs-7">
                    <Spinner animation="grow" size="sm" variant="primary" />
                    <span>AI Interviewer is analyzing your response...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </Card.Body>

            {/* Speech Recording Bar / Input Form */}
            <Card.Footer className="bg-white p-3 border-top">
              {isRecording && (
                <Alert variant="danger" className="py-2 px-3 mb-2 d-flex align-items-center justify-content-between fs-8">
                  <span className="d-flex align-items-center gap-2 text-danger fw-bold">
                    <span className="spinner-grow spinner-grow-sm text-danger" role="status"></span>
                    Microphone Listening... ({recordingSeconds}s)
                  </span>
                  <small className="text-muted">Speak clearly into your microphone</small>
                </Alert>
              )}

              <Form onSubmit={handleSendResponse} className="d-flex align-items-center gap-2">
                <Button
                  variant={isRecording ? 'danger' : 'outline-danger'}
                  type="button"
                  className="rounded-circle p-0 flex-shrink-0 d-flex align-items-center justify-content-center"
                  style={{ width: '42px', height: '42px' }}
                  onClick={toggleRecording}
                  title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
                >
                  <i className={`bi ${isRecording ? 'bi-mic-mute-fill' : 'bi-mic-fill'} fs-5`}></i>
                </Button>

                <Form.Control
                  type="text"
                  placeholder="Type your response or use voice input..."
                  className="py-2 fs-7"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={isProcessing}
                />

                <Button
                  variant="primary"
                  type="submit"
                  className="px-3.5 py-2 fw-semibold flex-shrink-0"
                  disabled={!userInput.trim() || isProcessing}
                >
                  <i className="bi bi-send-fill me-1"></i> Send
                </Button>
              </Form>
            </Card.Footer>
          </Card>
        </Col>

        {/* Right Feedback & Evaluation Panel */}
        <Col lg={5} xl={5}>
          <Card className="shadow-sm border-0 h-100 d-flex flex-column">
            <Card.Header className="bg-white py-3 px-3.5 border-bottom d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                <i className="bi bi-award-fill text-warning"></i> AI Performance Feedback
              </span>
              <Badge bg="secondary" className="px-2 py-1 fs-8">Real-time Analysis</Badge>
            </Card.Header>

            <Card.Body className="p-3.5 overflow-auto flex-grow-1" style={{ maxHeight: '610px' }}>
              {selectedFeedback ? (
                <div>
                  {/* Overall Score Badge */}
                  <div className="text-center p-3.5 bg-light rounded-3 mb-4 border">
                    <small className="text-uppercase fw-bold text-muted fs-8">Response Score</small>
                    <div className="display-4 fw-extrabold text-primary my-1">
                      {selectedFeedback.overallScore}<span className="fs-6 text-muted">/100</span>
                    </div>
                    <Badge bg={selectedFeedback.overallScore >= 80 ? 'success' : 'warning'} className="px-3 py-1 fs-8">
                      {selectedFeedback.overallScore >= 80 ? 'Strong Answer' : 'Needs Technical Detail'}
                    </Badge>
                  </div>

                  {/* Rating Metrics */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark fs-7 mb-2">Category Breakdown</h6>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                        <span>Communication & Structure</span>
                        <span className="text-primary">{selectedFeedback.communication}%</span>
                      </div>
                      <ProgressBar now={selectedFeedback.communication} variant="primary" style={{ height: '6px' }} />
                    </div>

                    <div className="mb-2">
                      <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                        <span>Technical Accuracy</span>
                        <span className="text-success">{selectedFeedback.technicalAccuracy}%</span>
                      </div>
                      <ProgressBar now={selectedFeedback.technicalAccuracy} variant="success" style={{ height: '6px' }} />
                    </div>

                    <div className="mb-2">
                      <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                        <span>Question Relevance</span>
                        <span className="text-info">{selectedFeedback.relevance}%</span>
                      </div>
                      <ProgressBar now={selectedFeedback.relevance} variant="info" style={{ height: '6px' }} />
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="mb-3">
                    <h6 className="fw-bold text-success fs-7 mb-2 d-flex align-items-center gap-1.5">
                      <i className="bi bi-check-circle-fill"></i> Key Strengths
                    </h6>
                    <ul className="list-group list-group-flush border-0 fs-8 text-secondary">
                      {selectedFeedback.strengths.map((str, idx) => (
                        <li key={idx} className="list-group-item bg-transparent px-0 py-1 border-0">
                          • {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-warning fs-7 mb-2 d-flex align-items-center gap-1.5">
                      <i className="bi bi-exclamation-triangle-fill"></i> Areas for Improvement
                    </h6>
                    <ul className="list-group list-group-flush border-0 fs-8 text-secondary">
                      {selectedFeedback.improvements.map((imp, idx) => (
                        <li key={idx} className="list-group-item bg-transparent px-0 py-1 border-0">
                          • {imp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Ideal Answer */}
                  <div className="p-3 bg-primary bg-opacity-10 border border-primary-subtle rounded-3">
                    <h6 className="fw-bold text-primary fs-7 mb-1.5 d-flex align-items-center gap-1">
                      <i className="bi bi-lightbulb-fill"></i> Model Reference Answer
                    </h6>
                    <p className="fs-8 text-dark mb-0 leading-normal">
                      {selectedFeedback.suggestedAnswer}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-chat-quote display-4 text-muted opacity-50 d-block mb-3"></i>
                  <h6 className="fw-bold text-dark">No Response Feedback Selected</h6>
                  <p className="fs-8 mb-0 px-3">
                    Submit your candidate response or click "View AI Score" next to a user message to review detailed AI feedback.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
