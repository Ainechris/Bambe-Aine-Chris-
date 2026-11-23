import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Compass, Layers } from 'lucide-react';
import { isSafeHttpUrl } from '../types/portfolio.ts';
import { usePrefersReducedMotion } from './MotionPrimitives.tsx';

export interface CircularGalleryItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  statusLabel: string;
  yearLabel: string;
  imageUrl: string | null;
  detailSlug: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  featured?: boolean;
}

interface CircularProjectGalleryProps {
  items: CircularGalleryItem[];
  onOpenProject: (slug: string) => void;
}

function normalizeCircularOffset(offset: number, count: number): number {
  if (count <= 1) return 0;
  let wrapped = offset % count;
  if (wrapped > count / 2) wrapped -= count;
  if (wrapped < -count / 2) wrapped += count;
  return wrapped;
}

function clampIndex(idx: number, count: number): number {
  if (count <= 0) return 0;
  return ((idx % count) + count) % count;
}

export const CircularProjectGallery: React.FC<CircularProjectGalleryProps> = ({
  items,
  onOpenProject,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const count = items.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 640) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  });

  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ringRef = useRef<SVGGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const orbitViewportRef = useRef<HTMLDivElement | null>(null);

  const targetOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const activeIndexRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startOffset: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffset: 0,
    moved: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const updateViewport = () => {
      if (window.innerWidth < 640) setViewportMode('mobile');
      else if (window.innerWidth < 1024) setViewportMode('tablet');
      else setViewportMode('desktop');
    };
    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    targetOffsetRef.current = 0;
    currentOffsetRef.current = 0;
    activeIndexRef.current = 0;
    setActiveIndex(0);
  }, [count]);

  const applyOrbitalTransforms = useCallback(
    (continuousOffset: number) => {
      const n = items.length;
      if (n === 0) return;

      const radiusX = viewportMode === 'desktop' ? 350 : viewportMode === 'tablet' ? 235 : 155;
      const radiusZ = viewportMode === 'desktop' ? 220 : viewportMode === 'tablet' ? 140 : 85;
      const archLiftY = viewportMode === 'desktop' ? -22 : viewportMode === 'tablet' ? -14 : -8;
      const maxTiltDeg = viewportMode === 'desktop' ? 28 : viewportMode === 'tablet' ? 22 : 14;
      const spreadDenominator = Math.max(n, 4);

      if (ringRef.current) {
        const ringDeg = -(continuousOffset / spreadDenominator) * 360;
        ringRef.current.style.transform = `rotate(${ringDeg.toFixed(2)}deg)`;
      }

      for (let i = 0; i < n; i += 1) {
        const cardEl = cardRefs.current[i];
        if (!cardEl) continue;

        const relIndex = normalizeCircularOffset(i - continuousOffset, n);
        const angleRad = (relIndex / spreadDenominator) * Math.PI * 2;
        const depthFactor = (Math.cos(angleRad) + 1) / 2;

        const x = Math.sin(angleRad) * radiusX;
        const z = (Math.cos(angleRad) - 1) * radiusZ;
        const y = (1 - Math.cos(angleRad)) * archLiftY;
        const rotateY = -Math.sin(angleRad) * maxTiltDeg;
        const scale =
          viewportMode === 'mobile'
            ? 0.78 + 0.22 * depthFactor
            : 0.68 + 0.32 * depthFactor;
        const opacity =
          n === 1
            ? 1
            : viewportMode === 'mobile'
              ? Math.abs(relIndex) > 1.35
                ? 0
                : 0.36 + 0.64 * depthFactor
              : 0.34 + 0.66 * depthFactor;

        cardEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        cardEl.style.opacity = opacity.toFixed(3);
        cardEl.style.zIndex = String(Math.round(depthFactor * 100));
        cardEl.style.pointerEvents = opacity < 0.12 ? 'none' : 'auto';
      }
    },
    [items.length, viewportMode],
  );

  useEffect(() => {
    if (count === 0) return undefined;

    if (prefersReducedMotion) {
      currentOffsetRef.current = targetOffsetRef.current;
      applyOrbitalTransforms(currentOffsetRef.current);
      return undefined;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const target = targetOffsetRef.current;
      const current = currentOffsetRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.0008) {
        const lerpAlpha = 1 - Math.exp(-9.5 * dt);
        currentOffsetRef.current = current + diff * lerpAlpha;
      } else {
        currentOffsetRef.current = target;
      }

      applyOrbitalTransforms(currentOffsetRef.current);

      const nearestIdx = clampIndex(Math.round(currentOffsetRef.current), count);
      if (nearestIdx !== activeIndexRef.current) {
        activeIndexRef.current = nearestIdx;
        setActiveIndex(nearestIdx);
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [count, prefersReducedMotion, applyOrbitalTransforms]);

  const navigateByDelta = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      targetOffsetRef.current += delta;
      if (prefersReducedMotion) {
        currentOffsetRef.current = targetOffsetRef.current;
        const nextIdx = clampIndex(Math.round(targetOffsetRef.current), count);
        activeIndexRef.current = nextIdx;
        setActiveIndex(nextIdx);
        applyOrbitalTransforms(currentOffsetRef.current);
      }
    },
    [count, prefersReducedMotion, applyOrbitalTransforms],
  );

  const navigateToIndex = useCallback(
    (targetIdx: number) => {
      if (count <= 1) return;
      const currentRounded = Math.round(targetOffsetRef.current);
      const currentWrapped = clampIndex(currentRounded, count);
      const shortestDelta = normalizeCircularOffset(targetIdx - currentWrapped, count);
      targetOffsetRef.current = currentRounded + shortestDelta;

      if (prefersReducedMotion) {
        currentOffsetRef.current = targetOffsetRef.current;
        activeIndexRef.current = targetIdx;
        setActiveIndex(targetIdx);
        applyOrbitalTransforms(currentOffsetRef.current);
      }
    },
    [count, prefersReducedMotion, applyOrbitalTransforms],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || e.button !== 0) return;
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('a, button')) return;

    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: targetOffsetRef.current,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 6) drag.moved = true;

    if (!drag.moved && Math.abs(dy) > Math.abs(dx) + 8) {
      drag.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      return;
    }

    const pxPerStep = viewportMode === 'mobile' ? 140 : 210;
    targetOffsetRef.current = drag.startOffset - dx / pxPerStep;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    drag.active = false;
    try {
      if (drag.pointerId !== null) {
        e.currentTarget.releasePointerCapture(drag.pointerId);
      }
    } catch {
      // Ignore
    }
    targetOffsetRef.current = Math.round(targetOffsetRef.current);
    if (prefersReducedMotion) {
      currentOffsetRef.current = targetOffsetRef.current;
      const nextIdx = clampIndex(targetOffsetRef.current, count);
      activeIndexRef.current = nextIdx;
      setActiveIndex(nextIdx);
      applyOrbitalTransforms(currentOffsetRef.current);
    }
  };

  useEffect(() => {
    const viewportEl = orbitViewportRef.current;
    if (!viewportEl || count <= 1 || prefersReducedMotion) return undefined;

    const onWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const dominantDelta = absX > absY ? e.deltaX : e.deltaY;
      if (Math.abs(dominantDelta) < 4) return;

      const currentIdx = activeIndexRef.current;
      const scrollingForward = dominantDelta > 0;

      if (absY >= absX) {
        if (scrollingForward && currentIdx >= count - 1) return;
        if (!scrollingForward && currentIdx <= 0) return;
      }

      e.preventDefault();
      wheelAccumRef.current += dominantDelta;

      if (wheelResetTimerRef.current) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
      wheelResetTimerRef.current = window.setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 180);

      if (Math.abs(wheelAccumRef.current) >= 52) {
        navigateByDelta(wheelAccumRef.current > 0 ? 1 : -1);
        wheelAccumRef.current = 0;
      }
    };

    viewportEl.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      viewportEl.removeEventListener('wheel', onWheel);
      if (wheelResetTimerRef.current) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    };
  }, [count, prefersReducedMotion, navigateByDelta]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      navigateByDelta(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigateByDelta(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      navigateToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      navigateToIndex(count - 1);
    }
  };

  const activeItem = items[activeIndex] ?? items[0];

  if (!activeItem) return null;

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Interactive 3D circular project gallery"
      onKeyDown={handleKeyDown}
      className="relative mt-10 sm:mt-12 rounded-2xl focus-visible:outline-2 focus-visible:outline-[#D68C76]"
    >
      {/* Top Status & Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#C7B8A6]/25">
        <div className="flex items-center gap-3 font-mono-tech text-xs text-[#C7B8A6]">
          <Compass className="w-4 h-4 text-[#D68C76]" aria-hidden="true" />
          <span className="text-[#F2EFE8] font-semibold tabular-nums">
            {String(activeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="hidden sm:inline">
            Drag, wheel, arrows, or select a project node to orbit
          </span>
          <span className="sm:hidden">Swipe or tap controls to orbit</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateByDelta(-1)}
            disabled={count <= 1}
            aria-label="Previous project in circular gallery"
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#0B1320] hover:bg-[#151E32] disabled:opacity-40 border border-[#C7B8A6]/35 hover:border-[#D68C76]/75 text-[#F2EFE8] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigateByDelta(1)}
            disabled={count <= 1}
            aria-label="Next project in circular gallery"
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#0B1320] hover:bg-[#151E32] disabled:opacity-40 border border-[#C7B8A6]/35 hover:border-[#D68C76]/75 text-[#F2EFE8] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 3D Orbital Stage */}
      <div
        ref={orbitViewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-[470px] sm:h-[510px] lg:h-[540px] w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
        style={{
          perspective: viewportMode === 'desktop' ? '1450px' : viewportMode === 'tablet' ? '1150px' : '900px',
        }}
      >
        {/* Architectural SVG Circular Ring Backdrop */}
        <svg
          aria-hidden="true"
          viewBox="0 0 800 500"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-65"
        >
          <g ref={ringRef} style={{ transformOrigin: '400px 250px' }}>
            <ellipse
              cx="400"
              cy="250"
              rx="340"
              ry="135"
              fill="none"
              stroke="#C7B8A6"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeDasharray="5 10"
            />
            <ellipse
              cx="400"
              cy="250"
              rx="255"
              ry="96"
              fill="none"
              stroke="#B46A55"
              strokeOpacity="0.45"
              strokeWidth="1.1"
            />
            <circle cx="400" cy="385" r="3.5" fill="#D68C76" fillOpacity="0.95" />
            <circle cx="400" cy="115" r="3" fill="#C7B8A6" fillOpacity="0.75" />
          </g>
        </svg>

        {/* Orbital Project Cards */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            const hasImage = Boolean(item.imageUrl) && !failedImages[item.id];
            const detailHref = item.detailSlug
              ? `/work/${encodeURIComponent(item.detailSlug)}`
              : null;
            const safeGithub = isSafeHttpUrl(item.githubUrl) ? item.githubUrl : null;
            const safeLive = isSafeHttpUrl(item.liveUrl) ? item.liveUrl : null;

            const handleOpenDetail = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!item.detailSlug) return;
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              onOpenProject(item.detailSlug);
            };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (!dragStateRef.current.moved && !isActive) {
                    navigateToIndex(idx);
                  }
                }}
                className={`absolute w-[290px] sm:w-[370px] lg:w-[430px] rounded-2xl border transition-[border-color,box-shadow] duration-300 ${
                  isActive
                    ? 'bg-[#0B1320] border-[#D68C76]/85 shadow-[0_34px_70px_-24px_rgba(4,7,14,0.92)]'
                    : 'bg-[#131C30]/95 border-[#C7B8A6]/30 hover:border-[#D68C76]/55 shadow-[0_22px_44px_-24px_rgba(4,7,14,0.8)] cursor-pointer'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform, opacity',
                }}
              >
                {/* Warm Terracotta Top Bevel */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-8 top-0 h-[1.5px] transition-opacity duration-300 bg-gradient-to-r from-transparent via-[#B46A55] to-transparent ${
                    isActive ? 'opacity-100' : 'opacity-30'
                  }`}
                />

                {/* Project Media / Sculptural Repository Preview */}
                <div className="p-3 sm:p-4 pb-0">
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#070C16] border border-[#C7B8A6]/20">
                    {hasImage && item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={`${item.title} preview`}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isActive ? 'scale-100' : 'scale-105'
                        }`}
                        draggable={false}
                      />
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-5 bg-[radial-gradient(circle_at_50%_35%,rgba(180,106,85,0.24),#070C16_74%)]">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 280 140"
                          className="absolute inset-0 w-full h-full opacity-45"
                        >
                          <circle
                            cx="140"
                            cy="70"
                            r="56"
                            fill="none"
                            stroke="#C7B8A6"
                            strokeOpacity="0.4"
                            strokeDasharray="3 6"
                          />
                          <circle
                            cx="140"
                            cy="70"
                            r="36"
                            fill="none"
                            stroke="#D68C76"
                            strokeOpacity="0.4"
                          />
                        </svg>
                        <div className="relative z-10 w-11 h-11 rounded-xl bg-[#0B1320] border border-[#C7B8A6]/40 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-[#D68C76]" aria-hidden="true" />
                        </div>
                        <span className="relative z-10 mt-2.5 font-mono-tech text-[11px] text-[#F2EFE8] truncate max-w-full">
                          {item.title}
                        </span>
                      </div>
                    )}

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070C16]/85 via-transparent to-transparent"
                    />
                    <div className="absolute left-3 right-3 bottom-2.5 flex items-center justify-between text-[11px] font-mono-tech text-[#F2EFE8]">
                      <span className="text-[#D68C76] font-semibold tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[#C7B8A6]">
                        {item.statusLabel} · {item.yearLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content + Refined Active Reveal */}
                <div className="p-5 sm:p-6">
                  <h3 className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#F2EFE8] truncate">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 font-mono-tech text-[11px] sm:text-xs text-[#D68C76] truncate">
                    {item.technologies.join(' · ')}
                  </p>

                  {/* Expanded Active Details with smooth opacity/height reveal */}
                  <div
                    className={`transition-all duration-300 ease-out overflow-hidden ${
                      isActive ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
                    }`}
                    aria-hidden={!isActive}
                  >
                    <p className="text-xs sm:text-sm text-[#DED8CE] leading-relaxed line-clamp-3">
                      {item.description}
                    </p>

                    <div className="mt-4 pt-3.5 border-t border-[#C7B8A6]/20 flex flex-wrap items-center justify-between gap-3">
                      {detailHref ? (
                        <a
                          href={detailHref}
                          onClick={handleOpenDetail}
                          tabIndex={isActive ? 0 : -1}
                          className="group/btn inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-[#F2EFE8] text-xs font-semibold transition-colors"
                        >
                          <span>Explore Project</span>
                          <ArrowRight
                            className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </a>
                      ) : safeGithub ? (
                        <a
                          href={safeGithub}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={isActive ? 0 : -1}
                          className="group/btn inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#B46A55] hover:bg-[#9A4F3A] text-[#F2EFE8] text-xs font-semibold transition-colors"
                        >
                          <span>Inspect Repository</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      ) : null}

                      <div className="flex items-center gap-3 text-xs">
                        {detailHref && safeGithub && (
                          <a
                            href={safeGithub}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={isActive ? 0 : -1}
                            className="inline-flex items-center gap-1 font-medium text-[#C7B8A6] hover:text-[#D68C76]"
                          >
                            <span>GitHub</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                        {safeLive && (
                          <a
                            href={safeLive}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={isActive ? 0 : -1}
                            className="inline-flex items-center gap-1 font-medium text-[#D68C76] hover:underline"
                          >
                            <span>Live Demo</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isActive && (
                    <p className="mt-2 font-mono-tech text-[11px] text-[#C7B8A6]">
                      Select to bring into focus
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Interactive Orbital Index Selector */}
      <div
        role="tablist"
        aria-label="Select project on circular orbit"
        className="mt-4 pt-5 border-t border-[#C7B8A6]/25 flex flex-wrap items-center justify-center gap-2"
      >
        {items.map((item, idx) => {
          const isCurrent = idx === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => navigateToIndex(idx)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg font-mono-tech text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                isCurrent
                  ? 'bg-[#F2EFE8] dark:bg-[#B46A55] text-[#0B1320] dark:text-[#F2EFE8] border-[#F2EFE8] dark:border-[#D68C76] shadow-sm'
                  : 'bg-[#0B1320] text-[#C7B8A6] border-[#C7B8A6]/30 hover:border-[#D68C76]/65 hover:text-[#F2EFE8]'
              }`}
            >
              <span
                className={`tabular-nums font-semibold ${
                  isCurrent ? 'text-[#9A4F3A] dark:text-[#F2EFE8]' : 'text-[#D68C76]'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="max-w-[130px] truncate">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
