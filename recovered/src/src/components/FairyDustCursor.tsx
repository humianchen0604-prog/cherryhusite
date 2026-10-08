'use client';

import { useEffect, useRef } from 'react';

type FairyDustCursorProps = {
  colors?: string[];
  element?: HTMLElement | null;
  /** Kept for API parity with the Cursify demo; particles draw the star SVG path. */
  characterSet?: string[];
  particleSize?: number;
  /** Stars spawned per move step. */
  particleCount?: number;
  /** Hard cap on live particles. */
  maxParticles?: number;
  gravity?: number;
  fadeSpeed?: number;
  initialVelocity?: { min: number; max: number };
  /** Typical cursor travel (px) between spawns — actual gaps jitter for a tapered trail. */
  spawnDistance?: number;
};

type Particle = {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  lifeSpan: number;
  initialLifeSpan: number;
  size: number;
  rotation: number;
  spin: number;
};

/**
 * Four-point sparkle traced from star-trail.png (viewBox 0 0 100 100).
 * Vertically elongated tips, concave waist — same silhouette as the PNG.
 */
const STAR_PATH =
  'M50 3C50.9 29 55.2 43.5 81 50C55.2 56.5 50.9 71 50 97C49.1 71 44.8 56.5 19 50C44.8 43.5 49.1 29 50 3Z';

const starPath2D =
  typeof Path2D !== 'undefined' ? new Path2D(STAR_PATH) : null;

/** Draw the star SVG path filled with `color`, scaled uniformly to `size`. */
function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  if (!starPath2D) return;
  const s = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(s, s);
  ctx.translate(-50, -50);
  ctx.fillStyle = color;
  ctx.fill(starPath2D);
  ctx.restore();
}

export default function FairyDustCursor({
  colors = ['#FFF6C8', '#FFE9A0', '#FFEF8A', '#FFF3B0', '#F5E6A3'],
  element,
  particleSize = 14,
  particleCount = 3,
  maxParticles = 16,
  gravity = 0.008,
  fadeSpeed = 0.948,
  initialVelocity = { min: 0.02, max: 0.14 },
  spawnDistance = 12,
}: FairyDustCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cursorRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const nextGapRef = useRef(spawnDistance);
  const sizeRef = useRef({ width: 0, height: 0 });
  const propsRef = useRef({
    colors,
    particleSize,
    particleCount,
    maxParticles,
    gravity,
    fadeSpeed,
    initialVelocity,
    spawnDistance,
  });
  propsRef.current = {
    colors,
    particleSize,
    particleCount,
    maxParticles,
    gravity,
    fadeSpeed,
    initialVelocity,
    spawnDistance,
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetElement = element || document.body;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrameId = 0;
    nextGapRef.current = propsRef.current.spawnDistance * (0.55 + Math.random() * 0.7);

    const updateCanvasSize = () => {
      const width = element ? targetElement.clientWidth : window.innerWidth;
      const height = element ? targetElement.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { width, height };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    /** Next spawn gap: mostly short (dense tip), sometimes long (tapered gaps). */
    const rollNextGap = () => {
      const base = propsRef.current.spawnDistance;
      const u = Math.random();
      if (u < 0.62) {
        // Tip cluster — tight, uneven.
        nextGapRef.current = base * (0.35 + Math.random() * 0.55);
      } else if (u < 0.88) {
        // Mid trail.
        nextGapRef.current = base * (0.85 + Math.random() * 0.7);
      } else {
        // Occasional stretch so the end doesn’t read as a dotted line.
        nextGapRef.current = base * (1.6 + Math.random() * 1.4);
      }
    };

    /** Stay on the path — burst is a uniform scale pop, not an outward spray. */
    const createParticle = (x: number, y: number): Particle => {
      const { colors: cols, particleSize: size, initialVelocity: vel } =
        propsRef.current;
      const randomColor = cols[Math.floor(Math.random() * cols.length)];
      const drift = Math.random() * (vel.max - vel.min) + vel.min;
      const velocityX = (Math.random() - 0.5) * drift;
      const velocityY = (Math.random() - 0.5) * drift * 0.6;
      // Tip particles a bit larger / longer-lived; some runts for texture.
      const sizeMul = 0.55 + Math.random() * 0.75;
      const life = 72 + Math.random() * 48;

      return {
        x: x + (Math.random() - 0.5) * 3,
        y: y + (Math.random() - 0.5) * 3,
        color: randomColor,
        velocity: { x: velocityX, y: velocityY },
        lifeSpan: life,
        initialLifeSpan: life,
        size: size * sizeMul,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
      };
    };

    const pushParticles = (x: number, y: number) => {
      const { particleCount: count, maxParticles: max } = propsRef.current;
      const cap = Math.max(1, max);
      const n = Math.max(1, count);

      for (let i = 0; i < n; i++) {
        particlesRef.current.push(createParticle(x, y));
      }
      while (particlesRef.current.length > cap) {
        particlesRef.current.shift();
      }
    };

    const updateParticles = () => {
      const { width, height } = sizeRef.current;
      const { gravity: g, fadeSpeed: fade } = propsRef.current;

      context.clearRect(0, 0, width, height);

      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        particle.velocity.x *= 0.9;
        particle.velocity.y *= 0.9;
        particle.velocity.y += g;
        particle.lifeSpan *= fade;
        particle.rotation += particle.spin;

        const life = Math.max(particle.lifeSpan / particle.initialLifeSpan, 0);
        // Power taper: tip stays full, then pinches out toward the trail end.
        const taper = Math.pow(life, 1.65);
        const progress = 1 - life;
        let scaleMul: number;
        if (progress < 0.1) {
          scaleMul = 0.55 + (progress / 0.1) * 0.55; // quick tip pop
        } else {
          scaleMul = 0.25 + 0.9 * taper;
        }
        const drawSize = particle.size * scaleMul;

        context.save();
        context.globalAlpha = Math.min(1, taper * 1.08);
        context.shadowColor = particle.color;
        context.shadowBlur = drawSize * 0.12;
        drawStar(
          context,
          particle.x,
          particle.y,
          drawSize,
          particle.rotation,
          particle.color,
        );
        context.restore();
      }

      particlesRef.current = particles.filter(
        (particle) => particle.lifeSpan > 0.25,
      );
    };

    const animate = () => {
      updateParticles();
      animationFrameId = requestAnimationFrame(animate);
    };

    const maybeSpawn = (x: number, y: number) => {
      const distance = Math.hypot(x - lastPosRef.current.x, y - lastPosRef.current.y);
      if (distance > nextGapRef.current) {
        pushParticles(x, y);
        lastPosRef.current = { x, y };
        rollNextGap();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element ? targetElement.getBoundingClientRect() : undefined;
      const x = element && rect ? e.clientX - rect.left : e.clientX;
      const y = element && rect ? e.clientY - rect.top : e.clientY;

      cursorRef.current = { x, y };
      maybeSpawn(x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = element ? targetElement.getBoundingClientRect() : undefined;
      const x = element && rect ? touch.clientX - rect.left : touch.clientX;
      const y = element && rect ? touch.clientY - rect.top : touch.clientY;
      maybeSpawn(x, y);
    };

    animationFrameId = requestAnimationFrame(animate);
    targetElement.addEventListener('mousemove', handleMouseMove);
    targetElement.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      targetElement.removeEventListener('mousemove', handleMouseMove);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [element]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: element ? 'absolute' : 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
