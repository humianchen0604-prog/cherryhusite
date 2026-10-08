'use client';

import { useEffect, useRef, useState } from 'react';
import GuestbookBook from './GuestbookBook';
import { useLosAngelesTime } from './LocalTime';
import GuestbookDotField from '@/components/GuestbookDotField';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';
import { DownloadIcon, type DownloadIconHandle } from '@/components/icons/DownloadIcon';
import { FeatherIcon, type FeatherIconHandle } from '@/components/icons/FeatherIcon';
import { openResume } from '@/lib/links';

/**
 * Page footer — Figma `Frame 4` (node 1538:27985), a 1200x515 band on #101010.
 *
 * Laid out fluid rather than at the fixed 1200 so it fills the viewport. The
 * guestbook stays centred; the social row pins to the left inset.
 *
 * Motion is the "footer reveal": a clipped band whose contents slide up as it
 * enters view. The reference frame — translate3d(0, 11.677%, 0) at opacity
 * 0.88323 — pins the mapping, since 1 - 0.88323 = 0.11677: one progress value
 * drives both, translateY 100% -> 0% against opacity 0 -> 1.
 */

/**
 * cubic-bezier(0.23, 1, 0.32, 1) — a strong ease-out. The scroll drives a linear
 * 0..1, which reads as flat and slow; shaping it through this curve front-loads
 * the movement so the contents arrive quickly and settle, instead of creeping in
 * at a constant rate for the whole scroll.
 */
function easeOut(t: number): number {
  const x1 = 0.23, x2 = 0.32;
  const bx = (u: number) => 3 * u * (1 - u) * ((1 - u) * x1 + u * x2) + u * u * u;
  // y1 = y2 = 1, so by simplifies to u(3 - 3u + u^2)
  const by = (u: number) => u * (3 + u * (u - 3));
  let lo = 0, hi = 1, u = t;
  for (let i = 0; i < 20; i++) {
    const x = bx(u);
    if (Math.abs(x - t) < 1e-5) break;
    if (x < t) lo = u; else hi = u;
    u = (lo + hi) / 2;
  }
  return by(u);
}

/** Fraction of the footer's height the reveal takes; lower finishes sooner. */
const REVEAL_TRAVEL = 0.55;

const SOCIALS = [
  // `label` is what the hover caption shows; `name` stays the accessible name.
  { name: 'LinkedIn', label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/cherryhu0604' },
  { name: 'X', label: 'X', icon: 'x', href: 'https://x.com/bycherr1hu' },
  { name: 'Instagram', label: 'IG', icon: 'instagram', href: 'https://www.instagram.com/bycherr1hu' },
  { name: 'Email', label: 'Email', icon: 'email', href: 'mailto:bycherr1hu@gmail.com' },
] as const;

export default function Footer() {
  const laTime = useLosAngelesTime();
  const ref = useRef<HTMLElement>(null);
  const featherRef = useRef<FeatherIconHandle>(null);
  const [progress, setProgress] = useState(0);
  // The dot canvas takes a colour, not a CSS variable, so the footer has to
  // know the theme itself. Light keeps the dark grey; night flips to white.
  const [night, setNight] = useState(false);
  useEffect(() => {
    const read = () => setNight(document.documentElement.dataset.theme === 'dark');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  const {
    mounted: resumePillMounted,
    on: resumePillOn,
    pillRef: resumePillRef,
    pillHandlers: resumePillHandlers,
  } = useCursorFollowPill({ above: true });
  const downloadIconRef = useRef<DownloadIconHandle>(null);

  useEffect(() => {
    if (resumePillOn) downloadIconRef.current?.startAnimation();
    else downloadIconRef.current?.stopAnimation();
  }, [resumePillOn]);

  // The feather writes itself a note every 8s, forever. The first wave waits a
  // full beat so it doesn't fire before the footer has revealed.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => featherRef.current?.startAnimation(), 8000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      if (!reduced) {
        // 0 when the footer's top meets the bottom of the viewport, 1 once it has
        // risen REVEAL_TRAVEL of its height — so the contents are fully up well
        // before the footer finishes scrolling in.
        const travel = Math.max(1, Math.min(r.height, window.innerHeight) * REVEAL_TRAVEL);
        const linear = Math.max(0, Math.min(1, (window.innerHeight - r.top) / travel));
        setProgress(easeOut(linear));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    if (reduced) setProgress(1);
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <aside className="footer_reveal" ref={ref}>
      <div
        className="footer_reveal-image"
        style={{
          willChange: 'transform, opacity',
          transformStyle: 'preserve-3d',
          transform: `translate3d(0px, ${((1 - progress) * 100).toFixed(3)}%, 0px)`,
          opacity: progress.toFixed(5),
        }}
      >
        <div className="footer_stage" data-revealed={progress > 0.35 ? 'true' : 'false'}>
          <GuestbookDotField
            className="footer_dots"
            dotRadius={1.485}
            dotSpacing={21}
            // Pause between compositions: default 300ms + 400ms for a longer beat.
            restMs={700}
            rgb={night ? '255, 255, 255' : '48, 48, 48'}
            // Night: white dots at 0.1 — white reads far stronger than the dark
            // grey on the same #181818 band, so it needs far less opacity.
            alpha={night ? 0.1 : 0.365}
          />
          <button
            type="button"
            className="footer_resume"
            aria-label="Download resume"
            onClick={openResume}
            {...resumePillHandlers}
          >
            <img
              src="/assets/footer/resume-sticker.png"
              alt=""
              width={795}
              height={1024}
              decoding="async"
              draggable={false}
            />
          </button>
          {resumePillMounted ? (
            <CursorFollowPill
              pillRef={resumePillRef}
              on={resumePillOn}
              label="Download resume"
              icon={<DownloadIcon ref={downloadIconRef} size={14} />}
            />
          ) : null}
          <p className="footer_curious">
            {"I'd love to know you stopped by,"}
            <br />
            {"sign my guestbook"}
            <FeatherIcon ref={featherRef} className="footer_feather" size={16.56} aria-hidden />
          </p>

          <p className="footer_credit">
            <span className="footer_credit-line">
              Made with lots of joy and afternoon lattes
            </span>
            <span className="footer_credit-line">
              Built with{' '}
              <img
                className="footer_credit-mark"
                src="/assets/footer/cursor.png"
                alt="Cursor"
                width={16}
                height={16}
              />
              {' '}&amp;{' '}
              <img
                className="footer_credit-mark"
                src="/assets/footer/vercel.png"
                alt="Vercel"
                width={16}
                height={16}
              />
            </span>
            {/* Live Los Angeles time. The nbsp holds the line's height until the
                clock has read the time, so the block does not jump. */}
            <span className="footer_credit-line">{laTime ? `Los Angeles · ${laTime}` : '\u00A0'}</span>
          </p>

          <ul className="footer_socials">
            {SOCIALS.map(({ name, label, icon, href }) => {
              // The icon is painted as a background masked by its own artwork, so
              // hovering can recolour the glyph itself (LinkedIn and Instagram
              // carry brand fills from the design).
              const glyph = (
                <>
                  {/* The artwork is chosen in CSS by data-icon. Setting it inline
                      would outrank the stylesheet and block the hover swap. */}
                  <span className="footer_icon" data-icon={icon} />
                  <span className="footer_icon_label" data-icon={icon} aria-hidden>{label}</span>
                </>
              );
              return (
                <li key={name}>
                  {href ? (
                    // mailto: hands off to the mail client, so it must not be
                    // given target="_blank" — that leaves a blank tab behind.
                    <a
                      href={href}
                      aria-label={name}
                      {...(href.startsWith('mailto:')
                        ? {}
                        : { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {glyph}
                    </a>
                  ) : (
                    // No destination in the design yet; shown but not yet linked.
                    <span role="img" aria-label={name}>
                      {glyph}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

        </div>
      </div>

      {/* The guestbook — the design's "Placeholder element" slot. It sits
          outside the reveal wrapper on purpose: that wrapper is what slides the
          footer up on scroll, and the book is meant to hold its place in the
          band rather than ride along with it. Same box as .footer_stage, so the
          slot lands exactly where it would have inside. */}
      <div className="footer_book_pin">
        <GuestbookBook />
      </div>
    </aside>
  );
}
