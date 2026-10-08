import VideoAutoplay from '@/components/VideoAutoplay';
import SideNav, { type SideNavItem } from '@/components/SideNav';
import CaseStudyThemeToggle from '@/components/casestudy/CaseStudyThemeToggle';
import TikTokOverviewBento from '@/components/casestudy/TikTokOverviewBento';
import { ProjectCard } from '@/components/ProjectGrid';
import { PROJECTS } from '@/components/projects-data';
import SiteFooter from '@/components/SiteFooter';
import ReachOutBanner from '@/components/casestudy/ReachOutBanner';
import InternDaysCollage, { TIKTOK_INTERN_PHOTOS } from '@/components/casestudy/InternDaysCollage';
import { CornerDownRightIcon } from '@/components/icons/CornerDownRightIcon';
import { LockIcon } from '@/components/icons/LockIcon';

/**
 * TikTok internship — Account infrastructure case study.
 * Same shell as Lemon8 / Grumble / Loom (.framer-172orq5 rhythm, specs row,
 * side nav, back pill, footer). Content from the internship draft PDF.
 */

const TIKTOK_NAV: readonly SideNavItem[] = [
  { label: 'Overview', id: 'overview' },
  { label: 'Projects', id: 'projects' },
  { label: 'Takeaways', id: 'takeaways' },
];

const TIKTOK_PROJECT_NAV: readonly SideNavItem[] = [
  { label: 'Login & signup', id: 'project-01' },
  { label: 'SDK login', id: 'project-02' },
  { label: 'Switch account', id: 'project-03' },
  { label: 'Web login', id: 'project-04' },
  { label: 'Profile banners', id: 'project-05' },
  { label: 'Global events', id: 'project-06' },
];

const TIKTOK_SUB_ITEMS: Readonly<Record<string, readonly SideNavItem[]>> = {
  projects: TIKTOK_PROJECT_NAV,
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="tiktok-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
      <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
        {children}
      </h5>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="ssr-variant">
      <div className="tiktok-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
        <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
          {children}
        </h1>
      </div>
    </div>
  );
}

function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
      <p className={['framer-text', 'framer-styles-preset-ybrah6', className].filter(Boolean).join(' ')} data-styles-preset="ix87J7P54" dir="auto">
        {children}
      </p>
    </div>
  );
}

function Spec({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="framer-1tnk8q6" data-framer-name={label}>
      <div className="framer-zay5w8" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', opacity: '0.4', transform: 'none' } as React.CSSProperties}>
        <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
          {label}
        </h5>
      </div>
      <div className="framer-qfuc9h" style={{ opacity: '1' } as React.CSSProperties}>
        {values.map((value) => (
          <div key={value} className="framer-1wu4kjx" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', opacity: '1', transform: 'none' } as React.CSSProperties}>
            <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{ '--framer-text-color': 'rgba(0, 0, 0, 0.8)', '--framer-font-size': '14px' } as React.CSSProperties}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TikTokVideo({
  src,
  poster,
  caption,
  ratio = '1 / 1',
  lead,
}: {
  src: string;
  poster?: string;
  caption?: string;
  ratio?: string;
  lead?: React.ReactNode;
}) {
  return (
    <div className="tiktok-media-col">
      {lead ? <div className="tiktok-media-lead">{lead}</div> : null}
      <div className="tiktok-media" style={{ aspectRatio: ratio } as React.CSSProperties}>
        <video
          src={src}
          poster={poster}
          loop
          muted
          playsInline
          preload="none"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            background: 'transparent',
          } as React.CSSProperties}
        />
      </div>
      {caption ? <p className="tiktok-media-caption">{caption}</p> : null}
    </div>
  );
}

function Takeaway({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="framer-107fbv6" data-framer-name="Takeaway">
      {icon}
      <div className="framer-agm7ow">
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

export default function TikTokBody() {
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            id="tiktok-logo"
                            className="tiktok-hero-logo"
                            src="/assets/images/tiktok-logo.png"
                            alt="TikTok"
                          />
                          <p className="hero-kicker framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" id="tiktok-hero-mark">
                            <span className="hero-kicker__lead">{'Internship · '}</span>
                            <span className="hero-kicker__date">{'Shipped Q3 2026'}</span>
                          </p>
                        </div>
                        <div className="framer-1usj49e" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', transform: 'none' } as React.CSSProperties}>
                          <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-weight': '400', '--framer-font-size': '24px' } as React.CSSProperties}>
                            {'Designing account experiences at scale'}
                          </h1>
                        </div>
                        {/* Subtitle — same slot and same inline style as the
                            Loom hero subtitle. */}
                        <div className="framer-oieuo1" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', transform: 'none' } as React.CSSProperties}>
                          <p dir="auto" className="framer-text" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-family': '"Switzer", "Switzer Placeholder", sans-serif', '--framer-line-height': '143%', '--framer-font-size': '14px', '--framer-text-color': 'rgba(0, 0, 0, 0.8)' } as React.CSSProperties}>
                            {"3 features shipped toward millions of users, and 3+ explorations from 0→1, in a 7-month internship."}
                          </p>
                        </div>
                      </div>
                      <div className="framer-1xern0j-container">
                        <TikTokOverviewBento />
                      </div>
                      <div className="framer-27g1vn" data-framer-name="Project Specs">
                        <Spec label="Role" values={['Product Design Intern']} />
                        <Spec label="Team" values={['Product Infrastructure: Account & profile']} />
                        <Spec label="Timeline" values={['Feb – Aug 2026']} />
                        <Spec
                          label="Collaboration"
                          values={['Software Engineers', 'Product Managers', 'Content Designers', 'Data Analysts']}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ Overview */}
              <div className="framer-1x0zakg" data-framer-name="Overview" id="overview">
                <div className="framer-6dezqx">
                  <div className="framer-3eslqg">
                    <Eyebrow>{'Overview'}</Eyebrow>
                    <Title>
                      {'I '}
                      <span className="tiktok-highlight">{'craft intuitive experiences for accounts'}</span>
                      {' from first encounter at login to tasks users want done in seconds.'}
                    </Title>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ Projects */}
              <div className="framer-evphwi" data-framer-name="Projects" id="projects">
                <div className="framer-1muivw2">
                  <Eyebrow>{'Projects'}</Eyebrow>
                  <Title>{'A peek at what I worked on during my 7 months internship'}</Title>
                  <Body>
                    {'I work across signup, the Account SDK that partner apps use for TikTok login, and multi-account switching. On the side, I explore profile looks and new components for PGC creators around upcoming events.'}
                  </Body>
                </div>
              </div>

              {/* --------------------------------------------------- Project 01 */}
              <div className="framer-1dcww5q tiktok-project" data-framer-name="Project 01" id="project-01">
                <Eyebrow>{'Project #01 · Shipped'}</Eyebrow>
                <Title>{'TikTok login and signup, with fewer steps'}</Title>
                <Body>
                  {'Login and signup are the first barrier users face when entering the product. The conversion efficiency of different login methods directly drives churn.'}
                </Body>

                <div className="tiktok-media-pair">
                  <TikTokVideo
                    src="/assets/tiktok/tiktok-project-01-01.mp4"
                    poster="/assets/tiktok/posters/tiktok-project-01-01.jpg"
                    ratio="1840 / 1838"
                    caption="Switch between panels"
                    lead={
                      <>
                        <Eyebrow>{'Issue #1'}</Eyebrow>
                        <Body>
                          {'TikTok users land on the wrong panel constantly: signing up on login, logging in on signup, with a low manual switch rate between.'}
                        </Body>
                      </>
                    }
                  />
                  <TikTokVideo
                    src="/assets/tiktok/tiktok-project-01-02.mp4"
                    poster="/assets/tiktok/posters/tiktok-project-01-02.jpg"
                    ratio="1840 / 1838"
                    caption="Inconsistent brand visual style"
                    lead={
                      <>
                        <Eyebrow>{'Issue #2'}</Eyebrow>
                        <Body>
                          {'Over time, layered designs fell out of sync with the design system, the brand barely showed on entry.'}
                        </Body>
                      </>
                    }
                  />
                </div>

                <div className="tiktok-solution">
                  <Eyebrow>{'Solution'}</Eyebrow>
                  <div className="tiktok-phase">
                    <Body className="tiktok-body--ink">
                      {'Merge login and signup into one panel that reads input and account status, then directs to the right next step.'}
                    </Body>
                    <ol className="tiktok-steps">
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'Rebuild the visual system: unified color, typography, spacing, and brand presence.'}</span>
                      </li>
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'Keep track and ship the unified panel across platforms and global regions, considering local regulations.'}</span>
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="tiktok-collab">
                  <div className="tiktok-media" style={{ aspectRatio: '1880 / 1080' } as React.CSSProperties}>
                    <video
                      src="/assets/tiktok/tiktok-project-01.mp4"
                      poster="/assets/tiktok/posters/tiktok-project-01.jpg"
                      loop
                      muted
                      playsInline
                      preload="none"
                      aria-label="Before and after: fragmented panels to one unified entry"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover',
                        background: 'transparent',
                      } as React.CSSProperties}
                    />
                  </div>
                  <aside className="tiktok-collab__hint">
                    <div className="tiktok-collab__copy">
                      <p>{'In collab with'}</p>
                      <p>{'Silvia Li and'}</p>
                      <p>{'Ruoxi Wang'}</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="tiktok-collab__arrow"
                      src="/assets/images/FV4kycU8B4v8ARnFe3KPd0eobN4.svg"
                      alt=""
                      width={28}
                      height={25}
                      aria-hidden="true"
                    />
                  </aside>
                </div>
              </div>

              {/* --------------------------------------------------- Project 02 */}
              <div className="framer-3b99r3 tiktok-project" data-framer-name="Project 02" id="project-02">
                <Eyebrow>{'Project #02 · Shipped'}</Eyebrow>
                <Title>{'Supporting one-tap login for family apps'}</Title>
                <Body>
                  {'Family apps use TikTok’s Account SDK so people can log in with their TikTok account. For people with both apps installed, login should take one tap. Today, each family app designs its own version. The flows look different from app to app, and some open a separate web panel just to log in.'}
                </Body>

                <div className="tiktok-solution">
                  <Eyebrow>{'Solution'}</Eyebrow>
                  <div className="tiktok-phase">
                    <Body className="tiktok-body--ink">
                      {'I designed a universal framework that still allows customization.'}
                    </Body>
                    <ol className="tiktok-steps">
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'People logged in to TikTok join with one tap.'}</span>
                      </li>
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'People who have TikTok but aren’t logged in will auto-switch to TikTok to log in.'}</span>
                      </li>
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'Users without TikTok installed see a refreshed interface.'}</span>
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="tiktok-media-duo">
                  <div className="tiktok-media-duo__video">
                    <div className="tiktok-media-duo__video-frame">
                      <video
                        src="/assets/tiktok/tiktok-project-02-01.mp4"
                        poster="/assets/tiktok/posters/tiktok-project-02-01.jpg"
                        loop
                        muted
                        playsInline
                        preload="none"
                        aria-label="One-tap login in the family app"
                      />
                    </div>
                    <p className="tiktok-media-caption">{'Customizable logo, slogan, button, and background'}</p>
                  </div>
                  <div className="tiktok-media-duo__image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/tiktok/tiktok-project-02-02.png"
                      alt="Continue as and Continue with TikTok buttons"
                    />
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------- Project 03 */}
              <div className="framer-ql629q tiktok-project" data-framer-name="Project 03" id="project-03">
                <Eyebrow>{'Project #03 · In Testing'}</Eyebrow>
                <Title>{'Switching accounts from the tab bar'}</Title>
                <Body>
                  {'Many users switch accounts regularly on TikTok, and currently they have to go to their profile or scroll to bottom of Settings to switch accounts.'}
                </Body>

                <div className="tiktok-solution">
                  <Eyebrow>{'Solution'}</Eyebrow>
                  <div className="tiktok-phase">
                    <Body className="tiktok-body--ink">
                      {'Introducing double-tap and long-press gestures with guardrails.'}
                    </Body>
                    <ol className="tiktok-steps">
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'Explore switching animations that hold up across device performance.'}</span>
                      </li>
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'Show tooltip for new gesture if users switched accounts.'}</span>
                      </li>
                      <li>
                        <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                        <span>{'Show a first-time panel on double-tap to prevent accidental account switches.'}</span>
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="tiktok-media-trio">
                  <div className="tiktok-media tiktok-media-trio__main">
                    <video
                      src="/assets/tiktok/tiktok-project-03-switch.mp4"
                      poster="/assets/tiktok/posters/tiktok-project-03-switch.jpg"
                      loop
                      muted
                      playsInline
                      preload="none"
                      aria-label="Switch account confirmation panel"
                    />
                  </div>
                  <div className="tiktok-media-trio__side">
                    <div className="tiktok-media">
                      <video
                        src="/assets/tiktok/tiktok-project-03-tooltip.mp4"
                        poster="/assets/tiktok/posters/tiktok-project-03-tooltip.jpg"
                        loop
                        muted
                        playsInline
                        preload="none"
                        aria-label="Double tap to switch accounts tooltip"
                      />
                    </div>
                    <div className="tiktok-media">
                      <video
                        src="/assets/tiktok/tiktok-project-03-panel.mp4"
                        poster="/assets/tiktok/posters/tiktok-project-03-panel.jpg"
                        muted
                        playsInline
                        preload="none"
                        data-end-hold-ms="5000"
                        aria-label="Profile tab double-tap panel"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------- Project 04 */}
              <div className="framer-n9na3f tiktok-project" data-framer-name="Project 04" id="project-04">
                <div className="framer-1glwd7l">
                  <div className="framer-1warq6h">
                    <div className="framer-eahql">
                      <Eyebrow>{'Project #04 · Design Proposal'}</Eyebrow>
                      <Title>{'Making QR login clearer for users'}</Title>
                      <Body>
                        {'Current web login often already has a QR code to scan, but the design shows a static code with lines of directions that are hard to comprehend.'}
                      </Body>
                      <div className="tiktok-solution">
                        <Eyebrow>{'Solution'}</Eyebrow>
                        <div className="tiktok-phase">
                          <Body className="tiktok-body--ink">
                            {'Design and animate visual steps that guide users where to tap in the app to reach the scan feature'}
                          </Body>
                          <ol className="tiktok-steps">
                            <li>
                              <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                              <span>{'Animated step-by-step guidance from home screen to profile to scan icon, with jitter.'}</span>
                            </li>
                            <li>
                              <CornerDownRightIcon className="tiktok-steps__icon" size={14} aria-hidden />
                              <span>{'Prototyped 3 different website layouts to experiment with design directions.'}</span>
                            </li>
                          </ol>
                        </div>
                      </div>
                      <div className="tiktok-media-pair">
                        <TikTokVideo
                          src="/assets/tiktok/tiktok-project-04-before.mp4"
                          ratio="1 / 1"
                          caption="Before"
                        />
                        <TikTokVideo
                          src="/assets/tiktok/tiktok-project-04-after.mp4"
                          ratio="1 / 1"
                          caption="After"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------- Project 05 */}
              <div className="framer-1dcww5q tiktok-project" data-framer-name="Project 05" id="project-05">
                <Eyebrow>{'Project #05 · In Exploration'}</Eyebrow>
                <Title>{'Visual exploration for creators beyond the default profile'}</Title>
                <Body>
                  {'Every TikTok profile uses the same visual language. For top creators promoting events, movies, or releases, the standard template doesn’t capture the atmosphere.'}
                </Body>
                <Body>
                  {'I explored personalized profiles through customized visuals, and coded each direction to present to the team as future proposals.'}
                </Body>
                <div className="tiktok-media tiktok-media--lockable" style={{ aspectRatio: '16 / 9' } as React.CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/tiktok/tiktok-project-05-variation2.png"
                    alt="Profile banner visual exploration, variation 2"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      objectFit: 'cover',
                    } as React.CSSProperties}
                  />
                  <div className="tiktok-media-lock" aria-hidden>
                    <LockIcon size={20} />
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------- Project 06 */}
              <div className="framer-3b99r3 tiktok-project" data-framer-name="Project 06" id="project-06">
                <Eyebrow>{'Project #06 · In Exploration'}</Eyebrow>
                <Title>{'Event components to implement across TikTok for upcoming large events'}</Title>
                <Body>
                  {'Explored components across countdown, upcoming events, customized text, profile backgrounds, comment easter eggs, LIVE, and more.'}
                </Body>
                <div
                  className="tiktok-media tiktok-media--lockable"
                  style={{ aspectRatio: '3262 / 2164', background: 'transparent' } as React.CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/tiktok/tiktok-project-06.png"
                    alt="Event components for upcoming large events"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      objectFit: 'contain',
                    } as React.CSSProperties}
                  />
                  <div className="tiktok-media-lock" aria-hidden>
                    <LockIcon size={20} />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------ CTA */}
              <div className="framer-n9na3f" data-framer-name="CTA">
                <div className="framer-1glwd7l">
                  <div className="framer-1warq6h">
                    <div className="framer-eahql">
                      <Eyebrow>{'Want the full story?'}</Eyebrow>
                      <Title>{'Reach out via email or LinkedIn for walkthrough'}</Title>
                      <ReachOutBanner
                        variant="quote"
                        lead="Enter password to unlock more"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------- Intern days */}
              <div className="framer-n9na3f" data-framer-name="Intern days" id="interndays">
                <div className="framer-1glwd7l">
                  <div className="framer-1warq6h">
                    <div className="framer-eahql">
                      <Eyebrow>{'Intern days'}</Eyebrow>
                      <Title>{'My intern days at TikTok'}</Title>
                      <InternDaysCollage
                        photos={TIKTOK_INTERN_PHOTOS}
                        smileyFill="#2F6FED"
                        explosion="flower"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- Takeaways */}
              <div className="framer-dl8rqd" data-framer-name="Takeaways" id="takeaways">
                <div className="framer-a0h1dk">
                  <Eyebrow>{'Takeaways'}</Eyebrow>
                  <Title>{'What I learned working at TikTok'}</Title>
                </div>

                <div className="framer-1rc6mne">
                  <div className="framer-z42bak tiktok-takeaway-grid">
                    <Takeaway
                      title="Know your audience, and who presents after you."
                      icon={
                        <svg className="takeaway-icon takeaway-icon--blue" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'I adjust wording, visuals, and hierarchy for each room. The same design tells a different story to PMs, engineers, and leadership. I also think about who presents the work next. If a PM carries it forward, the deck has to make sense without me in the room.'}
                    </Takeaway>
                    <Takeaway
                      title="Surround yourself with other creatives."
                      icon={
                        <svg className="takeaway-icon takeaway-icon--green" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      }
                    >
                      {'Designers here prototype constantly. The best ones spot an opportunity, build it, and bring it to PMs before anyone asks. I learn as much from their prototypes as from my own projects.'}
                    </Takeaway>
                    <Takeaway
                      title="Pitch one step ahead."
                      icon={
                        <svg className="takeaway-icon takeaway-icon--amber" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 19V9M10 19V5M15 19v-6M20 19V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'When it makes sense, I bring one more idea than the brief asks for: the next step, or a pitch for where the product could go. It shows the team I’m thinking past the current release.'}
                    </Takeaway>
                    <Takeaway
                      title="Keep a decision log."
                      icon={
                        <svg className="takeaway-icon takeaway-icon--violet" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'On bigger projects, I log every change and decision: progress, check-ins, whose feedback it was, what they said, and why we chose what we did. Months later, when someone asks why it works this way, the answer is already written down.'}
                    </Takeaway>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ Next On */}
              <div className="framer-dl8rqd" data-framer-name="Next On" id="nextsteps">
                <div className="next-on">
                  <Eyebrow>{'Next On'}</Eyebrow>
                  <div className="next-on__grid">
                    {PROJECTS.filter((p) => p.href === '/notestaboptimization' || p.href === '/loom').map((project) => (
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
              <div className="framer-YerRY framer-4z4bep framer-v-4z4bep" data-framer-name="Variant 1" style={{ width: '100%', borderRadius: '100px' } as React.CSSProperties}>
                <div className="framer-1um1tvy" data-framer-name="back-icon">
                  <div className="framer-129qaqh" data-framer-name="Component 1">
                    <div data-framer-component-type="SVG" data-framer-name="svg-844649026_806" className="framer-wxuqll" aria-hidden="true" style={{ imageRendering: 'pixelated', flexShrink: '0', backgroundSize: '100% 100%', backgroundImage: "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%220 0 9 7%22><g><path d=%22M 0 7 L 0 0 L 9 0 L 9 7 Z%22 fill=%22transparent%22></path><path d=%22M 0.804 2.706 L 0.468 3.042 L 0.133 2.706 L 0.468 2.372 Z M 8.866 6.502 C 8.876 6.676 8.787 6.842 8.637 6.932 C 8.486 7.022 8.299 7.022 8.149 6.932 C 7.998 6.842 7.91 6.676 7.919 6.502 Z M 2.838 5.413 L 0.468 3.042 L 1.139 2.371 L 3.51 4.742 Z M 0.468 2.372 L 2.838 0 L 3.51 0.671 L 1.137 3.041 L 0.467 2.369 Z M 0.804 2.232 L 5.546 2.232 L 5.546 3.18 L 0.804 3.18 Z M 8.866 5.552 L 8.866 6.502 L 7.919 6.502 L 7.919 5.552 Z M 5.546 2.232 C 7.379 2.232 8.866 3.719 8.866 5.552 L 7.919 5.552 C 7.919 4.923 7.668 4.32 7.223 3.875 C 6.778 3.43 6.175 3.18 5.546 3.18 Z%22 fill=%22rgba(0,0,0,0.35)%22></path></g></svg>')" } as React.CSSProperties} />
                  </div>
                </div>
                <div className="framer-8mwocq" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
                  <p dir="auto" className="framer-text" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-family': '"Switzer", "Switzer Placeholder", sans-serif', '--framer-font-size': '12px', '--framer-text-alignment': 'right', '--framer-text-color': 'rgba(0, 0, 0, 0.35)' } as React.CSSProperties}>
                    {'Back'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </a>
        <SideNav
          items={TIKTOK_NAV}
          subItems={TIKTOK_SUB_ITEMS}
          className="framer-1dexa0q-container hidden-kbwdhd"
          revealAtId="tiktok-hero-mark"
          revealWhen="top"
        />
        <CaseStudyThemeToggle />
      </div>
    </>
  );
}
