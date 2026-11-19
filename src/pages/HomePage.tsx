import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import type { Profile, Project, RoutePath, Video } from '../types/portfolio.ts';
import { FacetGlassHero } from '../components/FacetGlassHero.tsx';
import { AboutPage } from './AboutPage.tsx';
import { SkillsPage } from './SkillsPage.tsx';
import { ProjectsPage } from './ProjectsPage.tsx';
import { YouTubePage } from './YouTubePage.tsx';
import { ContactPage } from './ContactPage.tsx';

interface HomePageProps {
  profile: Profile;
  projects: Project[];
  videos: Video[];
  onNavigate: (path: RoutePath) => void;
}

const CHAPTERS = [
  { id: 'home-hero', label: 'Hero', num: '00' },
  { id: 'home-about', label: 'About', num: '01' },
  { id: 'home-skills', label: 'Skills', num: '02' },
  { id: 'home-projects', label: 'Projects', num: '03' },
  { id: 'home-youtube', label: 'YouTube', num: '04' },
  { id: 'home-contact', label: 'Contact', num: '05' },
] as const;

const MARQUEE_ITEMS = [
  'Bambe Aine Chris',
  'Student Software Developer',
  'Aspiring Backend Engineer',
  'Node.js & Express.js',
  'MySQL & SQLite',
  'SAMS Architecture',
  '@VazukoYT Stories',
  'Intango TSS · L4 SOD · Rwanda',
];

export const HomePage: React.FC<HomePageProps> = ({
  profile,
  projects,
  videos,
  onNavigate,
}) => {
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState<string>('home-hero');

  const scrollToSection = useCallback((id: string) => {
    if (id === 'home-hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Cinematic GPU-only scroll choreography: hero recession + chapter parallax drift
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafPending = false;

    const updateScrollChoreography = () => {
      rafPending = false;
      const vh = window.innerHeight || 900;
      const scrollY = window.scrollY;

      // Subtle hero depth recession when scrolling down
      const heroEl = heroWrapRef.current;
      if (heroEl && !reduced) {
        const heroProgress = Math.min(1, Math.max(0, scrollY / (vh * 0.95)));
        const scale = 1 - heroProgress * 0.045;
        const opacity = 1 - heroProgress * 0.22;
        const yShift = heroProgress * -24;
        heroEl.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        heroEl.style.opacity = opacity.toFixed(3);
      }

      // Per-chapter normalized viewport progress -> CSS variable --chapter-shift (-1..1)
      const chapters = document.querySelectorAll<HTMLElement>('[data-chapter]');
      let bestChapter = scrollY < vh * 0.45 ? 'home-hero' : '';
      let bestDist = Infinity;

      chapters.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const centerOffset = (rect.top + Math.min(rect.height, vh) * 0.35 - vh * 0.5) / vh;
        const clamped = Math.max(-1.2, Math.min(1.2, centerOffset));
        if (!reduced) {
          el.style.setProperty('--chapter-shift', clamped.toFixed(3));
        }

        const absDist = Math.abs(rect.top - vh * 0.28);
        if (rect.bottom > vh * 0.2 && rect.top < vh * 0.78 && absDist < bestDist) {
          bestDist = absDist;
          bestChapter = el.id;
        }
      });

      if (bestChapter) {
        setActiveChapter((prev) => (prev === bestChapter ? prev : bestChapter));
      }
    };

    const onScroll = () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateScrollChoreography);
      }
    };

    updateScrollChoreography();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="relative">
      {/* Side Chapter Navigation Rail (ultra-wide desktop) */}
      <aside
        aria-label="Homepage chapters"
        className="hidden 2xl:flex fixed right-7 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-3"
      >
        {CHAPTERS.map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => scrollToSection(ch.id)}
              className="group flex items-center gap-3 text-right cursor-pointer py-1 px-1 rounded focus-visible:outline-[#5df0a8]"
            >
              <span
                className={`text-[11px] font-mono-tech uppercase tracking-[0.16em] transition-all duration-200 ${
                  isActive
                    ? 'text-[#5df0a8] opacity-100 translate-x-0'
                    : 'text-[#9aa6c4] opacity-0 group-hover:opacity-90 translate-x-1 group-hover:translate-x-0'
                }`}
              >
                {ch.num} · {ch.label}
              </span>
              <span
                className={`block h-[2px] rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-7 bg-[#5df0a8] shadow-[0_0_12px_rgba(93,240,168,0.65)]'
                    : 'w-3 bg-[rgba(150,175,230,0.3)] group-hover:w-5 group-hover:bg-[#f3f6ff]'
                }`}
              />
            </button>
          );
        })}
      </aside>

      {/* Hero Stage with Scroll Recession */}
      <div
        id="home-hero"
        ref={heroWrapRef}
        className="relative will-change-transform origin-top"
      >
        <FacetGlassHero
          profile={profile}
          onNavigate={onNavigate}
          onExploreWork={() => scrollToSection('home-projects')}
        />

        {/* Subtle Hero-to-Story Scroll Cue */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => scrollToSection('home-about')}
            className="group flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[rgba(12,18,38,0.68)] backdrop-blur-md border border-[rgba(150,175,230,0.2)] hover:border-[#5df0a8]/60 text-[11px] font-mono-tech uppercase tracking-[0.16em] text-[#9aa6c4] hover:text-[#f3f6ff] transition-colors cursor-pointer shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
          >
            <span className="relative w-1.5 h-3.5 overflow-hidden flex items-center justify-center">
              <span className="scroll-cue-runner w-[2px] h-2.5 bg-[#5df0a8] rounded-full" />
            </span>
            <span>Scroll to explore</span>
            <ArrowDown
              className="w-3 h-3 text-[#5df0a8] group-hover:translate-y-0.5 transition-transform"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Editorial Marquee Transition Ribbon */}
      <div
        className="cinematic-marquee overflow-hidden border-y border-[rgba(150,175,230,0.12)] bg-[rgba(6,10,24,0.62)] backdrop-blur-md py-4"
        aria-hidden="true"
      >
        <div className="cinematic-marquee-track text-xs font-mono-tech uppercase tracking-[0.22em] text-[#9aa6c4]">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-8 pr-8 shrink-0">
              {MARQUEE_ITEMS.map((item) => (
                <React.Fragment key={`${dup}-${item}`}>
                  <span className="whitespace-nowrap">{item}</span>
                  <span className="text-[#5df0a8]">/</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* All Portfolio Pages Embedded Sequentially as Cinematic Scroll Chapters */}
      <div className="relative">
        <AboutPage profile={profile} onNavigate={onNavigate} embedded />
        <SkillsPage onNavigate={onNavigate} embedded />
        <ProjectsPage projects={projects} embedded />
        <YouTubePage profile={profile} videos={videos} embedded />
        <ContactPage profile={profile} embedded />
      </div>
    </div>
  );
};
