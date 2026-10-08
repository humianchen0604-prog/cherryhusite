'use client';

import { useEffect, useState } from 'react';

type PersonKey = 'maya' | 'jin' | 'priya' | 'ren' | 'leo' | 'sable';

/** Must match the ROLES/ORDER data baked into
 *  public/assets/loom/export-panels-cycle.html — that page posts one of
 *  these keys to the parent window every time it opens the next person's
 *  panel, so the caption below stays in lockstep purely through name
 *  matching. */
const PEOPLE: { key: PersonKey; name: string; role: string }[] = [
  { key: 'maya', name: 'Maya', role: 'Creative Director' },
  { key: 'jin', name: 'Jin', role: 'Product Designer' },
  { key: 'priya', name: 'Priya', role: 'Brand Strategist' },
  { key: 'ren', name: 'Ren', role: 'Motion Designer' },
  { key: 'leo', name: 'Leo', role: 'Copywriter' },
  { key: 'sable', name: 'Sable', role: 'Illustrator' },
];

/**
 * The export panel, full width, cycling through each person in turn — the
 * iframe drives the loop (open, hold, fade closed, next) and posts the
 * active person's key up via postMessage; this component just listens and
 * swaps the caption underneath, same subtext treatment as every other media
 * caption on the page.
 */
export default function LoomExportCycle() {
  const [active, setActive] = useState<PersonKey>('maya');

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { source?: string; person?: string } | null;
      if (data?.source !== 'loom-export-cycle') return;
      if (PEOPLE.some((p) => p.key === data.person)) setActive(data.person as PersonKey);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const activePerson = PEOPLE.find((p) => p.key === active) ?? PEOPLE[0];

  return (
    <>
      <div className="loom-media loom-export-cycle__frame" style={{ width: '100%' }}>
        <iframe
          src="/assets/loom/export-panels-cycle.html"
          title="Export panel cycling through each teammate's context"
          loading="lazy"
        />
      </div>
      <p className="loom-media-caption">{`${activePerson.name} · ${activePerson.role}`}</p>
    </>
  );
}
