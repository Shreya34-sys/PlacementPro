import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { usePlacement } from '../context/PlacementContext';
import { formatDate } from '../utils/formatters';
import { NotificationToast } from '../components/common/NotificationToast';
import { StatusBadge } from '../components/common/StatusBadge';

interface JobDetailsPageProps {
  jobId: string;
  onBack: () => void;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ jobId, onBack }) => {
  const { currentUser } = useAuth();
  const { jobDrives, applications, applyForJob } = usePlacement();
  const [showToast, setShowToast] = useState(false);

  const userRole = currentUser?.role || 'student';
  const userId = currentUser?.id || '';
  const userCgpa = currentUser?.cgpa || 8.5;

  const job = jobDrives.find((j) => j.id === jobId) || jobDrives[0];
  const driveApplications = applications.filter((a) => a.jobId === job.id);
  const myApplication = applications.find((a) => a.jobId === job.id && a.studentId === userId);

  const isEligible = userCgpa >= job.eligibilityCgpa;

  const handleApply = () => {
    if (!currentUser) return;
    applyForJob(
      job.id,
      currentUser.id,
      currentUser.name,
      currentUser.email,
      currentUser.department || 'Computer Science',
      userCgpa
    );
    setShowToast(true);
  };


  return (
    <Container fluid className="px-0">
      <Button variant="outline-secondary" size="sm" onClick={onBack} className="mb-4">
        <i className="bi bi-arrow-left me-1"></i> Back to All Drives
      </Button>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <Badge bg="primary" className="mb-2 px-3 py-1.5">{job.category}</Badge>
                  <h2 className="fw-bold mb-1 text-dark">{job.title}</h2>
                  <h5 className="text-primary fw-semibold">{job.companyName}</h5>
                </div>
                <Badge bg={job.status === 'Active' ? 'success' : 'secondary'} className="fs-7 px-3 py-1.5">
                  {job.status} Drive
                </Badge>
              </div>

              <div className="d-flex flex-wrap gap-4 p-3 bg-light rounded my-4 fs-7">
                <div>
                  <small className="text-muted d-block text-uppercase">Compensation / CTC</small>
                  <span className="fw-bold text-dark fs-6">{job.ctc}</span>
                </div>
                <div>
                  <small className="text-muted d-block text-uppercase">Location</small>
                  <span className="fw-bold text-dark fs-6">{job.location}</span>
                </div>
                <div>
                  <small className="text-muted d-block text-uppercase">Deadline</small>
                  <span className="fw-bold text-dark fs-6">{formatDate(job.deadline)}</span>
                </div>
                <div>
                  <small className="text-muted d-block text-uppercase">Drive Date</small>
                  <span className="fw-bold text-dark fs-6">{formatDate(job.driveDate)}</span>
                </div>
              </div>

              <h5 className="fw-bold text-dark mb-3">Job Description & Role Summary</h5>
              <p className="text-muted mb-4 lead fs-6">{job.description}</p>

              <h5 className="fw-bold text-dark mb-3">Technical Skills & Requirements</h5>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {job.requirements.map((req, idx) => (
                  <Badge key={idx} bg="secondary" className="px-3 py-2 fs-7 fw-normal">
                    <i className="bi bi-check-circle-fill me-1 text-info"></i> {req}
                  </Badge>
                ))}
              </div>

              <h5 className="fw-bold text-dark mb-3">Allowed Branches & Majors</h5>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {job.allowedBranches.map((branch, idx) => (
                  <Badge key={idx} bg="light" text="dark" className="border px-3 py-2 fs-7 fw-normal">
                    <i className="bi bi-building me-1 text-primary"></i> {branch}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Recruiter / TPO Applicants List */}
          {(userRole === 'recruiter' || userRole === 'tpo') && (
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-bold py-3">
                <i className="bi bi-people text-primary me-2"></i> Applicants for this Drive ({driveApplications.length})
              </Card.Header>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light fs-7 text-uppercase">
                  <tr>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>CGPA</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driveApplications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">No applications received yet.</td>
                    </tr>
                  ) : (
                    driveApplications.map((app) => (
                      <tr key={app.id}>
                        <td className="fw-bold">{app.studentName}</td>
                        <td>{app.department}</td>
                        <td><span className="badge bg-light text-dark">{app.cgpa} CGPA</span></td>
                        <td><StatusBadge status={app.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          )}
        </Col>

        {/* Right Sidebar Eligibility & Action */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
            <Card.Header className="bg-white fw-bold py-3">
              <i className="bi bi-shield-check text-success me-2"></i> Eligibility & Application
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-3 p-3 rounded bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted fw-semibold">Required Cutoff:</small>
                  <span className="fw-bold">{job.eligibilityCgpa} CGPA</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted fw-semibold">Your CGPA Score:</small>
                  <span className={`fw-bold ${isEligible ? 'text-success' : 'text-danger'}`}>
                    {userCgpa} CGPA
                  </span>
                </div>
              </div>

              {userRole === 'student' && (
                <>
                  {myApplication ? (
                    <div className="alert alert-success text-center mb-0">
                      <i className="bi bi-check-circle-fill fs-3 d-block mb-1"></i>
                      <div className="fw-bold mb-1">You have applied!</div>
                      <small className="d-block mb-2">Stage: {myApplication.status}</small>
                      <StatusBadge status={myApplication.status} />
                    </div>
                  ) : isEligible ? (
                    <Button variant="primary" className="w-100 py-2.5 fw-bold" onClick={handleApply}>
                      <i className="bi bi-send-fill me-2"></i> One-Click Apply Now
                    </Button>
                  ) : (
                    <Button variant="danger" className="w-100 py-2.5 fw-bold" disabled>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i> CGPA Criteria Not Met
                    </Button>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <NotificationToast
        show={showToast}
        message={`Successfully applied for ${job.title} at ${job.companyName}!`}
        variant="success"
        onClose={() => setShowToast(false)}
      />
    </Container>
  );
};
