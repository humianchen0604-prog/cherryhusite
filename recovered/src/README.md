# Website26 — cherryhu.com home page rebuild

A pixel-level rebuild of the [cherryhu.com](https://www.cherryhu.com/) home page
as a Next.js app, replacing the Framer-hosted original.

## Current fidelity

The page below the hero is a pixel-level match for the original. Measured by
tiling both pages at viewport height and comparing with pixelmatch (threshold
0.1), videos parked on the same frame:

| Viewport | Overall diff | Worst tile | Doc height |
| --- | --- | --- | --- |
| 1440×900 | **0.049%** | 0.35% | 11078px — exact match |
| 390×844 | **0.151%** | 0.95% | 9056px — exact match |

10 of 14 desktop tiles and 9 of 12 mobile tiles were byte-identical.

**The hero is deliberately different.** It has been replaced by the who-line
block (see below), so those numbers no longer describe the top of the page, and
everything below it now sits 15px higher than the original. Re-running the diff
will flag that offset — expected, not a regression.

## Run

```bash
npm install
npm run dev
```

## Rebuild the QA loop

```bash
./scripts/serve.sh
```

Then capture both sides and diff:

```bash
node scripts/capture.mjs "https://www.cherryhu.com/" docs/design-references/original-1440 1440 900
```

```bash
node scripts/capture.mjs "http://localhost:3111/" docs/design-references/clone-1440 1440 900
```

```bash
node scripts/diff.mjs docs/design-references/original-1440 docs/design-references/clone-1440
```

Layout divergence is easier to read than pixels — this reports every `framer-*`
box whose position or size differs:

```bash
node scripts/compare-geometry.mjs
```

## How it is built

The original is a Framer site, so its CSS is fully deterministic and was ported
rather than re-authored:

- **`src/app/framer.css`** — the live page's resolved `cssRules`, dumped with
  `scripts/dump-css.mjs`. Fonts, layout classes, and the two inline code-component
  stylesheets, verbatim. Framer's editor-bar sheets are removed.
- **`src/components/sections/*.tsx`** — generated from the server-rendered markup
  by `scripts/html-to-jsx.mjs` → `split-sections.mjs` → `emit-components.mjs`,
  preserving class names and inline styles so the ported CSS lands exactly.
- **Behaviour** is hand-written React, with every timing measured off the live
  site rather than guessed. See [`docs/research/BEHAVIORS.md`](docs/research/BEHAVIORS.md).

Regenerate the ported markup after re-capturing the original:

```bash
node scripts/html-to-jsx.mjs && node scripts/split-sections.mjs && node scripts/emit-components.mjs
```

## The hero

`src/components/WhoLine.tsx` replaces the original's headline and two intro
lines with the interactive block from `Portfolio/who-line`: "Product designer
who *design* and *build*", where both verbs are drawn on by a pen and reveal
their tool icons on hover.

It is extracted from that standalone page rather than hand-copied:

```bash
node scripts/extract-who-line.mjs && node scripts/build-who-line-css.mjs && node scripts/build-who-line-runtime.mjs
```

- `whoLine.css` — the page's stylesheet, with its `:root`/`*`/`body` rules scoped
  to `.who-line` or dropped so nothing leaks into the rest of the page
- `whoLineGlyphs.ts` — the handwriting outlines
- `whoLineRuntime.ts` — the animation script, wrapped so React can start it in an
  effect and stop it on unmount

Placement lives in `globals.css`: the Framer intro wrapper is un-clipped so the
hover icons can rise above the text, and the block carries 40pt of top padding
(pulled back by an equal negative margin) so it has headroom while its first line
stays level with the side nav.

## Large-desktop type scale

At >=1600px (the site's own top breakpoint, Framer's `107qx1e`) all text steps up
**1.1x**. One knob drives it: `--text-scale` in `globals.css`.

It reaches each family of text differently, because the page sizes type four ways:

| Source | How it scales |
| --- | --- |
| `.framer-text` (76 elements) | `--framer-font-size-scale`, a hook framer.css already multiplies in |
| `[data-framer-component-type="Text"]` | `--font-size` override — that pipeline bypasses the hook above |
| who-line hero | its own `--hero-size` / `--hero-fs` / `--copy-size` (so the stickers grow too) |
| inline `clamp()` sizes | wrapped in `calc(... * var(--text-scale, 1))` |

The scale multiplies each size *variable* rather than an inherited `font-size`, so
nested text never compounds. `scripts/audit-text-scale.mjs` walks every
text-bearing element at 1440 and 1680 and fails on anything that is not 1.1x:

```bash
node scripts/audit-text-scale.mjs
```

Currently 87/87 elements pass. The one exclusion is the letter inside the About
envelope: it is a separate same-origin document whose text is composed to fit the
paper graphic, so scaling it would overflow the letter.

## Assets

All images, videos, and fonts are local under `public/assets` (~239MB), downloaded
by `scripts/download-assets.mjs`.

The About-page envelope is a separate Vite app whose source lives in
`Portfolio/About me open page`. Build it into this project with:

```bash
./scripts/build-envelope.sh
```

That replaces the original's `about-envelope.vercel.app` iframe with a local one.

## Documentation

- [`docs/research/PAGE_TOPOLOGY.md`](docs/research/PAGE_TOPOLOGY.md) — section map and layering
- [`docs/research/BEHAVIORS.md`](docs/research/BEHAVIORS.md) — every animation, with measured numbers
- `docs/design-references/` — reference tiles and diff images

## Known gaps

- The envelope embed is built from the local source, which has drifted slightly
  from the deployed v38 build: the envelope graphic sits a few pixels off the
  original's. That accounts for the 0.35% on the About tile. The "Click to view
  more" annotation is ported from `framer/FramerAboutEmbed.tsx` in that project,
  since it belongs to the Framer host wrapper rather than the embedded app.
- Two folder-variant boxes in the skills section (`framer-py2pnu`,
  `framer-1yqjzr-container`) measure zero-size in the clone. They are behind a
  breakpoint variant that is not visible at either tested width, so they do not
  affect rendering.
