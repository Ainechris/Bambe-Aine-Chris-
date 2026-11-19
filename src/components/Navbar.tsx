import React from 'react';
import { Menu, X } from 'lucide-react';
import type { Profile, RoutePath } from '../types/portfolio.ts';

interface NavbarProps {
  currentPath: RoutePath;
  profile: Profile;
  onNavigate: (path: RoutePath) => void;
  overlayFixed?: boolean;
}

const NAV_LINKS: Array<{ label: string; path: RoutePath }> = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Skills', path: '/skills' },
  { label: 'Projects', path: '/projects' },
  { label: 'YouTube', path: '/youtube' },
  { label: 'Contact', path: '/contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  profile,
  onNavigate,
  overlayFixed = false,
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const go = (path: RoutePath) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header
      className={`${
        overlayFixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
      } z-40 px-4 sm:px-[5.5vw] pt-4 pb-2 bg-gradient-to-b from-[#04060f]/90 via-[#04060f]/55 to-transparent pointer-events-none`}
    >
      <div className="max-w-[1440px] mx-auto pointer-events-auto">
        <div className="w-full rounded-2xl bg-[rgba(12,18,38,0.72)] backdrop-blur-lg border border-[rgba(150,175,230,0.22)] shadow-[0_18px_40px_rgba(0,0,0,0.55)] px-6 sm:px-9 h-[64px] sm:h-[68px] flex items-center justify-between gap-6">
          {/* Left: Geometric square mark + Brand Name (matching Hero Nav Slab) */}
          <button
            type="button"
            onClick={() => go('/')}
            className="flex items-center gap-3 text-sm sm:text-base font-semibold tracking-tight text-[#f3f6ff] whitespace-nowrap shrink-0 cursor-pointer rounded"
          >
            <span className="w-4 h-4 border border-[#9aa6c4] flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 bg-[#5df0a8]" />
            </span>
            <span className="font-display">Bambe Aine Chris</span>
          </button>

          {/* Center: Clean single-line text nav links including Home */}
          <nav
            className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => {
              const active = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => go(link.path)}
                  className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer rounded px-1 py-0.5 ${
                    active
                      ? 'text-[#5df0a8]'
                      : 'text-[#9aa6c4] hover:text-[#f3f6ff]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right: GitHub ↗ link (matching Hero Nav Slab) + Mobile menu trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#f3f6ff] hover:text-[#5df0a8] transition-colors whitespace-nowrap shrink-0 rounded px-1 py-0.5"
            >
              GitHub ↗
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-md text-[#9aa6c4] hover:text-[#f3f6ff] cursor-pointer"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-[rgba(150,175,230,0.22)] bg-[rgba(12,18,38,0.85)] backdrop-blur-lg px-5 py-4 space-y-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                type="button"
                aria-current={currentPath === link.path ? 'page' : undefined}
                onClick={() => go(link.path)}
                className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer ${
                  currentPath === link.path
                    ? 'text-[#5df0a8] bg-[rgba(93,240,168,0.08)]'
                    : 'text-[#9aa6c4] hover:text-[#f3f6ff]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
