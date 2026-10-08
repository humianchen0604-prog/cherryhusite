/**
 * Volumetric: raymarched clouds. Looking up and ahead into a slab of cloud
 * built from tileable Perlin-Worley fBm (a base shape texture eroded by a finer
 * detail texture), lit by a low sunset sun off to the left: Beer–Lambert
 * absorption, a short march toward the sun for self-shadowing with a three-term
 * multiple-scattering approximation, the "powder" darkening on thin edges, and
 * a dual-lobe Henyey–Greenstein phase for the silver lining. Rendered at half
 * resolution — the clouds are soft — and drawn transparent over the CSS sky.
 *
 * The noise generator and the density / lighting model follow clouds-sim by
 * frmlinn (github.com/frmlinn/clouds-sim), with leoawen/volumetric-clouds as a
 * second reference:
 *   MIT License, Copyright (c) 2026 frmlinn.
 *   Permission is hereby granted, free of charge, to any person obtaining a
 *   copy of this software and associated documentation files (the "Software"),
 *   to deal in the Software without restriction, including without limitation
 *   the rights to use, copy, modify, merge, publish, distribute, sublicense,
 *   and/or sell copies of the Software, and to permit persons to whom the
 *   Software is furnished to do so, subject to the following conditions: The
 *   above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED
 *   "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
 *
 * Changes here: an open slab seen from below instead of a box orbit, a sun
 * march instead of a shadow map, no TAA (a fixed per-pixel dither instead),
 * the sunset palette, near-still wind, and a cursor drag on the density field.
 */
import { SHADOW, SKY, fullscreenQuad, glsl, program, QUAD_VERT, type RendererSpec } from './shared';

// --- Perlin-Worley 3D noise (after clouds-sim's NoiseGenerator) ---------------

const hashTable = (() => {
  const t = new Float32Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const p1 = Math.sin(i * 12.9898) * 43758.5453;
    const p2 = Math.sin(i * 39.346) * 43758.5453;
    const p3 = Math.sin(i * 73.156) * 43758.5453;
    t[i * 3] = p1 - Math.floor(p1);
    t[i * 3 + 1] = p2 - Math.floor(p2);
    t[i * 3 + 2] = p3 - Math.floor(p3);
  }
  return t;
})();

const wrap = (c: number, period: number) => ((c % period) + period) % period;
const hashIndex = (x: number, y: number, z: number) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 255;

/** Inverted Worley (cellular) noise, tileable with `period`. */
function worley(x: number, y: number, z: number, period: number) {
  const ix = x | 0;
  const iy = y | 0;
  const iz = z | 0;
  let min = 10;
  for (let k = -1; k <= 1; k++) {
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = ix + i;
        const cy = iy + j;
        const cz = iz + k;
        const h = hashIndex(wrap(cx, period), wrap(cy, period), wrap(cz, period)) * 3;
        const dx = x - (cx + hashTable[h]);
        const dy = y - (cy + hashTable[h + 1]);
        const dz = z - (cz + hashTable[h + 2]);
        const d = dx * dx + dy * dy + dz * dz;
        if (d < min) min = d;
      }
    }
  }
  return Math.max(0, 1 - Math.sqrt(min));
}

/** Value noise with quintic interpolation, tileable with `period`. */
function valueNoise(x: number, y: number, z: number, period: number) {
  const ix = x | 0;
  const iy = y | 0;
  const iz = z | 0;
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const w = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const h = (a: number, b: number, c: number) =>
    hashTable[hashIndex(wrap(a, period), wrap(b, period), wrap(c, period)) * 3];
  const r00 = h(ix, iy, iz) * (1 - u) + h(ix + 1, iy, iz) * u;
  const r01 = h(ix, iy, iz + 1) * (1 - u) + h(ix + 1, iy, iz + 1) * u;
  const r10 = h(ix, iy + 1, iz) * (1 - u) + h(ix + 1, iy + 1, iz) * u;
  const r11 = h(ix, iy + 1, iz + 1) * (1 - u) + h(ix + 1, iy + 1, iz + 1) * u;
  const r0 = r00 * (1 - v) + r10 * v;
  const r1 = r01 * (1 - v) + r11 * v;
  return r0 * (1 - w) + r1 * w;
}

/** Tileable 3D fBm over Perlin-Worley noise, packed as R8. */
function perlinWorley3D(size: number, baseFreq: number, octaves: number) {
  const data = new Uint8Array(size * size * size);
  const inv = 1 / size;
  let n = 0;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let value = 0;
        let amp = 1;
        let freq = baseFreq;
        let max = 0;
        for (let o = 0; o < octaves; o++) {
          const period = freq | 0;
          const px = x * inv * freq;
          const py = y * inv * freq;
          const pz = z * inv * freq;
          value += amp * (valueNoise(px, py, pz, period) * 0.6 + worley(px, py, pz, period) * 0.4);
          max += amp;
          amp *= 0.5;
          freq *= 2;
        }
        data[n++] = (value / max) * 255;
      }
    }
  }
  return data;
}

let noiseCache: { base: Uint8Array; detail: Uint8Array } | null = null;
const BASE_SIZE = 48;
const DETAIL_SIZE = 32;
function volumeNoise() {
  noiseCache ??= {
    base: perlinWorley3D(BASE_SIZE, 4, 3),
    detail: perlinWorley3D(DETAIL_SIZE, 8, 3),
  };
  return noiseCache;
}

// --- renderer -------------------------------------------------------------------

const FRAG = `#version 300 es
precision highp float;
precision highp sampler3D;
out vec4 outColor;
uniform vec2 uRes;       // device px
uniform float uTime;
uniform sampler3D uBase;
uniform sampler3D uDetail;
uniform vec2 uCursor;    // cursor, in world xz on the slab
uniform vec2 uPush;      // cursor drag, world units

const float PI = 3.14159265359;
const float SLAB_LO = 1.4;
const float SLAB_HI = 2.9;
const int STEPS = 30;
const int SUN_STEPS = 4;

const float COVERAGE = 0.5;
const float BASE_SCALE = 0.22;
const float DETAIL_SCALE = 0.55;
const float DETAIL_WEIGHT = 0.45;
const float DENSITY = 4.0;
const float ABSORB = 1.6;

const vec3 SKY = ${glsl(SKY)};
const vec3 UNDER = ${glsl(SHADOW)};
// Low sunset sun, off to the left and a little ahead.
const vec3 SUN_DIR = normalize(vec3(-0.78, 0.2, 0.45));
const vec3 SUN_COL = vec3(1.0, 0.6, 0.48) * 1.25;

float remap(float v, float a, float b, float c, float d) {
  return c + (v - a) * (d - c) / (b - a);
}

vec3 pushed(vec3 p) {
  vec2 d = p.xz - uCursor;
  p.xz -= uPush * exp(-dot(d, d) / 1.6);
  return p;
}

float density(vec3 p, bool detail) {
  float h = (p.y - SLAB_LO) / (SLAB_HI - SLAB_LO);
  float grad = smoothstep(0.0, 0.14, h) * (1.0 - smoothstep(0.55, 1.0, h));
  vec3 q = pushed(p) + vec3(uTime * 0.012, 0.0, uTime * 0.004);
  float base = texture(uBase, q * BASE_SCALE).r;
  float d = max(0.0, remap(base, 1.0 - COVERAGE, 1.0, 0.0, 1.0)) * grad;
  if (detail && d > 0.0) {
    float n = texture(uDetail, q * DETAIL_SCALE + vec3(0.0, uTime * 0.003, 0.0)).r;
    float erosion = n * DETAIL_WEIGHT * mix(0.2, 1.0, h);
    d = max(0.0, remap(d, erosion, 1.0, 0.0, 1.0));
  }
  return d * DENSITY;
}

float hg(float c, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * c, 1.5));
}

float dualLobe(float c) {
  return mix(hg(c, 0.7), hg(c, -0.2), 0.3);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Camera at the origin, pitched up into the sky.
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float pitch = 0.42;
  vec3 fwd = vec3(0.0, sin(pitch), cos(pitch));
  vec3 right = vec3(1.0, 0.0, 0.0);
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(fwd + right * p.x * 0.55 + up * p.y * 0.55);

  float t0 = SLAB_LO / rd.y;
  float t1 = min(SLAB_HI / rd.y, t0 + 9.0);
  float len = t1 - t0;
  float stepLen = len / float(STEPS);
  float t = t0 + stepLen * hash(gl_FragCoord.xy);

  float cosTheta = dot(rd, SUN_DIR);
  float phase = mix(dualLobe(cosTheta), 1.0 / (4.0 * PI), 0.6) * PI;
  float T = 1.0;
  vec3 light = vec3(0.0);

  for (int i = 0; i < STEPS; i++) {
    if (T < 0.02) break;
    vec3 pos = rd * t;
    float d = density(pos, true);
    if (d > 0.001) {
      // March toward the sun for self-shadowing.
      float toSun = 0.0;
      for (int j = 1; j <= SUN_STEPS; j++) {
        toSun += density(pos + SUN_DIR * (0.22 * float(j)), false);
      }
      toSun *= 0.22;
      vec3 ms = exp(-toSun * ABSORB) * vec3(1.0)
              + exp(-toSun * ABSORB * 0.25) * vec3(0.5)
              + exp(-toSun * ABSORB * 0.05) * vec3(0.2);
      float powder = 1.0 - exp(-d * 2.0);
      vec3 direct = SUN_COL * ms * powder * phase;
      float h = (pos.y - SLAB_LO) / (SLAB_HI - SLAB_LO);
      // Sunset glow bounced into the undersides, cool sky light on the tops.
      vec3 ambient = mix(mix(UNDER, SUN_COL * 0.55, 0.3), SKY, h * h) * 0.62;
      vec3 lum = ambient + direct;
      float stepT = exp(-d * stepLen * ABSORB);
      light += d * stepLen * T * lum;
      T *= stepT;
    }
    t += stepLen;
  }

  // Thin out toward the horizon so the band settles into the page.
  float fade = smoothstep(-0.5, 0.15, p.y);
  float a = (1.0 - T) * fade;
  outColor = vec4(min(light, vec3(1.0)) * fade, a);
}`;

function texture3D(gl: WebGL2RenderingContext, size: number, data: Uint8Array) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_3D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, size, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.REPEAT);
  return t;
}

export const volumetric: RendererSpec = {
  maxDpr: 0.75,
  idleFps: 20,
  create(gl, reduced) {
    const prog = program(gl, QUAD_VERT, FRAG);
    const quad = fullscreenQuad(gl);
    const noise = volumeNoise();
    const base = texture3D(gl, BASE_SIZE, noise.base);
    const detail = texture3D(gl, DETAIL_SIZE, noise.detail);
    let W = 1;
    let H = 1;
    const push = { x: 0, y: 0 };
    const cursor = { x: 0, y: 0 };

    /** Where a band point (CSS px) lands on the middle of the slab, in world xz. */
    const toWorld = (x: number, y: number) => {
      const px = (x - W / 2) / H;
      const py = (H / 2 - y) / H;
      const pitch = 0.42;
      const fy = Math.sin(pitch);
      const fz = Math.cos(pitch);
      // up = -(fwd × right) = (0, cos, -sin)
      const rx = px * 0.55;
      const ry = fy + py * 0.55 * fz;
      const rz = fz - py * 0.55 * fy;
      const t = 2.1 / Math.max(ry, 0.05);
      return { x: rx * t, z: rz * t, scale: t };
    };

    return {
      resize(w, h) {
        W = w;
        H = h;
      },
      frame(now, p) {
        let busy = false;
        if (!reduced) {
          const w = toWorld(p.x, p.y);
          cursor.x = w.x;
          cursor.y = w.z;
          // Pointer velocity → world units at that depth, eased so the drag has a tail.
          const k = (0.55 * w.scale) / H * 2.2;
          const tx = p.inside ? p.vx * k : 0;
          const ty = p.inside ? -p.vy * k : 0;
          push.x += (Math.max(-0.8, Math.min(0.8, tx)) - push.x) * 0.1;
          push.y += (Math.max(-0.8, Math.min(0.8, ty)) - push.y) * 0.1;
          busy = Math.abs(push.x) + Math.abs(push.y) > 1e-3;
        }
        const canvas = gl.canvas as HTMLCanvasElement;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(prog.p);
        gl.bindVertexArray(quad.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, base);
        gl.uniform1i(prog.u('uBase'), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_3D, detail);
        gl.uniform1i(prog.u('uDetail'), 1);
        gl.uniform2f(prog.u('uRes'), canvas.width, canvas.height);
        gl.uniform1f(prog.u('uTime'), reduced ? 0 : now / 1000);
        gl.uniform2f(prog.u('uCursor'), cursor.x, cursor.y);
        gl.uniform2f(prog.u('uPush'), push.x, push.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return busy;
      },
      destroy() {},
    };
  },
};
