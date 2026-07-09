/* GRIND TYPE FOUNDRY — SPECIMEN No.001 */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fvs = (w, d) => `'wght' ${Math.round(w)}, 'wdth' ${(+d).toFixed(1)}`;
  const pad4 = (n) => String(Math.round(n)).padStart(4, "0");
  const padW = (d) => (+d).toFixed(1).padStart(5, "0");
  const rm = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)").matches;

  /* stepped slam through weight/width extremes — shared by hero + glyphs */
  const SLAM_SEQ = [
    [900, 62], [100, 125], [900, 125], [100, 62],
    [800, 70], [200, 118], [700, 90], [900, 110],
  ];
  function slam(el, ms, onstep, done) {
    let i = 0;
    const id = setInterval(() => {
      const [w, d] = SLAM_SEQ[i];
      el.style.fontVariationSettings = fvs(w, d);
      if (onstep) onstep(w, d, i);
      if (++i >= SLAM_SEQ.length) {
        clearInterval(id);
        if (done) done();
      }
    }, ms);
  }

  /* ============ HERO — breathing wordmark + live axis feed ============ */
  const heroWord = $("#hero-word");
  const roW = $("#ro-wght");
  const roD = $("#ro-wdth");
  let heroVisible = true;
  let heroRaf = 0;
  let slamming = false;
  let heroT0 = performance.now();

  function setHeroReadout(w, d) {
    roW.textContent = `WGHT ${pad4(w)}`;
    roD.textContent = `WDTH ${padW(d)}`;
  }
  function heroFrame(now) {
    heroRaf = 0;
    const t = (now - heroT0) / 1000;
    const w = 500 + 400 * Math.sin((t * Math.PI * 2) / 9.2);
    const d = 93.5 + 31.5 * Math.sin((t * Math.PI * 2) / 13.7 + 1.9);
    heroWord.style.fontVariationSettings = fvs(w, d);
    setHeroReadout(w, d);
    scheduleHero();
  }
  function scheduleHero() {
    if (!heroRaf && heroVisible && !document.hidden && !rm.matches && !slamming) {
      heroRaf = requestAnimationFrame(heroFrame);
    }
  }
  function setHeroStatic() {
    if (heroRaf) { cancelAnimationFrame(heroRaf); heroRaf = 0; }
    heroWord.style.fontVariationSettings = fvs(900, 110);
    setHeroReadout(900, 110);
  }
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    scheduleHero();
  }).observe(heroWord);
  document.addEventListener("visibilitychange", scheduleHero);
  rm.addEventListener("change", () => (rm.matches ? setHeroStatic() : scheduleHero()));
  if (rm.matches) setHeroStatic();
  else scheduleHero();

  heroWord.addEventListener("click", () => {
    if (slamming) return;
    slamming = true;
    if (heroRaf) { cancelAnimationFrame(heroRaf); heroRaf = 0; }
    slam(heroWord, 95, setHeroReadout, () => {
      slamming = false;
      heroT0 = performance.now();
      if (rm.matches) setHeroStatic();
      else scheduleHero();
    });
  });

  /* ============ 02 AXIS PLAYGROUND ============ */
  const preview = $("#preview");
  const axW = $("#ax-wght");
  const axD = $("#ax-wdth");
  const outW = $("#out-wght");
  const outD = $("#out-wdth");
  const prW = $("#pr-wght");
  const prD = $("#pr-wdth");
  const prI = $("#pr-inst");
  const txt = $("#preview-text");
  const presets = $$(".preset");
  let presetTimer = 0;

  function applyAxes() {
    const w = +axW.value;
    const d = +axD.value;
    preview.style.fontVariationSettings = fvs(w, d);
    outW.textContent = pad4(w);
    outD.textContent = padW(d);
    prW.textContent = `WGHT ${pad4(w)}`;
    prD.textContent = `WDTH ${padW(d)}`;
    const named = presets.find((b) => +b.dataset.wght === w && +b.dataset.wdth === d);
    presets.forEach((b) => b.classList.toggle("active", b === named));
    prI.textContent = `INSTANCE: ${named ? named.textContent.trim() : "CUSTOM"}`;
  }
  axW.addEventListener("input", () => { clearInterval(presetTimer); applyAxes(); });
  axD.addEventListener("input", () => { clearInterval(presetTimer); applyAxes(); });
  txt.addEventListener("input", () => {
    preview.textContent = txt.value.trim() || "GRIND";
  });
  presets.forEach((b) =>
    b.addEventListener("click", () => {
      clearInterval(presetTimer);
      const tw = +b.dataset.wght;
      const td = +b.dataset.wdth;
      const fw = +axW.value;
      const fd = +axD.value;
      const steps = rm.matches ? 1 : 6;
      let i = 0;
      presetTimer = setInterval(() => {
        i++;
        axW.value = Math.round(fw + ((tw - fw) * i) / steps);
        axD.value = (fd + ((td - fd) * i) / steps).toFixed(1);
        applyAxes();
        if (i >= steps) clearInterval(presetTimer);
      }, 55);
    })
  );
  applyAxes();

  /* ============ 03 PRESSURE TEST — pointer-reactive waterfall ============ */
  const pressSection = $("#pressure");
  const para = $("#pressure-para");
  const BASE_W = 200;
  const MIN_W = 130;
  const MAX_W = 900;
  const RADIUS = 300;
  para.innerHTML = para.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="pw">${w}</span>`)
    .join(" ");
  const words = $$(".pw", para).map((el) => ({ el, cur: BASE_W, tgt: BASE_W, q: BASE_W }));

  let px = -1e4;
  let py = -1e4;
  let pressRaf = 0;
  let pressVisible = false;
  let pointerOn = false;
  const waveT0 = performance.now();

  function pressFrame(now) {
    pressRaf = 0;
    const wave = !pointerOn && coarse && !rm.matches && pressVisible;
    let cx = px;
    let cy = py;
    if (wave) {
      const r = para.getBoundingClientRect();
      const t = ((now - waveT0) / 5200) % 1;
      cx = r.left + r.width * t;
      cy = r.top + r.height * (0.5 + 0.35 * Math.sin(t * Math.PI * 4));
    }
    /* reads first (single clean layout), then writes */
    if (pointerOn || wave) {
      for (const w of words) {
        const r = w.el.getBoundingClientRect();
        const dx = (r.left + r.right) / 2 - cx;
        const dy = (r.top + r.bottom) / 2 - cy;
        const k = clamp(Math.hypot(dx, dy) / RADIUS, 0, 1);
        w.tgt = MAX_W - k * (MAX_W - MIN_W);
      }
    }
    let live = wave;
    for (const w of words) {
      w.cur += (w.tgt - w.cur) * 0.24;
      if (Math.abs(w.tgt - w.cur) > 0.7) live = true;
      const q = Math.round(w.cur / 6) * 6;
      if (q !== w.q) {
        w.q = q;
        w.el.style.fontVariationSettings = `'wght' ${q}`;
      }
    }
    if (live) schedulePress();
  }
  function schedulePress() {
    if (!pressRaf && pressVisible && !document.hidden) {
      pressRaf = requestAnimationFrame(pressFrame);
    }
  }
  pressSection.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    px = e.clientX;
    py = e.clientY;
    pointerOn = true;
    schedulePress();
  });
  pressSection.addEventListener("pointerleave", () => {
    pointerOn = false;
    for (const w of words) w.tgt = BASE_W;
    schedulePress();
  });
  new IntersectionObserver(([e]) => {
    pressVisible = e.isIntersecting;
    schedulePress();
  }).observe(para);
  document.addEventListener("visibilitychange", schedulePress);

  /* ============ 05 CHARACTER SET — hover flip + grind test ============ */
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const cellsWrap = $("#cells");
  cellsWrap.innerHTML = [...chars]
    .map(
      (c) =>
        `<button type="button" class="cell" aria-label="Run grind test on ${c}">` +
        `<span class="glyph">${c}</span>` +
        `<span class="code" aria-hidden="true">${c.codePointAt(0).toString(16).padStart(4, "0").toUpperCase()}</span>` +
        `</button>`
    )
    .join("");
  $$(".cell", cellsWrap).forEach((cell) => {
    const glyph = $(".glyph", cell);
    const code = $(".code", cell);
    const orig = code.textContent;
    let busy = false;
    cell.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      cell.classList.add("grinding");
      slam(glyph, 80, (w) => { code.textContent = `W ${pad4(w)}`; }, () => {
        cell.classList.remove("grinding");
        glyph.style.fontVariationSettings = "";
        code.textContent = orig;
        busy = false;
      });
    });
  });

  /* ============ 06 LICENSING — the buttons answer back ============ */
  const REPLIES = {
    desk: [
      "RECEIPT №0481 PRINTED. CHECK YOUR OUT-TRAY.",
      "LICENSE STAMPED TWICE. ONCE FOR LUCK.",
      "YOUR DESK IS NOW A PRESS. ACT ACCORDINGLY.",
    ],
    web: [
      "WOFF2 CRATED. FREIGHT LEAVES AT DAWN.",
      "DNS NOTIFIED. YOUR DOMAIN JUST GOT HEAVIER.",
      "EMBEDDED. YOUR PAGE-SPEED SCORE WILL SURVIVE. PROBABLY.",
    ],
    total: [
      "EVERYTHING IS YOURS. THE HANDSHAKE IS IN THE POST.",
      "THE FOUNDRY SALUTES YOU IN 900 WEIGHTS.",
      "TOTAL GRIND CONFIRMED. TELL YOUR SERIF FRIENDS.",
    ],
  };
  const replyCount = {};
  $$(".tier-btn").forEach((btn) => {
    const tier = btn.dataset.tier;
    const reply = $(".tier-reply", btn.closest(".tier"));
    btn.addEventListener("click", () => {
      const n = replyCount[tier] || 0;
      replyCount[tier] = n + 1;
      reply.textContent = REPLIES[tier][n % REPLIES[tier].length];
      reply.classList.add("stamped");
    });
  });

  /* ============ SCROLL REVEALS — chunky steps, staggered ============ */
  const rvs = $$(".rv");
  if (rm.matches) {
    rvs.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    const perSection = new Map();
    rvs.forEach((el) => {
      const s = el.closest("section, footer") || document.body;
      const n = perSection.get(s) || 0;
      el.style.transitionDelay = `${Math.min(n * 70, 420)}ms`;
      perSection.set(s, n + 1);
      io.observe(el);
    });
  }
})();
