import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { UserProfile } from '../../types';

interface StudentProfileCardProps {
  student: UserProfile;
  onEdit?: () => void;
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({ student, onEdit }) => {
  return (
    <Card className="shadow-sm border-0 text-center p-3">
      <Card.Body>
        <img
          src={student.avatarUrl || 'https://via.placeholder.com/100'}
          alt={student.name}
          className="rounded-circle mb-3 border border-3 border-primary shadow-sm"
          width="100"
          height="100"
        />
        <h5 className="fw-bold mb-1">{student.name}</h5>
        <p className="text-muted mb-2 fs-7">{student.email}</p>
        <div className="d-flex justify-content-center gap-2 mb-3">
          <Badge bg="primary">{student.department || 'Computer Science'}</Badge>
          <Badge bg="secondary">Batch {student.batchYear || '2026'}</Badge>
        </div>
        <div className="bg-light rounded p-2 mb-3">
          <small className="text-muted d-block fs-8 text-uppercase">CGPA Score</small>
          <span className="fw-bold text-dark fs-5">{student.cgpa || '8.8'} / 10.0</span>
        </div>
        {onEdit && (
          <Button variant="outline-primary" size="sm" onClick={onEdit} className="w-100">
            <i className="bi bi-pencil-square me-1"></i> Edit Profile
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};
