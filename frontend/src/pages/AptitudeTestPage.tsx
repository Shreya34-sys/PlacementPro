import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, ProgressBar } from 'react-bootstrap';
import { mockAptitudeTest, AptitudeQuestion } from '../data/mockAptitudeQuestions';
import { useAuth } from '../context/AuthContext';
import { updateUserLeaderboardStats } from '../services/leaderboardService';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '../utils/firebase';

type QuestionStatus = 'not-visited' | 'unanswered' | 'answered' | 'marked';

export const AptitudeTestPage: React.FC = () => {
  const [testState, setTestState] = useState<'overview' | 'in-progress' | 'submitted'>('overview');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  
  // User answers mapping: questionId -> option index (0..3)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  // Question statuses: questionId -> status
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  
  // Timer state in seconds
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(mockAptitudeTest.totalTimeMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  
  // Submit modal visibility
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Initialize statuses when starting test
  const handleStartTest = () => {
    const initialStatuses: Record<number, QuestionStatus> = {};
    mockAptitudeTest.questions.forEach((q, idx) => {
      initialStatuses[q.id] = idx === 0 ? 'unanswered' : 'not-visited';
    });
    setQuestionStatuses(initialStatuses);
    setUserAnswers({});
    setCurrentQIndex(0);
    setTimeLeftSeconds(mockAptitudeTest.totalTimeMinutes * 60);
    setIsTimerRunning(true);
    setTestState('in-progress');
  };

  // Timer countdown — only depends on running/state flags, not on timeLeftSeconds value
  useEffect(() => {
    if (!isTimerRunning || testState !== 'in-progress') return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          setTestState('submitted');
          setShowSubmitModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, testState]); // ← removed timeLeftSeconds from deps to avoid re-creating every tick

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const currentQuestion: AptitudeQuestion = mockAptitudeTest.questions[currentQIndex];

  const handleOptionSelect = (optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleClearResponse = () => {
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: 'unanswered',
    }));
  };

  const handleSaveAndNext = () => {
    const hasAnswer = userAnswers[currentQuestion.id] !== undefined;
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: hasAnswer ? 'answered' : 'unanswered',
    }));

    if (currentQIndex < mockAptitudeTest.questions.length - 1) {
      const nextIndex = currentQIndex + 1;
      const nextQId = mockAptitudeTest.questions[nextIndex].id;
      if (questionStatuses[nextQId] === 'not-visited') {
        setQuestionStatuses((prev) => ({ ...prev, [nextQId]: 'unanswered' }));
      }
      setCurrentQIndex(nextIndex);
    }
  };

  const handleMarkForReviewAndNext = () => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: 'marked',
    }));

    if (currentQIndex < mockAptitudeTest.questions.length - 1) {
      const nextIndex = currentQIndex + 1;
      const nextQId = mockAptitudeTest.questions[nextIndex].id;
      if (questionStatuses[nextQId] === 'not-visited') {
        setQuestionStatuses((prev) => ({ ...prev, [nextQId]: 'unanswered' }));
      }
      setCurrentQIndex(nextIndex);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    const targetQId = mockAptitudeTest.questions[index].id;
    if (questionStatuses[targetQId] === 'not-visited') {
      setQuestionStatuses((prev) => ({ ...prev, [targetQId]: 'unanswered' }));
    }
    setCurrentQIndex(index);
  };

  const { currentUser } = useAuth();

  const handleFinalSubmit = async () => {
    setIsTimerRunning(false);
    setTestState('submitted');
    setShowSubmitModal(false);

    if (currentUser) {
      let score = 0;
      let totalMaxMarks = mockAptitudeTest.questions.length * 4;

      mockAptitudeTest.questions.forEach((q) => {
        const ans = userAnswers[q.id];
        if (ans !== undefined) {
          if (ans === q.correctAnswer) {
            score += q.marks;
          } else {
            score -= 1; // negative marking -1
          }
        }
      });
      const scorePercentage = Math.max(0, Math.round((score / totalMaxMarks) * 100));

      try {
        // Preserve best score — don't overwrite a higher score with a lower one
        let existingScore = 0;
        if (firestoreDb) {
          const snap = await getDoc(doc(firestoreDb, 'users', currentUser.id));
          if (snap.exists()) {
            existingScore = (snap.data().aptitudeScore as number) ?? 0;
          }
        }
        await updateUserLeaderboardStats(currentUser.id, {
          aptitudeScore: Math.max(scorePercentage, existingScore),
        });
      } catch (e) {
        console.error("Failed to update aptitude score", e);
      }
    }
  };

  // Score calculation
  const calculateResults = () => {
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let totalMaxMarks = mockAptitudeTest.questions.length * 4;

    mockAptitudeTest.questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans !== undefined) {
        if (ans === q.correctAnswer) {
          score += q.marks;
          correctCount += 1;
        } else {
          score -= 1; // negative marking -1
          wrongCount += 1;
        }
      }
    });

    const totalAnswered = Object.keys(userAnswers).length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const scorePercentage = Math.max(0, Math.round((score / totalMaxMarks) * 100));

    return { score, totalMaxMarks, correctCount, wrongCount, totalAnswered, accuracy, scorePercentage };
  };

  // Summary counts for palette & modal
  const getStatusCounts = () => {
    let answered = 0;
    let marked = 0;
    let unanswered = 0;
    let notVisited = 0;

    mockAptitudeTest.questions.forEach((q) => {
      const st = questionStatuses[q.id] || 'not-visited';
      if (st === 'answered') answered += 1;
      else if (st === 'marked') marked += 1;
      else if (st === 'unanswered') unanswered += 1;
      else notVisited += 1;
    });

    return { answered, marked, unanswered, notVisited };
  };

  const counts = getStatusCounts();

  /* OVERVIEW SCREEN */
  if (testState === 'overview') {
    return (
      <Container fluid className="px-0">
        <div className="mb-4">
          <h3 className="fw-bold mb-1">Aptitude & Technical Assessment Portal</h3>
          <p className="text-muted mb-0">Simulate real campus recruitment screening exams with live timers and question palettes.</p>
        </div>

        <Row className="g-4">
          <Col lg={8}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                <span><i className="bi bi-file-earmark-text text-primary me-2 fs-5"></i>{mockAptitudeTest.title}</span>
                <Badge bg="primary">Official Assessment</Badge>
              </Card.Header>
              <Card.Body className="p-4">
                <p className="text-secondary leading-relaxed mb-4">{mockAptitudeTest.description}</p>

                <div className="row g-3 text-center bg-light p-3 rounded mb-4">
                  <div className="col-4 border-end">
                    <small className="text-muted text-uppercase d-block fs-8 fw-semibold">Total Time</small>
                    <span className="fw-bold text-dark fs-5">{mockAptitudeTest.totalTimeMinutes} Minutes</span>
                  </div>
                  <div className="col-4 border-end">
                    <small className="text-muted text-uppercase d-block fs-8 fw-semibold">Questions</small>
                    <span className="fw-bold text-dark fs-5">{mockAptitudeTest.questions.length} Items</span>
                  </div>
                  <div className="col-4">
                    <small className="text-muted text-uppercase d-block fs-8 fw-semibold">Passing Cutoff</small>
                    <span className="fw-bold text-success fs-5">{mockAptitudeTest.passingScore}% Marks</span>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-3">Assessment Guidelines & Rules</h6>
                <ul className="text-secondary fs-7 leading-relaxed mb-4">
                  <li className="mb-2"><strong>Marking Scheme:</strong> +4 marks for each correct answer; -1 mark negative penalty for incorrect answers.</li>
                  <li className="mb-2"><strong>Navigation:</strong> Use the interactive Question Palette on the right to jump between questions at any time.</li>
                  <li className="mb-2"><strong>Mark for Review:</strong> You can mark questions for later review; marked questions are saved.</li>
                  <li><strong>Auto Submission:</strong> The test will automatically submit when the timer hits 00:00.</li>
                </ul>

                <Button variant="primary" size="lg" className="w-100 fw-bold py-3 shadow-sm" onClick={handleStartTest}>
                  <i className="bi bi-play-circle-fill me-2"></i> Start Proctored Aptitude Test Now
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 bg-primary text-white mb-4">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-2"><i className="bi bi-trophy me-2"></i>Preparation Tip</h5>
                <p className="fs-7 opacity-90 mb-0">
                  Focus on accuracy first. Avoid blind guessing to protect your score from negative marking penalties.
                </p>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-bold py-3">
                <i className="bi bi-check2-square text-success me-2"></i> Tested Skill Domains
              </Card.Header>
              <Card.Body className="p-3">
                <div className="d-flex flex-column gap-2.5">
                  <div className="p-2.5 bg-light rounded d-flex justify-content-between align-items-center fs-7">
                    <span><i className="bi bi-calculator me-2 text-primary"></i>Quantitative Ability</span>
                    <Badge bg="light" text="dark" className="border">3 Questions</Badge>
                  </div>
                  <div className="p-2.5 bg-light rounded d-flex justify-content-between align-items-center fs-7">
                    <span><i className="bi bi-diagram-3 me-2 text-info"></i>Logical Reasoning</span>
                    <Badge bg="light" text="dark" className="border">3 Questions</Badge>
                  </div>
                  <div className="p-2.5 bg-light rounded d-flex justify-content-between align-items-center fs-7">
                    <span><i className="bi bi-chat-text me-2 text-warning"></i>Verbal & Data Analysis</span>
                    <Badge bg="light" text="dark" className="border">2 Questions</Badge>
                  </div>
                  <div className="p-2.5 bg-light rounded d-flex justify-content-between align-items-center fs-7">
                    <span><i className="bi bi-cpu me-2 text-success"></i>CS Fundamentals</span>
                    <Badge bg="light" text="dark" className="border">2 Questions</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  /* SUBMITTED / RESULTS SCREEN */
  if (testState === 'submitted') {
    const results = calculateResults();
    const isPassed = results.scorePercentage >= mockAptitudeTest.passingScore;

    return (
      <Container fluid className="px-0">
        {/* Results Banner */}
        <Card className={`shadow-sm border-0 mb-4 ${isPassed ? 'bg-success text-white' : 'bg-dark text-white'}`}>
          <Card.Body className="p-4 p-md-5 text-center">
            <i className={`display-3 mb-3 d-block ${isPassed ? 'bi bi-award-fill text-warning' : 'bi bi-exclamation-circle text-warning'}`}></i>
            <h2 className="fw-bold mb-1">{isPassed ? 'Congratulations! Cutoff Cleared' : 'Assessment Completed'}</h2>
            <p className="opacity-90 fs-6 mb-4">
              {isPassed
                ? 'Your performance meets the technical recruitment screening benchmark.'
                : 'Review the detailed solution key below to strengthen your weak areas.'}
            </p>

            <Row className="g-3 max-w-2xl mx-auto text-dark bg-white p-3.5 rounded-3 shadow-sm text-center">
              <Col sm={3} className="border-end-sm">
                <small className="text-muted text-uppercase d-block fs-8 fw-semibold">Total Score</small>
                <span className="fs-4 fw-bold text-primary">{results.score} / {results.totalMaxMarks}</span>
              </Col>
              <Col sm={3} className="border-end-sm">
                <small className="text-muted text-uppercase d-block fs-8 fw-semibold">Score %</small>
                <span className={`fs-4 fw-bold ${isPassed ? 'text-success' : 'text-danger'}`}>{results.scorePercentage}%</span>
              </Col>
              <Col sm={3} className="border-end-sm">
                <small className="text-muted text-uppercase d-block fs-8 fw-semibold">Accuracy</small>
                <span className="fs-4 fw-bold text-dark">{results.accuracy}%</span>
              </Col>
              <Col sm={3}>
                <small className="text-muted text-uppercase d-block fs-8 fw-semibold">Correct / Wrong</small>
                <span className="fs-6 fw-bold text-dark">{results.correctCount} / {results.wrongCount}</span>
              </Col>
            </Row>

            <div className="mt-4">
              <Button variant="light" className="fw-bold me-2" onClick={handleStartTest}>
                <i className="bi bi-arrow-clockwise me-1"></i> Retake Test
              </Button>
              <Button variant="outline-light" className="fw-semibold" onClick={() => setTestState('overview')}>
                <i className="bi bi-house me-1"></i> Back to Overview
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Detailed Solutions Key */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Header className="bg-white fw-bold py-3 fs-5 d-flex justify-content-between align-items-center">
            <span><i className="bi bi-journal-check text-primary me-2"></i>Detailed Question Answer Key & Explanations</span>
            <Badge bg="secondary">10 Questions Reviewed</Badge>
          </Card.Header>
          <Card.Body className="p-4">
            <div className="d-flex flex-column gap-4">
              {mockAptitudeTest.questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isAnswered = userAns !== undefined;
                const isCorrect = isAnswered && userAns === q.correctAnswer;

                return (
                  <div key={q.id} className="p-4 bg-light rounded border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg="dark">Q{idx + 1}</Badge>
                        <Badge bg="primary">{q.section}</Badge>
                      </div>
                      <div>
                        {!isAnswered ? (
                          <Badge bg="secondary">Unanswered (0 Marks)</Badge>
                        ) : isCorrect ? (
                          <Badge bg="success"><i className="bi bi-check-circle me-1"></i>Correct (+4 Marks)</Badge>
                        ) : (
                          <Badge bg="danger"><i className="bi bi-x-circle me-1"></i>Incorrect (-1 Mark)</Badge>
                        )}
                      </div>
                    </div>

                    <h6 className="fw-bold text-dark mb-3">{q.question}</h6>

                    <div className="row g-2 mb-3">
                      {q.options.map((opt, optIdx) => {
                        const isThisCorrect = optIdx === q.correctAnswer;
                        const isThisUserSelected = optIdx === userAns;

                        let styleClass = 'bg-white border text-dark';
                        if (isThisCorrect) {
                          styleClass = 'bg-success bg-opacity-10 border-success text-success fw-bold';
                        } else if (isThisUserSelected && !isCorrect) {
                          styleClass = 'bg-danger bg-opacity-10 border-danger text-danger fw-bold';
                        }

                        return (
                          <Col key={optIdx} sm={6}>
                            <div className={`p-2.5 rounded border fs-7 ${styleClass}`}>
                              <span className="me-2">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                              {isThisCorrect && <i className="bi bi-check2-circle float-end fs-6"></i>}
                              {isThisUserSelected && !isCorrect && <i className="bi bi-x-circle float-end fs-6"></i>}
                            </div>
                          </Col>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-white rounded border border-info border-opacity-25 fs-7">
                      <strong className="text-info d-block mb-1"><i className="bi bi-lightbulb me-1"></i>Explanation:</strong>
                      <span className="text-secondary">{q.explanation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  /* LIVE TEST EXAM MODE */
  const answeredCount = counts.answered;
  const totalQuestions = mockAptitudeTest.questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <Container fluid className="px-0">
      {/* Test Sticky Header */}
      <Card className="shadow-sm border-0 mb-4 sticky-top border-bottom" style={{ zIndex: 1020 }}>
        <Card.Body className="p-3 bg-white">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2">
                <Badge bg="primary">Live Exam Mode</Badge>
                <h5 className="fw-bold text-dark mb-0">{mockAptitudeTest.title}</h5>
              </div>
              <small className="text-muted fs-8">
                Question {currentQIndex + 1} of {totalQuestions} | {currentQuestion.section}
              </small>
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Timer Pill */}
              <div className={`p-2 px-3 rounded-pill fw-bold border ${timeLeftSeconds < 180 ? 'bg-danger text-white border-danger animate-pulse' : 'bg-dark text-white'}`}>
                <i className="bi bi-stopwatch me-2"></i>
                <span className="font-monospace fs-6">{formatTime(timeLeftSeconds)}</span>
              </div>

              <Button
                variant="success"
                className="fw-bold px-3 shadow-sm"
                onClick={() => setShowSubmitModal(true)}
              >
                <i className="bi bi-send me-1.5"></i> Submit Test
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="d-flex justify-content-between fs-8 fw-semibold text-muted mb-1">
              <span>Overall Progress ({answeredCount} / {totalQuestions} Answered)</span>
              <span>{progressPercent}% Completed</span>
            </div>
            <ProgressBar now={progressPercent} style={{ height: '6px' }} variant="success" />
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Left Area: Main Question Viewer */}
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4 h-100 d-flex flex-column">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <span className="fw-bold text-dark fs-6">
                Question {currentQIndex + 1}
              </span>
              <div className="d-flex align-items-center gap-2">
                <Badge bg="info" className="text-uppercase">{currentQuestion.section}</Badge>
                <Badge bg="light" text="dark" className="border">+4 Marks / -1 Penalty</Badge>
              </div>
            </Card.Header>

            <Card.Body className="p-4 flex-grow-1 d-flex flex-column">
              <h5 className="fw-bold text-dark leading-relaxed mb-4">
                {currentQuestion.question}
              </h5>

              {/* Multiple Choice Options */}
              <div className="d-flex flex-column gap-3 mb-4">
                {currentQuestion.options.map((optionText, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleOptionSelect(optIdx)}
                      className={`p-3.5 rounded-3 border cursor-pointer transition-all d-flex align-items-center ${
                        isSelected
                          ? 'bg-primary bg-opacity-10 border-primary text-primary fw-bold shadow-sm'
                          : 'bg-white hover-bg-light text-dark'
                      }`}
                    >
                      <span
                        className={`badge me-3 rounded-circle d-inline-flex align-items-center justify-content-center ${
                          isSelected ? 'bg-primary text-white' : 'bg-light text-dark border'
                        }`}
                        style={{ width: '28px', height: '28px', fontSize: '13px' }}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="fs-6">{optionText}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Bar */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-4 border-top mt-auto">
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(currentQIndex - 1)}
                  >
                    <i className="bi bi-chevron-left me-1"></i> Previous
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleClearResponse}
                    disabled={userAnswers[currentQuestion.id] === undefined}
                  >
                    Clear Choice
                  </Button>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="warning"
                    size="sm"
                    className="text-dark fw-medium"
                    onClick={handleMarkForReviewAndNext}
                  >
                    <i className="bi bi-bookmark me-1"></i> Mark for Review & Next
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="fw-bold px-3"
                    onClick={handleSaveAndNext}
                  >
                    Save & Next <i className="bi bi-chevron-right ms-1"></i>
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar: Interactive Question Palette */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-white fw-bold py-3 fs-6">
              <i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>Question Palette
            </Card.Header>

            <Card.Body className="p-3">
              {/* Legend */}
              <div className="row g-2 mb-3 fs-8 text-muted border-bottom pb-3">
                <div className="col-6 d-flex align-items-center">
                  <span className="d-inline-block rounded-circle bg-success me-1.5" style={{ width: '12px', height: '12px' }}></span>
                  Answered ({counts.answered})
                </div>
                <div className="col-6 d-flex align-items-center">
                  <span className="d-inline-block rounded-circle bg-warning me-1.5" style={{ width: '12px', height: '12px' }}></span>
                  Marked ({counts.marked})
                </div>
                <div className="col-6 d-flex align-items-center">
                  <span className="d-inline-block rounded-circle bg-danger me-1.5" style={{ width: '12px', height: '12px' }}></span>
                  Unanswered ({counts.unanswered})
                </div>
                <div className="col-6 d-flex align-items-center">
                  <span className="d-inline-block rounded-circle bg-light border me-1.5" style={{ width: '12px', height: '12px' }}></span>
                  Not Visited ({counts.notVisited})
                </div>
              </div>

              {/* Grid of Palette Buttons */}
              <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {mockAptitudeTest.questions.map((q, idx) => {
                  const status = questionStatuses[q.id] || 'not-visited';
                  const isCurrent = idx === currentQIndex;

                  let btnBg = 'btn-light text-dark border';
                  if (status === 'answered') btnBg = 'btn-success text-white';
                  else if (status === 'marked') btnBg = 'btn-warning text-dark fw-bold';
                  else if (status === 'unanswered') btnBg = 'btn-danger text-white';

                  return (
                    <Button
                      key={q.id}
                      variant="none"
                      className={`p-2 fw-bold fs-7 rounded ${btnBg} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      onClick={() => handleJumpToQuestion(idx)}
                      style={{
                        outline: isCurrent ? '2px solid #0d6efd' : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-top">
                <Button
                  variant="outline-success"
                  className="w-100 fw-bold py-2"
                  onClick={() => setShowSubmitModal(true)}
                >
                  <i className="bi bi-check-circle me-1.5"></i> Finalize Assessment
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Submit Confirmation Modal */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="fs-6 fw-bold text-dark">
            <i className="bi bi-question-circle text-warning me-2"></i> Submit Assessment?
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <p className="text-secondary mb-4 fs-7">
            Are you sure you want to finalize and submit your test? You will not be able to change your answers after submitting.
          </p>

          <div className="bg-light p-3 rounded mb-4">
            <div className="d-flex justify-content-between fs-7 mb-2">
              <span className="text-muted">Total Questions:</span>
              <span className="fw-bold">{totalQuestions}</span>
            </div>
            <div className="d-flex justify-content-between fs-7 mb-2 text-success">
              <span>Answered:</span>
              <span className="fw-bold">{counts.answered} Questions</span>
            </div>
            <div className="d-flex justify-content-between fs-7 mb-2 text-warning">
              <span>Marked for Review:</span>
              <span className="fw-bold">{counts.marked} Questions</span>
            </div>
            <div className="d-flex justify-content-between fs-7 text-danger">
              <span>Unanswered:</span>
              <span className="fw-bold">{counts.unanswered + counts.notVisited} Questions</span>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowSubmitModal(false)}>
              Resume Test
            </Button>
            <Button variant="success" size="sm" className="fw-bold px-3" onClick={handleFinalSubmit}>
              Confirm & Submit Now
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};
