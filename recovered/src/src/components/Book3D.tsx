'use client';

import './book3d.css';

/**
 * The 3D hardcover from bookcomponent.framer.website, rebuilt in CSS.
 *
 * Three faces live in one `preserve-3d` box: the front cover, a fore-edge panel
 * hinged 90deg off the right edge, and the back board pushed `--book-depth`
 * behind. At rest the stack reads as a flat cover; on hover the whole box swings
 * about its left edge so the right side comes toward the viewer and the page
 * block opens into view.
 *
 * The cover art itself is just an <img> — swap `cover` for any jacket.
 */

type Book3DProps = {
  /** Cover artwork. */
  cover?: string;
  alt?: string;
  /**
   * Rendered width; height follows `aspect`. A number is taken as px, a string
   * as any CSS length — so the book can be sized in `cqw` and scale with a
   * container the way the sticker board does.
   */
  width?: number | string;
  /** width / height of the cover. */
  aspect?: number;
  /**
   * Board thickness — how far the fore-edge and back board sit back. Same
   * number-is-px / string-is-CSS-length rule as `width`.
   */
  depth?: number | string;
  /** How far the book turns on hover, in degrees. */
  angle?: number;
  className?: string;
};

export default function Book3D({
  cover = '/assets/images/swipe-to-unlock.svg',
  alt = 'Swipe to Unlock — The Primer on Technology and Business Strategy',
  width = 276,
  aspect = 0.66,
  depth = 28,
  angle = 52,
  className,
}: Book3DProps) {
  const len = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

  return (
    <div
      className={`book3d-stage${className ? ` ${className}` : ''}`}
      style={
        {
          '--book-w': len(width),
          '--book-aspect': `${aspect}`,
          '--book-depth': len(depth),
          '--book-angle': `${angle}deg`,
        } as React.CSSProperties
      }
    >
      <div className="book3d">
        {/* back board + page block, sitting a full depth behind the cover */}
        <div className="book3d-back" aria-hidden="true" />

        {/* fore-edge: hinged off the cover's right edge, so it recedes in Z */}
        <div className="book3d-foreedge" aria-hidden="true" />

        <div className="book3d-cover">
          <img className="book3d-art" src={cover} alt={alt} draggable={false} />

          {/* crease running down the hinge, the way a wrapped board creases */}
          <div className="book3d-spine" aria-hidden="true">
            <span className="book3d-spine-left" />
            <span className="book3d-spine-mid" />
            <span className="book3d-spine-right" />
          </div>

          {/* paper sheen, then the light catching the top edge */}
          <div className="book3d-gloss" aria-hidden="true" />
          <div className="book3d-inner-light" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
