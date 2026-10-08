import AboutEnvelope, { AboutHeading } from '@/components/AboutEnvelope';
import AboutStickerBoard, { AboutFrameDots } from '@/components/AboutStickerBoard';
import CameraReel from '@/components/CameraReel';
import Showcase from '@/components/sections/Showcase';

export default function About() {
  return (
    <div className="framer-1tbke29" data-framer-name="Vibe Coding" id="about">
      <div className="framer-lpkssc">
        {/* The heading sits above one frame that holds everything: the
            envelope centred (sized to the frame's height via `fill`) and the
            sticker board laid over the whole frame, its stickers arranged
            around the envelope. `about-duo-host` relaxes the slot's fixed
            698px height so it can be as tall as the frame. */}
        <div className="framer-1pt38fk about-duo-host">
          <AboutHeading />
          <div className="about-frame">
            <AboutFrameDots />
            <div className="about-frame__envelope">
              <AboutEnvelope showHeading={false} fill />
            </div>
            <AboutStickerBoard />
          </div>
        </div>
        {/* Design Journey ("My path into design") sits between the About Me
            envelope and the "I shoot films..." blurb below, per request. */}
        <Showcase />
        <div className="framer-97775b">
          <div className="framer-1uc3dt9" data-framer-name="Title" data-framer-component-type="RichTextContainer" style={{"transform":"none"} as React.CSSProperties}>
            <h2 dir="auto" style={{"--font-selector":"RlM7U3dpdHplci1yZWd1bGFy","--framer-font-family":"\"Switzer\", \"Switzer Placeholder\", sans-serif","--framer-font-size":"18px","--framer-letter-spacing":"-0.01em","--framer-line-height":"140%"} as React.CSSProperties} className="framer-text">
              {"I shoot films, wander through gardens, and enjoy taking my cameras on trips across different countries."}
            </h2>
          </div>
          <CameraReel />
        </div>
      </div>
    </div>
  );
}
