import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { gsap } from '../utils/gsapSetup.ts';
import { Reveal, usePrefersReducedMotion } from './MotionPrimitives.tsx';

type StageTheme = 'midnight' | 'linen' | 'navy' | 'sand' | 'ink';

interface ProcessStage {
  num: string;
  title: string;
  subtitle: string;
  detail: string;
  outcome: string;
  theme: StageTheme;
  illustration: React.ReactNode;
}

const STAGES: ProcessStage[] = [
  {
    num: '01',
    title: 'Discover',
    subtitle: 'Understanding the idea and the problem.',
    detail:
      'Clarifying who the software is for, what real problem needs solving, and what core goal guides every technical decision before writing a single line of code.',
    outcome: 'Outcome · Clear problem definition',
    theme: 'midnight',
    illustration: (
      <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8" aria-hidden="true">
        <circle cx="22" cy="22" r="15" stroke="#C7B8A6" strokeOpacity="0.65" strokeWidth="1.6" />
        <circle cx="22" cy="22" r="8" stroke="#D68C76" strokeWidth="1.6" />
        <circle cx="22" cy="22" r="3" fill="#D68C76" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Explore',
    subtitle: 'Researching possible approaches and solutions.',
    detail:
      'Comparing database schemas, REST endpoints, and component structures so the chosen implementation path stays simple, readable, and dependable.',
    outcome: 'Outcome · Technical architecture & flow',
    theme: 'linen',
    illustration: (
      <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8" aria-hidden="true">
        <path
          d="M8 31L18 20L25 26L36 12"
          stroke="#B46A55"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="12" r="3.5" fill="#B46A55" />
        <circle cx="8" cy="31" r="2.5" stroke="#1F2A44" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Build',
    subtitle: 'Writing code and implementing the solution.',
    detail:
      'Building server-side routes, MySQL tables, input checks, and clean responsive views step by step using Node.js, Express.js, JavaScript, HTML5, and CSS3.',
    outcome: 'Outcome · Working server & client code',
    theme: 'navy',
    illustration: (
      <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8" aria-hidden="true">
        <path
          d="M15 14L7 22L15 30M29 14L37 22L29 30M24.5 11L19.5 33"
          stroke="#D68C76"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Refine',
    subtitle: 'Testing, debugging and improving the result.',
    detail:
      'Checking edge cases, verifying API responses and error handling, fixing bugs, and tuning accessibility and responsiveness across desktop and mobile screens.',
    outcome: 'Outcome · Tested & polished software',
    theme: 'sand',
    illustration: (
      <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect
          x="8"
          y="8"
          width="28"
          height="28"
          rx="6"
          stroke="#1F2A44"
          strokeOpacity="0.8"
          strokeWidth="1.6"
        />
        <path
          d="M16 22.5L20 26.5L29 17"
          stroke="#7A3725"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: '05',
    title: 'Create',
    subtitle: 'Presenting the completed experience.',
    detail:
      'Delivering a clear, purposeful software experience ready for real users, feedback, GitHub version control, and continuous improvement.',
    outcome: 'Outcome · Published, documented experience',
    theme: 'ink',
    illustration: (
      <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8" aria-hidden="true">
        <polygon
          points="22,6 36,14 36,30 22,38 8,30 8,14"
          stroke="#C7B8A6"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="22" r="4" fill="#D68C76" />
      </svg>
    ),
  },
];

function getStageSurface(theme: StageTheme, focused: boolean) {
  switch (theme) {
    case 'midnight':
      return `bg-[#0B1320] text-[#F2EFE8] shadow-[0_24px_48px_-24px_rgba(11,19,32,0.52)] ${
        focused ? 'border-[#D68C76]/85' : 'border-[#1F2A44]'
      }`;
    case 'navy':
      return `bg-[#1F2A44] text-[#F2EFE8] shadow-[0_24px_48px_-24px_rgba(11,19,32,0.48)] ${
        focused ? 'border-[#D68C76]/85' : 'border-[#C7B8A6]/30'
      }`;
    case 'sand':
      return `bg-[#C7B8A6] text-[#0B1320] shadow-[0_22px_44px_-24px_rgba(11,19,32,0.28)] ${
        focused ? 'border-[#7A3725]' : 'border-[#A89680]'
      }`;
    case 'ink':
      return `bg-[#121B2E] text-[#F2EFE8] shadow-[0_26px_52px_-24px_rgba(11,19,32,0.6)] ${
        focused ? 'border-[#D68C76]/85' : 'border-[#C7B8A6]/30'
      }`;
    case 'linen':
    default:
      return `bg-[#FAF8F4] text-[#0B1320] shadow-[0_20px_42px_-24px_rgba(11,19,32,0.18)] ${
        focused ? 'border-[#B46A55]' : 'border-[#C7B8A6]'
      }`;
  }
}

export const Process: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const [activeStage, setActiveStage] = useState(0);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const useScrollGlide = isDesktop && !prefersReducedMotion;

  useEffect(() => {
    if (!useScrollGlide) return undefined;
    const trackEl = trackRef.current;
    const viewportEl = viewportRef.current;
    const rowEl = rowRef.current;
    const cards = cardRefs.current.filter((el): el is HTMLElement => Boolean(el));
    if (!trackEl || !viewportEl || !rowEl || cards.length === 0) return undefined;

    const getScrollDistance = () => Math.max(0, rowEl.scrollWidth - viewportEl.clientWidth);

    const ctx = gsap.context(() => {
      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, { scaleX: 1 / STAGES.length, transformOrigin: 'left center' });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trackEl,
          start: 'top top+=64',
          end: 'bottom bottom',
          scrub: 0.65,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              STAGES.length - 1,
              Math.max(0, Math.round(self.progress * (STAGES.length - 1))),
            );
            setActiveStage((prev) => (prev === idx ? prev : idx));
            if (progressBarRef.current) {
              const scaleVal = Math.min(
                1,
                Math.max(1 / STAGES.length, (1 + self.progress * (STAGES.length - 1)) / STAGES.length),
              );
              progressBarRef.current.style.transform = `scaleX(${scaleVal.toFixed(4)})`;
            }
          },
        },
      });

      tl.to(
        rowEl,
        {
          x: () => -getScrollDistance(),
          ease: 'none',
          duration: 1,
        },
        0,
      );

      cards.forEach((card, i) => {
        const yOffset = i % 2 === 0 ? 18 : -18;
        tl.fromTo(
          card,
          { y: yOffset, rotateZ: i % 2 === 0 ? -0.9 : 0.9 },
          { y: -yOffset * 0.65, rotateZ: 0, ease: 'sine.inOut', duration: 1 },
          0,
        );
      });
    }, stickyRef);

    return () => {
      ctx.revert();
    };
  }, [useScrollGlide]);

  const handleSelectStage = (idx: number) => {
    setActiveStage(idx);
    const trackEl = trackRef.current;
    if (!trackEl) return;

    if (!useScrollGlide) {
      cardRefs.current[idx]?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
      return;
    }

    const rect = trackEl.getBoundingClientRect();
    const startScrollY = window.scrollY + rect.top - 64;
    const travel = Math.max(1, trackEl.offsetHeight - window.innerHeight + 64);
    const ratio = idx / (STAGES.length - 1);
    window.scrollTo({
      top: startScrollY + travel * ratio,
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="scroll-mt-20 relative w-full bg-[#EAE5DC] text-[#0B1320] border-t border-[#C7B8A6]/60 overflow-x-clip"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 editorial-grid-texture opacity-45"
      />

      <div
        ref={trackRef}
        className={`relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 ${
          useScrollGlide ? 'lg:h-[290vh]' : 'py-20 sm:py-24'
        }`}
      >
        <div
          ref={stickyRef}
          className={
            useScrollGlide
              ? 'lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:flex lg:flex-col lg:justify-center py-12'
              : ''
          }
        >
          {/* Editorial Heading & Interactive Stage Stepper */}
          <Reveal>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <p className="font-mono-tech text-xs tracking-[0.14em] text-[#9A4F3A] font-semibold">
                  02. How I Work
                </p>
                <h2
                  id="process-heading"
                  className="mt-2.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1320] [text-wrap:balance]"
                >
                  How I approach building things.
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {STAGES.map((stage, idx) => {
                  const isCurrent = idx === activeStage;
                  return (
                    <button
                      key={stage.num}
                      type="button"
                      onClick={() => handleSelectStage(idx)}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`px-3 py-1.5 rounded-lg font-mono-tech text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                        isCurrent
                          ? 'bg-[#0B1320] text-[#F2EFE8] border-[#0B1320]'
                          : 'bg-[#FAF8F4] text-[#1F2A44] border-[#C7B8A6] hover:border-[#B46A55] hover:text-[#0B1320]'
                      }`}
                    >
                      <span className={isCurrent ? 'text-[#D68C76]' : 'text-[#9A4F3A]'}>
                        {stage.num}
                      </span>{' '}
                      {stage.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {useScrollGlide && (
            <div className="mt-6 h-[2px] w-full bg-[#C7B8A6]/70 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full w-full bg-[#B46A55] origin-left"
                style={{ transform: `scaleX(${1 / STAGES.length})` }}
              />
            </div>
          )}

          {/* Desktop Horizontal Scroll-Gliding Deck OR Mobile/Reduced-Motion Readable Sequence */}
          <div
            ref={viewportRef}
            className={
              useScrollGlide ? 'mt-8 overflow-hidden py-5 -mx-2 px-2' : 'mt-10 space-y-5'
            }
          >
            <div
              ref={rowRef}
              className={useScrollGlide ? 'flex items-stretch gap-7 w-max' : 'space-y-5'}
            >
              {STAGES.map((stage, idx) => {
                const isDark = stage.theme === 'midnight' || stage.theme === 'navy' || stage.theme === 'ink';
                const isSand = stage.theme === 'sand';
                const isFocused = idx === activeStage;

                return (
                  <article
                    key={stage.num}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    className={`rounded-2xl p-6 sm:p-8 border flex flex-col justify-between transition-colors duration-200 ${
                      useScrollGlide ? 'w-[420px] xl:w-[460px] min-h-[340px] shrink-0' : 'w-full'
                    } ${getStageSurface(stage.theme, useScrollGlide && isFocused)}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                              isDark
                                ? 'bg-[#070C16]/65 border-[#C7B8A6]/30 text-[#F2EFE8]'
                                : isSand
                                  ? 'bg-[#EAE5DC] border-[#0B1320]/20 text-[#0B1320]'
                                  : 'bg-[#F2EFE8] border-[#C7B8A6] text-[#0B1320]'
                            }`}
                          >
                            {stage.illustration}
                          </span>

                          <div>
                            <span
                              className={`block font-mono-tech text-xs font-semibold tabular-nums ${
                                isDark
                                  ? 'text-[#D68C76]'
                                  : isSand
                                    ? 'text-[#7A3725]'
                                    : 'text-[#9A4F3A]'
                              }`}
                            >
                              Stage {stage.num}
                            </span>
                            <h3 className="font-display text-2xl font-bold tracking-tight">
                              {stage.title}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`font-display text-3xl font-bold tabular-nums opacity-25 ${
                            isDark ? 'text-[#C7B8A6]' : 'text-[#0B1320]'
                          }`}
                          aria-hidden="true"
                        >
                          {stage.num}
                        </span>
                      </div>

                      <p
                        className={`mt-5 text-sm sm:text-base font-semibold ${
                          isDark
                            ? 'text-[#D68C76]'
                            : isSand
                              ? 'text-[#7A3725]'
                              : 'text-[#9A4F3A]'
                        }`}
                      >
                        {stage.subtitle}
                      </p>

                      <p
                        className={`mt-2.5 text-sm sm:text-[15px] leading-[1.75] ${
                          isDark
                            ? 'text-[#DED8CE]'
                            : isSand
                              ? 'text-[#0B1320]'
                              : 'text-[#1F2A44]'
                        }`}
                      >
                        {stage.detail}
                      </p>
                    </div>

                    <div
                      className={`mt-7 pt-4 border-t flex items-center justify-between text-xs ${
                        isDark
                          ? 'border-[#C7B8A6]/20 text-[#C7B8A6]'
                          : isSand
                            ? 'border-[#0B1320]/20 text-[#1F2A44]'
                            : 'border-[#C7B8A6]/60 text-[#4A5264]'
                      }`}
                    >
                      <span className="font-mono-tech">{stage.outcome}</span>
                      <ArrowRight
                        className={`w-4 h-4 ${
                          isDark
                            ? 'text-[#D68C76]'
                            : isSand
                              ? 'text-[#7A3725]'
                              : 'text-[#9A4F3A]'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
