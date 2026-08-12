import React from 'react';
import { Spinner } from 'react-bootstrap';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  animation?: 'border' | 'grow' | 'rolling';
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  animation = 'border',
  text = 'Loading...',
  fullScreen = false
}) => {
  const spinnerSize = size === 'sm' ? 'sm' : undefined;
  const dimensionClass = size === 'lg' ? 'p-5' : 'p-3';
  const rollingSizeClass = size === 'lg' ? 'rolling-spinner-lg' : size === 'sm' ? 'rolling-spinner-sm' : 'rolling-spinner-md';

  const renderSpinner = () => {
    if (animation === 'rolling') {
      return (
        <div className={`rolling-spinner ${rollingSizeClass} mb-2`} role="status">
          <span className="rolling-ring visually-hidden">Loading...</span>
        </div>
      );
    }

    return (
      <Spinner
        animation={animation}
        variant="primary"
        size={spinnerSize}
        className="mb-2"
      />
    );
  };

  if (fullScreen) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light text-center p-4">
        {renderSpinner()}
        <h6 className="fw-semibold text-secondary">{text}</h6>
      </div>
    );
  }

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center text-center ${dimensionClass}`}>
      {renderSpinner()}
      {text && <span className="fs-8 text-muted fw-medium">{text}</span>}
    </div>
  );
};
