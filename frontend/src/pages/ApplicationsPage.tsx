import React, { useState } from 'react';
import { Container, Card, Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { usePlacement } from '../context/PlacementContext';
import { JobApplication, ApplicationStatus } from '../types';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { ApplicantStatusModal } from '../components/recruiter/ApplicantStatusModal';
import { formatDate } from '../utils/formatters';
import { NotificationToast } from '../components/common/NotificationToast';

export const ApplicationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { applications, updateApplicationStatus } = usePlacement();

  const userRole = currentUser?.role || 'student';
  const userId = currentUser?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeApplication, setActiveApplication] = useState<JobApplication | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // If student, filter for own apps; if recruiter/TPO, see all apps
  const visibleApplications = userRole === 'student'
    ? applications.filter((a) => a.studentId === userId)
    : applications;


  const filteredApps = visibleApplications.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Company & Position',
      accessor: (app: JobApplication) => (
        <div>
          <div className="fw-bold text-dark">{app.jobTitle}</div>
          <small className="text-primary fw-medium">{app.companyName}</small>
        </div>
      ),
    },
    {
      header: 'Applicant',
      accessor: (app: JobApplication) => (
        <div>
          <div className="fw-semibold">{app.studentName}</div>
          <small className="text-muted">{app.department} &bull; {app.cgpa} CGPA</small>
        </div>
      ),
    },
    {
      header: 'Applied Date',
      accessor: (app: JobApplication) => (
        <small className="text-muted">{formatDate(app.appliedDate)}</small>
      ),
    },
    {
      header: 'Stage Status',
      accessor: (app: JobApplication) => <StatusBadge status={app.status} />,
    },
    ...(userRole === 'recruiter' || userRole === 'tpo'
      ? [
          {
            header: 'Action',
            accessor: (app: JobApplication) => (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setActiveApplication(app);
                  setShowStatusModal(true);
                }}
              >
                <i className="bi bi-pencil me-1"></i> Stage
              </Button>
            ),
          },
        ]
      : []),
  ];

  const handleUpdateStatus = (appId: string, newStatus: ApplicationStatus) => {
    updateApplicationStatus(appId, newStatus);
    setToastMessage(`Application stage updated to "${newStatus}"!`);
    setShowToast(true);
  };

  return (
    <Container fluid className="px-0">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">
          {userRole === 'student' ? 'My Placement Applications' : 'Candidate Applications Manager'}
        </h3>
        <p className="text-muted mb-0">
          {userRole === 'student'
            ? 'Track recruitment drive round stages and response history.'
            : 'Review submitted applications, manage candidate shortlists, and advance round stages.'}
        </p>
      </div>

      <Row className="g-3 mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text className="bg-white text-muted">
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by student name, company, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="All">All Application Stages</option>
            <option value="Applied">Applied</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Technical Round">Technical Round</option>
            <option value="HR Round">HR Round</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </Form.Select>
        </Col>
      </Row>

      <DataTable columns={columns} data={filteredApps} emptyMessage="No application records match your filter." />

      <ApplicantStatusModal
        show={showStatusModal}
        application={activeApplication}
        onHide={() => setShowStatusModal(false)}
        onUpdateStatus={handleUpdateStatus}
      />

      <NotificationToast
        show={showToast}
        message={toastMessage}
        variant="success"
        onClose={() => setShowToast(false)}
      />
    </Container>
  );
};
