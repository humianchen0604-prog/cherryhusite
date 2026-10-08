'use client';

import { useEffect, useRef, useState } from 'react';
import ThemeCursorSwitch from '@/components/ThemeCursorSwitch';

/**
 * Same Night/Light switch as the home rail, fixed to the case-study left
 * gutter so it lines up with the side nav (left: 40px). Hidden with the nav
 * below 1200px via `hidden-kbwdhd`, where it moves to the top-right instead.
 *
 * It fades out once the footer arrives: the footer is its own dark band with
 * its own furniture, and a switch pinned over it reads as belonging to the
 * footer rather than to the page.
 */
export default function CaseStudyThemeToggle() {
  const ref = useRef<HTMLDivElement>(null);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('.footer_reveal');
    if (!footer) return;
    // Any sliver of footer on screen counts — by the time it is half up, the
    // switch is already sitting on top of it.
    const io = new IntersectionObserver(
      ([entry]) => setAtFooter(entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="casestudy-theme-toggle hidden-kbwdhd"
      data-at-footer={atFooter ? 'true' : 'false'}
      aria-label="Theme"
    >
      <ThemeCursorSwitch />
    </div>
  );
}
