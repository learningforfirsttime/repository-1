/* ————————————————————————————————————————————————
   SEIJAKU 静寂 — ink, seasons, and one slow circle
———————————————————————————————————————————————— */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE  = matchMedia('(pointer: coarse)').matches;
const DPR     = COARSE ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
const INK     = '38,36,31';

/* seeded PRNG (mulberry32) */
function prng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sizeCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width * DPR));
  const h = Math.max(1, Math.round(r.height * DPR));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

/* ————————————————— THE ENSO ————————————————— */

class Enso {
  constructor(canvas) {
    this.canvas = canvas;
    this.seed = 1911;
    this.raf = 0;
    this.animStart = 0;
    this.elapsed = 0;
    this.duration = 2500;
    this.delay = 420;
    this.drawnTo = 0;
    this.done = false;
    this.geom = null;

    document.addEventListener('visibilitychange', () => {
      if (this.done) return;
      if (document.hidden) {
        cancelAnimationFrame(this.raf);
        this.elapsed = performance.now() - this.animStart;
      } else {
        this.animStart = performance.now() - this.elapsed;
        this.raf = requestAnimationFrame(this.frame.bind(this));
      }
    });
  }

  build() {
    const { ctx, w, h } = sizeCanvas(this.canvas);
    this.ctx = ctx;
    const rnd = prng(this.seed);
    const cx = w * 0.5, cy = h * 0.5;
    const R = Math.min(w, h) * 0.37;
    const W0 = R * 0.155;
    const N = 560;
    const theta0 = -Math.PI * 0.30 + (rnd() - 0.5) * 0.2;   // start upper right
    const sweep = Math.PI * (1.85 + rnd() * 0.05);           // gap stays upper right
    const psi = (rnd() - 0.5) * 0.22;               // slight tilt
    const ph1 = rnd() * 6.28, ph2 = rnd() * 6.28;

    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const th = theta0 + sweep * t;
      const wob = 0.6 * Math.sin(3.1 * th + ph1) + 0.4 * Math.sin(7.3 * th + ph2);
      const r = R * (1 + 0.012 * wob);
      let x = Math.cos(th) * r * 1.035;
      let y = Math.sin(th) * r * 0.965;
      const xr = x * Math.cos(psi) - y * Math.sin(psi);
      const yr = x * Math.sin(psi) + y * Math.cos(psi);

      /* pressure: press in, ride, taper to a lifted point */
      let wdt = W0 * (0.66 + 0.38 * Math.sin(Math.PI * Math.min(t / 0.94, 1)));
      if (t < 0.035) wdt *= 0.7 + 0.42 * (t / 0.035);       // the first press
      if (t > 0.86)  wdt *= Math.max(0.04, Math.pow(1 - (t - 0.86) / 0.14, 1.35));
      wdt *= 1 + 0.05 * Math.sin(17 * th + ph2);

      /* ink drying along the stroke */
      const dens = Math.max(0.22, 1 - 0.72 * Math.pow(t, 1.35)
                   + 0.08 * Math.sin(11 * th + ph1));

      pts.push({ x: cx + xr, y: cy + yr, w: wdt, d: dens });
    }
    /* normals */
    for (let i = 0; i <= N; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y;
      const L = Math.hypot(dx, dy) || 1;
      pts[i].nx = -dy / L; pts[i].ny = dx / L;
    }

    /* bristles */
    const K = 36;
    const bristles = [];
    for (let k = 0; k < K; k++) {
      const u = rnd() * 2 - 1;
      bristles.push({
        o: Math.sign(u) * Math.pow(Math.abs(u), 0.72),
        a: 0.12 + rnd() * 0.24,
        bw: 0.7 + rnd() * 1.5,
        p1: rnd() * 6.28,
        p2: rnd() * 6.28,
        j: (rnd() - 0.5) * 1.6,
        drift: (rnd() - 0.5) * 2.4,               // bristles wander, breaking the braid
      });
    }
    this.geom = { pts, bristles, N, rndSpat: prng(this.seed ^ 0xBEEF) };
  }

  segment(i) {
    const { pts, bristles, N, rndSpat } = this.geom;
    const ctx = this.ctx;
    const p0 = pts[i - 1], p1 = pts[i];
    const t = i / N;

    /* soft wash body */
    ctx.strokeStyle = `rgba(${INK},${(0.06 * p1.d).toFixed(4)})`;
    ctx.lineWidth = p1.w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    /* dark ink core */
    ctx.strokeStyle = `rgba(${INK},${(0.16 * p1.d).toFixed(4)})`;
    ctx.lineWidth = p1.w * 0.45;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    /* bristle tracks with dry-brush dropout */
    const dryCut = -1.55 + 2.1 * (1 - p1.d);
    for (const b of bristles) {
      const s = Math.sin(i * 0.13 + b.p1) + 0.7 * Math.sin(i * 0.041 + b.p2);
      if (s < dryCut) continue;
      const wander = Math.sin(i * 0.012 + b.p1) * b.drift;
      const off0 = b.o * p0.w * 0.5 + b.j + wander;
      const off1 = b.o * p1.w * 0.5 + b.j + wander;
      ctx.strokeStyle = `rgba(${INK},${(b.a * p1.d * (0.6 + 0.4 * Math.sin(i * 0.09 + b.p2))).toFixed(4)})`;
      ctx.lineWidth = b.bw;
      ctx.beginPath();
      ctx.moveTo(p0.x + p0.nx * off0, p0.y + p0.ny * off0);
      ctx.lineTo(p1.x + p1.nx * off1, p1.y + p1.ny * off1);
      ctx.stroke();
    }

    /* spatter while the brush is wet */
    if (p1.d > 0.45 && rndSpat() < 0.05) {
      const n = 1 + Math.floor(rndSpat() * 2);
      for (let s = 0; s < n; s++) {
        const dd = (rndSpat() * 2 - 1) * p1.w * 2.4;
        const along = (rndSpat() - 0.5) * 8;
        const dx = p1.x + p1.nx * dd + (p1.x - p0.x) * along;
        const dy = p1.y + p1.ny * dd + (p1.y - p0.y) * along;
        ctx.fillStyle = `rgba(${INK},${(0.1 + rndSpat() * 0.32).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dx, dy, 0.4 + rndSpat() * 1.5, 0, 6.2832);
        ctx.fill();
      }
    }
  }

  /* smootherstep — liquid in, liquid out */
  ease(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  frame() {
    if (this.done) return;
    const now = performance.now();
    const raw = Math.min(1, Math.max(0, (now - this.animStart - this.delay) / this.duration));
    const p = this.ease(raw);
    const target = Math.round(p * this.geom.N);
    for (let i = this.drawnTo + 1; i <= target; i++) this.segment(i);
    this.drawnTo = Math.max(this.drawnTo, target);
    if (raw >= 1) { this.done = true; return; }
    this.raf = requestAnimationFrame(this.frame.bind(this));
  }

  start() {
    this.build();
    this.drawnTo = 0;
    this.done = false;
    if (REDUCED) {
      for (let i = 1; i <= this.geom.N; i++) this.segment(i);
      this.done = true;
      return;
    }
    this.animStart = performance.now();
    this.elapsed = 0;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.frame.bind(this));
  }

  redraw() {
    this.seed = (Math.random() * 0xFFFF) | 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.start();
  }

  /* on resize: settle instantly, no re-animation */
  resettle() {
    cancelAnimationFrame(this.raf);
    this.build();
    for (let i = 1; i <= this.geom.N; i++) this.segment(i);
    this.done = true;
  }
}

/* ————————————————— INK VEIL (pointer trail) ————————————————— */

class InkVeil {
  constructor(canvas) {
    this.canvas = canvas;
    this.resize();
    this.last = null;
    this.fadeUntil = 0;
    this.raf = 0;
    this.running = false;

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => this.resize(), 180); });

    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      this.trail(e.clientX, e.clientY);
    }, { passive: true });

    addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      this.blot(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(this.raf); this.running = false; }
      else this.wake();
    });
  }

  resize() {
    const { ctx } = sizeCanvas(this.canvas);
    this.ctx = ctx;
    this.w = innerWidth; this.h = innerHeight;
  }

  wake() {
    this.fadeUntil = performance.now() + 6000;
    if (this.running || document.hidden) return;
    this.running = true;
    const step = () => {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillStyle = 'rgba(0,0,0,0.024)';
      this.ctx.fillRect(0, 0, this.w, this.h);
      this.ctx.globalCompositeOperation = 'source-over';
      if (performance.now() < this.fadeUntil) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.running = false;
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  trail(x, y) {
    const ctx = this.ctx;
    if (this.last) {
      const dx = x - this.last.x, dy = y - this.last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) return;
      const speed = Math.min(dist, 60);
      const wdt = 9 - speed * 0.1;                  // fast = dry & thin
      for (let s = 0; s < 3; s++) {
        const off = (s - 1) * 3.2 + (Math.random() - 0.5) * 2;
        const nx = -dy / dist, ny = dx / dist;
        ctx.strokeStyle = `rgba(${INK},${(0.014 + Math.random() * 0.014).toFixed(4)})`;
        ctx.lineWidth = Math.max(1.5, wdt * (0.55 + Math.random() * 0.6));
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.last.x + nx * off, this.last.y + ny * off);
        ctx.lineTo(x + nx * off, y + ny * off);
        ctx.stroke();
      }
      if (Math.random() < 0.05) {
        ctx.fillStyle = `rgba(${INK},0.05)`;
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * 22, y + (Math.random() - 0.5) * 22,
                0.5 + Math.random(), 0, 6.2832);
        ctx.fill();
      }
    }
    this.last = { x, y };
    this.wake();
  }

  blot(x, y) {
    const ctx = this.ctx;
    for (let i = 0; i < 5; i++) {
      const r = 6 + i * 7;
      ctx.fillStyle = `rgba(${INK},${(0.05 - i * 0.009).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4, r, 0, 6.2832);
      ctx.fill();
    }
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * 6.2832, d = 22 + Math.random() * 26;
      ctx.fillStyle = `rgba(${INK},0.06)`;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.6 + Math.random() * 1.4, 0, 6.2832);
      ctx.fill();
    }
    this.wake();
  }
}

/* ————————————————— SEASON MINIATURES ————————————————— */

function maple(ctx, s) {
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? s : s * 0.42;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function petal(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.85, -s * 0.15, 0, s);
  ctx.quadraticCurveTo(-s * 0.85, -s * 0.15, 0, -s);
  ctx.fill();
}

const PAINTERS = {
  spring: {
    init(w, h, rnd) {
      this.petals = [];
      for (let i = 0; i < 14; i++) this.petals.push({
        x: rnd() * w, y: rnd() * h,
        vy: 9 + rnd() * 12, ph: rnd() * 6.28, amp: 7 + rnd() * 14,
        rot: rnd() * 6.28, vr: (rnd() - 0.5) * 1.4,
        s: 3 + rnd() * 2.4,
        c: rnd() < 0.6 ? '193,147,160' : '157,90,107',
        a: 0.4 + rnd() * 0.3,
      });
    },
    tick(ctx, w, h, dt, t) {
      /* the branch, top right */
      ctx.strokeStyle = `rgba(${INK},0.72)`;
      ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w + 4, h * 0.07);
      ctx.quadraticCurveTo(w * 0.62, h * 0.10, w * 0.36, h * 0.20);
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.105);
      ctx.quadraticCurveTo(w * 0.52, h * 0.16, w * 0.50, h * 0.24);
      ctx.stroke();
      const buds = [[0.38, 0.195], [0.47, 0.14], [0.505, 0.235], [0.58, 0.115], [0.68, 0.095], [0.55, 0.185]];
      for (const [bx, by] of buds) {
        ctx.fillStyle = 'rgba(157,90,107,0.55)';
        ctx.beginPath(); ctx.arc(w * bx, h * by, 3.1, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(245,240,228,0.8)';
        ctx.beginPath(); ctx.arc(w * bx - 0.8, h * by - 0.8, 1.1, 0, 6.2832); ctx.fill();
      }
      for (const p of this.petals) {
        p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; }
        const x = p.x + Math.sin(t * 0.6 + p.ph) * p.amp;
        ctx.save();
        ctx.translate(x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        petal(ctx, p.s);
        ctx.restore();
      }
    },
  },

  summer: {
    init(w, h, rnd) {
      this.drops = [];
      for (let i = 0; i < 22; i++) this.drops.push({
        x: rnd() * w, y: rnd() * h,
        v: 140 + rnd() * 70, len: 12 + rnd() * 14,
      });
      this.splashes = [];
    },
    tick(ctx, w, h, dt, t) {
      const gy = h - 14;
      /* stone lantern, silhouette */
      const cx = w * 0.36;
      ctx.fillStyle = `rgba(${INK},0.8)`;
      ctx.fillRect(cx - 14, gy - 8, 28, 8);              // base
      ctx.fillRect(cx - 4, gy - 32, 8, 24);              // post
      ctx.fillRect(cx - 11, gy - 37, 22, 5);             // platform
      ctx.fillRect(cx - 9, gy - 51, 18, 14);             // firebox
      ctx.beginPath();                                    // roof
      ctx.moveTo(cx - 16, gy - 51);
      ctx.lineTo(cx - 5, gy - 60);
      ctx.lineTo(cx + 5, gy - 60);
      ctx.lineTo(cx + 16, gy - 51);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, gy - 62, 2.6, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(245,240,228,0.9)';           // light window
      ctx.fillRect(cx - 3, gy - 48, 6, 8);
      ctx.fillStyle = 'rgba(122,139,92,0.75)';           // moss
      ctx.beginPath(); ctx.arc(cx - 10, gy - 6, 2.2, 0, 6.2832); ctx.fill();
      /* ground */
      ctx.strokeStyle = `rgba(${INK},0.14)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(6, gy); ctx.lineTo(w - 6, gy); ctx.stroke();
      /* rain */
      ctx.strokeStyle = `rgba(${INK},0.16)`;
      for (const d of this.drops) {
        d.y += d.v * dt;
        if (d.y > gy) {
          this.splashes.push({ x: d.x, ttl: 0.5 });
          d.y = -d.len; d.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.len);
        ctx.lineTo(d.x - 1, d.y);
        ctx.stroke();
      }
      /* splashes */
      this.splashes = this.splashes.filter(s => (s.ttl -= dt) > 0);
      for (const s of this.splashes) {
        const k = 1 - s.ttl / 0.5;
        ctx.strokeStyle = `rgba(${INK},${(0.18 * (1 - k)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, gy, 2 + k * 5, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
    },
  },

  autumn: {
    init(w, h, rnd) {
      const cols = ['196,106,59', '168,85,48', '208,128,80', '143,75,51'];
      this.leaves = [];
      for (let i = 0; i < 8; i++) this.leaves.push({
        x: rnd() * w, y: rnd() * h,
        vy: 11 + rnd() * 12, ph: rnd() * 6.28, amp: 13 + rnd() * 16,
        rot: rnd() * 6.28, vr: (rnd() - 0.5) * 1.6,
        s: 6 + rnd() * 4, c: cols[i % 4], a: 0.55 + rnd() * 0.3,
      });
    },
    tick(ctx, w, h, dt, t) {
      /* the one that landed, red side up */
      ctx.save();
      ctx.translate(w * 0.30, h - 18); ctx.rotate(0.5);
      ctx.fillStyle = `rgba(${INK},0.08)`;
      ctx.beginPath(); ctx.ellipse(2, 3, 9, 3.5, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(196,106,59,0.9)';
      maple(ctx, 8.5);
      ctx.restore();
      for (const l of this.leaves) {
        l.y += l.vy * dt; l.rot += l.vr * dt;
        if (l.y > h + 10) { l.y = -10; l.x = Math.random() * w; }
        const x = l.x + Math.sin(t * 0.5 + l.ph) * l.amp;
        ctx.save();
        ctx.translate(x, l.y); ctx.rotate(l.rot);
        ctx.fillStyle = `rgba(${l.c},${l.a})`;
        maple(ctx, l.s);
        ctx.restore();
      }
    },
  },

  winter: {
    init(w, h, rnd) {
      this.flakes = [];
      for (let i = 0; i < 42; i++) this.flakes.push({
        x: rnd() * w, y: rnd() * h,
        v: 6 + rnd() * 10, ph: rnd() * 6.28, amp: 3 + rnd() * 6,
        r: 0.7 + rnd() * 1.5, a: 0.35 + rnd() * 0.5,
      });
    },
    tick(ctx, w, h, dt, t) {
      /* dusk wash so the snow can be seen */
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(58,62,70,0.30)');
      g.addColorStop(1, 'rgba(58,62,70,0.08)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      /* the stone and its cap of snow */
      ctx.fillStyle = `rgba(${INK},0.6)`;
      ctx.beginPath();
      ctx.moveTo(w * 0.55, h - 12);
      ctx.quadraticCurveTo(w * 0.56, h - 40, w * 0.72, h - 42);
      ctx.quadraticCurveTo(w * 0.90, h - 41, w * 0.92, h - 12);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(250,248,240,0.88)';
      ctx.beginPath();
      ctx.moveTo(w * 0.565, h - 34);
      ctx.quadraticCurveTo(w * 0.60, h - 46, w * 0.73, h - 47);
      ctx.quadraticCurveTo(w * 0.87, h - 46, w * 0.90, h - 33);
      ctx.quadraticCurveTo(w * 0.73, h - 40, w * 0.565, h - 34);
      ctx.closePath(); ctx.fill();
      /* ground snow line */
      ctx.fillStyle = 'rgba(250,248,240,0.5)';
      ctx.fillRect(0, h - 12, w, 12);
      /* falling */
      for (const f of this.flakes) {
        f.y += f.v * dt;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        const x = f.x + Math.sin(t * 0.4 + f.ph) * f.amp;
        ctx.fillStyle = `rgba(250,248,240,${f.a})`;
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, 6.2832);
        ctx.fill();
      }
    },
  },
};

class Mini {
  constructor(canvas) {
    this.canvas = canvas;
    this.painter = Object.create(PAINTERS[canvas.dataset.season]);
    this.running = false;
    this.visible = false;
    this.raf = 0;
    this.t = 0;
    this.lastNow = 0;

    this.setup();
    let rt;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { this.setup(); if (REDUCED) this.still(); }, 200);
    });

    if (REDUCED) { this.still(); return; }

    new IntersectionObserver((es) => {
      this.visible = es[0].isIntersecting;
      this.visible ? this.play() : this.pause();
    }, { rootMargin: '60px' }).observe(canvas);

    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.pause() : (this.visible && this.play());
    });
  }

  setup() {
    const { ctx, w, h } = sizeCanvas(this.canvas);
    this.ctx = ctx; this.w = w; this.h = h;
    this.painter.init(w, h, prng(0x5EA + this.canvas.dataset.season.length * 97));
  }

  still() {
    /* advance the scene a little so a frozen frame still composes well */
    for (let i = 0; i < 5; i++) this.frame(0.12, true);
  }

  frame(dt, force) {
    this.t += dt;
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.painter.tick(this.ctx, this.w, this.h, dt, this.t);
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.lastNow = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.lastNow) / 1000);
      this.lastNow = now;
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}

/* ————————————————— OBSERVERS ————————————————— */

function observeReveals() {
  const els = document.querySelectorAll('.reveal');
  if (REDUCED) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
}

function observeSteps() {
  const steps = document.querySelectorAll('.step');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('drawn'); io.unobserve(e.target); }
    }
  }, { threshold: 0.35 });
  steps.forEach(s => io.observe(s));
}

/* ————————————————— RESERVATIONS ————————————————— */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const SEASON_DOT = {
  winter: '#8A8E93', spring: '#9D5A6B', summer: '#7A8B5C', autumn: '#C46A3B',
};
function seasonOf(m) {
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}
const WORDS = ['one', 'two', 'three', 'four', 'five', 'six'];

function buildForm() {
  const row = document.getElementById('tagrow');
  const preselect = (new Date().getMonth() + 2) % 12;   // requests open two months out
  MONTHS.forEach((m, i) => {
    const label = document.createElement('label');
    label.className = 'tag';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'month'; input.value = m;
    if (i === preselect) input.checked = true;
    const span = document.createElement('span');
    span.style.setProperty('--dot', SEASON_DOT[seasonOf(i)]);
    span.textContent = m;
    label.append(input, span);
    row.append(label);
  });

  let party = 2;
  const out = document.getElementById('party-out');
  const set = (v) => { party = Math.min(6, Math.max(1, v)); out.textContent = WORDS[party - 1]; };
  document.getElementById('party-less').addEventListener('click', () => set(party - 1));
  document.getElementById('party-more').addEventListener('click', () => set(party + 1));

  const form = document.getElementById('resform');
  const reply = document.getElementById('reply');
  const line = document.getElementById('reply-line');
  const seal = reply.querySelector('.reply-seal');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const month = form.querySelector('input[name="month"]:checked')?.value ?? 'the coming season';
    const sitting = form.querySelector('input[name="sitting"]:checked')?.value ?? 'midday';
    line.textContent =
      `Received, and set aside for the evening reading — a seat for ${WORDS[party - 1]}, in ${month}, at ${sitting}.`;
    form.classList.add('gone');
    reply.hidden = false;
    seal.classList.add('stamp');
    line.setAttribute('tabindex', '-1');
    line.focus({ preventScroll: false });
  });

  document.getElementById('again').addEventListener('click', () => {
    reply.hidden = true;
    seal.classList.remove('stamp');
    form.classList.remove('gone');
    form.querySelector('input[name="month"]:checked')?.focus();
  });
}

/* ————————————————— BOOT ————————————————— */

function boot() {
  const enso = new Enso(document.getElementById('enso'));
  enso.start();

  const wrap = document.getElementById('enso-wrap');
  wrap.addEventListener('click', () => enso.redraw());
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enso.redraw(); }
  });
  let ert;
  addEventListener('resize', () => { clearTimeout(ert); ert = setTimeout(() => enso.resettle(), 220); });

  if (!REDUCED) new InkVeil(document.getElementById('inkveil'));

  document.querySelectorAll('.mini').forEach(c => new Mini(c));
  observeReveals();
  observeSteps();
  buildForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
