/**
 * The site's sound effects, synthesised with Web Audio.
 *
 * Nothing is loaded from disk: every sound here is built from noise and
 * oscillators at play time. That keeps the first click identical to the
 * hundredth (no waiting on a download), adds nothing to a page that already
 * ships a lot of video, and lets each sound be varied slightly per play so
 * repeats don't sound like the same sample fired twice.
 *
 * One AudioContext is shared by all of them, created on the first sound rather
 * than at import: browsers refuse to start one outside a user gesture.
 */

const STORAGE_KEY = 'cherry:click-sound';

export function isMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'off';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on');
  } catch {
    /* blocked storage — sound stays on for this session */
  }
}

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** One second of white noise, reused by every noise-based sound. */
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (!noise || noise.sampleRate !== ac.sampleRate) {
    const len = Math.floor(ac.sampleRate);
    noise = ac.createBuffer(1, len, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

function master(ac: AudioContext, volume: number): GainNode {
  const out = ac.createGain();
  out.gain.value = volume;
  out.connect(ac.destination);
  return out;
}

/* ── Recorded samples (optional) ──────────────────────────────────────────
 * Drop a file at public/assets/sfx/<name>.mp3 and it is used instead of the
 * synthesised version — no code change needed. Names:
 *
 *   click.mp3      every click on the site
 *   toggle-on.mp3  light -> night   (falls back to toggle.mp3)
 *   toggle-off.mp3 night -> light   (falls back to toggle.mp3)
 *   paper-out.mp3  letter sliding out of the envelope
 *   paper-in.mp3   letter going back in (falls back to paper-out reversed)
 *
 * If a file is missing the synthesised sound plays instead, so the site always
 * has audio and never waits on a download.
 */
const SAMPLE_DIR = '/assets/sfx/';
const loaded = new Map<string, AudioBuffer>();
const tried = new Set<string>();

function loadSample(name: string): void {
  if (tried.has(name)) return;
  tried.add(name);
  const ac = audio();
  if (!ac) return;
  void fetch(SAMPLE_DIR + name + '.mp3')
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('missing'))))
    .then((b) => ac.decodeAudioData(b))
    .then((buf) => loaded.set(name, buf))
    .catch(() => {
      /* no such sample — the synthesised version covers it */
    });
}

/** Plays a sample if one is loaded. Returns false when the caller should
 *  fall back to synthesis. `reverse` plays the buffer backwards. */
function playSample(name: string, volume: number, reverse = false, offset = 0): boolean {
  const ac = audio();
  if (!ac) return false;
  const buf = loaded.get(name);
  if (!buf) {
    loadSample(name);
    return false;
  }
  const src = ac.createBufferSource();
  if (reverse) {
    const rev = ac.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c += 1) {
      rev.getChannelData(c).set([...buf.getChannelData(c)].reverse());
    }
    src.buffer = rev;
  } else {
    src.buffer = buf;
  }
  const out = master(ac, volume);
  src.connect(out);
  // `offset` skips into the file. Recorded one-shots often open with a beat of
  // near-silence before the transient, which lands as lag when the sound is
  // meant to hit on a click.
  src.start(0, Math.min(offset, (src.buffer?.duration ?? 0) * 0.9));
  src.onended = () => out.disconnect();
  return true;
}

/** Warm the samples up on the first gesture so the first play isn't silent. */
export function primeSamples(): void {
  ['click', 'toggle-on', 'toggle-off', 'toggle', 'paper-out', 'paper-in', 'book-open'].forEach(loadSample);
}

/** exponentialRampToValueAtTime can never reach 0, so decays end just above it. */
const SILENT = 0.0001;

/**
 * UI click — a band-passed noise transient with a low triangle body under it.
 * Two layers is what separates a click from a beep.
 */
export function playClick(volume = 0.12): void {
  if (isMuted()) return;
  if (playSample('click', volume)) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const out = master(ac, volume);

  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2200 * (0.94 + Math.random() * 0.12);
  band.Q.value = 1.1;
  const tick = ac.createGain();
  tick.gain.setValueAtTime(SILENT, t);
  tick.gain.exponentialRampToValueAtTime(0.9, t + 0.001);
  tick.gain.exponentialRampToValueAtTime(SILENT, t + 0.028);
  src.connect(band).connect(tick).connect(out);
  src.start(t);
  src.stop(t + 0.05);

  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(190 * (0.96 + Math.random() * 0.08), t);
  const body = ac.createGain();
  body.gain.setValueAtTime(SILENT, t);
  body.gain.exponentialRampToValueAtTime(0.32, t + 0.002);
  body.gain.exponentialRampToValueAtTime(SILENT, t + 0.05);
  osc.connect(body).connect(out);
  osc.start(t);
  osc.stop(t + 0.07);
  osc.onended = () => out.disconnect();
}

/**
 * Paper sliding out of an envelope (纸张摩擦声).
 *
 * Paper rustle is broadband noise with no pitch, so the character comes
 * entirely from the filter: a high-pass to strip any rumble, and a band-pass
 * that sweeps upward across the sound — that rising sweep is what reads as a
 * sheet being *drawn out* rather than just a hiss. Three short overlapping
 * grains at uneven offsets give it the irregular crackle of real paper; one
 * smooth envelope sounds like wind.
 */
export function playPaper(direction: 'out' | 'in' = 'out', volume = 0.16): void {
  if (isMuted()) return;
  if (direction === 'in') {
    // paper-in if supplied, otherwise paper-out played backwards, which is
    // exactly what sliding the sheet back in sounds like.
    if (playSample('paper-in', volume) || playSample('paper-out', volume, true)) return;
  } else if (playSample('paper-out', volume)) {
    return;
  }
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const out = master(ac, volume);
  const buf = noiseBuffer(ac);

  const grains = [
    { at: 0, dur: 0.42, from: 900, to: 2600, peak: 0.5 },
    { at: 0.08, dur: 0.3, from: 1400, to: 3400, peak: 0.34 },
    { at: 0.19, dur: 0.26, from: 1100, to: 4200, peak: 0.26 },
  ];

  for (const g of grains) {
    const start = t + g.at;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    // Random offset into the noise so the grains aren't correlated.
    const offset = Math.random() * 0.8;

    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 700;

    const band = ac.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(g.from, start);
    band.frequency.exponentialRampToValueAtTime(g.to, start + g.dur);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(SILENT, start);
    gain.gain.exponentialRampToValueAtTime(g.peak, start + g.dur * 0.25);
    gain.gain.exponentialRampToValueAtTime(SILENT, start + g.dur);

    src.connect(hp).connect(band).connect(gain).connect(out);
    src.start(start, offset);
    src.stop(start + g.dur + 0.02);
  }

  window.setTimeout(() => out.disconnect(), 900);
}

/**
 * Theme switch — a mechanical toggle.
 *
 * Modelled on a physical switch rather than a UI beep: a hard noise snap for
 * the contact, then a short pitched body that *drops* in frequency, which is
 * what makes it sound like something travelled and landed. `on` raises the
 * pitch slightly so flicking one way doesn't sound identical to the other.
 */
export function playToggle(on: boolean, volume = 0.055): void {
  if (isMuted()) return;
  if (playSample(on ? 'toggle-on' : 'toggle-off', volume)) return;
  if (playSample('toggle', volume)) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const out = master(ac, volume);

  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  const snap = ac.createGain();
  snap.gain.setValueAtTime(SILENT, t);
  snap.gain.exponentialRampToValueAtTime(0.75, t + 0.0015);
  snap.gain.exponentialRampToValueAtTime(SILENT, t + 0.022);
  src.connect(hp).connect(snap).connect(out);
  src.start(t, Math.random() * 0.8);
  src.stop(t + 0.04);

  const osc = ac.createOscillator();
  osc.type = 'square';
  const base = on ? 340 : 260;
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * 0.55, t + 0.05);
  const body = ac.createGain();
  body.gain.setValueAtTime(SILENT, t);
  body.gain.exponentialRampToValueAtTime(0.2, t + 0.003);
  body.gain.exponentialRampToValueAtTime(SILENT, t + 0.06);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1600;
  osc.connect(lp).connect(body).connect(out);
  osc.start(t);
  osc.stop(t + 0.08);
  osc.onended = () => out.disconnect();
}

/**
 * The footer guestbook opening and shutting. Sample-only: a hardback cover has
 * no convincing synthesised equivalent, so if book-open.mp3 is missing this is
 * simply silent rather than approximated badly. Closing plays it reversed.
 */
/** Dead air at the head of book-open.mp3, skipped so the sound lands on the click. */
const BOOK_TRIM = 0.2;

export function playBook(direction: 'open' | 'close' = 'open', volume = 0.35): void {
  if (isMuted()) return;
  playSample('book-open', volume, direction === 'close', BOOK_TRIM);
}

/** A page turning inside the open book — the same sheet, quieter than the cover. */
export function playPageTurn(volume = 0.22): void {
  if (isMuted()) return;
  playSample('book-open', volume, false, BOOK_TRIM);
}
