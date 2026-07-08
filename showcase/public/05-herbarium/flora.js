/* FOLIUM — flora.js
   Generative botany. Each species is a small grammar: given a seeded PRNG it
   returns a "plan" — an ordered list of parts (tapering stem segments that
   stroke-draw, and organ groups that unfurl from their attachment point).
   Deterministic per seed. No images, no libraries: geometry only. */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const f = mulberry32(seed);
  return {
    next: f,
    range: (a, b) => a + f() * (b - a),
    int: (a, b) => Math.floor(a + f() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
  };
}

const PI = Math.PI;
const rad = (d) => d * PI / 180;
const f1 = (n) => Math.round(n * 10) / 10;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const pt = (x, y, a, d) => [x + Math.cos(rad(a)) * d, y + Math.sin(rad(a)) * d];

/* ---------- plan builder ---------- */

function sprout(rng, w, h) {
  return {
    rng, w, h,
    parts: [],
    stem(d, wid, birth, dur, opt = {}) {
      this.parts.push({ kind: 'stem', d, w: f1(wid), birth, dur, cls: opt.cls || 'stem' });
    },
    organ(o) {
      this.parts.push({ kind: 'organ', scale: 1, dur: 0.1, ...o });
    },
    plan() {
      let maxT = 0;
      for (const p of this.parts) maxT = Math.max(maxT, p.birth + p.dur);
      return { w: this.w, h: this.h, parts: this.parts, maxT };
    },
  };
}

/* A chain of quadratic stem segments with tapering width.
   Returns nodes (position, angle, birth time) for attaching organs. */
function chain(S, o) {
  let x = o.x, y = o.y, a = o.ang;
  const segs = Math.max(1, o.segs | 0);
  const segLen = o.len / segs;
  const grow = o.grow ?? 0.4;
  const birth0 = o.birth ?? 0;
  const nodes = [{ x, y, a, t: 0, birth: birth0 }];
  for (let i = 0; i < segs; i++) {
    const prevA = a;
    a += (o.bend || 0)
      + (o.waveAmp ? Math.sin(i * (o.waveFreq || 1) + (o.wavePhase || 0)) * o.waveAmp : 0)
      + S.rng.range(-1, 1) * (o.drift || 0);
    const [cx, cy] = pt(x, y, prevA, segLen * 0.55);
    const [nx, ny] = pt(cx, cy, a, segLen * 0.5);
    const w = lerp(o.w0, o.w1 ?? o.w0, (i + 0.5) / segs);
    const birth = birth0 + grow * (i / segs);
    const dur = (grow / segs) * 1.7;
    S.stem(`M${f1(x)} ${f1(y)} Q${f1(cx)} ${f1(cy)} ${f1(nx)} ${f1(ny)}`, w, birth, dur, { cls: o.cls });
    x = nx; y = ny;
    nodes.push({ x, y, a, t: (i + 1) / segs, birth: birth + dur * 0.55 });
  }
  return nodes;
}

/* ---------- organ geometry (local coords; attachment at 0,0 along +x) ---------- */

function leafD(len, wid, b = 0) {
  return `M0 0 C ${f1(len * .22)} ${f1(-wid)}, ${f1(len * .7)} ${f1(-wid * .86 + b * .5)}, ${f1(len)} ${f1(b)} `
    + `C ${f1(len * .7)} ${f1(wid * .86 + b * .5)}, ${f1(len * .22)} ${f1(wid)}, 0 0 Z`;
}

function leaf(len, wid, o = {}) {
  const b = o.bend ?? 0;
  let s = `<path class="lf" d="${leafD(len, wid, b)}"/>`;
  s += `<path class="vn" d="M0 0 Q ${f1(len * .52)} ${f1(b * .55)}, ${f1(len * .93)} ${f1(b * .95)}"/>`;
  const n = o.veins ?? 4;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const vx = len * t, vy = b * .55 * t;
    const dy = wid * .62 * Math.sin(PI * Math.min(t * 1.15, 1));
    s += `<path class="vn2" d="M${f1(vx)} ${f1(vy)} q ${f1(len * .09)} ${f1(-dy * .7)}, ${f1(len * .15)} ${f1(-dy)}"/>`;
    s += `<path class="vn2" d="M${f1(vx)} ${f1(vy)} q ${f1(len * .09)} ${f1(dy * .7)}, ${f1(len * .15)} ${f1(dy)}"/>`;
  }
  return s;
}

function scallop(pts, out) {
  let s = '';
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = dy / L * out, ny = -dx / L * out;
    s += ` Q ${f1((x0 + x1) / 2 + nx)} ${f1((y0 + y1) / 2 + ny)}, ${f1(x1)} ${f1(y1)}`;
  }
  return s;
}

/* fern leaflet with scalloped (serrate) edges */
function pinna(len, wid, lobes) {
  const prof = (t) => Math.pow(Math.sin(PI * Math.min(.12 + .82 * t, 1)), .9);
  const top = [[0, 0]], bot = [[len, 0]];
  for (let i = 1; i <= lobes; i++) {
    const t = i / lobes;
    top.push([len * t, -wid * prof(t)]);
  }
  top.push([len, 0]);
  for (let i = lobes - 1; i >= 1; i--) {
    const t = i / lobes;
    bot.push([len * t, wid * .88 * prof(t)]);
  }
  bot.push([0, 0]);
  const out = Math.min(wid * .38, 2.4);
  let d = 'M0 0' + scallop(top, out) + scallop(bot, out) + ' Z';
  return `<path class="lf" d="${d}"/><path class="vn2" d="M1 0 L ${f1(len * .9)} 0"/>`;
}

/* grass / allium strap leaf: rises then arcs; curl controls droop */
function blade(len, wid, curl) {
  const cx = len * .45, cy = -len * .16;
  const tx = len, ty = len * (curl - .4);
  return `<path class="lf lf-solid" d="M0 0 Q ${f1(cx)} ${f1(cy)}, ${f1(tx)} ${f1(ty)} `
    + `Q ${f1(cx + wid * .55)} ${f1(cy + wid)}, ${f1(wid * .5)} ${f1(wid * .8)} Z"/>`
    + `<path class="vn" d="M${f1(wid * .25)} ${f1(wid * .35)} Q ${f1(cx + wid * .28)} ${f1(cy + wid * .5)}, ${f1(tx - wid * .4)} ${f1(ty - wid * .2)}"/>`;
}

/* pinnatifid / dissected leaf: lobes along a midrib.
   slim=true gives the finely-cut umbellifer look */
function lobedLeaf(rng, len, wid, slim = false) {
  let s = `<path class="vn" d="M0 0 L ${f1(len)} 0"/>`;
  const pairs = slim ? rng.int(4, 5) : rng.int(2, 3);
  const wf = slim ? .18 : .4;
  const baseA = slim ? 50 : 46;
  for (let i = 1; i <= pairs; i++) {
    const t = .14 + (i / (pairs + .55)) * .72;
    const lx = len * t;
    const ll = wid * (1.14 - t * .6);
    const a = baseA + rng.range(-6, 8);
    s += `<g transform="translate(${f1(lx)} 0) rotate(${f1(-a)})"><path class="lf" d="${leafD(ll, ll * wf)}"/></g>`;
    s += `<g transform="translate(${f1(lx)} 0) rotate(${f1(a)})"><path class="lf" d="${leafD(ll, ll * wf)}"/></g>`;
  }
  s += `<g transform="translate(${f1(len)} 0)"><path class="lf" d="${leafD(wid * (slim ? .8 : .95), wid * wf * .9)}"/></g>`;
  return s;
}

/* a closed, nodding flower bud: two green sepals hugging a pale oval */
function budHTML() {
  return `<path class="petal" d="${leafD(11, 4.2)}"/>`
    + `<path class="lf lf-solid" d="M0 0 C 2 -3.6, 6.5 -4.6, 9.5 -2.4 C 6.5 -1, 3 -.4, 0 0 Z"/>`
    + `<path class="lf lf-solid" d="M0 0 C 2 3.6, 6.5 4.6, 9.5 2.4 C 6.5 1, 3 .4, 0 0 Z"/>`;
}

function petalHTML() {
  return `<path class="petal" d="M2 0 C 5.5 -3.2, 14 -3.6, 20 0 C 14 3.6, 5.5 3.2, 2 0 Z"/>`
    + `<path class="vn2" d="M4 0 L 17.5 0"/>`;
}

function starD(r, spikes, innerR) {
  let d = '';
  for (let k = 0; k < spikes; k++) {
    const a0 = k * 360 / spikes;
    const [tx, ty] = pt(0, 0, a0, r);
    const [lx, ly] = pt(0, 0, a0 - 180 / spikes, innerR);
    const [rx, ry] = pt(0, 0, a0 + 180 / spikes, innerR);
    d += `${k ? 'L' : 'M'}${f1(lx)} ${f1(ly)} L${f1(tx)} ${f1(ty)} L${f1(rx)} ${f1(ry)} `;
  }
  return d + 'Z';
}

function spikelet(rng) {
  const L = rng.range(10, 13);
  return `<path class="husk" d="M0 0 C ${f1(L * .2)} ${f1(-L * .24)}, ${f1(L * .7)} ${f1(-L * .26)}, ${f1(L)} ${f1(-L * .06)} C ${f1(L * .7)} ${f1(L * .14)}, ${f1(L * .25)} ${f1(L * .16)}, 0 0 Z"/>`
    + `<path class="husk" d="M${f1(L * .16)} ${f1(L * .05)} C ${f1(L * .35)} ${f1(-L * .1)}, ${f1(L * .8)} ${f1(-L * .08)}, ${f1(L * 1.05)} ${f1(L * .06)} C ${f1(L * .8)} ${f1(L * .24)}, ${f1(L * .4)} ${f1(L * .26)}, ${f1(L * .16)} ${f1(L * .05)} Z"/>`
    + `<path class="vn" d="M${f1(L * .95)} ${f1(-L * .06)} q ${f1(L * .5)} ${f1(-L * .18)}, ${f1(L * .72)} ${f1(-L * .5)}"/>`;
}

function bellHTML(rng) {
  const w = rng.range(7, 8.6), L = rng.range(19, 23);
  const d = `M0 0 C ${f1(-w * .8)} 1.2, ${f1(-w)} ${f1(L * .3)}, ${f1(-w)} ${f1(L * .5)} `
    + `C ${f1(-w)} ${f1(L * .72)}, ${f1(-w * 1.05)} ${f1(L * .86)}, ${f1(-w * 1.38)} ${f1(L + 2.4)} `
    + `L ${f1(-w * .5)} ${f1(L * .95)} `
    + `C ${f1(-w * .2)} ${f1(L)}, ${f1(w * .2)} ${f1(L)}, ${f1(w * .5)} ${f1(L * .95)} `
    + `L ${f1(w * 1.38)} ${f1(L + 2.4)} `
    + `C ${f1(w * 1.05)} ${f1(L * .86)}, ${f1(w)} ${f1(L * .72)}, ${f1(w)} ${f1(L * .5)} `
    + `C ${f1(w)} ${f1(L * .3)}, ${f1(w * .8)} 1.2, 0 0 Z`;
  return `<path class="lf lf-solid" d="M0 .5 L -4.6 -3.6 L -1.2 .1 Z"/>`
    + `<path class="lf lf-solid" d="M0 .5 L 4.6 -3.6 L 1.2 .1 Z"/>`
    + `<path class="lf lf-solid" d="M-1 .2 L 0 -4.8 L 1 .2 Z"/>`
    + `<path class="petal bell" d="${d}"/>`
    + `<path class="vn2" d="M${f1(-w * .42)} 4 C ${f1(-w * .5)} 9, ${f1(-w * .56)} 14, ${f1(-w * .66)} ${f1(L * .88)}"/>`
    + `<path class="vn2" d="M${f1(w * .42)} 4 C ${f1(w * .5)} 9, ${f1(w * .56)} 14, ${f1(w * .66)} ${f1(L * .88)}"/>`
    + `<path class="vn" d="M0 ${f1(L * .9)} L 0 ${f1(L + 3)}"/><circle class="dot" cx="0" cy="${f1(L + 4)}" r="1.1"/>`;
}

function heartHTML() {
  return `<path class="vn" d="M0 0 L 6 0"/>`
    + `<path class="lf" d="M6 0 C 3 -7, 10 -12, 17 -10.5 C 22 -9.5, 26 -6, 34 0 C 26 6, 22 9.5, 17 10.5 C 10 12, 3 7, 6 0 Z"/>`
    + `<path class="vn" d="M6 0 L 31 0"/>`
    + `<path class="vn2" d="M7.5 -1 Q 13 -6, 17 -8.6"/><path class="vn2" d="M7.5 1 Q 13 6, 17 8.6"/>`
    + `<path class="vn2" d="M10 -.5 Q 18 -4, 24 -4.6"/><path class="vn2" d="M10 .5 Q 18 4, 24 4.6"/>`;
}

function trumpetHTML() {
  return `<path class="lf lf-solid" d="M0 0 C 5 -1.5, 10 -3.5, 15.5 -6.5 L 15.5 6.5 C 10 3.5, 5 1.5, 0 0 Z"/>`
    + `<ellipse class="petal" cx="16" cy="0" rx="3.6" ry="7.2"/>`
    + `<ellipse class="petal-in" cx="16.6" cy="0" rx="2" ry="4.6"/>`
    + `<path class="vn2" d="M4 -1 C 8 -2, 12 -3.4, 15 -4.6"/><path class="vn2" d="M4 1 C 8 2, 12 3.4, 15 4.6"/>`;
}

function umbelletHTML(rng) {
  let s = '';
  const m = rng.int(5, 7);
  for (let j = 0; j < m; j++) {
    const a = -90 + (j / (m - 1) - .5) * 165 + rng.range(-7, 7);
    const L = rng.range(8, 14);
    const [ex, ey] = pt(0, 0, a, L);
    s += `<path class="vn" d="M0 0 L${f1(ex)} ${f1(ey)}"/>`;
    s += `<circle class="flr" cx="${f1(ex)}" cy="${f1(ey)}" r="${f1(rng.range(1.5, 2.2))}"/>`;
    if (rng.chance(.55)) s += `<circle class="dot" cx="${f1(ex)}" cy="${f1(ey)}" r=".55"/>`;
  }
  return s;
}

/* ---------- shared bits ---------- */

function roots(S, x, y, n, birth, grow) {
  for (let i = 0; i < n; i++) {
    chain(S, {
      x: x + S.rng.range(-4, 4), y: y - 2,
      ang: 90 + S.rng.range(-58, 58),
      len: S.rng.range(16, 40), segs: 3, drift: 9,
      bend: S.rng.range(-4, 4), w0: 1.3, w1: .25,
      birth: birth + S.rng.range(0, .03), grow, cls: 'root',
    });
  }
}

function hatch(S, x, y, birth) {
  const n = S.rng.int(6, 9);
  for (let i = 0; i < n; i++) {
    const hx = x + S.rng.range(-36, 36), hy = y + S.rng.range(1, 7);
    const hl = S.rng.range(6, 16);
    S.stem(`M${f1(hx - hl / 2)} ${f1(hy)} l ${f1(hl)} ${f1(S.rng.range(-1.5, 1.5))}`, .7, birth + S.rng.range(0, .05), .06, { cls: 'hatch' });
  }
}

/* ---------- species grammars ---------- */

function fern(rng) {
  const S = sprout(rng, 480, 560);
  const bx = 240, by = 508;
  roots(S, bx, by, rng.int(4, 6), 0, .1);
  hatch(S, bx, by, .04);
  const angles = [-90, -64, -116, -46, -134];
  const base = rng.range(340, 400);
  for (let i = 0; i < 5; i++) {
    const ang = angles[i] + rng.range(-4, 4);
    const len = base * (1 - Math.abs(ang + 90) / 110 * .58);
    const bend = (ang > -90 ? 1 : -1) * rng.range(1.2, 2.6);
    const birth = .08 + i * .055;
    const nodes = chain(S, { x: bx, y: by, ang, len, segs: 11, drift: 1.1, bend, w0: 3.4, w1: .6, birth, grow: .5 });
    /* nodes + midpoints for denser pinnae */
    const attach = [];
    for (let k = 1; k < nodes.length; k++) {
      const a0 = nodes[k - 1], a1 = nodes[k];
      attach.push({ x: (a0.x + a1.x) / 2, y: (a0.y + a1.y) / 2, a: (a0.a + a1.a) / 2, t: (a0.t + a1.t) / 2, birth: (a0.birth + a1.birth) / 2 });
      attach.push(a1);
    }
    for (const nd of attach) {
      if (nd.t < .07 || nd.t > .96) continue;
      const ramp = clamp01(nd.t / .2);
      const Lp = (len * .17) * ramp * Math.pow(1 - nd.t, .72) + 4;
      for (const s of [-1, 1]) {
        const a2 = nd.a + s * rng.range(56, 68);
        S.organ({
          x: f1(nd.x), y: f1(nd.y), angle: f1(a2), rotFrom: f1(a2 - s * 40),
          birth: nd.birth + .02, dur: .09,
          html: pinna(f1(Lp), f1(Math.max(1.8, Lp * .15)), Math.max(4, Math.round(Lp / 5))),
        });
      }
    }
  }
  return S.plan();
}

function grass(rng) {
  const S = sprout(rng, 500, 560);
  const bx = 250, by = 508;
  roots(S, bx, by, rng.int(4, 6), 0, .1);
  hatch(S, bx, by, .04);
  for (let m = 0; m < rng.int(2, 3); m++) {
    const s = m % 2 ? 1 : -1;
    S.organ({
      x: f1(bx + rng.range(-8, 8)), y: by, angle: f1(-90 + s * rng.range(42, 62)),
      rotFrom: -90, birth: .05, dur: .14,
      html: blade(f1(rng.range(95, 150)), 3.6, rng.range(.5, .85)),
    });
  }
  const culms = rng.int(3, 4);
  for (let i = 0; i < culms; i++) {
    const off = (i - (culms - 1) / 2) * 16 + rng.range(-4, 4);
    const ang = -90 + off * .8 + rng.range(-3, 3);
    const len = rng.range(300, 372) - Math.abs(off) * 2.5;
    const birth = .06 + i * .05;
    const nodes = chain(S, { x: bx + off, y: by, ang, len, segs: 8, drift: 1, bend: off > 0 ? .55 : -.55, w0: 2.3, w1: .9, birth, grow: .42 });
    for (let j = 0; j < rng.int(1, 2); j++) {
      const nd = nodes[rng.int(1, 3)];
      const sd = j % 2 ? 1 : -1;
      S.organ({
        x: f1(nd.x), y: f1(nd.y), angle: f1(-90 + sd * rng.range(30, 52)), rotFrom: f1(-90 + sd * 6),
        birth: nd.birth + .02, dur: .12,
        html: blade(f1(rng.range(115, 165)), 3.8, rng.range(.55, .8)),
      });
    }
    for (const nd of nodes.slice(-4, -1)) {
      for (let k = 0; k < rng.int(1, 2); k++) {
        const sd = rng.chance(.5) ? 1 : -1;
        const br = chain(S, { x: nd.x, y: nd.y, ang: nd.a + sd * rng.range(18, 50), len: rng.range(26, 50), segs: 3, drift: 3, bend: 9, w0: .8, w1: .45, birth: nd.birth + .03, grow: .1, cls: 'stem thin' });
        const end = br[br.length - 1];
        S.organ({ x: f1(end.x), y: f1(end.y), angle: f1(75 + rng.range(-18, 18)), rotFrom: 20, birth: end.birth + .02, dur: .1, html: spikelet(rng) });
        if (rng.chance(.6)) {
          const mid = br[1];
          S.organ({ x: f1(mid.x), y: f1(mid.y), angle: f1(80 + rng.range(-15, 15)), rotFrom: 30, scale: .8, birth: mid.birth + .02, dur: .1, html: spikelet(rng) });
        }
      }
    }
    const tip = nodes[nodes.length - 1];
    S.organ({ x: f1(tip.x), y: f1(tip.y), angle: f1(60 + rng.range(-14, 20)), rotFrom: 0, birth: tip.birth + .02, dur: .1, html: spikelet(rng) });
  }
  return S.plan();
}

function daisy(rng) {
  const S = sprout(rng, 420, 560);
  const bx = 210, by = 508;
  roots(S, bx, by, rng.int(4, 6), 0, .1);
  hatch(S, bx, by, .04);
  const nodes = chain(S, { x: bx, y: by, ang: -90 + rng.range(-4, 4), len: rng.range(300, 335), segs: 7, drift: 2.2, bend: rng.range(-.6, .6), w0: 3, w1: 1.2, birth: .08, grow: .46 });
  const tips = [{ nd: nodes[nodes.length - 1], kind: 'flower' }];
  /* two branches */
  const bIdx = [rng.int(2, 3), rng.int(4, 5)];
  bIdx.forEach((idx, j) => {
    const nd = nodes[idx];
    const sd = j % 2 ? 1 : -1;
    const br = chain(S, { x: nd.x, y: nd.y, ang: nd.a + sd * rng.range(24, 36), len: rng.range(105, 155) * (1 - nd.t * .35), segs: 4, drift: 2, bend: -sd * 3, w0: 2, w1: .95, birth: nd.birth + .04, grow: .28 });
    tips.push({ nd: br[br.length - 1], kind: j === 0 && rng.chance(.6) ? 'bud' : 'flower' });
    /* leaf at branch base */
    S.organ({
      x: f1(nd.x), y: f1(nd.y), angle: f1(nd.a - sd * rng.range(40, 55)), rotFrom: f1(nd.a),
      birth: nd.birth + .03, dur: .12,
      html: lobedLeaf(rng, f1(rng.range(70, 95)), f1(rng.range(22, 28))),
    });
  });
  /* lower leaves */
  for (const [idx, sd] of [[1, -1], [2, 1]]) {
    const nd = nodes[idx];
    S.organ({
      x: f1(nd.x), y: f1(nd.y), angle: f1(nd.a + sd * rng.range(42, 60)), rotFrom: f1(nd.a),
      birth: nd.birth + .03, dur: .12,
      html: lobedLeaf(rng, f1(rng.range(85, 115)), f1(rng.range(26, 33))),
    });
  }
  /* flowers */
  for (const tip of tips) {
    const { nd, kind } = tip;
    const fb = nd.birth + .04;
    if (kind === 'bud') {
      S.organ({ x: f1(nd.x), y: f1(nd.y), angle: f1(nd.a + rng.range(15, 35)), rotFrom: f1(nd.a - 30), birth: fb, dur: .1, html: budHTML() });
      continue;
    }
    S.organ({ x: f1(nd.x), y: f1(nd.y), angle: 0, rotFrom: 0, scale: 1.25, birth: fb, dur: .07, html: `<path class="lf lf-solid" d="${starD(7.5, 7, 3)}"/>` });
    const n = rng.int(12, 15);
    const a0 = rng.range(0, 360);
    for (let i = 0; i < n; i++) {
      const a = a0 + i * 360 / n + rng.range(-4, 4);
      S.organ({
        x: f1(nd.x), y: f1(nd.y), angle: f1(a), rotFrom: f1(a - 26),
        scale: rng.range(1.15, 1.4), birth: fb + .025 + i * .006, dur: .07,
        html: petalHTML(),
      });
    }
    let disc = `<circle class="disc" r="7.4"/>`;
    for (let k = 0; k < 8; k++) {
      const [dx2, dy2] = pt(0, 0, rng.range(0, 360), rng.range(0, 4.8));
      disc += `<circle class="dot" cx="${f1(dx2)}" cy="${f1(dy2)}" r=".7"/>`;
    }
    S.organ({ x: f1(nd.x), y: f1(nd.y), angle: 0, rotFrom: 0, birth: fb + .1, dur: .07, html: disc });
  }
  return S.plan();
}

function umbel(rng) {
  const S = sprout(rng, 420, 600);
  const bx = 210, by = 548;
  roots(S, bx, by, rng.int(4, 6), 0, .1);
  hatch(S, bx, by, .04);
  const nodes = chain(S, { x: bx, y: by, ang: -90 + rng.range(-3, 3), len: rng.range(390, 425), segs: 8, drift: 1.4, bend: rng.range(-.5, .5), w0: 3.1, w1: 1.3, birth: .08, grow: .44 });
  /* finely dissected leaves low on the stem */
  for (const [idx, sd] of [[1, -1], [2, 1], [3, -1]]) {
    const nd = nodes[idx];
    S.organ({
      x: f1(nd.x), y: f1(nd.y), angle: f1(nd.a + sd * rng.range(38, 52)), rotFrom: f1(nd.a),
      birth: nd.birth + .03, dur: .12,
      html: lobedLeaf(rng, f1(rng.range(95, 130) * (1 - nd.t * .55)), f1(rng.range(26, 34)), true),
    });
  }
  /* one small sheathing leaf higher up */
  const upper = nodes[5];
  S.organ({
    x: f1(upper.x), y: f1(upper.y), angle: f1(upper.a + rng.range(30, 44) * (rng.chance(.5) ? 1 : -1)), rotFrom: f1(upper.a),
    birth: upper.birth + .03, dur: .1,
    html: lobedLeaf(rng, f1(rng.range(38, 52)), f1(rng.range(13, 17)), true),
  });
  const apex = nodes[nodes.length - 1];
  /* bracts */
  for (const sd of [-1, 1]) {
    S.organ({ x: f1(apex.x), y: f1(apex.y), angle: f1(90 + sd * rng.range(28, 45)), rotFrom: f1(90), scale: 1, birth: apex.birth + .02, dur: .07, html: `<path class="lf lf-solid" d="${leafD(13, 2.2)}"/>` });
  }
  /* the umbel: rays curling upward into a dome, each ending in an umbellet */
  const n = rng.int(11, 13);
  const fan = rng.range(138, 152);
  for (let i = 0; i < n; i++) {
    const pos = i / (n - 1) - .5;
    const rayAng = -90 + pos * fan + rng.range(-3, 3);
    const rayLen = rng.range(54, 70) * (.72 + .6 * Math.abs(pos));
    const ray = chain(S, { x: apex.x, y: apex.y, ang: rayAng, len: rayLen, segs: 3, drift: 1.2, bend: -pos * 12, w0: 1, w1: .65, birth: apex.birth + .04 + Math.abs(pos) * .025, grow: .09, cls: 'stem thin' });
    const end = ray[ray.length - 1];
    S.organ({
      x: f1(end.x), y: f1(end.y), angle: f1(end.a + 90), rotFrom: f1(end.a + 90 + 20),
      birth: end.birth + .02, dur: .1, html: umbelletHTML(rng),
    });
  }
  return S.plan();
}

function bell(rng) {
  const S = sprout(rng, 500, 560);
  const by = 508;
  /* two flowering stems sharing one crown */
  const stems = [
    { bx: 282, len: rng.range(330, 360), w0: 2.6, birth: .1, from: 3 },
    { bx: 206, len: rng.range(225, 255), w0: 2.1, birth: .18, from: 2 },
  ];
  roots(S, 245, by, rng.int(5, 7), 0, .1);
  hatch(S, 245, by, .04);
  /* basal rosette spanning both stems */
  for (let i = 0; i < rng.int(5, 6); i++) {
    const sd = i % 2 ? 1 : -1;
    S.organ({
      x: f1(245 + rng.range(-24, 24)), y: by - 2, angle: f1(-90 + sd * rng.range(32, 66)), rotFrom: -90,
      birth: .05 + i * .015, dur: .12,
      html: leaf(f1(rng.range(62, 95)), f1(rng.range(10, 14)), { bend: rng.range(-6, 6), veins: 3 }),
    });
  }
  for (const st of stems) {
    const nodes = chain(S, { x: st.bx, y: by, ang: -90 + rng.range(-3, 3), len: st.len, segs: 8, drift: 1.2, bend: rng.range(-.5, .5), w0: st.w0, w1: 1, birth: st.birth, grow: .5 });
    /* small stem leaves */
    for (const [idx, sd] of [[1, 1], [2, -1]]) {
      const nd = nodes[idx];
      S.organ({
        x: f1(nd.x), y: f1(nd.y), angle: f1(nd.a + sd * rng.range(40, 55)), rotFrom: f1(nd.a),
        birth: nd.birth + .03, dur: .1,
        html: leaf(f1(rng.range(38, 55)), f1(rng.range(7, 9)), { veins: 2 }),
      });
    }
    /* hanging bells along the upper stem */
    let side = rng.chance(.5) ? 1 : -1;
    for (let k = st.from; k < nodes.length - 1; k++) {
      const nd = nodes[k];
      side = -side;
      const ped = chain(S, { x: nd.x, y: nd.y, ang: nd.a + side * rng.range(55, 70), len: rng.range(16, 24), segs: 2, drift: 2, bend: 15, w0: .9, w1: .55, birth: nd.birth + .03, grow: .08, cls: 'stem thin' });
      const end = ped[ped.length - 1];
      const bAng = rng.range(-10, 10);
      S.organ({
        x: f1(end.x), y: f1(end.y), angle: f1(bAng), rotFrom: f1(bAng + side * 34),
        birth: end.birth + .03, dur: .12, html: bellHTML(rng),
      });
    }
    /* buds at the tip */
    const tip = nodes[nodes.length - 1];
    for (const sd of [-1, 1]) {
      S.organ({
        x: f1(tip.x), y: f1(tip.y), angle: f1(45 + sd * 45 + rng.range(-10, 10)), rotFrom: f1(-90),
        scale: .9, birth: tip.birth + .03, dur: .1,
        html: `<path class="petal" d="${leafD(11, 3.6)}"/><path class="lf lf-solid" d="M0 0 L 3.5 -2 L 3 .5 Z"/>`,
      });
    }
  }
  return S.plan();
}

function vine(rng) {
  const S = sprout(rng, 440, 560);
  const bx = 205, by = 508;
  roots(S, bx, by, rng.int(4, 6), 0, .1);
  hatch(S, bx, by, .04);
  const nodes = chain(S, {
    x: bx, y: by, ang: -87 + rng.range(-2, 2), len: rng.range(410, 450), segs: 16,
    drift: 1, bend: rng.range(.1, .35), waveAmp: rng.range(14, 16.5), waveFreq: 1.05,
    wavePhase: rng.range(-.5, .5),
    w0: 2.3, w1: .9, birth: .08, grow: .62,
  });
  let side = 1;
  for (let k = 2; k < nodes.length; k += 2) {
    const nd = nodes[k];
    side = -side;
    S.organ({
      x: f1(nd.x), y: f1(nd.y), angle: f1(nd.a + side * rng.range(55, 80)), rotFrom: f1(nd.a + side * 10),
      scale: f1(lerp(1.3, .68, nd.t)), birth: nd.birth + .02, dur: .11,
      html: heartHTML(),
    });
  }
  /* trumpets */
  for (const t of [.5, .82]) {
    const nd = nodes[Math.round(t * (nodes.length - 1))];
    const sd = rng.chance(.5) ? 1 : -1;
    S.organ({
      x: f1(nd.x), y: f1(nd.y), angle: f1(nd.a + sd * rng.range(65, 92)), rotFrom: f1(nd.a + sd * 20),
      scale: 1.6, birth: nd.birth + .05, dur: .13, html: trumpetHTML(),
    });
  }
  /* tendrils */
  for (const t of [.4, .68, .93]) {
    if (rng.chance(.25)) continue;
    const nd = nodes[Math.round(t * (nodes.length - 1))];
    const sd = rng.chance(.5) ? 1 : -1;
    chain(S, { x: nd.x, y: nd.y, ang: nd.a + sd * rng.range(30, 60), len: rng.range(26, 40), segs: 7, drift: 2, bend: sd * rng.range(20, 30), w0: .7, w1: .3, birth: nd.birth + .05, grow: .1, cls: 'stem thin' });
  }
  return S.plan();
}

function allium(rng) {
  const S = sprout(rng, 420, 560);
  const bx = 210, by = 508;
  roots(S, bx, by, rng.int(5, 7), 0, .1);
  hatch(S, bx, by, .04);
  /* strap leaves */
  for (let i = 0; i < rng.int(2, 3); i++) {
    const sd = i % 2 ? 1 : -1;
    S.organ({
      x: f1(bx + rng.range(-5, 5)), y: by, angle: f1(-90 + sd * rng.range(24, 46)), rotFrom: -90,
      birth: .05 + i * .02, dur: .14,
      html: blade(f1(rng.range(115, 160)), 6.2, rng.range(.6, .9)),
    });
  }
  const nodes = chain(S, { x: bx, y: by, ang: -90 + rng.range(-2.5, 2.5), len: rng.range(310, 345), segs: 6, drift: .7, bend: rng.range(-.6, .6), w0: 3.2, w1: 1.9, birth: .08, grow: .42 });
  const apex = nodes[nodes.length - 1];
  /* papery spathe remnants */
  for (const sd of [-1, 1]) {
    S.organ({
      x: f1(apex.x), y: f1(apex.y), angle: f1(90 + sd * rng.range(30, 55)), rotFrom: 90,
      birth: apex.birth + .02, dur: .07,
      html: `<path class="husk" d="${leafD(14, 2.6)}"/>`,
    });
  }
  /* the globe */
  const N = rng.int(26, 32);
  const R = rng.range(48, 56);
  const gb = apex.birth + .05;
  for (let i = 0; i < N; i++) {
    const a = i / N * 360 + rng.range(-4, 4);
    const behind = rng.chance(.32);
    const rl = R * (behind ? rng.range(.5, .68) : rng.range(.82, 1));
    const ray = chain(S, { x: apex.x, y: apex.y, ang: a, len: rl, segs: 2, drift: 1.5, bend: rng.range(-2, 2), w0: .85, w1: .6, birth: gb + rng.range(0, .05), grow: .07, cls: behind ? 'stem thin dim' : 'stem thin' });
    const end = ray[ray.length - 1];
    S.organ({
      x: f1(end.x), y: f1(end.y), angle: f1(rng.range(0, 360)), rotFrom: 0,
      scale: behind ? .72 : 1, birth: end.birth + .02, dur: .08,
      cls: behind ? 'organ dim' : 'organ',
      html: `<path class="petal" d="${starD(4.8, 6, 1.6)}"/><circle class="dot" r=".95"/>`,
    });
  }
  return S.plan();
}

export const SPECIES = { fern, grass, daisy, umbel, bell, vine, allium };
export const SPECIES_IDS = Object.keys(SPECIES);

export function generate(id, seed) {
  const rng = makeRng(seed);
  const fn = SPECIES[id] || fern;
  return fn(rng);
}
