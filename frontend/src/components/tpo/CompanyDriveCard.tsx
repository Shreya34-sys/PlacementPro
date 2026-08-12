import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { JobDrive } from '../../types';
import { formatDate } from '../../utils/formatters';
import { CompanyLogo } from '../common/CompanyLogo';

interface CompanyDriveCardProps {
  job: JobDrive;
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  isApplied?: boolean;
}

export const CompanyDriveCard: React.FC<CompanyDriveCardProps> = ({
  job,
  onApply,
  onViewDetails,
  isApplied = false,
}) => {
  return (
    <Card className="shadow-sm border-0 h-100 hover-shadow transition-all">
      <Card.Body className="d-flex flex-column p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center gap-3">
            <CompanyLogo companyName={job.companyName} size={48} />
            <div>
              <Badge bg={job.category === 'Full Time' ? 'primary' : 'info'} className="mb-1">
                {job.category}
              </Badge>
              <h5 className="fw-bold text-dark mb-0">{job.title}</h5>
              <h6 className="text-primary fw-semibold mb-0 fs-7">{job.companyName}</h6>
            </div>
          </div>
          <Badge bg={job.status === 'Active' ? 'success' : 'secondary'} className="px-2 py-1">
            {job.status}
          </Badge>
        </div>

        <p className="text-muted fs-7 line-clamp-2 mb-3">{job.description}</p>

        <div className="bg-light rounded p-2.5 mb-3 fs-7">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Package / CTC:</span>
            <span className="fw-bold text-dark">{job.ctc}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Min CGPA Cutoff:</span>
            <span className="fw-bold text-dark">{job.eligibilityCgpa} CGPA</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted">Location:</span>
            <span className="text-dark fw-medium">{job.location}</span>
          </div>
        </div>

        <div className="mt-auto d-flex align-items-center justify-content-between pt-2 border-top">
          <small className="text-muted fs-8">
            <i className="bi bi-clock me-1"></i> Deadline: {formatDate(job.deadline)}
          </small>

          <div className="d-flex gap-2">
            {onViewDetails && (
              <Button variant="outline-secondary" size="sm" onClick={() => onViewDetails(job.id)}>
                Details
              </Button>
            )}
            {onApply && (
              <Button
                variant={isApplied ? 'success' : 'primary'}
                size="sm"
                disabled={isApplied || job.status !== 'Active'}
                onClick={() => onApply(job.id)}
              >
                {isApplied ? 'Applied' : 'Apply Now'}
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
