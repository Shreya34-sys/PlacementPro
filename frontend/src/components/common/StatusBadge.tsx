import React from 'react';
import { Badge } from 'react-bootstrap';
import { ApplicationStatus } from '../../types';
import { getStatusBadgeVariant } from '../../utils/formatters';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const bgVariant = getStatusBadgeVariant(status);
  return (
    <Badge bg={bgVariant} className="px-2.5 py-1.5 fw-medium text-capitalize">
      {status}
    </Badge>
  );
};
