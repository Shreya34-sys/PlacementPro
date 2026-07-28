import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, ProgressBar } from 'react-bootstrap';
import { mockQuizzes } from '../data/mockData';
import { PracticeQuiz } from '../types';

interface PracticePageProps {
  onNavigateToAptitude?: () => void;
  onNavigate?: (tab: string) => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({ onNavigateToAptitude, onNavigate }) => {
  const [activeQuiz, setActiveQuiz] = useState<PracticeQuiz | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const sampleQuestions = [
    {
      question: 'A train 240m long passes a pole in 24 seconds. What is the speed of the train in km/hr?',
      options: ['30 km/hr', '36 km/hr', '40 km/hr', '45 km/hr'],
      correct: 1,
      explanation: 'Speed = Distance / Time = 240/24 = 10 m/s. Convert m/s to km/hr by multiplying by 18/5: 10 * (18/5) = 36 km/hr.',
    },
    {
      question: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
      correct: 2,
      explanation: 'In a balanced BST, the height of the tree is O(log n), so searching takes O(log n) comparisons.',
    },
    {
      question: 'In object-oriented programming, which principle allows a child class to inherit attributes from a parent class?',
      options: ['Encapsulation', 'Abstraction', 'Inheritance', 'Polymorphism'],
      correct: 2,
      explanation: 'Inheritance allows a subclass to acquire methods and fields from a superclass.',
    },
  ];

  const handleStartQuiz = (quiz: PracticeQuiz) => {
    setActiveQuiz(quiz);
    setQuizStarted(true);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  const handleOptionSelect = (optIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: optIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    sampleQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) score += 1;
    });
    return score;
  };

  return (
    <Container fluid className="px-0">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Placement Preparation & Quiz Portal</h3>
        <p className="text-muted mb-0">Sharpen your aptitude, technical DSA coding concepts, and interview skills.</p>
      </div>

      {/* Featured Assessment Card */}
      <Card className="shadow-sm border-0 mb-4 bg-dark text-white overflow-hidden">
        <Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
          <div>
            <Badge bg="warning" text="dark" className="fw-bold text-uppercase mb-2 px-2.5 py-1">
              <i className="bi bi-star-fill me-1"></i> Featured Diagnostic
            </Badge>
            <h3 className="fw-bold text-white mb-2">Campus Recruitment Proctored Aptitude Test</h3>
            <p className="text-white-50 mb-0 fs-6 max-w-2xl">
              Experience realistic exam conditions with live countdown timer, interactive question palette, negative marking simulation, and step-by-step solutions.
            </p>
          </div>
          <div className="text-nowrap">
            {onNavigateToAptitude && (
              <Button
                variant="primary"
                size="lg"
                className="fw-bold px-4 py-2.5 shadow"
                onClick={onNavigateToAptitude}
              >
                <i className="bi bi-stopwatch-fill me-2"></i> Launch Aptitude Test Mode
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Quick Navigation Modules Grid */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0 h-100 hover-lift text-center p-3 border-top border-4 border-primary">
            <Card.Body className="d-flex flex-column justify-content-between">
              <div>
                <i className="bi bi-code-square display-5 text-primary mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">LeetCode Coding</h6>
                <p className="text-muted fs-8">Daily challenges, Monaco editor, topic & company filters.</p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                className="fw-bold w-100 mt-2"
                onClick={() => onNavigate && onNavigate('leetcode-practice')}
              >
                Open Practice
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 h-100 hover-lift text-center p-3 border-top border-4 border-success">
            <Card.Body className="d-flex flex-column justify-content-between">
              <div>
                <i className="bi bi-mic display-5 text-success mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">Versant Speaking</h6>
                <p className="text-muted fs-8">Reading aloud, repeat sentence, fluency & AI grade.</p>
              </div>
              <Button
                variant="outline-success"
                size="sm"
                className="fw-bold w-100 mt-2"
                onClick={() => onNavigate && onNavigate('versant-prep')}
              >
                Open Versant
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 h-100 hover-lift text-center p-3 border-top border-4 border-info">
            <Card.Body className="d-flex flex-column justify-content-between">
              <div>
                <i className="bi bi-person-bounding-box display-5 text-info mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">HR Interview Prep</h6>
                <p className="text-muted fs-8">Behavioral STAR questions, live mock room & confidence.</p>
              </div>
              <Button
                variant="outline-info"
                size="sm"
                className="fw-bold w-100 mt-2"
                onClick={() => onNavigate && onNavigate('hr-prep')}
              >
                Open HR Prep
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 h-100 hover-lift text-center p-3 border-top border-4 border-warning">
            <Card.Body className="d-flex flex-column justify-content-between">
              <div>
                <i className="bi bi-controller display-5 text-warning mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">Gamified Assessment</h6>
                <p className="text-muted fs-8">Memory cards, reaction speed, pattern logic & XP level.</p>
              </div>
              <Button
                variant="outline-warning"
                size="sm"
                className="fw-bold text-dark w-100 mt-2"
                onClick={() => onNavigate && onNavigate('gamified-prep')}
              >
                Play Games
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {mockQuizzes.map((quiz) => (
          <Col key={quiz.id} md={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                <span className="text-primary">{quiz.category}</span>
                <Badge
                  bg={quiz.difficulty === 'Easy' ? 'success' : quiz.difficulty === 'Medium' ? 'warning' : 'danger'}
                >
                  {quiz.difficulty}
                </Badge>
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column">
                <h5 className="fw-bold text-dark mb-2">{quiz.title}</h5>
                <div className="bg-light p-3 rounded mb-3 fs-7">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Questions:</span>
                    <span className="fw-bold">{quiz.totalQuestions} Questions</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Duration:</span>
                    <span className="fw-bold">{quiz.durationMinutes} Minutes</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-100 mt-auto fw-semibold"
                  onClick={() => handleStartQuiz(quiz)}
                >
                  <i className="bi bi-play-circle me-2"></i> Start Practice Assessment
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quiz Modal */}
      <Modal
        show={quizStarted}
        onHide={() => setQuizStarted(false)}
        size="lg"
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            <i className="bi bi-mortarboard text-primary me-2"></i> {activeQuiz?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {!quizSubmitted ? (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold fs-7 text-uppercase text-muted">
                  Question {currentQIndex + 1} of {sampleQuestions.length}
                </span>
                <Badge bg="info">Timed Session</Badge>
              </div>

              <ProgressBar
                now={((currentQIndex + 1) / sampleQuestions.length) * 100}
                className="mb-4"
                style={{ height: '6px' }}
              />

              <h5 className="fw-bold text-dark mb-4">{sampleQuestions[currentQIndex].question}</h5>

              <div className="d-flex flex-column gap-2.5 mb-4">
                {sampleQuestions[currentQIndex].options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQIndex] === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      className={`p-3 rounded border cursor-pointer transition-all ${
                        isSelected ? 'bg-primary text-white border-primary fw-semibold' : 'bg-light hover-bg-white'
                      }`}
                    >
                      <span className="me-2 fw-bold">{String.fromCharCode(65 + idx)}.</span> {opt}
                    </div>
                  );
                })}
              </div>

              <div className="d-flex justify-content-between pt-3 border-top">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(currentQIndex - 1)}
                >
                  Previous
                </Button>
                {currentQIndex < sampleQuestions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={selectedAnswers[currentQIndex] === undefined}
                    onClick={() => setCurrentQIndex(currentQIndex + 1)}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    disabled={selectedAnswers[currentQIndex] === undefined}
                    onClick={() => setQuizSubmitted(true)}
                  >
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-trophy-fill display-2 text-warning d-block mb-3"></i>
              <h3 className="fw-bold mb-1">Quiz Completed!</h3>
              <p className="text-muted mb-4">
                You scored <span className="fw-bold text-success fs-4">{calculateScore()} / {sampleQuestions.length}</span>
              </p>

              <div className="text-start bg-light p-4 rounded mb-4">
                <h6 className="fw-bold mb-3">Answer Explanations:</h6>
                {sampleQuestions.map((q, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-white rounded border">
                    <div className="fw-bold mb-1 fs-7">{idx + 1}. {q.question}</div>
                    <div className="fs-8 text-success fw-semibold mb-1">Correct Answer: {q.options[q.correct]}</div>
                    <div className="fs-8 text-muted">{q.explanation}</div>
                  </div>
                ))}
              </div>

              <Button variant="primary" onClick={() => setQuizStarted(false)}>
                Back to Prep Portal
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};
