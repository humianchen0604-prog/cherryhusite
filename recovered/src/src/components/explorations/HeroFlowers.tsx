'use client';

import { useEffect, useId, useRef, useState } from 'react';
import './heroDeco.css';
import './heroFlowers.css';
import { clusterSpots, measureCluster, type ClusterSpot } from './heroWave';

/**
 * Soft, blurred gradient flowers that bloom in beside the hero copy, in a
 * compact zigzag near the column's right edge, level with the grey intro lines
 * (heroWave.ts, measureCluster). Each composition deals 3–4 flowers of
 * different petal designs and colour combos, plus 1–2 small blurred sparkles
 * tucked between them, blooms them in left to right, lets them sway, then
 * fades them out and deals a new one.
 *
 * Every flower is an inline SVG (viewBox -50 -50 100 100, centred on 0,0):
 * radial gradients for the colour, feGaussianBlur for the soft edges, and each
 * petal scales out from the centre in turn so the flower visibly opens. The
 * motion itself is CSS (heroFlowers.css); this file only deals and times.
 */

type Kind = 'halo' | 'ring' | 'duo' | 'pastel' | 'sparkle';

type Item = {
  key: string;
  kind: Kind;
  x: number;
  y: number;
  size: number;
  rot: number;
  petals: number;
  colors: string[];
  delay: number;
};

// ---------- timing (ms) ----------
const STAGGER = 130; // between items along the line
const BLOOM = 1100; // one flower opening (petals add their own small stagger)
const HOLD = 3600; // all open, gently swaying
const OUT = 600;
const OUT_STAGGER = 70;
const REST = 500;
const START_DELAY = 800;

// ---------- looks ----------
const FLOWER_SIZE: [number, number] = [22, 30]; // px, smallest..largest
const SPARKLE_SIZE: [number, number] = [10, 13];

const COMBOS: Record<Kind, string[][]> = {
  // [soft petals, crisp core]
  halo: [
    ['#ff7ab8', '#ff4f9a'],
    ['#c9a2ff', '#a77bff'],
    ['#ffb08a', '#ff8a5c'],
  ],
  // [petals] — the centre is cut out
  ring: [['#a6d38a'], ['#ff9ec7'], ['#9fc2ff']],
  // [centre, middle, tips]
  duo: [
    ['#ff4fc3', '#f59bcb', '#a9cf9a'],
    ['#b58cff', '#f3a6d0', '#ffd59a'],
    ['#ff7a9c', '#ffc4a8', '#bde3a6'],
  ],
  // [centre, middle, outer]
  pastel: [
    ['#ffffff', '#ffd0da', '#bff0b3'],
    ['#ffffff', '#e4d4ff', '#ffe8a3'],
    ['#ffffff', '#cfe8ff', '#ffd3e6'],
  ],
  // [centre, edge]
  sparkle: [
    ['#8a7bff', '#7fb2ff'],
    ['#ff8ad0', '#ffb6e6'],
    ['#8fd98a', '#c3f0b0'],
  ],
};

const pick = <T,>(arr: readonly T[]): T => arr[(Math.random() * arr.length) | 0];
const between = ([a, b]: [number, number]) => a + Math.random() * (b - a);
const shuffle = <T,>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

let serial = 0;

function deal(spots: ClusterSpot[]): Item[] {
  // Every flower a different design; the layout already says which spots are sparkles.
  const flowerKinds = shuffle<Kind>(['halo', 'ring', 'duo', 'pastel']);
  let f = 0;
  return spots.map(({ x, y, sparkle }, i) => {
    const kind: Kind = sparkle ? 'sparkle' : flowerKinds[f++ % flowerKinds.length];
    return {
      key: `f${serial++}`,
      kind,
      x,
      y,
      size: between(kind === 'sparkle' ? SPARKLE_SIZE : FLOWER_SIZE),
      rot: Math.random() * 360,
      petals: kind === 'halo' ? 6 : kind === 'duo' ? pick([4, 5]) : kind === 'pastel' ? pick([5, 6]) : 5,
      colors: pick(COMBOS[kind]),
      delay: i * STAGGER,
    };
  });
}

/** Petals: one shape per petal, pointing up, rotated into place around 0,0. */
function Petals({ n, children }: { n: number; children: (i: number) => React.ReactNode }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`rotate(${(i * 360) / n})`}>
          <g className="hf-petal" style={{ ['--i' as string]: i }}>
            {children(i)}
          </g>
        </g>
      ))}
    </>
  );
}

function Flower({ item }: { item: Item }) {
  const uid = useId().replace(/:/g, '');
  const id = (s: string) => `${uid}-${s}`;
  const { kind, petals: n, colors: c } = item;

  let defs: React.ReactNode = null;
  let body: React.ReactNode = null;

  if (kind === 'halo') {
    defs = (
      <>
        <radialGradient id={id('g')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="48">
          <stop offset="0.2" stopColor={c[0]} stopOpacity="0.95" />
          <stop offset="0.7" stopColor={c[0]} stopOpacity="0.35" />
          <stop offset="1" stopColor={c[0]} stopOpacity="0" />
        </radialGradient>
        <filter id={id('b1')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={id('b2')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </>
    );
    body = (
      <>
        <g filter={`url(#${id('b1')})`}>
          <Petals n={n}>{() => <circle cx="0" cy="-25" r="20" fill={`url(#${id('g')})`} />}</Petals>
        </g>
        <g filter={`url(#${id('b2')})`}>
          <Petals n={n}>{() => <circle cx="0" cy="-9.5" r="8.5" fill={c[1]} />}</Petals>
          <circle className="hf-core" cx="0" cy="0" r="10" fill={c[1]} />
        </g>
      </>
    );
  } else if (kind === 'ring') {
    defs = (
      <>
        <filter id={id('b')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id={id('bm')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <mask id={id('m')} maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100">
          <rect x="-50" y="-50" width="100" height="100" fill="#fff" />
          {/* The cut-out centre is a little flower of its own. */}
          <g filter={`url(#${id('bm')})`} fill="#000">
            {Array.from({ length: n }, (_, i) => (
              <circle key={i} cx="0" cy="-8" r="6.5" transform={`rotate(${(i * 360) / n})`} />
            ))}
            <circle cx="0" cy="0" r="7" />
          </g>
        </mask>
      </>
    );
    body = (
      <g mask={`url(#${id('m')})`}>
        <g filter={`url(#${id('b')})`} fill={c[0]}>
          <Petals n={n}>{() => <circle cx="0" cy="-23" r="17" />}</Petals>
          <circle className="hf-core" cx="0" cy="0" r="22" />
        </g>
      </g>
    );
  } else if (kind === 'duo') {
    defs = (
      <>
        <radialGradient id={id('g')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="46">
          <stop offset="0.08" stopColor={c[0]} />
          <stop offset="0.5" stopColor={c[1]} />
          <stop offset="0.88" stopColor={c[2]} />
          <stop offset="1" stopColor={c[2]} stopOpacity="0.6" />
        </radialGradient>
        <filter id={id('b')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </>
    );
    body = (
      <g filter={`url(#${id('b')})`} fill={`url(#${id('g')})`}>
        <Petals n={n}>{() => <ellipse cx="0" cy="-23" rx={n === 4 ? 17 : 14} ry="21" />}</Petals>
        <circle className="hf-core" cx="0" cy="0" r="12" />
      </g>
    );
  } else if (kind === 'pastel') {
    defs = (
      <>
        <radialGradient id={id('g')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="46">
          <stop offset="0.12" stopColor={c[0]} />
          <stop offset="0.5" stopColor={c[1]} />
          <stop offset="0.82" stopColor={c[2]} />
          <stop offset="1" stopColor={c[2]} stopOpacity="0.7" />
        </radialGradient>
        <filter id={id('b')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </>
    );
    body = (
      <g filter={`url(#${id('b')})`} fill={`url(#${id('g')})`}>
        <Petals n={n}>{() => <circle cx="0" cy="-24" r="16.5" />}</Petals>
        <circle className="hf-core" cx="0" cy="0" r="20" />
      </g>
    );
  } else {
    // sparkle: a soft four-lobed plus
    defs = (
      <>
        <radialGradient id={id('g')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="30">
          <stop offset="0.2" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </radialGradient>
        <filter id={id('b')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </>
    );
    body = (
      <g filter={`url(#${id('b')})`} fill={`url(#${id('g')})`}>
        <Petals n={4}>{() => <circle cx="0" cy="-15" r="12" />}</Petals>
        <circle className="hf-core" cx="0" cy="0" r="13" />
      </g>
    );
  }

  return (
    <div
      className={`hero-flower hero-flower--${kind}`}
      style={{
        left: item.x - item.size / 2,
        top: item.y - item.size / 2,
        width: item.size,
        height: item.size,
        ['--d' as string]: `${item.delay}ms`,
        ['--rot' as string]: `${item.rot}deg`,
      }}
    >
      <div className="hf-sway">
        <svg viewBox="-50 -50 100 100" width="100%" height="100%" overflow="visible">
          <defs>{defs}</defs>
          {body}
        </svg>
      </div>
    </div>
  );
}

export default function HeroFlowers() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let timers: number[] = [];
    let visible = false;
    let running = false;

    const clear = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    const cycle = () => {
      const band = measureCluster(area);
      if (!band) {
        // No room beside the copy (or not laid out yet): try again shortly.
        setItems([]);
        later(cycle, 1000);
        return;
      }
      const flowers = 3 + ((Math.random() * 2) | 0);
      const next = deal(clusterSpots(flowers, flowers === 4 ? 2 : 1, band));
      setLeaving(false);
      setItems(next);
      if (reduced.matches) return; // one still composition
      const n = next.length;
      const outAt = (n - 1) * STAGGER + BLOOM + HOLD;
      later(() => setLeaving(true), outAt);
      later(cycle, outAt + (n - 1) * OUT_STAGGER + OUT + REST);
    };

    const sync = () => {
      const should = visible && !document.hidden;
      if (should && !running) {
        running = true;
        later(cycle, START_DELAY);
      } else if (!should && running) {
        running = false;
        clear();
        setItems([]);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(area);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clear();
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return (
    <div ref={areaRef} className={`hero-deco hero-flowers${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      {items.map((item, i) => (
        <div
          key={item.key}
          style={{ display: 'contents', ['--o' as string]: `${i * OUT_STAGGER}ms` } as React.CSSProperties}
        >
          <Flower item={item} />
        </div>
      ))}
    </div>
  );
}
