import type { Metadata } from 'next';
import '../casestudy.css';
import './grumble.css';
import '../casestudy-dark.css';
import GrumbleBody from '@/components/casestudy/GrumbleBody';
import ScrollReveal from '@/components/casestudy/ScrollReveal';

export const metadata: Metadata = {
  title: 'Grumble — Know your hunger before your body has to scream for it',
  description:
    'A speculative hunger-sensing tool designed in 4 days for FigBuild 2026, making an invisible body signal visible, social, and actionable.',
};

export default function GrumblePage() {
  return (
    <div className="casestudy-root" id="main">
      <ScrollReveal />
      <GrumbleBody />
    </div>
  );
}
