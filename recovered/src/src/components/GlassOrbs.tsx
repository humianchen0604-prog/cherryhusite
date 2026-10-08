'use client';

import { useEffect, useRef, useState } from 'react';
import './glassOrbs.css';

/*
 * Glass orbs — Figma "Side project" / iPhone 17 - 6 (node 11:67).
 *
 * Each photo sits inside a sphere of thick glass. One WebGL2 canvas draws all of
 * them; per pixel the fragment shader:
 *   1. bulges the photo (barrel warp): centre magnified, edges compressed
 *   2. refracts at the rim: samples smear along the normal
 *   3. lays a clear glass shell on top: faint white haze, a thin rim line,
 *      soft specular highlights on the upper edges
 *   4. feathers the border into the dark page with a faint glow
 * Without WebGL2 the plain round <img>s stay visible as the fallback.
 */

// Figma frame, in design px. Everything below is laid out in these units.
const STAGE_W = 402;
const STAGE_H = 874;
// Room around each sphere for the outer glow.
const GLOW = 18;

type Orb = { src: string; x: number; y: number; w: number; h: number };

// A sphere: top-left corner and diameter, in design px.
const sphere = (src: string, x: number, y: number, d: number): Orb => ({ src, x, y, w: d, h: d });

// Loosely scattered, varied sizes, clear of the dynamic island.
const ORBS: Orb[] = [
  sphere('/assets/orbs/orb-6.jpg', 22, 40, 120),
  sphere('/assets/orbs/orb-5.jpg', 176, 70, 200),
  sphere('/assets/orbs/orb-2.jpg', 30, 205, 150),
  sphere('/assets/orbs/orb-7.jpg', 250, 300, 96),
  sphere('/assets/orbs/orb-8.jpg', 14, 380, 110),
  sphere('/assets/orbs/orb-1.jpg', 110, 400, 230),
  sphere('/assets/orbs/orb-3.jpg', 20, 610, 140),
  sphere('/assets/orbs/orb-4.jpg', 212, 650, 170),
  sphere('/assets/orbs/orb-9.jpg', 100, 780, 100),
];

const VERT = `#version 300 es
in vec2 aCorner;
uniform vec2 uStage;
uniform vec4 uRect;   // centre.xy, half-size.xy (design px)
uniform float uGlow;
out vec2 vLocal;
void main() {
  vLocal = aCorner * (uRect.zw + uGlow);
  vec2 p = (uRect.xy + vLocal) / uStage;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform sampler2D uTex;
uniform vec2 uHalf;
uniform vec2 uCover;  // object-fit: cover scale for this photo
out vec4 outColor;

float sdStadium(vec2 p, vec2 b) {
  float r = min(b.x, b.y);
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 photo(vec2 p, float lod) {
  vec2 uv = p / (2.0 * uHalf) * uCover + 0.5;
  return textureLod(uTex, clamp(uv, 0.001, 0.999), lod).rgb;
}

void main() {
  vec2 p = vLocal;
  float r = min(uHalf.x, uHalf.y);
  float sd = sdStadium(p, uHalf);
  float d = -sd;                                    // depth inside the rim, px

  // Outward normal of the rim.
  vec2 e = vec2(0.5, 0.0);
  vec2 n = normalize(vec2(
    sdStadium(p + e.xy, uHalf) - sdStadium(p - e.xy, uHalf),
    sdStadium(p + e.yx, uHalf) - sdStadium(p - e.yx, uHalf)) + 1e-5);

  // 0 on the pill's spine, 1 at the rim.
  float rho = 1.0 - clamp(d / r, 0.0, 1.0);

  // 1. Bulge: shrink sample coords at the centre (magnify) and let them run
  //    past the frame at the rim (compress + curve).
  vec2 s = p * (0.76 + 0.34 * pow(rho, 2.2));

  // 2. Refraction: pull the rim outward along the normal and blur it.
  float rim = pow(rho, 5.0);
  s += n * r * 0.10 * rim;
  float lod = 3.2 * rim;
  float spread = r * 0.09 * rim;
  vec3 col = vec3(0.0);
  for (int i = -3; i <= 3; i++) {
    col += photo(s + n * spread * float(i) / 3.0, lod);
  }
  col /= 7.0;

  // 3. Glassy shell.
  col = mix(col, vec3(1.0), 0.14 * pow(rho, 3.0));                        // clear haze
  col += vec3(1.0) * 0.30 * exp(-pow((d - 3.5) / 1.6, 2.0));               // thin rim line
  // Soft specular highlights sitting on the upper edges.
  float upL = max(dot(n, normalize(vec2(-0.55, -1.0))), 0.0);
  float upR = max(dot(n, normalize(vec2(0.7, -1.0))), 0.0);
  float ring = smoothstep(0.55, 0.9, rho) * smoothstep(1.0, 0.93, rho);
  col += vec3(1.0) * ring * (0.55 * pow(upL, 7.0) + 0.25 * pow(upR, 12.0));
  float dot2 = exp(-pow(length((p - vec2(-0.42, -0.62) * uHalf) / (r * vec2(0.22, 0.12))), 2.0));
  col += vec3(1.0) * 0.18 * dot2;
  // Slight darkening just inside the rim sells the glass thickness.
  col *= 1.0 - 0.06 * smoothstep(0.75, 0.95, rho) * smoothstep(1.0, 0.97, rho);

  // 4. Feathered edge + soft white glow, premultiplied.
  float body = smoothstep(0.0, 7.0, d);
  float halo = 0.10 * exp(min(d, 0.0) / 5.0) * (1.0 - body);
  outColor = vec4(col * body + vec3(halo), body + halo);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
  return sh;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function GlassOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: true });
    if (!gl) return;

    let cancelled = false;
    let raf = 0;
    let onResize: (() => void) | null = null;

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    } catch (err) {
      console.error('[GlassOrbs]', err);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aCorner = gl.getAttribLocation(prog, 'aCorner');
    gl.enableVertexAttribArray(aCorner);
    gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uStage = u('uStage');
    const uRect = u('uRect');
    const uGlow = u('uGlow');
    const uHalf = u('uHalf');
    const uCover = u('uCover');
    gl.uniform2f(uStage, STAGE_W, STAGE_H);
    gl.uniform1f(uGlow, GLOW);
    gl.uniform1i(u('uTex'), 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    Promise.all(ORBS.map((o) => loadImage(o.src))).then((imgs) => {
      if (cancelled) return;
      const items = imgs.map((img, i) => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const o = ORBS[i];
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const boxAspect = o.w / o.h;
        const cover: [number, number] = imgAspect > boxAspect ? [boxAspect / imgAspect, 1] : [1, imgAspect / boxAspect];
        return { tex, o, cover, phase: i * 1.7 };
      });

      const draw = (t: number) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(canvas.clientWidth * dpr);
        const h = Math.round(canvas.clientHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (const it of items) {
          // Gentle float: a couple of px of drift, out of phase per orb.
          const bob = reduceMotion ? 0 : Math.sin(t / 1800 + it.phase) * 2.2;
          const { o } = it;
          gl.bindTexture(gl.TEXTURE_2D, it.tex);
          gl.uniform4f(uRect, o.x + o.w / 2, o.y + o.h / 2 + bob, o.w / 2, o.h / 2);
          gl.uniform2f(uHalf, o.w / 2, o.h / 2);
          gl.uniform2f(uCover, it.cover[0], it.cover[1]);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        if (!reduceMotion) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
      setReady(true);
      if (reduceMotion) {
        onResize = () => requestAnimationFrame(draw);
        window.addEventListener('resize', onResize);
      }
    }).catch((err) => console.error('[GlassOrbs]', err));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="glass-orbs">
      <div className="glass-orbs__phone">
        <div
          className="glass-orbs__stage"
          style={{ width: STAGE_W, height: STAGE_H }}
        >
          <div className="glass-orbs__fallback" data-hidden={ready} aria-hidden={ready}>
            {ORBS.map((o) => (
              <img
                key={o.src}
                src={o.src}
                alt=""
                style={{
                  left: `${(o.x / STAGE_W) * 100}%`,
                  top: `${(o.y / STAGE_H) * 100}%`,
                  width: `${(o.w / STAGE_W) * 100}%`,
                  height: `${(o.h / STAGE_H) * 100}%`,
                }}
              />
            ))}
          </div>
          <canvas ref={canvasRef} className="glass-orbs__canvas" data-ready={ready} />
          <div className="glass-orbs__fade glass-orbs__fade--top" />
          <div className="glass-orbs__fade glass-orbs__fade--bottom" />
          <div className="glass-orbs__island" aria-hidden />
        </div>
      </div>
    </div>
  );
}
