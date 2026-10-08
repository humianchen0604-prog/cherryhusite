'use client';

import { useEffect } from 'react';
import HeroCloud from '@/components/HeroCloud';
import HeroFlowers from './HeroFlowers';
import HeroShapes from './HeroShapes';
import HeroSparkleDots from './HeroSparkleDots';
import HeroTulip from './HeroTulip';
import SunsetClouds from './SunsetClouds';
import { sunsetStyleOf, useExploration } from './explorations';
import './explorations.css';

/**
 * The decoration beside the intro copy for the picked version. Mounted inside
 * the intro block (.framer-a9nbwi), where the live HeroCloud sits. Remounting
 * on each switch replays that version's landing animation.
 */
export function ExplorationDecoration() {
  const picked = useExploration();
  switch (picked) {
    case 'current':
      return (
        <>
          <HeroCloud />
          <HeroCloud variant="edge" />
        </>
      );
    case 'tulip':
      return <HeroTulip key={picked} />;
    case 'sparkle':
      return <HeroSparkleDots key={picked} />;
    case 'flowers':
      return <HeroFlowers key={picked} />;
    case 'shapes':
      return <HeroShapes key={picked} />;
    default:
      return null;
  }
}

/**
 * The page-wide sky for the picked version. Only "Current" keeps the live
 * blue gradient (SkyGradient, in the layout); the sunset versions draw their
 * own band, and the hero decorations were explored on the plain white page.
 * <html data-exploration> tells the CSS which one is showing.
 */
export function ExplorationSky() {
  const picked = useExploration();
  const sunset = sunsetStyleOf(picked);

  useEffect(() => {
    document.documentElement.dataset.exploration = picked;
  }, [picked]);
  useEffect(() => () => void delete document.documentElement.dataset.exploration, []);

  return sunset ? <SunsetClouds style={sunset} /> : null;
}
