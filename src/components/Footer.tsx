import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Profile, RoutePath } from '../types/portfolio.ts';

interface FooterProps {
  profile: Profile;
  onNavigate: (path: RoutePath) => void;
}

export const Footer: React.FC<FooterProps> = ({ profile, onNavigate }) => {
  return (
    <footer className="bg-[rgba(4,6,15,0.68)] backdrop-blur-md border-t border-[rgba(150,175,230,0.12)]">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-14" data-reveal="">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[rgba(150,175,230,0.12)]">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-[#f3f6ff]">
              <span className="w-3.5 h-3.5 border border-[#9aa6c4] flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-[#5df0a8]" />
              </span>
              <span>{profile.brandName}</span>
            </div>
            <p className="text-sm text-[#9aa6c4] max-w-md leading-relaxed">
              Student Software Developer & Aspiring Backend Developer at Intango TSS (L4 SOD),
              Busanza, Nyarutarama, Rwanda. Building SAMS, REST APIs, and practical web systems.
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#f3f6ff] hover:text-[#5df0a8] transition-colors rounded"
            >
              {profile.email}
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-mono-tech uppercase tracking-[0.16em] text-[#6b7796]">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm text-[#9aa6c4]">
              {(
                [
                  ['Home', '/'],
                  ['About', '/about'],
                  ['Skills', '/skills'],
                  ['Projects', '/projects'],
                  ['YouTube', '/youtube'],
                  ['Get in Touch', '/contact'],
                ] as Array<[string, RoutePath]>
              ).map(([label, path]) => (
                <li key={path}>
                  <button
                    type="button"
                    onClick={() => onNavigate(path)}
                    className="hover:text-[#f3f6ff] transition-colors cursor-pointer rounded"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-mono-tech uppercase tracking-[0.16em] text-[#6b7796]">
              Profiles & Channels
            </h3>
            <ul className="space-y-2.5 text-sm text-[#9aa6c4]">
              <li>
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#5df0a8] transition-colors rounded"
                >
                  GitHub (@Ainechris) <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={profile.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#5df0a8] transition-colors rounded"
                >
                  YouTube (@VazukoYT) <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#5df0a8] transition-colors rounded"
                >
                  Instagram (@__aine_.23) <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
              <li>
                {profile.tiktokUrl ? (
                  <a
                    href={profile.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-[#5df0a8] transition-colors rounded"
                  >
                    TikTok <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-[#6b7796]">TikTok — Link coming soon</span>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#6b7796]">
          <span>© {new Date().getFullYear()} {profile.fullName}. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <span>Busanza, Nyarutarama, Rwanda</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="hover:text-[#f3f6ff] transition-colors cursor-pointer rounded"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
