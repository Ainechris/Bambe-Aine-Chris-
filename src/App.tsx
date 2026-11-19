import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import type { Profile, Project, RoutePath, Video } from './types/portfolio.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { PlanetBackground } from './components/PlanetBackground.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { SkillsPage } from './pages/SkillsPage.tsx';
import { ProjectsPage } from './pages/ProjectsPage.tsx';
import { YouTubePage } from './pages/YouTubePage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

const FALLBACK_PROFILE: Profile = {
  id: 1,
  fullName: 'Bambe Aine Chris',
  brandName: 'Bambe Aine Chris',
  title: 'STUDENT SOFTWARE DEVELOPER · ASPIRING BACKEND DEVELOPER',
  direction: 'BACKEND DEVELOPMENT · SOFTWARE ENGINEERING · WEB SYSTEMS',
  education: 'Intango TSS — L4 SOD (Software Development), Busanza, Nyarutarama, Rwanda (CLA)',
  introShort:
    "I'm a Student Software Developer at Intango TSS (L4 SOD) working toward becoming a Backend Developer. I build practical web software including SAMS and REST APIs.",
  introLong:
    "I’m Bambe Aine Chris, a Student Software Developer at Intango TSS (L4 SOD) in Busanza, Nyarutarama, Rwanda, focused on building a career in backend development. Through coursework and practical projects like SAMS, Express.js APIs, and relational database modeling, I explore how server-side logic and clean interfaces work together reliably.",
  email: 'ainechrisb@gmail.com',
  githubUrl: 'https://github.com/Ainechris',
  youtubeUrl: 'https://www.youtube.com/@VazukoYT',
  instagramUrl: 'https://www.instagram.com/__aine_.23/',
  tiktokUrl: '',
  updatedAt: '',
};

const VALID_PATHS = new Set<RoutePath>([
  '/',
  '/about',
  '/skills',
  '/projects',
  '/youtube',
  '/contact',
  '/admin',
]);

function normalizePath(pathname: string): RoutePath {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return VALID_PATHS.has(clean as RoutePath) ? (clean as RoutePath) : '/';
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<RoutePath>(() =>
    normalizePath(window.location.pathname)
  );
  const [profile, setProfile] = useState<Profile>(FALLBACK_PROFILE);
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const lenisRef = useRef<Lenis | null>(null);

  const loadPortfolioData = useCallback(async () => {
    try {
      const [profRes, projRes, vidRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/projects'),
        fetch('/api/videos'),
      ]);
      if (profRes.ok) setProfile((await profRes.json()) as Profile);
      if (projRes.ok) setProjects((await projRes.json()) as Project[]);
      if (vidRes.ok) setVideos((await vidRes.json()) as Video[]);
    } catch {
      // Keep fallback profile if API temporarily unreachable
    }
  }, []);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  // Lenis smooth scrolling
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Staggered IntersectionObserver for [data-reveal] elements across pages & loaded items
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (nodes.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
    );

    nodes.forEach((el) => {
      if (!el.classList.contains('in')) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [currentPath, projects.length, videos.length]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigate = useCallback((path: RoutePath) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  const showFloatingHeader = currentPath !== '/' || scrolledPastHero;

  return (
    <div className="relative min-h-screen bg-[#04060f] text-[#f3f6ff]">
      <PlanetBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#5df0a8] focus:text-[#032018] focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>

        {/* Keep the exact smoked-glass nav slab header consistent across all pages and scrolled Home */}
        {showFloatingHeader && (
          <Navbar
            currentPath={currentPath}
            profile={profile}
            onNavigate={navigate}
            overlayFixed={currentPath === '/'}
          />
        )}

        <main id="main-content" className="flex-1">
          {currentPath === '/' && (
            <HomePage
              profile={profile}
              projects={projects}
              videos={videos}
              onNavigate={navigate}
            />
          )}
          {currentPath === '/about' && (
            <AboutPage profile={profile} onNavigate={navigate} />
          )}
          {currentPath === '/skills' && <SkillsPage onNavigate={navigate} />}
          {currentPath === '/projects' && <ProjectsPage projects={projects} />}
          {currentPath === '/youtube' && (
            <YouTubePage profile={profile} videos={videos} />
          )}
          {currentPath === '/contact' && <ContactPage profile={profile} />}
          {currentPath === '/admin' && <AdminPage onDataUpdated={loadPortfolioData} />}
        </main>

        <Footer profile={profile} onNavigate={navigate} />
      </div>
    </div>
  );
}
