'use client';

import { useEffect } from 'react';

/**
 * Reveals each top-level case-study section as it scrolls into view. Pairs
 * with the `.framer-172orq5 > *` rules in casestudy.css, which hold sections
 * pre-reveal only under `html.js` — set synchronously before paint in
 * layout.tsx — so a no-JS visit renders everything visible instead of stuck
 * hidden. The hero (first section) reveals immediately since it's already
 * on screen at load; everything after triggers once, on first intersection.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.casestudy-root .framer-172orq5');
    if (!root || !('IntersectionObserver' in window)) return;

    const sections = Array.from(root.children) as HTMLElement[];
    sections[0]?.classList.add('in-view');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 }
    );

    sections.slice(1).forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return null;
}
