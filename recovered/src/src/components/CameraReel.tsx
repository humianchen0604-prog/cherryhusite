'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';
import { CAMERA_PHOTOS, type Photo } from './cameraPhotos';
import PolaroidCollage from './PolaroidCollage';
import { GUESTBOOK_OPEN_EVENT, isGuestbookOpen } from '@/lib/guestbookOpen';

/**
 * The camera reel that closes the About section — five cameras stacked on a
 * curve; click one and the stack rotates to bring it to the focus position.
 *
 * Figma nodes 1602:31159 ("Canon A560 Focused") and 1602:31166 ("Minolta
 * Focused"). Comparing the two frames shows the rule behind the hand-placed
 * coordinates: the cameras are a single column with a constant 40px gap, and the
 * whole column shifts so the focused one centres in the 602px stage. Both frames
 * measure 530px of stack and put the focused centre at y≈301, so the layout is
 * derived here rather than transcribed — it stays correct for all five states,
 * not just the two that were drawn.
 */

const STAGE_W = 160;
const STAGE_H = 602;
const CARD_W = 100;
const GAP = 40;

/** Reel order, taken from the "Canon A560 Focused" frame top to bottom. */
const CAMERAS = [
  { id: 'polaroid-flip', name: 'Polaroid Flip', h: 97 },
  { id: 'minolta', name: 'Minolta 75w', h: 63 },
  { id: 'canon-a560', name: 'Canon A560', h: 80 },
  { id: 'polaroid-go', name: 'Polaroid Go Gen2', h: 73 },
  { id: 'ricoh-gr3', name: 'Ricoh GR III hdf', h: 57 },
] as const;

/**
 * The focused camera's photos, as a looping masonry beside the reel.
 *
 * Four columns of equal width; each photo keeps its own aspect ratio so the
 * columns stagger. Photos go to the shortest column so the four end level.
 *
 * The loop: each column renders its photos twice and is offset by
 * `scroll % columnHeight`, so it tiles seamlessly and forever. Columns differ in
 * height, so each has its own period and they drift out of phase — which is what
 * keeps the repeat from reading as one big repeating block. An idle autoplay
 * advances the offset; the gallery does not capture page scroll.
 */
const GALLERY_COLUMNS = 4;
const GALLERY_GAP = 10;
/** Idle autoplay speed — slow enough to read as ambient, not urgent. */
const AUTO_PX_PER_SEC = 24; // 25% slower than the original 32

/*
 * The reel is drawn at three-quarters of the size it would fit at, and centred
 * in the column it would otherwise have filled — so shrinking it does not drag
 * the masonry leftward. Wide screens widen the gap again on top of that.
 */
/** The page's own bottom-edge blur, reused over the wall. See BottomBlur.tsx. */
const BLUR_LAYERS: Array<{ mask: string; blur: string }> = [
  { mask: 'linear-gradient(to bottom, transparent 0.0%, black 16.7%, black 33.3%, transparent 50.0%)', blur: '0.092rem' },
  { mask: 'linear-gradient(to bottom, transparent 16.7%, black 33.3%, black 50.0%, transparent 66.7%)', blur: '0.154rem' },
  { mask: 'linear-gradient(to bottom, transparent 33.3%, black 50.0%, black 66.7%, transparent 83.3%)', blur: '0.300rem' },
  { mask: 'linear-gradient(to bottom, transparent 50.0%, black 66.7%, black 83.3%)', blur: '0.585rem' },
  { mask: 'linear-gradient(to bottom, transparent 66.7%, black 83.3%)', blur: '0.977rem' },
  { mask: 'linear-gradient(to bottom, transparent 83.3%, black 100.0%)', blur: '1.200rem' },
];

const LARGE_BP = 1600;
const REEL_SCALE = 0.75;
/** Gap to the masonry, as a fraction of the reel column's width. */
const GAP_RATIO = 0.56;
const GAP_BOOST = 1.5;
const LARGE_GAP_BOOST = 1.6875; // 1.5x, +50% again, then trimmed back 25%

/** Shortest column first, so the four end level rather than ragged. */
function toColumns(items: Photo[], columns: number) {
  const cols: Photo[][] = Array.from({ length: columns }, () => []);
  const ratios = new Array<number>(columns).fill(0);
  for (const item of items) {
    const shortest = ratios.indexOf(Math.min(...ratios));
    cols[shortest].push(item);
    // Columns share a width, so relative height is just the aspect ratio.
    ratios[shortest] += item.h / item.w;
  }
  return cols;
}

/**
 * These two cameras get the exact Figma photo scatter (PolaroidCollage)
 * instead of the generic looping masonry every other camera uses.
 */
const EXACT_COLLAGE_IDS = new Set(['polaroid-flip', 'polaroid-go']);

const COUNT = CAMERAS.length;
const FOCUS_SLOT = 2; // the middle of five

/**
 * How far each slot juts to the right. Straight from the design: the focused row
 * sits at 60 and the rows above and below step back to 20 and -20, so the stack
 * reads as an arc bowing toward the viewer.
 */
const SLOT_X = [-20, 20, 60, 20, -20];

/** Slot each camera occupies, given which one is focused. */
const slotOf = (index: number, selected: number) =>
  (index - selected + FOCUS_SLOT + COUNT) % COUNT;

/*
 * Choosing the top or bottom camera rotates the reel by two, which sends the two
 * cameras at the far end all the way across the stage. Travelling that whole
 * distance in front of the others reads as a teleport, so those cards instead
 * leave through the left edge — into the gradient the design already puts there —
 * and come back in from the same side at their new height.
 *
 * A card wraps when its slot would land outside the reel and has to come round.
 */
const EXIT_X = -170; // clear of the 100px card at its leftmost slot (-20)
const EXIT_MS = 112; // 90ms, 25% slower
const ENTER_MS = 188; // 150ms, 25% slower

function wrapsAround(oldSlot: number, shift: number) {
  const raw = oldSlot + shift;
  return raw < 0 || raw > COUNT - 1;
}

/**
 * Y for every camera, for a given selection: lay the column out with a constant
 * gap in slot order, then shift it so the focused card's centre is the stage's.
 */
function layout(selected: number) {
  const bySlot = [...CAMERAS].map((c, i) => ({ ...c, i, slot: slotOf(i, selected) }));
  bySlot.sort((a, b) => a.slot - b.slot);

  const tops: number[] = [];
  let y = 0;
  for (const c of bySlot) {
    tops.push(y);
    y += c.h + GAP;
  }

  const focused = bySlot[FOCUS_SLOT];
  const shift = STAGE_H / 2 - (tops[FOCUS_SLOT] + focused.h / 2);

  const out = new Array<{ x: number; y: number; slot: number }>(COUNT);
  bySlot.forEach((c, s) => {
    out[c.i] = { x: SLOT_X[s], y: tops[s] + shift, slot: s };
  });
  return out;
}

export default function CameraReel() {
  const [selected, setSelected] = useState(1); // Minolta 75w
  const panelRef = useRef<HTMLDivElement>(null);
  // Cards mid-wrap, and which leg of the trip they are on.
  const [wrapping, setWrapping] = useState<Set<number>>(new Set());
  const [leg, setLeg] = useState<'out' | 'back' | null>(null);
  // Where each wrapping camera left from, so its exit does not also slide to
  // the new height now that the stack re-lays-out before the trip is over.
  const [exitFrom, setExitFrom] = useState<Map<number, { x: number; y: number }> | null>(null);
  const timers = useRef<number[]>([]);
  const positions = layout(selected);
  const isExactCollage = EXACT_COLLAGE_IDS.has(CAMERAS[selected].id);
  const gallery = CAMERA_PHOTOS[CAMERAS[selected].id];
  const galleryCols = gallery && !isExactCollage ? toColumns(gallery, GALLERY_COLUMNS) : [];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsetRef = useRef(0);
  // Desktop cursor-follow pill: each camera shows its name under the pointer.
  const [pillLabel, setPillLabel] = useState<string>(CAMERAS[1].name);
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  function cameraPillHandlers(name: string) {
    return {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        setPillLabel(name);
        pillHandlers.onMouseEnter(e);
      },
      onMouseMove: pillHandlers.onMouseMove,
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        const next = e.relatedTarget;
        // Stay visible while moving between cameras in the same stage.
        if (next instanceof Element && next.closest('.camera-reel__item')) return;
        pillHandlers.onMouseLeave();
      },
    };
  }

  /*
   * Offset each column by the scroll position wrapped to its own height. Because
   * the photos are rendered twice, the wrap is invisible — column i is always
   * showing some part of a continuous strip.
   */
  const applyLoop = useCallback(() => {
    const y = offsetRef.current;
    colRefs.current.forEach((col) => {
      if (!col) return;
      // The strip holds two copies, so one period is half its height.
      const period = col.scrollHeight / 2;
      if (period <= 0) return;
      col.style.transform = `translate3d(0, ${-(y % period)}px, 0)`;
    });
  }, []);

  useEffect(() => {
    offsetRef.current = 0;
    applyLoop();
    // Images decode after mount and change each column's height, so re-measure.
    const ro = new ResizeObserver(applyLoop);
    colRefs.current.forEach((c) => c && ro.observe(c));
    return () => ro.disconnect();
  }, [applyLoop, selected]);

  /* Ambient autoplay while the wall is on screen. Off under reduced motion so
     the page stays still for vestibular / focus needs, and held while the
     guestbook is open over the page. It resumes from the same offset. */
  useEffect(() => {
    if (!gallery || isExactCollage) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMq.matches) return;

    let raf = 0;
    let last = 0;
    let visible = false;

    const tick = (now: number) => {
      if (!visible || document.hidden || isGuestbookOpen()) {
        last = 0;
        return;
      }
      if (!last) last = now;
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      offsetRef.current += AUTO_PX_PER_SEC * dt;
      applyLoop();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio > 0.08;
        if (visible && !document.hidden && !isGuestbookOpen()) start();
        else stop();
      },
      { threshold: [0, 0.08, 0.2] },
    );
    io.observe(scroller);

    const onVis = () => {
      if (document.hidden || isGuestbookOpen()) stop();
      else if (visible) start();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener(GUESTBOOK_OPEN_EVENT, onVis);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener(GUESTBOOK_OPEN_EVENT, onVis);
    };
  }, [applyLoop, gallery, isExactCollage, selected]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const choose = (next: number) => {
    if (next === selected) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const shift = FOCUS_SLOT - slotOf(next, selected);
    const round = new Set<number>();
    CAMERAS.forEach((_, i) => {
      if (i !== next && wrapsAround(slotOf(i, selected), shift)) round.add(i);
    });

    if (round.size === 0) {
      setSelected(next);
      return;
    }

    // Out through the left, then reappear at the new height and slide back in.
    //
    // The whole stack re-lays-out now, in the same commit as the click. Holding
    // the selection back until the exit finished meant every camera — the
    // clicked one included — stood still for EXIT_MS before anything happened,
    // which is the entire click-to-motion delay however short the transitions
    // are. Only the wrapping cameras wait, and they wait off-stage.
    const leaving = new Map<number, { x: number; y: number }>();
    round.forEach((i) => leaving.set(i, positions[i]));
    setExitFrom(leaving);
    setWrapping(round);
    setLeg('out');
    setSelected(next);

    timers.current.push(
      window.setTimeout(() => {
        setLeg('back');
        // One frame parked off-stage at the new height, so the return animates
        // from the edge instead of snapping straight to its slot.
        timers.current.push(
          window.setTimeout(() => setLeg(null), 20)
        );
      }, EXIT_MS)
    );
    timers.current.push(
      window.setTimeout(() => {
        setWrapping(new Set());
        setExitFrom(null);
      }, EXIT_MS + ENTER_MS + 40)
    );
  };

  /*
   * The stage is authored at the design's fixed 602px, so it is scaled to
   * whatever height the strip resolves to. Everything the layout needs is
   * derived here in one place: the reel's own scale, the column it sits in, and
   * where the masonry starts.
   */
  const [metrics, setMetrics] = useState({ scale: 1, reelW: 0, reelLeft: 0, galleryLeft: 0 });
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => {
      const fit = el.getBoundingClientRect().height / STAGE_H;
      const large = window.innerWidth >= LARGE_BP;
      // The column keeps the width the reel would have had, so shrinking the
      // reel does not drag the masonry left with it.
      const columnW = STAGE_W * fit;
      const reelScale = fit * REEL_SCALE;
      const reelW = STAGE_W * reelScale;
      const gap = columnW * GAP_RATIO * (large ? LARGE_GAP_BOOST : GAP_BOOST);
      const reelLeft = (columnW - reelW) / 2; // centred in its column
      setMetrics({
        scale: reelScale,
        reelW,
        reelLeft,
        // From the reel's own edge: otherwise a narrower reel would widen the
        // visible gap on top of the boost, compounding the two.
        galleryLeft: reelLeft + reelW + gap,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div className="camera-reel">
      <div
        className="camera-reel__panel"
        ref={panelRef}
        style={
          {
            '--reel-scale': metrics.scale,
            '--reel-left': `${metrics.reelLeft}px`,
            '--gallery-left': `${metrics.galleryLeft}px`,
          } as React.CSSProperties
        }
      >
        <div className="camera-reel__stage" style={{ width: STAGE_W, height: STAGE_H }}>
          {CAMERAS.map((cam, i) => {
          const { x, y } = positions[i];
          const isFocused = i === selected;
          const isWrapping = wrapping.has(i);
          // 'out' rides the old position; 'back' waits off-stage at the new one.
          const offStage = isWrapping && (leg === 'out' || leg === 'back');
          const tx = offStage ? EXIT_X : x;
          // Leaving cameras hold the height they started at; by 'back' they are
          // invisible and jump to the new one.
          const leftFrom = leg === 'out' ? exitFrom?.get(i) : undefined;
          const ty = leftFrom ? leftFrom.y : y;
          const opacity = offStage ? 0 : isFocused ? 1 : 0.1;
          // The single frame parked at the edge must not animate, or the card
          // would slide across from wherever it was.
          const instant = isWrapping && leg === 'back';
          return (
            <button
              key={cam.id}
              type="button"
              className="camera-reel__item"
              aria-pressed={isFocused}
              aria-label={cam.name}
              onClick={() => choose(i)}
              {...cameraPillHandlers(cam.name)}
              style={{
                width: CARD_W,
                height: cam.h,
                // One transform, so the move is a single composited property.
                transform: `translate(${tx}px, ${ty}px)`,
                opacity,
                zIndex: isFocused ? 2 : 1,
                ...(instant
                  ? { transition: 'none' }
                  : isWrapping
                    ? {
                        transition:
                          leg === 'out'
                            ? `transform ${EXIT_MS}ms cubic-bezier(0.23, 1, 0.32, 1), opacity ${EXIT_MS}ms ease`
                            : `transform ${ENTER_MS}ms cubic-bezier(0.23, 1, 0.32, 1), opacity ${ENTER_MS}ms ease`,
                      }
                    : null),
              }}
            >
              <img
                className="camera-reel__image"
                src={`/assets/cameras/${cam.id}.png`}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </button>
          );
        })}
        </div>
        {/* Fades the reel out against the left edge, as in the design. */}
        <div className="camera-reel__fade" aria-hidden />

        {/* Softens the bottom edge of the wall, using the same progressive blur
            the page uses along its own bottom edge — six masked layers, each
            blurred harder than the last. Outside the scroller, so it stays
            pinned while the photos run past underneath. Only the looping
            masonry dissolves at the edge; the fixed collage has no edge to
            dissolve at. */}
        {gallery && !isExactCollage && (
          <div className="camera-reel__gallery-fade" aria-hidden>
            {BLUR_LAYERS.map((l, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  WebkitMaskImage: l.mask,
                  maskImage: l.mask,
                  WebkitBackdropFilter: `blur(${l.blur})`,
                  backdropFilter: `blur(${l.blur})`,
                }}
              />
            ))}
          </div>
        )}

        {/* Polaroid Flip / Polaroid Go: the exact Figma scatter, not the
            looping masonry. Keyed on the camera so re-selecting it replays
            the entrance. */}
        {isExactCollage && (
          <PolaroidCollage
            key={CAMERAS[selected].id}
            cameraId={CAMERAS[selected].id as 'polaroid-flip' | 'polaroid-go'}
          />
        )}

        {/* The focused camera's photos. Keyed on the camera so switching
            remounts and replays the entrance instead of crossfading two rolls. */}
        {gallery && !isExactCollage && (
          <div className="camera-reel__gallery" ref={scrollerRef} key={CAMERAS[selected].id}>
            <div className="camera-reel__wall">
              {galleryCols.map((col, c) => (
                <div className="camera-reel__gallery-col" key={c}>
                  <div
                    className="camera-reel__strip"
                    ref={(el) => {
                      colRefs.current[c] = el;
                    }}
                  >
                    {/* Twice, so the column always has content past the wrap. */}
                    {[0, 1].map((copy) =>
                      col.map((photo, r) => (
                        <img
                          key={`${copy}-${photo.src}`}
                          className="camera-reel__photo"
                          src={photo.src}
                          width={photo.w}
                          height={photo.h}
                          alt=""
                          loading={copy === 0 && r < 2 ? 'eager' : 'lazy'}
                          decoding="async"
                          aria-hidden={copy === 1}
                          style={{ animationDelay: `${Math.min((c * 2 + r) * 50, 500)}ms` }}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label={pillLabel} /> : null}
    </div>
  );
}
