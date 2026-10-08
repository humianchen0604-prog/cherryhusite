'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2Icon, type Maximize2IconHandle } from '@/components/icons/Maximize2Icon';

/**
 * Case studies open from the home page as a preview panel: the real case-study
 * route runs inside an iframe (`?embed=1` strips its own chrome), so the whole
 * study scrolls within the panel. The top-right arrow expands the panel to the
 * full viewport — the iframe then resizes, so the study's own media queries
 * give the responsive layout.
 *
 * The URL mirrors the open study as `/?case=<slug>` (same shape as the
 * reference), so back/forward and reloads work.
 */
export const OPEN_CASE_EVENT = 'open-case';

/** Ask the modal to open a case study; from inside the iframe, ask the parent. */
export function openCaseStudy(href: string) {
  if (window.self !== window.top) {
    window.parent.postMessage({ type: OPEN_CASE_EVENT, href }, window.location.origin);
  } else {
    window.dispatchEvent(new CustomEvent(OPEN_CASE_EVENT, { detail: { href } }));
  }
}

const slugOf = (href: string) => href.replace(/^\/+|\/+$/g, '').split(/[?#]/)[0];

export default function CaseStudyModal() {
  const [slug, setSlug] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  // Shared handle: Maximize2 and Minimize2 expose the same imperative shape,
  // and only one is mounted at a time.
  const sizeIcon = useRef<Maximize2IconHandle>(null);

  const open = useCallback((href: string, push = true) => {
    const next = slugOf(href);
    if (!next) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    setLoaded(false);
    setSlug(next);
    if (push) history.pushState({ case: next }, '', `/?case=${next}`);
  }, []);

  const close = useCallback((fromPop = false) => {
    setSlug(null);
    setExpanded(false);
    if (!fromPop && new URLSearchParams(location.search).has('case')) {
      history.pushState({}, '', '/');
    }
    lastFocus.current?.focus?.();
  }, []);

  // Entry points: custom event (same window), postMessage (from the iframe),
  // popstate, and a deep link on first load.
  useEffect(() => {
    const onOpen = (e: Event) => open((e as CustomEvent<{ href: string }>).detail.href);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== OPEN_CASE_EVENT) return;
      open(String(e.data.href));
    };
    const onPop = () => {
      const c = new URLSearchParams(location.search).get('case');
      if (c) {
        setSlug(c);
      } else {
        close(true);
      }
    };
    window.addEventListener(OPEN_CASE_EVENT, onOpen);
    window.addEventListener('message', onMessage);
    window.addEventListener('popstate', onPop);
    const initial = new URLSearchParams(location.search).get('case');
    if (initial) setSlug(initial);
    return () => {
      window.removeEventListener(OPEN_CASE_EVENT, onOpen);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('popstate', onPop);
    };
  }, [open, close]);

  // Esc collapses first, then closes; lock page scroll behind the panel.
  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (expanded) setExpanded(false);
      else close();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [slug, expanded, close]);

  if (!slug) return null;

  return (
    <div
      className={`case-modal${expanded ? ' is-expanded' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Case study preview"
    >
      <div className="case-modal__scrim" onClick={() => close()} />
      <div className="case-modal__panel" ref={panelRef} tabIndex={-1}>
        <div className="case-modal__bar">
          {/* Preview shows only the maximize control (top-right); the panel
              closes via the scrim or Esc. Full view adds a persistent "Back"
              nav on the left, echoing the case studies' own back pill. */}
          {expanded ? (
            <button
              type="button"
              className="case-modal__back"
              onClick={() => close()}
              aria-label="Back to home"
            >
              {/* The same return-arrow the case studies use for their own
                  back pill — currentColor so it tracks the button's text. */}
              <svg
                width="11"
                height="9"
                viewBox="0 0 9 7"
                fill="none"
                className="case-modal__back-arrow"
                aria-hidden="true"
              >
                <path
                  d="M 0.804 2.706 L 0.468 3.042 L 0.133 2.706 L 0.468 2.372 Z M 8.866 6.502 C 8.876 6.676 8.787 6.842 8.637 6.932 C 8.486 7.022 8.299 7.022 8.149 6.932 C 7.998 6.842 7.91 6.676 7.919 6.502 Z M 2.838 5.413 L 0.468 3.042 L 1.139 2.371 L 3.51 4.742 Z M 0.468 2.372 L 2.838 0 L 3.51 0.671 L 1.137 3.041 L 0.467 2.369 Z M 0.804 2.232 L 5.546 2.232 L 5.546 3.18 L 0.804 3.18 Z M 8.866 5.552 L 8.866 6.502 L 7.919 6.502 L 7.919 5.552 Z M 5.546 2.232 C 7.379 2.232 8.866 3.719 8.866 5.552 L 7.919 5.552 C 7.919 4.923 7.668 4.32 7.223 3.875 C 6.778 3.43 6.175 3.18 5.546 3.18 Z"
                  fill="currentColor"
                />
              </svg>
              Back
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
          {/* Full view shows only the Back nav — no collapse control; the
              preview shows only the maximize. (Esc still collapses.) */}
          {!expanded && (
            <button
              type="button"
              className="case-modal__btn"
              onClick={() => setExpanded(true)}
              onMouseEnter={() => sizeIcon.current?.startAnimation()}
              onMouseLeave={() => sizeIcon.current?.stopAnimation()}
              aria-label="Expand to full view"
            >
              <Maximize2Icon
                ref={sizeIcon}
                size={16}
                className="case-modal__sizeicon"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
        <div className="case-modal__body">
          <iframe
            key={slug}
            className={`case-modal__frame${loaded ? ' is-loaded' : ''}`}
            src={`/${slug}?embed=1`}
            title={`${slug} case study`}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
