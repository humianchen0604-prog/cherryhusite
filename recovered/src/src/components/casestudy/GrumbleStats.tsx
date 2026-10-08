'use client';

import { useEffect, useRef, useState } from 'react';
import CountUp from '@/components/casestudy/CountUp';

/**
 * "What We Found" — research stats under the Problem section, styled
 * after the isotype/pictogram panels on cherryhu.com/dandi (person-icon grid,
 * one accent hue + gray, ordered fill) but recolored to Grumble's own peach
 * (filled cells use #FF9735) and dropped
 * into the site's existing flat #fafafa card shell (.grumble-tldr-card).
 *
 * Sourcing: 55% — 2025 Talker Research survey of 2,000 employed Americans.
 * The pictogram is 5 full figures plus one split down the middle — 5.5 / 10
 * = 55%, countable without a 100-cell waffle.
 *
 * 25% — American Time Use Survey data reported in the 2025 World Happiness
 * Report: in 2023, a quarter of 18–24 year-olds ate all three meals alone
 * the previous day, roughly double the rate from two decades earlier. This
 * is the stat that grounds Key Solutions' "shared with a friend" mechanic —
 * the origin story's "no one around to eat with" wasn't just this team's
 * experience, it's the norm for the age group Grumble is built for.
 */

const GRID_TOTAL = 10;
const CELLS = Array.from({ length: GRID_TOTAL }, (_, i) => i);

function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return [ref, shown] as const;
}

function PersonMark() {
  return (
    <>
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <path
        fill="currentColor"
        d="M14 7h-4c-1.1 0-2 .9-2 2v6h2.5v7h3v-7H16V9c0-1.1-.9-2-2-2z"
      />
    </>
  );
}

function Pictogram({ filled }: { filled: number }) {
  const full = Math.floor(filled);
  const hasHalf = filled % 1 !== 0;

  return (
    <div className="grumble-pictogram" aria-hidden="true">
      {CELLS.map((i) => {
        const on = i < full;
        const half = !on && hasHalf && i === full;
        return (
          <svg
            key={i}
            className={`grumble-pictogram__cell${on ? ' grumble-pictogram__cell--on' : ''}${half ? ' grumble-pictogram__cell--half' : ''}`}
            style={{ '--i': i } as React.CSSProperties}
            viewBox="0 0 24 24"
          >
            <PersonMark />
            {half ? (
              <g className="grumble-pictogram__half-fill">
                <PersonMark />
              </g>
            ) : null}
          </svg>
        );
      })}
    </div>
  );
}

/**
 * "1 in N" — N circles on a single row. Deliberately NOT a
 * left-to-right fill like the pictogram beside it, so the two cards don't read
 * as one chart split across the gutter.
 */
const RATIO_R = 12;
const RATIO_GAP = 8;
const RATIO_H = RATIO_R * 2;

function RatioGlyph({ filled, total }: { filled: number; total: number }) {
  const pitch = RATIO_R * 2 + RATIO_GAP;
  const width = RATIO_R * 2 + (total - 1) * pitch;

  return (
    <svg
      className="grumble-ratio"
      viewBox={`0 0 ${width} ${RATIO_H}`}
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label={`${filled} of ${total} circles filled`}
    >
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled;
        return (
          <circle
            key={i}
            className={on ? 'grumble-ratio__mark grumble-ratio__mark--on' : 'grumble-ratio__mark'}
            style={{ '--i': i } as React.CSSProperties}
            cx={RATIO_R + i * pitch}
            cy={RATIO_R}
            r={RATIO_R}
            fill={on ? '#FF9735' : 'none'}
            stroke={on ? 'none' : '#e4e4e4'}
            strokeWidth={on ? undefined : 1}
            vectorEffect={on ? undefined : 'non-scaling-stroke'}
          />
        );
      })}
    </svg>
  );
}

function StatCard({
  approx,
  value,
  suffix,
  filled,
  caption,
  label,
  ratio,
}: {
  approx?: boolean;
  value?: number;
  suffix?: string;
  filled?: number;
  caption: string;
  label?: string;
  ratio?: [number, number];
}) {
  const [ref, shown] = useRevealed<HTMLDivElement>();

  return (
    <div className="grumble-stat-card" ref={ref} data-in={shown ? '' : undefined}>
      <div className="grumble-stat-card__copy">
        <div className="grumble-stat-card__number">
          {label ? (
            label
          ) : (
            <>
              {approx ? <span aria-hidden="true">{'~'}</span> : null}
              <CountUp value={value ?? 0} decimals={0} suffix={suffix ?? ''} duration={1} />
            </>
          )}
        </div>
        <p className="grumble-stat-card__caption">{caption}</p>
      </div>
      {ratio ? <RatioGlyph filled={ratio[0]} total={ratio[1]} /> : null}
      {filled == null ? null : <Pictogram filled={filled} />}
    </div>
  );
}

export default function GrumbleStats() {
  return (
    <div className="grumble-stats">
      <div className="grumble-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
        <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
          {'What We Found'}
        </h5>
      </div>
      <div className="ssr-variant">
        <div className="grumble-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
          <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
            {'Skipping meals is common, and the body reacts before anyone notices.'}
          </h1>
        </div>
      </div>

      <div className="grumble-stats__grid">
        <StatCard
          value={55}
          suffix="%"
          filled={5.5}
          caption="of US workers has skipped lunch entirely during a busy day."
        />
        <StatCard
          label="1 in 2"
          ratio={[1, 2]}
          caption="people can't reliably sense their own body's hunger cues."
        />
        <StatCard
          label="1 in 4"
          ratio={[1, 4]}
          caption="Gen Z ate every meal completely alone yesterday."
        />
      </div>
    </div>
  );
}
