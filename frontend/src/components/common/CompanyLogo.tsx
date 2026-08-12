import React, { useState, useEffect } from 'react';
import { getOfficialCompanyLogoUrl } from '../../utils/companyLogos';

interface CompanyLogoProps {
  companyName: string;
  logoUrl?: string;
  size?: number | '48' | '56';
  className?: string;
  style?: React.CSSProperties;
  roundedSquare?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyName,
  logoUrl,
  size = 48,
  className = '',
  style = {},
  roundedSquare = true
}) => {
  const numericSize = typeof size === 'string' ? parseInt(size, 10) : size;
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false);
    const resolvedUrl = getOfficialCompanyLogoUrl(companyName, logoUrl);
    setImageSrc(resolvedUrl);
  }, [companyName, logoUrl]);

  const containerPadding = Math.max(6, Math.floor(numericSize * 0.16));
  const iconFontSize = `${Math.floor(numericSize * 0.5)}px`;

  return (
    <div
      className={`d-inline-flex align-items-center justify-content-center bg-white border shadow-sm ${
        roundedSquare ? 'rounded-3' : 'rounded-circle'
      } flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: `${numericSize}px`,
        height: `${numericSize}px`,
        padding: `${containerPadding}px`,
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        ...style
      }}
      title={companyName}
    >
      {imageSrc && !hasError ? (
        <img
          src={imageSrc}
          alt={`${companyName} official logo`}
          loading="lazy"
          className="w-100 h-100 object-fit-contain transition-all"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          onError={() => setHasError(true)}
        />
      ) : (
        /* Neutral building icon fallback */
        <i
          className="bi bi-building text-secondary opacity-75"
          style={{ fontSize: iconFontSize, lineHeight: 1 }}
          aria-label={`${companyName} default icon`}
        />
      )}
    </div>
  );
};

export default CompanyLogo;
