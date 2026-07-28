import React from 'react';
import { Card } from 'react-bootstrap';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  variant?: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'primary',
  subtext,
}) => {
  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-circle p-3 bg-${variant} bg-opacity-10 text-${variant} me-3`}>
          <i className={`bi ${icon} fs-3`}></i>
        </div>
        <div>
          <h6 className="text-muted fw-semibold mb-1 text-uppercase fs-7">{title}</h6>
          <h3 className="fw-bold mb-0 text-dark">{value}</h3>
          {subtext && <small className="text-muted fs-8">{subtext}</small>}
        </div>
      </Card.Body>
    </Card>
  );
};
