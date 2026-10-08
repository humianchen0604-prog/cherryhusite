'use client';

import { useEffect } from 'react';
import './whoLine.css';
import { initWhoLine } from './whoLineRuntime';

/**
 * The hero lockup: 'Product designer who <designs> and <builds>', where the two
 * verbs are hand-drawn and reveal their tool icons on hover.
 *
 * Markup and styles come from the standalone page in Portfolio/who-line;
 * see scripts/extract-who-line.mjs and the two build-who-line-* scripts.
 * Everything is wrapped in .who-line so that page's :root variables and font
 * stack stay scoped to this block.
 */
/**
 * Desktop and tablet get the lanyard; only phones fall through to the brand's
 * own site. It was 1280 — Framer's desktop band — which also shut out tablets
 * and any laptop narrower than that, so those all followed the link straight
 * to tiktok.com instead of dropping the badge. 768 is the tablet floor.
 */
const LANYARD_MIN_WIDTH = 768;

export default function WhoLine() {
  useEffect(() => {
    // Kick off fetches as early as the effect runs so waitForIntroAssets
    // usually resolves with a warm cache.
    const hrefs = [
      '/who-line/assets/fonts/ugly-dave.woff2',
      '/who-line/assets/figma-logo.png',
      '/who-line/assets/color.svg',
      '/who-line/assets/claude.png',
      '/who-line/assets/cursor.png',
      '/who-line/assets/dev.png',
      '/who-line/assets/u-mask.svg',
    ];
    const links = hrefs.map((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = href.endsWith('.woff2') ? 'font' : href.endsWith('.svg') ? 'image' : 'image';
      link.href = href;
      if (href.endsWith('.woff2')) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      return link;
    });
    const cleanup = initWhoLine();
    return () => {
      cleanup();
      links.forEach((link) => link.remove());
    };
  }, []);

  /*
   * @TikTok / @Lemon8 / @Trip.com drop the lanyard badge in rather than opening
   * the standalone site. Delegated so it survives the runtime rebuilding the
   * line, and capture-phase so it beats the anchor's own navigation.
   */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('.intro-lines__link');
      if (!link) return;
      const brand = (link as HTMLElement).dataset.variant;
      if (!brand || !['tiktok', 'lemon8', 'trip'].includes(brand)) return;
      // Cmd/ctrl/middle-click still opens the real page in a new tab.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      // Phones only fall through: too little room to hang a draggable badge, so
      // the link just goes to the brand's own site (what the href points at).
      if (window.innerWidth < LANYARD_MIN_WIDTH) return;
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('lanyard:show', { detail: { brand } }));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return (
    <div className="who-line">
      <div className="block">
        <div className="block__hero">
          <p className="line">
            <span className="line__text">
              {"Product designer who"}
            </span>
            {" "}
            <span className="lockup lockup--design" id="design" data-hovered="false" role="button" tabIndex={0} aria-label="design — hover to reveal tools">
              <span className="lockup__frame" aria-hidden="true">
                <span className="icons">
                  <span className="icon icon--figma">
                    <span className="figma-logo">
                      <img src="/who-line/assets/figma-logo.png" alt="" width="25" height="25" />
                    </span>
                  </span>
                  {" "}
                  <span className="icon icon--color">
                    <img src="/who-line/assets/color.svg" alt="" width="22" height="19" />
                  </span>
                  {" "}
                  <span className="icon icon--font">
                    <svg className="font-tool" viewBox="0 0 21.556 21.556" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1.17" y="1.17" width="15.253" height="15.253" fill="rgba(2,175,255,0.2)" stroke="#02afff" strokeWidth="1.32" />
                      {" "}
                      <rect x="0" y="0" width="2.347" height="2.347" fill="#fff" stroke="#02afff" strokeWidth="1.32" />
                      {" "}
                      <rect x="15.26" y="0" width="2.347" height="2.347" fill="#fff" stroke="#02afff" strokeWidth="1.32" />
                      {" "}
                      <rect x="0" y="15.25" width="2.347" height="2.347" fill="#fff" stroke="#02afff" strokeWidth="1.32" />
                      {" "}
                      <rect x="15.26" y="15.25" width="2.347" height="2.347" fill="#fff" stroke="#02afff" strokeWidth="1.32" />
                      {" "}
                      <g transform="translate(4.65 4.41)">
                        <path d="M1.92746 8.29015H3.37824V1.03627H1.09845V2.6943H0V0H8V2.6943H6.90155V1.03627H4.62176V8.29015H6.07254V9.32642H1.92746V8.29015Z" fill="#111" />
                      </g>
                    </svg>
                  </span>
                </span>
                {" "}
                <span className="lockup__veil" />
                {" "}
                <span className="stage">
                  <svg id="design-svg" viewBox="-3 -3 85.65 30" fill="none" aria-hidden="true" />
                </span>
              </span>
              {" "}
              <span className="lockup__hit" />
            </span>
            {" "}
            <span className="line__trail" id="trail" hidden data-entered="false" aria-hidden="true">
              <span className="line__and" aria-label="and">
                <span className="char" style={{"--i":"0"} as React.CSSProperties}>
                  {"a"}
                </span>
                {" "}
                <span className="char" style={{"--i":"1"} as React.CSSProperties}>
                  {"n"}
                </span>
                {" "}
                <span className="char" style={{"--i":"2"} as React.CSSProperties}>
                  {"d"}
                </span>
              </span>
              {" "}
              <span className="lockup lockup--build" id="build" data-hovered="false" role="button" tabIndex={-1} aria-label="build — hover to reveal tools">
                <span className="lockup__frame" aria-hidden="true">
                  <span className="icons">
                    <span className="icon icon--claude">
                      <span className="icon__face">
                        <img src="/who-line/assets/claude.png" alt="" width="16" height="16" />
                      </span>
                    </span>
                    {" "}
                    <span className="icon icon--cursor">
                      <span className="icon__face">
                        <span className="cursor-logo">
                          <img src="/who-line/assets/cursor.png" alt="" width="18" height="18" />
                        </span>
                      </span>
                    </span>
                    {" "}
                    <span className="icon icon--dev">
                      <span className="icon__face">
                        <img src="/who-line/assets/dev.png" alt="" width="19" height="19" />
                      </span>
                    </span>
                  </span>
                  {" "}
                  <span className="lockup__veil" />
                  {" "}
                  <span className="word">
                    <span className="word__letter word__b char" style={{"--i":"3"} as React.CSSProperties}>
                      {"b"}
                    </span>
                    {" "}
                    <span className="word__u-bars char" style={{"--i":"4"} as React.CSSProperties}>
                      <span />
                      <span />
                      <span />
                      <span />
                      {" "}
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    {" "}
                    <span className="word__letter word__ild">
                      <span className="char" style={{"--i":"5"} as React.CSSProperties}>
                        {"i"}
                      </span>
                      {" "}
                      <span className="char" style={{"--i":"6"} as React.CSSProperties}>
                        {"l"}
                      </span>
                      {" "}
                      <span className="char" style={{"--i":"7"} as React.CSSProperties}>
                        {"d"}
                      </span>
                      {" "}
                      <span className="char" style={{"--i":"8"} as React.CSSProperties}>
                        {"s"}
                      </span>
                    </span>
                  </span>
                </span>
                {" "}
                <span className="lockup__hit" />
              </span>
            </span>
          </p>
        </div>
        {" "}
        <div className="rest" id="rest" aria-hidden="true">
          <p className="line line--sub rest__item" style={{"--i":"0"} as React.CSSProperties}>
            {" Turning ideas into working prototypes with obsessive attention to detail. "}
          </p>
          {" "}
          <div className="intro-lines">
            <p className="intro-lines__line rest__item" style={{"--i":"1"} as React.CSSProperties}>
              {" Currently in LA · Learning IxD "}
              <a className="intro-lines__link" data-variant="artcenter" data-hovered="false" href="https://www.artcenter.edu/academics/undergraduate-degrees/interaction-design/overview.html" target="_blank" rel="noopener noreferrer">
                {"@"}
                <span className="intro-lines__label">
                  {"ArtCenter"}
                </span>
              </a>
            </p>
            {" "}
            <div className="intro-lines__previously rest__item" style={{"--i":"2"} as React.CSSProperties} data-badge-hint="false">
              <p className="intro-lines__line">
                {" Previously, "}
                <a className="intro-lines__link" data-variant="tiktok" data-hovered="false" href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer">
                  {"@"}
                  <span className="intro-lines__label">
                    {"TikTok"}
                  </span>
                </a>
                {", "}
                <a className="intro-lines__link" data-variant="lemon8" data-hovered="false" href="https://www.lemon8-app.com" target="_blank" rel="noopener noreferrer">
                  {"@"}
                  <span className="intro-lines__label">
                    {"Lemon8"}
                  </span>
                </a>
                {", "}
                <a className="intro-lines__link" data-variant="trip" data-hovered="false" href="https://www.trip.com" target="_blank" rel="noopener noreferrer">
                  {"@"}
                  <span className="intro-lines__label">
                    {"Trip.com"}
                  </span>
                </a>
              </p>
              {" "}
              <p className="intro-lines__badge-hint" aria-hidden="true">
                {"Click to view my badge!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
