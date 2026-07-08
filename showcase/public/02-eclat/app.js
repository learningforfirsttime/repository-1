/* ÉCLAT — parfumeur de nuit ··· smoke, wisps, choreography */

const RM = matchMedia('(prefers-reduced-motion: reduce)');
const COARSE = matchMedia('(pointer: coarse)');
const reduced = () => RM.matches;
const dprCap = () => Math.min(window.devicePixelRatio || 1, COARSE.matches ? 1 : 1.5);

/* ······················································ smoke shader */

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uSource;   /* plume origin, uv, y-up */
uniform vec2  uPointer;  /* pointer, uv, y-up */
uniform float uSheen;    /* 0..1 iridescent presence */
uniform vec2  uPulse;    /* last press, uv, y-up */
uniform float uPulseT;   /* time of last press */

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for(int i = 0; i < 5; i++){
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}
float fbm3(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for(int i = 0; i < 3; i++){
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime;

  vec2 p = vec2((uv.x - uSource.x) * aspect, uv.y - uSource.y);
  float h = p.y;

  /* domain-warped rising fbm */
  vec2 sp = p * 2.6 + vec2(0.0, -t * 0.22);
  vec2 q = vec2(fbm(sp), fbm(sp + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(sp + 3.2 * q + vec2(1.7, 9.2) + vec2(0.0, -t * 0.10)),
                fbm(sp + 3.2 * q + vec2(8.3, 2.8)));
  float f = fbm(sp + 3.0 * r);

  /* plume: swaying column rising from the neck */
  float sway = (fbm3(vec2(h * 1.8 - t * 0.17, t * 0.11)) - 0.5) * (0.12 + h * 0.8);
  float x = p.x - sway * smoothstep(0.0, 0.3, h);
  float wf = mix(0.5, 1.0, clamp(aspect, 0.0, 1.0)); /* keep the plume slender on narrow screens */
  float w = (0.028 + h * 0.4 + f * 0.1) * wf;
  float column = exp(-(x * x) / (2.0 * w * w + 1e-4));
  float vert = smoothstep(-0.008, 0.05, h) * (1.0 - smoothstep(0.55, 1.4, h));
  float density = column * vert * smoothstep(0.3, 0.95, f + 0.2 * column);

  /* ambient haze so the dark never sits flat */
  float haze = fbm3(uv * vec2(aspect, 1.0) * 1.7 + vec2(0.0, -t * 0.03)) * 0.07;

  vec3 col = vec3(0.043, 0.043, 0.051);           /* #0B0B0D */
  col += vec3(0.72, 0.72, 0.78) * density * 0.8;  /* silver smoke */
  col += vec3(0.44, 0.44, 0.50) * haze;

  /* iridescent sheen — a thin-film tint lent by the visitor's presence */
  vec2 pp = vec2((uv.x - uPointer.x) * aspect, uv.y - uPointer.y);
  float field = exp(-dot(pp, pp) * 16.0) * uSheen;
  vec3 irid = 0.5 + 0.5 * cos(6.28318 * (f * 1.15 + h * 0.45) + vec3(0.0, 2.1, 4.2) + t * 0.16);
  irid = mix(vec3(dot(irid, vec3(0.333))), irid, 0.7);   /* soften toward oil-film pastels */
  col += density * field * (irid - 0.5) * 0.5;   /* hue shift inside the smoke strands */
  col += density * field * irid * 0.16;          /* faint lift */
  col += haze * field * (irid - 0.5) * 1.05;     /* whisper of colour in the haze */

  /* the breath — a slow iridescent ripple from the visitor's touch */
  vec2 pu = vec2((uv.x - uPulse.x) * aspect, uv.y - uPulse.y);
  float age = t - uPulseT;
  float ring = exp(-pow((length(pu) - age * 0.20) * 9.0, 2.0)) * exp(-age * 1.1) * step(0.0, age);
  float body = density * 0.9 + haze * 3.5 + 0.05;
  col += ring * body * (irid - 0.5) * 0.55;
  col += ring * (density * 0.8 + 0.02) * 0.12;

  /* soft in-shader vignette */
  float vig = smoothstep(1.3, 0.35, length((uv - 0.5) * vec2(aspect, 1.0)));
  col *= mix(0.78, 1.0, vig);

  /* dither against banding */
  col += (hash(gl_FragCoord.xy + fract(t) * 100.0) - 0.5) * 0.014;

  gl_FragColor = vec4(col, 1.0);
}
`;

function initSmoke(){
  const canvas = document.getElementById('smoke');
  const hero = document.getElementById('hero');
  const flacon = document.getElementById('flacon');
  const gl = canvas.getContext('webgl', { alpha:false, antialias:false, depth:false, stencil:false });
  if(!gl){ canvas.remove(); return; }

  function shader(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if(!vs || !fs){ canvas.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){ canvas.remove(); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for(const n of ['uRes','uTime','uSource','uPointer','uSheen','uPulse','uPulseT']) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform1f(U.uPulseT, -100.0);
  gl.uniform2f(U.uPulse, 0.5, 0.4);

  const QUALITY = 0.8; /* smoke is soft — render under-res, scale up */
  let cw = 0, ch = 0;

  function resize(){
    const scale = dprCap() * QUALITY;
    cw = hero.clientWidth; ch = hero.clientHeight;
    canvas.width = Math.max(2, Math.round(cw * scale));
    canvas.height = Math.max(2, Math.round(ch * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    updateSource();
  }

  /* plume origin = the flacon's open neck */
  function updateSource(){
    const fr = flacon.getBoundingClientRect();
    const hr = canvas.getBoundingClientRect();
    if(fr.width === 0 || hr.width === 0){ gl.uniform2f(U.uSource, 0.5, 0.42); return; }
    const sx = fr.left + (150 / 300) * fr.width - hr.left;
    const sy = fr.top + (156 / 640) * fr.height - hr.top;
    gl.uniform2f(U.uSource, sx / hr.width, 1 - sy / hr.height);
  }

  /* pointer field */
  let px = 0.5, py = 0.45, tx = 0.5, ty = 0.45;
  let sheen = 0, lastMove = -1e4;

  if(!COARSE.matches){
    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      if(r.bottom < 0) return;
      tx = (e.clientX - r.left) / r.width;
      ty = 1 - (e.clientY - r.top) / r.height;
      lastMove = performance.now();
    }, { passive:true });
  }

  /* the breath — press the dark and it answers */
  hero.addEventListener('pointerdown', (e) => {
    if(reduced() || !running) return;
    const r = canvas.getBoundingClientRect();
    gl.uniform2f(U.uPulse, (e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    gl.uniform1f(U.uPulseT, time);
  }, { passive:true });

  let running = false, visible = true, raf = 0;
  let time = 18.0, last = 0;

  function frame(now){
    raf = 0;
    if(!running) return;
    const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
    last = now;
    time += dt;

    if(COARSE.matches){
      /* autonomous sheen drifts through the smoke */
      tx = 0.5 + 0.24 * Math.sin(time * 0.13) + 0.06 * Math.sin(time * 0.31);
      ty = 0.55 + 0.18 * Math.sin(time * 0.09 + 1.7);
      sheen += (0.55 - sheen) * Math.min(1, dt * 0.8);
    }else{
      const active = performance.now() - lastMove < 2400 ? 1 : 0;
      sheen += (active - sheen) * Math.min(1, dt * (active ? 1.6 : 0.55));
    }
    const k = 1 - Math.exp(-dt * 4.2);
    px += (tx - px) * k;
    py += (ty - py) * k;

    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uPointer, px, py);
    gl.uniform1f(U.uSheen, sheen);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }

  function renderStill(){
    gl.uniform1f(U.uTime, 26.0);
    gl.uniform2f(U.uPointer, 0.5, 0.55);
    gl.uniform1f(U.uSheen, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function setRunning(){
    const want = visible && !document.hidden && !reduced();
    if(want && !running){
      running = true; last = performance.now();
      if(!raf) raf = requestAnimationFrame(frame);
    }else if(!want && running){
      running = false;
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      if(reduced()) renderStill();
    }
  }

  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    setRunning();
  }, { threshold: 0.01 }).observe(canvas);

  document.addEventListener('visibilitychange', setRunning);
  RM.addEventListener('change', () => { resize(); setRunning(); if(reduced()) renderStill(); });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { resize(); if(!running) renderStill(); }, 120);
  }, { passive:true });

  resize();
  if(reduced()){ renderStill(); } else { setRunning(); }
  /* the flacon settles after fonts/layout — re-aim the plume */
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(updateSource);
  setTimeout(updateSource, 400);
}

/* ······················································ accord wisps */

const WISP_STYLES = {
  ember: { tint:[227,201,143], count:110, base:-Math.PI/2, amp:0.95, k1:0.045, k2:0.02,  speed:30, len:6,  alpha:0.2,  spark:true  },
  iris:  { tint:[224,166,210], count:80,  base:-Math.PI/2, amp:0.5,  k1:0.016, k2:0.011, speed:22, len:11, alpha:0.17, spark:false },
  tea:   { tint:[143,224,220], count:96,  base:-Math.PI/2, amp:1.6,  k1:0.03,  k2:0.024, speed:24, len:7,  alpha:0.18, spark:false }
};

function initWisps(){
  document.querySelectorAll('.accord').forEach((card) => {
    const canvas = card.querySelector('canvas');
    const style = WISP_STYLES[card.dataset.wisp];
    if(!canvas || !style) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let parts = [];
    let t = Math.random() * 100;
    let tint = 0, tintTarget = 0;

    function resize(){
      dpr = dprCap();
      const r = canvas.parentElement.getBoundingClientRect();
      W = Math.max(10, r.width); H = Math.max(10, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#101013';
      ctx.fillRect(0, 0, W, H);
      seed();
    }

    function seed(){
      parts = [];
      for(let i = 0; i < style.count; i++){
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          v: 0.6 + Math.random() * 0.8,
          ph: Math.random() * Math.PI * 2,
          spark: style.spark && Math.random() < 0.12
        });
      }
    }

    function angle(x, y, tt, ph){
      const s = style;
      return s.base +
        Math.sin(y * s.k1 + tt * 0.9 + ph) * s.amp * 0.55 +
        Math.sin(x * s.k2 - tt * 0.6 + Math.sin(y * 0.01 + tt * 0.35) * 2.0) * s.amp * 0.45;
    }

    function step(dt){
      t += dt;
      tint += (tintTarget - tint) * Math.min(1, dt * 3);
      ctx.fillStyle = 'rgba(16,16,19,0.05)';
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1.2 + tint * 0.5;
      ctx.lineCap = 'round';
      const [tr, tg, tb] = style.tint;
      for(const p of parts){
        const a = angle(p.x, p.y, t, p.ph);
        const sp = style.speed * p.v * dt * (1 + tint * 0.5);
        const nx = p.x + Math.cos(a) * sp;
        const ny = p.y + Math.sin(a) * sp;
        const cr = Math.round(214 + (tr - 214) * tint);
        const cg = Math.round(214 + (tg - 214) * tint);
        const cb = Math.round(222 + (tb - 222) * tint);
        const al = (p.spark ? style.alpha * 2.4 : style.alpha) * (1 + tint * 0.9);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${al * (0.5 + 0.5 * Math.sin(t * 1.3 + p.ph))})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (nx - p.x) * style.len, p.y + (ny - p.y) * style.len);
        ctx.stroke();
        p.x = nx; p.y = ny;
        if(p.y < -10){ p.y = H + 8; p.x = Math.random() * W; }
        if(p.x < -10) p.x = W + 8;
        if(p.x > W + 10) p.x = -8;
        if(p.y > H + 12) p.y = -8;
      }
    }

    let running = false, visible = false, raf = 0, last = 0;
    function frame(now){
      raf = 0;
      if(!running) return;
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
      last = now;
      step(dt);
      raf = requestAnimationFrame(frame);
    }
    function setRunning(){
      const want = visible && !document.hidden && !reduced();
      if(want && !running){
        running = true; last = performance.now();
        if(!raf) raf = requestAnimationFrame(frame);
      }else if(!want && running){
        running = false;
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
      }
    }

    new IntersectionObserver((es) => { visible = es[0].isIntersecting; setRunning(); },
      { threshold: 0.05 }).observe(canvas);
    document.addEventListener('visibilitychange', setRunning);

    card.addEventListener('pointerenter', () => { tintTarget = 1; }, { passive:true });
    card.addEventListener('pointerleave', () => { tintTarget = 0; }, { passive:true });

    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); if(reduced()) stillFrame(); }, 140);
    }, { passive:true });

    function stillFrame(){
      for(let i = 0; i < 320; i++) step(0.016);
    }

    resize();
    if(reduced()) stillFrame();
  });
}

/* ······················································ choreography */

function initReveals(){
  const io = new IntersectionObserver((entries) => {
    for(const e of entries){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

function initHeader(){
  const head = document.getElementById('siteHead');
  const hero = document.getElementById('hero');
  new IntersectionObserver((es) => {
    head.classList.toggle('show', !es[0].isIntersecting);
  }, { rootMargin: '-72px 0px 0px 0px', threshold: 0 }).observe(hero);
}

function initProgress(){
  const bar = document.getElementById('progressBar');
  const bead = document.getElementById('progressBead');
  let raf = 0;
  function update(){
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = `scaleX(${p})`;
    bead.style.transform = `translateX(${p * window.innerWidth}px)`;
  }
  window.addEventListener('scroll', () => { if(!raf) raf = requestAnimationFrame(update); }, { passive:true });
  window.addEventListener('resize', () => { if(!raf) raf = requestAnimationFrame(update); }, { passive:true });
  update();
}

/* ······················································ the ledger */

function initLedger(){
  const form = document.getElementById('ledgerForm');
  const email = document.getElementById('ledgerEmail');
  const note = document.getElementById('ledgerNote');
  const reply = document.getElementById('ledgerReply');
  const sub = document.getElementById('replySub');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = email.value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){
      note.textContent = 'A letter needs an address — may we have yours?';
      note.classList.add('on');
      email.focus();
      return;
    }
    note.classList.remove('on');
    const n = 901 + Math.floor(Math.random() * 98);
    sub.textContent = `Flacon Nº ${n} · seconde édition · votre ligne est tenue`;
    form.classList.add('sent');
    reply.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => reply.classList.add('on')));
    setTimeout(() => { form.setAttribute('hidden', ''); }, reduced() ? 0 : 850);
  });
}

/* ······················································ go */

initSmoke();
initWisps();
initReveals();
initHeader();
initProgress();
initLedger();
