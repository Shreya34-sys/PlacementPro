import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Company } from '../../types';
import { CompanyLogo } from './CompanyLogo';

interface CompanyCardProps {
  company: Company;
  onViewJobs?: (companyId: string) => void;
  onApply?: (companyId: string) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onViewJobs,
  onApply
}) => {
  return (
    <Card className="shadow-sm border-0 h-100 hover-lift transition-all">
      <Card.Body className="p-3.5 d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-3">
            <CompanyLogo companyName={company.name} logoUrl={company.logoUrl} size={48} />
            <div>
              <h6 className="fw-bold text-dark mb-0">{company.name}</h6>
              <small className="text-muted fs-8"><i className="bi bi-geo-alt me-1"></i>{company.location}</small>
            </div>
          </div>
          <Badge bg="primary-subtle" text="primary" className="px-2 py-1 fs-8">
            {company.industry}
          </Badge>
        </div>

        <p className="text-secondary fs-8 line-clamp-2 mb-3 flex-grow-1">
          {company.description || 'Leading recruiter partner hiring campus graduates across software, analytics, and engineering roles.'}
        </p>

        <div className="bg-light p-2.5 rounded mb-3 border">
          <div className="row g-2 text-center fs-8">
            <div className="col-6 border-end">
              <span className="text-muted d-block fs-8">Open Positions</span>
              <strong className="text-dark fw-bold">{company.openPositionsCount || 3} Roles</strong>
            </div>
            <div className="col-6">
              <span className="text-muted d-block fs-8">CTC Range</span>
              <strong className="text-success fw-bold">{company.ctcRange || '$85k - $120k'}</strong>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          {onViewJobs && (
            <Button
              variant="outline-primary"
              size="sm"
              className="w-100 fw-semibold fs-8 py-1.5"
              onClick={() => onViewJobs(company.id)}
            >
              View Openings
            </Button>
          )}
          {onApply && (
            <Button
              variant="primary"
              size="sm"
              className="w-100 fw-semibold fs-8 py-1.5"
              onClick={() => onApply(company.id)}
            >
              Quick Apply
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
