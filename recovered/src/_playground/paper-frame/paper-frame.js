/* Paper Frame — see paper-frame.css for usage.
 *
 * Auto-mounts every `.pf` on the page. For frames added later:
 *   PaperFrame.mount(el)
 * To swap what's inside (Node, NodeList/array, or an HTML string):
 *   PaperFrame.set(el, '<img src="new.gif">')
 * After changing --pf-feather / --pf-wobble / --pf-radius / --pf-seed in JS:
 *   PaperFrame.refresh(el)
 *
 * Halo (the colour bleed) is a blurred copy of the content. Control it with
 * data-halo on the frame:
 *   data-halo="clone"   (default) copy the content
 *   data-halo="#3aa0e8" use a flat colour instead — good for iframes / heavy HTML
 *   data-halo="none"    no bleed
 */
(() => {
  const frames = new WeakMap();

  const cssNum = (cs, name, fallback) => {
    const v = parseFloat(cs.getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  };

  function maskFor(w, h, o) {
    // Enough room outside the box for the blur + wobble to fall fully to zero.
    const bleed = Math.ceil(o.feather * 1.6 + o.wobble + o.spray / 2);
    const W = w + bleed * 2, H = h + bleed * 2;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      `<filter id="f" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
      `<feTurbulence type="fractalNoise" baseFrequency="${o.freq}" numOctaves="3" seed="${o.seed}" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="${o.wobble * 2}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
      `<feGaussianBlur in="d" stdDeviation="${o.feather / 2}" result="b"/>` +
      // Second, finer displacement breaks up the falloff so it reads as airbrush spray, not a clean gradient.
      `<feTurbulence type="fractalNoise" baseFrequency="${o.freq * 2.5}" numOctaves="3" seed="${o.seed + 17}" result="m"/>` +
      `<feDisplacementMap in="b" in2="m" scale="${o.spray}" xChannelSelector="G" yChannelSelector="B"/>` +
      `</filter>` +
      `<rect x="${bleed}" y="${bleed}" width="${w}" height="${h}" rx="${Math.min(o.radius, w / 2, h / 2)}" fill="#fff" filter="url(#f)"/>` +
      `</svg>`;
    return { bleed, url: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` };
  }

  function refresh(el) {
    const st = frames.get(el);
    if (!st) return;
    const w = Math.round(el.clientWidth), h = Math.round(el.clientHeight);
    if (!w || !h) return;
    const cs = getComputedStyle(el);
    const { bleed, url } = maskFor(w, h, {
      feather: Math.max(0, cssNum(cs, '--pf-feather', 40)),
      wobble: Math.max(0, cssNum(cs, '--pf-wobble', 22)),
      freq: Math.max(0.001, cssNum(cs, '--pf-wobble-freq', 0.008)),
      spray: Math.max(0, cssNum(cs, '--pf-spray', 20)),
      radius: Math.max(0, cssNum(cs, '--pf-radius', 36)),
      seed: Math.round(cssNum(cs, '--pf-seed', 4)),
    });
    el.style.setProperty('--pf-bleed', bleed + 'px');
    el.style.setProperty('--pf-mask', url);
    el.classList.add('pf-ready');
  }

  function rebuildHalo(el) {
    const st = frames.get(el);
    if (!st) return;
    const { halo, content } = st;
    const mode = (el.dataset.halo || 'clone').trim();
    halo.replaceChildren();
    halo.style.background = '';
    halo.hidden = mode === 'none';
    if (mode === 'none') return;
    if (mode !== 'clone') { halo.style.background = mode; return; }

    for (const node of content.childNodes) {
      const c = node.cloneNode(true);
      if (c.nodeType !== 1) { halo.append(c); continue; }
      // Iframes would load a second time; skip them (use data-halo="<color>" instead).
      if (c.matches('iframe')) continue;
      c.querySelectorAll?.('iframe').forEach(n => n.remove());
      [c, ...c.querySelectorAll('[id]')].forEach(n => n.removeAttribute?.('id'));
      [c, ...c.querySelectorAll('video')].filter(v => v.tagName === 'VIDEO').forEach(v => {
        v.muted = true; v.removeAttribute('controls');
        v.play?.().catch(() => {});
      });
      halo.append(c);
    }
    // Keep cloned videos roughly in step with the originals.
    const src = content.querySelectorAll('video'), dst = halo.querySelectorAll('video');
    src.forEach((v, i) => {
      const d = dst[i]; if (!d) return;
      v.addEventListener('seeked', () => { d.currentTime = v.currentTime; });
      v.addEventListener('play', () => { d.currentTime = v.currentTime; d.play().catch(() => {}); });
      v.addEventListener('pause', () => d.pause());
    });
  }

  function mount(el) {
    if (frames.has(el)) return el;
    const halo = document.createElement('div');
    halo.className = 'pf-halo';
    halo.setAttribute('aria-hidden', 'true');
    halo.inert = true;

    const body = document.createElement('div');
    body.className = 'pf-body';
    const content = document.createElement('div');
    content.className = 'pf-content';
    content.append(...el.childNodes);
    body.append(content);
    el.append(halo, body);

    frames.set(el, { halo, body, content });
    rebuildHalo(el);

    let raf = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => refresh(el));
    }).observe(el);

    // Re-clone the halo when the content is swapped or a src changes.
    let pending = 0;
    new MutationObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => rebuildHalo(el));
    }).observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'poster'] });

    refresh(el);
    return el;
  }

  function set(el, what) {
    mount(el);
    const { content } = frames.get(el);
    if (typeof what === 'string') content.innerHTML = what;
    else if (what instanceof Node) content.replaceChildren(what);
    else content.replaceChildren(...what);
  }

  const mountAll = () => document.querySelectorAll('.pf').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();

  window.PaperFrame = { mount, set, refresh, rebuildHalo };
})();
