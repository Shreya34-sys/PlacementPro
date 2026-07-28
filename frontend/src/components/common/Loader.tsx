import React from 'react';
import { Spinner } from 'react-bootstrap';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false
}) => {
  const spinnerSize = size === 'sm' ? 'sm' : undefined;
  const dimensionClass = size === 'lg' ? 'p-5' : 'p-3';

  if (fullScreen) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light text-center p-4">
        <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
        <h6 className="fw-semibold text-secondary">{text}</h6>
      </div>
    );
  }

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center text-center ${dimensionClass}`}>
      <Spinner animation="border" variant="primary" size={spinnerSize} className="mb-2" />
      {text && <span className="fs-8 text-muted fw-medium">{text}</span>}
    </div>
  );
};
