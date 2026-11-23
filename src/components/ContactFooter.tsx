import React, { useState } from 'react';
import { ArrowUpRight, Check, CheckCircle2, Copy, Lock, Send } from 'lucide-react';
import { PUBLIC_ROUTES } from '../seo/routes.ts';
import { BrandMark } from './BrandMark.tsx';
import { type NavSection } from './Header.tsx';
import { Reveal } from './MotionPrimitives.tsx';

interface ContactFooterProps {
  onSelectSection: (section: NavSection) => void;
  onOpenAdmin: () => void;
}

export const ContactFooter: React.FC<ContactFooterProps> = ({
  onSelectSection,
  onOpenAdmin,
}) => {
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('ainechrisb@gmail.com');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = 'mailto:ainechrisb@gmail.com';
    }
  };

  const handleFooterNav = (e: React.MouseEvent<HTMLAnchorElement>, section: NavSection) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onSelectSection(section);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (name.trim().length < 2) {
      setSubmitError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    if (subject.trim().length < 2) {
      setSubmitError('Please enter a subject.');
      return;
    }
    if (message.trim().length < 10) {
      setSubmitError('Please write a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          website: honeypot,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSubmitError(data.error || 'Unable to send your message right now.');
        return;
      }

      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setHoneypot('');
      setSubmitSuccess(true);
    } catch {
      setSubmitError('Network error while sending message. Please try emailing directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="scroll-mt-20 w-full bg-[#1F2A44] text-[#F2EFE8] border-t border-[#C7B8A6]/25"
      >
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
            {/* Left Column: Direct Info & Interactive Midnight Contact Cards */}
            <div className="lg:col-span-5">
              <Reveal>
                <p className="font-mono-tech text-xs tracking-[0.14em] text-[#D68C76]">
                  06. Contact
                </p>
                <h2
                  id="contact-heading"
                  className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F2EFE8] [text-wrap:balance]"
                >
                  Have an idea worth bringing to life?
                </h2>
                <p className="mt-4 text-sm sm:text-base text-[#DED8CE] leading-relaxed">
                  Open to internships, software development roles, scholarships and technology
                  programs, recruiters, freelance projects, and developer collaborations as I grow
                  into backend engineering.
                </p>
              </Reveal>

              <Reveal delayMs={150}>
                <div className="mt-8 grid grid-cols-1 gap-3">
                  <div className="rounded-xl bg-[#0B1320] border border-[#C7B8A6]/30 hover:border-[#D68C76]/75 p-4 flex items-center justify-between gap-4 transition-all duration-150 hover:-translate-y-0.5">
                    <div className="min-w-0">
                      <p className="font-mono-tech text-[11px] text-[#C7B8A6]">Direct Email</p>
                      <a
                        href="mailto:ainechrisb@gmail.com"
                        className="mt-0.5 block text-sm font-medium text-[#F2EFE8] hover:text-[#D68C76] transition-colors truncate"
                      >
                        ainechrisb@gmail.com
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      aria-label="Copy email address"
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#1F2A44] hover:bg-[#B46A55] border border-[#C7B8A6]/35 text-xs font-medium text-[#F2EFE8] transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#D68C76]" aria-hidden="true" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#C7B8A6]" aria-hidden="true" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="https://github.com/Ainechris"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-xl bg-[#0B1320] border border-[#C7B8A6]/30 hover:border-[#D68C76]/75 p-4 flex items-center justify-between gap-3 transition-all duration-150 hover:-translate-y-0.5"
                    >
                      <div>
                        <p className="font-mono-tech text-[11px] text-[#C7B8A6]">GitHub</p>
                        <p className="mt-0.5 text-sm font-medium text-[#F2EFE8] group-hover:text-[#D68C76] transition-colors">
                          @Ainechris
                        </p>
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 text-[#C7B8A6] group-hover:text-[#D68C76] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </a>

                    <a
                      href="https://www.instagram.com/__aine_.23/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-xl bg-[#0B1320] border border-[#C7B8A6]/30 hover:border-[#D68C76]/75 p-4 flex items-center justify-between gap-3 transition-all duration-150 hover:-translate-y-0.5"
                    >
                      <div>
                        <p className="font-mono-tech text-[11px] text-[#C7B8A6]">Instagram</p>
                        <p className="mt-0.5 text-sm font-medium text-[#F2EFE8] group-hover:text-[#D68C76] transition-colors">
                          @__aine_.23
                        </p>
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 text-[#C7B8A6] group-hover:text-[#D68C76] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </a>
                  </div>

                  <div className="rounded-xl bg-[#0B1320] border border-[#C7B8A6]/30 px-4 py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                    <span className="text-[#C7B8A6] shrink-0">School Location</span>
                    <span className="font-medium text-[#F2EFE8] text-right">
                      Busaanza, Rwanda · Intango TSS (L4 SOD)
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right Column: Tactile Linen Contact Form Card */}
            <div className="lg:col-span-7">
              <Reveal delayMs={150}>
                <div className="rounded-2xl bg-[#F2EFE8] text-[#0B1320] border border-[#C7B8A6] p-6 sm:p-8 shadow-[0_24px_54px_-24px_rgba(4,7,14,0.65)]">
                  <h3 className="font-display text-xl font-semibold text-[#0B1320]">
                    Send a direct message
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#4A5264]">
                    Messages are saved securely and reviewed directly in my dashboard.
                  </p>

                  <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                    <div className="sr-only" aria-hidden="true">
                      <label htmlFor="contact-website">Website</label>
                      <input
                        id="contact-website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-medium text-[#1F2A44] mb-1.5"
                        >
                          Name *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          maxLength={100}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#FAF8F4] border border-[#C7B8A6] focus:border-[#B46A55] focus:outline-none text-sm text-[#0B1320] placeholder:text-[#6E7484]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-medium text-[#1F2A44] mb-1.5"
                        >
                          Email *
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          maxLength={150}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#FAF8F4] border border-[#C7B8A6] focus:border-[#B46A55] focus:outline-none text-sm text-[#0B1320] placeholder:text-[#6E7484]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-subject"
                        className="block text-xs font-medium text-[#1F2A44] mb-1.5"
                      >
                        Subject *
                      </label>
                      <input
                        id="contact-subject"
                        type="text"
                        required
                        maxLength={160}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Internship inquiry, project collaboration, or question"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#FAF8F4] border border-[#C7B8A6] focus:border-[#B46A55] focus:outline-none text-sm text-[#0B1320] placeholder:text-[#6E7484]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-medium text-[#1F2A44] mb-1.5"
                      >
                        Message *
                      </label>
                      <textarea
                        id="contact-message"
                        rows={4}
                        required
                        maxLength={3000}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share a little context about what you are working on or exploring..."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F4] border border-[#C7B8A6] focus:border-[#B46A55] focus:outline-none text-sm text-[#0B1320] placeholder:text-[#6E7484]"
                      />
                    </div>

                    {submitError && (
                      <p role="alert" className="text-xs font-medium text-[#9A2E2E]">
                        {submitError}
                      </p>
                    )}

                    {submitSuccess && (
                      <div
                        role="status"
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#FAF8F4] border border-[#B46A55]/50 text-xs sm:text-sm text-[#0B1320]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#9A4F3A] shrink-0" aria-hidden="true" />
                        <span>Thank you — your message has been delivered.</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0B1320] hover:bg-[#B46A55] disabled:opacity-50 text-[#F2EFE8] text-sm font-semibold transition-colors duration-200 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-[#D68C76]" aria-hidden="true" />
                        <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full bg-[#0B1320] text-[#C7B8A6] border-t border-[#1F2A44]">
        {/* Subtle Sculptural SVG Horizon Divider */}
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 pt-6">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 24"
            fill="none"
            className="w-full h-5 opacity-60"
            preserveAspectRatio="none"
          >
            <path
              d="M0 12H460L484 4H716L740 12H1200"
              stroke="#C7B8A6"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <circle cx="600" cy="4" r="2.5" fill="#D68C76" />
          </svg>
        </div>

        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <BrandMark className="w-7 h-7 shrink-0" />
            <div>
              <p className="font-display font-semibold text-[#F2EFE8]">BAMBE Aine Chris</p>
              <p className="text-xs text-[#C7B8A6]">
                &copy; <span className="font-mono-tech tabular-nums">2026</span> BAMBE Aine Chris ·
                Intango TSS, Busaanza, Rwanda
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {PUBLIC_ROUTES.map((route) => (
              <a
                key={route.path}
                href={route.path}
                onClick={(e) => handleFooterNav(e, route.sectionId)}
                className="hover:text-[#F2EFE8] transition-colors"
              >
                {route.label}
              </a>
            ))}

            <a
              href="https://github.com/Ainechris"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F2EFE8] transition-colors"
            >
              GitHub
            </a>

            <a
              href="https://www.instagram.com/__aine_.23/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F2EFE8] transition-colors"
            >
              Instagram
            </a>

            <a
              href="/admin"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onOpenAdmin();
              }}
              className="inline-flex items-center gap-1.5 font-medium text-[#D68C76] hover:underline"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Admin Portal</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};
