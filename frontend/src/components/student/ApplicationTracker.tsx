import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { JobApplication } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface ApplicationTrackerProps {
  applications: JobApplication[];
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ applications }) => {
  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white fw-bold py-3">
        <i className="bi bi-clock-history text-primary me-2"></i> Active Application Tracking
      </Card.Header>
      <ListGroup variant="flush">
        {applications.length === 0 ? (
          <div className="p-4 text-center text-muted">No submitted applications yet.</div>
        ) : (
          applications.map((app) => (
            <ListGroup.Item key={app.id} className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="fw-bold mb-1">{app.jobTitle}</h6>
                  <span className="text-muted fs-7">{app.companyName}</span>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <small className="text-muted d-block">Applied on {formatDate(app.appliedDate)}</small>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </Card>
  );
};
