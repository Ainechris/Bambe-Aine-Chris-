import React from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { type NavSection } from './Header.tsx';
import { SocialIdentityDeck } from './SocialIdentityDeck.tsx';

interface HeroProps {
  onSelectSection: (section: NavSection) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectSection }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, section: NavSection) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onSelectSection(section);
  };

  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative w-full bg-[#F2EFE8] dark:bg-[#070C16] text-[#0B1320] dark:text-[#F2EFE8] overflow-hidden transition-colors duration-200"
    >
      {/* Subtle Architectural Grid & Sculptural Midnight Ink / Slate Indigo / Warm Sand Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 editorial-grid-texture opacity-75"
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 1440 780"
        fill="none"
        className="pointer-events-none absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Sculptural Chamfered Midnight Ink Backdrop Anchoring the Identity Deck */}
        <path
          d="M845 -30H1460V810H755L695 620C670 540 710 465 765 405L845 -30Z"
          className="fill-[#0B1320] dark:fill-[#10192D]"
        />
        {/* Layered Slate Indigo Navy Facet for Editorial Depth */}
        <path
          d="M980 -30H1460V560L1210 695C1080 610 1015 470 1035 310L980 -30Z"
          className="fill-[#1F2A44] dark:fill-[#1A2742]"
          fillOpacity="0.88"
        />
        {/* Warm Sand Hairline Axis */}
        <line
          x1="755"
          y1="0"
          x2="845"
          y2="780"
          stroke="#C7B8A6"
          strokeOpacity="0.32"
          strokeWidth="1"
        />
        <circle
          cx="1090"
          cy="370"
          r="285"
          stroke="#C7B8A6"
          strokeOpacity="0.28"
          strokeWidth="1.2"
          strokeDasharray="6 10"
        />
        <circle
          cx="1090"
          cy="370"
          r="215"
          stroke="#B46A55"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      </svg>

      <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-center">
          {/* Left: Staggered Editorial Identity & Actions on Tactile Linen */}
          <div className="lg:col-span-6 relative z-10">
            <div className="hero-stagger-1 inline-flex items-center gap-3">
              <span className="h-[1.5px] w-7 bg-[#B46A55] dark:bg-[#D68C76]" aria-hidden="true" />
              <p className="font-mono-tech text-xs tracking-[0.14em] text-[#9A4F3A] dark:text-[#D68C76] font-medium">
                Student Software Developer · Busaanza, Rwanda
              </p>
            </div>

            <h1
              id="hero-heading"
              className="hero-stagger-2 mt-5 font-display text-[clamp(2.55rem,5vw,4.35rem)] font-bold tracking-tight leading-[1.05] text-[#0B1320] dark:text-[#F2EFE8] [text-wrap:balance]"
            >
              I build ideas into{' '}
              <span className="text-[#B46A55] dark:text-[#D68C76]">digital experiences.</span>
            </h1>

            <p className="hero-stagger-3 mt-6 text-base sm:text-[17px] text-[#1F2A44] dark:text-[#DED8CE] leading-[1.75] max-w-[52ch]">
              I&apos;m <strong className="font-semibold text-[#0B1320] dark:text-white">BAMBE Aine Chris</strong>{' '}
              (Aine Chris), a Level 4 Software Development student at Intango TSS in Busaanza,
              Rwanda focused on backend engineering, problem-solving, and practical code.
            </p>

            <div className="hero-stagger-4 mt-9 flex flex-wrap items-center gap-3.5">
              <a
                href="/work"
                onClick={(e) => handleLinkClick(e, 'work')}
                className="group inline-flex items-center gap-2.5 min-h-[44px] px-5.5 py-3 rounded-lg bg-[#0B1320] hover:bg-[#B46A55] dark:bg-[#B46A55] dark:hover:bg-[#9A4F3A] text-[#F2EFE8] text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0 shadow-[0_14px_28px_-14px_rgba(11,19,32,0.42)]"
              >
                <span>View My Work</span>
                <ArrowRight
                  className="w-4 h-4 text-[#D68C76] dark:text-[#F2EFE8] group-hover:text-[#F2EFE8] transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>

              <a
                href="/contact"
                onClick={(e) => handleLinkClick(e, 'contact')}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-lg bg-[#FAF8F4] hover:bg-[#E8E2D7] dark:bg-[#111A2E] dark:hover:bg-[#1A2742] border border-[#C7B8A6] dark:border-[#304166] hover:border-[#B46A55] dark:hover:border-[#D68C76] text-[#0B1320] dark:text-[#F2EFE8] text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
              >
                <span>Get in Touch</span>
              </a>
            </div>

            <p className="hero-stagger-5 mt-10 font-mono-tech text-[11px] sm:text-xs tracking-[0.1em] text-[#4A5264] dark:text-[#C7B8A6]">
              Backend Development <span aria-hidden="true" className="text-[#B46A55] dark:text-[#D68C76] mx-1.5">/</span>{' '}
              JavaScript &amp; Node.js{' '}
              <span aria-hidden="true" className="text-[#B46A55] dark:text-[#D68C76] mx-1.5">/</span> Problem Solving
            </p>
          </div>

          {/* Right: Interactive AINECHRIS Social Identity Deck + Sculptural Orbital Rings */}
          <div className="lg:col-span-6 relative hero-sculpture-enter">
            <div className="relative flex items-center justify-center rounded-3xl lg:rounded-none bg-[#0B1320] dark:bg-[#0D1627] lg:bg-transparent lg:dark:bg-transparent p-4 sm:p-6 lg:p-0 border border-[#C7B8A6]/30 dark:border-[#24324D] lg:border-0 shadow-[0_24px_54px_-24px_rgba(11,19,32,0.45)] lg:shadow-none">
              <svg
                aria-hidden="true"
                viewBox="0 0 520 520"
                className="pointer-events-none absolute inset-0 w-full h-full opacity-75"
              >
                <circle
                  cx="260"
                  cy="260"
                  r="214"
                  fill="none"
                  stroke="#C7B8A6"
                  strokeOpacity="0.34"
                  strokeWidth="1.2"
                  strokeDasharray="4 8"
                />
                <circle
                  cx="260"
                  cy="260"
                  r="164"
                  fill="none"
                  stroke="#D68C76"
                  strokeOpacity="0.34"
                  strokeWidth="1"
                />
                <circle cx="260" cy="46" r="3" fill="#C7B8A6" />
                <circle cx="474" cy="260" r="2.5" fill="#D68C76" />
              </svg>
              <SocialIdentityDeck />
            </div>
          </div>
        </div>

        {/* Bottom Scroll Indicator Row */}
        <div className="hero-stagger-5 mt-8 sm:mt-10 pt-6 border-t border-[#C7B8A6]/55 dark:border-[#22314F] flex items-center justify-between text-xs text-[#4A5264] dark:text-[#C7B8A6]">
          <span className="font-medium">BAMBE Aine Chris · Aspiring Backend Developer</span>
          <a
            href="/about"
            onClick={(e) => handleLinkClick(e, 'about')}
            className="group inline-flex items-center gap-2.5 text-[#0B1320] dark:text-[#F2EFE8] lg:text-[#F2EFE8] hover:text-[#9A4F3A] dark:hover:text-[#D68C76] lg:hover:text-[#D68C76] transition-colors font-medium"
          >
            <span>Scroll to explore</span>
            <span
              aria-hidden="true"
              className="relative w-3.5 h-5 rounded-full border border-[#B46A55]/75 dark:border-[#C7B8A6]/70 lg:border-[#C7B8A6]/70 overflow-hidden flex items-center justify-center"
            >
              <span className="scroll-cue-bar w-0.5 h-2 rounded-full bg-[#B46A55] dark:bg-[#D68C76] lg:bg-[#D68C76]" />
            </span>
            <ArrowDown
              className="w-3.5 h-3.5 text-[#B46A55] dark:text-[#D68C76] lg:text-[#D68C76] transition-transform duration-200 group-hover:translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  );
};
