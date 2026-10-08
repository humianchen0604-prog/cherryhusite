'use client';

import type { HTMLAttributes } from 'react';
import { forwardRef, useImperativeHandle } from 'react';

import { cn } from '@/lib/utils';
import { STICKER_GLYPH, StickerPlate } from '@/components/icons/sticker';

export interface BatteryLowIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BatteryLowIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const BATTERY_FILL = '#EEEEEE';

const BatteryLowIcon = forwardRef<BatteryLowIconHandle, BatteryLowIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    useImperativeHandle(ref, () => ({
      startAnimation: () => {},
      stopAnimation: () => {},
    }), []);

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
          <StickerPlate fill={BATTERY_FILL}>
            <rect height="10" rx="2" ry="2" width="16" x="2" y="7" />
            <line x1="22" x2="22" y1="11" y2="13" />
          </StickerPlate>
          <g fill={BATTERY_FILL} stroke={STICKER_GLYPH} strokeWidth={1.5}>
            <rect height="10" rx="2" ry="2" width="16" x="2" y="7" />
            <line x1="22" x2="22" y1="11" y2="13" />
          </g>
          <rect
            className="grumble-battery-charge"
            fill={STICKER_GLYPH}
            height="5"
            rx="1"
            width="10"
            x="5"
            y="9.5"
          />
        </svg>
      </div>
    );
  },
);

BatteryLowIcon.displayName = 'BatteryLowIcon';

export { BatteryLowIcon };
