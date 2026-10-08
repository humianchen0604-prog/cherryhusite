/**
 * Particles: the cheap billboard tier (as procedural-clouds-threejs uses for
 * mobile/background skies). Each puff is a soft, noise-edged sprite, drawn
 * back to front; colour comes from its pigment weights (coral on the side
 * facing the low sun, mauve on the far side) and each is shaded across its own
 * face like a small dome, which gives the masses their billowed relief. Drawn
 * transparent over the CSS sky.
 */
import {
  CORAL,
  HAZE,
  LIGHT,
  MID,
  PEACH,
  PuffField,
  PUFF_VERT,
  SHADOW,
  SUN,
  fullscreenQuad,
  glsl,
  program,
  uploadNoise,
  type RendererSpec,
} from './shared';

const FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vWeights;
in vec2 vSeed;
uniform sampler2D uNoise;
uniform vec2 uSun;
out vec4 outColor;

const vec3 LIGHT = ${glsl(LIGHT)};
const vec3 MID = ${glsl(MID)};
const vec3 SHADOW = ${glsl(SHADOW)};
const vec3 CORAL = ${glsl(CORAL)};
const vec3 PEACH = ${glsl(PEACH)};
const vec3 HAZE = ${glsl(HAZE)};

void main() {
  float r = length(vLocal);
  if (r > 1.0) discard;
  float body = vWeights.x;
  float sun = vWeights.y;
  float shadow = vWeights.z;
  float haze = vWeights.w;

  // Break the round edge up with noise so puffs read as vapour, not discs.
  float n1 = texture(uNoise, vLocal * 0.3 + vSeed).r;
  float n2 = texture(uNoise, vLocal * 0.9 + vSeed.yx * 1.7).r;
  float soft = haze > 0.0 ? 0.7 : 0.0;
  float d = r + (n1 * 0.6 + n2 * 0.4 - 0.5) * mix(0.42, 0.7, soft);
  float alpha = haze > 0.0 ? 0.16 + 0.18 * haze : 0.8;
  float a = smoothstep(1.0, mix(0.55, 0.0, soft), d) * alpha;
  if (a < 0.002) discard;

  // Colour from the pigment weights.
  vec3 col = mix(LIGHT, MID, clamp(shadow * 0.9, 0.0, 1.0));
  col = mix(col, SHADOW, clamp(shadow - 0.6, 0.0, 1.0));
  col = mix(col, CORAL, clamp(sun * 1.1, 0.0, 0.9));
  col = mix(col, PEACH, clamp((sun - 0.6) * 1.2, 0.0, 0.6));
  col = mix(col, HAZE, clamp(haze, 0.0, 1.0) * (1.0 - body));

  // Each puff is a small dome lit from the sun's side: bright face, shaded far limb.
  float facing = dot(vLocal, uSun);
  float dome = sqrt(max(0.0, 1.0 - r * r));
  float relief = (0.18 * facing + 0.08 * dome) * (1.0 - soft);
  col *= (0.95 + relief) * (0.97 + 0.06 * n2);
  outColor = vec4(min(col, 1.0) * a, a);
}`;

export const particles: RendererSpec = {
  maxDpr: 1.5,
  idleFps: 30,
  create(gl, reduced) {
    const prog = program(gl, PUFF_VERT, FRAG);
    const quad = fullscreenQuad(gl);
    const puffs = new PuffField(gl, quad.buf);
    const noise = uploadNoise(gl);
    let W = 1;
    let H = 1;

    return {
      resize(w, h) {
        W = w;
        H = h;
        puffs.layout(w, h);
      },
      frame(now, pointer) {
        const busy = reduced ? false : puffs.step(pointer);
        const canvas = gl.canvas as HTMLCanvasElement;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(prog.p);
        gl.bindVertexArray(puffs.vao);
        gl.uniform2f(prog.u('uRes'), W, H);
        gl.uniform1f(prog.u('uTime'), reduced ? 0 : now / 1000);
        gl.uniform2f(prog.u('uSun'), SUN[0], SUN[1]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, noise);
        gl.uniform1i(prog.u('uNoise'), 0);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, puffs.count);
        gl.disable(gl.BLEND);
        return busy;
      },
      destroy() {},
    };
  },
};
