import React, { useState } from 'react';
import { Container, Navbar as BsNavbar, Nav, NavDropdown, Form, InputGroup, Button, Badge } from 'react-bootstrap';
import { BellRing, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onToggleSidebar,
  isSidebarCollapsed,
}) => {
  const { currentUser, setRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const handleRoleSwitch = (role: UserRole) => {
    setRole(role);
    onTabChange('dashboard');
  };

  const handleLogout = () => {
    logout();
    onTabChange('login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onTabChange('placement-prep');
    }
  };

  return (
    <BsNavbar bg="white" variant="light" fixed="top" className="shadow-xs border-bottom py-2" style={{ zIndex: 1030, height: '60px' }}>
      <Container fluid className="px-3 px-lg-4">
        {/* Left Side: Toggle Button + Brand Logo */}
        <div className="d-flex align-items-center gap-3">
          {onToggleSidebar && (
            <Button
              variant="light"
              size="sm"
              className="border shadow-xs d-flex align-items-center justify-content-center text-secondary hover-bg-gray"
              style={{ width: '36px', height: '36px' }}
              onClick={onToggleSidebar}
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              <PanelLeftClose size={20} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </Button>
          )}

          <BsNavbar.Brand
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('dashboard');
            }}
            className="d-flex align-items-center fw-extrabold fs-4 text-primary cursor-pointer mb-0 me-0"
          >
            <div className="bg-primary text-white rounded-3 p-1.5 d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-briefcase-fill fs-6"></i>
            </div>
            <span className="tracking-tight">Placement<span className="text-dark fw-bold">Pro</span></span>
          </BsNavbar.Brand>
        </div>

        {/* Center: Search Bar */}
        <div className="d-none d-md-block flex-grow-1 mx-4" style={{ maxWidth: '480px' }}>
          <Form onSubmit={handleSearchSubmit}>
            <InputGroup className="bg-light rounded-3 overflow-hidden border shadow-xs">
              <InputGroup.Text className="bg-transparent border-0 pe-1">
                <i className="bi bi-search text-muted fs-7"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search placement prep, companies, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 fs-7 shadow-none ps-1 py-2"
              />
            </InputGroup>
          </Form>
        </div>

        {/* Right Side: Notifications + Theme Toggle + Profile */}
        <Nav className="align-items-center gap-2">
          {/* Notifications Dropdown */}
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
            className="no-caret"
          >
            <NavDropdown.Header className="d-flex justify-content-between align-items-center fw-bold py-2">
              <span>Notifications</span>
              <Badge bg="primary-subtle" text="primary" className="fs-8">3 New</Badge>
            </NavDropdown.Header>
            <NavDropdown.Divider className="my-0" />
            <NavDropdown.Item onClick={() => onTabChange('placement-prep')} className="py-2.5 px-3 border-bottom fs-7">
              <div className="fw-semibold text-dark mb-0.5">🔥 Daily Prep Streak Updated!</div>
              <small className="text-muted fs-8 d-block">You logged 12 days in a row. Keep it up!</small>
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => onTabChange('companies')} className="py-2.5 px-3 border-bottom fs-7">
              <div className="fw-semibold text-dark mb-0.5">🏢 New Drive: TCS Digital 2026</div>
              <small className="text-muted fs-8 d-block">Applications open for System Engineer Prime role.</small>
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => onTabChange('ai-interview')} className="py-2.5 px-3 fs-7">
              <div className="fw-semibold text-dark mb-0.5">🤖 AI Interview Score Ready</div>
              <small className="text-muted fs-8 d-block">Your Technical Round score was 88/100.</small>
            </NavDropdown.Item>
          </NavDropdown>

          {/* Theme Toggle Button */}
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

          {/* Profile & Role Dropdown */}
          {currentUser ? (
            <NavDropdown
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
                  <div className="d-none d-lg-block text-start leading-tight">
                    <span className="fw-bold text-dark fs-7 d-block">{currentUser.name}</span>
                    <span className="text-muted fs-8 text-capitalize d-block">{currentUser.role} Mode</span>
                  </div>
                  <i className="bi bi-chevron-down text-muted fs-8 ms-1"></i>
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

              <NavDropdown.Item onClick={() => onTabChange('profile')} className="py-2 fs-7">
                <i className="bi bi-person-circle me-2 text-primary"></i> Profile & Portfolio
              </NavDropdown.Item>

              <NavDropdown.Item onClick={() => onTabChange('settings')} className="py-2 fs-7">
                <i className="bi bi-gear me-2 text-secondary"></i> Account Settings
              </NavDropdown.Item>

              <NavDropdown.Divider />

              <NavDropdown.Item onClick={handleLogout} className="py-2 fs-7 text-danger fw-semibold">
                <i className="bi bi-box-arrow-right me-2"></i> Log Out
              </NavDropdown.Item>
            </NavDropdown>
          ) : (
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={() => onTabChange('login')} className="fw-semibold">
                Log In
              </Button>
              <Button variant="primary" size="sm" onClick={() => onTabChange('register')} className="fw-semibold">
                Register
              </Button>
            </div>
          )}
        </Nav>
      </Container>
    </BsNavbar>
  );
};
