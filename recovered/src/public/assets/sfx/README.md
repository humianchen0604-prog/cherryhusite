# Sound effects

Drop files here and they are used automatically — no code change needed.
If a file is missing, a synthesised version of that sound plays instead.

| file            | plays when                          | falls back to          |
|-----------------|-------------------------------------|------------------------|
| `click.mp3`     | any click on the site               | synthesised click      |
| `toggle-on.mp3` | switching to night mode             | `toggle.mp3`, then synth |
| `toggle-off.mp3`| switching to light mode             | `toggle.mp3`, then synth |
| `paper-out.mp3` | the letter slides out of the envelope | synthesised rustle   |
| `paper-in.mp3`  | the letter slides back in           | `paper-out.mp3` reversed |

Keep them short (under ~1s) and quiet; per-sound volume is set in `src/lib/sfx.ts`.
