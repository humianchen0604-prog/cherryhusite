'use client';

/**
 * "Hover — Lift" card stack (variant #18 of FeedMotionShowcase.jsx), adapted
 * for the Lemon8 case study as a single filled-width column. Card images and
 * spacing come from Figma node 1113:7178 ("Ideation", file
 * DfbSPhyOyXqGekwuDuRAbM) via get_design_context — a 3-column photo waterfall
 * on #fafafa, 20px gap, 0 corner radius, shadow
 * 0px 4px 28px 0px rgba(0,0,0,0.04) — flattened here into one stack, each
 * card kept at its own real aspect ratio.
 *
 * The stack is taller than its slot, so cards render at natural (unscaled)
 * size and the frame scrolls. Every inset, gap and hover offset is expressed
 * against the slot width, so the whole stack rescales with the column.
 *
 * Entrance keeps the source's two active axes for this variant — position
 * and opacity, each in its own wrapper — and hover lives on the innermost
 * content node so it can transition while the entrance is still resolving
 * above it, per the source component's rule.
 */

const CARDS: { src: string; ratio: number }[] = [
  { src: '/assets/figma-hover-lift/image9.png', ratio: 780 / 600 },
  { src: '/assets/figma-hover-lift/image6.png', ratio: 780 / 604 },
  { src: '/assets/figma-hover-lift/image3.png', ratio: 782 / 600 },
  { src: '/assets/figma-hover-lift/image7.png', ratio: 780 / 832 },
  { src: '/assets/figma-hover-lift/image8.png', ratio: 780 / 552 },
  { src: '/assets/figma-hover-lift/image10.png', ratio: 780 / 404 },
  { src: '/assets/figma-hover-lift/image11.png', ratio: 780 / 624 },
  { src: '/assets/figma-hover-lift/image12.png', ratio: 780 / 532 },
];

const GAP = 5.13; // cqw, 20px / 390px from the Figma frame
const SIDE_INSET = 5; // %, the 20px inset measured against the 400px slot it was fitted to

export default function HoverLiftGallery() {
  return (
    <div className="hl-frame">
      <style>{CSS}</style>
      <div className="hl-viewport">
        <div className="hl-col">
          {CARDS.map((card, i) => (
            <div
              className="hl-layer"
              key={i}
              style={{ '--ratio': card.ratio, '--delay': `${i * 55}ms` } as React.CSSProperties}
            >
              <div className="hl-pos">
                <div className="hl-op">
                  <div className="hl-content">
                    <img src={card.src} alt="" className="hl-img" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CSS = `
.hl-frame {
  width: 100%;
  height: 100%;
  background: #fafafa;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hl-frame::-webkit-scrollbar {
  display: none;
}
.hl-viewport {
  container-type: inline-size;
  width: 100%;
  padding: 0 ${SIDE_INSET}%;
  box-sizing: border-box;
  display: flex;
}
.hl-col {
  container-type: inline-size;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${GAP}cqw;
}
.hl-layer { width: 100%; aspect-ratio: var(--ratio); flex: none; }
.hl-pos, .hl-op { height: 100%; }
.hl-pos {
  animation: hl-pos 500ms cubic-bezier(0.23, 1, 0.32, 1) var(--delay) both;
}
.hl-op {
  animation: hl-op 400ms linear var(--delay) both;
}
@keyframes hl-pos {
  from { transform: translate3d(0, 3.5cqw, 0); }
  to   { transform: translate3d(0, 0, 0); }
}
@keyframes hl-op {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.hl-content {
  position: relative;
  height: 100%;
  overflow: hidden;
  box-shadow: 0px 4px 28px 0px rgba(0,0,0,0.04);
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
}
.hl-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
@media (hover: hover) and (pointer: fine) {
  .hl-layer:hover .hl-content {
    transform: translateY(-1.2cqw) scale(1.012);
    transition-duration: 200ms;
  }
  .hl-layer:active .hl-content {
    transform: translateY(-1.2cqw) scale(0.997);
    transition-duration: 120ms;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hl-pos { animation: none; }
  .hl-op { animation-duration: 200ms; animation-delay: 0ms; }
  .hl-content { transition: none; }
  .hl-layer:hover .hl-content, .hl-layer:active .hl-content { transform: none; }
}
`;
