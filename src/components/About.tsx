import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, GraduationCap } from 'lucide-react';
import { gsap } from '../utils/gsapSetup.ts';
import { Reveal, useInView, usePrefersReducedMotion } from './MotionPrimitives.tsx';

const EDUCATION_SPEC = [
  { label: 'Full Name', value: 'BAMBE Aine Chris' },
  { label: 'Known As', value: 'Aine Chris · Ainechris' },
  { label: 'Professional Title', value: 'Student Software Developer' },
  { label: 'Career Ambition', value: 'Backend Developer' },
  { label: 'Institution', value: 'Intango TSS' },
  { label: 'Program & Level', value: 'Software Development (L4 SOD)' },
  { label: 'School Location', value: 'Busaanza, Rwanda' },
  { label: 'School Ownership', value: 'CLA (located in Nyarutarama)' },
  { label: 'Expected Graduation', value: '2028', tabular: true },
];

const QUALITIES = [
  'Problem-solving',
  'Determination',
  'Continuous learning',
  'Curiosity',
  'Adaptability',
  'Collaboration',
];

type JourneyTheme = 'linen' | 'navy' | 'sand' | 'ink' | 'terracotta-navy';

interface JourneyCardData {
  num: string;
  label: string;
  title: string;
  body: string;
  footnote: string;
  theme: JourneyTheme;
  graphic: React.ReactNode;
}

const JOURNEY_CARDS: JourneyCardData[] = [
  {
    num: '01',
    label: 'Where I Started',
    title: 'Curiosity about how software works underneath',
    body: 'My interest began with wanting to understand what happens behind the screens of the websites and tools we use every day — how logic, structure, and code turn an idea into something real.',
    footnote: 'Foundation · Curiosity & exploration',
    theme: 'linen',
    graphic: (
      <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r="22"
          stroke="#C7B8A6"
          strokeOpacity="0.9"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle cx="32" cy="32" r="10" stroke="#B46A55" strokeWidth="1.75" />
        <circle cx="32" cy="32" r="3" fill="#B46A55" />
      </svg>
    ),
  },
  {
    num: '02',
    label: "What I'm Learning",
    title: 'Software Development at Intango TSS',
    body: 'I am currently studying Level 4 Software Development (L4 SOD) at Intango TSS in Busaanza, Rwanda (owned by CLA in Nyarutarama), working toward graduation in 2028 while practicing structured programming, web architecture, and database fundamentals.',
    footnote: 'Intango TSS · Class of 2028',
    theme: 'navy',
    graphic: (
      <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12" aria-hidden="true">
        <rect
          x="10"
          y="14"
          width="44"
          height="36"
          rx="6"
          stroke="#C7B8A6"
          strokeOpacity="0.65"
          strokeWidth="1.5"
        />
        <path
          d="M22 28L17 32L22 36M42 28L47 32L42 36M34 25L30 39"
          stroke="#D68C76"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: '03',
    label: 'What I Enjoy',
    title: 'Problem-solving & server-side architecture',
    body: 'I enjoy breaking practical problems down into clear logic — especially designing API routes, validating inputs, organizing MySQL tables, and understanding how reliable backend systems connect to clean interfaces.',
    footnote: 'Core Interest · Logic, APIs & Databases',
    theme: 'sand',
    graphic: (
      <svg viewBox="0 0 88 56" fill="none" className="w-16 h-11" aria-hidden="true">
        <rect x="4" y="18" width="20" height="20" rx="4" className="stroke-[#0B1320] dark:stroke-[#C7B8A6]" strokeWidth="1.6" />
        <rect
          x="34"
          y="8"
          width="20"
          height="16"
          rx="4"
          className="stroke-[#1F2A44] dark:stroke-[#D68C76]"
          strokeOpacity="0.85"
          strokeWidth="1.5"
        />
        <rect
          x="34"
          y="32"
          width="20"
          height="16"
          rx="4"
          className="stroke-[#1F2A44] dark:stroke-[#D68C76]"
          strokeOpacity="0.85"
          strokeWidth="1.5"
        />
        <rect
          x="64"
          y="18"
          width="20"
          height="20"
          rx="4"
          fill="#B46A55"
          fillOpacity="0.22"
          className="stroke-[#7A3725] dark:stroke-[#D68C76]"
          strokeWidth="1.6"
        />
        <path d="M24 28H34M54 16H59V28H64M54 40H59V28" className="stroke-[#0B1320] dark:stroke-[#C7B8A6]" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: '04',
    label: "What I'm Building",
    title: 'Real code, coursework & steady hands-on practice',
    body: 'Every project I publish reflects genuine practice — combining JavaScript, Node.js, Express.js, MySQL, HTML5, CSS3, Git, and GitHub to move steadily from classroom exercises to dependable working applications.',
    footnote: 'Practice · Genuine builds & GitHub',
    theme: 'ink',
    graphic: (
      <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12" aria-hidden="true">
        <path
          d="M14 22L32 12L50 22V42L32 52L14 42V22Z"
          stroke="#D68C76"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M14 22L32 32L50 22M32 32V52"
          stroke="#C7B8A6"
          strokeOpacity="0.7"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    num: '05',
    label: "Where I'm Going",
    title: 'Becoming a dependable backend developer',
    body: 'My direction is clear: grow into a strong backend software engineer, contribute to meaningful teams through internships and collaborations, and remain ready for scholarships and technical opportunities ahead.',
    footnote: 'Goal · Internships, Scholarships & Growth',
    theme: 'terracotta-navy',
    graphic: (
      <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12" aria-hidden="true">
        <path
          d="M14 44L28 30L37 38L50 20"
          stroke="#D68C76"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M41 20H50V29"
          stroke="#D68C76"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="14"
          y1="50"
          x2="50"
          y2="50"
          stroke="#C7B8A6"
          strokeOpacity="0.65"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function isDarkCardTheme(theme: JourneyTheme): boolean {
  return theme === 'navy' || theme === 'ink' || theme === 'terracotta-navy';
}

function getCardSurfaceClasses(theme: JourneyTheme, interactive: boolean) {
  switch (theme) {
    case 'ink':
      return `bg-[#121B2E] dark:bg-[#0F182B] text-[#F2EFE8] border-[#C7B8A6]/30 dark:border-[#2C3D60] shadow-[0_28px_56px_-26px_rgba(4,7,14,0.8)] ${
        interactive ? 'hover:border-[#D68C76]/85' : ''
      }`;
    case 'navy':
      return `bg-[#1F2A44] dark:bg-[#17233D] text-[#F2EFE8] border-[#C7B8A6]/35 dark:border-[#31446A] shadow-[0_26px_52px_-24px_rgba(4,7,14,0.68)] ${
        interactive ? 'hover:border-[#D68C76]/85' : ''
      }`;
    case 'terracotta-navy':
      return `bg-[#192238] dark:bg-[#141D32] text-[#F2EFE8] border-[#B46A55]/50 shadow-[0_26px_52px_-24px_rgba(4,7,14,0.65)] ${
        interactive ? 'hover:border-[#D68C76]' : ''
      }`;
    case 'sand':
      return `bg-[#C7B8A6] dark:bg-[#231B1A] text-[#0B1320] dark:text-[#F2EFE8] border-[#A89680] dark:border-[#B46A55]/45 shadow-[0_24px_48px_-24px_rgba(4,7,14,0.45)] ${
        interactive ? 'hover:border-[#0B1320] dark:hover:border-[#D68C76]' : ''
      }`;
    case 'linen':
    default:
      return `bg-[#F2EFE8] dark:bg-[#152036] text-[#0B1320] dark:text-[#F2EFE8] border-[#C7B8A6] dark:border-[#2E3F61] shadow-[0_24px_48px_-24px_rgba(4,7,14,0.42)] ${
        interactive ? 'hover:border-[#B46A55] dark:hover:border-[#D68C76]' : ''
      }`;
  }
}

export const About: React.FC = () => {
  const { ref: introRef, inView: introInView } = useInView({ threshold: 0.1 });
  const prefersReducedMotion = usePrefersReducedMotion();

  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const [activeChapter, setActiveChapter] = useState(0);

  const stackTrackRef = useRef<HTMLDivElement | null>(null);
  const stackStageRef = useRef<HTMLDivElement | null>(null);
  const stackCardsRef = useRef<Array<HTMLElement | null>>([]);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const useStickyStack = isDesktop && !prefersReducedMotion;

  useEffect(() => {
    if (!useStickyStack) return undefined;
    const trackEl = stackTrackRef.current;
    const cards = stackCardsRef.current.filter((el): el is HTMLElement => Boolean(el));
    if (!trackEl || cards.length < 2) return undefined;

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.set(card, {
          zIndex: cards.length - i,
          y: i * 16,
          scale: 1 - i * 0.036,
          rotateX: 0,
          rotateZ: 0,
          opacity: 1,
          transformOrigin: '50% 25%',
        });
      });

      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, { scaleX: 1 / cards.length, transformOrigin: 'left center' });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trackEl,
          start: 'top top+=72',
          end: 'bottom bottom',
          scrub: 0.55,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(cards.length - 1, Math.max(0, Math.round(self.progress * (cards.length - 1))));
            setActiveChapter((prev) => (prev === idx ? prev : idx));
            if (progressBarRef.current) {
              const barScale = Math.min(1, Math.max(1 / cards.length, (1 + self.progress * (cards.length - 1)) / cards.length));
              progressBarRef.current.style.transform = `scaleX(${barScale.toFixed(4)})`;
            }
          },
        },
      });

      for (let step = 0; step < cards.length - 1; step += 1) {
        tl.to(
          cards[step],
          {
            yPercent: -108,
            y: -42,
            rotateX: 14,
            rotateZ: step % 2 === 0 ? -3.2 : 3.2,
            scale: 0.9,
            opacity: 0,
            duration: 1,
            ease: 'power2.inOut',
          },
          step,
        );

        for (let j = step + 1; j < cards.length; j += 1) {
          const nextSlot = j - step - 1;
          tl.to(
            cards[j],
            {
              y: nextSlot * 16,
              scale: 1 - nextSlot * 0.036,
              duration: 1,
              ease: 'power2.inOut',
            },
            step,
          );
        }
      }
    }, stackStageRef);

    return () => {
      ctx.revert();
    };
  }, [useStickyStack]);

  const scrollToChapter = (chapterIndex: number) => {
    setActiveChapter(chapterIndex);
    const trackEl = stackTrackRef.current;
    if (!trackEl) return;

    if (!useStickyStack) {
      const cardEl = stackCardsRef.current[chapterIndex];
      cardEl?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    const rect = trackEl.getBoundingClientRect();
    const startScrollY = window.scrollY + rect.top - 72;
    const stickyViewportH = window.innerHeight;
    const travel = Math.max(1, trackEl.offsetHeight - stickyViewportH + 72);
    const ratio = chapterIndex / (JOURNEY_CARDS.length - 1);
    window.scrollTo({
      top: startScrollY + travel * ratio,
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-20 w-full bg-[#0B1320] text-[#F2EFE8] border-t border-[#1F2A44] overflow-x-clip"
    >
      <div className="max-w-[1220px] mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24">
        {/* ================= A. EDITORIAL INTRODUCTION ================= */}
        <div
          ref={introRef}
          data-revealed={introInView ? 'true' : 'false'}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start"
        >
          {/* Left: Line-by-Line Animated Intro & Identity Narrative */}
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-xs tracking-[0.14em] text-[#D68C76] font-medium">
              01. About BAMBE Aine Chris
            </p>

            <h2
              id="about-heading"
              className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-[#F2EFE8] [text-wrap:balance]"
            >
              <span className="line-mask">
                <span className="line-mask-inner line-mask-delay-1">
                  Learning software craft
                </span>
              </span>
              <span className="line-mask">
                <span className="line-mask-inner line-mask-delay-2 text-[#D68C76]">
                  from the server side up.
                </span>
              </span>
            </h2>

            <Reveal delayMs={150}>
              <div className="mt-7 space-y-5 text-base sm:text-[17px] text-[#DED8CE] leading-[1.8] max-w-[62ch]">
                <p className="text-lg sm:text-xl text-[#F2EFE8] font-medium leading-[1.6]">
                  I&apos;m <strong className="font-semibold text-white">BAMBE Aine Chris</strong>, a
                  software development student at Intango TSS in Busaanza, Rwanda, currently pursuing
                  Level 4 Software Development.
                </p>

                <p>
                  I&apos;m passionate about technology, problem-solving, and creating practical
                  solutions through code. My learning journey focuses on JavaScript, Node.js,
                  Express.js, databases, and web development, with a growing ambition to specialize
                  in backend engineering.
                </p>

                <p>
                  I believe in learning by building, staying curious, and continuously improving.
                  I&apos;m working toward becoming a developer who can turn ideas into useful,
                  reliable technology while seeking opportunities to learn, collaborate, and
                  contribute to meaningful projects.
                </p>
              </div>

              <div className="mt-7 pt-6 border-t border-[#1F2A44]">
                <p className="font-mono-tech text-[11px] tracking-[0.1em] text-[#C7B8A6]">
                  Personal Qualities
                </p>
                <p className="mt-2 text-sm font-medium text-[#F2EFE8] leading-relaxed">
                  {QUALITIES.join(' · ')}
                </p>
              </div>
            </Reveal>
          </div>

          {/* Right: Crisp Linen Student Profile Card (dark-adaptive in Dark Mode) */}
          <div className="lg:col-span-5">
            <Reveal variant="scale" delayMs={150}>
              <div className="relative rounded-2xl bg-[#F2EFE8] dark:bg-[#131E34] text-[#0B1320] dark:text-[#F2EFE8] p-6 sm:p-7 shadow-[0_24px_54px_-24px_rgba(4,7,14,0.75)] border border-[#C7B8A6] dark:border-[#2C3C5E] transition-all duration-200 hover:-translate-y-1">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-6 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#B46A55]/75 to-transparent"
                />
                <div className="flex items-center justify-between pb-4 border-b border-[#C7B8A6]/65 dark:border-[#253452]">
                  <span className="font-mono-tech text-xs text-[#9A4F3A] dark:text-[#D68C76] font-semibold">
                    Student Profile
                  </span>
                  <GraduationCap className="w-4 h-4 text-[#B46A55] dark:text-[#D68C76]" aria-hidden="true" />
                </div>

                <dl className="mt-2 divide-y divide-[#C7B8A6]/45 dark:divide-[#253452]">
                  {EDUCATION_SPEC.map((item) => (
                    <div
                      key={item.label}
                      className="py-3 flex items-baseline justify-between gap-4 text-xs sm:text-sm"
                    >
                      <dt className="text-[#4A5264] dark:text-[#C7B8A6] shrink-0">{item.label}</dt>
                      <dd
                        className={`font-medium text-right ${
                          item.tabular
                            ? 'font-mono-tech tabular-nums text-[#9A4F3A] dark:text-[#D68C76] font-bold'
                            : 'text-[#0B1320] dark:text-[#F2EFE8]'
                        }`}
                      >
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ================= B. MY JOURNEY — CODEGRID STICKY 3D CARD STACK ================= */}
        <div className="mt-20 sm:mt-24 pt-16 border-t border-[#1F2A44]">
          <div
            ref={stackTrackRef}
            className={useStickyStack ? 'lg:h-[310vh]' : ''}
          >
            <div
              ref={stackStageRef}
              className={
                useStickyStack
                  ? 'lg:sticky lg:top-[72px] lg:h-[calc(100vh-4.5rem)] lg:flex lg:items-center'
                  : ''
              }
            >
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                {/* Left Column: Narrative Heading + Interactive Chapter Rail */}
                <div className="lg:col-span-5">
                  <p className="font-mono-tech text-xs tracking-[0.14em] text-[#D68C76] font-medium">
                    My Journey
                  </p>
                  <h3 className="mt-2.5 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#F2EFE8] [text-wrap:balance]">
                    Five chapters of learning and direction.
                  </h3>
                  <p className="mt-3 text-sm text-[#C7B8A6] leading-relaxed max-w-md">
                    How curiosity led into formal software development study at Intango TSS and an
                    intentional path toward backend engineering.
                  </p>

                  {useStickyStack && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between font-mono-tech text-xs text-[#C7B8A6] mb-2">
                        <span>Scroll through chapters</span>
                        <span className="tabular-nums text-[#D68C76] font-semibold">
                          0{activeChapter + 1} / 0{JOURNEY_CARDS.length}
                        </span>
                      </div>
                      <div className="h-[2px] w-full bg-[#1F2A44] rounded-full overflow-hidden">
                        <div
                          ref={progressBarRef}
                          className="h-full w-full bg-[#B46A55] origin-left transition-transform duration-100"
                          style={{ transform: `scaleX(${1 / JOURNEY_CARDS.length})` }}
                        />
                      </div>
                    </div>
                  )}

                  <nav aria-label="Journey chapters" className="mt-6 space-y-1.5">
                    {JOURNEY_CARDS.map((card, idx) => {
                      const isCurrent = idx === activeChapter;
                      return (
                        <button
                          key={card.num}
                          type="button"
                          onClick={() => scrollToChapter(idx)}
                          aria-current={isCurrent ? 'step' : undefined}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                            isCurrent && useStickyStack
                              ? 'bg-[#1F2A44] text-[#F2EFE8] border-[#D68C76]/70 shadow-sm'
                              : 'bg-transparent text-[#DED8CE] border-transparent hover:bg-[#1F2A44]/65 hover:text-[#F2EFE8]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`font-mono-tech text-xs font-semibold tabular-nums shrink-0 ${
                                isCurrent && useStickyStack ? 'text-[#D68C76]' : 'text-[#C7B8A6]'
                              }`}
                            >
                              {card.num}
                            </span>
                            <span className="text-sm font-medium truncate">{card.label}</span>
                          </div>
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                              isCurrent && useStickyStack
                                ? 'text-[#D68C76] translate-x-0.5'
                                : 'text-[#C7B8A6] opacity-60'
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </nav>

                  {useStickyStack && (
                    <p className="mt-4 hidden lg:inline-flex items-center gap-1.5 font-mono-tech text-[11px] text-[#C7B8A6]">
                      <ArrowDown className="w-3.5 h-3.5 text-[#D68C76]" aria-hidden="true" />
                      <span>Scroll smoothly or click any chapter to advance the deck</span>
                    </p>
                  )}
                </div>

                {/* Right Column: Shared 3D Sticky Stack */}
                <div className="lg:col-span-7">
                  <div
                    className={
                      useStickyStack
                        ? 'stack-perspective relative h-[430px] xl:h-[460px] w-full'
                        : 'space-y-5'
                    }
                  >
                    {JOURNEY_CARDS.map((card, idx) => {
                      const isDark = isDarkCardTheme(card.theme);
                      const isSand = card.theme === 'sand';

                      return (
                        <article
                          key={card.num}
                          ref={(el) => {
                            stackCardsRef.current[idx] = el;
                          }}
                          className={`stack-card-layer rounded-2xl p-6 sm:p-8 border flex flex-col justify-between ${getCardSurfaceClasses(
                            card.theme,
                            !useStickyStack,
                          )} ${useStickyStack ? 'absolute inset-0' : ''}`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-6">
                              <div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`font-mono-tech text-xs font-semibold tabular-nums ${
                                      isDark
                                        ? 'text-[#D68C76]'
                                        : isSand
                                          ? 'text-[#7A3725] dark:text-[#D68C76]'
                                          : 'text-[#9A4F3A] dark:text-[#D68C76]'
                                    }`}
                                  >
                                    {card.num}
                                  </span>
                                  <span
                                    aria-hidden="true"
                                    className={`h-[1.5px] w-8 rounded-full ${
                                      isDark
                                        ? 'bg-[#D68C76]'
                                        : isSand
                                          ? 'bg-[#7A3725] dark:bg-[#D68C76]'
                                          : 'bg-[#B46A55] dark:bg-[#D68C76]'
                                    }`}
                                  />
                                  <span
                                    className={`font-mono-tech text-xs ${
                                      isDark
                                        ? 'text-[#C7B8A6]'
                                        : isSand
                                          ? 'text-[#1F2A44] dark:text-[#C7B8A6]'
                                          : 'text-[#4A5264] dark:text-[#C7B8A6]'
                                    }`}
                                  >
                                    {card.label}
                                  </span>
                                </div>

                                <h4 className="mt-4 font-display text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight leading-snug">
                                  {card.title}
                                </h4>
                              </div>

                              <div
                                className={`shrink-0 ${
                                  isDark ? 'text-[#F2EFE8]' : 'text-[#0B1320] dark:text-[#F2EFE8]'
                                }`}
                              >
                                {card.graphic}
                              </div>
                            </div>

                            <p
                              className={`mt-5 text-sm sm:text-base lg:text-[17px] leading-[1.75] ${
                                isDark
                                  ? 'text-[#DED8CE]'
                                  : isSand
                                    ? 'text-[#0B1320] dark:text-[#DED8CE]'
                                    : 'text-[#1F2A44] dark:text-[#DED8CE]'
                              }`}
                            >
                              {card.body}
                            </p>
                          </div>

                          <div
                            className={`mt-6 pt-4 border-t flex items-center justify-between text-xs ${
                              isDark
                                ? 'border-[#C7B8A6]/20 text-[#C7B8A6]'
                                : isSand
                                  ? 'border-[#0B1320]/20 dark:border-[#C7B8A6]/20 text-[#1F2A44] dark:text-[#C7B8A6]'
                                  : 'border-[#C7B8A6]/55 dark:border-[#C7B8A6]/20 text-[#4A5264] dark:text-[#C7B8A6]'
                            }`}
                          >
                            <span className="font-mono-tech">{card.footnote}</span>
                            <span
                              className={`font-mono-tech tabular-nums ${
                                isDark
                                  ? 'text-[#D68C76]'
                                  : isSand
                                    ? 'text-[#7A3725] dark:text-[#D68C76] font-semibold'
                                    : 'text-[#9A4F3A] dark:text-[#D68C76] font-semibold'
                              }`}
                            >
                              Chapter {card.num} / 05
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
