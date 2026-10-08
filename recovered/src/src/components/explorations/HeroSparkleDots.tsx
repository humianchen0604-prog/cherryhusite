'use client';

import { useEffect, useRef } from 'react';
import './heroDeco.css';
import { TULIP_DOTS, TULIP_H, TULIP_W } from './heroTulipDots';

/**
 * "Sparkle dots": the standalone tulip prototype (_playground/tulip-dots,
 * "03 Twinkle, with bloom", Loop mode), placed where the hero tulip sits.
 *
 * On a loop: grey → the pixels flicker on in Blush while both heads bloom
 * open → the petals breathe at full colour → fade back to grey → short
 * rest → again. Click or tap replays it. Unlike HeroTulip there's no landing
 * sequence and no hover hold, and it keeps the prototype's gentler bloom.
 *
 * Pauses while scrolled away or the tab is hidden. Reduced motion shows the
 * grey tulip, and full colour while hovered, with no movement.
 */

const TW_SPREAD = 220; // window over which dots start twinkling
const TW_LEN = 180; // how long one dot flickers before settling
const TW_STEPS = 4; // on/off flickers per dot
const BLOOM_IN = 900; // petals opening, starts together with the twinkle
const BREATHE = 2800; // one slow breath while held open
const HOLD = 4200; // time held at full colour (bloom included)
const OUT = 700; // fade back to grey (petals close)
const REST = 900; // grey pause before the next play

const PAD = 16;
const VW = TULIP_W + PAD * 2;
const VH = TULIP_H + PAD * 2;
const GHOST = 0.2; // grey left behind while colour twinkles in
const CORNER = 1; // pixel corner radius, in CSS px

type RGB = [number, number, number];
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const backOut = (k: number, s = 1.2) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const WHITE: RGB = [255, 255, 255];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Blush: [deep, light] per region
const BLUSH = { r: ['#F4A3BA', '#FCD9E3'], l: ['#F7B399', '#FDE0D2'], g: ['#8CC79A', '#D2EDCB'] };

// Each head opens around its base, fanning out along its own axis.
const HEADS = [
  { base: { x: 190, y: 152 }, tip: { x: 192, y: 28 } }, // right, upright
  { base: { x: 108, y: 214 }, tip: { x: 52, y: 118 } }, // left, tilted
];

type Dot = { x: number; y: number; h: number; col: RGB; cs: string; bx: number; by: number; br: number };

const DOTS: Dot[] = (() => {
  const rand = mulberry32(11);
  return TULIP_DOTS.map(([x, y, r, reg]) => {
    const j = rand();
    let t: number;
    if (reg === 2) t = 1 - clamp((y - 150) / 250); // greens deepen toward the root
    else t = clamp(Math.hypot(x - HEADS[reg].base.x, y - HEADS[reg].base.y) / (reg ? 135 : 125));
    t = clamp(t + (j - 0.5) * 0.3);
    const pair = [BLUSH.r, BLUSH.l, BLUSH.g][reg];
    const col = mix(hex(pair[0]), hex(pair[1]), t);
    // Petals flare sideways more toward the tips and lift a touch along the axis.
    let bx = 0;
    let by = 0;
    let br = 1;
    if (reg !== 2) {
      const { base, tip } = HEADS[reg];
      const len = Math.hypot(tip.x - base.x, tip.y - base.y);
      const ux = (tip.x - base.x) / len;
      const uy = (tip.y - base.y) / len;
      const nx = -uy;
      const ny = ux;
      const along = Math.max(0, (x - base.x) * ux + (y - base.y) * uy);
      const lat = (x - base.x) * nx + (y - base.y) * ny;
      const reach = clamp(along / len);
      bx = nx * lat * 0.3 * reach + ux * along * 0.06;
      by = ny * lat * 0.3 * reach + uy * along * 0.06;
      br = 1 + 0.1 * reach;
    }
    return { x, y, h: (r * Math.sqrt(Math.PI)) / 2, col, cs: rgb(col), bx, by, br };
  });
})();

// Opens with a soft overshoot, then breathes between ~88% and 100% open.
function bloomAt(tb: number) {
  const open = backOut(clamp(tb / BLOOM_IN));
  const breath = tb > BLOOM_IN ? (1 - Math.cos(((tb - BLOOM_IN) / BREATHE) * Math.PI * 2)) / 2 : 0;
  return open - 0.12 * breath;
}

export default function HeroSparkleDots() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrap || !canvas || !ctx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const N = DOTS.length;
    const starts = new Float32Array(N);
    const phases = new Uint8Array(N);
    const DUR = TW_SPREAD + TW_LEN;

    let scale = 0;
    let corner = 1;
    let grey = '#c8c8c8';
    // rest → in (twinkle) → hold (full colour, breathing) → out → rest → …
    let phase: 'rest' | 'in' | 'hold' | 'out' = 'rest';
    let t0 = performance.now();
    let playT0 = 0;
    let frozenT = 0;
    let frozenB = 0;
    let hovered = false;
    let raf = 0;
    let visible = true;

    const readGrey = () => {
      grey = getComputedStyle(wrap).getPropertyValue('--hero-tulip-grey').trim() || grey;
    };

    const square = (x: number, y: number, h: number) => {
      const rad = Math.min(corner, h * 0.4);
      if (ctx.roundRect) ctx.roundRect(x - h, y - h, h * 2, h * 2, rad);
      else ctx.rect(x - h, y - h, h * 2, h * 2);
    };

    const drawDot = (d: Dot, fill: string, a: number, s: number, b: number) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = fill;
      ctx.beginPath();
      square(d.x + d.bx * b, d.y + d.by * b, d.h * s * lerp(1, d.br, b));
      ctx.fill();
    };

    const paint = (now: number) => {
      if (!scale) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, PAD * scale, PAD * scale);
      ctx.globalAlpha = 1;

      if (reduced.matches) {
        if (hovered) for (const d of DOTS) drawDot(d, d.cs, 1, 1, 0);
        else {
          ctx.fillStyle = grey;
          ctx.beginPath();
          for (const d of DOTS) square(d.x, d.y, d.h);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }

      if (phase === 'rest') {
        ctx.fillStyle = grey;
        ctx.beginPath();
        for (const d of DOTS) square(d.x, d.y, d.h);
        ctx.fill();
        return;
      }

      if (phase === 'hold') {
        const b = bloomAt(now - playT0);
        for (const d of DOTS) drawDot(d, d.cs, 1, 1, b);
        ctx.globalAlpha = 1;
        return;
      }

      // "in" plays the twinkle; "out" freezes it and crossfades to grey
      const inPhase = phase === 'in';
      const t = inPhase ? now - t0 : frozenT;
      const e = inPhase ? 0 : easeInOut(clamp((now - t0) / OUT));
      const b = inPhase ? bloomAt(t) : frozenB * (1 - e);
      const dim = lerp(1, GHOST, clamp(t / 120));
      for (let i = 0; i < N; i++) {
        const d = DOTS[i];
        let a = 0;
        let s = 1;
        let c: RGB | null = null;
        const k = clamp((t - starts[i]) / TW_LEN);
        if (k > 0.8) a = 1;
        else if (k > 0) {
          const on = (Math.floor(k * TW_STEPS) + phases[i]) % 2 === 0;
          a = on ? 0.45 + 0.55 * k : 0.1;
          s = on ? 1.1 : 0.7;
          c = mix(d.col, WHITE, 0.45 * (1 - k));
        }
        const g0 = dim * (1 - a);
        const g = g0 + (1 - g0) * e;
        if (g > 0.003) {
          ctx.globalAlpha = g;
          ctx.fillStyle = grey;
          ctx.beginPath();
          square(d.x, d.y, d.h);
          ctx.fill();
        }
        const ca = a * (1 - e);
        if (ca > 0.003) drawDot(d, c ? rgb(c) : d.cs, ca, lerp(s, 1, e), b);
      }
      ctx.globalAlpha = 1;
    };

    const play = (now: number) => {
      for (let i = 0; i < N; i++) {
        starts[i] = Math.random() * TW_SPREAD;
        phases[i] = (Math.random() * 3) | 0;
      }
      phase = 'in';
      t0 = playT0 = now;
    };

    const tick = (now: number) => {
      const t = now - t0;
      if (phase === 'in' && t >= DUR) {
        phase = 'hold';
        t0 = now;
      } else if (phase === 'hold' && t >= HOLD) {
        frozenT = DUR;
        frozenB = bloomAt(now - playT0);
        phase = 'out';
        t0 = now;
      } else if (phase === 'out' && t >= OUT) {
        phase = 'rest';
        t0 = now;
      } else if (phase === 'rest' && t >= REST) {
        play(now);
      }
      paint(now);
    };

    const running = () => !reduced.matches && visible && !document.hidden;
    const frame = (now: number) => {
      raf = 0;
      tick(now);
      if (running()) raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      if (running()) {
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onClick = () => {
      if (reduced.matches) return;
      play(performance.now());
      sync();
    };
    const onEnter = () => {
      hovered = true;
      if (reduced.matches) paint(performance.now());
    };
    const onLeave = () => {
      hovered = false;
      if (reduced.matches) paint(performance.now());
    };
    wrap.addEventListener('click', onClick);
    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = canvas.clientWidth;
      if (!w) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(((w * VH) / VW) * dpr);
      scale = (w / VW) * dpr;
      corner = (CORNER * VW) / w;
      paint(performance.now());
    };

    readGrey();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(wrap);

    const themeObserver = new MutationObserver(() => {
      readGrey();
      paint(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const onReducedChange = () => {
      paint(performance.now());
      sync();
    };
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', onReducedChange);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      wrap.removeEventListener('click', onClick);
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', onReducedChange);
    };
  }, []);

  return (
    <div ref={wrapRef} className="hero-tulip" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
