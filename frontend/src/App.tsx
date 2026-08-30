// import React, { useState } from 'react';

// import { AuthProvider, useAuth } from './context/AuthContext';
// import { PlacementProvider } from './context/PlacementContext';
// import { ThemeProvider } from './context/ThemeContext';

// import { AppLayout } from './components/layout/AppLayout';

// import { DashboardPage } from './pages/DashboardPage';
// import { JobsPage } from './pages/JobsPage';
// import { JobDetailsPage } from './pages/JobDetailsPage';
// import { ApplicationsPage } from './pages/ApplicationsPage';
// import { StudentsPage } from './pages/StudentsPage';
// import { InterviewsPage } from './pages/InterviewsPage';
// import { CompaniesPage } from './pages/CompaniesPage';
// import { PlacementPrepPage } from './pages/PlacementPrepPage';
// import { CompanyPrepPage } from './pages/CompanyPrepPage';
// import { CompanyPrepDetailPage } from './pages/CompanyPrepDetailPage';
// import { TechnicalPrepPage } from './pages/TechnicalPrepPage';
// import { GdPrepPage } from './pages/GdPrepPage';
// import { AptitudeTestPage } from './pages/AptitudeTestPage';
// import { CodingRoundPage } from './pages/CodingRoundPage';
// import { LeetCodePracticePage } from './pages/LeetCodePracticePage';
// import { VersantPrepPage } from './pages/VersantPrepPage';
// import { HrInterviewPage } from './pages/HrInterviewPage';
// import { GamifiedAssessmentPage } from './pages/GamifiedAssessmentPage';
// import { AiInterviewPage } from './pages/AiInterviewPage';
// import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
// import { StudyPlannerPage } from './pages/StudyPlannerPage';
// import { LeaderboardPage } from './pages/LeaderboardPage';
// import { AnalyticsPage } from './pages/AnalyticsPage';
// import { ProfilePage } from './pages/ProfilePage';
// import { SettingsPage } from './pages/SettingsPage';

// import { LoginPage } from './pages/LoginPage';
// import { RegisterPage } from './pages/RegisterPage';
// import { LandingPage } from './pages/LandingPage';
// import { TermsPage } from './pages/TermsPage';
// import { PrivacyPage } from './pages/PrivacyPage';

// import { CodingPracticePage } from './modules/codingPractice/pages/CodingPracticePage';

// import {
//   AdminAuthProvider,
//   useAdminAuth,
// } from './context/AdminAuthContext';

// import { AdminLoginPage } from './pages/admin/AdminLoginPage';
// //import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
// import AdminDashboardPage from "./pages/admin/AdminDashboardPage";


// function AppContent() {
//   const { isAuthenticated, logout } = useAuth();

//   const {
//     isAdminAuthenticated,
//     logout: adminLogout,
//   } = useAdminAuth();


//   const [currentTab, setCurrentTab] = useState(() => {
//     if (window.location.hash === '#terms') return 'terms';
//     if (window.location.hash === '#privacy') return 'privacy';
//     if (window.location.hash === '#admin') return 'admin-login';

//     return 'landing';
//   });


//   const [policyBackTab, setPolicyBackTab] = useState('register');

//   const [selectedJobId, setSelectedJobId] =
//     useState<string>('job-1');

//   const [selectedCompanyId, setSelectedCompanyId] =
//     useState<string>('amazon');


//   const handleNavigate = (tab: string, itemId?: string) => {

//     if (tab === 'logout') {
//       logout();
//       setCurrentTab('login');
//       return;
//     }

//     if (tab === 'job-details' && itemId) {
//       setSelectedJobId(itemId);
//     }

//     if (tab === 'company-prep-detail' && itemId) {
//       setSelectedCompanyId(itemId);
//     }

//     if (tab === 'terms' || tab === 'privacy') {
//       setPolicyBackTab(currentTab);
//       window.location.hash = tab;
//     } else {
//       window.history.replaceState(
//         null,
//         '',
//         window.location.pathname
//       );
//     }

//     setCurrentTab(tab);
//   };


//   /*
//    * STUDENT ROUTE PROTECTION
//    *
//    * Admin pages are deliberately excluded here.
//    */
//   if (
//     !isAuthenticated &&
//     currentTab !== 'landing' &&
//     currentTab !== 'register' &&
//     currentTab !== 'terms' &&
//     currentTab !== 'privacy' &&
//     currentTab !== 'admin-login' &&
//     currentTab !== 'admin-dashboard'
//   ) {
//     return (
//       <div
//         className="min-vh-100"
//         style={{ backgroundColor: '#F8FAFC' }}
//       >
//         <LoginPage
//           onNavigateToRegister={() =>
//             setCurrentTab('register')
//           }
//           onLoginSuccess={() =>
//             setCurrentTab('dashboard')
//           }
//           onNavigate={handleNavigate}
//         />
//       </div>
//     );
//   }


//   const renderContent = () => {

//     switch (currentTab) {

//       /* ================= STUDENT ================= */

//       case 'landing':
//         return (
//           <LandingPage
//             onNavigate={handleNavigate}
//           />
//         );


//       case 'login':
//         return (
//           <LoginPage
//             onNavigateToRegister={() =>
//               setCurrentTab('register')
//             }
//             onLoginSuccess={() =>
//               setCurrentTab('dashboard')
//             }
//             onNavigate={handleNavigate}
//           />
//         );


//       case 'register':
//         return (
//           <RegisterPage
//             onNavigateToLogin={() =>
//               setCurrentTab('login')
//             }
//             onRegisterSuccess={() =>
//               setCurrentTab('dashboard')
//             }
//             onNavigateToTerms={() =>
//               handleNavigate('terms')
//             }
//             onNavigateToPrivacy={() =>
//               handleNavigate('privacy')
//             }
//           />
//         );


//       case 'terms':
//         return (
//           <TermsPage
//             onBack={() => {
//               window.history.replaceState(
//                 null,
//                 '',
//                 window.location.pathname
//               );

//               setCurrentTab(policyBackTab);
//             }}
//           />
//         );


//       case 'privacy':
//         return (
//           <PrivacyPage
//             onBack={() => {
//               window.history.replaceState(
//                 null,
//                 '',
//                 window.location.pathname
//               );

//               setCurrentTab(policyBackTab);
//             }}
//           />
//         );


//       case 'dashboard':
//         return (
//           <DashboardPage
//             onNavigate={handleNavigate}
//           />
//         );


//       case 'jobs':
//         return (
//           <JobsPage
//             onSelectJob={(id) =>
//               handleNavigate('job-details', id)
//             }
//           />
//         );


//       case 'job-details':
//         return (
//           <JobDetailsPage
//             jobId={selectedJobId}
//             onBack={() =>
//               setCurrentTab('jobs')
//             }
//           />
//         );


//       case 'companies':
//         return (
//           <CompaniesPage
//             onNavigateToJob={(id) =>
//               handleNavigate('job-details', id)
//             }
//           />
//         );


//       case 'placement-prep':
//       case 'practice':
//         return (
//           <PlacementPrepPage
//             onNavigate={handleNavigate}
//           />
//         );


//       case 'company-prep':
//         return (
//           <CompanyPrepPage
//             onNavigate={handleNavigate}
//           />
//         );


//       case 'company-prep-detail':
//         return (
//           <CompanyPrepDetailPage
//             companyId={selectedCompanyId}
//             onBack={() =>
//               setCurrentTab('company-prep')
//             }
//           />
//         );


//       case 'technical-prep':
//         return <TechnicalPrepPage onNavigate={handleNavigate} />;

//       case 'gd-prep':
//         return <GdPrepPage onNavigate={handleNavigate} />;

//       case 'aptitude-test':
//         return <AptitudeTestPage />;

//       case 'coding-round':
//         return <CodingRoundPage />;

//       case 'leetcode-practice':
//       case 'coding-practice':
//         return (
//           <CodingPracticePage
//             onNavigate={handleNavigate}
//           />
//         );

//       case 'versant-prep':
//         return <VersantPrepPage />;

//       case 'hr-prep':
//         return <HrInterviewPage />;

//       case 'gamified-prep':
//         return <GamifiedAssessmentPage />;

//       case 'ai-interview':
//         return <AiInterviewPage />;

//       case 'resume-analyzer':
//       case 'resume-prep':
//         return <ResumeAnalyzerPage />;

//       case 'study-planner':
//         return <StudyPlannerPage />;

//       case 'leaderboard':
//         return <LeaderboardPage />;

//       case 'applications':
//         return <ApplicationsPage />;

//       case 'students':
//         return <StudentsPage />;

//       case 'interviews':
//         return <InterviewsPage />;

//       case 'profile':
//         return <ProfilePage />;

//       case 'analytics':
//         return <AnalyticsPage />;

//       case 'settings':
//         return <SettingsPage />;


//       /* ================= ADMIN ================= */

//       case 'admin-login':
//         return (
//           <AdminLoginPage
//             onLoginSuccess={() =>
//               setCurrentTab('admin-dashboard')
//             }
//             onBackToStudentLogin={() =>
//               setCurrentTab('login')
//             }
//           />
//         );


//       case 'admin-dashboard':

//         if (!isAdminAuthenticated) {
//           return (
//             <AdminLoginPage
//               onLoginSuccess={() =>
//                 setCurrentTab('admin-dashboard')
//               }
//               onBackToStudentLogin={() =>
//                 setCurrentTab('login')
//               }
//             />
//           );
//         }

//         return (
//           <AdminDashboardPage
//             onLogout={async () => {
//               await adminLogout();
//               setCurrentTab('admin-login');
//             }}
//           />
//         );


//       default:
//         return (
//           <DashboardPage
//             onNavigate={handleNavigate}
//           />
//         );
//     }
//   };


//   /*
//    * Pages that should NOT use AppLayout
//    */
//   if (
//     currentTab === 'login' ||
//     currentTab === 'register' ||
//     currentTab === 'landing' ||
//     currentTab === 'terms' ||
//     currentTab === 'privacy' ||
//     currentTab === 'admin-login' ||
//     currentTab === 'admin-dashboard'
//   ) {
//     return (
//       <div className="min-vh-100 bg-light">
//         {renderContent()}
//       </div>
//     );
//   }


//   return (
//     <AppLayout
//       currentTab={currentTab}
//       onTabChange={setCurrentTab}
//     >
//       {renderContent()}
//     </AppLayout>
//   );
// }


// /* ================= APP PROVIDERS ================= */

// export default function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <AdminAuthProvider>
//           <PlacementProvider>
//             <AppContent />
//           </PlacementProvider>
//         </AdminAuthProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }

































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
import { CompanyPrepDetailPage } from './pages/CompanyPrepDetailPage';
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
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

import { CodingPracticePage } from './modules/codingPractice/pages/CodingPracticePage';

/* =========================================================
   ADMIN IMPORTS
   ========================================================= */

import {
  AdminAuthProvider,
  useAdminAuth,
} from './context/AdminAuthContext';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
//import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";


function AppContent() {

  /* =========================================================
     STUDENT AUTH
     ========================================================= */

  const {
    isAuthenticated,
    logout,
  } = useAuth();


  /* =========================================================
     ADMIN AUTH
     ========================================================= */

  const {
    isAdminAuthenticated,
    logout: adminLogout,
  } = useAdminAuth();


  /* =========================================================
     CURRENT PAGE
     ========================================================= */

  const [currentTab, setCurrentTab] = useState(() => {

    const hash = window.location.hash;

    if (hash === '#terms') {
      return 'terms';
    }

    if (hash === '#privacy') {
      return 'privacy';
    }

    /*
     * IMPORTANT:
     * #admin ALWAYS starts at Admin Login.
     * Admin dashboard is never selected directly here.
     */
    if (hash === '#admin') {
      return 'admin-login';
    }

    return 'landing';
  });


  const [policyBackTab, setPolicyBackTab] =
    useState('register');


  const [selectedJobId, setSelectedJobId] =
    useState<string>('job-1');


  const [selectedCompanyId, setSelectedCompanyId] =
    useState<string>('amazon');


  /* =========================================================
     STUDENT NAVIGATION
     ========================================================= */

  const handleNavigate = (
    tab: string,
    itemId?: string
  ) => {

    /* STUDENT LOGOUT ONLY */
    if (tab === 'logout') {

      logout();

      setCurrentTab('login');

      return;
    }


    if (
      tab === 'job-details' &&
      itemId
    ) {
      setSelectedJobId(itemId);
    }


    if (
      tab === 'company-prep-detail' &&
      itemId
    ) {
      setSelectedCompanyId(itemId);
    }


    if (
      tab === 'terms' ||
      tab === 'privacy'
    ) {

      setPolicyBackTab(currentTab);

      window.location.hash = tab;

    } else {

      window.history.replaceState(
        null,
        '',
        window.location.pathname
      );
    }


    setCurrentTab(tab);
  };


  /* =========================================================
     STUDENT AUTHENTICATION GATE

     NOTHING HERE CHANGES THE STUDENT DASHBOARD.
     ========================================================= */

  if (
    !isAuthenticated &&
    currentTab !== 'landing' &&
    currentTab !== 'register' &&
    currentTab !== 'terms' &&
    currentTab !== 'privacy' &&
    currentTab !== 'admin-login' &&
    currentTab !== 'admin-dashboard'
  ) {

    return (
      <div
        className="min-vh-100"
        style={{
          backgroundColor: '#F8FAFC',
        }}
      >

        <LoginPage

          onNavigateToRegister={() =>
            setCurrentTab('register')
          }

          onLoginSuccess={() =>
            setCurrentTab('dashboard')
          }

          onNavigate={handleNavigate}

        />

      </div>
    );
  }


  /* =========================================================
     PAGE ROUTER
     ========================================================= */

  const renderContent = () => {

    switch (currentTab) {


      /* =====================================================
         STUDENT PAGES
         ===================================================== */

      case 'landing':

        return (
          <LandingPage
            onNavigate={handleNavigate}
          />
        );


      case 'login':

        return (
          <LoginPage

            onNavigateToRegister={() =>
              setCurrentTab('register')
            }

            onLoginSuccess={() =>
              setCurrentTab('dashboard')
            }

            onNavigate={handleNavigate}

          />
        );


      case 'register':

        return (
          <RegisterPage

            onNavigateToLogin={() =>
              setCurrentTab('login')
            }

            onRegisterSuccess={() =>
              setCurrentTab('dashboard')
            }

            onNavigateToTerms={() =>
              handleNavigate('terms')
            }

            onNavigateToPrivacy={() =>
              handleNavigate('privacy')
            }

          />
        );


      case 'terms':

        return (
          <TermsPage

            onBack={() => {

              window.history.replaceState(
                null,
                '',
                window.location.pathname
              );

              setCurrentTab(
                policyBackTab
              );

            }}

          />
        );


      case 'privacy':

        return (
          <PrivacyPage

            onBack={() => {

              window.history.replaceState(
                null,
                '',
                window.location.pathname
              );

              setCurrentTab(
                policyBackTab
              );

            }}

          />
        );


      case 'dashboard':

        return (
          <DashboardPage
            onNavigate={handleNavigate}
          />
        );


      case 'jobs':

        return (
          <JobsPage

            onSelectJob={(id) =>
              handleNavigate(
                'job-details',
                id
              )
            }

          />
        );


      case 'job-details':

        return (
          <JobDetailsPage

            jobId={selectedJobId}

            onBack={() =>
              setCurrentTab('jobs')
            }

          />
        );


      case 'companies':

        return (
          <CompaniesPage

            onNavigateToJob={(id) =>
              handleNavigate(
                'job-details',
                id
              )
            }

          />
        );


      case 'placement-prep':
      case 'practice':

        return (
          <PlacementPrepPage
            onNavigate={handleNavigate}
          />
        );


      case 'company-prep':

        return (
          <CompanyPrepPage
            onNavigate={handleNavigate}
          />
        );


      case 'company-prep-detail':

        return (
          <CompanyPrepDetailPage

            companyId={selectedCompanyId}

            onBack={() =>
              setCurrentTab(
                'company-prep'
              )
            }

          />
        );


      case 'technical-prep':

        return (
          <TechnicalPrepPage
            onNavigate={handleNavigate}
          />
        );


      case 'gd-prep':

        return (
          <GdPrepPage
            onNavigate={handleNavigate}
          />
        );


      case 'aptitude-test':

        return <AptitudeTestPage />;


      case 'coding-round':

        return <CodingRoundPage />;


      case 'leetcode-practice':
      case 'coding-practice':

        return (
          <CodingPracticePage
            onNavigate={handleNavigate}
          />
        );


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


      /* =====================================================
         ADMIN LOGIN
         ===================================================== */

      case 'admin-login':

        return (
          <AdminLoginPage

            onLoginSuccess={() => {

              /*
               * ONLY after successful admin
               * authentication we enter dashboard.
               */

              setCurrentTab(
                'admin-dashboard'
              );

            }}

            onBackToStudentLogin={() => {

              setCurrentTab('login');

              window.history.replaceState(
                null,
                '',
                window.location.pathname
              );

            }}

          />
        );


      /* =====================================================
         ADMIN DASHBOARD
         ===================================================== */

      case 'admin-dashboard':

        /*
         * SECURITY CHECK
         *
         * Even if somebody manually changes the
         * React state or URL, dashboard requires
         * Firebase admin authentication.
         */

        if (!isAdminAuthenticated) {

          return (
            <AdminLoginPage

              onLoginSuccess={() =>
                setCurrentTab(
                  'admin-dashboard'
                )
              }

              onBackToStudentLogin={() =>
                setCurrentTab('login')
              }

            />
          );

        }


        return (
          <AdminDashboardPage

            onLogout={async () => {

              await adminLogout();

              /*
               * After admin logout,
               * NEVER remain on dashboard.
               */

              setCurrentTab(
                'admin-login'
              );

              window.location.hash =
                'admin';

            }}

          />
        );


      /* =====================================================
         DEFAULT STUDENT PAGE
         ===================================================== */

      default:

        return (
          <DashboardPage
            onNavigate={handleNavigate}
          />
        );
    }
  };


  /* =========================================================
     ADMIN / LOGIN / PUBLIC PAGES
     DO NOT USE STUDENT APP LAYOUT
     ========================================================= */

  if (

    currentTab === 'login' ||
    currentTab === 'register' ||
    currentTab === 'landing' ||
    currentTab === 'terms' ||
    currentTab === 'privacy' ||
    currentTab === 'admin-login' ||
    currentTab === 'admin-dashboard'

  ) {

    return (
      <div className="min-vh-100">

        {renderContent()}

      </div>
    );
  }


  /* =========================================================
     EXISTING STUDENT APP LAYOUT
     ========================================================= */

  return (

    <AppLayout

      currentTab={currentTab}

      onTabChange={setCurrentTab}

    >

      {renderContent()}

    </AppLayout>

  );
}


/* =========================================================
   ALL EXISTING PROVIDERS
   ========================================================= */

export default function App() {

  return (

    <ThemeProvider>

      <AuthProvider>

        <AdminAuthProvider>

          <PlacementProvider>

            <AppContent />

          </PlacementProvider>

        </AdminAuthProvider>

      </AuthProvider>

    </ThemeProvider>

  );
}