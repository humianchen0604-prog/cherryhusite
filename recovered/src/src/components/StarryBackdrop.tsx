'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

/**
 * The klarden-ui starry sky, laid over the navy page background in dark mode.
 *
 * Fixed behind everything and non-interactive, so it reads as the page's own
 * backdrop rather than a panel. Light mode renders nothing at all — three.js is
 * ~150KB, so it is imported only once the theme actually calls for it, and the
 * canvas is torn down again on the way back to light.
 *
 * Opacity tracks scroll: full at the top of the first viewport, fading clear
 * as you leave that band (home and case studies alike).
 *
 * Except right after switching to night: wherever you are on the page, the
 * stars come out for a few seconds as the payoff for the switch. That ends
 * early the moment you scroll while outside the top band, and either way they
 * fade back to what scroll says (clear, mid-page) and stay that way.
 */

/** How long the stars stay out after switching to night, if you don't scroll. */
const FLASH_MS = 3500;
const FLASH_IN = 'opacity 500ms cubic-bezier(0.23, 1, 0.32, 1)';
const FLASH_OUT = 'opacity 900ms ease';

type StarrySkyProps = {
  className?: string;
  speed?: number;
  starDensity?: number;
  glowIntensity?: number;
  nebulaIntensity?: number;
  interactive?: boolean;
  opacity?: number;
};

export default function StarryBackdrop() {
  const wrapRef = useRef<HTMLDivElement>(null);
  /** The switch the flash has already played for, so re-runs don't replay it. */
  const flashedFor = useRef(0);
  const [dark, setDark] = useState(false);
  const [Sky, setSky] = useState<ComponentType<StarrySkyProps> | null>(null);
  /** Bumped on each light → night switch; 0 means "never switched here". */
  const [switchCount, setSwitchCount] = useState(0);

  // Follow the same data-theme the toggle writes.
  useEffect(() => {
    let wasDark = document.documentElement.dataset.theme === 'dark';
    const read = () => {
      const isDark = document.documentElement.dataset.theme === 'dark';
      // A page that loads dark isn't a switch — only the change is.
      if (isDark && !wasDark) setSwitchCount((n) => n + 1);
      wasDark = isDark;
      setDark(isDark);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dark || Sky) return;
    let cancelled = false;
    import('./starry-sky').then((m) => {
      if (!cancelled) setSky(() => m.default);
    });
    return () => { cancelled = true; };
  }, [dark, Sky]);

  // Opacity tracks scroll — full at top, clear after ~0.85vh — unless the
  // post-switch flash is holding the stars out.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !dark) return;

    const scrollOpacity = () => {
      const range = Math.max(120, window.innerHeight * 0.85);
      const t = Math.min(1, Math.max(0, window.scrollY / range));
      // Ease-out so the first stretch of scroll fades gently, then settles clear.
      return 1 - t * (2 - t);
    };

    // Only a switch made while this effect is live flashes; the Sky finishing
    // its lazy import on the first switch re-runs this with the same count.
    let flashing = switchCount > 0 && switchCount !== flashedFor.current;
    flashedFor.current = switchCount;
    let flashTimer = 0;

    const endFlash = () => {
      if (!flashing) return;
      flashing = false;
      window.clearTimeout(flashTimer);
      el.style.transition = FLASH_OUT;
      el.style.opacity = String(scrollOpacity());
      // Back to tracking scroll 1:1 once the fade has landed.
      window.setTimeout(() => {
        if (!flashing) el.style.transition = '';
      }, 950);
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      if (flashing) return;
      el.style.opacity = String(scrollOpacity());
    };

    const onScroll = () => {
      // Scrolling anywhere outside the top band ends the flash early.
      if (flashing && scrollOpacity() < 1) endFlash();
      if (!raf) raf = requestAnimationFrame(update);
    };

    if (flashing) {
      // The band mounts clear (it renders nothing in light mode), so this
      // fades straight up from 0 wherever you are on the page.
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
      if (raf) cancelAnimationFrame(raf);
    };
  }, [dark, Sky, switchCount]);

  if (!dark || !Sky) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        /* Stars only in the upper band of the viewport — not the full scroll. */
        height: '30vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'transparent',
        mixBlendMode: 'screen',
        filter: 'brightness(0.48)',
        /* Mounts clear; the scroll/flash effect sets the real value. */
        opacity: 0,
        willChange: 'opacity',
        /* Soft exit so the band doesn’t hard-cut mid-sky. */
        WebkitMaskImage:
          'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)',
      }}
    >
      {/* ~40% fewer stars via grid scale; shapes 40% under prior size. */}
      <Sky
        speed={1.0}
        starDensity={1.76}
        glowIntensity={1.1}
        nebulaIntensity={0.6}
        interactive={false}
        opacity={1}
        className="starry-backdrop"
      />
    </div>
  );
}
