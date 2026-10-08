'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Book3D from '@/components/Book3D';
import DotField from '@/components/DotField';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';
import WallRecordPlayer, { type WallRecordPlayerHandle } from '@/components/WallRecordPlayer';
import { HINT_WRITTEN_ATTR, HINT_WRITTEN_EVENT } from '@/lib/aboutHint';
import './aboutStickerBoard.css';

/**
 * The sticker board that sits beside the About envelope — Figma node 1815:2669
 * (file DfbSPhyOyXqGekwuDuRAbM), pulled with get_design_context.
 *
 * It is a 588 x 580 frame of loose objects on #fafafa: a record player, a
 * book, the design-tool icons and a little TV. Two of them are not flat
 * art:
 *
 *   - the book is the existing <Book3D> component rather than a picture of a
 *     cover, so it keeps its hover;
 *   - the record is <WallRecordPlayer>, a wall-mounted player with a pull
 *     cord that plays "Vultures". It replaced the Figma frame's flat vinyl,
 *     so its box is not a Figma measurement.
 *
 * Every sticker can be picked up and dropped anywhere on the board. Positions
 * are held as offsets in `cqw`, not px, so a moved sticker stays where the
 * viewer put it relative to the board when the window resizes.
 */

/** The About frame these coordinates were measured in — the whole envelope +
 *  board card, drawn at 2000 wide (its 2000 : 970 aspect is the frame's). */
const FRAME_W = 2000;

/** Frame px -> a length against the board's own width. */
const u = (px: number) => `${(px / FRAME_W) * 100}cqw`;

type Sticker = {
  id: string;
  /** Axis-aligned bounding box in the frame. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotation, and the true (unrotated) size, for the turned stickers. */
  rot?: number;
  iw?: number;
  ih?: number;
};

/*
 * The board now spans the whole About frame, with the envelope in the middle,
 * so the stickers frame it on both sides — measured from the layout mock:
 * reading things (book, T, colours, TV, tools) down the left, and the record
 * player, manifesto note and drinks down the right.
 *
 * Source order is paint order, so it doubles as the resting z-index; dragging
 * lifts a sticker above all of them.
 */
const STICKERS: Sticker[] = [
  { id: 'book', x: 57, y: 88, w: 136.8, h: 172.4, rot: -16.94, iw: 97.1, ih: 150.7 },
  { id: 'text-tool', x: 212, y: 52, w: 58, h: 58, rot: 12, iw: 48.9, ih: 48.9 },
  { id: 'colors', x: 54, y: 353, w: 53.6, h: 47.8 },
  /* 10% up from the mock's size, about its own centre. */
  { id: 'tv', x: 70.8, y: 457.3, w: 158.4, h: 148.5, rot: -8, iw: 141.5, ih: 131.5 },
  { id: 'folder', x: 150, y: 716, w: 198, h: 177 },
  /* The player hangs a cord as long as itself, so its box is 1 : 2. 10% down
     from the mock's size, about the centre of the player body (the box's top
     square), so the player stays put and only the cord gets shorter. */
  { id: 'vinyl', x: 1796.8, y: 50.8, w: 158.4, h: 316.8 },
  /* Note card + mouse: the card tilted 13° (10% up from the mock's size,
     about its own centre), the mouse resting on its lower-right corner.
     Box = the rotated card's AABB. */
  { id: 'note', x: 1679.5, y: 414.8, w: 297, h: 225.5, rot: 13, iw: 265.1, ih: 172.3 },
  { id: 'mouse', x: 1892.5, y: 599.8, w: 58, h: 71 },
  /* Drinks: the milk tea sits behind and to the right of the matcha, tilted
     further (17° vs 5°), both at the same photo scale. */
  { id: 'milk-tea', x: 1881.9, y: 819, w: 100.4, h: 115, rot: 17, iw: 75.2, ih: 97.4 },
  { id: 'matcha', x: 1868, y: 812, w: 85, h: 113.5, rot: 5, iw: 75.9, ih: 107.3 },
];

const ART = '/assets/about-board';

/** Cursor-follow pill copy for the stickers that announce what they are. */
const PILL_LABELS: Record<string, string> = {
  vinyl: 'Play',
  book: 'Currently reading',
  folder: 'Tools I design with',
  tv: 'Learning animation',
  note: 'Stay curious',
  mouse: 'My mouse',
  matcha: 'Best matcha',
  'milk-tea': 'Oat milk latte',
};

/** The book cover's own width, in the same units the sticker box uses —
 *  kept in step with the `book` sticker's `iw` above. */
const BOOK_W = u(97.1);
/* Board thickness kept to the component's own 28/276 ratio at this size. */
const BOOK_DEPTH = u(97.1 * (28 / 276));

type Offset = { x: number; y: number };

/** A click that moves less than this (px) plays the record instead of
 *  counting as a drag of the player. */
const TAP_SLOP = 4;

const PLAY_ICON = (
  <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M3.5 2.2v9.6L11.4 7z" />
  </svg>
);
const PAUSE_ICON = (
  <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M3 2.2h2.8v9.6H3zM8.2 2.2H11v9.6H8.2z" />
  </svg>
);

export default function AboutStickerBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});
  const [lifted, setLifted] = useState<Record<string, number>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [pillId, setPillId] = useState('vinyl');
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<WallRecordPlayerHandle>(null);
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  function onStickerEnter(id: string, e: MouseEvent<HTMLElement>) {
    setPillId(id);
    pillHandlers.onMouseEnter(e);
  }

  const isVinylPill = pillId === 'vinyl';
  const pillLabel = isVinylPill ? (playing ? 'Pause' : 'Play') : PILL_LABELS[pillId];

  function onStickerLeave(e: MouseEvent<HTMLElement>) {
    const next = e.relatedTarget;
    if (next instanceof Element && boardRef.current?.contains(next)) {
      const nextId = next.closest('.asb-sticker')?.getAttribute('data-sticker');
      if (nextId && PILL_LABELS[nextId]) return;
    }
    pillHandlers.onMouseLeave();
  }

  /** Highest z handed out so far; the resting stack only goes up to 10. */
  const topZ = useRef(10);
  const drag = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    base: Offset;
    /** Board width at grab time — converts px travel into `cqw`. */
    boardW: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (id: string, e: React.PointerEvent<HTMLDivElement>) => {
      // Let the browser keep secondary clicks (context menu, middle-click).
      if (e.button !== 0) return;
      const boardW = boardRef.current?.getBoundingClientRect().width ?? 0;
      if (!boardW) return;

      // Capture keeps the drag alive when the pointer outruns the sticker, but
      // it throws if the pointer is already gone — that must not abort the grab.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* no capture; the board still tracks the move */
      }
      drag.current = {
        id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        base: offsets[id] ?? { x: 0, y: 0 },
        boardW,
      };
      topZ.current += 1;
      setLifted((z) => ({ ...z, [id]: topZ.current }));
      setDragId(id);
      // Don't leave the follow pill stuck to a dragging sticker.
      pillHandlers.onMouseLeave();
    },
    [offsets, pillHandlers],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    // px travel -> % of board width, the same unit the resting position uses.
    const dx = ((e.clientX - d.startX) / d.boardW) * 100;
    const dy = ((e.clientY - d.startY) / d.boardW) * 100;
    setOffsets((o) => ({ ...o, [d.id]: { x: d.base.x + dx, y: d.base.y + dy } }));
  }, []);

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      drag.current = null;
      setDragId(null);
      // A press on the record player that barely moved is a click: pull the
      // cord for the viewer, and bring back the pill the grab hid.
      const tap =
        e.type === 'pointerup' && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < TAP_SLOP;
      if (d.id === 'vinyl' && tap) {
        playerRef.current?.tug();
        onStickerEnter('vinyl', e);
      }
    },
    [pillHandlers],
  );

  return (
    <div className="asb-board" ref={boardRef}>
      <PhilosophyHint />
      {STICKERS.map((s, i) => {
        const off = offsets[s.id];
        const label = PILL_LABELS[s.id];
        return (
          <div
            key={s.id}
            className="asb-sticker"
            data-sticker={s.id}
            data-dragging={dragId === s.id ? '' : undefined}
            onPointerDown={(e) => onPointerDown(s.id, e)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onMouseEnter={label ? (e) => onStickerEnter(s.id, e) : undefined}
            onMouseMove={label ? pillHandlers.onMouseMove : undefined}
            onMouseLeave={label ? onStickerLeave : undefined}
            style={
              {
                '--x': u(s.x),
                '--y': u(s.y),
                '--w': u(s.w),
                '--h': u(s.h),
                '--z': lifted[s.id] ?? i + 1,
                ...(off ? { '--dx': `${off.x}cqw`, '--dy': `${off.y}cqw` } : null),
              } as React.CSSProperties
            }
          >
            <div
              className={`asb-art${s.id === 'book' ? ' asb-book' : ''}`}
              style={
                {
                  ...(s.rot ? { '--rot': `${s.rot}deg` } : null),
                  ...(s.iw ? { '--iw': u(s.iw) } : null),
                  ...(s.ih ? { '--ih': u(s.ih) } : null),
                } as React.CSSProperties
              }
            >
              {s.id === 'vinyl' ? (
                <WallRecordPlayer ref={playerRef} onPlayingChange={setPlaying} />
              ) : (
                <Art id={s.id} />
              )}
            </div>
          </div>
        );
      })}
      {mounted ? (
        <CursorFollowPill
          pillRef={pillRef}
          on={on}
          label={pillLabel}
          icon={isVinylPill ? (playing ? PAUSE_ICON : PLAY_ICON) : undefined}
        />
      ) : null}
    </div>
  );
}

/*
 * "My design philosophy" — a handwritten aside to the right of the envelope,
 * with a doodled star and an arrow pointing back at it. Star and arrow are the
 * Figma vectors (2308:18424, 2317:18607). The first time the board scrolls
 * into view it all writes itself in as one pass: "My design", the star,
 * "philosophy", then the arrow down to the envelope. Placed in frame units
 * like the stickers, but not draggable.
 */
const STAR_PATH =
  'M9.62328 3.36329C9.59983 4.21621 8.49562 9.28125 6.84879 13.3083C5.48656 16.6394 4.15234 19.6199 3.94856 21.0416C3.87882 21.5282 4.59833 21.5087 5.21566 21.2756C9.44071 19.6797 15.3079 15.6928 18.4142 14.2301C18.9837 13.962 19.4384 13.777 19.4924 13.4854C19.8028 11.8112 10.1796 8.98187 3.27655 5.99913C2.13498 5.50587 0.93118 5.02327 0.782713 5.20579C-1.4521 7.95327 10.1401 16.2759 14.8516 21.982C15.829 23.1657 16.6426 24.0527 17.1169 24.3455C19.4541 25.7883 13.7991 16.7574 12.9683 12.9377C12.3844 10.2536 12.2966 7.96252 11.9412 5.81916C11.7688 4.83058 11.4732 3.72832 11.0701 2.55667C10.878 2.00715 10.7114 1.54912 10.2161 0.500118';
const ARROW_SHAFT =
  'M34.5058 0.500053C35.0739 5.07468 34.8286 7.34057 33.4015 9.52488C31.9745 11.7092 30.6983 13.3275 29.644 14.5117C28.5896 15.696 27.7955 16.3971 25.7931 17.6968C23.7907 18.9965 20.604 20.8735 18.3157 22.0845C13.2005 24.7917 11.3242 24.4238 9.98322 24.5936C8.89872 24.731 7.48167 25.0978 6.19751 25.1542C5.90378 25.1582 5.63434 25.1576 5.39089 25.1571C5.14744 25.1566 4.93815 25.1562 4.36056 25.0329';
const ARROW_HEAD =
  'M8.44509 19.5752C8.20223 19.6791 6.2684 21.4499 4.70138 23.3624C3.6222 24.6794 3.18521 25.3388 3.12945 25.7109C3.06829 26.119 6.31122 26.983 10.1783 28.8235C12.3685 29.9206 13.1456 30.2872 13.667 30.5351C13.9081 30.6498 14.1018 30.7419 14.0227 30.7184';

function PhilosophyHint() {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Once the whole pass has played (the arrowhead is its last stroke), mark it
  // written and tell the envelope, whose resting letter hint waits for this so
  // the two play one after the other rather than at once. No motion to wait
  // for under reduced motion; the fallback timer covers a missed event.
  useEffect(() => {
    const el = ref.current;
    if (!drawn || !el) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.setAttribute(HINT_WRITTEN_ATTR, '');
      window.dispatchEvent(new Event(HINT_WRITTEN_EVENT));
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const head = el.querySelector('.asb-hint__head');
    const onEnd = (e: Event) => {
      if (e.target === head) finish();
    };
    el.addEventListener('animationend', onEnd);
    const fallback = window.setTimeout(finish, 1600);
    return () => {
      el.removeEventListener('animationend', onEnd);
      window.clearTimeout(fallback);
    };
  }, [drawn]);

  return (
    <div
      ref={ref}
      className="asb-hint"
      data-drawn={drawn ? '' : undefined}
      aria-hidden="true"
      style={{ '--hx': u(1340), '--hy': u(522), '--hw': u(230), '--hh': u(196) } as React.CSSProperties}
    >
      <p className="asb-hint__text" style={{ left: u(39), top: u(47), fontSize: u(41.5) }}>
        <span className="asb-hint__line asb-hint__line--1">My design</span>
        <span className="asb-hint__line asb-hint__line--2">philosophy</span>
      </p>
      <svg
        className="asb-hint__star"
        viewBox="0 0 20.0002 25.0001"
        style={{ left: u(189), top: u(3), width: u(30), height: u(37.5) }}
      >
        <path d={STAR_PATH} pathLength={1} />
      </svg>
      <svg
        className="asb-hint__arrow"
        viewBox="0 0 39.6165 33.61"
        style={{ left: u(8.3), top: u(135.2), width: u(67.3), height: u(57.1) }}
      >
        <path className="asb-hint__shaft" d={ARROW_SHAFT} pathLength={1} />
        <path className="asb-hint__head" d={ARROW_HEAD} pathLength={1} />
      </svg>
    </div>
  );
}

/**
 * The dot texture, drawn across the whole About frame (envelope + board) rather
 * than just the board, so the two halves read as one card. Render it as the
 * first child of the frame; DotField fills its parent.
 */
export function AboutFrameDots() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === 'dark');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  /* Light dots: rgb 170 on the frame's #fcfcfc, at 0.18 alpha — 40% lighter
     than the 0.3 they were, so the grid recedes further behind the stickers.
     Night alpha stays 0.14. */
  return (
    <DotField
      key={dark ? 'dark' : 'light'}
      dotRadius={1}
      dotSpacing={14}
      bulgeStrength={0}
      glowRadius={0}
      rgb={dark ? '205, 205, 205' : '170, 170, 170'}
      alpha={dark ? 0.14 : 0.18}
    />
  );
}

/** A press that moves less than this (px) on touch counts as a tap on the TV. */
const TV_TAP_SLOP = 6;

/**
 * The TV plays its clip on hover and goes back to the still screen when the
 * pointer leaves or the clip ends. Touch has no hover, so a tap plays it
 * instead (a drag still just moves the sticker).
 */
function TvArt() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const press = useRef<{ x: number; y: number } | null>(null);

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    // Set here, not just via the prop: React doesn't reliably apply `muted` to
    // the element, and <VideoAutoplay> (which used to force it) skips this
    // video. Unmuted, the browser would refuse a play() that hover triggers.
    v.muted = true;
    v.currentTime = 0;
    v.play().catch(() => {});
  };
  const stop = () => {
    const v = videoRef.current;
    setOn(false);
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <div
      style={{ position: 'absolute', inset: 0 }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') play(); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') stop(); }}
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') press.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={(e) => {
        const p = press.current;
        press.current = null;
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < TV_TAP_SLOP) play();
      }}
    >
      <img className="asb-img" src={`${ART}/tv.png`} alt="" />
      <video
        ref={videoRef}
        className="asb-tv-screen"
        src={`${ART}/tv-screen.mp4`}
        data-on={on ? '' : undefined}
        // Opts out of <VideoAutoplay>, which would otherwise start it as soon
        // as the board scrolls into view; this one plays only on hover.
        data-manual-controls=""
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={() => setOn(true)}
        // Anything that pauses it (not just hover-out) hands the screen back to
        // the still image, so a paused clip never sits frozen on the TV.
        onPause={() => setOn(false)}
        onEnded={stop}
      />
    </div>
  );
}

function Art({ id }: { id: string }) {
  switch (id) {
    case 'tv':
      return <TvArt />;

    case 'book':
      return <Book3D width={BOOK_W} depth={BOOK_DEPTH} aspect={86.718 / 134.546} />;

    default: {
      const file: Record<string, string> = {
        'text-tool': 'text-tool.png',
        colors: 'color-circles.png',
        note: 'note-card.png',
        'milk-tea': 'milk-tea.webp',
        matcha: 'matcha.webp',
        mouse: 'mouse.png',
        folder: 'app-folder.png',
      };
      return <img className="asb-img" src={`${ART}/${file[id]}`} alt="" />;
    }
  }
}
