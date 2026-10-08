import type { Metadata } from 'next';
import SvgTemplates from '@/components/SvgTemplates';
import ClickSpark from '@/components/ClickSpark';
import SideNav from '@/components/SideNav';
import Logo from '@/components/sections/Logo';
import Intro from '@/components/sections/Intro';
import Projects from '@/components/sections/Projects';
import VibeCoding from '@/components/sections/VibeCoding';
import About from '@/components/sections/About';
import BottomLinks from '@/components/BottomLinks';
import SiteFooter from '@/components/SiteFooter';
import ProfileLanyard from '@/components/ProfileLanyard';
import VideoAutoplay from '@/components/VideoAutoplay';
import RevealEffects from '@/components/RevealEffects';
import HomeScrollReveal from '@/components/HomeScrollReveal';
import PastExperiences from '@/components/PastExperiences';
import ExplorationSwitch from '@/components/explorations/ExplorationSwitch';
import { ExplorationDecoration, ExplorationSky } from '@/components/explorations/ExplorationHero';

export const metadata: Metadata = {
  title: 'Explorations — Cherry Hu',
  robots: { index: false, follow: false },
};

/**
 * The landing page with every hero version explored so far, one at a time,
 * picked from the side nav: the live one, the three sunset skies, and the
 * four hero decorations. Same page as `/` otherwise (keep the two in step).
 */
export default function ExplorationsPage() {
  return (
    <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={24} sparkCount={8} duration={400}>
      <ExplorationSky />
      <div
        data-framer-root=""
        className="framer-TE0xJ framer-kG5kC framer-x1IHd framer-iogvpj"
        style={{ minHeight: '100vh', width: 'auto' }}
      >
        <Logo />
        <SideNav footer={<ExplorationSwitch />} />
        <div className="framer-mxkekt" data-framer-name="Body">
          <Intro decoration={<ExplorationDecoration />} />
          <Projects />
          <VibeCoding />
          <About />
        </div>
        <SiteFooter />
        <ProfileLanyard />
        <BottomLinks />
      </div>
      <HomeScrollReveal />
      <RevealEffects />
      <VideoAutoplay />
      <PastExperiences />
      <SvgTemplates />
    </ClickSpark>
  );
}
