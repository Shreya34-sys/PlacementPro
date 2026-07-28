import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Card, Button } from 'react-bootstrap';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  onNavigateToLogin?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onNavigateToLogin
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5 text-center">
        <Card className="shadow-sm border-0 max-w-md p-4">
          <Card.Body>
            <i className="bi bi-shield-lock display-4 text-warning mb-3 d-block"></i>
            <h5 className="fw-bold text-dark">Authentication Required</h5>
            <p className="text-muted fs-7 mb-4">Please log in to your PlacementPro portal account to access this page.</p>
            {onNavigateToLogin && (
              <Button variant="primary" className="fw-bold px-4 py-2" onClick={onNavigateToLogin}>
                Log In Now
              </Button>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5 text-center">
        <Card className="shadow-sm border-0 max-w-md p-4">
          <Card.Body>
            <i className="bi bi-slash-circle display-4 text-danger mb-3 d-block"></i>
            <h5 className="fw-bold text-dark">Access Restricted</h5>
            <p className="text-muted fs-7 mb-0">
              Your role (<strong>{currentUser.role.toUpperCase()}</strong>) does not have sufficient permissions to view this resource.
            </p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
