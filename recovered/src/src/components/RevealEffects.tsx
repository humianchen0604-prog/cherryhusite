'use client';

import { useEffect } from 'react';

/**
 * Framer's "appear" effect: elements start at opacity 0.001, nudged 10px down,
 * and spring into place when they scroll into view. Siblings sharing a parent
 * (the hero heading's words) stagger.
 *
 * Timings measured off the live site: ~400ms per element, ~72ms stagger, and an
 * exponential-decay curve captured below as a `linear()` easing.
 */
const DURATION = 400;
const STAGGER = 72;

// Sampled from the live page (progress of translateY 10px -> 0, every 20ms).
const EASE =
  'linear(0, 0.10, 0.221, 0.453, 0.607, 0.725, 0.798, 0.859, 0.900, 0.930, ' +
  '0.953, 0.968, 0.979, 0.986, 0.991, 0.994, 0.9955, 0.9975, 0.998, 0.9983, 1)';

export default function RevealEffects() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-fx="reveal"]'));
    if (!targets.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    // Index within the parent so a run of words staggers left to right.
    const order = new Map<HTMLElement, number>();
    const seen = new Map<Element, number>();
    for (const el of targets) {
      const parent = el.parentElement!;
      const n = seen.get(parent) ?? 0;
      order.set(el, n);
      seen.set(parent, n + 1);
      el.style.opacity = '0.001';
      el.style.transform = 'translateY(10px)';
      el.style.willChange = 'opacity, transform';
    }

    const show = (el: HTMLElement) => {
      const delay = (order.get(el) ?? 0) * STAGGER;
      el.style.transition = `opacity ${DURATION}ms ${EASE} ${delay}ms, transform ${DURATION}ms ${EASE} ${delay}ms`;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      window.setTimeout(() => { el.style.willChange = ''; }, delay + DURATION + 50);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          show(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
