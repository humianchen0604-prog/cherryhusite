'use client';

import { useEffect } from 'react';

/**
 * Homepage scroll reveal — same language as case-study ScrollReveal.
 * Targets each direct child of `.framer-mxkekt` (Intro, Projects, Playground,
 * About). Held pre-reveal only under `html.js` (see globals.css).
 *
 * Intro is special: it stays held until `.who-line[data-ready="true"]` so fonts
 * and lockup icons are loaded before the fade-in runs.
 */
function waitForWhoLineReady(section: HTMLElement, timeoutMs = 5000): Promise<void> {
  const who = section.querySelector('.who-line');
  if (!who || who.getAttribute('data-ready') === 'true') return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      obs.disconnect();
      window.clearTimeout(timer);
      resolve();
    };
    const obs = new MutationObserver(() => {
      if (who.getAttribute('data-ready') === 'true') done();
    });
    obs.observe(who, { attributes: true, attributeFilter: ['data-ready'] });
    const timer = window.setTimeout(done, timeoutMs);
  });
}

export default function HomeScrollReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.framer-TE0xJ .framer-mxkekt');
    if (!root || !('IntersectionObserver' in window)) return;

    const sections = Array.from(root.children) as HTMLElement[];
    if (!sections.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((section) => section.classList.add('in-view'));
      return;
    }

    let cancelled = false;

    const reveal = (el: HTMLElement) => {
      if (cancelled || el.classList.contains('in-view')) return;
      el.classList.add('in-view');
    };

    const intro = sections[0];
    waitForWhoLineReady(intro).then(() => reveal(intro));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          reveal(el);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 }
    );

    sections.slice(1).forEach((section) => observer.observe(section));

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return null;
}
