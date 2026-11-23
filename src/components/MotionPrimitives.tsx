import React, { useEffect, useRef, useState } from 'react';

export function useInView(options?: { threshold?: number; rootMargin?: string }): {
  ref: React.RefObject<HTMLDivElement | null>;
  inView: boolean;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
    if (typeof IntersectionObserver === 'undefined') return true;
    return false;
  });

  useEffect(() => {
    if (inView) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? '0px 0px -36px 0px',
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, options?.threshold, options?.rootMargin]);

  return { ref, inView };
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: 'up' | 'scale' | 'fade' | 'left' | 'right';
}

const DELAY_CLASS_MAP: Record<number, string> = {
  0: 'delay-0',
  75: 'delay-75',
  150: 'delay-150',
  200: 'delay-200',
  300: 'delay-300',
};

const VARIANT_CLASS_MAP: Record<NonNullable<RevealProps['variant']>, string> = {
  up: '',
  scale: 'reveal-scale',
  fade: 'reveal-fade',
  left: 'reveal-left',
  right: 'reveal-right',
};

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delayMs = 0,
  variant = 'up',
}) => {
  const { ref, inView } = useInView();
  const variantClass = VARIANT_CLASS_MAP[variant] ?? '';
  const delayClass = DELAY_CLASS_MAP[delayMs] ?? 'delay-0';

  return (
    <div
      ref={ref}
      className={`reveal-base ${variantClass} ${delayClass} ${inView ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Lightweight, rAF-throttled compositor-only vertical parallax for subtle background geometry.
 * Never triggers layout recalculations or React state updates while scrolling.
 */
export function useScrollParallax(
  containerRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<HTMLElement | null>,
  speed = 0.14,
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const container = containerRef.current;
      const target = targetRef.current;
      if (!container || !target) return;

      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight || 800;
      if (rect.bottom < -120 || rect.top > viewportH + 120) return;

      const centerOffset = rect.top + rect.height / 2 - viewportH / 2;
      const shiftY = Math.max(-44, Math.min(44, -centerOffset * speed));
      target.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [containerRef, targetRef, speed]);
}

/**
 * Controlled 3D perspective & subtle spotlight coordinate controller for desktop pointer hover.
 * Disabled cleanly on touch devices or reduced-motion preferences.
 */
export function useCardTilt(maxDeg = 2.0) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined') return;
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const node = cardRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const rotateY = (px - 0.5) * (maxDeg * 2);
    const rotateX = -(py - 0.5) * (maxDeg * 2);

    node.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -4px, 0)`;

    if (spotRef.current) {
      spotRef.current.style.opacity = '1';
      spotRef.current.style.background = `radial-gradient(520px circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(77, 182, 172, 0.11), transparent 58%)`;
    }
  };

  const onPointerLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = '';
    }
    if (spotRef.current) {
      spotRef.current.style.opacity = '0';
    }
  };

  return { cardRef, spotRef, onPointerMove, onPointerLeave };
}
