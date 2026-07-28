import React from 'react';
import { Nav, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { BookOpenCheck, Building, ChartSpline, Trophy, UserRoundPen, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onCloseMobile,
  isCollapsed = false,
}) => {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'placement-prep', label: 'Placement Prep', icon: '📚' },
    { id: 'companies', label: 'Companies', icon: '🏢' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'logout', label: 'Logout', icon: '🚪' },
  ];

  const handleSelect = (id: string) => {
    if (id === 'logout') {
      logout();
      onTabChange('login');
    } else {
      onTabChange(id);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <div
      className={`bg-white border-end shadow-xs h-100 d-flex flex-column transition-all overflow-hidden ${
        isCollapsed ? 'px-2 py-3' : 'p-3'
      }`}
      style={{
        width: isCollapsed ? '72px' : '260px',
        minWidth: isCollapsed ? '72px' : '260px',
        height: '100%',
        overflow: 'hidden',
      }}
    >


      <Nav className="flex-column gap-1.5 flex-grow-1">
        {navItems.map((item) => {
          const isActive =
            currentTab === item.id ||
            (item.id === 'placement-prep' &&
              [
                'practice',
                'company-prep',
                'technical-prep',
                'gd-prep',
                'aptitude-test',
                'coding-round',
                'leetcode-practice',
                'versant-prep',
                'hr-prep',
                'gamified-prep',
                'study-planner',
              ].includes(currentTab));

          const isLogout = item.id === 'logout';

          const linkContent = (
            <Nav.Link
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`d-flex align-items-center py-2.5 rounded-3 text-decoration-none transition-all ${
                isCollapsed ? 'justify-content-center px-2' : 'px-3'
              } ${
                isLogout
                  ? 'text-danger hover-bg-danger-subtle mt-auto fw-medium'
                  : isActive
                  ? 'bg-primary text-white fw-bold shadow-xs'
                  : 'text-dark hover-bg-gray fw-medium'
              }`}
            >
              <span className={`fs-5 d-inline-flex align-items-center justify-content-center ${isCollapsed ? 'm-0' : 'me-2.5'}`}>
                {item.id === 'dashboard' ? (
                  <img
                    src="https://img.icons8.com/?size=100&id=aVHe2jHuORcA&format=png&color=000000"
                    alt="Dashboard"
                    width="20"
                    height="20"
                    referrerPolicy="no-referrer"
                    style={{
                      objectFit: 'contain',
                      filter: isActive ? 'brightness(0) invert(1)' : 'none',
                      transition: 'filter 0.15s ease',
                    }}
                  />
                ) : item.id === 'placement-prep' ? (
                  <BookOpenCheck size={20} />
                ) : item.id === 'companies' ? (
                  <Building size={20} />
                ) : item.id === 'analytics' ? (
                  <ChartSpline size={20} />
                ) : item.id === 'leaderboard' ? (
                  <Trophy size={20} />
                ) : item.id === 'profile' ? (
                  <UserRoundPen size={20} />
                ) : item.id === 'settings' ? (
                  <Settings size={20} />
                ) : item.id === 'logout' ? (
                  <LogOut size={20} />
                ) : (
                  item.icon
                )}
              </span>
              {!isCollapsed && <span className="fs-7 leading-none">{item.label}</span>}
            </Nav.Link>
          );

          if (isCollapsed) {
            return (
              <OverlayTrigger
                key={item.id}
                placement="right"
                overlay={<Tooltip id={`tooltip-${item.id}`}>{item.label}</Tooltip>}
              >
                <div>{linkContent}</div>
              </OverlayTrigger>
            );
          }

          return linkContent;
        })}
      </Nav>
    </div>
  );
};
