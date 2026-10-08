'use client';

import { useEffect, useRef } from 'react';

/**
 * A canvas grid of small dots that bulges and brightens near the cursor —
 * background texture for AboutStickerBoard.tsx. Fills and tracks its parent
 * (must be `position: relative`/`absolute`), ignores pointer events itself
 * so it never blocks the stickers dragged on top of it, and listens on the
 * parent instead of the canvas so the hover still reaches it underneath them.
 *
 * `sparkle` (a slow per-dot twinkle) and `waveAmplitude` (a gentle sine drift
 * in each dot's y) are both off by default — turning either on switches the
 * canvas from "redraw on pointer move only" to a continuous rAF loop, so
 * leave them at 0/false unless the motion is wanted.
 */
type DotFieldProps = {
  /** Resting dot radius, px. */
  dotRadius?: number;
  /** Grid spacing, px. */
  dotSpacing?: number;
  /** Extra radius (px) a dot gains at the very centre of the cursor's glow. */
  bulgeStrength?: number;
  /** Radius (px) around the cursor within which dots bulge/brighten. */
  glowRadius?: number;
  /** Per-dot twinkle animation. */
  sparkle?: boolean;
  /** Amplitude (px) of a slow vertical sine drift per dot; 0 disables it. */
  waveAmplitude?: number;
  /** Dot color as `r, g, b`. */
  rgb?: string;
  /** Resting fill alpha (0–1). */
  alpha?: number;
  className?: string;
};

export default function DotField({
  dotRadius = 1.5,
  dotSpacing = 16,
  bulgeStrength = 3,
  glowRadius = 120,
  sparkle = false,
  waveAmplitude = 0,
  rgb = '150, 150, 150',
  alpha: baseAlpha = 0.3,
  className,
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Continuous motion (wave/sparkle) is decorative, so it's cut entirely
    // under reduced motion rather than just slowed.
    const animated = (waveAmplitude > 0 || sparkle) && !reduced;
    const hoverFx = glowRadius > 0 && bulgeStrength > 0;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    const pointer = { x: -9999, y: -9999, active: false };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const cols = Math.ceil(width / dotSpacing) + 1;
      const rows = Math.ceil(height / dotSpacing) + 1;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = col * dotSpacing;
          let y = row * dotSpacing;
          if (waveAmplitude > 0) {
            y += Math.sin(time * 0.0012 + col * 0.4) * waveAmplitude;
          }

          let r = dotRadius;
          let alpha = baseAlpha;
          if (hoverFx && pointer.active) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < glowRadius) {
              const falloff = 1 - dist / glowRadius;
              r = dotRadius + bulgeStrength * falloff * falloff;
              alpha = Math.min(1, baseAlpha + falloff * (1 - baseAlpha));
            }
          }
          if (sparkle) {
            const twinkle = (Math.sin(time * 0.002 + row * 12.9 + col * 7.3) + 1) / 2;
            alpha *= 0.6 + twinkle * 0.4;
          }

          ctx.beginPath();
          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      if (!animated) draw(performance.now());
    };
    const onLeave = () => {
      pointer.active = false;
      if (!animated) draw(performance.now());
    };

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    if (hoverFx) {
      parent.addEventListener('pointermove', onMove);
      parent.addEventListener('pointerleave', onLeave);
    }
    if (animated) raf = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      if (hoverFx) {
        parent.removeEventListener('pointermove', onMove);
        parent.removeEventListener('pointerleave', onLeave);
      }
      if (raf) cancelAnimationFrame(raf);
    };
  }, [dotRadius, dotSpacing, bulgeStrength, glowRadius, sparkle, waveAmplitude, rgb, baseAlpha]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'block' }}
    />
  );
}
