import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  Mail,
  Send,
  X,
} from 'lucide-react';
import { PUBLIC_ROUTES } from '../seo/routes.ts';
import { BrandMark } from './BrandMark.tsx';
import { type NavSection } from './Header.tsx';
import { Reveal } from './MotionPrimitives.tsx';
import { FooterThemeSwitcher } from './ThemeSwitcher.tsx';

interface ContactFooterProps {
  onSelectSection: (section: NavSection) => void;
  onOpenAdmin: () => void;
}

type ContactFormStage = 'idle' | 'open' | 'thankyou';

interface OpportunitySuggestion {
  id: string;
  label: string;
  subject: string;
  message: string;
}

const OPPORTUNITY_SUGGESTIONS: OpportunitySuggestion[] = [
  {
    id: 'internship',
    label: 'Internship',
    subject: 'Backend Engineering Internship Opportunity',
    message:
      'Hello Aine Chris, we reviewed your portfolio and would love to discuss an internship opportunity focused on JavaScript, Node.js, Express, and backend development.',
  },
  {
    id: 'software-role',
    label: 'Software Role',
    subject: 'Junior Software Developer Opportunity',
    message:
      'Hello Aine Chris, we are looking for a motivated developer to contribute to practical software projects and would like to share role details with you.',
  },
  {
    id: 'scholarship',
    label: 'Scholarship / Program',
    subject: 'Scholarship & Tech Program Invitation',
    message:
      'Hello Aine Chris, we would like to invite you to apply for our upcoming technology scholarship and software mentorship program.',
  },
  {
    id: 'freelance',
    label: 'Freelance Project',
    subject: 'Freelance Web & Backend Project',
    message:
      'Hello Aine Chris, I have a web application project that needs a reliable backend and database foundation, and I would like to discuss scope and timeline with you.',
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    subject: 'Developer Collaboration Idea',
    message:
      'Hello Aine Chris, I am building a project and would enjoy collaborating with you on the backend architecture, APIs, and database design.',
  },
];

export const ContactFooter: React.FC<ContactFooterProps> = ({
  onSelectSection,
  onOpenAdmin,
}) => {
  const [copied, setCopied] = useState(false);

  const [formStage, setFormStage] = useState<ContactFormStage>('idle');
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const glassCardRef = useRef<HTMLDivElement | null>(null);

  // Focus the first field cleanly when opening the form
  useEffect(() => {
    if (formStage !== 'open') return undefined;
    const timer = window.setTimeout(() => {
      nameInputRef.current?.focus({ preventScroll: true });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [formStage]);

  // Show "Thank you for your opportunity." briefly, then collapse back to the idle state
  useEffect(() => {
    if (formStage !== 'thankyou') return undefined;
    const timer = window.setTimeout(() => {
      setFormStage('idle');
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [formStage]);

  const handleCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const card = glassCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--card-mx', `${(e.clientX - rect.left).toFixed(1)}px`);
    card.style.setProperty('--card-my', `${(e.clientY - rect.top).toFixed(1)}px`);
    card.style.setProperty('--card-prox', '1');
  };

  const handleCardPointerLeave = () => {
    const card = glassCardRef.current;
    if (!card) return;
    card.style.setProperty('--card-prox', '0');
  };

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

  const handleOpenForm = () => {
    setSubmitError(null);
    setFormStage('open');
  };

  const handleCloseForm = () => {
    if (submitting) return;
    setSubmitError(null);
    setFormStage('idle');
  };

  const handleSelectSuggestion = (suggestion: OpportunitySuggestion) => {
    setSelectedSuggestionId(suggestion.id);
    setSubmitError(null);

    const isTemplateSubject =
      subject.trim() === '' ||
      OPPORTUNITY_SUGGESTIONS.some((item) => item.subject === subject.trim());
    if (isTemplateSubject) {
      setSubject(suggestion.subject);
    }

    const trimmedMsg = message.trim();
    const isTemplateMessage =
      trimmedMsg === '' || OPPORTUNITY_SUGGESTIONS.some((item) => item.message === trimmedMsg);
    if (isTemplateMessage) {
      setMessage(suggestion.message);
    } else if (!trimmedMsg.includes(suggestion.message)) {
      setMessage(`${trimmedMsg}\n\n${suggestion.message}`);
    }

    window.requestAnimationFrame(() => {
      messageInputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

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
      setSelectedSuggestionId(null);
      setFormStage('thankyou');
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
        className="scroll-mt-20 relative w-full bg-[#1F2A44] dark:bg-[#0D1628] text-[#F2EFE8] border-t border-[#C7B8A6]/25 dark:border-[#1E2C49] overflow-hidden transition-colors duration-200"
      >
        {/* Subtle ambient depth washes so the frosted glass card refracts layered Midnight Linen light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(46% 52% at 80% 35%, rgba(180, 106, 85, 0.24) 0%, transparent 72%), radial-gradient(42% 48% at 64% 82%, rgba(199, 184, 166, 0.14) 0%, transparent 74%), radial-gradient(50% 55% at 18% 20%, rgba(11, 19, 32, 0.55) 0%, transparent 75%)',
          }}
        />

        <div className="relative z-10 max-w-[1220px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
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

            {/* Right Column: Frosted Glass Message Launcher, Composer & Thank-You State */}
            <div className="lg:col-span-7">
              <Reveal delayMs={150}>
                <div
                  ref={glassCardRef}
                  onPointerMove={handleCardPointerMove}
                  onPointerLeave={handleCardPointerLeave}
                  className="contact-glass-card relative rounded-2xl text-[#F2EFE8] p-6 sm:p-8 overflow-hidden"
                >
                  {/* Cursor-reactive glass reflection & edge illumination */}
                  <div
                    aria-hidden="true"
                    className="contact-glass-reflection pointer-events-none absolute inset-0 rounded-2xl"
                  />
                  <div
                    aria-hidden="true"
                    className="contact-glass-edge pointer-events-none absolute inset-0 rounded-2xl"
                  />

                  <div className="relative z-10">
                    {formStage === 'idle' && (
                      <div key="contact-idle" className="contact-idle-enter py-2 sm:py-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#0B1320]/80 border border-[#D68C76]/40 text-[#D68C76] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(242,239,232,0.14)]">
                            <Mail className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F2EFE8]">
                              Send a direct message
                            </h3>
                            <p className="mt-2 text-sm text-[#C7B8A6] leading-relaxed max-w-[46ch]">
                              Interested in offering an internship, software role, scholarship,
                              freelance project, or collaboration? Open the message form whenever
                              you are ready.
                            </p>
                          </div>
                        </div>

                        <div className="mt-7 pt-6 border-t border-[#C7B8A6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <p className="font-mono-tech text-xs text-[#C7B8A6]">
                            Direct delivery · Reviewed in portfolio dashboard
                          </p>

                          <button
                            type="button"
                            onClick={handleOpenForm}
                            className="admin-auth-submit-btn group inline-flex items-center justify-center gap-2.5 min-h-[46px] px-6 py-3 rounded-xl bg-[#B46A55] hover:bg-[#9A4F3A] active:scale-[0.99] text-[#F2EFE8] text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 shadow-[0_14px_28px_-14px_rgba(180,106,85,0.65)]"
                          >
                            <Send className="w-4 h-4" aria-hidden="true" />
                            <span>Send Message</span>
                            <ArrowRight
                              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                    )}

                    {formStage === 'open' && (
                      <div key="contact-open" className="contact-form-enter">
                        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#C7B8A6]/20">
                          <div>
                            <h3 className="font-display text-xl font-bold tracking-tight text-[#F2EFE8]">
                              Send a direct message
                            </h3>
                            <p className="mt-1 text-xs sm:text-sm text-[#C7B8A6]">
                              Pick an opportunity starter below or write your own message.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleCloseForm}
                            disabled={submitting}
                            aria-label="Close message form"
                            className="w-10 h-10 rounded-lg border border-[#C7B8A6]/25 bg-[#0B1320]/60 hover:bg-[#1F2A44] text-[#C7B8A6] hover:text-[#F2EFE8] flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>

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

                          <div className="contact-field-step-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="contact-name"
                                className="block text-xs font-medium text-[#F2EFE8]/90 mb-1.5"
                              >
                                Name *
                              </label>
                              <input
                                ref={nameInputRef}
                                id="contact-name"
                                type="text"
                                required
                                maxLength={100}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="contact-glass-field w-full min-h-[44px] px-3.5 py-2 rounded-xl focus:outline-none text-sm text-[#F2EFE8] placeholder:text-[#C7B8A6]/50"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="contact-email"
                                className="block text-xs font-medium text-[#F2EFE8]/90 mb-1.5"
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
                                className="contact-glass-field w-full min-h-[44px] px-3.5 py-2 rounded-xl focus:outline-none text-sm text-[#F2EFE8] placeholder:text-[#C7B8A6]/50"
                              />
                            </div>
                          </div>

                          <div className="contact-field-step-2">
                            <label
                              htmlFor="contact-subject"
                              className="block text-xs font-medium text-[#F2EFE8]/90 mb-1.5"
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
                              className="contact-glass-field w-full min-h-[44px] px-3.5 py-2 rounded-xl focus:outline-none text-sm text-[#F2EFE8] placeholder:text-[#C7B8A6]/50"
                            />
                          </div>

                          <div className="contact-field-step-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <label
                                htmlFor="contact-message"
                                className="block text-xs font-medium text-[#F2EFE8]/90"
                              >
                                Message *
                              </label>
                              <span className="text-[11px] text-[#C7B8A6]/80">
                                Click an opportunity to prefill
                              </span>
                            </div>

                            {/* Clickable opportunity suggestion controls */}
                            <div
                              role="group"
                              aria-label="Opportunity message suggestions"
                              className="mb-2.5 flex flex-wrap gap-2"
                            >
                              {OPPORTUNITY_SUGGESTIONS.map((suggestion) => {
                                const isActive = selectedSuggestionId === suggestion.id;
                                return (
                                  <button
                                    key={suggestion.id}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                                      isActive
                                        ? 'bg-[#B46A55] border-[#D68C76] text-[#F2EFE8] shadow-[0_8px_18px_-10px_rgba(180,106,85,0.8)]'
                                        : 'bg-[#1F2A44]/55 hover:bg-[#1F2A44]/90 border-[#C7B8A6]/25 hover:border-[#D68C76]/65 text-[#F2EFE8]/90'
                                    }`}
                                  >
                                    {suggestion.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Frosted glass message textarea */}
                            <textarea
                              ref={messageInputRef}
                              id="contact-message"
                              rows={4}
                              required
                              maxLength={3000}
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Choose an opportunity above or write your message here..."
                              className="contact-glass-field w-full px-3.5 py-3 rounded-xl focus:outline-none text-sm text-[#F2EFE8] placeholder:text-[#C7B8A6]/50 leading-relaxed"
                            />
                          </div>

                          {submitError && (
                            <div
                              key={submitError}
                              role="alert"
                              className="admin-auth-error-enter flex items-start gap-2 rounded-xl bg-[#3B1219]/75 border border-[#F87171]/40 px-3.5 py-2.5 text-xs font-medium text-[#FECACA]"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FCA5A5]" aria-hidden="true" />
                              <span>{submitError}</span>
                            </div>
                          )}

                          <div className="contact-field-step-4 pt-2 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={handleCloseForm}
                              disabled={submitting}
                              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#C7B8A6]/25 bg-[#0B1320]/55 hover:bg-[#1F2A44]/85 text-xs sm:text-sm font-medium text-[#C7B8A6] hover:text-[#F2EFE8] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              disabled={submitting}
                              className="admin-auth-submit-btn group inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#B46A55] hover:bg-[#9A4F3A] active:scale-[0.99] disabled:opacity-50 text-[#F2EFE8] text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shadow-[0_14px_28px_-14px_rgba(180,106,85,0.65)]"
                            >
                              <Send className="w-4 h-4" aria-hidden="true" />
                              <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {formStage === 'thankyou' && (
                      <div
                        key="contact-thankyou"
                        role="status"
                        aria-live="polite"
                        className="contact-thankyou-enter py-8 sm:py-10 flex flex-col items-center text-center"
                      >
                        <div className="contact-check-pop w-14 h-14 rounded-2xl bg-[#0B1320]/85 border border-[#D68C76]/45 text-[#D68C76] flex items-center justify-center shadow-[0_14px_30px_-14px_rgba(5,9,18,0.7)]">
                          <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                        </div>

                        <h3 className="mt-5 font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#F2EFE8] [text-wrap:balance]">
                          Thank you for your opportunity.
                        </h3>

                        <p className="mt-2.5 text-sm text-[#C7B8A6] leading-relaxed max-w-[40ch]">
                          Your message has been delivered directly to my dashboard and I will
                          review it shortly.
                        </p>

                        <div className="mt-6 w-full max-w-[240px] h-1 rounded-full bg-[#C7B8A6]/25 overflow-hidden">
                          <div className="contact-countdown-bar h-full w-full bg-[#D68C76] rounded-full" />
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormStage('idle')}
                          className="mt-5 min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-medium text-[#C7B8A6] hover:text-[#F2EFE8] hover:bg-[#1F2A44]/70 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full bg-[#0B1320] dark:bg-[#060A12] text-[#C7B8A6] border-t border-[#1F2A44] dark:border-[#1A263E] transition-colors duration-200">
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

        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-xs sm:text-sm">
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

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
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

            <FooterThemeSwitcher />
          </div>
        </div>
      </footer>
    </>
  );
};
