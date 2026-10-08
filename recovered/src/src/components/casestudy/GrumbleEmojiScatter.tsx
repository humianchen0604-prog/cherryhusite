'use client';

import { useEffect, useRef } from 'react';

/**
 * The falling/draggable emoji canvas behind the hero phone mockups on
 * cherryhu.com/grumble (its own implementation is bundled inside a compiled
 * Framer component with no exposed library or image assets — canvas draw
 * calls only, no network requests for the glyphs — so this reimplements the
 * same user-facing effect from scratch rather than reverse-engineering their
 * bundle): food emoji drop in from above, settle into a loose pile under
 * gravity, and can be grabbed and flung anywhere in the frame.
 *
 * Physics is a small hand-rolled circle simulation (gravity, floor/wall
 * bounce with damping, pairwise separation so bodies don't overlap) rather
 * than a full engine — nine bodies doesn't need one, and it keeps this
 * decorative background from pulling in a new dependency.
 */

const EMOJI = ['🍔', '🍣', '🍕', '🌮', '🍩', '🥐', '🍜', '🧋', '🍟', '🍰', '🥯', '🍪', '🍫', '🥤'];

type Body = {
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rotation: number;
  vr: number;
  dragging: boolean;
  /** Once true, gravity/integration/collision stop touching this body at
   * all — with 18 bodies piled into a frame that isn't tall enough to fit
   * them all without some overlap, a purely velocity-based rest threshold
   * never actually reaches zero: the separation step keeps nudging bodies
   * that are still geometrically forced to overlap, forever. Freezing a
   * body outright once it's slow enough is what actually stops that —
   * remaining overlap with already-settled neighbors is just left as
   * natural clutter instead of endlessly fought over. */
  settled: boolean;
};

const GRAVITY = 1500; // px/s^2
const BOUNCE = 0.42; // fraction of speed kept when a still-falling body clips a side wall
/** Fraction of impact speed returned on each landing bounce. Tuned so a body
 * dropped from above the frame gets ~3 visible bounces (roughly 1200 -> 420
 * -> 147 -> 51 px/s) over about 0.8s before it comes to rest. */
const RESTITUTION = 0.35;
/** Horizontal/spin damping applied on each impact, so a bouncing body loses
 * its sideways drift and doesn't skate along the floor between bounces. */
const IMPACT_FRICTION = 0.72;
/** Rebound speed below which a body stops bouncing and freezes for good.
 * Without a floor like this the bounce sequence approaches zero but never
 * reaches it, which is exactly the never-settling jitter this component had
 * before. */
const SLEEP_SPEED = 60; // px/s
/** Opacity every emoji is drawn at, falling or settled. */
const EMOJI_ALPHA = 0.4;

export default function GrumbleEmojiScatter() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    const bodies: Body[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const prevWidth = width;
      width = rect.width;
      height = rect.height; // canvas now fills the wrap fully — the floor sits at the frame's bottom edge
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (prevWidth > 0 && width !== prevWidth) {
        const scale = width / prevWidth;
        for (const b of bodies) {
          b.x *= scale;
          b.r *= scale;
        }
      }
    };

    const spawn = () => {
      bodies.length = 0;
      const count = 18;
      for (let i = 0; i < count; i++) {
        const r = width * (0.045 + Math.random() * 0.02);
        bodies.push({
          emoji: EMOJI[i % EMOJI.length],
          x: (width / (count + 1)) * (i + 1) + (Math.random() * 30 - 15),
          y: -60 - Math.random() * 500,
          vx: (Math.random() - 0.5) * 60,
          vy: 0,
          r,
          rotation: (Math.random() - 0.5) * 0.6,
          vr: (Math.random() - 0.5) * 0.6,
          dragging: false,
          settled: false,
        });
      }
    };

    resize();
    spawn();

    let dragged: Body | null = null;
    let lastPointer = { x: 0, y: 0, t: 0 };
    let flingVel = { x: 0, y: 0 };

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (dragged) return; // one drag at a time — ignore a second touch mid-drag
      const p = toLocal(e);
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        if (dx * dx + dy * dy <= b.r * b.r) {
          dragged = b;
          b.dragging = true;
          b.settled = false;
          canvas.setPointerCapture(e.pointerId);
          lastPointer = { x: p.x, y: p.y, t: performance.now() };
          flingVel = { x: 0, y: 0 };
          break;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragged) return;
      const p = toLocal(e);
      const now = performance.now();
      const dt = Math.max(1, now - lastPointer.t);
      flingVel = {
        x: ((p.x - lastPointer.x) / dt) * 1000,
        y: ((p.y - lastPointer.y) / dt) * 1000,
      };
      dragged.x = p.x;
      dragged.y = p.y;
      lastPointer = { x: p.x, y: p.y, t: now };
    };

    const endDrag = () => {
      if (!dragged) return;
      dragged.vx = flingVel.x;
      dragged.vy = flingVel.y;
      dragged.dragging = false;
      dragged = null;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // One flat alpha for every body, set once here rather than varying per
      // body or per position, so an emoji looks identical while it's falling
      // and after it lands.
      ctx.globalAlpha = EMOJI_ALPHA;
      for (const b of bodies) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.font = `${b.r * 1.7}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.emoji, 0, 0);
        ctx.restore();
      }
    };

    if (reduced) {
      // Settle in place with no motion at all rather than skip a shorter
      // animation — this is decorative and easy to make someone feel sick.
      const count = bodies.length;
      bodies.forEach((b, i) => {
        b.y = height - b.r - 6;
        b.x = (width / (count + 1)) * (i + 1);
        b.rotation = 0;
      });
      draw();
      return () => {
        ro.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
      };
    }

    let raf = 0;
    let last = performance.now();
    let running = false;

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      // A settled body's x/y is never written again by anything below —
      // that's the whole fix. The old version kept re-running a pairwise
      // "push apart" correction on every body every frame, including ones
      // that had already come to rest; with 18 bodies in a frame that isn't
      // tall enough to lay them all out on the true floor, some are always
      // resting on a neighbor instead of the floor, so that ongoing
      // correction never converged — it just kept nudging things sideways
      // forever, which read as jumping/squeezing. Landing is now a single
      // one-time event per body: the instant it touches the floor or an
      // already-settled neighbor, it's snapped to the contact point, frozen,
      // and left alone for good. Two still-falling bodies can still nudge
      // each other in mid-air (neither has landed yet, so no visible
      // "settled thing jumped" effect), but nothing landed ever moves again.
      for (const b of bodies) {
        if (b === dragged || b.settled) continue;

        b.vy += GRAVITY * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rotation += b.vr * dt;

        if (b.x - b.r < 0) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * BOUNCE;
        } else if (b.x + b.r > width) {
          b.x = width - b.r;
          b.vx = -Math.abs(b.vx) * BOUNCE;
        }

        // Landing on the floor: sit exactly on it, then bounce back up with
        // a fraction of the impact speed. Once that rebound is too small to
        // read as a bounce, the body freezes for good.
        if (b.y + b.r > height) {
          b.y = height - b.r;
          const rebound = Math.abs(b.vy) * RESTITUTION;
          if (rebound < SLEEP_SPEED) {
            b.settled = true;
            b.vx = 0;
            b.vy = 0;
            b.vr = 0;
          } else {
            b.vy = -rebound;
            b.vx *= IMPACT_FRICTION;
            b.vr *= IMPACT_FRICTION;
          }
          continue;
        }

        // Landing on something that has already settled. Same deal, but the
        // bounce is reflected about the contact normal so a body that clips
        // the shoulder of a neighbor kicks off sideways rather than straight
        // up. A settled body is treated as immovable — it is never pushed
        // back, which is what keeps the pile from shuffling.
        for (const o of bodies) {
          if (o === b || !o.settled) continue;
          const dx = b.x - o.x;
          const dy = b.y - o.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const minDist = b.r + o.r;
          if (dist >= minDist) continue;

          const nx = dx / dist;
          const ny = dy / dist;
          b.x = o.x + nx * minDist;
          b.y = o.y + ny * minDist;

          // Velocity component heading into the neighbor, reflected back out.
          const into = b.vx * nx + b.vy * ny;
          const rebound = Math.abs(into) * RESTITUTION;
          if (rebound < SLEEP_SPEED) {
            b.settled = true;
            b.vx = 0;
            b.vy = 0;
            b.vr = 0;
          } else {
            b.vx = (b.vx - 2 * into * nx) * IMPACT_FRICTION;
            b.vy = (b.vy - 2 * into * ny) * IMPACT_FRICTION;
            b.vr *= IMPACT_FRICTION;
          }
          break;
        }
      }

      // Two bodies that are both still falling can still overlap mid-air;
      // nudge them apart symmetrically. Neither is settled, so this never
      // touches anything that's already landed.
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        if (a === dragged || a.settled) continue;
        for (let j = i + 1; j < bodies.length; j++) {
          const c = bodies[j];
          if (c === dragged || c.settled) continue;
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const minDist = a.r + c.r;
          if (dist >= minDist) continue;
          const pen = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * (pen / 2);
          a.y -= ny * (pen / 2);
          c.x += nx * (pen / 2);
          c.y += ny * (pen / 2);
        }
      }

      draw();
      if (running) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !running) {
            running = true;
            last = performance.now();
            raf = requestAnimationFrame(step);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        }
      },
      { rootMargin: '100px 0px' },
    );
    io.observe(wrap);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, []);

  return (
    <div className="grumble-emoji-scatter" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="grumble-emoji-scatter__canvas" />
      <div className="grumble-emoji-scatter__fade" />
      <div className="grumble-emoji-scatter__blur" />
    </div>
  );
}
