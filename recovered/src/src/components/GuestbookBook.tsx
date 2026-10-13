'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { CursorFollowPill, placePill } from '@/components/casestudy/CursorFollowPill';
import { FeatherIcon, type FeatherIconHandle } from '@/components/icons/FeatherIcon';
import { DOTS_PLAY_EVENT, type DotsPlayDetail } from '@/components/GuestbookDotField';
import { playBook, playPageTurn } from '@/lib/sfx';
import { setGuestbookOpen } from '@/lib/guestbookOpen';

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

const BOOK_SRC = '/guestbook/book-cover.html?v=20261012-name-size';
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
  // True while the book is travelling from centre back into the slot.
  const [settling, setSettling] = useState(false);
  // createPortal needs a real document; the page is prerendered on the server.
  const [canPortal, setCanPortal] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;
  const settlingRef = useRef(settling);
  settlingRef.current = settling;
  useEffect(() => setCanPortal(true), []);
  // Tell the page behind (the camera reel's looping wall) to hold still.
  useEffect(() => {
    setGuestbookOpen(open);
  }, [open]);
  useEffect(() => () => setGuestbookOpen(false), []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const sawOpen = useRef(false);
  const pinAnimRef = useRef<Animation | null>(null);
  const localRef = useRef<Rect | null>(null);
  const sigRef = useRef('');
  /** Set while the cover flip owns the frame, so scroll pinning stays off. */
  const holdRef = useRef(false);
  const placeRef = useRef<(force?: boolean) => void>(() => {});
  const fallbackStopRef = useRef<(() => void) | null>(null);
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

  /** Re-measure the closed book onto its pin. Safe to call after the close flight. */
  const refit = useCallback(() => {
    placeRef.current(true);
  }, []);

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
      settlingRef.current = false;
      setSettling(false);
      refit();
    }, SHRINK_MS + 120);
  }, [dock, refit]);

  /*
   * Keep the closed book on the footer slot.
   *
   * The slot lives in the page, but the book is a fixed iframe. Updating its
   * position from a scroll listener lands a frame late, and the docked stage
   * also eases for 480ms, so a fast flick leaves the cover gliding upward
   * after the footer has already arrived. A scroll timeline moves the iframe
   * on the compositor, in the same frame as the page.
   *
   * The stage stays parked in the middle of the iframe (fully inside it, so
   * nothing is clipped) and the iframe's own translation supplies the rest.
   */
  useLayoutEffect(() => {
    const frame = iframeRef.current;
    const slot = slotRef.current;
    const host = window as Window & { __guestbookReleasePin?: () => void };

    const stopPin = () => {
      pinAnimRef.current?.cancel();
      pinAnimRef.current = null;
      fallbackStopRef.current?.();
      fallbackStopRef.current = null;
      if (frame) frame.style.transform = '';
    };

    host.__guestbookReleasePin = () => {
      holdRef.current = true;
      sigRef.current = '';
      localRef.current = null;
      stopPin();
      if (!frame?.contentWindow) return;
      frame.style.clipPath = '';
      frame.contentWindow.dispatchEvent(new MessageEvent('message', {
        data: { source: MSG, type: 'undock' },
      }));
    };

    const dropHost = () => {
      if (host.__guestbookReleasePin) delete host.__guestbookReleasePin;
    };

    if (open || settling || !ready || !frame || !slot) {
      if (open || settling) stopPin();
      return dropHost;
    }

    holdRef.current = false;

    const clipFor = (r: Rect) =>
      `inset(${Math.max(0, r.top - PAD_TOP)}px ` +
      `${Math.max(0, window.innerWidth - (r.left + r.width) - PAD_X)}px ` +
      `${Math.max(0, window.innerHeight - (r.top + r.height) - PAD_BOTTOM)}px ` +
      `${Math.max(0, r.left - PAD_X)}px)`;

    const deliver = (msg: Record<string, unknown>) => {
      frame.contentWindow?.dispatchEvent(new MessageEvent('message', {
        data: { source: MSG, ...msg },
      }));
    };

    const snapStage = () => {
      const stage = frame.contentDocument?.getElementById('stage');
      if (stage) stage.style.transition = 'none';
    };

    const startPin = (pinBase: number, max: number) => {
      const Ctor = (window as unknown as {
        ScrollTimeline?: new (opts: { source: Element; axis: 'block' }) => AnimationTimeline;
      }).ScrollTimeline;
      if (!Ctor) return false;
      const source = document.scrollingElement || document.documentElement;
      try {
        pinAnimRef.current = frame.animate(
          [
            { transform: `translate3d(0px, ${pinBase.toFixed(2)}px, 0px)` },
            { transform: `translate3d(0px, ${(pinBase - max).toFixed(2)}px, 0px)` },
          ],
          {
            fill: 'both',
            easing: 'linear',
            timeline: new Ctor({ source, axis: 'block' }),
          } as KeyframeAnimationOptions,
        );
        return true;
      } catch {
        pinAnimRef.current = null;
        return false;
      }
    };

    const startFallback = () => {
      let lastTop = Number.NaN;
      let lastLeft = Number.NaN;
      const follow = () => {
        const doc = frame.contentDocument;
        const root = doc?.documentElement.style;
        const stage = doc?.getElementById('stage');
        const body = doc?.body;
        if (!root || !stage || !body?.classList.contains('is-docked')) return;
        if (stage.style.transform) return;
        stage.style.transition = 'none';
        const r = slot.getBoundingClientRect();
        frame.style.clipPath = clipFor(r);
        if (Number.isNaN(lastTop)) {
          lastTop = r.top;
          lastLeft = r.left;
          return;
        }
        const dy = r.top - lastTop;
        const dx = r.left - lastLeft;
        if (dy === 0 && dx === 0) return;
        const ty = parseFloat(root.getPropertyValue('--dock-ty')) || 0;
        const tx = parseFloat(root.getPropertyValue('--dock-tx')) || 0;
        if (dy) root.setProperty('--dock-ty', `${(ty + dy).toFixed(2)}px`);
        if (dx) root.setProperty('--dock-tx', `${(tx + dx).toFixed(2)}px`);
        lastTop = r.top;
        lastLeft = r.left;
      };
      follow();
      window.addEventListener('scroll', follow, { passive: true });
      fallbackStopRef.current = () => window.removeEventListener('scroll', follow);
    };

    const place = (force = false) => {
      if (holdRef.current || openRef.current || settlingRef.current) return;
      if (!frame.contentWindow) return;
      const r = slot.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const scroller = document.scrollingElement || document.documentElement;
      const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      const docTop = r.top + window.scrollY;
      const sig = [
        Math.round(r.left), Math.round(r.width), Math.round(r.height),
        Math.round(docTop), Math.round(max), window.innerHeight,
      ].join(':');
      if (!force && sig === sigRef.current) return;

      const localTop = Math.max(0, (window.innerHeight - r.height) / 2);
      const local: Rect = { left: r.left, top: localTop, width: r.width, height: r.height };
      const pinBase = docTop - localTop;
      // Hidden only for the measure. A scroll-timeline animation created while
      // an inline transform is set stays pending and never picks up the scroll,
      // so the cover sits still and the next flick leaves it behind. Clear that
      // inline transform before starting the timeline, and uncover on the next
      // frame once the timeline has resolved.
      const prevVis = frame.style.visibility;
      frame.style.visibility = 'hidden';
      try {
        stopPin();
        frame.style.transform = 'none';
        deliver({ type: 'dock', animate: false, ...local });
        deliver({ type: 'refit', ...local });
        snapStage();
        frame.style.transform = '';
        const pinned = startPin(pinBase, max);
        if (pinned) {
          localRef.current = local;
          frame.style.clipPath = clipFor(local);
        } else {
          localRef.current = null;
          deliver({
            type: 'dock', animate: false,
            left: r.left, top: r.top, width: r.width, height: r.height,
          });
          deliver({ type: 'refit', left: r.left, top: r.top, width: r.width, height: r.height });
          snapStage();
          frame.style.clipPath = clipFor(r);
          startFallback();
        }
        sigRef.current = sig;
      } finally {
        requestAnimationFrame(() => {
          if (frame.style.visibility === 'hidden') frame.style.visibility = prevVis;
        });
      }
    };

    placeRef.current = () => place(true);
    place(true);
    const onResize = () => place(false);
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);
    return () => {
      dropHost();
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      stopPin();
      placeRef.current = () => {};
    };
  }, [open, settling, ready]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.source !== MSG) return;
      if (d.type === 'ready') setReady(true);
      // Clicking the docked book asks for room before its flip runs.
      if (d.type === 'requestOpen') {
        const host = window as Window & { __guestbookReleasePin?: () => void };
        host.__guestbookReleasePin?.();
        playBook('open');
        setOpen(true);
        send({ type: 'undock' });
      }
      if (d.type === 'hoverStart' || d.type === 'hoverMove') {
        if (
          !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) return;
        if (pillRef.current) {
          // Coords are iframe-local. With the frame pinned they are not the
          // page's viewport coords unless the frame's own origin is added back.
          const fr = iframeRef.current?.getBoundingClientRect();
          placePill(pillRef.current, d.x + (fr?.left || 0), d.y + (fr?.top || 0));
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
  }, [send, goHome, refit]);

  // The book's hover peek moves in step with the footer's dot shapes: it opens
  // while they form, holds while they hold, and closes as they return to dots.
  // Each composition announces its own timing (its length varies with how many
  // shapes it has), so the two never drift apart.
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

  useLayoutEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Typing lives in the iframe; parent only forwards when it has focus.
        e.preventDefault();
        send({ type: 'keyFlip', dir: e.key === 'ArrowLeft' ? 'prev' : 'next' });
        return;
      }
      // Space, page keys, and the vertical arrows would scroll the page behind the book.
      if (e.key === ' ' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);

    // The document (html) is the scroller, not body, so hiding body overflow
    // never stopped the page. Pinning the body keeps the backdrop exactly
    // where it was. The footer text is a scroll-driven animation, so freeze
    // its painted frame first — otherwise the lock resets that timeline and
    // the blur behind the book jumps.
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const reveal = document.querySelector<HTMLElement>('.footer_reveal-image');
    if (reveal) {
      const paintedTransform = getComputedStyle(reveal).transform;
      const paintedOpacity = getComputedStyle(reveal).opacity;
      reveal.style.animation = 'none';
      reveal.style.transform = paintedTransform;
      reveal.style.opacity = paintedOpacity;
    }
    const gap = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    // Fix the body before touching overflow. Hiding overflow on the root
    // first changes the scrollport, and the backdrop then jumps.
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    const stopScroll = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', stopScroll, { passive: false });
    window.addEventListener('touchmove', stopScroll, { passive: false });
    const frameDoc = iframeRef.current?.contentDocument;
    const frameHtml = frameDoc?.documentElement;
    const frameBody = frameDoc?.body;
    const frameOverflow = frameHtml?.style.overflow ?? '';
    const frameBodyOverflow = frameBody?.style.overflow ?? '';
    if (frameHtml) frameHtml.style.overflow = 'hidden';
    if (frameBody) frameBody.style.overflow = 'hidden';
    frameDoc?.addEventListener('wheel', stopScroll, { passive: false });
    frameDoc?.addEventListener('touchmove', stopScroll, { passive: false });

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', stopScroll);
      window.removeEventListener('touchmove', stopScroll);
      frameDoc?.removeEventListener('wheel', stopScroll);
      frameDoc?.removeEventListener('touchmove', stopScroll);
      if (frameHtml) frameHtml.style.overflow = frameOverflow;
      if (frameBody) frameBody.style.overflow = frameBodyOverflow;
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollY);
      if (reveal) {
        reveal.style.animation = '';
        reveal.style.transform = '';
        reveal.style.opacity = '';
      }
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
          // Positioning waits for `ready` so the scroll pin can measure a live frame.
          setReady(true);
          window.setTimeout(refit, 150);
        }}
        style={{
          left: 0,
          top: 0,
          width: '100vw',
          // The fixed layer's height, not 100vh. On iOS 100vh is the height
          // with the browser toolbars hidden, so the open book was centred too
          // low and the pens at the frame's bottom edge sat off screen.
          height: '100%',
          opacity: ready ? 1 : 0,
          // Full-viewport but inert while the book is flying home.
          pointerEvents: settling ? 'none' : 'auto',
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
