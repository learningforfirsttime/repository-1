"use client";

import { useEffect, useRef } from "react";

/**
 * InkVeil — the hero sky. A raw-WebGL fragment shader: domain-warped fbm
 * flowing like ink through night water, with a single vein of gold light.
 * No textures, no libraries. Falls back to the CSS gradient beneath it if
 * WebGL is unavailable, and renders a single still frame under
 * prefers-reduced-motion.
 */

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.032;
  vec2 m = (u_mouse - 0.5) * 0.12;

  vec2 q = vec2(
    fbm(p * 1.4 + t),
    fbm(p * 1.4 - t * 0.7 + vec2(3.1, 1.3))
  );
  vec2 w = vec2(
    fbm(p * 1.8 + q * 1.6 + vec2(1.7, 9.2) + m),
    fbm(p * 1.8 + q * 1.6 + vec2(8.3, 2.8) - t * 0.4)
  );
  float f = fbm(p * 1.6 + w * 1.9);

  vec3 night  = vec3(0.043, 0.059, 0.102);
  vec3 indigo = vec3(0.096, 0.129, 0.231);
  vec3 dusk   = vec3(0.262, 0.333, 0.478);
  vec3 gold   = vec3(0.788, 0.631, 0.361);

  vec3 col = mix(night, indigo, smoothstep(0.12, 0.88, f));
  float mist = fbm(p * 2.2 - w + t);
  col = mix(col, dusk, smoothstep(0.55, 0.98, mist) * 0.30);

  // a single vein of gold light, drifting through the ink
  float vein = fbm(p * 2.4 + w * 2.2 - t * 0.5);
  float ridge = 1.0 - abs(vein * 2.0 - 1.0);
  ridge = pow(smoothstep(0.72, 1.0, ridge), 3.0);
  col += gold * ridge * 0.5 * (0.35 + 0.65 * smoothstep(0.2, 0.8, f));

  // faint moonlight, upper right
  float glow = exp(-3.2 * length(p - vec2(0.52, 0.34) - m * 0.6));
  col += vec3(0.13, 0.15, 0.21) * glow;

  // breathing lamplight, lower left
  float lamp = exp(-4.5 * length(p - vec2(-0.62, -0.42)));
  col += gold * lamp * 0.10 * (0.75 + 0.25 * sin(u_time * 0.6));

  float vig = smoothstep(1.3, 0.35, length(p));
  col *= mix(0.7, 1.0, vig);

  // dithered grain so the gradients never band
  float g = hash(gl_FragCoord.xy + fract(u_time) * 61.7) * 0.032 - 0.016;
  col += g;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function InkVeil() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: false, depth: false }) ||
      (canvas.getContext("experimental-webgl", {
        antialias: false,
        alpha: false,
        depth: false,
      }) as WebGLRenderingContext | null);
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dprCap = coarse ? 1 : 1.5;

    let raf = 0;
    let running = true;
    let visible = true;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const frame = () => {
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      if (!running || !visible) return;
      frame();
      raf = requestAnimationFrame(loop);
    };

    const onMouse = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    };

    const onVis = () => {
      const hidden = document.hidden;
      if (hidden) {
        cancelAnimationFrame(raf);
        visible = false;
      } else if (running && !visible) {
        visible = true;
        raf = requestAnimationFrame(loop);
      }
    };

    // stop rendering entirely once the hero is scrolled well past
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries.some((e) => e.isIntersecting);
        if (on && !running) {
          running = true;
          if (!reduced) raf = requestAnimationFrame(loop);
        } else if (!on && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "120px" }
    );
    io.observe(canvas);

    if (reduced) {
      // a single considered frame, then stillness
      frame();
    } else {
      window.addEventListener("pointermove", onMouse, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{
        background:
          "radial-gradient(130% 100% at 50% 0%, #131a2e 0%, #0b0f1a 70%)",
      }}
    />
  );
}
