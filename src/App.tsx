import { useCallback, useEffect, useState } from 'react';
import { About } from './components/About.tsx';
import { AdminDashboard, type AdminTab } from './components/AdminDashboard.tsx';
import { CertificatesSection } from './components/CertificatesSection.tsx';
import { ContactFooter } from './components/ContactFooter.tsx';
import { Header, type NavSection } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { NotFound } from './components/NotFound.tsx';
import { Process } from './components/Process.tsx';
import { ProjectDetail } from './components/ProjectDetail.tsx';
import { Projects } from './components/Projects.tsx';
import { Skills } from './components/Skills.tsx';
import {
  ADMIN_ROUTE_META,
  PUBLIC_ROUTES,
  findPublicRoute,
  normalizePathname,
} from './seo/routes.ts';

type AppView =
  | { kind: 'portfolio'; section: NavSection }
  | { kind: 'project-detail'; slug: string }
  | { kind: 'admin' }
  | { kind: 'not-found' };

function resolvePathToView(pathname: string): AppView {
  const normalized = normalizePathname(pathname);
  if (normalized === '/admin') {
    return { kind: 'admin' };
  }
  if (normalized.startsWith('/work/') && normalized.length > '/work/'.length) {
    const slug = decodeURIComponent(normalized.slice('/work/'.length));
    if (slug && !slug.includes('/')) {
      return { kind: 'project-detail', slug };
    }
  }
  const route = findPublicRoute(normalized);
  if (route) {
    return { kind: 'portfolio', section: route.sectionId };
  }
  return { kind: 'not-found' };
}

function updateDocumentHead(pathname: string) {
  const normalized = normalizePathname(pathname);
  const origin = window.location.origin;
  const canonicalUrl = `${origin}${normalized === '/' ? '' : normalized}` || origin;

  let title = PUBLIC_ROUTES[0].title;
  let description = PUBLIC_ROUTES[0].description;
  let robots = 'index, follow';

  if (normalized === '/admin') {
    title = ADMIN_ROUTE_META.title;
    description = ADMIN_ROUTE_META.description;
    robots = 'noindex, nofollow, noarchive';
  } else if (normalized.startsWith('/work/') && normalized.length > '/work/'.length) {
    const slugLabel = decodeURIComponent(normalized.slice('/work/'.length)).replace(/-/g, ' ');
    title = `${slugLabel} — Software Project | BAMBE Aine Chris`;
    description = 'Detailed software project showcase and engineering breakdown by BAMBE Aine Chris.';
  } else {
    const matched = findPublicRoute(normalized);
    if (matched) {
      title = matched.title;
      description = matched.description;
    } else {
      title = 'Page Not Found | BAMBE Aine Chris';
      description = 'Requested page could not be found on BAMBE Aine Chris portfolio.';
      robots = 'noindex, nofollow';
    }
  }

  document.title = title;

  const setMeta = (selector: string, content: string) => {
    const el = document.querySelector<HTMLMetaElement>(selector);
    if (el) el.setAttribute('content', content);
  };

  setMeta('meta[name="description"]', description);
  setMeta('meta[name="robots"]', robots);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', canonicalUrl);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);

  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);
}

export default function App() {
  const [view, setView] = useState<AppView>(() => resolvePathToView(window.location.pathname));
  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    const initial = resolvePathToView(window.location.pathname);
    if (initial.kind === 'project-detail') return 'work';
    return initial.kind === 'portfolio' ? initial.section : 'home';
  });
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('projects');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  // Sync browser back/forward navigation
  useEffect(() => {
    updateDocumentHead(window.location.pathname);

    const onPopState = () => {
      const next = resolvePathToView(window.location.pathname);
      setView(next);
      updateDocumentHead(window.location.pathname);
      if (next.kind === 'project-detail') {
        setActiveSection('work');
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else if (next.kind === 'portfolio') {
        setActiveSection(next.section);
        window.requestAnimationFrame(() => {
          if (next.section === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            document.getElementById(next.section)?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        });
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Scroll to initial section if user landed directly on /work, /about, /skills, etc.
  useEffect(() => {
    if (view.kind === 'portfolio' && view.section !== 'home') {
      const targetId = view.section;
      const timer = window.setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 60);
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // Run only on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-spy to highlight active navigation section while browsing
  useEffect(() => {
    if (view.kind !== 'portfolio' || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const sectionIds: NavSection[] = ['home', 'about', 'work', 'skills', 'contact'];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as NavSection;
            if (sectionIds.includes(id)) {
              setActiveSection(id);
            }
          }
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: 0.05 },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [view.kind]);

  const navigateToSection = useCallback((section: NavSection) => {
    const matched = PUBLIC_ROUTES.find((r) => r.sectionId === section) ?? PUBLIC_ROUTES[0];
    if (normalizePathname(window.location.pathname) !== matched.path) {
      window.history.pushState(null, '', matched.path);
    }
    updateDocumentHead(matched.path);
    setView({ kind: 'portfolio', section });
    setActiveSection(section);

    window.requestAnimationFrame(() => {
      if (section === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);

  const navigateToProject = useCallback((slug: string) => {
    const targetPath = `/work/${encodeURIComponent(slug)}`;
    if (normalizePathname(window.location.pathname) !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    updateDocumentHead(targetPath);
    setView({ kind: 'project-detail', slug });
    setActiveSection('work');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const openAdmin = useCallback((tab: AdminTab) => {
    if (normalizePathname(window.location.pathname) !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
    updateDocumentHead('/admin');
    setAdminInitialTab(tab);
    setView({ kind: 'admin' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  if (view.kind === 'admin') {
    return (
      <AdminDashboard
        token={adminToken}
        initialTab={adminInitialTab}
        onSetToken={setAdminToken}
        onBackToPortfolio={() => navigateToSection('home')}
        onDataChanged={() => setDataRefreshKey((k) => k + 1)}
      />
    );
  }

  if (view.kind === 'not-found') {
    return <NotFound onGoHome={() => navigateToSection('home')} />;
  }

  return (
    <div
      id="top"
      className="min-h-screen bg-[#F2EFE8] text-[#0B1320] flex flex-col overflow-x-clip"
    >
      <Header activeSection={activeSection} onSelectSection={navigateToSection} />

      <main className="flex-1">
        {view.kind === 'project-detail' ? (
          <ProjectDetail
            slug={view.slug}
            onBackToWork={() => navigateToSection('work')}
            onSelectProject={navigateToProject}
          />
        ) : (
          <>
            <Hero onSelectSection={navigateToSection} />
            <About />
            <Process />
            <Projects
              refreshTrigger={dataRefreshKey}
              onOpenAdminProjects={() => openAdmin('projects')}
              onOpenProject={navigateToProject}
            />
            <Skills />
            <CertificatesSection
              refreshTrigger={dataRefreshKey}
              onOpenAdminCertificates={() => openAdmin('certificates')}
            />
          </>
        )}
      </main>

      <ContactFooter
        onSelectSection={navigateToSection}
        onOpenAdmin={() => openAdmin('messages')}
      />
    </div>
  );
}
