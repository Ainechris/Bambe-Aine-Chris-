import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Mail, MapPin, Send } from 'lucide-react';
import type { Profile } from '../types/portfolio.ts';

import { AnimatedHeading } from '../components/AnimatedText.tsx';

interface ContactPageProps {
  profile: Profile;
  embedded?: boolean;
}

export const ContactPage: React.FC<ContactPageProps> = ({ profile, embedded = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);

    if (name.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (subject.trim().length < 2) {
      setError('Please enter a subject.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please write a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send message. Please try again.');
      } else {
        setSent(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setError('Network error while sending message.');
    } finally {
      setSubmitting(false);
    }
  };

  const Container = embedded ? 'section' : 'div';

  return (
    <Container
      id={embedded ? 'home-contact' : undefined}
      data-chapter={embedded ? 'contact' : undefined}
      className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${
        embedded ? 'py-20 sm:py-28' : 'py-16 sm:py-24'
      } space-y-14`}
    >
      <header className="space-y-4 max-w-3xl chapter-parallax-header" data-reveal="">
        <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-[#5df0a8]">
          {embedded ? '05 · ' : ''}Get in Touch
        </p>
        <AnimatedHeading
          as={embedded ? 'h2' : 'h1'}
          trigger={embedded ? 'reveal' : 'mount'}
          text="Let's build something"
          accentText="together."
          className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#f3f6ff]"
        />
        <p className="text-lg text-[#9aa6c4] leading-relaxed">
          Reach out about software development internships, junior backend opportunities,
          freelance projects, or developer collaborations.
        </p>
      </header>

      <div
        data-reveal="line"
        className="h-px bg-gradient-to-r from-[#5df0a8]/45 via-[rgba(150,175,230,0.2)] to-transparent"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-2">
        {/* Contact Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          data-reveal="left"
          className="lg:col-span-7 ascend-panel p-6 sm:p-8 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="contact-name" className="block text-xs font-mono-tech uppercase tracking-[0.12em] text-[#9aa6c4]">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl bg-[rgba(4,6,15,0.6)] border border-[rgba(150,175,230,0.18)] focus:border-[#5df0a8] focus:outline-none text-sm text-[#f3f6ff] placeholder:text-[#6b7796]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contact-email" className="block text-xs font-mono-tech uppercase tracking-[0.12em] text-[#9aa6c4]">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[rgba(4,6,15,0.6)] border border-[rgba(150,175,230,0.18)] focus:border-[#5df0a8] focus:outline-none text-sm text-[#f3f6ff] placeholder:text-[#6b7796]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="contact-subject" className="block text-xs font-mono-tech uppercase tracking-[0.12em] text-[#9aa6c4]">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Internship, freelance project, or collaboration"
              className="w-full px-4 py-3 rounded-xl bg-[rgba(4,6,15,0.6)] border border-[rgba(150,175,230,0.18)] focus:border-[#5df0a8] focus:outline-none text-sm text-[#f3f6ff] placeholder:text-[#6b7796]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contact-message" className="block text-xs font-mono-tech uppercase tracking-[0.12em] text-[#9aa6c4]">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share details about the opportunity, project, or question..."
              className="w-full px-4 py-3 rounded-xl bg-[rgba(4,6,15,0.6)] border border-[rgba(150,175,230,0.18)] focus:border-[#5df0a8] focus:outline-none text-sm text-[#f3f6ff] placeholder:text-[#6b7796] resize-y"
            />
          </div>

          <div aria-live="polite">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/40 text-sm text-red-200">
                {error}
              </div>
            )}

            {sent && (
              <div className="px-4 py-3 rounded-xl bg-[#5df0a8]/10 border border-[#5df0a8]/40 text-sm text-[#5df0a8] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Message sent and saved. Thank you for reaching out!</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="ascend-btn-primary disabled:opacity-50"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>{submitting ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>

        {/* Direct Links */}
        <aside
          className="lg:col-span-5 space-y-5"
          data-reveal="right"
          style={{ '--rd': '120ms' } as React.CSSProperties}
        >
          <div className="portfolio-card p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#6b7796]">
                Direct Email
              </p>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2.5 text-lg font-medium text-[#f3f6ff] hover:text-[#5df0a8] transition-colors rounded"
              >
                <Mail className="w-5 h-5 text-[#5df0a8]" aria-hidden="true" />
                <span>{profile.email}</span>
              </a>
            </div>

            <div className="space-y-2 pt-4 border-t border-[rgba(150,175,230,0.12)]">
              <p className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#6b7796]">
                Location & School
              </p>
              <p className="inline-flex items-center gap-2 text-sm text-[#9aa6c4]">
                <MapPin className="w-4 h-4 text-[#5df0a8] shrink-0" aria-hidden="true" />
                <span>Intango TSS · Busanza, Nyarutarama, Rwanda</span>
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[rgba(150,175,230,0.12)]">
              <p className="text-xs font-mono-tech uppercase tracking-[0.14em] text-[#6b7796]">
                Social Profiles
              </p>

              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 text-sm text-[#9aa6c4] hover:text-[#5df0a8] border-b border-[rgba(150,175,230,0.1)] transition-colors"
              >
                <span>GitHub (@Ainechris)</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href={profile.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 text-sm text-[#9aa6c4] hover:text-[#5df0a8] border-b border-[rgba(150,175,230,0.1)] transition-colors"
              >
                <span>YouTube (@VazukoYT)</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 text-sm text-[#9aa6c4] hover:text-[#5df0a8] border-b border-[rgba(150,175,230,0.1)] transition-colors"
              >
                <span>Instagram (@__aine_.23)</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>

              {profile.tiktokUrl ? (
                <a
                  href={profile.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2.5 text-sm text-[#9aa6c4] hover:text-[#5df0a8] transition-colors"
                >
                  <span>TikTok</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              ) : (
                <div className="flex items-center justify-between py-2.5 text-sm text-[#6b7796]">
                  <span>TikTok</span>
                  <span className="text-xs font-mono-tech">Link coming soon</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
};
