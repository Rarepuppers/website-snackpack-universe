// Imports a Reading Trail book from SnackPack Sentences & Spelling into /read/.
//
// Nothing here generates art or prose. Titles, page text, prompts and the quiz
// all come from apps/snackpack-3-spelling-sentences/constants/reading-trail-drafts.ts,
// and the page art from that app's assets/book-page-art/. What lives here is
// only the web editorial that has no source in the app: the page alt text
// (written from the actual illustrations, which sometimes differ in detail
// from the story text) and a one-line lead. See READ-PLAN-2026-10.md.
//
// Usage (from the website repo root):
//   node scripts/import-reading-trail-book.mjs --id=stripe-scout-blend-bridge          # dry run
//   node scripts/import-reading-trail-book.mjs --id=stripe-scout-blend-bridge --write
//   node scripts/import-reading-trail-book.mjs --all --write
//
// Then: build-webp, build-read-pdfs --slug=<slug> --write, add the book to
// SHELF in build-read-shelf.mjs, build-read-shelf, build-breadcrumbs,
// build-play-links, build-go-links, build-sitemap.
//
// Mark approved publishing Reading Trail steps 3-6 (Pro in the app) on the
// free web shelf on 2026-10-15. Any other Pro book still needs his approval.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.resolve(ROOT, "../apps/snackpack-3-spelling-sentences");
const SITE = "https://www.snackpackuniverse.com";
const PLAY = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.sentencesspelling";

// Per-book web editorial. `slug` is the public URL; `alts` describe the art.
const BOOKS = {
  "stripe-scout-blend-bridge": {
    slug: "stripe-scouts-blend-bridge",
    skill: "Consonant blends",
    lead: "A five-page bridge-building adventure for practising blends like fl, cr, dr, st and pl.",
    blurb: "A branch blocks the bridge. A frog, a crab and a lot of blends help Stripe-Scout lift it.",
    about: "Initial and final consonant blends",
    pattern: /^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|str|sw|tr)|(st|nt|mp|nd|lp|ft|sk)s?$/,
    alts: [
      "Stripe-Scout the tiger holds a compass on a wooden bridge blocked by a fallen branch.",
      "Stripe-Scout tugs at the branch while a frog and a crab come to help.",
      "The frog, Stripe-Scout and the crab lift the branch high above the bridge planks.",
      "Stripe-Scout holds a flag while the frog taps a drum and the crab dances.",
      "The three friends hold up a sign in front of the bridge, with a flag flying behind them."
    ]
  },
  "sub-zero-magic-e-lantern": {
    slug: "sub-zeros-magic-e-lantern",
    skill: "Magic e",
    lead: "A five-page snowy rescue for practising silent-e words like kite, note, rope and home.",
    blurb: "A lost note, a runaway kite and a lantern made from tape, rope and a red cape.",
    about: "Silent-e (split digraph) vowel changes",
    pattern: /(^|[^aeiou])[aeiou][^aeiouwy]es?$/,
    stop: ["becomes", "message"],
    alts: [
      "Sub-Zero the penguin ties a note to a kite in the falling snow.",
      "The kite dives away on the wind and the note flutters past a large ice cube.",
      "Sub-Zero ties rope around a lantern frame next to a red cape and a roll of tape.",
      "Sub-Zero holds a glowing lantern by a snowy stone gate, lighting the path home.",
      "Sub-Zero walks a glowing path as a rabbit, an otter and a squirrel wave hello."
    ]
  },
  "meow-inara-vowel-team-duet": {
    slug: "meow-inaras-vowel-team-duet",
    skill: "Vowel teams",
    lead: "A five-page rainy-night duet for practising vowel teams: ai, ee, oa and ea.",
    blurb: "The music never arrives, so Meow-inara listens, paints the beat and plays anyway.",
    about: "Vowel teams ai, ee, oa and ea",
    pattern: /ai|ee|oa|ea/,
    alts: [
      "Meow-inara the cat waits with a basket by a green gate in the rain.",
      "Pork-ulele plays a ukulele in a small boat on the canal while Meow-inara watches from the gate.",
      "Meow-inara paints three curved sound marks on paper beside pots of paint.",
      "Meow-inara sings into a microphone as Pork-ulele plays under the full moon.",
      "Meow-inara holds up her painted music sheet beside Pork-ulele and his ukulele."
    ]
  },
  "quill-berry-ending-clues": {
    slug: "quill-berrys-ending-clues",
    skill: "Word endings",
    lead: "A five-page library puzzle for practising endings like -ing, -ed and -er, and clapping two-beat words.",
    blurb: "A poem has lost its endings. Quill-Berry adds -ing, -ed and -er and claps the beats.",
    about: "Inflectional endings -ing, -ed, -er and two-syllable words",
    pattern: /^.{2,}(ing|ings|ed|er)$/,
    stop: ["together"],
    alts: [
      "Quill-Berry the hedgehog looks surprised at an open book with blank spaces and a quill pen.",
      "Quill-Berry lines up word cards on a library desk beside an open storybook.",
      "Quill-Berry runs alongside a turtle as two bouncing balls show the beats in a word.",
      "Quill-Berry and a child clap together on a patterned library floor.",
      "Quill-Berry points to a giant open book with one page left blank for the next reader."
    ]
  }
};

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ALL = args.includes("--all");
const ONE = (args.find((a) => a.startsWith("--id=")) || "").slice(5);
const ids = ALL ? Object.keys(BOOKS) : [ONE];
if (!ids[0] || ids.some((id) => !BOOKS[id])) {
  console.error(`Usage: --id=<${Object.keys(BOOKS).join("|")}> or --all; add --write to write.`);
  process.exit(1);
}

// ── Parse the app's TS source ────────────────────────────────────────────
// A regex parse, same reasoning as import-decodable-book.mjs: importing the TS
// would drag in the app's bundler-only require() calls.
const SRC = fs.readFileSync(path.join(APP, "constants/reading-trail-drafts.ts"), "utf8");

// Reads a single- or double-quoted JS string literal starting at s[i].
function readString(s, i) {
  const q = s[i];
  let out = "";
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === "\\") { out += s[j + 1]; j++; continue; }
    if (s[j] === q) return { value: out, end: j + 1 };
    out += s[j];
  }
  throw new Error("unterminated string");
}
function field(block, name) {
  const m = new RegExp(`\\b${name}:\\s*(['"])`).exec(block);
  if (!m) throw new Error(`missing ${name}`);
  return readString(block, m.index + m[0].length - 1).value;
}
function parseBook(id) {
  const start = SRC.indexOf(`id: 'reading-trail-${id}'`);
  if (start === -1) throw new Error(`reading-trail-${id} not found in reading-trail-drafts.ts`);
  const next = SRC.indexOf("id: 'reading-trail-", start + 10);
  const block = SRC.slice(start, next === -1 ? undefined : next);
  const step = Number(/trailStep:\s*(\d+)/.exec(block)[1]);
  const targetWords = [...(/targetWords:\s*\[([^\]]*)\]/.exec(block)[1]).matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const pagesBlock = block.slice(block.indexOf("pages: ["), block.indexOf("quiz:"));
  const pages = [];
  for (const line of pagesBlock.split("\n")) {
    if (!/\{\s*id:\s*'p\d+'/.test(line)) continue;
    pages.push({ text: field(line, "text"), prompt: field(line, "prompt"), focusWord: field(line, "focusWord") });
  }
  const quizLine = block.slice(block.indexOf("quiz:"), block.indexOf("quiz2:"));
  return {
    step,
    title: field(block, "title"),
    subtitle: field(block, "subtitle"),
    targetWords,
    pages,
    quiz: { question: field(quizLine, "question"), answer: field(quizLine, "answer"), why: field(quizLine, "why") }
  };
}

// ── Render ───────────────────────────────────────────────────────────────
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const curly = (s) => s.replace(/'/g, "’");

// Highlight the words that practise this book's skill: its own target words,
// plus any word matching the skill's spelling pattern. Hyphenated character
// names (Stripe-Scout, Pork-ulele) are never marked: "Stripe" is not a blend
// the reader is meant to be practising.
function mark(text, words, ed) {
  const set = new Set(words.map((w) => w.toLowerCase()));
  const stop = new Set(ed.stop || []);
  return esc(curly(text)).replace(/[A-Za-z]+(?:-[A-Za-z]+)*/g, (w) => {
    if (w.includes("-")) return w;
    const l = w.toLowerCase();
    const stem = l.replace(/(s|es|ed|ing)$/, "");
    const hit = !stop.has(l) && (set.has(l) || set.has(stem) || ed.pattern.test(l));
    return hit ? `<mark>${w}</mark>` : w;
  });
}

// The shared head blocks (pwa/theme) and header are copied from an existing
// reader so this script never drifts from the generators that own them.
const TEMPLATE = fs.readFileSync(path.join(ROOT, "read/hen-berrys-digraph-dash/index.html"), "utf8");
const SHARED = TEMPLATE.slice(TEMPLATE.indexOf("<!-- pwa:generated -->"), TEMPLATE.indexOf("</head>"));
const HEADER = TEMPLATE.slice(TEMPLATE.indexOf('<header class="topbar">'), TEMPLATE.indexOf("<main>"));

function render(id, book, ed) {
  const { slug } = ed;
  const art = `reading-trail-${id}`;
  const url = `${SITE}/read/${slug}/`;
  const title = curly(book.title);
  const n = book.pages.length;
  const words = book.targetWords;
  const [first, second] = title.split(/(?<=’s) /);
  const nb = (t) => t.replace(/-/g, "‑");
  const h1 = second ? `${nb(first)}<br>${nb(second)}` : nb(title);
  const titleCase = ed.skill.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const cards = book.pages.map((p, i) =>
    `<article class="story-page-card" id="page-${i + 1}"><picture><source srcset="./pages/${art}-p${i + 1}.webp" type="image/webp"><img src="./pages/${art}-p${i + 1}.jpg" alt="${esc(ed.alts[i])}" width="768" height="1152" loading="lazy"></picture><div class="story-page-copy"><span>Page ${i + 1} of ${n}</span><p>${mark(p.text, words, ed)}</p><aside><strong>Talk together:</strong> ${esc(curly(p.prompt))}</aside></div></article>`
  ).join("\n");
  const ld = JSON.stringify({
    "@context": "https://schema.org", "@type": "Book", name: title,
    author: { "@type": "Organization", name: "SnackPack Studios" },
    isAccessibleForFree: true, educationalLevel: "Beginning reader", learningResourceType: "Illustrated story",
    about: ed.about, image: `${url}pages/${art}-p1.jpg`, url
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Free ${titleCase} Story</title>
<meta name="description" content="Read ${esc(title)}, a free ${n}-page illustrated story for beginning readers. ${esc(ed.lead.replace(/^A [a-z-]+-page /, "").replace(/^./, (c) => c.toUpperCase()))} Printable PDF included.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(ed.blurb)}"><meta property="og:image" content="${url}pages/${art}-p1.jpg"><meta property="og:url" content="${url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">${ld}</script>
<!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
${SHARED}</head>
<body class="story-reader-page">
${HEADER}<main>
<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">Reading Trail · Step ${book.step} · Free</span><h1>${h1}</h1><p class="lead">${esc(ed.lead)}</p><div class="tag-row"><span class="tag">Beginning reader</span><span class="tag">${ed.skill}</span><span class="tag">Read together</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a></div><picture><source srcset="./pages/${art}-p1.webp" type="image/webp"><img src="./pages/${art}-p1.jpg" alt="${esc(ed.alts[0])}" width="768" height="1152"></picture></div></section>

<section class="story-pages" aria-label="Story pages">
${cards}
</section>

<section><div class="shell story-finish-card"><span class="eyebrow">The end · Great reading</span><h2>${esc(curly(book.quiz.question))}</h2><details class="story-answer"><summary>Show the answer</summary><p>${esc(curly(book.quiz.answer))}. ${esc(curly(book.quiz.why))}</p></details><p>SnackPack Sentences &amp; Spelling has the full Reading Trail, longer stories, word packs and eight literacy games.</p><!-- read-next:generated -->
<!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-primary" href="${PLAY}" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-3-spelling-sentences/">Explore the app</a><a class="btn btn-secondary" href="./${slug}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story from SnackPack Sentences &amp; Spelling.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-3-spelling-sentences/">Privacy</a></div></div></footer>
  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}'></script>
  <!-- End Cloudflare Web Analytics -->
</body></html>
`;
}

for (const id of ids) {
  const ed = BOOKS[id];
  const book = parseBook(id);
  if (book.pages.length !== ed.alts.length) throw new Error(`${id}: ${book.pages.length} pages but ${ed.alts.length} alt texts`);
  const art = `reading-trail-${id}`;
  const missing = book.pages.map((_, i) => path.join(APP, "assets/book-page-art", `${art}-p${i + 1}.jpg`)).filter((f) => !fs.existsSync(f));
  if (missing.length) throw new Error(`${id}: missing art ${missing.join(", ")}`);
  const dir = path.join(ROOT, "read", ed.slug);
  console.log(`${WRITE ? "write" : "dry  "} read/${ed.slug}/  step ${book.step}, ${book.pages.length} pages, "${book.title}"`);
  if (!WRITE) continue;
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  for (let i = 1; i <= book.pages.length; i++) {
    fs.copyFileSync(path.join(APP, "assets/book-page-art", `${art}-p${i}.jpg`), path.join(dir, "pages", `${art}-p${i}.jpg`));
  }
  fs.writeFileSync(path.join(dir, "index.html"), render(id, book, ed));
}
