'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * The badge-on-a-lanyard that drops in when you click @TikTok / @Lemon8 /
 * @Trip.com in the intro.
 *
 * Ported from Portfolio/Profilelanyard's own Framer component
 * (src/components/Lanyard/ProfileLanyard.tsx), keeping its contract: the intro
 * links dispatch `lanyard:show` with a brand, this listens. Placement is this
 * site's own (see below), not the Framer panel's.
 *
 * Speed: the embed is a whole three.js + physics app, and booting it takes ~0.5s.
 * So one iframe is loaded ahead of time in idle mode (it renders nothing), and a
 * click only posts `lanyard:drop` to it, which mounts the scene straight away.
 * `lanyard:clear` empties it again once the exit fade is done, so nothing keeps
 * rendering while the badge is away. The embed side of this lives in jD() in
 * public/lanyard/assets/index-*.js.
 */

export const LANYARD_SHOW_EVENT = 'lanyard:show';
export const LANYARD_HIDE_EVENT = 'lanyard:hide';

const EMBED = '/lanyard/index.html';
const BRANDS = ['tiktok', 'lemon8', 'trip'] as const;
type Brand = (typeof BRANDS)[number];
type Theme = 'light' | 'dark';
type Phase = 'idle' | 'in' | 'out';
const DEFAULT_BRAND: Brand = 'tiktok';

/*
 * Placement: pinned to the top-left of the *page* (document y=0, x=0), full
 * viewport width, 70vh tall. It scrolls away with the page rather than tracking
 * any section, so there is no gap above it.
 */
const FADE_MS = 650;
const Z_INDEX = 10;
const SECTION_HEIGHT = 70; // vh
const STRAP_LENGTH = 0.8;
/* The scene's damping caps how fast the badge can fall, so it drifts down at a
   constant speed. The embed's default is 40; doubling it halves the fall. */
const GRAVITY = 80;
/* Matches WhoLine: below this the brand links open the real site instead. */
const MIN_WIDTH = 768;
/* How long after load to warm the embed if nobody has gone near the links. */
const PRELOAD_DELAY_MS = 1500;
/* The scene centres the badge in its stage, i.e. at 50% of the viewport. Nudge it
   right so it hangs clear of the hero copy, at ~83%. */
const X_SHIFT = 33; // % of viewport width
/* The badge is roughly 120px wide at rest; used to work out what horizontal room
   the hero copy has left before the two collide. */
const BADGE_HALF_W = 66;
const BADGE_GUTTER = 32;
/* Base size is +10% vs the original scene. Bigger screens get another 10%
   on top of that. Scaled from the top so the strap keeps hanging from the
   same point. */
const LARGE_BP = 1600;
/* 5% down from 1.1 / 1.21. Both sizes move together so the step between the
   normal and wide breakpoints stays proportional. */
const BASE_SCALE = 1.045;
const LARGE_SCALE = 1.1495;

function normalizeBrand(value: unknown): Brand | null {
  const v = String(value ?? '').toLowerCase();
  return (BRANDS as readonly string[]).includes(v) ? (v as Brand) : null;
}

function buildEmbedUrl(theme: Theme) {
  const p = new URLSearchParams({
    idle: '1',
    strapLength: String(STRAP_LENGTH),
    gravity: String(GRAVITY),
    idleFlip: 'false',
    theme,
  });
  return `${EMBED}?${p.toString()}`;
}

export default function ProfileLanyard() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [load, setLoad] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [dropSeq, setDropSeq] = useState(0);
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [theme, setTheme] = useState<Theme>('light');
  const [stageTop, setStageTop] = useState(0);
  const [scale, setScale] = useState(1);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const forceVisible = useRef(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // The iframe's src is fixed at first load; later theme changes go by message.
  const initialTheme = useRef<Theme>('light');
  const visible = phase === 'in';

  // Portal into #main so the intro's z-index 20 can sit above this iframe.
  // Portaling to body put the frame in a higher stacking context and ate
  // every click on @TikTok / @Lemon8 / @Trip.com after the first drop.
  useEffect(() => {
    setPortalHost(document.getElementById('main') ?? document.body);
  }, []);

  // Match the site theme so night mode can drop the pale card plate.
  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  /*
   * Warm the embed before anyone clicks: as soon as a pointer goes near a brand
   * link, or shortly after load otherwise. Desktop only (phones never show the
   * badge) and never on Save-Data.
   */
  useEffect(() => {
    if (window.innerWidth < MIN_WIDTH) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const start = () => setLoad(true);
    const onOver = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.('.intro-lines__link')) start();
    };
    document.addEventListener('pointerover', onOver, { passive: true });
    let timer: number | null = null;
    if (!conn?.saveData) timer = window.setTimeout(start, PRELOAD_DELAY_MS);
    return () => {
      document.removeEventListener('pointerover', onOver);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  // Intro links ask for a brand; each click replays the drop.
  useEffect(() => {
    const onShow = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setBrand(normalizeBrand(detail?.brand) ?? DEFAULT_BRAND);
      setDropSeq((n) => n + 1);
      forceVisible.current = true;
      setLoad(true);
      setPhase('in');
    };
    const onHide = () => {
      forceVisible.current = false;
      setPhase((p) => (p === 'in' ? 'out' : p));
    };
    window.addEventListener(LANYARD_SHOW_EVENT, onShow);
    window.addEventListener(LANYARD_HIDE_EVENT, onHide);
    return () => {
      window.removeEventListener(LANYARD_SHOW_EVENT, onShow);
      window.removeEventListener(LANYARD_HIDE_EVENT, onHide);
    };
  }, []);

  const post = (msg: Record<string, unknown>) =>
    frameRef.current?.contentWindow?.postMessage(msg, window.location.origin);

  // Drop once the frame can hear it. A theme change while hanging replays it,
  // as the old reload-per-theme did.
  useEffect(() => {
    if (!frameReady || phase !== 'in') return;
    post({ type: 'lanyard:drop', brand, theme });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameReady, dropSeq, theme]);

  // After the exit fade, empty the scene so it stops rendering.
  useEffect(() => {
    if (phase !== 'out') return;
    const t = window.setTimeout(() => {
      post({ type: 'lanyard:clear' });
      setPhase('idle');
    }, FADE_MS + 40);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /*
   * Pin to the top of the document: a fixed box at -scrollY sits exactly on page
   * y=0, so the lanyard hangs from the very top and scrolls away naturally.
   *
   * The intro copy is raised above this layer (see .who-line in globals.css) so
   * its links keep receiving clicks while the badge is up.
   */
  useEffect(() => {
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const scrolled = window.scrollY;
      setStageTop(-scrolled);

      const vw = window.innerWidth;
      const nextScale = vw >= LARGE_BP ? LARGE_SCALE : BASE_SCALE;
      setScale(nextScale);

      /*
       * The badge hangs at (50 + X_SHIFT)% of the viewport. On narrower desktops
       * and tablets that lands on top of the intro copy, so publish how much room
       * the copy actually has and let it wrap short of the badge. Cleared when the
       * badge is not showing, so the hero goes back to its full measure.
       */
      const root = document.documentElement;
      const block = document.querySelector('.who-line .block');
      if (forceVisible.current && block) {
        const badgeLeft = ((50 + X_SHIFT) / 100) * vw - BADGE_HALF_W * nextScale;
        const avail = badgeLeft - block.getBoundingClientRect().left - BADGE_GUTTER;
        if (avail > 120) root.style.setProperty('--who-line-max', `${Math.round(avail)}px`);
        else root.style.removeProperty('--who-line-max');
      } else {
        root.style.removeProperty('--who-line-max');
      }

      if (forceVisible.current && scrolled >= window.innerHeight) {
        forceVisible.current = false;
        setPhase((p) => (p === 'in' ? 'out' : p));
      }
    };
    const request = () => { if (frame === null) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
    // Re-runs on show/hide too: the clearance below depends on whether a badge is
    // up, and showing one is neither a scroll nor a resize.
  }, [visible]);

  useEffect(() => () => { document.documentElement.style.removeProperty('--who-line-max'); }, []);

  useEffect(() => {
    if (!load) initialTheme.current = theme;
  }, [load, theme]);

  if (!portalHost || !load) return null;

  const stage = (
    <>
      <style>{`
        @keyframes lanyardBounceOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.55; transform: translateY(-18px) scale(0.99); }
          100% { opacity: 0; transform: translateY(-14px) scale(0.98); }
        }
        @keyframes lanyardSoftIn {
          0% { opacity: 0; transform: translateY(-12px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: stageTop,
          left: 0,
          width: '100vw',
          height: `${SECTION_HEIGHT}vh`,
          pointerEvents: 'none', // the iframe inside is the only hit target
          zIndex: Z_INDEX,
          background: 'transparent',
          overflow: 'hidden',
          // Parked and empty between drops; keep it out of paint entirely.
          visibility: phase === 'idle' ? 'hidden' : 'visible',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            animationName: phase === 'in' ? 'lanyardSoftIn' : phase === 'out' ? 'lanyardBounceOut' : 'none',
            animationDuration: `${FADE_MS}ms`,
            animationTimingFunction: phase === 'in' ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease-in-out',
            animationFillMode: 'both',
            opacity: phase === 'idle' ? 0 : undefined,
            willChange: 'opacity, transform',
            pointerEvents: 'none',
          }}
        >
          {/* Full stage, so the strap draws from the very top. The intro copy is
              lifted above this layer in globals.css (.who-line), which is what
              keeps @TikTok / @Lemon8 / @Trip.com clickable — an iframe cannot be
              hit-tested through, so clipping it would have cut the strap off. */}
          <iframe
            ref={frameRef}
            title={`Lanyard · ${brand}`}
            src={buildEmbedUrl(initialTheme.current)}
            allow="fullscreen"
            allowTransparency
            onLoad={() => setFrameReady(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              display: 'block',
              background: 'transparent',
              colorScheme: theme === 'dark' ? 'dark' : 'normal',
              transform: `translateX(${X_SHIFT}%) scale(${scale})`,
              transformOrigin: '50% 0',
              opacity: frameReady ? 1 : 0,
              pointerEvents: visible && frameReady ? 'auto' : 'none',
            }}
          />
        </div>
      </div>
    </>
  );

  return createPortal(stage, portalHost);
}
