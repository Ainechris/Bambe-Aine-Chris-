import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Layers,
  Maximize2,
  X,
} from 'lucide-react';
import { applyProjectSeoHead } from '../App.tsx';
import {
  type ProjectRecord,
  formatDisplayDate,
  isSafeHttpUrl,
} from '../types/portfolio.ts';
import { Reveal, useInView } from './MotionPrimitives.tsx';
import { TechLogo, type TechLogoId } from './TechLogo.tsx';

interface ProjectDetailProps {
  slug: string;
  onBackToWork: () => void;
  onSelectProject: (slug: string) => void;
}

const TECH_NAME_TO_LOGO: Record<string, TechLogoId> = {
  javascript: 'javascript',
  js: 'javascript',
  'node.js': 'nodejs',
  nodejs: 'nodejs',
  node: 'nodejs',
  'express.js': 'expressjs',
  expressjs: 'expressjs',
  express: 'expressjs',
  mysql: 'mysql',
  html: 'html5',
  html5: 'html5',
  css: 'css3',
  css3: 'css3',
  git: 'git',
  github: 'github',
  database: 'databases',
  databases: 'databases',
  sql: 'databases',
  backend: 'backend',
};

function matchTechLogo(name: string): TechLogoId | null {
  const key = name.trim().toLowerCase();
  return TECH_NAME_TO_LOGO[key] ?? null;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  slug,
  onBackToWork,
  onSelectProject,
}) => {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const { ref: mediaRef, inView: mediaInView } = useInView({ threshold: 0.05 });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setLightboxIndex(null);

    Promise.all([
      fetch(`/api/projects/${encodeURIComponent(slug)}`).then(async (res) => {
        if (res.status === 404) return { notFound: true as const };
        if (!res.ok) throw new Error('Unable to load project.');
        const data = (await res.json()) as { project?: ProjectRecord };
        return { project: data.project ?? null };
      }),
      fetch('/api/projects')
        .then((r) => (r.ok ? r.json() : { projects: [] }))
        .catch(() => ({ projects: [] })),
    ])
      .then(([detailRes, listRes]: [
        { notFound?: true; project?: ProjectRecord | null },
        { projects?: ProjectRecord[] },
      ]) => {
        if (!active) return;
        if ('notFound' in detailRes && detailRes.notFound) {
          setProject(null);
          setNotFound(true);
          applyProjectSeoHead(null, true);
        } else {
          const loaded = detailRes.project ?? null;
          setProject(loaded);
          setNotFound(!loaded);
          applyProjectSeoHead(loaded, !loaded);
        }
        const safeList = Array.isArray(listRes.projects)
          ? listRes.projects.filter(
              (p) => !/voice[-_ ]?helper/i.test(p.title) && !/voice[-_ ]?helper/i.test(p.slug),
            )
          : [];
        setAllProjects(safeList);
      })
      .catch(() => {
        if (active) {
          setNotFound(true);
          applyProjectSeoHead(null, true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const allScreenshots = useMemo(() => {
    if (!project) return [];
    const items: Array<{ id: string; url: string; label: string }> = [];
    if (project.imageUrl && !failedImages['cover']) {
      items.push({
        id: 'cover',
        url: project.imageUrl,
        label: `${project.title} — Primary Preview`,
      });
    }
    project.screenshots.forEach((shot, idx) => {
      if (!failedImages[shot.id]) {
        items.push({
          id: shot.id,
          url: shot.imageUrl,
          label: `${project.title} — Screenshot ${idx + 1}`,
        });
      }
    });
    return items;
  }, [project, failedImages]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && allScreenshots.length > 1) {
        setLightboxIndex((curr) =>
          curr === null ? null : (curr + 1) % allScreenshots.length,
        );
      } else if (e.key === 'ArrowLeft' && allScreenshots.length > 1) {
        setLightboxIndex((curr) =>
          curr === null ? null : (curr - 1 + allScreenshots.length) % allScreenshots.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, allScreenshots.length]);

  const nextProject = useMemo(() => {
    if (!project || allProjects.length < 2) return null;
    const idx = allProjects.findIndex((p) => p.id === project.id);
    if (idx === -1) return allProjects[0];
    return allProjects[(idx + 1) % allProjects.length];
  }, [project, allProjects]);

  if (loading) {
    return (
      <section className="w-full bg-[#0B1320] text-[#F2EFE8] min-h-[70vh]">
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-8 animate-pulse">
          <div className="h-4 w-44 rounded bg-[#1F2A44]" />
          <div className="h-12 w-2/3 rounded bg-[#1F2A44]" />
          <div className="h-6 w-1/2 rounded bg-[#1F2A44]" />
          <div className="aspect-[16/9] w-full rounded-2xl bg-[#1F2A44]" />
        </div>
      </section>
    );
  }

  if (notFound || !project) {
    return (
      <section className="w-full bg-[#0B1320] text-[#F2EFE8] min-h-[68vh] flex items-center">
        <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-20">
          <p className="font-mono-tech text-xs tracking-[0.14em] text-[#D68C76]">
            Selected Work · Not Found
          </p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Project not found
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#C7B8A6] leading-relaxed">
            This project may be unpublished or moved. Return to the main exhibition to browse
            published software projects.
          </p>
          <button
            type="button"
            onClick={onBackToWork}
            className="mt-8 inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-[#F2EFE8] text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Selected Work</span>
          </button>
        </div>
      </section>
    );
  }

  const safeGithub = isSafeHttpUrl(project.githubUrl) ? project.githubUrl : null;
  const safeLive = isSafeHttpUrl(project.liveUrl) ? project.liveUrl : null;

  const caseStudySections = [
    {
      key: 'overview',
      title: 'Project Overview',
      content: project.description,
    },
    ...(project.problemStatement
      ? [
          {
            key: 'problem',
            title: 'Problem Being Addressed',
            content: project.problemStatement,
          },
        ]
      : []),
    ...(project.myContribution
      ? [
          {
            key: 'contribution',
            title: 'My Contribution',
            content: project.myContribution,
          },
        ]
      : []),
  ];

  return (
    <article aria-labelledby="project-detail-title" className="w-full">
      {/* Midnight Ink Exhibition Header */}
      <header className="w-full bg-[#0B1320] dark:bg-[#070C16] text-[#F2EFE8] border-b border-[#1F2A44] dark:border-[#1D2A44]">
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-16 sm:pb-20">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[#1F2A44]"
          >
            <button
              type="button"
              onClick={onBackToWork}
              className="group inline-flex items-center gap-2 min-h-[42px] px-3.5 py-2 rounded-lg bg-[#1F2A44] hover:bg-[#293757] border border-[#C7B8A6]/30 hover:border-[#D68C76]/70 text-xs sm:text-sm font-medium text-[#F2EFE8] transition-all cursor-pointer"
            >
              <ArrowLeft
                className="w-4 h-4 text-[#D68C76] transition-transform duration-150 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span>Back to Selected Work</span>
            </button>

            <ol className="flex flex-wrap items-center gap-2 font-mono-tech text-xs text-[#C7B8A6]">
              <li>
                <a
                  href="/work"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    onBackToWork();
                  }}
                  className="hover:text-[#D68C76] transition-colors"
                >
                  Selected Work
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#F2EFE8] truncate max-w-[220px] sm:max-w-xs">{project.title}</li>
            </ol>
          </nav>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-tech text-xs text-[#C7B8A6]">
                <span className="text-[#D68C76]">
                  {project.featured ? 'Featured Software Project' : 'Software Project'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#DED8CE]">{project.projectStatus}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatDisplayDate(project.updatedAt)}</span>
              </div>

              <h1
                id="project-detail-title"
                className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-[#F2EFE8] [text-wrap:balance]"
              >
                {project.title}
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[#DED8CE] leading-relaxed max-w-2xl">
                {project.description}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
              {safeGithub && (
                <a
                  href={safeGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1F2A44] hover:bg-[#293757] border border-[#C7B8A6]/35 hover:border-[#D68C76]/75 text-sm font-medium text-[#F2EFE8] transition-all whitespace-nowrap shrink-0"
                >
                  <FolderGit2 className="w-4 h-4 text-[#D68C76]" aria-hidden="true" />
                  <span>GitHub Repository</span>
                  <ArrowUpRight
                    className="w-4 h-4 text-[#C7B8A6] group-hover:text-[#D68C76] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              )}

              {safeLive && (
                <a
                  href={safeLive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-[#F2EFE8] text-sm font-semibold transition-all whitespace-nowrap shrink-0"
                >
                  <span>Open Live Demo</span>
                  <ArrowUpRight
                    className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              )}
            </div>
          </div>

          {project.imageUrl && !failedImages['cover'] && (
            <div ref={mediaRef} className="mt-10 sm:mt-12">
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                aria-label={`Inspect ${project.title} preview image`}
                className="group relative block w-full rounded-2xl bg-[#1F2A44] border border-[#C7B8A6]/30 hover:border-[#D68C76]/75 overflow-hidden cursor-pointer text-left transition-colors"
              >
                <div
                  className="media-mask aspect-[16/9] max-h-[540px] w-full"
                  data-revealed={mediaInView ? 'true' : 'false'}
                >
                  <img
                    src={project.imageUrl}
                    alt={`${project.title} showcase screenshot`}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages((prev) => ({ ...prev, cover: true }))}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1320]/90 border border-[#C7B8A6]/35 text-xs font-medium text-[#F2EFE8] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150">
                  <Maximize2 className="w-3.5 h-3.5 text-[#D68C76]" aria-hidden="true" />
                  <span>Expand Screenshot</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tactile Linen Case Study Breakdown */}
      <section className="w-full bg-[#F2EFE8] dark:bg-[#0B1320] text-[#0B1320] dark:text-[#F2EFE8] transition-colors duration-200">
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Sticky Left Rail: Slate Indigo Technical Specifications */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <Reveal>
                <div className="rounded-2xl bg-[#0B1320] dark:bg-[#111B30] text-[#F2EFE8] border border-[#1F2A44] dark:border-[#29395A] p-6 sm:p-7 shadow-[0_22px_44px_-24px_rgba(11,19,32,0.52)]">
                  <div className="flex items-center justify-between pb-4 border-b border-[#1F2A44]">
                    <span className="font-mono-tech text-xs text-[#D68C76]">
                      Technical Specifications
                    </span>
                    <Layers className="w-4 h-4 text-[#D68C76]" aria-hidden="true" />
                  </div>

                  <dl className="mt-2 divide-y divide-[#1F2A44] text-sm">
                    <div className="py-3 flex items-baseline justify-between gap-4">
                      <dt className="text-[#C7B8A6]">Status</dt>
                      <dd className="font-medium text-[#F2EFE8]">{project.projectStatus}</dd>
                    </div>
                    <div className="py-3 flex items-baseline justify-between gap-4">
                      <dt className="text-[#C7B8A6]">Developer</dt>
                      <dd className="font-medium text-[#F2EFE8]">BAMBE Aine Chris</dd>
                    </div>
                    <div className="py-3 flex items-baseline justify-between gap-4">
                      <dt className="text-[#C7B8A6]">Last Updated</dt>
                      <dd className="font-mono-tech text-xs tabular-nums text-[#D68C76]">
                        {formatDisplayDate(project.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 pt-5 border-t border-[#1F2A44]">
                    <h2 className="font-mono-tech text-xs text-[#C7B8A6]">Technologies Used</h2>
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {project.technologies.map((tech) => {
                        const logoId = matchTechLogo(tech);
                        return (
                          <li
                            key={tech}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1F2A44] border border-[#C7B8A6]/20 text-sm text-[#F2EFE8]"
                          >
                            {logoId ? (
                              <TechLogo id={logoId} className="w-4 h-4 shrink-0" />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="w-1.5 h-1.5 rounded-full bg-[#D68C76] shrink-0"
                              />
                            )}
                            <span className="truncate">{tech}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {(safeGithub || safeLive) && (
                    <div className="mt-6 pt-5 border-t border-[#1F2A44] flex flex-col gap-2.5">
                      {safeGithub && (
                        <a
                          href={safeGithub}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-between min-h-[42px] px-3.5 py-2 rounded-lg bg-[#1F2A44] hover:bg-[#293757] border border-[#C7B8A6]/30 hover:border-[#D68C76]/65 text-xs sm:text-sm font-medium text-[#F2EFE8] transition-colors"
                        >
                          <span>Inspect Source on GitHub</span>
                          <ArrowUpRight className="w-4 h-4 text-[#D68C76]" aria-hidden="true" />
                        </a>
                      )}
                      {safeLive && (
                        <a
                          href={safeLive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-between min-h-[42px] px-3.5 py-2 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-xs sm:text-sm font-semibold text-[#F2EFE8] transition-colors"
                        >
                          <span>Launch Live Demo</span>
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Reveal>
            </aside>

            {/* Right Editorial Narrative */}
            <div className="lg:col-span-8 space-y-10">
              {caseStudySections.map((sec, idx) => (
                <Reveal key={sec.key} delayMs={Math.min(idx * 75, 200)}>
                  <section className="rounded-2xl bg-[#FAF8F4] dark:bg-[#131D33] border border-[#C7B8A6]/75 dark:border-[#2A3958] p-6 sm:p-8 transition-colors duration-200">
                    <p className="font-mono-tech text-xs text-[#9A4F3A] dark:text-[#D68C76] font-semibold tabular-nums">
                      0{idx + 1}.
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0B1320] dark:text-[#F2EFE8]">
                      {sec.title}
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-[#1F2A44] dark:text-[#DED8CE] leading-[1.8] whitespace-pre-line">
                      {sec.content}
                    </p>
                  </section>
                </Reveal>
              ))}

              {project.keyFeatures.length > 0 && (
                <Reveal delayMs={150}>
                  <section className="rounded-2xl bg-[#FAF8F4] dark:bg-[#131D33] border border-[#C7B8A6]/75 dark:border-[#2A3958] p-6 sm:p-8 transition-colors duration-200">
                    <p className="font-mono-tech text-xs text-[#9A4F3A] dark:text-[#D68C76] font-semibold tabular-nums">
                      0{caseStudySections.length + 1}.
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0B1320] dark:text-[#F2EFE8]">
                      Important Features
                    </h2>
                    <ol className="mt-5 divide-y divide-[#C7B8A6]/45 dark:divide-[#273552]">
                      {project.keyFeatures.map((feat, idx) => (
                        <li key={`${idx}-${feat}`} className="py-3.5 flex items-baseline gap-4">
                          <span className="font-mono-tech text-xs font-semibold text-[#9A4F3A] dark:text-[#D68C76] tabular-nums shrink-0">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span className="text-sm sm:text-base text-[#0B1320] dark:text-[#F2EFE8] leading-relaxed">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                </Reveal>
              )}

              {project.developmentProcess && (
                <Reveal delayMs={150}>
                  <section className="rounded-2xl bg-[#1F2A44] dark:bg-[#16223A] text-[#F2EFE8] border border-[#C7B8A6]/25 dark:border-[#2F4063] p-6 sm:p-8">
                    <p className="font-mono-tech text-xs text-[#D68C76] font-medium tabular-nums">
                      0{caseStudySections.length + (project.keyFeatures.length > 0 ? 2 : 1)}.
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#F2EFE8]">
                      Development Process
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-[#DED8CE] leading-[1.8] whitespace-pre-line">
                      {project.developmentProcess}
                    </p>
                  </section>
                </Reveal>
              )}

              {project.screenshots.length > 0 && (
                <Reveal delayMs={150}>
                  <section className="space-y-5">
                    <div>
                      <p className="font-mono-tech text-xs text-[#9A4F3A] dark:text-[#D68C76] font-semibold">
                        Project Screenshots
                      </p>
                      <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#0B1320] dark:text-[#F2EFE8]">
                        Additional interface &amp; workflow captures
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {project.screenshots.map((shot, idx) => {
                        if (failedImages[shot.id]) return null;
                        const lbIndex = allScreenshots.findIndex((s) => s.id === shot.id);
                        return (
                          <button
                            key={shot.id}
                            type="button"
                            onClick={() => setLightboxIndex(lbIndex >= 0 ? lbIndex : 0)}
                            aria-label={`Open screenshot ${idx + 1} of ${project.title}`}
                            className={`group relative rounded-2xl bg-[#FAF8F4] dark:bg-[#131D33] border border-[#C7B8A6]/75 dark:border-[#2A3958] hover:border-[#B46A55] dark:hover:border-[#D68C76] overflow-hidden cursor-pointer text-left transition-all duration-200 hover:-translate-y-1 ${
                              idx === 0 && project.screenshots.length === 3 ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <div
                              className={
                                idx === 0 && project.screenshots.length === 3
                                  ? 'aspect-[16/9] w-full overflow-hidden'
                                  : 'aspect-[4/3] w-full overflow-hidden'
                              }
                            >
                              <img
                                src={shot.imageUrl}
                                alt={`${project.title} screenshot ${idx + 1}`}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setFailedImages((prev) => ({ ...prev, [shot.id]: true }))
                                }
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                            </div>
                            <span className="px-4 py-2.5 border-t border-[#C7B8A6]/55 dark:border-[#273552] flex items-center justify-between text-xs text-[#4A5264] dark:text-[#C7B8A6]">
                              <span className="font-mono-tech tabular-nums">
                                Capture {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium text-[#9A4F3A] dark:text-[#D68C76]">
                                <span>Zoom</span>
                                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </Reveal>
              )}
            </div>
          </div>

          {/* Next Project / Back to Selected Work Strip */}
          <div className="mt-16 pt-10 border-t border-[#C7B8A6]/60 dark:border-[#233252] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <button
              type="button"
              onClick={onBackToWork}
              className="group inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#FAF8F4] dark:bg-[#131D33] hover:bg-[#0B1320] dark:hover:bg-[#B46A55] hover:text-[#F2EFE8] border border-[#C7B8A6] dark:border-[#2E3F61] text-sm font-medium text-[#0B1320] dark:text-[#F2EFE8] transition-all cursor-pointer self-start"
            >
              <ArrowLeft
                className="w-4 h-4 text-[#B46A55] dark:text-[#D68C76] group-hover:text-[#F2EFE8] transition-transform duration-150 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span>All Selected Work</span>
            </button>

            {nextProject && nextProject.id !== project.id && (
              <a
                href={`/work/${encodeURIComponent(nextProject.slug)}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  onSelectProject(nextProject.slug);
                }}
                className="group inline-flex items-center gap-3 min-h-[44px] px-5 py-3 rounded-xl bg-[#0B1320] dark:bg-[#16223A] hover:bg-[#B46A55] dark:hover:bg-[#B46A55] border border-transparent dark:border-[#2F4063] text-[#F2EFE8] transition-colors self-start sm:self-auto"
              >
                <div className="text-left">
                  <span className="block font-mono-tech text-[11px] text-[#D68C76] group-hover:text-[#F2EFE8]/85">
                    Next Project
                  </span>
                  <span className="block font-display text-sm sm:text-base font-semibold">
                    {nextProject.title}
                  </span>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-[#D68C76] group-hover:text-[#F2EFE8] transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Accessible Fullscreen Screenshot Lightbox */}
      {lightboxIndex !== null && allScreenshots[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project screenshot viewer"
          className="fixed inset-0 z-50 bg-[#070C16]/92 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl bg-[#0B1320] border border-[#C7B8A6]/35 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[#1F2A44]">
              <p className="text-xs sm:text-sm font-medium text-[#F2EFE8] truncate">
                {allScreenshots[lightboxIndex].label}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {allScreenshots.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex - 1 + allScreenshots.length) % allScreenshots.length,
                        )
                      }
                      aria-label="Previous screenshot"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#1F2A44] hover:bg-[#293757] text-[#F2EFE8] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((lightboxIndex + 1) % allScreenshots.length)
                      }
                      aria-label="Next screenshot"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#1F2A44] hover:bg-[#293757] text-[#F2EFE8] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Close screenshot viewer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#C7B8A6] hover:text-[#F2EFE8] hover:bg-[#1F2A44] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-[#070C16] max-h-[78vh] flex items-center justify-center p-4 sm:p-6">
              <img
                src={allScreenshots[lightboxIndex].url}
                alt={allScreenshots[lightboxIndex].label}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
