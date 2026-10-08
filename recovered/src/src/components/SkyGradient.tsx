'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Light-mode counterpart to StarryBackdrop: a soft sky across the top of the
 * viewport — #CFE7FD, strongest along the right edge and thinning out toward
 * the left, lighter along the very top and fading out at the bottom.
 *
 * On the landing page it rests behind the hero: full at the top of the page,
 * fading clear across the first ~0.4 viewport, so it's gone once you're past
 * the hero. Other pages don't show it at rest.
 *
 * Switching from night to light plays it like the stars' own switch: wherever
 * you are on whichever page, the sky fades in for a few seconds as the payoff
 * for the switch. It ends early the moment you scroll, and either way fades
 * back to what the page shows at rest. Just the sky — the hero cloud stays a
 * landing-page, top-of-page thing.
 *
 * On the landing page the band sits behind the content (its shell is
 * transparent). Other pages paint their own near-white shells, so there the
 * sky is laid over the page instead, multiplied in: white areas take on the
 * blue, dark type stays dark. Hidden in dark mode, where the stars take over.
 */

/** How long the sky stays out after switching to light, if you don't scroll. */
const FLASH_MS = 3500;
const FLASH_IN = 'opacity 500ms cubic-bezier(0.23, 1, 0.32, 1)';
const FLASH_OUT = 'opacity 900ms ease';

export default function SkyGradient() {
  const wrapRef = useRef<HTMLDivElement>(null);
  /** The switch the flash has already played for, so re-runs don't replay it. */
  const flashedFor = useRef(0);
  const [light, setLight] = useState(false);
  /** Bumped on each night → light switch; 0 means "never switched here". */
  const [switchCount, setSwitchCount] = useState(0);
  // /explorations is the landing page with swappable heroes; its "Current"
  // version shows the sky as home does (the others hide it, explorations.css).
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/explorations';

  // Follow the same data-theme the toggle writes.
  useEffect(() => {
    let wasLight = document.documentElement.dataset.theme !== 'dark';
    const read = () => {
      const isLight = document.documentElement.dataset.theme !== 'dark';
      // A page that loads light isn't a switch — only the change is.
      if (isLight && !wasLight) setSwitchCount((n) => n + 1);
      wasLight = isLight;
      setLight(isLight);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Opacity tracks scroll (landing page) or stays clear (elsewhere) — unless
  // the post-switch flash is holding the sky out.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const restOpacity = () => {
      if (!isHome) return 0;
      const range = Math.max(120, window.innerHeight * 0.4);
      const t = Math.min(1, Math.max(0, window.scrollY / range));
      return 1 - t * (2 - t);
    };

    // Only a switch made while this effect is live flashes.
    let flashing = light && switchCount > 0 && switchCount !== flashedFor.current;
    flashedFor.current = switchCount;
    let flashTimer = 0;
    let settleTimer = 0;

    const endFlash = () => {
      if (!flashing) return;
      flashing = false;
      window.clearTimeout(flashTimer);
      el.style.transition = FLASH_OUT;
      el.style.opacity = String(restOpacity());
      // Back to tracking scroll 1:1 once the fade has landed.
      settleTimer = window.setTimeout(() => {
        if (!flashing) el.style.transition = '';
      }, 950);
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      if (flashing) return;
      el.style.opacity = String(restOpacity());
    };

    const onScroll = () => {
      // Scrolling ends the flash early (on the landing page, once you've left
      // the very top).
      if (flashing && restOpacity() < 1) endFlash();
      if (!raf) raf = requestAnimationFrame(update);
    };

    if (flashing) {
      void el.offsetWidth;
      el.style.transition = FLASH_IN;
      el.style.opacity = '1';
      flashTimer = window.setTimeout(endFlash, FLASH_MS);
    } else {
      update();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearTimeout(flashTimer);
      window.clearTimeout(settleTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [light, switchCount, isHome]);

  return (
    <div ref={wrapRef} className={`sky-gradient${isHome ? '' : ' sky-gradient--over'}`} aria-hidden>
      <div className="sky-gradient__fill" data-on={light ? '' : undefined} />
    </div>
  );
}
