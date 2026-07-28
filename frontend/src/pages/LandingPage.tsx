import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Accordion, Nav } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, setRole } = useAuth();
  const [isAnnualBilling, setIsAnnualBilling] = useState(true);

  const companyLogos = [
    { name: 'Google', icon: 'bi-google', color: '#4285F4' },
    { name: 'Microsoft', icon: 'bi-microsoft', color: '#00A4EF' },
    { name: 'Amazon', icon: 'bi-box-seam-fill', color: '#FF9900' },
    { name: 'TCS', icon: 'bi-building-fill', color: '#2563EB' },
    { name: 'Infosys', icon: 'bi-cpu-fill', color: '#0284C7' },
    { name: 'Accenture', icon: 'bi-slash-square-fill', color: '#A855F7' },
    { name: 'Wipro', icon: 'bi-globe2', color: '#10B981' },
    { name: 'Deloitte', icon: 'bi-check-circle-fill', color: '#84CC16' },
    { name: 'Cognizant', icon: 'bi-layers-fill', color: '#06B6D4' },
  ];

  const featuresList = [
    {
      id: 'company-prep',
      title: 'Company-wise Preparation',
      description: 'Dedicated test series & interview experience archives for 250+ top tech & product companies.',
      icon: 'bi-buildings-fill',
      color: 'bg-primary-subtle text-primary',
      badge: '250+ Companies',
    },
    {
      id: 'aptitude-test',
      title: 'Aptitude Practice',
      description: 'Comprehensive Quantitative, Logical Reasoning, and Verbal ability modules with timed mock tests.',
      icon: 'bi-calculator-fill',
      color: 'bg-info-subtle text-info',
      badge: '5,000+ Qs',
    },
    {
      id: 'technical-prep',
      title: 'Technical Preparation',
      description: 'Core CS fundamentals including Data Structures, Algorithms, DBMS, OS, Computer Networks, and OOPs.',
      icon: 'bi-code-slash',
      color: 'bg-warning-subtle text-warning',
      badge: 'Core CS',
    },
    {
      id: 'leetcode-practice',
      title: 'Coding Practice (LeetCode-style)',
      description: 'Interactive browser IDE with multi-language compiler support, test cases, and editorial solutions.',
      icon: 'bi-terminal-fill',
      color: 'bg-success-subtle text-success',
      badge: 'LeetCode Pattern',
    },
    {
      id: 'versant-prep',
      title: 'Versant & Communication Prep',
      description: 'Voice-based communication testing for accent training, sentence repetition, and fluency scores.',
      icon: 'bi-mic-fill',
      color: 'bg-danger-subtle text-danger',
      badge: 'AI Speech AI',
    },
    {
      id: 'hr-prep',
      title: 'HR Interview Preparation',
      description: 'STAR framework response builder, behavioral questions, situational answers, and salary negotiation.',
      icon: 'bi-person-badge-fill',
      color: 'bg-purple-subtle text-purple',
      badge: 'STAR Method',
    },
    {
      id: 'gd-prep',
      title: 'Group Discussion Prep',
      description: 'Trending GD topics, opening/closing statements, counter-point strategies, and speech etiquette.',
      icon: 'bi-chat-square-quote-fill',
      color: 'bg-teal-subtle text-teal',
      badge: '100+ Topics',
    },
    {
      id: 'gamified-prep',
      title: 'Gamified Assessments',
      description: 'Cognitive reasoning games, speed math challenges, memory grids, and pattern recognition tests.',
      icon: 'bi-controller',
      color: 'bg-pink-subtle text-pink',
      badge: 'Gamified',
    },
    {
      id: 'resume-analyzer',
      title: 'Resume Analyzer',
      description: 'Instant ATS compatibility score, keyword gap analysis, and tailored bullet-point recommendations.',
      icon: 'bi-file-earmark-person-fill',
      color: 'bg-indigo-subtle text-indigo',
      badge: 'ATS Scan',
    },
    {
      id: 'ai-interview',
      title: 'AI Mock Interview',
      description: 'Real-time camera & speech AI avatar interviewer offering granular technical and body language feedback.',
      icon: 'bi-robot',
      color: 'bg-primary-subtle text-primary',
      badge: 'Real-time AI',
    },
    {
      id: 'study-planner',
      title: 'AI Study Planner',
      description: 'Personalized study roadmaps tailored to your target company, remaining timeline, and skill gaps.',
      icon: 'bi-calendar-event-fill',
      color: 'bg-amber-subtle text-amber',
      badge: 'Smart Calendar',
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Detailed performance breakdown, accuracy trends, speed metrics, and peer leaderboard rankings.',
      icon: 'bi-graph-up-arrow',
      color: 'bg-emerald-subtle text-emerald',
      badge: 'Real-time Stats',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Create Account',
      description: 'Sign up in seconds using your student or college email to personalize your target goals.',
      icon: 'bi-person-plus-fill',
    },
    {
      step: '02',
      title: 'Select Company',
      description: 'Choose your dream recruiters like Amazon, Google, TCS, or Infosys for custom test series.',
      icon: 'bi-buildings',
    },
    {
      step: '03',
      title: 'Practice & Learn',
      description: 'Solve aptitude sets, practice LeetCode coding problems, and take AI mock voice interviews.',
      icon: 'bi-laptop',
    },
    {
      step: '04',
      title: 'Track Progress',
      description: 'Monitor daily streak heatmaps, AI readiness scores, and detailed topic-wise accuracy analytics.',
      icon: 'bi-bar-chart-line-fill',
    },
    {
      step: '05',
      title: 'Crack Your Placement',
      description: 'Walk into your campus drive with 100% confidence and land high-paying offer letters.',
      icon: 'bi-trophy-fill',
    },
  ];

  const testimonials = [
    {
      name: 'Aarav Sharma',
      role: 'Placed at Amazon (SDE-1)',
      college: 'IIT Delhi',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
      text: 'PlacementPro was a complete game-changer for my Amazon interview. The AI Mock Interview pointed out my weak areas in System Design and DSA edge cases!',
      rating: 5,
    },
    {
      name: 'Ananya Verma',
      role: 'Placed at TCS Digital (7.5 LPA)',
      college: 'VIT Vellore',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      text: 'The company-wise test series and Versant speech training made TCS NQT feel like a breeze. The daily streak heatmap kept me motivated for 60 straight days!',
      rating: 5,
    },
    {
      name: 'Rohan Mehta',
      role: 'Placed at Deloitte (Consultant)',
      college: 'SRM Institute of Tech',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      text: 'The Resume Analyzer fixed my ATS score from 58% to 92%. I started getting interview shortlists immediately from Deloitte and Accenture!',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Is PlacementPro free for students?',
      answer: 'Yes! We offer a rich Free Tier that includes daily aptitude sets, core CS theory notes, coding challenges, and basic analytics. Upgrade to Pro for unlimited AI mock interviews and full company test series.',
    },
    {
      question: 'How accurate is the AI Interview scoring?',
      answer: 'Our AI Mock Interview system evaluates technical correctness, keyword coverage, articulation speed, confidence tone, and STAR framework responses against real recruiter rubrics used by Fortune 500 tech firms.',
    },
    {
      question: 'Does PlacementPro support company-specific test patterns?',
      answer: 'Absolutely. We curate test series and pattern-based mock rounds for 250+ companies including TCS NQT, Infosys Specialist Programmer, Accenture Cognitive, Cognizant GenC, Amazon SDE, and Deloitte.',
    },
    {
      question: 'Can colleges and TPO cells use PlacementPro for campus drives?',
      answer: 'Yes! PlacementPro includes a dedicated TPO / Admin view that allows colleges to manage drive registrations, monitor student readiness analytics, shortlist candidates, and schedule campus interviews.',
    },
    {
      question: 'Can I track my daily practice streak?',
      answer: 'Yes, PlacementPro includes a GitHub/LeetCode-style daily practice heatmap that records every quiz solved, code submitted, or interview completed to ensure consistent preparation habits.',
    },
  ];

  return (
    <div className="bg-light min-vh-100 text-dark transition-all">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom shadow-xs py-3">
        <Container fluid className="px-3 px-lg-5">
          <a
            className="navbar-brand d-flex align-items-center fw-extrabold fs-4 text-primary me-4"
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div
              className="bg-primary text-white rounded-3 p-1.5 d-flex align-items-center justify-content-center me-2"
              style={{ width: '36px', height: '36px' }}
            >
              <i className="bi bi-briefcase-fill fs-5"></i>
            </div>
            <span className="tracking-tight">Placement<span className="text-dark fw-bold">Pro</span></span>
          </a>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Theme Toggle Button */}
            <Button
              variant="light"
              size="sm"
              onClick={toggleTheme}
              className="border shadow-xs d-flex align-items-center justify-content-center text-secondary hover-bg-gray"
              style={{ width: '38px', height: '38px', borderRadius: '10px' }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-indigo'} fs-6`}></i>
            </Button>

            <Nav className="d-none d-md-flex align-items-center gap-2 me-2">
              <Nav.Link href="#features" className="fw-semibold text-secondary hover-text-dark fs-7 px-3">
                Features
              </Nav.Link>
              <Nav.Link href="#how-it-works" className="fw-semibold text-secondary hover-text-dark fs-7 px-3">
                How It Works
              </Nav.Link>
              <Nav.Link href="#pricing" className="fw-semibold text-secondary hover-text-dark fs-7 px-3">
                Pricing
              </Nav.Link>
              <Nav.Link href="#faq" className="fw-semibold text-secondary hover-text-dark fs-7 px-3">
                FAQ
              </Nav.Link>
            </Nav>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onNavigate('login')}
              className="fw-bold px-3 py-2 rounded-3"
            >
              Log In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="fw-bold px-3 py-2 rounded-3 shadow-xs"
            >
              Go to App <i className="bi bi-arrow-right ms-1"></i>
            </Button>
          </div>
        </Container>
      </nav>

      {/* 1. Hero Section */}
      <section id="hero" className="py-5 py-lg-6 position-relative overflow-hidden bg-white border-bottom">
        <Container className="py-4">
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <div className="pe-lg-3">
                <Badge bg="primary-subtle" text="primary" className="fw-bold px-3 py-2 rounded-pill fs-8 mb-3 d-inline-flex align-items-center gap-1.5 shadow-xs">
                  <span className="badge bg-primary rounded-circle p-1"> </span>
                  <span>Trusted by 50,000+ Students Across 400+ Engineering Colleges</span>
                </Badge>

                <h1 className="display-4 fw-extrabold tracking-tight text-dark mb-3 leading-tight">
                  Your Complete Campus <span className="text-primary">Placement Prep</span> Platform
                </h1>

                <p className="lead text-secondary fs-6 mb-4">
                  Master aptitude tests, company-wise coding challenges, Versant English speech training, ATS resume optimization, and real-time AI mock interviews in one integrated SaaS ecosystem.
                </p>

                <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => onNavigate('dashboard')}
                    className="fw-bold px-4 py-3 rounded-16 shadow-sm hover-lift d-flex align-items-center gap-2"
                  >
                    <span>Get Started Free</span>
                    <i className="bi bi-arrow-right-short fs-4"></i>
                  </Button>

                  <Button
                    variant="outline-secondary"
                    size="lg"
                    href="#features"
                    className="fw-bold px-4 py-3 rounded-16 hover-lift d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-play-circle-fill text-primary"></i>
                    <span>Explore Features</span>
                  </Button>
                </div>

                <div className="d-flex align-items-center gap-4 text-muted fs-8 fw-semibold pt-2 border-top">
                  <div className="d-flex align-items-center gap-1.5">
                    <i className="bi bi-check-circle-fill text-success fs-7"></i> No credit card required
                  </div>
                  <div className="d-flex align-items-center gap-1.5">
                    <i className="bi bi-check-circle-fill text-success fs-7"></i> 250+ Company patterns
                  </div>
                  <div className="d-flex align-items-center gap-1.5">
                    <i className="bi bi-check-circle-fill text-success fs-7"></i> Instant AI scoring
                  </div>
                </div>
              </div>
            </Col>

            {/* Hero Visual Mockup */}
            <Col lg={6}>
              <div className="position-relative">
                {/* Main Glassmorphic Dashboard Card */}
                <Card className="border-0 shadow-lg rounded-16 overflow-hidden bg-dark text-white p-2">
                  <div className="bg-secondary bg-opacity-25 p-2 px-3 rounded-3 d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="rounded-circle bg-danger p-1 d-inline-block" style={{ width: '10px', height: '10px' }}></span>
                      <span className="rounded-circle bg-warning p-1 d-inline-block" style={{ width: '10px', height: '10px' }}></span>
                      <span className="rounded-circle bg-success p-1 d-inline-block" style={{ width: '10px', height: '10px' }}></span>
                      <span className="ms-2 fs-8 text-white-50 font-monospace">placementpro.ai/dashboard</span>
                    </div>
                    <Badge bg="success" className="px-2 py-1 fs-8">● AI Live</Badge>
                  </div>

                  <div className="p-3 bg-black bg-opacity-40 rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold mb-0 text-white fs-7">Target: TCS Digital / Amazon SDE-1</h6>
                        <small className="text-white-50 fs-8">Preparation Readiness Index</small>
                      </div>
                      <Badge bg="primary" className="fw-bold px-2.5 py-1.5 fs-8">92% Ready</Badge>
                    </div>

                    {/* Progress Stats inside mockup */}
                    <Row className="g-2 mb-3">
                      <Col xs={4}>
                        <div className="bg-white bg-opacity-10 p-2 rounded-3 text-center">
                          <span className="fs-8 text-white-50 d-block">Streak</span>
                          <span className="fw-extrabold text-warning fs-6">🔥 14 Days</span>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="bg-white bg-opacity-10 p-2 rounded-3 text-center">
                          <span className="fs-8 text-white-50 d-block">Solved</span>
                          <span className="fw-extrabold text-info fs-6">⚡ 184 Qs</span>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="bg-white bg-opacity-10 p-2 rounded-3 text-center">
                          <span className="fs-8 text-white-50 d-block">AI Score</span>
                          <span className="fw-extrabold text-success fs-6">🎯 88/100</span>
                        </div>
                      </Col>
                    </Row>

                    {/* Mock Code & Speech Box */}
                    <div className="p-2.5 bg-dark border border-secondary rounded-3 fs-8 font-monospace text-success-subtle mb-2">
                      <div className="text-info-subtle mb-1">// AI Interviewer Voice Feedback</div>
                      <div>"Your explanation of Dijkstra's algorithm time complexity (O(E log V)) was concise and accurate."</div>
                    </div>
                  </div>
                </Card>

                {/* Floating Badge 1 - Top Right */}
                <div className="position-absolute top-0 end-0 translate-middle-y me-n3 mt-3 d-none d-sm-block">
                  <Card className="border-0 shadow-lg rounded-16 bg-white p-2.5 text-dark soft-shadow hover-lift">
                    <div className="d-flex align-items-center gap-2.5">
                      <div className="bg-success-subtle text-success p-2 rounded-circle fs-5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-patch-check-fill"></i>
                      </div>
                      <div>
                        <div className="fw-extrabold fs-7 text-dark mb-0">Placed at Amazon</div>
                        <small className="text-muted fs-8">28 LPA Package Cleared</small>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Floating Badge 2 - Bottom Left */}
                <div className="position-absolute bottom-0 start-0 translate-middle-y ms-n3 mb-n2 d-none d-sm-block">
                  <Card className="border-0 shadow-lg rounded-16 bg-white p-2.5 text-dark soft-shadow hover-lift">
                    <div className="d-flex align-items-center gap-2.5">
                      <div className="bg-primary-subtle text-primary p-2 rounded-circle fs-5 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-robot"></i>
                      </div>
                      <div>
                        <div className="fw-bold fs-7 text-dark mb-0">AI Speech Interview</div>
                        <small className="text-success fw-bold fs-8">Grammar & Fluency: 96%</small>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 2. Trusted By Section */}
      <section className="py-4 border-bottom bg-white">
        <Container>
          <div className="text-center mb-3">
            <small className="text-uppercase fw-bold text-muted tracking-wider fs-8">
              Targeted Preparation Patterns for Premier Recruiters
            </small>
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-between gap-4 py-2">
            {companyLogos.map((comp, idx) => (
              <div key={idx} className="d-flex align-items-center gap-2 text-secondary opacity-75 hover-opacity-100 transition-all cursor-pointer">
                <i className={`bi ${comp.icon} fs-4`} style={{ color: comp.color }}></i>
                <span className="fw-bold fs-6 tracking-tight text-dark">{comp.name}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-5 py-lg-6">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-5">
            <Badge bg="primary-subtle" text="primary" className="fw-bold px-3 py-1.5 rounded-pill fs-8 mb-2">
              Comprehensive Suite
            </Badge>
            <h2 className="fw-extrabold display-6 text-dark tracking-tight mb-3">
              Everything You Need to Crack Your Dream Placement
            </h2>
            <p className="text-secondary fs-6">
              12 powerful preparation modules built specifically for engineering & CS campus placement drives.
            </p>
          </div>

          <Row className="g-4">
            {featuresList.map((feat) => (
              <Col key={feat.id} md={6} lg={4}>
                <Card
                  className="h-100 border-0 shadow-xs rounded-16 p-3.5 bg-white hover-lift cursor-pointer"
                  onClick={() => onNavigate(feat.id)}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className={`p-2.5 rounded-3 fs-4 d-flex align-items-center justify-content-center ${feat.color}`} style={{ width: '48px', height: '48px' }}>
                      <i className={`bi ${feat.icon}`}></i>
                    </div>
                    <Badge bg="light" text="dark" className="border fw-semibold fs-8 px-2.5 py-1">
                      {feat.badge}
                    </Badge>
                  </div>

                  <h5 className="fw-bold text-dark mb-2 fs-6">{feat.title}</h5>
                  <p className="text-secondary fs-7 mb-3 flex-grow-1 leading-relaxed">
                    {feat.description}
                  </p>

                  <div className="d-flex align-items-center text-primary fw-bold fs-7 hover-underline">
                    <span>Practice Now</span>
                    <i className="bi bi-chevron-right ms-1 fs-8"></i>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-5 py-lg-6 bg-white border-top border-bottom">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-5">
            <Badge bg="info-subtle" text="info" className="fw-bold px-3 py-1.5 rounded-pill fs-8 mb-2">
              Simple Step-by-Step Flow
            </Badge>
            <h2 className="fw-extrabold display-6 text-dark tracking-tight mb-3">
              How PlacementPro Delivers Results
            </h2>
            <p className="text-secondary fs-6">
              A structured 5-step roadmap engineered to maximize student conversion in placement drives.
            </p>
          </div>

          <Row className="g-4 justify-content-center">
            {workflowSteps.map((s, idx) => (
              <Col key={idx} xs={12} sm={6} lg={2} className="flex-grow-1" style={{ minWidth: '200px' }}>
                <Card className="h-100 border-0 shadow-xs rounded-16 p-3 bg-light text-center hover-lift position-relative">
                  <div className="fw-black display-6 text-primary text-opacity-25 mb-1">{s.step}</div>
                  <div className="bg-primary text-white rounded-circle mx-auto p-2 mb-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className={`bi ${s.icon} fs-6`}></i>
                  </div>
                  <h6 className="fw-bold text-dark fs-7 mb-1.5">{s.title}</h6>
                  <p className="text-muted fs-8 mb-0 leading-normal">{s.description}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>



      {/* 7. Student Testimonials Section */}
      <section className="py-5 py-lg-6 bg-white border-bottom">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-5">
            <Badge bg="success-subtle" text="success" className="fw-bold px-3 py-1.5 rounded-pill fs-8 mb-2">
              Success Stories
            </Badge>
            <h2 className="fw-extrabold display-6 text-dark tracking-tight mb-3">
              Loved by Students & TPOs Nationwide
            </h2>
            <p className="text-secondary fs-6">
              Hear how PlacementPro helped students crack top software packages.
            </p>
          </div>

          <Row className="g-4">
            {testimonials.map((t, idx) => (
              <Col key={idx} md={4}>
                <Card className="h-100 border-0 shadow-xs rounded-16 p-4 bg-light hover-lift d-flex flex-column">
                  <div className="d-flex text-warning mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <i key={i} className="bi bi-star-fill me-1"></i>
                    ))}
                  </div>

                  <p className="text-dark fs-7 flex-grow-1 leading-relaxed italic mb-4">
                    "{t.text}"
                  </p>

                  <div className="d-flex align-items-center gap-3 pt-3 border-top">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="rounded-circle border"
                      width="48"
                      height="48"
                      style={{ objectFit: 'cover' }}
                    />
                    <div>
                      <h6 className="fw-bold text-dark mb-0 fs-7">{t.name}</h6>
                      <span className="text-primary fw-semibold fs-8 d-block">{t.role}</span>
                      <small className="text-muted fs-8">{t.college}</small>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* 8. Pricing Section */}
      <section id="pricing" className="py-5 py-lg-6">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-5">
            <Badge bg="primary-subtle" text="primary" className="fw-bold px-3 py-1.5 rounded-pill fs-8 mb-2">
              Transparent Pricing
            </Badge>
            <h2 className="fw-extrabold display-6 text-dark tracking-tight mb-3">
              Invest in Your Placement Career
            </h2>
            <p className="text-secondary fs-6 mb-4">
              Get started for free or unlock unlimited AI mock interviews & company test series.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="d-inline-flex align-items-center gap-3 bg-white p-2 rounded-pill border shadow-xs">
              <span className={`fs-7 fw-bold ${!isAnnualBilling ? 'text-primary' : 'text-muted'}`}>Monthly</span>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input cursor-pointer"
                  type="checkbox"
                  role="switch"
                  id="billingSwitch"
                  checked={isAnnualBilling}
                  onChange={(e) => setIsAnnualBilling(e.target.checked)}
                  style={{ width: '2.5em', height: '1.25em' }}
                />
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className={`fs-7 fw-bold ${isAnnualBilling ? 'text-primary' : 'text-muted'}`}>Annual</span>
                <Badge bg="success-subtle" text="success" className="fw-bold fs-8 rounded-pill">Save 40%</Badge>
              </div>
            </div>
          </div>

          <Row className="g-4 align-items-stretch justify-content-center">
            {/* Free Plan */}
            <Col md={4}>
              <Card className="h-100 border-0 shadow-xs rounded-16 p-4 bg-white hover-lift d-flex flex-column">
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">Free Tier</h5>
                  <small className="text-muted fs-8">Essential preparation for all students</small>
                </div>

                <div className="mb-4">
                  <span className="display-5 fw-extrabold text-dark">₹0</span>
                  <span className="text-muted fs-8"> / forever</span>
                </div>

                <ul className="list-unstyled flex-grow-1 fs-7 mb-4">
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>50 Daily Aptitude Questions</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Core CS Theory Study Notes</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>LeetCode Easy Coding Challenges</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2 text-muted">
                    <i className="bi bi-x-circle text-muted"></i>
                    <span className="text-decoration-line-through">AI Mock Voice Interviews</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2 text-muted">
                    <i className="bi bi-x-circle text-muted"></i>
                    <span className="text-decoration-line-through">Company Test Series Archives</span>
                  </li>
                </ul>

                <Button
                  variant="outline-primary"
                  className="w-100 fw-bold py-2.5 rounded-16"
                  onClick={() => onNavigate('dashboard')}
                >
                  Start Free
                </Button>
              </Card>
            </Col>

            {/* Pro Plan (Featured) */}
            <Col md={4}>
              <Card className="h-100 border-2 border-primary shadow-lg rounded-16 p-4 bg-white hover-lift d-flex flex-column position-relative">
                <Badge bg="primary" className="position-absolute top-0 end-0 m-3 px-3 py-1.5 fs-8 rounded-pill fw-bold">
                  ★ MOST POPULAR
                </Badge>

                <div className="mb-3">
                  <h5 className="fw-bold text-primary mb-1">PlacementPro Pass</h5>
                  <small className="text-muted fs-8">Complete AI preparation suite</small>
                </div>

                <div className="mb-4">
                  <span className="display-5 fw-extrabold text-dark">
                    {isAnnualBilling ? '₹199' : '₹499'}
                  </span>
                  <span className="text-muted fs-8"> / month {isAnnualBilling ? '(billed annually)' : ''}</span>
                </div>

                <ul className="list-unstyled flex-grow-1 fs-7 mb-4">
                  <li className="mb-2.5 d-flex align-items-center gap-2 fw-semibold">
                    <i className="bi bi-check-circle-fill text-primary"></i>
                    <span>Unlimited AI Mock Interviews</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2 fw-semibold">
                    <i className="bi bi-check-circle-fill text-primary"></i>
                    <span>250+ Full Company Test Series</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-primary"></i>
                    <span>Versant English Voice Coaching</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-primary"></i>
                    <span>ATS Resume Analyzer & Fixer</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-primary"></i>
                    <span>Personalized AI Study Planner</span>
                  </li>
                </ul>

                <Button
                  variant="primary"
                  className="w-100 fw-bold py-2.5 rounded-16 shadow-xs"
                  onClick={() => onNavigate('dashboard')}
                >
                  Get Pro Access Now
                </Button>
              </Card>
            </Col>

            {/* College / Enterprise Plan */}
            <Col md={4}>
              <Card className="h-100 border-0 shadow-xs rounded-16 p-4 bg-white hover-lift d-flex flex-column">
                <div className="mb-3">
                  <h5 className="fw-bold text-dark mb-1">Campus / TPO Cell</h5>
                  <small className="text-muted fs-8">For Colleges & Universities</small>
                </div>

                <div className="mb-4">
                  <span className="display-5 fw-extrabold text-dark">Custom</span>
                  <span className="text-muted fs-8"> / campus license</span>
                </div>

                <ul className="list-unstyled flex-grow-1 fs-7 mb-4">
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>TPO Placement Admin Center</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Batch Readiness Analytics</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Custom College Assessment Creation</span>
                  </li>
                  <li className="mb-2.5 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Drive Schedule & Student Shortlists</span>
                  </li>
                </ul>

                <Button
                  variant="outline-dark"
                  className="w-100 fw-bold py-2.5 rounded-16"
                  onClick={() => {
                    setRole('tpo');
                    onNavigate('dashboard');
                  }}
                >
                  Request Campus Demo
                </Button>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 9. FAQ Section */}
      <section id="faq" className="py-5 py-lg-6 bg-white border-top border-bottom">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-5">
            <Badge bg="secondary-subtle" text="dark" className="fw-bold px-3 py-1.5 rounded-pill fs-8 mb-2">
              Got Questions?
            </Badge>
            <h2 className="fw-extrabold display-6 text-dark tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-secondary fs-6">
              Find answers to common queries about PlacementPro features and plans.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion defaultActiveKey="0" className="shadow-xs rounded-16 overflow-hidden">
              {faqs.map((faq, idx) => (
                <Accordion.Item key={idx} eventKey={String(idx)} className="border-bottom">
                  <Accordion.Header className="fw-bold text-dark py-1">
                    <span className="fs-6">{faq.question}</span>
                  </Accordion.Header>
                  <Accordion.Body className="text-secondary fs-7 leading-relaxed bg-light">
                    {faq.answer}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        </Container>
      </section>

      {/* 10. Final CTA Section */}
      <section className="py-6 bg-primary text-white position-relative overflow-hidden">
        <Container className="text-center position-relative py-4">
          <Badge bg="light" text="primary" className="fw-bold px-3 py-1.5 rounded-pill fs-8 mb-3 shadow-xs">
            🚀 Ready to Get Placed?
          </Badge>
          <h2 className="display-5 fw-black text-white tracking-tight mb-3">
            Start Your Placement Journey Today
          </h2>
          <p className="lead text-white-50 max-w-2xl mx-auto mb-4 fs-6">
            Join 50,000+ students practicing daily to crack TCS, Infosys, Amazon, Deloitte, and top global recruiters.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Button
              variant="light"
              size="lg"
              onClick={() => onNavigate('dashboard')}
              className="fw-bold text-primary px-4 py-3 rounded-16 shadow-md hover-lift"
            >
              Get Started Free Now <i className="bi bi-arrow-right-short fs-4 ms-1"></i>
            </Button>
            <Button
              variant="outline-light"
              size="lg"
              onClick={() => {
                setRole('tpo');
                onNavigate('dashboard');
              }}
              className="fw-bold px-4 py-3 rounded-16 hover-lift"
            >
              Talk to TPO Coordinator
            </Button>
          </div>
        </Container>
      </section>

      {/* 11. Footer Section */}
      <footer className="bg-dark text-white pt-5 pb-4 border-top border-secondary">
        <Container>
          <Row className="g-4 mb-5">
            <Col lg={4}>
              <div className="d-flex align-items-center fw-extrabold fs-4 text-primary mb-3">
                <div
                  className="bg-primary text-white rounded-3 p-1.5 d-flex align-items-center justify-content-center me-2"
                  style={{ width: '32px', height: '32px' }}
                >
                  <i className="bi bi-briefcase-fill fs-6"></i>
                </div>
                <span>Placement<span className="text-white">Pro</span></span>
              </div>
              <p className="text-white-50 fs-7 mb-3 max-w-sm leading-relaxed">
                The modern AI-powered campus placement preparation platform empowering students and TPO cells nationwide.
              </p>
              <div className="d-flex gap-2">
                <a href="#github" className="btn btn-outline-secondary btn-sm rounded-circle text-white" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-github"></i>
                </a>
                <a href="#linkedin" className="btn btn-outline-secondary btn-sm rounded-circle text-white" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-linkedin"></i>
                </a>
                <a href="#twitter" className="btn btn-outline-secondary btn-sm rounded-circle text-white" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a href="#youtube" className="btn btn-outline-secondary btn-sm rounded-circle text-white" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-youtube"></i>
                </a>
              </div>
            </Col>

            <Col xs={6} sm={4} lg={2}>
              <h6 className="fw-bold text-white mb-3 fs-7 text-uppercase tracking-wider">Features</h6>
              <ul className="list-unstyled fs-7 text-white-50">
                <li className="mb-2"><a href="#features" onClick={() => onNavigate('company-prep')} className="text-white-50 text-decoration-none hover-text-white">Company Prep</a></li>
                <li className="mb-2"><a href="#features" onClick={() => onNavigate('leetcode-practice')} className="text-white-50 text-decoration-none hover-text-white">LeetCode Coding</a></li>
                <li className="mb-2"><a href="#features" onClick={() => onNavigate('ai-interview')} className="text-white-50 text-decoration-none hover-text-white">AI Mock Interview</a></li>
                <li className="mb-2"><a href="#features" onClick={() => onNavigate('versant-prep')} className="text-white-50 text-decoration-none hover-text-white">Versant English</a></li>
                <li className="mb-2"><a href="#features" onClick={() => onNavigate('resume-analyzer')} className="text-white-50 text-decoration-none hover-text-white">Resume Analyzer</a></li>
              </ul>
            </Col>

            <Col xs={6} sm={4} lg={2}>
              <h6 className="fw-bold text-white mb-3 fs-7 text-uppercase tracking-wider">Platform</h6>
              <ul className="list-unstyled fs-7 text-white-50">
                <li className="mb-2"><a href="#how-it-works" className="text-white-50 text-decoration-none hover-text-white">How It Works</a></li>
                <li className="mb-2"><a href="#pricing" className="text-white-50 text-decoration-none hover-text-white">Pricing Plans</a></li>
                <li className="mb-2"><a href="#faq" className="text-white-50 text-decoration-none hover-text-white">FAQ</a></li>
                <li className="mb-2"><a href="#preview" className="text-white-50 text-decoration-none hover-text-white">Live Preview</a></li>
              </ul>
            </Col>

            <Col xs={6} sm={4} lg={2}>
              <h6 className="fw-bold text-white mb-3 fs-7 text-uppercase tracking-wider">For TPO Cells</h6>
              <ul className="list-unstyled fs-7 text-white-50">
                <li className="mb-2"><span onClick={() => { setRole('tpo'); onNavigate('dashboard'); }} className="text-white-50 text-decoration-none hover-text-white cursor-pointer">TPO Admin View</span></li>
                <li className="mb-2"><span onClick={() => { setRole('recruiter'); onNavigate('dashboard'); }} className="text-white-50 text-decoration-none hover-text-white cursor-pointer">Recruiter Portal</span></li>
                <li className="mb-2"><span onClick={() => onNavigate('analytics')} className="text-white-50 text-decoration-none hover-text-white cursor-pointer">Batch Analytics</span></li>
              </ul>
            </Col>

            <Col xs={6} sm={4} lg={2}>
              <h6 className="fw-bold text-white mb-3 fs-7 text-uppercase tracking-wider">Legal</h6>
              <ul className="list-unstyled fs-7 text-white-50">
                <li className="mb-2"><a href="#privacy" className="text-white-50 text-decoration-none hover-text-white">Privacy Policy</a></li>
                <li className="mb-2"><a href="#terms" className="text-white-50 text-decoration-none hover-text-white">Terms of Service</a></li>
                <li className="mb-2"><a href="#contact" className="text-white-50 text-decoration-none hover-text-white">Contact Us</a></li>
              </ul>
            </Col>
          </Row>

          <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between pt-4 border-top border-secondary fs-8 text-white-50">
            <div>
              © 2026 PlacementPro Inc. All rights reserved. Built for campus recruitment excellence.
            </div>
            <div className="d-flex gap-3 mt-2 mt-sm-0">
              <a href="#privacy" className="text-white-50 text-decoration-none">Privacy</a>
              <a href="#terms" className="text-white-50 text-decoration-none">Terms</a>
              <a href="#cookies" className="text-white-50 text-decoration-none">Cookies</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};
