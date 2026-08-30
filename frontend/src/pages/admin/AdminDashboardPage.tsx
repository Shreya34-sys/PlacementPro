// import React, { useEffect, useState } from 'react';
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Button,
//   Table,
//   Badge,
//   Spinner,
//   Alert,
// } from 'react-bootstrap';

// import { collection, getDocs } from 'firebase/firestore';
// import { firestoreDb } from '../../utils/firebase';

// interface AdminDashboardPageProps {
//   onLogout: () => void | Promise<void>;
// }

// interface Student {
//   id: string;
//   name?: string;
//   email?: string;
//   role?: string;
//   department?: string;
//   batchYear?: string | number;
//   problemsSolved?: number;
//   codingXp?: number;
//   aptitudeScore?: number;
//   interviewScore?: number;
//   totalPoints?: number;
// }

// export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
//   onLogout,
// }) => {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const loadStudents = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       if (!firestoreDb) {
//           throw new Error('Firestore is not configured.');
//       }

// const snapshot = await getDocs(
//   collection(firestoreDb, 'users')
// );

//       const users: Student[] = snapshot.docs
//         .map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }))
//         .filter((user: Student) => user.role !== 'admin');

//       setStudents(users);
//     } catch (err) {
//       console.error('Error loading students:', err);
//       setError(
//         err instanceof Error
//           ? err.message
//           : 'Failed to load students.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadStudents();
//   }, []);

//   const totalStudents = students.length;

//   const totalProblemsSolved = students.reduce(
//     (total, student) =>
//       total + (student.problemsSolved || 0),
//     0
//   );

//   const totalCodingXP = students.reduce(
//     (total, student) =>
//       total + (student.codingXp || 0),
//     0
//   );

//   return (
//     <div
//       style={{
//         minHeight: '100vh',
//         backgroundColor: '#F8FAFC',
//         fontFamily: "'Inter', sans-serif",
//       }}
//     >
//       {/* HEADER */}
//       <div
//         className="bg-white border-bottom"
//         style={{ height: '70px' }}
//       >
//         <Container fluid className="h-100 px-4">
//           <div className="d-flex align-items-center justify-content-between h-100">
//             <div className="d-flex align-items-center gap-3">
//               <div
//                 className="rounded-3 d-flex align-items-center justify-content-center"
//                 style={{
//                   width: '42px',
//                   height: '42px',
//                   backgroundColor: '#2563EB',
//                 }}
//               >
//                 <i className="bi bi-shield-lock-fill text-white fs-5" />
//               </div>

//               <div>
//                 <h5 className="mb-0 fw-bold">
//                   PlacementPro Admin
//                 </h5>
//                 <small className="text-secondary">
//                   Administration Dashboard
//                 </small>
//               </div>
//             </div>

//             <Button
//               variant="outline-danger"
//               size="sm"
//               className="fw-semibold"
//               onClick={onLogout}
//             >
//               <i className="bi bi-box-arrow-right me-2" />
//               Logout
//             </Button>
//           </div>
//         </Container>
//       </div>

//       {/* CONTENT */}
//       <Container fluid className="p-4">
//         <div className="mb-4">
//           <h3 className="fw-bold mb-1">
//             Admin Dashboard
//           </h3>

//           <p className="text-secondary mb-0">
//             Manage and monitor PlacementPro students.
//           </p>
//         </div>

//         {error && (
//           <Alert variant="danger">
//             <i className="bi bi-exclamation-triangle-fill me-2" />
//             {error}
//           </Alert>
//         )}

//         {/* STATISTICS */}
//         <Row className="g-4 mb-4">

//           <Col md={4}>
//             <Card className="border-0 shadow-sm h-100">
//               <Card.Body className="p-4">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <div>
//                     <p className="text-secondary mb-1">
//                       Total Students
//                     </p>

//                     <h2 className="fw-bold mb-0">
//                       {loading ? (
//                         <Spinner size="sm" />
//                       ) : (
//                         totalStudents
//                       )}
//                     </h2>
//                   </div>

//                   <div
//                     className="rounded-3 d-flex align-items-center justify-content-center"
//                     style={{
//                       width: '50px',
//                       height: '50px',
//                       backgroundColor: '#EFF6FF',
//                     }}
//                   >
//                     <i
//                       className="bi bi-people-fill fs-4"
//                       style={{ color: '#2563EB' }}
//                     />
//                   </div>
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>


//           <Col md={4}>
//             <Card className="border-0 shadow-sm h-100">
//               <Card.Body className="p-4">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <div>
//                     <p className="text-secondary mb-1">
//                       Problems Solved
//                     </p>

//                     <h2 className="fw-bold mb-0">
//                       {loading ? (
//                         <Spinner size="sm" />
//                       ) : (
//                         totalProblemsSolved
//                       )}
//                     </h2>
//                   </div>

//                   <div
//                     className="rounded-3 d-flex align-items-center justify-content-center"
//                     style={{
//                       width: '50px',
//                       height: '50px',
//                       backgroundColor: '#F0FDF4',
//                     }}
//                   >
//                     <i
//                       className="bi bi-code-slash fs-4"
//                       style={{ color: '#16A34A' }}
//                     />
//                   </div>
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>


//           <Col md={4}>
//             <Card className="border-0 shadow-sm h-100">
//               <Card.Body className="p-4">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <div>
//                     <p className="text-secondary mb-1">
//                       Total Coding XP
//                     </p>

//                     <h2 className="fw-bold mb-0">
//                       {loading ? (
//                         <Spinner size="sm" />
//                       ) : (
//                         totalCodingXP
//                       )}
//                     </h2>
//                   </div>

//                   <div
//                     className="rounded-3 d-flex align-items-center justify-content-center"
//                     style={{
//                       width: '50px',
//                       height: '50px',
//                       backgroundColor: '#FFF7ED',
//                     }}
//                   >
//                     <i
//                       className="bi bi-lightning-fill fs-4"
//                       style={{ color: '#EA580C' }}
//                     />
//                   </div>
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>

//         </Row>


//         {/* STUDENTS TABLE */}
//         <Card className="border-0 shadow-sm">
//           <Card.Header className="bg-white border-0 p-4">
//             <div className="d-flex justify-content-between align-items-center">
//               <div>
//                 <h5 className="fw-bold mb-1">
//                   Students
//                 </h5>

//                 <p className="text-secondary mb-0 fs-7">
//                   Registered students in PlacementPro
//                 </p>
//               </div>

//               <Button
//                 variant="outline-primary"
//                 size="sm"
//                 onClick={loadStudents}
//               >
//                 <i className="bi bi-arrow-clockwise me-2" />
//                 Refresh
//               </Button>
//             </div>
//           </Card.Header>

//           <Card.Body className="p-0">

//             {loading ? (
//               <div className="text-center py-5">
//                 <Spinner />
//                 <p className="text-secondary mt-3 mb-0">
//                   Loading students...
//                 </p>
//               </div>
//             ) : students.length === 0 ? (
//               <div className="text-center py-5">
//                 <i className="bi bi-people fs-1 text-secondary" />

//                 <p className="text-secondary mt-3 mb-0">
//                   No students found.
//                 </p>
//               </div>
//             ) : (
//               <div className="table-responsive">
//                 <Table hover className="mb-0 align-middle">

//                   <thead className="table-light">
//                     <tr>
//                       <th className="px-4">Student</th>
//                       <th>Email</th>
//                       <th>Department</th>
//                       <th>Batch</th>
//                       <th>Problems</th>
//                       <th>XP</th>
//                       <th>Role</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {students.map((student) => (
//                       <tr key={student.id}>

//                         <td className="px-4">
//                           <div className="fw-semibold">
//                             {student.name || 'Unnamed Student'}
//                           </div>

//                           <small className="text-secondary">
//                             {student.id}
//                           </small>
//                         </td>

//                         <td>
//                           {student.email || '-'}
//                         </td>

//                         <td>
//                           {student.department || '-'}
//                         </td>

//                         <td>
//                           {student.batchYear || '-'}
//                         </td>

//                         <td>
//                           <Badge bg="primary">
//                             {student.problemsSolved || 0}
//                           </Badge>
//                         </td>

//                         <td>
//                           <strong>
//                             {student.codingXp || 0}
//                           </strong>
//                         </td>

//                         <td>
//                           <Badge bg="success">
//                             {student.role || 'student'}
//                           </Badge>
//                         </td>

//                       </tr>
//                     ))}
//                   </tbody>

//                 </Table>
//               </div>
//             )}

//           </Card.Body>
//         </Card>

//       </Container>
//     </div>
//   );
// };







import React, { useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import CommandCenter from "../../components/admin/CommandCenter";
import "../../components/admin/AdminDashboard.css";
import AdminProctoringPage from "../../components/admin/AdminProctoringPage";


export type AdminTab =
  | "command_center"
  | "rag_market"
  | "drives"
  | "exams"
  | "proctoring"
  | "interviews"
  | "analytics";

interface AdminDashboardPageProps {
  onLogout: () => void | Promise<void>;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onLogout,
}) => {
  const [activeTab, setActiveTab] =
    useState<AdminTab>("command_center");

  const [darkMode, setDarkMode] =
    useState(false);

  const renderContent = () => {
    switch (activeTab) {

      case "command_center":
        return <CommandCenter />;

      case "rag_market":
        return (
          <div className="admin-placeholder">
            <h2>RAG & Market Intelligence</h2>
            <p>This module will be connected here.</p>
          </div>
        );

      case "drives":
        return (
          <div className="admin-placeholder">
            <h2>Campus Drives</h2>
            <p>This module will be connected here.</p>
          </div>
        );

      case "exams":
        return (
          <div className="admin-placeholder">
            <h2>Question Bank & Tests</h2>
            <p>This module will be connected here.</p>
          </div>
        );

      case "proctoring":
        return (
          <div className="admin-placeholder">
            <h2>AI Proctoring</h2>
             <AdminProctoringPage />;
          </div>
        );

      case "interviews":
        return (
          <div className="admin-placeholder">
            <h2>AI Interviews</h2>
            <p>This module will be connected here.</p>
          </div>
        );

      case "analytics":
        return (
          <div className="admin-placeholder">
            <h2>Student Readiness</h2>
            <p>This module will be connected here.</p>
          </div>
        );

      default:
        return <CommandCenter />;
    }
  };

  return (
    <div
      className={`admin-app ${
        darkMode ? "dark" : "light"
      }`}
    >

      {/* ADMIN HEADER */}
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={onLogout}
      />

      {/* ADMIN CONTENT */}
      <main className="admin-main">
        {renderContent()}
      </main>

      {/* FOOTER */}
      <footer className="admin-footer">
        <span>
          PlacementPro • Department of Computer Science & Business Systems
          (CSBS)
        </span>

        <span>
          Powered by{" "}
          <strong>
            Google Gemini AI Agents
          </strong>{" "}
          & RAG Knowledge Engine
        </span>
      </footer>

    </div>
  );
};

export default AdminDashboardPage;