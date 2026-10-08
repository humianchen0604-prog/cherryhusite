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
import CaseStudyModal from '@/components/CaseStudyModal';

export default function Page() {
  return (
    <ClickSpark
      sparkColor="#fff"
      sparkSize={10}
      sparkRadius={24}
      sparkCount={8}
      duration={400}
    >
      <div
        data-framer-root=""
        className="framer-TE0xJ framer-kG5kC framer-x1IHd framer-iogvpj"
        style={{ minHeight: '100vh', width: 'auto' }}
      >
        <Logo />
        <SideNav />
        <div className="framer-mxkekt" data-framer-name="Body">
          <Intro />
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
      <CaseStudyModal />
    </ClickSpark>
  );
}
