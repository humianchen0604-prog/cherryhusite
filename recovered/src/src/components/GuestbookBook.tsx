'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { CursorFollowPill, placePill } from '@/components/casestudy/CursorFollowPill';
import { FeatherIcon, type FeatherIconHandle } from '@/components/icons/FeatherIcon';
import { DOTS_PLAY_EVENT, type DotsPlayDetail } from '@/components/GuestbookDotField';
import { playBook, playPageTurn } from '@/lib/sfx';

/**
 * The guestbook in the footer's book slot.
 *
 * The book is `public/guestbook/book-cover.html`, mounted once in a single
 * iframe that never moves in the tree — it is positioned instead, so opening it
 * cannot remount and reload it. While closed it is *docked* over the footer
 * slot: the closed 3D book, its rotateY(-20deg) hover peek and the magenta flap
 * are all the source's own, just scaled down. Clicking it hands the frame the
 * whole viewport so the cover flip, PageFlip spread, message dock and scattered
 * notes have the ~640x425 they need.
 *
 * None of the open sequence is reimplemented here; the host only sizes the frame
 * and tells the book when it is docked.
 */

const BOOK_SRC = '/guestbook/book-cover.html';
const MSG = 'guestbook-book';
const FIRST_PAGE_TOAST_ID = 'guestbook-edge-page';
const FIRST_PAGE_TOAST_MS = 1200;

/**
 * Padding around the slot so the -20deg hover tilt and the flap that swings past
 * the spine are not clipped away. Asymmetric on purpose: a uniform pad reached
 * far enough below the slot to cover the social row underneath it, and the frame
 * then swallowed every icon's hover.
 */
/* Extra room so docked hover (rotateY −26° + cover flap) isn’t clipped. */
const PAD_TOP = 150;
const PAD_X = 190;
const PAD_BOTTOM = 170;
/** Matches the stage's docked transition in book-cover.html. */
const SHRINK_MS = 540;

type Rect = { left: number; top: number; width: number; height: number };

function replayToastEnter() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.querySelector('[data-sonner-toast]:not([data-removed="true"])') as HTMLElement | null;
  if (!el) return;
  el.setAttribute('data-replay', 'true');
  void el.offsetWidth;
  el.removeAttribute('data-replay');
}

export default function GuestbookBook() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [dockAt, setDockAt] = useState<Rect | null>(null);
  // True while the book is travelling from centre back into the slot.
  const [settling, setSettling] = useState(false);
  // createPortal needs a real document; the page is prerendered on the server.
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => setCanPortal(true), []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const sawOpen = useRef(false);
  // "Sign" pill. The book lives in an iframe, so the frame reports
  // hover + cursor position and the host draws the pill.
  const pillRef = useRef<HTMLDivElement>(null);
  const [pillOn, setPillOn] = useState(false);
  const featherRef = useRef<FeatherIconHandle>(null);
  // The feather ruffles while the pill is up, like the resume pill's download arrow.
  useEffect(() => {
    if (pillOn) featherRef.current?.startAnimation();
    else featherRef.current?.stopAnimation();
  }, [pillOn]);

  const send = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage({ source: MSG, ...msg }, '*');
  }, []);

  /** Correct scale/centre against the book's settled box. */
  const refit = useCallback(() => {
    const el = slotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    send({ type: 'refit', left: r.left, top: r.top, width: r.width, height: r.height });
  }, [send]);

  const dock = useCallback(() => {
    const el = slotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // animate: the flight home after a close is the only dock that should ease.
    send({ type: 'dock', animate: true, left: r.left, top: r.top, width: r.width, height: r.height });
  }, [send]);

  /**
   * Only *asks* the book to dismiss. The book owns the sequence — flip the cover
   * back, then fade the frost, then restore the closed book — and tells us when
   * it has finished. Re-docking before that cut the animation off part-way and
   * froze the open notebook art on screen.
   */
  const close = useCallback(() => send({ type: 'close' }), [send]);

  /**
   * Start the journey home. Called as the dismiss begins — the cover flip
   * (600ms), the frost fade (195ms) and this shrink all run together, so closing
   * reads as a single movement instead of three steps queued behind each other.
   * The curve is front-loaded, so most of the travel is over well before the
   * cover has finished turning.
   */
  const goHome = useCallback(() => {
    setOpen(false);
    setSettling(true);
    dock();
    window.setTimeout(() => {
      setSettling(false);
      refit();
    }, SHRINK_MS + 60);
  }, [dock, refit]);

  /*
   * Follow the slot every frame while docked. Scroll/resize listeners are not
   * enough: the footer's reveal transform is driven by React state and settles
   * *after* the last scroll event, so a listener-based measure leaves the book
   * adrift. One rect read per frame is cheap.
   */
  useEffect(() => {
    if (open || settling) return;
    let frame = 0;
    let last = '';
    // The loop restarts after every open/close, so the first tick would re-send
    // a dock for a slot that has not actually moved. Re-docking re-measures,
    // which restarts the shrink transition and makes the book wobble as it
    // lands. Seed the key instead; the initial dock comes from onLoad/ready.
    let seeded = false;
    const tick = () => {
      const el = slotRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const key = `${Math.round(r.left)}:${Math.round(r.top)}:${Math.round(r.width)}`;
        if (key !== last) {
          last = key;
          setDockAt({ left: r.left, top: r.top, width: r.width, height: r.height });
          // Scroll tracking: snap. Easing each frame's new target made the
          // book lag and slide behind its slot all the way down the page.
          if (seeded) send({ type: 'dock', animate: false, left: r.left, top: r.top, width: r.width, height: r.height });
          seeded = true;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, settling, send]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.source !== MSG) return;
      if (d.type === 'ready') { setReady(true); dock(); }
      // Clicking the docked book asks for room before its flip runs.
      if (d.type === 'requestOpen') { playBook('open'); setOpen(true); send({ type: 'undock' }); }
      if (d.type === 'hoverStart' || d.type === 'hoverMove') {
        if (
          !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) return;
        if (pillRef.current) {
          placePill(pillRef.current, d.x, d.y);
        }
        if (d.type === 'hoverStart') setPillOn(true);
      }
      if (d.type === 'hoverEnd') setPillOn(false);
      if (d.type === 'requestOpen') setPillOn(false);
      if (d.type === 'flip') playPageTurn();
      if (d.type === 'toast' && typeof d.message === 'string' && d.message) {
        const alreadyOpen = document.querySelector('[data-sonner-toast]:not([data-removed="true"])');
        // Text only — no icon, so the pill hugs the message.
        toast(d.message, {
          id: FIRST_PAGE_TOAST_ID,
          duration: FIRST_PAGE_TOAST_MS,
        });
        if (alreadyOpen) replayToastEnter();
      }
      if (d.type === 'opened') sawOpen.current = true;
      // Fires as the dismiss starts, so the shrink runs with the cover flip.
      if (d.type === 'closing' && sawOpen.current) {
        playBook('close');
        sawOpen.current = false;
        goHome();
      }
      // Fallback for any close that did not come through the frost or Esc.
      if (d.type === 'closed' && sawOpen.current) {
        sawOpen.current = false;
        goHome();
      }
      // `closed` is when the closed CSS book is restored, but .book then eases
      // its own transform over 0.7s — fitting before that lands measures a book
      // still rotating into place. Wait it out; the correction is a snap, so
      // arriving late is invisible.
      if (d.type === 'closed') window.setTimeout(refit, 780);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [dock, send, goHome, refit]);

  // The book's hover peek moves in step with the footer's dot shapes: it opens
  // while they form, holds while they hold, and closes as they return to dots.
  // Each composition announces its own timing (its length varies with how many
  // shapes it has), so the two never drift apart.
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    let peekTimers: number[] = [];

    const onPlay = (e: Event) => {
      const { start, enter, outAt, exit } = (e as CustomEvent<DotsPlayDetail>).detail;
      peekTimers.forEach((t) => window.clearTimeout(t));
      if (openRef.current) return;
      const now = performance.now();
      peekTimers = [
        window.setTimeout(() => send({ type: 'peek', open: true, ms: enter }), Math.max(0, start - now)),
        window.setTimeout(() => send({ type: 'peek', open: false, ms: exit }), Math.max(0, outAt - now)),
      ];
    };

    window.addEventListener(DOTS_PLAY_EVENT, onPlay);
    return () => {
      window.removeEventListener(DOTS_PLAY_EVENT, onPlay);
      peekTimers.forEach((t) => window.clearTimeout(t));
    };
  }, [send]);

  // Scrolling moves the book out from under a still cursor without a mouseleave.
  useEffect(() => {
    const hide = () => setPillOn(false);
    window.addEventListener('scroll', hide, true);
    return () => window.removeEventListener('scroll', hide, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // Typing lives in the iframe; parent only forwards when it has focus.
      e.preventDefault();
      send({ type: 'keyFlip', dir: e.key === 'ArrowLeft' ? 'prev' : 'next' });
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, send]);

  const layer = (
    <div className="guestbook_layer" data-open={open ? 'true' : 'false'}>
      <iframe
        ref={iframeRef}
        title="Guestbook"
        src={BOOK_SRC}
        className="guestbook_frame"
        data-open={open ? 'true' : 'false'}
        onLoad={() => {
          // The book posts `ready` as soon as its script runs, which can beat
          // React attaching the listener — so load is the reliable signal.
          setReady(true);
          dock();
          // The first dock measures before layout has fully settled, so fit it
          // again once the book is sitting in its resting state.
          window.setTimeout(refit, 150);
        }}
        style={{
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          opacity: ready ? 1 : 0,
          // Full-viewport but inert while the book is flying home.
          pointerEvents: settling ? 'none' : 'auto',
          // Clipping also clips hit-testing, so while docked only the book's own
          // corner of the viewport is interactive — the rest of the footer keeps
          // its clicks. The frame itself never resizes, so the book's layout
          // (and therefore its animations) never reflow.
          clipPath:
            open || settling || !dockAt
              ? undefined
              : `inset(${Math.max(0, dockAt.top - PAD_TOP)}px ` +
                `${Math.max(0, window.innerWidth - (dockAt.left + dockAt.width) - PAD_X)}px ` +
                `${Math.max(0, window.innerHeight - (dockAt.top + dockAt.height) - PAD_BOTTOM)}px ` +
                `${Math.max(0, dockAt.left - PAD_X)}px)`,
        }}
      />
    </div>
  );

  return (
    <>
      {/* Layout-only: reserves the design's slot and gives the frame something
          to track. The book itself is painted by the portalled layer. */}
      <div ref={slotRef} className="footer_book" aria-hidden />
      {/* "Click to sign" hint beside the closed book. Same hand-drawn arrow as
          the Experiences section's hint, but shown still — fully drawn, not
          on that hint's looping draw-in. */}
      <div className="guestbook_hint" aria-hidden="true">
        <div className="guestbook_hint__copy">
          <p>{'Click to'}</p>
          <p>{'sign'}</p>
        </div>
        <svg
          className="guestbook_hint__arrow"
          viewBox="0 0 28 25"
          fill="none"
          aria-hidden="true"
        >
          <path
            className="experience-breakdown-hint__arrow-path experience-breakdown-hint__arrow-path--shaft"
            d="M0 0 C1.5 12 13 20.6 23 20.6"
            pathLength={1}
          />
          <path
            className="experience-breakdown-hint__arrow-path experience-breakdown-hint__arrow-path--head"
            d="M23 16.6 Q26 18 27.3 20.1 Q26 22.3 23 24.3"
            pathLength={1}
          />
        </svg>
      </div>
      {/* Portalled because the footer's reveal wrapper is transformed, which
          would otherwise become the containing block for `position: fixed`. */}
      {canPortal && createPortal(layer, document.body)}
      {canPortal && <CursorFollowPill
          pillRef={pillRef}
          on={pillOn}
          label="Sign"
          variant="guestbook"
          icon={<FeatherIcon ref={featherRef} size={14} aria-hidden />}
          iconPosition="end"
        />}
    </>
  );
}
