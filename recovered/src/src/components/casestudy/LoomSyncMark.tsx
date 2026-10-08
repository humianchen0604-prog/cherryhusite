/**
 * Hub sync — the illustration for "You can also sync from existing tools".
 *
 * Six third-party tools ring a central folder. Nothing moves position: each
 * rail's dashes brighten in turn from the tool end inward, and the folder
 * gives slightly as the charge lands. The pulse spans exactly the share of
 * the cycle the travelling head does not use, so one head fires as the
 * previous tail dies and the chase never rests.
 *
 * Pure SVG + CSS (keyframes live in ../../app/loom/loom.css), so this stays a
 * Server Component — no JS ships for it. One viewBox rather than the original
 * scaled-div stage, so it scales cleanly at any size.
 */

/** [x1, y1, x2, y2, position along its rail 0→1] */
type Dash = readonly [number, number, number, number, number];

/* Six rails, each running from a tool toward the centre. `p` drives the
   per-dash animation-delay, which is what makes the light travel. */
const RAILS: readonly Dash[] = [
  // top
  [320, 150, 320, 155, 0], [320, 164, 320, 169, 0.2], [320, 178, 320, 183, 0.4],
  [320, 192, 320, 197, 0.6], [320, 206, 320, 211, 0.8], [320, 220, 320, 225, 1],
  // upper right
  [472.3, 223, 467.8, 225.3, 0], [460.7, 228.9, 456.3, 231.1, 0.143],
  [449.2, 234.7, 444.7, 237, 0.286], [437.6, 240.6, 433.2, 242.8, 0.429],
  [426.1, 246.4, 421.6, 248.7, 0.571], [414.5, 252.2, 410.1, 254.5, 0.714],
  [403, 258.1, 398.5, 260.3, 0.857], [391.4, 263.9, 386.9, 266.2, 1],
  // lower right
  [472.3, 377, 467.8, 374.7, 0], [460.7, 371.1, 456.3, 368.9, 0.143],
  [449.2, 365.3, 444.7, 363, 0.286], [437.6, 359.4, 433.2, 357.2, 0.429],
  [426.1, 353.6, 421.6, 351.3, 0.571], [414.5, 347.8, 410.1, 345.5, 0.714],
  [403, 341.9, 398.5, 339.7, 0.857], [391.4, 336.1, 386.9, 333.8, 1],
  // bottom
  [320, 450, 320, 445, 0], [320, 436, 320, 431, 0.2], [320, 422, 320, 417, 0.4],
  [320, 408, 320, 403, 0.6], [320, 394, 320, 389, 0.8], [320, 380, 320, 375, 1],
  // lower left
  [167.7, 377, 172.2, 374.7, 0], [179.3, 371.1, 183.7, 368.9, 0.143],
  [190.8, 365.3, 195.3, 363, 0.286], [202.4, 359.4, 206.8, 357.2, 0.429],
  [213.9, 353.6, 218.4, 351.3, 0.571], [225.5, 347.8, 229.9, 345.5, 0.714],
  [237, 341.9, 241.5, 339.7, 0.857], [248.6, 336.1, 253.1, 333.8, 1],
  // upper left
  [167.7, 223, 172.2, 225.3, 0], [179.3, 228.9, 183.7, 231.1, 0.143],
  [190.8, 234.7, 195.3, 237, 0.286], [202.4, 240.6, 206.8, 242.8, 0.429],
  [213.9, 246.4, 218.4, 248.7, 0.571], [225.5, 252.2, 229.9, 254.5, 0.714],
  [237, 258.1, 241.5, 260.3, 0.857], [248.6, 263.9, 253.1, 266.2, 1],
];

/** Tool icons, clockwise from the top. Centres are ±188 / ±95 off the hub. */
const TOOLS: readonly { src: string; cx: number; cy: number }[] = [
  { src: '/assets/loom/sync/sync-01.png', cx: 320, cy: 110 },
  { src: '/assets/loom/sync/sync-02.png', cx: 508, cy: 205 },
  { src: '/assets/loom/sync/sync-03.png', cx: 508, cy: 395 },
  { src: '/assets/loom/sync/sync-04.png', cx: 320, cy: 490 },
  { src: '/assets/loom/sync/sync-05.png', cx: 132, cy: 395 },
  { src: '/assets/loom/sync/sync-06.png', cx: 132, cy: 205 },
];

const ICON = 80;

export default function LoomSyncMark() {
  return (
    // viewBox is cropped to the artwork's own bounds rather than the original
    // 640x600 stage, so no dead margin eats into the card.
    <svg className="loom-sync" viewBox="92 70 456 460" role="img" aria-label="Six connected tools syncing into one place">
      {RAILS.map(([x1, y1, x2, y2, p], i) => (
        <line
          key={i}
          className="loom-sync__dash"
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          style={{ '--p': p } as React.CSSProperties}
        />
      ))}

      {/* The hub keeps its own 136-unit coordinate space, shifted into place. */}
      <g transform="translate(252 232)">
        <circle cx="68" cy="68" r="68" fill="#3D91FE" />
        <path
          className="loom-sync__glyph"
          d="M39 41h20l10 10h28a9 9 0 0 1 9 9v26a9 9 0 0 1-9 9H39a9 9 0 0 1-9-9V50a9 9 0 0 1 9-9Z"
          fill="#8BBDFE"
          stroke="#fff"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </g>

      {TOOLS.map(({ src, cx, cy }) => (
        <image key={src} href={src} x={cx - ICON / 2} y={cy - ICON / 2} width={ICON} height={ICON} />
      ))}
    </svg>
  );
}
