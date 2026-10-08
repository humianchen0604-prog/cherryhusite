'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

/**
 * "My intern days at Lemon8" photo collage — Figma node 1697:8734 (file
 * DfbSPhyOyXqGekwuDuRAbM) via get_design_context.
 *
 * The Figma frame is 1911 × 745; the live collage is cropped to the bounding
 * box of the star, four photos, and smiley so those sit on the edges of the
 * column instead of floating in empty padding. Positions below are that box
 * as percentages, so overlap is kept and everything scales with the column.
 *
 * Figma reports a rotated node's x/y as its post-rotation origin corner but its
 * width/height as the axis-aligned bounding box, so each item is placed by the
 * CENTRE of that bounding box and then rotated in place — the two agree only at
 * the centre.
 *
 * Motion: cards toss in from below with a back-out overshoot, staggered left to
 * right, once the collage scrolls into view. On hover a card lifts, grows, and
 * straightens toward 0°, and jumps to the top of the stack; on leave it drops
 * back into its Figma z-order (star < 1 < 2 < 3 < 4 < smiley).
 */

type Item = {
  /** Centre of the cropped Figma bounding box, as a % of that box. */
  cx: number;
  cy: number;
  /** Unrotated size, as a % of the box width (cqw), so the ratio is kept. */
  w: number;
  h: number;
  rot: number;
  src: string;
  alt: string;
  /** Cursor-follow pill, same treatment as the copy-email hover. */
  label: string;
};

const PHOTOS: Item[] = [
  {
    cx: 20.026,
    cy: 42.588,
    w: 18.803,
    h: 25.03,
    rot: -8.54,
    src: '/assets/intern-days/photo-1.jpg',
    alt: 'Me crouching beside the Lemon8 mascot next to the office Christmas tree',
    label: 'Me with Lemo',
  },
  {
    cx: 41.802,
    cy: 45.244,
    w: 25.088,
    h: 18.803,
    rot: 6.58,
    src: '/assets/intern-days/photo-2.jpg',
    alt: 'The team around a table at the Lemon8 holiday party',
    label: 'Christmas gift exchange!',
  },
  {
    cx: 60.504,
    cy: 39.37,
    w: 18.803,
    h: 25.03,
    rot: -1.62,
    src: '/assets/intern-days/photo-3.jpg',
    alt: 'A "GameOn!" deck on the big screen during a team presentation',
    label: 'Team bonding games',
  },
  {
    cx: 79.642,
    cy: 40.912,
    w: 25.088,
    h: 18.803,
    rot: 8.36,
    src: '/assets/intern-days/photo-4.jpg',
    alt: 'The whole team on an offsite, posing in a bamboo grove',
    label: 'Hiking!',
  },
];

export type InternDaysPhoto = Item;

/** TikTok intern days — first card swapped for the ByteDance office shot. */
export const TIKTOK_INTERN_PHOTOS: Item[] = [
  {
    ...PHOTOS[0],
    src: '/assets/tiktok/intern-office.png',
    alt: 'At the ByteDance office with TikTok pillows',
    label: '@ San Jose office',
  },
  {
    ...PHOTOS[1],
    src: '/assets/tiktok/intern-monterey.png',
    label: 'Team bonding at Monterey Bay',
    alt: 'Team bonding at Monterey Bay',
  },
  {
    ...PHOTOS[2],
    src: '/assets/tiktok/intern-swag.png',
    alt: 'TikTok welcome swag on the office floor',
    label: 'swag',
  },
  {
    ...PHOTOS[3],
    src: '/assets/tiktok/intern-campus.png',
    alt: 'Outdoor plaza on the San Jose campus',
    label: 'Campus',
  },
];

export default function InternDaysCollage({
  photos = PHOTOS,
  smileyFill = '#7DF463',
  explosion = 'star',
}: {
  photos?: Item[];
  smileyFill?: string;
  explosion?: 'star' | 'flower';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [pillLabel, setPillLabel] = useState(photos[0].label);
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  function onPhotoEnter(label: string, e: MouseEvent<HTMLElement>) {
    setPillLabel(label);
    pillHandlers.onMouseEnter(e);
  }

  function onPhotoLeave(e: MouseEvent<HTMLElement>) {
    const next = e.relatedTarget;
    if (next instanceof Element && ref.current?.contains(next) && next.closest('.idc-item--photo')) {
      return;
    }
    pillHandlers.onMouseLeave();
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <div className="idc-scroller">
      <style>{CSS}</style>
      <div className="idc-frame" ref={ref} data-in={shown ? '' : undefined}>
        {/* Explosion — decorative, sits under every photo. */}
        <div
          className="idc-item idc-item--deco"
          style={
            {
              '--cx': '10.018%',
              '--cy': '68.578%',
              '--w': explosion === 'flower' ? '12cqw' : '20.035cqw',
              '--h': explosion === 'flower' ? '12cqw' : '19.977cqw',
              '--rot': '0deg',
              '--z': 1,
              '--delay': '0ms',
            } as React.CSSProperties
          }
        >
          <div className="idc-enter">
            {explosion === 'flower' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="idc-deco"
                src="/assets/tiktok/intern-flower.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <svg className="idc-deco" viewBox="0 0 341 340" fill="none" aria-hidden="true">
                <path
                  d="M216.623 241.223L155.471 340L163.762 238.103L45.6049 286.973L129.559 208.991L0 214.19L102.611 175.719L0 97.737L112.976 116.453V0L155.471 116.453L216.623 13.5168L194.857 127.89L283.994 38.471L216.623 147.645L321.307 106.055L216.623 188.195H341L216.623 241.223Z"
                  fill="#FFEB35"
                />
              </svg>
            )}
          </div>
        </div>

        {photos.map((p, i) => (
          <div
            className="idc-item idc-item--photo"
            key={p.src}
            style={{
              '--cx': `${p.cx}%`,
              '--cy': `${p.cy}%`,
              '--w': `${p.w}cqw`,
              '--h': `${p.h}cqw`,
              '--rot': `${p.rot}deg`,
              '--z': i + 2,
              '--delay': `${70 + i * 70}ms`,
              '--toss': i % 2 === 0 ? '-7deg' : '7deg',
            } as React.CSSProperties}
          >
            <div className="idc-enter">
              <div
                className="idc-card"
                onMouseEnter={(e) => onPhotoEnter(p.label, e)}
                onMouseMove={pillHandlers.onMouseMove}
                onMouseLeave={onPhotoLeave}
              >
                <img className="idc-img" src={p.src} alt={p.alt} loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        ))}

        {/* Smiley — decorative, the last child in Figma so it sits on top. */}
        <div
          className="idc-item idc-item--deco"
          style={{ '--cx': '97.65%', '--cy': '14.973%', '--w': '4.7cqw', '--h': '4.7cqw', '--rot': '15deg', '--z': 6, '--delay': '350ms' } as React.CSSProperties}
        >
          <div className="idc-enter">
            <svg className="idc-deco" viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M80 40C80 62.0915 62.0915 80 40 80C17.9086 80 0 62.0915 0 40C0 17.9086 17.9086 0 40 0C62.0915 0 80 17.9086 80 40ZM29.3334 33.1853C33.0969 33.1853 36.1481 30.1341 36.1481 26.3703C36.1481 22.6068 33.0969 19.5556 29.3334 19.5556C25.5696 19.5556 22.5184 22.6068 22.5184 26.3703C22.5184 30.1341 25.5696 33.1853 29.3334 33.1853ZM50.6666 33.1853C54.4304 33.1853 57.4816 30.1341 57.4816 26.3703C57.4816 22.6068 54.4304 19.5556 50.6666 19.5556C46.9031 19.5556 43.8519 22.6068 43.8519 26.3703C43.8519 30.1341 46.9031 33.1853 50.6666 33.1853ZM40.2962 53.9259C31.1326 53.9259 23.7038 46.4971 23.7038 37.3335H16.5926C16.5926 50.4245 27.2052 61.0372 40.2962 61.0372C53.3876 61.0372 64 50.4245 64 37.3335H56.8887C56.8887 46.4971 49.4603 53.9259 40.2962 53.9259Z"
                fill={smileyFill}
              />
            </svg>
          </div>
        </div>
      </div>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label={pillLabel} /> : null}
    </div>
  );
}

const CSS = `
/* Cropped to the star–photos–smiley bounding box so the collage fills the
   column with no empty padding around the edges. */
.idc-scroller {
  width: 100%;
  margin-top: 8px;
  overflow: visible;
}
.idc-frame {
  container-type: inline-size;
  position: relative;
  width: 100%;
  aspect-ratio: 1702 / 541;
}

.idc-item {
  position: absolute;
  left: var(--cx);
  top: var(--cy);
  width: var(--w);
  height: var(--h);
  margin-left: calc(var(--w) / -2);
  margin-top: calc(var(--h) / -2);
  z-index: var(--z);
}

/* Entrance and hover live on separate nodes so a hover can start while the
   entrance is still resolving above it. */
.idc-enter {
  width: 100%;
  height: 100%;
  opacity: 0;
}
/* Nothing will ever set data-in without JS, so hand the collage back. */
@media (scripting: none) {
  .idc-enter { opacity: 1; }
}
.idc-frame[data-in] .idc-enter {
  animation: idc-in 620ms cubic-bezier(0.34, 1.42, 0.58, 1) var(--delay) both;
}
@keyframes idc-in {
  from { opacity: 0; transform: translate3d(0, 7cqw, 0) scale(0.86) rotate(var(--toss, -10deg)); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
}

.idc-card,
.idc-deco {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(var(--rot));
}

.idc-card {
  position: relative;
  border-radius: 1.256cqw;
  overflow: hidden;
  background: #ebebeb;
  box-shadow: 0 1.2cqw 2.6cqw rgba(0, 0, 0, 0.10);
  transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1),
              box-shadow 220ms cubic-bezier(0.23, 1, 0.32, 1);
  will-change: transform;
}
.idc-item--photo .idc-card {
  cursor: pointer;
}
.idc-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

@media (hover: hover) and (pointer: fine) {
  /* Hovered card leaves the Figma stacking order and comes fully forward. */
  .idc-item--photo:hover { z-index: 20; }
  .idc-item--photo:hover .idc-card {
    transform: translateY(-1.6cqw) scale(1.06) rotate(calc(var(--rot) * 0.35));
    box-shadow: 0 2.4cqw 4.4cqw rgba(0, 0, 0, 0.18);
  }
  .idc-item--photo:active .idc-card {
    transform: translateY(-1.6cqw) scale(1.02) rotate(calc(var(--rot) * 0.35));
    transition-duration: 130ms;
  }
}

@media (prefers-reduced-motion: reduce) {
  .idc-frame[data-in] .idc-enter {
    animation: idc-fade 260ms ease both;
  }
  @keyframes idc-fade { from { opacity: 0; } to { opacity: 1; } }
  .idc-card { transition: box-shadow 200ms ease; will-change: auto; }
  .idc-item--photo:hover .idc-card,
  .idc-item--photo:active .idc-card { transform: rotate(var(--rot)); }
}
`;
