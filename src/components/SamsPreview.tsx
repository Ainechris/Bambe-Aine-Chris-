import React, { useState } from 'react';
import { Database, KeyRound, MonitorCheck, ShieldCheck, Users } from 'lucide-react';

const SAMS_MODULES = [
  {
    id: 'kiosk',
    label: 'Student Check-In Kiosk',
    role: 'Front Gate Entry',
    icon: MonitorCheck,
    summary:
      'Dedicated check-in interface where students record arrivals against an active school gate session.',
    details: [
      'Captures timestamped student attendance entries into SQLite',
      'Validates student records before logging attendance state',
      'Designed for fast repeated gate throughput during arrival hours',
    ],
  },
  {
    id: 'gate',
    label: 'Controlled Gate Sessions',
    role: 'Session Lifecycle',
    icon: KeyRound,
    summary:
      'Structured session boundaries controlling when gate check-ins are open, active, or closed.',
    details: [
      'Prevents unscheduled or out-of-window attendance writes',
      'Tracks session state clearly between security and administration',
      'Supports repeatable daily school attendance workflows',
    ],
  },
  {
    id: 'admin',
    label: 'Administrator Workspace',
    role: 'School Management',
    icon: Database,
    summary:
      'Central workspace for managing student records, reviewing attendance logs, and overseeing gate operations.',
    details: [
      'Powered by Flask routes and structured SQLite tables',
      'Provides visibility across attendance records and workspaces',
      'Supports administrative coordination across the school',
    ],
  },
  {
    id: 'security',
    label: 'Security Workspace',
    role: 'Gate Oversight',
    icon: ShieldCheck,
    summary:
      'Operational view tailored for security personnel overseeing physical gate entry and session status.',
    details: [
      'Separates security responsibilities from general student access',
      'Focuses on active gate session control and verification',
      'Improves coordination between gate staff and administration',
    ],
  },
  {
    id: 'portal',
    label: 'Student Portal',
    role: 'Student View',
    icon: Users,
    summary:
      'Dedicated portal giving students clear access to their own attendance-related view within SAMS.',
    details: [
      'Role-scoped interface built with HTML, CSS, and Flask templates',
      'Keeps student interaction cleanly separated from admin/security tools',
      'Connects directly to the shared SQLite attendance records',
    ],
  },
];

export const SamsPreview: React.FC = () => {
  const [activeId, setActiveId] = useState(SAMS_MODULES[0].id);
  const active = SAMS_MODULES.find((m) => m.id === activeId) ?? SAMS_MODULES[0];
  const Icon = active.icon;

  return (
    <div className="portfolio-card overflow-hidden flex flex-col justify-between h-full">
      {/* Top workspace chrome */}
      <div className="px-5 py-3.5 bg-[rgba(4,6,15,0.55)] border-b border-[rgba(150,175,230,0.12)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-mono-tech text-[#9aa6c4]">
          <span className="text-[#5df0a8] font-medium">SAMS</span>
          <span aria-hidden="true">/</span>
          <span>Flask + SQLite Architecture</span>
        </div>
        <span className="text-[11px] font-mono-tech text-[#6b7796]">
          Interactive Module Explorer
        </span>
      </div>

      {/* Interactive module selector tabs */}
      <div
        role="tablist"
        aria-label="SAMS architecture modules"
        className="px-5 pt-4 pb-3 border-b border-[rgba(150,175,230,0.12)] flex flex-wrap gap-2"
      >
        {SAMS_MODULES.map((mod) => {
          const isSelected = mod.id === activeId;
          return (
            <button
              key={mod.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveId(mod.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#5df0a8] text-[#032018] font-semibold'
                  : 'bg-[rgba(4,6,15,0.45)] text-[#9aa6c4] hover:text-[#f3f6ff] border border-[rgba(150,175,230,0.16)]'
              }`}
            >
              {mod.label}
            </button>
          );
        })}
      </div>

      {/* Active module architectural detail pane */}
      <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#5df0a8]">
                {active.role}
              </p>
              <h4 className="text-xl font-semibold text-[#f3f6ff] tracking-tight">
                {active.label}
              </h4>
            </div>
            <div className="ascend-icon-box">
              <Icon className="w-5 h-5" />
            </div>
          </div>

          <p className="text-sm text-[#9aa6c4] leading-relaxed">{active.summary}</p>
        </div>

        <ul className="space-y-2.5 pt-4 border-t border-[rgba(150,175,230,0.12)]">
          {active.details.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm text-[#9aa6c4]">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#5df0a8] shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
