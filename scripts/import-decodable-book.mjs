// Imports a decodable reader from the ABCs app into /read/ as a free web book.
//
// Nothing here generates art or prose — cover, interior pages, titles and page
// text all come from apps/snackpack-1-abcs-alphabet. See READ-EXPANSION-PLAN.md.
//
// Usage (from the website repo root):
//   node scripts/import-decodable-book.mjs --slug=ten-red-hens          # dry run
//   node scripts/import-decodable-book.mjs --slug=ten-red-hens --write
//   node scripts/import-decodable-book.mjs --all --write
//
// After importing, re-run: build-webp, build-sitemap, build-breadcrumbs.

import fs from "node:fs";
import path from "node:path";

const APP = path.resolve("..", "apps", "snackpack-1-abcs-alphabet");
const SRC_ART = path.join(APP, "assets", "decodable");
const DATA = path.join(APP, "constants", "decodableBooks.ts");
const OUT_ROOT = path.resolve("read");
const BEACON = "0e57cfb3eb86422ca40e5fac02b1cf94";
const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.snackpackuniverse.abcalphabet";

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ALL = args.includes("--all");
const slugArg = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── Parse the app's TS source ────────────────────────────────────────────
// A regex parse is deliberate: importing the TS would drag in React Native's
// `require()` of image assets, which cannot resolve outside the app bundler.
function parseBooks() {
  const src = fs.readFileSync(DATA, "utf8");
  const blocks = src.split(/\n  \{\n    id: '/).slice(1);
  return blocks.map((b) => {
    const id = b.slice(0, b.indexOf("'"));
    const one = (k) => {
      const m = b.match(new RegExp(`${k}: '([^']*)'`));
      return m ? m[1] : "";
    };
    const noteM = b.match(/parentNote:\s*\n?\s*'((?:[^'\\]|\\.)*)'/);
    const pages = [...b.matchAll(
      /\{ text: '([^']*)',\s*trickyWords: \[([^\]]*)\],[\s\S]*?illustration: require\('\.\.\/assets\/decodable\/([^']+)'\)/g,
    )].map((m) => ({
      text: m[1],
      tricky: m[2].split(",").map((s) => s.trim().replace(/^'|'$/g, "")).filter(Boolean),
      file: m[3],
    }));
    const coverM = b.match(/cover: require\('\.\.\/assets\/decodable\/([^']+)'\)/);
    return {
      id,
      title: one("title"),
      subtitle: one("subtitle"),
      focusSound: one("focusSound"),
      stage: (b.match(/stage: (\d+)/) || [, "1"])[1],
      isFree: /isFree: true/.test(b),
      parentNote: noteM ? noteM[1].replace(/\\'/g, "'") : "",
      pages,
      cover: coverM ? coverM[1] : null,
    };
  });
}

function buildHtml(book) {
  const n = book.pages.length;
  const url = `https://www.snackpackuniverse.com/read/${book.id}/`;
  const desc = `Read ${book.title}, a complete ${n}-page illustrated SnackPack decodable story. ${book.focusSound}. Free, no sign-up.`;

  const pageCards = book.pages
    .map((p, i) => {
      const base = p.file.replace(/\.jpg$/, "");
      // The illustration depicts the sentence, so the sentence is the honest alt.
      const alt = esc(p.text);
      const aside = p.tricky.length
        ? `<aside><strong>Grown-up help:</strong> ${p.tricky
            .map((w) => `&ldquo;${esc(w)}&rdquo;`)
            .join(" and ")} ${p.tricky.length > 1 ? "are tricky words" : "is a tricky word"} &mdash; read ${
            p.tricky.length > 1 ? "them" : "it"
          } together if needed.</aside>`
        : "";
      return `<article class="story-page-card" id="page-${i + 1}"><picture><source srcset="./pages/${base}.webp" type="image/webp"><img src="./pages/${p.file}" alt="${alt}" loading="lazy" width="1200" height="800"></picture><div class="story-page-copy"><span>Page ${i + 1} of ${n}</span><p>${esc(p.text)}</p>${aside}</div></article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(book.title)} | Free Read-It-Myself Story</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(book.title)}"><meta property="og:description" content="A free ${n}-page illustrated first read-it-myself story."><meta property="og:image" content="${url}pages/cover.jpg"><meta property="og:url" content="${url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Organization", name: "SnackPack Studios" },
    isAccessibleForFree: true,
    educationalLevel: `Stage ${book.stage} phonics`,
    learningResourceType: "Decodable illustrated story",
    about: book.focusSound,
    numberOfPages: n,
    image: `${url}pages/cover.jpg`,
    url,
  })}</script>
</head>
<body class="story-reader-page">
<header class="topbar"><div class="shell topbar-inner"><a class="brand" href="../../"><img class="brand-mark" src="/assets/snackpack-mark-96.png" alt="SnackPack Studios icon" width="96" height="94"><span class="brand-copy"><span class="brand-title">SnackPack Studios</span><span class="brand-subtitle">Free illustrated reader</span></span></a><nav aria-label="Primary">
  <ul class="nav-links">
    <li><a href="/apps/">Apps</a></li>
    <li><a href="/play/">Play</a></li>
    <li><a href="/read/">Read</a></li>
    <li><a href="/guides/">Guides</a></li>
    <li><a href="/#pipeline">Roadmap</a></li>
    <li><a href="/privacy/">Privacy</a></li>
    <li><a href="/terms/">Terms</a></li>
    <li><a class="pill-link" href="mailto:support@snackpackuniverse.com">Support</a></li>
  </ul>
</nav></div></header>
<main>
<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">Stage ${book.stage} phonics &middot; Free</span><h1>${esc(book.title)}</h1><p class="lead">${esc(book.subtitle)}. A ${n}-page decodable story focusing on ${esc(book.focusSound)}.</p><div class="tag-row"><span class="tag">Stage ${book.stage}</span><span class="tag">Decodable</span><span class="tag">Read together</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a></div><picture><source srcset="./pages/cover.webp" type="image/webp"><img src="./pages/cover.jpg" alt="Cover of ${esc(book.title)}." width="1024" height="1536"></picture></div></section>

<section class="story-pages story-pages-landscape" aria-label="Story pages">
${pageCards}
</section>

<section><div class="shell story-finish-card"><span class="eyebrow">The end &middot; Brilliant reading</span><h2>For grown-ups</h2><p>${esc(book.parentNote)}</p><p>SnackPack ABC &amp; Alphabet continues with letter activities, read-together stories and more early phonics practice.</p><div class="stack-inline"><a class="btn btn-primary" href="${PLAY_URL}" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-1-abcs-alphabet/">Explore the app</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story from SnackPack ABC &amp; Alphabet.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-1-abcs-alphabet/">Privacy</a></div></div></footer>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${BEACON}"}'></script>
</body></html>
`;
}

function importBook(book) {
  const outDir = path.join(OUT_ROOT, book.id);
  const pagesDir = path.join(outDir, "pages");
  const copies = [[book.cover, "cover.jpg"], ...book.pages.map((p) => [p.file, p.file])];

  const missing = copies.filter(([src]) => !fs.existsSync(path.join(SRC_ART, src)));
  if (missing.length) {
    console.log(`  SKIP ${book.id}: missing art -> ${missing.map((m) => m[0]).join(", ")}`);
    return false;
  }

  console.log(`  ${book.id}: "${book.title}" ${book.pages.length}p${book.isFree ? "" : "  [Pro in app]"}`);
  if (!WRITE) {
    copies.forEach(([s, d]) => console.log(`      ${s} -> read/${book.id}/pages/${d}`));
    return true;
  }

  fs.mkdirSync(pagesDir, { recursive: true });
  let bytes = 0;
  for (const [src, dest] of copies) {
    fs.copyFileSync(path.join(SRC_ART, src), path.join(pagesDir, dest));
    bytes += fs.statSync(path.join(pagesDir, dest)).size;
  }
  fs.writeFileSync(path.join(outDir, "index.html"), buildHtml(book));
  console.log(`      wrote index.html + ${copies.length} images (${Math.round(bytes / 1024)} KB)`);
  return true;
}

const books = parseBooks();
const targets = ALL ? books : books.filter((b) => b.id === slugArg);
if (!targets.length) {
  console.error(`No book matched. Available: ${books.map((b) => b.id).join(", ")}`);
  process.exit(1);
}
console.log(WRITE ? "Importing:" : "Dry run (pass --write to apply):");
let done = 0;
for (const b of targets) if (importBook(b)) done++;
console.log(`\n${done}/${targets.length} book(s) ${WRITE ? "imported" : "ready"}.`);
if (WRITE) console.log("Next: node scripts/build-webp.mjs && node scripts/build-sitemap.mjs && node scripts/build-breadcrumbs.mjs");
