import './tiktok-bento.css';

/**
 * TikTok hero bento — seven-panel collage.
 * Exact panel geometry traced from the overview motion frame (1506×1080).
 *
 * Measured gutters: 26px. Columns: 740 | 26 | 740. Left rows: 384 | 26 | 669.
 * Right rows: 251 | 26 | 527 | 26 | 249. Top-right: 467 | 26 | 245.
 * Bottom-right: 357 | 26 | 355. Cell radius: 10px.
 *
 * Backup 4:3 cover video lives below as TikTokButtonPreview — not rendered.
 */

const SLOTS = [
  { id: 'logo', label: 'TikTok wordmark' },
  { id: 'phones', label: 'Studio / product phones' },
  { id: 'accounts', label: 'Account switcher chips' },
  { id: 'cyan', label: 'Feed phone on cyan' },
  { id: 'flow', label: 'Onboarding flow phones' },
  { id: 'pink', label: 'Switch account modal' },
  { id: 'tooltip', label: 'Long-press tooltip' },
] as const;

export type TikTokBentoSlot = (typeof SLOTS)[number]['id'];

type TikTokOverviewBentoProps = {
  /** Optional media per slot — omit to show the colored placeholder plate. */
  media?: Partial<Record<TikTokBentoSlot, React.ReactNode>>;
};

export default function TikTokOverviewBento({ media }: TikTokOverviewBentoProps) {
  const m = media ?? {};
  return (
    <div
      className="tiktok-bento"
      role="img"
      aria-label="TikTok internship work collage — seven panels"
    >
        <div className="tiktok-bento__left">
          <Cell id="logo" label={SLOTS[0].label}>
            {m.logo ?? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="tiktok-bento__logo"
                src="/assets/images/tiktok-wordmark-white.png"
                alt=""
                draggable={false}
              />
            )}
          </Cell>
          <Cell id="phones" label={SLOTS[1].label}>
            {m.phones ?? (
              <video
                src="/assets/tiktok/tiktok-bento-phones.mp4"
                poster="/assets/tiktok/posters/tiktok-bento-phones.jpg"
                loop
                muted
                playsInline
                preload="auto"
              />
            )}
          </Cell>
        </div>
        <div className="tiktok-bento__right">
          <div className="tiktok-bento__right-top">
            <Cell id="accounts" label={SLOTS[2].label}>
              {m.accounts ?? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="tiktok-bento__accounts"
                  src="/assets/tiktok/tiktok-bento-accounts.png"
                  alt=""
                  draggable={false}
                />
              )}
            </Cell>
            <Cell id="cyan" label={SLOTS[3].label}>
              {m.cyan ?? (
                <video
                  className="tiktok-bento__cyan"
                  src="/assets/tiktok/tiktok-bento-navbar.webm"
                  loop
                  muted
                  playsInline
                  preload="none"
                />
              )}
            </Cell>
          </div>
          <Cell id="flow" label={SLOTS[4].label}>
            {m.flow ?? (
              <video
                src="/assets/tiktok/tiktok-project-01.mp4"
                poster="/assets/tiktok/posters/tiktok-project-01.jpg"
                loop
                muted
                playsInline
                preload="none"
              />
            )}
          </Cell>
          <div className="tiktok-bento__right-bottom">
            <Cell id="pink" label={SLOTS[5].label}>
              {m.pink ?? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="tiktok-bento__pink"
                  src="/assets/tiktok/tiktok-bento-switch.png"
                  alt=""
                  draggable={false}
                />
              )}
            </Cell>
            <Cell id="tooltip" label={SLOTS[6].label}>
              {m.tooltip ?? (
                <video
                  src="/assets/tiktok/tiktok-bento-tooltip.mp4"
                  poster="/assets/tiktok/posters/tiktok-bento-tooltip.jpg"
                  loop
                  muted
                  playsInline
                  preload="none"
                />
              )}
            </Cell>
          </div>
        </div>
    </div>
  );
}

/**
 * Backup: 4:3 homepage-style cover video ("button preview").
 * Not shown — restore by swapping <TikTokOverviewBento /> for this in TikTokBody.
 */
export function TikTokButtonPreview() {
  return (
    <div
      className="tiktok-button-preview"
      role="img"
      aria-label="TikTok internship preview cover"
    >
      <video
        src="/assets/media/tiktok-cover.mp4?v=2"
        muted
        loop
        playsInline
        preload="none"
      />
    </div>
  );
}

function Cell({
  id,
  label,
  children,
}: {
  id: TikTokBentoSlot;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`tiktok-bento__cell tiktok-bento__cell--${id}`}
      data-slot={id}
      aria-label={label}
    >
      {children ?? null}
    </div>
  );
}
