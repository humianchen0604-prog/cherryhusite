'use client';

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { toast } from 'sonner';
import { CursorFollowPill, placePill as placePillAt, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';
import { EMAIL } from '@/components/casestudy/CopyableEmail';
import { playPaper } from '@/lib/sfx';
import { HINT_WRITTEN_ATTR, HINT_WRITTEN_EVENT } from '@/lib/aboutHint';

const LINKEDIN_URL = 'https://www.linkedin.com/in/cherryhu0604';
const EMAIL_TOAST_ID = 'about-email-copied';
const EMAIL_TOAST_MS = 1200;

/**
 * The About section's envelope is a separate little app the original page embeds
 * as an iframe overlaying a transparent slot. The server-rendered markup only
 * ships the heading plus a placeholder box; the embed is mounted client-side and
 * the slot is resized to fit once the heading has been measured.
 *
 * Slot height is measured heading height plus the envelope height for the column
 * width; the iframe overhangs the slot, which is what the original does too.
 */
// Source lives in "Portfolio/About me open page"; rebuild with
// scripts/build-envelope.sh. Served from public/about-envelope in every
// environment. Bump EMBED_VERSION after a rebuild so the iframe does not
// keep a cached older index.html.
const EMBED_ORIGIN = '/about-envelope';
const EMBED_VERSION = 95;

// The iframe itself is always 520px tall; the slot it reserves is shorter and
// steps with the column width. Measured on the live site at column widths
// 940/780/648/560/350 -> 480/480/360/360/304.
/*
 * The stage used to be a fixed 520px while the card below it is `envelope`
 * (480 / 360 / 304 by width), so the envelope hung past the card by 520 - envelope
 * — 40px at desktop but 160px at tablet and 216px on phones. The embed is already
 * told `h=envelope` in its URL, so the frame simply matches that and the two agree.
 */

/**
 * The grey card matches the height of the photos under "I shoot film...", which
 * are three columns across the same content width with two 10px gaps, each 1.5083
 * times as tall as it is wide. Deriving it rather than hard-coding keeps the two
 * in step at every breakpoint. (The same figure is used for the skills block; see
 * --photo-strip-h in globals.css.)
 */
/* Matches the gap between "I shoot film..." and the strip under it, so both grey
   cards sit the same distance below their heading. The heading block is
   absolutely positioned, so its own margin cannot produce this. */
const HEADING_GAP = 28;

/* Wide screens give the column enough width that the envelope, drawn to fill its
   slot, outgrows the card it sits on. There it is drawn smaller and centred; the
   card keeps its full height so it still matches the photo strip. */
const LARGE_BP = 1600;
const LARGE_ENVELOPE_SCALE = 0.78;

const PHOTO_GAP_TOTAL = 20;
const PHOTO_ASPECT = 1.5083;
function envelopeHeight(width: number) {
  if (width <= 0) return 480;
  return Math.round(((width - PHOTO_GAP_TOTAL) / 3) * PHOTO_ASPECT);
}

// The handwritten hint is drawn by the host, not the embed. Copy sits centred
// under the envelope; the sketch arrow hangs off the left of that copy and
// is flipped so it points up at the letter. Same Caveat + squiggle glyph as
// the guestbook hint.
const ENVELOPE_STACK_W = 420;
const ENVELOPE_STACK_H = 496;
const HINT_COLOR = 'rgb(var(--fg-rgb, 0 0 0) / 0.6)';
const HINT_ARROW = '/assets/images/FV4kycU8B4v8ARnFe3KPd0eobN4.svg';

const clamp = (min: number, n: number, max: number) => Math.max(min, Math.min(max, n));

const PILL_OFFSET_X = 12;
const PILL_OFFSET_Y = 16;

function canFollowCursor() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Where the envelope graphic actually sits inside the stage. Mirrors
 *  computeEnvelopeFitScale in the embed, including its `fit=fill` mode. */
function envelopeHitRect(width: number, height: number, viewportHeight: number, fill = false) {
  const sw = Math.max(width || 1, 1);
  const sh = Math.max(height || 1, 1);
  if (fill) {
    const s = Math.min((sw - 4) / ENVELOPE_STACK_W, (sh - 4) / ENVELOPE_STACK_H) * 0.9;
    const scale = Number.isFinite(s) && s > 0 ? s : 0.9;
    const w = ENVELOPE_STACK_W * scale;
    const h = ENVELOPE_STACK_H * scale;
    return { left: (sw - w) / 2, top: (sh - h) / 2, width: w, height: h };
  }
  const padX = Math.max(12, sw * 0.05);
  const padY = Math.max(20, sh * 0.1);
  const stageFit = Math.min((sw - padX * 2) / ENVELOPE_STACK_W, (sh - padY * 2) / ENVELOPE_STACK_H);
  const vhBoost = Math.min(1.45, Math.max(0.9, viewportHeight / 820));
  const maxFit = Math.min((sw - 4) / ENVELOPE_STACK_W, (sh - 4) / ENVELOPE_STACK_H) * 0.9;
  const fitScale = Math.min(maxFit, Math.max(0.45, stageFit * vhBoost * 0.9));
  const scale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1;
  const w = ENVELOPE_STACK_W * scale;
  const h = ENVELOPE_STACK_H * scale;
  return { left: (sw - w) / 2, top: (sh - h) / 2, width: w, height: h };
}

/**
 * Caption centred under the envelope graphic. `captionH` is the space the
 * parent already reserved below the stage, so the two stay in sync. The
 * sketch arrow sits to the left of the copy and is flipped vertically so
 * its head aims up at the envelope.
 */
function DirectionHint({
  stageWidth,
  stageHeight,
  captionH,
}: {
  stageWidth: number;
  stageHeight: number;
  captionH: number;
}) {
  const [viewportHeight, setViewportHeight] = useState(820);
  useEffect(() => {
    const on = () => setViewportHeight(window.innerHeight);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const hit = envelopeHitRect(stageWidth, stageHeight, viewportHeight);
  const fontSize = (clamp(11, captionH * 0.34, 15) + 2) * 1.2;
  const arrowW = clamp(22, captionH * 0.55, 28);
  const arrowH = arrowW * (25 / 28);
  const localTop = Math.round(stageHeight + captionH * 0.12) - 8;
  const localLeft = Math.round(hit.left + hit.width / 2);

  return (
    <div
      data-framer-name="Direction"
      style={{
        position: 'absolute',
        top: localTop,
        left: localLeft,
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        pointerEvents: 'none',
        // Under the envelope iframe (z-index 3) so the letter panel covers
        // the note wherever they overlap — open or shut.
        zIndex: 2,
        color: HINT_COLOR,
        fontFamily: '"Caveat", cursive',
        fontSize: `calc(${fontSize}px * var(--text-scale, 1))`,
        lineHeight: 1.15,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Solid fill under a 0.6 wrapper opacity — same look as the 0.6-alpha
          text colour. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: '100%',
          top: 0,
          width: arrowW,
          height: arrowH,
          marginRight: 4,
          transform: 'translateY(-8px) scaleY(-1) rotate(90deg)',
          transformOrigin: 'center center',
          opacity: 0.6,
        }}
      >
        <span
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgb(var(--fg-rgb, 0 0 0))',
            WebkitMaskImage: `url(${HINT_ARROW})`,
            maskImage: `url(${HINT_ARROW})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      </span>
      <p style={{ margin: 0 }}>Read my design manifesto</p>
    </div>
  );
}

const EMBED_SOURCE = 'about-envelope';

/** The About heading lines, shared by both layouts below. */
function CopyIcon() {
  return (
    <svg className="site-toast__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 5.75C7 4.23122 8.23122 3 9.75 3H18.25C19.7688 3 21 4.23122 21 5.75V14.26C21 15.7788 19.7688 17.01 18.25 17.01H17V18.25C17 19.7688 15.7688 21 14.25 21H5.75C4.23122 21 3 19.7688 3 18.25V9.75C3 8.23122 4.23122 7 5.75 7H7V5.75ZM17 15.51V9.75C17 8.23122 15.7688 7 14.25 7H8.5V5.75C8.5 5.05964 9.05964 4.5 9.75 4.5H18.25C18.9404 4.5 19.5 5.05964 19.5 5.75V14.26C19.5 14.9504 18.9404 15.51 18.25 15.51H17Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HeadingContent() {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();
  const [pillLabel, setPillLabel] = useState('Open LinkedIn');

  function linkHandlers(label: string) {
    return {
      onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => {
        setPillLabel(label);
        pillHandlers.onMouseEnter(e);
      },
      onMouseMove: pillHandlers.onMouseMove,
      onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => {
        const next = e.relatedTarget;
        if (next instanceof Element && next.closest('.about-heading__link')) return;
        pillHandlers.onMouseLeave();
      },
    };
  }

  function handleCopyEmail(e: ReactMouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    navigator.clipboard.writeText(EMAIL).then(() => {
      toast('Email copied successfully!', {
        id: EMAIL_TOAST_ID,
        icon: <CopyIcon />,
        duration: EMAIL_TOAST_MS,
      });
    }).catch(() => {});
  }

  return (
    <>
      <p
        style={{
          width: '100%', height: 'auto', margin: 0, whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word', wordBreak: 'break-word', opacity: 0.4,
          fontFamily: '"Switzer", "Switzer Placeholder", sans-serif',
          fontSize: 'calc(clamp(10px, 1.3vw, 12px) * var(--text-scale, 1))', lineHeight: 1.2,
          position: 'relative', textAlign: 'left', color: 'rgb(var(--fg-rgb, 0 0 0))',
        }}
      >
        ABOUT ME
      </p>
      <div
        style={{
          width: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', gap: 8,
        }}
      >
        <p
          className="about-heading__title"
          style={{
            width: '100%', height: 'auto', margin: 0, whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word', wordBreak: 'break-word', fontWeight: 400,
            fontStyle: 'normal', fontFamily: '"Switzer", "Switzer Placeholder", sans-serif',
            color: 'rgb(var(--fg-rgb, 0 0 0))', fontSize: 'calc(clamp(14px, 1.95vw, 18px) * var(--text-scale, 1))', letterSpacing: '-0.01em',
            lineHeight: '140%', position: 'relative', textAlign: 'left',
          }}
        >
          {"Hi, I'm Cherry. I design consumer products by thinking in systems, sweating the craft, and making the experience delightful to use."}
        </p>
        <p
          className="about-heading__availability"
          style={{
            width: '100%', height: 'auto', margin: 0, whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word', wordBreak: 'break-word',
            fontFamily: '"Switzer", "Switzer Placeholder", sans-serif',
            fontSize: 'calc(clamp(12px, 1.5vw, 14px) * var(--text-scale, 1))',
            letterSpacing: '-0.01em', lineHeight: '140%',
            position: 'relative', textAlign: 'left',
            color: 'rgb(var(--fg-rgb, 0 0 0) / 0.55)',
          }}
        >
          {"I'm open to work and collaborations starting September 2026. Reach out on "}
          <a
            className="about-heading__link about-heading__link--linkedin"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            {...linkHandlers('Open LinkedIn')}
          >
            {"LinkedIn"}
          </a>
          {" or by "}
          <span className="about-heading__email-cluster">
            <button
              type="button"
              className="about-heading__link about-heading__link--email"
              onClick={handleCopyEmail}
              {...linkHandlers('Copy email')}
            >
              {"email"}
            </button>
            {"\u00A0•ᴗ•ꕤ"}
          </span>
        </p>
      </div>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label={pillLabel} /> : null}
    </>
  );
}

/**
 * The heading on its own, for hosts that lay it out themselves. The envelope
 * normally draws this inside its own box, stacked above the card — but when the
 * envelope is only half the row that would push its card below the sticker
 * board beside it. Rendering the heading above the whole row instead lets both
 * cards start at the same y. Pair with `<AboutEnvelope showHeading={false} />`.
 */
export function AboutHeading() {
  return (
    <div
      data-framer-name="About Heading"
      style={{
        width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', gap: 24,
      }}
    >
      <HeadingContent />
    </div>
  );
}

type AboutEnvelopeProps = {
  /** Draw the ABOUT ME heading above the card. Off when the host owns it. */
  showHeading?: boolean;
  /**
   * Force the card's width/height ratio instead of deriving its height from the
   * photo strip below. Used to match a neighbour's height exactly.
   */
  cardAspect?: number;
  /**
   * Fill the parent box instead: the envelope is drawn as large as the box's
   * height allows, with no caption reserved under it (the host draws its own
   * hint). The parent must have a definite height.
   */
  fill?: boolean;
};

export default function AboutEnvelope({ showHeading = true, cardAspect, fill = false }: AboutEnvelopeProps = {}) {
  const headingRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [headingHeight, setHeadingHeight] = useState(96);
  const [width, setWidth] = useState(940);
  const [height, setHeight] = useState(480);
  const [wide, setWide] = useState(false);
  const [night, setNight] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  // The embedded app decides when the letter opens; it tells us, and we go
  // fullscreen so it can paint over the page. Blur outlasts `open` on the way
  // out, so breakout is held until both are done.
  const [letterOpen, setLetterOpen] = useState(false);
  const [blurProgress, setBlurProgress] = useState(0);
  const breakout = letterOpen || blurProgress > 0.001;
  const breakoutRef = useRef(breakout);
  breakoutRef.current = breakout;

  /*
   * The letter's resting "read me" bob waits for the sticker board's
   * handwritten hint to finish writing itself in, so the two play in turn.
   * Passed to the embed as `bob` on every layout message.
   */
  const [hintWritten, setHintWritten] = useState(false);
  const hintWrittenRef = useRef(hintWritten);
  hintWrittenRef.current = hintWritten;
  useEffect(() => {
    if (document.querySelector(`[${HINT_WRITTEN_ATTR}]`)) setHintWritten(true);
    const on = () => setHintWritten(true);
    window.addEventListener(HINT_WRITTEN_EVENT, on);
    return () => window.removeEventListener(HINT_WRITTEN_EVENT, on);
  }, []);

  const pillRef = useRef<HTMLDivElement>(null);
  const [pillOn, setPillOn] = useState(false);
  const [pillMounted, setPillMounted] = useState(false);
  useEffect(() => {
    setPillMounted(true);
  }, []);

  useLayoutEffect(() => {
    const read = () => setNight(document.documentElement.dataset.theme === 'dark');
    read();
    setThemeReady(true);
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const measure = () => {
      if (headingRef.current) setHeadingHeight(Math.round(headingRef.current.getBoundingClientRect().height));
      if (hostRef.current) {
        const r = hostRef.current.getBoundingClientRect();
        setWidth(Math.round(r.width));
        setHeight(Math.round(r.height));
      }
      setWide(window.innerWidth >= LARGE_BP);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (headingRef.current) ro.observe(headingRef.current);
    if (hostRef.current) ro.observe(hostRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  /*
   * The envelope's flap tracks where its stage sits in the viewport, but it is in
   * an iframe and cannot see that itself — the host has to report it. Without
   * these messages the envelope just stays shut, which is why it looked inert.
   */
  useEffect(() => {
    const post = () => {
      const win = iframeRef.current?.contentWindow;
      const stage = stageRef.current;
      if (!win || !stage) return;
      const r = stage.getBoundingClientRect();
      win.postMessage(
        {
          source: EMBED_SOURCE,
          type: 'layout',
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
          breakout: breakoutRef.current,
          bob: hintWrittenRef.current,
          viewH: window.innerHeight,
          viewW: window.innerWidth,
        },
        '*'
      );
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        post();
      });
    };

    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.source !== EMBED_SOURCE) return;
      if (data.type === 'ready') post();
      if (data.type === 'letterState' && typeof data.open === 'boolean') {
        // Sliding shut gets the same sheet reversed.
        setLetterOpen((was) => {
          if (was && !data.open) playPaper('in');
          return data.open as boolean;
        });
      }
      if (data.type === 'blurProgress' && typeof data.progress === 'number') {
        setBlurProgress(Math.max(0, Math.min(1, data.progress)));
      }
      // While the letter is open the iframe covers the viewport and swallows the
      // wheel, so it forwards the delta back for the page to apply.
      if ((data.type === 'wheel' || data.type === 'scrollBy') && typeof data.deltaY === 'number') {
        window.scrollBy(0, data.deltaY);
      }
    };

    window.addEventListener('message', onMessage);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    post();
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Re-report as soon as breakout flips, so the app knows which box it owns.
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    const stage = stageRef.current;
    if (!win || !stage) return;
    const r = stage.getBoundingClientRect();
    win.postMessage(
      {
        source: EMBED_SOURCE, type: 'layout',
        left: r.left, top: r.top, width: r.width, height: r.height,
        breakout, viewH: window.innerHeight, viewW: window.innerWidth, bob: hintWritten,
      },
      '*'
    );
  }, [breakout, width, headingHeight, hintWritten]);

  /*
   * While the letter is shut the iframe is pointer-transparent, so the host does
   * the hit-testing: work out where the envelope graphic actually sits and tell
   * the app when the pointer is over it, or when it has been clicked.
   */
  useEffect(() => {
    if (breakout) return;

    const hitRect = () => {
      const stage = stageRef.current;
      if (!stage) return null;
      const r = stage.getBoundingClientRect();
      const hit = envelopeHitRect(r.width, r.height, window.innerHeight, fill);
      return { left: r.left + hit.left, top: r.top + hit.top, width: hit.width, height: hit.height };
    };
    const inside = (x: number, y: number) => {
      const rect = hitRect();
      return !!rect && x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
    };
    const send = (msg: Record<string, unknown>) =>
      iframeRef.current?.contentWindow?.postMessage({ source: EMBED_SOURCE, ...msg }, '*');

    let hovered = false;
    const placePill = (e: MouseEvent) => {
      const node = pillRef.current;
      if (!node) return;
      placePillAt(node, e.clientX, e.clientY, { offsetX: PILL_OFFSET_X, offsetY: PILL_OFFSET_Y });
    };
    // Board stickers can be dragged over the envelope; over one of those, the
    // pointer belongs to the sticker, not the envelope under it.
    const onSticker = (e: MouseEvent) => e.target instanceof Element && !!e.target.closest('.asb-sticker');
    const onMove = (e: MouseEvent) => {
      if (window.innerWidth <= 1199.98) return; // no hover on tablet / phone
      const next = inside(e.clientX, e.clientY) && !onSticker(e);
      if (next !== hovered) {
        hovered = next;
        send({ type: 'hover', active: next });
        setPillOn(next && canFollowCursor());
      }
      if (hovered && canFollowCursor()) placePill(e);
    };
    const clearHover = () => {
      if (hovered) {
        hovered = false;
        send({ type: 'hover', active: false });
      }
      setPillOn(false);
    };
    /*
     * The whole card opens the letter, not just the envelope graphic. The
     * artwork sits in a lot of empty cream, and clicking that did nothing —
     * which reads as broken when the cursor pill is already inviting a click.
     * The pill and the iframe's own hover still key off the tighter rect, so
     * the envelope is what lights up.
     */
    const onCard = (x: number, y: number) => {
      const stage = stageRef.current;
      if (!stage) return false;
      const r = stage.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const onClick = (e: MouseEvent) => {
      if (onSticker(e)) return;
      if (!inside(e.clientX, e.clientY) && !onCard(e.clientX, e.clientY)) return;
      setPillOn(false);
      setLetterOpen(true);
      playPaper('out');
      send({ type: 'autoOpen' });
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('click', onClick, true);
    document.addEventListener('mouseleave', clearHover);
    window.addEventListener('blur', clearHover);
    return () => {
      clearHover();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('mouseleave', clearHover);
      window.removeEventListener('blur', clearHover);
    };
  }, [breakout, fill]);

  /*
   * Hold the page still while the letter is up. Setting overflow:hidden or
   * position:fixed on the body resets the scroll offset and the page jumps, so
   * the offset is simply restored whenever anything moves it.
   */
  useEffect(() => {
    if (!letterOpen) return;
    const lockedX = window.scrollX;
    const lockedY = window.scrollY;
    const restore = () => {
      if (window.scrollX !== lockedX || window.scrollY !== lockedY) window.scrollTo(lockedX, lockedY);
    };
    window.addEventListener('scroll', restore, { passive: true });
    return () => window.removeEventListener('scroll', restore);
  }, [letterOpen]);

  // Normally the card matches the photo strip below; `cardAspect` overrides that
  // so it can match whatever sits beside it instead.
  const envelope = fill
    ? Math.max(60, height)
    : cardAspect
      ? Math.round(width / cardAspect)
      : envelopeHeight(width);
  // index.html is explicit: Next serves public/ as static files and does not
  // resolve a directory path to its index.
  // The card stays put; only the box the envelope is drawn into shrinks, centred
  // inside it. The hit rect is derived from this same box (see the pointer
  // effect above), so the click target follows without extra bookkeeping.
  const cardTop = showHeading ? headingHeight + HEADING_GAP : 0;
  // The caption now sits centred under the envelope instead of beside it, so
  // this much of the card's own height is reserved for it — the envelope
  // graphic is drawn into what's left, which is what makes it smaller.
  const captionH = fill ? 0 : clamp(40, envelope * 0.16, 70);
  const stageAreaH = Math.max(60, envelope - captionH);
  const stageScale = wide && !fill ? LARGE_ENVELOPE_SCALE : 1;
  const stageW = Math.round(width * stageScale);
  const stageH = Math.round(stageAreaH * stageScale);
  const stageLeft = Math.round((width - stageW) / 2);
  const stageTop = cardTop + Math.round((stageAreaH - stageH) / 2);

  const src = `${EMBED_ORIGIN}/index.html?embed=1&w=${stageW}&h=${stageH}&theme=${night ? 'dark' : 'light'}${fill ? '&fit=fill' : ''}&v=${EMBED_VERSION}`;

  const postAutoClose = () => {
    iframeRef.current?.contentWindow?.postMessage({ source: EMBED_SOURCE, type: 'autoClose' }, '*');
  };

  // In embed mode the envelope deliberately skips painting its own frost and
  // reports `blurProgress` instead, because only the host can blur the page
  // behind it. These are the host's numbers from FramerAboutEmbed.tsx.
  const blurP = Math.max(0, Math.min(1, blurProgress));
  const blurPx = 12 * blurP;
  const blurFilter = `blur(${blurPx}px) saturate(1.05)`;

  return (
    <div
      ref={hostRef}
      style={{
        width: '100%',
        position: 'relative',
        height: fill ? '100%' : cardTop + envelope,
        minHeight: fill ? undefined : cardTop + envelope,
        background: 'transparent',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {/* Frosts the whole page behind the open letter. Sits just under the
          breakout iframe, which is transparent outside the letter itself, so the
          page reads through the blur. Clicking it closes the letter. */}
      {blurP > 0.001 && (
        <div
          aria-hidden={!letterOpen}
          role={letterOpen ? 'button' : undefined}
          tabIndex={letterOpen ? 0 : undefined}
          aria-label={letterOpen ? 'Close the letter' : undefined}
          onClick={letterOpen ? postAutoClose : undefined}
          onKeyDown={
            letterOpen
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); postAutoClose(); }
                }
              : undefined
          }
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147482999,
            pointerEvents: letterOpen ? 'auto' : 'none',
            cursor: letterOpen ? 'pointer' : undefined,
            background: `linear-gradient(180deg, rgba(32, 34, 38, ${0.12 * blurP}) 0%, rgba(22, 24, 28, ${0.16 * blurP}) 100%)`,
            backdropFilter: blurFilter,
            WebkitBackdropFilter: blurFilter,
          }}
        />
      )}

      {/* Light: #FAFAFA. Night: same soft fill + hairline as the sticker board,
          without the board's dot texture. Transparent inside `.about-frame`,
          which paints one shared fill for the envelope and board. */}
      <div
        aria-hidden
        className="about-envelope__card"
        style={{
          position: 'absolute', left: 0, top: cardTop, width: '100%',
          height: envelope,
          background: '#FAFAFA',
          zIndex: 0, pointerEvents: 'none',
        }}
      />
      {/* Above the iframe, not level with it. Both sat at z-index 3 and the iframe
          comes later in the DOM, so anywhere the two met the embed painted over
          the heading. The iframe's top is `headingHeight`, which starts at a
          default and is only corrected once the observer fires — and the widest
          screens scale the type up most, so that is exactly where a short
          measurement swallowed the text. Ordering makes it unable to. */}
      {showHeading && (
        <div
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', zIndex: 5, pointerEvents: 'none' }}
          aria-hidden="false"
        >
          <div
            ref={headingRef}
            data-framer-name="About Heading"
            style={{
              width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 24, marginBottom: 28, pointerEvents: 'none',
            }}
          >
            <HeadingContent />
          </div>
        </div>
      )}
      <div
        ref={stageRef}
        style={{ position: 'absolute', left: stageLeft, top: stageTop, width: stageW, height: stageH }}
      >
        {themeReady ? (
        <iframe
          ref={iframeRef}
          title="About Cherry — envelope"
          src={src}
          allowTransparency
          onLoad={() => {
            const win = iframeRef.current?.contentWindow;
            const stage = stageRef.current;
            if (!win || !stage) return;
            const r = stage.getBoundingClientRect();
            win.postMessage(
              {
                source: EMBED_SOURCE, type: 'layout',
                left: r.left, top: r.top, width: r.width, height: r.height,
                breakout: false, viewH: window.innerHeight, viewW: window.innerWidth,
                bob: hintWrittenRef.current,
              },
              '*'
            );
          }}
          style={
            breakout
              ? {
                  // Open: cover the viewport so the letter can paint over the page
                  // (its backdrop-filter blurs the parent through the iframe).
                  position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
                  border: 0, display: 'block', background: 'transparent',
                  colorScheme: night ? 'dark' : 'normal',
                  pointerEvents: 'auto', zIndex: 2147483000,
                }
              : {
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  border: 0, display: 'block', background: 'transparent',
                  colorScheme: night ? 'dark' : 'normal',
                  // Transparent to the pointer so the host can hit-test the
                  // envelope graphic underneath it.
                  pointerEvents: 'none', zIndex: 3,
                }
          }
        />
        ) : null}
        {!fill && (
          <DirectionHint
            stageWidth={stageW}
            stageHeight={stageH}
            captionH={captionH}
          />
        )}
      </div>
      {pillMounted ? <CursorFollowPill pillRef={pillRef} on={pillOn} label="Open envelope" /> : null}
    </div>
  );
}
