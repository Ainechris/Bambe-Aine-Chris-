import React, { useEffect, useRef } from 'react';
import { useInView, usePrefersReducedMotion } from './MotionPrimitives.tsx';
import { TechLogo, type TechLogoId } from './TechLogo.tsx';

interface DomainTech {
  name: string;
  note: string;
  logoId: TechLogoId;
}

interface SkillDomainCard {
  id: 'backend' | 'frontend' | 'databases' | 'tools';
  indexLabel: string;
  roleLabel: string;
  title: string;
  summary: string;
  gridSpanClass: string;
  isPrimaryFocus?: boolean;
  pillars: string[];
  technologies: DomainTech[];
}

const DOMAIN_CARDS: SkillDomainCard[] = [
  {
    id: 'backend',
    indexLabel: '01',
    roleLabel: 'Main Focus · Server Architecture',
    title: 'Backend Development',
    summary:
      'Designing structured server logic, clean RESTful routing, input validation, and reliable request lifecycles using JavaScript on the Node.js runtime.',
    gridSpanClass: 'md:col-span-7',
    isPrimaryFocus: true,
    pillars: ['REST API Design', 'Request Validation', 'Middleware Architecture'],
    technologies: [
      {
        name: 'JavaScript',
        note: 'Async workflows, modular business logic & server scripting',
        logoId: 'javascript',
      },
      {
        name: 'Node.js',
        note: 'Server-side JavaScript runtime, environment config & tooling',
        logoId: 'nodejs',
      },
      {
        name: 'Express.js',
        note: 'RESTful route handlers, middleware pipelines & error handling',
        logoId: 'expressjs',
      },
    ],
  },
  {
    id: 'frontend',
    indexLabel: '02',
    roleLabel: 'Interface Layer',
    title: 'Frontend Development',
    summary:
      'Building semantic, responsive interfaces with clear typographic hierarchy, accessible document structure, and clean layout systems.',
    gridSpanClass: 'md:col-span-5',
    pillars: ['Semantic HTML', 'Responsive CSS', 'Accessible Structure'],
    technologies: [
      {
        name: 'HTML5',
        note: 'Semantic document structure & WCAG-conscious markup',
        logoId: 'html5',
      },
      {
        name: 'CSS3',
        note: 'Grid systems, flexbox layouts & responsive styling',
        logoId: 'css3',
      },
    ],
  },
  {
    id: 'databases',
    indexLabel: '03',
    roleLabel: 'Data Persistence',
    title: 'Databases',
    summary:
      'Applying database fundamentals to structure relational tables, foreign-key relationships, and parameterized SQL queries for dependable data storage.',
    gridSpanClass: 'md:col-span-6',
    pillars: ['Database Fundamentals', 'Schema Normalization', 'Parameterized SQL'],
    technologies: [
      {
        name: 'MySQL',
        note: 'Relational table design, joins, constraints & structured SQL queries',
        logoId: 'mysql',
      },
      {
        name: 'Database Fundamentals',
        note: 'Entity modeling, primary/foreign keys & data integrity',
        logoId: 'databases',
      },
    ],
  },
  {
    id: 'tools',
    indexLabel: '04',
    roleLabel: 'Source Control & Workflow',
    title: 'Development Tools',
    summary:
      'Managing clean commit history, feature branches, and collaborative repository workflows across coursework and personal builds.',
    gridSpanClass: 'md:col-span-6',
    pillars: ['Version Control', 'Branch Workflows', 'Open Repositories'],
    technologies: [
      {
        name: 'Git',
        note: 'Branching, clean commits, diff inspection & history management',
        logoId: 'git',
      },
      {
        name: 'GitHub',
        note: 'Remote repositories, documentation & collaborative workflows',
        logoId: 'github',
      },
    ],
  },
];

export const Skills: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgParallaxNearRef = useRef<HTMLDivElement | null>(null);
  const bgParallaxFarRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  const reducedMotion = usePrefersReducedMotion();
  const { ref: revealTriggerRef, inView: sectionInView } = useInView({
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window === 'undefined') return undefined;

    const resetLighting = () => {
      section.style.setProperty('--cursor-opacity', '0');
      for (const card of cardRefs.current) {
        if (card) card.style.setProperty('--card-prox', '0');
      }
      if (bgParallaxNearRef.current) {
        bgParallaxNearRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
      if (bgParallaxFarRef.current) {
        bgParallaxFarRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
    };

    if (reducedMotion) {
      resetLighting();
      return undefined;
    }

    const canHoverFine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    if (!canHoverFine) {
      resetLighting();
      return undefined;
    }

    let rafId = 0;
    let isPointerInside = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let hasInitialized = false;
    let sectionRect = section.getBoundingClientRect();

    const updateFrame = () => {
      rafId = 0;
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      currentX += dx * 0.1;
      currentY += dy * 0.1;

      const relX = currentX - sectionRect.left;
      const relY = currentY - sectionRect.top;

      section.style.setProperty('--cursor-x', `${relX.toFixed(1)}px`);
      section.style.setProperty('--cursor-y', `${relY.toFixed(1)}px`);

      if (sectionRect.width > 0 && sectionRect.height > 0) {
        const normX = Math.max(-0.5, Math.min(0.5, relX / sectionRect.width - 0.5));
        const normY = Math.max(-0.5, Math.min(0.5, relY / sectionRect.height - 0.5));

        if (bgParallaxNearRef.current) {
          bgParallaxNearRef.current.style.transform = `translate3d(${(-normX * 16).toFixed(1)}px, ${(-normY * 12).toFixed(1)}px, 0)`;
        }
        if (bgParallaxFarRef.current) {
          bgParallaxFarRef.current.style.transform = `translate3d(${(normX * 9).toFixed(1)}px, ${(normY * 7).toFixed(1)}px, 0)`;
        }
      }

      for (const card of cardRefs.current) {
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        const localX = currentX - rect.left;
        const localY = currentY - rect.top;

        card.style.setProperty('--card-mx', `${localX.toFixed(1)}px`);
        card.style.setProperty('--card-my', `${localY.toFixed(1)}px`);

        const clampX = Math.max(rect.left, Math.min(currentX, rect.right));
        const clampY = Math.max(rect.top, Math.min(currentY, rect.bottom));
        const distance = Math.hypot(currentX - clampX, currentY - clampY);
        const proximity = isPointerInside ? Math.max(0, Math.min(1, 1 - distance / 260)) : 0;

        card.style.setProperty('--card-prox', proximity.toFixed(3));
      }

      const stillSettling = Math.abs(dx) > 0.35 || Math.abs(dy) > 0.35;
      if (isPointerInside && stillSettling) {
        rafId = window.requestAnimationFrame(updateFrame);
      }
    };

    const scheduleFrame = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateFrame);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      sectionRect = section.getBoundingClientRect();
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasInitialized) {
        currentX = targetX;
        currentY = targetY;
        hasInitialized = true;
      }

      if (!isPointerInside) {
        isPointerInside = true;
        section.style.setProperty('--cursor-opacity', '1');
      }

      scheduleFrame();
    };

    const onPointerLeave = () => {
      isPointerInside = false;
      section.style.setProperty('--cursor-opacity', '0');
      for (const card of cardRefs.current) {
        if (card) card.style.setProperty('--card-prox', '0');
      }
      if (bgParallaxNearRef.current) {
        bgParallaxNearRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
      if (bgParallaxFarRef.current) {
        bgParallaxFarRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
    };

    const onResizeOrScroll = () => {
      sectionRect = section.getBoundingClientRect();
    };

    section.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResizeOrScroll, { passive: true });
    window.addEventListener('scroll', onResizeOrScroll, { passive: true });

    return () => {
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <section
      id="skills"
      ref={sectionRef}
      aria-labelledby="skills-heading"
      className="skills-atmosphere scroll-mt-20 relative w-full text-[#0B1320] dark:text-[#F2EFE8] border-t border-[#C7B8A6]/55 dark:border-[#22314F] overflow-hidden transition-colors duration-200"
    >
      {/* Subtle Tactile Linen & Warm Sand tonal depth orbs for authentic frosted refraction */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -left-16 w-[460px] h-[460px] rounded-full opacity-65 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(199, 184, 166, 0.5) 0%, rgba(234, 229, 220, 0.2) 55%, transparent 78%)',
          }}
        />
        <div
          className="absolute top-[36%] right-[-6%] w-[420px] h-[420px] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(180, 106, 85, 0.16) 0%, rgba(199, 184, 166, 0.18) 52%, transparent 76%)',
          }}
        />
        <div
          className="absolute -bottom-28 left-[28%] w-[520px] h-[340px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(31, 42, 68, 0.08) 0%, rgba(199, 184, 166, 0.25) 55%, transparent 78%)',
          }}
        />
      </div>

      {/* Far parallax architectural vector lines */}
      <div
        ref={bgParallaxFarRef}
        aria-hidden="true"
        className="skills-parallax-layer pointer-events-none absolute inset-[-24px] opacity-45 will-change-transform"
      >
        <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <line x1="210" y1="0" x2="210" y2="900" stroke="#C7B8A6" strokeOpacity="0.45" strokeWidth="1" />
          <line x1="720" y1="0" x2="720" y2="900" stroke="#B46A55" strokeOpacity="0.2" strokeWidth="1" />
          <line x1="1230" y1="0" x2="1230" y2="900" stroke="#C7B8A6" strokeOpacity="0.4" strokeWidth="1" />
          <line x1="0" y1="260" x2="1440" y2="260" stroke="#C7B8A6" strokeOpacity="0.3" strokeWidth="1" />
          <line x1="0" y1="640" x2="1440" y2="640" stroke="#B46A55" strokeOpacity="0.14" strokeWidth="1" />
        </svg>
      </div>

      {/* Near parallax restrained architectural rings & micro-dots */}
      <div
        ref={bgParallaxNearRef}
        aria-hidden="true"
        className="skills-parallax-layer pointer-events-none absolute inset-[-24px] opacity-60 will-change-transform"
      >
        <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full">
          <circle
            cx="1180"
            cy="210"
            r="165"
            stroke="#B46A55"
            strokeOpacity="0.2"
            strokeWidth="1"
            strokeDasharray="3 9"
          />
          <circle cx="240" cy="680" r="130" className="stroke-[#1F2A44] dark:stroke-[#C7B8A6]" strokeOpacity="0.16" strokeWidth="1" />
          <circle cx="320" cy="180" r="1.8" fill="#B46A55" fillOpacity="0.35" />
          <circle cx="640" cy="140" r="1.5" className="fill-[#1F2A44] dark:fill-[#C7B8A6]" fillOpacity="0.25" />
          <circle cx="980" cy="310" r="1.6" fill="#B46A55" fillOpacity="0.32" />
          <circle cx="1110" cy="540" r="2" className="fill-[#1F2A44] dark:fill-[#C7B8A6]" fillOpacity="0.22" />
          <circle cx="430" cy="510" r="1.5" fill="#9A4F3A" fillOpacity="0.28" />
          <circle cx="810" cy="760" r="1.8" fill="#B46A55" fillOpacity="0.28" />
        </svg>
      </div>

      {/* Smooth cursor-following radial warm terracotta / sand diffusion */}
      <div
        aria-hidden="true"
        className="skills-cursor-light pointer-events-none absolute inset-0 z-[1]"
      />

      {/* Main Content Container */}
      <div
        ref={revealTriggerRef}
        data-revealed={sectionInView ? 'true' : 'false'}
        className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 py-20 sm:py-28"
      >
        {/* Header with masked line reveal */}
        <header className="max-w-3xl">
          <p
            className={`font-mono-tech text-xs tracking-[0.16em] text-[#9A4F3A] dark:text-[#D68C76] font-semibold transition-opacity duration-500 ${
              sectionInView ? 'opacity-100' : 'opacity-0'
            }`}
          >
            04. Technologies &amp; Skills
          </p>

          <h2
            id="skills-heading"
            className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-[#0B1320] dark:text-[#F2EFE8] leading-[1.12] [text-wrap:balance]"
          >
            <span className="line-mask">
              <span className="line-mask-inner line-mask-delay-1">
                Technical stack &amp; current focus.
              </span>
            </span>
          </h2>

          <p
            className={`mt-4 text-sm sm:text-base text-[#4A5264] dark:text-[#C7B8A6] max-w-2xl leading-relaxed transition-all duration-700 ease-out ${
              sectionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            Organized across four core engineering domains. Practical skills built through Level 4
            Software Development coursework at Intango TSS and personal backend-focused projects.
          </p>
        </header>

        {/* Decorative Editorial Divider */}
        <div
          aria-hidden="true"
          className={`mt-8 mb-10 flex items-center gap-3 transition-opacity duration-700 delay-150 ${
            sectionInView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="w-2 h-2 rotate-45 border border-[#B46A55] dark:border-[#D68C76] bg-[#FAF8F4] dark:bg-[#0C1424] shrink-0" />
          <div className="h-px flex-1 bg-gradient-to-r from-[#B46A55]/55 via-[#C7B8A6]/80 dark:via-[#2C3C5E] to-transparent" />
          <span className="font-mono-tech text-[11px] tracking-[0.14em] text-[#4A5264] dark:text-[#C7B8A6] whitespace-nowrap">
            Core Stack Architecture
          </span>
        </div>

        {/* Preserved Four-Card Asymmetric Composition:
            Top Left: Backend Development (Largest, Main Focus - Midnight Ink glass)
            Top Right: Frontend Development (Frosted Tactile Linen glass)
            Bottom Left: Databases (Frosted Tactile Linen glass)
            Bottom Right: Development Tools (Frosted Tactile Linen glass) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {DOMAIN_CARDS.map((card, cardIdx) => {
            const delayClass =
              cardIdx === 0
                ? 'delay-0'
                : cardIdx === 1
                  ? 'delay-75'
                  : cardIdx === 2
                    ? 'delay-150'
                    : 'delay-200';

            const isFocus = Boolean(card.isPrimaryFocus);

            return (
              <div
                key={card.id}
                className={`${card.gridSpanClass} reveal-base ${delayClass} ${
                  sectionInView ? 'reveal-visible' : ''
                }`}
              >
                <article
                  ref={(el) => {
                    cardRefs.current[cardIdx] = el;
                  }}
                  className={`skills-glass-card ${
                    isFocus
                      ? 'skills-glass-card--focus text-[#F2EFE8]'
                      : 'text-[#0B1320] dark:text-[#F2EFE8]'
                  } group h-full rounded-2xl overflow-hidden flex flex-col justify-between ${
                    isFocus ? 'p-6 sm:p-8' : 'p-6 sm:p-7'
                  }`}
                >
                  {/* Dynamic pointer-reactive reflection & edge illumination overlays */}
                  <div
                    aria-hidden="true"
                    className="skills-glass-reflection pointer-events-none absolute inset-0 rounded-2xl"
                  />
                  <div
                    aria-hidden="true"
                    className="skills-glass-edge pointer-events-none absolute inset-0 rounded-2xl"
                  />

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <p
                          className={`font-mono-tech text-[11px] tracking-[0.14em] font-semibold ${
                            isFocus ? 'text-[#D68C76]' : 'text-[#9A4F3A] dark:text-[#D68C76]'
                          }`}
                        >
                          {card.indexLabel} <span aria-hidden="true">·</span> {card.roleLabel}
                        </p>

                        <span
                          className={`font-mono-tech text-[11px] tabular-nums ${
                            isFocus ? 'text-[#C7B8A6]' : 'text-[#4A5264] dark:text-[#C7B8A6]'
                          }`}
                        >
                          {card.technologies.length}{' '}
                          {card.technologies.length === 1 ? 'Core Technology' : 'Technologies'}
                        </span>
                      </div>

                      <h3
                        className={`mt-2.5 font-display font-bold tracking-tight ${
                          isFocus
                            ? 'text-2xl sm:text-[1.7rem] text-[#F2EFE8]'
                            : 'text-xl sm:text-2xl text-[#0B1320] dark:text-[#F2EFE8]'
                        }`}
                      >
                        {card.title}
                      </h3>

                      <p
                        className={`mt-2.5 text-sm leading-relaxed max-w-2xl ${
                          isFocus ? 'text-[#DED8CE]' : 'text-[#4A5264] dark:text-[#DED8CE]'
                        }`}
                      >
                        {card.summary}
                      </p>

                      {/* Unboxed engineering pillars */}
                      <div
                        className={`mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono-tech ${
                          isFocus ? 'text-[#D68C76]' : 'text-[#9A4F3A] dark:text-[#D68C76]'
                        }`}
                      >
                        {card.pillars.map((pillar, pIdx) => (
                          <React.Fragment key={pillar}>
                            {pIdx > 0 && (
                              <span
                                aria-hidden="true"
                                className={
                                  isFocus
                                    ? 'text-[#C7B8A6]/45'
                                    : 'text-[#C7B8A6] dark:text-[#C7B8A6]/45'
                                }
                              >
                                /
                              </span>
                            )}
                            <span>{pillar}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Official Technology Stack Items inside the Glass Card */}
                    <div
                      className={`mt-6 pt-5 border-t ${
                        isFocus
                          ? 'border-[#C7B8A6]/20 space-y-4'
                          : 'border-[#C7B8A6]/50 dark:border-[#C7B8A6]/20 space-y-3.5'
                      }`}
                    >
                      {card.technologies.map((tech) => (
                        <div
                          key={`${card.id}-${tech.name}`}
                          className={`skills-tech-row group/tech pb-3 last:pb-0 border-b last:border-b-0 ${
                            isFocus
                              ? 'border-[#C7B8A6]/12'
                              : 'border-[#C7B8A6]/35 dark:border-[#C7B8A6]/15'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`skills-tech-chip w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isFocus ? 'text-[#F2EFE8]' : 'text-[#0B1320] dark:text-[#F2EFE8]'
                              }`}
                            >
                              <TechLogo id={tech.logoId} className="w-6 h-6" />
                            </div>

                            <div className="min-w-0">
                              <h4
                                className={`font-display text-sm sm:text-[0.95rem] font-semibold truncate ${
                                  isFocus ? 'text-[#F2EFE8]' : 'text-[#0B1320] dark:text-[#F2EFE8]'
                                }`}
                              >
                                {tech.name}
                              </h4>
                              <p
                                className={`text-xs truncate sm:whitespace-normal leading-snug ${
                                  isFocus ? 'text-[#C7B8A6]' : 'text-[#4A5264] dark:text-[#C7B8A6]'
                                }`}
                              >
                                {tech.note}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Section Footer Text */}
        <footer
          className={`mt-10 pt-6 border-t border-[#C7B8A6]/55 dark:border-[#22314F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-tech text-[#4A5264] dark:text-[#C7B8A6] transition-opacity duration-700 delay-300 ${
            sectionInView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-[#9A4F3A] dark:text-[#D68C76] font-medium">
            Backend engineering direction <span aria-hidden="true">·</span> Intango TSS Software
            Development
          </p>
          <p>Built on real coursework and practical REST &amp; SQL projects.</p>
        </footer>
      </div>
    </section>
  );
};
