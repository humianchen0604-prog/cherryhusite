'use client';

import { useRef, useState, type ReactNode } from 'react';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const DURATION_MS = 220;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A disclosure row styled like .loom-collapse — same border/summary/icon
 * look as the native <details> version it replaces, but animates open and
 * close instead of snapping instantly. <details> can't do this on its own:
 * the browser hides its content with display:none the moment [open] is
 * removed, which is binary and can't be transitioned. This drives the same
 * visual result with a measured height transition instead (the Radix
 * Collapsible approach) — CSS transitions, not keyframes, so a second click
 * mid-animation retargets smoothly rather than restarting from zero.
 */
export default function LoomCollapse({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const body = bodyRef.current;
    if (!body) return;

    if (prefersReducedMotion()) {
      setOpen((prev) => !prev);
      return;
    }

    if (!open) {
      setOpen(true);
      // Body isn't in the DOM at full height yet this frame — wait one tick
      // for React to render it, then measure and animate from 0.
      requestAnimationFrame(() => {
        const target = body.scrollHeight;
        body.style.height = '0px';
        body.style.overflow = 'hidden';
        void body.offsetHeight;
        body.style.transition = `height ${DURATION_MS}ms ${EASE_OUT}`;
        body.style.height = `${target}px`;
        const onEnd = (e: TransitionEvent) => {
          if (e.propertyName !== 'height') return;
          body.style.height = 'auto';
          body.style.overflow = '';
          body.style.transition = '';
          body.removeEventListener('transitionend', onEnd);
        };
        body.addEventListener('transitionend', onEnd);
      });
    } else {
      const start = body.scrollHeight;
      body.style.height = `${start}px`;
      body.style.overflow = 'hidden';
      void body.offsetHeight;
      body.style.transition = `height ${DURATION_MS}ms ${EASE_OUT}`;
      body.style.height = '0px';
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== 'height') return;
        setOpen(false);
        body.style.transition = '';
        body.removeEventListener('transitionend', onEnd);
      };
      body.addEventListener('transitionend', onEnd);
    }
  };

  return (
    <div className={`loom-collapse${open ? ' is-open' : ''}`}>
      <button type="button" className="loom-collapse__summary" onClick={toggle} aria-expanded={open}>
        {summary}
        <span className="loom-collapse__icon" aria-hidden="true" />
      </button>
      <div ref={bodyRef} className="loom-collapse__body-wrap" hidden={!open}>
        <div className="loom-collapse__body">{children}</div>
      </div>
    </div>
  );
}
