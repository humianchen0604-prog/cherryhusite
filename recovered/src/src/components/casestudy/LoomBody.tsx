import VideoAutoplay from '@/components/VideoAutoplay';
import LoomFoldersMark from '@/components/casestudy/LoomFoldersMark';
import LoomSyncMark from '@/components/casestudy/LoomSyncMark';
import SideNav, { type SideNavItem } from '@/components/SideNav';
import CaseStudyThemeToggle from '@/components/casestudy/CaseStudyThemeToggle';
import { ProjectCard } from '@/components/ProjectGrid';
// Plain data module, not ProjectGrid.tsx — see projects-data.ts for why a
// Server Component can't filter an array exported from a 'use client' file.
import { PROJECTS } from '@/components/projects-data';
import SiteFooter from '@/components/SiteFooter';
import LoomLinks from '@/components/casestudy/LoomLinks';
import LoomExportViewer from '@/components/casestudy/LoomExportViewer';
import LoomStageCarousel from '@/components/casestudy/LoomStageCarousel';
import LoomExportCycle from '@/components/casestudy/LoomExportCycle';
import LoomCollapse from '@/components/casestudy/LoomCollapse';
import LoomNoteIcon from '@/components/casestudy/LoomNoteIcon';

/**
 * Loom — EAI SP26 solo project, built on the same case-study shell as Grumble
 * and Notes Tab Optimization: .framer-172orq5 page padding, the 140px section
 * rhythm, the h5 eyebrow / h1 title / 14px body presets, the divider, the back
 * pill, the side nav and the footer.
 *
 * Loom-only patterns (media slots, the rubric tables, the do/don't rule, the
 * numbered solution cards) live in ../../app/loom/loom.css.
 *
 * STRUCTURE ONLY. Copy is real where it exists (docs/loom-case-study-content.md);
 * every image and video is a labelled grey <MediaSlot> stating the asset it
 * waits on, and content that doesn't exist yet — research quotes, usability
 * numbers — is a <Todo> block rather than invented text.
 */

/* Loom carries a sixth nav item the other two case studies don't: the AI layer
   is the reason this study exists, so it gets its own stop. */
const LOOM_NAV_ITEMS: readonly SideNavItem[] = [
  { label: 'Overview', id: 'overview' },
  { label: 'Problem', id: 'problem' },
  { label: 'Solution', id: 'solution' },
  { label: 'Process', id: 'process' },
  { label: 'Evaluating AI', id: 'intelligence' },
  { label: 'Next Steps', id: 'nextsteps' },
];

const PROTOTYPE_URL = 'https://loom-sooty.vercel.app/';

/** Section eyebrow — 12px uppercase label above a title. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="loom-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
      <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
        {children}
      </h5>
    </div>
  );
}

/** Section title — the 20px heading preset used across the case studies. */
function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="ssr-variant">
      <div className="loom-rt" data-framer-component-type="RichTextContainer" style={{ transform: 'none' } as React.CSSProperties}>
        <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
          {children}
        </h1>
      </div>
    </div>
  );
}

/** Body copy — 14px paragraph preset at the shared measure. */
function Body({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{ transform: 'none', ...style } as React.CSSProperties}>
      <p className={['framer-text', 'framer-styles-preset-ybrah6', className].filter(Boolean).join(' ')} data-styles-preset="ix87J7P54" dir="auto">
        {children}
      </p>
    </div>
  );
}


/** A project-spec column in the hero. */
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

/**
 * Grey placeholder standing in for an image or video that doesn't exist yet.
 * It states the asset it's waiting on and holds the real aspect ratio, so the
 * page's vertical rhythm is already correct when the media drops in.
 */
function MediaSlot({
  ratio = '16 / 9',
  kind = 'Video',
  label,
  note,
}: {
  ratio?: string;
  kind?: 'Video' | 'Image' | 'Diagram' | 'Screens';
  label: string;
  note?: string;
}) {
  return (
    <div className="loom-slot" style={{ aspectRatio: ratio } as React.CSSProperties}>
      <div className="loom-slot__inner">
        <span className="loom-slot__kind">{kind}</span>
        <span className="loom-slot__label">{label}</span>
        {note ? <span className="loom-slot__note">{note}</span> : null}
        <span className="loom-slot__ratio">{ratio.replace(' / ', ':')}</span>
      </div>
    </div>
  );
}

/**
 * The process reel replacing the slide-39 still: same slot, but a live HTML/SVG
 * loop (built to the deck's exact diamond geometry) standing in for what was a
 * static before/after pair. Self-contained page (own script, own render loop),
 * so it's embedded as an iframe rather than inlined.
 *
 * Same width as the solution-05 video reel (1920 wide), 3/5 its height — the
 * scene's own preserveAspectRatio="xMidYMid meet" scales the diamonds down to
 * fit the shorter frame instead of cropping them.
 *
 * Text-to-media gap: it sits in .framer-eahql, whose 16px flex gap is wider
 * than the 12px SolutionCard gap the golden rule's 44px (12 + 32) assumes —
 * so .loom-media's own 32px margin-top is trimmed to 28px here to land on
 * that same 44px total instead of 48px.
 */
function LoomProcessReel({ ratio = '1920 / 681.6' }: { ratio?: string }) {
  return (
    <div className="loom-media loom-process-reel" style={{ width: '100%', aspectRatio: ratio, marginTop: '28px' } as React.CSSProperties}>
      <iframe
        src="/assets/loom/process-reel.html"
        title="Double Diamond process, evolving into a continuous iteration loop"
        loading="lazy"
        style={{ width: '100%', height: '100%', display: 'block', border: 0 }}
      />
    </div>
  );
}

/**
 * A real clip, once one exists — same full-width slot MediaSlot holds, but
 * playing footage instead of a grey box. Autoplay/pause on scroll comes from
 * the page-level <VideoAutoplay />.
 */
function LoomVideo({
  src,
  ratio = '16 / 9',
  endHoldMs,
  cropEdgePx,
  caption,
  rowFlex,
  style,
  fit = 'cover',
}: {
  src: string;
  ratio?: string;
  /** Pause on the last frame this long before replaying, instead of looping
   *  straight back to the start — handled by the page-level VideoAutoplay,
   *  which watches for this attribute. */
  endHoldMs?: number;
  /** Some recordings ship with a hairline border baked into the footage
   *  itself (a screen-capture window frame, usually 1px). CSS can't touch
   *  pixels that are part of the video, so this scales the video up just
   *  enough to push that many pixels of its own edge outside a clipped
   *  wrapper — invisible at any normal viewing distance. Omit for clean
   *  footage; the wrapper only appears when this is set. */
  cropEdgePx?: number;
  /** Centered, muted label under the clip — same treatment as the Overview
   *  video's caption elsewhere on the site. */
  caption?: string;
  /** Set only for a clip placed inside <div className="loom-video-row">
   *  alongside another one. Pass the clip's own width/height ratio as a
   *  decimal (e.g. 1920/1178) — flex-grow set to that value is the standard
   *  "justified row" trick: it makes every clip in the row resolve to the
   *  SAME rendered height, each keeping its own aspect ratio, with width
   *  following naturally. Omit for a full-width clip on its own line. */
  rowFlex?: number;
  /** Extra styles merged onto the .loom-media wrapper — e.g. a one-off
   *  margin-top when this clip's flex parent doesn't already give it the
   *  standard case-study text-to-media gap, or a background color to show
   *  through when `fit="contain"` letterboxes the clip. */
  style?: React.CSSProperties;
  /** 'cover' (default) crops to fill the frame; 'contain' keeps the whole
   *  frame in view instead, for footage whose own edges matter — the
   *  wrapper's background (set via `style`) shows in the leftover space. */
  fit?: 'cover' | 'contain';
}) {
  const video = (
    <video
      src={src}
      loop={endHoldMs == null}
      data-end-hold-ms={endHoldMs}
      muted
      playsInline
      preload="none"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: fit,
        background: 'transparent',
        transform: cropEdgePx ? `scale(${1 + cropEdgePx / 400})` : undefined,
      } as React.CSSProperties}
    />
  );

  const rowStyle = rowFlex
    ? ({ flexGrow: rowFlex, flexShrink: 1, flexBasis: 0, width: 'auto' } as React.CSSProperties)
    : null;

  /* Explicit width:100% — .loom-media has no width rule of its own in CSS, so
     it only fills its parent by accident, when that parent happens to be a
     block element or a flex row without align-items:center. Framer's flex
     text stacks (.framer-eahql and friends) DO set align-items:center, which
     shrinks a width-less flex child to its content's intrinsic size — for a
     <video> with no metadata loaded yet, that's the UA default of 300×150.
     Setting it here makes every LoomVideo placement correct by default
     instead of by luck of which container it lands in. */
  const media = cropEdgePx ? (
    <div className="loom-media" style={{ width: '100%', aspectRatio: ratio, overflow: 'hidden', ...rowStyle, ...style } as React.CSSProperties}>
      {video}
    </div>
  ) : (
    <div className="loom-media" style={{ width: '100%', aspectRatio: ratio, ...rowStyle, ...style } as React.CSSProperties}>
      {video}
    </div>
  );

  if (!caption) return media;

  return (
    <>
      {media}
      <p className="loom-media-caption">{caption}</p>
    </>
  );
}

/** A callout with an illustration beside the copy — the grey card token laid
 *  out as a row, for a claim that reads better next to a picture of itself
 *  than under a heading. */
function LoomNoteCard({
  art,
  topic,
  title,
  className,
  children,
}: {
  art: React.ReactNode;
  /** Small label above the copy — one weight bolder than the body text, not
   *  a heading like `title`. For a note that names what kind of note it is
   *  (e.g. "User feedback") rather than making a claim. */
  topic?: string;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={['loom-note-card', className].filter(Boolean).join(' ')}>
      <div className="loom-note-card__art">{art}</div>
      <div className="loom-note-card__body">
        {topic ? <p className="loom-note-card__topic">{topic}</p> : null}
        {title ? <h4 className="insight-title">{title}</h4> : null}
        <Body>{children}</Body>
      </div>
    </div>
  );
}

/** Content that is genuinely missing — not a design placeholder, a content one. */
function Todo({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="loom-todo">
      <span className="loom-todo__flag">{'Placeholder'}</span>
      <h4 className="loom-todo__title">{title}</h4>
      <div className="loom-todo__body">{children}</div>
    </div>
  );
}

/** One numbered solution card: the number reads as part of the claim, then
 *  whatever the card needs below it — a paragraph, or columns when the claim
 *  has two distinct halves — and, where it's worth stating, its cost. */
function SolutionCard({
  num,
  title,
  children,
  cost,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
  cost?: React.ReactNode;
}) {
  return (
    <div className="loom-solution">
      <Title>
        <span className="loom-solution__num">{num}</span>
        {title}
      </Title>
      {children}
      {cost ? (
        <p className="loom-solution__cost">
          <span className="loom-solution__cost-label">{'The cost — '}</span>
          {cost}
        </p>
      ) : null}
    </div>
  );
}

/** Bordered data table used by the rubric, the golden queries and the scores. */
function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="loom-table-wrap">
      <table className="loom-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One takeaway column: icon, claim, reflection. */
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

export default function LoomBody() {
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
                          <p className="hero-kicker framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" id="loom-hero-mark">
                            <span className="hero-kicker__lead">{'Design Concept · '}</span>
                            <span className="hero-kicker__date">{'Live prototype, 2026'}</span>
                          </p>
                        </div>
                        <div className="framer-1usj49e" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', transform: 'none' } as React.CSSProperties}>
                          <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-weight': '400', '--framer-font-size': '24px' } as React.CSSProperties}>
                            {'Loom — keeping creative teams aligned while the work happens'}
                          </h1>
                        </div>
                        <div className="framer-oieuo1" data-framer-component-type="RichTextContainer" style={{ '--framer-paragraph-spacing': '0px', transform: 'none' } as React.CSSProperties}>
                          <p dir="auto" className="framer-text" style={{ '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy', '--framer-font-family': '"Switzer", "Switzer Placeholder", sans-serif', '--framer-line-height': '143%', '--framer-font-size': '14px', '--framer-text-color': 'rgba(0, 0, 0, 0.8)' } as React.CSSProperties}>
                            {'A shared canvas that reads what lands on it, notices when directions conflict, and turns that into a decision.'}
                          </p>
                        </div>
                      </div>

                      <div className="framer-1xern0j-container">
                        <LoomVideo
                          src="/assets/media/loom-preview.mp4"
                          ratio="1700 / 1080"
                          style={{ marginTop: 0 }}
                        />
                      </div>

                      <div className="framer-27g1vn" data-framer-name="Project Specs">
                        <Spec label="Role" values={['Product Designer', 'Design Engineer']} />
                        <Spec label="Timeline" values={['10 weeks']} />
                        <Spec label="Tools" values={['Figma', 'Cursor', 'Claude']} />
                        <Spec label="Focused Platform" values={['Web']} />
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ Overview */}
              <div className="framer-1x0zakg" data-framer-name="Overview" id="overview">
                <div className="framer-6dezqx">
                  <div className="framer-3eslqg">
                    <div className="loom-stack">
                      <Eyebrow>{'Overview'}</Eyebrow>
                      <Title>
                        {'Loom'}
                        {' is a shared canvas for creative teams to stay aligned on direction throughout a project.'}
                      </Title>
                      <Body>
                        {'Current whiteboard tools are built for '}
                        <em>{'storing'}</em>
                        {' work. Loom is built for keeping a team aligned '}
                        <em>{'while'}</em>
                        {' the work is happening — reading everything that lands on the canvas, noticing when directions start fighting each other, and turning that into a decision instead of another meeting.'}
                      </Body>
                      <LoomLinks prototypeUrl={PROTOTYPE_URL} />
                      {/* Overview media — a #fafafa placeholder at the same aspect
                          ratio as the first Solution video (1920 × 1238). */}
                      <div
                        className="loom-media loom-overview-placeholder"
                        style={{ width: '100%', aspectRatio: '1920 / 1238' } as React.CSSProperties}
                        role="img"
                        aria-label="Overview image placeholder"
                      />
                      {/* Attribution for the placeholder artwork in the prototype
                          screens — smaller and lighter than the body copy, so it
                          reads as a footnote rather than part of the pitch. */}
                      <p className="loom-disclaimer">
                        {'All imagery shown in the prototype is sourced from the internet and used for demonstration purposes only.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------- Problem */}
              <div className="framer-15t1wvj" data-framer-name="Problem" id="problem">

                {/* 3a — the story */}
                <div className="framer-cx1uo5" data-framer-name="Section 1" id="problem-1">
                  <div className="framer-9bne5l" data-framer-name="Title">
                    <div className="framer-1orqqu7">
                      <div className="framer-hu56uv">
                        <Eyebrow>{'The Problem'}</Eyebrow>
                        <div className="framer-m6t011">
                          <Title>
                            {'AI can sync information across messages, meetings, updates, clients. '}
                            <span className="loom-highlight">{'It can’t sync visual direction.'}</span>
                          </Title>
                        </div>
                        <Body>
                          {'Every project starts scattered — meeting notes, Slack messages, client comments, something your manager said, something product ruled out. It all exists, just never in one place. Everyone syncs it manually, in their head, project after project.'}
                        </Body>
                      </div>
                    </div>
                  </div>

                  <LoomVideo src="/assets/loom/loom-problem.mp4" ratio="1348 / 768" endHoldMs={3000} />

                </div>

                {/* 3b — key findings */}
                <div className="framer-xnrdk3" data-framer-name="Section 2" id="problem-2">
                  <div className="framer-786ynq" data-framer-name="Title">
                    <div className="framer-1a4t7ip">
                      <div className="framer-1ucdwph">
                        <Eyebrow>{'Key Findings'}</Eyebrow>
                        <div className="framer-18fmlck">
                          <Title>
                            {'Many existing AI tools lack understanding of visual assets or new updates, and '}
                            <span className="loom-highlight">{'build on a wrong direction without ever flagging it.'}</span>
                          </Title>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="loom-cards loom-cards--insights">
                    <div className="loom-card">
                      <span className="loom-card__num">{'Insight 01'}</span>
                      <h4 className="loom-card__title">{'People are working off outdated updates'}</h4>
                      <p className="loom-card__body">{'Designers keep going back and forth on their own version, unaware of the latest update from someone else on the team.'}</p>
                    </div>
                    <div className="loom-card">
                      <span className="loom-card__num">{'Insight 02'}</span>
                      <h4 className="loom-card__title">{'Exploration ends without takeaways'}</h4>
                      <p className="loom-card__body">{'After a round of work or a sync, nothing says what changed, what was decided, or what to pick up next — so everyone leaves without knowing what to carry forward.'}</p>
                    </div>
                    <div className="loom-card">
                      <span className="loom-card__num">{'Insight 03'}</span>
                      <h4 className="loom-card__title">{'No tool takes in every source'}</h4>
                      <p className="loom-card__body">{'A project arrives as meeting notes, references, videos, copy, and briefs. Nothing reads all of it together, so the person is the one merging it into meaning.'}</p>
                    </div>
                  </div>

                </div>

                {/* 3c — HMW */}
                <div className="framer-n9na3f" data-framer-name="Section 3" id="problem-3">
                  <div className="framer-1glwd7l">
                    <div className="framer-1warq6h">
                      <div className="framer-eahql">
                        <Eyebrow>{'Design problem I worked with…'}</Eyebrow>
                        <Title>
                          {'How might we keep a creative team’s '}
                          <span className="loom-highlight">{'direction, context, and decisions'}</span>
                          {' in one place'}
                          <LoomFoldersMark />
                          {', so drift is caught while the work is happening, not after?'}
                        </Title>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ Solution */}
              <div className="framer-evphwi" data-framer-name="Solution" id="solution">
                <div className="framer-1muivw2">
                  <Eyebrow>{'Key Solutions'}</Eyebrow>
                </div>

                <div className="loom-solutions">
                  <SolutionCard num="01" title="Drop everything in, or let it sync itself">
                    <Body className="loom-solution__lead">{'Support images, documents, voice recordings, links, videos — all onto one canvas.'}</Body>
                    <LoomVideo src="/assets/loom/loom-solution-01.mp4" ratio="1920 / 1238" endHoldMs={3000} cropEdgePx={3} caption="Smart upload & sorting" />
                    <LoomNoteCard art={<LoomSyncMark />} title="Also support sync from existing tools.">
                      {'Connect the tools the team already uses, and keep it synced at all times.'}
                    </LoomNoteCard>
                  </SolutionCard>

                  <SolutionCard
                    num="02"
                    title="Instantly see the patterns, not the pile"
                  >
                    <Body>{'One click regroups every reference by theme instead of by uploader, so direction emerges more clearly before anyone has to dive in for it.'}</Body>
                    <div className="loom-video-row">
                      <LoomVideo src="/assets/loom/loom-solution-02.mp4" ratio="1920 / 1178" rowFlex={1920 / 1178} />
                      <LoomVideo src="/assets/loom/loom-solution-02b.mp4" ratio="882 / 1178" rowFlex={882 / 1178} />
                    </div>
                  </SolutionCard>

                  <SolutionCard
                    num="03"
                    title="Flag what’s fighting"
                  >
                    <Body>{'Loom reads across themes and surfaces where the work is pulling apart. The panel shows exactly where the conflict is, which inputs are causing it, and how far the current direction has drifted from what the brief asked for.'}</Body>
                    <LoomVideo src="/assets/loom/loom-solution-03.mp4" ratio="16 / 9" />
                  </SolutionCard>

                  <SolutionCard
                    num="04"
                    title="Turn conflicts into decisions"
                  >
                    <Body>{'Every flagged conflict becomes a decision, not a discussion. The team reviews async, marks which direction to move forward with, and closes it out without scheduling time to talk about it.'}</Body>
                    <LoomVideo src="/assets/loom/loom-solution-04.mp4" ratio="1920 / 1178" />
                    <div className="loom-module-frame">
                      <div className="loom-module-row">
                        <div className="loom-module-col">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/assets/loom/module-off-brief.png" alt="Off-brief direction flagged, with the mismatched references highlighted" />
                          <p className="loom-media-caption">{'Off-brief direction flagged'}</p>
                        </div>
                        <div className="loom-module-col">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/assets/loom/module-original-brief.png" alt="The original brief, with the client and team quotes it's checked against" />
                          <p className="loom-media-caption">{'Original brief & quotes'}</p>
                        </div>
                      </div>
                    </div>
                  </SolutionCard>

                  <SolutionCard
                    num="05"
                    title="Export as context, not as a dump"
                  >
                    <Body>{'Loom packages the confirmed direction, decisions, and next steps into one handoff: a Context Bridge for another AI, a Smart PDF for documentation, and a Todo list scoped per person.'}</Body>
                    <LoomVideo src="/assets/loom/loom-solution-05.mp4" ratio="1920 / 1136" />
                    <LoomExportViewer />
                  </SolutionCard>
                </div>
              </div>

              {/* ------------------------------------------------------- Process */}
              <div className="framer-n9na3f" data-framer-name="Process" id="process">
                <div className="framer-1glwd7l">
                  <div className="framer-1warq6h">

                    <div className="framer-eahql">
                      <Eyebrow>{'Process'}</Eyebrow>
                      <Title>
                        {'The first sketch came from lines of prompts, then '}
                        <span className="loom-highlight loom-highlight--nowrap">{'code became the canvas.'}</span>
                      </Title>
                      <Body>{'Traditional design process was built to lower the cost of designing the wrong thing.'}</Body>
                      <Body>{'Often times I found myself with little time left to work on the product’s craftsmanship. Vibe coding compresses validation into fast, live prototyping — buying back time for visuals and taste.'}</Body>

                      <LoomProcessReel ratio="1920 / 681.6" />

                      <Body style={{ marginTop: '28px', marginBottom: '28px' }}>{'Here’s how I kicked off the project.'}</Body>
                    </div>

                    <div className="loom-steps">
                      {(
                        [
                          {
                            num: '01',
                            label: 'Narrowing direction with AI',
                            media: <LoomVideo src="/assets/loom/process-step-01.mp4" ratio="1280 / 1126" />,
                          },
                          {
                            num: '02',
                            label: 'Locking the use case, then storyboarding it',
                            media: <LoomVideo src="/assets/loom/process-step-02.mp4" ratio="1280 / 1126" />,
                          },
                          {
                            num: '03',
                            label: 'Exploring visual directions',
                            media: <LoomVideo src="/assets/loom/process-step-03.mp4" ratio="1280 / 1126" />,
                          },
                        ] as { num: string; label: string; media: React.ReactNode }[]
                      ).map(({ num, label, media }) => (
                        <div className="loom-step" key={num}>
                          <span className="loom-step__num">{num}</span>
                          <span className="loom-step__label">{label}</span>
                          {media}
                        </div>
                      ))}
                    </div>

                    {/* ------------------------------------------- Challenge 01 */}
                    <div className="framer-eahql loom-stack--gap">
                      <Eyebrow>{'Challenge 01'}</Eyebrow>
                      <Title>{'How much should the conflict detection panel tell the user, and when?'}</Title>
                      <Body>{'There are countless ways to design an AI feedback interface. My goal was simple: surface conflicts between sources clearly, and keep the human in the loop to decide what happens next.'}</Body>
                    </div>

                    <LoomStageCarousel
                      stages={[
                        { num: 'Initial Design', label: 'Too much context in one single panel — hard to comprehend', mediaLabel: 'Conflict panel — before', imageSrc: '/assets/loom/loom-conflict-before.png' },
                        { num: 'Refined Design', label: 'Stripped to a conflict summary + one next action', mediaLabel: 'Conflict panel — in progress', videoSrc: '/assets/loom/loom-conflict-in-progress.mp4' },
                        { num: 'Final Design', label: 'Summary + one action + the evidence inline', mediaLabel: 'Conflict panel — after', videoSrc: '/assets/loom/loom-conflict-after.mp4' },
                      ]}
                    />

                    <LoomVideo
                      src="/assets/loom/loom-conflict-states.mp4"
                      ratio="2400 / 1200"
                      fit="contain"
                      style={{ marginTop: '28px', background: '#C1E279' }}
                    />

                    <Body className="loom-closer">{'Final design carries enough visual context (summary, action, and evidence) for a decision to be made on the spot.'}</Body>

                    {/* ------------------------------------------- Challenge 02 */}
                    <div className="framer-eahql loom-stack--gap">
                      <Eyebrow>{'Challenge 02'}</Eyebrow>
                      <Title>{'Deciding what the export hands off, and to whom.'}</Title>
                      <Body>{'Loom needed to keep the whole team on the same page as the direction changed, but for designers, they need more visual context, not just a status update.'}</Body>
                    </div>

                    <div className="loom-stack loom-stack--gap-2x">
                      <h4 className="insight-title">{'Testing the first prototype'}</h4>
                      <Body>{'I designed the export panel around that, then put it in front of users for feedback.'}</Body>
                    </div>

                    <LoomVideo src="/assets/loom/loom-export-prototype.mp4" ratio="16 / 9" cropEdgePx={3} />
                    <p className="loom-media-caption">{'Initial prototype'}</p>

                    <LoomNoteCard art={<LoomNoteIcon />} className="loom-note-card--tight" topic="User feedback">
                      {'I tested the prototype with 5 users, and the recurring feedback was too many choices at export caused hesitation and confusion about what to do next.'}
                    </LoomNoteCard>

                    <div className="loom-stack loom-stack--gap" style={{ marginTop: '78px' }}>
                      <h4 className="insight-title">{'Landing on the final solution'}</h4>
                      <Body>{'To reduce the thinking required for export, I divided the task to 2-step.'}</Body>
                      <ol className="loom-numbered-list">
                        <li>
                          <span className="loom-numbered-list__num">{'1'}</span>
                          <span>{'Display what’s worth flagging for export.'}</span>
                        </li>
                        <li>
                          <span className="loom-numbered-list__num">{'2'}</span>
                          <span>{'Choose preferred format of export with preview'}</span>
                        </li>
                      </ol>
                    </div>

                    {/* cropEdgePx repurposed for a plain 5% zoom, not border-hiding —
                        its scale(1 + cropEdgePx/400) formula makes 20 exactly 1.05x. */}
                    <LoomVideo src="/assets/loom/loom-export-final.mp4" ratio="16 / 9" cropEdgePx={20} />
                    <p className="loom-media-caption">{'Final design'}</p>

                    <Body className="loom-closer loom-stack--gap-2x">{'Considering the different roles on a creative team, I also envisioned what this panel would look like for each of them.'}</Body>

                    <LoomExportCycle />
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------- Intelligence */}
              <div className="framer-n9na3f" data-framer-name="Intelligence" id="intelligence">
                <div className="framer-1glwd7l">
                  <div className="framer-1warq6h">

                    <div className="framer-eahql">
                      <Eyebrow>{'How the intelligence works'}</Eyebrow>
                      <Title>
                        {'I designed the AI layer to do the part every other tool skips: '}
                        <span className="loom-highlight">{'read everything before doing anything.'}</span>
                      </Title>
                    </div>

                    <div className="loom-pair loom-pair--card">
                      <div className="loom-pair__col">
                        <Eyebrow>{'Principle 01'}</Eyebrow>
                        <h4 className="insight-title">{'Read everything before doing anything'}</h4>
                        <Body>{'Before Loom surfaces anything to the team, it ingests every input — briefs, references, decisions — and builds a picture of the whole project, not just the last thing uploaded.'}</Body>
                      </div>
                      <div className="loom-pair__col">
                        <Eyebrow>{'Principle 02'}</Eyebrow>
                        <h4 className="insight-title">{'Context travels with the work'}</h4>
                        <Body>{'As inputs move from one collaborator to the next, the AI maintains what was decided and why, so nobody reconstructs it manually on the other end.'}</Body>
                      </div>
                    </div>

                    {/* ------------------------------------------- 5b — the rubric */}
                    <div className="framer-eahql loom-stack--gap">
                      <Eyebrow>{'Evaluating the AI'}</Eyebrow>
                      <Title>
                        {'To design a useful product, I first '}
                        <span className="loom-highlight">{'built a rubric to evaluate the AI.'}</span>
                      </Title>
                      <Body>{'An evaluation framework is the infrastructure, to score every response for accuracy, relevance, and tone before it ships.'}</Body>
                    </div>

                    <div className="loom-stack loom-stack--gap" style={{ marginTop: '54px' }}>
                      <h4 className="insight-title">{'Test Scenario: Dog biscuit treat campaign'}</h4>
                      <Body>{'A creative lead is running a campaign for an independent premium dog treat brand. The client’s brief isn’t a clean direction doc; it’s a mix of strong opinions, anxieties, and unresolved questions.'}</Body>
                    </div>

                    <div className="loom-stack" style={{ marginTop: '54px' }}>
                      <h4 className="insight-title">{'Prompt Banks'}</h4>
                      <div className="loom-media" style={{ width: '100%', aspectRatio: '2868 / 1464', marginTop: '8px' } as React.CSSProperties}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/loom/loom-eval-board.png"
                          alt="Prompt bank spreadsheet — prompt, alternative phrasing, ChatGPT response, ideal Loom response, CTAs, data needed, and model architecture layer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    </div>

                    <div className="loom-stack" style={{ paddingRight: '15%', boxSizing: 'border-box', gap: '24px', marginTop: '54px' }}>
                      <h4 className="insight-title">{'3 golden queries'}</h4>
                      <Table
                        head={['', 'Query', 'Testing for']}
                        rows={[
                          ['01', <em key="q1">{'The client was really specific about what they don’t want. Check if anything on the board is going to set them off.'}</em>, 'Core scenario, natural phrasing'],
                          ['02', <em key="q2">{'Flag any references that contradict the client’s locked decisions or stated worries from the brief.'}</em>, 'Core scenario, direct command'],
                          ['03', <em key="q3">{'The creative director’s layouts look really clean and elevated. But the client was pretty firm about not going minimal white-on-white. Is this too close?'}</em>, 'Edge case — intentional tension'],
                        ]}
                      />
                    </div>

                    <div className="loom-stack" style={{ gap: '24px', marginTop: '54px' }}>
                      <h4 className="insight-title">{'6 acceptance criteria'}</h4>
                      <div className="loom-criteria">
                        {[
                          ['Accuracy', 'Every flag must trace to a real contradiction between an uploaded reference and a specific client statement. No invented conflicts, and nothing in the client’s open-questions territory counts as a violation.'],
                          ['Completion', 'All three planted conflicts must surface, each naming the team member responsible and citing the exact client language being violated. Missing one is a critical failure — that’s the misalignment that blows up in production.'],
                          ['Tone', 'It should read like a trusted colleague giving a pre-meeting heads-up, not a compliance audit, and should end by inviting the lead to decide.'],
                          ['Relevance', 'Every flag connects to the client’s own words. Generic design critique (“this typography lacks hierarchy”) and personal aesthetic opinion are failures, not bonuses.'],
                          ['Usefulness', 'It must surface the buried client quote a human would only catch by re-reading the whole brief, and rank by severity: violating a locked decision is worse than triggering a worry.'],
                          ['Empathy', 'Flagging a teammate’s work is inherently sensitive. Never “Sam’s work is wrong” or “Maya didn’t read the brief.” The flag is about the work’s fit for this client, never the quality of the work.'],
                        ].map(([name, desc]) => (
                          <div className="loom-criteria__item" key={name}>
                            <h5 className="loom-criteria__name">{name}</h5>
                            <p className="loom-criteria__body">{desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- Next Steps */}
              <div className="framer-dl8rqd" data-framer-name="Frame 2055246607" id="nextsteps">
                <div className="framer-a0h1dk" data-framer-name="Overview">
                  <Eyebrow>{'My Takeaways'}</Eyebrow>
                  <div className="framer-1vex2lg">
                    <Title>{'What I learned designing an AI product end to end'}</Title>
                  </div>
                </div>

                <div className="framer-1rc6mne">
                  <div className="framer-z42bak">
                    <Takeaway
                      title="The design file isn’t the end product anymore"
                      icon={
                        <svg className="takeaway-icon takeaway-icon--blue" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'Connecting Figma MCP to Cursor changed how I think about handoff. The file became the input to something that could be built and published directly from it — which meant I had to design with structure, not just with pixels.'}
                    </Takeaway>
                    <Takeaway
                      title="Vibe-coding early isn’t a shortcut. It’s a design tool."
                      icon={
                        <svg className="takeaway-icon takeaway-icon--green" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M8 6L3 12l5 6M16 6l5 6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'Testing ideas in a live environment earlier meant I was making better decisions in Figma, not just prettier ones. Motion, density, and latency are things you can only judge running.'}
                    </Takeaway>
                    <Takeaway
                      title="Keep iterating to refine the product’s craft."
                      icon={
                        <svg className="takeaway-icon takeaway-icon--amber" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 3a5 5 0 0 1 5 5c0 2-1 3-2 4s-1 2-1 3h-4c0-1 0-2-1-3s-2-2-2-4a5 5 0 0 1 5-5ZM10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    >
                      {'Making a product feel intentional and humane is still crucial — finding the right references, refining visuals, and tuning micro-animations is what makes it feel right.'}
                    </Takeaway>
                  </div>
                </div>

                <div className="loom-collapse-group">
                <LoomCollapse summary="If I had more time">
                  <ul className="loom-list">
                    <li>{'Generative brainstorm from the canvas — connect nodes, choose a generation type, get outcomes back onto the board. Designed, not built.'}</li>
                    <li>{'Design for edge scenarios: a nearly empty board, a contradictory brief, or a team that ignores every flag.'}</li>
                    <li>{'Refine visual details across states and densities.'}</li>
                    <li>{'Test with users and replace the build strip with real numbers.'}</li>
                  </ul>
                </LoomCollapse>

                <LoomCollapse summary="Business model & value proposition">
                  <ul className="loom-list">
                    <li>
                      <strong>{'Who pays — '}</strong>
                      {'creative leads and studios, seat-based, priced against the cost of the alignment meetings it removes.'}
                    </li>
                    <li>
                      <strong>{'Why they’d switch — '}</strong>
                      {'it doesn’t replace the tools work lives in; it sits between them and holds the context those tools drop.'}
                    </li>
                  </ul>
                  <div className="loom-media" style={{ width: '100%', aspectRatio: '2366 / 1648' } as React.CSSProperties}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/loom/loom-business-model-canvas.png"
                      alt="Business Model Canvas — key partnerships, activities, resources, value propositions, customer relationships, channels, segments, cost structure, and revenue streams"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <p className="loom-media-caption">{'Business Model Canvas'}</p>
                  <div className="loom-media" style={{ width: '100%', aspectRatio: '2363 / 1648' } as React.CSSProperties}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/loom/loom-value-proposition-canvas.png"
                      alt="Value Proposition Canvas — gain creators, products and services, pain relievers mapped against customer gains, jobs, and pains"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <p className="loom-media-caption">{'Value Proposition Canvas'}</p>
                </LoomCollapse>
                </div>

                <div className="next-on" style={{ marginTop: '124px' }}>
                  <Eyebrow>{'Next On'}</Eyebrow>
                  <div className="next-on__grid">
                    {PROJECTS.filter((p) => p.href === '/notestaboptimization' || p.href === '/grumble').map((project) => (
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
        <SideNav items={LOOM_NAV_ITEMS} className="framer-1dexa0q-container hidden-kbwdhd" revealAtId="loom-hero-mark" revealWhen="top" />
        <CaseStudyThemeToggle />
      </div>
    </>
  );
}
