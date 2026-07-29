import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, ProgressBar } from 'react-bootstrap';

interface PlacementPrepPageProps {
  onNavigate?: (tab: string) => void;
}

interface PrepCardData {
  id: string;
  icon: string;
  title: string;
  description: string;
  progressPercent: number;
  totalLessonsQuestions: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard' | 'All Levels' | 'Adaptive';
  difficultyBadgeBg: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
  targetTab: string;
  gradientHeaderClass: string;
  gradientIconBg: string;
}

const cardsData: PrepCardData[] = [
  {
    id: 'company-prep',
    icon: '🏢',
    title: 'Company-wise Preparation',
    description: 'Learn company-specific hiring process, eligibility, interview rounds and previous questions.',
    progressPercent: 65,
    totalLessonsQuestions: '45 Modules • 250+ Qs',
    difficulty: 'Intermediate',
    difficultyBadgeBg: 'primary',
    status: 'In Progress',
    targetTab: 'company-prep',
    gradientHeaderClass: 'gradient-header-blue',
    gradientIconBg: '#1e3c72',
  },
  {
    id: 'aptitude-prep',
    icon: '🧮',
    title: 'Aptitude Preparation',
    description: 'Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation.',
    progressPercent: 80,
    totalLessonsQuestions: '32 Lessons • 500+ Qs',
    difficulty: 'Beginner',
    difficultyBadgeBg: 'success',
    status: 'In Progress',
    targetTab: 'aptitude-test',
    gradientHeaderClass: 'gradient-header-emerald',
    gradientIconBg: '#0575e6',
  },
  {
    id: 'technical-prep',
    icon: '💻',
    title: 'Technical Preparation',
    description: 'DBMS, OS, CN, OOP, Java, JavaScript, React, Node.js.',
    progressPercent: 45,
    totalLessonsQuestions: '28 Modules • 180+ Qs',
    difficulty: 'Intermediate',
    difficultyBadgeBg: 'info',
    status: 'In Progress',
    targetTab: 'technical-prep',
    gradientHeaderClass: 'gradient-header-purple',
    gradientIconBg: '#614385',
  },
  {
    id: 'coding-prep',
    icon: '⚡',
    title: 'Coding Preparation',
    description: 'DSA Roadmap, Arrays, Strings, Trees, Graphs, SQL Practice.',
    progressPercent: 70,
    totalLessonsQuestions: '60 Lessons • 300+ Qs',
    difficulty: 'Hard',
    difficultyBadgeBg: 'danger',
    status: 'In Progress',
    targetTab: 'coding-round',
    gradientHeaderClass: 'gradient-header-amber',
    gradientIconBg: '#f7971e',
  },
  {
    id: 'leetcode-practice',
    icon: '🧩',
    title: 'LeetCode-style Practice',
    description: 'Daily Challenge, Company Problems, Online Code Editor, AI Code Review.',
    progressPercent: 50,
    totalLessonsQuestions: '150 Problems • Live IDE',
    difficulty: 'Hard',
    difficultyBadgeBg: 'dark',
    status: 'In Progress',
    targetTab: 'leetcode-practice',
    gradientHeaderClass: 'gradient-header-rose',
    gradientIconBg: '#e55d87',
  },
  {
    id: 'versant-prep',
    icon: '🎙️',
    title: 'Versant Preparation',
    description: 'Reading Aloud, Repeat Sentence, Pronunciation, Fluency, Mock Versant Test.',
    progressPercent: 30,
    totalLessonsQuestions: '12 Tests • Speech AI',
    difficulty: 'Intermediate',
    difficultyBadgeBg: 'secondary',
    status: 'In Progress',
    targetTab: 'versant-prep',
    gradientHeaderClass: 'gradient-header-indigo',
    gradientIconBg: '#3a1c71',
  },
  {
    id: 'hr-prep',
    icon: '👨‍💼',
    title: 'HR Interview Preparation',
    description: 'HR Questions, Behavioral Questions, Mock Interview, AI Feedback.',
    progressPercent: 100,
    totalLessonsQuestions: '20 Modules • AI Feedback',
    difficulty: 'Beginner',
    difficultyBadgeBg: 'success',
    status: 'Completed',
    targetTab: 'hr-prep',
    gradientHeaderClass: 'gradient-header-teal',
    gradientIconBg: '#11998e',
  },
  {
    id: 'gd-prep',
    icon: '👥',
    title: 'Group Discussion Preparation',
    description: 'GD Topics, Case Studies, AI Group Discussion Practice.',
    progressPercent: 20,
    totalLessonsQuestions: '15 Topics • Live AI Room',
    difficulty: 'Intermediate',
    difficultyBadgeBg: 'warning',
    status: 'In Progress',
    targetTab: 'gd-prep',
    gradientHeaderClass: 'gradient-header-sunset',
    gradientIconBg: '#ff512f',
  },
  {
    id: 'gamified-prep',
    icon: '🎮',
    title: 'Gamified Assessment',
    description: 'Memory Test, Pattern Recognition, Reaction Time, Cognitive Games.',
    progressPercent: 85,
    totalLessonsQuestions: '8 Mini-Games • Cognitive',
    difficulty: 'All Levels',
    difficultyBadgeBg: 'info',
    status: 'In Progress',
    targetTab: 'gamified-prep',
    gradientHeaderClass: 'gradient-header-cyan',
    gradientIconBg: '#00b4db',
  },
  {
    id: 'resume-prep',
    icon: '📄',
    title: 'Resume Preparation',
    description: 'ATS Resume Checker, Resume Builder, Resume Templates.',
    progressPercent: 100,
    totalLessonsQuestions: 'ATS Score • Builder',
    difficulty: 'All Levels',
    difficultyBadgeBg: 'success',
    status: 'Completed',
    targetTab: 'resume-analyzer',
    gradientHeaderClass: 'gradient-header-violet',
    gradientIconBg: '#8e2de2',
  },
  {
    id: 'study-planner',
    icon: '🤖',
    title: 'AI Study Planner',
    description: 'Personalized Roadmap, Daily Goals, Weak Topics, Recommended Resources.',
    progressPercent: 60,
    totalLessonsQuestions: 'Daily Roadmap • AI Goals',
    difficulty: 'Adaptive',
    difficultyBadgeBg: 'primary',
    status: 'In Progress',
    targetTab: 'study-planner',
    gradientHeaderClass: 'gradient-header-dark',
    gradientIconBg: '#232526',
  },
];

export const PlacementPrepPage: React.FC<PlacementPrepPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'In Progress' | 'Completed'>('All');

  // Filter cards
  const filteredCards = cardsData.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || card.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate overall stats
  const totalCards = cardsData.length;
  const completedCardsCount = cardsData.filter((c) => c.status === 'Completed').length;
  const averageProgress = Math.round(
    cardsData.reduce((acc, curr) => acc + curr.progressPercent, 0) / totalCards
  );

  return (
    <Container fluid className="px-0">
      {/* 1. Breadcrumb Header */}
      <div className="mb-4 bg-white p-3.5 rounded-3 shadow-xs border">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="fw-bold text-dark mb-1">Placement Preparation Hub</h2>
            <p className="text-muted mb-0 fs-7">
              Comprehensive recruitment readiness modules covering Company-wise patterns, Aptitude, Technical CS, Coding DSA, Versant, HR, and AI tools.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Filter Options */}
      <Row className="g-3 mb-4 align-items-center">
        <Col md={7} lg={8}>
          <InputGroup className="shadow-xs rounded-3 overflow-hidden">
            <InputGroup.Text className="bg-white border-end-0 pe-1">
              <i className="bi bi-search text-muted fs-6"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search preparation modules (Company, Aptitude, Technical, DSA, Versant, HR, LeetCode...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0 py-2.5 fs-7"
            />
            {searchTerm && (
              <Button variant="white" className="border border-start-0 text-muted" onClick={() => setSearchTerm('')}>
                <i className="bi bi-x-circle"></i>
              </Button>
            )}
          </InputGroup>
        </Col>

        <Col md={5} lg={4}>
          <div className="d-flex bg-white p-1 rounded-3 border shadow-xs">
            {(['All', 'In Progress', 'Completed'] as const).map((st) => (
              <Button
                key={st}
                variant={filterStatus === st ? 'primary' : 'light'}
                size="sm"
                className={`flex-grow-1 fw-bold fs-7 py-2 border-0 ${
                  filterStatus === st ? 'shadow-xs' : 'text-secondary'
                }`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      {/* 4. 3-Column Responsive Grid of Cards */}
      <Row className="g-4">
        {filteredCards.map((card) => (
          <Col key={card.id} md={6} lg={4}>
            <Card className="h-100 border-0 soft-shadow rounded-16 overflow-hidden hover-lift bg-white d-flex flex-column">
              {/* Gradient Decorative Header Banner */}
              <div className={`${card.gradientHeaderClass} py-2 px-3 d-flex justify-content-between align-items-center`}>
                <Badge bg="light" text="dark" className="fs-8 fw-semibold opacity-90">
                  {card.totalLessonsQuestions}
                </Badge>
                <Badge bg={card.difficultyBadgeBg as any} className="fs-8">
                  {card.difficulty}
                </Badge>
              </div>

              <Card.Body className="p-4 d-flex flex-column flex-grow-1">
                {/* Header with Large Colorful Icon & Title */}
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
                    style={{
                      width: '52px',
                      height: '52px',
                      fontSize: '28px',
                      backgroundColor: card.gradientIconBg,
                      minWidth: '52px',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-0 leading-snug">{card.title}</h5>
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-secondary fs-7 leading-relaxed mb-4 flex-grow-1">
                  {card.description}
                </p>

                {/* Progress Bar & Percentage */}
                <div className="mb-4 bg-light p-3 rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center fs-8 fw-bold mb-1.5">
                    <span className="text-muted">Module Completion</span>
                    <span className={card.progressPercent === 100 ? 'text-success' : 'text-primary'}>
                      {card.progressPercent}%
                    </span>
                  </div>
                  <ProgressBar
                    now={card.progressPercent}
                    variant={card.progressPercent === 100 ? 'success' : 'primary'}
                    style={{ height: '7px', borderRadius: '4px' }}
                  />
                </div>

                {/* Continue Button */}
                <Button
                  variant={card.progressPercent === 100 ? 'outline-success' : 'primary'}
                  className="w-100 fw-bold py-2.5 shadow-xs"
                  onClick={() => onNavigate && onNavigate(card.targetTab)}
                >
                  {card.progressPercent === 100 ? (
                    <>
                      <i className="bi bi-check-circle-fill me-1.5"></i> Review Completed Module
                    </>
                  ) : (
                    <>Continue Module</>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}

        {filteredCards.length === 0 && (
          <Col xs={12}>
            <div className="text-center py-5 bg-white rounded-16 border p-4">
              <i className="bi bi-search display-4 text-muted d-block mb-3"></i>
              <h5 className="fw-bold text-dark mb-1">No preparation modules found</h5>
              <p className="text-muted fs-7 mb-3">Try adjusting your search query or filter selection.</p>
              <Button variant="outline-primary" size="sm" onClick={() => { setSearchTerm(''); setFilterStatus('All'); }}>
                Reset Filters
              </Button>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
};
