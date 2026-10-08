import type { ReactNode } from 'react';
import WhoLine from '@/components/WhoLine';
import HeroCloud from '@/components/HeroCloud';

/** `decoration` replaces the hero cloud (the /explorations page swaps it). */
export default function Intro({ decoration }: { decoration?: ReactNode }) {
  return (
    <div className="framer-a9nbwi" data-framer-name="Intro">
      <WhoLine />
      {/* Decorative: a layered cloud to the right of the copy, and a smaller
          one near the top, half past the right edge of the screen. */}
      {decoration ?? (
        <>
          <HeroCloud />
          <HeroCloud variant="edge" />
        </>
      )}
    </div>
  );
}
