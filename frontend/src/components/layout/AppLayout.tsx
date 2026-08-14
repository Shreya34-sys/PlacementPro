import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, onTabChange, children }) => {
  return (
    <div className="vh-100 overflow-hidden bg-light d-flex flex-column">
      <Navbar
        currentTab={currentTab}
        onTabChange={onTabChange}
      />

      <div className="d-flex flex-grow-1 position-relative overflow-hidden">
        <main className="flex-grow-1 main-content-scrollable d-flex flex-column">
          <div className="flex-grow-1 p-3 p-md-4">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};
