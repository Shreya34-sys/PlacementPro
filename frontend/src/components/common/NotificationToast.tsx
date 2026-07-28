import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

interface NotificationToastProps {
  show: boolean;
  message: string;
  title?: string;
  variant?: 'success' | 'danger' | 'info' | 'warning';
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  show,
  message,
  title = 'PlacementPro System',
  variant = 'info',
  onClose,
}) => {
  return (
    <ToastContainer position="bottom-end" className="p-3">
      <Toast show={show} onClose={onClose} delay={4000} autohide bg={variant} className="text-white">
        <Toast.Header closeButton>
          <i className="bi bi-bell-fill me-2 text-primary"></i>
          <strong className="me-auto text-dark">{title}</strong>
          <small className="text-muted">Just now</small>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};
