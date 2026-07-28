import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Modal, ProgressBar } from 'react-bootstrap';

interface GdPrepPageProps {
  onNavigate?: (tab: string) => void;
}

interface GdTopic {
  id: string;
  category: 'Tech & AI' | 'Economy & Business' | 'Social & Current Affairs' | 'Abstract';
  title: string;
  keyPointsFor: string[];
  keyPointsAgainst: string[];
  conclusionSummary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const gdTopics: GdTopic[] = [
  {
    id: 'gd-1',
    category: 'Tech & AI',
    title: 'Is Generative AI a Threat or a Boon to Tech Employment?',
    difficulty: 'Intermediate',
    keyPointsFor: [
      'Automates repetitive coding, boosting software developer productivity by 40%.',
      'Creates new specialized job roles like Prompt Engineers, AI Safety Researchers, and ML System Architects.',
      'Accelerates product prototyping and startup innovation.',
    ],
    keyPointsAgainst: [
      'Entry-level junior coding jobs may shrink as basic code generation gets automated.',
      'High dependence on AI tools might weaken core algorithmic problem-solving skills.',
      'Ethical, IP copyright, and hallucination risks in enterprise software.',
    ],
    conclusionSummary: 'AI will not replace software engineers, but engineers who effectively use AI tools will replace those who do not.',
  },
  {
    id: 'gd-2',
    category: 'Economy & Business',
    title: 'Work From Home vs Hybrid vs Office Work: What is the Future of Tech Workplaces?',
    difficulty: 'Beginner',
    keyPointsFor: [
      'WFH saves commuting hours, reduces carbon footprints, and allows talent acquisition globally.',
      'Hybrid model provides face-to-face mentorship alongside flexible productivity.',
    ],
    keyPointsAgainst: [
      'Remote work makes spontaneous team ideation and company culture harder to build.',
      'Burnout risks when boundaries between work and personal life blur.',
    ],
    conclusionSummary: 'A hybrid model balancing structured office collaboration with remote flexibility is emerging as the sustainable standard.',
  },
  {
    id: 'gd-3',
    category: 'Social & Current Affairs',
    title: 'Digital Payments & UPI: Is Cashless India the New Economic Paradigm?',
    difficulty: 'Intermediate',
    keyPointsFor: [
      'UPI handles over 10 billion transactions monthly with near-zero friction.',
      'Increases financial inclusion for small street vendors and tier-2/3 merchants.',
    ],
    keyPointsAgainst: [
      'Cyber fraud, phishing scams, and digital literacy barriers among rural populations.',
      'Server downtime and network connectivity issues in remote regions.',
    ],
    conclusionSummary: 'Digital payments have revolutionized Indian fintech, but robust cybersecurity education remains vital.',
  },
];

export const GdPrepPage: React.FC<GdPrepPageProps> = ({ onNavigate }) => {
  const [selectedTopic, setSelectedTopic] = useState<GdTopic>(gdTopics[0]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSpeechInput, setAiSpeechInput] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const handleSimulateAiResponse = () => {
    if (!aiSpeechInput.trim()) return;
    setAiFeedback(
      `Great contribution! Your point regarding "${aiSpeechInput.slice(0, 30)}..." demonstrated clear logical structuring. \n\n` +
      `💡 AI Speaking Grade: 8.5/10\n` +
      `• Structure: Strong opening thesis.\n` +
      `• Tone: Polite, persuasive, and assertive.\n` +
      `• Recommendation: Try incorporating a quick statistical metric to further ground your argument.`
    );
  };

  return (
    <Container fluid className="px-0">
      {/* Top Breadcrumb Header */}
      <div className="mb-4 bg-white p-3.5 rounded-3 shadow-xs border">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-1 fs-7">
            <li className="breadcrumb-item">
              <a
                href="#dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('dashboard');
                }}
                className="text-decoration-none text-primary fw-medium"
              >
                <img src="https://img.icons8.com/?size=100&id=aVHe2jHuORcA&format=png&color=000000" alt="Dashboard" width="16" height="16" referrerPolicy="no-referrer" className="me-1 align-text-bottom" style={{ objectFit: 'contain' }} />
                Dashboard
              </a>
            </li>
            <li className="breadcrumb-item">
              <a
                href="#placement-prep"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('placement-prep');
                }}
                className="text-decoration-none text-primary fw-medium"
              >
                📚 Placement Preparation
              </a>
            </li>
            <li className="breadcrumb-item active text-secondary" aria-current="page">
              👥 Group Discussion Preparation
            </li>
          </ol>
        </nav>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="fw-bold text-dark mb-1">👥 Group Discussion (GD) Preparation</h3>
            <p className="text-muted mb-0 fs-7">
              Master GD topics, case study analyses, structured arguments, and practice with our AI GD Simulator.
            </p>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            className="fw-bold px-3"
            onClick={() => onNavigate && onNavigate('placement-prep')}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Placement Prep
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column: GD Topics List */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3">
            {gdTopics.map((topic) => {
              const isSelected = selectedTopic.id === topic.id;
              return (
                <Card
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setAiFeedback(null);
                    setAiSpeechInput('');
                  }}
                  className={`border cursor-pointer transition-all hover-lift rounded-3 ${
                    isSelected ? 'border-primary shadow-sm bg-primary-subtle' : 'bg-white'
                  }`}
                >
                  <Card.Body className="p-3.5">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge bg="primary">{topic.category}</Badge>
                      <Badge bg="info">{topic.difficulty}</Badge>
                    </div>
                    <h6 className="fw-bold text-dark mb-0">{topic.title}</h6>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </Col>

        {/* Right Column: Selected GD Topic Breakdown */}
        <Col lg={8}>
          <Card className="shadow-xs border-0 rounded-16 overflow-hidden mb-4">
            <Card.Header className="bg-primary text-white p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Badge bg="light" text="dark" className="fw-bold mb-2">
                    {selectedTopic.category}
                  </Badge>
                  <h3 className="fw-bold mb-0">{selectedTopic.title}</h3>
                </div>
                <Button
                  variant="light"
                  className="fw-bold text-primary text-nowrap"
                  onClick={() => setShowAiModal(true)}
                >
                  <i className="bi bi-robot me-1.5"></i> Launch AI GD Simulator
                </Button>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="bg-success bg-opacity-10 border-success border-opacity-25 h-100 p-3 rounded-3">
                    <h6 className="fw-bold text-success mb-3"><i className="bi bi-hand-thumbs-up-fill me-2"></i> Arguments FOR (In Favor)</h6>
                    <ul className="text-dark fs-7 leading-relaxed ps-3 mb-0">
                      {selectedTopic.keyPointsFor.map((pt, idx) => (
                        <li key={idx} className="mb-2">{pt}</li>
                      ))}
                    </ul>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="bg-danger bg-opacity-10 border-danger border-opacity-25 h-100 p-3 rounded-3">
                    <h6 className="fw-bold text-danger mb-3"><i className="bi bi-hand-thumbs-down-fill me-2"></i> Arguments AGAINST (Opposing)</h6>
                    <ul className="text-dark fs-7 leading-relaxed ps-3 mb-0">
                      {selectedTopic.keyPointsAgainst.map((pt, idx) => (
                        <li key={idx} className="mb-2">{pt}</li>
                      ))}
                    </ul>
                  </Card>
                </Col>
              </Row>

              <Card className="bg-light border p-3 rounded-3 mb-4">
                <h6 className="fw-bold text-dark mb-1">💡 Balanced Conclusion Summary</h6>
                <p className="text-secondary fs-7 mb-0">{selectedTopic.conclusionSummary}</p>
              </Card>

              {/* GD Etiquette Guide */}
              <h6 className="fw-bold text-dark mb-3">🗣️ Key GD Etiquette Rules</h6>
              <Row className="g-3">
                <Col md={4}>
                  <div className="p-3 bg-white border rounded-3 text-center fs-7">
                    <i className="bi bi-mic-fill text-primary display-6 d-block mb-2"></i>
                    <strong className="d-block text-dark mb-1">Active Listening</strong>
                    <span className="text-muted fs-8">Acknowledge previous speakers before adding your point.</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-white border rounded-3 text-center fs-7">
                    <i className="bi bi-chat-quote-fill text-success display-6 d-block mb-2"></i>
                    <strong className="d-block text-dark mb-1">Data Backed Points</strong>
                    <span className="text-muted fs-8">Use clear facts, statistics, or real examples.</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-white border rounded-3 text-center fs-7">
                    <i className="bi bi-people-fill text-warning display-6 d-block mb-2"></i>
                    <strong className="d-block text-dark mb-1">Group Harmony</strong>
                    <span className="text-muted fs-8">Avoid shouting or cutting off others aggressively.</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* AI GD Practice Modal */}
      <Modal show={showAiModal} onHide={() => setShowAiModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fs-6 fw-bold">
            <i className="bi bi-robot me-2"></i> AI Group Discussion Simulator
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <h6 className="fw-bold text-dark mb-2">Current Topic: {selectedTopic.title}</h6>
          <p className="text-muted fs-7 mb-4">
            Type or speak your argument contribution to receive instant feedback on clarity, tone, and logical structure from AI.
          </p>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold fs-7 text-dark">Your Turn / Statement:</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="e.g., 'I agree with the previous speaker regarding developer productivity. However, we must also consider the ethical deployment of AI models...'"
              value={aiSpeechInput}
              onChange={(e) => setAiSpeechInput(e.target.value)}
            />
          </Form.Group>

          <Button variant="primary" className="fw-bold w-100 py-2.5 mb-4" onClick={handleSimulateAiResponse}>
            <i className="bi bi-send me-1.5"></i> Evaluate My Argument
          </Button>

          {aiFeedback && (
            <div className="p-3.5 bg-dark text-light rounded-3 font-monospace fs-7 whitespace-pre-line">
              {aiFeedback}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};
