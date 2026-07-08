/**
 * Self-hosting font pipeline.
 * Downloads Google Fonts woff2 files at build time (never at runtime),
 * writes them into public/fonts/files/ and emits one small CSS file per
 * family bundle. Deployed sites make zero external requests.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = new URL("../public/fonts/", import.meta.url).pathname;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// slug -> css2 query (family + axes). `text` = subset for CJK faces.
const MANIFEST = [
  ["unbounded", "family=Unbounded:wght@300;500;800"],
  ["space-grotesk", "family=Space+Grotesk:wght@300;400;500;700"],
  ["italiana", "family=Italiana"],
  ["bodoni-moda", "family=Bodoni+Moda:ital,wght@0,400;0,700;1,400"],
  ["manrope", "family=Manrope:wght@200;400;600"],
  ["sora", "family=Sora:wght@300;600"],
  ["spectral", "family=Spectral:ital,wght@0,300;0,400;0,800;1,300;1,400"],
  ["jetbrains-mono", "family=JetBrains+Mono:wght@400;700"],
  ["eb-garamond", "family=EB+Garamond:ital,wght@0,400;0,500;1,400"],
  ["instrument-serif", "family=Instrument+Serif:ital@0;1"],
  ["archivo", "family=Archivo:ital,wdth,wght@0,62..125,100..900"],
  ["archivo-black", "family=Archivo+Black"],
  ["space-mono", "family=Space+Mono:ital,wght@0,400;0,700;1,400"],
  ["marcellus", "family=Marcellus"],
  ["vt323", "family=VT323"],
  ["press-start-2p", "family=Press+Start+2P"],
  ["inter-tight", "family=Inter+Tight:wght@400;600;800"],
  ["fraunces", "family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900"],
  ["ibm-plex-mono", "family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400"],
  ["newsreader", "family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500"],
  ["dm-sans", "family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700"],
  ["cormorant-garamond", "family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500"],
  ["unifraktur", "family=UnifrakturMaguntia"],
  ["im-fell", "family=IM+Fell+English:ital@0;1"],
  ["ibm-plex-sans", "family=IBM+Plex+Sans:wght@300;400;600"],
  ["ibm-plex-serif", "family=IBM+Plex+Serif:ital,wght@0,300;0,600;1,300"],
  ["playfair", "family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400"],
  ["chivo-mono", "family=Chivo+Mono:wght@300;400"],
  ["major-mono", "family=Major+Mono+Display"],
  ["libre-caslon", "family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400"],
  ["bricolage", "family=Bricolage+Grotesque:opsz,wght@12..96,200..800"],
  ["cinzel", "family=Cinzel:wght@400;600"],
  ["tenor-sans", "family=Tenor+Sans"],
  ["oswald", "family=Oswald:wght@400;600"],
  ["figtree", "family=Figtree:ital,wght@0,300;0,600;1,300"],
  ["poiret-one", "family=Poiret+One"],
  [
    "shippori-mincho",
    "family=Shippori+Mincho:wght@400;600",
    "茶室静寂季節春夏秋冬月雪花風香道一期会侘寂庭石水光影間和敬清",
  ],
];

await mkdir(path.join(ROOT, "files"), { recursive: true });

let files = 0;
for (const [slug, query, text] of MANIFEST) {
  const url =
    `https://fonts.googleapis.com/css2?${query}&display=swap` +
    (text ? `&text=${encodeURIComponent(text)}` : "");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    console.error(`FAIL ${slug}: HTTP ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  let css = await res.text();
  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map((m) => m[1]);
  for (const u of [...new Set(urls)]) {
    const bin = Buffer.from(await (await fetch(u)).arrayBuffer());
    const name = createHash("sha1").update(u).digest("hex").slice(0, 12) + path.extname(new URL(u).pathname);
    await writeFile(path.join(ROOT, "files", name), bin);
    css = css.replaceAll(u, `/fonts/files/${name}`);
    files++;
  }
  await writeFile(path.join(ROOT, `${slug}.css`), css);
  console.log(`ok ${slug} (${urls.length} files)`);
}
console.log(`done: ${files} font files`);
