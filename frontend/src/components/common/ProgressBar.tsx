import React from 'react';
import { ProgressBar as BsProgressBar } from 'react-bootstrap';

interface CustomProgressBarProps {
  now: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
  striped?: boolean;
  animated?: boolean;
  height?: string;
  className?: string;
}

export const ProgressBar: React.FC<CustomProgressBarProps> = ({
  now,
  max = 100,
  label,
  showPercentage = true,
  variant = 'primary',
  striped = false,
  animated = false,
  height = '8px',
  className = ''
}) => {
  const percentage = Math.round((now / max) * 100);

  return (
    <div className={`w-100 ${className}`}>
      {(label || showPercentage) && (
        <div className="d-flex justify-content-between align-items-center mb-1 fs-8 fw-semibold text-secondary">
          {label && <span>{label}</span>}
          {showPercentage && <span className="ms-auto">{percentage}%</span>}
        </div>
      )}
      <BsProgressBar
        now={now}
        max={max}
        variant={variant}
        striped={striped}
        animated={animated}
        style={{ height }}
        className="rounded-pill"
      />
    </div>
  );
};
