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

// import {
//   collection,
//   getDocs,
// } from 'firebase/firestore';

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

// type AdminRoute =
//   | 'dashboard'
//   | 'students'
//   | 'companies'
//   | 'jobs'
//   | 'analytics';

// export const AdminDashboardPage: React.FC<
//   AdminDashboardPageProps
// > = ({ onLogout }) => {

//   /*
//    * -----------------------------------------
//    * ADMIN ROUTE
//    * -----------------------------------------
//    */

//   const getAdminRoute = (): AdminRoute => {

//     const hash = window.location.hash;

//     if (hash === '#admin/students') {
//       return 'students';
//     }

//     if (hash === '#admin/companies') {
//       return 'companies';
//     }

//     if (hash === '#admin/jobs') {
//       return 'jobs';
//     }

//     if (hash === '#admin/analytics') {
//       return 'analytics';
//     }

//     return 'dashboard';
//   };


//   const [currentRoute, setCurrentRoute] =
//     useState<AdminRoute>(
//       getAdminRoute()
//     );


//   /*
//    * Change admin page
//    */

//   const navigateAdmin = (
//     route: AdminRoute
//   ) => {

//     window.location.hash =
//       route === 'dashboard'
//         ? 'admin/dashboard'
//         : `admin/${route}`;

//     setCurrentRoute(route);
//   };


//   /*
//    * Listen to browser hash changes
//    */

//   useEffect(() => {

//     const handleHashChange = () => {

//       setCurrentRoute(
//         getAdminRoute()
//       );
//     };

//     window.addEventListener(
//       'hashchange',
//       handleHashChange
//     );

//     return () => {
//       window.removeEventListener(
//         'hashchange',
//         handleHashChange
//       );
//     };

//   }, []);


//   /*
//    * -----------------------------------------
//    * STUDENTS DATA
//    * -----------------------------------------
//    */

//   const [students, setStudents] =
//     useState<Student[]>([]);

//   const [loading, setLoading] =
//     useState(true);

//   const [error, setError] =
//     useState('');


//   const loadStudents = async () => {

//     try {

//       setLoading(true);
//       setError('');

//       if (!firestoreDb) {
//         throw new Error(
//           'Firestore is not configured.'
//         );
//       }

//       const snapshot =
//         await getDocs(
//           collection(
//             firestoreDb,
//             'users'
//           )
//         );

//       const users: Student[] =
//         snapshot.docs
//           .map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           }))
//           .filter(
//             (user: Student) =>
//               user.role !== 'admin'
//           );

//       setStudents(users);

//     } catch (err) {

//       console.error(
//         'Error loading students:',
//         err
//       );

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


//   /*
//    * -----------------------------------------
//    * STATISTICS
//    * -----------------------------------------
//    */

//   const totalStudents =
//     students.length;

//   const totalProblemsSolved =
//     students.reduce(
//       (total, student) =>
//         total +
//         (student.problemsSolved || 0),
//       0
//     );

//   const totalCodingXP =
//     students.reduce(
//       (total, student) =>
//         total +
//         (student.codingXp || 0),
//       0
//     );


//   /*
//    * -----------------------------------------
//    * DASHBOARD HOME
//    * -----------------------------------------
//    */

//   const renderDashboard = () => {

//     return (
//       <>
//         <div className="mb-4">

//           <h3 className="fw-bold mb-1">
//             Admin Dashboard
//           </h3>

//           <p className="text-secondary mb-0">
//             Manage and monitor PlacementPro.
//           </p>

//         </div>


//         {error && (
//           <Alert variant="danger">
//             {error}
//           </Alert>
//         )}


//         <Row className="g-4 mb-4">

//           <Col md={4}>

//             <Card className="border-0 shadow-sm h-100">

//               <Card.Body className="p-4">

//                 <p className="text-secondary mb-1">
//                   Total Students
//                 </p>

//                 <h2 className="fw-bold mb-0">

//                   {loading ? (
//                     <Spinner size="sm" />
//                   ) : (
//                     totalStudents
//                   )}

//                 </h2>

//               </Card.Body>

//             </Card>

//           </Col>


//           <Col md={4}>

//             <Card className="border-0 shadow-sm h-100">

//               <Card.Body className="p-4">

//                 <p className="text-secondary mb-1">
//                   Problems Solved
//                 </p>

//                 <h2 className="fw-bold mb-0">

//                   {loading ? (
//                     <Spinner size="sm" />
//                   ) : (
//                     totalProblemsSolved
//                   )}

//                 </h2>

//               </Card.Body>

//             </Card>

//           </Col>


//           <Col md={4}>

//             <Card className="border-0 shadow-sm h-100">

//               <Card.Body className="p-4">

//                 <p className="text-secondary mb-1">
//                   Total Coding XP
//                 </p>

//                 <h2 className="fw-bold mb-0">

//                   {loading ? (
//                     <Spinner size="sm" />
//                   ) : (
//                     totalCodingXP
//                   )}

//                 </h2>

//               </Card.Body>

//             </Card>

//           </Col>

//         </Row>

//       </>
//     );
//   };


//   /*
//    * -----------------------------------------
//    * STUDENTS PAGE
//    * -----------------------------------------
//    */

//   const renderStudents = () => {

//     return (
//       <Card className="border-0 shadow-sm">

//         <Card.Header
//           className="bg-white border-0 p-4"
//         >

//           <div className="d-flex justify-content-between align-items-center">

//             <div>

//               <h5 className="fw-bold mb-1">
//                 Students
//               </h5>

//               <p className="text-secondary mb-0">
//                 Registered PlacementPro students
//               </p>

//             </div>


//             <Button
//               variant="outline-primary"
//               size="sm"
//               onClick={loadStudents}
//             >
//               Refresh
//             </Button>

//           </div>

//         </Card.Header>


//         <Card.Body className="p-0">

//           {loading ? (

//             <div className="text-center py-5">

//               <Spinner />

//               <p className="text-secondary mt-3">
//                 Loading students...
//               </p>

//             </div>

//           ) : students.length === 0 ? (

//             <div className="text-center py-5">

//               <i className="bi bi-people fs-1 text-secondary" />

//               <p className="text-secondary mt-3">
//                 No students found.
//               </p>

//             </div>

//           ) : (

//             <div className="table-responsive">

//               <Table
//                 hover
//                 className="mb-0 align-middle"
//               >

//                 <thead className="table-light">

//                   <tr>

//                     <th className="px-4">
//                       Student
//                     </th>

//                     <th>Email</th>

//                     <th>Department</th>

//                     <th>Batch</th>

//                     <th>Problems</th>

//                     <th>XP</th>

//                     <th>Role</th>

//                   </tr>

//                 </thead>


//                 <tbody>

//                   {students.map(
//                     (student) => (

//                       <tr key={student.id}>

//                         <td className="px-4">

//                           <div className="fw-semibold">
//                             {student.name ||
//                               'Unnamed Student'}
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

//                     )
//                   )}

//                 </tbody>

//               </Table>

//             </div>

//           )}

//         </Card.Body>

//       </Card>
//     );
//   };


//   /*
//    * -----------------------------------------
//    * OTHER PAGES
//    * -----------------------------------------
//    */     

//   const renderOtherPage = (
//     title: string,
//     description: string
//   ) => {

//     return (
//       <Card className="border-0 shadow-sm">

//         <Card.Body className="p-5 text-center">

//           <h3 className="fw-bold">
//             {title}
//           </h3>

//           <p className="text-secondary">
//             {description}
//           </p>

//           <p className="small text-muted">
//             This admin module can be added here.
//           </p>

//         </Card.Body>

//       </Card>
//     );
//   };


//   /*
//    * -----------------------------------------
//    * CURRENT PAGE
//    * -----------------------------------------
//    */

//   const renderCurrentPage = () => {

//     switch (currentRoute) {

//       case 'students':
//         return renderStudents();

//       case 'companies':
//         return renderOtherPage(
//           'Companies',
//           'Manage placement companies.'
//         );

//       case 'jobs':
//         return renderOtherPage(
//           'Jobs',
//           'Manage placement drives and jobs.'
//         );

//       case 'analytics':
//         return renderOtherPage(
//           'Analytics',
//           'View placement analytics.'
//         );

//       case 'dashboard':
//       default:
//         return renderDashboard();
//     }
//   };


//   /*
//    * -----------------------------------------
//    * UI
//    * -----------------------------------------
//    */

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
//         style={{
//           height: '70px',
//         }}
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


//       {/* NAVIGATION */}

//       <div className="bg-white border-bottom">

//         <Container fluid className="px-4">

//           <div className="d-flex gap-2 py-2 flex-wrap">

//             <Button
//               size="sm"
//               variant={
//                 currentRoute === 'dashboard'
//                   ? 'primary'
//                   : 'light'
//               }
//               onClick={() =>
//                 navigateAdmin('dashboard')
//               }
//             >
//               Dashboard
//             </Button>


//             <Button
//               size="sm"
//               variant={
//                 currentRoute === 'students'
//                   ? 'primary'
//                   : 'light'
//               }
//               onClick={() =>
//                 navigateAdmin('students')
//               }
//             >
//               Students
//             </Button>


//             <Button
//               size="sm"
//               variant={
//                 currentRoute === 'companies'
//                   ? 'primary'
//                   : 'light'
//               }
//               onClick={() =>
//                 navigateAdmin('companies')
//               }
//             >
//               Companies
//             </Button>


//             <Button
//               size="sm"
//               variant={
//                 currentRoute === 'jobs'
//                   ? 'primary'
//                   : 'light'
//               }
//               onClick={() =>
//                 navigateAdmin('jobs')
//               }
//             >
//               Jobs
//             </Button>


//             <Button
//               size="sm"
//               variant={
//                 currentRoute === 'analytics'
//                   ? 'primary'
//                   : 'light'
//               }
//               onClick={() =>
//                 navigateAdmin('analytics')
//               }
//             >
//               Analytics
//             </Button>

//           </div>

//         </Container>

//       </div>


//       {/* CONTENT */}

//       <Container fluid className="p-4">

//         {renderCurrentPage()}

//       </Container>

//     </div>
//   );
// };










import React, { useEffect, useState } from 'react';

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Spinner,
  Alert,
} from 'react-bootstrap';

import {
  collection,
  getDocs,
} from 'firebase/firestore';

import { motion } from 'framer-motion';

import { firestoreDb } from '../../utils/firebase';

import './AdminDashboard.css';


interface AdminDashboardPageProps {
  onLogout: () => void | Promise<void>;
}


interface Student {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  batchYear?: string | number;
  problemsSolved?: number;
  codingXp?: number;
  aptitudeScore?: number;
  interviewScore?: number;
  totalPoints?: number;
}


type AdminRoute =
  | 'dashboard'
  | 'students'
  | 'companies'
  | 'jobs'
  | 'analytics';


export const AdminDashboardPage: React.FC<
  AdminDashboardPageProps
> = ({ onLogout }) => {

  /*
   * -----------------------------------------
   * ADMIN ROUTE
   * -----------------------------------------
   */

  const getAdminRoute = (): AdminRoute => {

    const hash = window.location.hash;

    if (hash === '#admin/students') {
      return 'students';
    }

    if (hash === '#admin/companies') {
      return 'companies';
    }

    if (hash === '#admin/jobs') {
      return 'jobs';
    }

    if (hash === '#admin/analytics') {
      return 'analytics';
    }

    return 'dashboard';
  };


  const [currentRoute, setCurrentRoute] =
    useState<AdminRoute>(getAdminRoute());


  const navigateAdmin = (route: AdminRoute) => {

    window.location.hash =
      route === 'dashboard'
        ? 'admin/dashboard'
        : `admin/${route}`;

    setCurrentRoute(route);
  };


  useEffect(() => {

    const handleHashChange = () => {
      setCurrentRoute(getAdminRoute());
    };

    window.addEventListener(
      'hashchange',
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange
      );
    };

  }, []);


  /*
   * -----------------------------------------
   * STUDENTS DATA
   * -----------------------------------------
   */

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  const loadStudents = async () => {

    try {

      setLoading(true);
      setError('');

      if (!firestoreDb) {
        throw new Error(
          'Firestore is not configured.'
        );
      }

      const snapshot =
        await getDocs(
          collection(
            firestoreDb,
            'users'
          )
        );


      const users: Student[] =
        snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (user: Student) =>
              user.role !== 'admin'
          );


      setStudents(users);

    } catch (err) {

      console.error(
        'Error loading students:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load students.'
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    loadStudents();
  }, []);


  /*
   * -----------------------------------------
   * STATISTICS
   * -----------------------------------------
   */

  const totalStudents =
    students.length;


  const totalProblemsSolved =
    students.reduce(
      (total, student) =>
        total +
        (student.problemsSolved || 0),
      0
    );


  const totalCodingXP =
    students.reduce(
      (total, student) =>
        total +
        (student.codingXp || 0),
      0
    );


  /*
   * -----------------------------------------
   * STAT CARD
   * -----------------------------------------
   */

  const StatCard = ({
    icon,
    title,
    value,
    description,
    delay,
  }: {
    icon: string;
    title: string;
    value: number;
    description: string;
    delay: number;
  }) => {

    return (

      <motion.div
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay,
        }}
        whileHover={{
          y: -6,
        }}
      >

        <Card className="command-stat-card h-100">

          <Card.Body className="p-4">

            <div className="d-flex justify-content-between align-items-start">

              <div>

                <div className="stat-label">
                  {title}
                </div>

                <div className="stat-number">

                  {loading ? (
                    <Spinner
                      animation="border"
                      size="sm"
                    />
                  ) : (
                    value.toLocaleString()
                  )}

                </div>

                <div className="stat-description">
                  {description}
                </div>

              </div>


              <div className="stat-icon">

                <i
                  className={`bi ${icon}`}
                />

              </div>

            </div>


            <div className="stat-line">

              <span />

            </div>

          </Card.Body>

        </Card>

      </motion.div>

    );

  };


  /*
   * -----------------------------------------
   * DASHBOARD HOME
   * -----------------------------------------
   */

  const renderDashboard = () => {

    return (

      <div className="command-center">


        {/* HERO */}

        <motion.div
          className="command-hero"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
        >

          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />


          <div className="hero-content">

            <div className="hero-status">

              <span className="status-dot" />

              SYSTEM ONLINE

            </div>


            <h1>
              Command Center
            </h1>


            <p>
              Welcome back, Admin.
              Monitor your placement ecosystem,
              student performance and recruitment
              activity from one central workspace.
            </p>


            <div className="hero-actions">

              <Button
                className="hero-primary-btn"
                onClick={() =>
                  navigateAdmin('students')
                }
              >

                <i className="bi bi-people-fill me-2" />

                View Students

              </Button>


              <Button
                className="hero-secondary-btn"
                onClick={() =>
                  navigateAdmin('analytics')
                }
              >

                <i className="bi bi-bar-chart-fill me-2" />

                View Analytics

              </Button>

            </div>

          </div>


          <div className="hero-orbit">

            <div className="orbit-ring orbit-ring-one" />

            <div className="orbit-ring orbit-ring-two" />

            <div className="orbit-core">

              <i className="bi bi-command" />

            </div>

          </div>

        </motion.div>


        {/* ERROR */}

        {error && (

          <Alert
            variant="danger"
            className="mt-4"
          >
            {error}
          </Alert>

        )}


        {/* STATISTICS */}

        <div className="section-heading">

          <div>

            <span className="section-kicker">
              OVERVIEW
            </span>

            <h3>
              Platform Intelligence
            </h3>

          </div>


          <Button
            variant="light"
            className="refresh-button"
            onClick={loadStudents}
          >

            <i className="bi bi-arrow-clockwise me-2" />

            Refresh

          </Button>

        </div>


        <Row className="g-4">

          <Col
            xl={4}
            md={6}
          >

            <StatCard
              icon="bi-people-fill"
              title="TOTAL STUDENTS"
              value={totalStudents}
              description="Registered learners"
              delay={0.15}
            />

          </Col>


          <Col
            xl={4}
            md={6}
          >

            <StatCard
              icon="bi-code-slash"
              title="PROBLEMS SOLVED"
              value={totalProblemsSolved}
              description="Coding challenges completed"
              delay={0.25}
            />

          </Col>


          <Col
            xl={4}
            md={12}
          >

            <StatCard
              icon="bi-lightning-charge-fill"
              title="CODING XP"
              value={totalCodingXP}
              description="Total student experience"
              delay={0.35}
            />

          </Col>

        </Row>


        {/* LOWER SECTION */}

        <Row className="g-4 mt-1">


          {/* ACTIVITY */}

          <Col lg={8}>

            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.45,
              }}
            >

              <Card className="command-panel h-100">

                <Card.Body className="p-4">

                  <div className="panel-header">

                    <div>

                      <span className="section-kicker">
                        LIVE OVERVIEW
                      </span>

                      <h4>
                        Placement Activity
                      </h4>

                    </div>


                    <Badge className="live-badge">

                      <span className="status-dot small" />

                      LIVE

                    </Badge>

                  </div>


                  <div className="activity-area">

                    <div className="activity-circle">

                      <i className="bi bi-graph-up-arrow" />

                    </div>


                    <div>

                      <h5>
                        Placement intelligence
                      </h5>

                      <p>
                        Your student performance,
                        recruitment activity and
                        placement analytics will
                        appear here.
                      </p>

                    </div>

                  </div>

                </Card.Body>

              </Card>

            </motion.div>

          </Col>


          {/* QUICK ACTIONS */}

          <Col lg={4}>

            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.55,
              }}
            >

              <Card className="command-panel h-100">

                <Card.Body className="p-4">

                  <span className="section-kicker">
                    SHORTCUTS
                  </span>

                  <h4 className="mb-4">
                    Quick Actions
                  </h4>


                  <button
                    className="quick-action"
                    onClick={() =>
                      navigateAdmin('students')
                    }
                  >

                    <span className="quick-icon">
                      <i className="bi bi-people" />
                    </span>

                    <span>
                      <strong>
                        Students
                      </strong>

                      <small>
                        Manage student profiles
                      </small>
                    </span>

                    <i className="bi bi-chevron-right ms-auto" />

                  </button>


                  <button
                    className="quick-action"
                    onClick={() =>
                      navigateAdmin('companies')
                    }
                  >

                    <span className="quick-icon">
                      <i className="bi bi-buildings" />
                    </span>

                    <span>
                      <strong>
                        Companies
                      </strong>

                      <small>
                        Manage recruiters
                      </small>
                    </span>

                    <i className="bi bi-chevron-right ms-auto" />

                  </button>


                  <button
                    className="quick-action"
                    onClick={() =>
                      navigateAdmin('jobs')
                    }
                  >

                    <span className="quick-icon">
                      <i className="bi bi-briefcase" />
                    </span>

                    <span>
                      <strong>
                        Jobs
                      </strong>

                      <small>
                        Manage placement drives
                      </small>
                    </span>

                    <i className="bi bi-chevron-right ms-auto" />

                  </button>


                  <button
                    className="quick-action"
                    onClick={() =>
                      navigateAdmin('analytics')
                    }
                  >

                    <span className="quick-icon">
                      <i className="bi bi-bar-chart" />
                    </span>

                    <span>
                      <strong>
                        Analytics
                      </strong>

                      <small>
                        View placement insights
                      </small>
                    </span>

                    <i className="bi bi-chevron-right ms-auto" />

                  </button>

                </Card.Body>

              </Card>

            </motion.div>

          </Col>

        </Row>

      </div>

    );

  };


  /*
   * -----------------------------------------
   * STUDENTS PAGE
   * -----------------------------------------
   */

  const renderStudents = () => {

    return (

      <Card className="command-panel">

        <Card.Header className="command-panel-header">

          <div>

            <span className="section-kicker">
              MANAGEMENT
            </span>

            <h4 className="mb-1">
              Students
            </h4>

            <p className="mb-0">
              Registered PlacementPro students
            </p>

          </div>


          <Button
            className="refresh-button"
            onClick={loadStudents}
          >

            <i className="bi bi-arrow-clockwise me-2" />

            Refresh

          </Button>

        </Card.Header>


        <Card.Body className="p-0">

          {loading ? (

            <div className="text-center py-5">

              <Spinner />

              <p className="text-secondary mt-3">
                Loading students...
              </p>

            </div>

          ) : students.length === 0 ? (

            <div className="text-center py-5">

              <i className="bi bi-people fs-1 text-secondary" />

              <p className="text-secondary mt-3">
                No students found.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <Table
                hover
                className="mb-0 align-middle command-table"
              >

                <thead>

                  <tr>

                    <th className="px-4">
                      Student
                    </th>

                    <th>Email</th>

                    <th>Department</th>

                    <th>Batch</th>

                    <th>Problems</th>

                    <th>XP</th>

                    <th>Role</th>

                  </tr>

                </thead>


                <tbody>

                  {students.map(
                    (student) => (

                      <tr key={student.id}>

                        <td className="px-4">

                          <div className="fw-semibold">
                            {student.name ||
                              'Unnamed Student'}
                          </div>

                          <small className="text-secondary">
                            {student.id}
                          </small>

                        </td>


                        <td>
                          {student.email || '-'}
                        </td>


                        <td>
                          {student.department || '-'}
                        </td>


                        <td>
                          {student.batchYear || '-'}
                        </td>


                        <td>

                          <Badge bg="primary">
                            {student.problemsSolved || 0}
                          </Badge>

                        </td>


                        <td>
                          <strong>
                            {student.codingXp || 0}
                          </strong>
                        </td>


                        <td>

                          <Badge bg="success">
                            {student.role || 'student'}
                          </Badge>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </Table>

            </div>

          )}

        </Card.Body>

      </Card>

    );

  };


  /*
   * -----------------------------------------
   * OTHER PAGES
   * -----------------------------------------
   */

  const renderOtherPage = (
    title: string,
    description: string
  ) => {

    return (

      <Card className="command-panel">

        <Card.Body className="p-5 text-center">

          <span className="section-kicker">
            ADMIN MODULE
          </span>

          <h3 className="fw-bold mt-2">
            {title}
          </h3>

          <p className="text-secondary">
            {description}
          </p>

          <p className="small text-muted">
            This admin module can be added here.

          </p>

        </Card.Body>

      </Card>

    );

  };


  /*
   * -----------------------------------------
   * CURRENT PAGE
   * -----------------------------------------
   */

  const renderCurrentPage = () => {

    switch (currentRoute) {

      case 'students':
        return renderStudents();

      case 'companies':
        return renderOtherPage(
          'Companies',
          'Manage placement companies.'
        );

      case 'jobs':
        return renderOtherPage(
          'Jobs',
          'Manage placement drives and jobs.'
        );

      case 'analytics':
        return renderOtherPage(
          'Analytics',
          'View placement analytics.'
        );

      case 'dashboard':
      default:
        return renderDashboard();

    }

  };


  /*
   * -----------------------------------------
   * UI
   * -----------------------------------------
   */

  return (

    <div className="admin-shell">


      {/* HEADER */}

      <header className="command-header">

        <Container
          fluid
          className="px-4 px-lg-5"
        >

          <div className="header-inner">


            {/* BRAND */}

            <div className="brand-area">

              <div className="brand-logo">

                <i className="bi bi-command" />

              </div>


              <div>

                <div className="brand-name">
                  PlacementPro
                </div>

                <div className="brand-subtitle">
                  COMMAND CENTER
                </div>

              </div>

            </div>


            {/* RIGHT SIDE */}

            <div className="header-right">


              <div className="system-status">

                <span className="status-dot" />

                <span>
                  System Online
                </span>

              </div>


              <div className="admin-profile">

                <div className="admin-avatar">
                  A
                </div>

                <div className="admin-info">

                  <strong>
                    Administrator
                  </strong>

                  <small>
                    Admin Access
                  </small>

                </div>

              </div>


              <Button
                className="logout-btn"
                onClick={onLogout}
              >

                <i className="bi bi-box-arrow-right" />

                <span className="d-none d-md-inline">
                  Logout
                </span>

              </Button>

            </div>

          </div>

        </Container>

      </header>


      {/* NAVIGATION */}

      <nav className="command-nav">

        <Container
          fluid
          className="px-4 px-lg-5"
        >

          <div className="nav-inner">


            <button
              className={
                `command-nav-item ${
                  currentRoute === 'dashboard'
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                navigateAdmin('dashboard')
              }
            >

              <i className="bi bi-grid-1x2-fill" />

              Dashboard

            </button>


            <button
              className={
                `command-nav-item ${
                  currentRoute === 'students'
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                navigateAdmin('students')
              }
            >

              <i className="bi bi-people-fill" />

              Students

            </button>


            <button
              className={
                `command-nav-item ${
                  currentRoute === 'companies'
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                navigateAdmin('companies')
              }
            >

              <i className="bi bi-buildings-fill" />

              Companies

            </button>


            <button
              className={
                `command-nav-item ${
                  currentRoute === 'jobs'
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                navigateAdmin('jobs')
              }
            >

              <i className="bi bi-briefcase-fill" />

              Jobs

            </button>


            <button
              className={
                `command-nav-item ${
                  currentRoute === 'analytics'
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                navigateAdmin('analytics')
              }
            >

              <i className="bi bi-bar-chart-fill" />

              Analytics

            </button>

          </div>

        </Container>

      </nav>


      {/* CONTENT */}

      <main className="command-main">

        <Container
          fluid
          className="px-4 px-lg-5"
        >

          {renderCurrentPage()}

        </Container>

      </main>

    </div>

  );

};






















































