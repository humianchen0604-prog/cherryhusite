'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export type SideNavItem = { label: string; id: string };

// "Vibe Coding" and "Playground" used to be two separate nav entries and page
// sections; the Playground section's own content was pulled ("Motion reel
// removed for now") leaving it an empty heading with nothing under it. Rather
// than point the nav at that empty section, this single entry now points at
// the section that actually has content (id stays "vibecoding" — only the
// section's own heading text was renamed to "Playground", see VibeCoding.tsx).
const HOME_ITEMS: readonly SideNavItem[] = [
  { label: 'Projects', id: 'projects' },
  { label: 'Playground', id: 'vibecoding' },
  { label: 'About', id: 'about' },
];

export const CASE_STUDY_ITEMS: readonly SideNavItem[] = [
  { label: 'Overview', id: 'overview' },
  { label: 'Problem', id: 'problem' },
  { label: 'Solution', id: 'solution' },
  { label: 'Research', id: 'research' },
  { label: 'Next Steps', id: 'nextsteps' },
];

// The live site promotes a section once its top has scrolled to within 20% of the
// viewport height from the top edge — measured at 172/179/176px on a 900px viewport.
const ACTIVATE_RATIO = 0.2;
const REVEAL_RATIO = 0.5;

type SideNavProps = {
  items?: readonly SideNavItem[];
  className?: string;
  /** When set, hide the nav until this section reaches the reveal edge; hide again on scroll up. */
  revealAtId?: string;
  /** `top` = element's top edge meets the viewport top. `mid` = mid-viewport. */
  revealWhen?: 'mid' | 'top';
  /**
   * Optional secondary rails keyed by a primary item id. Shown only while that
   * primary item is the active section (e.g. TikTok project shorts beside
   * "Projects").
   */
  subItems?: Readonly<Record<string, readonly SideNavItem[]>>;
  /** Extra content under the rails (the /explorations version list). */
  footer?: ReactNode;
};

function NavButton({
  item,
  active,
  index,
  tabIndex,
  onClick,
}: {
  item: SideNavItem;
  active: boolean;
  index: number;
  tabIndex: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="side-nav__item"
      tabIndex={tabIndex}
      onClick={onClick}
      data-active={active ? 'true' : undefined}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 0',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        fontFamily: '"PP Neue Montreal", "Helvetica Neue", Helvetica, sans-serif',
        fontSize: 'calc(1rem * 0.78 * var(--text-scale, 1))',
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: '0em',
        textAlign: 'left',
        outline: 'none',
        WebkitFontSmoothing: 'antialiased',
        paddingLeft: active ? '12px' : '0',
        ['--nav-alpha' as string]: active ? 0.9 : 0.35,
        ['--nav-i' as string]: index,
      }}
    >
      <span className="side-nav__clip">
        <span className="side-nav__label" style={{ display: 'block', pointerEvents: 'none' }}>
          {item.label}
        </span>
      </span>
    </button>
  );
}

export default function SideNav({
  items = HOME_ITEMS,
  className = 'framer-1bj2ubo-container hidden-1q647kq',
  revealAtId,
  revealWhen = 'mid',
  subItems,
  footer,
}: SideNavProps) {
  const [active, setActive] = useState(0);
  const [subActive, setSubActive] = useState(-1);
  const [visible, setVisible] = useState(!revealAtId);
  const [exiting, setExiting] = useState(false);
  const frame = useRef(0);
  const exitTimer = useRef(0);
  const hasShown = useRef(!revealAtId);

  useEffect(() => {
    const update = () => {
      frame.current = 0;
      const line = window.innerHeight * ACTIVATE_RATIO;
      let next = 0;
      items.forEach((item, i) => {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= line) next = i;
      });
      setActive(next);

      const activeId = items[next]?.id;
      const subs = activeId && subItems ? subItems[activeId] : undefined;
      if (subs?.length) {
        let subNext = -1;
        subs.forEach((item, i) => {
          const el = document.getElementById(item.id);
          if (el && el.getBoundingClientRect().top <= line) subNext = i;
        });
        setSubActive(subNext);
      } else {
        setSubActive(-1);
      }

      if (revealAtId) {
        const revealEl = document.getElementById(revealAtId);
        if (revealEl) {
          const top = revealEl.getBoundingClientRect().top;
          const mid = window.innerHeight * REVEAL_RATIO;
          setVisible((was) => {
            const show = revealWhen === 'top' ? (was ? top <= 8 : top <= 1) : top <= mid;
            if (show === was) return was;
            window.clearTimeout(exitTimer.current);
            if (show) {
              setExiting(false);
              hasShown.current = true;
            } else if (hasShown.current) {
              setExiting(true);
              exitTimer.current = window.setTimeout(() => setExiting(false), 400);
            }
            return show;
          });
        }
      }
    };
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.clearTimeout(exitTimer.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items, revealAtId, revealWhen, subItems]);

  const gated = Boolean(revealAtId);
  const activeId = items[active]?.id;
  const activeSubs = activeId && subItems ? subItems[activeId] : undefined;
  const subOpen = Boolean(activeSubs?.length);
  const tabIndex = gated && !visible ? -1 : 0;

  return (
    <div
      className={`${className} side-nav${gated ? ' side-nav--gated' : ''}${visible ? ' is-visible' : ''}${exiting ? ' is-exiting' : ''}${subOpen ? ' side-nav--with-sub' : ''}`}
      style={gated ? { pointerEvents: visible ? 'auto' : 'none' } : undefined}
      aria-hidden={gated ? !visible : undefined}
    >
      <div className="side-nav__rails">
        <div className="side-nav__rail">
          {items.map((item, i) => (
            <NavButton
              key={item.id}
              item={item}
              active={i === active}
              index={i}
              tabIndex={tabIndex}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
            />
          ))}
        </div>

        {activeSubs?.length ? (
          <div
            className="side-nav__rail side-nav__rail--sub"
            aria-label="Project sections"
          >
            {activeSubs.map((item, i) => (
              <NavButton
                key={item.id}
                item={item}
                active={i === subActive}
                index={i}
                tabIndex={tabIndex}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              />
            ))}
          </div>
        ) : null}
      </div>
      {footer}
    </div>
  );
}
