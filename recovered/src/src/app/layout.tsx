import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import AppToaster from '@/components/AppToaster';
import TopBlur from '@/components/TopBlur';
import ClickSound from '@/components/ClickSound';
import NoHover from '@/components/NoHover';
import MobileMenu from '@/components/MobileMenu';
import StarryBackdrop from '@/components/StarryBackdrop';
import SkyGradient from '@/components/SkyGradient';
import NightCursor from '@/components/night-cursor/NightCursor';
import './framer.css';
import './globals.css';

const DESCRIPTION =
  'Cherry Hu is a product designer who thinks in systems, sweats the details, and builds in code. Currently based in LA.';

export const metadata: Metadata = {
  title: 'Cherry Hu',
  description: DESCRIPTION,
  metadataBase: new URL('https://www.cherryhu.com'),
  alternates: { canonical: '/' },
  /*
   * The cherry mark. The old entry pointed at an SVG that no longer exists, so
   * tabs were showing a blank icon.
   *
   * Two colourways, chosen by the browser's own theme: a near-black cherry
   * would vanish on a dark tab strip, so dark UIs get the white one. The
   * un-`media`d .ico goes last as the fallback, and it's what Google's
   * crawler tends to fetch first — it wants a favicon in multiples of 48px.
   */
  icons: {
    icon: [
      { url: '/icons/icon-light-48.png', sizes: '48x48', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/icon-light-192.png', sizes: '192x192', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/icon-dark-48.png', sizes: '48x48', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/icons/icon-dark-192.png', sizes: '192x192', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: { 'max-image-preview': 'large' } as Metadata['robots'],
  openGraph: {
    type: 'website',
    title: 'Cherry Hu',
    description: DESCRIPTION,
    url: 'https://www.cherryhu.com/',
    images: ['/assets/images/3FbfY0CosTWRyAeYyT3A5Gtd68.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cherry Hu',
    description: DESCRIPTION,
    images: ['/assets/images/3FbfY0CosTWRyAeYyT3A5Gtd68.png'],
  },
};

export const viewport = { width: 'device-width' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme before first paint, so a dark-mode reload never flashes
            the light page. Also flags JS as available before paint, so
            scroll-reveal (see casestudy.css) can hide sections pre-reveal
            without a no-JS visit ending up with permanently invisible
            content. Deliberately inline and synchronous. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');" +
              "if(window.self!==window.top&&/[?&]embed=1/.test(location.search))document.documentElement.classList.add('is-embed');" +
              "(function(){try{var t=localStorage.getItem('theme');" +
              "if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';" +
              "document.documentElement.dataset.theme=t;}catch(e){}})();",
          }}
        />
        {/* Caveat is only reachable via Google Fonts — the ported @font-face block covers
            Switzer and Inter, but not this one. Same requests the original page makes. */}
        {/* Switzer sets the metrics for the hero and every heading. Preloading it
            keeps the fallback from painting first and reflowing the line. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/assets/fonts/6IN5WOLRCYP4G4MOCOHOMXNON6Q7MDAR.woff2"
          crossOrigin="anonymous"
        />
        {/* Hand-lettered design/build face — preload so the intro isn't waiting
            on a late font while the rest of the page is already painted. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/who-line/assets/fonts/ugly-dave.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="image"
          href="/who-line/assets/figma-logo.png"
        />
        <link rel="preload" as="image" href="/who-line/assets/color.svg" />
        <link rel="preload" as="image" href="/who-line/assets/claude.png" />
        <link rel="preload" as="image" href="/who-line/assets/cursor.png" />
        <link rel="preload" as="image" href="/who-line/assets/dev.png" />
        <link rel="preload" as="image" href="/who-line/assets/u-mask.svg" />
        <link rel="preconnect" href="https://fonts.gstatic.com/" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <ClickSound />
        <NoHover />
        <TopBlur />
        <MobileMenu />
        <div id="main">
          <StarryBackdrop />
          <SkyGradient />
          {children}
        </div>
        <AppToaster />
        {/* Night-mode cursor: last, so its canvas draws above everything. */}
        <NightCursor />
        <Analytics />
      </body>
    </html>
  );
}
