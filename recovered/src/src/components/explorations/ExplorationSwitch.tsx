'use client';

import { useEffect, useState } from 'react';
import { EXPLORATION_GROUPS, setExploration, useExploration } from './explorations';

/**
 * The version list in the /explorations side nav, under the section links.
 * Styled like the nav itself: idle items at 35%, the picked one at 90% and
 * indented. Clicking swaps the landing page's hero / sky in place.
 */
export default function ExplorationSwitch() {
  const picked = useExploration();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === 'dark');
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="exploration-switch" role="radiogroup" aria-label="Landing page version">
      <span className="exploration-switch__caption" aria-hidden="true">
        Versions
      </span>
      {EXPLORATION_GROUPS.map((group, gi) => (
        <div key={gi} className="exploration-switch__group">
          {group.caption ? (
            <span className="exploration-switch__caption exploration-switch__caption--sub" aria-hidden="true">
              {group.caption}
              {dark && group.darkHint ? <em> · {group.darkHint}</em> : null}
            </span>
          ) : null}
          {group.items.map((item) => {
            const on = item.id === picked;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                className="side-nav__item exploration-switch__option"
                data-active={on ? 'true' : undefined}
                style={{ ['--nav-alpha' as string]: on ? 0.9 : 0.35, paddingLeft: on ? 12 : 0 }}
                onClick={() => setExploration(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
