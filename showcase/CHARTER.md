# The Showcase Charter

You are building ONE site of a 25-site collection demonstrating what Claude can do in
web design, taste, and artistic flavor. It will be shown publicly to 500,000+ people.
Your site must be unmistakable — nothing template-like, nothing that could ship from a
component library. Judgment, not restraint anxiety, sets the ceiling.

## Hard rules

1. **Every visual is generated in code.** WebGL shaders, canvas, SVG, CSS. No external
   images, no CDNs, no runtime network requests of any kind. Fonts come ONLY from the
   self-hosted bundles at `/fonts/<slug>.css` (see FONTS.md list). three.js r160 is
   vendored at `/vendor/three.module.min.js` (ES module import).
2. **Self-contained.** Your site lives at `showcase/public/<NN-slug>/index.html`.
   You may add sibling files (`app.js`, `style.css`) inside YOUR directory only.
   Never touch any file outside your directory (fonts/vendor are read-only).
3. **Real, original copy.** The site is a fictional brand — full, sincere copywriting
   in English. No lorem ipsum, no real trademarks, no placeholder anything. Every
   button alive (a dead-end CTA gets a graceful in-character response).
4. **`lang="en"`**, unique `<title>`, meta description, and an inline SVG favicon via
   data URI (`<link rel="icon" href="data:image/svg+xml,...">`) matching the palette.
5. **Footer credit** (styled to match your design): "Designed & built in code by
   Claude" with two links: `/` (label: Gallery) and `/guide/` (label: How this was made).

## Craft bar

- A **"wow" within 3 seconds** of load: the hero must carry the signature technique.
- One **signature interaction** minimum (hover physics, scroll choreography, pointer
  reaction, a playable toy — something the visitor discovers).
- **Typography as art**: scale contrast (huge display vs small caps/mono details),
  tight tracking control, optical alignment. No default font sizes.
- **Exceptional palette**: define CSS custom-property tokens; commit to a mood.
  Body text contrast ≥ WCAG AA. Never default-blue links.
- **Layered depth**: grain, glow, vignette, parallax — at least two layers of
  atmosphere so nothing looks flat.
- **Motion**: custom easing (e.g. cubic-bezier(.22,1,.36,1)), scroll-triggered reveals
  via IntersectionObserver, choreographed stagger. Nothing snaps; nothing lags.
- 4–6 distinct sections (hero + concept + detail/gallery + interactive + closing CTA),
  unless the brief says otherwise.

## Engineering bar

- 60fps: cap `devicePixelRatio` at 1.5 (1 on coarse pointers), pause rAF loops when
  `document.hidden` or the canvas is offscreen (IntersectionObserver).
- `prefers-reduced-motion: reduce` → still a COMPLETE, beautiful page: render one
  still frame of shaders, show full text instantly, disable autonomous motion.
- Semantic HTML, focus-visible styles, `aria-hidden` on decorative canvases,
  keyboard-reachable interactive elements.
- Mobile 390px: no horizontal scroll, hero holds up, tap targets ≥ 40px.
- Zero console errors/warnings. All links resolve (`/`, `/guide/`, in-page anchors).

## Workflow

- The bundle is served at `http://localhost:8080/` (already running — just save and
  reload). Your site: `http://localhost:8080/<NN-slug>/`.
- Screenshot rig: `/tmp/claude-0/-home-user-repository-1/4ab90e79-d971-533e-a799-d3b9f5852228/scratchpad`
  has `node_modules/playwright-core`; Chromium binary at `/opt/pw-browsers/chromium`.
  Write your scripts and PNGs in `scratchpad/<NN-slug>/`. Do NOT start servers.
- **Three iteration passes are mandatory** after your first complete draft. A pass =
  screenshot desktop 1440×900 (hero + every section + interaction states) and mobile
  390×844 (hero + 2 sections) → LOOK at them → list concrete faults → fix → re-shoot.
  - Pass 1: composition, spacing rhythm, typographic hierarchy.
  - Pass 2: color depth, motion quality, and ADDED richness (complexify: more
    atmosphere, better detail, a second discovery moment).
  - Pass 3: polish — alignment nits, mobile, reduced-motion, console, link audit.
- Final QA (all must pass): zero console errors; zero non-localhost requests
  (assert with a playwright request listener); reduced-motion complete; no
  horizontal scroll at 390px.

## Report back (your final message)

1. One-paragraph description of the site + its techniques (for the /guide credits).
2. What each of the 3 passes found and changed (2-4 bullets each).
3. QA confirmation lines.
4. The exact list of font CSS files you used.
