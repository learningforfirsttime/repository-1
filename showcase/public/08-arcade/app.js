/* MIDNIGHT COIN — app.js
   One rAF hub drives: synthwave grid, 6 cabinet marquees, COIN DROP physics.
   Everything pauses offscreen (IntersectionObserver) and when the tab hides. */
(() => {
'use strict';

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse  = matchMedia('(pointer: coarse)').matches;
const DPR     = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
const rand    = (a, b) => a + Math.random() * (b - a);
const clamp   = (v, a, b) => Math.max(a, Math.min(b, v));
const pad6    = n => String(Math.min(n, 999999)).padStart(6, '0');

/* ============================== rAF hub ============================== */
const tasks = new Set();
const taskByEl = new Map();
let rafId = null, last = 0;

function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000) || 0.016;
  last = t;
  for (const task of tasks) if (task.visible) task.draw(t / 1000, dt);
  rafId = requestAnimationFrame(frame);
}
function startLoop() { if (rafId === null && !reduced && tasks.size) { last = performance.now(); rafId = requestAnimationFrame(frame); } }
function stopLoop()  { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }
document.addEventListener('visibilitychange', () => { document.hidden ? stopLoop() : startLoop(); });

const visIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    const task = taskByEl.get(e.target);
    if (task) task.visible = e.isIntersecting;
  }
}, { rootMargin: '120px' });

/* draw(t,dt) runs when visible; in reduced-motion we render one still frame */
function addTask(el, draw, staticDraw) {
  if (reduced) {
    const still = staticDraw || (() => draw(0.4, 0.016));
    still();
    document.fonts.ready.then(still);
    return null;
  }
  const task = { draw, visible: true, el };
  tasks.add(task);
  if (el) { taskByEl.set(el, task); visIO.observe(el); }
  startLoop();
  return task;
}

/* helper: size a canvas to its CSS box * DPR, returns ctx in CSS units */
function fitCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return { ctx, w, h };
}

/* ============================== scroll reveals ============================== */
$$('.section-head, .cab, .game-shell, .score-table, .score-note, .terminal, .service-card, .footer')
  .forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 3) * 90}ms`;
  });
if (reduced) {
  $$('.reveal').forEach(el => el.classList.add('in'));
} else {
  const revIO = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); }
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revIO.observe(el));
}

/* ============================== hero grid horizon ============================== */
(() => {
  const canvas = $('#grid-canvas');
  let ctx, W, H, stars = [];

  function resize() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
    stars = [];
    const n = Math.floor(W * H / 9000);
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H * 0.58, r: rand(0.6, 1.7),
                   ph: rand(0, 6.28), sp: rand(0.5, 2.2),
                   c: Math.random() < 0.12 ? '#29E6FF' : (Math.random() < 0.08 ? '#FF3DA6' : '#E7E2FF') });
    }
  }
  resize();
  addEventListener('resize', () => { resize(); if (reduced) draw(0.4); });

  function draw(t) {
    const hy = H * 0.63, cx = W / 2;
    /* sky */
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#0B0420'); sky.addColorStop(0.72, '#1B0A34'); sky.addColorStop(1, '#3A1150');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hy + 1);
    /* floor */
    const fl = ctx.createLinearGradient(0, hy, 0, H);
    fl.addColorStop(0, '#20063A'); fl.addColorStop(1, '#0D0518');
    ctx.fillStyle = fl; ctx.fillRect(0, hy, W, H - hy);

    /* stars */
    for (const s of stars) {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    /* synthwave sun */
    const sunR = Math.min(W, H) * 0.21;
    const sunY = hy - sunR * 0.18;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, sunY, sunR, 0, 6.2832); ctx.clip();
    const sg = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sg.addColorStop(0, '#FFE94A'); sg.addColorStop(0.45, '#FF9A3D');
    sg.addColorStop(0.75, '#FF3DA6'); sg.addColorStop(1, '#C21B77');
    ctx.fillStyle = sg;
    ctx.fillRect(cx - sunR, sunY - sunR, sunR * 2, sunR * 2);
    /* horizontal cuts, drifting upward */
    ctx.fillStyle = '#1B0A34';
    const drift = (t * 6) % 14;
    for (let i = 0; i < 9; i++) {
      const yy = sunY + sunR * 0.05 + i * 13 - drift;
      const th = 1.5 + i * 0.9;
      if (yy > sunY - sunR * 0.1) ctx.fillRect(cx - sunR, yy, sunR * 2, th);
    }
    ctx.restore();
    /* sun glow */
    const glow = ctx.createRadialGradient(cx, sunY, sunR * 0.4, cx, sunY, sunR * 2.6);
    glow.addColorStop(0, 'rgba(255,105,180,0.20)'); glow.addColorStop(1, 'rgba(255,61,166,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    /* horizon line */
    ctx.strokeStyle = 'rgba(41,230,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#29E6FF'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(W, hy); ctx.stroke();
    ctx.shadowBlur = 0;

    /* grid — verticals fanning from vanishing point */
    const passes = [ [4, 0.10], [1.4, 0.75] ];
    for (const [lw, al] of passes) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = `rgba(255,61,166,${al})`;
      ctx.beginPath();
      const n = 22;
      for (let k = -n; k <= n; k++) {
        const xTop = cx + k * (W * 0.011);
        const xBot = cx + k * (W * 0.075);
        ctx.moveTo(xTop, hy); ctx.lineTo(xBot, H + 10);
      }
      /* horizontals rolling toward viewer */
      const rows = 14, f = (t * 0.55) % 1;
      for (let i = 0; i < rows; i++) {
        const u = (i + f) / rows;
        const y = hy + (H - hy) * Math.pow(u, 2.7);
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();
    }
  }

  addTask(canvas, draw);
})();

/* ============================== cabinet marquees ============================== */
/* Each marquee is a 120x60 canvas with its own generative attract loop. */
const marqueeMakers = {

  starfield(ctx, w, h) {
    const stars = [];
    for (let i = 0; i < 42; i++) stars.push({ a: rand(0, 6.28), d: rand(2, 46), s: rand(8, 30) });
    return (t, dt) => {
      ctx.fillStyle = '#05020C'; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (const s of stars) {
        s.d += s.s * dt * (s.d / 18);
        if (s.d > 62) { s.d = rand(1, 5); s.a = rand(0, 6.28); s.s = rand(8, 30); }
        const x = cx + Math.cos(s.a) * s.d, y = cy + Math.sin(s.a) * s.d * 0.6;
        const b = clamp(s.d / 40, 0.25, 1);
        ctx.fillStyle = s.d > 34 ? '#29E6FF' : `rgba(231,226,255,${b})`;
        const sz = s.d > 40 ? 2 : 1;
        ctx.fillRect(x, y, sz, sz);
        if (s.d > 44) { /* streak */
          ctx.fillStyle = 'rgba(41,230,255,0.35)';
          ctx.fillRect(x - Math.cos(s.a) * 3, y - Math.sin(s.a) * 1.8, 2, 1);
        }
      }
    };
  },

  maze(ctx, w, h) {
    const cell = 8, cols = 15, rows = 7;
    /* ring path around inner island */
    const path = [];
    for (let c = 1; c <= 13; c++) path.push([c, 1]);
    for (let r = 2; r <= 5; r++) path.push([13, r]);
    for (let c = 12; c >= 1; c--) path.push([c, 5]);
    for (let r = 4; r >= 2; r--) path.push([1, r]);
    let eaten = new Set(), mi = 0, acc = 0, mouth = 0;
    return (t, dt) => {
      acc += dt;
      if (acc > 0.11) { acc = 0; mi = (mi + 1) % path.length; mouth ^= 1; eaten.add(mi); if (mi === 0) eaten = new Set([0]); }
      ctx.fillStyle = '#05020C'; ctx.fillRect(0, 0, w, h);
      /* walls */
      ctx.strokeStyle = '#3D1B78'; ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = '#22104A';
      ctx.fillRect(2 * cell + 2, 2 * cell + 2, 11 * cell - 4, 3 * cell - 4);
      ctx.strokeStyle = '#5A2AA8'; ctx.lineWidth = 1;
      ctx.strokeRect(2 * cell + 2.5, 2 * cell + 2.5, 11 * cell - 5, 3 * cell - 5);
      /* pellets */
      for (let i = 0; i < path.length; i++) {
        if (eaten.has(i)) continue;
        const [c, r] = path[i];
        ctx.fillStyle = '#E7E2FF';
        ctx.fillRect(c * cell + 3, r * cell + 3, 2, 2);
      }
      /* muncher */
      const [mc, mr] = path[mi];
      ctx.fillStyle = '#FFE94A';
      ctx.fillRect(mc * cell + 1, mr * cell + 1, 6, 6);
      if (mouth) { ctx.fillStyle = '#05020C'; ctx.fillRect(mc * cell + 4, mr * cell + 3, 4, 2); }
      /* ghost, 6 cells behind */
      const gi = (mi - 6 + path.length) % path.length;
      const [gc, gr] = path[gi];
      ctx.fillStyle = '#FF3DA6';
      ctx.fillRect(gc * cell + 1, gr * cell + 1, 6, 5);
      ctx.fillRect(gc * cell + 1, gr * cell + 6, 2, 1);
      ctx.fillRect(gc * cell + 5, gr * cell + 6, 2, 1);
      ctx.fillStyle = '#fff';
      ctx.fillRect(gc * cell + 2, gr * cell + 2, 1, 2); ctx.fillRect(gc * cell + 5, gr * cell + 2, 1, 2);
    };
  },

  paddle(ctx, w, h) {
    const ball = { x: 60, y: 30, vx: 34, vy: 21 };
    let l = 24, r = 24;
    const trail = [];
    return (t, dt) => {
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.y < 6 || ball.y > h - 8) ball.vy *= -1;
      if (ball.x < 10 && Math.abs(ball.y - l - 6) < 9) { ball.vx = Math.abs(ball.vx) * 1.02; ball.vy += rand(-6, 6); }
      if (ball.x > w - 12 && Math.abs(ball.y - r - 6) < 9) { ball.vx = -Math.abs(ball.vx) * 1.02; ball.vy += rand(-6, 6); }
      if (ball.x < 2 || ball.x > w - 4) { ball.x = 60; ball.y = 30; ball.vx = 34 * Math.sign(-ball.vx || 1); ball.vy = rand(-24, 24); }
      const sp = Math.hypot(ball.vx, ball.vy);
      if (sp > 90) { ball.vx *= 90 / sp; ball.vy *= 90 / sp; }
      l += clamp(ball.y - 6 - l, -46 * dt, 46 * dt);
      r += clamp(ball.y - 6 - r, -40 * dt, 40 * dt);
      trail.push([ball.x, ball.y]); if (trail.length > 6) trail.shift();

      ctx.fillStyle = '#05020C'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(156,146,198,0.5)';
      for (let y = 2; y < h; y += 8) ctx.fillRect(w / 2 - 1, y, 1, 4);
      ctx.fillStyle = '#29E6FF'; ctx.fillRect(6, l, 3, 13);
      ctx.fillStyle = '#FF3DA6'; ctx.fillRect(w - 9, r, 3, 13);
      trail.forEach(([x, y], i) => {
        ctx.fillStyle = `rgba(255,233,74,${(i + 1) / trail.length * 0.7})`;
        ctx.fillRect(x, y, 3, 3);
      });
      ctx.fillStyle = '#FFE94A'; ctx.fillRect(ball.x, ball.y, 3, 3);
    };
  },

  invaders(ctx, w, h) {
    const sprite = [
      [0,0,1,0,0,0,1,0,0], [0,0,0,1,0,1,0,0,0], [0,0,1,1,1,1,1,0,0],
      [0,1,1,0,1,0,1,1,0], [1,1,1,1,1,1,1,1,1], [1,0,1,1,1,1,1,0,1],
    ];
    let inv = [], dir = 1, ox = 8, oy = 4, acc = 0, phase = 0, laser = null, boom = null;
    const reset = () => { inv = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) inv.push({ c, r, alive: true }); ox = 8; oy = 4; dir = 1; };
    reset();
    return (t, dt) => {
      acc += dt;
      if (acc > 0.42) {
        acc = 0; phase ^= 1; ox += dir * 4;
        if (ox > 22 || ox < 2) { dir *= -1; oy += 3; }
        if (oy > 16) reset();
        if (!laser && Math.random() < 0.5) {
          const alive = inv.filter(i => i.alive);
          if (alive.length > 6) { const target = alive[Math.floor(Math.random() * alive.length)]; laser = { x: ox + target.c * 20 + 9, y: h, target, life: 0 }; }
          else reset();
        }
      }
      if (laser) {
        laser.y -= 160 * dt;
        const ty = oy + laser.target.r * 13 + 4;
        if (laser.y <= ty + 6) { laser.target.alive = false; boom = { x: laser.x, y: ty + 3, life: 0.28 }; laser = null; }
      }
      if (boom) { boom.life -= dt; if (boom.life <= 0) boom = null; }

      ctx.fillStyle = '#05020C'; ctx.fillRect(0, 0, w, h);
      for (const i of inv) {
        if (!i.alive) continue;
        const x = ox + i.c * 20, y = oy + i.r * 13;
        ctx.fillStyle = i.r === 0 ? '#FF3DA6' : i.r === 1 ? '#29E6FF' : '#B9F6E7';
        for (let ry = 0; ry < 6; ry++) for (let rx = 0; rx < 9; rx++) {
          let on = sprite[ry][rx];
          if (phase && ry === 5) on = sprite[ry][8 - rx];
          if (on) ctx.fillRect(x + rx, y + ry, 1, 1);
        }
      }
      if (laser) { ctx.fillStyle = '#FFE94A'; ctx.fillRect(laser.x, laser.y, 1, 5); }
      if (boom) {
        ctx.fillStyle = `rgba(255,233,74,${boom.life / 0.28})`;
        const s = (0.28 - boom.life) * 30;
        for (let a = 0; a < 8; a++) ctx.fillRect(boom.x + Math.cos(a * 0.785) * s, boom.y + Math.sin(a * 0.785) * s, 2, 2);
      }
      /* bunker player */
      ctx.fillStyle = '#7CFFB2';
      ctx.fillRect(w / 2 - 4 + Math.sin(t * 1.3) * 26, h - 6, 8, 3);
      ctx.fillRect(w / 2 - 1 + Math.sin(t * 1.3) * 26, h - 8, 2, 2);
    };
  },

  racing(ctx, w, h) {
    const cars = [{ z: 0.2, lane: -1 }, { z: 0.65, lane: 1 }];
    return (t, dt) => {
      ctx.fillStyle = '#05020C'; ctx.fillRect(0, 0, w, h);
      const hy = 20, cx = w / 2;
      /* horizon glow */
      const g = ctx.createLinearGradient(0, hy - 8, 0, hy + 4);
      g.addColorStop(0, 'rgba(255,61,166,0)'); g.addColorStop(1, 'rgba(255,61,166,0.5)');
      ctx.fillStyle = g; ctx.fillRect(0, hy - 8, w, 12);
      ctx.fillStyle = '#FF3DA6'; ctx.fillRect(0, hy, w, 1);
      /* road */
      ctx.fillStyle = '#160B2C';
      ctx.beginPath();
      ctx.moveTo(cx - 5, hy); ctx.lineTo(cx + 5, hy);
      ctx.lineTo(cx + 52, h); ctx.lineTo(cx - 52, h);
      ctx.closePath(); ctx.fill();
      /* edges */
      ctx.strokeStyle = '#29E6FF'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 5, hy); ctx.lineTo(cx - 52, h);
      ctx.moveTo(cx + 5, hy); ctx.lineTo(cx + 52, h);
      ctx.stroke();
      /* center dashes + side posts */
      const f = (t * 0.9) % 1;
      for (let i = 0; i < 7; i++) {
        const u = ((i + f) / 7);
        const z = Math.pow(u, 2.4);
        const y = hy + (h - hy) * z;
        ctx.fillStyle = `rgba(255,233,74,${0.25 + z})`;
        ctx.fillRect(cx - 1, y, 2, 2 + z * 5);
        const px = 5 + 47 * z;
        ctx.fillStyle = i % 2 ? '#FF3DA6' : '#29E6FF';
        ctx.fillRect(cx - px - 2, y, 2, 2 + z * 3);
        ctx.fillRect(cx + px, y, 2, 2 + z * 3);
      }
      /* rival cars */
      for (const c of cars) {
        c.z += dt * 0.32;
        if (c.z > 1.15) { c.z = 0.05; c.lane = Math.random() < 0.5 ? -1 : 1; }
        const z = Math.pow(c.z, 2.4);
        const y = hy + (h - hy) * z;
        const cw = 4 + 16 * z, ch2 = 2 + 8 * z;
        const x = cx + c.lane * (2 + 24 * z) - cw / 2;
        ctx.fillStyle = '#2A165A'; ctx.fillRect(x, y - ch2, cw, ch2);
        ctx.fillStyle = '#FF3DA6'; ctx.fillRect(x + 1, y - 2, cw * 0.28, 2); ctx.fillRect(x + cw - 1 - cw * 0.28, y - 2, cw * 0.28, 2);
        ctx.fillStyle = '#29E6FF'; ctx.fillRect(x + cw * 0.2, y - ch2, cw * 0.6, 1);
      }
    };
  },

  blocks(ctx, w, h) {
    const cols = 20, rows = 10, cell = 6;
    const colors = ['#FF3DA6', '#29E6FF', '#FFE94A', '#7CFFB2', '#B98CFF'];
    const shapes = [ [[0,0],[1,0],[0,1],[1,1]], [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[0,2]], [[0,0],[1,0]] ];
    let grid, piece, acc = 0, flash = null;
    const newPiece = () => ({ s: shapes[Math.floor(Math.random() * shapes.length)], x: Math.floor(rand(0, cols - 3)), y: -3, c: colors[Math.floor(Math.random() * colors.length)] });
    const resetAll = () => { grid = Array.from({ length: rows }, () => Array(cols).fill(null)); piece = newPiece(); };
    resetAll();
    const collides = (p, dy) => p.s.some(([sx, sy]) => {
      const gx = p.x + sx, gy = p.y + sy + dy;
      return gy >= rows || (gy >= 0 && grid[gy][gx]);
    });
    return (t, dt) => {
      acc += dt;
      if (flash) { flash.life -= dt; if (flash.life <= 0) { grid.splice(flash.row, 1); grid.unshift(Array(cols).fill(null)); flash = null; } }
      else if (acc > 0.09) {
        acc = 0;
        if (collides(piece, 1)) {
          let overflow = false;
          for (const [sx, sy] of piece.s) {
            const gy = piece.y + sy;
            if (gy < 0) overflow = true;
            else grid[gy][piece.x + sx] = piece.c;
          }
          if (overflow) resetAll();
          else {
            for (let r = 0; r < rows; r++) if (grid[r].every(Boolean)) { flash = { row: r, life: 0.3 }; break; }
            piece = newPiece();
          }
        } else piece.y++;
      }
      ctx.fillStyle = '#05020C'; ctx.fillRect(0, 0, w, h);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const col = grid[r][c];
        if (!col) continue;
        ctx.fillStyle = (flash && flash.row === r && Math.floor(flash.life * 20) % 2) ? '#fff' : col;
        ctx.fillRect(c * cell, r * cell, cell - 1, cell - 1);
      }
      ctx.fillStyle = piece.c;
      for (const [sx, sy] of piece.s) {
        if (piece.y + sy < 0) continue;
        ctx.fillRect((piece.x + sx) * cell, (piece.y + sy) * cell, cell - 1, cell - 1);
      }
    };
  },
};

$$('.cab').forEach(cab => {
  const canvas = $('canvas', cab.querySelector('.cab-marquee'));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const draw = marqueeMakers[cab.dataset.marquee](ctx, 120, 60);
  addTask(canvas, draw, () => { draw(0.4, 0.016); });
});

/* ============================== credits + score state ============================== */
const hudScore = $('#hud-score'), hudCredits = $('#hud-credits'), hudCreditBtn = $('#hud-credit-btn');
const gameScoreEl = $('#game-score'), gameCoinsEl = $('#game-coins'), gameHint = $('#game-hint');
let credits = 3, youScore = 0;

function setCredits(n, bump) {
  credits = n;
  hudCredits.textContent = credits;
  gameCoinsEl.textContent = credits;
  if (bump && !reduced) {
    hudCreditBtn.classList.remove('bump');
    void hudCreditBtn.offsetWidth;
    hudCreditBtn.classList.add('bump');
  }
}
setCredits(3);

/* ============================== high scores ============================== */
const CROWN_SVG = '<svg viewBox="0 0 12 9" xmlns="http://www.w3.org/2000/svg"><path fill="#FFE94A" d="M1 8h10V7H1zM1 6h10L11 2 8.5 4 6 0 3.5 4 1 2z"/><rect x="3" y="5" width="1" height="1" fill="#FF3DA6"/><rect x="8" y="5" width="1" height="1" fill="#29E6FF"/></svg>';
const seedScores = [
  { name: 'GOD', score: 999990 }, { name: 'RAT', score: 874200 },
  { name: 'LUZ', score: 771450 }, { name: 'MOM', score: 668110 },
  { name: 'ZIP', score: 540980 }, { name: 'TTV', score: 448870 },
  { name: 'NOP', score: 312660 },
];
const tbody = $('#score-table tbody');
const rows = [];

for (const s of seedScores) rows.push(makeRow(s.name, s.score, false));
const youRow = makeRow('YOU', 0, true);
rows.push(youRow);

function makeRow(name, score, isYou) {
  const tr = document.createElement('tr');
  if (isYou) tr.className = 'you';
  tr.innerHTML = '<td class="rank"></td><td class="name"><span class="crown" aria-hidden="true" hidden>' + CROWN_SVG + '</span><span class="nm"></span></td><td class="pts">0</td>';
  tbody.appendChild(tr);
  return { tr, name, score, isYou, nmEl: $('.nm', tr), ptsEl: $('.pts', tr), crownEl: $('.crown', tr), typed: false };
}

function renderRanks() {
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => {
    tbody.appendChild(r.tr);
    $('.rank', r.tr).textContent = String(i + 1).padStart(2, '0');
    r.tr.classList.toggle('top', i === 0);
    r.crownEl.hidden = i !== 0;
  });
}
renderRanks();

/* type-in + count-up when scrolled into view */
let scoresRevealed = false;
function revealScores() {
  if (scoresRevealed) return;
  scoresRevealed = true;
  rows.forEach((r, i) => {
    if (reduced) { r.nmEl.textContent = r.name; r.ptsEl.textContent = r.isYou ? String(r.score) : pad6(r.score); r.typed = true; return; }
    const delay = 260 + i * 160;
    /* initials type in */
    [...r.name].forEach((ch, ci) => {
      setTimeout(() => { r.nmEl.textContent += ch; }, delay + ci * 110);
    });
    /* score counts up */
    const t0 = performance.now() + delay;
    const dur = 950;
    const tick = now => {
      const u = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - u, 3);
      r.ptsEl.textContent = r.isYou ? String(Math.round(r.score * e)) : pad6(Math.round(r.score * e));
      if (u < 1) requestAnimationFrame(tick); else r.typed = true;
    };
    requestAnimationFrame(tick);
  });
}
if (reduced) revealScores();
else {
  const scoreIO = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { revealScores(); scoreIO.disconnect(); }
  }, { threshold: 0.3 });
  scoreIO.observe($('#score-table'));
}

function bumpYou(points) {
  youScore += points;
  youRow.score = youScore;
  if (scoresRevealed) {
    youRow.nmEl.textContent = 'YOU';
    youRow.ptsEl.textContent = String(youScore);
  }
  renderRanks();
  hudScore.textContent = pad6(youScore);
  gameScoreEl.textContent = youScore;
  if (!reduced) {
    youRow.tr.classList.add('flash');
    setTimeout(() => youRow.tr.classList.remove('flash'), 700);
  }
  const rank = rows.indexOf(youRow) + 1;
  $('#score-note').innerHTML = rank === 1
    ? '&#9650; ALL HAIL. THE CROWN IS YOURS. (Screenshot it — nobody will believe you.)'
    : `&#9650; “YOU” is live — rank ${String(rank).padStart(2, '0')} and climbing.`;
}

/* ============================== COIN DROP ============================== */
(() => {
  const canvas = $('#game-canvas');
  const W = 520, H = 600;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.aspectRatio = `${W} / ${H}`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const SLOT_VALUES = [100, 250, 50, 1000, 50, 250, 100];
  const SLOTS = SLOT_VALUES.length;
  const slotW = W / SLOTS;
  const slotTop = H - 86;
  const COIN_R = 9, PEG_R = 5;

  /* pegs — staggered rows */
  const pegs = [];
  for (let r = 0; r < 7; r++) {
    const y = 120 + r * 50;
    const off = r % 2 ? 26 : 0;
    for (let x = 36 + off; x <= W - 30; x += 52) pegs.push({ x, y, flash: -9 });
  }
  const slotFlash = Array(SLOTS).fill(-9);
  const coins = [];
  const pops = [];   /* floating score popups */
  const aim = { x: W / 2, osc: !reduced, oscT: rand(0, 6) };
  let interacted = false, now0 = 0;

  function drop() {
    if (credits <= 0) {
      pops.push({ x: W / 2, y: 90, text: 'OUT OF COINS!', c: '#FF3DA6', life: 1.4, vy: -18 });
      $('#insert-coin-game').classList.add('bump');
      setTimeout(() => $('#insert-coin-game').classList.remove('bump'), 400);
      gameHint.textContent = 'The yellow button refills you. The house is generous after midnight.';
      if (reduced) drawStatic();
      return;
    }
    setCredits(credits - 1);
    coins.push({ x: clamp(aim.x, COIN_R + 2, W - COIN_R - 2), y: 40, vx: rand(-14, 14), vy: 0, spin: rand(0, 6.28), trail: [] });
    interacted = true;
    if (reduced) { /* run silent sim ticks via its own mini-loop below */ }
  }

  /* input */
  function pointerX(ev) {
    const r = canvas.getBoundingClientRect();
    return (ev.clientX - r.left) / r.width * W;
  }
  canvas.addEventListener('pointermove', ev => { aim.x = clamp(pointerX(ev), COIN_R + 2, W - COIN_R - 2); aim.osc = false; });
  canvas.addEventListener('pointerdown', ev => { ev.preventDefault(); aim.x = clamp(pointerX(ev), COIN_R + 2, W - COIN_R - 2); aim.osc = false; canvas.focus({ preventScroll: true }); drop(); });
  canvas.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowLeft')  { ev.preventDefault(); aim.osc = false; aim.x = clamp(aim.x - 16, COIN_R + 2, W - COIN_R - 2); if (reduced) drawStatic(); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); aim.osc = false; aim.x = clamp(aim.x + 16, COIN_R + 2, W - COIN_R - 2); if (reduced) drawStatic(); }
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); drop(); }
  });

  function land(coin) {
    const idx = clamp(Math.floor(coin.x / slotW), 0, SLOTS - 1);
    const val = SLOT_VALUES[idx];
    slotFlash[idx] = now0;
    bumpYou(val);
    pops.push({ x: coin.x, y: slotTop - 6, text: '+' + val, c: val >= 1000 ? '#FFE94A' : val >= 250 ? '#29E6FF' : '#E7E2FF', life: 1.3, vy: -34 });
    if (val === 1000) {
      pops.push({ x: W / 2, y: H / 2 - 40, text: 'JACKPOT!!', c: '#FFE94A', life: 1.8, vy: -12 });
      gameHint.textContent = 'THE CENTER SLOT. ON PURPOSE, OBVIOUSLY. We saw nothing.';
    }
  }

  function physics(dt) {
    const g = 780;
    for (let ci = coins.length - 1; ci >= 0; ci--) {
      const c = coins[ci];
      const steps = 2, sdt = dt / steps;
      for (let s = 0; s < steps; s++) {
        c.vy += g * sdt;
        c.x += c.vx * sdt; c.y += c.vy * sdt;
        c.spin += c.vx * sdt * 0.08;
        /* walls */
        if (c.x < COIN_R) { c.x = COIN_R; c.vx = Math.abs(c.vx) * 0.72; }
        if (c.x > W - COIN_R) { c.x = W - COIN_R; c.vx = -Math.abs(c.vx) * 0.72; }
        /* pegs */
        for (const p of pegs) {
          const dx = c.x - p.x, dy = c.y - p.y;
          const rr = COIN_R + PEG_R;
          const d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 0.0001) {
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
            c.x = p.x + nx * rr; c.y = p.y + ny * rr;
            const vn = c.vx * nx + c.vy * ny;
            if (vn < 0) {
              const e = 0.52;
              c.vx -= (1 + e) * vn * nx;
              c.vy -= (1 + e) * vn * ny;
              c.vx += rand(-26, 26);
              p.flash = now0;
            }
          }
        }
        /* slot dividers */
        if (c.y > slotTop - COIN_R) {
          for (let k = 1; k < SLOTS; k++) {
            const dx0 = k * slotW;
            if (Math.abs(c.x - dx0) < COIN_R + 2 && c.y > slotTop) {
              c.vx = (c.x < dx0 ? -1 : 1) * Math.max(Math.abs(c.vx) * 0.6, 26);
              c.x = dx0 + (c.x < dx0 ? -(COIN_R + 2) : COIN_R + 2);
            }
          }
        }
        /* land */
        if (c.y > H - 20 - COIN_R) { land(c); coins.splice(ci, 1); break; }
      }
      if (coins[ci] === c && !reduced) {
        c.trail.push([c.x, c.y]);
        if (c.trail.length > 7) c.trail.shift();
      }
    }
  }

  function render(t) {
    /* board */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0B0424'); bg.addColorStop(0.7, '#08031A'); bg.addColorStop(1, '#0E0526');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* faint back grid */
    ctx.strokeStyle = 'rgba(255,61,166,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 20; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 20; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    /* title strip */
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(156,146,198,0.85)';
    ctx.fillText(credits > 0 ? 'AIM · DROP · PROFIT' : 'INSERT COIN TO CONTINUE', W / 2, 16);

    /* aim rail */
    ctx.strokeStyle = 'rgba(41,230,255,0.25)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(14, 40); ctx.lineTo(W - 14, 40); ctx.stroke();
    ctx.setLineDash([]);

    /* aim coin */
    if (aim.osc) { aim.oscT = t; aim.x = W / 2 + Math.sin(t * 1.15) * (W / 2 - 60); }
    drawCoin(aim.x, 40, 0, credits > 0 ? 1 : 0.35);
    /* drop guide */
    ctx.strokeStyle = 'rgba(255,233,74,0.13)';
    ctx.setLineDash([2, 8]);
    ctx.beginPath(); ctx.moveTo(aim.x, 52); ctx.lineTo(aim.x, slotTop); ctx.stroke();
    ctx.setLineDash([]);

    /* pegs */
    for (const p of pegs) {
      const fl = clamp(1 - (now0 - p.flash) * 2.4, 0, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, PEG_R + fl * 1.5, 0, 6.2832);
      ctx.fillStyle = fl > 0 ? `rgba(${41 + 214 * fl | 0},${230 + 25 * fl | 0},255,1)` : '#1D9BB4';
      ctx.shadowColor = '#29E6FF';
      ctx.shadowBlur = 4 + fl * 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    /* slots */
    for (let k = 0; k < SLOTS; k++) {
      const x = k * slotW;
      const fl = clamp(1 - (now0 - slotFlash[k]) * 1.6, 0, 1);
      const big = SLOT_VALUES[k] === 1000;
      if (fl > 0) { ctx.fillStyle = `rgba(255,233,74,${fl * 0.28})`; ctx.fillRect(x, slotTop, slotW, H - slotTop); }
      else if (big) { ctx.fillStyle = 'rgba(255,233,74,0.05)'; ctx.fillRect(x, slotTop, slotW, H - slotTop); }
      ctx.font = big ? '11px "Press Start 2P", monospace' : '9px "Press Start 2P", monospace';
      ctx.fillStyle = big ? '#FFE94A' : SLOT_VALUES[k] >= 250 ? '#29E6FF' : '#9C92C6';
      ctx.fillText(String(SLOT_VALUES[k]), x + slotW / 2, H - 38);
    }
    /* dividers */
    for (let k = 1; k < SLOTS; k++) {
      const x = k * slotW;
      ctx.fillStyle = '#FF3DA6';
      ctx.shadowColor = '#FF3DA6'; ctx.shadowBlur = 8;
      ctx.fillRect(x - 2, slotTop, 4, H - slotTop - 12);
      ctx.beginPath(); ctx.arc(x, slotTop, 4, 0, 6.2832); ctx.fill();
      ctx.shadowBlur = 0;
    }
    /* floor */
    ctx.fillStyle = '#1A0E30'; ctx.fillRect(0, H - 12, W, 12);
    ctx.fillStyle = 'rgba(255,61,166,0.5)'; ctx.fillRect(0, H - 12, W, 1);

    /* coins */
    for (const c of coins) {
      if (!reduced) {
        c.trail.forEach(([x, y], i) => {
          ctx.globalAlpha = (i + 1) / c.trail.length * 0.28;
          ctx.beginPath(); ctx.arc(x, y, COIN_R * 0.8, 0, 6.2832);
          ctx.fillStyle = '#FFE94A'; ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
      drawCoin(c.x, c.y, c.spin, 1);
    }

    /* popups */
    ctx.font = '13px "Press Start 2P", monospace';
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.life -= 0.016; p.y += p.vy * 0.016;
      if (p.life <= 0) { pops.splice(i, 1); continue; }
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.c;
      ctx.shadowColor = p.c; ctx.shadowBlur = 10;
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }

  function drawCoin(x, y, spin, alpha) {
    const wob = Math.abs(Math.cos(spin));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(0.35 + 0.65 * wob, 1);
    ctx.beginPath(); ctx.arc(0, 0, COIN_R, 0, 6.2832);
    const cg = ctx.createRadialGradient(-3, -3, 1, 0, 0, COIN_R);
    cg.addColorStop(0, '#FFF7C8'); cg.addColorStop(0.6, '#FFE94A'); cg.addColorStop(1, '#C9A800');
    ctx.fillStyle = cg;
    ctx.shadowColor = '#FFE94A'; ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#8A7500'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#B08D00';
    ctx.fillRect(-1.5, -5, 3, 10);
    ctx.restore();
  }

  function drawStatic() { now0 = 0.4; render(0.4); }

  if (reduced) {
    /* still frame + a light 30fps sim only while coins are falling */
    drawStatic();
    document.fonts.ready.then(drawStatic);
    let simTimer = null;
    const origDrop = drop;
    const tickSim = () => {
      now0 += 1 / 30;
      physics(1 / 30);
      render(now0);
      if (!coins.length) { clearInterval(simTimer); simTimer = null; }
    };
    drop = (...a) => { origDrop(...a); if (coins.length && !simTimer) simTimer = setInterval(tickSim, 33); };
  } else {
    addTask(canvas, (t, dt) => { now0 = t; physics(dt); render(t); });
  }

  /* refill buttons */
  $('#insert-coin-game').addEventListener('click', () => {
    setCredits(credits + 5, true);
    gameHint.textContent = 'Five more. The night is long and the pegs are patient.';
    pops.push({ x: W / 2, y: 80, text: 'CREDITS +5', c: '#7CFFB2', life: 1.2, vy: -22 });
    if (reduced) drawStatic();
  });
  $('#insert-coin-hero').addEventListener('click', () => {
    setCredits(credits + 5, true);
    $('#coin-drop').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => canvas.focus({ preventScroll: true }), reduced ? 0 : 700);
  });
  hudCreditBtn.addEventListener('click', () => setCredits(credits + 1, true));
})();

/* ============================== terminal typer ============================== */
(() => {
  const out = $('#terminal-out');
  const text = [
    '> BOOT MIDNIGHT_OS v2.4 ............ OK',
    '> POLLING COIN MECH ................ OK',
    '> LOAD HOUSE_RULES.TXT ............. OK',
    '',
    'RULE 01 — NO CONTINUES AFTER 2AM. COMMIT OR GO HOME.',
    'RULE 02 — WINNER STAYS ON. LOSER BUYS THE SLUSHIES.',
    'RULE 03 — BLOWING ON CARTRIDGES: PERMITTED. ENCOURAGED, EVEN.',
    'RULE 04 — THE CLAW MACHINE IS NOT RIGGED. IT SIMPLY DISLIKES YOU.',
    'RULE 05 — RESPECT THE CROWN. SALUTE THE HIGH SCORE.',
    'RULE 06 — IF THE SUN COMES UP, YOU WERE NEVER HERE.',
    '',
    '> END OF FILE. PLAY FAIR. PLAY LATE.',
  ].join('\n');

  if (reduced) { out.textContent = text; return; }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    let i = 0;
    const step = () => {
      if (i >= text.length) return;
      const ch = text[i++];
      out.textContent += ch;
      let delay = 26 + Math.random() * 22;
      if (ch === '\n') delay = text[i - 2] === '\n' ? 420 : 200;
      if (ch === 'K' && text.slice(i - 2, i) === 'OK') delay = 420;
      setTimeout(step, delay);
    };
    step();
  };
  const tIO = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { start(); tIO.disconnect(); }
  }, { threshold: 0.25 });
  tIO.observe($('#terminal'));
})();

/* ============================== service mode buttons ============================== */
(() => {
  const reply = $('#svc-reply');
  const lines = {
    a: 'NICE TRY. SERVICE MODE NEVER REALLY ENDS.',
    b: 'THE MONITOR APPRECIATES YOUR ENTHUSIASM. STILL NO.',
  };
  $$('.svc-btn').forEach(btn => btn.addEventListener('click', () => {
    reply.textContent = lines[btn.dataset.svc];
    if (!reduced) {
      reply.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'steps(2)' });
    }
  }));
})();

/* ============================== VHS tracking glitch ============================== */
(() => {
  if (reduced) return;
  const band = $('#trackband');
  const pulse = () => {
    band.style.top = rand(8, 82) + '%';
    band.style.height = rand(24, 64) + 'px';
    band.classList.add('on');
    document.body.classList.add('glitch');
    setTimeout(() => {
      band.classList.remove('on');
      document.body.classList.remove('glitch');
    }, 130);
  };
  const schedule = () => {
    setTimeout(() => {
      if (!document.hidden) {
        pulse();
        if (Math.random() < 0.3) setTimeout(pulse, 210);
      }
      schedule();
    }, rand(6000, 10000));
  };
  schedule();
})();

})();
