// Fire Trail cursor effect — Canvas port inspired by ltrudu/MouseEffects (MIT).
// Usage: <script src="fire-trail.js"></script>  or  import and call fireTrail({ ... })
(function (global) {
  function fireTrail(opts = {}) {
    const s = { intensity: 120, size: 16, embers: true, zIndex: 9999, ...opts };
    const rand = (a, b) => a + Math.random() * (b - a);
    const TAU = Math.PI * 2;

    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: s.zIndex });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener('resize', resize);
    resize();

    const mouse = { x: -999, y: -999, px: -999, py: -999 };
    const onMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    addEventListener('pointermove', onMove);

    let particles = [], acc = 0, last = performance.now(), raf;

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const moved = mouse.px > -900 && (mouse.x !== mouse.px || mouse.y !== mouse.py);

      // Emit along the segment the cursor travelled this frame so fast moves stay continuous.
      if (moved) {
        acc += s.intensity * dt * 1.5;
        while (acc >= 1) {
          acc--;
          const k = Math.random();
          const x = mouse.px + (mouse.x - mouse.px) * k, y = mouse.py + (mouse.y - mouse.py) * k;
          const ember = s.embers && Math.random() < 0.08;
          particles.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-20, 20), vy: rand(-60, -20) * (ember ? 3 : 1),
            t: 0, life: ember ? rand(1, 2) : rand(0.4, 0.9), ember, sz: s.size * rand(0.6, 1.2) });
        }
      }

      // Flames rise and flicker sideways.
      for (const p of particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 80 * dt; p.vx += rand(-60, 60) * dt; }
      particles = particles.filter(p => p.t < p.life);

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        const k = p.t / p.life;
        if (p.ember) {
          ctx.fillStyle = `rgba(255,${180 - 100 * k | 0},60,${1 - k})`;
          ctx.fillRect(p.x, p.y, 2, 2);
          continue;
        }
        // White-yellow core -> orange -> transparent deep red, cooling over lifetime.
        const rad = p.sz * (1 - k * 0.5);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, `rgba(255,${230 - 180 * k | 0},${120 - 120 * k | 0},${(1 - k) * 0.55})`);
        g.addColorStop(0.5, `rgba(255,${90 - 60 * k | 0},0,${(1 - k) * 0.3})`);
        g.addColorStop(1, 'rgba(120,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.fill();
      }

      mouse.px = mouse.x; mouse.py = mouse.y;
      raf = requestAnimationFrame(frame);
    }

    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(frame);

    return function destroy() {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      removeEventListener('resize', resize);
      canvas.remove();
    };
  }

  global.fireTrail = fireTrail;
  if (document.currentScript && !document.currentScript.hasAttribute('data-manual')) {
    document.readyState === 'loading' ? addEventListener('DOMContentLoaded', () => fireTrail()) : fireTrail();
  }
})(window);
