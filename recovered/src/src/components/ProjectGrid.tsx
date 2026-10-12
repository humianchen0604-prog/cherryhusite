'use client';

import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';
import { PROJECTS, type Project } from '@/components/projects-data';
import TikTokProjectCover from '@/components/TikTokProjectCover';

/**
 * Featured projects, laid out the way angelinacao.com presents hers: two vertical
 * stacks, each thumbnail at its own natural proportion so the columns stagger
 * (瀑布流) rather than lining up as a grid. The caption sits directly underneath —
 * title (with its brand trailing) on the left, its tag on the right.
 *
 * Projects alternate between the columns in source order (1st left, 2nd right,
 * 3rd left …) rather than filling one column and then the other, so reading
 * across the top gives the two most recent.
 *
 * The whole card — thumbnail, title, and subtext alike — shares one cursor-follow
 * "View project" pill (same primitive the case-study pages use for "Copy email" /
 * "Open site"): the handlers sit on the outer container, so entering any child
 * counts as one hover of the card rather than three separate ones.
 *
 * The data itself (`PROJECTS`/`Project`) lives in projects-data.ts, not here —
 * see that file for why.
 */
const PILL_LABEL = 'Open project';

export function ProjectCard({ project, order }: { project: Project; order?: number }) {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  const body = (
    <>
      <div className="project-card__thumb" style={{ aspectRatio: project.ratio }}>
        {project.cover === 'tiktok-pixel' ? (
          <TikTokProjectCover hovered={on} video={project.video} />
        ) : project.video ? (
          /* Playback is driven by the page-level <VideoAutoplay>, which observes
             every video and only starts the ones in view. */
          <video
            className="project-card__media"
            src={project.video}
            muted
            loop
            playsInline
            preload="none"
          />
        ) : (
          <div className="project-card__media project-card__media--placeholder" />
        )}
      </div>
      <div className="project-card__caption">
        <div className="project-card__line">
          <h3 className="project-card__title">
            {project.title}, <span className="project-card__brand">{project.brand}</span>
          </h3>
          <span className="project-card__context">{project.context}</span>
        </div>
      </div>
    </>
  );

  // `--card-order` restores source order when the phone breakpoint flattens the
  // two columns into one; the DOM order there is 1,3,5,2,4.
  const style =
    order == null ? undefined : ({ '--card-order': order } as React.CSSProperties);

  // Only some have somewhere to go; the rest must not look or behave like links.
  // A click follows the link to the case study. These thumbnails do not open
  // the in-page preview panel.
  return (
    <>
      {project.href ? (
        <a className="project-card" href={project.href} style={style} {...pillHandlers}>
          {body}
        </a>
      ) : (
        <div className="project-card" style={style} {...pillHandlers}>
          {body}
        </div>
      )}
      {mounted ? (
        <CursorFollowPill pillRef={pillRef} on={on} label={project.pill ?? PILL_LABEL} />
      ) : null}
    </>
  );
}

const COLUMN_COUNT = 2;

export default function ProjectGrid() {
  // Round-robin rather than splitting the list in half, so the order reads across
  // the two stacks instead of down one and back up the other.
  const columns: { project: Project; order: number }[][] = Array.from(
    { length: COLUMN_COUNT },
    () => []
  );
  PROJECTS.forEach((project, i) => columns[i % COLUMN_COUNT].push({ project, order: i }));

  return (
    <div className="project-grid">
      {columns.map((column, i) => (
        <div className="project-grid__col" key={i}>
          {column.map(({ project, order }) => (
            <ProjectCard key={project.title} project={project} order={order} />
          ))}
        </div>
      ))}
    </div>
  );
}
