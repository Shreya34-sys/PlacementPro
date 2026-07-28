import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';

export interface Interview {
  id: string;
  companyName: string;
  roleTitle: string;
  candidateName?: string;
  date: string;
  time: string;
  type: 'Technical' | 'HR' | 'System Design' | 'Managerial';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress';
  locationOrUrl?: string;
  interviewerName?: string;
}

interface InterviewCardProps {
  interview: Interview;
  onJoinMeeting?: (interviewId: string) => void;
  onViewDetails?: (interviewId: string) => void;
  onCancel?: (interviewId: string) => void;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({
  interview,
  onJoinMeeting,
  onViewDetails,
  onCancel
}) => {
  const getStatusBadge = () => {
    switch (interview.status) {
      case 'Scheduled':
        return <Badge bg="primary" className="px-2 py-1 fs-8">Scheduled</Badge>;
      case 'In Progress':
        return <Badge bg="warning" text="dark" className="px-2 py-1 fs-8">In Progress</Badge>;
      case 'Completed':
        return <Badge bg="success" className="px-2 py-1 fs-8">Completed</Badge>;
      case 'Cancelled':
        return <Badge bg="danger" className="px-2 py-1 fs-8">Cancelled</Badge>;
    }
  };

  return (
    <Card className="shadow-sm border-0 h-100 hover-lift">
      <Card.Body className="p-3.5 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="fw-bold text-dark mb-0">{interview.roleTitle}</h6>
            <small className="text-primary fw-semibold fs-8">{interview.companyName}</small>
          </div>
          {getStatusBadge()}
        </div>

        <div className="bg-light p-2.5 rounded mb-3 border">
          <div className="d-flex align-items-center gap-2 fs-8 text-dark mb-1">
            <i className="bi bi-calendar3 text-primary"></i>
            <span>{interview.date} at {interview.time}</span>
          </div>
          <div className="d-flex align-items-center gap-2 fs-8 text-secondary">
            <i className="bi bi-person-badge text-info"></i>
            <span>Type: <strong>{interview.type} Round</strong></span>
            {interview.interviewerName && (
              <span className="ms-auto text-muted">by {interview.interviewerName}</span>
            )}
          </div>
        </div>

        <div className="mt-auto d-flex gap-2">
          {interview.status === 'Scheduled' && onJoinMeeting && (
            <Button
              variant="success"
              size="sm"
              className="w-100 fw-bold fs-8 py-1.5"
              onClick={() => onJoinMeeting(interview.id)}
            >
              <i className="bi bi-camera-video-fill me-1"></i> Join Interview
            </Button>
          )}

          {onViewDetails && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="w-100 fw-semibold fs-8 py-1.5"
              onClick={() => onViewDetails(interview.id)}
            >
              Details
            </Button>
          )}

          {interview.status === 'Scheduled' && onCancel && (
            <Button
              variant="outline-danger"
              size="sm"
              className="px-2.5 fs-8 py-1.5"
              onClick={() => onCancel(interview.id)}
              title="Reschedule / Cancel"
            >
              <i className="bi bi-x-circle"></i>
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
