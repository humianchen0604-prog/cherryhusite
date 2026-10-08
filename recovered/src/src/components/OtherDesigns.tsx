'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
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
 * Clicking any tile opens a preview overlay: the piece zooms up to centre over
 * a blurred page, with a short write-up beneath it (see Preview / PROJECTS).
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
  /** A live build, linked under the credits in the preview as "Try prototype ↗". */
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
      if (!visible || !vw) return;
      const sy = (trim * vh) / bend.h; // trimY is in the clip's own pixels
      ctx.clearRect(0, 0, cw, ch);
      for (const s of strips) {
        ctx.drawImage(video, s.u0 * vw, sy, Math.max(0.5, (s.u1 - s.u0) * vw), vh - sy * 2, s.dx, s.dy, s.dw, s.dh);
      }
    };

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
    };
  }, [bend.deg, bend.h, trim, cw, ch]);

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
 *  Loom page), with the same arrow that nudges on hover. */
function PrototypeLink({ href }: { href: string }) {
  const arrow = useRef<ArrowUpRightIconHandle>(null);
  const reduced = useReducedMotion();
  return (
    <a
      className="od-preview__link"
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

/** The preview overlay. The artwork flies from its tile (`origin`) to the
 *  centre while the frost fades in on the same curve; the copy follows just
 *  behind. Closing flies it back into the tile before unmounting.
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
      <div className="od-preview__panel" onClick={(e) => e.stopPropagation()}>
        <div className={`od-preview__media${project.edgeBlur ? ' od-preview__media--edge-blur' : ''}`} ref={mediaRef}>
          <ProjectMedia media={project.media} variant="preview" />
          {project.media.kind === 'video' && project.media.sound ? <SoundToggle host={mediaRef} /> : null}
        </div>
        <div className="od-preview__meta">
          <div className="od-preview__head">
            <span className="od-preview__title">{project.title}</span>
            <span className="od-preview__year">{project.year}</span>
          </div>
          <p className="od-preview__desc">{project.description}</p>
          {project.credits ? <p className="od-preview__credits">{project.credits}</p> : null}
          {project.link ? (
            <PrototypeLink href={project.link} />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function OtherDesigns() {
  const [active, setActive] = useState<{ project: Project; origin: HTMLElement } | null>(null);
  // Set once the preview's artwork has actually taken off, so the tile never
  // goes blank while the preview copy is still waiting to be measured.
  const [flown, setFlown] = useState(false);
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => setCanPortal(true), []);

  const launch = useCallback(() => setFlown(true), []);
  const close = useCallback(() => {
    setActive(null);
    setFlown(false);
  }, []);

  return (
    <section className="other-designs" aria-label="Other mediums of design I explored with">
      <h2 className="other-designs__title">{'Other mediums of design I explored with...'}</h2>
      <div
        className="other-designs__grid"
        // "Warm" once the cursor has left a first tile without leaving the
        // grid: from then on, tile-to-tile hovers skip the slow entrance (see
        // .other-designs__grid[data-warm] in globals.css). A DOM attribute, not
        // state, so hovering never re-renders the tiles.
        onPointerOut={(e) => {
          const tile = (e.target as Element).closest('.other-design');
          if (tile && !tile.contains(e.relatedTarget as Node | null)) e.currentTarget.dataset.warm = '';
        }}
        onPointerLeave={(e) => {
          delete e.currentTarget.dataset.warm;
        }}
      >
        {PROJECTS.map((project) => {
          const isActive = active?.project.id === project.id;
          return (
            <Tile
              key={project.id}
              project={project}
              active={isActive}
              flown={isActive && flown}
              onOpen={(origin) => setActive({ project, origin })}
            />
          );
        })}
      </div>
      {canPortal && active ? (
        <Preview project={active.project} origin={active.origin} onLaunch={launch} onClose={close} />
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
