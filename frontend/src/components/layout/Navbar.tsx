import React, { useEffect, useRef, useState } from 'react';
import { Container, Navbar as BsNavbar, Nav, NavDropdown, Button, Badge } from 'react-bootstrap';
import { BellRing, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

type MegaMenuItem = {
  label: string;
  description: string;
  tab: string;
};

type MegaMenuSection = {
  heading: string;
  description: string;
  items: MegaMenuItem[];
};

type TrendingItem = {
  label: string;
  title: string;
  action: string;
  tab: string;
};

const placementSections: MegaMenuSection[] = [
  {
    heading: 'Placement Rounds',
    description: 'Prepare for every stage of the campus placement process.',
    items: [
      { label: 'Aptitude', description: 'Quantitative aptitude, numerical ability and problem solving', tab: 'aptitude-test' },
      { label: 'Logical Reasoning', description: 'Practice analytical and logical reasoning questions', tab: 'aptitude-test' },
      { label: 'Verbal Ability', description: 'Improve grammar, vocabulary and verbal reasoning', tab: 'aptitude-test' },
      { label: 'Coding Round', description: 'Solve coding problems and improve problem-solving skills', tab: 'coding-round' },
      { label: 'Technical Round', description: 'Prepare CS fundamentals and technical interview questions', tab: 'technical-prep' },
      { label: 'HR Round', description: 'Practice common HR and behavioral interview questions', tab: 'hr-prep' },
      { label: 'Group Discussion', description: 'Improve communication, confidence and discussion skills', tab: 'gd-prep' },
    ],
  },
  {
    heading: 'Interview Preparation',
    description: 'Build confidence for technical and HR interviews.',
    items: [
      { label: 'Technical Interview', description: 'Core CS subjects and technical questions', tab: 'technical-prep' },
      { label: 'HR Interview', description: 'Behavioral, situational and HR questions', tab: 'hr-prep' },
      { label: 'AI Interview', description: 'Practice realistic AI-powered interviews', tab: 'ai-interview' },
      { label: 'System Design', description: 'Learn system design concepts and interview patterns', tab: 'technical-prep' },
      { label: 'Coding Practice', description: 'Solve topic-wise DSA problems on a LeetCode-style editor', tab: 'coding-practice' },
      { label: 'Resume & ATS', description: 'Improve your resume and ATS readiness', tab: 'resume-analyzer' },
    ],
  },
  {
    heading: 'Company Preparation',
    description: 'Prepare according to the companies you want to crack.',
    items: [
      { label: 'Product Companies', description: 'Prepare for product-based company interviews', tab: 'company-prep' },
      { label: 'Service-Based Companies', description: 'Practice common service-company placement patterns', tab: 'company-prep' },
      { label: 'Company-Wise Questions', description: 'Practice company-specific interview questions', tab: 'company-prep' },
      { label: 'Previous Interview Experiences', description: 'Explore interview experiences and preparation insights', tab: 'company-prep' },
      { label: 'Company Eligibility', description: 'Check eligibility based on academic criteria', tab: 'company-prep' },
    ],
  },
];

const trendingItems: TrendingItem[] = [
  { label: 'Aptitude', title: 'Crack Aptitude Tests', action: 'Practice', tab: 'aptitude-test' },
  { label: 'DSA', title: 'Master Coding Rounds', action: 'Practice', tab: 'coding-practice' },
  { label: 'Technical', title: 'Ace Technical Interviews', action: 'Prepare', tab: 'technical-prep' },
  { label: 'AI Interview', title: 'Practice AI Interviews', action: 'Start', tab: 'ai-interview' },
  { label: 'Resume', title: 'Improve Your ATS Score', action: 'Analyze', tab: 'resume-analyzer' },
];

const placementTabs = new Set([
  'placement-prep',
  'aptitude-test',
  'company-prep',
  'company-prep-detail',
  'technical-prep',
  'gd-prep',
  'coding-round',
  'leetcode-practice',
  'coding-practice',
  'hr-prep',
  'resume-analyzer',
  'ai-interview',
  'analytics',
  'leaderboard',
]);

const desktopNavItems = [
  { label: 'Home', tab: 'dashboard' },
  { label: 'Practice', tab: 'placement-prep' },
  { label: 'Companies', tab: 'companies' },
  { label: 'Analytics', tab: 'analytics' },
  { label: 'Leaderboard', tab: 'leaderboard' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlacementActive = placementTabs.has(currentTab);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    onTabChange('login');
  };

  const navigateTo = (tab: string) => {
    onTabChange(tab);
    setIsMegaMenuOpen(false);
  };

  const openMegaMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setIsMegaMenuOpen(true);
  };

  const scheduleMegaMenuClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => setIsMegaMenuOpen(false), 120);
  };

  return (
    <BsNavbar
      bg="white"
      variant="light"
      fixed="top"
      className="placement-navbar shadow-xs border-bottom py-2"
      style={{ zIndex: 1030, minHeight: '60px' }}
    >
      <Container fluid className="px-3 px-lg-4">
        <div className="d-flex align-items-center gap-3">
          <BsNavbar.Brand
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('dashboard');
            }}
            className="d-flex align-items-center fw-extrabold fs-4 text-primary cursor-pointer mb-0 me-0"
          >
            <div className="bg-primary text-white rounded-3 p-1.5 d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-briefcase-fill fs-6"></i>
            </div>
            <span className="tracking-tight">Placement<span className="text-dark fw-bold">Pro</span></span>
          </BsNavbar.Brand>
        </div>

        <div className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 mx-3">
          <Nav className="placement-primary-nav align-items-center">
            <Nav.Link
              href="#dashboard"
              className={`placement-nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigateTo('dashboard');
              }}
            >
              Home
            </Nav.Link>

            <div
              ref={megaMenuRef}
              className="placement-mega-wrap"
              onMouseEnter={openMegaMenu}
              onMouseLeave={scheduleMegaMenuClose}
            >
              <button
                type="button"
                className={`placement-nav-link placement-prep-trigger ${isPlacementActive || isMegaMenuOpen ? 'active' : ''}`}
                aria-expanded={isMegaMenuOpen}
                aria-haspopup="true"
                onClick={() => setIsMegaMenuOpen((open) => !open)}
              >
                <span>Placement Prep</span>
                <ChevronDown size={15} className="placement-prep-chevron" />
              </button>

              <div className={`placement-mega-menu ${isMegaMenuOpen ? 'show' : ''}`} role="menu">
                <div className="placement-mega-grid">
                  {placementSections.map((section) => (
                    <section className="placement-mega-section" key={section.heading}>
                      <div className="placement-mega-kicker">{section.heading}</div>
                      <p>{section.description}</p>
                      <div className="placement-mega-list">
                        {section.items.map((item) => (
                          <button
                            type="button"
                            className="placement-mega-item"
                            key={item.label}
                            onClick={() => navigateTo(item.tab)}
                            role="menuitem"
                          >
                            <span>
                              <strong>{item.label}</strong>
                              <small>{item.description}</small>
                            </span>
                            <i className="bi bi-arrow-right-short"></i>
                          </button>
                        ))}
                      </div>
                      {section.heading === 'Company Preparation' && (
                        <button type="button" className="placement-company-link" onClick={() => navigateTo('company-prep')}>
                          Explore All Companies <i className="bi bi-arrow-right"></i>
                        </button>
                      )}
                    </section>
                  ))}
                </div>

                <div className="placement-trending">
                  <div className="placement-trending-title">Trending Placement Prep</div>
                  <div className="placement-trending-list">
                    {trendingItems.map((item) => (
                      <button type="button" className="placement-trending-card" key={item.label} onClick={() => navigateTo(item.tab)}>
                        <span className="placement-trending-tag">{item.label}</span>
                        <strong>{item.title}</strong>
                        <span>{item.action} <i className="bi bi-arrow-right-short"></i></span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {desktopNavItems.slice(1).map((item) => (
              <Nav.Link
                href={`#${item.tab}`}
                key={item.label}
                className={`placement-nav-link ${currentTab === item.tab ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(item.tab);
                }}
              >
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
        </div>

        <Nav className="placement-actions align-items-center gap-2 ms-auto">
          <NavDropdown
            title={
              <div className="position-relative d-flex align-items-center justify-content-center bg-light border rounded-3 text-secondary hover-bg-gray" style={{ width: '36px', height: '36px' }}>
                <BellRing size={19} />
                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                  <span className="visually-hidden">New notifications</span>
                </span>
              </div>
            }
            id="notifications-dropdown"
            align="end"
            className="no-caret d-none d-sm-block"
          >
            <NavDropdown.Header className="d-flex justify-content-between align-items-center fw-bold py-2">
              <span>Notifications</span>
              <Badge bg="primary-subtle" text="primary" className="fs-8">3 New</Badge>
            </NavDropdown.Header>
            <NavDropdown.Divider className="my-0" />
            <NavDropdown.Item onClick={() => navigateTo('placement-prep')} className="py-2.5 px-3 border-bottom fs-7">
              <div className="fw-semibold text-dark mb-0.5">Daily Prep Streak Updated</div>
              <small className="text-muted fs-8 d-block">You logged 12 days in a row. Keep it up!</small>
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => navigateTo('companies')} className="py-2.5 px-3 border-bottom fs-7">
              <div className="fw-semibold text-dark mb-0.5">New Drive: TCS Digital 2026</div>
              <small className="text-muted fs-8 d-block">Applications open for System Engineer Prime role.</small>
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => navigateTo('ai-interview')} className="py-2.5 px-3 fs-7">
              <div className="fw-semibold text-dark mb-0.5">AI Interview Score Ready</div>
              <small className="text-muted fs-8 d-block">Your Technical Round score was 88/100.</small>
            </NavDropdown.Item>
          </NavDropdown>

          <Button
            variant="light"
            size="sm"
            onClick={toggleTheme}
            className="border shadow-xs d-flex align-items-center justify-content-center text-secondary hover-bg-gray"
            style={{ width: '36px', height: '36px' }}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            <i className={`bi ${isDarkMode ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-indigo'} fs-6`}></i>
          </Button>

          {currentUser ? (
            <NavDropdown
              className="no-caret"
              title={
                <div className="d-flex align-items-center gap-2 cursor-pointer p-1 rounded-3 hover-bg-gray">
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={currentUser.name}
                    className="rounded-circle border"
                    width="34"
                    height="34"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="d-none d-xl-block text-start leading-tight">
                    <span className="fw-bold text-dark fs-7 d-block">{currentUser.name}</span>
                    <span className="text-muted fs-8 text-capitalize d-block">{currentUser.role} Mode</span>
                  </div>
                </div>
              }
              id="user-profile-dropdown"
              align="end"
            >
              <NavDropdown.Header>
                <div className="fw-bold text-dark">{currentUser.name}</div>
                <small className="text-muted">{currentUser.email}</small>
              </NavDropdown.Header>

              <NavDropdown.Divider />

              <NavDropdown.Item onClick={() => navigateTo('profile')} className="py-2 fs-7">
                <i className="bi bi-person-circle me-2 text-primary"></i> Profile & Portfolio
              </NavDropdown.Item>

              <NavDropdown.Item onClick={() => navigateTo('settings')} className="py-2 fs-7">
                <i className="bi bi-gear me-2 text-secondary"></i> Account Settings
              </NavDropdown.Item>

              <NavDropdown.Divider />

              <NavDropdown.Item onClick={handleLogout} className="py-2 fs-7 text-danger fw-semibold">
                <i className="bi bi-box-arrow-right me-2"></i> Log Out
              </NavDropdown.Item>
            </NavDropdown>
          ) : (
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={() => navigateTo('login')} className="fw-semibold">
                Log In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigateTo('register')} className="fw-semibold">
                Register
              </Button>
            </div>
          )}
        </Nav>

      </Container>
    </BsNavbar>
  );
};
