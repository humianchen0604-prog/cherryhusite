'use client';

import { useEffect, useRef, useState } from 'react';
import { ClockIcon, type ClockIconHandle } from './ClockIcon';

/** "21:30 PM" — live, Los Angeles time. Only the minute is shown, so a 15s
    poll is enough. h23 rather than hour12:false, which formats midnight as 24. */
export function useLosAngelesTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date());
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
      const hour = get('hour');
      const period = Number(hour) >= 12 ? 'PM' : 'AM';
      setTime(`${hour}:${get('minute')} ${period}`);
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * Same row as Night mode — clock + "{time} in LA", faded at rest,
 * full ink on hover. The clock hands tick when the row is hovered.
 */
export default function LocalTime() {
  const time = useLosAngelesTime();
  const clockRef = useRef<ClockIconHandle>(null);
  const [hovered, setHovered] = useState(false);

  const onEnter = () => {
    setHovered(true);
    clockRef.current?.startAnimation();
  };
  const onLeave = () => {
    setHovered(false);
    clockRef.current?.stopAnimation();
  };

  const label = time ? `${time} in LA` : 'LA';

  return (
    <div
      className="framer-q9vgl8 theme-toggle local-time"
      role="status"
      aria-label={label}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ opacity: hovered ? 1 : 0.36 }}
    >
      <span className="theme-toggle__icon">
        <ClockIcon ref={clockRef} size={11.7} />
      </span>
      <span className="theme-toggle__label">{label}</span>
    </div>
  );
}
