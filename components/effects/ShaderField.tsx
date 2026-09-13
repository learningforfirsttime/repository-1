"use client";

import { useEffect, useRef } from "react";

/**
 * ShaderField — the room's air.
 *
 * A hand-written WebGL fragment shader: ink dispersing through dark water,
 * lit by one candle low and left, with a cool aether counterlight high and
 * right. Pointer movement pushes the warp; a click sends a soft ripple
 * outward. No libraries, no textures, no asset files — every value here is
 * arithmetic.
 *
 * Discipline: capped DPR, paused when offscreen (IntersectionObserver) and
 * when the tab is hidden, one considered still frame under reduced motion,
 * and a CSS gradient underneath so a missing WebGL context is invisible.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform vec3  u_ripple; // xy = origin in clip-ish space, z = age in seconds

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

/* Three octaves, not five. The field is soft and slow; the extra detail was
   invisible at render scale and cost most of the frame. */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = r * p * 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.030;
  vec2  m = (u_mouse - 0.5) * 0.14;

  // a ripple from the last press: a ring that expands and fades
  vec2 rd = p - u_ripple.xy;
  float rl = length(rd);
  float age = u_ripple.z;
  float ring = sin(rl * 22.0 - age * 7.0) * exp(-rl * 3.4) * exp(-age * 1.6);
  vec2 push = (rl > 0.0001 ? rd / rl : vec2(0.0)) * ring * 0.10;

  /* One round of domain warping, but a deep one. Cutting the second round
     for cost flattened the field into haze; pushing the warp amplitude up
     (q * 3.1 rather than 1.95) and the feature size out buys the plume
     structure back for no extra noise evaluations. */
  vec2 q = vec2(
    fbm(p * 1.05 + t + push + m),
    fbm(p * 1.05 - t * 0.7 + vec2(3.1, 1.3) + push)
  );
  float f = fbm(p * 1.45 + q * 3.1);

  vec3 midnight = vec3(0.055, 0.082, 0.149);
  vec3 ink      = vec3(0.094, 0.125, 0.227);
  vec3 slate    = vec3(0.157, 0.196, 0.310);
  vec3 candle   = vec3(0.910, 0.694, 0.361);
  vec3 aether   = vec3(0.486, 0.525, 0.847);

  // the plume: where the ink has not yet reached, the water carries light
  float mist = fbm(p * 2.0 - q * 1.6 + t);

  vec3 col = mix(midnight, ink, smoothstep(0.06, 0.72, f));
  col = mix(col, slate, pow(smoothstep(0.42, 0.98, mist), 1.4) * 0.66);
  // and the pockets the ink has already filled go darker than the ground
  col = mix(col, midnight * 0.7, smoothstep(0.52, 0.04, f) * 0.62);

  // one vein of candlelight drifting through the ink
  float ridge = 1.0 - abs(mist * 2.0 - 1.0);
  ridge = pow(smoothstep(0.62, 1.0, ridge), 2.2);
  col += candle * ridge * 0.6 * (0.26 + 0.74 * smoothstep(0.15, 0.85, f));

  // the candle itself, low and left, breathing
  float lamp = exp(-4.2 * length(p - vec2(-0.58, -0.40)));
  col += candle * lamp * 0.17 * (0.78 + 0.22 * sin(u_time * 0.62));

  // cool counterlight, high and right — the window, or the moon
  float moon = exp(-3.0 * length(p - vec2(0.54, 0.36) - m * 0.55));
  col += aether * moon * 0.085;

  // the ripple catches the light as it passes
  col += candle * max(ring, 0.0) * 0.30;

  float vig = smoothstep(1.32, 0.32, length(p));
  col *= mix(0.66, 1.0, vig);

  // dithered so the gradients never band
  col += hash(gl_FragCoord.xy + fract(u_time) * 61.7) * 0.032 - 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ShaderField({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const opts: WebGLContextAttributes = {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: "low-power",
    };
    const gl = (canvas.getContext("webgl", opts) ||
      canvas.getContext(
        "experimental-webgl",
        opts
      )) as WebGLRenderingContext | null;
    // No WebGL? The CSS gradient below is a complete, composed picture.
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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uRipple = gl.getUniformLocation(prog, "u_ripple");

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /*
     * The field is an out-of-focus volume of water. Rendering it at 55% of
     * layout size and letting the compositor scale it up costs a third of the
     * pixels and looks no different — arguably smoother, since the upscale
     * irons out any banding the dither leaves behind.
     */
    const RENDER_SCALE = 0.55;
    /* It drifts at 0.03 of real time. Thirty frames a second is already more
       than the motion can use, and it halves the shader's share of the CPU. */
    const FRAME_MS = 1000 / 30;

    let raf = 0;
    let lastDraw = 0;
    let onScreen = true;
    let visible = true;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const ripple = { x: 0, y: 0, at: -999 };
    const start = performance.now();

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * RENDER_SCALE));
      const h = Math.max(1, Math.floor(canvas.clientHeight * RENDER_SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = () => {
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      const now = (performance.now() - start) / 1000;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform3f(uRipple, ripple.x, ripple.y, now - ripple.at);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (!onScreen || !visible) return;
      if (now - lastDraw >= FRAME_MS) {
        lastDraw = now;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const resume = () => {
      if (reduced || !onScreen || !visible) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const onPointerMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const min = Math.min(rect.width, rect.height);
      if (min <= 0) return;
      ripple.x = (e.clientX - rect.left - rect.width / 2) / min;
      ripple.y = -(e.clientY - rect.top - rect.height / 2) / min;
      ripple.at = (performance.now() - start) / 1000;
      resume();
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (!visible) cancelAnimationFrame(raf);
      else resume();
    };

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        if (!onScreen) cancelAnimationFrame(raf);
        else resume();
      },
      { rootMargin: "120px" }
    );
    io.observe(canvas);

    window.addEventListener("resize", resize);

    if (reduced) {
      // one composed frame, then stillness
      draw();
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
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
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{
        background:
          "radial-gradient(128% 96% at 62% 4%, #1b2540 0%, #121a30 46%, #0e1526 78%)",
      }}
    />
  );
}
