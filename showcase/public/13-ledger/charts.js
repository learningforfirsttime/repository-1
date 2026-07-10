/* AERARIUM — every figure drawn live in SVG, no chart library.
   Forms: area (change over time), stat tiles, radial petals (magnitude,
   direct-labeled + table relief), two-series line (identity via fixed hues,
   legend + end labels + distinct markers), wind rose, proportional flow.
   Palette validated: #2742C8 / #D9571C on paper; sequential = ultramarine,
   light steps always carry labels + a figures table. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";
const ULTRA = "#2742C8", ORANGE = "#D9571C", INK = "#20242E", MUTED = "#6E7480";
const SEQ = ["#C9D2F2", "#8CA0E4", "#5471D6", "#2742C8", "#16267A"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DATA = {
  altitude: [2291, 2296, 2262, 2284, 2301, 2312, 2318, 2309, 2315, 2322, 2307, 2313],
  rain: [64, 58, 121, 96, 73, 41, 22, 35, 148, 233, 186, 127], // thousand barrels
  citizens: [23.9, 23.8, 23.6, 23.9, 24.1, 24.4, 24.9, 25.2, 24.8, 24.5, 24.2, 24.1],
  birds: [31.2, 29.8, 26.4, 33.9, 41.7, 46.2, 48.1, 47.6, 44.0, 39.3, 35.1, 33.4],
  wind: { N: 3, NNE: 3, NE: 4, ENE: 4, E: 5, ESE: 5, SE: 7, SSE: 8, S: 9, SSW: 12, SW: 16, WSW: 11, W: 6, WNW: 3, NW: 2, NNW: 2 },
  flows: {
    sources: [["Rain tax", 612], ["Kite tolls", 214], ["Cloud grazing leases", 128]],
    uses: [["Ballast & mooring", 391], ["Lightning insurance", 265], ["Bird seed (civic)", 173], ["The Archives", 125]],
  },
};

const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};
const fmt = (n) => n.toLocaleString("en-US");

/* tooltip */
const tip = document.getElementById("tip");
function showTip(html, x, y) {
  tip.innerHTML = html;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
  tip.classList.add("on");
}
const hideTip = () => tip.classList.remove("on");

/* table relief */
function fillTable(figId, head, rows) {
  const box = document.querySelector(`#${figId} details div`);
  const t = document.createElement("table");
  t.innerHTML =
    `<thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
  box.appendChild(t);
}

/* draw-in choreography: run fn when figure scrolls into view */
function onSeen(node, fn) {
  if (reduced) { fn(); return; }
  const io = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) { fn(); io.disconnect(); }
  }, { threshold: 0.3 });
  io.observe(node);
}

/* ============ FIG 1 — altitude area chart ============ */
(function altitude() {
  const fig = document.getElementById("fig-altitude");
  const W = 940, H = 360, L = 64, R = 20, T = 26, B = 40;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Area chart of mean altitude by month, ranging from 2,262 to 2,322 metres." });
  fig.insertBefore(svg, fig.querySelector("details"));
  const v = DATA.altitude;
  const lo = 2240, hi = 2340;
  const x = (i) => L + (i / 11) * (W - L - R);
  const y = (val) => T + (1 - (val - lo) / (hi - lo)) * (H - T - B);

  // grid + axis (recessive)
  for (let g = 2240; g <= 2340; g += 20) {
    el("line", { x1: L, x2: W - R, y1: y(g), y2: y(g), stroke: "rgba(32,36,46,0.08)", "stroke-width": 1 }, svg);
    el("text", { x: L - 10, y: y(g) + 4, "text-anchor": "end", "font-size": 11, fill: MUTED, "font-family": "IBM Plex Mono" }, svg).textContent = fmt(g);
  }
  MONTHS.forEach((m, i) => {
    el("text", { x: x(i), y: H - 14, "text-anchor": "middle", "font-size": 11, fill: MUTED, "font-family": "IBM Plex Mono" }, svg).textContent = m.toUpperCase();
  });

  const defs = el("defs", {}, svg);
  const grad = el("linearGradient", { id: "aGrad", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: "0%", "stop-color": ULTRA, "stop-opacity": 0.22 }, grad);
  el("stop", { offset: "100%", "stop-color": ULTRA, "stop-opacity": 0.02 }, grad);

  const lineD = v.map((val, i) => `${i ? "L" : "M"}${x(i)},${y(val)}`).join("");
  const area = el("path", { d: `${lineD}L${x(11)},${H - B}L${x(0)},${H - B}Z`, fill: "url(#aGrad)", opacity: 0 }, svg);
  const line = el("path", { d: lineD, fill: "none", stroke: ULTRA, "stroke-width": 2, "stroke-linecap": "round" }, svg);

  // annotations
  const notes = [[2, "The March Gale", -34], [7, "Lanterns: ballast released", 26]];
  const noteG = el("g", { opacity: 0 }, svg);
  for (const [i, label, dy] of notes) {
    el("line", { x1: x(i), x2: x(i), y1: y(v[i]), y2: y(v[i]) + dy, stroke: ORANGE, "stroke-width": 1 }, noteG);
    el("circle", { cx: x(i), cy: y(v[i]), r: 3.4, fill: ORANGE }, noteG);
    el("text", { x: x(i) + 6, y: y(v[i]) + dy + (dy > 0 ? 12 : -4), "font-size": 11.5, fill: INK, "font-family": "IBM Plex Mono" }, noteG).textContent = label;
  }

  // crosshair layer
  const cross = el("g", { opacity: 0 }, svg);
  const cxLine = el("line", { y1: T, y2: H - B, stroke: "rgba(32,36,46,0.3)", "stroke-width": 1, "stroke-dasharray": "3 3" }, cross);
  const cxDot = el("circle", { r: 4.5, fill: ULTRA, stroke: "#fbfaf6", "stroke-width": 2 }, cross);
  const hit = el("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent" }, svg);
  hit.addEventListener("pointermove", (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(11, Math.round(((px - L) / (W - L - R)) * 11)));
    cross.setAttribute("opacity", 1);
    cxLine.setAttribute("x1", x(i)); cxLine.setAttribute("x2", x(i));
    cxDot.setAttribute("cx", x(i)); cxDot.setAttribute("cy", y(v[i]));
    showTip(`${MONTHS[i]} · <b>${fmt(v[i])} m</b>`, e.clientX, e.clientY);
  });
  hit.addEventListener("pointerleave", () => { cross.setAttribute("opacity", 0); hideTip(); });

  const len = line.getTotalLength();
  if (!reduced) {
    line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
    onSeen(fig, () => {
      line.style.transition = "stroke-dashoffset 2.2s cubic-bezier(.22,1,.36,1)";
      line.style.strokeDashoffset = 0;
      area.style.transition = "opacity 1.4s ease .9s"; area.setAttribute("opacity", 1); area.style.opacity = 1;
      noteG.style.transition = "opacity .9s ease 1.6s"; noteG.style.opacity = 1;
    });
  } else { area.setAttribute("opacity", 1); noteG.setAttribute("opacity", 1); }

  fillTable("fig-altitude", ["Month", "Metres"], MONTHS.map((m, i) => [m, fmt(v[i])]));
})();

/* ============ FIG 2 — stat tiles ============ */
(function tiles() {
  const spark = (vals, color) => {
    const w = 150, h = 34;
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, "aria-hidden": "true" });
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const d = vals.map((v2, i) => `${i ? "L" : "M"}${(i / (vals.length - 1)) * (w - 4) + 2},${h - 4 - ((v2 - lo) / (hi - lo || 1)) * (h - 8)}`).join("");
    el("path", { d, fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, s);
    const lx = w - 2, ly = h - 4 - ((vals[vals.length - 1] - lo) / (hi - lo || 1)) * (h - 8);
    el("circle", { cx: lx - 0, cy: ly, r: 3, fill: color }, s);
    return s;
  };
  const tiles = [
    { label: "Rain harvested", value: 1204551, unit: "bbl", spark: DATA.rain, color: ULTRA, delta: "+9.2% vs yr 311", up: true },
    { label: "Birds naturalised", value: 48112, unit: "residents", spark: DATA.birds, color: ORANGE, delta: "+14.4% — a good spring", up: true },
    { label: "Days aloft, total", value: 44895, unit: "days", spark: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, i) => i), color: ULTRA, delta: "123 years, unbroken", up: true },
    { label: "Letters sent by kite", value: 9340, unit: "letters", spark: [8, 7, 9, 11, 10, 12, 14, 12, 9, 8, 7, 9], color: ORANGE, delta: "−3.1% (a calm July)", up: false },
  ];
  const host = document.getElementById("tiles");
  for (const [ti, t] of tiles.entries()) {
    const d = document.createElement("div");
    d.className = "tile reveal";
    d.style.setProperty("--d", `${ti * 0.08}s`);
    d.innerHTML = `<p class="label">${t.label}</p><p class="value"><span data-count="${t.value}">0</span><small>${t.unit}</small></p>`;
    d.appendChild(spark(t.spark, t.color));
    const delta = document.createElement("p");
    delta.className = "delta " + (t.up ? "up" : "dn");
    delta.textContent = (t.up ? "▲ " : "▼ ") + t.delta;
    d.appendChild(delta);
    host.appendChild(d);
    const span = d.querySelector("[data-count]");
    onSeen(d, () => {
      if (reduced) { span.textContent = fmt(t.value); return; }
      const t0 = performance.now(), dur = 1600;
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        span.textContent = fmt(Math.round(t.value * e));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }
})();

/* ============ FIG 3 — rain petals ============ */
(function rain() {
  const fig = document.getElementById("fig-rain");
  const W = 940, H = 480, cx = W / 2, cy = H / 2 + 6, R0 = 40, R1 = 190;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Radial chart of rain harvested by month; October is the largest at 233 thousand barrels." });
  fig.insertBefore(svg, fig.querySelector("details"));
  const v = DATA.rain, max = Math.max(...v);
  // quantile → sequential step
  const sorted = [...v].sort((a, b) => a - b);
  const stepOf = (val) => SEQ[Math.min(4, Math.floor((sorted.indexOf(val) / 12) * 5))];
  // rings
  for (const r of [0.33, 0.66, 1]) {
    el("circle", { cx, cy, r: R0 + (R1 - R0) * r, fill: "none", stroke: "rgba(32,36,46,0.08)" }, svg);
  }
  el("text", { x: cx, y: cy + 5, "text-anchor": "middle", "font-size": 13, fill: MUTED, "font-family": "IBM Plex Mono" }, svg).textContent = "YR 312";
  const petals = [];
  v.forEach((val, i) => {
    const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2 + 0.05;
    const a1 = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2 - 0.05;
    const am = (a0 + a1) / 2;
    const r = R0 + (val / max) * (R1 - R0);
    const px = (a, rr) => cx + Math.cos(a) * rr;
    const py = (a, rr) => cy + Math.sin(a) * rr;
    // petal: from base arc out to a rounded tip
    const d = `M${px(a0, R0)},${py(a0, R0)}
      A${R0},${R0} 0 0 1 ${px(a1, R0)},${py(a1, R0)}
      Q${px(a1, r * 0.96)},${py(a1, r * 0.96)} ${px(am, r)},${py(am, r)}
      Q${px(a0, r * 0.96)},${py(a0, r * 0.96)} ${px(a0, R0)},${py(a0, R0)}Z`;
    const p = el("path", { d, fill: stepOf(val), stroke: "#fbfaf6", "stroke-width": 2, "fill-opacity": 0.92 }, svg);
    p.style.transformOrigin = `${cx}px ${cy}px`;
    petals.push(p);
    // one combined outer label per month: "OCT · 233"
    const big = val >= Math.max(...v) * 0.6;
    const lab = el("text", { x: px(am, R1 + 30), y: py(am, R1 + 30) + 4, "text-anchor": "middle", "font-size": 11, fill: MUTED, "font-family": "IBM Plex Mono" }, svg);
    lab.innerHTML = `${MONTHS[i].toUpperCase()} · <tspan font-weight="700" fill="${big ? INK : MUTED}">${val}</tspan>`;
    p.addEventListener("pointermove", (e) => showTip(`${MONTHS[i]} · <b>${val},000 barrels</b>`, e.clientX, e.clientY));
    p.addEventListener("pointerleave", hideTip);
  });
  onSeen(fig, () => {
    if (reduced) return;
    petals.forEach((p, i) => {
      p.style.transform = "scale(0.1)";
      p.style.transition = `transform 1s cubic-bezier(.22,1,.36,1) ${i * 0.06}s`;
      requestAnimationFrame(() => requestAnimationFrame(() => (p.style.transform = "scale(1)")));
    });
  });
  fillTable("fig-rain", ["Month", "Thousand barrels"], MONTHS.map((m, i) => [m, v[i]]));
})();

/* ============ FIG 4 — citizens vs birds ============ */
(function census() {
  const fig = document.getElementById("fig-census");
  const W = 940, H = 380, L = 56, R = 96, T = 24, B = 40;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Two-line chart: citizens hold near 24 thousand while naturalised birds rise to 48 thousand in July." });
  fig.insertBefore(svg, fig.querySelector("details"));
  const hi = 52, lo = 16;
  const x = (i) => L + (i / 11) * (W - L - R);
  const y = (val) => T + (1 - (val - lo) / (hi - lo)) * (H - T - B);
  for (let g = 20; g <= 50; g += 10) {
    el("line", { x1: L, x2: W - R, y1: y(g), y2: y(g), stroke: "rgba(32,36,46,0.08)" }, svg);
    el("text", { x: L - 10, y: y(g) + 4, "text-anchor": "end", "font-size": 11, fill: MUTED, "font-family": "IBM Plex Mono" }, svg).textContent = g + "k";
  }
  MONTHS.forEach((m, i) => {
    el("text", { x: x(i), y: H - 14, "text-anchor": "middle", "font-size": 11, fill: MUTED, "font-family": "IBM Plex Mono" }, svg).textContent = m[0];
  });
  const series = [
    { name: "Citizens", vals: DATA.citizens, color: ULTRA, marker: "circle" },
    { name: "Birds", vals: DATA.birds, color: ORANGE, marker: "tri" },
  ];
  const lines = [];
  for (const s of series) {
    const d = s.vals.map((val, i) => `${i ? "L" : "M"}${x(i)},${y(val)}`).join("");
    const path = el("path", { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linecap": "round" }, svg);
    lines.push(path);
    // sparse distinct markers (every 3rd point) — identity beyond color
    s.vals.forEach((val, i) => {
      if (i % 3 !== 0) return;
      if (s.marker === "circle") el("circle", { cx: x(i), cy: y(val), r: 3.6, fill: s.color, stroke: "#fbfaf6", "stroke-width": 2 }, svg);
      else el("path", { d: `M${x(i)},${y(val) - 4.6}L${x(i) + 4.4},${y(val) + 3.6}L${x(i) - 4.4},${y(val) + 3.6}Z`, fill: s.color, stroke: "#fbfaf6", "stroke-width": 1.6 }, svg);
    });
    el("text", { x: x(11) + 10, y: y(s.vals[11]) + 4, "font-size": 12, "font-weight": 600, fill: s.color, "font-family": "IBM Plex Mono" }, svg).textContent = s.name.toUpperCase();
  }
  // crosshair
  const cross = el("g", { opacity: 0 }, svg);
  const cl = el("line", { y1: T, y2: H - B, stroke: "rgba(32,36,46,0.3)", "stroke-dasharray": "3 3" }, cross);
  const d1 = el("circle", { r: 4.4, fill: ULTRA, stroke: "#fbfaf6", "stroke-width": 2 }, cross);
  const d2 = el("circle", { r: 4.4, fill: ORANGE, stroke: "#fbfaf6", "stroke-width": 2 }, cross);
  const hit = el("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent" }, svg);
  hit.addEventListener("pointermove", (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(11, Math.round(((px - L) / (W - L - R)) * 11)));
    cross.setAttribute("opacity", 1);
    cl.setAttribute("x1", x(i)); cl.setAttribute("x2", x(i));
    d1.setAttribute("cx", x(i)); d1.setAttribute("cy", y(DATA.citizens[i]));
    d2.setAttribute("cx", x(i)); d2.setAttribute("cy", y(DATA.birds[i]));
    showTip(`${MONTHS[i]}<br>Citizens · <b>${DATA.citizens[i]}k</b><br>Birds · <b>${DATA.birds[i]}k</b>`, e.clientX, e.clientY);
  });
  hit.addEventListener("pointerleave", () => { cross.setAttribute("opacity", 0); hideTip(); });

  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML =
    `<span class="key"><span class="swatch" style="background:${ULTRA}"></span>Citizens (circle)</span>` +
    `<span class="key"><span class="swatch" style="background:${ORANGE}"></span>Naturalised birds (triangle)</span>`;
  fig.insertBefore(legend, fig.querySelector("details"));

  onSeen(fig, () => {
    if (reduced) return;
    lines.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      p.style.transition = `stroke-dashoffset 2s cubic-bezier(.22,1,.36,1) ${i * 0.3}s`;
      requestAnimationFrame(() => (p.style.strokeDashoffset = 0));
    });
  });
  fillTable("fig-census", ["Month", "Citizens (k)", "Birds (k)"], MONTHS.map((m, i) => [m, DATA.citizens[i], DATA.birds[i]]));
})();

/* ============ FIG 5 — wind rose ============ */
(function wind() {
  const fig = document.getElementById("fig-wind");
  const W = 940, H = 460, cx = W / 2, cy = H / 2 + 4, R1 = 180;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Wind rose: the southwest bearing dominates with 16 percent of wind hours." });
  fig.insertBefore(svg, fig.querySelector("details"));
  const keys = Object.keys(DATA.wind);
  const vals = Object.values(DATA.wind);
  const max = Math.max(...vals);
  for (const r of [0.33, 0.66, 1]) el("circle", { cx, cy, r: R1 * r, fill: "none", stroke: "rgba(32,36,46,0.08)" }, svg);
  el("text", { x: cx + R1 * 0.66 + 4, y: cy - 4, "font-size": 10, fill: MUTED, "font-family": "IBM Plex Mono" }, svg).textContent = Math.round(max * 0.66) + "%";
  const sorted = [...vals].sort((a, b) => a - b);
  const stepOf = (val) => SEQ[Math.min(4, Math.floor((sorted.indexOf(val) / 16) * 5))];
  const sectors = [];
  keys.forEach((k, i) => {
    const a0 = (i / 16) * Math.PI * 2 - Math.PI / 2 + 0.03;
    const a1 = ((i + 1) / 16) * Math.PI * 2 - Math.PI / 2 - 0.03;
    const r = (vals[i] / max) * R1;
    const px = (a, rr) => cx + Math.cos(a) * rr, py = (a, rr) => cy + Math.sin(a) * rr;
    const d = `M${cx},${cy}L${px(a0, r)},${py(a0, r)}A${r},${r} 0 0 1 ${px(a1, r)},${py(a1, r)}Z`;
    const p = el("path", { d, fill: stepOf(vals[i]), stroke: "#fbfaf6", "stroke-width": 2, "fill-opacity": 0.92 }, svg);
    p.style.transformOrigin = `${cx}px ${cy}px`;
    sectors.push(p);
    p.addEventListener("pointermove", (e) => showTip(`${k} · <b>${vals[i]}% of wind hours</b>`, e.clientX, e.clientY));
    p.addEventListener("pointerleave", hideTip);
    if (["N", "E", "S", "W", "SW"].includes(k)) {
      const am = (a0 + a1) / 2;
      el("text", { x: px(am, R1 + 20), y: py(am, R1 + 20) + 4, "text-anchor": "middle", "font-size": 12, "font-weight": k === "SW" ? 700 : 400, fill: k === "SW" ? INK : MUTED, "font-family": "IBM Plex Mono" }, svg).textContent = k;
    }
  });
  // direct label on the champion
  el("text", { x: cx - R1 * 0.86, y: cy + R1 * 0.7, "font-size": 12.5, "font-weight": 600, fill: INK, "font-family": "IBM Plex Mono" }, svg).textContent = "SW · 16%";
  onSeen(fig, () => {
    if (reduced) return;
    sectors.forEach((p, i) => {
      p.style.transform = "scale(0.06)";
      p.style.transition = `transform .9s cubic-bezier(.22,1,.36,1) ${i * 0.045}s`;
      requestAnimationFrame(() => requestAnimationFrame(() => (p.style.transform = "scale(1)")));
    });
  });
  fillTable("fig-wind", ["Bearing", "% of hours"], keys.map((k, i) => [k, vals[i]]));
})();

/* ============ FIG 6 — treasury flow ============ */
(function flow() {
  const fig = document.getElementById("fig-flow");
  const W = 940, H = 430, colW = 150, midX = W / 2 - colW / 2;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Flow diagram: rain tax, kite tolls and grazing leases feed the treasury; ballast, insurance, bird seed and archives spend it." });
  fig.insertBefore(svg, fig.querySelector("details"));
  const S = DATA.flows.sources, U = DATA.flows.uses;
  const total = S.reduce((a, [, v2]) => a + v2, 0);
  const scale = (H - 90) / total;
  const gap = 14;

  function column(items, xPos, colorFor, anchor) {
    let yy = 40;
    const rects = [];
    for (const [name, val] of items) {
      const h = val * scale;
      const r = el("rect", { x: xPos, y: yy, width: 26, height: h, rx: 4, fill: colorFor(name) }, svg);
      el("text", {
        x: anchor === "end" ? xPos - 10 : xPos + 36, y: yy + h / 2 - 2,
        "text-anchor": anchor, "font-size": 12.5, fill: INK, "font-family": "IBM Plex Sans", "font-weight": 600,
      }, svg).textContent = name;
      el("text", {
        x: anchor === "end" ? xPos - 10 : xPos + 36, y: yy + h / 2 + 14,
        "text-anchor": anchor, "font-size": 11, fill: MUTED, "font-family": "IBM Plex Mono",
      }, svg).textContent = fmt(val) + "k bbl";
      rects.push({ name, val, y: yy, h });
      yy += h + gap;
    }
    return rects;
  }
  const sRects = column(S, 150, () => ULTRA, "end");
  const uRects = column(U, W - 176, (n) => (n === "Lightning insurance" ? ORANGE : ULTRA), "start");
  // treasury bar
  const tH = total * scale + gap * 2;
  el("rect", { x: midX, y: 40, width: colW, height: tH, rx: 6, fill: "none", stroke: INK, "stroke-width": 1.4 }, svg);
  el("text", { x: midX + colW / 2, y: 40 + tH / 2 - 4, "text-anchor": "middle", "font-size": 13, "font-weight": 700, "font-family": "IBM Plex Mono", fill: INK }, svg).textContent = "TREASURY";
  el("text", { x: midX + colW / 2, y: 40 + tH / 2 + 14, "text-anchor": "middle", "font-size": 11, "font-family": "IBM Plex Mono", fill: MUTED }, svg).textContent = fmt(total) + "k bbl";

  // ribbons
  const ribbons = [];
  function ribbon(from, toX, tY, tH2, color, label, val) {
    const x0 = from.x, y0 = from.y, h0 = from.h;
    const d = `M${x0},${y0} C${(x0 + toX) / 2},${y0} ${(x0 + toX) / 2},${tY} ${toX},${tY}
       L${toX},${tY + tH2} C${(x0 + toX) / 2},${tY + tH2} ${(x0 + toX) / 2},${y0 + h0} ${x0},${y0 + h0}Z`;
    const p = el("path", { d, fill: color, "fill-opacity": 0.18 }, svg);
    const mid = el("path", {
      d: `M${x0},${y0 + h0 / 2} C${(x0 + toX) / 2},${y0 + h0 / 2} ${(x0 + toX) / 2},${tY + tH2 / 2} ${toX},${tY + tH2 / 2}`,
      fill: "none", stroke: color, "stroke-width": 1.6, "stroke-dasharray": "5 7", opacity: 0.85,
    }, svg);
    ribbons.push(mid);
    p.addEventListener("pointermove", (e) => showTip(`${label} · <b>${fmt(val)}k bbl</b>`, e.clientX, e.clientY));
    p.addEventListener("pointerleave", hideTip);
  }
  let acc = 40 + gap;
  for (const r of sRects) {
    const h = r.val * scale * (1 - (gap * 2) / tH);
    ribbon({ x: 176, y: r.y, h: r.h }, midX, acc, h, ULTRA, r.name, r.val);
    acc += h;
  }
  acc = 40 + gap;
  for (const r of uRects) {
    const h = r.val * scale * (1 - (gap * 2) / tH);
    ribbon({ x: midX + colW, y: acc, h }, W - 176, r.y, r.h, r.name === "Lightning insurance" ? ORANGE : ULTRA, r.name, r.val);
    acc += h;
  }
  if (!reduced) {
    let off = 0;
    (function march() {
      off -= 0.35;
      for (const m of ribbons) m.setAttribute("stroke-dashoffset", off);
      requestAnimationFrame(march);
    })();
  }
  fillTable("fig-flow", ["Flow", "Thousand barrels"],
    [...S.map(([n, v2]) => ["IN · " + n, fmt(v2)]), ...U.map(([n, v2]) => ["OUT · " + n, fmt(v2)])]);
})();

/* ============ reveals ============ */
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
  { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
);
document.querySelectorAll(".reveal").forEach((n) => io.observe(n));
