'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';

/**
 * The hero cloud: layers cut from one photo and stacked back to front, each
 * already feathered and at its own strength — a hazy veil behind, the main
 * dome, the right lobe, the lower-left puffs in front, then a translucent wisp
 * over the crown and a thin mist across the base.
 *
 *  - Idle: each layer drifts and breathes on its own slow loop, so the layers
 *    shift against each other like real vapour.
 *  - Scroll: as the page scrolls down, the whole cloud glides off to the
 *    right, eased so it trails the scroll rather than tracking it rigidly.
 *  - Hover: every layer answers the pointer on its own — following it (or
 *    pulling the other way) by its own amount on both axes, while the front
 *    puffs and wisps brighten and firm up and the haze behind thins out.
 *
 * Stacking: the intro sits at z-index 20 so its brand links stay clickable
 * above the lanyard (ProfileLanyard, z-index 10). The cloud must sit *below*
 * the lanyard, so it can't live inside the intro — it's portaled into #main
 * (the lanyard's own host) at z-index 5, and placed from the intro's layout
 * box: level with the copy, in the space to its right. This component renders
 * an empty marker inside the intro to find it.
 *
 * All of the look lives in globals.css (.hero-cloud); this only places it and
 * feeds it --mx / --my (pointer, −1…1), --hov (0/1) and --sx (scroll glide,
 * 0…1).
 */
const LAYERS = ['1-haze', '2-body', '3-right', '4-left', '5-wisps', '6-veil'];

/** Scroll distance, as a fraction of the viewport, over which the glide plays out. */
const GLIDE_OVER = 0.5;
/** Widest the cloud gets, and the room the intro copy keeps to its left. */
const MAX_WIDTH = 380;
const COPY_ROOM = 580;
/** How far the main cloud sits in from the intro's right edge, when there's room. */
const MAIN_INSET = 50;
/** The edge cloud: its size relative to the main one, and where it sits. */
const EDGE_SCALE = 0.6;
const EDGE_TOP_VH = 0.1;
/** How much of the edge cloud hangs past the right edge of the screen. */
const EDGE_CROP = 0.5;
/**
 * Narrow layouts — below the desktop breakpoint, or wherever the copy leaves
 * less than NARROW_BELOW beside it — have no room beside the intro. There the
 * clouds move up into the free band above the headline, on the right where
 * the sky is bluest (lower down it has faded to white, and a white cloud
 * vanishes into it): the main cloud against the right edge of the screen,
 * sized to the viewport, and the edge cloud just left of it and a touch
 * higher, overlapping it a little — stacking it above would run it into the
 * menu button.
 */
const DESKTOP_MIN = 1200;
const NARROW_BELOW = 200;
const NARROW_SHARE = 0.4;
const NARROW_MIN = 140;
const NARROW_MAX = 220;
/** Share of the narrow main cloud's box that may hang past the screen edge (only its mist). */
const NARROW_BLEED = 0.05;
/** How much of the narrow main cloud's box sits above the headline's top (the rest dips behind it). */
const NARROW_ABOVE = 0.9;
/** How far the narrow edge cloud tucks in over the main cloud's left side, as a share of the main's width. */
const NARROW_TUCK = 0.25;
/** Cloud images are 1100 × 665; the box is shifted up by 56% of its height (see .hero-cloud). */
const ASPECT = 665 / 1100;
const LIFT = 0.56;

type Box = { left: number; top: number; width: number };

/** An element's layout position on the page, ignoring transforms (the intro's reveal animation moves it). */
function pageOffset(el: HTMLElement) {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top };
}

/**
 * `main` sits beside the intro copy; `edge` is a smaller, mirrored second
 * cloud near the top of the page, half cropped by the right edge of the screen.
 * Both show at every width: see the narrow layout above.
 */
export default function HeroCloud({ variant = 'main' }: { variant?: 'main' | 'edge' }) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  // Both clouds render into one shared layer across the top of #main that
  // clips sideways (see .hero-cloud-layer), so the edge cloud hanging past the
  // screen — and the drift and scroll glide — never widen the page. On phones
  // that overflow would zoom the whole page out.
  useEffect(() => {
    const main = document.getElementById('main') ?? document.body;
    let layer = main.querySelector<HTMLElement>(':scope > .hero-cloud-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'hero-cloud-layer';
      main.appendChild(layer);
    }
    setHost(layer);
  }, []);

  // Place the cloud. Both are centred vertically on `top` (their box is lifted
  // by LIFT of its height in CSS).
  //  - Wide: main is right-aligned to the intro (in by MAIN_INSET if the copy
  //    leaves room), centred on its height, as wide as the copy allows; edge
  //    sits near the top of the page, half past the right edge of the screen.
  //  - Narrow: see NARROW_* above — main just above the headline against the
  //    right edge, edge just left of it and a touch higher; never above the
  //    page top.
  useEffect(() => {
    const intro = markerRef.current?.parentElement;
    if (!intro) return;
    const place = () => {
      const { left, top } = pageOffset(intro);
      const viewport = document.documentElement.clientWidth;
      const room = intro.offsetWidth - COPY_ROOM;
      const wide = viewport >= DESKTOP_MIN && room >= NARROW_BELOW;

      if (wide) {
        const mainWidth = Math.min(MAX_WIDTH, room);
        if (variant === 'main') {
          const inset = Math.min(MAIN_INSET, Math.max(0, room - mainWidth));
          setBox({ left: left + intro.offsetWidth - mainWidth - inset, top: top + intro.offsetHeight / 2, width: mainWidth });
          return;
        }
        const width = Math.round(mainWidth * EDGE_SCALE);
        setBox({
          left: viewport - width * (1 - EDGE_CROP),
          top: window.innerHeight * EDGE_TOP_VH + width * ASPECT * 0.3,
          width,
        });
        return;
      }

      // Narrow: measured from the top of the headline itself (the intro's box
      // carries headroom above it).
      const block = intro.querySelector<HTMLElement>('.who-line .block') ?? intro;
      const textTop = pageOffset(block).top;
      const mainWidth = Math.round(Math.min(NARROW_MAX, Math.max(NARROW_MIN, viewport * NARROW_SHARE)));
      const mainLeft = viewport - mainWidth * (1 - NARROW_BLEED);
      const mainTopEdge = Math.max(8, textTop - mainWidth * ASPECT * NARROW_ABOVE);
      if (variant === 'main') {
        setBox({ left: mainLeft, top: mainTopEdge + mainWidth * ASPECT * LIFT, width: mainWidth });
        return;
      }
      const width = Math.round(mainWidth * EDGE_SCALE);
      const height = width * ASPECT;
      const topEdge = Math.max(8, mainTopEdge - height * 0.15);
      setBox({ left: mainLeft + mainWidth * NARROW_TUCK - width, top: topEdge + height * LIFT, width });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(intro);
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [variant]);

  // Scroll glide, eased toward the scroll position frame by frame.
  const mounted = Boolean(host && box);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let current = 0;
    let target = 0;
    let raf = 0;
    const tick = () => {
      current += (target - current) * 0.06;
      if (Math.abs(target - current) < 0.001) current = target;
      el.style.setProperty('--sx', current.toFixed(4));
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * GLIDE_OVER)));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const my = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    el.style.setProperty('--mx', mx.toFixed(3));
    el.style.setProperty('--my', my.toFixed(3));
    el.style.setProperty('--hov', '1');
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
    el.style.setProperty('--hov', '0');
  };

  return (
    <>
      <span ref={markerRef} hidden />
      {host && box
        ? createPortal(
            <div
              ref={ref}
              className={`hero-cloud${variant === 'edge' ? ' hero-cloud--edge' : ''}`}
              aria-hidden
              style={{ left: box.left, top: box.top, width: box.width }}
              onPointerMove={onMove}
              onPointerLeave={onLeave}
            >
              {LAYERS.map((name, i) => (
                // The span answers the pointer; the image inside drifts and breathes.
                <span key={name} className="hero-cloud__layer" style={{ '--i': i } as CSSProperties}>
                  <img
                    src={`/assets/images/hero-cloud/${name}.webp`}
                    width={1100}
                    height={665}
                    alt=""
                    decoding="async"
                    draggable={false}
                  />
                </span>
              ))}
            </div>,
            host,
          )
        : null}
    </>
  );
}
