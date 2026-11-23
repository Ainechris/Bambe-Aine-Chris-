import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { type ThemePreference, useTheme } from '../context/ThemeContext.tsx';

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export const FooterThemeSwitcher: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme mode"
      className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-[#141F36] border border-[#C7B8A6]/25"
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            title={
              value === 'system'
                ? `System default (${resolvedTheme} active)`
                : `Switch to ${label} mode`
            }
            className={`inline-flex items-center gap-1.5 min-h-[32px] px-2.5 py-1 rounded-lg font-mono-tech text-[11px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
              active
                ? 'bg-[#B46A55] text-[#F2EFE8] shadow-xs'
                : 'text-[#C7B8A6] hover:text-[#F2EFE8] hover:bg-[#1F2A44]/75'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden={true} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export const FloatingThemeButton: React.FC = () => {
  const { theme, resolvedTheme, cycleTheme } = useTheme();

  const ActiveIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const label = theme === 'system' ? `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})` : theme === 'dark' ? 'Dark' : 'Light';
  const nextHint =
    theme === 'system'
      ? 'Switch to Dark mode'
      : theme === 'dark'
        ? 'Switch to Light mode'
        : 'Switch to System default';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Color mode: ${label}. ${nextHint}`}
      title={`${label} — click to cycle System / Dark / Light`}
      className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FAF8F4]/90 dark:bg-[#0D1627]/90 backdrop-blur-md border border-[#C7B8A6]/75 dark:border-[#304166] text-[#0B1320] dark:text-[#F2EFE8] shadow-[0_14px_30px_-14px_rgba(11,19,32,0.35)] dark:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.75)] hover:border-[#B46A55] dark:hover:border-[#D68C76] transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
    >
      <ActiveIcon className="w-3.5 h-3.5 text-[#B46A55] dark:text-[#D68C76]" aria-hidden={true} />
      <span className="font-mono-tech text-[11px] font-medium tracking-tight">
        {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};
