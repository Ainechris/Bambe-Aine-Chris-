import React from 'react';

interface BrandMarkProps {
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    {/* Chamfered Midnight Ink frame with Warm Sand rim */}
    <path
      d="M10 2.5H26L33.5 10V26L26 33.5H10L2.5 26V10L10 2.5Z"
      fill="#0B1320"
      stroke="#C7B8A6"
      strokeOpacity="0.6"
      strokeWidth="1.25"
    />
    {/* Geometric A + C sculptural monogram */}
    <path
      d="M10.5 24.5L15.2 11.5L19.8 24.5M12.1 20.5H18.2"
      stroke="#F2EFE8"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26.5 14.2C25.5 12.6 23.8 11.7 22 11.7C19.2 11.7 17.3 14.2 17.3 18C17.3 21.8 19.2 24.3 22 24.3C23.9 24.3 25.6 23.4 26.5 21.8"
      stroke="#D68C76"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
