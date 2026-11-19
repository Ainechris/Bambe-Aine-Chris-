import React from 'react';
import { ExternalLink, Play, Youtube } from 'lucide-react';
import type { Profile, Video } from '../types/portfolio.ts';

import { AnimatedHeading } from '../components/AnimatedText.tsx';

interface YouTubePageProps {
  profile: Profile;
  videos: Video[];
  embedded?: boolean;
}

const SPECTRA_BARS = [
  { delay: '0s', height: '14px', color: 'bg-[#5df0a8]' },
  { delay: '0.18s', height: '18px', color: 'bg-[#7dd3fc]' },
  { delay: '0.36s', height: '12px', color: 'bg-[#a78bfa]' },
  { delay: '0.12s', height: '16px', color: 'bg-[#5df0a8]' },
];

export const YouTubePage: React.FC<YouTubePageProps> = ({
  profile,
  videos,
  embedded = false,
}) => {
  const Container = embedded ? 'section' : 'div';

  return (
    <Container
      id={embedded ? 'home-youtube' : undefined}
      data-chapter={embedded ? 'youtube' : undefined}
      className={`max-w-[1280px] mx-auto px-5 sm:px-8 ${
        embedded ? 'py-20 sm:py-28' : 'py-16 sm:py-24'
      } space-y-14`}
    >
      <header
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 chapter-parallax-header"
        data-reveal=""
      >
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-[#5df0a8]">
            {embedded ? '04 · ' : ''}CODE, CURIOSITY & CREATIVE STORIES
          </p>
          <AnimatedHeading
            as={embedded ? 'h2' : 'h1'}
            trigger={embedded ? 'reveal' : 'mount'}
            text="Stories in"
            accentText="motion."
            className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#f3f6ff]"
          />
          <p className="text-lg text-[#9aa6c4] leading-relaxed">
            Alongside software development, I create Roblox-style animated school stories on
            YouTube. Open any episode below to watch on @VazukoYT.
          </p>
        </div>

        <a
          href={profile.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ascend-btn-primary self-start lg:self-end shrink-0"
        >
          <Youtube className="w-4 h-4" aria-hidden="true" />
          <span>Visit @VazukoYT Channel</span>
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </header>

      <div
        data-reveal="line"
        className="h-px bg-gradient-to-r from-[#5df0a8]/45 via-[#7dd3fc]/35 to-transparent"
      />

      {/* Creative Story Video Grid with Slide Spectra Animation */}
      <section className="space-y-8 pt-2">
        <div className="flex items-center justify-between" data-reveal="left">
          <h3 className="font-display text-2xl font-semibold text-[#f3f6ff]">Featured Stories</h3>
          <span className="text-xs font-mono-tech text-[#6b7796]">
            {videos.length} {videos.length === 1 ? 'episode' : 'episodes'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {videos.map((video, idx) => (
            <article
              key={video.id}
              data-reveal="scale"
              style={{ '--rd': `${idx * 100}ms` } as React.CSSProperties}
              className="group portfolio-card portfolio-card-interactive youtube-spectra-card overflow-hidden flex flex-col justify-between"
            >
              {/* Spectral top beam */}
              <div className="spectra-beam-track" aria-hidden="true">
                <span
                  className="spectra-beam-runner"
                  style={{ animationDelay: `${(idx * 0.9).toFixed(1)}s` }}
                />
              </div>

              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-video bg-[rgba(4,6,15,0.65)] overflow-hidden"
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                />

                {/* Slide Spectra diagonal light sweep */}
                <span
                  aria-hidden="true"
                  className="spectra-sheen"
                  style={{ animationDelay: `${(idx * 1.4).toFixed(1)}s` }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#04060f]/90 via-[#04060f]/25 to-transparent flex items-end justify-between p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-end gap-[3px] h-4" aria-hidden="true">
                      {SPECTRA_BARS.map((bar, bIdx) => (
                        <span
                          key={bIdx}
                          className={`spectra-eq-bar w-[3px] rounded-full ${bar.color}`}
                          style={{
                            height: bar.height,
                            animationDelay: `${(parseFloat(bar.delay) + idx * 0.25).toFixed(2)}s`,
                          }}
                        />
                      ))}
                    </span>
                    <span className="text-[11px] font-mono-tech uppercase tracking-[0.12em] text-[#f3f6ff]">
                      {String(idx + 1).padStart(2, '0')} · {video.category}
                    </span>
                  </div>

                  <span className="w-9 h-9 rounded-full bg-[#5df0a8] group-hover:bg-[#7dd3fc] text-[#032018] flex items-center justify-center transition-colors shadow-[0_8px_20px_-4px_rgba(93,240,168,0.55)]">
                    <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
                  </span>
                </div>
              </a>

              <div className="p-6 flex-1 flex flex-col justify-between gap-5 relative">
                <h4 className="text-lg font-medium text-[#f3f6ff] leading-snug">
                  {video.title}
                </h4>

                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascend-btn-outline w-full !text-xs font-mono-tech uppercase tracking-[0.14em]"
                >
                  <span>WATCH VIDEO</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
};
