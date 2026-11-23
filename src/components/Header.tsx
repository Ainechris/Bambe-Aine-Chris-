import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { type PageSectionId } from '../seo/routes.ts';
import { BrandMark } from './BrandMark.tsx';

export type NavSection = PageSectionId;

interface HeaderProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

const NAV_ITEMS: Array<{ id: NavSection; href: string; label: string }> = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'about', href: '/about', label: 'About' },
  { id: 'work', href: '/work', label: 'Work' },
  { id: 'skills', href: '/skills', label: 'Skills' },
  { id: 'contact', href: '/contact', label: 'Contact' },
];

export const Header: React.FC<HeaderProps> = ({ activeSection, onSelectSection }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: NavSection) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMobileOpen(false);
    onSelectSection(section);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F2EFE8]/92 backdrop-blur-md border-b border-[#C7B8A6]/55 transition-colors duration-200">
      <div className="max-w-[1220px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Monogram + Name */}
        <a
          href="/"
          onClick={(e) => handleNavClick(e, 'home')}
          className="group flex items-center gap-3 font-display text-[17px] font-semibold tracking-tight text-[#0B1320] whitespace-nowrap shrink-0 rounded"
        >
          <BrandMark className="w-8 h-8 transition-transform duration-200 ease-out group-hover:scale-105" />
          <span>Aine Chris</span>
        </a>

        {/* Zone 2: Clean Single-Line Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`group relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 rounded ${
                  isActive ? 'text-[#0B1320] font-semibold' : 'text-[#4A5264] hover:text-[#0B1320]'
                }`}
              >
                <span>{item.label}</span>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full transition-transform duration-200 ease-out origin-left ${
                    isActive
                      ? 'scale-x-100 bg-[#B46A55]'
                      : 'scale-x-0 group-hover:scale-x-100 bg-[#1F2A44]'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/contact"
            onClick={(e) => handleNavClick(e, 'contact')}
            className="px-4 py-2 rounded-lg bg-[#0B1320] hover:bg-[#B46A55] text-[#F2EFE8] text-xs sm:text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            Get in Touch
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#4A5264] hover:text-[#0B1320] hover:bg-[#C7B8A6]/30 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out bg-[#EAE5DC] border-t border-[#C7B8A6]/55 ${
          mobileOpen ? 'max-h-96 opacity-100 py-3' : 'max-h-0 opacity-0 py-0 border-t-0'
        }`}
      >
        <nav aria-label="Mobile navigation" className="px-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`flex items-center justify-between w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#B46A55]/15 text-[#9A4F3A] font-semibold'
                    : 'text-[#4A5264] hover:text-[#0B1320] hover:bg-[#C7B8A6]/30'
                }`}
              >
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
