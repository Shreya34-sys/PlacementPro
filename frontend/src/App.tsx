import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlacementProvider } from './context/PlacementContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { StudentsPage } from './pages/StudentsPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { PlacementPrepPage } from './pages/PlacementPrepPage';
import { CompanyPrepPage } from './pages/CompanyPrepPage';
import { TechnicalPrepPage } from './pages/TechnicalPrepPage';
import { GdPrepPage } from './pages/GdPrepPage';
import { AptitudeTestPage } from './pages/AptitudeTestPage';
import { CodingRoundPage } from './pages/CodingRoundPage';
import { LeetCodePracticePage } from './pages/LeetCodePracticePage';
import { VersantPrepPage } from './pages/VersantPrepPage';
import { HrInterviewPage } from './pages/HrInterviewPage';
import { GamifiedAssessmentPage } from './pages/GamifiedAssessmentPage';
import { AiInterviewPage } from './pages/AiInterviewPage';
import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LandingPage } from './pages/LandingPage';

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('landing');
  const [selectedJobId, setSelectedJobId] = useState<string>('job-1');

  const handleNavigate = (tab: string, jobId?: string) => {
    if (tab === 'logout') {
      logout();
      setCurrentTab('login');
      return;
    }
    if (jobId) setSelectedJobId(jobId);
    setCurrentTab(tab);
  };

  // Route Protection: Prevent logged-out users from accessing protected student pages
  if (!isAuthenticated && currentTab !== 'landing' && currentTab !== 'register') {
    return (
      <div className="min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
        <LoginPage
          onNavigateToRegister={() => setCurrentTab('register')}
          onLoginSuccess={() => setCurrentTab('dashboard')}
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return (
          <LoginPage
            onNavigateToRegister={() => setCurrentTab('register')}
            onLoginSuccess={() => setCurrentTab('dashboard')}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onNavigateToLogin={() => setCurrentTab('login')}
            onRegisterSuccess={() => setCurrentTab('dashboard')}
          />
        );
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'jobs':
        return <JobsPage onSelectJob={(id) => handleNavigate('job-details', id)} />;
      case 'job-details':
        return <JobDetailsPage jobId={selectedJobId} onBack={() => setCurrentTab('jobs')} />;
      case 'companies':
        return <CompaniesPage onNavigateToJob={(id) => handleNavigate('job-details', id)} />;
      case 'placement-prep':
      case 'practice':
        return <PlacementPrepPage onNavigate={handleNavigate} />;
      case 'company-prep':
        return <CompanyPrepPage onNavigate={handleNavigate} />;
      case 'technical-prep':
        return <TechnicalPrepPage onNavigate={handleNavigate} />;
      case 'gd-prep':
        return <GdPrepPage onNavigate={handleNavigate} />;
      case 'aptitude-test':
        return <AptitudeTestPage />;
      case 'coding-round':
        return <CodingRoundPage />;
      case 'leetcode-practice':
        return <LeetCodePracticePage />;
      case 'versant-prep':
        return <VersantPrepPage />;
      case 'hr-prep':
        return <HrInterviewPage />;
      case 'gamified-prep':
        return <GamifiedAssessmentPage />;
      case 'ai-interview':
        return <AiInterviewPage />;
      case 'resume-analyzer':
      case 'resume-prep':
        return <ResumeAnalyzerPage />;
      case 'study-planner':
        return <StudyPlannerPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'students':
        return <StudentsPage />;
      case 'interviews':
        return <InterviewsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  if (currentTab === 'login' || currentTab === 'register' || currentTab === 'landing') {
    return (
      <div className="min-vh-100 bg-light">
        {renderContent()}
      </div>
    );
  }

  return (
    <AppLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlacementProvider>
          <AppContent />
        </PlacementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
