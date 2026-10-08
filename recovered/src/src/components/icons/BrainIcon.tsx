'use client';

import type { HTMLAttributes } from 'react';
import { forwardRef, useId, useImperativeHandle } from 'react';

import { cn } from '@/lib/utils';
import { STICKER_GLYPH, StickerPlate } from '@/components/icons/sticker';

export interface BrainIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BrainIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

/** Closed silhouette so the sticker plate fills the lobes, not just the strokes. */
const BRAIN_FILL =
  'M12 5A3 3 0 1 1 17.6 6.5A4 4 0 0 1 20.52 10.9A4 4 0 0 1 20 16A4 4 0 1 1 12 18.15A4 4 0 1 1 4 16A4 4 0 0 1 3.48 10.9A4 4 0 0 1 6.4 6.5A3 3 0 1 1 12 5Z';

const BrainGlyph = () => (
  <>
    <path d="M12 18V5" />
    <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
    <path d="M12 5A3 3 0 1 1 17.598 6.5" />
    <path d="M12 5A3 3 0 1 0 6.402 6.5" />
    <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
    <path d="M18 18a4 4 0 0 0 2-7.464" />
    <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
    <path d="M6 18a4 4 0 0 1-2-7.464" />
    <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
  </>
);

const BrainIcon = forwardRef<BrainIconHandle, BrainIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const uid = useId().replace(/:/g, '');
    const clipId = `brain-clip-${uid}`;
    const blurId = `brain-blur-${uid}`;
    const maskId = `brain-mask-${uid}`;

    useImperativeHandle(
      ref,
      () => ({
        startAnimation: () => {},
        stopAnimation: () => {},
      }),
      [],
    );

    return (
      <div className={cn(className)} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...props}>
        <svg
          fill="none"
          height={size}
          overflow="visible"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={BRAIN_FILL} />
            </clipPath>
            <filter id={blurId} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36">
              <rect fill="black" height="36" width="36" x="-6" y="-6" />
              <circle
                className="grumble-brain-flare"
                cx="12"
                cy="12"
                fill="white"
                filter={`url(#${blurId})`}
                r="6.5"
              />
            </mask>
          </defs>
          <StickerPlate fill="#EEEEEE">
            <path d={BRAIN_FILL} />
          </StickerPlate>
          <g fill="none" stroke={STICKER_GLYPH} strokeWidth={1.5}>
            <BrainGlyph />
          </g>
          <g
            clipPath={`url(#${clipId})`}
            fill="none"
            mask={`url(#${maskId})`}
            stroke="rgb(255 255 255 / 0.92)"
            strokeWidth={1.5}
          >
            <BrainGlyph />
          </g>
          <g clipPath={`url(#${clipId})`}>
            <circle
              className="grumble-brain-flare"
              cx="12"
              cy="12"
              fill="rgb(190 190 190 / 0.35)"
              filter={`url(#${blurId})`}
              r="6.5"
            />
          </g>
        </svg>
      </div>
    );
  },
);

BrainIcon.displayName = 'BrainIcon';

export { BrainIcon };
