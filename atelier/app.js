/* AUTO MEMORY DOLL — greeting page.
   The doll is an articulated vector figure: a squash rig at the hips and neck
   turns scroll progress into one continuous bow. Eyelids soften, earrings
   swing on damped pendulums, and she breathes and blinks while she waits. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;

/* ---------------- inject the doll ---------------- */
const slot = document.getElementById("doll-slot");
const svgText = await (await fetch("./doll.svg")).text();
slot.innerHTML = svgText;
const svg = slot.querySelector("svg");
const upper = svg.querySelector("#upper");
const head = svg.querySelector("#head");
const features = svg.querySelector("#features");
const crown = svg.querySelector("#crown");
const bangs = svg.querySelector("#bangs");
const lidL = svg.querySelector("#lidL");
const lidR = svg.querySelector("#lidR");
const earL = svg.querySelector("#earringL");
const earR = svg.querySelector("#earringR");

upper.style.transformOrigin = "220px 430px";
head.style.transformOrigin = "220px 244px";
features.style.transformOrigin = "220px 190px";
crown.style.transformOrigin = "220px 100px";
bangs.style.transformOrigin = "220px 120px";
requestAnimationFrame(() => slot.classList.add("arrived"));

/* ---------------- the bow ---------------- */
const hero = document.querySelector(".hero");
let target = 0;      // where the scroll says the bow should be
let bow = 0;         // where she actually is (eased)
let lastBow = 0;
let earVel = { l: 0, r: 0 }, earAng = { l: 0, r: 0 };
let blinkLid = 0;    // 0 open, 1 closed (blink overlay)
let running = true;

const smooth = (t) => t * t * (3 - 2 * t);

function readScroll() {
  const span = hero.offsetHeight - innerHeight;
  target = span > 0 ? Math.min(1, Math.max(0, scrollY / span)) : 0;
}
readScroll();
addEventListener("scroll", readScroll, { passive: true });
addEventListener("resize", readScroll);

const caption = document.querySelector(".stage-caption");
function pose(p, t) {
  const e = smooth(p);
  const breath = reduced ? 0 : Math.sin(t * 0.0011) * 1.4 * (1 - e);
  upper.style.transform =
    `translateY(${e * 34 + breath}px) scale(${1 + e * 0.025}, ${1 - e * 0.22})`;
  head.style.transform =
    `translateY(${e * 42}px) scaleY(${1 - e * 0.13})`;
  features.style.transform =
    `translateY(${e * 17}px) scaleY(${1 - e * 0.10})`;
  crown.style.transform = `translateY(${e * 7}px) scale(${1 + e * 0.09})`;
  bangs.style.transform = `translateY(${e * 7}px)`;
  if (caption) caption.style.opacity = String(Math.max(0, 1 - e * 1.6));

  // lids: soften with the bow (fully closed at the deepest point), close on a blink
  const lidDown = Math.max(e * 15.5, blinkLid * 15);
  lidL.style.transform = `translateY(${lidDown}px)`;
  lidR.style.transform = `translateY(${lidDown}px)`;

  // earrings: damped pendulums kicked by bow velocity
  const kick = (e - lastBow) * 260;
  lastBow = e;
  for (const s of ["l", "r"]) {
    const idle = reduced ? 0 : Math.sin(t * 0.0016 + (s === "l" ? 0 : 1.4)) * 2.2 * (1 - e * 0.5);
    earVel[s] += -earAng[s] * 0.055 + kick * (s === "l" ? 1 : 0.85);
    earVel[s] *= 0.92;
    earAng[s] += earVel[s];
    const a = Math.max(-24, Math.min(24, earAng[s] + idle));
    (s === "l" ? earL : earR).style.transform = `rotate(${a}deg)`;
  }
}

/* blink scheduler */
let nextBlink = performance.now() + 2600;
function maybeBlink(now) {
  if (reduced) return;
  if (now < nextBlink) return;
  const phase = (now - nextBlink) / 200; // 0..1 close+open over 200ms
  if (phase >= 1) { blinkLid = 0; nextBlink = now + 3200 + Math.random() * 2800; return; }
  blinkLid = bow > 0.55 ? 0 : Math.sin(phase * Math.PI);
}

function frame(now) {
  if (!running) return;
  bow += (target - bow) * (reduced ? 1 : 0.085);
  maybeBlink(now);
  pose(bow, now);
  requestAnimationFrame(frame);
}
if (!reduced) requestAnimationFrame(frame);
else {
  // reduced motion: a discrete, gentle state change — no scrubbing
  slot.style.transition = "opacity .5s ease";
  const apply = () => { bow = target > 0.35 ? 1 : 0; pose(bow, 0); };
  apply();
  addEventListener("scroll", () => {
    const want = target > 0.35 ? 1 : 0;
    if (want !== bow) {
      slot.style.opacity = "0.25";
      setTimeout(() => { bow = want; pose(bow, 0); slot.style.opacity = "1"; }, 220);
    }
  }, { passive: true });
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) running = false;
  else if (!running && !reduced) { running = true; requestAnimationFrame(frame); }
});

/* ---------------- her spoken line ---------------- */
const LINE = "Welcome. I am your Auto Memory Doll. If you have feelings you cannot put into words — I will write them for you.";
const typed = document.getElementById("typed");
if (reduced) typed.textContent = LINE;
else {
  let i = 0;
  const tick = () => {
    if (i > LINE.length) return;
    typed.textContent = LINE.slice(0, i);
    const prev = LINE[i - 1];
    let d = 34 + Math.random() * 40;
    if (prev === "." || prev === "—") d += 330;
    if (prev === ",") d += 150;
    i++;
    setTimeout(tick, d);
  };
  setTimeout(tick, 1400);
}

/* ---------------- the salon: bokeh + dust ---------------- */
const cv = document.getElementById("salon");
const ctx = cv.getContext("2d");
const DPR = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.5);
let W = 0, H = 0;
function sizeSalon() {
  W = Math.floor(innerWidth * DPR); H = Math.floor(innerHeight * DPR);
  cv.width = W; cv.height = H;
}
sizeSalon();
addEventListener("resize", sizeSalon);

const orbs = Array.from({ length: 13 }, (_, i) => ({
  x: Math.random(), y: Math.random() * 0.9,
  r: 26 + Math.random() * 90,
  hue: i % 4 === 3 ? "violet" : "amber",
  a: 0.05 + Math.random() * 0.09,
  ph: Math.random() * 6.28, sp: 0.1 + Math.random() * 0.25,
}));
const motes = Array.from({ length: 42 }, () => ({
  x: Math.random(), y: Math.random(),
  r: 0.6 + Math.random() * 1.6,
  v: 0.012 + Math.random() * 0.03,
  ph: Math.random() * 6.28,
}));

let salonRunning = !document.hidden;
function paintSalon(t) {
  ctx.clearRect(0, 0, W, H);
  const drift = scrollY * 0.04 * DPR;
  for (const o of orbs) {
    const x = o.x * W + Math.sin(t * 0.0002 * o.sp * 10 + o.ph) * 30 * DPR;
    const y = o.y * H - drift * 0.5 + Math.cos(t * 0.00015 * o.sp * 10 + o.ph) * 22 * DPR;
    const r = o.r * DPR * (1 + Math.sin(t * 0.0004 + o.ph) * 0.08);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = o.hue === "amber" ? "217,168,85" : "122,79,176";
    g.addColorStop(0, `rgba(${col},${o.a})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(240,205,138,0.8)";
  for (const m of motes) {
    m.y -= m.v * 0.004;
    if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
    const tw = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.001 + m.ph));
    ctx.globalAlpha = tw * 0.55;
    ctx.beginPath();
    ctx.arc(m.x * W + Math.sin(t * 0.0007 + m.ph) * 14 * DPR, (m.y * H - drift) % (H + 20 * DPR), m.r * DPR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (salonRunning && !reduced) requestAnimationFrame(paintSalon);
}
paintSalon(performance.now());
document.addEventListener("visibilitychange", () => {
  salonRunning = !document.hidden;
  if (salonRunning && !reduced) requestAnimationFrame(paintSalon);
});

/* ---------------- reveals ---------------- */
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
  { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
