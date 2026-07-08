/* SOUNDING — a descent. One fixed canvas paints the water column;
   every creature is procedural. No images, no network. */
(() => {
  "use strict";

  const canvas = document.getElementById("sea");
  const ctx = canvas.getContext("2d");
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COARSE = matchMedia("(pointer: coarse)").matches;
  const MAXD = 10935;

  let vw = 0, vh = 0, dpr = 1, docH = 0, maxScroll = 1;
  let scrollY = 0;

  /* ---------------- depth mapping ---------------- */

  // piecewise-linear interpolation over sorted [x, y] points
  function pw(pts, x) {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x < pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return pts[pts.length - 1][1];
  }

  let docMap = [[0, 0]], scrollMap = [[0, 0]], invDocMap = [[0, 0]];
  let bands = null; // pixel ranges per zone

  const topOf = (id) => document.getElementById(id).offsetTop;

  function buildMaps() {
    docH = document.documentElement.scrollHeight;
    maxScroll = Math.max(1, docH - vh);
    const m = topOf("z-meso"), b = topOf("z-bathy"),
          a = topOf("z-abysso"), h = topOf("z-hadal");
    docMap = [[0, 0], [m, 200], [b, 1000], [a, 4000], [h, 6000], [docH, 11600]];
    const lead = vh * 0.45;
    scrollMap = [[0, 0], [m - lead, 200], [b - lead, 1000],
                 [a - lead, 4000], [h - lead, 6000], [maxScroll, MAXD]];
    invDocMap = docMap.map(([y, d]) => [d, y]);
    bands = { epi: [0, m], meso: [m, b], bathy: [b, a], abysso: [a, h], hadal: [h, docH] };
  }

  const depthAtDoc = (y) => pw(docMap, y);
  const gaugeDepth = (s) => pw(scrollMap, s);
  const docYAtDepth = (d) => pw(invDocMap, d);

  /* ---------------- color ramp ---------------- */

  const STOPS = [
    [0, 0x86, 0xD9, 0xEA], [90, 0x55, 0xBC, 0xD6], [200, 0x2E, 0x8F, 0xAE],
    [450, 0x1D, 0x6E, 0x8C], [800, 0x17, 0x5E, 0x7A], [1400, 0x0E, 0x3A, 0x55],
    [2600, 0x0A, 0x22, 0x38], [4200, 0x06, 0x16, 0x27], [6200, 0x04, 0x10, 0x1E],
    [8500, 0x02, 0x0A, 0x12], [11600, 0x01, 0x06, 0x09],
  ].map(([d, r, g, b]) => [d, Math.pow(r / 255, 2.2), Math.pow(g / 255, 2.2), Math.pow(b / 255, 2.2)]);

  function colorAtDepth(d) {
    let i = 1;
    while (i < STOPS.length - 1 && STOPS[i][0] < d) i++;
    const s0 = STOPS[i - 1], s1 = STOPS[i];
    const t = Math.min(1, Math.max(0, (d - s0[0]) / (s1[0] - s0[0])));
    const ch = (k) => Math.round(Math.pow(s0[k] + (s1[k] - s0[k]) * t, 1 / 2.2) * 255);
    return `rgb(${ch(1)},${ch(2)},${ch(3)})`;
  }

  /* ---------------- deterministic RNG ---------------- */

  function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const mod = (n, m) => ((n % m) + m) % m;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- populations ---------------- */

  let bubbles = [], fishes = [], jellies = [], snow = [], hidden = [];
  let flashes = [], pings = [], riseBubbles = [];

  function populate() {
    const r = mulberry(190735);

    bubbles = [];
    for (let i = 0; i < 24; i++) {
      bubbles.push({
        fx: r() * 1.06 - 0.03,
        y: 40 + r() * (bands.meso[0] * 0.85),
        rad: 1.4 + r() * 3.2,
        sp: 16 + r() * 30,
        ph: r() * 6.28,
      });
    }

    // fish school — static "composed" arrangement doubles as the reduced-motion pose
    fishes = [];
    const [m0, m1] = bands.meso;
    const bandC = m0 + (m1 - m0) * 0.42;
    for (let i = 0; i < 34; i++) {
      const row = Math.floor(i / 9), col = i % 9;
      fishes.push({
        x: vw * 0.16 + col * (vw * 0.075) + (r() - 0.5) * 46,
        y: bandC + row * 54 + (r() - 0.5) * 60,
        vx: 34 + r() * 10, vy: (r() - 0.5) * 6,
        s: 9 + r() * 8,
      });
    }

    jellies = [];
    const [b0, b1] = bands.bathy;
    for (let i = 0; i < 6; i++) {
      jellies.push({
        fx: 0.1 + r() * 0.8,
        yBase: b0 + (0.12 + 0.76 * (i / 5)) * (b1 - b0) + (r() - 0.5) * 120,
        ph: r() * 6.28,
        s: 24 + r() * 26,
      });
    }

    snow = [];
    for (let i = 0; i < 150; i++) {
      snow.push({ fx: r(), fy: r(), z: 0.3 + r() * 0.85, ph: r() * 6.28 });
    }

    // hidden creatures — always swimming, alpha 0 until pinged
    hidden = [];
    const darkTop = bands.meso[0] + vh * 0.8;
    const darkBot = docH - vh * 1.3;
    const types = ["hatchet", "squid", "eel", "sipho"];
    for (let i = 0; i < 22; i++) {
      hidden.push({
        type: types[i % 4],
        x: (0.08 + r() * 0.84) * vw,
        y: darkTop + ((i + r() * 0.8) / 22) * (darkBot - darkTop),
        s: 0.65 + r() * 0.8,
        dir: r() > 0.5 ? 1 : -1,
        ph: r() * 6.28,
        drift: 4 + r() * 10,
        reveal: 0,
      });
    }
  }

  /* ---------------- depth hairlines ---------------- */

  function buildDepthlines() {
    const holder = document.getElementById("depthlines");
    holder.innerHTML = "";
    holder.style.height = docH + "px";
    for (let d = 1000; d <= 10000; d += 1000) {
      const y = docYAtDepth(d);
      const line = document.createElement("i");
      line.className = "dl";
      line.style.top = y + "px";
      const lab = document.createElement("span");
      lab.textContent = `${d.toLocaleString("en-US")} m · ${Math.round(1 + d / 9.95).toLocaleString("en-US")} atm`;
      line.appendChild(lab);
      holder.appendChild(line);
    }
  }

  /* ---------------- gauge ---------------- */

  const gDepth = document.querySelector(".g-depth");
  const gZone = document.querySelector(".g-zone");
  const gPress = document.querySelector(".g-press");
  const gTemp = document.querySelector(".g-temp");
  const gDot = document.querySelector(".g-dot");
  const gRail = document.querySelector(".g-rail");
  const hint = document.getElementById("pinghint");

  const ZONES = [[200, "EPIPELAGIC"], [1000, "MESOPELAGIC"], [4000, "BATHYPELAGIC"],
                 [6000, "ABYSSOPELAGIC"], [Infinity, "HADAL"]];
  let curZone = "EPIPELAGIC", lastShownDepth = -1, pingedEver = false, hintOn = false;

  function buildRailTicks() {
    gRail.querySelectorAll(".zt").forEach((n) => n.remove());
    for (let i = 1; i < scrollMap.length - 1; i++) {
      const t = document.createElement("i");
      t.className = "zt";
      t.style.top = (scrollMap[i][0] / maxScroll) * 100 + "%";
      gRail.appendChild(t);
    }
  }

  function updateGauge() {
    const d = Math.round(gaugeDepth(scrollY));
    if (d !== lastShownDepth) {
      lastShownDepth = d;
      gDepth.textContent = d.toLocaleString("en-US");
      gPress.textContent = Math.round(1 + d / 9.95).toLocaleString("en-US") + " atm";
      const t = 2.1 + 19.7 * Math.exp(-d / 310);
      gTemp.textContent = t.toFixed(1) + " °C";
      let zn = ZONES[0][1];
      for (const [lim, name] of ZONES) { if (d < lim) { zn = name; break; } }
      if (zn !== curZone) {
        curZone = zn;
        gZone.textContent = zn;
        gZone.classList.remove("tick");
        void gZone.offsetWidth;
        gZone.classList.add("tick");
      }
      document.body.classList.toggle("lit", d < 420);
      gDot.style.top = clamp(scrollY / maxScroll, 0, 1) * 100 + "%";

      if (!pingedEver && !hintOn && d > 950) { hintOn = true; hint.classList.add("show"); }
      if (hintOn && !pingedEver && d < 420) { hintOn = false; hint.classList.remove("show"); }
    }
  }

  /* ---------------- drawing helpers ---------------- */

  function strokeGlow(path, alpha, hue) {
    ctx.strokeStyle = `rgba(${hue},${alpha * 0.22})`;
    ctx.lineWidth = 4.5;
    ctx.stroke(path);
    ctx.strokeStyle = `rgba(${hue},${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke(path);
  }
  const CYAN = "150,228,255";
  const TEAL = "143,242,224";

  /* --- surface: gradient, god rays, caustics, bubbles --- */

  function drawGradient() {
    const g = ctx.createLinearGradient(0, 0, 0, vh);
    for (let k = 0; k <= 4; k++) {
      g.addColorStop(k / 4, colorAtDepth(depthAtDoc(scrollY + (vh * k) / 4)));
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);
  }

  function drawRays(t) {
    const fade = clamp(1 - depthAtDoc(scrollY) / 260, 0, 1);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const bx = ((i + 0.5) / 7) * vw + Math.sin(i * 3.7) * 40;
      const ang = (i - 3) * 0.1 + Math.sin(t * 0.13 + i * 1.7) * 0.055;
      const w = 46 + (i % 3) * 34;
      ctx.save();
      ctx.translate(bx, -60 - scrollY * 0.72);
      ctx.rotate(ang);
      const lg = ctx.createLinearGradient(0, 0, 0, vh * 1.5);
      const a = fade * (0.10 + 0.05 * Math.sin(t * 0.21 + i * 2.6));
      lg.addColorStop(0, `rgba(235,252,255,${a})`);
      lg.addColorStop(1, "rgba(235,252,255,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(-w / 2, 0, w, vh * 1.5);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCaustics(t) {
    const fade = clamp(1 - depthAtDoc(scrollY) / 180, 0, 1);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1.1;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      for (let x = -20; x <= vw + 20; x += 26) {
        const y = 70 + k * 64 +
          Math.sin(x * 0.021 + t * 0.9 + k * 2.1) * 11 +
          Math.sin(x * 0.047 - t * 0.66 + k) * 7 - scrollY;
        x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(225,250,255,${fade * (0.10 - k * 0.018)})`;
      ctx.stroke();
    }
    // surface shimmer line
    const sy = 6 - scrollY;
    if (sy > -4) {
      ctx.strokeStyle = `rgba(255,255,255,${fade * 0.5})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let x = 0; x <= vw; x += 18) {
        const y = sy + Math.sin(x * 0.03 + t * 1.4) * 2.4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBubbles(t, dt) {
    for (const b of bubbles) {
      if (dt > 0) {
        b.y -= b.sp * dt;
        if (b.y < 18) { b.y = bands.meso[0] * (0.55 + Math.random() * 0.35); b.fx = Math.random(); }
      }
      const sy = b.y - scrollY;
      if (sy < -20 || sy > vh + 20) continue;
      const sx = b.fx * vw + Math.sin(t * 1.1 + b.ph) * 7;
      const a = clamp(1 - b.y / (bands.meso[0] * 0.95), 0.08, 0.6);
      ctx.strokeStyle = `rgba(240,252,255,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, b.rad, 0, 6.2832);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`;
      ctx.beginPath();
      ctx.arc(sx - b.rad * 0.35, sy - b.rad * 0.35, b.rad * 0.22, 0, 6.2832);
      ctx.fill();
    }
  }

  /* --- twilight: fish school (boids) --- */

  function stepFish(dt) {
    const [m0, m1] = bands.meso;
    const cy = m0 + (m1 - m0) * 0.42, half = (m1 - m0) * 0.22;
    for (let i = 0; i < fishes.length; i++) {
      const f = fishes[i];
      let ax = 0, ay = 0, cxx = 0, cyy = 0, avx = 0, avy = 0, n = 0;
      for (let j = 0; j < fishes.length; j++) {
        if (i === j) continue;
        const o = fishes[j];
        const dx = o.x - f.x, dy = o.y - f.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 4900) {
          n++;
          cxx += o.x; cyy += o.y; avx += o.vx; avy += o.vy;
          if (d2 < 700 && d2 > 0.01) { ax -= dx / d2 * 60; ay -= dy / d2 * 60; }
        }
      }
      if (n > 0) {
        ax += ((cxx / n) - f.x) * 0.6 + ((avx / n) - f.vx) * 1.6;
        ay += ((cyy / n) - f.y) * 0.6 + ((avy / n) - f.vy) * 1.6;
      }
      ay += clamp((cy - f.y) / half, -1, 1) * 26; // stay in the band
      f.vx += ax * dt; f.vy += ay * dt;
      const sp = Math.hypot(f.vx, f.vy) || 1;
      const want = clamp(sp, 26, 62);
      f.vx = (f.vx / sp) * want; f.vy = (f.vy / sp) * want;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < -90) f.x = vw + 80;
      if (f.x > vw + 90) f.x = -80;
    }
  }

  function drawFish() {
    const [m0, m1] = bands.meso;
    for (const f of fishes) {
      const sy = f.y - scrollY;
      if (sy < -40 || sy > vh + 40) continue;
      const edge = clamp((f.y - m0) / 300, 0, 1) * clamp((m1 - f.y) / 300, 0, 1);
      ctx.save();
      ctx.translate(f.x, sy);
      ctx.rotate(Math.atan2(f.vy, f.vx));
      const s = f.s;
      ctx.fillStyle = `rgba(5,16,26,${0.75 * (0.35 + 0.65 * edge)})`;
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.quadraticCurveTo(s * 0.25, -s * 0.36, -s * 0.55, -s * 0.1);
      ctx.lineTo(-s * 0.95, -s * 0.32);
      ctx.lineTo(-s * 0.72, 0);
      ctx.lineTo(-s * 0.95, s * 0.32);
      ctx.lineTo(-s * 0.55, s * 0.1);
      ctx.quadraticCurveTo(s * 0.25, s * 0.36, s, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  /* --- midnight: jellyfish --- */

  function drawJellies(t) {
    for (const j of jellies) {
      const rise = mod(t * 5 + j.ph * 40, 300);
      const yw = j.yBase - rise + 150;
      const sy = yw - scrollY;
      if (sy < -140 || sy > vh + 140) continue;
      const sx = j.fx * vw + Math.sin(t * 0.4 + j.ph) * 26;
      const pul = (Math.sin(t * 1.5 + j.ph) + 1) / 2; // 0 relaxed → 1 contracted
      const s = j.s;
      const wid = s * (1.16 - 0.3 * pul);
      const hgt = s * (0.95 + 0.4 * pul);
      ctx.save();
      ctx.translate(sx, sy);
      // glow
      const rg = ctx.createRadialGradient(0, -hgt * 0.3, 2, 0, -hgt * 0.3, s * 2.4);
      rg.addColorStop(0, "rgba(150,214,255,0.14)");
      rg.addColorStop(1, "rgba(150,214,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(-s * 2.4, -hgt * 0.3 - s * 2.4, s * 4.8, s * 4.8);
      // bell
      ctx.beginPath();
      ctx.moveTo(-wid, 0);
      ctx.bezierCurveTo(-wid * 1.02, -hgt, wid * 1.02, -hgt, wid, 0);
      ctx.quadraticCurveTo(wid * 0.5, -s * 0.18, 0, -s * 0.1);
      ctx.quadraticCurveTo(-wid * 0.5, -s * 0.18, -wid, 0);
      const bg = ctx.createLinearGradient(0, -hgt, 0, 0);
      bg.addColorStop(0, "rgba(168,224,255,0.20)");
      bg.addColorStop(1, "rgba(168,224,255,0.045)");
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = "rgba(178,230,255,0.38)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // tentacles
      ctx.lineWidth = 0.8;
      for (let k = 0; k < 6; k++) {
        const tx = -wid * 0.8 + (k / 5) * wid * 1.6;
        const sway = Math.sin(t * 1.9 + j.ph + k * 1.3) * s * 0.28;
        const len = s * (1.5 + (k % 3) * 0.5) * (1 - 0.25 * pul);
        ctx.strokeStyle = `rgba(168,224,255,${0.24 - k * 0.014})`;
        ctx.beginPath();
        ctx.moveTo(tx, -s * 0.06);
        ctx.quadraticCurveTo(tx + sway, len * 0.55, tx + sway * 1.7, len);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* --- marine snow (stateless: pure function of t + scroll) --- */

  function drawSnow(t) {
    const d = gaugeDepth(scrollY);
    const f = clamp((d - 150) / 3600, 0, 1);
    const count = Math.floor(snow.length * f);
    if (count <= 0) return;
    const H = vh + 40;
    for (let i = 0; i < count; i++) {
      const p = snow[i];
      const yy = mod(p.fy * H + t * p.z * 11 - scrollY * p.z * 0.36, H) - 20;
      const xx = mod(p.fx * vw + Math.sin(t * 0.25 + p.ph) * 9 * p.z, vw);
      const a = (0.06 + 0.3 * p.z) * (0.35 + 0.65 * f);
      ctx.fillStyle = `rgba(214,236,246,${a})`;
      const r = 0.6 + p.z * 1.15;
      ctx.fillRect(xx, yy, r, r);
    }
  }

  /* --- abyss: bioluminescent flashes --- */

  function stepFlashes(dt) {
    const [a0, a1] = bands.abysso;
    const visTop = scrollY, visBot = scrollY + vh;
    if (visBot > a0 - 200 && visTop < a1 + 400 && flashes.length < 7 && Math.random() < dt * 0.55) {
      const lo = Math.max(a0 - 100, visTop), hi = Math.min(a1 + 300, visBot);
      if (hi > lo) {
        flashes.push({
          x: Math.random() * vw,
          y: lo + Math.random() * (hi - lo),
          t: 0, dur: 2.2 + Math.random() * 2.1,
        });
      }
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t += dt;
      if (flashes[i].t > flashes[i].dur) flashes.splice(i, 1);
    }
  }

  function drawFlashes() {
    if (!flashes.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const fl of flashes) {
      const sy = fl.y - scrollY;
      if (sy < -60 || sy > vh + 60) continue;
      const k = fl.t / fl.dur;
      const a = Math.sin(Math.PI * k);
      const rad = 7 + 38 * k;
      const g = ctx.createRadialGradient(fl.x, sy, 0, fl.x, sy, rad);
      g.addColorStop(0, `rgba(158,246,224,${a * 0.5})`);
      g.addColorStop(0.35, `rgba(130,226,214,${a * 0.16})`);
      g.addColorStop(1, "rgba(130,226,214,0)");
      ctx.fillStyle = g;
      ctx.fillRect(fl.x - rad, sy - rad, rad * 2, rad * 2);
      ctx.fillStyle = `rgba(230,255,248,${a * 0.75})`;
      ctx.beginPath();
      ctx.arc(fl.x, sy, 1.4, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  /* --- hidden creatures (revealed by sonar) --- */

  function hiddenPath(c, t) {
    const p = new Path2D();
    const s = c.s;
    const wob = RM ? 0 : Math.sin(t * 1.2 + c.ph);
    if (c.type === "hatchet") {
      const w = 46 * s, h = 60 * s;
      p.moveTo(-w * 0.5, 0);
      p.quadraticCurveTo(-w * 0.1, -h * 0.62, w * 0.42, -h * 0.1);
      p.lineTo(w * 0.62, -h * 0.2);
      p.lineTo(w * 0.62, h * 0.08);
      p.lineTo(w * 0.42, 0);
      p.quadraticCurveTo(w * 0.05, h * 0.66, -w * 0.5, 0);
      p.moveTo(-w * 0.3, -h * 0.06);
      p.arc(-w * 0.3, -h * 0.06, 3.4 * s, 0, 6.2832);
    } else if (c.type === "squid") {
      const L = 120 * s;
      p.moveTo(-L * 0.62, 0);
      p.quadraticCurveTo(-L * 0.2, -L * 0.13, L * 0.16, -L * 0.085);
      p.quadraticCurveTo(L * 0.28, 0, L * 0.16, L * 0.085);
      p.quadraticCurveTo(-L * 0.2, L * 0.13, -L * 0.62, 0);
      p.moveTo(-L * 0.62, 0);
      p.quadraticCurveTo(-L * 0.5, -L * 0.16, -L * 0.34, -L * 0.05);
      p.moveTo(-L * 0.62, 0);
      p.quadraticCurveTo(-L * 0.5, L * 0.16, -L * 0.34, L * 0.05);
      for (let k = 0; k < 5; k++) {
        const ang = -0.5 + k * 0.25;
        p.moveTo(L * 0.2, 0);
        p.quadraticCurveTo(L * 0.38, ang * L * 0.24,
          L * (0.5 + (k % 2) * 0.1), ang * L * 0.36 + wob * 6);
      }
      p.moveTo(L * 0.2, 0);
      p.quadraticCurveTo(L * 0.5, L * 0.12, L * 0.78, L * 0.1 + wob * 8);
      p.moveTo(L * 0.09, -L * 0.045);
      p.arc(L * 0.09, -L * 0.045, 3.2 * s, 0, 6.2832);
    } else if (c.type === "eel") {
      const L = 200 * s;
      p.moveTo(-L * 0.5, 0);
      for (let x = -L * 0.5; x <= L * 0.42; x += L * 0.045) {
        p.lineTo(x, Math.sin(x * 0.045 / s + (RM ? c.ph : t * 2 + c.ph)) * 11 * s * (0.4 + (x + L * 0.5) / L));
      }
      // pelican jaw
      p.moveTo(-L * 0.5, 0);
      p.quadraticCurveTo(-L * 0.66, -8 * s, -L * 0.72, -2 * s);
      p.moveTo(-L * 0.5, 0);
      p.quadraticCurveTo(-L * 0.72, 22 * s, -L * 0.56, 6 * s);
    } else { // siphonophore — a drifting chain of bells
      const L = 170 * s;
      let px = -L * 0.5, py = 0;
      p.moveTo(px, py);
      for (let k = 1; k <= 12; k++) {
        const nx = -L * 0.5 + (k / 12) * L;
        const ny = Math.sin(k * 0.9 + c.ph + wob * 0.5) * 14 * s;
        p.quadraticCurveTo((px + nx) / 2, (py + ny) / 2 - 4, nx, ny);
        p.moveTo(nx + 3 * s, ny);
        p.arc(nx, ny, 3 * s + (k % 3), 0, 6.2832);
        p.moveTo(nx, ny);
        px = nx; py = ny;
      }
    }
    return p;
  }

  function stepHidden(dt, t) {
    for (const c of hidden) {
      if (dt > 0) {
        c.x += c.dir * c.drift * dt;
        if (c.x < -140) c.x = vw + 120;
        if (c.x > vw + 140) c.x = -120;
        c.reveal = Math.max(0, c.reveal - dt * 0.24);
      }
      if (c.reveal <= 0.02) continue;
      const sy = c.y - scrollY + (RM ? 0 : Math.sin(t * 0.7 + c.ph) * 8);
      if (sy < -160 || sy > vh + 160) continue;
      ctx.save();
      ctx.translate(c.x, sy);
      ctx.scale(c.dir, 1);
      strokeGlow(hiddenPath(c, t), c.reveal * 0.9, CYAN);
      ctx.restore();
    }
  }

  /* --- sonar pings --- */

  function addPing(sx, sy) {
    pings.push({ x: sx, y: sy + scrollY, r: 0, max: Math.hypot(vw, vh) * 0.72 });
    if (!pingedEver) {
      pingedEver = true;
      hint.classList.remove("show");
    }
    if (RM) {
      // no expanding animation: reveal nearby life at once, fade in steps
      for (const c of hidden) {
        const d = Math.hypot(c.x - sx, c.y - (sy + scrollY));
        if (d < Math.hypot(vw, vh) * 0.6) c.reveal = 1;
      }
      let steps = 5;
      const fade = () => {
        for (const c of hidden) c.reveal *= 0.62;
        render();
        if (--steps > 0) setTimeout(fade, 700);
        else { for (const c of hidden) c.reveal = 0; pings = []; render(); }
      };
      render();
      setTimeout(fade, 900);
    }
  }

  function stepPings(dt) {
    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i];
      if (dt > 0) {
        p.r += (p.max / 1.7) * dt;
        // the wavefront wakes what it touches
        for (const c of hidden) {
          const d = Math.hypot(c.x - p.x, c.y - p.y);
          if (Math.abs(d - p.r) < 90) {
            c.reveal = Math.min(1, Math.max(c.reveal, 1.15 - (d / p.max) * 0.55));
          }
        }
        if (p.r > p.max) { pings.splice(i, 1); continue; }
      }
      const sy = p.y - scrollY;
      const k = p.r / p.max;
      const a = Math.pow(1 - k, 1.4);
      ctx.strokeStyle = `rgba(${CYAN},${a * 0.5})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(p.x, sy, Math.max(0.1, RM ? 130 : p.r), 0, 6.2832);
      ctx.stroke();
      if (p.r > 46 && !RM) {
        ctx.strokeStyle = `rgba(${CYAN},${a * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, sy, p.r - 40, 0, 6.2832);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${CYAN},${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, sy, 2, 0, 6.2832);
      ctx.fill();
    }
  }

  /* --- ascent bubbles --- */

  let ascending = false, ascendT0 = 0, ascendFrom = 0, bubbleAcc = 0;
  const ASCEND_MS = 4600;

  function stepRiseBubbles(dt, p) {
    if (ascending && dt > 0) {
      bubbleAcc += dt * (6 + 90 * p); // spawn rate accelerates with the ascent
      while (bubbleAcc >= 1) {
        bubbleAcc -= 1;
        riseBubbles.push({
          x: Math.random() * vw, y: vh + 20,
          sp: 260 + Math.random() * 300 + 900 * p,
          r: 1 + Math.random() * 2.8,
        });
      }
    }
    for (let i = riseBubbles.length - 1; i >= 0; i--) {
      const b = riseBubbles[i];
      b.y -= b.sp * dt;
      if (b.y < -40) { riseBubbles.splice(i, 1); continue; }
      const len = b.sp * 0.035;
      ctx.strokeStyle = "rgba(235,250,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.2832);
      ctx.stroke();
      ctx.strokeStyle = "rgba(235,250,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.r + 2);
      ctx.lineTo(b.x, b.y + b.r + 2 + len);
      ctx.stroke();
    }
  }

  /* ---------------- frame ---------------- */

  const T0 = 3.7; // frozen clock for reduced motion

  function draw(t, dt) {
    scrollY = window.scrollY || 0;
    ctx.clearRect(0, 0, vw, vh);
    drawGradient();
    drawCaustics(t);
    drawRays(t);
    drawBubbles(t, dt);
    if (dt > 0) stepFish(dt);
    if (scrollY + vh > bands.meso[0] - 100 && scrollY < bands.meso[1] + 100) drawFish();
    drawJellies(RM ? T0 : t);
    drawSnow(t);
    if (dt > 0) stepFlashes(dt);
    drawFlashes();
    stepHidden(dt, t);
    stepPings(dt);
    const p = ascending ? clamp((performance.now() - ascendT0) / ASCEND_MS, 0, 1) : 0;
    if (riseBubbles.length || ascending) stepRiseBubbles(dt, p);
    updateGauge();
  }

  let rafId = 0, running = false, lastTs = 0;

  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000) || 0.016;
    lastTs = ts;
    stepAscend(ts);
    draw(ts / 1000, dt);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running || RM) return;
    running = true;
    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  // reduced-motion: render single frames on demand
  let renderQueued = false;
  function render() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      draw(T0, 0);
    });
  }

  /* ---------------- ascend ---------------- */

  const easeInCubic = (x) => x * x * x;

  function stepAscend(now) {
    if (!ascending) return;
    const p = clamp((now - ascendT0) / ASCEND_MS, 0, 1);
    window.scrollTo(0, ascendFrom * (1 - easeInCubic(p)));
    if (p >= 1) ascending = false;
  }

  document.getElementById("ascend").addEventListener("click", () => {
    if (RM) { window.scrollTo(0, 0); return; }
    ascending = true;
    ascendT0 = performance.now();
    ascendFrom = window.scrollY;
  });
  // any manual input cancels the auto-ascent
  for (const ev of ["wheel", "touchmove", "keydown"]) {
    window.addEventListener(ev, () => { ascending = false; }, { passive: true });
  }

  /* ---------------- input ---------------- */

  // "click" (not pointerdown) so touch-scroll flicks don't fire pings
  window.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    addPing(e.clientX, e.clientY);
  });

  hint.addEventListener("click", () => addPing(vw / 2, vh * 0.5));

  window.addEventListener("scroll", () => {
    if (RM) { updateGauge(); render(); }
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  /* ---------------- reveal-on-scroll ---------------- */

  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }
  }, { threshold: 0.18 });
  document.querySelectorAll(".entry, .floor").forEach((el) => io.observe(el));

  /* ---------------- layout ---------------- */

  function resize() {
    vw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, COARSE ? 1 : 1.5);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildMaps();
    populate();
    buildDepthlines();
    buildRailTicks();
    lastShownDepth = -1;
    updateGauge();
    if (RM) render();
  }

  let rsT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rsT);
    rsT = setTimeout(resize, 120);
  });

  resize();
  if (RM) render(); else start();

  // section offsets shift once fonts arrive
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => resize());
  }
  window.addEventListener("load", () => resize());
})();
