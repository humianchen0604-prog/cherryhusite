/**
 * Shared placement for the hero's decorative variants, measured against the
 * hero copy:
 *   - measureWave / waveSpots (HeroShapes): a wavy horizontal line starting a
 *     clear gap after the longest line of text, running toward the right edge.
 *   - measureCluster / clusterSpots (HeroFlowers): a compact zigzag near the
 *     column's right edge, level with the grey "Currently / Previously" lines.
 *
 * Measured from the text itself (Range rects), so it follows the copy as it
 * wraps or as "and builds" enters. Both rects are read in the same frame and
 * subtracted, so any transform on the intro (scroll reveal) cancels out.
 */

export type WaveBand = { x0: number; x1: number; yMid: number; amp: number };
export type Spot = [number, number];

const TEXT = '.who-line .block__hero .line, .who-line .line--sub, .who-line .intro-lines__line';
const GAP = 80; // clear space after the text, px
const MAX_WIDTH = 520; // the line never stretches wider than this
const EDGE = 52; // keep items inside the content column's right edge
const MAX_AMP = 40; // wave height either side of the middle, px

/** Page-space extent of the text matched by `selector` (Range rects, so the words, not their boxes). */
function textExtent(selector: string) {
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  const range = document.createRange();
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    range.selectNodeContents(el);
    for (const r of Array.from(range.getClientRects())) {
      if (!r.width) continue;
      right = Math.max(right, r.right);
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
  }
  return Number.isFinite(right) ? { right, top, bottom } : null;
}

/** The band, in `area`'s own coordinates, or null if there's no room beside the copy. */
export function measureWave(area: HTMLElement): WaveBand | null {
  const a = area.getBoundingClientRect();
  const text = a.width ? textExtent(TEXT) : null;
  if (!text) return null;
  const x0 = text.right - a.left + GAP;
  const x1 = Math.min(a.width - EDGE, x0 + MAX_WIDTH);
  if (x1 - x0 < 140) return null;
  const yTop = text.top - a.top;
  const yBot = text.bottom - a.top;
  return { x0, x1, yMid: (yTop + yBot) / 2, amp: Math.min(MAX_AMP, (yBot - yTop) * 0.3) };
}

// ---------- cluster (HeroFlowers) ----------
const CLUSTER_WIDTH = 240; // flower centres span this, px
const CLUSTER_INSET = 60; // last flower sits this far in from the column's right edge
const CLUSTER_MIN_GAP = 60; // never closer than this to the end of the text
const CLUSTER_AMP = 18; // zigzag height either side of the middle, px
const OVERHANG = 36; // .hero-deco runs this far past the column's right edge

/**
 * A short band near the right edge of the column, centred on the grey
 * "Currently / Previously" lines. Null if the copy leaves no room.
 */
export function measureCluster(area: HTMLElement): WaveBand | null {
  const a = area.getBoundingClientRect();
  const text = a.width ? textExtent(TEXT) : null;
  const lines = text ? textExtent('.who-line .intro-lines__line') : null;
  if (!text || !lines) return null;
  const x1 = a.width - OVERHANG - CLUSTER_INSET;
  const x0 = Math.max(x1 - CLUSTER_WIDTH, text.right - a.left + CLUSTER_MIN_GAP);
  if (x1 - x0 < 120) return null;
  return { x0, x1, yMid: (lines.top + lines.bottom) / 2 - a.top, amp: CLUSTER_AMP };
}

export type ClusterSpot = { x: number; y: number; sparkle: boolean };

/**
 * `flowers` spread evenly across the band, alternating above and below the
 * middle; `sparkles` tucked into the gaps between neighbouring flowers, on the
 * opposite side from the pair so they fill the space rather than crowd it.
 * Returned left to right.
 */
export function clusterSpots(flowers: number, sparkles: number, band: WaveBand): ClusterSpot[] {
  const step = (band.x1 - band.x0) / Math.max(1, flowers - 1);
  const start = Math.random() < 0.5 ? -1 : 1;
  const out: ClusterSpot[] = [];
  for (let i = 0; i < flowers; i++) {
    const side = i % 2 === 0 ? start : -start;
    out.push({
      x: band.x0 + i * step + (Math.random() - 0.5) * step * 0.25,
      y: band.yMid + side * band.amp * (0.6 + Math.random() * 0.4),
      sparkle: false,
    });
  }
  const gaps = Array.from({ length: flowers - 1 }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const g of gaps.slice(0, sparkles)) {
    const a = out[g], b = out[g + 1];
    const mid = (a.y + b.y) / 2;
    const side = mid <= band.yMid ? 1 : -1;
    out.push({
      x: (a.x + b.x) / 2 + (Math.random() - 0.5) * step * 0.2,
      y: band.yMid + side * band.amp * (1.1 + Math.random() * 0.4),
      sparkle: true,
    });
  }
  return out.sort((p, q) => p.x - q.x);
}

/**
 * `n` spots spread left to right along a sine wave (about one full wave across
 * the band), each nudged a little so it never reads as a ruler-straight curve.
 */
export function waveSpots(n: number, band: WaveBand): Spot[] {
  const step = (band.x1 - band.x0) / n;
  const phase = Math.random() * Math.PI * 2;
  const freq = (Math.PI * 2) / (n * 0.9);
  return Array.from({ length: n }, (_, i): Spot => [
    band.x0 + (i + 0.5) * step + (Math.random() - 0.5) * step * 0.35,
    band.yMid + Math.sin(phase + i * freq) * band.amp + (Math.random() - 0.5) * 8,
  ]);
}
