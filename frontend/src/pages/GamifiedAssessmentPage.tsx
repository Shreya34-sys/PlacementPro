import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Tabs, Tab, Alert } from 'react-bootstrap';

// Memory Game Card structure
interface MemoryCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const initialMemorySymbols = ['🚀', '💻', '⚡', '🎯', '🚀', '💻', '⚡', '🎯'];

export const GamifiedAssessmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('memory');

  // --- MEMORY GAME STATE ---
  const [cards, setCards] = useState<MemoryCard[]>(() =>
    initialMemorySymbols
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({ id: index, symbol, isFlipped: false, isMatched: false }))
  );
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryCompleted, setMemoryCompleted] = useState(false);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(newCards);
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const [firstId, secondId] = newFlipped;
      if (newCards[firstId].symbol === newCards[secondId].symbol) {
        // Match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c))
          );
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      setMemoryCompleted(true);
    }
  }, [cards]);

  const resetMemoryGame = () => {
    setCards(
      initialMemorySymbols
        .sort(() => Math.random() - 0.5)
        .map((symbol, index) => ({ id: index, symbol, isFlipped: false, isMatched: false }))
    );
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryCompleted(false);
  };

  // --- REACTION TIME TEST STATE ---
  const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle');
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
  const [reactionTimeout, setReactionTimeout] = useState<any>(null);

  const startReactionTest = () => {
    setReactionState('waiting');
    setReactionTimeMs(null);
    const randomDelay = Math.floor(Math.random() * 2500) + 1500; // 1.5s - 4s
    const timeout = setTimeout(() => {
      setReactionState('ready');
      setStartTime(Date.now());
    }, randomDelay);
    setReactionTimeout(timeout);
  };

  const handleReactionClick = () => {
    if (reactionState === 'waiting') {
      clearTimeout(reactionTimeout);
      alert('Too early! Wait for the screen to turn GREEN.');
      setReactionState('idle');
    } else if (reactionState === 'ready') {
      const elapsed = Date.now() - startTime;
      setReactionTimeMs(elapsed);
      setReactionState('result');
    }
  };

  // --- NUMBER SERIES GAME STATE ---
  const [seriesScore, setSeriesScore] = useState(0);
  const [seriesQuestionIdx, setSeriesQuestionIdx] = useState(0);
  const numberSeriesQuestions = [
    { sequence: '3, 6, 12, 24, ?', options: ['30', '36', '48', '50'], correct: 2 },
    { sequence: '5, 10, 8, 16, 14, ?', options: ['28', '20', '22', '26'], correct: 0 },
    { sequence: '1, 4, 9, 16, 25, ?', options: ['30', '35', '36', '42'], correct: 2 }
  ];

  const handleSeriesAnswer = (optIndex: number) => {
    if (optIndex === numberSeriesQuestions[seriesQuestionIdx].correct) {
      setSeriesScore((prev) => prev + 100);
    }
    if (seriesQuestionIdx < numberSeriesQuestions.length - 1) {
      setSeriesQuestionIdx((prev) => prev + 1);
    } else {
      alert(`Series Game Completed! Final Score: ${seriesScore + (optIndex === numberSeriesQuestions[seriesQuestionIdx].correct ? 100 : 0)} XP`);
    }
  };

  return (
    <Container fluid className="px-0">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-controller text-primary"></i> Gamified Cognitive & Aptitude Assessment
          </h3>
          <p className="text-muted mb-0 fs-7">
            Train your memory, logical reasoning, pattern matrix recognition, and reaction speed with gamified challenges.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Badge bg="warning" text="dark" className="px-3 py-2 fs-7 fw-bold shadow-sm">
            <i className="bi bi-star-fill me-1"></i> Player Level 8 (2,450 XP)
          </Badge>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'memory')}
        className="mb-4 nav-tabs-custom"
      >
        <Tab eventKey="memory" title="Memory Grid Game" />
        <Tab eventKey="reaction" title="Reaction Speed Test" />
        <Tab eventKey="number-series" title="Number Series & Math" />
        <Tab eventKey="patterns" title="Pattern Matrix & Logic" />
        <Tab eventKey="progress" title="Cognitive Stats & Badges" />
      </Tabs>

      {/* TAB 1: MEMORY GAME */}
      {activeTab === 'memory' && (
        <Card className="shadow-sm border-0 max-w-2xl mx-auto">
          <Card.Header className="bg-white py-3 fw-bold fs-6 d-flex justify-content-between align-items-center">
            <span><i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>Card Symbol Matching Challenge</span>
            <Badge bg="secondary">Moves: {memoryMoves}</Badge>
          </Card.Header>
          <Card.Body className="p-4 text-center">
            <p className="text-muted fs-8 mb-4">
              Flip two cards at a time to find matching pairs. Complete in minimal moves to maximize your XP!
            </p>

            <Row className="g-3 justify-content-center mb-4">
              {cards.map((card) => (
                <Col key={card.id} xs={3}>
                  <div
                    onClick={() => handleCardClick(card.id)}
                    className={`rounded p-4 d-flex align-items-center justify-content-center cursor-pointer shadow-sm transition-all ${
                      card.isFlipped || card.isMatched ? 'bg-primary text-white scale-105' : 'bg-dark text-white opacity-90'
                    }`}
                    style={{ height: '90px', fontSize: '2rem' }}
                  >
                    {card.isFlipped || card.isMatched ? card.symbol : '❓'}
                  </div>
                </Col>
              ))}
            </Row>

            {memoryCompleted && (
              <Alert variant="success" className="mb-3 fs-7 fw-bold">
                🎉 Congratulations! You solved the memory puzzle in {memoryMoves} moves! (+150 XP)
              </Alert>
            )}

            <Button variant="outline-primary" className="fw-bold px-4" onClick={resetMemoryGame}>
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Memory Board
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* TAB 2: REACTION TIME TEST */}
      {activeTab === 'reaction' && (
        <Card className="shadow-sm border-0 max-w-2xl mx-auto text-center">
          <Card.Header className="bg-white py-3 fw-bold fs-6">
            <i className="bi bi-lightning-charge-fill text-warning me-2"></i> Millisecond Reaction Time Test
          </Card.Header>
          <Card.Body className="p-4">
            {reactionState === 'idle' && (
              <div className="py-5">
                <i className="bi bi-hand-index-thumb display-1 text-primary d-block mb-3"></i>
                <h4 className="fw-bold text-dark mb-2">Measure Your Visual Response Time</h4>
                <p className="text-muted fs-7 mb-4">
                  Click 'Start Test'. The box will turn red. When it turns GREEN, click as fast as you can!
                </p>
                <Button variant="primary" size="lg" className="fw-bold px-5 py-2.5" onClick={startReactionTest}>
                  Start Reaction Test
                </Button>
              </div>
            )}

            {reactionState === 'waiting' && (
              <div
                onClick={handleReactionClick}
                className="bg-danger text-white rounded p-5 cursor-pointer text-center my-3"
                style={{ minHeight: '220px' }}
              >
                <h3 className="fw-extrabold mt-4">Wait for GREEN...</h3>
                <small className="opacity-75">Do not click yet!</small>
              </div>
            )}

            {reactionState === 'ready' && (
              <div
                onClick={handleReactionClick}
                className="bg-success text-white rounded p-5 cursor-pointer text-center my-3 animate-pulse"
                style={{ minHeight: '220px' }}
              >
                <h2 className="fw-extrabold display-4 mt-3">CLICK NOW!</h2>
              </div>
            )}

            {reactionState === 'result' && (
              <div className="py-4">
                <i className="bi bi-speedometer display-2 text-success d-block mb-2"></i>
                <h4 className="text-muted fw-bold mb-1">Your Reaction Time:</h4>
                <div className="display-3 fw-extrabold text-primary mb-3">{reactionTimeMs} ms</div>
                <Badge bg={reactionTimeMs! < 250 ? 'success' : 'warning'} className="px-3 py-1.5 fs-7 mb-4">
                  {reactionTimeMs! < 250 ? '⚡ Lightning Fast (Top 5% Athlete Speed)' : '👍 Good Speed'}
                </Badge>
                <div>
                  <Button variant="outline-primary" className="fw-bold px-4" onClick={startReactionTest}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* TAB 3: NUMBER SERIES & MATH */}
      {activeTab === 'number-series' && (
        <Card className="shadow-sm border-0 max-w-2xl mx-auto">
          <Card.Header className="bg-white py-3 fw-bold fs-6 d-flex justify-content-between align-items-center">
            <span><i className="bi bi-calculator-fill text-info me-2"></i>Speed Number Series</span>
            <Badge bg="info">Score: {seriesScore} XP</Badge>
          </Card.Header>
          <Card.Body className="p-4">
            <h5 className="fw-bold text-dark text-center mb-1">
              Question {seriesQuestionIdx + 1} of {numberSeriesQuestions.length}
            </h5>
            <div className="bg-light p-4 rounded text-center my-3 border">
              <h2 className="fw-extrabold text-primary font-monospace">
                {numberSeriesQuestions[seriesQuestionIdx].sequence}
              </h2>
            </div>

            <Row className="g-3 mt-2">
              {numberSeriesQuestions[seriesQuestionIdx].options.map((opt, idx) => (
                <Col key={idx} xs={6}>
                  <Button
                    variant="outline-primary"
                    className="w-100 fw-bold py-3 fs-6"
                    onClick={() => handleSeriesAnswer(idx)}
                  >
                    {opt}
                  </Button>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* TAB 4: PATTERN MATRIX & LOGIC */}
      {activeTab === 'patterns' && (
        <Card className="shadow-sm border-0 max-w-2xl mx-auto">
          <Card.Header className="bg-white py-3 fw-bold fs-6">
            <i className="bi bi-puzzle-fill text-warning me-2"></i> Spatial Pattern Recognition Matrix
          </Card.Header>
          <Card.Body className="p-4">
            <p className="text-muted fs-8 mb-3">
              Observe the row transformations (rotation + shape addition) and select the missing 3rd cell in Row 2:
            </p>

            <div className="bg-dark text-white p-4 rounded mb-4 text-center">
              <Row className="g-2 text-center align-items-center">
                <Col xs={4} className="border-end p-2 fs-3">🔺 ➡️ 🟦</Col>
                <Col xs={4} className="border-end p-2 fs-3">🟡 ➡️ 🟩</Col>
                <Col xs={4} className="p-2 fs-3">🔷 ➡️ ❓</Col>
              </Row>
            </div>

            <Row className="g-3">
              {['🟣 Purple Circle', '🟨 Yellow Square', '🔴 Red Triangle', '⭐ Gold Star'].map((option, idx) => (
                <Col key={idx} xs={6}>
                  <Button variant="outline-dark" className="w-100 fw-bold py-2 fs-8" onClick={() => alert(idx === 1 ? 'Correct Pattern Logic!' : 'Incorrect, try again!')}>
                    {option}
                  </Button>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* TAB 5: PROGRESS & BADGES */}
      {activeTab === 'progress' && (
        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-award-fill text-warning me-2"></i> Cognitive Unlocked Badges
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex flex-column gap-3">
                  {[
                    { title: 'Memory Champion', desc: 'Matched 10 consecutive card grids under 12 moves', icon: '🏆', color: 'bg-warning-subtle text-warning' },
                    { title: 'Reflex Speedster', desc: 'Achieved sub-230ms reaction speed in clicker test', icon: '⚡', color: 'bg-danger-subtle text-danger' },
                    { title: 'Pattern Detective', desc: 'Solved 15 matrix spatial reasoning puzzles', icon: '🧩', color: 'bg-info-subtle text-info' }
                  ].map((badge, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3 p-3 rounded border bg-light">
                      <div className={`p-3 rounded-circle fs-3 ${badge.color}`}>{badge.icon}</div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{badge.title}</h6>
                        <small className="text-muted fs-8">{badge.desc}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-bar-chart-line-fill text-success me-2"></i> Brain Agility Scores
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                    <span>Working Memory Retention</span>
                    <span className="text-primary">94%</span>
                  </div>
                  <ProgressBar now={94} variant="primary" style={{ height: '8px' }} />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                    <span>Processing Speed & Reflexes</span>
                    <span className="text-danger">88%</span>
                  </div>
                  <ProgressBar now={88} variant="danger" style={{ height: '8px' }} />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between fs-8 fw-semibold mb-1">
                    <span>Logical Pattern Deduction</span>
                    <span className="text-success">92%</span>
                  </div>
                  <ProgressBar now={92} variant="success" style={{ height: '8px' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};
