import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { RoutePath } from '../types/portfolio.ts';
import { TechLogo, type TechKey } from '../components/TechLogos.tsx';

import { AnimatedHeading } from '../components/AnimatedText.tsx';

interface SkillsPageProps {
  onNavigate: (path: RoutePath) => void;
  embedded?: boolean;
}

interface SkillCardItem {
  name: string;
  techKey: TechKey;
  context: string;
}

const BACKEND_AND_DATA: SkillCardItem[] = [
  {
    name: 'Node.js',
    techKey: 'nodejs',
    context: 'Server-side JavaScript runtime, structured modules, and backend application logic.',
  },
  {
    name: 'Express.js',
    techKey: 'expressjs',
    context: 'REST API routing, request validation, middleware structure, and session handling.',
  },
  {
    name: 'MySQL',
    techKey: 'mysql',
    context: 'Relational database design, structured tables, primary/foreign keys, and SQL queries.',
  },
  {
    name: 'Backend Development',
    techKey: 'backend',
    context: 'Primary career focus—connecting HTTP endpoints, business logic, and persistent data.',
  },
];

const FRONTEND_AND_UI: SkillCardItem[] = [
  {
    name: 'HTML5',
    techKey: 'html5',
    context: 'Semantic document landmarks, accessible forms, and clean multi-page structure.',
  },
  {
    name: 'CSS3',
    techKey: 'css3',
    context: 'Responsive Flexbox and Grid layouts, comfortable typography, and clear visual hierarchy.',
  },
  {
    name: 'JavaScript',
    techKey: 'javascript',
    context: 'Client-side interaction, asynchronous fetch workflows, validation, and application logic.',
  },
  {
    name: 'Figma',
    techKey: 'figma',
    context: 'Interface wireframing, layout spacing planning, and component consistency before coding.',
  },
];

const WORKFLOW_AND_ACADEMIC: SkillCardItem[] = [
  {
    name: 'Git',
    techKey: 'git',
    context: 'Tracking changes cleanly with commits, branches, and reproducible project history.',
  },
  {
    name: 'GitHub',
    techKey: 'github',
    context: 'Hosting repositories, sharing open project codebases, and collaborating cleanly.',
  },
  {
    name: 'Python',
    techKey: 'python',
    context: 'Server-side application scripting and structured backend logic used in SAMS.',
  },
  {
    name: 'Flask',
    techKey: 'flask',
    context: 'Lightweight Python web routing and template workflows powering SAMS workspaces.',
  },
  {
    name: 'SQLite',
    techKey: 'sqlite',
    context: 'Embedded relational database storage for fast local prototypes and academic systems.',
  },
];

const SkillGroup: React.FC<{
  title: string;
  subtitle: string;
  countLabel: string;
  items: SkillCardItem[];
}> = ({ title, subtitle, countLabel, items }) => (
  <section className="space-y-6 pt-10">
    <div
      data-reveal="line"
      className="h-px bg-gradient-to-r from-[rgba(150,175,230,0.22)] via-[rgba(93,240,168,0.25)] to-transparent mb-8"
    />
    <div
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-2"
      data-reveal="left"
    >
      <div>
        <h3 className="font-display text-2xl font-semibold text-[#f3f6ff]">{title}</h3>
        <p className="text-sm text-[#9aa6c4] mt-1">{subtitle}</p>
      </div>
      <span className="text-xs font-mono-tech text-[#6b7796]">{countLabel}</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((skill, idx) => (
        <div
          key={skill.name}
          data-reveal="scale"
          style={{ '--rd': `${idx * 85}ms` } as React.CSSProperties}
          className="portfolio-card portfolio-card-interactive p-6 flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-[#f3f6ff]">{skill.name}</h4>
            <div className="ascend-icon-box">
              <TechLogo tech={skill.techKey} className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-[#9aa6c4] leading-relaxed">{skill.context}</p>
        </div>
      ))}
    </div>
  </section>
);

export const SkillsPage: React.FC<SkillsPageProps> = ({ onNavigate, embedded = false }) => {
  const Container = embedded ? 'section' : 'div';

  return (
    <Container
      id={embedded ? 'home-skills' : undefined}
      data-chapter={embedded ? 'skills' : undefined}
      className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${
        embedded ? 'py-20 sm:py-28' : 'py-16 sm:py-24'
      } space-y-14`}
    >
      <header className="space-y-4 max-w-3xl chapter-parallax-header" data-reveal="">
        <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-[#5df0a8]">
          {embedded ? '02 · ' : ''}Skills & Technologies
        </p>
        <AnimatedHeading
          as={embedded ? 'h2' : 'h1'}
          trigger={embedded ? 'reveal' : 'mount'}
          text="Engineering"
          accentText="toolkit."
          className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#f3f6ff]"
        />
        <p className="text-lg text-[#9aa6c4] leading-relaxed">
          The core web, backend, database, and version-control technologies I work with across
          Intango TSS coursework and real-world personal projects.
        </p>
      </header>

      <SkillGroup
        title="Backend & Databases"
        subtitle="Core technologies supporting my direction toward backend software engineering."
        countLabel="04 focus areas"
        items={BACKEND_AND_DATA}
      />

      <SkillGroup
        title="Frontend & UI Foundations"
        subtitle="Building clean, accessible interfaces that connect smoothly to backend services."
        countLabel="04 technologies"
        items={FRONTEND_AND_UI}
      />

      <SkillGroup
        title="Version Control & Project Stack"
        subtitle="Tools used for repository management and applied academic systems such as SAMS."
        countLabel="05 tools"
        items={WORKFLOW_AND_ACADEMIC}
      />

      {!embedded && (
        <div className="pt-4" data-reveal="">
          <button
            type="button"
            onClick={() => onNavigate('/projects')}
            className="ascend-btn-primary"
          >
            <span>See projects in action</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </Container>
  );
};
