import React, { useRef } from 'react';
import { ArrowDown, Code2, ExternalLink, FolderGit2 } from 'lucide-react';
import type { Project } from '../types/portfolio.ts';
import { SamsPreview } from '../components/SamsPreview.tsx';
import { AnimatedHeading } from '../components/AnimatedText.tsx';

interface ProjectsPageProps {
  projects: Project[];
  embedded?: boolean;
}

interface PreviewRow {
  label: string;
  meta: string;
  status: string;
  tone: string;
}

interface CardPreviewConfig {
  heading: string;
  rows: PreviewRow[];
}

function getPreviewForProject(proj: Project, index: number): CardPreviewConfig {
  const lower = proj.name.toLowerCase();
  if (lower.includes('sams') || index === 0) {
    return {
      heading: 'Gate check-in status preview',
      rows: [
        { label: 'Arrival Check-In', meta: '07:12', status: 'EARLY', tone: 'text-[#5df0a8]' },
        { label: 'Arrival Check-In', meta: '07:48', status: 'ON TIME', tone: 'text-[#7dd3fc]' },
        { label: 'Arrival Check-In', meta: '08:19', status: 'LATE', tone: 'text-[#fbbf24]' },
      ],
    };
  }
  if (lower.includes('portfolio') || lower.includes('api') || index === 1) {
    return {
      heading: 'REST endpoint monitor preview',
      rows: [
        { label: 'GET /api/projects', meta: 'SQLite', status: '200 OK', tone: 'text-[#5df0a8]' },
        { label: 'POST /api/messages', meta: 'Inbox', status: '201 SAVED', tone: 'text-[#7dd3fc]' },
        { label: 'GET /api/profile', meta: 'JSON', status: '200 OK', tone: 'text-[#5df0a8]' },
      ],
    };
  }
  return {
    heading: 'Backend query pipeline preview',
    rows: [
      { label: 'Validate Payload', meta: 'Express', status: 'PASS', tone: 'text-[#5df0a8]' },
      { label: 'Join Student Table', meta: 'MySQL', status: 'READY', tone: 'text-[#7dd3fc]' },
      { label: 'Return JSON State', meta: 'HTTP', status: 'SENT', tone: 'text-[#5df0a8]' },
    ],
  };
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, embedded = false }) => {
  const samsExplorerRef = useRef<HTMLDivElement>(null);

  const primaryCards = projects.slice(0, 3);
  const extraProjects = projects.slice(3);
  const samsProject = projects.find((p) => p.name.toLowerCase() === 'sams') || primaryCards[0];

  const scrollToExplorer = () => {
    samsExplorerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const Container = embedded ? 'section' : 'div';

  return (
    <Container
      id={embedded ? 'home-projects' : undefined}
      data-chapter={embedded ? 'projects' : undefined}
      className={`max-w-[1360px] mx-auto px-5 sm:px-8 ${
        embedded ? 'py-20 sm:py-28' : 'py-16 sm:py-24'
      } space-y-16`}
    >
      <header className="space-y-4 max-w-3xl chapter-parallax-header" data-reveal="">
        <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-[#5df0a8]">
          {embedded ? '03 · ' : ''}Engineering Work
        </p>
        <AnimatedHeading
          as={embedded ? 'h2' : 'h1'}
          trigger={embedded ? 'reveal' : 'mount'}
          text="Featured"
          accentText="Projects."
          className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#f3f6ff]"
        />
        <p className="text-lg text-[#9aa6c4] leading-relaxed">
          Three core backend and web engineering cards—led by SAMS—paired with animated system
          previews and an interactive SAMS module explorer below.
        </p>
      </header>

      <div
        data-reveal="line"
        className="h-px bg-gradient-to-r from-[#5df0a8]/45 via-[rgba(150,175,230,0.2)] to-transparent"
      />

      {/* 3-Card Animated Project Grid */}
      <section aria-label="Featured projects" className="pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {primaryCards.map((proj, idx) => {
            const isSams = proj.name.toLowerCase().includes('sams');
            const accentText = idx === 1 ? 'text-[#7dd3fc]' : 'text-[#5df0a8]';
            const preview = getPreviewForProject(proj, idx);

            return (
              <article
                key={proj.id}
                data-reveal="scale"
                style={{ '--rd': `${idx * 100}ms` } as React.CSSProperties}
                className="portfolio-card portfolio-card-interactive p-6 sm:p-7 flex flex-col justify-between gap-6"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono-tech uppercase tracking-[0.14em] text-[#6b7796]">
                      <span className={`${accentText} font-medium`}>{proj.projectNumber}</span>
                      <span aria-hidden="true">/</span>
                      <span>{proj.category}</span>
                    </div>
                    <span className="text-xs font-mono-tech text-[#6b7796]">In development</span>
                  </div>

                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[#f3f6ff] tracking-tight">
                      {proj.name}
                    </h2>
                    <p className="text-sm text-[#9aa6c4] mt-1">{proj.fullName}</p>
                  </div>

                  {/* Animated Illustrative Preview Box */}
                  {proj.imageUrl ? (
                    <div className="aspect-video rounded-xl bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.14)] overflow-hidden">
                      <img
                        src={proj.imageUrl}
                        alt={proj.fullName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.14)] p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#6b7796]">
                        <span>{preview.heading}</span>
                        <span>Illustrative</span>
                      </div>
                      <div className="space-y-1.5">
                        {preview.rows.map((row, rowIdx) => (
                          <div
                            key={`${proj.id}-${row.label}-${rowIdx}`}
                            className="preview-row-animated py-2 flex items-center justify-between gap-2 text-xs font-mono-tech tabular-nums"
                            style={{ animationDelay: `${(rowIdx * 1.5 + idx * 0.4).toFixed(1)}s` }}
                          >
                            <span className="text-[#9aa6c4] truncate">{row.label}</span>
                            <span className="text-[#6b7796] shrink-0">{row.meta}</span>
                            <span className={`font-semibold shrink-0 ${row.tone}`}>
                              {row.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-[#9aa6c4] leading-relaxed">{proj.description}</p>
                </div>

                <div className="space-y-4 pt-5 border-t border-[rgba(150,175,230,0.12)]">
                  <div className="flex items-center gap-2 text-xs font-mono-tech text-[#6b7796]">
                    <Code2 className={`w-4 h-4 ${accentText} shrink-0`} aria-hidden="true" />
                    <span>{proj.technologies.join(' · ')}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {isSams && (
                      <button
                        type="button"
                        onClick={scrollToExplorer}
                        className="ascend-btn-primary !py-2 !px-4 !text-xs"
                      >
                        <span>Inspect Modules</span>
                        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}

                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ascend-btn-outline !py-2 !px-4 !text-xs"
                      >
                        <span>{isSams ? 'Open SAMS GitHub' : 'View on GitHub'}</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Interactive SAMS Architecture Deep Dive */}
      {samsProject && (
        <section
          ref={samsExplorerRef}
          className="space-y-8 border-t border-[rgba(150,175,230,0.12)] pt-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4" data-reveal="">
            <div>
              <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-[#5df0a8] mb-2">
                Interactive System Walkthrough
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#f3f6ff]">
                SAMS Architecture Explorer
              </h2>
              <p className="text-base text-[#9aa6c4] mt-1">{samsProject.fullName}</p>
            </div>

            {samsProject.repoUrl && (
              <a
                href={samsProject.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ascend-btn-primary self-start md:self-end"
              >
                <span>Open GitHub Repository</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7" data-reveal="left">
              <SamsPreview />
            </div>

            <div
              className="lg:col-span-5 ascend-panel p-6 sm:p-8 flex flex-col justify-between space-y-6"
              data-reveal="right"
              style={{ '--rd': '120ms' } as React.CSSProperties}
            >
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-xs font-mono-tech text-[#6b7796]">
                  <Code2 className="w-4 h-4 text-[#5df0a8]" aria-hidden="true" />
                  <span>{samsProject.technologies.join(' · ')}</span>
                </div>

                <p className="text-base text-[#9aa6c4] leading-relaxed">
                  {samsProject.description}
                </p>

                {samsProject.features.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h3 className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#6b7796]">
                      Included Workspaces & Features
                    </h3>
                    <ul className="space-y-2 text-sm text-[#9aa6c4]">
                      {samsProject.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#5df0a8] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {samsProject.repoUrl && (
                <a
                  href={samsProject.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[rgba(4,6,15,0.55)] hover:bg-[rgba(16,24,48,0.75)] border border-[rgba(150,175,230,0.16)] text-sm text-[#f3f6ff] transition-colors"
                >
                  <span className="truncate font-mono-tech text-xs text-[#9aa6c4]">
                    {samsProject.repoUrl}
                  </span>
                  <ExternalLink className="w-4 h-4 shrink-0 ml-2 text-[#5df0a8]" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Expandable Additional Projects from Database */}
      {extraProjects.length > 0 && (
        <section className="space-y-8 border-t border-[rgba(150,175,230,0.12)] pt-12">
          <h2 className="font-display text-2xl font-semibold text-[#f3f6ff]" data-reveal="">
            More Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {extraProjects.map((proj, idx) => (
              <article
                key={proj.id}
                data-reveal=""
                style={{ '--rd': `${idx * 90}ms` } as React.CSSProperties}
                className="portfolio-card portfolio-card-interactive overflow-hidden flex flex-col justify-between"
              >
                {proj.imageUrl && (
                  <div className="aspect-video bg-[rgba(4,6,15,0.55)] overflow-hidden">
                    <img
                      src={proj.imageUrl}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono-tech text-[#6b7796]">
                      <span className="text-[#5df0a8] font-medium">{proj.projectNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.category}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#f3f6ff]">{proj.name}</h3>
                    {proj.fullName !== proj.name && (
                      <p className="text-sm text-[#6b7796]">{proj.fullName}</p>
                    )}
                    <p className="text-sm text-[#9aa6c4] leading-relaxed">{proj.description}</p>
                    {proj.technologies.length > 0 && (
                      <p className="text-xs font-mono-tech text-[#6b7796]">
                        {proj.technologies.join(' · ')}
                      </p>
                    )}
                  </div>

                  {proj.repoUrl && (
                    <a
                      href={proj.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#5df0a8] hover:text-[#f3f6ff] transition-colors pt-2 rounded"
                    >
                      <FolderGit2 className="w-4 h-4" aria-hidden="true" />
                      <span>View Repository</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
};
