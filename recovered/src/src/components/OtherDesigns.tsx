'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRightIcon, type ArrowUpRightIconHandle } from '@/components/icons/ArrowUpRightIcon';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

/**
 * "Other mediums of design I explored with..." — square tiles, four to a row.
 *
 * The game tile is a flipbook, looping on an interval. Its frames are plain
 * stacked <img>s cross-faded by opacity rather than a swapped `src`, because
 * swapping src shows a blank frame the first time round each image while it
 * decodes. Stacking means every frame is already in the layer tree.
 *
 * The loop only runs while the tile is on screen (IntersectionObserver) —
 * images cycling off-screen is work nobody sees.
 *
 * The grid is four across, two rows. Clicking a tile opens the zoomed view:
 * every piece at the preview size, in one horizontal row with a scrollbar.
 * Scrolling to the next piece slides the row with it — the one on screen
 * travels off to the left as the next comes in, and back the other way.
 * Close it with the corner button, a click on the empty frost, or Escape.
 * Pinch, outside this grid, still opens a single preview, with the same
 * three ways out.
 */

const GAME = Array.from({ length: 7 }, (_, i) => `/assets/other-designs/game-ipad-0${i + 1}.webp`);

/* The game flipbook's frame interval. */
const GAME_MS = 1600;

const DESKTOP = Array.from({ length: 3 }, (_, i) => `/assets/other-designs/desktop-0${i + 1}.jpg`);

/* The desktop accessories flipbook's frame interval, matching the game's. */
const DESKTOP_MS = 1600;

/* The vase's preview loop, after the cover (vase-01, the tile's photo): the
   making of it in order — the raw laser-cut stack, sanding, the flowers and
   vase primed then spray painted, the finished set — and round to the cover. */
const VASE_GALLERY = Array.from({ length: 8 }, (_, i) => `/assets/other-designs/vase-0${i + 2}.webp`);

/* iPad Pro 11 (M4, silver, landscape) from Figma: Portfolio › 2362:1077. The
   bezel PNG is 1320×940 with a transparent 1210×834 screen hole at (55, 53);
   the frames sit under it and the bezel's rounded inner edge masks them. */
const IPAD_BEZEL = '/assets/other-designs/ipad-bezel.webp';

/* --- Project catalogue ----------------------------------------------------
 * One entry per tile. `label` and `year` fill the hover bar, tinted with `pill`; the rest is the copy shown in the preview overlay. `media` is a discriminated union so the tile
 * and the preview can each render the right element at the right size.
 */
type Media =
  | {
      kind: 'still';
      src: string;
      alt: string;
      /** Preview only: more photos, played in a loop once the piece is open.
       *  `src` leads it, so the photo that flies up from the tile is the one
       *  the loop starts on. */
      gallery?: { frames: string[]; intervalMs: number };
    }
  | {
      kind: 'flip';
      frames: string[];
      alt: string;
      intervalMs: number;
      /** Play the frames on a device's screen rather than bare. */
      device?: 'ipad';
    }
  | {
      kind: 'video';
      src: string;
      alt: string;
      poster?: string;
      bend?: Bend;
      /** Cover the square tile instead of sitting on the plate. `y` is the
       *  vertical crop position, 0 (top) – 1 (bottom); centred by default.
       *  `preview` crops the zoomed view to that width/height ratio too
       *  (e.g. 3/4) instead of showing the clip whole. */
      fill?: { y?: number; preview?: number };
      /** Round the clip's own corners, in px (tile and preview alike). */
      radius?: number;
      /** Tile only: scale the clip's box on the plate (1 = the usual 84%).
       *  The preview stays full size. */
      tileScale?: number;
      /** The clip has a soundtrack: the preview gets a sound toggle in its top
       *  right corner. It still starts muted (autoplay requires it), and the
       *  tile always plays muted. */
      sound?: boolean;
    };

/** Wrap the clip on a curved panel (see BentVideo). `deg` is the half-angle of
 *  the arc; `w`/`h` the clip's pixel size, so the panel has the right shape
 *  before the first frame arrives; `trimY` source rows cut from the top and
 *  bottom (encoder edge rows that would otherwise trace the curve as a line). */
type Bend = { deg: number; w: number; h: number; trimY?: number };

type Project = {
  id: string;
  label: string;
  /** The artwork's primary colour as an `r g b` triplet — the hover bar is
   *  this at 40% over a backdrop blur (treatment from Figma: Portfolio ›
   *  2319:18648). */
  pill: string;
  /** Pill text colour per theme, overriding the default (black by day, white
   *  at night). */
  pillInk?: { day?: string; night?: string };
  title: string;
  year: string;
  description: string;
  /** Tools and materials, under the description. Left out when unknown. */
  credits?: string;
  /** A live build. In the zoomed preview it sits on the artwork as "Try prototype ↗". */
  link?: string;
  /** Soft blurred, washed-out edges on the card (a light vignette). */
  edgeBlur?: boolean;
  media: Media;
};

/* The Pinch prototype lives in the "Recent prototypes" row (see VibeCoding),
   not this grid, but opens the same way — PinchPrototype below. */
const PINCH: Project = {
  id: 'photo-app',
  label: 'Pinch to merge photos',
  pill: '244 224 236', // the app's soft pink-white screen
  title: 'Pinch to merge photos',
  year: '2026',
  description:
    'Exploring with pinch gesture on phone. Fixing photos that need a recapture by merging them simultaneously, so the best of both images blends into one.',
  credits: 'Designed in Figma, coded with Claude, deployed on Vercel',
  link: 'https://merge-photo.vercel.app/',
  edgeBlur: true,
  // Portrait phone capture (1390×2472 HEVC, 23MB) re-encoded to 832px-wide
  // H.264: 2.7MB, plays everywhere, no audio (the tile is muted anyway).
  // `fill` crops it to its slot (the square Recent-prototypes card) and the
  // preview to 3:4 rather than the capture's tall 9:16. The handheld phone
  // drifts in frame, so both crops sit at 0.55 — the band that keeps the
  // photos being merged in view most of the time. Sharing the position keeps
  // the card→3:4 zoom seamless.
  media: {
    kind: 'video',
    src: '/assets/other-designs/photo-app.mp4',
    poster: '/assets/other-designs/photo-app-frame.jpg',
    alt: 'Pinching two photos together to merge them, on a phone',
    fill: { y: 0.55, preview: 3 / 4 },
  },
};

/* Beside Pinch in Recent prototypes. */
const LANGUAGE: Project = {
  id: 'language',
  label: 'Visual feedback for speaking a new language',
  pill: '244 244 242', // the app's off-white screen
  title: 'Visual feedback for speaking a new language',
  year: '2026',
  description:
    'Gentle mirror for learning a language: Words appear on the screen as you say them, so any drifting sound is easy to notice & correct in the moment.',
  link: 'https://languagelearning-zeta.vercel.app/',
  // Square 1080px H.264 capture (35MB) re-encoded to 832px: 0.55MB, audio
  // kept for the preview's sound toggle — the spoken word is the point.
  media: {
    kind: 'video',
    src: '/assets/other-designs/language.mp4',
    poster: '/assets/other-designs/language-frame.jpg',
    alt: 'Saying "papá" to a phone app that shows the pronunciation as it is spoken',
    fill: {},
    sound: true,
  },
};

/* Third in Recent prototypes. */
const TEXTING: Project = {
  id: 'texting',
  label: 'Text bubbles that feel what you say',
  pill: '247 247 247', // the recording's pale grey backdrop
  title: 'Text bubbles that feel what you say',
  year: '2026',
  description:
    'Each bubble picks up the mood of its message, so a tired “I just woke up” looks as sleepy as it sounds.',
  link: 'https://funtexting.vercel.app/',
  // Silent 3360×1854 screen recording, cropped to the centred square around
  // the phone and re-encoded to 832px at 30fps: 0.13MB.
  media: {
    kind: 'video',
    src: '/assets/other-designs/texting.mp4',
    poster: '/assets/other-designs/texting-frame.jpg',
    alt: 'Texting on a phone: "I\'m so tired…" and "I just woke up" sent as bubbles that animate to match their mood',
    fill: {},
  },
};

const PROJECTS: Project[] = [
  {
    id: 'poster',
    label: 'Type poster',
    pill: '207 249 82', // poster lime, straight from the Figma pill
    pillInk: { night: '#000' }, // lime art shows through: black 8.1:1, white 2.6:1
    title: 'Type Specimen Poster for Helvetica',
    year: '2023',
    description: 'A poster exploring blending shape and text into graphic composition.',
    credits: 'Designed in Illustrator, animated with @effects.app',
    // H.264 at 832×1248 (enough for the preview on a 2x screen), re-encoded
    // from the 2730×4096 HEVC master: 0.8MB instead of 33MB, and it plays in
    // browsers without HEVC. The frame is its first frame, shown until it loads.
    media: {
      kind: 'video',
      src: '/assets/other-designs/poster.mp4',
      poster: '/assets/other-designs/poster-frame.jpg',
      alt: 'Animated type poster',
    },
  },
  {
    id: 'game',
    label: 'Gamified data visualization',
    pill: '153 227 255', // #99E3FF, the game screens' cyan
    title: 'Gamified Data Visualization',
    year: '2025',
    description:
      'A space-mission concept that turns dry telemetry into a playable, level-based journey — every stat becomes something you fly through.',
    credits: 'Designed in Figma, prototyped in ProtoPie',
    media: { kind: 'flip', frames: GAME, alt: 'Space mission game screens on an iPad', intervalMs: GAME_MS, device: 'ipad' },
  },
  {
    id: 'vr',
    label: 'VR environment stimulator',
    pill: '20 21 24', // the scene's black void
    pillInk: { day: '#fff', night: '#fff' },
    title: 'VR Environment Simulator',
    year: '2025',
    description:
      'A spatial study of how immersive environments can guide focus and calm, using light, depth, and slow motion to set a mood.',
    credits: 'Built in Unity, modeled in Blender',
    // Bent like a Quest home panel: the scene reads as playing on a screen
    // wrapped around the viewer, which is where it was meant to be seen.
    media: {
      kind: 'video',
      src: '/assets/other-designs/vr.mp4',
      alt: 'VR environment stimulator',
      // The export's first and last pixel rows are near-black (~65 vs ~200
      // brightness beside them); stretched along the curve they drew a dark
      // hairline under the panel, so 2px come off each edge.
      bend: { deg: 26, w: 1396, h: 720, trimY: 2 },
    },
  },
  {
    id: 'booklet',
    label: 'Helvetica booklet',
    pill: '227 33 8', // the spreads' Swiss red
    title: 'Helvetica Type Booklet',
    year: '2023',
    description:
      'A booklet on Helvetica — its anatomy, weights, and character set — laid out on a Swiss grid in red, black, and white.',
    credits: 'Designed in InDesign',
    // One 2:1 image of three spreads, sitting whole on the plate.
    media: {
      kind: 'still',
      src: '/assets/other-designs/helvetica-booklet.webp',
      alt: 'Helvetica type booklet spreads: typography anatomy and the Neue Helvetica weights',
    },
  },
  {
    id: 'desktop',
    label: 'Rapid prototyping',
    pill: '245 222 110', // the plant holder's yellow
    title: 'Rapid Prototyping: Desktop Accessories',
    year: '2024',
    description:
      'Desktop accessories built from Bauhaus-inspired forms and shapes — a plant holder and a book divider.',
    credits: '3D printed',
    media: {
      kind: 'flip',
      frames: DESKTOP,
      alt: 'Yellow and white 3D-printed plant holders and a string book divider',
      intervalMs: DESKTOP_MS,
    },
  },
  {
    id: 'roommates',
    label: 'IoT panel for shared living',
    pill: '249 132 0', // the panel's orange
    title: 'IoT Room Panel for Shared Living',
    year: '2025',
    description:
      'Refining shared living spaces with soft message communication, to strengthen the bond between roommates through easy, up-to-date information.',
    // Screen recording (1638×1646 H.264, 51MB, 60fps) re-encoded to 1080px
    // wide at 30fps, no audio: 1.1MB. The capture's 2px dark rim came off
    // every edge first — rounded corners would have shown it.
    media: {
      kind: 'video',
      src: '/assets/other-designs/roommates.mp4',
      poster: '/assets/other-designs/roommates-frame.jpg',
      alt: 'Shared-room booking panel: a Party booking counting down, then Game Night',
      radius: 8,
      // 20% smaller on the plate than the other pieces.
      tileScale: 0.8,
      sound: true,
    },
  },
  {
    id: 'vase',
    label: 'Laser-cut flower vase',
    pill: '196 22 58', // the base's crimson
    title: 'Laser-Cut Flower Vase',
    year: '2024',
    description:
      'A wavy vase on a flower-shaped base, filled with flowers laser cut from wood board and spray painted in gradients.',
    credits: 'Laser cut wood board, spray painted',
    // One photo on the tile; opening it plays the whole process, starting and
    // ending on it.
    media: {
      kind: 'still',
      src: '/assets/other-designs/vase-01.webp',
      alt: 'Pink wavy vase of laser-cut, spray-painted wooden flowers on a red flower-shaped base',
      gallery: { frames: VASE_GALLERY, intervalMs: 1600 },
    },
  },
  {
    id: 'magnets',
    label: 'Magnets from my trips',
    pill: '170 199 215', // the fridge door's blue
    title: 'Magnets from My Trips',
    year: '2026',
    description: 'Turning magnets I collected during trips into a digital archive.',
    // Was the "Currently building" card in Recent prototypes (VibeCoding),
    // now a newer cut of it: Fridgenew.mp4 (1880×1080, 60fps, 29MB)
    // re-encoded to 1280px wide at 30fps — 0.5MB.
    media: {
      kind: 'video',
      src: '/assets/other-designs/fridge.mp4',
      poster: '/assets/other-designs/fridge-frame.jpg',
      alt: 'Travel magnets arranged on a pale blue fridge door against a tiled wall',
    },
  },
];

/* Last frame each flipbook showed, keyed by its first frame. The tile and the
   preview are separate <Flipbook>s, so without this the piece would jump back
   to frame one the moment it lifts off the tile (and again when it lands). */
const flipFrames = new Map<string, number>();

function Flipbook({
  frames,
  alt,
  intervalMs,
  variant,
  device,
  paused = false,
  stage = false,
}: {
  frames: string[];
  alt: string;
  intervalMs: number;
  variant: 'tile' | 'preview';
  device?: 'ipad';
  /** Tile only: hold the current frame while its preview is open. */
  paused?: boolean;
  /** Preview only: photos of mixed shapes, each fitted whole into a fixed
   *  stage so the box (and the copy under it) never jumps between frames.
   *  A stage loop has no tile copy to share its frame with (see flipFrames),
   *  so it always starts on frame one — the tile's photo. */
  stage?: boolean;
}) {
  const resume = !stage;
  const key = frames[0];
  const [i, setI] = useState(() => (resume ? flipFrames.get(key) ?? 0 : 0));
  const hostRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(variant === 'preview');

  useEffect(() => {
    if (resume) flipFrames.set(key, i);
  }, [key, i, resume]);

  // Coming back from the preview: pick up on whatever frame it landed on.
  useEffect(() => {
    if (!paused) setI(flipFrames.get(key) ?? 0);
  }, [paused, key]);

  useEffect(() => {
    if (variant === 'preview') return; // preview is always on screen
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [variant]);

  useEffect(() => {
    if (!live || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % frames.length), intervalMs);
    return () => window.clearInterval(id);
  }, [live, paused, frames.length, intervalMs]);

  const imgs = frames.map((src, n) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={n === 0 ? alt : ''}
      aria-hidden={n === 0 ? undefined : true}
      loading={variant === 'tile' && n >= 2 ? 'lazy' : 'eager'}
      decoding="async"
      style={{ opacity: n === i ? 1 : 0 }}
    />
  ));

  if (device) {
    // The device box is sized by its own aspect ratio, not by a frame, so it
    // measures correctly for the flight before any image has loaded.
    return (
      <div className={variant === 'tile' ? 'other-design__device' : 'od-preview__device'} ref={hostRef}>
        <div className="device-ipad">
          <div className="device-ipad__screen">{imgs}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="device-ipad__bezel" src={IPAD_BEZEL} alt="" aria-hidden="true" decoding="async" />
        </div>
      </div>
    );
  }

  const wrapperClass = stage ? 'od-preview__stage' : variant === 'tile' ? 'other-design__flip' : 'od-preview__flip';

  return (
    <div className={wrapperClass} ref={hostRef}>
      {imgs}
    </div>
  );
}

/* --- Bent video ----------------------------------------------------------
 * An After Effects "CC Bend"-style curve, like a Quest home panel: the clip is
 * drawn as if it were a screen wrapped around the viewer on the inside of a
 * cylinder. Its edges are nearer, so they stand taller and stretch a little
 * wider; the middle sits further back and reads shorter.
 *
 * The geometry, for an arc of half-angle T seen from its centre: the output
 * column at n ∈ [-1, 1] looks along θ = atan(n·tan T), shows the source column
 * at θ/T, and — being at depth cos θ — stands 1/cos θ tall. Normalised so the
 * edges are full height, the middle is cos T (26° → 90%).
 *
 * It's drawn onto a 2D canvas in thin vertical strips (one drawImage each) on
 * every new video frame. A canvas rather than a filter or a baked file: the
 * corners the curve leaves have to stay transparent (plate by day, navy by
 * night, frost in the preview), and SVG displacement on video is slow and
 * patchy across browsers. The <video> itself only decodes; it's kept 1px and
 * invisible rather than display:none so browsers keep playing it.
 */
const BEND_STRIP = 3; // canvas px per strip — steps in the curve stay sub-pixel

/** The last canvas that painted each clip. A new copy (the zoomed view's) has
 *  no frame until its own <video> loads and decodes, so it starts from this
 *  one's pixels instead of opening on an empty panel. */
const paintedBend = new Map<string, HTMLCanvasElement>();

function BentVideo({
  src,
  alt,
  bend,
  className,
  maxWidth,
}: {
  src: string;
  alt: string;
  bend: Bend;
  className: string;
  /** Canvas width cap: about what the slot shows at 2x, so the tile isn't
   *  drawing 4x the pixels it displays. */
  maxWidth: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // A fixed backing store in the clip's proportions: it gives the canvas an
  // intrinsic size, so the same CSS that sizes an <img>/<video> (auto size
  // within max-width/height) sizes this. Fixed rather than tracking the
  // rendered size, which would feed back into that auto sizing.
  const trim = bend.trimY ?? 0;
  const scale = Math.min(1, maxWidth / bend.w);
  const cw = Math.round(bend.w * scale);
  const ch = Math.round((bend.h - trim * 2) * scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !video || !ctx) return;

    // Strip layout depends only on the size and angle, so work it out once.
    const T = (bend.deg * Math.PI) / 180;
    const tanT = Math.tan(T);
    const cosT = Math.cos(T);
    const toSource = (x: number) => (Math.atan(((x / cw) * 2 - 1) * tanT) / T + 1) / 2;
    const strips: { dx: number; dw: number; u0: number; u1: number; dy: number; dh: number }[] = [];
    for (let dx = 0; dx < cw; dx += BEND_STRIP) {
      const dw = Math.min(BEND_STRIP, cw - dx);
      const n = ((dx + dw / 2) / cw) * 2 - 1;
      const dh = ch * (cosT / Math.cos(Math.atan(n * tanT)));
      // +0.5px overlap so neighbouring strips never leave a hairline seam.
      strips.push({ dx, dw: dw + 0.5, u0: toSource(dx), u1: toSource(dx + dw), dy: (ch - dh) / 2, dh });
    }

    let visible = true;
    const draw = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      // Metadata alone gives a size but no picture; clearing then would wipe
      // the seeded frame and leave the panel empty until data arrives.
      if (!visible || !vw || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const sy = (trim * vh) / bend.h; // trimY is in the clip's own pixels
      ctx.clearRect(0, 0, cw, ch);
      for (const s of strips) {
        ctx.drawImage(video, s.u0 * vw, sy, Math.max(0.5, (s.u1 - s.u0) * vw), vh - sy * 2, s.dx, s.dy, s.dw, s.dh);
      }
      paintedBend.set(src, canvas);
    };

    // Already bent, so it only needs scaling to this backing store.
    const seed = paintedBend.get(src);
    if (seed && seed !== canvas && seed.isConnected && video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      ctx.drawImage(seed, 0, 0, cw, ch);
    }

    // Redraw on each new video frame where supported, else every animation frame.
    let handle = 0;
    const rvfc = 'requestVideoFrameCallback' in video;
    const loop = () => {
      draw();
      handle = rvfc ? video.requestVideoFrameCallback(loop) : requestAnimationFrame(loop);
    };
    loop();
    video.addEventListener('loadeddata', draw);
    video.addEventListener('seeked', draw);

    // Don't paint what nobody can see.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) draw();
    });
    io.observe(canvas);

    return () => {
      if (rvfc) video.cancelVideoFrameCallback(handle);
      else cancelAnimationFrame(handle);
      video.removeEventListener('loadeddata', draw);
      video.removeEventListener('seeked', draw);
      io.disconnect();
      if (paintedBend.get(src) === canvas) paintedBend.delete(src);
    };
  }, [src, bend.deg, bend.h, trim, cw, ch]);

  return (
    <>
      <canvas ref={canvasRef} className={className} width={cw} height={ch} role="img" aria-label={alt} />
      <video ref={videoRef} className="bent-video__source" src={src} aria-hidden="true" autoPlay loop muted playsInline preload="auto" />
    </>
  );
}

/** The artwork on its own, sized for either the grid tile or the preview. */
function ProjectMedia({ media, variant, paused }: { media: Media; variant: 'tile' | 'preview'; paused?: boolean }) {
  const stillClass = variant === 'tile' ? 'other-design__still' : 'od-preview__still';
  const videoClass = variant === 'tile' ? 'other-design__video' : 'od-preview__video';

  if (media.kind === 'still' && variant === 'preview' && media.gallery) {
    return (
      <Flipbook
        frames={[media.src, ...media.gallery.frames]}
        alt={media.alt}
        intervalMs={media.gallery.intervalMs}
        variant="preview"
        stage
      />
    );
  }
  if (media.kind === 'still') {
    // The preview copy must be eager: a lazy <img> has no size when the flight
    // is measured, and the piece would pop in instead of flying.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={stillClass}
        src={media.src}
        alt={media.alt}
        loading={variant === 'tile' ? 'lazy' : 'eager'}
        decoding="async"
      />
    );
  }
  if (media.kind === 'video' && media.bend) {
    return (
      <BentVideo
        src={media.src}
        alt={media.alt}
        bend={media.bend}
        className={videoClass}
        maxWidth={variant === 'tile' ? 640 : 1440}
      />
    );
  }
  if (media.kind === 'video') {
    // Preview crop (`fill.preview`): cover a box of that ratio, anchored at the
    // tile's own crop position — with the same anchor, the tile's square is
    // exactly the slice tileCrop() clips the preview to at lift-off.
    const crop = variant === 'preview' && media.fill?.preview;
    return (
      <video
        className={`${videoClass}${crop ? ' od-preview__video--crop' : ''}`}
        style={
          crop || media.radius || media.tileScale
            ? ({
                ...(crop && {
                  aspectRatio: crop,
                  objectPosition: `50% ${(media.fill?.y ?? 0.5) * 100}%`,
                  '--crop-ratio': crop,
                }),
                borderRadius: media.radius,
                ...(variant === 'tile' &&
                  media.tileScale && {
                    maxWidth: `${84 * media.tileScale}%`,
                    maxHeight: `${84 * media.tileScale}%`,
                  }),
              } as CSSProperties)
            : undefined
        }
        src={media.src}
        poster={media.poster}
        aria-label={media.alt}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
    );
  }
  return (
    <Flipbook
      frames={media.frames}
      alt={media.alt}
      intervalMs={media.intervalMs}
      variant={variant}
      device={media.device}
      paused={paused}
    />
  );
}

/** A tile. Hovering slides a frosted bar up from its bottom edge naming
 *  the piece, tinted with the artwork's own colour. Clicking opens
 *  the preview. While its preview is up, the tile's artwork is hidden — the
 *  piece has left the tile, like the book leaving its slot. */
function Tile({
  project,
  active,
  flown,
  onOpen,
  className,
  bar = true,
  pointer,
}: {
  project: Project;
  active: boolean;
  flown: boolean;
  onOpen: (art: HTMLElement) => void;
  /** Extra class, e.g. `other-design--slot` to fill a host's box. */
  className?: string;
  /** The hover name bar. Off where something else names the tile on hover. */
  bar?: boolean;
  /** Mouse handlers for a cursor-follow pill, when that names it instead. */
  pointer?: {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => void;
    onMouseMove: (e: ReactMouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  };
}) {
  const open = (e: ReactMouseEvent<HTMLButtonElement>) => {
    // The visible artwork, not the padded plate, is what should fly out — for a
    // flipbook that's the first (in-flow) frame, for a device the whole device.
    // Fall back to the button box.
    onOpen(e.currentTarget.querySelector<HTMLElement>('.device-ipad, canvas, img, video') ?? e.currentTarget);
  };
  return (
    <button
      type="button"
      data-od-tile={project.id}
      className={`other-design${project.media.kind === 'video' && project.media.fill ? ' other-design--fill' : ''}${project.edgeBlur ? ' other-design--edge-blur' : ''}${className ? ` ${className}` : ''}${flown ? ' is-flown' : ''}`}
      aria-label={`Open preview: ${project.title}`}
      onClick={open}
      {...pointer}
      style={
        {
          '--pill-rgb': project.pill,
          '--pill-fg-day': project.pillInk?.day,
          '--pill-fg-night': project.pillInk?.night,
          '--fill-y':
            project.media.kind === 'video' && project.media.fill
              ? `${(project.media.fill.y ?? 0.5) * 100}%`
              : undefined,
        } as CSSProperties
      }
    >
      <ProjectMedia media={project.media} variant="tile" paused={active} />
      {bar ? (
        <span className="other-design__bar" aria-hidden="true">
          <span className="other-design__bar-title">{project.label}</span>
          <span className="other-design__bar-year">{project.year}</span>
        </span>
      ) : null}
    </button>
  );
}

/* Same motion as the guestbook book and the About envelope: the piece scales up
   out of its slot on the site's modal curve (book-cover.html --modal-ease), and
   the frost rides the identical duration and curve so the blur tracks the
   scale 1:1, as the envelope's does. Slightly longer than the book's 400ms —
   this piece travels ~3x its size. Close runs on the same curve (the book's
   flight home does too), a touch quicker: the system responding. Keep in sync
   with the .od-preview rules in globals.css. */
const FLIGHT_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const FLIGHT_IN_MS = 560;
const FLIGHT_OUT_MS = 460;

/** The FLIP transform that maps the artwork's resting box (`rest`) back onto
 *  the tile it came from (`origin`), scaling about the centre. One uniform
 *  factor: tile and preview show the same artwork at the same aspect, so a
 *  separate x/y scale would only add squash from rounding.
 *
 *  When the scaled preview is taller than the tile (a `fill` crop), tileCrop()
 *  clips `y` of the overhang off the top — so the box is nudged up by
 *  (y − 0.5) of it, putting the visible window square on the tile rather
 *  than centred on it (centred is only right when y is 0.5). */
function flipTransform(origin: DOMRect, rest: DOMRect, y = 0.5) {
  const s = origin.width / rest.width;
  const overhang = Math.max(0, rest.height * s - origin.height);
  const tx = origin.left + origin.width / 2 - (rest.left + rest.width / 2);
  const ty = origin.top + origin.height / 2 - (rest.top + rest.height / 2) + (0.5 - y) * overhang;
  return `translate(${tx}px, ${ty}px) scale(${s})`;
}

/** For a tile that crops its clip to the square (`fill`), the preview shows it
 *  whole — taller than the tile once scaled to the tile's width. This clips the
 *  preview to the tile's own crop at the tile end of the flight, so the piece
 *  lifts off exactly as it looked and opens up to its full height on the way.
 *  Same-aspect tiles get `inset(0)`, i.e. no clip. */
function tileCrop(origin: DOMRect, rest: DOMRect, y = 0.5) {
  const scaledH = rest.height * (origin.width / rest.width);
  const cut = scaledH > origin.height + 0.5 ? (1 - origin.height / scaledH) * 100 : 0;
  // Split the cut the way the tile's object-position does: `y` of it off the
  // top, the rest off the bottom.
  return `inset(${cut * y}% 0 ${cut * (1 - y)}% 0)`;
}
const NO_CROP = 'inset(0% 0 0% 0)';

/** The preview artwork's resting box, as the flight should see it. Usually the
 *  media box itself; but a stage (Flipbook `stage`) is a fixed box larger than
 *  its photo, so it's the box the first frame — the tile's photo — is drawn
 *  at inside it (object-fit: contain, centred). Centred means it shares the
 *  media box's centre, which is what the FLIP scales about, so flipTransform()
 *  and tileCrop() work on it unchanged. */
function restingBox(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  const first = el.querySelector<HTMLImageElement>('.od-preview__stage img');
  if (!first?.naturalWidth) return box;
  const fit = Math.min(box.width / first.naturalWidth, box.height / first.naturalHeight);
  const w = first.naturalWidth * fit;
  const h = first.naturalHeight * fit;
  return new DOMRect(box.left + (box.width - w) / 2, box.top + (box.height - h) / 2, w, h);
}

/** "Try prototype" — the case studies' outbound pill (.loom-pill in
 *  loom/loom.css, mirrored in globals.css since that file only loads on the
 *  Loom page), with the same arrow that nudges on hover.
 *  `frame` pins it to the artwork: inside the bottom-right of the frame,
 *  inset from both edges, white with black type and no stroke. */
function PrototypeLink({ href, frame = false }: { href: string; frame?: boolean }) {
  const arrow = useRef<ArrowUpRightIconHandle>(null);
  const reduced = useReducedMotion();
  return (
    <a
      className={`od-preview__link${frame ? ' od-preview__link--frame' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => {
        if (!reduced) arrow.current?.startAnimation();
      }}
      onMouseLeave={() => {
        if (!reduced) arrow.current?.stopAnimation();
      }}
    >
      Try prototype
      <ArrowUpRightIcon ref={arrow} size={12} className="od-preview__link-arrow" aria-hidden="true" />
    </a>
  );
}

/** Sound on/off for a preview clip with a soundtrack (`sound`), pinned to the
 *  clip's top right corner. Flips the <video>'s own `muted` rather than
 *  re-rendering it, so playback never restarts; unmuting is a click, which is
 *  the user gesture browsers want before they'll play sound. */
function SoundToggle({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const [muted, setMuted] = useState(true);
  const toggle = () => {
    const video = host.current?.querySelector('video');
    if (!video) return;
    video.muted = !muted;
    if (!video.muted && video.paused) void video.play().catch(() => {});
    setMuted(video.muted);
  };
  return (
    <button
      type="button"
      className="od-preview__sound"
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      aria-pressed={!muted}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
        {muted ? (
          <>
            <line x1="22" x2="16" y1="9" y2="15" />
            <line x1="16" x2="22" y1="9" y2="15" />
          </>
        ) : (
          <>
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M19.4 18.4a9 9 0 0 0 0-12.7" />
          </>
        )}
      </svg>
    </button>
  );
}

/** The clip behind a piece: the element itself, or a bent canvas's source. */
const clipOf = (art: HTMLElement) =>
  art instanceof HTMLVideoElement ? art : art.parentElement?.querySelector<HTMLVideoElement>('video.bent-video__source') ?? null;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How far past the screen edge a neighbor sits, so none of it shows while
 *  one piece is parked in the centre. Shared by the resting layout and the
 *  slide, so the end of a transition is the same place the layout would put it. */
const neighborGap = (view: number, width: number) =>
  Math.max(0, Math.ceil((view - width) / 2) + 4);

/** One project sliding aside for the next. Long enough to watch the piece
 *  travel, short enough that the next scroll still feels ready. */
const SLIDE_MS = 620;
const WHEEL_QUIET_MS = 180;

/** Off-center size during a slide. The piece leaving shrinks from full size
 *  to this; the piece arriving starts here and grows back to full size as it
 *  reaches the centre. */
const SLIDE_SCALE = 0.95;

/** A CSS cubic-bezier(x1, y1, x2, y2) as a function of progress, for motion
 *  driven frame by frame. Solves the curve's x for t (Newton, then bisection
 *  where the slope is too flat), and returns its y. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 1 + 3 * x1 - 3 * x2;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 1 + 3 * y1 - 3 * y2;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const xAt = (t: number) => ((ax * t + bx) * t + cx) * t;
  const yAt = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const err = xAt(t) - x;
      const d = slopeX(t);
      if (Math.abs(err) < 1e-5) return yAt(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      if (xAt(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return yAt(t);
  };
}

/** Ease-in-out: both pieces gather speed softly out of rest, cross the
 *  middle, and settle softly into place — on-screen movement, not an
 *  entrance, so neither end should snap. Symmetric and moderate: a stronger
 *  curve (0.77, 0, 0.175, 1) sits nearly still for the first quarter, then
 *  whips through the middle at ~5x the average speed. */
const slideEase = cubicBezier(0.65, 0, 0.35, 1);

/** Corner close for a clicked playground piece: a white disc with a little
 *  transparency, and a black X on top of it. */
function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="od-preview__close"
      aria-label="Close"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** The preview overlay. The artwork flies from its tile (`origin`) to the
 *  centre while the frost fades in on the same curve; the copy follows just
 *  behind. Closing flies it back into the tile before unmounting. The corner
 *  button, a click on the empty frost, and Escape all dismiss it.
 *
 *  The flight is WAAPI rather than a CSS transition: no reflow dance to make
 *  the start frame stick, and a close mid-open can pick up from wherever the
 *  piece is instead of jumping. */
function Preview({
  project,
  origin,
  onLaunch,
  onClose,
}: {
  project: Project;
  origin: HTMLElement;
  onLaunch: () => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const fillY = project.media.kind === 'video' ? (project.media.fill?.y ?? 0.5) : 0.5;
  const closingRef = useRef(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    // For a bent clip the <video> is the hidden source behind the canvas; its
    // readiness is still what decides when the piece can be measured.
    const art = el.querySelector<HTMLElement>('img, video');
    // Pick the clip up where the tile was, so nothing jumps as it lifts off.
    const originClip = clipOf(origin);
    if (art instanceof HTMLVideoElement && originClip) art.currentTime = originClip.currentTime;

    let launched = false;
    const launch = () => {
      if (launched) return;
      launched = true;
      el.style.visibility = '';
      // Measure the resting box with no flight applied — a leftover one (dev
      // StrictMode runs this effect twice) would pin the box to the tile and
      // turn the flight into tile→tile, i.e. no movement at all.
      flightRef.current?.cancel();
      const rest = restingBox(el);
      if (!reducedMotion() && rest.width > 0) {
        const tile = origin.getBoundingClientRect();
        flightRef.current = el.animate(
          [
            { transform: flipTransform(tile, rest, fillY), clipPath: tileCrop(tile, rest, fillY) },
            { transform: 'none', clipPath: NO_CROP },
          ],
          { duration: FLIGHT_IN_MS, easing: FLIGHT_EASE },
        );
      }
      onLaunch();
      setOpen(true);
    };

    // "Has a box" isn't enough: a <video> without metadata lays out at the
    // default 300×150 and then grows, which would skew the flight's end size.
    const ready =
      art instanceof HTMLVideoElement
        ? art.readyState >= HTMLMediaElement.HAVE_METADATA
        : art instanceof HTMLImageElement
          ? art.complete && art.naturalWidth > 0
          : true;
    if (ready && el.getBoundingClientRect().width > 0) {
      launch();
      return () => flightRef.current?.cancel();
    }
    // Not measurable yet (still loading/decoding). Hold it invisible — the tile
    // is still showing — and launch once it is, so the flight always starts
    // from the tile rather than popping in at full size.
    el.style.visibility = 'hidden';
    const readyEvent = art instanceof HTMLVideoElement ? 'loadedmetadata' : 'load';
    art?.addEventListener(readyEvent, launch, { once: true });
    const fallback = window.setTimeout(launch, 600);
    return () => {
      art?.removeEventListener(readyEvent, launch);
      window.clearTimeout(fallback);
      flightRef.current?.cancel();
    };
    // Runs once per preview: `origin` is fixed for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const el = mediaRef.current;
    if (!el || reducedMotion()) {
      onClose();
      return;
    }
    setClosing(true);
    setOpen(false);

    // Start from wherever the piece is right now (it may still be flying in),
    // then measure the resting box with the flight cleared.
    const from = getComputedStyle(el).transform;
    const fromClip = getComputedStyle(el).clipPath;
    flightRef.current?.cancel();
    const tile = origin.getBoundingClientRect();
    const rest = restingBox(el);
    const home = flipTransform(tile, rest, fillY);

    const clip = el.querySelector('video');
    const originClip = clipOf(origin);
    if (clip && originClip) originClip.currentTime = clip.currentTime;

    const back = el.animate(
      [
        { transform: from === 'none' ? 'none' : from, clipPath: fromClip === 'none' ? NO_CROP : fromClip },
        { transform: home, clipPath: tileCrop(tile, rest, fillY) },
      ],
      {
        duration: FLIGHT_OUT_MS,
        easing: FLIGHT_EASE,
        fill: 'forwards',
      },
    );
    back.onfinish = onClose;
  }, [onClose, origin, fillY]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [dismiss]);

  return createPortal(
    <div
      className={`od-preview${open ? ' is-open' : ''}${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={dismiss}
    >
      <div className="od-preview__backdrop" aria-hidden="true" />
      <CloseButton onClose={dismiss} />
      <div className="od-preview__panel" onClick={(e) => e.stopPropagation()}>
        <div className={`od-preview__media${project.edgeBlur ? ' od-preview__media--edge-blur' : ''}`} ref={mediaRef}>
          <ProjectMedia media={project.media} variant="preview" />
          {project.media.kind === 'video' && project.media.sound ? <SoundToggle host={mediaRef} /> : null}
          {project.link ? <PrototypeLink href={project.link} frame /> : null}
        </div>
        <div className="od-preview__meta">
          <div className="od-preview__head">
            <span className="od-preview__title">{project.title}</span>
            <span className="od-preview__year">{project.year}</span>
          </div>
          <p className="od-preview__desc">{project.description}</p>
          {project.credits ? <p className="od-preview__credits">{project.credits}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** One piece at the size the zoom overlay used to open it to, with its write-up
 *  underneath. Playback (flipbooks and clips) runs only while the slide is on
 *  screen. */
function Slide({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const videos = mediaRef.current?.querySelectorAll('video');
    videos?.forEach((video) => {
      if (live) void video.play().catch(() => {});
      else video.pause();
    });
  }, [live]);

  return (
    <article className="od-slide" data-od-id={project.id} ref={ref} aria-label={project.title}>
      {/* Scaled on its own so the article's box — what the row measures and
          scrolls — stays full size while the piece itself grows and shrinks. */}
      <div className="od-slide__body">
        <div className={`od-preview__media${project.edgeBlur ? ' od-preview__media--edge-blur' : ''}`} ref={mediaRef}>
          <ProjectMedia media={project.media} variant="preview" paused={!live} />
          {project.media.kind === 'video' && project.media.sound ? <SoundToggle host={mediaRef} /> : null}
        </div>
        <div className="od-preview__meta">
          <div className="od-preview__head">
            <span className="od-preview__title">{project.title}</span>
            <span className="od-preview__year">{project.year}</span>
          </div>
          <p className="od-preview__desc">{project.description}</p>
          {project.credits ? <p className="od-preview__credits">{project.credits}</p> : null}
          {project.link ? <PrototypeLink href={project.link} /> : null}
        </div>
      </div>
    </article>
  );
}

/** The zoomed view for the grid. The clicked piece enlarges from its tile to
 *  the centre, the same flight as a single preview. Neighbors sit fully off
 *  screen. Scrolling to the next one slides the row with it: the open piece
 *  travels off to the left as the next comes in, and back the other way when
 *  scrolling to the previous. Closing flies the open piece home. The short
 *  bar under it shows which project is open. */
function GalleryPreview({
  startId,
  origin,
  onHideTile,
  onClose,
}: {
  startId: string;
  origin: HTMLElement;
  onHideTile: (id: string) => void;
  onClose: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(Math.max(0, PROJECTS.findIndex((project) => project.id === startId)));
  const layoutSig = useRef('');
  const slideGen = useRef(0);
  const slideFrame = useRef<number | null>(null);
  const sliding = useRef(false);
  const flightRef = useRef<Animation | null>(null);
  const flew = useRef(false);
  const landed = useRef(false);
  const closingRef = useRef(false);
  const onHideTileRef = useRef(onHideTile);
  const onCloseRef = useRef(onClose);
  const originRef = useRef(origin);
  onHideTileRef.current = onHideTile;
  onCloseRef.current = onClose;
  originRef.current = origin;
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [index, setIndex] = useState(indexRef.current);
  const startProject = PROJECTS[Math.max(0, PROJECTS.findIndex((project) => project.id === startId))];
  const openFillY = startProject.media.kind === 'video' ? (startProject.media.fill?.y ?? 0.5) : 0.5;

  const slidesOf = useCallback(
    () => [...(trackRef.current?.querySelectorAll<HTMLElement>('.od-slide') ?? [])],
    [],
  );

  const centerLeft = useCallback((slide: HTMLElement) => {
    const scroller = scrollerRef.current;
    if (!scroller) return 0;
    const view = scroller.getBoundingClientRect();
    const box = slide.getBoundingClientRect();
    return scroller.scrollLeft + (box.left + box.width / 2) - (view.left + view.width / 2);
  }, []);

  const nearestIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    const slides = slidesOf();
    if (!scroller || slides.length === 0) return 0;
    const mid = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const box = slide.getBoundingClientRect();
      const dist = Math.abs(box.left + box.width / 2 - mid);
      if (dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    });
    return best;
  }, [slidesOf]);

  const placeThumb = useCallback((i: number) => {
    const bar = barRef.current;
    const thumb = thumbRef.current;
    if (!bar || !thumb) return;
    const n = PROJECTS.length;
    const thumbW = bar.clientWidth / n;
    thumb.style.width = `${thumbW}px`;
    thumb.style.transform = `translateX(${i * thumbW}px)`;
    bar.setAttribute('aria-valuenow', String(i + 1));
    bar.setAttribute('aria-valuemax', String(n));
    bar.setAttribute('aria-valuetext', `${i + 1} of ${n}`);
  }, []);

  const applyMask = useCallback((i: number) => {
    const scroller = scrollerRef.current;
    const current = slidesOf()[i];
    if (!scroller || !current) return;
    // While the piece is still flying in or home, a mask would clip it off
    // the tile. Neighbors are already past the screen edge.
    if (!landed.current) {
      scroller.style.maskImage = 'none';
      scroller.style.setProperty('-webkit-mask-image', 'none');
      return;
    }
    const view = scroller.getBoundingClientRect();
    const box = current.getBoundingClientRect();
    const a = Math.max(0, box.left - view.left);
    const b = Math.min(view.width, box.right - view.left);
    const mask = `linear-gradient(to right, transparent ${a}px, #000 ${a}px, #000 ${b}px, transparent ${b}px)`;
    scroller.style.maskImage = mask;
    scroller.style.setProperty('-webkit-mask-image', mask);
  }, [slidesOf]);

  const sync = useCallback(() => {
    const i = nearestIndex();
    indexRef.current = i;
    setIndex(i);
    placeThumb(i);
    applyMask(i);
  }, [nearestIndex, placeThumb, applyMask]);

  const layout = useCallback((active: number) => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    const slides = slidesOf();
    if (!scroller || !track || slides.length === 0) return false;
    const view = scroller.clientWidth;
    slides.forEach((slide) => slide.style.removeProperty('--od-slide-w'));
    const widths = slides.map((slide) => slide.offsetWidth);
    if (widths.some((width) => width < 80)) return false;
    const sig = `${active}:${view}:${widths.join(',')}`;
    if (sig === layoutSig.current) return false;
    layoutSig.current = sig;
    const current = widths[active] ?? 0;
    // Neighbors start just past the screen edge, so nothing of them shows.
    const hide = neighborGap(view, current);
    slides.forEach((slide, i) => {
      // Parked: only the open piece is visible, at full size. Neighbors wait
      // at the entrance scale. The slide writes both itself, so a resize
      // mid-slide must not snap them.
      if (!sliding.current) {
        slide.style.opacity = i === active ? '1' : '0';
        const body = slide.querySelector<HTMLElement>('.od-slide__body');
        if (body) body.style.transform = i === active ? '' : `scale(${SLIDE_SCALE})`;
      }
      if (i === slides.length - 1) {
        slide.style.marginRight = '';
        return;
      }
      const gap = i === active - 1 || i === active ? hide : view;
      slide.style.marginRight = `${gap}px`;
    });
    track.style.paddingLeft = `${Math.max(0, (view - widths[0]) / 2)}px`;
    track.style.paddingRight = `${Math.max(0, (view - widths[widths.length - 1]) / 2)}px`;
    return true;
  }, [slidesOf]);

  const cancelSlide = useCallback(() => {
    slideGen.current += 1;
    if (slideFrame.current != null) cancelAnimationFrame(slideFrame.current);
    slideFrame.current = null;
    sliding.current = false;
    // The slide rewrites margins outside layout(); drop the signature so the
    // next park rebuilds them instead of trusting the mid-slide spacing.
    layoutSig.current = '';
  }, []);

  const placeThumbAt = useCallback((position: number) => {
    const bar = barRef.current;
    const thumb = thumbRef.current;
    if (!bar || !thumb) return;
    const thumbW = bar.clientWidth / PROJECTS.length;
    thumb.style.width = `${thumbW}px`;
    thumb.style.transform = `translateX(${position * thumbW}px)`;
  }, []);

  /** Park `i` in the centre immediately. Used for the scrollbar, for a jump
   *  of more than one project, and when motion is reduced. */
  const jumpToIndex = useCallback(
    (i: number) => {
      const scroller = scrollerRef.current;
      layout(i);
      const slide = slidesOf()[i];
      if (!scroller || !slide) return;
      scroller.scrollTo({ left: Math.max(0, centerLeft(slide)), behavior: 'auto' });
      indexRef.current = i;
      setIndex(i);
      placeThumb(i);
      applyMask(i);
    },
    [layout, slidesOf, centerLeft, placeThumb, applyMask],
  );

  /** Slide from the open project to the next or previous one. The row moves
   *  with the scroll: forward, the open piece travels left, fades out, and
   *  shrinks while the next fades in and grows to full size as it reaches the
   *  centre; backward, both travel the other way. The gap between them eases
   *  from the outgoing width's off-screen spacing to the incoming one's, so a
   *  wider or narrower piece doesn't pop at either end. */
  const slideToIndex = useCallback(
    (from: number, dest: number) => {
      const scroller = scrollerRef.current;
      const slides = slidesOf();
      const fromSlide = slides[from];
      const toSlide = slides[dest];
      if (!scroller || !fromSlide || !toSlide) return false;
      const view = scroller.clientWidth;
      const fromW = fromSlide.offsetWidth;
      const toW = toSlide.offsetWidth;
      if (view < 80 || fromW < 80 || toW < 80) return false;

      const hide = (width: number) => neighborGap(view, width);
      const forward = dest > from;
      const fromX0 = view / 2;
      const toX1 = view / 2;
      const fromX1 = forward
        ? view / 2 - toW / 2 - hide(toW) - fromW / 2
        : view / 2 + toW / 2 + hide(toW) + fromW / 2;
      const toX0 = forward
        ? view / 2 + fromW / 2 + hide(fromW) + toW / 2
        : view / 2 - fromW / 2 - hide(fromW) - toW / 2;
      const leftSlide = slides[Math.min(from, dest)];
      const gen = (slideGen.current += 1);

      const bodyOf = (slide: HTMLElement) => slide.querySelector<HTMLElement>('.od-slide__body');
      const paintScale = (slide: HTMLElement, scale: number) => {
        const body = bodyOf(slide);
        if (body) body.style.transform = scale === 1 ? '' : `scale(${scale})`;
      };

      sliding.current = true;
      indexRef.current = dest;
      fromSlide.style.opacity = '1';
      toSlide.style.opacity = '0';
      paintScale(fromSlide, 1);
      paintScale(toSlide, SLIDE_SCALE);
      scroller.style.maskImage = 'none';
      scroller.style.setProperty('-webkit-mask-image', 'none');

      const contentLeft = (slide: HTMLElement) => {
        const viewBox = scroller.getBoundingClientRect();
        const box = slide.getBoundingClientRect();
        return scroller.scrollLeft + (box.left - viewBox.left);
      };

      const finish = () => {
        if (slideGen.current !== gen) return;
        slideFrame.current = null;
        // layout() leaves opacities alone while a slide is running, so park
        // them here: the one that arrived is solid, everything else is gone.
        sliding.current = false;
        layout(dest);
        const parked = slidesOf();
        parked.forEach((slide, i) => {
          const here = i === dest;
          slide.style.opacity = here ? '1' : '0';
          const body = slide.querySelector<HTMLElement>('.od-slide__body');
          if (body) body.style.transform = here ? '' : `scale(${SLIDE_SCALE})`;
        });
        const slide = parked[dest];
        if (slide) scroller.scrollLeft = Math.max(0, centerLeft(slide));
        indexRef.current = dest;
        setIndex(dest);
        placeThumb(dest);
        applyMask(dest);
      };

      const started = performance.now();
      const step = (now: number) => {
        if (slideGen.current !== gen) return;
        const raw = Math.min(1, (now - started) / SLIDE_MS);
        if (raw >= 1) {
          finish();
          return;
        }
        const e = slideEase(raw);
        const fromX = fromX0 + (fromX1 - fromX0) * e;
        const toX = toX0 + (toX1 - toX0) * e;
        const gap = Math.abs(toX - fromX) - fromW / 2 - toW / 2;
        leftSlide.style.marginRight = `${Math.max(0, gap)}px`;
        fromSlide.style.opacity = String(1 - e);
        toSlide.style.opacity = String(e);
        paintScale(fromSlide, 1 - (1 - SLIDE_SCALE) * e);
        paintScale(toSlide, SLIDE_SCALE + (1 - SLIDE_SCALE) * e);
        scroller.scrollLeft = Math.max(0, contentLeft(fromSlide) + fromW / 2 - fromX);
        placeThumbAt(from + (dest - from) * e);
        slideFrame.current = requestAnimationFrame(step);
      };
      slideFrame.current = requestAnimationFrame(step);
      return true;
    },
    [layout, slidesOf, centerLeft, placeThumb, placeThumbAt, applyMask],
  );

  const scrollToIndex = useCallback(
    (i: number, behavior: 'slide' | 'jump' = 'slide') => {
      if (!landed.current || closingRef.current) return;
      const dest = Math.max(0, Math.min(PROJECTS.length - 1, i));
      if (behavior === 'jump') {
        if (sliding.current) cancelSlide();
      } else if (sliding.current) return;
      const from = indexRef.current;
      if (
        behavior === 'slide' &&
        dest !== from &&
        Math.abs(dest - from) === 1 &&
        !reducedMotion() &&
        slideToIndex(from, dest)
      ) {
        return;
      }
      jumpToIndex(dest);
    },
    [cancelSlide, jumpToIndex, slideToIndex],
  );

  const unclip = useCallback(() => {
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    // The piece has to travel from a tile that may sit outside the row's box.
    if (scroller) scroller.style.overflow = 'visible';
    if (sheet) sheet.style.overflow = 'visible';
  }, []);

  const reclip = useCallback(() => {
    const scroller = scrollerRef.current;
    scroller?.style.removeProperty('overflow');
    sheetRef.current?.style.removeProperty('overflow');
    landed.current = true;
    // Scrolling is a no-op while unclipped, so any re-centre during the
    // flight was dropped; catch up now that the row can scroll again.
    const slide = slidesOf()[indexRef.current];
    if (scroller && slide) scroller.scrollLeft = Math.max(0, centerLeft(slide));
    applyMask(indexRef.current);
  }, [applyMask, slidesOf, centerLeft]);

  useLayoutEffect(() => {
    let cleaned = false;
    let removeReady: (() => void) | undefined;

    const settle = () => {
      // Margin changes during a slide resize the track. Leave that animation
      // alone; it parks itself when it finishes.
      if (sliding.current || closingRef.current) return;
      const i = indexRef.current;
      if (!layout(i)) return;
      const scroller = scrollerRef.current;
      const slide = slidesOf()[i];
      if (!scroller || !slide) return;
      scroller.scrollTo({ left: Math.max(0, centerLeft(slide)), behavior: 'auto' });
      // The open project is already known; reading it back from the scroll
      // position would report the first one while the row is unclipped.
      setIndex(i);
      placeThumb(i);
      applyMask(i);
    };

    const tryLaunch = () => {
      if (cleaned || flew.current) return;
      const media = slidesOf()[indexRef.current]?.querySelector<HTMLElement>('.od-preview__media');
      if (!media) return;
      const art = media.querySelector<HTMLElement>('img, video');
      const ready =
        art instanceof HTMLVideoElement
          ? art.readyState >= HTMLMediaElement.HAVE_METADATA
          : art instanceof HTMLImageElement
            ? art.complete && art.naturalWidth > 0
            : true;
      if (!(ready && media.getBoundingClientRect().width > 0)) {
        media.style.visibility = 'hidden';
        if (!removeReady && art) {
          const readyEvent = art instanceof HTMLVideoElement ? 'loadedmetadata' : 'load';
          const onReady = () => tryLaunch();
          art.addEventListener(readyEvent, onReady, { once: true });
          removeReady = () => art.removeEventListener(readyEvent, onReady);
        }
        return;
      }
      flew.current = true;
      media.style.visibility = '';
      settle();
      const rest = restingBox(media);
      const originClip = clipOf(originRef.current);
      if (art instanceof HTMLVideoElement && originClip) art.currentTime = originClip.currentTime;
      if (!reducedMotion() && rest.width > 0) {
        const tile = originRef.current.getBoundingClientRect();
        unclip();
        flightRef.current?.cancel();
        const flight = media.animate(
          [
            { transform: flipTransform(tile, rest, openFillY), clipPath: tileCrop(tile, rest, openFillY) },
            { transform: 'none', clipPath: NO_CROP },
          ],
          { duration: FLIGHT_IN_MS, easing: FLIGHT_EASE },
        );
        flightRef.current = flight;
        flight.onfinish = () => {
          if (cleaned || closingRef.current) return;
          flightRef.current = null;
          reclip();
        };
      } else {
        reclip();
      }
      onHideTileRef.current(startId);
      setOpen(true);
    };

    settle();
    tryLaunch();
    const fallback = window.setTimeout(tryLaunch, 600);
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    const ro = new ResizeObserver(() => {
      settle();
      tryLaunch();
    });
    if (scroller) ro.observe(scroller);
    if (track) ro.observe(track);
    return () => {
      cleaned = true;
      removeReady?.();
      window.clearTimeout(fallback);
      flightRef.current?.cancel();
      flightRef.current = null;
      if (!landed.current) flew.current = false;
      slideGen.current += 1;
      if (slideFrame.current != null) cancelAnimationFrame(slideFrame.current);
      slideFrame.current = null;
      sliding.current = false;
      ro.disconnect();
    };
  }, [layout, slidesOf, centerLeft, placeThumb, applyMask, unclip, reclip, openFillY, startId]);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    cancelSlide();
    const media = slidesOf()[indexRef.current]?.querySelector<HTMLElement>('.od-preview__media') ?? null;
    const project = PROJECTS[indexRef.current];
    const tileButton = project ? document.querySelector<HTMLElement>(`[data-od-tile="${project.id}"]`) : null;
    const tileArt = tileButton?.querySelector<HTMLElement>('.device-ipad, canvas, img, video') ?? tileButton;
    if (!media || !tileArt || reducedMotion()) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    setOpen(false);
    onHideTileRef.current(project.id);
    unclip();
    landed.current = false;
    const from = getComputedStyle(media).transform;
    const fromClip = getComputedStyle(media).clipPath;
    flightRef.current?.cancel();
    const y = project.media.kind === 'video' ? (project.media.fill?.y ?? 0.5) : 0.5;
    const tile = tileArt.getBoundingClientRect();
    const rest = restingBox(media);
    const clip = media.querySelector('video');
    const homeClip = clipOf(tileArt);
    if (clip && homeClip) homeClip.currentTime = clip.currentTime;
    const back = media.animate(
      [
        { transform: from === 'none' ? 'none' : from, clipPath: fromClip === 'none' ? NO_CROP : fromClip },
        { transform: flipTransform(tile, rest, y), clipPath: tileCrop(tile, rest, y) },
      ],
      { duration: FLIGHT_OUT_MS, easing: FLIGHT_EASE, fill: 'forwards' },
    );
    flightRef.current = back;
    back.onfinish = () => onCloseRef.current();
  }, [cancelSlide, slidesOf, unclip]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      else if (e.key === 'ArrowRight') scrollToIndex(Math.min(PROJECTS.length - 1, indexRef.current + 1));
      else if (e.key === 'ArrowLeft') scrollToIndex(Math.max(0, indexRef.current - 1));
      else if (e.key === 'Home') scrollToIndex(0, 'jump');
      else if (e.key === 'End') scrollToIndex(PROJECTS.length - 1, 'jump');
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    // A trackpad swipe keeps emitting momentum wheel events well after the
    // slide finishes; the lock holds until the stream goes quiet so one
    // gesture only ever moves one item.
    let wheelLock = false;
    let quietTimer = 0;
    const holdUntilQuiet = () => {
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(() => {
        if (sliding.current) holdUntilQuiet();
        else wheelLock = false;
      }, WHEEL_QUIET_MS);
    };
    const onScroll = () => {
      // While the piece flies in (or home) the row is unclipped, which drops
      // its scroll offset to 0. Reading the open project back from that would
      // pick the first one and park the clicked piece off screen.
      if (sliding.current || !landed.current || closingRef.current) return;
      sync();
    };
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    const onWheel = (e: WheelEvent) => {
      if (!scroller) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      e.preventDefault();
      if (wheelLock) {
        holdUntilQuiet();
        return;
      }
      if (sliding.current || !landed.current || closingRef.current) return;
      const dir = delta > 0 ? 1 : -1;
      const next = Math.min(PROJECTS.length - 1, Math.max(0, indexRef.current + dir));
      wheelLock = true;
      holdUntilQuiet();
      if (next !== indexRef.current) scrollToIndex(next);
    };
    sheet?.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      scroller?.removeEventListener('scroll', onScroll);
      sheet?.removeEventListener('wheel', onWheel);
      window.clearTimeout(quietTimer);
    };
  }, [dismiss, scrollToIndex, sync]);

  const onBarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    const thumb = thumbRef.current;
    if (!bar || !thumb) return;
    e.stopPropagation();
    const indexAt = (clientX: number) => {
      const rect = bar.getBoundingClientRect();
      const thumbW = thumb.getBoundingClientRect().width || rect.width / PROJECTS.length;
      const span = Math.max(1, rect.width - thumbW);
      const ratio = (clientX - rect.left - thumbW / 2) / span;
      return Math.min(PROJECTS.length - 1, Math.max(0, Math.round(ratio * (PROJECTS.length - 1))));
    };
    const jump = (clientX: number) => scrollToIndex(indexAt(clientX), 'jump');
    jump(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => jump(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    bar.focus();
  };

  return createPortal(
    <div
      className={`od-preview od-zoom${open ? ' is-open' : ''}${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Other mediums of design"
      onClick={dismiss}
    >
      <div className="od-preview__backdrop" aria-hidden="true" />
      <CloseButton onClose={dismiss} />
      <div className="od-zoom__sheet" ref={sheetRef}>
        <div
          className="od-rail__scroller"
          id="other-designs-scroller"
          ref={scrollerRef}
          onClick={(e) => {
            // The row is full-bleed, and the off-screen neighbors are only
            // hidden by a mask, so a click beside the piece still lands in
            // here. Keep the open piece (and its controls); let the rest
            // bubble up and close, the same as the empty frost.
            const current = slidesOf()[indexRef.current];
            if (current?.contains(e.target as Node)) e.stopPropagation();
          }}
        >
          <div className="od-rail__track" ref={trackRef}>
            {PROJECTS.map((project) => (
              <Slide key={project.id} project={project} />
            ))}
          </div>
        </div>
        <div className="od-zoom__progress" onClick={(e) => e.stopPropagation()}>
          <div
            className="od-rail__bar"
            ref={barRef}
            role="scrollbar"
            aria-controls="other-designs-scroller"
            aria-orientation="horizontal"
            aria-valuemin={1}
            aria-valuemax={PROJECTS.length}
            aria-valuenow={index + 1}
            aria-valuetext={`${index + 1} of ${PROJECTS.length}`}
            aria-label="Project position"
            tabIndex={0}
            onPointerDown={onBarPointerDown}
          >
            <div className="od-rail__thumb" ref={thumbRef} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function OtherDesigns() {
  const [active, setActive] = useState<{ id: string; origin: HTMLElement } | null>(null);
  const [hiddenId, setHiddenId] = useState<string | null>(null);
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => setCanPortal(true), []);

  return (
    <section className="other-designs" aria-label="Other mediums of design I explored with">
      <h2 className="other-designs__title">{'Other mediums of design I explored with...'}</h2>
      <div
        className="other-designs__grid"
        onPointerOut={(e) => {
          const tile = (e.target as Element).closest('.other-design');
          if (tile && !tile.contains(e.relatedTarget as Node | null)) e.currentTarget.dataset.warm = '';
        }}
        onPointerLeave={(e) => {
          delete e.currentTarget.dataset.warm;
        }}
      >
        {PROJECTS.map((project) => (
          <Tile
            key={project.id}
            project={project}
            active={active?.id === project.id}
            flown={hiddenId === project.id}
            onOpen={(origin) => setActive({ id: project.id, origin })}
          />
        ))}
      </div>
      {canPortal && active ? (
        <GalleryPreview
          startId={active.id}
          origin={active.origin}
          onHideTile={setHiddenId}
          onClose={() => {
            setActive(null);
            setHiddenId(null);
          }}
        />
      ) : null}
    </section>
  );
}

/** One project on its own, outside the grid: the same tile and zoom-up
 *  preview, with its own open/close state. On hover it says `pillLabel` in the
 *  site's cursor-follow pill (the one "Currently building" uses beside it)
 *  rather than sliding up the name bar — the card's title already sits below. */
function SoloProject({
  project,
  className,
  pillLabel,
}: {
  project: Project;
  className?: string;
  pillLabel: string;
}) {
  const [origin, setOrigin] = useState<HTMLElement | null>(null);
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();
  const [flown, setFlown] = useState(false);
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => setCanPortal(true), []);

  const launch = useCallback(() => setFlown(true), []);
  const close = useCallback(() => {
    setOrigin(null);
    setFlown(false);
  }, []);

  return (
    <>
      <Tile
        project={project}
        className={className}
        bar={false}
        pointer={pillHandlers}
        active={origin !== null}
        flown={origin !== null && flown}
        onOpen={(art) => {
          // Drop the pill on the click itself, so it never floats over the
          // preview while the cursor is still inside the card.
          pillHandlers.onMouseLeave();
          setOrigin(art);
        }}
      />
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label={pillLabel} /> : null}
      {canPortal && origin ? <Preview project={project} origin={origin} onLaunch={launch} onClose={close} /> : null}
    </>
  );
}

/** The Pinch prototype, filling whatever box hosts it (the Recent prototypes
 *  row in VibeCoding). */
export function PinchPrototype() {
  return <SoloProject project={PINCH} className="other-design--slot" pillLabel="View more" />;
}

/** The language-feedback prototype, the same way as Pinch. */
export function LanguagePrototype() {
  return <SoloProject project={LANGUAGE} className="other-design--slot" pillLabel="View more" />;
}

/** The animated text bubbles prototype, the same way as Pinch. */
export function TextingPrototype() {
  return <SoloProject project={TEXTING} className="other-design--slot" pillLabel="View more" />;
}
