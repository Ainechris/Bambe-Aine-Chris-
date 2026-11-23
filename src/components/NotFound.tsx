import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from './BrandMark.tsx';

interface NotFoundProps {
  onGoHome: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen bg-[#0B1320] text-[#F2EFE8] flex flex-col items-center justify-center px-5 py-16 text-center">
      <BrandMark className="w-11 h-11" />
      <p className="mt-6 font-mono-tech text-xs tracking-[0.14em] text-[#D68C76]">404 · PAGE NOT FOUND</p>
      <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F2EFE8]">
        This page could not be found.
      </h1>
      <p className="mt-3 text-sm sm:text-base text-[#C7B8A6] max-w-md leading-relaxed">
        The link may be outdated or mistyped. Return to BAMBE Aine Chris&apos;s main portfolio to
        explore projects, skills, and contact details.
      </p>
      <a
        href="/"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          onGoHome();
        }}
        className="mt-8 inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-[#F2EFE8] text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Return to Portfolio</span>
      </a>
    </div>
  );
};
