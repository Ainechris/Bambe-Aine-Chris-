import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PERSON_IDENTITY } from '../seo/routes.ts';
import { gsap } from '../utils/gsapSetup.ts';
import { BrandMark } from './BrandMark.tsx';
import { usePrefersReducedMotion } from './MotionPrimitives.tsx';

type CardId = 'main' | 'github' | 'youtube' | 'instagram';

interface SocialPlatformItem {
  id: Exclude<CardId, 'main'>;
  platform: string;
  identity: string;
  handle: string;
  href: string | null;
  floatClass: string;
  surface: 'linen' | 'navy' | 'sand';
  desktopSlot: string;
  desktopActiveSlot: string;
  icon: (className?: string) => React.ReactNode;
}

const SOCIAL_CARDS: SocialPlatformItem[] = [
  {
    id: 'github',
    platform: 'GitHub',
    identity: 'Ainechris',
    handle: '@Ainechris',
    href: PERSON_IDENTITY.githubUrl,
    floatClass: 'deck-float-a',
    surface: 'linen',
    desktopSlot:
      'md:-translate-x-20 md:-translate-y-28 xl:-translate-x-28 xl:-translate-y-32 md:-rotate-6 z-20',
    desktopActiveSlot:
      'md:-translate-x-24 md:-translate-y-32 xl:-translate-x-32 xl:-translate-y-36 md:rotate-0 md:scale-[1.06] z-40',
    icon: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
  {
    id: 'youtube',
    platform: 'YouTube',
    identity: 'Ainechris',
    handle: 'Channel Showcase',
    href: PERSON_IDENTITY.youtubeUrl,
    floatClass: 'deck-float-b',
    surface: 'navy',
    desktopSlot:
      'md:translate-x-24 md:-translate-y-24 xl:translate-x-32 xl:-translate-y-28 md:rotate-6 z-10',
    desktopActiveSlot:
      'md:translate-x-28 md:-translate-y-28 xl:translate-x-36 xl:-translate-y-32 md:rotate-0 md:scale-[1.06] z-40',
    icon: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M21.582 7.186a2.75 2.75 0 0 0-1.935-1.948C17.94 4.78 12 4.78 12 4.78s-5.94 0-7.647.458A2.75 2.75 0 0 0 2.418 7.186C1.96 8.903 1.96 12.48 1.96 12.48s0 3.577.458 5.294a2.75 2.75 0 0 0 1.935 1.948c1.707.458 7.647.458 7.647.458s5.94 0 7.647-.458a2.75 2.75 0 0 0 1.935-1.948c.458-1.717.458-5.294.458-5.294s0-3.577-.458-5.294ZM9.992 15.72V9.24l5.21 3.24-5.21 3.24Z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    platform: 'Instagram',
    identity: 'Ainechris',
    handle: '@__aine_.23',
    href: PERSON_IDENTITY.instagramUrl,
    floatClass: 'deck-float-c',
    surface: 'sand',
    desktopSlot:
      'md:translate-x-16 md:translate-y-32 xl:translate-x-24 xl:translate-y-36 md:rotate-3 z-20',
    desktopActiveSlot:
      'md:translate-x-20 md:translate-y-36 xl:translate-x-28 xl:translate-y-40 md:rotate-0 md:scale-[1.06] z-40',
    icon: (className = 'w-5 h-5') => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

function getSatelliteCardSurface(surface: SocialPlatformItem['surface'], isActive: boolean) {
  if (surface === 'linen') {
    return `bg-[#F2EFE8] dark:bg-[#141F36] text-[#0B1320] dark:text-[#F2EFE8] ${
      isActive
        ? 'border-[#B46A55] dark:border-[#D68C76] shadow-[0_28px_52px_-18px_rgba(180,106,85,0.38)]'
        : 'border-[#C7B8A6] dark:border-[#2C3E61] shadow-[0_20px_38px_-18px_rgba(11,19,32,0.42)]'
    }`;
  }
  if (surface === 'sand') {
    return `bg-[#C7B8A6] dark:bg-[#241B19] text-[#0B1320] dark:text-[#F2EFE8] ${
      isActive
        ? 'border-[#B46A55] dark:border-[#D68C76] shadow-[0_28px_52px_-18px_rgba(180,106,85,0.42)]'
        : 'border-[#A89680] dark:border-[#B46A55]/45 shadow-[0_20px_38px_-18px_rgba(11,19,32,0.45)]'
    }`;
  }
  return `bg-[#1F2A44] dark:bg-[#19253F] text-[#F2EFE8] ${
    isActive
      ? 'border-[#D68C76] shadow-[0_28px_52px_-18px_rgba(11,19,32,0.7)]'
      : 'border-[#C7B8A6]/35 dark:border-[#2C3E61] shadow-[0_20px_40px_-18px_rgba(11,19,32,0.55)]'
  }`;
}

export const SocialIdentityDeck: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeCard, setActiveCard] = useState<CardId | null>(null);
  const [youtubePromptVisible, setYoutubePromptVisible] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const tiltPlaneRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const stageEl = stageRef.current;
    if (!stageEl) return undefined;

    const ctx = gsap.context(() => {
      const mainEl = stageEl.querySelector('.deck-entrance-main');
      const satellites = stageEl.querySelectorAll('.deck-entrance-sat');

      if (mainEl) {
        gsap.from(mainEl, {
          opacity: 0,
          y: 26,
          scale: 0.92,
          duration: 0.78,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });
      }

      if (satellites.length > 0) {
        gsap.from(satellites, {
          opacity: 0,
          y: 24,
          scale: 0.88,
          duration: 0.72,
          stagger: 0.11,
          delay: 0.22,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });
      }
    }, stageEl);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse') return;
    const stageEl = stageRef.current;
    const planeEl = tiltPlaneRef.current;
    if (!stageEl || !planeEl) return;

    const rect = stageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const rotY = (px - 0.5) * 9;
    const rotX = -(py - 0.5) * 7;

    planeEl.style.transform = `perspective(1250px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    if (sheenRef.current) {
      sheenRef.current.style.opacity = '1';
      sheenRef.current.style.background = `radial-gradient(420px circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(180, 106, 85, 0.2), transparent 62%)`;
    }
  };

  const handlePointerLeave = () => {
    setActiveCard(null);
    if (tiltPlaneRef.current) {
      tiltPlaneRef.current.style.transform = '';
    }
    if (sheenRef.current) {
      sheenRef.current.style.opacity = '0';
    }
  };

  const handleYoutubePendingClick = () => {
    setActiveCard('youtube');
    setYoutubePromptVisible((prev) => !prev);
  };

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="Ainechris interactive social identity card composition"
      className="deck-stage relative w-full py-4 sm:py-6 md:h-[440px] lg:h-[470px] flex flex-col items-center justify-center select-none"
    >
      {/* Subtle 3D Parallax Tilt Container */}
      <div
        ref={tiltPlaneRef}
        className="relative w-full md:h-full flex flex-col items-center justify-center gap-4 md:gap-0 transition-transform duration-300 ease-out"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ================= MAIN CENTERPIECE CARD: AINECHRIS ================= */}
        <div
          onMouseEnter={() => setActiveCard('main')}
          onFocus={() => setActiveCard('main')}
          onMouseLeave={() => setActiveCard(null)}
          onBlur={() => setActiveCard(null)}
          tabIndex={0}
          role="region"
          aria-label="AINECHRIS — Primary Developer Identity Card"
          className={`deck-entrance-main relative w-full max-w-[350px] md:w-[290px] xl:w-[325px] min-h-[206px] sm:min-h-[218px] rounded-2xl bg-[#0B1320] text-[#F2EFE8] border p-6 flex flex-col justify-between transition-all duration-300 ease-out cursor-default focus-visible:outline-2 focus-visible:outline-[#D68C76] ${
            activeCard === 'main'
              ? 'z-40 scale-[1.03] border-[#D68C76]/85 shadow-[0_32px_64px_-22px_rgba(180,106,85,0.42)]'
              : activeCard !== null
                ? 'z-30 opacity-95 border-[#C7B8A6]/45 shadow-[0_24px_48px_-22px_rgba(0,0,0,0.85)]'
                : 'z-30 border-[#C7B8A6]/55 shadow-[0_28px_56px_-22px_rgba(0,0,0,0.85)]'
          }`}
        >
          {/* Terracotta Rim & Cursor Spotlight Accent */}
          <div
            ref={sheenRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#B46A55] to-transparent"
          />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <BrandMark className="w-7 h-7 shrink-0" />
              <span className="font-mono-tech text-[11px] tracking-[0.14em] text-[#C7B8A6]">
                Identity Deck
              </span>
            </div>

            <span className="font-mono-tech text-[11px] text-[#D68C76] tabular-nums">
              00 · Primary
            </span>
          </div>

          <div className="relative z-10 my-4">
            <p className="font-mono-tech text-[11px] tracking-[0.14em] text-[#C7B8A6] uppercase">
              BAMBE Aine Chris
            </p>
            <h2 className="mt-1 font-display text-3xl sm:text-[34px] font-bold tracking-tight text-[#F2EFE8] leading-none">
              AINECHRIS
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-[#DED8CE] leading-relaxed">
              Student Software Developer · Intango TSS, Busaanza
            </p>
          </div>

          <div className="relative z-10 pt-3.5 border-t border-[#C7B8A6]/20 flex items-center justify-between font-mono-tech text-[11px] text-[#C7B8A6]">
            <span>GitHub · YouTube · Instagram</span>
            <span className="text-[#D68C76]">@Ainechris</span>
          </div>
        </div>

        {/* ================= ORBITING LAYERED SOCIAL IDENTITY CARDS ================= */}
        <div className="w-full max-w-[350px] sm:max-w-[540px] md:contents grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SOCIAL_CARDS.map((card) => {
            const isActive = activeCard === card.id;
            const isDimmed = activeCard !== null && !isActive && activeCard !== 'main';
            const isMainFocused = activeCard === 'main';
            const isDarkSurface = card.surface === 'navy';

            const cardSlotClass = isActive
              ? card.desktopActiveSlot
              : isMainFocused
                ? `${card.desktopSlot} md:scale-[1.02]`
                : card.desktopSlot;

            const cardVisualBody = (
              <div className={prefersReducedMotion ? '' : card.floatClass}>
                <div
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between min-h-[116px] md:min-h-[126px] transition-all duration-300 ease-out ${getSatelliteCardSurface(
                    card.surface,
                    isActive,
                  )} ${isDimmed ? 'md:opacity-80' : 'opacity-100'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isDarkSurface
                          ? 'bg-[#0B1320] border-[#C7B8A6]/35 text-[#D68C76]'
                          : 'bg-[#0B1320] border-[#1F2A44] text-[#F2EFE8]'
                      }`}
                    >
                      {card.icon('w-4 h-4')}
                    </div>

                    <ArrowUpRight
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isDarkSurface
                          ? 'text-[#D68C76]'
                          : card.surface === 'sand'
                            ? 'text-[#7A3725] dark:text-[#D68C76]'
                            : 'text-[#9A4F3A] dark:text-[#D68C76]'
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-3">
                    <p
                      className={`font-mono-tech text-[10px] tracking-[0.12em] uppercase ${
                        isDarkSurface
                          ? 'text-[#C7B8A6]'
                          : card.surface === 'sand'
                            ? 'text-[#1F2A44] dark:text-[#C7B8A6]'
                            : 'text-[#4A5264] dark:text-[#C7B8A6]'
                      }`}
                    >
                      {card.platform}
                    </p>
                    <p className="mt-0.5 font-display text-lg font-bold tracking-tight leading-tight">
                      {card.identity}
                    </p>
                    <p
                      className={`mt-1 font-mono-tech text-[11px] truncate ${
                        isDarkSurface
                          ? 'text-[#D68C76]'
                          : card.surface === 'sand'
                            ? 'text-[#7A3725] dark:text-[#D68C76] font-medium'
                            : 'text-[#9A4F3A] dark:text-[#D68C76]'
                      }`}
                    >
                      {card.handle}
                    </p>
                  </div>
                </div>
              </div>
            );

            const sharedWrapperProps = {
              onMouseEnter: () => setActiveCard(card.id),
              onFocus: () => setActiveCard(card.id),
              onMouseLeave: () => setActiveCard(null),
              onBlur: () => setActiveCard(null),
            };

            const wrapperClass = `deck-entrance-sat group w-full md:w-[196px] xl:w-[224px] md:absolute transition-all duration-300 ease-out rounded-2xl focus-visible:outline-2 focus-visible:outline-[#D68C76] ${cardSlotClass}`;

            return card.href ? (
              <a
                key={card.id}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open Ainechris on ${card.platform} (${card.handle})`}
                className={wrapperClass}
                {...sharedWrapperProps}
              >
                {cardVisualBody}
              </a>
            ) : (
              <button
                key={card.id}
                type="button"
                onClick={handleYoutubePendingClick}
                aria-label="YouTube identity card for Ainechris — click for profile link status"
                aria-expanded={youtubePromptVisible}
                className={`${wrapperClass} text-left cursor-pointer`}
                {...sharedWrapperProps}
              >
                {cardVisualBody}
              </button>
            );
          })}
        </div>
      </div>

      {/* Truthful status message when YouTube card is clicked before official URL is supplied */}
      {youtubePromptVisible && !PERSON_IDENTITY.youtubeUrl && (
        <p
          role="status"
          className="mt-4 md:mt-0 md:absolute md:bottom-0 px-3.5 py-2 rounded-lg bg-[#0B1320] border border-[#D68C76]/55 text-xs text-[#F2EFE8] text-center max-w-xs z-40 shadow-lg"
        >
          YouTube profile link is not yet connected. Share your YouTube URL to enable direct
          linking.
        </p>
      )}
    </div>
  );
};
