'use client';

import type { Variants } from 'motion/react';
import { motion, useAnimation, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';
import { STICKER_GLYPH } from '@/components/icons/sticker';

export interface FocusIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FocusIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const PULSE: Variants = {
  normal: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 0.72, 1],
    opacity: [1, 0.45, 1],
    transition: {
      duration: 1.4,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'mirror',
      ease: 'easeInOut',
    },
  },
};

const FocusIcon = forwardRef<FocusIconHandle, FocusIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => {
          if (!reduced) controls.start('animate');
        },
        stopAnimation: () => controls.start('normal'),
      };
    }, [controls, reduced]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (!reduced) {
          controls.start('animate');
        }
      },
      [controls, onMouseEnter, reduced],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('normal');
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
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
          <rect fill="#EEEEEE" height="21" rx="4.2" ry="4.2" width="21" x="1.5" y="1.5" />
          <g
            fill="none"
            stroke={STICKER_GLYPH}
            strokeWidth={1.5 / 0.85}
            transform="translate(12 12) scale(0.85) translate(-12 -12)"
          >
            <motion.circle animate={controls} cx="12" cy="12" r="3" variants={PULSE} />
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          </g>
        </svg>
      </div>
    );
  },
);

FocusIcon.displayName = 'FocusIcon';

export { FocusIcon };
