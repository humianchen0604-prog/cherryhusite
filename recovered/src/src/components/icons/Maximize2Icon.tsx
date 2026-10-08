'use client';

import type { Transition } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface Maximize2IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface Maximize2IconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 25,
};

const Maximize2Icon = forwardRef<Maximize2IconHandle, Maximize2IconProps>(
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
          {/* Bottom-left arrowhead + its diagonal; nudges outward on hover. */}
          <motion.path
            animate={controls}
            d="M3.75 13.75V20.25H10.25M10.25 13.75L4.52344 19.4766"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '-0.8px', translateY: '0.8px' },
            }}
          />
          {/* Top-right arrowhead + its diagonal; nudges outward on hover. */}
          <motion.path
            animate={controls}
            d="M13.75 3.75H20.25V10.25M19.4766 4.52344L13.75 10.25"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { translateX: '0%', translateY: '0%' },
              animate: { translateX: '0.8px', translateY: '-0.8px' },
            }}
          />
        </svg>
      </div>
    );
  }
);

Maximize2Icon.displayName = 'Maximize2Icon';

export { Maximize2Icon };
