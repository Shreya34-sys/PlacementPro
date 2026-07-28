import React from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (tab: string, jobId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || 'Alex Johnson';

  const recommendedCompanies = [
    {
      id: 'comp-1',
      name: 'Google',
      logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=80',
      role: 'Software Development Engineer',
      ctc: '28 - 45 LPA',
      difficulty: 'Hard',
      matchScore: '96%',
      tags: ['C++', 'Python', 'DS & Algo', 'System Design'],
    },
    {
      id: 'comp-2',
      name: 'Amazon',
      logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&auto=format&fit=crop&q=80',
      role: 'SDE-1 (AWS & Retail)',
      ctc: '22 - 32 LPA',
      difficulty: 'Hard',
      matchScore: '92%',
      tags: ['Java', 'Trees & Graphs', 'OOP', 'Leadership Principles'],
    },
    {
      id: 'comp-3',
      name: 'TCS Digital',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80',
      role: 'System Engineer Prime',
      ctc: '9 - 12 LPA',
      difficulty: 'Medium',
      matchScore: '98%',
      tags: ['Aptitude', 'SQL', 'Coding', 'English Communication'],
    },
    {
      id: 'comp-4',
      name: 'Razorpay',
      logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&auto=format&fit=crop&q=80',
      role: 'Frontend / Backend Engineer',
      ctc: '18 - 26 LPA',
      difficulty: 'Medium-Hard',
      matchScore: '90%',
      tags: ['React', 'Node.js', 'System Architecture', 'DB Design'],
    },
  ];

  const upcomingInterviews = [
    {
      id: 'int-1',
      company: 'Amazon Mock Interview',
      type: 'Technical & System Design',
      date: 'Today',
      time: '04:00 PM',
      duration: '45 mins',
      interviewer: 'AI Interviewer (Gemini Pro)',
      badgeVariant: 'warning',
    },
    {
      id: 'int-2',
      company: 'TCS Digital Mock Test',
      type: 'Aptitude & Coding Round',
      date: 'Tomorrow',
      time: '10:00 AM',
      duration: '90 mins',
      interviewer: 'Online Assessment Engine',
      badgeVariant: 'primary',
    },
    {
      id: 'int-3',
      company: 'Versant Voice Assessment',
      type: 'Spoken English & Communication',
      date: 'Aug 18, 2026',
      time: '02:30 PM',
      duration: '20 mins',
      interviewer: 'Automated Speech Evaluator',
      badgeVariant: 'info',
    },
  ];

  const aiRecommendations = [
    {
      id: 'ai-1',
      icon: '💡',
      category: 'Data Structures',
      title: 'Boost Dynamic Programming Speed',
      description: 'Your accuracy in DP problems is 62%. Practice 5 Memoization pattern questions to reach target threshold.',
      actionText: 'Practice DP Questions',
      tab: 'leetcode-practice',
    },
    {
      id: 'ai-2',
      icon: '🗣️',
      category: 'Communication',
      title: 'Complete Versant Voice Practice',
      description: 'Amazon and TCS require strong English fluency. Take a 15-minute voice assessment to evaluate pronunciation and fluency.',
      actionText: 'Start Versant Test',
      tab: 'versant-prep',
    },
    {
      id: 'ai-3',
      icon: '📄',
      category: 'Resume Analyzer',
      title: 'Optimize Resume for ATS Screening',
      description: 'Your ATS match score for SDE roles is 84%. Add "Microservices Architecture" and "Redis Caching" keywords.',
      actionText: 'Analyze Resume',
      tab: 'resume-analyzer',
    },
  ];

  return (
    <Container fluid className="px-3 px-lg-4 py-3">
      {/* 1. Welcome Card & 2. Continue Learning Row */}
      <Row className="g-3 mb-4">
        {/* 1. Welcome Card */}
        <Col lg={7} xl={8}>
          <Card className="border-0 shadow-sm rounded-16 text-white h-100 overflow-hidden position-relative" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)' }}>
            <Card.Body className="p-4 p-xl-5 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Badge bg="warning" text="dark" className="fw-bold px-2.5 py-1 text-uppercase fs-8 rounded-pill shadow-xs">
                    🎓 Student Placement Portal
                  </Badge>
                  <span className="fs-8 fw-semibold" style={{ color: '#cbd5e1' }}>CS & IT Engineering &bull; Batch 2026</span>
                </div>
                <h2 className="fw-extrabold mb-2 tracking-tight" style={{ color: '#ffffff' }}>
                  Welcome back, <span style={{ color: '#fef08a' }}>{userName}</span>! 👋
                </h2>
                <p className="fs-6 mb-4 max-w-2xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                  Your placement journey is on track. Focus today on <strong className="text-white">Dynamic Programming</strong> and <strong className="text-white">Mock Technical Interviews</strong> to boost your readiness score.
                </p>
              </div>

              <div className="d-flex flex-wrap gap-2.5 align-items-center pt-2">
                <Button
                  variant="light"
                  className="fw-bold text-primary px-3.5 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2"
                  onClick={() => onNavigate('placement-prep')}
                >
                  <i className="bi bi-play-circle-fill fs-6 text-primary"></i>
                  <span>Continue Learning Journey</span>
                </Button>
                <Button
                  variant="outline-light"
                  className="fw-semibold px-3.5 py-2 rounded-3 hover-bg-white-10 d-flex align-items-center gap-2"
                  onClick={() => onNavigate('ai-interview')}
                >
                  <i className="bi bi-robot fs-6"></i>
                  <span>Launch AI Mock Interview</span>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 2. Continue Learning Card */}
        <Col lg={5} xl={4}>
          <Card className="border-0 shadow-sm rounded-16 bg-white h-100 p-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold text-uppercase fs-8 tracking-wider text-muted">
                  📖 Continue Learning
                </span>
                <Badge bg="primary-subtle" text="primary" className="fw-bold px-2 py-1 fs-8 rounded-pill">
                  Module 4 of 6
                </Badge>
              </div>

              <h5 className="fw-bold text-dark mb-1">Data Structures & Algorithms</h5>
              <p className="text-secondary fs-7 mb-3">Graph Algorithms & Breadth-First Search (BFS)</p>

              <div className="mb-3 bg-light p-3 rounded-3 border">
                <div className="d-flex justify-content-between align-items-center fs-7 fw-semibold mb-1">
                  <span className="text-dark">Module Progress</span>
                  <span className="text-primary fw-extrabold">72%</span>
                </div>
                <ProgressBar now={72} variant="primary" style={{ height: '8px' }} className="rounded-pill" />
                <div className="d-flex justify-content-between align-items-center fs-8 text-muted mt-2">
                  <span>18 / 25 Topics Completed</span>
                  <span>Est. 45 mins left</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-100 fw-bold py-2 rounded-3 shadow-xs d-flex align-items-center justify-content-center gap-2"
              onClick={() => onNavigate('leetcode-practice')}
            >
              <span>Resume Lesson</span>
              <i className="bi bi-arrow-right"></i>
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 5. Overall Progress Row */}
      <Row className="g-3 mb-4">
        {/* Overall Progress */}
        <Col md={12}>
          <Card className="border-0 shadow-sm rounded-16 bg-white p-3.5 h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-4 leading-none">📈</span>
                <div>
                  <span className="fw-bold fs-8 tracking-wider text-uppercase text-muted d-block leading-none">Overall Progress</span>
                  <span className="fw-extrabold fs-5 text-primary leading-tight">78% Placement Ready</span>
                </div>
              </div>
              <Badge bg="success-subtle" text="success" className="fw-bold px-2.5 py-1 rounded-pill fs-8">
                Top Tier
              </Badge>
            </div>

            <div className="space-y-2 my-2">
              <div>
                <div className="d-flex justify-content-between fs-8 fw-medium text-dark mb-0.5">
                  <span>Coding & DS Algo</span>
                  <span className="fw-bold text-success">85%</span>
                </div>
                <ProgressBar now={85} variant="success" style={{ height: '6px' }} className="rounded-pill" />
              </div>
              <div>
                <div className="d-flex justify-content-between fs-8 fw-medium text-dark mb-0.5">
                  <span>Quantitative Aptitude</span>
                  <span className="fw-bold text-primary">80%</span>
                </div>
                <ProgressBar now={80} variant="primary" style={{ height: '6px' }} className="rounded-pill" />
              </div>
              <div>
                <div className="d-flex justify-content-between fs-8 fw-medium text-dark mb-0.5">
                  <span>Versant Communication</span>
                  <span className="fw-bold text-warning">75%</span>
                </div>
                <ProgressBar now={75} variant="warning" style={{ height: '6px' }} className="rounded-pill" />
              </div>
            </div>

            <Button
              variant="link"
              className="p-0 text-decoration-none fs-8 fw-bold text-primary text-start"
              onClick={() => onNavigate('analytics')}
            >
              View Detailed Analytics <i className="bi bi-arrow-right"></i>
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Main Grid: Left Column (8 cols) & Right Column (4 cols) */}
      <Row className="g-4">
        {/* Left Column */}
        <Col lg={8}>
          {/* 11. Quick Actions Grid */}
          <Card className="border-0 shadow-sm rounded-16 bg-white p-4 mb-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span className="fs-5">⚡</span>
              <span>Quick Actions</span>
            </h5>
            <Row className="g-2.5">
              <Col sm={6} md={4}>
                <Button
                  variant="light"
                  className="w-100 p-3 text-start border hover-shadow-sm rounded-12 transition-all d-flex align-items-center gap-3 bg-light hover-bg-primary-subtle group"
                  onClick={() => onNavigate('ai-interview')}
                >
                  <div className="bg-primary text-white rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-robot fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-7 mb-0">AI Mock Interview</div>
                    <small className="text-muted fs-8">Practice live audio/code</small>
                  </div>
                </Button>
              </Col>

              <Col sm={6} md={4}>
                <Button
                  variant="light"
                  className="w-100 p-3 text-start border hover-shadow-sm rounded-12 transition-all d-flex align-items-center gap-3 bg-light hover-bg-primary-subtle group"
                  onClick={() => onNavigate('leetcode-practice')}
                >
                  <div className="bg-success text-white rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-code-square fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-7 mb-0">LeetCode Arena</div>
                    <small className="text-muted fs-8">Top 150 DS Algo problems</small>
                  </div>
                </Button>
              </Col>

              <Col sm={6} md={4}>
                <Button
                  variant="light"
                  className="w-100 p-3 text-start border hover-shadow-sm rounded-12 transition-all d-flex align-items-center gap-3 bg-light hover-bg-primary-subtle group"
                  onClick={() => onNavigate('aptitude-test')}
                >
                  <div className="bg-warning text-dark rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-lightning-charge-fill fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-7 mb-0">Aptitude Test</div>
                    <small className="text-muted fs-8">Speed & logic practice</small>
                  </div>
                </Button>
              </Col>

              <Col sm={6} md={4}>
                <Button
                  variant="light"
                  className="w-100 p-3 text-start border hover-shadow-sm rounded-12 transition-all d-flex align-items-center gap-3 bg-light hover-bg-primary-subtle group"
                  onClick={() => onNavigate('resume-analyzer')}
                >
                  <div className="bg-indigo text-white rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', backgroundColor: '#6610f2' }}>
                    <i className="bi bi-file-earmark-person fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-7 mb-0">Resume AI Analyzer</div>
                    <small className="text-muted fs-8">Check ATS match score</small>
                  </div>
                </Button>
              </Col>

              <Col sm={6} md={4}>
                <Button
                  variant="light"
                  className="w-100 p-3 text-start border hover-shadow-sm rounded-12 transition-all d-flex align-items-center gap-3 bg-light hover-bg-primary-subtle group"
                  onClick={() => onNavigate('versant-prep')}
                >
                  <div className="bg-info text-white rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-mic-fill fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-7 mb-0">Versant Voice Test</div>
                    <small className="text-muted fs-8">Speech & communication</small>
                  </div>
                </Button>
              </Col>

              <Col sm={6} md={4}>
                <Button
                  variant="light"
                  className="w-100 p-3 text-start border hover-shadow-sm rounded-12 transition-all d-flex align-items-center gap-3 bg-light hover-bg-primary-subtle group"
                  onClick={() => onNavigate('company-prep')}
                >
                  <div className="bg-teal text-white rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', backgroundColor: '#20c997' }}>
                    <i className="bi bi-building fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark fs-7 mb-0">Company Question Bank</div>
                    <small className="text-muted fs-8">Target Amazon, TCS, Google</small>
                  </div>
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 9. AI Recommendations */}
          <Card className="border-0 shadow-sm rounded-16 bg-white p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <span className="fs-5">🤖</span>
                <span>AI Recommendations for You</span>
              </h5>
              <Badge bg="primary-subtle" text="primary" className="fw-bold px-2.5 py-1 rounded-pill fs-8">
                Updated Live
              </Badge>
            </div>

            <div className="space-y-3">
              {aiRecommendations.map((item) => (
                <div key={item.id} className="p-3 bg-light rounded-12 border transition-all hover-border-primary">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-3">
                      <span className="fs-3 leading-none p-1.5 bg-white rounded-3 border shadow-xs">{item.icon}</span>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Badge bg="secondary" className="fs-8 fw-semibold">{item.category}</Badge>
                          <h6 className="fw-bold text-dark mb-0">{item.title}</h6>
                        </div>
                        <p className="text-secondary fs-7 mb-0 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="fw-bold text-nowrap rounded-3 px-3 py-1.5 fs-8"
                      onClick={() => onNavigate(item.tab)}
                    >
                      {item.actionText} &rarr;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 8. Recommended Companies */}
          <Card className="border-0 shadow-sm rounded-16 bg-white p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <span className="fs-5">🏢</span>
                  <span>Recommended Companies for Placement</span>
                </h5>
                <p className="text-muted fs-7 mb-0">Curated target companies matching your skill profile and CGPA.</p>
              </div>
              <Button variant="link" className="p-0 text-decoration-none fw-bold fs-7 text-primary" onClick={() => onNavigate('companies')}>
                View All Companies &rarr;
              </Button>
            </div>

            <Row className="g-3">
              {recommendedCompanies.map((comp) => (
                <Col md={6} key={comp.id}>
                  <Card className="border rounded-12 h-100 p-3 hover-shadow-sm transition-all bg-white">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2.5">
                        <img
                          src={comp.logo}
                          alt={comp.name}
                          className="rounded-3 border"
                          width="40"
                          height="40"
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="fw-bold text-dark mb-0">{comp.name}</h6>
                          <small className="text-muted fs-8">{comp.role}</small>
                        </div>
                      </div>
                      <Badge bg="success-subtle" text="success" className="fw-bold px-2 py-1 fs-8 rounded-pill">
                        {comp.matchScore} Match
                      </Badge>
                    </div>

                    <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded-3 mb-2.5 fs-8">
                      <span className="text-muted">Target CTC: <strong className="text-dark">{comp.ctc}</strong></span>
                      <span className="text-muted">Difficulty: <strong className="text-warning">{comp.difficulty}</strong></span>
                    </div>

                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {comp.tags.map((tag, idx) => (
                        <span key={idx} className="badge bg-secondary bg-opacity-10 text-secondary border fs-8">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100 fw-bold py-1.5 rounded-3 fs-8"
                      onClick={() => onNavigate('company-prep')}
                    >
                      Start {comp.name} Prep Kit
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* 7. Upcoming Interviews */}
          <Card className="border-0 shadow-sm rounded-16 bg-white p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <span className="fs-5">📅</span>
                <span>Upcoming Interviews</span>
              </h5>
              <Badge bg="primary" className="rounded-pill fs-8">
                {upcomingInterviews.length} Scheduled
              </Badge>
            </div>

            <div className="space-y-3">
              {upcomingInterviews.map((item) => (
                <div key={item.id} className="p-3 bg-light rounded-12 border">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg={item.badgeVariant} className="fw-semibold fs-8">
                      {item.date} &bull; {item.time}
                    </Badge>
                    <small className="text-muted fs-8">{item.duration}</small>
                  </div>

                  <h6 className="fw-bold text-dark mb-1">{item.company}</h6>
                  <p className="text-secondary fs-8 mb-2">{item.type}</p>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                    <small className="text-muted fs-8">
                      <i className="bi bi-person-workspace me-1"></i> {item.interviewer}
                    </small>
                    <Button
                      variant="primary"
                      size="sm"
                      className="fw-bold py-1 px-2.5 fs-8 rounded-3"
                      onClick={() => onNavigate('ai-interview')}
                    >
                      Join Room
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Practice Summary Widget */}
          <Card className="border-0 shadow-sm rounded-16 bg-dark text-white p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-4">🎯</span>
              <div>
                <h6 className="fw-bold text-white mb-0">Placement Readiness Tip</h6>
                <small className="text-white-50 fs-8">Based on 2026 hiring patterns</small>
              </div>
            </div>

            <p className="fs-7 text-white-50 leading-relaxed mb-3">
              Top tech companies evaluate both problem-solving speed and clear articulation of system architecture. Take at least 2 AI mock interviews weekly to build confidence.
            </p>

            <Button
              variant="outline-light"
              size="sm"
              className="w-100 fw-bold py-2 rounded-3"
              onClick={() => onNavigate('placement-prep')}
            >
              Explore Full Placement Syllabus
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
