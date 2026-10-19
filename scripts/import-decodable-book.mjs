// Imports a decodable reader from the ABCs app into /read/ as a free web book.
//
// Nothing here generates art or prose — cover, interior pages, titles and page
// text all come from apps/snackpack-1-abcs-alphabet. See READ-PLAN-2026-10.md (how-to history: docs/archive/READ-EXPANSION-PLAN-2026-08.md).
//
// Usage (from the website repo root):
//   node scripts/import-decodable-book.mjs --slug=ten-red-hens          # dry run
//   node scripts/import-decodable-book.mjs --slug=ten-red-hens --write
//   node scripts/import-decodable-book.mjs --all --write
//
// After importing, re-run: build-webp, build-sitemap, build-breadcrumbs.
//
// Existing books preserve their reviewed page shell, alt text, phonics cues,
// questions and generated controls. Only changed app prose is refreshed.
// Structural or artwork changes fail for review rather than silently dropping
// editorial work or replacing an image at a cache-first URL. New books use
// the current reader's shared head/header and generated integration markers.
// End-of-book questions are web editorial (the app has none): add one to
// QUESTIONS for any new book, in decodable words, answer plus a sound-out cue.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.resolve(ROOT, "..", "apps", "snackpack-1-abcs-alphabet");
const SRC_ART = path.join(APP, "assets", "decodable");
const DATA = path.join(APP, "constants", "decodableBooks.ts");
const OUT_ROOT = path.join(ROOT, "read");
const TEMPLATE = fs.readFileSync(path.join(OUT_ROOT, "hen-berrys-digraph-dash/index.html"), "utf8");
const SHARED = TEMPLATE.slice(TEMPLATE.indexOf("<!-- pwa:generated -->"), TEMPLATE.indexOf("</head>"));
const HEADER = TEMPLATE.slice(TEMPLATE.indexOf('<header class="topbar">'), TEMPLATE.indexOf("<main>"));
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, "data/decodable-art-pins.json"), "utf8"));
const digest = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const jpegName = (p) => p.replace(/\.(?:webp|png|jpe?g)$/i, ".jpg");
// These six books were already approved for the free web shelf. This does not
// change app tiers or approve any additional Pro book for publication.
const APPROVED_WEB = new Set(["pip-sits", "nan-and-pip", "ten-red-hens", "the-cat-and-the-rat", "bug-in-a-cup", "dog-in-the-fog"]);
const BEACON = "0e57cfb3eb86422ca40e5fac02b1cf94";
const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.snackpackuniverse.abcalphabet";

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ALL = args.includes("--all");
const slugArg = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1];

const QUESTIONS = {
  "pip-sits": ["What did Pip sit in?", "A pan. Can you sound out p-a-n?"],
  "nan-and-pip": ["What did Nan tap?", "A pan. Can you sound out p-a-n?"],
  "ten-red-hens": ["Where did the hens hide?", "In the pen. Can you sound out p-e-n?"],
  "the-cat-and-the-rat": ["Where did the rat hide?", "In a can. Can you sound out c-a-n?"],
  "bug-in-a-cup": ["What did Pip get?", "A big cup. Can you sound out c-u-p?"],
  "dog-in-the-fog": ["How did the dog find Nan in the fog?", "Nan hit a hot pot: bam, bam, bam! Can you sound out p-o-t?"],
};

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
  const existing = path.join(OUT_ROOT, book.id, "index.html");
  if (fs.existsSync(existing)) {
    const html = fs.readFileSync(existing, "utf8");
    const articles = [...html.matchAll(/<article class="story-page-card"[^>]*>[\s\S]*?<\/article>/g)];
    if (articles.length !== book.pages.length) throw new Error(`${book.id}: page count changed; review the full book before re-import`);
    let i = 0;
    const plain = (s) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
    return html.replace(/<article class="story-page-card"[^>]*>[\s\S]*?<\/article>/g, (article) => {
      const page = book.pages[i++];
      return article.replace(/(<div class="story-page-copy">[\s\S]*?<p>)([\s\S]*?)(<\/p>)/, (whole, before, prose, after) => {
        if (plain(prose) === page.text) return whole;
        // Retain reviewed word highlights where those exact words still occur.
        const marked = new Set([...prose.matchAll(/<mark>([^<]*)<\/mark>/g)].map(m => plain(m[1]).toLowerCase()));
        const fresh = esc(page.text).replace(/\b[A-Za-z]+\b/g, word => marked.has(word.toLowerCase()) ? `<mark>${word}</mark>` : word);
        return before + fresh + after;
      });
    });
  }
  const n = book.pages.length;
  const url = `https://www.snackpackuniverse.com/read/${book.id}/`;
  const desc = `Read ${book.title}, a complete ${n}-page illustrated SnackPack decodable story. ${book.focusSound}. Free, no sign-up.`;

  const pageCards = book.pages
    .map((p, i) => {
      const base = jpegName(p.file).replace(/\.jpg$/, "");
      // The illustration depicts the sentence, so the sentence is the honest alt.
      const alt = esc(p.text);
      const aside = p.tricky.length
        ? `<aside><strong>Grown-up help:</strong> ${p.tricky
            .map((w) => `&ldquo;${esc(w)}&rdquo;`)
            .join(" and ")} ${p.tricky.length > 1 ? "are tricky words" : "is a tricky word"} &mdash; read ${
            p.tricky.length > 1 ? "them" : "it"
          } together if needed.</aside>`
        : "";
      return `<article class="story-page-card" id="page-${i + 1}"><picture><source srcset="./pages/${base}.webp" type="image/webp"><img src="./pages/${jpegName(p.file)}" alt="${alt}" loading="lazy" width="1200" height="800"></picture><div class="story-page-copy"><span>Page ${i + 1} of ${n}</span><p>${esc(p.text)}</p>${aside}</div></article>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
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

<section><div class="shell story-finish-card"><span class="eyebrow">The end &middot; Brilliant reading</span>${QUESTIONS[book.id] ? `<h2>${esc(QUESTIONS[book.id][0])}</h2><details class="story-answer"><summary>Show the answer</summary><p>${esc(QUESTIONS[book.id][1])}</p></details><h3 class="story-grownups">For grown-ups</h3>` : "<h2>For grown-ups</h2>"}<p>${esc(book.parentNote)}</p><p>SnackPack ABC &amp; Alphabet continues with letter activities, read-together stories and more early phonics practice.</p><div class="stack-inline"><a class="btn btn-primary" href="${PLAY_URL}" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-1-abcs-alphabet/">Explore the app</a><a class="btn btn-secondary" href="./${book.id}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story from SnackPack ABC &amp; Alphabet.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-1-abcs-alphabet/">Privacy</a></div></div></footer>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${BEACON}"}'></script>
</body></html>
`;
  return html.replace('</head>', `<!-- breadcrumbs:generated -->\n<!-- /breadcrumbs:generated -->\n${SHARED}</head>`)
    .replace(/<header class="topbar">[\s\S]*?<main>/, `${HEADER}<main>`)
    .replace('href="#page-1">Begin the story</a>', 'href="#page-1">Begin the story</a><!-- read-share-top:generated -->\n<!-- /read-share-top:generated -->')
    .replace('<div class="stack-inline">', '<!-- read-next:generated -->\n<!-- /read-next:generated --><div class="stack-inline">');
}

function importBook(book) {
  const outDir = path.join(OUT_ROOT, book.id);
  const pagesDir = path.join(outDir, "pages");
  const copies = [[book.cover, "cover.jpg"], ...book.pages.map((p) => [p.file, jpegName(p.file)])];

  const missing = copies.filter(([src]) => !fs.existsSync(path.join(SRC_ART, src)));
  if (missing.length) {
    console.log(`  SKIP ${book.id}: missing art -> ${missing.map((m) => m[0]).join(", ")}`);
    throw new Error(`${book.id}: complete artwork is required`);
  }
  if (!book.isFree && !APPROVED_WEB.has(book.id)) throw new Error(`${book.id}: Pro publication requires a separate reviewed approval`);
  for (const [src, dest] of copies) {
    const target = path.join(pagesDir, dest);
    if (fs.existsSync(target)) {
      const pin = PINS.find(p => p.book === book.id && p.web === `read/${book.id}/pages/${dest}`);
      if (!pin || pin.app_sha256 !== digest(path.join(SRC_ART, src)) || pin.web_sha256 !== digest(target))
        throw new Error(`${book.id}/${dest}: art changed; review and use a revisioned web filename before import`);
    }
  }
  // Validate before any writes, so a failed review cannot leave a half import.
  const html = buildHtml(book);

  console.log(`  ${book.id}: "${book.title}" ${book.pages.length}p${book.isFree ? "" : "  [Pro in app]"}`);
  if (!WRITE) {
    copies.forEach(([s, d]) => console.log(`      ${s} -> read/${book.id}/pages/${d}`));
    return true;
  }

  fs.mkdirSync(pagesDir, { recursive: true });
  let bytes = 0;
  for (const [src, dest] of copies) {
    const target = path.join(pagesDir, dest);
    if (!fs.existsSync(target)) {
      execFileSync("magick", [path.join(SRC_ART, src), "-quality", "85", target]);
      execFileSync("magick", [path.join(SRC_ART, src), "-quality", "82", "-define", "webp:method=6", target.replace(/\.jpg$/, ".webp")]);
    }
    bytes += fs.statSync(path.join(pagesDir, dest)).size;
  }
  fs.writeFileSync(path.join(outDir, "index.html"), html);
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
