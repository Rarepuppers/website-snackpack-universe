// Imports a SnackPack Zoo World story book into /read/ (READ-PLAN B3).
//
// Text, title, summary and fact sources all come verbatim from the app
// (apps/snackpack-zoo-world/constants/zooData/additionalBooksData.ts and
// sourceNotes.ts); the art from its assets/books/<id>/. What lives here is
// only web editorial with no source in the app: the end-of-book question and
// answer, a one-line lead, and the shelf blurb.
//
// ORIGINAL ART ONLY. Most Zoo World page images are stock photos (Pexels,
// Unsplash, Wikimedia; see the app's unsplashBundledImageCredits.ts), which
// /read/ does not republish. So this refuses to import a book unless every
// page image is recorded as generated in the app's assets/books/GENERATED_ART.md
// (a page may reuse the generated cover if the files are byte-identical).
// Mark chose this route on 2026-10-16; the art brief for Animal Architects is
// apps/snackpack-zoo-world/docs/ART-BRIEF-ANIMAL-ARCHITECTS-2026-10-16.md.
//
// Usage (from the website repo root):
//   node scripts/import-zoo-book.mjs --id=animal-architects           # dry run + provenance check
//   node scripts/import-zoo-book.mjs --id=animal-architects --write
//
// Then, as for every book: build-webp (wraps each <img> in a <picture> where
// it makes a WebP), build-read-pdfs --slug=<slug> --write,
// build-read-responsive, add the book to SHELF in build-read-shelf.mjs and run
// it, build-read-social-cards.py, build-breadcrumbs, build-play-links,
// build-go-links, build-sitemap.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.resolve(ROOT, "../apps/snackpack-zoo-world");
const SITE = "https://www.snackpackuniverse.com";
const PLAY = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.zooworld";

const BOOKS = {
  "animal-architects": {
    slug: "animal-architects",
    lead: "A nine-page animal fact book: six wild builders, six clever homes, and the problem each one solves.",
    blurb: "Beavers, bees, weaverbirds, rabbits, octopuses and meerkats each build a home that solves a different problem.",
    end: {
      q: "Why does a beaver build a dam?",
      a: "The dam slows the river and turns it into a pond. In that safer water the beaver family builds a lodge with an underwater entrance.",
    },
  },
};

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ID = (args.find((a) => a.startsWith("--id=")) || "").slice(5);
if (!BOOKS[ID]) {
  console.error(`Usage: --id=<${Object.keys(BOOKS).join("|")}>; add --write to write.`);
  process.exit(1);
}
const ed = BOOKS[ID];

// ── Parse the app's TS source (regex, as the other importers do) ─────────
const SRC = fs.readFileSync(path.join(APP, "constants/zooData/additionalBooksData.ts"), "utf8");
const start = SRC.indexOf(`id: '${ID}',`);
if (start < 0) throw new Error(`${ID}: not found in additionalBooksData.ts`);
const block = SRC.slice(start, SRC.indexOf("\n  },", start));
const unq = (s) => s.replace(/\\(['"\\])/g, "$1");
const str = (name) => {
  const m = block.match(new RegExp(`${name}: '((?:[^'\\\\]|\\\\.)*)'`));
  if (!m) throw new Error(`${ID}: no ${name}`);
  return unq(m[1]);
};
if (!/isFree: true/.test(block)) throw new Error(`${ID}: not free in the app; Pro books need Mark's approval`);
const book = {
  title: str("title"),
  summary: str("summary"),
  sources: [...(block.match(/sourceNotes: \[([^\]]*)\]/)?.[1] ?? "").matchAll(/'([^']+)'/g)].map((m) => m[1]),
  pages: [...block.matchAll(/page\((\d+), "((?:[^"\\]|\\.)*)", '(?:[^'\\]|\\.)*', '(?:[^'\\]|\\.)*', '((?:[^'\\]|\\.)*)'/g)]
    .map((m) => ({ n: +m[1], text: unq(m[2]), alt: unq(m[3]) })),
};
if (book.pages.length !== 9 || book.pages.some((p, i) => p.n !== i + 1)) throw new Error(`${ID}: expected pages 1-9, got ${book.pages.map((p) => p.n)}`);

const NOTES = fs.readFileSync(path.join(APP, "constants/zooData/sourceNotes.ts"), "utf8");
const sources = book.sources.map((key) => {
  const b = NOTES.slice(NOTES.indexOf(`'${key}': {`));
  const get = (f) => b.match(new RegExp(`${f}: '([^']*)'`))[1];
  return { title: get("title"), publisher: get("publisher"), url: get("url") };
});

// ── Provenance gate ──────────────────────────────────────────────────────
const ART = path.join(APP, "assets/books", ID);
const LEDGER = fs.readFileSync(path.join(APP, "assets/books/GENERATED_ART.md"), "utf8");
const generated = (f) => LEDGER.includes(`Asset: \`${ID}/${f}\``);
const files = ["cover", ...book.pages.map((p) => `p${p.n}`)].map((k) => `${ID}-${k}.jpg`);
const coverBytes = fs.readFileSync(path.join(ART, files[0]));
const notOriginal = files.filter((f) => {
  if (generated(f)) return false;
  // A page that is the generated cover, byte for byte, is original too.
  return !(generated(files[0]) && fs.readFileSync(path.join(ART, f)).equals(coverBytes));
});

function jpegSize(buf) {
  for (let i = 2; i < buf.length;) {
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("no JPEG size");
}

console.log(`${WRITE ? "write" : "dry  "} read/${ed.slug}/  "${book.title}", ${book.pages.length} pages, sources: ${book.sources.join(", ")}`);
if (notOriginal.length) {
  console.error(`  NOT ORIGINAL ART (not in GENERATED_ART.md): ${notOriginal.join(", ")}`);
  console.error("  Refusing to import. See the art brief in the app's docs/.");
  process.exit(1);
}
console.log("  provenance: every image is generated SnackPack art");
if (!WRITE) process.exit(0);

// ── Render ───────────────────────────────────────────────────────────────
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const curly = (s) => s.replace(/(^|[\s(—])'/g, "$1‘").replace(/'/g, "’").replace(/(^|[\s(—])"/g, "$1“").replace(/"/g, "”");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "read/hen-berrys-digraph-dash/index.html"), "utf8");
const SHARED = TEMPLATE.slice(TEMPLATE.indexOf("<!-- pwa:generated -->"), TEMPLATE.indexOf("</head>"));
const HEADER = TEMPLATE.slice(TEMPLATE.indexOf('<header class="topbar">'), TEMPLATE.indexOf("<main>"));
const url = `${SITE}/read/${ed.slug}/`;
const [main, sub] = book.title.split(/: /);
const sizes = Object.fromEntries(files.map((f) => [f, jpegSize(fs.readFileSync(path.join(ART, f)))]));
// Plain <img>: build-webp wraps it in a <picture> only when it actually makes a
// WebP (it skips images under 120 KB), so no <source> can point at a missing file.
const pic = (f, alt, lazy) =>
  `<img src="./pages/${f}" alt="${esc(alt)}" width="${sizes[f].w}" height="${sizes[f].h}"${lazy ? ' loading="lazy"' : ""}>`;
const cards = book.pages.map((p, i) =>
  `<article class="story-page-card" id="page-${p.n}">${pic(files[i + 1], p.alt, true)}<div class="story-page-copy"><span>Page ${p.n} of ${book.pages.length}</span><p>${esc(curly(p.text))}</p></div></article>`
).join("\n");
const ld = JSON.stringify({
  "@context": "https://schema.org", "@type": "Book", name: book.title,
  author: { "@type": "Organization", name: "SnackPack Studios" },
  isAccessibleForFree: true, educationalLevel: "Confident reader", learningResourceType: "Illustrated animal fact book",
  about: "Animal homes and how animals build them", image: `${url}pages/${files[0]}`, url,
});
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(book.title)} | Free Illustrated Animal Fact Book</title>
<meta name="description" content="Read ${esc(book.title)}, a free 9-page illustrated animal fact book for children. ${esc(book.summary)} Printable PDF included.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(book.title)}"><meta property="og:description" content="${esc(ed.blurb)}"><meta property="og:image" content="${url}pages/${files[0]}"><meta property="og:url" content="${url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">${ld}</script>
<!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
${SHARED}</head>
<body class="story-reader-page story-hero-landscape story-long-copy">
${HEADER}<main>
<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">Animal fact book · Free</span><h1>${esc(main)}${sub ? `<br>${esc(sub)}` : ""}</h1><p class="lead">${esc(ed.lead)}</p><div class="tag-row"><span class="tag">Read together</span><span class="tag">Animal homes</span><span class="tag">9 pages</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a></div>${pic(files[0], "", false)}</div></section>

<section class="story-pages story-pages-landscape story-pages-natural" aria-label="Story pages">
${cards}
</section>

<section><div class="shell story-finish-card"><span class="eyebrow">The end · Great reading</span><h2>${esc(ed.end.q)}</h2><details class="story-answer"><summary>Show the answer</summary><p>${esc(ed.end.a)}</p></details><p>Facts checked against ${sources.map((s) => `<a class="text-link" href="${s.url}" target="_blank" rel="noopener">${esc(s.publisher)}: ${esc(s.title)}</a>`).join(", ").replace(/, ([^,]*)$/, " and $1")}. SnackPack Zoo World has more animal stories, sixty animals to meet and a sound library.</p><!-- read-next:generated -->
<!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-primary" href="${PLAY}" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-12-zoo-world/">Explore the app</a><a class="btn btn-secondary" href="./${ed.slug}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story and illustrations from SnackPack Zoo World.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-12-zoo-world/">Privacy</a></div></div></footer>
  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}'></script>
  <!-- End Cloudflare Web Analytics -->
</body></html>
`;
const dir = path.join(ROOT, "read", ed.slug);
fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
for (const f of files) fs.copyFileSync(path.join(ART, f), path.join(dir, "pages", f));
fs.writeFileSync(path.join(dir, "index.html"), html);
console.log(`  wrote read/${ed.slug}/index.html and ${files.length} images`);
