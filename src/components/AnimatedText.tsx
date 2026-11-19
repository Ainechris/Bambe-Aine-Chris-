import React, { useEffect, useState } from 'react';

interface AnimatedHeadingProps {
  as?: 'h1' | 'h2' | 'h3';
  text: string;
  accentText?: string;
  className?: string;
  trigger?: 'reveal' | 'mount';
  baseDelayMs?: number;
  wordStepMs?: number;
}

export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  as: Tag = 'h2',
  text,
  accentText,
  className = '',
  trigger = 'reveal',
  baseDelayMs = 40,
  wordStepMs = 55,
}) => {
  const [mounted, setMounted] = useState(trigger !== 'mount');

  useEffect(() => {
    if (trigger !== 'mount') return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  const fullText = accentText ? `${text} ${accentText}` : text;
  const primaryWords = text.trim().split(/\s+/).filter(Boolean);
  const accentWords = accentText ? accentText.trim().split(/\s+/).filter(Boolean) : [];
  const totalPrimary = primaryWords.length;

  return (
    <Tag
      aria-label={fullText}
      className={`${className} ${
        trigger === 'mount' ? (mounted ? 'text-reveal-mounted' : 'text-reveal-pending') : ''
      }`}
      style={{ textWrap: 'balance' }}
    >
      {primaryWords.map((word, idx) => (
        <React.Fragment key={`p-${idx}-${word}`}>
          <span className="text-reveal-mask" aria-hidden="true">
            <span
              className="text-reveal-word"
              style={
                {
                  '--wd': `${baseDelayMs + idx * wordStepMs}ms`,
                } as React.CSSProperties
              }
            >
              {word}
            </span>
          </span>
          {(idx < totalPrimary - 1 || accentWords.length > 0) && ' '}
        </React.Fragment>
      ))}
      {accentWords.map((word, idx) => (
        <React.Fragment key={`a-${idx}-${word}`}>
          <span className="text-reveal-mask" aria-hidden="true">
            <span
              className="text-reveal-word text-shimmer-mint"
              style={
                {
                  '--wd': `${baseDelayMs + (totalPrimary + idx) * wordStepMs}ms`,
                } as React.CSSProperties
              }
            >
              {word}
            </span>
          </span>
          {idx < accentWords.length - 1 && ' '}
        </React.Fragment>
      ))}
    </Tag>
  );
};

interface TypingRoleTickerProps {
  phrases: string[];
  className?: string;
  intervalMs?: number;
}

export const TypingRoleTicker: React.FC<TypingRoleTickerProps> = ({
  phrases,
  className = '',
  intervalMs = 3400,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (phrases.length <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let switchTimer = 0;
    const cycleTimer = window.setInterval(() => {
      setPhase('out');
      switchTimer = window.setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % phrases.length);
        setPhase('in');
      }, 280);
    }, intervalMs);

    return () => {
      window.clearInterval(cycleTimer);
      window.clearTimeout(switchTimer);
    };
  }, [phrases.length, intervalMs]);

  return (
    <span className={`inline-flex items-center overflow-hidden ${className}`}>
      <span
        key={activeIdx}
        className={`inline-block transition-all duration-300 ease-out ${
          phase === 'in'
            ? 'opacity-100 translate-y-0 blur-0'
            : 'opacity-0 -translate-y-2 blur-[2px]'
        }`}
      >
        {phrases[activeIdx]}
      </span>
    </span>
  );
};
