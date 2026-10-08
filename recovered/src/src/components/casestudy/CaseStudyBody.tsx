import VideoAutoplay from '@/components/VideoAutoplay';
import AvatarStack from '@/components/casestudy/AvatarStack';
import Lemon8Highlight from '@/components/casestudy/Lemon8Highlight';
import CountUp from '@/components/casestudy/CountUp';
import HoverLiftGallery from '@/components/casestudy/HoverLiftGallery';
import FeedCardSpotlight from '@/components/casestudy/FeedCardSpotlight';
import PriorityTabs from '@/components/casestudy/PriorityTabs';
import SideNav, { CASE_STUDY_ITEMS } from '@/components/SideNav';
import CaseStudyThemeToggle from '@/components/casestudy/CaseStudyThemeToggle';
import { EyeIcon } from '@/components/icons/EyeIcon';
import { UserPlusIcon } from '@/components/icons/UserPlusIcon';
import { HeartIcon } from '@/components/icons/HeartIcon';
import { MessageCircleMoreIcon } from '@/components/icons/MessageCircleMoreIcon';
import ImpactStats from '@/components/casestudy/ImpactStats';
import ReachOutBanner from '@/components/casestudy/ReachOutBanner';
import InternDaysCollage from '@/components/casestudy/InternDaysCollage';
import { ProjectCard } from '@/components/ProjectGrid';
// PROJECTS comes from the plain data module, not ProjectGrid.tsx (a Client
// Component) — this file is a Server Component and filters the array at
// render time, which a client-module import cannot do (see projects-data.ts).
import { PROJECTS } from '@/components/projects-data';
import SiteFooter from '@/components/SiteFooter';

/**
 * Lemon8 — Notes Tab Optimization case study, ported from
 * https://www.cherryhu.com/notestaboptimization.
 *
 * Markup is generated from the live SSR output; see
 * scripts/html-to-jsx.mjs and scripts/build-casestudy-css.mjs. Class names and
 * inline styles are kept byte-faithful so the ported stylesheet lands exactly.
 */
export default function CaseStudyBody() {
  return (
    <>
      {/* Framer's runtime starts these; the ported markup keeps preload="none"
          and no autoplay attribute, so they need the same nudge as the homepage. */}
      <VideoAutoplay />
      <div data-framer-root="" className="framer-pR67w framer-kG5kC framer-GrUdX framer-QWUbN framer-IZNiQ framer-2Peb6 framer-psrovs" style={{"minHeight":"100vh","width":"auto"} as React.CSSProperties}>
        <div className="framer-1i2nfrz" data-framer-name="Body">
          <div className="framer-8a7cyu">
            <div className="framer-172orq5" data-framer-name="Body">
              <div className="framer-pmwlax">
                <div className="ssr-variant">
                  <div className="framer-1e9wpwg-container">
                    <div className="framer-q2Q3G framer-GrUdX framer-QWUbN framer-IZNiQ framer-kG5kC framer-v7emq4 framer-v-1i8q7h3" data-framer-name="1600" style={{"width":"100%"} as React.CSSProperties}>
                      <div className="framer-1khp1tx" data-framer-name="Title & Subtitle" id="hero-lockup">
                        <div className="hero-brand">
                          <img
                            id="lemon8-logo"
                            src="https://lf-lemon8-web-sg.ttwstatic.com/obj/lemon8-web-sg/lemon8_web/homepage/default/_assets/square_fullcolor-52301691b2b3e95ab8a6.png"
                            alt="Lemon8"
                            style={{"width":"16pt","height":"16pt","borderRadius":"22.37%","objectFit":"cover","flexShrink":0} as React.CSSProperties}
                          />
                          <p className="hero-kicker framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm">
                            <span className="hero-kicker__lead">{"Internship · "}</span>
                            <span className="hero-kicker__date">{"Shipped Q3 2025"}</span>
                          </p>
                        </div>
                        <div className="framer-1usj49e" data-framer-name="Build meaningful connections for Metro riders during 2028 LA Olympic" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","transform":"none"} as React.CSSProperties}>
                          <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-weight":"400","--framer-font-size":"24px"} as React.CSSProperties}>
                            {"Redesigning feed layout for notes"}
                          </h1>
                        </div>
                        <div className="framer-oieuo1" data-framer-name="Crafting playful transit ecosystem that reflects game atmosphere and sparks meaningful encounters between fans" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","transform":"none"} as React.CSSProperties}>
                          <p dir="auto" className="framer-text" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-line-height":"143%","--framer-font-size":"14px","--framer-text-color":"rgba(0, 0, 0, 0.8)"} as React.CSSProperties}>
                            {"Transforming browsing experience around density and hierarchy, shipping lifts in impressions, interactions, and account follows."}
                          </p>
                        </div>
                      </div>
                      <div className="framer-1xern0j-container">
                        <video src="/assets/media/FKLQw9C2bqQXwuMGULfPwPtF3uA.mp4" loop={true} preload="none" muted={true} playsInline={true} style={{"cursor":"auto","width":"100%","height":"auto","maxHeight":"100svh","aspectRatio":"1938 / 1080","borderRadius":"0px","display":"block","objectFit":"contain","backgroundColor":"rgba(0, 0, 0, 0)","objectPosition":"50% 50%"} as React.CSSProperties} />
                      </div>
                      <div className="framer-27g1vn" data-framer-name="Project Specs">
                        <div className="framer-1tnk8q6" data-framer-name="Role">
                          <div className="framer-zay5w8" data-framer-name="Role" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"0.4","transform":"none"} as React.CSSProperties}>
                            <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                              {"Role"}
                            </h5>
                          </div>
                          <div className="framer-1wu4kjx" data-framer-name="Product Designer" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"1","transform":"none"} as React.CSSProperties}>
                            <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{"--framer-text-color":"rgba(0, 0, 0, 0.8)","--framer-font-size":"14px"} as React.CSSProperties}>
                              {"Product Designer"}
                            </p>
                          </div>
                        </div>
                        <div className="framer-1ktr60o" data-framer-name="TImeline">
                          <div className="framer-1o0o22o" data-framer-name="Timeline" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"0.4","transform":"none"} as React.CSSProperties}>
                            <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                              {"Timeline"}
                            </h5>
                          </div>
                          <div className="framer-1ymnqq3" data-framer-name="Frame 2055246569" style={{"opacity":"1"} as React.CSSProperties}>
                            <div className="framer-1epxt81" data-framer-name="August 2025 - September 2025" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"1","transform":"none"} as React.CSSProperties}>
                              <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{"--framer-text-color":"rgba(0, 0, 0, 0.8)","--framer-font-size":"14px"} as React.CSSProperties}>
                                {"Aug - Sep 2025"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="framer-jml36l" data-framer-name="Team">
                          <div className="framer-im7ssv" data-framer-name="Team" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"0.4","transform":"none"} as React.CSSProperties}>
                            <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                              {"Collaboration"}
                            </h5>
                          </div>
                          <div className="framer-qfuc9h" data-framer-name="Frame 2055246568" style={{"opacity":"1"} as React.CSSProperties}>
                            <div className="framer-bgqfx2" data-framer-name="Athena Wu" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"1","transform":"none"} as React.CSSProperties}>
                              <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{"--framer-text-color":"rgba(0, 0, 0, 0.8)","--framer-font-size":"14px"} as React.CSSProperties}>
                                {"Software Engineer"}
                              </p>
                            </div>
                            <div className="framer-1ii04u1" data-framer-name="Silvia Liang" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"1","transform":"none"} as React.CSSProperties}>
                              <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{"--framer-text-color":"rgba(0, 0, 0, 0.8)","--framer-font-size":"14px"} as React.CSSProperties}>
                                {"Product Manager"}
                              </p>
                            </div>
                            <div className="framer-1o2okai" data-framer-name="Silvia Liang" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"1","transform":"none"} as React.CSSProperties}>
                              <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{"--framer-text-color":"rgba(0, 0, 0, 0.8)","--framer-font-size":"14px"} as React.CSSProperties}>
                                {"Data Scientist"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="framer-tt0uke" data-framer-name="Leveraged Skills">
                          <div className="framer-1tj8rqg" data-framer-name="Leveraged Skills" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"0.4","transform":"none"} as React.CSSProperties}>
                            <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                              {"Focused Platform"}
                            </h5>
                          </div>
                          <div className="framer-18q5dsp" data-framer-name="Frame 2055246567" style={{"opacity":"1"} as React.CSSProperties}>
                            <div className="framer-1qturnr" data-framer-name="iOS, Android" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","transform":"none"} as React.CSSProperties}>
                              <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto" style={{"--framer-text-color":"rgba(0, 0, 0, 0.8)","--framer-font-size":"14px"} as React.CSSProperties}>
                                {"iOS, Android"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="framer-1x0zakg" data-framer-name="Overview" id="overview">
                <div className="framer-17c4zpy" data-framer-name="Title">
                  <div className="framer-ru31jt" data-framer-name="Overview" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                    <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                      {"Overview"}
                    </h5>
                  </div>
                </div>
                <div className="framer-6dezqx">
                  <div className="framer-3eslqg">
                    <div className="overview-lockup">
                    <div className="ssr-variant">
                      <div className="framer-46lolm" data-framer-name="Reimagining a more joyful and meaningful rider experience for LA Olympics." data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto" style={{"--framer-font-weight":"400"} as React.CSSProperties}>
                          <Lemon8Highlight />
                          {" is a global lifestyle community app powered by TikTok, where millions of users turn for honest, hot-take recommendations on beauty, fashion, and travel."}
                        </h1>
                      </div>
                    </div>
                    <div className="framer-rretb7" data-framer-name={"Pocket-sized wearable designed to turn the utilitarian \"dead time\" of an Olympic commute into a series of meaningful \"Ups\". It senses when you cross paths with other fans, noticing patterns you can’t see and sparking connections when the moment is right."} data-framer-component-type="RichTextContainer" style={{"transform":"none","opacity":1} as React.CSSProperties}>
                      <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                          {"Within the app, there’s a feature named "}
                          <span style={{"whiteSpace":"nowrap"} as React.CSSProperties}>
                            <span className="notes-inline-icon" aria-hidden="true" />
                            {"Notes"}
                          </span>
                          {": a space for low-effort, everyday sharing, opening content creation beyond creators to everyday users."}
                      </p>
                    </div>
                    </div>
                    <div className="framer-1pz1ikq" style={{"marginTop":"10px"} as React.CSSProperties}>
                      <div className="framer-dla3de-container">
                        <video src="/assets/media/hptJY3Vm2UDyzYhTDgG2WF8wIfo.mp4" data-end-hold-ms="3000" preload="none" poster="/assets/images/C8DZydSLrevzUYnZZpu1Ol0JA5Y.png" muted={true} playsInline={true} style={{"cursor":"auto","width":"100%","height":"100%","borderRadius":"0px","display":"block","objectFit":"cover","backgroundColor":"rgba(0, 0, 0, 0)","objectPosition":"50% 50%","aspectRatio":"2160 / 2160"} as React.CSSProperties} />
                      </div>
                      <div className="framer-hklips-container" style={{"aspectRatio":"1","width":"100%","height":"auto"} as React.CSSProperties}>
                        <HoverLiftGallery />
                      </div>
                      <p className="overview-video-caption">{"Switching to Notes Tab"}</p>
                      <p className="overview-video-caption overview-gallery-caption">{"Scroll down to view more notes"}</p>
                    </div>

                  </div>
                </div>
              </div>
              <div className="framer-15t1wvj" data-framer-name="Problem" id="problem">
                <div className="framer-cx1uo5" data-framer-name="Section 1" id="problem-1">
                  <div className="framer-9bne5l" data-framer-name="Title">
                    <div className="framer-1orqqu7" data-framer-name="Frame 2055246596">
                      <div className="framer-hu56uv" data-framer-name="Overview">
                        <div className="framer-1n1e69t" data-framer-name="The Current Space" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                            {"The Problem"}
                          </h5>
                        </div>
                        <div className="framer-m6t011" data-framer-name="Frame 2055246585">
                          <div className="ssr-variant">
                            <div className="framer-1h3s6wv" data-framer-name="Only 6.8% of visitors consider LA Metro as their transportation options." data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                              <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                                {"Users flocked into Notes, then "}
                                <span style={{"--framer-text-color":"rgb(254, 43, 85)"} as React.CSSProperties} className="framer-text">
                                  {"stopped scrolling, and stopped coming back"}
                                </span>
                                <img
                                  decoding="async"
                                  loading="lazy"
                                  width="292"
                                  height="224"
                                  src="/assets/images/jFTiux81pFZwOwPmBZzfHdGVSRU.png"
                                  alt=""
                                  style={{"display":"inline-block","height":"0.93em","width":"auto","verticalAlign":"middle","objectFit":"contain","margin":"0 0 0 0.2em","position":"relative","top":"-2px"} as React.CSSProperties}
                                />
                              </h1>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="framer-1sfabqy" data-framer-name={"Pocket-sized wearable designed to turn the utilitarian \"dead time\" of an Olympic commute into a series of meaningful \"Ups\". It senses when you cross paths with other fans, noticing patterns you can’t see and sparking connections when the moment is right."} data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                    <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                      {"When the first few notes don't resonates, the interest is missed early, retention and scroll depth decline fast..."}
                    </p>
                  </div>
                </div>
                <div className="framer-xnrdk3" data-framer-name="Section 1" id="problem-2">
                  <div className="framer-786ynq" data-framer-name="Title">
                    <div className="framer-1a4t7ip" data-framer-name="Frame 2055246596">
                      <div className="framer-1ucdwph" data-framer-name="Overview">
                        <div className="framer-15aizkx" data-framer-name="The Current Space" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                            {"Key Findings"}
                          </h5>
                        </div>
                        <div className="framer-18fmlck" data-framer-name="Frame 2055246585">
                          <div className="ssr-variant">
                            <div className="framer-6mmzhv" data-framer-name="Only 6.8% of visitors consider LA Metro as their transportation options." data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                              <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                                {"In the feed, every element competed for the user's attention."}
                              </h1>
                            </div>
                          </div>
                        </div>
                        <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                            {"Good information hierarchy isn't about making everything stand out, it's about letting users see what interests them faster."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <PriorityTabs>
                    <article className="insight">
                      <header className="insight-copy">
                        <p className="insight-kicker">Insight 01</p>
                        <h4 className="insight-title">Screen density limited content exposure.</h4>
                        <p className="insight-desc">
                          At 1.5–2.5 notes per screen, each user gets very few chances to capture interest before giving up and scrolling down.
                        </p>
                      </header>
                      <div className="insight-card">
                        <div className="framer-j2bscq" data-framer-name="image 1036">
                          <div style={{"position":"absolute","borderRadius":"inherit","cornerShape":"inherit","top":"0","right":"0","bottom":"0","left":"0"} as React.CSSProperties} data-framer-background-image-wrapper="true">
                            <img decoding="async" loading="lazy" width="529" height="1024" srcSet="/assets/images/lemon8-must-have.png 529w" src="/assets/images/lemon8-must-have.png" alt="" style={{"display":"block","width":"100%","height":"100%","borderRadius":"inherit","cornerShape":"inherit","objectPosition":"top","objectFit":"contain"} as React.CSSProperties} />
                          </div>
                        </div>
                      </div>
                    </article>
                    <article className="insight">
                      <header className="insight-copy">
                        <p className="insight-kicker">Insight 02</p>
                        <h4 className="insight-title">Identity of publisher outranked the content.</h4>
                        <p className="insight-desc">
                          From viewer pov, the who took a full line. The what had to wait.
                        </p>
                      </header>
                      <div className="insight-card">
                        <div className="framer-12kbh01" data-framer-name="image 1036">
                          <FeedCardSpotlight src="/assets/images/lemon8-feed-card.png" width={1024} height={854} />
                        </div>
                      </div>
                    </article>
                  </PriorityTabs>
                </div>
                <div className="framer-14g8ken" data-framer-name="Section 1" id="problem-3">
                  <div className="framer-12fz1st" data-framer-name="Title">
                    <div className="framer-1wp7462" data-framer-name="Frame 2055246596">
                      <div className="framer-181flj4" data-framer-name="Overview">
                        <div className="framer-152w3og" data-framer-name="The Current Space" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                            {"Design problem i worked with…"}
                          </h5>
                        </div>
                        <div className="framer-1133x8x" data-framer-name="Frame 2055246585">
                          <div className="ssr-variant">
                            <div className="framer-r8rdvc" data-framer-name="Only 6.8% of visitors consider LA Metro as their transportation options." data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                              <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                                {"How might we attract more users"}
                                <AvatarStack />
                                {" to consume and engage"}
                                {/* Desktop only (>=1200px, this page's own breakpoint —
                                    see casestudy.css) — forces the line to end at "engage"
                                    regardless of how much room the rest would otherwise
                                    fit; hidden below that width so the sentence wraps
                                    naturally on its own instead. */}
                                <br className="hmw-break-desktop" aria-hidden="true" />
                                {" with notes content upon first glance?"}
                              </h1>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="framer-i0ln55" data-framer-name="Solution 1" id="solution">
                <div className="framer-3ldyg4" data-framer-name="Overview">
                  <div className="framer-1yvw69s">
                    <div className="framer-bsukui" data-framer-name="Core Flows" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                        {"Key Solutions"}
                      </h5>
                    </div>
                    <div className="ssr-variant">
                      <div className="framer-zbvp3o" data-framer-name="01 Pair Olympin" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto" style={{"--framer-text-color":"var(--token-79b55610-4d12-4136-8f33-e70527cb72e9, rgb(37, 38, 38))"} as React.CSSProperties}>
                          {"Re-sequence the feed: content first, identity after."}
                        </h1>
                      </div>
                    </div>
                    <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                        {"Both insights pointed at the same root cause — the layout hadn't decided what mattered. Every change below follows from fixing that order."}
                      </p>
                    </div>
                  </div>
                  <div className="framer-1wocbg4-container">
                    <video src="/assets/media/7P5zNlouKbTdmjI9ZSPRAbPkPJk.mp4" loop={true} preload="none" muted={true} playsInline={true} style={{"cursor":"auto","width":"100%","height":"100%","borderRadius":"0px","display":"block","objectFit":"cover","backgroundColor":"rgba(0, 0, 0, 0)","objectPosition":"50% 50%","aspectRatio":"2560 / 1440"} as React.CSSProperties} />
                  </div>
                </div>
              </div>
              <div className="framer-evphwi" data-framer-name="Overview">
                <div className="framer-1muivw2">
                  <div className="ssr-variant">
                    <div className="framer-13epvno" data-framer-name="01 Pair Olympin" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                        {"01 Let content lead"}
                      </h1>
                    </div>
                  </div>
                  <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                    <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                      {"The image and caption move to the top of the card, taking the space identity used to hold. Nothing is removed — the order changes, so what stops a scroll arrives first."}
                    </p>
                  </div>
                </div>
                <div className="framer-byw6q3">
                  <div className="ssr-variant">
                    <div className="framer-dlrc4n" style={{"height":"auto","aspectRatio":"1.7777777777777777"} as React.CSSProperties}>
                      <div style={{"position":"absolute","borderRadius":"inherit","cornerShape":"inherit","top":"0","right":"0","bottom":"0","left":"0"} as React.CSSProperties} data-framer-background-image-wrapper="true">
                        <img decoding="async" loading="lazy" width="5120" height="2880" sizes="(min-width: 1200px) and (max-width: 1479.98px) max(100vw - 560px, 1px), (min-width: 1480px) and (max-width: 1599.98px) max(100vw - 760px, 1px), (min-width: 1600px) max(100vw - 960px, 1px), (max-width: 1199.98px) max(100vw - 40px, 1px)" srcSet="/assets/media/01.png 5120w" src="/assets/media/01.png" alt="Before and after of the Notes feed: identity sits above the post on the left; on the right, identity frames the content so the caption and images lead." style={{"display":"block","width":"100%","height":"100%","borderRadius":"inherit","cornerShape":"inherit","objectPosition":"center","objectFit":"contain"} as React.CSSProperties} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div className="framer-1dcww5q" data-framer-name="Solution 2">
                <div className="framer-7sco64" data-framer-name="Overview">
                  <div className="ssr-variant">
                    <div className="framer-v1i394" data-framer-name="02 Set up your mood profile" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                        {"02 Fit more chances per screen"}
                      </h1>
                    </div>
                  </div>
                  <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                    <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                      {"Tightening spacing between username, caption, and media raised notes per screen from ~1.8 to ~2.2. Each additional note is another chance for something to land before a user leaves."}
                    </p>
                  </div>
                  <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                    <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                      {"The constraint was readability: past a certain point, denser stops meaning more seen and starts meaning nothing read."}
                    </p>
                  </div>
                </div>
                <div className="framer-eusxlf">
                  <div className="ssr-variant">
                    <div className="framer-1epmeva" style={{"height":"auto","aspectRatio":"1.7777777777777777"} as React.CSSProperties}>
                      <div style={{"position":"absolute","borderRadius":"inherit","cornerShape":"inherit","top":"0","right":"0","bottom":"0","left":"0"} as React.CSSProperties} data-framer-background-image-wrapper="true">
                        <img decoding="async" loading="lazy" width="5120" height="2880" sizes="(min-width: 1200px) and (max-width: 1479.98px) calc(100vw - 560px), (min-width: 1480px) and (max-width: 1599.98px) calc(100vw - 760px), (min-width: 1600px) calc(100vw - 960px), (max-width: 1199.98px) calc(100vw - 40px)" srcSet="/assets/media/02.png 5120w" src="/assets/media/02.png" alt="Before and after of the Notes feed: tighter spacing raises notes per screen from about 1.8 to about 2.2." style={{"display":"block","width":"100%","height":"100%","borderRadius":"inherit","cornerShape":"inherit","objectPosition":"center","objectFit":"contain"} as React.CSSProperties} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="framer-3b99r3" data-framer-name="Solution 3">
                <div className="framer-1sfsxge" data-framer-name="Overview">
                  <div className="ssr-variant">
                    <div className="framer-uut8s9" data-framer-name="03 Cross path other Olympin users to ignite the torch" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                        {"03 Return identity after the read"}
                      </h1>
                    </div>
                  </div>
                  <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                    <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                      {"Identity doesn't disappear — it surfaces once a user has engaged with the content, so recognition feels earned rather than announced. Follow rate rose 5.1%."}
                    </p>
                  </div>
                </div>
                <div className="framer-87u92q">
                  <div className="ssr-variant">
                    <div className="framer-1uw4o9d" style={{"height":"auto","aspectRatio":"5184 / 2976"} as React.CSSProperties}>
                      <div style={{"position":"absolute","borderRadius":"inherit","cornerShape":"inherit","top":"0","right":"0","bottom":"0","left":"0"} as React.CSSProperties} data-framer-background-image-wrapper="true">
                        <img decoding="async" loading="lazy" width="5184" height="2976" sizes="(min-width: 1200px) and (max-width: 1479.98px) calc(100vw - 560px), (min-width: 1480px) and (max-width: 1599.98px) calc(100vw - 760px), (min-width: 1600px) calc(100vw - 960px), (max-width: 1199.98px) calc(100vw - 40px)" srcSet="/assets/media/03.png 5184w" src="/assets/media/03.png" alt="Lemon8 post with callouts: a larger avatar and follow button, caption and image leading before identity, and likes as interest rather than trust." style={{"display":"block","width":"100%","height":"100%","borderRadius":"inherit","cornerShape":"inherit","objectPosition":"center","objectFit":"contain"} as React.CSSProperties} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="framer-n9na3f" data-framer-name="Research" id="research">
                <div className="framer-1glwd7l" data-framer-name="Overview">
                  <div className="framer-1warq6h">
                    <div className="framer-eahql">
                      <div className="framer-ej0lpn" data-framer-name="Ideation" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                          {"Research & process"}
                        </h5>
                      </div>
                      <div className="ssr-variant">
                        <div className="framer-3auw2d" data-framer-name="How might we enhance social engagement and sense of belonging for young people during transit rides?" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                            {"How does hierarchy differ across platforms and what does each optimize for?"}
                          </h1>
                        </div>
                      </div>
                      <div className="framer-1sfabqy" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                          {"I looked at how leading platforms structure their feeds, not just for layout patterns but for what each was optimizing to prioritize."}
                        </p>
                      </div>
                    </div>
                    <div className="hierarchy-compare">
                      <article className="hierarchy-compare__col">
                        <div className="hierarchy-compare__copy">
                          <p className="insight-kicker">{"Groups 01"}</p>
                          <h3 className="insight-title">{"Content leads, identity follows"}</h3>
                          <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                            {"What's said matters more than who said it"}
                          </p>
                        </div>
                        <div className="hierarchy-compare__frame">
                          <img
                            src="/assets/images/content-leads-identity-follows.png"
                            alt="Threads and Reddit posts, where the content sits above who posted it."
                            width={1024}
                            height={689}
                          />
                        </div>
                      </article>
                      <article className="hierarchy-compare__col">
                        <div className="hierarchy-compare__copy">
                          <p className="insight-kicker">{"Groups 02"}</p>
                          <h3 className="insight-title">{"Identity carries the content"}</h3>
                          <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                            {"Who said it shapes how it reads"}
                          </p>
                        </div>
                        <div className="hierarchy-compare__frame">
                          <img
                            src="/assets/images/identity-carries-the-content.png"
                            alt="X and Facebook posts, where identity frames how the content reads."
                            width={1024}
                            height={703}
                          />
                        </div>
                      </article>
                    </div>
                    <div className="hierarchy-spec">
                      <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                        {"I compared how each platform decides what gets read first."}
                      </h1>
                      <div className="hierarchy-compare__frame">
                        <img
                          src="/assets/images/design-specs-x.png"
                          alt="Annotated X post showing identity first, then text, then images, then engagement counts."
                          width={2100}
                          height={1316}
                        />
                      </div>
                    </div>
                  </div>
                  <ReachOutBanner variant="quote" />
              <ImpactStats>
              <div className="framer-1e75ldm" data-framer-name="Measuring Success">
                <div className="framer-ul405g" data-framer-name="Goal" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                  <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"120%","--framer-text-transform":"none"} as React.CSSProperties} className="framer-text">
                    {"Impact"}
                  </p>
                </div>
                <div className="framer-1vatj0o" data-framer-name="Frame 2055246575">
                  <div className="framer-1uckkl2" data-framer-name="Frame 2055246572">
                    <div className="impact-stat__value">
                      <div className="framer-wn3j36" data-framer-name="+6.61%" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"28px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                          <CountUp value={6.61} decimals={2} prefix="+" suffix="%" delay={0} />
                        </p>
                      </div>
                      <EyeIcon size={13} className="impact-stat__icon" />
                      <div className="framer-4hpruo impact-stat__label" data-framer-name="Client Impressions / User" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"14px","--framer-line-height":"120%"} as React.CSSProperties} className="framer-text">
                          {"Impressions per user"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="framer-m2b86n" data-framer-name="Frame 2055246573">
                    <div className="impact-stat__value">
                      <div className="framer-15909ui" data-framer-name="+5.1%" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"28px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                          <CountUp value={5.1} decimals={1} prefix="+" suffix="%" delay={0.1} />
                        </p>
                      </div>
                      <UserPlusIcon size={13} className="impact-stat__icon" />
                      <div className="framer-115da3j impact-stat__label" data-framer-name="Follow User" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"14px","--framer-line-height":"120%"} as React.CSSProperties} className="framer-text">
                          {"Accounts followed"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="framer-1e12s7x" data-framer-name="Frame 2055246574">
                    <div className="impact-stat__value">
                      <div className="framer-16s27jn" data-framer-name="+2.5%" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"28px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                          <CountUp value={2.5} decimals={1} prefix="+" suffix="%" delay={0.2} />
                        </p>
                      </div>
                      <HeartIcon size={13} className="impact-stat__icon" />
                      <div className="framer-uqwvoe impact-stat__label" data-framer-name="Notes Likes" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"14px","--framer-line-height":"120%"} as React.CSSProperties} className="framer-text">
                          {"Likes"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="framer-2jf91k" data-framer-name="Frame 2055246576">
                    <div className="impact-stat__value">
                      <div className="framer-2jf91l" data-framer-name="+3.9%" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"28px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                          <CountUp value={3.9} decimals={1} prefix="+" suffix="%" delay={0.3} />
                        </p>
                      </div>
                      <MessageCircleMoreIcon size={13} className="impact-stat__icon" />
                      <div className="framer-2jf91m impact-stat__label" data-framer-name="Notes Comments" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"14px","--framer-line-height":"120%"} as React.CSSProperties} className="framer-text">
                          {"Comments"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </ImpactStats>
                  <div className="framer-dl8rqd" data-framer-name="Frame 2055246607" id="nextsteps">
                <div className="framer-a0h1dk" data-framer-name="Overview">
                  <div className="framer-a88617" data-framer-name="My Takeaways" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                    <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
                      {"My Takeaways"}
                    </h5>
                  </div>
                  <div className="framer-1vex2lg" data-framer-name="Frame 2055246585">
                    <div className="ssr-variant">
                      <div className="framer-1ifj68x" data-framer-name="What I learned from Olympin." data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                          {"What I learned from notes layout optimization"}
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="framer-1rc6mne">
                  <div className="framer-z42bak">
                    <div className="framer-107fbv6" data-framer-name="Frame 2055246582">
                      <svg className="takeaway-icon takeaway-icon--blue" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M20 20L16.05 16.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <div className="framer-agm7ow" data-framer-name="Frame 2055246622">
                        <div className="framer-1k6k2mx" data-framer-name="Prioritize user value and needs to align with brand" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <h4 className="insight-title">
                            {"Knowing what's worth fixing matters more than fixing it well."}
                          </h4>
                        </div>
                      </div>
                      <div className="framer-r3wi34" data-framer-name="I learned to view the physical device, digital interface, and brand narrative as a single, holistic experience rather than separate deliverables. This project challenged me to think beyond UI/UX and adopt a product mindset—ensuring that the hardware and software work in harmony to solve a social problem." data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                          {"I came in with 8+ things to improve. Most were real problems, but only a few would move what Notes was measured on. Sorting them against product goals meant dropping ideas I liked."}
                        </p>
                      </div>
                    </div>
                    <div className="framer-1owjcv7" data-framer-name="Frame 2055246622">
                      <svg className="takeaway-icon takeaway-icon--green" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 3V20M12 20H7M12 20H17M3 6H7.52786C7.83835 6 8.14458 5.92771 8.42229 5.78885L9.57771 5.21115C9.85542 5.07229 10.1616 5 10.4721 5H13.5279C13.8384 5 14.1446 5.07229 14.4223 5.21115L15.5777 5.78885C15.8554 5.92771 16.1616 6 16.4721 6H21M5.5 6L3.02044 13.4387C2.71808 14.3458 3.08919 15.3834 4.00531 15.657C5.01171 15.9577 5.98829 15.9577 6.99469 15.657C7.91081 15.3834 8.28192 14.3457 7.97956 13.4387L5.5 6ZM18.5 6L16.0204 13.4387C15.7181 14.3458 16.0892 15.3834 17.0053 15.657C18.0117 15.9577 18.9883 15.9577 19.9947 15.657C20.9108 15.3834 21.2819 14.3457 20.9796 13.4387L18.5 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="framer-1tcxjbu" data-framer-name="Frame 2055246622">
                        <div className="framer-16fijwf" data-framer-name="Efficient way to connect people" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <h4 className="insight-title">
                            {"Every change costs something. Pick the cost on purpose."}
                          </h4>
                        </div>
                      </div>
                      <div className="framer-1ylpzqk" data-framer-name={"The Metro was built for efficiency, but it lacks \"social soul\". This project reminded me that designing for humans starts with honoring the need for belonging. By focusing on social comfort and serendipity, I learned that a product’s value isn't just in what it does, but in how it makes people feel present and connected."} data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                          {"Density costs readability. Moving identity later costs immediate recognition. The work wasn't avoiding those trade-offs — it was choosing which one to accept, and defending it."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="framer-1vex2lg" data-framer-name="Frame 2055246586">
                  <div className="ssr-variant">
                    <div className="framer-1ifj68x" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                        {"How I would do it differently with "}
                        <span className="ai-gradient">{"AI"}</span>
                      </h1>
                    </div>
                  </div>
                  <div className="framer-107fbv6" data-framer-name="Frame 2055246582">
                    <div className="framer-agm7ow" data-framer-name="Frame 2055246622">
                      <div className="framer-1k6k2mx" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                        <h4 className="insight-title">
                          {"Test every content type, not just the clean one."}
                        </h4>
                      </div>
                    </div>
                    <div className="framer-r3wi34" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                        {"Density isn't just px gaps— quotes, reposts, and multi-image notes all size differently. I built those variants in Figma. AI could generate them from a matrix and stress-test the string limits before handoff."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="framer-1vex2lg" data-framer-name="My intern days at Lemon8">
                  <div className="ssr-variant">
                    <div className="framer-1ifj68x" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto">
                        {"My intern days at Lemon8"}
                      </h1>
                    </div>
                  </div>
                  <InternDaysCollage />
                </div>
              </div>
                  <div className="framer-1ti84qb">
                    <div className="framer-nrtzla">
                      <div className="ssr-variant">
                        <div className="framer-1ur5v20" data-framer-name="How might we enhance social engagement and sense of belonging for young people during transit rides?" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <h1 className="framer-text framer-styles-preset-12321e8" data-styles-preset="VfH5n_Oq4" dir="auto" style={{"--framer-text-color":"var(--token-79b55610-4d12-4136-8f33-e70527cb72e9, rgb(37, 38, 38))"} as React.CSSProperties}>
                            {"Other designs I did at Lemon8…"}
                          </h1>
                        </div>
                      </div>
                    </div>
                    <div className="other-designs-grid">
                    <div className="other-designs-row">
                      <div className="framer-o1dv59 other-designs-stage">
                        <img
                          className="other-designs-stage__bg"
                          decoding="async"
                          loading="lazy"
                          width="4800"
                          height="4800"
                          src="/assets/images/Onboarding-BG.png?v=2"
                          alt=""
                        />
                        <video
                          className="other-designs-stage__video"
                          src="/assets/media/Onboarding.mp4?v=2"
                          width={500}
                          height={1080}
                          loop={true}
                          preload="metadata"
                          muted={true}
                          playsInline={true}
                          aria-label="Lemon8 onboarding"
                        />
                      </div>
                      <div className="framer-107fbv6" data-framer-name="Frame 2055246582">
                        <div className="framer-agm7ow" data-framer-name="Frame 2055246622">
                          <div className="framer-1k6k2mx" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                            <h4 className="insight-title">
                              {"Understanding user preferences for a better feed"}
                            </h4>
                          </div>
                        </div>
                        <div className="framer-r3wi34" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                            {"Users skip interest questions at signup, so the feed starts generic. We ask again in-feed, once the payoff is easier to see — and the feed gets sharper from there."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="other-designs-row">
                      <div className="framer-o1dv59 other-designs-stage">
                        <img
                          className="other-designs-stage__bg"
                          decoding="async"
                          loading="lazy"
                          width="4800"
                          height="4800"
                          src="/assets/images/Search-BG.png"
                          alt=""
                        />
                        <video
                          className="other-designs-stage__video"
                          src="/assets/media/Search.mp4"
                          width={500}
                          height={1080}
                          loop={true}
                          preload="metadata"
                          muted={true}
                          playsInline={true}
                          aria-label="Lemon8 search"
                        />
                      </div>
                      <div className="framer-107fbv6" data-framer-name="Frame 2055246582">
                        <div className="framer-agm7ow" data-framer-name="Frame 2055246622">
                          <div className="framer-1k6k2mx" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                            <h4 className="insight-title">
                              {"Recognizing search intent, made easier"}
                            </h4>
                          </div>
                        </div>
                        <div className="framer-r3wi34" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                          <p className="framer-text framer-styles-preset-ybrah6" data-styles-preset="ix87J7P54" dir="auto">
                            {"Users often screenshot content just to search it elsewhere. I brainstormed how to bring the search in-app: hold a card for similar results, or screenshot page to trigger search image."}
                          </p>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                  <div className="next-on">
                    <div className="framer-ul405g" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                      <p dir="auto" style={{"--font-selector":"R0Y7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"120%","--framer-text-transform":"none"} as React.CSSProperties} className="framer-text">
                        {"Next On"}
                      </p>
                    </div>
                    <div className="next-on__grid">
                      {PROJECTS.filter((p) => p.brand === 'TikTok' || p.brand === 'Loom').map((project) => (
                        <ProjectCard
                          key={project.brand}
                          project={
                            project.brand === 'TikTok'
                              ? { ...project, context: 'Design for login signup page with visual refresh' }
                              : project.brand === 'Loom'
                                ? { ...project, context: 'xyz and xyz' }
                                : project
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SiteFooter />
        <a className="framer-1sfw5kb framer-rdyw4y" href="/#projects" aria-label="Back to projects">
          <div className="ssr-variant">
            <div className="framer-fd1twv-container" style={{"willChange":"transform","opacity":"1","transform":"none"} as React.CSSProperties}>
              <div className="framer-YerRY framer-4z4bep framer-v-4z4bep" data-framer-name="Variant 1" style={{"width":"100%","borderBottomLeftRadius":"100px","borderBottomRightRadius":"100px","borderTopLeftRadius":"100px","borderTopRightRadius":"100px"} as React.CSSProperties}>
                <div className="framer-1um1tvy" data-framer-name="back-icon">
                  <div className="framer-129qaqh" data-framer-name="Component 1">
                    <div data-framer-component-type="SVG" data-framer-name="svg-844649026_806" className="framer-wxuqll" aria-hidden="true" style={{"imageRendering":"pixelated","flexShrink":"0","backgroundSize":"100% 100%","backgroundImage":"url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%220 0 9 7%22><g><path d=%22M 0 7 L 0 0 L 9 0 L 9 7 Z%22 fill=%22transparent%22></path><path d=%22M 0.804 2.706 L 0.468 3.042 L 0.133 2.706 L 0.468 2.372 Z M 8.866 6.502 C 8.876 6.676 8.787 6.842 8.637 6.932 C 8.486 7.022 8.299 7.022 8.149 6.932 C 7.998 6.842 7.91 6.676 7.919 6.502 Z M 2.838 5.413 L 0.468 3.042 L 1.139 2.371 L 3.51 4.742 Z M 0.468 2.372 L 2.838 0 L 3.51 0.671 L 1.137 3.041 L 0.467 2.369 Z M 0.804 2.232 L 5.546 2.232 L 5.546 3.18 L 0.804 3.18 Z M 8.866 5.552 L 8.866 6.502 L 7.919 6.502 L 7.919 5.552 Z M 5.546 2.232 C 7.379 2.232 8.866 3.719 8.866 5.552 L 7.919 5.552 C 7.919 4.923 7.668 4.32 7.223 3.875 C 6.778 3.43 6.175 3.18 5.546 3.18 Z%22 fill=%22rgba(0,0,0,0.35)%22></path></g></svg>')"} as React.CSSProperties} />
                  </div>
                </div>
                <div className="framer-8mwocq" data-framer-component-type="RichTextContainer" style={{"--extracted-r6o4lv":"var(--variable-reference-gos0GQJWh-oZTIdW1xS)","--framer-link-text-color":"rgb(0, 153, 255)","--framer-link-text-decoration":"underline","--variable-reference-gos0GQJWh-oZTIdW1xS":"rgba(0, 0, 0, 0.35)","transform":"none"} as React.CSSProperties}>
                  <p dir="auto" className="framer-text" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-text-alignment":"right","--framer-text-color":"var(--extracted-r6o4lv, var(--variable-reference-gos0GQJWh-oZTIdW1xS))"} as React.CSSProperties}>
                    {"Back"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </a>
        <SideNav items={CASE_STUDY_ITEMS} className="framer-1dexa0q-container hidden-kbwdhd" revealAtId="lemon8-logo" revealWhen="top" />
        <CaseStudyThemeToggle />
      </div>
    </>
  );
}









