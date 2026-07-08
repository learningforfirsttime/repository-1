/* THRESHOLD — a museum of light
   One fixed fragment shader renders every room; scroll cross-fades between
   seven field "stops" (entry, rooms I–IV, visit, colophon). The pointer
   carries a soft lens aperture that bends each field and reveals its
   counter-hue. Raw WebGL1, no libraries. */

(function () {
  "use strict";

  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ---------------------------------------------------------- shaders */

  var VERT = [
    "attribute vec2 a_pos;",
    "void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2  u_res;",
    "uniform float u_time;",
    "uniform float u_idx;",     // continuous stop index 0..6
    "uniform vec2  u_ptr;",     // pointer, uv space (y up)
    "uniform float u_ap;",      // aperture strength 0..1
    "uniform float u_motion;",  // 1 breathing, 0 still

    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }",

    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  f = f * f * (3.0 - 2.0 * f);",
    "  float a = hash(i);",
    "  float b = hash(i + vec2(1.0, 0.0));",
    "  float c = hash(i + vec2(0.0, 1.0));",
    "  float d = hash(i + vec2(1.0, 1.0));",
    "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
    "}",

    "float fbm(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  for(int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }",
    "  return v;",
    "}",

    /* 00 ENTRY — a magenta doorway of air */
    "vec3 room0(vec2 q, float t){",
    "  float br = 1.0 + 0.07 * sin(t * 0.33) * u_motion;",
    "  vec3 c = vec3(0.045, 0.035, 0.085);",
    "  vec2 d1 = (q - vec2(0.0, -0.62)) * vec2(1.0, 0.72);",
    "  c += vec3(0.86, 0.16, 0.50) * exp(-dot(d1, d1) * 2.4 * br);",
    "  c += vec3(1.0, 0.42, 0.24) * exp(-dot(d1, d1) * 9.0 * br) * 0.55;",
    "  vec2 d2 = (q - vec2(0.05, 0.62)) * vec2(0.85, 1.25);",
    "  c += vec3(0.22, 0.09, 0.36) * exp(-dot(d2, d2) * 1.8) * 0.9;",
    "  c += vec3(0.13, 0.05, 0.20) * fbm(q * 1.6 + t * 0.015 * u_motion) * 0.5;",
    "  return c;",
    "}",

    /* 01 MERIDIAN — rising amber / rose horizon */
    "vec3 room1(vec2 q, float t){",
    "  float h = -0.10 + 0.035 * sin(t * 0.21) * u_motion;",
    "  float y = q.y - h;",
    "  vec3 below = mix(vec3(1.0, 0.62, 0.20), vec3(0.30, 0.045, 0.085), clamp(-y * 1.45, 0.0, 1.0));",
    "  vec3 above = mix(vec3(0.99, 0.44, 0.44), vec3(0.235, 0.095, 0.27), clamp(y * 1.35, 0.0, 1.0));",
    "  vec3 c = mix(below, above, smoothstep(-0.045, 0.09, y));",
    "  c += vec3(1.0, 0.78, 0.46) * exp(-y * y * 70.0) * 0.5;",
    "  vec2 s = q - vec2(0.0, h);",
    "  c += vec3(1.0, 0.55, 0.32) * exp(-dot(s, s) * 2.6) * 0.28;",
    "  c += vec3(0.10, 0.03, 0.04) * (fbm(q * 2.2 + vec2(t * 0.02 * u_motion, 0.0)) - 0.5);",
    "  return c;",
    "}",

    /* 02 VESPERS — violet / teal breathing oval aperture */
    "vec3 room2(vec2 q, float t){",
    "  float br = 1.0 + 0.05 * sin(t * 0.3) * u_motion;",
    "  float r = length(q / (vec2(0.44, 0.56) * br));",
    "  float n = fbm(q * 2.0 + t * 0.02 * u_motion);",
    "  vec3 c = mix(vec3(0.075, 0.045, 0.15), vec3(0.16, 0.08, 0.30), n);",
    "  vec3 inside = mix(vec3(0.62, 0.97, 0.92), vec3(0.07, 0.42, 0.50), smoothstep(0.0, 1.0, r));",
    "  c = mix(c, inside, smoothstep(1.05, 0.86, r));",
    "  float rim = exp(-(r - 1.0) * (r - 1.0) * 34.0);",
    "  c += vec3(0.58, 0.28, 0.95) * rim * 0.55;",
    "  return c;",
    "}",

    /* 03 STATIC — near-white, barely-perceptible hue drift */
    "vec3 room3(vec2 q, float t){",
    "  float n = fbm(q * 1.25 + vec2(t * 0.008, -t * 0.006) * u_motion);",
    "  float w = 0.5 + 0.5 * sin(t * 0.05 * u_motion + q.x * 1.4 + q.y * 0.8 + n * 2.2);",
    "  vec3 tintA = vec3(1.015, 0.985, 0.975);", // blush
    "  vec3 tintB = vec3(0.975, 0.99, 1.015);",  // ice
    "  vec3 c = vec3(0.965, 0.958, 0.948) * mix(tintA, tintB, w);",
    "  c += (n - 0.5) * 0.05;",
    "  return c;",
    "}",

    /* 04 UNDERTOW — deep cyan / ultramarine falling gradient */
    "vec3 room4(vec2 q, float t){",
    "  float y = q.y;",
    "  vec3 c = mix(vec3(0.10, 0.72, 0.84), vec3(0.035, 0.09, 0.44), smoothstep(0.62, -0.28, y));",
    "  c = mix(c, vec3(0.008, 0.018, 0.115), smoothstep(-0.28, -0.9, y));",
    "  float s = fbm(vec2(q.x * 2.6, q.y * 1.2 + t * 0.05 * u_motion));",
    "  c += vec3(0.0, 0.22, 0.28) * (s - 0.5) * 0.5 * smoothstep(-0.7, 0.4, y);",
    "  c += vec3(0.42, 0.9, 0.95) * exp(-(0.78 - y) * (0.78 - y) * 5.0) * 0.22;",
    "  return c;",
    "}",

    /* 05 VISIT — ember signage glow at the floor */
    "vec3 room5(vec2 q, float t){",
    "  vec3 c = vec3(0.034, 0.028, 0.04);",
    "  vec2 d = (q - vec2(0.0, -0.9)) * vec2(0.72, 1.5);",
    "  c += vec3(0.88, 0.33, 0.10) * exp(-dot(d, d) * 2.6) * (0.5 + 0.05 * sin(t * 0.25) * u_motion);",
    "  vec2 e = q - vec2(0.62, 0.5);",
    "  c += vec3(0.17, 0.06, 0.18) * exp(-dot(e, e) * 2.2) * 0.5;",
    "  c += vec3(0.05, 0.02, 0.05) * fbm(q * 1.8) * 0.4;",
    "  return c;",
    "}",

    /* 06 COLOPHON — near black, the faintest echo of the entry */
    "vec3 room6(vec2 q, float t){",
    "  vec3 c = vec3(0.027, 0.025, 0.034);",
    "  vec2 d = q - vec2(0.0, -0.35);",
    "  c += vec3(0.5, 0.11, 0.33) * exp(-dot(d, d) * 2.0) * (0.17 + 0.06 * sin(t * 0.4) * u_motion);",
    "  c += vec3(0.06, 0.03, 0.09) * fbm(q * 1.4 + t * 0.01 * u_motion) * 0.6;",
    "  return c;",
    "}",

    "vec3 fieldFor(int id, vec2 q, float t){",
    "  if (id == 0) return room0(q, t);",
    "  if (id == 1) return room1(q, t);",
    "  if (id == 2) return room2(q, t);",
    "  if (id == 3) return room3(q, t);",
    "  if (id == 4) return room4(q, t);",
    "  if (id == 5) return room5(q, t);",
    "  return room6(q, t);",
    "}",

    /* per-room counter-hue the aperture reveals */
    "vec3 altFor(int id){",
    "  if (id == 0) return vec3(0.15, 0.85, 0.80);",  // teal
    "  if (id == 1) return vec3(0.55, 0.28, 0.95);",  // violet
    "  if (id == 2) return vec3(1.0, 0.62, 0.22);",   // amber
    "  if (id == 3) return vec3(1.0, 0.52, 0.60);",   // rose
    "  if (id == 4) return vec3(0.92, 0.25, 0.70);",  // magenta
    "  if (id == 5) return vec3(0.25, 0.80, 0.90);",  // cyan
    "  return vec3(1.0, 0.62, 0.22);",
    "}",

    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    "  float asp = u_res.x / u_res.y;",
    "  vec2 q = (uv - 0.5) * vec2(asp, 1.0);",
    "  vec2 pq = (u_ptr - 0.5) * vec2(asp, 1.0);",

    /* aperture lens: soft falloff around the pointer */
    "  vec2 dp = q - pq;",
    "  float d2 = dot(dp, dp);",
    "  float lens = exp(-d2 * (11.0 - 5.5 * u_ap)) * u_ap;",
    /* bend the gradient — pull the field gently toward the lens center */
    "  vec2 qw = q - dp * lens * 0.55;",

    /* plateau: hold each room pure around its center, compress the cross-fade */
    "  float fi = clamp(u_idx, 0.0, 6.0);",
    "  int i0 = int(floor(fi));",
    "  int i1 = int(min(floor(fi) + 1.0, 6.0));",
    "  float f = smoothstep(0.22, 0.78, fract(fi));",

    /* gamma-correct dissolve (light adds, never grays out) + corridor dim */
    "  vec3 ca = fieldFor(i0, qw, u_time);",
    "  vec3 cb = fieldFor(i1, qw, u_time);",
    "  vec3 c = sqrt(mix(ca * ca, cb * cb, f));",
    "  c *= 1.0 - 0.20 * sin(3.14159 * f);",
    "  vec3 alt = mix(altFor(i0), altFor(i1), f);",

    /* the lens reveals a second hue, lifts the field, and rims softly */
    "  c = mix(c, alt, lens * 0.28);",
    "  c *= 1.0 + lens * 0.16;",
    "  float rr = sqrt(d2);",
    "  float rim = exp(-(rr - 0.34) * (rr - 0.34) * 160.0) * u_ap;",
    "  c += alt * rim * 0.10;",

    /* vignette */
    "  vec2 vq = (uv - 0.5) * vec2(mix(1.0, asp, 0.55), 1.0);",
    "  c *= 1.0 - 0.34 * smoothstep(0.24, 0.9, dot(vq, vq));",

    /* film grain + dither (kills banding on the vast gradients) */
    "  float g = hash(gl_FragCoord.xy + fract(u_time * 0.37) * 61.7);",
    "  c += (g - 0.5) * 0.026;",

    "  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);",
    "}"
  ].join("\n");

  /* ---------------------------------------------------------- gl setup */

  var canvas = document.getElementById("field");
  var gl = canvas.getContext("webgl", {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: "high-performance"
  });

  if (!gl) {
    document.body.classList.add("no-gl");
  }

  var program = null;
  var U = {};

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  if (gl) {
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (vs && fs) {
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) program = null;
    }
    if (program) {
      gl.useProgram(program);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(program, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ["u_res", "u_time", "u_idx", "u_ptr", "u_ap", "u_motion"].forEach(function (n) {
        U[n] = gl.getUniformLocation(program, n);
      });
    } else {
      document.body.classList.add("no-gl");
    }
  }

  /* ---------------------------------------------------------- state */

  var vw = 0, vh = 0;
  var idxTarget = 0, idxShown = 0;
  var ptrX = 0.5, ptrY = 0.42, ptrTX = 0.5, ptrTY = 0.42;
  var apShown = 0, apTarget = 0, apBase = 0.55;
  var ptrSeen = false;
  var t0 = performance.now();
  var lastLabel = -1;

  var sections = [];
  var centers = [];

  var STOPS = [
    ["00", "Entry Hall"],
    ["01", "Meridian"],
    ["02", "Vespers"],
    ["03", "Static"],
    ["04", "Undertow"],
    ["05", "Visit"],
    ["06", "Colophon"]
  ];

  var roomNum = document.getElementById("room-num");
  var roomName = document.getElementById("room-name");

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
    if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) {
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    }
    centers = sections.map(function (s) {
      var r = s.getBoundingClientRect();
      return window.scrollY + r.top + r.height / 2;
    });
  }

  function computeIdx() {
    if (!centers.length) return 0;
    var sc = window.scrollY + vh / 2;
    if (sc <= centers[0]) return 0;
    var last = centers.length - 1;
    if (sc >= centers[last]) return last;
    for (var i = 0; i < last; i++) {
      if (sc < centers[i + 1]) {
        return i + (sc - centers[i]) / (centers[i + 1] - centers[i]);
      }
    }
    return last;
  }

  function updateChrome() {
    var n = Math.max(0, Math.min(6, Math.round(idxTarget)));
    if (n !== lastLabel) {
      lastLabel = n;
      roomNum.textContent = STOPS[n][0];
      roomName.textContent = STOPS[n][1];
      if (motionOK && roomName.animate) {
        roomName.parentElement.animate(
          [{ opacity: 0.15 }, { opacity: 1 }],
          { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }
    }
    /* dark chrome while inside the near-white Room III */
    var light = idxShown > 2.55 && idxShown < 3.45;
    document.body.classList.toggle("light-field", light);
  }

  /* ---------------------------------------------------------- numerals parallax */

  var numerals = [];

  function parallax() {
    if (!motionOK) return;
    var sc = window.scrollY + vh / 2;
    for (var i = 0; i < numerals.length; i++) {
      var d = (centers[numerals[i].stop] - sc) * 0.10;
      numerals[i].el.style.transform = "translateY(calc(-50% + " + d.toFixed(1) + "px))";
    }
  }

  /* ---------------------------------------------------------- hum scope */

  var scope = document.getElementById("hum-scope");
  var sctx = scope ? scope.getContext("2d") : null;

  var humSwell = 0; /* the hum swells while the visitor moves through the building */

  function drawHum(t) {
    if (!sctx) return;
    var w = scope.width, h = scope.height;
    humSwell *= 0.94;
    var amp = 1 + Math.min(humSwell, 2.4);
    sctx.clearRect(0, 0, w, h);
    sctx.strokeStyle = document.body.classList.contains("light-field")
      ? "rgba(23,20,26,0.55)" : "rgba(242,239,233,0.45)";
    sctx.lineWidth = 1;
    sctx.beginPath();
    for (var x = 0; x <= w; x += 2) {
      var p = x / w;
      var env = Math.sin(p * Math.PI);
      var y = h / 2;
      if (motionOK) {
        y += Math.sin(p * 26.0 + t * 3.3) * env * 2.4 * amp
           + Math.sin(p * 61.0 - t * 5.1) * env * 1.0 * amp;
      }
      if (x === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
    }
    sctx.stroke();
  }

  /* ---------------------------------------------------------- render */

  function render(now) {
    var t = (now - t0) / 1000;

    if (motionOK) {
      idxShown += (idxTarget - idxShown) * 0.11;
      ptrX += (ptrTX - ptrX) * 0.08;
      ptrY += (ptrTY - ptrY) * 0.08;
      apShown += (apTarget - apShown) * 0.07;
    } else {
      idxShown = idxTarget;
      ptrX = ptrTX; ptrY = ptrTY;
      apShown = apTarget;
    }

    if (coarse && motionOK) {
      /* on touch the aperture drifts by itself */
      ptrTX = 0.5 + 0.30 * Math.sin(t * 0.13);
      ptrTY = 0.46 + 0.24 * Math.sin(t * 0.094 + 1.7);
      apTarget = apBase;
    }

    if (gl && program) {
      gl.uniform2f(U.u_res, canvas.width, canvas.height);
      gl.uniform1f(U.u_time, motionOK ? t : 40.0);
      gl.uniform1f(U.u_idx, idxShown);
      gl.uniform2f(U.u_ptr, ptrX, 1.0 - ptrY);
      gl.uniform1f(U.u_ap, apShown);
      gl.uniform1f(U.u_motion, motionOK ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    updateChrome();
    parallax();
    drawHum(t);
  }

  /* rAF loop, paused when hidden or (never, but per charter) offscreen */
  var running = false;
  var visible = true;
  var onscreen = true;

  function loop(now) {
    if (!running) return;
    render(now);
    requestAnimationFrame(loop);
  }

  function setRunning() {
    var should = motionOK && visible && onscreen && !!program;
    if (should && !running) {
      running = true;
      requestAnimationFrame(loop);
    } else if (!should) {
      running = false;
    }
  }

  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    setRunning();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onscreen = entries[0].isIntersecting;
      setRunning();
    }).observe(canvas);
  }

  /* reduced motion: position-driven — render one frame per event */
  var rmQueued = false;
  function renderOnce() {
    if (motionOK || rmQueued) return;
    rmQueued = true;
    requestAnimationFrame(function (now) {
      rmQueued = false;
      render(now);
    });
  }

  /* ---------------------------------------------------------- input */

  var lastScrollY = window.scrollY;
  window.addEventListener("scroll", function () {
    idxTarget = computeIdx();
    humSwell += Math.min(Math.abs(window.scrollY - lastScrollY) * 0.004, 0.5);
    lastScrollY = window.scrollY;
    renderOnce();
  }, { passive: true });

  window.addEventListener("resize", function () {
    measure();
    idxTarget = computeIdx();
    renderOnce();
  });

  if (!coarse) {
    window.addEventListener("pointermove", function (e) {
      ptrTX = e.clientX / vw;
      ptrTY = e.clientY / vh;
      if (!ptrSeen) { ptrSeen = true; }
      apTarget = apBase;
      renderOnce();
    }, { passive: true });

    /* discovery: press and hold opens the aperture wide */
    window.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      apTarget = 1.0;
      renderOnce();
    });
    window.addEventListener("pointerup", function () {
      apTarget = ptrSeen ? apBase : 0;
      renderOnce();
    });
    window.addEventListener("pointerleave", function () {
      apTarget = 0;
      renderOnce();
    });
  } else {
    apTarget = apBase;
  }

  /* ---------------------------------------------------------- reveals */

  var reveals = document.querySelectorAll(".reveal");
  if (motionOK && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.3, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------------------------------------------------- buttons */

  document.getElementById("enter").addEventListener("click", function () {
    document.getElementById("room-1").scrollIntoView({
      behavior: motionOK ? "smooth" : "auto"
    });
  });

  var reserve = document.getElementById("reserve");
  reserve.addEventListener("click", function () {
    document.getElementById("reserve-reply").hidden = false;
    reserve.setAttribute("aria-expanded", "true");
  });

  /* ---------------------------------------------------------- dwell clock */

  var clock = document.getElementById("dwell-clock");
  if (motionOK && clock) {
    var entered = Date.now();
    setInterval(function () {
      if (document.hidden) return;
      var s = Math.floor((Date.now() - entered) / 1000);
      var m = Math.floor(s / 60);
      clock.textContent =
        (m < 10 ? "0" + m : m) + ":" + (s % 60 < 10 ? "0" + (s % 60) : s % 60);
    }, 1000);
  } else if (clock) {
    clock.textContent = "unhurried";
  }

  /* ---------------------------------------------------------- boot */

  sections = Array.prototype.slice.call(document.querySelectorAll(".chapter"));
  document.querySelectorAll(".numeral").forEach(function (el) {
    var stop = parseInt(el.closest(".chapter").getAttribute("data-stop"), 10);
    numerals.push({ el: el, stop: stop });
  });

  measure();
  idxTarget = computeIdx();
  idxShown = idxTarget;

  if (motionOK) {
    setRunning();
  } else {
    /* one beautiful still frame */
    requestAnimationFrame(function (now) { render(now); });
  }

  /* re-measure once fonts settle (layout heights shift) */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      measure();
      idxTarget = computeIdx();
      renderOnce();
    });
  }
})();
