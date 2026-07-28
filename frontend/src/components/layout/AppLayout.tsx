import React, { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, onTabChange, children }) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    }
  };

  return (
    <div className="vh-100 overflow-hidden bg-light d-flex flex-column">
      <Navbar
        currentTab={currentTab}
        onTabChange={onTabChange}
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isDesktopCollapsed}
      />

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        className="d-md-none"
        style={{ width: '280px' }}
      >
        <Offcanvas.Header closeButton className="border-bottom bg-white">
          <Offcanvas.Title className="fw-extrabold fs-5 d-flex align-items-center text-primary mb-0">
            <i className="bi bi-briefcase-fill me-2 fs-5"></i>
            <span>Placement<span className="text-dark">Pro</span></span>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0 bg-white">
          <Sidebar
            currentTab={currentTab}
            onTabChange={onTabChange}
            onCloseMobile={() => setShowMobileSidebar(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="d-flex flex-grow-1 position-relative overflow-hidden">
        {/* Desktop Fixed Sidebar */}
        <div
          className="d-none d-md-block sidebar-fixed-container bg-white"
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            bottom: 0,
            height: 'calc(100vh - 60px)',
            width: isDesktopCollapsed ? '72px' : '260px',
            overflow: 'hidden',
            zIndex: 1020,
          }}
        >
          <Sidebar
            currentTab={currentTab}
            onTabChange={onTabChange}
            isCollapsed={isDesktopCollapsed}
          />
        </div>

        {/* Main View Area */}
        <main
          className={`flex-grow-1 main-content-scrollable d-flex flex-column ${
            isDesktopCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          }`}
        >
          <div className="flex-grow-1 p-3 p-md-4">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};
