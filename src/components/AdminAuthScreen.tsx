import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from 'lucide-react';
import { BrandMark } from './BrandMark.tsx';

interface AdminAuthScreenProps {
  loading: boolean;
  configured: boolean;
  password: string;
  confirmPassword: string;
  authError: string | null;
  authSubmitting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackToPortfolio: () => void;
}

export const AdminAuthScreen: React.FC<AdminAuthScreenProps> = ({
  loading,
  configured,
  password,
  confirmPassword,
  authError,
  authSubmitting,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onBackToPortfolio,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Smooth desktop pointer spotlight & glass edge reflection
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || typeof window === 'undefined') return undefined;

    const coarseQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (coarseQuery.matches || reducedQuery.matches) return undefined;

    let rafId = 0;
    let active = false;
    let targetX = stageEl.clientWidth * 0.62;
    let targetY = stageEl.clientHeight * 0.45;
    let currentX = targetX;
    let currentY = targetY;

    const updateCardGlow = (clientX: number, clientY: number) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      const nearestX = Math.max(rect.left, Math.min(clientX, rect.right));
      const nearestY = Math.max(rect.top, Math.min(clientY, rect.bottom));
      const distance = Math.hypot(clientX - nearestX, clientY - nearestY);
      const proximity = Math.max(0, 1 - distance / 240);

      card.style.setProperty('--card-mx', `${relX.toFixed(1)}px`);
      card.style.setProperty('--card-my', `${relY.toFixed(1)}px`);
      card.style.setProperty('--card-prox', proximity.toFixed(3));

      if (rect.width > 0 && rect.height > 0) {
        const normX = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
        const normY = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));
        const falloff = Math.max(0.25, proximity);
        card.style.setProperty('--card-rx', `${(-normY * 1.45 * falloff).toFixed(2)}deg`);
        card.style.setProperty('--card-ry', `${(normX * 1.65 * falloff).toFixed(2)}deg`);
      }
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;

      stageEl.style.setProperty('--auth-mx', `${currentX.toFixed(1)}px`);
      stageEl.style.setProperty('--auth-my', `${currentY.toFixed(1)}px`);

      const rect = stageEl.getBoundingClientRect();
      updateCardGlow(rect.left + currentX, rect.top + currentY);

      if (active || Math.hypot(targetX - currentX, targetY - currentY) > 0.6) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = stageEl.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      if (!active) {
        active = true;
        stageEl.style.setProperty('--auth-opacity', '1');
      }
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handlePointerLeave = () => {
      active = false;
      stageEl.style.setProperty('--auth-opacity', '0');
      if (cardRef.current) {
        cardRef.current.style.setProperty('--card-prox', '0');
        cardRef.current.style.setProperty('--card-rx', '0deg');
        cardRef.current.style.setProperty('--card-ry', '0deg');
      }
    };

    stageEl.addEventListener('pointermove', handlePointerMove, { passive: true });
    stageEl.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      stageEl.removeEventListener('pointermove', handlePointerMove);
      stageEl.removeEventListener('pointerleave', handlePointerLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const handleKeyCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <div
      ref={stageRef}
      className="admin-auth-stage relative min-h-screen text-[#F2EFE8] flex flex-col overflow-hidden"
    >
      {/* Subtle Architectural Grid & Cursor-Reactive Spotlight */}
      <div
        aria-hidden="true"
        className="admin-auth-grid pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="admin-auth-cursor-light pointer-events-none absolute inset-0"
      />

      {/* Sculptural Midnight Linen Geometric Facets */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        className="admin-auth-orbit-enter pointer-events-none absolute inset-0 w-full h-full opacity-90"
      >
        <path
          d="M960 -40H1480V940H820L740 690C710 585 758 492 835 415L960 -40Z"
          fill="#1F2A44"
          fillOpacity="0.28"
        />
        <line
          x1="845"
          y1="0"
          x2="730"
          y2="900"
          stroke="#C7B8A6"
          strokeOpacity="0.14"
          strokeWidth="1"
        />
        <circle
          cx="1095"
          cy="450"
          r="330"
          stroke="#C7B8A6"
          strokeOpacity="0.16"
          strokeWidth="1"
          strokeDasharray="5 10"
          className="admin-auth-orbit-spin"
        />
        <circle
          cx="1095"
          cy="450"
          r="240"
          stroke="#B46A55"
          strokeOpacity="0.24"
          strokeWidth="1"
        />
      </svg>

      {/* Clean Minimal Top Bar */}
      <header className="admin-auth-header-enter relative z-20 w-full border-b border-[#C7B8A6]/15 bg-[#0B1320]/70 backdrop-blur-md">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark className="w-7 h-7 shrink-0" />
            <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-[#F2EFE8] whitespace-nowrap shrink-0">
              BAMBE Aine Chris
            </span>
          </div>

          <button
            type="button"
            onClick={onBackToPortfolio}
            className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#1F2A44]/70 hover:bg-[#1F2A44] border border-[#C7B8A6]/25 hover:border-[#D68C76]/55 text-xs sm:text-sm font-medium text-[#F2EFE8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#D68C76]" aria-hidden="true" />
            <span>Back to Portfolio</span>
          </button>
        </div>
      </header>

      {/* Main Split Stage */}
      <main className="relative z-10 flex-1 flex items-center">
        <div className="max-w-[1160px] w-full mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Architectural Portal Identity */}
            <div className="lg:col-span-6 space-y-6">
              <div className="hero-stagger-1 inline-flex items-center gap-3">
                <span className="h-[1.5px] w-7 bg-[#B46A55]" aria-hidden="true" />
                <p className="font-mono-tech text-xs tracking-[0.14em] text-[#D68C76] font-medium">
                  Private Portfolio Portal
                </p>
              </div>

              <h1 className="hero-stagger-2 font-display text-[clamp(2rem,3.8vw,3.25rem)] font-bold tracking-tight leading-[1.08] text-[#F2EFE8] [text-wrap:balance]">
                {loading ? (
                  'Preparing your workspace.'
                ) : configured ? (
                  <>
                    Welcome back to <span className="text-[#D68C76]">your studio.</span>
                  </>
                ) : (
                  <>
                    Claim your <span className="text-[#D68C76]">private workspace.</span>
                  </>
                )}
              </h1>

              <p className="hero-stagger-3 text-[15px] sm:text-base text-[#C7B8A6] leading-[1.7] max-w-[46ch]">
                {configured
                  ? 'Sign in to publish engineering case studies, upload verified certificates, and read messages sent through your portfolio.'
                  : 'Set your personal administrator passcode once to unlock project management, credential uploads, and your visitor inbox.'}
              </p>

              {/* Sculptural Architectural Vault Seal */}
              <div className="hero-stagger-4 pt-2 flex items-center gap-5">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 104 104"
                    className="w-full h-full sculpture-float-frame"
                  >
                    <circle
                      cx="52"
                      cy="52"
                      r="46"
                      fill="none"
                      stroke="#C7B8A6"
                      strokeOpacity="0.3"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                    <circle
                      cx="52"
                      cy="52"
                      r="36"
                      fill="#1F2A44"
                      fillOpacity="0.45"
                      stroke="#D68C76"
                      strokeOpacity="0.45"
                      strokeWidth="1"
                    />
                    <circle cx="52" cy="6" r="2.2" fill="#D68C76" />
                    <circle cx="98" cy="52" r="2" fill="#C7B8A6" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <BrandMark className="w-9 h-9 sm:w-10 sm:h-10" />
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <p className="font-display text-sm sm:text-base font-semibold text-[#F2EFE8]">
                    Aine Chris CMS
                  </p>
                  <p className="font-mono-tech text-xs text-[#C7B8A6]/85 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>Projects</span>
                    <span aria-hidden="true" className="text-[#B46A55]">
                      ·
                    </span>
                    <span>Certificates</span>
                    <span aria-hidden="true" className="text-[#B46A55]">
                      ·
                    </span>
                    <span>Contact Inbox</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Frosted Glass Authentication Card */}
            <div className="lg:col-span-6 admin-auth-card-enter">
              <div
                ref={cardRef}
                className="admin-auth-glass-card relative rounded-2xl p-6 sm:p-9 max-w-[490px] w-full lg:ml-auto overflow-hidden"
              >
                {/* Cursor-reactive glass reflection & edge illumination */}
                <div
                  aria-hidden="true"
                  className="admin-auth-glass-reflection pointer-events-none absolute inset-0 rounded-2xl"
                />
                <div
                  aria-hidden="true"
                  className="admin-auth-glass-edge pointer-events-none absolute inset-0 rounded-2xl"
                />

                {loading ? (
                  <div className="relative z-10 py-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0B1320]/80 border border-[#C7B8A6]/25 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[#D68C76]" aria-hidden="true" />
                    </div>
                    <div className="space-y-2 w-full max-w-[240px]">
                      <p className="font-display text-lg font-semibold text-[#F2EFE8]">
                        Checking session
                      </p>
                      <p className="text-xs text-[#C7B8A6]">
                        Verifying administrator configuration...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={configured ? 'signin-form' : 'setup-form'} className="relative z-10">
                    {/* Card Header */}
                    <div className="admin-auth-form-step-1 flex items-start gap-4 pb-6 border-b border-[#C7B8A6]/15">
                      <div className="w-11 h-11 rounded-xl bg-[#0B1320]/85 border border-[#D68C76]/40 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(242,239,232,0.12)]">
                        {configured ? (
                          <Lock className="w-5 h-5 text-[#D68C76]" aria-hidden="true" />
                        ) : (
                          <KeyRound className="w-5 h-5 text-[#D68C76]" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F2EFE8]">
                          {configured ? 'Admin Sign In' : 'First-Time Setup'}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-[#C7B8A6] leading-relaxed">
                          {configured
                            ? 'Enter your administrator password to continue.'
                            : 'Create a strong private passcode (minimum 8 characters).'}
                        </p>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                      <div className="admin-auth-form-step-2">
                        <label
                          htmlFor="admin-password"
                          className="block text-xs font-medium tracking-wide text-[#F2EFE8]/90 mb-2"
                        >
                          {configured ? 'Admin Password' : 'New Admin Password'}
                        </label>
                        <div className="relative">
                          <Lock
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C7B8A6]/70"
                            aria-hidden="true"
                          />
                          <input
                            id="admin-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoFocus
                            autoComplete={configured ? 'current-password' : 'new-password'}
                            minLength={configured ? 1 : 8}
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            onKeyDown={handleKeyCheck}
                            onKeyUp={handleKeyCheck}
                            placeholder={configured ? 'Enter your passcode' : 'At least 8 characters'}
                            className="w-full min-h-[48px] pl-10 pr-12 py-2.5 rounded-xl bg-[#0B1320]/85 border border-[#C7B8A6]/25 focus:border-[#D68C76] focus:outline-none text-sm text-[#F2EFE8] placeholder:text-[#C7B8A6]/45 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center text-[#C7B8A6] hover:text-[#F2EFE8] hover:bg-[#1F2A44]/60 active:scale-95 transition-all duration-150 cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>

                      {!configured && (
                        <div className="admin-auth-form-step-3">
                          <label
                            htmlFor="admin-password-confirm"
                            className="block text-xs font-medium tracking-wide text-[#F2EFE8]/90 mb-2"
                          >
                            Confirm Password
                          </label>
                          <div className="relative">
                            <KeyRound
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C7B8A6]/70"
                              aria-hidden="true"
                            />
                            <input
                              id="admin-password-confirm"
                              type={showConfirmPassword ? 'text' : 'password'}
                              required
                              autoComplete="new-password"
                              minLength={8}
                              value={confirmPassword}
                              onChange={(e) => onConfirmPasswordChange(e.target.value)}
                              onKeyDown={handleKeyCheck}
                              onKeyUp={handleKeyCheck}
                              placeholder="Repeat your passcode"
                              className="w-full min-h-[48px] pl-10 pr-12 py-2.5 rounded-xl bg-[#0B1320]/85 border border-[#C7B8A6]/25 focus:border-[#D68C76] focus:outline-none text-sm text-[#F2EFE8] placeholder:text-[#C7B8A6]/45 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              aria-label={
                                showConfirmPassword
                                  ? 'Hide confirm password'
                                  : 'Show confirm password'
                              }
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center text-[#C7B8A6] hover:text-[#F2EFE8] hover:bg-[#1F2A44]/60 active:scale-95 transition-all duration-150 cursor-pointer"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                              ) : (
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                          </div>

                          {/* Clean unboxed live setup validation readout */}
                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                            <span
                              className={`inline-flex items-center gap-1.5 transition-colors duration-200 ${
                                hasMinLength ? 'text-[#84C7B2]' : 'text-[#C7B8A6]/75'
                              }`}
                            >
                              {hasMinLength ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              )}
                              <span>8+ characters</span>
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 transition-colors duration-200 ${
                                passwordsMatch ? 'text-[#84C7B2]' : 'text-[#C7B8A6]/75'
                              }`}
                            >
                              {passwordsMatch ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              )}
                              <span>Passwords match</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {capsLockOn && (
                        <p className="admin-auth-form-step-1 inline-flex items-center gap-1.5 text-xs text-[#D68C76]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Caps Lock is on</span>
                        </p>
                      )}

                      {authError && (
                        <div
                          key={authError}
                          role="alert"
                          className="admin-auth-error-enter flex items-start gap-2.5 rounded-xl bg-[#3B1219]/70 border border-[#F87171]/35 px-3.5 py-2.5 text-xs text-[#FECACA]"
                        >
                          <AlertCircle className="w-4 h-4 text-[#FCA5A5] shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <div className={configured ? 'admin-auth-form-step-3' : 'admin-auth-form-step-4'}>
                        <button
                          type="submit"
                          disabled={authSubmitting}
                          className="admin-auth-submit-btn group w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#B46A55] hover:bg-[#9A4F3A] active:scale-[0.99] disabled:opacity-55 text-[#F2EFE8] text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_14px_28px_-14px_rgba(180,106,85,0.6)] whitespace-nowrap"
                        >
                          <span>
                            {authSubmitting
                              ? configured
                                ? 'Signing in...'
                                : 'Saving password...'
                              : configured
                                ? 'Sign In to Dashboard'
                                : 'Save Password & Continue'}
                          </span>
                          {!authSubmitting && (
                            <ArrowRight
                              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>
                    </form>

                    <p className="admin-auth-form-step-4 mt-5 pt-4 border-t border-[#C7B8A6]/12 text-xs text-[#C7B8A6]/75 leading-relaxed">
                      {configured
                        ? 'Your session token stays active while you manage projects, credentials, and messages.'
                        : 'Your passcode is stored as a salted hash in the server database on first setup.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
