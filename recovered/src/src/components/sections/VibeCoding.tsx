import VaultLink from '@/components/VaultLink';
import WritingLink from '@/components/WritingLink';
import OtherDesigns, { PinchPrototype } from '@/components/OtherDesigns';

/** An empty square for a prototype still being built: a wrench and "In
 *  development" in its centre until its media lands. */
function PrototypeSlot({ n }: { n: 2 | 3 }) {
  return (
    <div className={`prototype-slot prototype-slot--${n}`}>
      <span className="prototype-slot__badge">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        In development
      </span>
    </div>
  );
}

/**
 * Three hand-drawn sparkles after the Playground heading, in outline only with
 * round pencil-like strokes: a larger four-pointed star on the left, and to its
 * right a small plus above and a small star below, not quite lined up. Each point is drawn a touch uneven (the bottom one longest), like a quick
 * doodle. They twinkle gently, out of step (see .twinkle in globals.css).
 */
function star(cx: number, cy: number, r: number, wobble = 0) {
  // Top, right, bottom, left points; the curves pinch in toward the centre.
  const top = [cx + wobble * 0.3, cy - r];
  const right = [cx + r * 0.72, cy + wobble * 0.2];
  const bottom = [cx - wobble * 0.2, cy + r * 1.12];
  const left = [cx - r * 0.7, cy - wobble * 0.15];
  const k = r * 0.14;
  const f = (n: number) => n.toFixed(2);
  return [
    `M${f(top[0])} ${f(top[1])}`,
    `Q${f(cx + k)} ${f(cy - k)} ${f(right[0])} ${f(right[1])}`,
    `Q${f(cx + k)} ${f(cy + k)} ${f(bottom[0])} ${f(bottom[1])}`,
    `Q${f(cx - k)} ${f(cy + k)} ${f(left[0])} ${f(left[1])}`,
    `Q${f(cx - k)} ${f(cy - k)} ${f(top[0])} ${f(top[1])}Z`,
  ].join(' ');
}

/** A hand-drawn plus: two slightly bent strokes, crossing a touch off-centre. */
function plus(cx: number, cy: number, r: number) {
  const f = (n: number) => n.toFixed(2);
  return [
    `M${f(cx + 0.25)} ${f(cy - r)} Q${f(cx - 0.35)} ${f(cy)} ${f(cx - 0.1)} ${f(cy + r * 1.05)}`,
    `M${f(cx - r * 0.95)} ${f(cy + 0.3)} Q${f(cx)} ${f(cy - 0.35)} ${f(cx + r)} ${f(cy + 0.05)}`,
  ].join(' ');
}

function Twinkle() {
  return (
    <svg className="twinkle" viewBox="0 0 28 24" aria-hidden="true">
      <path className="twinkle__star twinkle__star--big" d={star(9, 12.5, 8.6, 0.6)} />
      <path className="twinkle__star twinkle__star--top" d={plus(19.6, 5.6, 3.6)} />
      <path className="twinkle__star twinkle__star--low" d={star(22.4, 17.3, 3.8, 0.3)} />
    </svg>
  );
}

export default function VibeCoding() {
  return (
    <div className="framer-dqwqxf" data-framer-name="Vibe Coding" id="vibecoding">
      <div className="framer-1bexihv">
        <div className="framer-ev3vh3" data-framer-name="Ideation" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
          <h5 className="framer-text framer-styles-preset-1w502i7" data-styles-preset="MrU28x8Gm" dir="auto">
            {"Playground"}
          </h5>
        </div>
      </div>
      <div className="framer-uybb87">
        <div className="framer-1tjc30n">
          <div className="framer-1glx92t">
            <div className="framer-1wgmwxf" data-framer-name="Title" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
              <h2 dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"18px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                {"Prototyping concepts that make interfaces feel friendlier and more delightful"}
                <Twinkle />
              </h2>
            </div>
          </div>
          <div className="framer-ljs9x1">
            <div className="framer-1fwqk1w">
              {/* The Pinch prototype (was Switch to Sunlight mode): a square
                  card (sizing in globals.css, "Recent prototypes: square Pinch
                  card"). Inside, it's the Other-designs tile — click-to-zoom
                  preview included — with a "View more" cursor pill on hover.
                  The magnets card that sat beside it moved to Other designs. */}
              <div className="framer-1arud5a">
                <div className="framer-aeu8rz-container">
                  <PinchPrototype />
                </div>
              </div>
              {/* Two slots for the prototypes coming next (language feedback,
                  visual podcasts): empty squares until their media lands,
                  three to the row with Pinch ("Recent prototypes: three to a
                  row" in globals.css). Their copy is already written below. */}
              <PrototypeSlot n={2} />
              <PrototypeSlot n={3} />
            </div>
            <div className="framer-1qsawwe">
              <div className="framer-146wvo3">
                <div className="framer-33iy5c" data-framer-name="Title" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                  <h2 dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"14px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                    {"Pinch to merge photos"}
                  </h2>
                </div>
                <div className="framer-duoqtt" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                  <p dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"140%","--framer-text-color":"rgba(0, 0, 0, 0.8)"} as React.CSSProperties} className="framer-text">
                    {"Exploring with pinch gesture on phone. Fixing photos that need a recapture by merging them simultaneously, so the best of both images blends into one."}
                  </p>
                </div>
              </div>
              <div className="prototype-caption prototype-caption--2">
                <div className="framer-33iy5c" data-framer-name="Title" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                  <h2 dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"14px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                    {"Visual feedback for speaking a new language"}
                  </h2>
                </div>
                <div className="framer-duoqtt" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                  <p dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"140%","--framer-text-color":"rgba(0, 0, 0, 0.8)"} as React.CSSProperties} className="framer-text">
                    {"Seeing pronunciation on screen as you speak a foreign language, so you catch where a sound drifts and correct it in the moment rather than after."}
                  </p>
                </div>
              </div>
              <div className="prototype-caption prototype-caption--3">
                <div className="framer-33iy5c" data-framer-name="Title" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                  <h2 dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"14px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                    {"Reimagining podcasts with visuals"}
                  </h2>
                </div>
                <div className="framer-duoqtt" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                  <p dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"140%","--framer-text-color":"rgba(0, 0, 0, 0.8)"} as React.CSSProperties} className="framer-text">
                    {"Imagining podcasts with video and supporting assets — the clips, images and references being discussed appear alongside the conversation as it happens."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <OtherDesigns />
        {/* The Vault and the writing log beside it, last in Playground: their
            own section under Other designs, spaced like it ("Playground: Vault
            section" in globals.css). */}
        <section className="playground-vault" aria-label="Vault and writings">
          <div className="framer-1y0yjav">
            <div className="framer-1i32gb2" data-framer-name="Title" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
              <h2 dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"18px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
                {"I built a digital Vault for my inspirations, sources, and everything I'm making with AI"}
              </h2>
            </div>
            <VaultLink>
              <div className="framer-jjzfrt-container">
                <video src="/assets/media/vault-sm.mp4" loop={true} preload="none" muted={true} playsInline={true} style={{"cursor":"auto","width":"100%","height":"auto","borderRadius":"0px","display":"block","objectFit":"contain","backgroundColor":"rgba(0, 0, 0, 0)","objectPosition":"50% 50%","aspectRatio":"1700 / 1080"} as React.CSSProperties} />
              </div>
              <div className="framer-1cetdie-container">
                <div style={{"height":"100%","width":"100%","position":"relative","display":"flex","alignItems":"center","justifyContent":"center","overflow":"hidden","zIndex":"99"} as React.CSSProperties} />
              </div>
            </VaultLink>
          </div>
          <div className="framer-1gh0mvh">
            <div className="framer-yu2ble">
              <div className="framer-18txwkk" data-framer-name="Title" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                <h2 dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"calc((18px - 2pt) * var(--text-scale, 1))","--framer-letter-spacing":"-0.01em","--framer-line-height":"1.4"} as React.CSSProperties} className="framer-text">
                  {"I've been keeping a running log of my design process and vibe coding experiments"}
                </h2>
              </div>
            </div>
            <div className="ssr-variant">
              <div className="framer-jc3ooc-container">
                <div className="framer-QTELX framer-1ra3hbb framer-v-1ra3hbb" data-framer-name="Variant 1" style={{"width":"100%"} as React.CSSProperties}>
                  <WritingLink className="framer-1op56jl framer-1z0yuna" data-framer-name="Stop Burning Tokens in Claude" data-highlight="true" href="https://cherry-vault.vercel.app/stop-burning-tokens.html" style={{"opacity":"1"} as React.CSSProperties}>
                    <div className="framer-5vwxtp">
                      <div className="framer-rb3xzb" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"--extracted-r6o4lv":"rgba(0, 0, 0, 0.8)","--framer-paragraph-spacing":"0px","transform":"none"} as React.CSSProperties}>
                        <p dir="auto" className="framer-text" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"140%","--framer-text-color":"var(--extracted-r6o4lv, rgba(0, 0, 0, 0.8))"} as React.CSSProperties}>
                          {"Stop Burning Tokens in Claude"}
                        </p>
                      </div>
                    </div>
                    <div className="framer-1b5si33" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"0.4","transform":"none"} as React.CSSProperties}>
                      <p dir="auto" className="framer-text" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"140%"} as React.CSSProperties}>
                        {"03/29"}
                      </p>
                    </div>
                  </WritingLink>
                  <div className="framer-13ef331-container">
                    <div className="framer-g8prM framer-170er14 framer-v-170er14" data-framer-name="Variant 1" style={{"width":"100%"} as React.CSSProperties}>
                      <div data-framer-component-type="SVG" className="framer-qf6rtx" aria-hidden="true" style={{"imageRendering":"pixelated","flexShrink":"0"} as React.CSSProperties}>
                        <div className="svgContainer" style={{"width":"100%","height":"100%","aspectRatio":"inherit"} as React.CSSProperties}>
                          <svg style={{"width":"100%","height":"100%","overflow":"visible"} as React.CSSProperties}>
                            <use href="#svg-470388524_227" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <WritingLink className="framer-15510ii framer-1z0yuna" data-framer-name={"Banish the \"AI Vibe\" from Your VibeCoding Projects"} data-highlight="true" href="https://cherry-vault.vercel.app/breaking-ai-vibe.html" style={{"opacity":"1"} as React.CSSProperties}>
                    <div className="framer-mr5q6u" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"--extracted-r6o4lv":"rgba(0, 0, 0, 0.8)","--framer-paragraph-spacing":"0px","transform":"none"} as React.CSSProperties}>
                      <p dir="auto" className="framer-text" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"140%","--framer-text-color":"var(--extracted-r6o4lv, rgba(0, 0, 0, 0.8))"} as React.CSSProperties}>
                        {"Banish the \"AI Vibe\" from Your VibeCoding Projects"}
                      </p>
                    </div>
                    <div className="framer-c3ucek" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"--framer-paragraph-spacing":"0px","opacity":"0.4","transform":"none"} as React.CSSProperties}>
                      <p dir="auto" className="framer-text" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"12px","--framer-line-height":"140%"} as React.CSSProperties}>
                        {"03/29"}
                      </p>
                    </div>
                  </WritingLink>
                </div>
              </div>
            </div>
            <WritingLink className="framer-a0q182 framer-1dt80g9" href="https://cherry-vault.vercel.app/index.html">
              <svg className="framer-HfmfX framer-1tw4k1q" role="presentation" viewBox="0 0 24 24">
                <use href="#1475982494" />
              </svg>
              <div className="framer-4h9mgn" data-framer-name="Description" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
                <p className="framer-text framer-styles-preset-17mrapj" data-styles-preset="kfzMj_9b5" dir="auto">
                  {"View all writings"}
                </p>
              </div>
            </WritingLink>
          </div>
        </section>
      </div>
    </div>
  );
}
