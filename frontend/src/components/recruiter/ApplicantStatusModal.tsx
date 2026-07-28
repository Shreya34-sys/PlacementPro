import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { JobApplication, ApplicationStatus } from '../../types';

interface ApplicantStatusModalProps {
  show: boolean;
  application: JobApplication | null;
  onHide: () => void;
  onUpdateStatus: (appId: string, status: ApplicationStatus) => void;
}

export const ApplicantStatusModal: React.FC<ApplicantStatusModalProps> = ({
  show,
  application,
  onHide,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState<ApplicationStatus>('Applied');

  if (!application) return null;

  const handleSave = () => {
    onUpdateStatus(application.id, status);
    onHide();
  };

  const statuses: ApplicationStatus[] = [
    'Applied',
    'Under Review',
    'Shortlisted',
    'Technical Round',
    'HR Round',
    'Selected',
    'Rejected',
  ];

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">Update Application Status</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <h6 className="fw-bold mb-1">{application.studentName}</h6>
          <p className="text-muted fs-7 mb-0">
            {application.jobTitle} &bull; {application.companyName}
          </p>
        </div>
        <Form.Group>
          <Form.Label className="fw-semibold">Select New Stage / Status</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave}>
          Save Stage
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
