/**
 * Shared pieces for the sky renderers in this folder: the palette, the
 * renderer contract, GL helpers, and the particle cloud layout + cursor push
 * used by the watercolour and particle renderers.
 */

export type RGB = [number, number, number];

// --- palette ---------------------------------------------------------------
// Sky: #CFDBEA graded down to white (the CSS behind the canvas does the same).
// Cloud colours are sampled from the reference sunset.
export const SKY: RGB = [207, 219, 234];
export const LIGHT: RGB = [236, 232, 236]; // pale cloud body
export const MID: RGB = [196, 188, 198]; // body grey
export const SHADOW: RGB = [150, 138, 152]; // mauve-grey underside
export const CORAL: RGB = [238, 136, 114]; // sunlit side
export const PEACH: RGB = [253, 198, 180]; // brightest lit rims
export const HAZE: RGB = [200, 204, 220]; // thin high cloud

/** GLSL `vec3` literal for a palette colour. */
export const glsl = (c: RGB) => `vec3(${c.map((v) => (v / 255).toFixed(4)).join(', ')})`;

/** Direction toward the sun, screen space (y down): low, off the lower left. */
export const SUN: [number, number] = [-0.55, 0.84];

// --- renderer contract -------------------------------------------------------

export type Pointer = {
  /** CSS px within the band. */
  x: number;
  y: number;
  /** Movement since the last frame, CSS px; decays to 0 once the pointer stops. */
  vx: number;
  vy: number;
  inside: boolean;
};

export type Renderer = {
  /** Band size in CSS px; the canvas is already sized W·dpr × H·dpr. */
  resize(W: number, H: number, dpr: number): void;
  /** Draw a frame. Returns true while something is still settling (wants full frame rate). */
  frame(now: number, pointer: Pointer): boolean;
  destroy(): void;
};

export type RendererSpec = {
  create(gl: WebGL2RenderingContext, reduced: boolean): Renderer;
  /** Highest device-pixel ratio worth rendering at (soft effects render low-res). */
  maxDpr: number;
  /** Frame rate while nothing is being pushed around. */
  idleFps: number;
};

// --- helpers -----------------------------------------------------------------

/** Deterministic PRNG so the sky is the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export function program(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
    return cache.get(name)!;
  };
  return { p, u };
}

export function texture2D(gl: WebGL2RenderingContext, wrap: number) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  return t;
}

/** A full-screen quad at attribute 0, in its own VAO. */
export function fullscreenQuad(gl: WebGL2RenderingContext) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { buf, vao };
}

export const QUAD_VERT = `#version 300 es
layout(location = 0) in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner * 0.5 + 0.5;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`;

let noiseCache: Uint8Array | null = null;
/** Tileable 128² fBm value noise (RGBA8, grey): puff edges, water marks, paper tooth. */
export function noiseTexture() {
  if (noiseCache) return noiseCache;
  const size = 128;
  const rand = rng(7);
  const data = new Uint8Array(size * size * 4);
  const octaves = [8, 16, 32];
  const grids = octaves.map((g) => Float32Array.from({ length: g * g }, rand));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let amp = 0.55;
      let total = 0;
      octaves.forEach((g, o) => {
        const fx = (x / size) * g;
        const fy = (y / size) * g;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const at = (i: number, j: number) => grids[o][(j % g) * g + (i % g)];
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
        const bot = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
        v += (top + (bot - top) * sy) * amp;
        total += amp;
        amp *= 0.5;
      });
      const c = Math.round((v / total) * 255);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = c;
      data[i + 3] = 255;
    }
  }
  noiseCache = data;
  return data;
}

export function uploadNoise(gl: WebGL2RenderingContext) {
  const t = texture2D(gl, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, noiseTexture());
  return t;
}

// --- particle clouds -----------------------------------------------------------

type Cluster = {
  /** Centre, as a fraction of the band. */
  x: number;
  y: number;
  /** Half-extent: rx as a fraction of band width, ry of band height. */
  rx: number;
  ry: number;
  /** Relative puff count. */
  n: number;
  /** 0 = in shadow, 1 = fully sunlit. */
  lit: number;
  /** Thin, flat high cloud rather than a billowed mass. */
  haze?: boolean;
};

// Laid out like the reference sunset: a coral-lit bank low left, a grey mass
// through the middle, a pink-lit tower centre right, thin cloud along the top.
const CLUSTERS: Cluster[] = [
  { x: 0.22, y: 0.1, rx: 0.34, ry: 0.12, n: 70, lit: 0.3, haze: true },
  { x: 0.74, y: 0.08, rx: 0.38, ry: 0.11, n: 70, lit: 0.25, haze: true },
  { x: 0.84, y: 0.25, rx: 0.19, ry: 0.15, n: 70, lit: 0.35 },
  { x: 0.6, y: 0.37, rx: 0.1, ry: 0.2, n: 80, lit: 0.95 },
  { x: 0.45, y: 0.57, rx: 0.19, ry: 0.16, n: 110, lit: 0.2 },
  { x: 0.15, y: 0.6, rx: 0.2, ry: 0.2, n: 130, lit: 1 },
  { x: 0.86, y: 0.57, rx: 0.15, ry: 0.17, n: 90, lit: 0.65 },
  { x: 0.34, y: 0.87, rx: 0.18, ry: 0.09, n: 50, lit: 0.8 },
  { x: 0.7, y: 0.85, rx: 0.18, ry: 0.09, n: 50, lit: 0.7 },
];

/** Floats per puff: base xy, radius, pigment weights (body, sun, shadow, haze), seed xy, phase. */
export const PUFF_STRIDE = 10;

/**
 * Vertex shader for a puff, shared by the renderers that draw them. Declares
 * `vLocal` (−1…1 across the puff), `vWeights`, `vSeed`; the fragment shader
 * decides what a puff looks like.
 */
export const PUFF_VERT = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec2 aBase;
layout(location = 2) in float aRadius;
layout(location = 3) in vec4 aWeights;
layout(location = 4) in vec2 aSeed;
layout(location = 5) in float aPhase;
layout(location = 6) in vec2 aOffset;
uniform vec2 uRes;
uniform float uTime;
out vec2 vLocal;
out vec4 vWeights;
out vec2 vSeed;
void main() {
  // Breathing: each puff wobbles a hair around its home and swells slightly.
  float t = uTime;
  vec2 breathe = vec2(sin(t * 0.21 + aPhase), cos(t * 0.17 + aPhase * 1.7)) * aRadius * 0.03;
  float r = aRadius * (1.0 + 0.03 * sin(t * 0.13 + aPhase * 2.3));
  vec2 pos = aBase + aOffset + breathe + aCorner * r;
  vec2 clip = pos / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = aCorner;
  vWeights = aWeights;
  vSeed = aSeed;
}`;

/**
 * The puffs: layout, GPU buffers, and the cursor push. Home positions live on
 * the GPU; the push is simulated here and uploaded as a per-puff offset.
 */
export class PuffField {
  count = 0;
  unit = 1;
  vao: WebGLVertexArrayObject;
  private gl: WebGL2RenderingContext;
  private statics: WebGLBuffer;
  private offsets: WebGLBuffer;
  private base = new Float32Array(0);
  private radii = new Float32Array(0);
  private off = new Float32Array(0);
  private vel = new Float32Array(0);
  private W = 0;
  private H = 0;

  constructor(gl: WebGL2RenderingContext, corner: WebGLBuffer | null) {
    this.gl = gl;
    this.vao = gl.createVertexArray()!;
    this.statics = gl.createBuffer()!;
    this.offsets = gl.createBuffer()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, corner);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.statics);
    const attr = (loc: number, size: number, at: number) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, PUFF_STRIDE * 4, at * 4);
      gl.vertexAttribDivisor(loc, 1);
    };
    attr(1, 2, 0);
    attr(2, 1, 2);
    attr(3, 4, 3);
    attr(4, 2, 7);
    attr(5, 1, 9);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsets);
    gl.enableVertexAttribArray(6);
    gl.vertexAttribPointer(6, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(6, 1);
    gl.bindVertexArray(null);
  }

  /** Re-lay the puffs for a W×H band (only on real size changes). */
  layout(W: number, H: number) {
    if (W === this.W && Math.abs(H - this.H) <= 40) return;
    this.W = W;
    this.H = H;
    const rand = rng(20260928);
    // Puff size tracks the band, but phones never get giant blobs.
    const unit = Math.min(H, W * 0.85);
    const density = (W * H) / (unit * unit) / 2.2;
    const puffs: { key: number; data: number[] }[] = [];

    CLUSTERS.forEach((c, ci) => {
      const count = Math.round(c.n * density);
      const cx = c.x * W;
      const cy = c.y * H;
      const rx = c.rx * W;
      const ry = c.ry * H;
      for (let i = 0; i < count; i++) {
        const ang = rand() * Math.PI * 2;
        const rr = Math.sqrt(rand());
        const ux = Math.cos(ang) * rr;
        const uy = Math.sin(ang) * rr * (Math.sin(ang) > 0 ? 0.8 : 1);
        const x = cx + ux * rx;
        const y = cy + uy * ry;

        // How much this puff faces the sun (−1…1), scaled by how near the edge it is.
        const len = Math.hypot(ux, uy) || 1;
        const facing = ((ux / len) * SUN[0] + (uy / len) * SUN[1]) * Math.pow(rr, 0.7);
        const shade = facing * 0.5 + 0.5;
        const core = i < count * 0.12;

        let w: [number, number, number, number];
        let radius: number;
        if (c.haze) {
          w = [0, 0, 0, 0.6 + 0.4 * rand()];
          radius = unit * (0.04 + 0.05 * rand());
        } else {
          const sun = c.lit * smooth(0.38, 0.9, shade) * (0.5 + 0.5 * rr) * (0.8 + 0.4 * rand());
          const shadow =
            (1 - shade) * (1 - 0.6 * c.lit) * (0.6 + 0.4 * (1 - rr)) + 0.25 * (1 - c.lit) * (1 - rr);
          w = [1, core ? sun * 0.4 : sun, shadow * (0.8 + 0.4 * rand()), 0];
          radius = core
            ? unit * (0.1 + 0.07 * rand())
            : unit * (0.035 + 0.075 * Math.pow(rand(), 0.7) * (1.15 - rr * 0.55));
        }
        puffs.push({
          // Back to front: cluster order, cores first, shadowed puffs under lit ones.
          key: ci * 10 + (core ? 0 : 2 + shade * 4 + rand() * 3),
          data: [x, y, radius, ...w, rand() * 8, rand() * 8, rand() * 6.283],
        });
      }
    });

    puffs.sort((a, b) => a.key - b.key);
    const data = new Float32Array(puffs.length * PUFF_STRIDE);
    puffs.forEach((p, i) => data.set(p.data, i * PUFF_STRIDE));

    this.count = puffs.length;
    this.unit = unit;
    this.base = new Float32Array(this.count * 2);
    this.radii = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      this.base[i * 2] = data[i * PUFF_STRIDE];
      this.base[i * 2 + 1] = data[i * PUFF_STRIDE + 1];
      this.radii[i] = data[i * PUFF_STRIDE + 2];
    }
    this.off = new Float32Array(this.count * 2);
    this.vel = new Float32Array(this.count * 2);
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.statics);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsets);
    gl.bufferData(gl.ARRAY_BUFFER, this.off, gl.DYNAMIC_DRAW);
  }

  private settling = false;

  /**
   * Spring each puff home, pushing the ones near the cursor: part parting away
   * from it, part carried along with it. Returns whether anything still moves.
   */
  step(p: Pointer) {
    const moving = Math.abs(p.vx) + Math.abs(p.vy) > 0.05;
    if (!this.settling && !(p.inside && moving)) return false;
    const R = this.unit * 0.32;
    const R2 = R * R;
    const push = Math.min(Math.hypot(p.vx, p.vy), 40) * 0.035;
    const { base, off, vel, radii } = this;
    let still = true;
    for (let i = 0; i < this.count; i++) {
      const j = i * 2;
      let vx = vel[j];
      let vy = vel[j + 1];
      if (p.inside && push > 0.001) {
        const dx = base[j] + off[j] - p.x;
        const dy = base[j + 1] + off[j + 1] - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R) ** 2;
          vx += (dx / d) * f * push + p.vx * f * 0.05;
          vy += (dy / d) * f * push + p.vy * f * 0.05;
        }
      }
      // Soft spring home; bigger puffs are heavier and lag a little.
      const k = 0.012 * ((this.unit * 0.06) / Math.max(radii[i], 1)) ** 0.35;
      vx = (vx - off[j] * k) * 0.93;
      vy = (vy - off[j + 1] * k) * 0.93;
      off[j] += vx;
      off[j + 1] += vy;
      vel[j] = vx;
      vel[j + 1] = vy;
      if (still && (Math.abs(off[j]) > 0.05 || Math.abs(off[j + 1]) > 0.05)) still = false;
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsets);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, off);
    this.settling = !still || moving;
    return this.settling;
  }
}
