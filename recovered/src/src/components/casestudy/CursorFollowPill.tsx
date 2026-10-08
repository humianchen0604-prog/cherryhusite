'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

const OFFSET_X = 12;
const OFFSET_Y = 16;
/** Closest the pill may sit to any viewport edge. */
const EDGE = 8;

/**
 * The pill's full, opened size — even while it is still the collapsed 36px
 * square it grows out of, so edge checks use the size it is about to be.
 * offsetWidth ignores the scale(0.94) the closed body carries.
 */
function openSize(node: HTMLElement) {
  const body = node.firstElementChild as HTMLElement | null;
  if (!body) return { w: node.offsetWidth, h: node.offsetHeight };
  const label = body.querySelector<HTMLElement>('.copy-email-pill__label');
  const icon = body.querySelector<HTMLElement>('.copy-email-pill__icon');
  // .is-on: padding 0 12px, icon gap 6px (globals.css .copy-email-pill*).
  const w = (label?.offsetWidth ?? 0) + (icon ? icon.offsetWidth + 6 : 0) + 24;
  return { w: Math.max(36, w), h: body.offsetHeight || 36 };
}

/**
 * Position a cursor-follow pill beside the pointer, keeping it on screen.
 *
 * Default is down-right of the pointer (`above`: up-right). Near the right
 * edge it flips to the pointer's left — `data-flip-x` anchors it by its right
 * edge (CSS `translate: -100%`), so it still grows out from beside the
 * pointer as it opens. Near the bottom (or the top, when `above`) it flips
 * vertically. If neither side fits, it is pinned EDGE px inside the screen.
 */
export function placePill(
  node: HTMLElement,
  x: number,
  y: number,
  { above = false, offsetX = OFFSET_X, offsetY = OFFSET_Y }: { above?: boolean; offsetX?: number; offsetY?: number } = {},
) {
  const { w, h } = openSize(node);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const fitsRight = x + offsetX + w <= vw - EDGE;
  const fitsLeft = x - offsetX - w >= EDGE;
  const flipX = !fitsRight && fitsLeft;
  const left = flipX ? x - offsetX : Math.max(EDGE, Math.min(x + offsetX, vw - EDGE - w));

  const below = y + offsetY;
  const over = y - h - offsetY / 2;
  let top = above ? over : below;
  if (!above && below + h > vh - EDGE) top = over;
  if (above && over < EDGE) top = below;
  top = Math.max(EDGE, Math.min(top, vh - EDGE - h));

  if (flipX) node.dataset.flipX = '';
  else delete node.dataset.flipX;
  node.style.transform = `translate3d(${left}px, ${top}px, 0)`;
}

function canFollowCursor() {
  // Tablet and phone widths are pressed-state only — no hover pill.
  if (window.innerWidth <= 1199.98) return false;
  return (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useCursorFollowPill(options: { above?: boolean } = {}) {
  const above = !!options.above;
  const pillRef = useRef<HTMLDivElement>(null);
  const tracking = useRef(false);
  const [on, setOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Scrolling — the page itself, or a nested scrollable container — moves
    // the hovered element out from under a cursor that hasn't actually
    // moved, so no mouseleave ever fires. `true` (capture) catches scroll
    // from any nested container too, since scroll events don't bubble.
    function hideOnScroll() {
      if (!tracking.current) return;
      tracking.current = false;
      setOn(false);
    }
    window.addEventListener('scroll', hideOnScroll, true);
    return () => window.removeEventListener('scroll', hideOnScroll, true);
  }, []);

  function place(e: MouseEvent) {
    const node = pillRef.current;
    if (!node) return;
    // Default: down and to the right of the cursor. `above` flips it to the
    // upper right, with the pill's bottom edge OFFSET_Y clear of the pointer, so
    // it never sits over the thing being pointed at. Near an edge it flips.
    placePill(node, e.clientX, e.clientY, { above });
  }

  function onMouseEnter(e: MouseEvent<HTMLElement>) {
    if (!canFollowCursor()) return;
    tracking.current = true;
    place(e);
    setOn(true);
  }

  function onMouseMove(e: MouseEvent<HTMLElement>) {
    if (!tracking.current) return;
    place(e);
  }

  function onMouseLeave() {
    tracking.current = false;
    setOn(false);
  }

  return {
    mounted,
    on,
    pillRef,
    pillHandlers: { onMouseEnter, onMouseMove, onMouseLeave },
  };
}

export function CursorFollowPill({
  pillRef,
  on,
  label,
  variant,
  icon,
  iconPosition = 'start',
}: {
  pillRef: RefObject<HTMLDivElement | null>;
  on: boolean;
  label: string;
  /** 'invert' swaps the pill to black bg / white text — homepage project
   *  cards only. 'guestbook' is white bg / pink text, for the footer book.
   *  Every other caller (Copy email, Open site, etc.) omits this and keeps
   *  the shared green/dark styling. */
  variant?: 'invert' | 'guestbook';
  /** Optional glyph (e.g. download arrow), leading by default. */
  icon?: ReactNode;
  /** Put the glyph after the label instead of before it. */
  iconPosition?: 'start' | 'end';
}) {
  const classes = ['copy-email-pill', on && 'is-on', variant && `copy-email-pill--${variant}`]
    .filter(Boolean)
    .join(' ');
  return createPortal(
    <div ref={pillRef} className={classes} aria-hidden="true">
      <div className="copy-email-pill__body">
        {icon && iconPosition === 'start' ? <span className="copy-email-pill__icon">{icon}</span> : null}
        <span className="copy-email-pill__label">{label}</span>
        {icon && iconPosition === 'end' ? (
          <span className="copy-email-pill__icon copy-email-pill__icon--end">{icon}</span>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
