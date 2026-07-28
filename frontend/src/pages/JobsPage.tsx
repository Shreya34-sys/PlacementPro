import React, { useState } from 'react';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { usePlacement } from '../context/PlacementContext';
import { CompanyDriveCard } from '../components/tpo/CompanyDriveCard';
import { SearchFilter } from '../components/common/SearchFilter';
import { JobPostModal } from '../components/recruiter/JobPostModal';
import { NotificationToast } from '../components/common/NotificationToast';

interface JobsPageProps {
  onSelectJob: (jobId: string) => void;
}

export const JobsPage: React.FC<JobsPageProps> = ({ onSelectJob }) => {
  const { currentUser } = useAuth();
  const { jobDrives, applications, applyForJob, addJobDrive } = usePlacement();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const categories = ['Full Time', 'Internship', 'PPO'];

  const filteredJobs = jobDrives.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || job.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const myApplications = applications.filter((a) => a.studentId === currentUser.id);

  const handleApply = (jobId: string) => {
    const targetJob = jobDrives.find((j) => j.id === jobId);
    if (!targetJob) return;

    applyForJob(
      jobId,
      currentUser.id,
      currentUser.name,
      currentUser.email,
      currentUser.department || 'Computer Science',
      currentUser.cgpa || 8.5
    );

    setToastMessage(`Application successfully submitted for ${targetJob.title} at ${targetJob.companyName}!`);
    setShowToast(true);
  };

  return (
    <Container fluid className="px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Campus Recruitment Drives</h3>
          <p className="text-muted mb-0">Browse and apply for verified corporate placement drives.</p>
        </div>
        {(currentUser.role === 'recruiter' || currentUser.role === 'tpo') && (
          <Button variant="primary" className="fw-semibold" onClick={() => setShowPostModal(true)}>
            <i className="bi bi-plus-lg me-2"></i> Post New Job Drive
          </Button>
        )}
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        placeholder="Search drive by title, company name, location..."
      />

      <Row className="g-4">
        {filteredJobs.length === 0 ? (
          <Col md={12}>
            <div className="text-center py-5 bg-white rounded shadow-sm">
              <i className="bi bi-briefcase text-muted fs-1 d-block mb-2"></i>
              <h5 className="fw-bold text-dark">No job drives found</h5>
              <p className="text-muted fs-7">Try broadening your search term or category filters.</p>
            </div>
          </Col>
        ) : (
          filteredJobs.map((job) => {
            const isApplied = myApplications.some((a) => a.jobId === job.id);
            return (
              <Col key={job.id} md={6} xl={4}>
                <CompanyDriveCard
                  job={job}
                  onApply={currentUser.role === 'student' ? handleApply : undefined}
                  onViewDetails={onSelectJob}
                  isApplied={isApplied}
                />
              </Col>
            );
          })
        )}
      </Row>

      <JobPostModal
        show={showPostModal}
        onHide={() => setShowPostModal(false)}
        onSubmit={(newJob) => {
          addJobDrive(newJob);
          setToastMessage(`Job drive for "${newJob.title}" at ${newJob.companyName} published!`);
          setShowToast(true);
        }}
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
