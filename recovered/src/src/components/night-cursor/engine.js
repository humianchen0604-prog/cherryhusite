// @ts-nocheck — canvas engine ported from the public/night-cursor.html prototype.
/*
 * Night-mode cursor engine: three cursors drawn on one fixed canvas.
 *
 *   stars    → a golden shooting star that trails the real pointer (the native
 *              cursor stays), with twinkling gold specks.
 *   meteor   → a blazing ball with a soft flame tail that bends along the path,
 *              settling into a slim oval when parked.
 *   asteroid → a cratered rock, molten on its leading face, trailing a pale
 *              column of light, flames and debris streaks.
 *
 * Each has its own hover state (brighter, longer, busier — never bigger) and
 * a small click burst made of its own elements. The engine only draws: the
 * toggle, persistence and theme gating are the React side's job.
 *
 * Usage: const engine = startNightCursor({ canvas, initialMode, hoverSelector });
 *        engine.setMode('meteor'); engine.destroy();
 */
export function startNightCursor({
  canvas,
  initialMode = 'stars',
  hoverSelector = 'a, button',
  /* Over these (the picker's cursor icons) the tail is cut short — meteor to
     40%, asteroid to 50% — so a preview doesn't streak across the page. */
  shortTailSelector = '.theme-switch__option',
}) {
  const cleanups = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };
  let raf = 0;

  const ctx = canvas.getContext('2d');
  const MODES = ['stars', 'meteor', 'asteroid'];

  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const HOVER_SEL = hoverSelector;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ================= mode ================= */
  let mode = MODES.includes(initialMode) ? initialMode : 'stars';
  let modeStart = performance.now();

  /* Switching clears whatever the old cursor left on screen. The toggle UI and
     persistence live in React (NightCursorToggle + lib/nightCursor). */
  function setMode(next) {
    if (!MODES.includes(next)) return;
    mode = next;
    modeStart = performance.now();
    dust.length = 0;
    fx.length = 0;
    trail.length = 0;
    shoot.length = 0;
    shootHead.ready = false;
  }

  /* ================= shared cursor state ================= */
  const mouse = { x: -200, y: -200, seen: false };
  const pos = { x: -200, y: -200 };
  const vel = { x: 0, y: 0 };
  let angle = -Math.PI * 0.75;
  let hover = 0;
  let hoverTarget = 0;
  let press = 0;
  let pressTarget = 0;
  let spin = 0;
  let tailLen = 40;
  let tailScale = 1; // eases toward the mode's short scale over shortTailSelector
  let shortTail = false;
  let rest = 0; // meteor: 0 moving/hovered → 1 parked and idle
  let w = 0;
  let h = 0;
  let lastT = performance.now();

  function resize() {
    // 1.5x is plenty for soft glows; 2x only adds ~44% more pixels to fill each frame.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  on(window, 'resize', resize);

  on(window, 'pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!mouse.seen) {
      mouse.seen = true;
      pos.x = mouse.x;
      pos.y = mouse.y;
      lastSpawn = { x: pos.x, y: pos.y };
      dustLast = { x: pos.x, y: pos.y };
      trail.length = 0;
    }
    const el = e.target instanceof Element ? e.target : null;
    hoverTarget = el && el.closest(HOVER_SEL) ? 1 : 0;
    shortTail = !!(el && el.closest(shortTailSelector));
    if (mode === 'stars' && STAR_STYLE === 'dust') dustMove(e.clientX, e.clientY);
  });
  on(document, 'pointerleave', () => { mouse.seen = false; hoverTarget = 0; shortTail = false; });
  on(window, 'blur', () => { mouse.seen = false; hoverTarget = 0; shortTail = false; });
  on(window, 'pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    pressTarget = 1;
    burst();
  });
  on(window, 'pointerup', () => { pressTarget = 0; });

  /* ================= STARS (fairy dust — STAR_STYLE 'dust') =================
     A straight port of FairyDustCursor / NightFairyDust from the site:
     same star path, same yellows, same config, same spawn-gap roll and
     the same taper maths — so this mode is the home page cursor exactly.
     The only change is the bloom, which now spreads 10% further out in a
     paler, lower-intensity wash. */
  const STAR_PATH = new Path2D(
    'M50 3C50.9 29 55.2 43.5 81 50C55.2 56.5 50.9 71 50 97C49.1 71 44.8 56.5 19 50C44.8 43.5 49.1 29 50 3Z'
  );
  const YELLOW_HUES = ['#FFF8D6', '#FFE9A8', '#FFF1B8', '#F5E6A0', '#FFE566', '#FFF3C4', '#F0D878'];
  const DUST = {
    particleSize: 14,
    particleCount: 3,
    maxParticles: 16,
    gravity: 0.008,
    fadeSpeed: 0.948,
    initialVelocity: { min: 0.02, max: 0.14 },
    spawnDistance: 12,
  };

  const dust = [];
  let dustLast = { x: 0, y: 0 };
  let dustGap = DUST.spawnDistance;

  function drawStarPath(x, y, size, rot, color) {
    const s = size / 100;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.translate(-50, -50);
    ctx.fillStyle = color;
    ctx.fill(STAR_PATH);
    ctx.restore();
  }

  /** Mostly short gaps (dense tip), sometimes long (tapered trail). */
  function rollDustGap() {
    const base = DUST.spawnDistance * (hover > 0.5 ? 0.72 : 1);
    const u = Math.random();
    if (u < 0.62) dustGap = base * (0.35 + Math.random() * 0.55);
    else if (u < 0.88) dustGap = base * (0.85 + Math.random() * 0.7);
    else dustGap = base * (1.6 + Math.random() * 1.4);
  }
  rollDustGap();

  function createDust(x, y) {
    const v = DUST.initialVelocity;
    const drift = Math.random() * (v.max - v.min) + v.min;
    const life = 72 + Math.random() * 48;
    return {
      x: x + (Math.random() - 0.5) * 3,
      y: y + (Math.random() - 0.5) * 3,
      color: pick(YELLOW_HUES),
      vx: (Math.random() - 0.5) * drift,
      vy: (Math.random() - 0.5) * drift * 0.6,
      lifeSpan: life,
      initialLifeSpan: life,
      size: DUST.particleSize * (0.55 + Math.random() * 0.75),
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
    };
  }

  function pushDust(x, y) {
    for (let i = 0; i < DUST.particleCount; i++) dust.push(createDust(x, y));
    while (dust.length > DUST.maxParticles) dust.shift();
  }

  function dustMove(x, y) {
    if (reduced.matches) return;
    if (Math.hypot(x - dustLast.x, y - dustLast.y) > dustGap) {
      pushDust(x, y);
      dustLast = { x, y };
      rollDustGap();
    }
  }

  function stepDust() {
    for (let i = 0; i < dust.length; i++) {
      const p = dust[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.vy += DUST.gravity;
      p.lifeSpan *= DUST.fadeSpeed;
      p.rotation += p.spin;
    }
    for (let i = dust.length - 1; i >= 0; i--) {
      if (dust[i].lifeSpan <= 0.25) dust.splice(i, 1);
    }
  }

  function drawDust() {
    for (const p of dust) {
      const life = Math.max(p.lifeSpan / p.initialLifeSpan, 0);
      const taper = Math.pow(life, 1.65);
      const progress = 1 - life;
      const scaleMul = progress < 0.1
        ? 0.55 + (progress / 0.1) * 0.55
        : 0.25 + 0.9 * taper;
      const drawSize = p.size * scaleMul;
      const alpha = Math.min(1, taper * 1.08);

      /* Bloom: same star, 10% further out, pale and dim so it reads as a
         soft halo rather than a second star. */
      ctx.save();
      ctx.globalAlpha = alpha * 0.32;
      ctx.shadowColor = 'rgba(255, 250, 230, 0.95)';
      ctx.shadowBlur = drawSize * 0.66;
      drawStarPath(p.x, p.y, drawSize * 1.1, p.rotation, 'rgba(255, 249, 226, 0.9)');
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(255, 248, 214, 0.95)';
      ctx.shadowBlur = drawSize * 0.132; /* home page 0.12, +10% spread */
      drawStarPath(p.x, p.y, drawSize, p.rotation, p.color);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /* ================= METEOR / ASTEROID particles ================= */
  const fx = [];
  const EMBER_COLORS = ['#fff4d6', '#ffd08a', '#ffb066', '#ff8c4a'];
  /* Asteroid: flecks of flame thrown off the molten face. */
  const FLAME_COLORS = ['#ffe08a', '#ffb347', '#ff8a2a', '#ff5a1f', '#e8361a'];
  let lastSpawn = { x: 0, y: 0 };
  let nextGap = 12;

  function spawn(p) {
    if (fx.length < 340) fx.push(p);
  }

  /* Flame particles, ported from ltrudu/MouseEffects' FireTrail shader:
     many soft discs spread across the trail's width, drifting back and
     rising with turbulence, each cooling along a heat ramp (yellow →
     orange → red → dark red, never white) and flickering, all added
     together like light. */
  function heatColor(t) {
    let c;
    if (t < 0.33) {
      const u = t / 0.33;
      c = [0.3 + 0.7 * u, 0.15 * u, 0];
    } else if (t < 0.66) {
      const u = (t - 0.33) / 0.33;
      c = [1, 0.15 + 0.35 * u, 0];
    } else {
      const u = Math.min(1, (t - 0.66) / 0.34);
      c = [1, 0.5 + 0.35 * u, 0.1 * u];
    }
    return c.map((v) => Math.round((v * 255) / 8) * 8);
  }

  /* `r` is the head's radius, `size` scales the flames (the reference
     snippet's size: 20 → 8–20px discs). */
  function spawnFlame(r, size = 1, { spread = 0.9, reach = 1.1, rise = 1, jitter = 0.12, turb = 1 } = {}) {
    const bx = -Math.cos(angle);
    const by = -Math.sin(angle);
    const side = rand(-1, 1) * r * spread;
    const back = rand(0, r * reach);
    const sp = rand(0.15, 0.45);
    spawn({
      kind: 'flame',
      x: pos.x + bx * back - by * side,
      y: pos.y + by * back + bx * side,
      vx: bx * sp + rand(-jitter, jitter),
      vy: by * sp + rand(-jitter, jitter) - rand(0.08, 0.22) * rise, // flames rise
      turb,
      life: 1,
      decay: rand(0.03, 0.05),
      size: rand(8, 20) * 0.45 * size,
      temp: rand(0.8, 1),
      bright: rand(1, 1.5),
      seed: rand(0, 100),
    });
  }

  /* Embers: small, very bright, flicker fast and float up. */
  function spawnFireEmber(r) {
    const bx = -Math.cos(angle);
    const by = -Math.sin(angle);
    const side = rand(-1, 1) * r;
    spawn({
      kind: 'dot',
      flicker: true,
      x: pos.x + bx * rand(0, r) - by * side,
      y: pos.y + by * rand(0, r) + bx * side,
      vx: bx * rand(0.2, 0.6) + rand(-0.2, 0.2),
      vy: by * rand(0.2, 0.6) + rand(-0.2, 0.2) - rand(0.1, 0.3),
      life: 1,
      decay: rand(0.022, 0.04),
      size: rand(0.8, 1.8),
      color: pick(['#ffb347', '#ff8a2a', '#ffd27a', '#ff6a1f']),
      drag: 0.98,
    });
  }

  const rockR = () => 11.2; // radius; flames, trail and debris all scale from it

  /* Debris streaks, from the impact photo: thin lines of light with a
     bright tip, falling alongside the rock in its direction of travel. */
  function spawnStreak() {
    const r = rockR();
    const dx = Math.cos(angle + rand(-0.06, 0.06));
    const dy = Math.sin(angle + rand(-0.06, 0.06));
    // Hug the rock: just outside its rim, alongside or a little behind it.
    const side = (Math.random() < 0.5 ? -1 : 1) * rand(0.55, 1.25) * r;
    const back = rand(0, 1.4) * r;
    // Slow and short-lived, so they stay with the rock instead of racing off.
    const sp = rand(0.08, 0.22);
    spawn({
      kind: 'streak',
      x: pos.x - dx * back - dy * side,
      y: pos.y - dy * back + dx * side,
      dx,
      dy,
      vx: dx * sp,
      vy: dy * sp,
      life: 1,
      decay: rand(0.035, 0.055),
      len: rand(12, 30) * (1 + hover * 0.4),
      width: rand(0.7, 1.6),
    });
  }

  function spawnEmber(fast = 1) {
    const r = rockR();
    const bx = -Math.cos(angle);
    const by = -Math.sin(angle);
    // Off the hot face, close to the centre line.
    const side = rand(-1, 1) * r * 0.45;
    const sp = rand(0.25, 0.75) * fast;
    const fan = rand(-0.35, 0.35);
    spawn({
      kind: 'ember',
      x: pos.x + bx * r * 0.1 - by * side,
      y: pos.y + by * r * 0.1 + bx * side,
      vx: (bx - by * fan) * sp,
      vy: (by + bx * fan) * sp,
      life: 1,
      decay: rand(0.022, 0.05),
      size: rand(0.8, 2.1),
      color: pick(FLAME_COLORS),
      drag: 0.97,
    });
  }

  function spawnTrail() {
    if (mode === 'meteor') {
      /* The reference photo's tail is clean, so only a few sparks peel off
         close behind the head. */
      const back = angle + Math.PI + rand(-0.18, 0.18);
      spawn({
        kind: 'dot',
        x: pos.x - Math.cos(angle) * rand(4, 14),
        y: pos.y - Math.sin(angle) * rand(4, 14),
        vx: Math.cos(back) * rand(0.15, 0.55),
        vy: Math.sin(back) * rand(0.15, 0.55),
        life: 1,
        decay: rand(0.04, 0.07),
        size: rand(0.7, 1.7),
        color: pick(EMBER_COLORS),
      });
    } else {
      spawnEmber();
      if (hover > 0.5) spawnEmber(1.3);
    }
  }

  /* ================= click effects =================
     Each cursor bursts into a few of its own elements, kept small and
     tight around the click (they coast ~15–30px and die in ~⅓s):

     Stars    → tiny golden shooting stars flicking outward, each bending
                a little as it goes.
     Meteor   → licks of flame curling outward, with a few embers.
     Asteroid → curling flame, molten rock chips kicked up and falling,
                and a couple of debris streaks.

     A click is occasional, so it can carry a little delight — but it is
     feedback, not a firework. Under reduced motion nothing is thrown. */
  /* How far a click's sparks travel. Distance scales with launch speed
     (drag and lifetime stay the same), so this widens every burst evenly. */
  const SPREAD = 1.5;

  function burst() {
    if (!mouse.seen || reduced.matches) return;
    // Stars keeps the real pointer, so it bursts exactly there; the drawn
    // cursors burst from their head.
    const x = mode === 'stars' ? mouse.x : pos.x;
    const y = mode === 'stars' ? mouse.y : pos.y;
    const turn = rand(0, Math.PI * 2);
    const ring = (i, n) => turn + (i / n) * Math.PI * 2 + rand(-0.3, 0.3);
    const curlDir = Math.random() < 0.5 ? -1 : 1;

    if (mode === 'stars') {
      for (let i = 0; i < 7; i++) {
        const a = ring(i, 7);
        const sp = rand(0.35, 0.6) * SPREAD;
        spawn({
          kind: 'streak', gold: true, follow: true, fadeIn: 0.001,
          x: x + Math.cos(a) * 4.5, y: y + Math.sin(a) * 4.5,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.87,
          curl: rand(0.02, 0.06) * curlDir,
          life: 1, decay: rand(0.045, 0.065), len: rand(6, 11), width: rand(0.8, 1.2),
        });
      }
      for (let i = 0; i < 4; i++) spawnSpeck(x, y, 15);
    } else if (mode === 'meteor') {
      for (let i = 0; i < 9; i++) {
        const a = ring(i, 9);
        const sp = rand(0.5, 0.72) * SPREAD; // just clears the head's halo
        spawn({
          kind: 'flame', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.87,
          curl: rand(0.04, 0.08) * curlDir, turb: 0.2,
          life: 1, decay: rand(0.045, 0.06), size: rand(3.5, 6),
          temp: rand(0.85, 1), bright: 1.4, seed: rand(0, 100),
        });
      }
      for (let i = 0; i < 4; i++) {
        const a = ring(i, 4);
        const sp = rand(0.6, 0.85) * SPREAD;
        spawn({ kind: 'dot', flicker: true, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.88, life: 1, decay: rand(0.05, 0.07), size: rand(0.8, 1.4), color: pick(['#ffd27a', '#ffb347', '#ff8a2a']) });
      }
    } else {
      for (let i = 0; i < 7; i++) {
        const a = ring(i, 7);
        const sp = rand(0.5, 0.7) * SPREAD;
        spawn({
          kind: 'flame', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.87,
          curl: rand(0.04, 0.08) * curlDir, turb: 0.2,
          life: 1, decay: rand(0.042, 0.058), size: rand(3.5, 6),
          temp: rand(0.8, 1), bright: 1.3, seed: rand(0, 100),
        });
      }
      // Molten chips: kicked up and out, then falling.
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + rand(-1.2, 1.2);
        const sp = rand(0.45, 0.75) * SPREAD;
        spawn({ kind: 'chunk', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.03, drag: 0.94, life: 1, decay: rand(0.03, 0.045), size: rand(1.2, 2.4), rot: rand(0, 6), spin: rand(-0.2, 0.2) });
      }
      for (let i = 0; i < 3; i++) {
        const a = ring(i, 3);
        const sp = rand(0.4, 0.65) * SPREAD;
        spawn({ kind: 'streak', follow: true, fadeIn: 0.001, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.88, life: 1, decay: rand(0.05, 0.065), len: rand(7, 12), width: rand(0.8, 1.2) });
      }
    }
  }

  function stepFx(dt) {
    const k = dt / 16.67;
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i];
      const drag = p.drag ? Math.pow(p.drag, k) : 1;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * k * 6;
      p.y += p.vy * k * 6;
      p.life -= p.decay * k;
      if (p.grow) p.size += p.grow * k;
      if (p.g) p.vy += p.g * k;
      if (p.spin) p.rot += p.spin * k;
      if (p.curl) {
        // Bend the heading a little each frame, so sparks arc like flame.
        const c = Math.cos(p.curl * k);
        const sn = Math.sin(p.curl * k);
        const vx = p.vx;
        p.vx = vx * c - p.vy * sn;
        p.vy = vx * sn + p.vy * c;
      }
      if (p.kind === 'flame') {
        // Turbulence, as in FireTrail's UpdateParticles.
        const t = performance.now() / 1000;
        p.x += Math.sin(t * 3 + p.y * 0.05 + p.seed) * 0.35 * p.turb * k;
        p.y += Math.cos(t * 2 + p.x * 0.05 + p.seed) * 0.18 * p.turb * k;
      }
      if (p.life <= 0) fx.splice(i, 1);
    }
  }

  /* Everything here is light, so it all adds. */
  function drawFx() {
    // Rock chunks from an asteroid click are solid, so they draw normally.
    for (const p of fx) {
      if (p.kind !== 'chunk') continue;
      const a = Math.min(1, p.life * 1.6);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(-p.size, -p.size * 0.6);
      ctx.lineTo(p.size * 0.8, -p.size * 0.8);
      ctx.lineTo(p.size, p.size * 0.5);
      ctx.lineTo(-p.size * 0.3, p.size);
      ctx.closePath();
      ctx.fillStyle = '#6f6b7a';
      ctx.fill();
      // Still glowing on one edge as it cools.
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255, 150, 60, ${0.9 * p.life})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const now = performance.now();
    for (const p of fx) {
      const a = Math.max(0, p.life);
      if (p.kind === 'flame') {
        // Cools as it ages; flickers; shrinks a little as it burns out.
        const heat = p.temp * (0.28 + 0.72 * a);
        const flicker = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(now * 0.018 + p.seed * 7));
        const R = p.size * (0.5 + 0.5 * a);
        ctx.globalAlpha = Math.min(1, a * flicker * p.bright * 0.42);
        ctx.drawImage(sprite(heatColor(heat)), p.x - R, p.y - R, R * 2, R * 2);
      } else if (p.kind === 'dot') {
        ctx.globalAlpha = a * 0.9 * (p.flicker ? 0.5 + 0.5 * Math.random() : 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * a), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'speck') {
        ctx.globalAlpha = a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(now * 0.012 + p.seed * 5)));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'streak') {
        // Bright tip at the front, fading back along its own heading.
        const fade = Math.min(1, (1 - p.life) / (p.fadeIn ?? 0.15)) * a;
        const L = p.len * (0.6 + 0.4 * a);
        let hx = p.dx;
        let hy = p.dy;
        if (p.follow) {
          const m = Math.hypot(p.vx, p.vy) || 1;
          hx = p.vx / m;
          hy = p.vy / m;
        }
        const tx = p.x - hx * L;
        const ty = p.y - hy * L;
        const g = ctx.createLinearGradient(p.x, p.y, tx, ty);
        if (p.gold) {
          g.addColorStop(0, 'rgba(255, 248, 226, 1)');
          g.addColorStop(0.2, 'rgba(255, 216, 140, 0.75)');
          g.addColorStop(1, 'rgba(220, 150, 80, 0)');
        } else {
          g.addColorStop(0, 'rgba(255, 246, 214, 1)');
          g.addColorStop(0.12, 'rgba(255, 196, 110, 0.8)');
          g.addColorStop(0.5, 'rgba(240, 120, 50, 0.3)');
          g.addColorStop(1, 'rgba(200, 80, 40, 0)');
        }
        ctx.globalAlpha = fade;
        ctx.strokeStyle = g;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 250, 230, 1)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width * 0.9, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'ember') {
        // A short streak along its own motion, like the flecks in the art.
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * (0.5 + 0.5 * a);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 7, p.y - p.vy * 7);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ================= METEOR HEAD =================
     Modelled on the fireball references: a blazing round nucleus, and a
     soft tail that follows the path the head actually took, so it bends
     when the pointer curves. The tail is built by stamping soft discs
     along that path rather than filling a polygon, which gives it a
     rounded front that wraps the ball and edges with no hard corners.
     Everything additive, because that is how real light stacks. */

  /* Where the head has been, newest first. Trimmed by length, not time,
     so when the pointer stops the tail keeps its last shape. */
  const trail = [];
  const TRAIL_MAX = 460;

  function recordTrail() {
    const last = trail[0];
    if (last && Math.hypot(pos.x - last.x, pos.y - last.y) < 3) return;
    trail.unshift({ x: pos.x, y: pos.y });
    let total = 0;
    for (let i = 1; i < trail.length; i++) {
      total += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y);
      if (total > TRAIL_MAX) { trail.length = i + 1; break; }
    }
  }

  /* Soft disc sprites, one per colour, drawn once and cached — stamping
     hundreds of these is far cheaper than building gradients per frame. */
  const SPRITE = 96;
  const sprites = new Map();
  function sprite(rgb) {
    const key = rgb.join(',');
    let c = sprites.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = SPRITE;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    grad.addColorStop(0, `rgba(${key}, 1)`);
    grad.addColorStop(0.35, `rgba(${key}, 0.72)`);
    grad.addColorStop(0.7, `rgba(${key}, 0.22)`);
    grad.addColorStop(1, `rgba(${key}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
    sprites.set(key, c);
    return c;
  }

  /* Colour ramp from head (t = 0) to tail end (t = 1), quantised so the
     sprite cache stays small. */
  function ramp(stops, t) {
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    return c0.map((v, k) => Math.round((v + (c1[k] - v) * u) / 8) * 8);
  }

  const BLOOM_RAMP = [[0, [255, 196, 120]], [0.25, [255, 120, 56]], [0.6, [200, 52, 28]], [1, [120, 22, 16]]];
  const BODY_RAMP = [[0, [255, 236, 180]], [0.12, [255, 184, 92]], [0.4, [250, 116, 44]], [0.7, [210, 58, 28]], [1, [140, 28, 18]]];
  const CORE_RAMP = [[0, [255, 255, 250]], [0.2, [255, 226, 160]], [0.6, [255, 150, 64]], [1, [230, 90, 40]]];

  /* Walk the recorded path from the head, calling `fn(x, y, t)` every
     `step` px for `len` px. If the path is shorter than the tail, carry
     on straight along its last direction. */
  function walkTrail(len, step, fn) {
    let pts = [{ x: pos.x, y: pos.y }, ...trail];
    /* Relax the path a few passes so direction changes read as smooth
       arcs rather than kinks. The head stays pinned to the ball. */
    for (let pass = 0; pass < 5; pass++) {
      pts = pts.map((p, i) => {
        if (i === 0 || i === pts.length - 1) return p;
        const a = pts[i - 1];
        const b = pts[i + 1];
        return { x: (a.x + p.x * 2 + b.x) / 4, y: (a.y + p.y * 2 + b.y) / 4 };
      });
    }
    let seg = 0;
    let segLeft = 0;
    let x = pos.x;
    let y = pos.y;
    let dx = -Math.cos(angle);
    let dy = -Math.sin(angle);
    for (let s = 0; s <= len; s += step) {
      fn(x, y, s / len);
      let move = step;
      while (move > 0) {
        if (segLeft <= 0 && seg < pts.length - 1) {
          const a = pts[seg];
          const b = pts[seg + 1];
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          seg++;
          if (d < 0.001) continue;
          dx = (b.x - a.x) / d;
          dy = (b.y - a.y) / d;
          x = a.x;
          y = a.y;
          segLeft = d;
        }
        const m = segLeft > 0 ? Math.min(move, segLeft) : move;
        x += dx * m;
        y += dy * m;
        segLeft -= m;
        move -= m;
      }
    }
  }

  /* Stamp soft discs along the recorded path. Radius and opacity both ease
     off along the tail; per-stamp alpha is scaled by step / radius so a
     layer adds up to the same brightness however wide it is. */
  function stampTrail(len, colors, r0, r1, a0, curve) {
    /* Space stamps by the layer's thinnest point: wide glows need far fewer
       discs to stay smooth, thin cores keep the fine spacing. */
    const step = Math.min(4, Math.max(1.5, r1 * 1.2));
    walkTrail(len, step, (x, y, t) => {
      const fall = Math.pow(1 - t, curve);
      const R = r1 + (r0 - r1) * Math.pow(1 - t, 0.8);
      const a = Math.min(1, a0 * fall * (step / R) * 1.2);
      if (a < 0.004) return;
      ctx.globalAlpha = a;
      ctx.drawImage(sprite(ramp(colors, t)), x - R, y - R, R * 2, R * 2);
    });
  }

  function drawMeteorHead(enter) {
    const speed = Math.hypot(vel.x, vel.y);
    /* The tail is long at rest and much longer on hover. */
    tailScale += ((shortTail ? 0.4 : 1) - tailScale) * 0.2;
    const targetLen = (96 + Math.min(speed * 3.4, 90) + hover * 210) * tailScale;
    tailLen += (targetLen - tailLen) * 0.12;

    /* Parked and not hovering: the ball settles smaller and stretches
       into a long, slim oval along the tail. Slow to settle, quick to
       spring back round the moment it moves or is hovered. */
    const restTarget = speed < 0.35 && hover < 0.2 ? 1 : 0;
    rest += (restTarget - rest) * (restTarget ? 0.06 : 0.2);

    const r = 6 * (1 - press * 0.16) * (1 - rest * 0.22) * enter;
    const len = tailLen * enter;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    /* 1. Bloom — the wide, soft red haze. Starts as a round glow around
       the ball and narrows smoothly; no corners anywhere. */
    stampTrail(len, BLOOM_RAMP, r * 3.5, r * 1, 0.44, 1.5);
    /* 2. Body — the orange ribbon, a ball's width at the head. */
    stampTrail(len, BODY_RAMP, r * 1.6, r * 0.34, 0.9, 1.25);
    /* 3. Core — the bright inner streak, only down the first stretch. */
    stampTrail(len * 0.62, CORE_RAMP, r * 0.55, r * 0.14, 1, 1.4);

    ctx.globalAlpha = 1;

    /* 4. Halo + nucleus — the blazing ball the tail grows out of. Drawn in
       the travel frame so the resting oval lies along the tail. */
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    ctx.translate(-r * 0.45 * rest, 0); // the stretch reaches back, not forward

    ctx.save();
    ctx.scale(1 + rest * 0.35, 1 - rest * 0.2);
    const haloR = r * 3.8 * (1 - rest * 0.12);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
    halo.addColorStop(0, 'rgba(255, 246, 222, 0.85)');
    halo.addColorStop(0.24, 'rgba(255, 210, 140, 0.45)');
    halo.addColorStop(0.55, 'rgba(255, 140, 60, 0.16)');
    halo.addColorStop(1, 'rgba(255, 110, 40, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.scale(1 + rest * 0.8, 1 - rest * 0.45);
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.35);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.45, '#fff6dc');
    core.addColorStop(0.78, '#ffd07e');
    core.addColorStop(1, 'rgba(255, 150, 60, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ================= ASTEROID =================
     From the impact artwork: a rounded, lumpy, cratered rock whose
     leading face is molten — lava glowing through cracks, a hot rim, fire
     pushed out ahead of it — trailing a pale column of light, flames,
     flecks of fire and thin debris streaks. The rock turns slowly, but the melt is
     always on the side it is travelling towards. */
  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const ROCK = (() => {
    const rnd = seeded(7);
    const n = 18;
    const raw = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = 0.88 + rnd() * 0.14;
      raw.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    // One smoothing pass: lumpy, but no points.
    const pts = raw.map((p, i) => {
      const a = raw[(i + n - 1) % n];
      const b = raw[(i + 1) % n];
      return [(a[0] + p[0] * 2 + b[0]) / 4, (a[1] + p[1] * 2 + b[1]) / 4];
    });
    const craters = [];
    for (let i = 0; i < 11; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * 0.66;
      craters.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.06 + rnd() * 0.15 });
    }
    const cracks = [];
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2;
      const d = 0.2 + rnd() * 0.6;
      let x = Math.cos(a) * d;
      let y = Math.sin(a) * d;
      let dir = rnd() * Math.PI * 2;
      const path = [[x, y]];
      const steps = 3 + ((rnd() * 3) | 0);
      for (let s = 0; s < steps; s++) {
        dir += (rnd() - 0.5) * 1.3;
        x += Math.cos(dir) * 0.15;
        y += Math.sin(dir) * 0.15;
        if (Math.hypot(x, y) > 0.9) break;
        path.push([x, y]);
      }
      cracks.push(path);
    }
    return { pts, craters, cracks };
  })();

  /* Smooth closed outline through the midpoints of the lumpy polygon. */
  function rockPath(c, r) {
    const p = ROCK.pts;
    const n = p.length;
    const mid = (i) => [((p[i][0] + p[(i + 1) % n][0]) / 2) * r, ((p[i][1] + p[(i + 1) % n][1]) / 2) * r];
    c.beginPath();
    const m = mid(n - 1);
    c.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) {
      const q = mid(i);
      c.quadraticCurveTo(p[i][0] * r, p[i][1] * r, q[0], q[1]);
    }
    c.closePath();
  }

  /* The rock's surface, painted once at high resolution. */
  const ROCK_TEX = (() => {
    const S = 200;
    const R = 92;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    rockPath(g, R);
    g.clip();

    const base = g.createRadialGradient(-R * 0.4, -R * 0.45, R * 0.1, 0, 0, R * 1.05);
    base.addColorStop(0, '#c6c2cc');
    base.addColorStop(0.45, '#7c7886');
    base.addColorStop(1, '#312e39');
    g.fillStyle = base;
    g.fillRect(-S / 2, -S / 2, S, S);

    const rnd = seeded(21);
    for (let i = 0; i < 520; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * R;
      g.fillStyle = rnd() < 0.55 ? 'rgba(18, 16, 26, 0.2)' : 'rgba(236, 232, 245, 0.13)';
      const s = 1.5 + rnd() * 2.5;
      g.fillRect(Math.cos(a) * d, Math.sin(a) * d, s, s);
    }

    for (const cr of ROCK.craters) {
      const x = cr.x * R;
      const y = cr.y * R;
      const rr = cr.r * R;
      g.fillStyle = 'rgba(22, 20, 32, 0.5)';
      g.beginPath();
      g.arc(x, y, rr, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = Math.max(1.5, rr * 0.2);
      // Lit from the top-left: the far (lower) wall catches light.
      g.strokeStyle = 'rgba(236, 232, 248, 0.42)';
      g.beginPath();
      g.arc(x, y, rr * 0.9, 0.1 * Math.PI, 0.9 * Math.PI);
      g.stroke();
      g.strokeStyle = 'rgba(10, 8, 18, 0.5)';
      g.beginPath();
      g.arc(x, y, rr * 0.9, 1.1 * Math.PI, 1.9 * Math.PI);
      g.stroke();
    }

    const edge = g.createRadialGradient(0, 0, R * 0.62, 0, 0, R * 1.02);
    edge.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edge.addColorStop(1, 'rgba(5, 4, 14, 0.55)');
    g.fillStyle = edge;
    g.fillRect(-S / 2, -S / 2, S, S);
    return { canvas: c, S, R };
  })();

  /* The impact photo's trail: a translucent column of pale light, about
     as wide as the rock and barely tapering, warm near the rock and
     cooling to a faint peach-grey — plus a short orange heat glow right
     behind the rock. */
  const BEAM_RAMP = [[0, [255, 226, 186]], [0.3, [246, 196, 160]], [0.7, [196, 160, 150]], [1, [140, 124, 136]]];
  const HEAT_RAMP = [[0, [255, 176, 72]], [0.4, [240, 96, 32]], [1, [170, 40, 18]]];

  /* Drawn before the particles and rock so both sit on top of it. */
  function drawAsteroidWash(enter) {
    const speed = Math.hypot(vel.x, vel.y);
    tailScale += ((shortTail ? 0.5 : 1) - tailScale) * 0.2;
    const targetLen = (90 + Math.min(speed * 3, 90) + hover * 120) * tailScale;
    tailLen += (targetLen - tailLen) * 0.12;
    const r = rockR() * enter;
    const len = tailLen * enter;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Wide, soft outer column.
    stampTrail(len, BEAM_RAMP, r * 1.3, r * 1, 0.34 + hover * 0.1, 1.05);
    // Brighter inner band, the streaked centre of the column.
    stampTrail(len * 0.85, BEAM_RAMP, r * 0.6, r * 0.38, 0.36 + hover * 0.12, 1.2);
    // Heat right behind the rock.
    stampTrail(len * 0.3, HEAT_RAMP, r * 1.1, r * 0.5, 0.3 + hover * 0.14, 1.6);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawAsteroidHead(enter, now) {
    const speed = Math.hypot(vel.x, vel.y);
    spin += 0.003 + Math.min(speed * 0.0006, 0.01) + hover * 0.006;
    const r = rockR() * (1 - press * 0.12) * enter;
    // How molten the leading face is: warm at rest, blazing when moving or hovered.
    const heat = Math.min(1.2, 0.62 + hover * 0.42 + Math.min(speed * 0.03, 0.22));
    const flick = 0.93 + Math.sin(now / 70) * 0.04 + Math.sin(now / 37) * 0.03;
    const fxd = Math.cos(angle);
    const fyd = Math.sin(angle);

    /* 1. Fire pushed out ahead of the leading face. */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gx = pos.x + fxd * r * 0.35;
    const gy = pos.y + fyd * r * 0.35;
    const gR = r * 2.1 * flick;
    const bow = ctx.createRadialGradient(gx, gy, r * 0.4, gx, gy, gR);
    bow.addColorStop(0, `rgba(255, 186, 86, ${0.5 * heat})`);
    bow.addColorStop(0.45, `rgba(255, 92, 30, ${0.24 * heat})`);
    bow.addColorStop(1, 'rgba(200, 40, 10, 0)');
    ctx.fillStyle = bow;
    ctx.beginPath();
    ctx.arc(gx, gy, gR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(spin);
    const s = r / ROCK_TEX.R;
    const tex = () => ctx.drawImage(ROCK_TEX.canvas, (-ROCK_TEX.S / 2) * s, (-ROCK_TEX.S / 2) * s, ROCK_TEX.S * s, ROCK_TEX.S * s);

    // The travel direction, expressed in the rock's own (rotated) space.
    const la = angle - spin;
    const lx = Math.cos(la) * r;
    const ly = Math.sin(la) * r;

    ctx.save();
    rockPath(ctx, r);
    ctx.clip();
    /* 2. Rock. */
    tex();
    /* 3. Melt across the leading face. */
    const lava = ctx.createLinearGradient(lx, ly, -lx, -ly);
    lava.addColorStop(0, `rgba(255, 238, 156, ${Math.min(1, 0.95 * heat)})`);
    lava.addColorStop(0.16, `rgba(255, 162, 42, ${Math.min(1, 0.9 * heat)})`);
    lava.addColorStop(0.36, `rgba(214, 58, 14, ${0.6 * heat})`);
    lava.addColorStop(0.6, 'rgba(120, 20, 6, 0)');
    ctx.fillStyle = lava;
    ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    /* 4. Put the surface back through the melt so it reads as molten
       rock, craters and all, not a flat orange fill. */
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55;
    tex();
    ctx.globalAlpha = 1;
    /* 5. Lava glowing through the cracks — masked to the hot side by the
       same direction, so cracks on the cool side stay dark. */
    ctx.globalCompositeOperation = 'lighter';
    const crack = ctx.createLinearGradient(lx, ly, -lx, -ly);
    crack.addColorStop(0, `rgba(255, 222, 124, ${0.9 * heat * flick})`);
    crack.addColorStop(0.45, `rgba(255, 96, 22, ${0.5 * heat})`);
    crack.addColorStop(0.75, 'rgba(255, 60, 10, 0)');
    ctx.strokeStyle = crack;
    ctx.lineWidth = Math.max(0.8, r * 0.075);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const path of ROCK.cracks) {
      ctx.beginPath();
      path.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)));
      ctx.stroke();
    }
    ctx.restore();

    /* 6. Hot rim on the leading edge. */
    ctx.globalCompositeOperation = 'lighter';
    const rim = ctx.createLinearGradient(lx, ly, -lx, -ly);
    rim.addColorStop(0, `rgba(255, 214, 120, ${0.85 * heat})`);
    rim.addColorStop(0.35, 'rgba(255, 120, 40, 0)');
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(1, r * 0.12);
    rockPath(ctx, r);
    ctx.stroke();
    ctx.restore();
  }

  /* ================= STARS: shooting star =================
     From the reference photo: a thin golden streak with a soft, bright
     head, fading to a thread — and fine gold specks around it. It follows
     the real pointer (the native cursor stays), and since each point on
     the path only lives a moment, the streak shrinks back into the
     pointer when you stop, the way a shooting star burns out.

     Set STAR_STYLE to 'dust' to bring back the home page's fairy dust. */
  const STAR_STYLE = 'shooting';
  const shoot = []; // newest first: { x, y, t }
  const shootHead = { x: 0, y: 0, ready: false }; // eased toward the pointer
  const GOLD_GLOW = [[0, [255, 226, 170]], [0.3, [240, 180, 96]], [1, [170, 110, 60]]];
  const GOLD_CORE = [[0, [255, 250, 232]], [0.25, [255, 222, 152]], [1, [224, 152, 80]]];
  const GOLD_SPECKS = ['#fff2cc', '#ffe3a0', '#f5d08a', '#ffd98c'];

  function recordShoot(x, y, now) {
    const last = shoot[0];
    if (!last || Math.hypot(x - last.x, y - last.y) >= 1.5) shoot.unshift({ x, y, t: now });
  }

  /* Stamp soft discs along the shooting-star path, head first. */
  function stampShoot(len, colors, r0, r1, a0, curve) {
    // Fine for the thin core (it beads otherwise), looser for the wide glow.
    const step = Math.min(3, Math.max(1, r1 * 0.9));
    // Relax the path a few passes (head pinned) so it reads as one curve.
    let pts = shoot;
    for (let pass = 0; pass < 6; pass++) {
      pts = pts.map((q, i) => {
        if (i === 0 || i === pts.length - 1) return q;
        const a = pts[i - 1];
        const b = pts[i + 1];
        return { x: (a.x + q.x * 2 + b.x) / 4, y: (a.y + q.y * 2 + b.y) / 4 };
      });
    }
    let s = 0;
    let next = 0;
    for (let i = 1; i < pts.length && s < len; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      while (next <= s + d && next <= len) {
        const u = d ? (next - s) / d : 0;
        const x = a.x + (b.x - a.x) * u;
        const y = a.y + (b.y - a.y) * u;
        const t = next / len;
        const R = r1 + (r0 - r1) * Math.pow(1 - t, 0.8);
        const alpha = Math.min(1, a0 * Math.pow(1 - t, curve) * (step / R) * 1.2);
        if (alpha > 0.004) {
          ctx.globalAlpha = alpha;
          ctx.drawImage(sprite(ramp(colors, t)), x - R, y - R, R * 2, R * 2);
        }
        next += step;
      }
      s += d;
    }
  }

  function drawShoot(now) {
    const life = 460 + hover * 320;
    while (shoot.length && now - shoot[shoot.length - 1].t > life) shoot.pop();
    if (shoot.length < 2) return;
    let total = 0;
    for (let i = 1; i < shoot.length; i++) total += Math.hypot(shoot[i].x - shoot[i - 1].x, shoot[i].y - shoot[i - 1].y);
    if (total < 3) return;
    const len = Math.min(total, 160 + hover * 120);
    const grow = Math.min(1, total / 40);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    stampShoot(len, GOLD_GLOW, 9.5, 2.4, 0.34 + hover * 0.1, 1.3);
    stampShoot(len, GOLD_CORE, 2.7, 0.9, 0.85, 1.1);
    ctx.globalAlpha = 1;
    // Soft head, just at the pointer tip.
    const hx = shoot[0].x;
    const hy = shoot[0].y;
    const R = 10.5 * (0.5 + 0.5 * grow);
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, R);
    g.addColorStop(0, `rgba(255, 246, 220, ${0.9 * grow})`);
    g.addColorStop(0.3, `rgba(255, 214, 140, ${0.45 * grow})`);
    g.addColorStop(1, 'rgba(240, 170, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hx, hy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Fine gold specks that twinkle near the path and fade. */
  function spawnSpeck(x, y, spread = 14) {
    spawn({
      kind: 'speck',
      x: x + rand(-spread, spread),
      y: y + rand(-spread, spread),
      vx: rand(-0.03, 0.03),
      vy: rand(-0.03, 0.03),
      life: 1,
      decay: rand(0.015, 0.03),
      size: rand(0.5, 1.2),
      color: pick(GOLD_SPECKS),
      seed: rand(0, 100),
    });
  }

  /* ================= loop ================= */
  function frame(now) {
    const dt = Math.min(now - lastT, 50);
    lastT = now;
    const k = dt / 16.67;
    const rm = reduced.matches;

    ctx.clearRect(0, 0, w, h);

    if (mode === 'stars') {
      const px = pos.x;
      const py = pos.y;
      pos.x = mouse.x;
      pos.y = mouse.y;
      hover += (hoverTarget - hover) * (1 - Math.pow(1 - 0.16, k));
      if (STAR_STYLE === 'dust') {
        // The home page's fairy dust: per-frame step, no pointer smoothing.
        if (!rm && mouse.seen && hover > 0.5 && Math.random() < 0.12 * k) {
          pushDust(pos.x + rand(-5, 5), pos.y + rand(-5, 5));
        }
        stepDust();
        drawDust();
      } else {
        if (mouse.seen) {
          /* The streak's head glides after the pointer instead of
             snapping to it, so direction changes draw soft arcs. */
          if (!shootHead.ready) {
            shootHead.x = pos.x;
            shootHead.y = pos.y;
            shootHead.ready = true;
          }
          const f = rm ? 1 : 1 - Math.pow(1 - 0.65, k);
          shootHead.x += (pos.x - shootHead.x) * f;
          shootHead.y += (pos.y - shootHead.y) * f;
          recordShoot(shootHead.x, shootHead.y, now);
        }
        const sp = Math.hypot(pos.x - px, pos.y - py) / k;
        if (!rm && mouse.seen && Math.random() < (Math.min(1, sp / 8) * 0.35 + hover * 0.12) * k) {
          spawnSpeck(pos.x, pos.y);
        }
        stepFx(dt);
        drawShoot(now);
        drawFx();
      }
                  raf = requestAnimationFrame(frame);
      return;
    }

    if (mouse.seen && fine.matches) {
      const px = pos.x;
      const py = pos.y;
      // Both drawn cursors have weight, so they trail the pointer slightly.
      // A hint of weight, not lag: the head closes ~60% of the gap each frame.
      const follow = rm ? 1 : mode === 'meteor' ? 0.62 : 0.5;
      const f = 1 - Math.pow(1 - follow, k);
      pos.x += (mouse.x - pos.x) * f;
      pos.y += (mouse.y - pos.y) * f;
      vel.x = (pos.x - px) / k;
      vel.y = (pos.y - py) / k;

      const speed = Math.hypot(vel.x, vel.y);
      if (speed > 0.6) {
        // Shortest-path angle smoothing so the tail doesn't whip around.
        const target = Math.atan2(vel.y, vel.x);
        let d = target - angle;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        angle += d * Math.min(1, 0.22 * k);
      }
      recordTrail();

      hover += (hoverTarget - hover) * (1 - Math.pow(1 - (hoverTarget ? 0.2 : 0.12), k));
      press += (pressTarget - press) * (1 - Math.pow(1 - 0.35, k));

      if (!rm) {
        const dx = pos.x - lastSpawn.x;
        const dy = pos.y - lastSpawn.y;
        const gap = mode === 'asteroid' ? 6 : 12;
        if (Math.hypot(dx, dy) > nextGap) {
          spawnTrail();
          lastSpawn = { x: pos.x, y: pos.y };
          nextGap = gap * (0.55 + Math.random() * 0.7);
        }
        /* Flames every frame, not per distance: a steady burn that roars
           up with speed and on hover (the reference's intensity: 200). */
        const burn = Math.min(1, speed / 6);
        if (mode === 'asteroid') {
          // It keeps burning even when still: a slow smoulder, more on hover.
          if (Math.random() < (0.05 + burn * 0.35 + hover * 0.25) * k) spawnStreak();
          if (Math.random() < (0.05 + hover * 0.22) * k) spawnEmber(0.6);
          const flames = (0.35 + burn * 1.4 + hover * 0.9) * k;
          for (let n = flames; n > 0; n--) if (Math.random() < n) {
            /* Tight to the rock's centre line, streaming straight back along
               the path — no world-up rise, which pushed them out to the rim. */
            spawnFlame(rockR(), 1.35, { spread: 0.3, reach: 0.5, rise: 0, jitter: 0.035, turb: 0.3 });
          }
        } else {
          if (hover > 0.5 && Math.random() < 0.14 * k) spawnTrail();
          const r = 6;
          const flames = (0.6 + burn * 2.2 + hover * 1.6) * k;
          for (let n = flames; n > 0; n--) if (Math.random() < n) spawnFlame(r, 1);
          if (Math.random() < (0.12 + burn * 0.3 + hover * 0.3) * k) spawnFireEmber(r);
        }
      }

      stepFx(dt);

      // Switching modes scales the new cursor in from 0.6 — never from nothing.
      const enter = rm ? 1 : 0.6 + 0.4 * easeOut(Math.min(1, (now - modeStart) / 220));
      if (mode === 'meteor') {
        drawFx();
        drawMeteorHead(enter);
      } else {
        drawAsteroidWash(enter);
        drawFx();
        drawAsteroidHead(enter, now);
      }
                  ctx.globalAlpha = 1;
    }

    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  return {
    setMode,
    destroy() {
      cancelAnimationFrame(raf);
      for (const off of cleanups) off();
      ctx.clearRect(0, 0, w, h);
    },
  };
}
