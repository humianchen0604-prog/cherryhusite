import type { ReactNode } from 'react';

/** Die-cut sticker plate: a puffy #D9D9D9 offset that follows the glyph. */
export const STICKER_FILL = '#D9D9D9';
export const STICKER_GLYPH = 'rgb(0 0 0 / 0.6)';

export function StickerPlate({
  children,
  fill = STICKER_FILL,
}: {
  children: ReactNode;
  fill?: string;
}) {
  return (
    <g
      aria-hidden="true"
      fill={fill}
      stroke={fill}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={7}
    >
      {children}
    </g>
  );
}
