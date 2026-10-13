'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ThemeToggle from '@/components/ThemeToggle';
import { MenuIcon, type MenuIconHandle } from '@/components/icons/MenuIcon';
import { RESUME_URL } from '@/lib/links';

/**
 * Tablet / mobile menu. The button sits in the logo's row, hard right; the
 * panel drops from under it with the same things the desktop chrome offers —
 * the side-nav sections, the bottom links, and the theme switch.
 *
 * The section buttons don't reimplement the side nav's scrolling: they click
 * the real `.side-nav__item` buttons, which already own that behaviour. If the
 * rail isn't mounted at this width the item simply isn't offered.
 */
const LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/cherryhu0604' },
  { label: 'Resume', href: RESUME_URL },
  { label: 'Email', href: 'mailto:bycherr1hu@gmail.com' },
  { label: 'X/Twitter', href: 'https://x.com/bycherr1hu' },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<string[]>([]);
  const iconRef = useRef<MenuIconHandle>(null);

  // Mirror the open state onto the icon's fold-to-cross.
  useEffect(() => {
    if (open) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [open]);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.side-nav__item');
    setSections([...items].map((el) => el.textContent?.trim() ?? '').filter(Boolean));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const goToSection = useCallback((label: string) => {
    const items = document.querySelectorAll<HTMLElement>('.side-nav__item');
    [...items].find((el) => el.textContent?.trim() === label)?.click();
    setOpen(false);
  }, []);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="mobile-menu__trigger"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <MenuIcon ref={iconRef} size={20} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="mobile-menu__scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="mobile-menu__panel"
              /* Scales from the trigger's corner so it reads as coming out of
                 the button, not sliding in from nowhere. */
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
              role="dialog"
              aria-label="Menu"
            >
              {sections.length ? (
                <div className="mobile-menu__group">
                  {sections.map((label, i) => (
                    <motion.button
                      key={label}
                      type="button"
                      className="mobile-menu__item"
                      onClick={() => goToSection(label)}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      /* Staggered so the list resolves downward rather than
                         appearing all at once. */
                      transition={{ delay: 0.03 + i * 0.03, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              ) : null}

              <div className="mobile-menu__group">
                {LINKS.map((l, i) => (
                  <motion.a
                    key={l.label}
                    className="mobile-menu__item"
                    href={l.href}
                    target={l.href.startsWith('http') ? '_blank' : undefined}
                    rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 + (sections.length + i) * 0.03, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {l.label}
                  </motion.a>
                ))}
              </div>

              <div className="mobile-menu__group mobile-menu__group--theme">
                <ThemeToggle />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
