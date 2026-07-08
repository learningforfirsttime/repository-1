/* FOLIUM — app.js
   Mounts the generated specimens, runs the growth timelines, presses the
   paper (deckled edges, stains, wax seals) and tends the propagation plate. */

import { makeRng, SPECIES, SPECIES_IDS, generate } from './flora.js';

const NS = 'http://www.w3.org/2000/svg';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const f1 = (n) => Math.round(n * 10) / 10;

/* ---------- easing ---------- */
const outCubic = (t) => 1 - Math.pow(1 - t, 3);
const outBack = (t) => {
  const c = 1.55;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

/* ---------- growth timeline ---------- */
function mountPlant(svg, plan) {
  svg.setAttribute('viewBox', `0 0 ${plan.w} ${plan.h}`);
  svg.classList.remove('grown');
  const root = document.createElementNS(NS, 'g');
  const anim = [];
  for (const p of plan.parts) {
    if (p.kind === 'stem') {
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('d', p.d);
      el.setAttribute('class', p.cls);
      el.setAttribute('stroke-width', p.w);
      root.appendChild(el);
      anim.push({ type: 'stem', el, len: 0, birth: p.birth, dur: p.dur });
    } else {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', p.cls || 'organ');
      g.innerHTML = p.html;
      const from = p.rotFrom ?? p.angle;
      g.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${from}) scale(0.001)`);
      root.appendChild(g);
      anim.push({ type: 'organ', el: g, x: p.x, y: p.y, angle: p.angle, rotFrom: from, scale: p.scale ?? 1, birth: p.birth, dur: p.dur });
    }
  }
  svg.appendChild(root);
  /* measure stems once mounted */
  for (const a of anim) {
    if (a.type !== 'stem') continue;
    a.len = a.el.getTotalLength();
    a.el.style.strokeDasharray = a.len;
    a.el.style.strokeDashoffset = a.len;
  }

  let raf = 0;
  function apply(t) {
    for (const a of anim) {
      const lt = Math.min(1, Math.max(0, (t - a.birth) / a.dur));
      if (a.type === 'stem') {
        a.el.style.strokeDashoffset = a.len * (1 - outCubic(lt));
      } else {
        if (lt <= 0) continue;
        const s = Math.max(0.001, a.scale * outBack(lt));
        const rot = a.rotFrom + (a.angle - a.rotFrom) * outCubic(lt);
        a.el.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${f1(rot)}) scale(${f1(s * 1000) / 1000})`);
      }
    }
  }
  const done = () => svg.classList.add('grown');
  return {
    grow(ms) {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        apply(p * plan.maxT);
        if (p < 1) raf = requestAnimationFrame(tick);
        else done();
      };
      raf = requestAnimationFrame(tick);
    },
    finish() {
      cancelAnimationFrame(raf);
      apply(plan.maxT + 1);
      done();
    },
    destroy() {
      cancelAnimationFrame(raf);
      root.remove();
    },
  };
}

/* ---------- deckled paper ---------- */
function pressPaper(fig, seedOffset) {
  const svg = fig.querySelector('.paper');
  const sheet = fig.querySelector('.sheet');
  if (!svg || !sheet) return;
  const w = sheet.offsetWidth, h = sheet.offsetHeight;
  if (!w || !h) return;
  const rng = makeRng((seedOffset >>> 0) + 101);
  const m = 2.5, step = 15;
  const jit = () => rng.range(-2.1, 2.1);
  const pts = [];
  for (let x = m; x < w - m; x += step) pts.push([x, m + jit()]);
  for (let y = m; y < h - m; y += step) pts.push([w - m + jit(), y]);
  for (let x = w - m; x > m; x -= step) pts.push([x, h - m + jit()]);
  for (let y = h - m; y > m; y -= step) pts.push([m + jit(), y]);
  const d = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' Z';
  let inner = `<path d="${d}" transform="translate(.4 1.6)" fill="rgba(96,78,42,.25)"/>`;
  inner += `<path d="${d}" fill="var(--plate)" stroke="var(--plate-edge)" stroke-width="1"/>`;
  /* a faint age stain, sometimes */
  if (rng.chance(.65)) {
    const sx = rng.range(w * .15, w * .85), sy = rng.range(h * .12, h * .55);
    const rx = rng.range(22, 48);
    inner += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(rx)}" ry="${f1(rx * rng.range(.55, .8))}" fill="rgba(158,124,58,${rng.range(.018, .035).toFixed(3)})" transform="rotate(${f1(rng.range(-40, 40))} ${f1(sx)} ${f1(sy)})"/>`;
    inner += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(rx * .8)}" ry="${f1(rx * .55)}" fill="rgba(158,124,58,${rng.range(.012, .025).toFixed(3)})"/>`;
  }
  /* ruled frame */
  inner += `<rect x="11.5" y="11.5" width="${w - 23}" height="${h - 23}" fill="none" stroke="rgba(42,44,31,.3)" stroke-width="1"/>`;
  inner += `<rect x="15.5" y="15.5" width="${w - 31}" height="${h - 31}" fill="none" stroke="rgba(42,44,31,.14)" stroke-width="1"/>`;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = inner;
}

/* ---------- wax seal ---------- */
function pressSeal(svg, seed) {
  if (!svg) return;
  const rng = makeRng((seed >>> 0) + 77);
  const cx = 36, cy = 36, n = 15;
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = 25 + rng.range(-3.2, 3.2) + (k % 2 ? 1.4 : 0);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  let d = `M${f1((pts[0][0] + pts[n - 1][0]) / 2)} ${f1((pts[0][1] + pts[n - 1][1]) / 2)}`;
  for (let k = 0; k < n; k++) {
    const nxt = pts[(k + 1) % n];
    d += ` Q ${f1(pts[k][0])} ${f1(pts[k][1])}, ${f1((pts[k][0] + nxt[0]) / 2)} ${f1((pts[k][1] + nxt[1]) / 2)}`;
  }
  d += ' Z';
  const gid = 'sg' + (seed >>> 0);
  let inner = `<defs><radialGradient id="${gid}" cx="42%" cy="38%" r="72%">`
    + `<stop offset="0%" stop-color="#B25036"/><stop offset="55%" stop-color="#9E3A26"/><stop offset="100%" stop-color="#7A2818"/>`
    + `</radialGradient></defs>`;
  /* a drip or two */
  for (let i = 0; i < rng.int(1, 2); i++) {
    const a = rng.range(0, 360) * Math.PI / 180;
    const r = rng.range(24, 28);
    inner += `<circle cx="${f1(cx + Math.cos(a) * r)}" cy="${f1(cy + Math.sin(a) * r)}" r="${f1(rng.range(2.6, 4.6))}" fill="url(#${gid})"/>`;
  }
  inner += `<path d="${d}" fill="url(#${gid})"/>`;
  inner += `<circle cx="${cx}" cy="${cy}" r="17.5" fill="none" stroke="rgba(255,230,210,.34)" stroke-width="1.3"/>`;
  inner += `<circle cx="${cx}" cy="${cy}" r="20.5" fill="none" stroke="rgba(58,16,8,.3)" stroke-width="1"/>`;
  inner += `<text x="${cx}" y="${cy + 8.5}" text-anchor="middle" font-family="Instrument Serif, serif" font-size="25" fill="rgba(58,14,6,.78)">F</text>`;
  inner += `<ellipse cx="28" cy="25" rx="10" ry="4.6" fill="rgba(255,245,230,.16)" transform="rotate(-28 28 25)"/>`;
  svg.innerHTML = inner;
}

/* ---------- the seven fixed plates ---------- */
const plates = [...document.querySelectorAll('.plate[data-species]')];
const grew = new WeakSet();

for (const fig of plates) {
  const svg = fig.querySelector('.plant');
  const seed = +fig.dataset.seed || 1;
  const plan = generate(fig.dataset.species, seed);
  fig._ctl = mountPlant(svg, plan);
  const pc = fig.querySelector('[data-parts]');
  if (pc) pc.textContent = plan.parts.length;
  pressPaper(fig, seed);
  pressSeal(fig.querySelector('[data-seal]'), seed);
}

/* propagation plate paper + seal too */
const sowFig = document.getElementById('tab-sow');
if (sowFig) pressPaper(sowFig, 424242);

function triggerGrowth(fig) {
  if (grew.has(fig) || !fig._ctl) return;
  grew.add(fig);
  if (reduced) { fig._ctl.finish(); return; }
  const delay = +fig.dataset.delay || 0;
  const ms = +fig.dataset.ms || 3800;
  setTimeout(() => fig._ctl.grow(ms), delay);
}

if (reduced) {
  for (const fig of plates) triggerGrowth(fig);
} else {
  const hero = document.getElementById('tab-1');
  if (hero) setTimeout(() => triggerGrowth(hero), 420);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      triggerGrowth(e.target);
    }
  }, { threshold: 0.26 });
  for (const fig of plates) { if (fig !== hero) io.observe(fig); }
}

/* re-press paper on resize (deckle is drawn at rendered size) */
let rw = window.innerWidth;
let rt = 0;
window.addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
    if (Math.abs(window.innerWidth - rw) < 12) return;
    rw = window.innerWidth;
    for (const fig of plates) pressPaper(fig, +fig.dataset.seed || 1);
    if (sowFig) pressPaper(sowFig, 424242);
  }, 250);
});

/* ---------- text reveals ---------- */
const reveals = [...document.querySelectorAll('.reveal')];
if (reduced) {
  reveals.forEach((el) => el.classList.add('in'));
} else {
  const io2 = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io2.unobserve(e.target);
    }
  }, { threshold: 0.14 });
  reveals.forEach((el) => io2.observe(el));
}

/* ---------- the propagation plate ---------- */
const GEN_A = ['Flor', 'Aster', 'Petal', 'Umbr', 'Silv', 'Verid', 'Camp', 'Foli', 'Calam', 'Thal', 'Lun', 'Seri', 'Ram', 'Vern', 'Gemm'];
const GEN_B = ['ulina', 'ella', 'idia', 'aria', 'opsis', 'ula', 'anthe', 'ix', 'osa', 'ago', 'etta', 'una'];
const EPITHETS = ['sylvatica', 'pendula', 'cerifera', 'stellata', 'algorithmica', 'parametrica', 'tenuis', 'hiemalis', 'errans', 'seminata', 'recursiva', 'paludosa', 'borealis', 'fasciculata', 'stochastica', 'iterata', 'candelaris', 'declinata'];
const AUTHORS = ['Claud.', 'Fn.', 'Hartw.', 'E.Whit.', 'M.Reed', 'Voss', 'S.Harr.'];
const FAMILIES = {
  fern: 'Filices algorithmicae', grass: 'Gramina machinalia', daisy: 'Compositae fictae',
  umbel: 'Umbellatae parametricae', bell: 'Campanulatae seriatae', vine: 'Volubiles recursivae',
  allium: 'Liliaceae computatae',
};
const VERNACULAR = {
  fern: 'a fern, freshly walked to', grass: 'an oat-grass, freshly walked to',
  daisy: 'a starwort, freshly walked to', umbel: 'an umbellifer, freshly walked to',
  bell: 'a bellflower, freshly walked to', vine: 'a twining vine, freshly walked to',
  allium: 'a globe-leek, freshly walked to',
};
const TRAVERSES = ['first', 'second', 'third', 'fourth', 'seventh'];

const sowPlant = document.getElementById('sow-plant');
const sowBtn = document.getElementById('sow-btn');
const sowSeedBtn = document.getElementById('sow-seed');
const sowHistory = document.getElementById('sow-history');
const sowStatus = document.getElementById('sow-status');
let sowCtl = null;
let sowSeed = 0;
const history = [];

function sow(seed, { announce = true } = {}) {
  if (!sowPlant) return;
  seed = seed ?? (1 + Math.floor(Math.random() * 98999));
  sowSeed = seed;
  const rng = makeRng(seed);
  /* naming first, then growth — same rng, fixed order, fully deterministic */
  const id = rng.pick(SPECIES_IDS);
  const genus = rng.pick(GEN_A) + rng.pick(GEN_B);
  const epithet = rng.pick(EPITHETS);
  const author = rng.pick(AUTHORS);
  const q = rng.int(1, 8), r = rng.int(1, 12);
  const traverse = rng.pick(TRAVERSES);
  const plan = SPECIES[id](rng);

  if (sowCtl) sowCtl.destroy();
  sowCtl = mountPlant(sowPlant, plan);
  sowPlant.setAttribute('class', 'plant sp-' + id);
  if (reduced) sowCtl.finish(); else sowCtl.grow(3800);

  const acc = 'fol-s-' + String(seed).padStart(5, '0');
  const name = `${genus} ${epithet}`;
  document.getElementById('sow-acc').textContent = acc;
  document.getElementById('sow-name').innerHTML = `<em>${name}</em> <span class="auth">${author}</span> · sp. nov.`;
  document.getElementById('sow-fam').textContent = FAMILIES[id];
  document.getElementById('sow-loc').textContent = `Loc. — parameter space, quadrant ${q}·${r}, ${traverse} traverse`;
  document.getElementById('sow-vern').textContent = VERNACULAR[id] + '.';
  sowSeedBtn.textContent = String(seed).padStart(5, '0');
  const pc = sowFig.querySelector('[data-parts]');
  if (pc) pc.textContent = plan.parts.length;
  pressSeal(sowFig.querySelector('[data-seal]'), seed);
  if (announce && sowStatus) sowStatus.textContent = `Sown: ${name} ${author}, accession ${acc}, ${plan.parts.length} parts.`;

  /* history chips */
  if (!history.some((h) => h.seed === seed)) {
    history.unshift({ seed, name });
    if (history.length > 5) history.pop();
    sowHistory.innerHTML = '';
    for (const h of history) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = `№ ${String(h.seed).padStart(5, '0')} · ${h.name}`;
      b.title = 'Regrow this accession';
      b.addEventListener('click', () => sow(h.seed));
      sowHistory.appendChild(b);
    }
  }
}

if (sowBtn) {
  sowBtn.addEventListener('click', () => sow());
  sowSeedBtn.addEventListener('click', () => sow(sowSeed));
  /* first sowing: deterministic and handsome, grown when scrolled into view */
  if (reduced) {
    sow(4831, { announce: false });
  } else {
    const io3 = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io3.disconnect();
        sow(4831, { announce: false });
      }
    }, { threshold: 0.22 });
    io3.observe(sowFig);
  }
}

/* ---------- the closing CTA ---------- */
const reqBtn = document.getElementById('req-btn');
const reqReply = document.getElementById('req-reply');
if (reqBtn) {
  const replies = [
    'The porter has entered your name in the ledger. Fasciculus II will open in its season; seeds are notoriously punctual.',
    'Noted a second time — eagerness becomes a botanist. The ledger, however, holds one line per reader.',
    'The porter begs you to take a turn about the plates while you wait. He recommends Tabula IV in a north light.',
  ];
  let clicks = 0;
  reqBtn.addEventListener('click', () => {
    reqReply.textContent = replies[Math.min(clicks, replies.length - 1)];
    clicks++;
  });
}
