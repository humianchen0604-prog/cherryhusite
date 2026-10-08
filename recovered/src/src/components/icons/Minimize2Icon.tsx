'use client';

import type { Transition } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface Minimize2IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface Minimize2IconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 25,
};

/**
 * The mirror of {@link Maximize2Icon}: the two arrowheads point inward instead
 * of out, and the hover animation nudges them toward the centre (the opposite
 * of maximize's outward nudge). Same spring, same controlled/uncontrolled API.
 */
const Minimize2Icon = forwardRef<Minimize2IconHandle, Minimize2IconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start('animate');
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('normal');
        }
      },
      [controls, onMouseLeave]
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
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bottom-left arrowhead (vertex at 10.25,13.75); nudges inward. */}
          <motion.path
            animate={controls}
            d="M10.25 20.25V13.75M10.25 13.75H3.75M10.25 13.75L3.75 20.25"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '0.8px', translateY: '-0.8px' },
            }}
          />
          {/* Top-right arrowhead (vertex at 13.75,10.25); nudges inward. */}
          <motion.path
            animate={controls}
            d="M13.75 3.75V10.25M13.75 10.25H20.25M13.75 10.25L20.25 3.75"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '-0.8px', translateY: '0.8px' },
            }}
          />
        </svg>
      </div>
    );
  }
);

Minimize2Icon.displayName = 'Minimize2Icon';

export { Minimize2Icon };
