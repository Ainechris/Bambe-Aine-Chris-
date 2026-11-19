import React from 'react';
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Film,
  MapPin,
  Server,
} from 'lucide-react';
import type { Profile, RoutePath } from '../types/portfolio.ts';

import { AnimatedHeading, TypingRoleTicker } from '../components/AnimatedText.tsx';

interface AboutPageProps {
  profile: Profile;
  onNavigate: (path: RoutePath) => void;
  embedded?: boolean;
}

const PROFESSIONAL_INTERESTS = [
  'Backend development & API architecture',
  'Software engineering fundamentals',
  'Building useful everyday technology',
  'Accessibility-focused desktop & web applications',
  'Learning by building real-world software projects',
];

const ROLE_PHRASES = [
  'Aspiring Backend Developer',
  'Student at Intango TSS · L4 SOD',
  'Building SAMS & Express APIs',
  'Relational Data & MySQL Explorer',
];

export const AboutPage: React.FC<AboutPageProps> = ({
  profile,
  onNavigate,
  embedded = false,
}) => {
  const Container = embedded ? 'section' : 'div';

  return (
    <Container
      id={embedded ? 'home-about' : undefined}
      aria-labelledby={embedded ? 'home-about-heading' : undefined}
      data-chapter={embedded ? 'about' : undefined}
      className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${
        embedded ? 'py-20 sm:py-28' : 'py-16 sm:py-24'
      } space-y-14`}
    >
      <header className="space-y-4 max-w-3xl chapter-parallax-header" data-reveal="">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tech uppercase tracking-[0.2em]">
          <span className="text-[#5df0a8]">
            {embedded ? '01 · ' : ''}About · {profile.fullName}
          </span>
          <span className="text-[#6b7796]" aria-hidden="true">
            /
          </span>
          <TypingRoleTicker phrases={ROLE_PHRASES} className="text-[#7dd3fc]" />
        </div>
        <AnimatedHeading
          as={embedded ? 'h2' : 'h1'}
          trigger={embedded ? 'reveal' : 'mount'}
          text="Learning by building"
          accentText="real software."
          className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#f3f6ff]"
        />
        <p
          id={embedded ? 'home-about-heading' : undefined}
          className="text-lg text-[#9aa6c4] leading-relaxed"
        >
          {profile.introShort}
        </p>
      </header>

      <div
        data-reveal="line"
        className="h-px bg-gradient-to-r from-[#5df0a8]/45 via-[rgba(150,175,230,0.2)] to-transparent"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-2">
        <div
          className="lg:col-span-7 space-y-6 text-base text-[#9aa6c4] leading-relaxed"
          data-reveal="left"
        >
          <p>{profile.introLong}</p>
          <p>
            At <strong className="text-[#f3f6ff] font-medium">Intango TSS</strong> (Software
            Development, Level L4 SOD) in Busanza, Nyarutarama, Rwanda, I focus on turning what I
            learn into working software—moving from relational database schemas and server endpoints
            to clean, comfortable user interfaces.
          </p>
          <p>
            My career direction is{' '}
            <strong className="text-[#f3f6ff] font-medium">backend development</strong>. I am
            actively practicing Node.js, Express.js, MySQL, Git, and GitHub while strengthening
            my problem-solving skills through practical work like{' '}
            <strong className="text-[#f3f6ff] font-medium">SAMS</strong> (School Attendance
            Management System) and Express/MySQL backend practice.
          </p>

          <div
            className="portfolio-card p-6 sm:p-7 space-y-4 mt-4"
            data-reveal="scale"
            style={{ '--rd': '120ms' } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="ascend-icon-box">
                <Accessibility className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <span className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#5df0a8]">
                  Focus Areas
                </span>
                <h3 className="text-base font-semibold text-[#f3f6ff]">Professional Interests</h3>
              </div>
            </div>
            <ul className="space-y-2.5 text-sm text-[#9aa6c4]">
              {PROFESSIONAL_INTERESTS.map((interest) => (
                <li key={interest} className="flex items-start gap-2.5">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#5df0a8] shrink-0" />
                  <span>{interest}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:col-span-5 space-y-5">
          <div
            className="portfolio-card portfolio-card-interactive p-6 space-y-4"
            data-reveal="right"
            style={{ '--rd': '80ms' } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="ascend-icon-box">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#5df0a8]">
                  Education
                </p>
                <h3 className="text-lg font-semibold text-[#f3f6ff]">Intango TSS</h3>
              </div>
            </div>

            <dl className="space-y-2.5 text-sm border-t border-[rgba(150,175,230,0.12)] pt-4">
              <div className="flex justify-between gap-4">
                <dt className="text-[#6b7796]">Program</dt>
                <dd className="text-[#f3f6ff] font-medium text-right">Software Development</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6b7796]">Level</dt>
                <dd className="text-[#f3f6ff] font-medium text-right">L4 SOD</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6b7796] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#5df0a8]" aria-hidden="true" />
                  Location
                </dt>
                <dd className="text-[#f3f6ff] text-right">Busanza, Nyarutarama, Rwanda</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6b7796] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#7dd3fc]" aria-hidden="true" />
                  Ownership
                </dt>
                <dd className="text-[#f3f6ff] text-right">CLA</dd>
              </div>
            </dl>
          </div>

          <div
            className="portfolio-card portfolio-card-interactive p-6 space-y-3"
            data-reveal="right"
            style={{ '--rd': '160ms' } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="ascend-icon-box">
                <Server className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#5df0a8]">
                  Career Direction
                </p>
                <p className="text-base font-semibold text-[#f3f6ff]">
                  Aspiring Backend Developer
                </p>
              </div>
            </div>
            <p className="text-sm text-[#9aa6c4] leading-relaxed">
              Node.js · Express.js · MySQL · Git · GitHub · Python · Flask · SQLite
            </p>
          </div>

          <div
            className="portfolio-card portfolio-card-interactive p-6 space-y-3"
            data-reveal="right"
            style={{ '--rd': '240ms' } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="ascend-icon-box">
                <Film className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#6b7796]">
                  Creative Channel
                </p>
                <p className="text-base font-semibold text-[#f3f6ff]">
                  Roblox-style stories on YouTube
                </p>
              </div>
            </div>
            <p className="text-sm text-[#9aa6c4] leading-relaxed">
              Writing, pacing, and publishing animated school stories on @VazukoYT.
            </p>
          </div>
        </aside>
      </div>

      {!embedded && (
        <div
          className="ascend-cta-card p-8 sm:p-10 flex flex-wrap items-center justify-between gap-6"
          data-reveal="scale"
        >
          <div className="space-y-1.5 max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-[#f3f6ff]">
              Explore projects & contact
            </h2>
            <p className="text-sm sm:text-base text-[#9aa6c4]">
              Inspect SAMS and backend engineering cards, check repositories on GitHub, or reach out
              directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ascend-btn-primary"
            >
              <span>GitHub Profile</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a href={`mailto:${profile.email}`} className="ascend-btn-outline">
              <span>{profile.email}</span>
            </a>
            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#f3f6ff] hover:text-[#5df0a8] transition-colors cursor-pointer px-3 py-2"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </Container>
  );
};
