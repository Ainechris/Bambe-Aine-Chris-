import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, FolderGit2, Plus } from 'lucide-react';
import { type GitHubRepoRecord, type ProjectRecord } from '../types/portfolio.ts';
import { ScrollTrigger } from '../utils/gsapSetup.ts';
import { CircularGalleryItem, CircularProjectGallery } from './CircularProjectGallery.tsx';
import { useScrollParallax } from './MotionPrimitives.tsx';

interface ProjectsProps {
  refreshTrigger: number;
  onOpenAdminProjects: () => void;
  onOpenProject: (slug: string) => void;
}

type ExhibitionFilter = 'all' | 'Completed' | 'In Progress';

const EXCLUDED_WORK_RE = /voice[-_ ]?helper/i;

function isExcludedWork(title?: string | null, slug?: string | null): boolean {
  return EXCLUDED_WORK_RE.test(title || '') || EXCLUDED_WORK_RE.test(slug || '');
}

export const Projects: React.FC<ProjectsProps> = ({
  refreshTrigger,
  onOpenAdminProjects,
  onOpenProject,
}) => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [repos, setRepos] = useState<GitHubRepoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ExhibitionFilter>('all');

  const sectionContainerRef = useRef<HTMLElement | null>(null);
  const parallaxLayerRef = useRef<HTMLDivElement | null>(null);
  useScrollParallax(sectionContainerRef, parallaxLayerRef, 0.14);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetch('/api/projects')
        .then((r) => (r.ok ? r.json() : { projects: [] }))
        .catch(() => ({ projects: [] })),
      fetch('/api/github/repos')
        .then((r) => (r.ok ? r.json() : { repos: [] }))
        .catch(() => ({ repos: [] })),
    ])
      .then(
        ([projData, repoData]: [
          { projects?: ProjectRecord[] },
          { repos?: GitHubRepoRecord[] },
        ]) => {
          if (!active) return;
          const cleanProjects = Array.isArray(projData.projects)
            ? projData.projects.filter((p) => !isExcludedWork(p.title, p.slug))
            : [];
          const cleanRepos = Array.isArray(repoData.repos)
            ? repoData.repos.filter((r) => !isExcludedWork(r.name, r.htmlUrl))
            : [];
          setProjects(cleanProjects);
          setRepos(cleanRepos);
        },
      )
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  useEffect(() => {
    if (loading) return undefined;
    const rafId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [loading, statusFilter, projects.length, repos.length]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter((p) => p.projectStatus === statusFilter);
  }, [projects, statusFilter]);

  const galleryItems: CircularGalleryItem[] = useMemo(() => {
    if (filteredProjects.length > 0) {
      return filteredProjects.map((proj) => ({
        id: proj.id,
        title: proj.title,
        description: proj.description,
        technologies: proj.technologies.length > 0 ? proj.technologies : ['Software Development'],
        statusLabel: proj.projectStatus,
        yearLabel: String(new Date(proj.createdAt).getUTCFullYear() || 2026),
        imageUrl: proj.imageUrl,
        detailSlug: proj.slug || proj.id,
        githubUrl: proj.githubUrl,
        liveUrl: proj.liveUrl,
        featured: proj.featured,
      }));
    }

    if (projects.length === 0 && repos.length > 0) {
      return repos.map((repo) => ({
        id: `gh-${repo.id}`,
        title: repo.name,
        description: repo.description || 'Public codebase hosted on GitHub by BAMBE Aine Chris.',
        technologies: repo.language ? [repo.language, 'GitHub'] : ['GitHub', 'Source Code'],
        statusLabel: 'Public Repository',
        yearLabel: String(new Date(repo.updatedAt).getUTCFullYear() || 2026),
        imageUrl: null,
        detailSlug: null,
        githubUrl: repo.htmlUrl,
        liveUrl: null,
      }));
    }

    return [];
  }, [filteredProjects, projects.length, repos]);

  return (
    <section
      id="work"
      ref={sectionContainerRef}
      aria-labelledby="work-heading"
      className="relative scroll-mt-20 w-full bg-[#1F2A44] dark:bg-[#09101D] text-[#F2EFE8] border-t border-[#C7B8A6]/25 dark:border-[#1E2C49] overflow-x-clip transition-colors duration-200"
    >
      {/* Subtle Scroll-Parallax Architectural Backdrop Layer */}
      <div
        ref={parallaxLayerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 -bottom-16 opacity-45 will-change-transform overflow-hidden"
      >
        <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <line x1="180" y1="0" x2="180" y2="900" stroke="#C7B8A6" strokeOpacity="0.16" strokeWidth="1" />
          <line x1="720" y1="0" x2="720" y2="900" stroke="#B46A55" strokeOpacity="0.22" strokeWidth="1" />
          <line x1="1260" y1="0" x2="1260" y2="900" stroke="#C7B8A6" strokeOpacity="0.14" strokeWidth="1" />
          <circle
            cx="1220"
            cy="240"
            r="180"
            stroke="#C7B8A6"
            strokeOpacity="0.18"
            strokeWidth="1"
            strokeDasharray="4 10"
          />
          <circle cx="220" cy="680" r="140" stroke="#D68C76" strokeOpacity="0.16" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="font-mono-tech text-xs tracking-[0.14em] text-[#D68C76]">
              03. Selected Work
            </p>
            <h2
              id="work-heading"
              className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F2EFE8] [text-wrap:balance]"
            >
              Orbital collection of projects &amp; builds.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#C7B8A6] max-w-xl leading-relaxed">
              Navigate the 3D circular showcase to explore software builds published from my
              portfolio dashboard and open source repositories on GitHub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {projects.length >= 2 && (
              <div
                role="tablist"
                aria-label="Filter projects by stage"
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0B1320] border border-[#C7B8A6]/30"
              >
                {(['all', 'Completed', 'In Progress'] as ExhibitionFilter[]).map((tab) => {
                  const active = statusFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStatusFilter(tab)}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#B46A55] text-[#F2EFE8] font-semibold'
                          : 'text-[#C7B8A6] hover:text-[#F2EFE8]'
                      }`}
                    >
                      {tab === 'all' ? 'All Works' : tab}
                    </button>
                  );
                })}
              </div>
            )}

            <a
              href="https://github.com/Ainechris"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#0B1320] hover:bg-[#151E32] border border-[#C7B8A6]/35 hover:border-[#D68C76]/70 text-xs sm:text-sm font-medium text-[#F2EFE8] transition-all duration-150 whitespace-nowrap shrink-0"
            >
              <span>GitHub @Ainechris</span>
              <ArrowUpRight
                className="w-4 h-4 text-[#C7B8A6] group-hover:text-[#D68C76] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </a>

            <button
              type="button"
              onClick={onOpenAdminProjects}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-transparent hover:bg-[#0B1320]/60 border border-[#C7B8A6]/35 text-xs sm:text-sm font-medium text-[#DED8CE] hover:text-[#F2EFE8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#D68C76]" aria-hidden="true" />
              <span>Manage Work</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-12 h-[440px] rounded-2xl bg-[#0B1320] border border-[#C7B8A6]/25 animate-pulse" />
        ) : galleryItems.length > 0 ? (
          <CircularProjectGallery items={galleryItems} onOpenProject={onOpenProject} />
        ) : projects.length > 0 ? (
          <div className="mt-12 rounded-2xl bg-[#0B1320] border border-[#C7B8A6]/35 p-8 flex items-center justify-between gap-4">
            <p className="text-sm text-[#F2EFE8]">No published projects match this stage filter.</p>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-[#F2EFE8] text-xs font-semibold cursor-pointer"
            >
              Show All
            </button>
          </div>
        ) : (
          <div className="mt-12 rounded-2xl bg-[#0B1320] border border-[#C7B8A6]/35 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#1F2A44] border border-[#C7B8A6]/35 flex items-center justify-center shrink-0">
                <FolderGit2 className="w-5 h-5 text-[#D68C76]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-[#F2EFE8]">
                  Projects awaiting publication
                </h3>
                <p className="mt-1.5 text-sm text-[#C7B8A6] max-w-xl leading-relaxed">
                  No fabricated examples are displayed here. Genuine software projects, case studies,
                  and screenshots can be published anytime from the admin dashboard or explored on
                  GitHub.
                </p>
              </div>
            </div>

            <a
              href="https://github.com/Ainechris"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2.5 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-[#F2EFE8] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
            >
              <span>Explore GitHub</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
