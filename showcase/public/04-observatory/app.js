/* LYRA — Deep Field Atlas
   A telescope you scroll: instanced starfield, procedural nebulae,
   and a camera on a Catmull-Rom spline driven by scroll position.
   three.js r160, vendored locally. No assets, no requests. */

import * as THREE from "/vendor/three.module.min.js";

const canvas = document.getElementById("sky");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1 : 1.5));
renderer.setClearColor(0x05060a, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.0011);
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1400);

/* ---------- seeded PRNG (deterministic sky) ---------- */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- catalogue geography ---------- */
const SITES = {
  lantern: new THREE.Vector3(-70, 12, 40),
  cluster: new THREE.Vector3(85, -16, -70),
  loom: new THREE.Vector3(-52, 34, -180),
  ember: new THREE.Vector3(74, -8, -320),
};

/* look targets carry a lateral bias so each object frames OPPOSITE its card */
const STOPS = [
  { cam: new THREE.Vector3(0, 6, 240), look: new THREE.Vector3(0, 0, -40) },
  { cam: new THREE.Vector3(-26, 10, 148), look: SITES.lantern.clone().add(new THREE.Vector3(-16, 0, 0)) },
  { cam: new THREE.Vector3(30, -4, 34), look: SITES.cluster.clone().add(new THREE.Vector3(14, -2, 0)) },
  { cam: new THREE.Vector3(-6, 26, -76), look: SITES.loom.clone().add(new THREE.Vector3(-20, 2, 0)) },
  { cam: new THREE.Vector3(64, 2, -212), look: SITES.ember.clone().add(new THREE.Vector3(15, 0, 0)) },
  { cam: new THREE.Vector3(0, 96, 150), look: new THREE.Vector3(0, 0, -140) },
];
const camCurve = new THREE.CatmullRomCurve3(STOPS.map((s) => s.cam), false, "centripetal", 0.6);

/* ---------- starfield: 6000 points, black-body tinted ---------- */
function blackBody(t, out) {
  // t 0..1 : cool amber -> white -> hot blue
  if (t < 0.5) out.setRGB(1.0, 0.72 + 0.28 * (t * 2), 0.5 + 0.5 * (t * 2));
  else out.setRGB(1.0 - (t - 0.5) * 0.5, 1.0 - (t - 0.5) * 0.28, 1.0);
  return out;
}

function makeStars() {
  const N = 6000, rand = mulberry(20260708);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const size = new Float32Array(N), phase = new Float32Array(N);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    // layered distribution: a broad slab + gentle band along the flight path
    const band = rand() < 0.55;
    const z = -420 + rand() * 760;
    const spread = band ? 150 : 420;
    pos[i * 3] = (rand() - 0.5) * spread * 2;
    pos[i * 3 + 1] = (rand() - 0.5) * (band ? 120 : 300);
    pos[i * 3 + 2] = z;
    blackBody(Math.pow(rand(), 0.7), c);
    const bright = 0.35 + Math.pow(rand(), 2.6) * 0.65;
    col[i * 3] = c.r * bright; col[i * 3 + 1] = c.g * bright; col[i * 3 + 2] = c.b * bright;
    size[i] = 0.9 + Math.pow(rand(), 3.2) * 3.4;
    phase[i] = rand() * Math.PI * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  return g;
}

const starUniforms = { uTime: { value: 0 }, uTwinkle: { value: reduced ? 0 : 1 } };
const starMat = new THREE.ShaderMaterial({
  uniforms: starUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute vec3 aColor; attribute float aSize; attribute float aPhase;
    uniform float uTime; uniform float uTwinkle;
    varying vec3 vColor;
    void main() {
      vColor = aColor;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float tw = 1.0 + uTwinkle * 0.35 * sin(uTime * (0.6 + fract(aPhase) * 1.7) + aPhase * 7.0);
      gl_PointSize = aSize * tw * (240.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float d = length(p);
      float a = smoothstep(0.5, 0.08, d);
      a += smoothstep(0.16, 0.0, d) * 0.8;
      gl_FragColor = vec4(vColor, a);
    }`,
});
scene.add(new THREE.Points(makeStars(), starMat));

/* ---------- globular cluster: gaussian ball of 3200 old suns ---------- */
function makeCluster() {
  const N = 3200, rand = mulberry(342);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const size = new Float32Array(N), phase = new Float32Array(N);
  const c = new THREE.Color();
  const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2;
  for (let i = 0; i < N; i++) {
    const r = Math.abs(gauss()) * 13 + Math.pow(rand(), 4) * 4;
    const th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1);
    pos[i * 3] = SITES.cluster.x + r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = SITES.cluster.y + r * Math.cos(ph) * 0.86;
    pos[i * 3 + 2] = SITES.cluster.z + r * Math.sin(ph) * Math.sin(th);
    blackBody(0.12 + rand() * 0.3, c); // old, amber population
    const bright = 0.3 + Math.pow(rand(), 2) * 0.7;
    col[i * 3] = c.r * bright; col[i * 3 + 1] = c.g * bright; col[i * 3 + 2] = c.b * bright;
    size[i] = 0.6 + Math.pow(rand(), 2.4) * 1.6;
    phase[i] = rand() * Math.PI * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  return g;
}
scene.add(new THREE.Points(makeCluster(), starMat));

/* ---------- ember ring: supernova shell ---------- */
function makeEmber() {
  const N = 1600, rand = mulberry(1204);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const size = new Float32Array(N), phase = new Float32Array(N);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const a = rand() * Math.PI * 2;
    const r = 16 + gaussish(rand) * 3;
    const wob = Math.sin(a * 3 + 1.2) * 1.1;
    pos[i * 3] = SITES.ember.x + Math.cos(a) * r;
    pos[i * 3 + 1] = SITES.ember.y + Math.sin(a) * r * 0.62 + wob;
    pos[i * 3 + 2] = SITES.ember.z + (rand() - 0.5) * 7;
    c.setHSL(0.07 + rand() * 0.05, 0.9, 0.42 + rand() * 0.3);
    const bright = 0.35 + rand() * 0.65;
    col[i * 3] = c.r * bright; col[i * 3 + 1] = c.g * bright; col[i * 3 + 2] = c.b * bright;
    size[i] = 0.7 + Math.pow(rand(), 2) * 2.2;
    phase[i] = rand() * Math.PI * 2;
  }
  function gaussish(rnd) { return (rnd() + rnd() - 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  return g;
}
scene.add(new THREE.Points(makeEmber(), starMat));

/* ---------- nebulae: fbm-shaded billboards ---------- */
const nebUniformsList = [];
function nebulaMaterial(hueA, hueB, seed, stretch = 1) {
  const u = {
    uTime: { value: 0 }, uSeed: { value: seed },
    uColA: { value: new THREE.Color(hueA) }, uColB: { value: new THREE.Color(hueB) },
    uStretch: { value: stretch },
  };
  nebUniformsList.push(u);
  return new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime, uSeed, uStretch; uniform vec3 uColA, uColB;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.04; a*=.5; } return v; }
      void main(){
        vec2 uv = (vUv - 0.5) * vec2(uStretch, 1.0);
        float t = uTime * 0.02;
        vec2 q = vec2(fbm(uv*2.2 + uSeed + t), fbm(uv*2.2 - t + uSeed*1.7));
        float f = fbm(uv*2.6 + q*1.4);
        float fall = smoothstep(0.62, 0.05, length(uv));
        float a = pow(f, 1.55) * fall;
        vec3 col = mix(uColA, uColB, smoothstep(0.25, 0.8, fbm(uv*1.8 - q)));
        gl_FragColor = vec4(col * a * 2.6, min(1.0, a * 1.5));
      }`,
  });
}

function addNebula(site, w, h, mats) {
  const group = new THREE.Group();
  mats.forEach((m, i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w * (1 - i * 0.18), h * (1 - i * 0.18)), m);
    p.position.copy(site).add(new THREE.Vector3((i - 1) * 4, (i - 1) * 2.5, i * 6));
    group.add(p);
  });
  scene.add(group);
  return group;
}

const billboards = [];
billboards.push(addNebula(SITES.lantern, 110, 92, [
  nebulaMaterial(0xe86fa0, 0xe8b87f, 3.1), nebulaMaterial(0xc94f86, 0x7f4fe8, 9.4),
  nebulaMaterial(0xf0a0c0, 0xe8b87f, 15.8),
]));
billboards.push(addNebula(SITES.loom, 150, 84, [
  nebulaMaterial(0x7fb4e8, 0x9fd0f0, 5.7, 2.6), nebulaMaterial(0x4f7fe8, 0x7fd9e8, 12.2, 3.4),
  nebulaMaterial(0x8fc4f4, 0xbfe0ff, 21.5, 2.1),
]));
billboards.push(addNebula(SITES.ember, 78, 58, [
  nebulaMaterial(0xe8965f, 0x8a3d2a, 7.7), nebulaMaterial(0xd87840, 0x6a2d1a, 17.3),
]));
billboards.push(addNebula(new THREE.Vector3(10, -6, -30), 230, 140, [
  nebulaMaterial(0x37497f, 0x1f6a7a, 1.3),
]));
// cluster halo glow
billboards.push(addNebula(SITES.cluster, 52, 52, [nebulaMaterial(0xe8c89f, 0xb88a5f, 4.4)]));

/* ---------- near dust for parallax ---------- */
(function dust() {
  const N = 500, rand = mulberry(9);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const size = new Float32Array(N), phase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rand() - 0.5) * 500;
    pos[i * 3 + 1] = (rand() - 0.5) * 260;
    pos[i * 3 + 2] = -420 + rand() * 800;
    const b = 0.10 + rand() * 0.14;
    col[i * 3] = b; col[i * 3 + 1] = b * 1.06; col[i * 3 + 2] = b * 1.2;
    size[i] = 0.5 + rand() * 0.9; phase[i] = rand() * 6.28;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  scene.add(new THREE.Points(g, starMat));
})();

/* ---------- scroll → camera, keyed to the DOM sections ----------
   Each stop's key is the scroll position at which its pinned card is
   mid-band, so the camera and the copy can never drift apart. */
let progress = 0;
let keys = [0, 1, 2, 3, 4, 5];
const stopSections = [...document.querySelectorAll("section[data-stop]")];
function measure() {
  keys = [0];
  for (const el of stopSections) {
    const top = el.offsetTop, h = el.offsetHeight;
    keys.push(Math.max(1, top + h / 2 - innerHeight / 2));
  }
}
function readScroll() {
  const y = scrollY;
  if (y <= keys[0]) { progress = 0; return; }
  if (y >= keys[keys.length - 1]) { progress = 1; return; }
  for (let i = 1; i < keys.length; i++) {
    if (y <= keys[i]) {
      const f = (y - keys[i - 1]) / (keys[i] - keys[i - 1]);
      progress = (i - 1 + f) / (keys.length - 1);
      return;
    }
  }
}
measure();
readScroll();
addEventListener("scroll", readScroll, { passive: true });
addEventListener("resize", () => { measure(); readScroll(); });

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => {
  pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
  pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

const SEGS = STOPS.length - 1;
const curPos = STOPS[0].cam.clone();
const curLook = STOPS[0].look.clone();
const tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3();
const ease = (t) => t * t * (3 - 2 * t);

function targetFor(p) {
  const s = Math.min(SEGS - 1e-6, p * SEGS);
  const i = Math.floor(s);
  const f = ease(s - i);
  camCurve.getPoint((i + f) / SEGS, tmpPos);
  tmpLook.lerpVectors(STOPS[i].look, STOPS[i + 1].look, f);
}

/* ---------- HUD: RA/DEC + progress ticks + card activation ---------- */
const radecEl = document.getElementById("radec");
const progEl = document.getElementById("prog");
const ticks = [];
for (let i = 0; i <= SEGS; i++) {
  if (i > 0) { const l = document.createElement("span"); l.className = "tickline"; progEl.appendChild(l); }
  const t = document.createElement("span"); t.className = "tick"; progEl.appendChild(t); ticks.push(t);
}
const stopsEls = [...document.querySelectorAll("[data-stop]")];
const dir = new THREE.Vector3();
function pad(n, w = 2) { return String(n).padStart(w, "0"); }
function updateHud() {
  camera.getWorldDirection(dir);
  const az = Math.atan2(dir.x, -dir.z);
  const raH = ((az / (Math.PI * 2)) * 24 + 42) % 24;
  const h = Math.floor(raH), m = Math.floor((raH - h) * 60), s = Math.floor(((raH - h) * 60 - m) * 60);
  const dec = THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, dir.y))));
  const dd = Math.floor(Math.abs(dec)), dm = Math.floor((Math.abs(dec) - dd) * 60);
  if (radecEl) radecEl.innerHTML =
    `RA   <b>${pad(h)}h ${pad(m)}m ${pad(s)}s</b>\nDEC  <b>${dec < 0 ? "−" : "+"}${pad(dd)}° ${pad(dm)}′</b>\nFOV  <b>52°</b> · DRIVE <b>SCROLL</b>`;
  const sIdx = Math.round(progress * SEGS);
  ticks.forEach((t, i) => t.classList.toggle("on", i === sIdx));
  stopsEls.forEach((el) => {
    const stop = Number(el.dataset.stop);
    el.classList.toggle("on", Math.abs(progress * SEGS - stop) < 0.5);
  });
}

/* ---------- spectrographs ---------- */
function wavelengthRGB(l) {
  let r = 0, g = 0, b = 0;
  if (l < 440) { r = -(l - 440) / 60; b = 1; }
  else if (l < 490) { g = (l - 440) / 50; b = 1; }
  else if (l < 510) { g = 1; b = -(l - 510) / 20; }
  else if (l < 580) { r = (l - 510) / 70; g = 1; }
  else if (l < 645) { r = 1; g = -(l - 645) / 65; }
  else { r = 1; }
  return [r * 255, g * 255, b * 255];
}
document.querySelectorAll(".spectro canvas").forEach((cv) => {
  const ctx = cv.getContext("2d");
  const rand = mulberry(Number(cv.dataset.seed));
  const W = cv.width, H = cv.height;
  ctx.fillStyle = "#07090f"; ctx.fillRect(0, 0, W, H);
  // faint continuum
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  for (let i = 0; i <= 10; i++) {
    const [r, g, b] = wavelengthRGB(380 + (i / 10) * 360);
    grad.addColorStop(i / 10, `rgba(${r | 0},${g | 0},${b | 0},0.16)`);
  }
  ctx.fillStyle = grad; ctx.fillRect(0, H * 0.2, W, H * 0.6);
  // emission lines
  const n = 5 + Math.floor(rand() * 6);
  for (let i = 0; i < n; i++) {
    const l = 390 + rand() * 340;
    const x = ((l - 380) / 360) * W;
    const [r, g, b] = wavelengthRGB(l);
    const amp = 0.35 + rand() * 0.65;
    ctx.save();
    ctx.shadowColor = `rgb(${r | 0},${g | 0},${b | 0})`; ctx.shadowBlur = 12 * amp;
    ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.55 + amp * 0.45})`;
    ctx.fillRect(x - 1, H * (0.5 - 0.42 * amp), 2.2, H * 0.84 * amp);
    ctx.restore();
  }
  ctx.strokeStyle = "rgba(139,148,171,0.35)";
  ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();
});

/* ---------- resize & loop ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
addEventListener("resize", resize);

let rafId = 0, running = true;
const clock = new THREE.Clock();
let elapsed = 40; // pleasant static phase for reduced motion

function frame() {
  if (!reduced) elapsed += clock.getDelta();
  starUniforms.uTime.value = elapsed;
  nebUniformsList.forEach((u) => (u.uTime.value = elapsed));

  if (coarse && !reduced) { pointer.tx = Math.sin(elapsed * 0.11) * 0.5; pointer.ty = Math.cos(elapsed * 0.07) * 0.4; }
  pointer.x += (pointer.tx - pointer.x) * 0.035;
  pointer.y += (pointer.ty - pointer.y) * 0.035;

  targetFor(progress);
  const k = reduced ? 1 : 0.065;
  curPos.lerp(tmpPos, k);
  curLook.lerp(tmpLook, k);
  camera.position.copy(curPos);
  const lookJit = tmpLook.clone().add(new THREE.Vector3(pointer.x * 9, -pointer.y * 6, 0));
  camera.lookAt(reduced ? tmpLook : lookJit);

  billboards.forEach((g) => g.children.forEach((p) => p.lookAt(camera.position)));
  updateHud();
  renderer.render(scene, camera);
  if (running) rafId = requestAnimationFrame(frame);
}
rafId = requestAnimationFrame(frame);

/* hide instrument readouts while the footer/mission chrome is on screen */
const footerEl = document.querySelector("footer");
if (footerEl && typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver(
    (es) => es.forEach((e) => document.body.classList.toggle("hud-off", e.isIntersecting)),
    { rootMargin: "0px 0px -10% 0px" }
  ).observe(footerEl);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { running = false; cancelAnimationFrame(rafId); }
  else if (!running) { running = true; clock.getDelta(); rafId = requestAnimationFrame(frame); }
});
