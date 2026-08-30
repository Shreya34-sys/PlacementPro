// import React from "react";
// import {
//   LayoutDashboard,
//   Sparkles,
//   BriefcaseBusiness,
//   BookOpen,
//   ShieldAlert,
//   Bot,
//   Users,
//   Moon,
//   Sun,
//   Palette,
// } from "lucide-react";

// import { AdminTab } from "../../pages/admin/AdminDashboardPage";
// import Button from "react-bootstrap/esm/Button";



// interface AdminHeaderProps {
//   activeTab: AdminTab;
//   setActiveTab: (tab: AdminTab) => void;
//   darkMode: boolean;
//   setDarkMode: (value: boolean) => void;
// }

// const AdminHeader: React.FC<AdminHeaderProps> = ({
//   activeTab,
//   setActiveTab,
//   darkMode,
//   setDarkMode,
// }) => {
//   const navigation = [
//     {
//       id: "command_center" as AdminTab,
//       label: "Command Center",
//       icon: LayoutDashboard,
//     },
//     {
//       id: "rag_market" as AdminTab,
//       label: "RAG & Market AI",
//       icon: Sparkles,
//       badge: 2,
//     },
//     {
//       id: "drives" as AdminTab,
//       label: "Campus Drives",
//       icon: BriefcaseBusiness,
//     },
//     {
//       id: "exams" as AdminTab,
//       label: "Question Bank & Tests",
//       icon: BookOpen,
//     },
//     {
//       id: "proctoring" as AdminTab,
//       label: "AI Proctoring",
//       icon: ShieldAlert,
//       badge: 2,
//       danger: true,
//     },
//     {
//       id: "interviews" as AdminTab,
//       label: "AI Interviews",
//       icon: Bot,
//     },
//     {
//       id: "analytics" as AdminTab,
//       label: "Student Readiness",
//       icon: Users,
//     },
//   ];

//   return (
//     <header className="admin-header">

//       {/* TOP HEADER */}
//       <div className="header-top">

//         <div className="brand-section">

//           <div className="brand-logo">
//             P
//           </div>

//           <div className="brand-info">

//             <div className="brand-title-row">
//               <h1>PlacementPro</h1>

//               <span className="faculty-badge">
//                 Faculty Intelligence Hub
//               </span>
//             </div>

//             <p>
//               KIT's College of Engineering (Autonomous) • Dept. of CSBS
//             </p>

//           </div>
//         </div>


//         {/* RIGHT SIDE */}
//         <div className="header-actions">

//           <button className="header-pill gemini-pill">
//             <Palette size={16} />
//             <span>Gemini Aura</span>
//             <span className="aura-dot" />
//           </button>

//           <button className="header-pill">

//             <Sparkles size={16} />

//             <span>Market AI Alerts</span>

//             <span className="blue-badge">
//               2
//             </span>

//           </button>

//           <button
//             className="theme-button"
//             onClick={() => setDarkMode(!darkMode)}
//             title="Toggle dark mode"
//           >
//             {darkMode ? (
//               <Sun size={19} />
//             ) : (
//               <Moon size={19} />
//             )}
//           </button>

//           <div className="header-divider" />

//           <div className="admin-profile">

//             <div className="admin-avatar">
//               AD
//             </div>

//             <div>
//               <strong>Admin</strong>
//               <span>Placement Officer</span>

//             </div>

//           </div>

//         </div>

//       </div>


//       {/* NAVIGATION */}
//       <nav className="admin-navigation">

//         {navigation.map((item) => {

//           const Icon = item.icon;

//           const active = activeTab === item.id;

//           return (
//             <button
//               key={item.id}
//               className={`nav-item ${active ? "active" : ""}`}
//               onClick={() => setActiveTab(item.id)}
//             >

//               <Icon size={17} />

//               <span>{item.label}</span>

//               {item.badge && (
//                 <span
//                   className={
//                     item.danger
//                       ? "red-badge"
//                       : "blue-badge"
//                   }
//                 >
//                   {item.badge}
//                 </span>
//               )}

//               {!item.badge &&
//                 item.id !== "command_center" && (
//                   <span className="nav-dot" />
//                 )}

//             </button>
//           );
//         })}

//       </nav>

//     </header>
//   );
// };

// export default AdminHeader;




import React from "react";
import {
  LayoutDashboard,
  Sparkles,
  BriefcaseBusiness,
  BookOpen,
  ShieldAlert,
  Bot,
  Users,
  Moon,
  Sun,
  Palette,
} from "lucide-react";

import { AdminTab } from "../../pages/admin/AdminDashboardPage";

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;

  // ADDED FOR LOGOUT
  onLogout: () => void | Promise<void>;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,

  // ADDED
  onLogout,
}) => {
  const navigation = [
    {
      id: "command_center" as AdminTab,
      label: "Command Center",
      icon: LayoutDashboard,
    },
    {
      id: "rag_market" as AdminTab,
      label: "RAG & Market AI",
      icon: Sparkles,
      badge: 2,
    },
    {
      id: "drives" as AdminTab,
      label: "Campus Drives",
      icon: BriefcaseBusiness,
    },
    {
      id: "exams" as AdminTab,
      label: "Question Bank & Tests",
      icon: BookOpen,
    },
    {
      id: "proctoring" as AdminTab,
      label: "AI Proctoring",
      icon: ShieldAlert,
      badge: 2,
      danger: true,
    },
    {
      id: "interviews" as AdminTab,
      label: "AI Interviews",
      icon: Bot,
    },
    {
      id: "analytics" as AdminTab,
      label: "Student Readiness",
      icon: Users,
    },
  ];

  return (
    <header className="admin-header">

      {/* TOP HEADER */}
      <div className="header-top">

        <div className="brand-section">

          <div
            className="brand-logo"
            onClick={() => setActiveTab("command_center")}
          >
            P
          </div>

          <div className="brand-info">

            <div className="brand-title-row">

              <h1>PlacementPro</h1>

              <span className="faculty-badge">
                Faculty Intelligence Hub
              </span>

            </div>

            <p>
              KIT's College of Engineering (Autonomous) • Dept. of CSBS
            </p>

          </div>

        </div>


        {/* RIGHT SIDE */}
        <div className="header-actions">

          <button className="header-pill gemini-pill">
            <Palette size={16} />
            <span>Gemini Aura</span>
            <span className="aura-dot" />
          </button>


          <button
            className="header-pill"
            onClick={() => setActiveTab("rag_market")}
          >
            <Sparkles size={16} />

            <span>Market AI Alerts</span>

            <span className="blue-badge">
              2
            </span>
          </button>


          {/* DARK MODE */}
          <button
            className="theme-button"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>


          <div className="header-divider" />


          {/* ADMIN PROFILE */}
          <div className="admin-profile">

            <div className="admin-avatar">
              AD
            </div>

            <div>
              <strong>Admin</strong>
              <span>Placement Officer</span>
            </div>

          </div>


          {/* LOGOUT BUTTON */}
          <button
            type="button"
            onClick={onLogout}
            className="admin-logout-btn"
          >
            Logout
          </button>

        </div>

      </div>


      {/* NAVIGATION */}
      <nav className="admin-navigation">

        {navigation.map((item) => {

          const Icon = item.icon;

          const active =
            activeTab === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item ${
                active ? "active" : ""
              }`}
              onClick={() =>
                setActiveTab(item.id)
              }
            >

              <Icon size={17} />

              <span>
                {item.label}
              </span>

              {item.badge && (
                <span
                  className={
                    item.danger
                      ? "red-badge"
                      : "blue-badge"
                  }
                >
                  {item.badge}
                </span>
              )}

              {!item.badge &&
                item.id !== "command_center" && (
                  <span className="nav-dot" />
                )}

            </button>
          );
        })}

      </nav>

    </header>
  );
};

export default AdminHeader;