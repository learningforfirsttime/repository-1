/* MURMURA — a gallery of living sculptures.
   Classic boids (separation / alignment / cohesion) with a spatial hash,
   a falcon-cursor in the hero, and an exhibit flock that settles into
   sampled target formations. Canvas 2D, no libraries, no assets. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const DPR = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.6);
const INK = "27,27,30";

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- flock engine ---------------- */
class Flock {
  constructor(canvas, opts) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.o = Object.assign(
      {
        count: 1200, perception: 30, maxSpeed: 2.5, maxForce: 0.08,
        sep: 1.5, ali: 0.9, coh: 0.65, fade: 0.26,
        edge: "steer", pointerMode: "avoid", pointerR: 130, seed: 7,
        background: null,
      },
      opts
    );
    this.targets = null;
    this.pt = { x: -9999, y: -9999, vx: 0, active: false };
    this.running = false;
    this.visible = true;
    this._raf = 0;
    this.resize();
    this.spawn();
    new IntersectionObserver((es) => {
      this.visible = es[0].isIntersecting;
      this.toggle();
    }, { rootMargin: "60px" }).observe(canvas);
    addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => this.toggle());
  }
  resize() {
    const r = this.cv.getBoundingClientRect();
    this.w = Math.max(2, r.width); this.h = Math.max(2, r.height);
    this.cv.width = this.w * DPR; this.cv.height = this.h * DPR;
    this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.paint(true);
  }
  spawn() {
    const rand = mulberry(this.o.seed);
    const n = this.o.count;
    this.px = new Float32Array(n); this.py = new Float32Array(n);
    this.vx = new Float32Array(n); this.vy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.px[i] = rand() * this.w; this.py[i] = rand() * this.h;
      const a = rand() * Math.PI * 2, s = 0.5 + rand() * this.o.maxSpeed;
      this.vx[i] = Math.cos(a) * s; this.vy[i] = Math.sin(a) * s;
    }
  }
  setTargets(pts) {
    if (!pts) { this.targets = null; return; }
    const n = this.o.count, t = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i % pts.length];
      t[i * 2] = p[0]; t[i * 2 + 1] = p[1];
    }
    this.targets = t;
  }
  step() {
    const { perception, maxSpeed, maxForce, sep, ali, coh, edge, pointerMode, pointerR } = this.o;
    const n = this.o.count, cell = perception, cols = Math.max(1, Math.ceil(this.w / cell));
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      const k = ((this.py[i] / cell) | 0) * cols + ((this.px[i] / cell) | 0);
      let b = grid.get(k); if (!b) grid.set(k, (b = [])); b.push(i);
    }
    const p2 = perception * perception, pr2 = pointerR * pointerR;
    for (let i = 0; i < n; i++) {
      const x = this.px[i], y = this.py[i];
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, cnt = 0;
      const gx = (x / cell) | 0, gy = (y / cell) | 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const b = grid.get((gy + oy) * cols + (gx + ox));
        if (!b) continue;
        for (const j of b) {
          if (j === i) continue;
          const dx = this.px[j] - x, dy = this.py[j] - y, d2 = dx * dx + dy * dy;
          if (d2 > p2 || d2 === 0) continue;
          cnt++;
          const inv = 1 / d2;
          sx -= dx * inv; sy -= dy * inv;
          ax += this.vx[j]; ay += this.vy[j];
          cx += this.px[j]; cy += this.py[j];
        }
      }
      let fx = 0, fy = 0;
      const sepK = this.targets ? sep * 0.55 : sep; // let formations pack tighter
      if (cnt) {
        let m = Math.hypot(sx, sy) || 1;
        fx += (sx / m) * sepK * maxForce; fy += (sy / m) * sepK * maxForce;
        m = Math.hypot(ax, ay) || 1;
        fx += ((ax / m) * maxSpeed - this.vx[i]) * 0.06 * ali;
        fy += ((ay / m) * maxSpeed - this.vy[i]) * 0.06 * ali;
        const tx = cx / cnt - x, ty = cy / cnt - y;
        m = Math.hypot(tx, ty) || 1;
        fx += (tx / m) * coh * maxForce; fy += (ty / m) * coh * maxForce;
      }
      // formation seeking
      if (this.targets) {
        const tx = this.targets[i * 2] - x, ty = this.targets[i * 2 + 1] - y;
        const d = Math.hypot(tx, ty) || 1;
        const gain = Math.min(1, d / 52) * 0.46;
        fx += (tx / d) * gain; fy += (ty / d) * gain;
      }
      // pointer
      if (this.pt.active) {
        const dx = x - this.pt.x, dy = y - this.pt.y, d2 = dx * dx + dy * dy;
        if (d2 < pr2 && d2 > 0.01) {
          const d = Math.sqrt(d2), s = (1 - d / pointerR);
          const dir = pointerMode === "avoid" ? 1 : -0.55;
          fx += (dx / d) * s * 0.9 * dir; fy += (dy / d) * s * 0.9 * dir;
        }
      }
      // edges
      const m = 46;
      if (edge === "steer") {
        if (x < m) fx += (m - x) * 0.004; if (x > this.w - m) fx -= (x - (this.w - m)) * 0.004;
        if (y < m) fy += (m - y) * 0.004; if (y > this.h - m) fy -= (y - (this.h - m)) * 0.004;
      }
      this.vx[i] += fx; this.vy[i] += fy;
      const sp = Math.hypot(this.vx[i], this.vy[i]) || 1;
      const lim = this.targets ? maxSpeed * 0.86 : maxSpeed;
      if (sp > lim) { this.vx[i] = (this.vx[i] / sp) * lim; this.vy[i] = (this.vy[i] / sp) * lim; }
      if (sp < 0.6 && !this.targets) { this.vx[i] *= 1.06; this.vy[i] *= 1.06; }
      this.px[i] += this.vx[i]; this.py[i] += this.vy[i];
      if (edge === "wrapx") {
        if (this.px[i] < -8) this.px[i] += this.w + 16;
        if (this.px[i] > this.w + 8) this.px[i] -= this.w + 16;
        if (this.py[i] < m) this.vy[i] += 0.05;
        if (this.py[i] > this.h - m) this.vy[i] -= 0.05;
      }
    }
  }
  paint(full = false) {
    if (!this.px) return; // constructor calls resize() before spawn()
    const c = this.ctx;
    if (full || !this.o.fade) c.clearRect(0, 0, this.w, this.h);
    else { c.fillStyle = `rgba(236,234,227,${this.o.fade})`; c.fillRect(0, 0, this.w, this.h); }
    c.strokeStyle = `rgba(${INK},0.78)`;
    c.lineWidth = 1.15;
    c.lineCap = "round";
    c.beginPath();
    for (let i = 0; i < this.o.count; i++) {
      const vx = this.vx[i], vy = this.vy[i];
      const s = 1.9 / (Math.hypot(vx, vy) || 1);
      c.moveTo(this.px[i], this.py[i]);
      c.lineTo(this.px[i] - vx * s * 2.4, this.py[i] - vy * s * 2.4);
    }
    c.stroke();
  }
  frame = () => {
    if (!this.running) return;
    this.step();
    this.paint();
    this._raf = requestAnimationFrame(this.frame);
  };
  toggle() {
    const should = this.visible && !document.hidden && !reduced;
    if (should && !this.running) { this.running = true; this._raf = requestAnimationFrame(this.frame); }
    else if (!should && this.running) { this.running = false; cancelAnimationFrame(this._raf); }
  }
  settle(steps = 320) {
    for (let s = 0; s < steps; s++) this.step();
    this.paint(true);
  }
}

/* ---------------- hero flock ---------------- */
const heroCv = document.getElementById("flock");
const heroCount = Math.min(2000, Math.max(700, Math.round((innerWidth * innerHeight) / 620)));
const hero = new Flock(heroCv, {
  count: heroCount, seed: 11, edge: "wrapx", pointerMode: "avoid",
  maxSpeed: 2.7, fade: 0.24,
});
const setHeroPointer = (x, y) => {
  const r = heroCv.getBoundingClientRect();
  hero.pt.x = x - r.left; hero.pt.y = y - r.top;
  hero.pt.active = hero.pt.y >= 0 && hero.pt.y <= r.height;
};
addEventListener("pointermove", (e) => setHeroPointer(e.clientX, e.clientY), { passive: true });
addEventListener("pointerdown", (e) => setHeroPointer(e.clientX, e.clientY), { passive: true });

/* ---------------- formations ---------------- */
function sampleShape(draw, w, h, step = 5) {
  const off = document.createElement("canvas");
  off.width = 320; off.height = 220;
  const c = off.getContext("2d");
  c.fillStyle = "#000";
  draw(c, 320, 220);
  const img = c.getImageData(0, 0, 320, 220).data;
  const pts = [];
  for (let y = 0; y < 220; y += step) for (let x = 0; x < 320; x += step) {
    if (img[(y * 320 + x) * 4 + 3] > 120) pts.push([x / 320, y / 220]);
  }
  // map into canvas coords with margins
  const mx = w * 0.14, my = h * 0.12;
  return pts.map(([u, v]) => [mx + u * (w - mx * 2), my + v * (h - my * 2)]);
}

const drawAnnulus = (c, w, h) => {
  c.beginPath();
  c.arc(w / 2, h / 2, 88, 0, Math.PI * 2);
  c.arc(w / 2, h / 2, 52, 0, Math.PI * 2, true);
  c.fill("evenodd");
};
const drawSwallow = (c, w, h) => {
  c.beginPath();
  c.moveTo(24, 66);                                   // left wingtip
  c.quadraticCurveTo(96, 34, 152, 88);                // left wing upper edge
  c.quadraticCurveTo(210, 30, 296, 52);               // right wing upper
  c.quadraticCurveTo(232, 74, 196, 104);              // right wing lower
  c.quadraticCurveTo(232, 132, 252, 186);             // right tail streamer
  c.quadraticCurveTo(206, 142, 178, 128);             // tail inner
  c.quadraticCurveTo(160, 172, 132, 196);             // left tail streamer
  c.quadraticCurveTo(146, 138, 134, 116);             // back to body
  c.quadraticCurveTo(78, 92, 24, 66);                 // left wing lower edge
  c.closePath();
  c.fill();
  c.beginPath(); c.arc(150, 92, 15, 0, Math.PI * 2); c.fill(); // body/head mass
};
const spiralPts = (w, h) => {
  const pts = [];
  for (let i = 0; i < 540; i++) {
    const t = i / 540, a = t * Math.PI * 6.2, r = 12 + t * Math.min(w, h) * 0.4;
    pts.push([w / 2 + Math.cos(a) * r * 1.25, h / 2 + Math.sin(a) * r * 0.92]);
  }
  return pts;
};
const wavePts = (w, h) => {
  const pts = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 300; i++) {
    const u = i / 300;
    const y = h * (0.32 + row * 0.18) + Math.sin(u * Math.PI * 3 + row * 0.9) * h * 0.13;
    pts.push([w * 0.08 + u * w * 0.84, y]);
  }
  return pts;
};

const FORMS = [
  { title: "Murmuration No. 1 (free)", meta: "2,000 AGENTS · SEPARATION, ALIGNMENT, COHESION · CONTINUOUS", pts: () => null },
  { title: "Annulus (after the moon)", meta: "TARGET FIELD · RING SECTION · PATIENCE: LOW", pts: (w, h) => sampleShape(drawAnnulus, w, h) },
  { title: "The Swallow", meta: "TARGET FIELD SAMPLED FROM A DRAWN SILHOUETTE", pts: (w, h) => sampleShape(drawSwallow, w, h, 4) },
  { title: "Meridian Spiral", meta: "PARAMETRIC TARGET FIELD · 540 SEATS, SHARED", pts: (w, h) => spiralPts(w, h) },
  { title: "Standing Wave", meta: "THREE PHASES · 900 SEATS · DO NOT TOUCH (TOUCH)", pts: (w, h) => wavePts(w, h) },
];

const exCv = document.getElementById("exhibit");
const exhibit = new Flock(exCv, {
  count: 1400, seed: 42, edge: "steer", pointerMode: "attract",
  maxSpeed: 2.4, fade: 0.3, sep: 1.2, coh: 0.5,
});
exCv.addEventListener("pointermove", (e) => {
  const r = exCv.getBoundingClientRect();
  exhibit.pt.x = e.clientX - r.left; exhibit.pt.y = e.clientY - r.top; exhibit.pt.active = true;
});
exCv.addEventListener("pointerleave", () => (exhibit.pt.active = false));

let formIdx = 0;
const plTitle = document.getElementById("pl-title");
const plMeta = document.getElementById("pl-meta");
function applyForm(i) {
  formIdx = (i + FORMS.length) % FORMS.length;
  const f = FORMS[formIdx];
  plTitle.textContent = f.title;
  plMeta.textContent = f.meta;
  exhibit.setTargets(f.pts(exhibit.w, exhibit.h));
  if (reduced) exhibit.settle(420);
}
let autoTimer = 0;
function armAuto() {
  if (reduced) return;
  clearInterval(autoTimer);
  autoTimer = setInterval(() => { if (exhibit.running) applyForm(formIdx + 1); }, 17000);
}
const advance = () => { applyForm(formIdx + 1); armAuto(); };
document.getElementById("next-form").addEventListener("click", advance);
exCv.addEventListener("click", advance);
exCv.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); } });
exCv.tabIndex = 0;
armAuto();

/* ---------------- rule diagrams ---------------- */
document.querySelectorAll("[data-demo]").forEach((cv, di) => {
  const kind = cv.dataset.demo;
  const demo = new Flock(cv, {
    count: 26, seed: 5 + di, edge: "steer", pointerMode: "avoid", pointerR: 0,
    perception: 46, maxSpeed: 1.6, fade: 0.34,
    sep: kind === "separation" ? 2.6 : kind === "cohesion" ? 1.5 : 0.8,
    ali: kind === "alignment" ? 2.2 : 0.3,
    coh: kind === "cohesion" ? 1.6 : 0.3,
  });
  if (reduced) demo.settle(240);
});

/* ---------------- reduced-motion stills ---------------- */
if (reduced) { hero.settle(380); applyForm(2); }
else applyForm(0);

/* ---------------- reveals ---------------- */
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
  { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
