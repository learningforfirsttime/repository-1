/* AUTO MEMORY DOLL — greeting page.
   The doll is an articulated vector figure: a squash rig at the hips and neck
   turns scroll progress into one continuous bow. Eyelids meet the lower lash
   at the deepest point, earrings swing on damped pendulums, and she breathes
   and blinks while she waits. Everything fails open: text, salon, and reveals
   run even if the figure cannot load. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
document.documentElement.classList.add("js");

/* ---------------- her spoken line (independent of the doll) ---------------- */
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
let salonRaf = null;

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

function paintSalon(t) {
  salonRaf = null;
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
    if (!reduced) {
      m.y -= m.v * 0.004;
      if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
    }
    const tw = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.001 + m.ph));
    ctx.globalAlpha = tw * 0.55;
    ctx.beginPath();
    ctx.arc(m.x * W + Math.sin(t * 0.0007 + m.ph) * 14 * DPR, (m.y * H - drift) % (H + 20 * DPR), m.r * DPR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (!reduced && !document.hidden) salonRaf = requestAnimationFrame(paintSalon);
}
function sizeSalon() {
  W = Math.floor(innerWidth * DPR); H = Math.floor(innerHeight * DPR);
  cv.width = W; cv.height = H;
  if (reduced) paintSalon(performance.now());
}
sizeSalon();
addEventListener("resize", sizeSalon);
if (!reduced) salonRaf = requestAnimationFrame(paintSalon);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !reduced && salonRaf === null) salonRaf = requestAnimationFrame(paintSalon);
});

/* ---------------- reveals (fail-open via .js scoping) ---------------- */
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
  { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------------- the doll ---------------- */
async function initDoll() {
  const slot = document.getElementById("doll-slot");
  let svgText;
  try {
    svgText = await (await fetch("./doll.svg")).text();
  } catch {
    slot.classList.add("arrived"); // she is missing, but the page must not be
    return;
  }
  slot.innerHTML = svgText;
  const $ = (s) => slot.querySelector(s);
  const upper = $("#upper"), head = $("#head"), features = $("#features");
  const crown = $("#crown"), bangs = $("#bangs"), ribbon = $("#ribbon");
  const lidL = $("#lidL"), lidR = $("#lidR"), lashes = $("#lashes");
  const earL = $("#earringL"), earR = $("#earringR");
  if (!upper || !head) { slot.classList.add("arrived"); return; }

  upper.style.transformOrigin = "220px 430px";
  head.style.transformOrigin = "220px 244px";
  features.style.transformOrigin = "220px 190px";
  crown.style.transformOrigin = "220px 100px";
  bangs.style.transformOrigin = "220px 120px";
  ribbon.style.transformOrigin = "220px 268px";
  requestAnimationFrame(() => slot.classList.add("arrived"));

  const hero = document.querySelector(".hero");
  const caption = document.querySelector(".stage-caption");
  let target = 0, bow = 0, lastBow = 0;
  let earVel = { l: 0, r: 0 }, earAng = { l: 0, r: 0 };
  let blinkLid = 0;
  let dollRaf = null, lastNow = performance.now();

  const smooth = (t) => t * t * (3 - 2 * t);

  function readScroll() {
    const span = hero.offsetHeight - innerHeight;
    target = span > 0 ? Math.min(1, Math.max(0, scrollY / span)) : 0;
  }
  readScroll();
  addEventListener("scroll", readScroll, { passive: true });
  addEventListener("resize", readScroll);

  function pose(p, t) {
    const e = smooth(p);
    const breath = reduced ? 0 : Math.sin(t * 0.0011) * 1.4 * (1 - e);
    // depth comes from foreshortening, not from the head sinking between the shoulders
    upper.style.transform =
      `translateY(${e * 34 + breath}px) scale(${1 + e * 0.025}, ${1 - e * 0.22})`;
    head.style.transform =
      `translateY(${e * 28}px) scaleY(${1 - e * 0.17})`;
    features.style.transform =
      `translateY(${e * 17}px) scaleY(${1 - e * 0.10})`;
    crown.style.transform = `translateY(${e * 7}px) scale(${1 + e * 0.11})`;
    bangs.style.transform = `translateY(${e * 7}px)`;
    ribbon.style.transform = `translateY(${e * 14}px) scaleX(${1 - e * 0.15})`;
    if (caption) caption.style.opacity = String(Math.max(0, 1 - e * 1.6));

    // lids meet the lower lash at the deepest point; static lashes yield to the lid line
    const lidDown = Math.max(e * 24, blinkLid * 22);
    lidL.style.transform = `translateY(${lidDown}px)`;
    lidR.style.transform = `translateY(${lidDown}px)`;
    lashes.style.opacity = String(1 - Math.max(e * 0.9, blinkLid * 0.85));

    if (reduced) {
      earL.style.transform = earR.style.transform = "";
      return;
    }
    const kick = (e - lastBow) * 260;
    lastBow = e;
    for (const s of ["l", "r"]) {
      const idle = Math.sin(t * 0.0016 + (s === "l" ? 0 : 1.4)) * 2.2 * (1 - e * 0.5);
      earVel[s] += -earAng[s] * 0.055 + kick * (s === "l" ? 1 : 0.85);
      earVel[s] *= 0.92;
      earAng[s] += earVel[s];
      const a = Math.max(-24, Math.min(24, earAng[s] + idle));
      (s === "l" ? earL : earR).style.transform = `rotate(${a}deg)`;
    }
  }

  let nextBlink = performance.now() + 2600;
  function maybeBlink(now) {
    if (now < nextBlink) return;
    const phase = (now - nextBlink) / 200;
    if (phase >= 1) { blinkLid = 0; nextBlink = now + 3200 + Math.random() * 2800; return; }
    blinkLid = bow > 0.55 ? 0 : Math.sin(phase * Math.PI);
  }

  function frame(now) {
    dollRaf = null;
    if (document.hidden) return;
    const dt = Math.min(64, now - lastNow); lastNow = now;
    bow += (target - bow) * (1 - Math.exp(-dt / 130)); // refresh-rate independent
    maybeBlink(now);
    pose(bow, now);
    dollRaf = requestAnimationFrame(frame);
  }

  if (!reduced) {
    dollRaf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && dollRaf === null) { lastNow = performance.now(); dollRaf = requestAnimationFrame(frame); }
    });
  } else {
    // reduced motion: a discrete, gentle state change — no scrubbing
    slot.style.transition = "opacity .5s ease";
    bow = target > 0.35 ? 1 : 0;
    pose(bow, 0);
    addEventListener("scroll", () => {
      const want = target > 0.35 ? 1 : 0;
      if (want !== bow) {
        slot.style.opacity = "0.25";
        setTimeout(() => { bow = want; pose(bow, 0); slot.style.opacity = "1"; }, 220);
      }
    }, { passive: true });
  }
}
initDoll();
