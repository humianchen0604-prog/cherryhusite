'use client';

import { useEffect, useRef, useState } from 'react';
import { illustrated } from './clouds/illustrated';
import { particles } from './clouds/particles';
import type { Pointer, RendererSpec } from './clouds/shared';
import { volumetric } from './clouds/volumetric';
import type { SunsetStyle } from './explorations';
import './sunsetClouds.css';

/**
 * Light-mode counterpart to StarryBackdrop: a sunset sky across the top of the
 * landing page — #CFDBEA graded down to white, with clouds in it.
 *
 * Recovered from the Sep 28 exploration (see _archive/sunset-clouds) for the
 * /explorations page, which passes in the style. Three renderers, all on the
 * same sky and palette:
 *  - volumetric  — raymarched Perlin-Worley clouds (clouds/volumetric.ts)
 *  - illustrated — layered cloud banks (clouds/illustrated.ts)
 *  - particles   — soft billboard puffs (clouds/particles.ts)
 *
 * This file is the shell they share: the band, the canvas, the frame loop,
 * the pointer, and the scroll / theme behaviour. At rest every renderer only
 * breathes; moving the cursor over the band pushes the clouds along with it,
 * and they settle back once it stops.
 *
 * Same scroll behaviour as the stars: full at the top of the page, fading
 * clear across the first ~0.85 viewport. Hidden (and the loop stopped) in dark
 * mode, when scrolled away, or when the tab is hidden. Reduced motion gets a
 * single still frame and no cursor push.
 */

const RENDERERS: Record<SunsetStyle, RendererSpec> = { volumetric, illustrated, particles };

export default function SunsetClouds({ style }: { style: SunsetStyle }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [light, setLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Follow the same data-theme the toggle writes.
  useEffect(() => {
    const read = () => setLight(document.documentElement.dataset.theme !== 'dark');
    read();
    setMounted(true);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Opacity tracks scroll — full at top, clear after ~0.85vh (same curve as the stars).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const range = Math.max(120, window.innerHeight * 0.85);
      const t = Math.min(1, Math.max(0, window.scrollY / range));
      el.style.opacity = String(1 - t * (2 - t));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="sunset-clouds" aria-hidden>
      <div className="sunset-clouds__sky" data-on={light ? '' : undefined}>
        {/* A fresh canvas (and GL context) per style; it fades in over the sky. */}
        {mounted ? <CloudCanvas key={style} spec={RENDERERS[style]} /> : null}
      </div>
    </div>
  );
}

function CloudCanvas({ spec }: { spec: RendererSpec }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = layerRef.current;
    if (!wrap) return;
    // The canvas is made here rather than rendered, so every run of this effect
    // gets its own GL context — releasing one never leaves a dead context behind.
    const canvas = document.createElement('canvas');
    canvas.className = 'sunset-clouds__canvas';
    wrap.appendChild(canvas);

    const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) {
      canvas.remove();
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: ReturnType<RendererSpec['create']>;
    try {
      renderer = spec.create(gl, reduced);
    } catch (err) {
      console.warn('SunsetClouds:', err);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
      return;
    }

    const pointer: Pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, inside: false };
    let W = 0;
    let H = 0;
    let busy = false;

    const draw = (now: number) => {
      busy = renderer.frame(now, pointer);
      // The pointer's velocity dies away once it stops moving.
      pointer.vx *= 0.8;
      pointer.vy *= 0.8;
    };

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, spec.maxDpr);
      const cw = Math.max(1, Math.round(w * dpr));
      const ch = Math.max(1, Math.round(h * dpr));
      if (cw === canvas.width && ch === canvas.height && w === W && h === H) return;
      canvas.width = cw;
      canvas.height = ch;
      W = w;
      H = h;
      renderer.resize(w, h, dpr);
      draw(performance.now());
    };

    let running = false;
    let raf = 0;
    let lastFrame = 0;
    let inView = true;
    const idleGap = 1000 / spec.idleFps - 2;

    const tick = (now: number) => {
      raf = 0;
      if (!running) return;
      // Idle, the sky only breathes — a low frame rate is plenty. Full rate while clouds move.
      const moving = busy || Math.abs(pointer.vx) + Math.abs(pointer.vy) > 0.05;
      if (moving || now - lastFrame > idleGap) {
        draw(now);
        lastFrame = now;
      }
      raf = requestAnimationFrame(tick);
    };

    const shouldRun = () =>
      !reduced && inView && !document.hidden && document.documentElement.dataset.theme !== 'dark';
    const sync = () => {
      if (shouldRun()) {
        if (!running) {
          running = true;
          raf = requestAnimationFrame(tick);
        }
      } else {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      const inside = e.clientY < H && window.scrollY < H;
      if (inside && pointer.inside) {
        pointer.vx = e.clientX - pointer.x;
        pointer.vy = e.clientY - pointer.y;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.inside = inside;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onScroll = () => {
      const next = window.scrollY < window.innerHeight * 0.9;
      if (next !== inView) {
        inView = next;
        sync();
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    onScroll();
    // Fade in once the first frame is on the canvas.
    const fadeIn = requestAnimationFrame(() => setReady(true));
    sync();

    const themeObserver = new MutationObserver(sync);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', sync);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      cancelAnimationFrame(fadeIn);
      ro.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', sync);
      renderer.destroy();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [spec]);

  return <div ref={layerRef} className="sunset-clouds__layer" data-ready={ready ? '' : undefined} />;
}
