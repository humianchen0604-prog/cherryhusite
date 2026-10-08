'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react';

/**
 * React Bits ClickSpark (JS-CSS). Sparks at the pointer on click.
 * https://reactbits.dev/animations/click-spark
 *
 * Clicks on existing hover/press targets (links, buttons, cards, photos) are
 * ignored — the burst is only for empty page surface.
 */

type Spark = {
  x: number;
  y: number;
  angle: number;
  startTime: number;
  /* Fixed at click time, not per frame: the footer is a dark band on an
     otherwise light page, so two bursts alive at once can need different
     colours. */
  color: string;
};

type ClickSparkProps = {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-in-out' | 'ease-out';
  extraScale?: number;
  children?: ReactNode;
};

export const INTERACTIVE =
  'a, button, input, textarea, select, summary, iframe, video, audio, label, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="switch"], [role="checkbox"], [data-framer-cursor="pointer"], .project-card, .side-photo, .experience-row, .intro-lines__link, .about-heading__link, .asb-art, .book3d-stage, .footer_socials li, .copy-email-pill';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target.closest(INTERACTIVE)) return true;
  let el: Element | null = target;
  while (el && el !== document.documentElement) {
    const cursor = getComputedStyle(el).cursor;
    if (cursor === 'pointer' || cursor === 'grab' || cursor === 'grabbing') return true;
    el = el.parentElement;
  }
  return false;
}

/** Light mode: white vanishes on the page, so invert to near-black.
 *  Night mode: same burst, butter-yellow stroke instead of white. */
const BUTTER_YELLOW = '#F5E6A3';

/* Bands that are dark whatever the theme, so a near-black burst would vanish
   inside them. */
const ALWAYS_DARK = '.footer_reveal, .casestudy-root';

function sparkColorAt(target: EventTarget | null, configured: string) {
  if (target instanceof Element && target.closest(ALWAYS_DARK)) return '#ffffff';
  return strokeColor(configured);
}

function strokeColor(configured: string) {
  const dark = document.documentElement.dataset.theme === 'dark';
  const c = configured.trim().toLowerCase();
  const isWhite = c === '#fff' || c === '#ffffff' || c === 'white';
  if (dark) return isWhite ? BUTTER_YELLOW : configured;
  if (isWhite) return '#111111';
  return configured;
}

export default function ClickSpark({
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };

    resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case 'linear':
          return t;
        case 'ease-in':
          return t * t;
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const eased = easeFunc(progress);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = spark.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;
    // The night cursor brings its own click burst; don't draw two.
    if (document.documentElement.dataset.nightCursor) return;
    if (isInteractiveTarget(e.target)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();
    const color = sparkColorAt(e.target, sparkColor);
    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now,
      color,
    }));
    sparksRef.current.push(...newSparks);
  };

  return (
    <div className="click-spark" onClick={handleClick}>
      <canvas ref={canvasRef} aria-hidden="true" className="click-spark__canvas" />
      {children}
    </div>
  );
}
