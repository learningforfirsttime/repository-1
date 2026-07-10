/* NIMBUS — rain on glass, simulated drop by drop.
   Layers: a dusk city painted twice (sharp-ish and fogged), a fog mask the
   visitor can wipe, condensation dots, and slider droplets that refract the
   city upside-down through little lenses. Canvas 2D only, no assets. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const DPR = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.5);

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const layer = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
};

/* ================= hero window ================= */
const glass = document.getElementById("glass");
const gtx = glass.getContext("2d");
let W = 0, H = 0;
let bgClear, bgFog, fogMask, dots, sceneSeedRand;
let sliders = [];
let running = true, visible = true, raf = 0;
let flashT = -1, nextFlash = 9000, lastNow = performance.now();

function paintCity(ctx, w, h, blur) {
  const rand = mulberry(20260711);
  ctx.save();
  ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
  // dusk sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1a2233");
  sky.addColorStop(0.55, "#2c3a52");
  sky.addColorStop(0.78, "#4d5470");
  sky.addColorStop(0.92, "#7a6a6e");
  sky.addColorStop(1, "#8f7668");
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, w + 40, h + 40);
  // skyline silhouettes
  const base = h * 0.86;
  ctx.fillStyle = "#141a28";
  let x = -10;
  while (x < w + 10) {
    const bw = (30 + rand() * 90) * (w / 1440 + 0.4);
    const bh = h * (0.1 + rand() * 0.3);
    ctx.fillRect(x, base - bh, bw, bh + h * 0.2);
    // windows
    if (rand() > 0.25) {
      ctx.fillStyle = "rgba(233,180,102,0.75)";
      const cols = Math.max(1, (bw / 14) | 0);
      for (let i = 0; i < cols * 3; i++) {
        if (rand() > 0.58) ctx.fillRect(x + 4 + rand() * (bw - 8), base - bh + 6 + rand() * (bh - 12), 2.6, 3.8);
      }
      ctx.fillStyle = "#141a28";
    }
    x += bw + rand() * 24;
  }
  // bokeh lights
  for (let i = 0; i < 30; i++) {
    const r = (5 + rand() * 26) * (w / 1440 + 0.4);
    const bx = rand() * w, by = h * (0.45 + rand() * 0.5);
    const warm = rand() > 0.35;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    const col = warm ? "233,180,102" : "150,190,235";
    g.addColorStop(0, `rgba(${col},${0.28 + rand() * 0.4})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function rebuild() {
  W = Math.floor(glass.clientWidth * DPR);
  H = Math.floor(glass.clientHeight * DPR);
  glass.width = W; glass.height = H;
  bgClear = layer(W, H); bgFog = layer(W, H); fogMask = layer(W, H); dots = layer(W, H);
  const cl = bgClear.getContext("2d");
  paintCity(cl, W, H, 2.5 * DPR);
  cl.fillStyle = "rgba(255,244,224,0.06)"; // clean glass is brighter, warmer
  cl.fillRect(0, 0, W, H);
  const f = bgFog.getContext("2d");
  paintCity(f, W, H, 14 * DPR);
  f.fillStyle = "rgba(38,48,66,0.34)"; // breath on the glass dims the city
  f.fillRect(0, 0, W, H);
  const m = fogMask.getContext("2d");
  m.fillStyle = "#fff"; m.fillRect(0, 0, W, H);
  sceneSeedRand = mulberry(7);
  sliders = [];
  for (let i = 0; i < (coarse ? 16 : 26); i++) sliders.push(newSlider(true));
  // pre-condense
  seedCondensation(reduced ? 2600 : 1400);
  if (reduced) { preRunStills(); }
}

function seedCondensation(n) {
  const d = dots.getContext("2d");
  for (let i = 0; i < n; i++) {
    const r = 0.6 + sceneSeedRand() * 2.2 * DPR;
    const x = sceneSeedRand() * W, y = sceneSeedRand() * H;
    const g = d.createRadialGradient(x, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, "rgba(225,235,248,0.55)");
    g.addColorStop(0.6, "rgba(180,196,216,0.25)");
    g.addColorStop(1, "rgba(180,196,216,0)");
    d.fillStyle = g;
    d.beginPath(); d.arc(x, y, r, 0, Math.PI * 2); d.fill();
  }
}

function newSlider(scatterY) {
  const r = (3.5 + sceneSeedRand() * 5.5) * DPR;
  return {
    x: sceneSeedRand() * W,
    y: scatterY ? sceneSeedRand() * H : -20,
    r,
    v: (0.35 + sceneSeedRand() * 1.1) * DPR * (r / (6 * DPR)),
    wob: sceneSeedRand() * Math.PI * 2,
    hold: sceneSeedRand() * 3000, // pause before it starts to slide
  };
}

function eraseFog(x, y, r) {
  for (const cv of [fogMask, dots]) {
    const c = cv.getContext("2d");
    c.save();
    c.globalCompositeOperation = "destination-out";
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(0,0,0,0.95)");
    g.addColorStop(0.75, "rgba(0,0,0,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}

const maskTmp = document.createElement("canvas");
function compose(now) {
  if (maskTmp.width !== W || maskTmp.height !== H) { maskTmp.width = W; maskTmp.height = H; }
  const t = maskTmp.getContext("2d");
  t.clearRect(0, 0, W, H);
  t.drawImage(fogMask, 0, 0);
  t.globalCompositeOperation = "source-in";
  t.drawImage(bgFog, 0, 0);
  t.globalCompositeOperation = "source-over";

  gtx.drawImage(bgClear, 0, 0);
  // lightning flash brightens the clear city
  if (flashT >= 0) {
    const k = Math.max(0, 1 - flashT / 340);
    if (k > 0) {
      gtx.fillStyle = `rgba(210,224,248,${0.34 * k})`;
      gtx.fillRect(0, 0, W, H);
    }
  }
  gtx.drawImage(maskTmp, 0, 0);
  gtx.drawImage(dots, 0, 0);

  // slider droplets: little lenses holding the city upside-down
  for (const s of sliders) {
    if (s.r > 4.5 * DPR) {
      gtx.save();
      gtx.beginPath(); gtx.arc(s.x, s.y, s.r, 0, Math.PI * 2); gtx.clip();
      const zoom = 3.2;
      gtx.translate(s.x, s.y);
      gtx.scale(1, -1); // the world flips inside a droplet
      gtx.drawImage(
        bgClear,
        s.x - (s.r * zoom) / 2, s.y - (s.r * zoom * 0.75) / 2, s.r * zoom, s.r * zoom * 0.75,
        -s.r, -s.r, s.r * 2, s.r * 2
      );
      gtx.restore();
    }
    // rim + highlight
    gtx.beginPath(); gtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    gtx.strokeStyle = "rgba(214,226,244,0.3)"; gtx.lineWidth = 1 * DPR; gtx.stroke();
    gtx.beginPath(); gtx.arc(s.x - s.r * 0.3, s.y - s.r * 0.35, s.r * 0.28, 0, Math.PI * 2);
    gtx.fillStyle = "rgba(235,242,252,0.5)"; gtx.fill();
  }
}

function tick(now) {
  if (!running) return;
  const dt = Math.min(50, now - lastNow); lastNow = now;

  // fog slowly re-condenses (~half a minute to reclaim a wipe)
  const m = fogMask.getContext("2d");
  m.fillStyle = "rgba(255,255,255,0.0016)";
  m.fillRect(0, 0, W, H);
  if (Math.random() < 0.35) seedCondensation(3);

  // sliders
  for (let i = 0; i < sliders.length; i++) {
    const s = sliders[i];
    if (s.hold > 0) { s.hold -= dt; continue; }
    s.wob += dt * 0.0022;
    s.x += Math.sin(s.wob) * 0.14 * DPR;
    s.y += s.v * (dt / 16.7) * (1.1 + 0.4 * Math.abs(Math.sin(s.wob * 0.6)));
    eraseFog(s.x, s.y, s.r * 0.72);
    if (s.y > H + 30) sliders[i] = newSlider(false);
  }

  // lightning
  if (!reduced) {
    if (flashT >= 0) flashT += dt;
    if (flashT > 400) { flashT = -1; nextFlash = now + 7000 + Math.random() * 9000; }
    else if (flashT < 0 && now > nextFlash) flashT = 0;
  }

  compose(now);
  raf = requestAnimationFrame(tick);
}

function preRunStills() {
  // reduced motion: let a few trails exist, then draw once
  for (const s of sliders) {
    let y = s.y;
    const len = 40 + sceneSeedRand() * 200;
    for (let d = 0; d < len; d += 6) eraseFog(s.x + Math.sin(d * 0.05) * 2, y - d, s.r * 0.9);
  }
  compose(performance.now());
}

/* wipe interaction */
let wiping = false, lastP = null;
function wipeTo(e) {
  const rect = glass.getBoundingClientRect();
  const x = (e.clientX - rect.left) * DPR, y = (e.clientY - rect.top) * DPR;
  if (lastP) {
    const dx = x - lastP.x, dy = y - lastP.y, d = Math.hypot(dx, dy);
    const steps = Math.max(1, (d / (10 * DPR)) | 0);
    for (let i = 0; i <= steps; i++) eraseFog(lastP.x + (dx * i) / steps, lastP.y + (dy * i) / steps, 44 * DPR);
  } else eraseFog(x, y, 44 * DPR);
  lastP = { x, y };
  if (reduced) compose(performance.now());
}
glass.addEventListener("pointerdown", (e) => { wiping = true; lastP = null; wipeTo(e); glass.setPointerCapture(e.pointerId); });
glass.addEventListener("pointermove", (e) => wiping && wipeTo(e));
glass.addEventListener("pointerup", () => { wiping = false; lastP = null; });
glass.addEventListener("pointercancel", () => { wiping = false; lastP = null; });
glass.style.touchAction = "none";
glass.style.cursor = "grab";

rebuild();
addEventListener("resize", () => { rebuild(); if (reduced) compose(performance.now()); });
if (!reduced) raf = requestAnimationFrame(tick);

new IntersectionObserver((es) => {
  visible = es[0].isIntersecting;
  const should = visible && !document.hidden && !reduced;
  if (should && !running) { running = true; lastNow = performance.now(); raf = requestAnimationFrame(tick); }
  else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  if (reduced && visible) compose(performance.now());
}, { rootMargin: "80px" }).observe(glass);
document.addEventListener("visibilitychange", () => {
  const should = visible && !document.hidden && !reduced;
  if (should && !running) { running = true; lastNow = performance.now(); raf = requestAnimationFrame(tick); }
  else if (!should && running) { running = false; cancelAnimationFrame(raf); }
});

/* ================= room vignettes ================= */
function vignette(cv) {
  const kind = cv.dataset.vign;
  const ctx = cv.getContext("2d");
  const rand = mulberry(kind.length * 977 + 5);
  let w, h, t = 0, on = false, id = 0;
  const size = () => {
    w = cv.clientWidth * DPR; h = cv.clientHeight * DPR;
    cv.width = w; cv.height = h;
  };
  size();
  const motes = Array.from({ length: 26 }, () => ({ x: rand(), y: rand(), v: 0.1 + rand() * 0.3, p: rand() * 6.28 }));
  const drops = Array.from({ length: 60 }, () => ({ x: rand(), y: rand(), v: 0.8 + rand() * 0.9 }));
  const bands = Array.from({ length: 4 }, (_, i) => ({ y: 0.45 + i * 0.14, sp: 0.05 + rand() * 0.1, ph: rand() * 6.28 }));

  function draw() {
    t += 0.016;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (kind === "sun") { g.addColorStop(0, "#241d18"); g.addColorStop(1, "#38291c"); }
    else if (kind === "rain") { g.addColorStop(0, "#1a2130"); g.addColorStop(1, "#242f42"); }
    else { g.addColorStop(0, "#20242e"); g.addColorStop(1, "#2c3140"); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    if (kind === "fog") {
      // book spines in the murk
      for (let i = 0; i < 14; i++) {
        const bx = (i / 14) * w + Math.sin(i * 7) * 4;
        ctx.fillStyle = `rgba(${90 + (i % 5) * 14},${78 + (i % 3) * 10},${66},0.5)`;
        ctx.fillRect(bx, h * 0.18, w / 20, h * 0.42);
      }
      for (const b of bands) {
        const yy = b.y * h + Math.sin(t * b.sp * 8 + b.ph) * h * 0.03;
        const fg = ctx.createLinearGradient(0, yy - h * 0.16, 0, yy + h * 0.2);
        fg.addColorStop(0, "rgba(205,214,226,0)");
        fg.addColorStop(0.5, "rgba(205,214,226,0.34)");
        fg.addColorStop(1, "rgba(205,214,226,0.06)");
        ctx.fillStyle = fg;
        ctx.fillRect(0, yy - h * 0.16, w, h * 0.4);
      }
    } else if (kind === "rain") {
      ctx.strokeStyle = "rgba(174,196,224,0.5)";
      ctx.lineWidth = 1 * DPR;
      ctx.beginPath();
      for (const d of drops) {
        d.y += d.v * 0.02; if (d.y > 1) { d.y -= 1.05; d.x = rand(); }
        const dx = d.x * w, dy = d.y * h;
        ctx.moveTo(dx, dy); ctx.lineTo(dx - 1.5 * DPR, dy + 9 * DPR);
      }
      ctx.stroke();
      // floor sheen
      const s = ctx.createLinearGradient(0, h * 0.82, 0, h);
      s.addColorStop(0, "rgba(174,196,224,0)"); s.addColorStop(1, "rgba(174,196,224,0.18)");
      ctx.fillStyle = s; ctx.fillRect(0, h * 0.82, w, h * 0.18);
    } else {
      // the shaft
      ctx.save();
      const grad = ctx.createLinearGradient(w * 0.2, 0, w * 0.62, h);
      grad.addColorStop(0, "rgba(240,196,120,0.5)");
      grad.addColorStop(1, "rgba(240,196,120,0.04)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(w * 0.30, -4); ctx.lineTo(w * 0.52, -4);
      ctx.lineTo(w * 0.86, h + 4); ctx.lineTo(w * 0.42, h + 4);
      ctx.closePath(); ctx.fill();
      ctx.clip();
      for (const m2 of motes) {
        m2.y += m2.v * 0.0012; m2.x += Math.sin(t + m2.p) * 0.0004;
        if (m2.y > 1) m2.y -= 1;
        ctx.fillStyle = "rgba(250,226,180,0.8)";
        ctx.beginPath(); ctx.arc(m2.x * w, m2.y * h, 1.1 * DPR, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      // table edge
      ctx.fillStyle = "rgba(20,14,10,0.7)";
      ctx.fillRect(0, h * 0.86, w, h * 0.14);
      ctx.fillStyle = "rgba(240,196,120,0.2)";
      ctx.fillRect(w * 0.46, h * 0.855, w * 0.34, 2.4 * DPR);
    }
    if (on && !reduced) id = requestAnimationFrame(draw);
  }
  draw(); // first frame (also the reduced-motion still)
  new IntersectionObserver((es) => {
    on = es[0].isIntersecting && !document.hidden;
    if (on && !reduced) { cancelAnimationFrame(id); id = requestAnimationFrame(draw); }
    else cancelAnimationFrame(id);
  }, { rootMargin: "40px" }).observe(cv);
  addEventListener("resize", () => { size(); if (reduced) draw(); });
}
document.querySelectorAll("[data-vign]").forEach(vignette);

/* ================= forecast button ================= */
const NOTES = [
  "“Partly wistful by Thursday, with a 60% chance you write back.” — the Bureau",
  "“One (1) unhurried afternoon, backordered since 2019. We will be in touch.” — the Bureau",
  "“Your forecast: fog lifting slowly, revealing exactly the view you feared and then a better one.” — the Bureau",
];
let noteIdx = 0;
const noteEl = document.getElementById("forecast-note");
document.getElementById("forecast").addEventListener("click", () => {
  noteEl.textContent = NOTES[noteIdx++ % NOTES.length];
  noteEl.classList.remove("show");
  requestAnimationFrame(() => requestAnimationFrame(() => noteEl.classList.add("show")));
});

/* ================= reveals ================= */
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
  { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
