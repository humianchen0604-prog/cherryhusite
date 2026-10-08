'use client';

/**
 * Exact photo scatter for the Polaroid Flip and Polaroid Go cameras — a fixed
 * five-photo layout transcribed from Figma, not the generic looping masonry the
 * other cameras use. The prints can then be dragged around the panel.
 *
 * Figma nodes 1608:31185 ("Frame 2147224766", Polaroid Flip) and 1608:31192
 * ("Frame 2147224767", Polaroid Go). Each card's left/top/width/height (as a
 * percentage of its frame) and rotation is read straight off those nodes.
 *
 * The sources are the prints themselves — hand cut-outs, squared up by
 * scripts/trim-polaroids.mjs so nothing surrounds the print and it stands
 * upright. WebP, because the cut corners carry an alpha channel.
 *
 * So a card's rotation below is the only tilt applied, and every photo carries
 * its true aspect ratio — nothing is cropped. `height` is therefore derived from
 * the photo rather than taken from Figma (whose boxes were sized around the
 * untrimmed files), and the card is centred in the box Figma drew so the scatter
 * keeps its composition.
 *
 * Figma centres a rotated card inside its own axis-aligned bounding box via
 * flexbox; that's reproduced here by placing the card at the AABB's centre
 * minus half the card's own (pre-rotation) size, then rotating about the
 * centre — CSS's default transform-origin — which needs no extra wrapper.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type Card = {
  src: string;
  /** Natural pixel size of the trimmed print, the source of truth for the card's ratio. */
  w: number;
  h: number;
  left: number;
  top: number;
  width: number;
  /** The box Figma drew; the card is centred inside it at the photo's own ratio. */
  height: number;
  rotate?: number;
};

const FRAME = {
  'polaroid-flip': { w: 631.594, h: 626.763 },
  'polaroid-go': { w: 654.396, h: 543.162 },
} as const;

// Paint order matches Figma's own child order — later entries sit on top,
// which is what makes the middle card layer correctly over its neighbours.
const CARDS: Record<keyof typeof FRAME, Card[]> = {
  'polaroid-flip': [
    {
      src: '/assets/photos/polaroid-flip/polaroid-flip-02.webp',
      w: 739, h: 900,
      left: 5.209, top: 55.244, width: 33.249, height: 40.734,
      rotate: -17.1,
    },
    {
      src: '/assets/photos/polaroid-flip/polaroid-flip-01.webp',
      w: 743, h: 900,
      left: 10.135, top: 0.798, width: 33.249, height: 40.523,
    },
    {
      src: '/assets/photos/polaroid-flip/polaroid-flip-05.webp',
      w: 737, h: 900,
      left: 64.017, top: 2.195, width: 33.249, height: 40.842,
      rotate: 8.26,
    },
    {
      src: '/assets/photos/polaroid-flip/polaroid-flip-04.webp',
      w: 737, h: 900,
      left: 31.828, top: 28.723, width: 33.249, height: 40.842,
    },
    {
      src: '/assets/photos/polaroid-flip/polaroid-flip-03.webp',
      w: 739, h: 900,
      left: 61.516, top: 50.548, width: 33.249, height: 40.734,
      rotate: 15,
    },
  ],
  'polaroid-go': [
    {
      src: '/assets/photos/polaroid-go/polaroid-go-04.webp',
      w: 738, h: 900,
      left: 11.767, top: 0, width: 32.850, height: 48.245,
    },
    {
      src: '/assets/photos/polaroid-go/polaroid-go-05.webp',
      w: 739, h: 900,
      left: 3.923, top: 48.803, width: 32.393, height: 47.502,
      rotate: -12.65,
    },
    {
      src: '/assets/photos/polaroid-go/polaroid-go-02.webp',
      w: 724, h: 900,
      left: 62.001, top: 4.635, width: 32.850, height: 49.157,
      rotate: 16.62,
    },
    {
      src: '/assets/photos/polaroid-go/polaroid-go-03.webp',
      w: 718, h: 900,
      left: 31.633, top: 29.646, width: 32.087, height: 48.428,
    },
    {
      src: '/assets/photos/polaroid-go/polaroid-go-01.webp',
      w: 740, h: 900,
      left: 62.096, top: 47.084, width: 32.850, height: 48.061,
      rotate: 6.13,
    },
  ],
};

/** Clearance kept around the camera stack so a print never crowds it. */
const GUTTER = 10;
/** Lower drags harder against a limit. iOS uses ~0.55 for the same effect. */
const RUBBER = 0.55;
/** px/ms. A flick faster than this is treated as this fast. */
const MAX_FLING = 2.2;
/** How far a release throws the print, in ms of travel at release speed. */
const FLING_MS = 90;
/** Damping is ~2*sqrt(stiffness), so the print settles without wobbling. */
const STIFFNESS = 170;
const DAMPING = 26;
/** Velocity is measured over this window, not frame to frame, which is noisy. */
const VELOCITY_WINDOW = 70;

type Point = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };

/**
 * Resistance past a limit: the first pixels come easily and it stiffens from
 * there, so a boundary is felt before it is reached rather than hit flat.
 */
function rubber(delta: number, dimension: number) {
  const distance = Math.abs(delta);
  return Math.sign(delta) * (1 - 1 / ((distance * RUBBER) / dimension + 1)) * dimension;
}

/**
 * Nearest position that is fully inside the panel and clear of the camera
 * stack. The stack is a hole in the allowed area rather than an edge of it, so
 * escaping it means sliding out over whichever of its four sides is closest —
 * skipping any that would push the print out of the panel instead.
 */
function confine(x: number, y: number, w: number, h: number, panel: Box, stack: Box | null): Point {
  const inPanel = (px: number, py: number): Point => ({
    x: Math.min(Math.max(px, panel.left), panel.right - w),
    y: Math.min(Math.max(py, panel.top), panel.bottom - h),
  });

  const fitted = inPanel(x, y);
  if (!stack) return fitted;

  const sx0 = stack.left - GUTTER, sx1 = stack.right + GUTTER;
  const sy0 = stack.top - GUTTER, sy1 = stack.bottom + GUTTER;
  const hits = fitted.x < sx1 && fitted.x + w > sx0 && fitted.y < sy1 && fitted.y + h > sy0;
  if (!hits) return fitted;

  const escapes = [
    { push: sx1 - fitted.x, to: { x: sx1, y: fitted.y } },
    { push: fitted.x + w - sx0, to: { x: sx0 - w, y: fitted.y } },
    { push: sy1 - fitted.y, to: { x: fitted.x, y: sy1 } },
    { push: fitted.y + h - sy0, to: { x: fitted.x, y: sy0 - h } },
  ].sort((a, b) => a.push - b.push);

  for (const escape of escapes) {
    const { x: ex, y: ey } = escape.to;
    if (ex >= panel.left && ex + w <= panel.right && ey >= panel.top && ey + h <= panel.bottom) {
      return escape.to;
    }
  }
  return inPanel(escapes[0].to.x, escapes[0].to.y);
}

function toBox(rect: DOMRect): Box {
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
}

type Live = {
  id: string;
  el: HTMLElement;
  pointerId: number;
  /** Card size and its position at zero offset, so offsets stay absolute. */
  w: number; h: number;
  baseX: number; baseY: number;
  /** Where in the card the pointer took hold, so it does not jump on grab. */
  grabX: number; grabY: number;
  panel: Box; stack: Box | null;
  /** Unconstrained pointer position — what the constraint is measured against. */
  freeX: number; freeY: number;
  samples: { t: number; x: number; y: number }[];
};

export default function PolaroidCollage({ cameraId }: { cameraId: keyof typeof FRAME }) {
  const frame = FRAME[cameraId];
  const cards = CARDS[cameraId];

  /** Committed offsets, off React state: they change every frame while dragging. */
  const offsets = useRef(new Map<string, Point>());
  const els = useRef(new Map<string, HTMLElement>());
  const live = useRef<Live | null>(null);
  const frameId = useRef(0);
  const topZ = useRef(0);

  // Only what actually changes the markup goes through React.
  const [dragId, setDragId] = useState<string | null>(null);
  const [zOrder, setZOrder] = useState<Record<string, number>>({});

  const place = useCallback((id: string, x: number, y: number) => {
    const el = els.current.get(id);
    if (el) el.style.transform = x || y ? `translate3d(${x}px, ${y}px, 0)` : '';
  }, []);

  // A re-render (z-order, drag class) wipes nothing, since transform is only
  // ever written imperatively — but a fresh mount still needs it applied.
  useEffect(() => {
    for (const [id, point] of offsets.current) place(id, point.x, point.y);
  });

  useEffect(() => () => cancelAnimationFrame(frameId.current), []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // One print at a time: a second finger mid-drag would otherwise snatch it.
    if (live.current) return;

    const el = event.currentTarget;
    const inner = el.firstElementChild as HTMLElement | null;
    const panelEl = el.closest('.camera-reel__panel') as HTMLElement | null;
    if (!inner || !panelEl) return;

    cancelAnimationFrame(frameId.current);
    event.preventDefault();

    const stackEl = panelEl.querySelector('.camera-reel__stage');
    const rect = inner.getBoundingClientRect();
    const offset = offsets.current.get(id) ?? { x: 0, y: 0 };

    live.current = {
      id, el, pointerId: event.pointerId,
      w: rect.width, h: rect.height,
      baseX: rect.left - offset.x, baseY: rect.top - offset.y,
      grabX: event.clientX - rect.left, grabY: event.clientY - rect.top,
      panel: toBox(panelEl.getBoundingClientRect()),
      stack: stackEl ? toBox(stackEl.getBoundingClientRect()) : null,
      freeX: rect.left, freeY: rect.top,
      samples: [{ t: performance.now(), x: rect.left, y: rect.top }],
    };

    el.setPointerCapture(event.pointerId);
    topZ.current += 1;
    setZOrder((order) => ({ ...order, [id]: topZ.current }));
    setDragId(id);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = live.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    drag.freeX = event.clientX - drag.grabX;
    drag.freeY = event.clientY - drag.grabY;

    const now = performance.now();
    drag.samples.push({ t: now, x: drag.freeX, y: drag.freeY });
    while (drag.samples.length > 2 && now - drag.samples[0].t > VELOCITY_WINDOW) drag.samples.shift();

    const bound = confine(drag.freeX, drag.freeY, drag.w, drag.h, drag.panel, drag.stack);
    // Past a limit the print keeps following, just reluctantly.
    const x = bound.x + rubber(drag.freeX - bound.x, drag.panel.width);
    const y = bound.y + rubber(drag.freeY - bound.y, drag.panel.height);
    place(drag.id, x - drag.baseX, y - drag.baseY);
  }, [place]);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = live.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    live.current = null;
    setDragId(null);
    if (drag.el.hasPointerCapture(event.pointerId)) drag.el.releasePointerCapture(event.pointerId);

    const bound = confine(drag.freeX, drag.freeY, drag.w, drag.h, drag.panel, drag.stack);
    let x = bound.x + rubber(drag.freeX - bound.x, drag.panel.width);
    let y = bound.y + rubber(drag.freeY - bound.y, drag.panel.height);

    const settle = (point: Point) => {
      offsets.current.set(drag.id, { x: point.x - drag.baseX, y: point.y - drag.baseY });
      place(drag.id, point.x - drag.baseX, point.y - drag.baseY);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settle(bound);
      return;
    }

    // Carry the throw: where the print would end up if it kept its speed
    // briefly, pulled back to somewhere it is allowed to rest.
    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const span = last.t - first.t;
    let vx = 0, vy = 0;
    if (span > 0) {
      vx = Math.max(-MAX_FLING, Math.min(MAX_FLING, (last.x - first.x) / span));
      vy = Math.max(-MAX_FLING, Math.min(MAX_FLING, (last.y - first.y) / span));
    }
    const target = confine(
      drag.freeX + vx * FLING_MS, drag.freeY + vy * FLING_MS,
      drag.w, drag.h, drag.panel, drag.stack
    );

    // Spring rather than a fixed duration: the distance varies per throw, and a
    // spring keeps the release velocity instead of restarting from nothing.
    let velX = vx * 1000, velY = vy * 1000; // px/s
    let last_t = performance.now();
    const step = () => {
      const now = performance.now();
      // Sub-step so a dropped frame cannot make the spring overshoot wildly.
      let elapsed = Math.min((now - last_t) / 1000, 0.064);
      last_t = now;
      while (elapsed > 0) {
        const dt = Math.min(elapsed, 1 / 240);
        elapsed -= dt;
        velX += ((target.x - x) * STIFFNESS - velX * DAMPING) * dt;
        velY += ((target.y - y) * STIFFNESS - velY * DAMPING) * dt;
        x += velX * dt;
        y += velY * dt;
      }
      const done = Math.hypot(target.x - x, target.y - y) < 0.35 && Math.hypot(velX, velY) < 12;
      if (done) { settle(target); return; }
      place(drag.id, x - drag.baseX, y - drag.baseY);
      frameId.current = requestAnimationFrame(step);
    };
    frameId.current = requestAnimationFrame(step);
  }, [place]);

  return (
    <div className="camera-reel__collage" style={{ '--collage-ar': frame.w / frame.h } as React.CSSProperties}>
      <div className="camera-reel__collage-stage">
        {cards.map((card, i) => {
          // Percentages run against different axes, so converting the photo's
          // ratio into a height percentage carries the frame's own ratio too.
          const height = (card.width * (frame.w / frame.h)) / (card.w / card.h);
          const top = card.top + (card.height - height) / 2;
          return (
            <div
              key={card.src}
              ref={(el) => {
                if (el) els.current.set(card.src, el);
                else els.current.delete(card.src);
              }}
              className={`camera-reel__collage-card${dragId === card.src ? ' is-dragging' : ''}`}
              style={{
                left: `${card.left}%`,
                top: `${top}%`,
                width: `${card.width}%`,
                height: `${height}%`,
                zIndex: zOrder[card.src],
                // Read by the enter keyframe, which has to re-apply the
                // rotation itself or it would animate the card back to upright.
                '--card-rotate': `${card.rotate ?? 0}deg`,
              } as React.CSSProperties}
              onPointerDown={(event) => onPointerDown(event, card.src)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className="camera-reel__collage-card-inner"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <img
                  className="camera-reel__collage-photo"
                  src={card.src}
                  width={card.w}
                  height={card.h}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
