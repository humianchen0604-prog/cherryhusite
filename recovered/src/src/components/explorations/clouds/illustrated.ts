/**
 * Illustrated: layered cloud banks — rows of round bumps along wavy lines,
 * back to front, with the nearest and farthest banks slightly out of focus.
 *
 * Adapted from klouds by Stefan Stojković (github.com/skyrim/klouds):
 *   MIT License, Copyright (c) 2020 Stefan Stojković.
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
 * Changes here: the sunset palette (lilac-grey banks at the back warming
 * through mauve-pink and peach to white at the front, so the nearest bank
 * melts into the page), a coral rim along each bank's sunlit top, drift slowed
 * to almost nothing, premultiplied output over the CSS sky, and the cursor —
 * banks lean toward it by depth, and moving it drags nearby cloud along.
 */
import { CORAL, SHADOW, SKY, fullscreenQuad, glsl, program, QUAD_VERT, type RendererSpec } from './shared';

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes;       // device px
uniform float uTime;
uniform vec2 uPointer;   // device px, y up
uniform vec2 uPush;      // UV units
uniform float uLean;     // -1…1

#define TAU 6.28318530718
#define LAYERS 0.6

const vec3 BACK = mix(${glsl(SHADOW)}, ${glsl(SKY)}, 0.45);
const vec3 ROSE = vec3(0.871, 0.753, 0.792);
const vec3 PEACH = vec3(0.980, 0.800, 0.745);
const vec3 FRONT = vec3(1.0);
const vec3 CORAL = ${glsl(CORAL)};

float func(float pX) {
  return 0.6 * (0.5 * sin(0.1 * pX) + 0.5 * sin(0.553 * pX) + 0.7 * sin(1.2 * pX));
}

float funcR(float pX) {
  return 0.5 + 0.25 * (1.0 + sin(mod(40.0 * pX, TAU)));
}

float layer(vec2 pQ, float pT) {
  vec2 Qt = 3.5 * pQ;
  pT *= 0.5;
  Qt.x += pT;
  float Xi = floor(Qt.x);
  float Xf = Qt.x - Xi - 0.5;
  vec2 C;
  float Yi;
  float D = 1.0 - step(Qt.y, func(Qt.x));
  Yi = func(Xi + 0.5);
  C = vec2(Xf, Qt.y - Yi);
  D = min(D, length(C) - funcR(Xi + pT / 80.0));
  Yi = func(Xi + 1.0 + 0.5);
  C = vec2(Xf - 1.0, Qt.y - Yi);
  D = min(D, length(C) - funcR(Xi + 1.0 + pT / 80.0));
  Yi = func(Xi - 1.0 + 0.5);
  C = vec2(Xf + 1.0, Qt.y - Yi);
  D = min(D, length(C) - funcR(Xi - 1.0 + pT / 80.0));
  return min(1.0, D);
}

vec3 ramp(float k) {
  if (k < 0.35) return mix(BACK, ROSE, k / 0.35);
  if (k < 0.72) return mix(ROSE, PEACH, (k - 0.35) / 0.37);
  return mix(PEACH, FRONT, (k - 0.72) / 0.28);
}

void main() {
  float s = min(uRes.x, uRes.y);
  vec2 UV = 2.0 * (gl_FragCoord.xy - uRes / 2.0) / s;
  // The cursor drags nearby cloud along with its motion.
  vec2 P = 2.0 * (uPointer - uRes / 2.0) / s;
  UV -= uPush * exp(-dot(UV - P, UV - P) * 1.8);

  float t = uTime * 0.02;
  vec4 acc = vec4(0.0);
  for (float i = 0.0; i < LAYERS; i += 0.1) {
    float k = i / (LAYERS - 0.0999) / 0.8;
    float Lt = t * (0.5 + 2.0 * i) * (1.0 + 0.1 * sin(226.0 * i)) + 1000.0 * i;
    // Nearer banks lean further toward the cursor.
    vec2 Lp = vec2(100.0 * i + uLean * (0.03 + 0.12 * k), 0.8 * k - 0.3);
    float L = layer(UV + Lp, Lt);
    float Blur = 4.0 * (0.5 * abs(2.0 - 5.0 * i)) / (11.0 - 5.0 * i);
    float V = 1.0 - smoothstep(0.0, 0.01 + 0.2 * Blur, L);

    vec3 Lc = ramp(k);
    // Sunset light catches the top edge of the middle banks.
    float rim = smoothstep(-0.45, 0.0, L) * 0.5 * (1.0 - abs(k - 0.45) * 1.6);
    Lc = mix(Lc, CORAL, clamp(rim, 0.0, 1.0));

    acc = vec4(Lc, 1.0) * V + acc * (1.0 - V);
  }
  outColor = acc;
}`;

export const illustrated: RendererSpec = {
  maxDpr: 2,
  idleFps: 20,
  create(gl, reduced) {
    const prog = program(gl, QUAD_VERT, FRAG);
    const quad = fullscreenQuad(gl);
    let H = 1;
    let dpr = 1;
    const push = { x: 0, y: 0 };
    let lean = 0;

    return {
      resize(_w, h, d) {
        H = h;
        dpr = d;
      },
      frame(now, p) {
        const canvas = gl.canvas as HTMLCanvasElement;
        let busy = false;
        if (!reduced) {
          // Pointer velocity (CSS px) → UV units, eased so the drag has a tail.
          const tx = p.inside ? ((p.vx * 2) / H) * 4 : 0;
          const ty = p.inside ? ((-p.vy * 2) / H) * 4 : 0;
          push.x += (Math.max(-0.6, Math.min(0.6, tx)) - push.x) * 0.2;
          push.y += (Math.max(-0.6, Math.min(0.6, ty)) - push.y) * 0.2;
          const targetLean = p.inside ? (p.x / (canvas.width / dpr)) * 2 - 1 : 0;
          lean += (targetLean - lean) * 0.05;
          busy = Math.abs(push.x) + Math.abs(push.y) > 1e-3 || Math.abs(targetLean - lean) > 1e-3;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(prog.p);
        gl.bindVertexArray(quad.vao);
        gl.uniform2f(prog.u('uRes'), canvas.width, canvas.height);
        gl.uniform1f(prog.u('uTime'), reduced ? 0 : now / 1000);
        gl.uniform2f(prog.u('uPointer'), p.x * dpr, canvas.height - p.y * dpr);
        gl.uniform2f(prog.u('uPush'), push.x, push.y);
        gl.uniform1f(prog.u('uLean'), lean);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return busy;
      },
      destroy() {},
    };
  },
};
