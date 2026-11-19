import React from 'react';

export type TechKey =
  | 'html5'
  | 'css3'
  | 'javascript'
  | 'nodejs'
  | 'expressjs'
  | 'mysql'
  | 'git'
  | 'github'
  | 'backend'
  | 'python'
  | 'flask'
  | 'sqlite'
  | 'figma';

interface TechLogoProps {
  tech: TechKey;
  className?: string;
}

export const TechLogo: React.FC<TechLogoProps> = ({ tech, className = 'w-6 h-6' }) => {
  switch (tech) {
    case 'html5':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#E34F26" d="M3 2l1.64 18.42L12 22.5l7.36-2.08L21 2H3z" />
          <path fill="#EF652A" d="M12 3.5v17.44l5.95-1.68L19.35 3.5H12z" />
          <path
            fill="#FFFFFF"
            d="M12 9.45H8.56l-.24-2.67H12V4.16H5.51l.68 7.89H12V9.45zm0 6.72l-.02.01-2.94-.8-.19-2.12H6.23l.37 4.14 5.38 1.5.02-.01v-2.72z"
          />
          <path
            fill="#EBEBEB"
            d="M12 9.45v2.6h3.22l-.3 3.4-2.92.79v2.72l5.39-1.5.72-8.01H12zm0-5.29v2.62h6.25l.24-2.62H12z"
          />
        </svg>
      );

    case 'css3':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#1572B6" d="M3 2l1.64 18.42L12 22.5l7.36-2.08L21 2H3z" />
          <path fill="#33A9DC" d="M12 3.5v17.44l5.95-1.68L19.35 3.5H12z" />
          <path
            fill="#FFFFFF"
            d="M12 9.45H8.56l-.24-2.67H12V4.16H5.51l.24 2.62H12v2.67H5.99l.23 2.6H12v-2.6zm0 6.72l-2.96-.8-.19-2.12H6.23l.37 4.14 5.38 1.5.02-.01v-2.71z"
          />
          <path
            fill="#EBEBEB"
            d="M12 4.16v2.62h6.25l-.24 2.67H12v2.6h3.22l-.3 3.4-2.92.79v2.72l5.39-1.5.94-13.3H12z"
          />
        </svg>
      );

    case 'javascript':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="3" fill="#F7DF1E" />
          <path
            fill="#0F141C"
            d="M13.3 16.54c.38.63.88 1.09 1.76 1.09.74 0 1.21-.37 1.21-.88 0-.61-.48-.83-1.3-1.19l-.45-.19c-1.29-.55-2.14-1.24-2.14-2.69 0-1.34 1.02-2.36 2.61-2.36 1.13 0 1.95.39 2.54 1.43l-1.39.89c-.3-.55-.63-.77-1.15-.77-.52 0-.86.33-.86.77 0 .54.33.76 1.1 1.09l.45.19c1.52.65 2.38 1.32 2.38 2.82 0 1.61-1.27 2.5-2.97 2.5-1.67 0-2.74-.79-3.27-1.83l1.48-.87zm-5.61.16c.29.51.55.94 1.18.94.6 0 .98-.24.98-1.16v-6.24h1.83v6.27c0 1.9-1.11 2.77-2.74 2.77-1.47 0-2.32-.76-2.75-1.68l1.5-.9z"
          />
        </svg>
      );

    case 'nodejs':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            fill="#5FA04E"
            d="M12 2L3.34 7v10L12 22l8.66-5V7L12 2zm0 2.31l6.66 3.85v7.68L12 19.69l-6.66-3.85V8.16L12 4.31z"
          />
          <path
            fill="#83CD29"
            d="M12 6.8l-4.5 2.6v5.2L12 17.2l4.5-2.6V9.4L12 6.8zm0 2.1l2.68 1.55v3.1L12 15.1l-2.68-1.55v-3.1L12 8.9z"
          />
        </svg>
      );

    case 'expressjs':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#1F2938" stroke="#4B5D78" strokeWidth="1.2" />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fill="#EDF2F7"
            fontSize="9.5"
            fontWeight="600"
            fontFamily="IBM Plex Mono, monospace"
          >
            ex
          </text>
        </svg>
      );

    case 'mysql':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <ellipse cx="12" cy="6.5" rx="7.5" ry="2.8" fill="none" stroke="#00758F" strokeWidth="1.7" />
          <path
            d="M4.5 6.5v5c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-5"
            fill="none"
            stroke="#00758F"
            strokeWidth="1.7"
          />
          <path
            d="M4.5 11.5v5.5c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-5.5"
            fill="none"
            stroke="#F29111"
            strokeWidth="1.7"
          />
        </svg>
      );

    case 'git':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            fill="#F05032"
            d="M21.62 11.11l-8.73-8.73a1.26 1.26 0 0 0-1.78 0L9.3 4.19l2.3 2.3a1.5 1.5 0 0 1 1.9 1.91l2.22 2.22a1.5 1.5 0 1 1-.9.84l-2.07-2.07v5.45a1.5 1.5 0 1 1-1.24-.04V9.3a1.5 1.5 0 0 1-.82-1.97L8.42 5.07 2.38 11.11a1.26 1.26 0 0 0 0 1.78l8.73 8.73a1.26 1.26 0 0 0 1.78 0l8.73-8.73a1.26 1.26 0 0 0 0-1.78z"
          />
        </svg>
      );

    case 'github':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#EDF2F7" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85 0 1.71.12 2.5.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2z"
          />
        </svg>
      );

    case 'python':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            fill="#3776AB"
            d="M11.91 2C8.92 2 9.1 3.3 9.1 3.3v1.36h2.9v.41H6.96S4.5 4.79 4.5 8.05s2.15 3.14 2.15 3.14h1.28V9.68s-.07-2.15 2.11-2.15h3.65s2.05.03 2.05-1.98V3.57S16.05 2 11.91 2zm-2.03 1.3a.66.66 0 1 1 0 1.32.66.66 0 0 1 0-1.32z"
          />
          <path
            fill="#FFD43B"
            d="M12.09 22c2.99 0 2.81-1.3 2.81-1.3v-1.36h-2.9v-.41h5.04s2.46.28 2.46-2.98-2.15-3.14-2.15-3.14h-1.28v1.51s.07 2.15-2.11 2.15h-3.65s-2.05-.03-2.05 1.98v1.98S7.95 22 12.09 22zm2.03-1.3a.66.66 0 1 1 0-1.32.66.66 0 0 1 0 1.32z"
          />
        </svg>
      );

    case 'flask':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#7DD3FC" strokeWidth="1.7" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v5.2L5.2 17.4A2 2 0 0 0 7 20h10a2 2 0 0 0 1.8-2.6L14 8.2V3" />
          <path strokeLinecap="round" d="M7.5 15h9" />
        </svg>
      );

    case 'sqlite':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="18" height="18" x="3" y="3" rx="3.5" fill="#133A5E" stroke="#38BDF8" strokeWidth="1.4" />
          <path d="M7 9h10M7 13h7M7 17h10" stroke="#7DD3FC" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'figma':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#F24E1E" d="M8.5 2h3.5v6.5H8.5a3.25 3.25 0 1 1 0-6.5z" />
          <path fill="#FF7262" d="M12 2h3.5a3.25 3.25 0 1 1 0 6.5H12V2z" />
          <path fill="#A259FF" d="M8.5 8.5H12V15H8.5a3.25 3.25 0 1 1 0-6.5z" />
          <path fill="#1ABCFE" d="M12 11.75A3.25 3.25 0 1 1 15.25 15 3.25 3.25 0 0 1 12 11.75z" />
          <path fill="#0ACF83" d="M8.5 15H12v3.25A3.25 3.25 0 1 1 8.5 15z" />
        </svg>
      );

    case 'backend':
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#34D399" strokeWidth="1.7" aria-hidden="true">
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <circle cx="7" cy="7" r="1" fill="#34D399" />
          <circle cx="7" cy="17" r="1" fill="#7DD3FC" />
          <path d="M11 7h6M11 17h6" strokeLinecap="round" />
        </svg>
      );
  }
};
