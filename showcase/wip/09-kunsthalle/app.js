/* KUNSTHALLE NORD — Programm 26/27
   The poster machine and other mechanical devices.        */
(() => {
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const SVGNS = "http://www.w3.org/2000/svg";
const C = { ink: "#141412", red: "#E2261F", gray: "#8E8E86", paper: "#FAFAF7" };
const M = 50; // one grid module in poster units (poster = 12 × 16 modules)
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- seeded randomness ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

/* ---------- data ---------- */
const EX = [
  { nr: "01", title: "Retina Studies", artist: "Mira Vogel",
    dates: "12.09.26 – 23.11.26", hall: "1",
    desc: "Forty afterimage paintings made in a windowless studio: what the eye keeps once the light has gone.",
    arch: "A", red: "circle", seed: 9101 },
  { nr: "02", title: "Concrete Weather", artist: "Aldo Brenner",
    dates: "12.09.26 – 04.01.27", hall: "2",
    desc: "Fog, föhn and first snow cast in fair-faced concrete. Meteorology as monument.",
    arch: "B", red: "bar", seed: 9202 },
  { nr: "03", title: "A Short Inventory of Distances", artist: "Ines Katz",
    dates: "05.12.26 – 14.02.27", hall: "3",
    desc: "The gap between two people, measured in string, sodium light and folded paper.",
    arch: "D", red: "diag", seed: 9303 },
  { nr: "04", title: "Feedback Garden", artist: "Jonas Ruf",
    dates: "23.01.27 – 05.04.27", hall: "1",
    desc: "A greenhouse of signals: plants wired to oscillators tend, and retune, themselves.",
    arch: "C", red: "circle", seed: 9404 },
  { nr: "05", title: "The Slow Catalogue", artist: "Petra Mund",
    dates: "27.02.27 – 24.05.27", hall: "4",
    desc: "One shelf, photographed daily for nine years. The catalogue is the exhibition.",
    arch: "E", red: "circle", seed: 9505 },
  { nr: "06", title: "White Noise, Alpine", artist: "Kollektiv Rauschen",
    dates: "17.04.27 – 27.06.27", hall: "2–3",
    desc: "Field recordings of snow static, played back through carved spruce horns.",
    arch: "D", red: "circle", seed: 9606, dots: true },
];

/* ============================================================
   THE POSTER MACHINE
   Fixed set of elements; each composition repositions them on
   the module grid. Five archetypes, weight-balanced by hand.
   ============================================================ */
function makePoster(svg) {
  const mk = (tag, attrs, parent = svg) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };
  mk("rect", { width: 600, height: 800, fill: C.paper });

  const nodes = {
    diag: mk("rect", { width: 50, height: 50, class: "p-el" }),
    b1: mk("rect", { width: 50, height: 50, class: "p-el" }),
    b2: mk("rect", { width: 50, height: 50, class: "p-el" }),
    b3: mk("rect", { width: 50, height: 50, class: "p-el" }),
    b4: mk("rect", { width: 50, height: 50, class: "p-el" }),
    dots: mk("g", { class: "p-el" }),
    circle: mk("circle", { r: 50, class: "p-el" }),
    mark: mk("rect", { width: 50, height: 50, class: "p-el" }),
    cap: mk("g", { class: "p-el" }),
  };
  const dotEls = [];
  for (let i = 0; i < 16; i++) {
    dotEls.push(mk("circle", {
      cx: (i % 4) * 26, cy: Math.floor(i / 4) * 26, r: 7, class: "p-dot",
    }, nodes.dots));
  }
  const t1 = mk("text", { x: 0, y: 0, "font-size": 15, "font-weight": 600,
    "letter-spacing": 0.6, fill: C.ink }, nodes.cap);
  const t2 = mk("text", { x: 0, y: 20, "font-size": 11, "font-weight": 400,
    "letter-spacing": 0.5, fill: C.gray }, nodes.cap);

  const px = m => (m * M).toFixed(1);
  const hide = n => { n.style.opacity = 0; };

  function setRect(n, s) {
    if (!s) return hide(n);
    n.style.opacity = s.o ?? 1;
    n.style.fill = s.f;
    n.style.transform =
      `translate(${px(s.t[0])}px, ${px(s.t[1])}px) scale(${s.s[0]}, ${s.s[1]})`;
  }

  function apply(spec, instant) {
    if (instant || RM) svg.classList.add("no-anim");

    setRect(nodes.b1, spec.b1); setRect(nodes.b2, spec.b2);
    setRect(nodes.b3, spec.b3); setRect(nodes.b4, spec.b4);
    setRect(nodes.mark, spec.mark);

    const c = spec.circle;
    if (c) {
      nodes.circle.style.opacity = c.o ?? 1;
      nodes.circle.style.fill = c.f;
      nodes.circle.style.transform =
        `translate(${px(c.t[0])}px, ${px(c.t[1])}px) scale(${c.s})`;
    } else hide(nodes.circle);

    const d = spec.diag;
    if (d) {
      nodes.diag.style.opacity = d.o ?? 1;
      nodes.diag.style.fill = d.f;
      nodes.diag.style.transform =
        `translate(${px(d.c[0])}px, ${px(d.c[1])}px) rotate(${d.a}deg) ` +
        `scale(${d.len}, ${d.th}) translate(-25px, -25px)`;
    } else hide(nodes.diag);

    const dt = spec.dots;
    if (dt) {
      nodes.dots.style.opacity = 1;
      nodes.dots.style.transform =
        `translate(${px(dt.t[0])}px, ${px(dt.t[1])}px) scale(${dt.sc})`;
      dotEls.forEach((dot, i) => {
        dot.style.transitionDelay = RM ? "0ms" : `${i * 18}ms`;
        dot.style.opacity = i < dt.n ? 1 : 0;
        dot.style.fill = dt.f;
      });
    } else hide(nodes.dots);

    const cp = spec.cap;
    if (cp) {
      nodes.cap.style.opacity = 1;
      nodes.cap.style.transform =
        `translate(${px(cp.t[0])}px, ${px(cp.t[1])}px) rotate(${cp.rot || 0}deg)`;
      t1.textContent = cp.l1 || "";
      t2.textContent = cp.l2 || "";
    } else hide(nodes.cap);

    if (instant || RM) {
      void svg.getBoundingClientRect();
      requestAnimationFrame(() => svg.classList.remove("no-anim"));
    }
  }

  return { apply };
}

/* ---------- archetypes (all coordinates in modules) ---------- */
function archA(r, red) { // SIGNAL — circle dominant, thin counterweights
  const cr = pick(r, [2.5, 3, 3.5]);
  const cx = ri(r, 7, 9), cy = ri(r, 4, 6);
  const bx = pick(r, [1, 1.5, 2]);
  const hy = ri(r, 11, 13);
  const x0 = ri(r, 4, 6);
  const s = {
    circle: { t: [cx, cy], s: cr, f: red === "circle" ? C.red : C.ink },
    b1: { t: [bx, 0], s: [0.5, 16], f: red === "bar" ? C.red : C.ink },
    b2: { t: [x0, hy], s: [12 - x0, 0.5], f: C.ink },
    mark: { t: [10.6, 0.9], s: [0.32, 0.32], f: red === "circle" ? C.ink : C.red },
    cap: { t: [bx + 0.8, 14.5] },
  };
  if (r() < 0.65) s.diag = { c: [3.5, 11.5], len: 6, th: 0.22, a: -45, f: C.ink };
  if (r() < 0.5) s.dots = { t: [bx + 0.8, 1.4], n: ri(r, 3, 6), sc: 0.8, f: C.gray };
  return s;
}

function archB(r, red) { // STACK — bars rise from the bottom edge
  const cols = [1, 2.5, 4, 5.5, 7, 8.5, 10]
    .sort(() => r() - 0.5).slice(0, 4).sort((a, b) => a - b);
  const redIdx = ri(r, 0, 3);
  const grayIdx = (redIdx + 2) % 4;
  const s = {};
  let lean = 0;
  cols.forEach((x, i) => {
    const h = ri(r, 4, 12);
    const w = pick(r, [0.75, 1, 1.25]);
    lean += x;
    s["b" + (i + 1)] = {
      t: [x, 16 - h], s: [w, h],
      f: red === "bar" && i === redIdx ? C.red : i === grayIdx ? C.gray : C.ink,
    };
  });
  const cxx = lean / 4 > 5.5 ? pick(r, [1.5, 2]) : pick(r, [9.5, 10]);
  s.circle = { t: [cxx, ri(r, 2, 3)], s: pick(r, [1, 1.5]),
    f: red === "circle" ? C.red : C.ink };
  if (r() < 0.5) s.diag = { c: [6, ri(r, 2, 3)], len: 10, th: 0.1, a: 0, f: C.ink };
  s.cap = { t: [0.55, 15.3], rot: -90 };
  s.mark = { t: [cxx > 5 ? cxx - 2 : cxx + 2, 2.3], s: [0.32, 0.32],
    f: red === "circle" ? C.ink : C.red };
  return s;
}

function archC(r, red) { // HORIZON — full-bleed bar, circle resting on it
  const by = ri(r, 9, 11);
  const bh = pick(r, [1.25, 1.5, 2]);
  const cr = pick(r, [1.5, 2]);
  const cx = ri(r, 3, 9);
  return {
    b1: { t: [0, by], s: [12, bh], f: red === "bar" ? C.red : C.ink },
    circle: { t: [cx, by - cr], s: cr, f: red === "circle" ? C.red : C.ink },
    b2: { t: [ri(r, 2, 4), by + bh], s: [0.5, 16 - by - bh], f: C.ink },
    dots: { t: [ri(r, 7, 8), 1.5], n: 16, sc: 1, f: C.gray },
    cap: { t: [0.8, 14.6] },
  };
}

function archD(r, red, dotsBoost) { // DIAGONAL — one bold stroke across
  const a = pick(r, [-45, 45]);
  const th = red === "diag" ? pick(r, [0.4, 0.6]) : pick(r, [0.8, 1, 1.2]);
  const s = {
    diag: { c: [6, 8], len: 16, th, a, f: red === "diag" ? C.red : C.ink },
    circle: { t: a === -45 ? [9.5, 3] : [2.5, 3], s: pick(r, [1.5, 2]),
      f: red === "circle" ? C.red : C.ink },
    b1: { t: [6.5, 1.5], s: [5, 0.3], f: C.ink },
    b2: { t: [0.8, 14], s: [4, 0.3], f: C.ink },
    cap: a === -45 ? { t: [0.8, 1.6] } : { t: [7.2, 15] },
  };
  if (dotsBoost) s.dots = { t: [a === -45 ? 8.5 : 1, 12], n: 16, sc: 0.9, f: C.gray };
  else if (r() < 0.35) s.dots = { t: [a === -45 ? 8.5 : 1, 12], n: ri(r, 4, 8), sc: 0.9, f: C.gray };
  return s;
}

function archE(r, red) { // QUADRANT — a circle clipped by the poster edge
  const corner = pick(r, [[0, 0], [12, 0], [12, 16]]);
  const cr = ri(r, 4, 6);
  const left = corner[0] === 0;
  const top = corner[1] === 0;
  const bh = ri(r, 7, 11);
  const s = {
    circle: { t: corner, s: cr, f: red === "circle" ? C.red : C.ink },
    b1: { t: [left ? 10.5 : 1, top ? 16 - bh : 0], s: [0.75, bh], f: C.ink },
    b2: { t: [left ? 5 : 0.8, 8], s: [4, 0.25], f: C.ink },
    dots: { t: [left ? 7.5 : 1, top ? 12.5 : 1.5], n: ri(r, 6, 12), sc: 0.8, f: C.gray },
    cap: top ? { t: [left ? 6.2 : 0.8, 14.8] } : { t: [0.8, 1.6] },
    mark: { t: [left ? 6.2 : 0.8, top ? 13.4 : 2.6], s: [0.32, 0.32],
      f: red === "circle" ? C.ink : C.red },
  };
  return s;
}

const ARCH = { A: archA, B: archB, C: archC, D: archD, E: archE };

function composeFor(ex) { // deterministic signature composition per exhibition
  const r = mulberry32(ex.seed);
  const s = ARCH[ex.arch](r, ex.red, ex.dots);
  s.cap = Object.assign(s.cap || { t: [0.8, 14.6] }, {
    l1: ex.title, l2: `${ex.artist} — ${ex.dates}`,
  });
  return s;
}

/* ---------- hero poster: the season machine ---------- */
const heroPoster = makePoster($("#posterHero"));
const seedOut = $("#seedOut");
const ORDER = ["A", "C", "B", "E", "D"];
let heroIdx = 0;
let heroSeed = 260027 + Math.floor(Math.random() * 700000);

function heroSpec(seed, idx) {
  const r = mulberry32(seed);
  const arch = ORDER[idx % ORDER.length];
  const red = pick(r, ["circle", "circle", "bar", "diag"]);
  const s = ARCH[arch](r, red, false);
  s.cap = Object.assign(s.cap || { t: [0.8, 14.6] }, {
    l1: "Programm 26/27", l2: "Kunsthalle Nord — Basel",
  });
  return s;
}

let flickerTimer = null;
function showSeed(v) {
  const final = String(v).padStart(6, "0");
  clearInterval(flickerTimer);
  if (RM) { seedOut.textContent = final; return; }
  let n = 0;
  flickerTimer = setInterval(() => {
    n++;
    seedOut.textContent = n >= 5 ? final
      : String(Math.floor(Math.random() * 999999)).padStart(6, "0");
    if (n >= 5) clearInterval(flickerTimer);
  }, 42);
}

function regenHero(instant) {
  heroSeed = Math.floor(Math.random() * 1000000);
  heroIdx++;
  heroPoster.apply(heroSpec(heroSeed, heroIdx), instant);
  showSeed(heroSeed);
}

heroPoster.apply(heroSpec(heroSeed, heroIdx), true);
seedOut.textContent = String(heroSeed).padStart(6, "0");

$("#regenBtn").addEventListener("click", () => regenHero(false));
$("#posterHit").addEventListener("click", () => regenHero(false));

/* autonomous rearranging — paused offscreen / hidden / reduced-motion */
let heroVisible = true;
new IntersectionObserver(es => {
  es.forEach(e => { heroVisible = e.isIntersecting; });
}, { threshold: 0.1 }).observe($("#posterHero"));

if (!RM) {
  setInterval(() => {
    if (heroVisible && !document.hidden) regenHero(false);
  }, 5200);
}

/* ---------- season list + mini machine ---------- */
const miniPoster = makePoster($("#posterMini"));
const SEASON_EX = { title: "Programm 26/27", artist: "Kunsthalle Nord",
  dates: "six variants", arch: "A", red: "circle", seed: 2627 };
const miniDefault = composeFor(SEASON_EX);
miniDefault.cap.l2 = "Kunsthalle Nord — Basel";
miniPoster.apply(miniDefault, true);

const miniNr = $("#miniNr"), miniTitle = $("#miniTitle"), miniMeta = $("#miniMeta");
const rowList = $("#rowList");
const rows = $("#rows");
const rule = $("#slideRule");

EX.forEach((ex, i) => {
  const li = document.createElement("li");
  li.className = "row";
  li.tabIndex = 0;
  li.dataset.i = i;
  li.innerHTML =
    `<span class="r-nr tnum">${ex.nr}</span>` +
    `<span class="r-title">${ex.title}<span class="r-desc">${ex.desc}</span></span>` +
    `<span class="r-artist">${ex.artist}</span>` +
    `<span class="r-dates tnum">${ex.dates}</span>` +
    `<span class="r-hall tnum">${ex.hall}</span>`;
  rowList.appendChild(li);
});

function pointRule(row) {
  const y = row.offsetTop + row.offsetHeight - 2;
  const wasLive = rows.classList.contains("live");
  if (!wasLive) { // first activation: jump, don't slide from the top
    rule.style.transition = "none";
    rule.style.transform = `translateY(${y}px)`;
    void rule.getBoundingClientRect();
    rule.style.transition = "";
  }
  rows.classList.add("live");
  rule.style.transform = `translateY(${y}px)`;
}

function activateRow(li) {
  const ex = EX[+li.dataset.i];
  pointRule(li);
  $$(".row", rowList).forEach(r => r.classList.toggle("hot", r === li));
  miniPoster.apply(composeFor(ex), RM);
  miniNr.textContent = ex.nr;
  miniTitle.textContent = ex.title;
  miniMeta.textContent = `${ex.artist} — Halle ${ex.hall} — ${ex.dates}`;
}

function resetMini() {
  rows.classList.remove("live");
  $$(".row", rowList).forEach(r => r.classList.remove("hot"));
  miniPoster.apply(miniDefault, RM);
  miniNr.textContent = "26/27";
  miniTitle.textContent = "Season identity";
  miniMeta.textContent = "Kunsthalle Nord — six variants";
}

rowList.addEventListener("pointerover", e => {
  const li = e.target.closest(".row");
  if (li) activateRow(li);
});
rowList.addEventListener("focusin", e => {
  const li = e.target.closest(".row");
  if (li) activateRow(li);
});
rows.addEventListener("pointerleave", resetMini);
rows.addEventListener("focusout", e => {
  if (!rows.contains(e.relatedTarget)) resetMini();
});

/* ---------- afterimage study (in focus) ---------- */
const studySvg = $("#studySvg");
const studyOut = $("#studyOut");
let studyN = 17;

function drawStudy(n) {
  studySvg.textContent = "";
  const r = mulberry32(9101 + n * 37);
  const mk = (tag, attrs) => {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    studySvg.appendChild(el);
    return el;
  };
  mk("rect", { width: 480, height: 480, fill: C.paper });
  const cx = 240, cy = 240;
  const rings = ri(r, 5, 7);
  const redRing = ri(r, 1, rings - 1);
  for (let i = 0; i < rings; i++) {
    const rad = 36 + i * ri(r, 22, 30);
    if (rad > 215) break;
    const circ = 2 * Math.PI * rad;
    const frac = 0.25 + r() * 0.65;
    mk("circle", {
      cx, cy, r: rad, fill: "none",
      stroke: i === redRing ? C.red : C.ink,
      "stroke-width": i === redRing ? 3 : pick(r, [1, 1, 2]),
      "stroke-dasharray": `${(circ * frac).toFixed(1)} ${circ.toFixed(1)}`,
      transform: `rotate(${ri(r, 0, 359)} ${cx} ${cy})`,
      class: "st-el",
    });
  }
  const ticks = ri(r, 28, 44);
  const tr0 = ri(r, 150, 195);
  for (let i = 0; i < ticks; i++) {
    if (r() < 0.25) continue;
    const a = (i / ticks) * Math.PI * 2;
    const len = ri(r, 6, 16);
    mk("line", {
      x1: cx + Math.cos(a) * tr0, y1: cy + Math.sin(a) * tr0,
      x2: cx + Math.cos(a) * (tr0 + len), y2: cy + Math.sin(a) * (tr0 + len),
      stroke: r() < 0.15 ? C.red : C.gray, "stroke-width": 1.5, class: "st-el",
    });
  }
  mk("circle", { cx, cy, r: 4, fill: C.red, class: "st-el" });
  mk("line", { x1: cx - 14, y1: cy, x2: cx + 14, y2: cy,
    stroke: C.ink, "stroke-width": 1, class: "st-el" });
  studyOut.textContent = String(n).padStart(3, "0");
}

drawStudy(studyN);
$("#studyBtn").addEventListener("click", () => {
  studyN = (studyN + ri(mulberry32(Date.now() >>> 0), 7, 113)) % 999 || 1;
  drawStudy(studyN);
});

/* ---------- floor plan ---------- */
const HALL_INFO = {
  1: "Halle 1 — Retina Studies (12.09–23.11) · Feedback Garden (23.01–05.04)",
  2: "Halle 2 — Concrete Weather (12.09–04.01) · White Noise, Alpine (17.04–27.06)",
  3: "Halle 3 — A Short Inventory of Distances (05.12–14.02) · White Noise, Alpine (17.04–27.06)",
  4: "Halle 4 — The Slow Catalogue (27.02–24.05)",
};
const planStatus = $("#planStatus");
const PLAN_DEFAULT = planStatus.textContent;

$$(".pl-hit").forEach(hit => {
  hit.tabIndex = 0;
  const hall = hit.dataset.hall;
  const nr = $("#plnr-" + hall);
  const on = () => {
    $$(".pl-nr").forEach(n => n.classList.remove("hot"));
    $$(".pl-hit").forEach(h => h.classList.remove("hot"));
    nr.classList.add("hot");
    hit.classList.add("hot");
    planStatus.textContent = HALL_INFO[hall];
  };
  const off = () => {
    nr.classList.remove("hot");
    hit.classList.remove("hot");
    planStatus.textContent = PLAN_DEFAULT;
  };
  hit.addEventListener("pointerenter", on);
  hit.addEventListener("pointerleave", off);
  hit.addEventListener("focus", on);
  hit.addEventListener("blur", off);
});

/* ---------- raster toggle ---------- */
const rasterBtn = $("#rasterBtn");
rasterBtn.addEventListener("click", () => {
  const onNow = document.body.classList.toggle("raster");
  rasterBtn.setAttribute("aria-pressed", String(onNow));
});

/* ---------- booklet button: alive, in character ---------- */
const bookletNote = $("#bookletNote");
$("#bookletBtn").addEventListener("click", () => {
  bookletNote.textContent = bookletNote.textContent ? "" :
    "The printed programme arrives with the season — ask at the front desk " +
    "from 1 September. Until then, the poster machine above is the programme.";
});

/* ---------- reveal choreography ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
$$(".rv").forEach(el => io.observe(el));

})();
