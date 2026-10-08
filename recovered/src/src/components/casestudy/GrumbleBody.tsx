import VideoAutoplay from '@/components/VideoAutoplay';
import SideNav, { CASE_STUDY_ITEMS } from '@/components/SideNav';
import CaseStudyThemeToggle from '@/components/casestudy/CaseStudyThemeToggle';
import { ProjectCard } from '@/components/ProjectGrid';
// PROJECTS comes from the plain data module, not ProjectGrid.tsx (a Client
// Component) — this file is a Server Component and filters the array at
// render time, which a client-module import cannot do (see projects-data.ts).
import { PROJECTS } from '@/components/projects-data';
import SiteFooter from '@/components/SiteFooter';
import GrumbleLinks from '@/components/casestudy/GrumbleLinks';
import GrumbleReel from '@/components/casestudy/GrumbleReel';
import GrumbleEmojiScatter from '@/components/casestudy/GrumbleEmojiScatter';
import GrumbleSymptoms from '@/components/casestudy/GrumbleSymptoms';
import GrumbleStats from '@/components/casestudy/GrumbleStats';
import { RadioIcon } from '@/components/icons/RadioIcon';

/**
 * Grumble — FigBuild 2026, ported from https://www.cherryhu.com/grumble into the
 * Lemon8 "Notes Tab Optimization" shell.
 *
 * Every shared decision comes from that page rather than from Framer: the
 * .framer-172orq5 page padding and its 140px section rhythm, the section
 * wrappers and their gaps, the h5 eyebrow / h1 title / body-copy presets, the
 * media bands, the takeaway row, the side nav, the back pill and the footer.
 * Grumble-only patterns (the paired figures, the metric row, the link pills,
 * and the embed) live in ./grumble.css.
 *
 * Content is the live page's, in its own order, complete — including the
 * placeholder body copy under solutions 01–03, which reads as Lemon8 text on
 * the live site and is carried over verbatim rather than invented here.
 */

const DEVPOST_URL = 'https://devpost.com/software/grumble-426z5a';
const FIGMA_DECK_KEY = 'Oa3ftWcb2YyZRwhDwSB4v1';

/** Section eyebrow — the 12px uppercase label above a title. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grumble-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
      <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
        {children}
      </h5>
    </div>
  );
}

/** Section title — the 20px heading preset the case study uses throughout. */
function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="ssr-variant">
      <div className="grumble-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
        <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
          {children}
        </h1>
      </div>
    </div>
  );
}

/** Body copy — the 14px paragraph preset, capped at the shared measure. */
function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
      <p className={['framer-text', 'framer-styles-preset-ybrah6', className].filter(Boolean).join(' ')} data-styles-preset="ix87J7P54" dir="auto">
        {children}
      </p>
    </div>
  );
}

/** The hairline rule the case study drops between sections. */

/** A project-spec column in the hero (Role, Timeline, Team, Skills). */
function Spec({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="framer-1tnk8q6" data-framer-name={label}>
      <div className="framer-zay5w8" data-framer-name={label} data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', opacity: '0.4', transform: 'none' } as React.CSSProperties}>
        <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
          {label}
        </h5>
      </div>
      <div className="framer-qfuc9h" style={{ opacity: '1' } as React.CSSProperties}>
        {values.map((value) => (
          <div key={value} className="framer-1wu4kjx" data-framer-name={value} data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', opacity: '1', transform: 'none' } as React.CSSProperties}>
            <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{ '--framer-text-color': 'rgba(0, 0, 0, 0.8)', '--framer-font-size': '14px' } as React.CSSProperties}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One "Long Story Short" card: a number, a claim, and the work behind it. */
function TldrCard({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grumble-tldr-card">
      <span className="grumble-tldr-card__num">{num}</span>
      <h4 className="grumble-tldr-card__title">{title}</h4>
      <p className="grumble-tldr-card__body">{children}</p>
    </div>
  );
}

/** Full-width figure inside a section. */
function Figure({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <div className="grumble-figure">
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
    </div>
  );
}

/** Full-width video stage, started on scroll by VideoAutoplay. */
function VideoStage({ src, ratio, label }: { src: string; ratio: string; label: string }) {
  return (
    <div className="grumble-figure">
      <video
        src={src}
        loop={true}
        preload="none"
        muted={true}
        playsInline={true}
        aria-label={label}
        style={{ cursor: 'auto', width: '100%', height: 'auto', display: 'block', objectFit: 'cover', backgroundColor: 'rgba(0, 0, 0, 0)', aspectRatio: ratio } as React.CSSProperties}
      />
    </div>
  );
}

/** One takeaway column: icon, claim, then the reflection under it. */
function Takeaway({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="framer-107fbv6" data-framer-name="Frame 2055246582">
      {icon}
      <div className="framer-agm7ow" data-framer-name="Frame 2055246622">
        <div className="framer-1k6k2mx" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
          <h4 className="insight-title">{title}</h4>
        </div>
      </div>
      <div className="framer-r3wi34" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
        <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
          {children}
        </p>
      </div>
    </div>
  );
}

export default function GrumbleBody() {
  return (
    <>
      <VideoAutoplay />
      <div data-framer-root="" className="framer-pR67w framer-kG5kC framer-GrUdX framer-QWUbN framer-IZNiQ framer-2Peb6 framer-psrovs" style={{ minHeight: '100vh', width: 'auto' } as React.CSSProperties}>
        <div className="framer-1i2nfrz" data-framer-name="Body">
          <div className="framer-8a7cyu">
            <div className="framer-172orq5" data-framer-name="Body">

              {/* ---------------------------------------------------------- Hero */}
              <div className="framer-pmwlax">
                <div className="ssr-variant">
                  <div className="framer-1e9wpwg-container">
                    <div className="framer-q2Q3G framer-GrUdX framer-QWUbN framer-IZNiQ framer-kG5kC framer-v7emq4 framer-v-1i8q7h3" data-framer-name="1600" style={{ width: '100%' } as React.CSSProperties}>
                      <div className="framer-1khp1tx" data-framer-name="Title & Subtitle" id="hero-lockup">
                        <div className="hero-brand">
                          <p className="hero-kicker framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" id="grumble-hero-mark">
                            <span className="hero-kicker__lead">{'Hackathon · '}</span>
                            <span className="hero-kicker__date">{'FigBuild 2026'}</span>
                          </p>
                        </div>
                        <div className="framer-1usj49e" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', transform: 'none' } as React.CSSProperties}>
                          <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-weight': '400', '--framer-font-size': '24px' } as React.CSSProperties}>
                            {'Grumble: Hunger, sensed early and shared instantly'}
                          </h1>
                        </div>
                        <div className="framer-oieuo1" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', transform: 'none' } as React.CSSProperties}>
                          <p dir="auto" className="framer-text" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-family': '"Switzer", "Switzer Placeholder", sans-serif', '--framer-line-height': '143%', '--framer-font-size': '14px', '--framer-text-color': 'rgba(0, 0, 0, 0.8)' } as React.CSSProperties}>
                            {'Making hunger visible for friends through playful, emotionally-resonant design and real-time glucose sensing.'}
                          </p>
                        </div>
                      </div>
                      <div className="framer-1xern0j-container grumble-hero-stage">
                        <GrumbleEmojiScatter />
                        <img
                          src="/assets/grumble/hero-app-preview.png"
                          alt="Four Grumble screens: a hunger map, friends nearby, a sushi invite, and a personal hunger profile."
                          width={2400}
                          height={1068}
                          className="grumble-hero-stage__img"
                          style={{ width: '85%', height: 'auto', display: 'block', objectFit: 'contain', pointerEvents: 'none' } as React.CSSProperties}
                        />
                      </div>
                      <div className="framer-27g1vn" data-framer-name="Project Specs">
                        <Spec label="Role" values={['Lead visual designer']} />
                        <Spec label="Timeline" values={['Mar 6–9, 2026']} />
                        <Spec label="Team" values={['Catherine Jia', 'Sabrina Chen', 'Shuang Liang']} />
                        <Spec label="Tools" values={['Figma', 'Figma Make', 'React']} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ Overview */}
              <div className="framer-1x0zakg" data-framer-name="Overview" id="overview">
                <div className="framer-6dezqx">
                  <div className="framer-3eslqg">
                    <div className="grumble-intro-grid">
                      <div className="grumble-intro-col">
                        <Eyebrow>{'Overview'}</Eyebrow>
                        <Title>{'What is Grumble?'}</Title>
                        <Body className="grumble-intro-lead">
                          {'Grumble is a speculative hunger-sensing app that '}
                          <span className="grumble-highlight">{'makes an invisible body signal visible'}</span>
                          {' — reading blood-glucose-derived hunger cues in real time and turning them into a shared, social signal you can act on with the people around you.'}
                        </Body>
                        <Body className="grumble-context">
                          <span className="grumble-figbuild">
                            <img src="/who-line/assets/figma-logo.png" alt="" width="11" height="11" />
                            {'FigBuild 2026'}
                          </span>
                          {' asked teams to design a conceptual tool that tracks and influences something intangible about the '}
                          <strong className="grumble-emphasis">{'human sensory experience'}</strong>
                          {', in support of wellness or behavioral change.'}
                        </Body>
                        <GrumbleLinks devpostUrl={DEVPOST_URL} />
                      </div>
                    </div>

                    <GrumbleReel />

                    {/* ---------------------------------------- My Participation */}
                    <div className="grumble-tldr" id="long-story-short">
                      <Eyebrow>{'My Participation'}</Eyebrow>
                      <Title>
                        {"I led the vision of Grumble's brand design and interaction behaviours, iterating from low-fi wireframes to rendered prototype in code."}
                      </Title>
                      <Body>
                        {"As lead designer, I guided three other designers to shape Grumble's visual language, design system, and motion — including a micro-interaction showreel in Jitter. Several of my accomplishments included:"}
                      </Body>
                      <div className="grumble-tldr__grid">
                        <TldrCard num="01" title="Visual Language">
                          {'Designed the core screens, from home to detail views, and the step-by-step flow for interacting with friends.'}
                        </TldrCard>
                        <TldrCard num="02" title="Motion Principles">
                          {'Established the tone of motion, then crafted playful interactions across hunger states and page flows.'}
                        </TldrCard>
                        <TldrCard num="03" title="Rapid Collaboration">
                          {'Partnered with three fellow designers, tracking to-dos on a day-by-day calendar to keep the team aligned and ship before deadline.'}
                        </TldrCard>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------- Problem */}
              <div className="framer-15t1wvj" data-framer-name="Problem" id="problem">
                <div className="framer-xnrdk3" data-framer-name="Section 1" id="problem-2">
                  <div className="framer-786ynq" data-framer-name="Title">
                    <div className="framer-1a4t7ip" data-framer-name="Frame 2055246596">
                      <div className="framer-1ucdwph" data-framer-name="Overview">
                        <Eyebrow>{'Origin of Concept'}</Eyebrow>
                        <div className="framer-18fmlck grumble-origin" data-framer-name="Frame 2055246585">
                          <Title>
                            {'It started with a common behaviour on our team: when juggling school projects and internship work, '}
                            <span className="grumble-highlight">{'meals kept getting skipped'}</span>
                            {'.'}
                          </Title>
                          <Body>
                            {'By the time hunger caught up, it was already too late. We were experiencing symptoms of:'}
                          </Body>
                          <GrumbleSymptoms />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="framer-cx1uo5" data-framer-name="Section 1" id="problem-1">
                  <GrumbleStats />
                  <div className="framer-9bne5l" data-framer-name="Title">
                    <div className="framer-1orqqu7" data-framer-name="Frame 2055246596">
                      <div className="framer-hu56uv" data-framer-name="Overview">
                        <Eyebrow>{'The Problem'}</Eyebrow>
                        <div className="framer-m6t011" data-framer-name="Frame 2055246585">
                          <Title>
                            {'Hunger is a signal'}
                            <RadioIcon className="grumble-title-radio" size={20} aria-hidden />
                            {"we've never learned to read."}
                          </Title>
                        </div>
                        <Body>
                          {"Glucose dips, hormone shifts, and ghrelin all move minutes before hunger hits — and none of it gets tracked until it's already too late."}
                        </Body>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------- Ideation */}
              <div className="framer-n9na3f" data-framer-name="Ideation">
                <div className="framer-1glwd7l" data-framer-name="Overview">
                  <div className="framer-1warq6h">
                    <div className="framer-eahql">
                      <Eyebrow>{'Ideation'}</Eyebrow>
                      <Title>
                        <span className="grumble-hmw">
                          {'How might we remind '}
                          <span className="grumble-hmw-emoji">🔔</span>
                          {" people to eat according to their body's hunger signals, making it easier to notice, understand, and act on."}
                        </span>
                      </Title>
                    </div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------- Solution 01 */}
              <div className="framer-evphwi" data-framer-name="Solution 01" id="solution">
                <div className="framer-1muivw2">
                  <Eyebrow>{'Key Solutions'}</Eyebrow>
                  <Title>{'01 A friend noticed first'}</Title>
                  <Body>{'When glucose dips 60–90 minutes before hunger hits, Grumble catches that window and nudges both you and friends.'}</Body>
                </div>
                <VideoStage src="/assets/grumble/media/solution-01.mp4" ratio="3840 / 2160" label="A friend is alerted that you are hungry" />
              </div>

              {/* --------------------------------------------------- Solution 02 */}
              <div className="framer-1dcww5q" data-framer-name="Solution 02">
                <div className="framer-7sco64" data-framer-name="Overview">
                  <Title>{"02 Specify what you're craving for as input"}</Title>
                  <Body>{'Hunger status lives on your profile as a ring — a glance, not a report.'}</Body>
                </div>
                <VideoStage src="/assets/grumble/media/solution-02.mp4" ratio="3840 / 2160" label="Hunger status on a user's profile ring" />
                <Figure
                  src="/assets/grumble/solution-02-phones.png"
                  alt="Grumble screens showing hunger rings on nearby profiles."
                  width={2400}
                  height={1170}
                />
              </div>

              {/* --------------------------------------------------- Solution 03 */}
              <div className="framer-3b99r3" data-framer-name="Solution 03">
                <div className="framer-1sfsxge" data-framer-name="Overview">
                  <Title>{'03 Find friends nearby to match the food'}</Title>
                  <Body>{"Half of people can't read their own hunger. Grumble shows who nearby can — and turns it into a reason to eat together."}</Body>
                </div>
                <VideoStage src="/assets/grumble/media/solution-03.mp4" ratio="3032 / 1842" label="Matching with a nearby friend over the same craving" />
                <Figure
                  src="/assets/grumble/solution-03-phones.png"
                  alt="Grumble screens: invite a friend for sushi, a pending sushi run, and grabbing food together."
                  width={2400}
                  height={1170}
                />
              </div>

              {/* --------------------------------------------------- Solution 04 */}
              <div className="framer-n2waui" data-framer-name="Solution 04">
                <div className="framer-1muivw2">
                  <Title>{'04 Understand hunger patterns to build better habits'}</Title>
                  <Body>{'Your hunger profile shows patterns across days and weeks — so you can catch the next crash before it happens.'}</Body>
                </div>
                <VideoStage src="/assets/grumble/media/solution-05a.mp4" ratio="3032 / 1842" label="Daily hunger profile animating into view" />
                <VideoStage src="/assets/grumble/media/solution-05b.mp4" ratio="3032 / 1842" label="Weekly hunger patterns across seven days" />
              </div>

              {/* ------------------------------------------------------ Research */}
              <div className="framer-n9na3f" data-framer-name="Research" id="research">
                <div className="framer-1glwd7l" data-framer-name="Overview">
                  <div className="framer-1warq6h">
                    <div className="framer-eahql">
                      <Eyebrow>{'Research'}</Eyebrow>
                      <Title>{'How a body signal becomes a number you can act on'}</Title>
                      <Body>{"Apple Watch, Oura, and Fitbit can't sense glucose or hormones on their own yet — the signals hunger runs on. By 2030–2035, that's expected to change, syncing straight into Grumble."}</Body>
                      <Body>{'We imagined a future for how that information could be synced:'}</Body>
                    </div>
                    <Figure
                      src="/assets/grumble/behind-the-signal-steps.png"
                      alt="Three steps: measure glucose with a CGM wearable, translate it into a 0–100 index, and visualize it as a color ring."
                      width={2400}
                      height={1210}
                    />

                    <div className="framer-eahql">
                      <Title>{'Catch hunger before the crash — and turn it into a meal with someone nearby.'}</Title>
                    </div>
                    <Figure
                      src="/assets/grumble/what-we-want-cards.png"
                      alt="Four goals: know your hunger rhythm, make better eating decisions, make hunger a shared moment, and find your people, find your meal."
                      width={2400}
                      height={1210}
                    />

                    <div className="framer-eahql">
                      <Eyebrow>{'Exploring Visual Details'}</Eyebrow>
                      <Title>{'Visualizing Appetite: A Color-Coded Semantic System'}</Title>
                    </div>
                    <Figure
                      src="/assets/grumble/color-system.png"
                      alt="Hunger index color scale from 0% satiated through the neutral zone to 100% critical hangry."
                      width={2400}
                      height={1210}
                    />
                    <Body>{'My teammate and I analyzed brand visual guidelines and mood boards to bridge the gap between LA’s "cinematic energy" and the Metro’s "rigid" reality.'}</Body>

                    <div className="framer-eahql">
                      <Title>{'Visualizing hunger data through clock metaphor'}</Title>
                    </div>
                    <div className="grumble-pair">
                      <div className="grumble-pair__col">
                        <div className="grumble-figure">
                          <img src="/assets/grumble/Data1.png" alt="Daily view: a 24-hour circular dial with a radial hunger heatmap." width={3150} height={3150} loading="lazy" decoding="async" />
                        </div>
                        <div className="grumble-pair__copy">
                          <h4 className="insight-title">{'Daily view: Identify the exact moment of hunger to plan meals.'}</h4>
                          <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                            {'Utilizing a 24-hour circular dial to mirror the natural circadian rhythm. The radial heatmap provides an intuitive "clock-look" that maps body signals to specific times of day'}
                          </p>
                        </div>
                      </div>
                      <div className="grumble-pair__col">
                        <div className="grumble-figure">
                          <img src="/assets/grumble/Data2.png" alt="Weekly view: the circular clock unfolded into vertical time-strips for seven days." width={3150} height={3150} loading="lazy" decoding="async" />
                        </div>
                        <div className="grumble-pair__copy">
                          <h4 className="insight-title">{'Weekly view: Compare fluctuations and identify anomalies across the week'}</h4>
                          <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                            {'Unfolding the circular clock into vertical time-strips. This linear alignment allows for side-by-side comparison, making it easy to spot if hunger peaks shifted'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="framer-eahql">
                      <Eyebrow>{'How I present the work'}</Eyebrow>
                      <Title>{'Check out our slide presention'}</Title>
                      {/* Own wrapper rather than two <Body> siblings directly in
                          .framer-eahql: that flex parent's own 16px gap governs
                          Eyebrow/Title/Body spacing, and reusing it here would
                          give this line the same 16px instead of the 12px asked
                          for between it and the paragraph above. */}
                      <div className="grumble-deck-note">
                        <Body>{'In less than 3 hours, I crafted this presentation of its visuals, layouts, and refined on the details.'}</Body>
                        <Body>{'It takes a few seconds for the presentation to load...'}</Body>
                      </div>
                    </div>
                    <div className="grumble-embed grumble-embed--deck">
                      <iframe
                        src={`https://embed.figma.com/deck/${FIGMA_DECK_KEY}?embed-host=cherryhu&footer=true`}
                        title="Grumble presentation on Figma"
                        loading="lazy"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- Next Steps */}
              <div className="framer-dl8rqd" data-framer-name="Frame 2055246607" id="nextsteps">
                <div className="framer-a0h1dk" data-framer-name="Overview">
                  <Eyebrow>{'My Takeaways'}</Eyebrow>
                  <div className="framer-1vex2lg" data-framer-name="Frame 2055246585">
                    <Title>{'What I took away from this metric driven project'}</Title>
                  </div>
                </div>
                {/* Two-up. Each column's flex-grow is its image's aspect
                    ratio, which makes the columns' widths proportional to
                    their aspect ratios — and therefore renders both images at
                    exactly the same height without cropping either. */}
                <div className="grumble-photo-row">
                  <div className="grumble-figure" style={{ '--ar': 2000 / 1333 } as React.CSSProperties}>
                    <img
                      src="/assets/grumble/grumble-together.jpg"
                      alt="The four of us after the FigBuild deadline — thumbs up, a peace sign, and heart hands."
                      width={2000}
                      height={1333}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="grumble-figure" style={{ '--ar': 959 / 1200 } as React.CSSProperties}>
                    <img
                      src="/assets/grumble/figbuild-badge.png"
                      alt="My FigBuild 2026 participant badge — a lanyard reading CHERRY, designer, first year."
                      width={959}
                      height={1200}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="framer-1rc6mne">
                  <div className="framer-z42bak">
                    <Takeaway
                      title="Think beyond conventional patterns and explore creative interactions"
                      icon={
                        <svg className="takeaway-icon takeaway-icon--blue" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18 16L18.8 18.2L21 19L18.8 19.8L18 22L17.2 19.8L15 19L17.2 18.2L18 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'I learned to push past expected solutions and consider more imaginative interaction patterns that solve problems in an intuitive way.'}
                    </Takeaway>
                    <Takeaway
                      title="Balance vision with execution by leaving enough time to build"
                      icon={
                        <svg className="takeaway-icon takeaway-icon--green" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'I learned that strong ideas need enough time for both vibe coding and mocking, so the concept can actually come to life instead of staying at the idea stage.'}
                    </Takeaway>
                    <Takeaway
                      title="Storytelling and time management are just as important as the final design"
                      icon={
                        <svg className="takeaway-icon takeaway-icon--amber" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M21 12C21 16.4183 16.9706 20 12 20C10.7 20 9.47 19.76 8.36 19.32L3 21L4.8 16.4C3.67 15.13 3 13.63 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'A compelling project is not only about what you build, but also how clearly you tell the story behind it and how well you manage your time to bring the idea together.'}
                    </Takeaway>
                  </div>
                </div>

                <div className="next-on">
                  <Eyebrow>{'Next On'}</Eyebrow>
                  <div className="next-on__grid">
                    {PROJECTS.filter((p) => p.href === '/notestaboptimization' || p.brand === 'Loom').map((project) => (
                      <ProjectCard key={project.title} project={project} />
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <SiteFooter />
        <a className="framer-1sfw5kb framer-rdyw4y" href="/#projects" aria-label="Back to projects">
          <div className="ssr-variant">
            <div className="framer-fd1twv-container" style={{ willChange: 'transform', opacity: '1', transform: 'none' } as React.CSSProperties}>
              <div className="framer-YerRY framer-4z4bep framer-v-4z4bep" data-framer-name="Variant 1" style={{ width: '100%', borderBottomLeftRadius: '100px', borderBottomRightRadius: '100px', borderTopLeftRadius: '100px', borderTopRightRadius: '100px' } as React.CSSProperties}>
                <div className="framer-1um1tvy" data-framer-name="back-icon">
                  <div className="framer-129qaqh" data-framer-name="Component 1">
                    <div data-framer-component-type="SVG" data-framer-name="svg-844649026_806" className="framer-wxuqll" aria-hidden="true" style={{ imageRendering: 'pixelated', flexShrink: '0', backgroundSize: '100% 100%', backgroundImage: "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%220 0 9 7%22><g><path d=%22M 0 7 L 0 0 L 9 0 L 9 7 Z%22 fill=%22transparent%22></path><path d=%22M 0.804 2.706 L 0.468 3.042 L 0.133 2.706 L 0.468 2.372 Z M 8.866 6.502 C 8.876 6.676 8.787 6.842 8.637 6.932 C 8.486 7.022 8.299 7.022 8.149 6.932 C 7.998 6.842 7.91 6.676 7.919 6.502 Z M 2.838 5.413 L 0.468 3.042 L 1.139 2.371 L 3.51 4.742 Z M 0.468 2.372 L 2.838 0 L 3.51 0.671 L 1.137 3.041 L 0.467 2.369 Z M 0.804 2.232 L 5.546 2.232 L 5.546 3.18 L 0.804 3.18 Z M 8.866 5.552 L 8.866 6.502 L 7.919 6.502 L 7.919 5.552 Z M 5.546 2.232 C 7.379 2.232 8.866 3.719 8.866 5.552 L 7.919 5.552 C 7.919 4.923 7.668 4.32 7.223 3.875 C 6.778 3.43 6.175 3.18 5.546 3.18 Z%22 fill=%22rgba(0,0,0,0.35)%22></path></g></svg>')" } as React.CSSProperties} />
                  </div>
                </div>
                <div className="framer-8mwocq" data-framer-component-type="RichTextContainer" style={{ '--extracted-r6o4lv': 'var(--variable-reference-gos0GQJWh-oZTIdW1xS)', '--framer-link-text-color': 'rgb(0, 153, 255)', '--framer-link-text-decoration': 'underline', '--variable-reference-gos0GQJWh-oZTIdW1xS': 'rgba(0, 0, 0, 0.35)', transform: 'none' } as React.CSSProperties}>
                  <p dir="auto" className="framer-text" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-family': '"Switzer", "Switzer Placeholder", sans-serif', '--framer-font-size': '12px', '--framer-text-alignment': 'right', '--framer-text-color': 'var(--extracted-r6o4lv, var(--variable-reference-gos0GQJWh-oZTIdW1xS))' } as React.CSSProperties}>
                    {'Back'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </a>
        <SideNav items={CASE_STUDY_ITEMS} className="framer-1dexa0q-container hidden-kbwdhd" revealAtId="grumble-hero-mark" revealWhen="top" />
        <CaseStudyThemeToggle />
      </div>
    </>
  );
}
