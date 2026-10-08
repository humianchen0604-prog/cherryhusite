/**
 * Featured-project data. Deliberately its own plain module (no 'use client'):
 * GrumbleBody.tsx and CaseStudyBody.tsx are Server Components that `.filter()`
 * this array directly at render time. Exporting it from ProjectGrid.tsx instead
 * — a Client Component, needed there for the cursor-follow hover hook — breaks
 * that: everything a 'use client' module exports becomes a client reference
 * when a Server Component imports it, and `.filter` isn't a method a plain data
 * array's proxy carries. Keeping the data server-safe and letting ProjectGrid.tsx
 * import it (rather than define it) avoids that.
 */

export type Project = {
  title: string;
  /** Shown after the title, in the same line but stepped back. */
  brand: string;
  context: string;
  /** The media's own width/height, so nothing is cropped or letterboxed. */
  ratio: string;
  video?: string;
  href?: string;
  /** Hover pill; defaults to "Open project". */
  pill?: string;
  /** Interactive cover instead of a video — TikTok's PixelBlast preview. */
  cover?: 'tiktok-pixel';
};

export const PROJECTS: Project[] = [
  {
    title: 'Designing account experiences at scale',
    brand: 'TikTok',
    context: 'Shipped Q3 2026',
    /* Matches the bento frame (1506×1080) so the collage fills the padded plate. */
    ratio: '1506 / 1080',
    video: '/assets/media/tiktok-cover.mp4?v=2',
    cover: 'tiktok-pixel',
    href: '/tiktok',
  },
  {
    title: 'AI canvas to align on ideas for creatives',
    brand: 'Loom',
    context: 'Concept 2026',
    ratio: '1700 / 1080',
    video: '/assets/media/loom-preview.mp4',
    href: '/loom',
  },
  {
    title: 'A feed redesign that moved the metrics',
    brand: 'Lemon8',
    context: 'Shipped 2025',
    ratio: '1938 / 1080',
    video: '/assets/media/lemon8-cover.mp4',
    href: '/notestaboptimization',
  },
  {
    title: 'Social app that finds you a lunch buddy',
    brand: 'Grumble',
    context: 'FigBuild 2026',
    ratio: '1200 / 1198',
    video: '/assets/media/grumble-cover.mp4',
    href: '/grumble',
  },
];
