// Progressive backdrop blur pinned to the bottom of the viewport: six stacked
// layers, each masked to a band and blurred a little harder than the last.
const LAYERS: Array<{ mask: string; blur: string }> = [
  { mask: 'linear-gradient(to bottom, transparent 0.0%, black 16.7%, black 33.3%, transparent 50.0%)', blur: '0.092rem' },
  { mask: 'linear-gradient(to bottom, transparent 16.7%, black 33.3%, black 50.0%, transparent 66.7%)', blur: '0.154rem' },
  { mask: 'linear-gradient(to bottom, transparent 33.3%, black 50.0%, black 66.7%, transparent 83.3%)', blur: '0.300rem' },
  { mask: 'linear-gradient(to bottom, transparent 50.0%, black 66.7%, black 83.3%)', blur: '0.585rem' },
  { mask: 'linear-gradient(to bottom, transparent 66.7%, black 83.3%)', blur: '0.977rem' },
  { mask: 'linear-gradient(to bottom, transparent 83.3%, black 100.0%)', blur: '1.200rem' },
];

export default function BottomBlur() {
  return (
    <div className="framer-p5xjl7-container" data-framer-name="Bottom graduate blur">
      <div
        aria-hidden="true"
        style={{
          width: '100%', bottom: '0', left: '0', right: '0', height: '128px',
          position: 'fixed', zIndex: 8, isolation: 'isolate', overflow: 'hidden',
          pointerEvents: 'none', opacity: 1,
        }}
      >
        {LAYERS.map((l, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', inset: 0,
              WebkitMaskImage: l.mask, maskImage: l.mask,
              WebkitBackdropFilter: `blur(${l.blur})`, backdropFilter: `blur(${l.blur})`,
              opacity: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
