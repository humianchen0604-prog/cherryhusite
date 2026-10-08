'use client';

/*
 * Top-edge counterpart to the page's bottom blur: a band pinned to the top of
 * the viewport so content scrolling up under the logo stays legible and the
 * top of the page keeps reading as a distinct section.
 *
 * Two things stacked:
 *  - a wash of the page background, opaque at the very top and fading to
 *    nothing at the bottom edge of the band;
 *  - six backdrop-blur layers, each masked to its own band and blurred harder
 *    than the last, so the blur ramps in rather than stopping on a hard line.
 *    Same construction as BottomBlur, with every mask flipped top-to-bottom.
 *
 * Height is driven by --top-blur-h: the logo's distance from the top, doubled,
 * so the logo sits centred in the band with equal air above and below it.
 *
 * Tablet and mobile only — on desktop the logo has the page to itself.
 */
const LAYERS: Array<{ mask: string; blur: string }> = [
  { mask: 'linear-gradient(to top, transparent 0.0%, black 16.7%, black 33.3%, transparent 50.0%)', blur: '0.092rem' },
  { mask: 'linear-gradient(to top, transparent 16.7%, black 33.3%, black 50.0%, transparent 66.7%)', blur: '0.154rem' },
  { mask: 'linear-gradient(to top, transparent 33.3%, black 50.0%, black 66.7%, transparent 83.3%)', blur: '0.300rem' },
  { mask: 'linear-gradient(to top, transparent 50.0%, black 66.7%, black 83.3%)', blur: '0.585rem' },
  { mask: 'linear-gradient(to top, transparent 66.7%, black 83.3%)', blur: '0.977rem' },
  { mask: 'linear-gradient(to top, transparent 83.3%, black 100.0%)', blur: '1.200rem' },
];

export default function TopBlur() {
  return (
    <div className="top-blur" aria-hidden="true">
      <div className="top-blur__wash" />
      {LAYERS.map((l, i) => (
        <div
          key={i}
          className="top-blur__layer"
          style={{
            WebkitMaskImage: l.mask,
            maskImage: l.mask,
            WebkitBackdropFilter: `blur(${l.blur})`,
            backdropFilter: `blur(${l.blur})`,
          }}
        />
      ))}
    </div>
  );
}
