// Imports a free SnackPack 1-2-3 Counting story into /read/ as a counting story.
//
// Text comes verbatim from the app: title, page titles and bodies, each page's
// question with its choices and right answer, the success line, and the
// closing celebration. The app's own TypeScript is loaded (with the app's own
// TypeScript compiler), so page art resolves exactly as the app's reader does
// it: getStoryPageArtwork(storyId, pageIndex) in constants/storyPageArtwork.ts.
// Only web editorial lives here: alt text written from the pictures, a lead
// line, the shelf blurb and one end-of-book question.
//
// REVIEWED ART ONLY. Each entry pins the image file it was quality-read
// against, page by page (`art`). If the app maps a different file to a page,
// for example new art from a Codex brief, the import refuses until someone
// views the new picture against its text and updates the pin and the alt text.
// It also refuses Pro books (Mark's call) and any page without art.
//
// Quality read, 2026-10-17 (READ-PLAN-2026-10.md, B1):
//   * panda-cake-market-basket, sub-zero-snowflake-post, luckybug-pairing-parade
//       pass. Their missing and off-model pages were redrawn by Codex
//       (monorepo docs/ART-BRIEF-STORY-GAPS-2026-10-16.md, delivered 3572e1a31
//       and c37c44c2d); every page was viewed against its text and counted.
//   * corgi-cob-ten-frame-picnic   rejected: Ted-E-Bear in the text is drawn
//       as Bottle-Nose the dolphin on all six pages; page 4 has no sideways
//       frame; page 5 shows 8 of 12 spaces for "seven ... make ten"; page 6's
//       "complete ten-frame" shows 7 of 11.
//   * honey-beats-number-neighbours   rejected: Flutter-Butter in the text is
//       drawn as Bottle-Nose; the stones the text numbers carry no numbers;
//       page 4's reversed stone is not in the picture.
//   * cereal-swimmer-number-line-lagoon   not read: its octopus changes design
//       on page 3.
//   * ted-e-bear-button-trail   on the shelf since 2026-08-12 (hand-built), but
//       its pages 4-6 show the wrong pictures; redraws are briefed in
//       docs/ART-BRIEF-LIVE-BOOK-FIXES-2026-10-17.md. Add it here once they land.
//
// Usage (from the website repo root):
//   node scripts/import-counting-book.mjs                 # dry run, every entry
//   node scripts/import-counting-book.mjs --id=<id> --write
//
// Then, as for every book: build-webp (wraps each <img> in a <picture> where
// it makes a WebP), build-read-pdfs --slug=<slug> --write,
// build-read-responsive, add the book to SHELF in build-read-shelf.mjs (group
// "numbers") and run it, build-read-social-cards.py, build-breadcrumbs,
// build-play-links, build-go-links, build-sitemap.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.resolve(ROOT, "../apps/snackpack-2-123s-counting");
const SITE = "https://www.snackpackuniverse.com";
const PLAY = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.counting";

const BOOKS = {
  "panda-cake-market-basket": {
    slug: "panda-cakes-market-basket",
    lead: "A six-page bakery picnic for counting, comparing and making ten, with a question on every page.",
    blurb: "Apples, berries, buns and one tiny honey jar. Panda-Cake counts the picnic basket full, with room to share.",
    art: [
      "panda-cake-market-basket-three-apples-landscape-v2.jpg",
      "panda-cake-market-basket-p2-v3.jpg",
      "panda-cake-market-basket-3-landscape-v2.jpg",
      "panda-cake-market-basket-p4-v3.jpg",
      "panda-cake-market-basket-p5-v3.jpg",
      "panda-cake-market-basket-p6-v3.jpg",
    ],
    alts: [
      "Panda-Cake, a panda in a chef's hat, reaches for three red apples rolling across the bakery counter while Corgi-on-the-Cob peeks out of a basket.",
      "Panda-Cake stands between two market stalls: one bowl holds four blueberries and the other holds six.",
      "Four bread baskets wait on the counter, the third hidden under a checked cloth, as Panda-Cake and Corgi look on.",
      "Panda-Cake sets out two rows of five buns, one on a blue cloth and one on a yellow cloth, while Corgi keeps watch.",
      "A packed picnic basket of apples, blueberries and buns with one empty corner, and a small jar of honey waiting beside it.",
      "Woodland friends gather round a long picnic table set with twelve colourful plates in two rows of six.",
    ],
    end: {
      q: "How did Panda-Cake fit the honey jar into a full basket?",
      a: "By looking carefully, Panda-Cake found the one open corner and arranged everything so the jar fitted without squashing a single bun.",
    },
  },
  "sub-zero-snowflake-post": {
    slug: "sub-zero-and-the-snowflake-post",
    lead: "A six-page snowy delivery round for number order, comparing and counting to fifteen, with a question on every page.",
    blurb: "A gust mixes up every parcel. Sub-Zero and Booklava put the numbers back in order before the sun gets warm.",
    art: [
      "sub-zero-snowflake-post-p1-v3.jpg",
      "sub-zero-snowflake-post-p2-v3.jpg",
      "sub-zero-snowflake-post-p3-v3.jpg",
      "sub-zero-snowflake-post-p4-v3.jpg",
      "sub-zero-snowflake-post-p5-v3.jpg",
      "sub-zero-snowflake-post-p6-v3.jpg",
    ],
    alts: [
      "Sub-Zero, a penguin in a chef's hat and tuxedo, wears one blue snowflake mitten while Booklava the owl ties the pair together. Parcel tags blow past the open door.",
      "Four parcel sleds in the snow with cards showing 7, 8, a blank card turned face down, and 10. Booklava flies above.",
      "Two trails of icy stepping stones curve around a snowdrift: six stones on the left and nine on the right.",
      "Sub-Zero rings one of ten silver bells along a snowy garden fence, holding a parcel.",
      "Sub-Zero peeks into an empty basket beside a completely empty parcel shelf while Booklava perches on top.",
      "Sub-Zero and Booklava hang fifteen paper snowflakes, each with a tiny picture, above the post-office desk.",
    ],
    end: {
      q: "Why was the empty shelf good news?",
      a: "An empty outgoing shelf meant every parcel had reached the right home.",
    },
  },
  "luckybug-pairing-parade": {
    slug: "luckybugs-pairing-parade",
    lead: "A six-page garden parade for learning odd and even numbers by making pairs, with a question on every page.",
    blurb: "Every marcher needs a partner, until one is left over. Luckybug finds a place for everyone.",
    art: [
      "luckybug-pairing-parade-p1-v3.jpg",
      "luckybug-pairing-parade-1-landscape-v2.jpg",
      "luckybug-pairing-parade-p3-v3.jpg",
      "luckybug-pairing-parade-3-landscape-v2.jpg",
      "luckybug-pairing-parade-4-landscape-v2.jpg",
      "luckybug-pairing-parade-5-landscape-v2.jpg",
    ],
    alts: [
      "Luckybug the ladybird pegs two red flags to a string while Flutter-Butter the butterfly flutters beside them, delighted.",
      "Luckybug points to three ladybird drummers standing in a row with their drums.",
      "Under a garden arch hung with two red bows and two blue bows, Luckybug waves and Flutter-Butter flutters nearby.",
      "Luckybug behind two boards of flowers: six yellow flowers in pairs, and five red flowers with one left over.",
      "Luckybug points at trays holding two, four and six counters, with an empty tray at the end.",
      "Luckybug leads the parade through the garden gate: two butterflies, two bees, two snails and two caterpillars marching in pairs.",
    ],
    end: {
      q: "Nine friends marched in the parade. Why did one of them walk at the front?",
      a: "Nine makes four pairs with one left over, because nine is odd. The one left over became the leader, so nobody was left out.",
    },
  },
};

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ONLY = (args.find((a) => a.startsWith("--id=")) || "").slice(5);
if (ONLY && !BOOKS[ONLY]) {
  console.error(`Unknown --id=${ONLY}. Known: ${Object.keys(BOOKS).join(", ")}`);
  process.exit(1);
}
if (WRITE && !ONLY) {
  console.error("--write needs --id=<id>, one book at a time.");
  process.exit(1);
}

// ── Load the app's data the way the app does ─────────────────────────────
const appRequire = createRequire(path.join(APP, "package.json"));
const ts = appRequire("typescript");
const req = createRequire(import.meta.url);
req.extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, f);
for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) req.extensions[ext] = (m, f) => { m.exports = f; };
globalThis.__DEV__ = false;
const stories = req(path.join(APP, "constants/storyBooks.ts"));
const { getStoryPageArtwork } = req(path.join(APP, "constants/storyPageArtwork.ts"));

function jpegSize(buf) {
  for (let i = 2; i < buf.length;) {
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("no JPEG size");
}

function check(id) {
  const ed = BOOKS[id];
  const book = stories.INTERACTIVE_STORY_BOOKS.find((b) => b.id === id);
  const problems = [];
  if (!book) return { problems: [`${id}: not found in the app`] };
  if (book.isProOnly) problems.push("Pro in the app; free books only unless Mark approves");
  if (ed.alts.length !== book.pages.length) problems.push(`${book.pages.length} pages but ${ed.alts.length} alt texts`);
  const files = book.pages.map((_, i) => getStoryPageArtwork(id, i));
  files.forEach((f, i) => {
    if (!f || !fs.existsSync(f)) problems.push(`page ${i + 1} has no art`);
    else if (path.basename(f) !== ed.art[i]) problems.push(`page ${i + 1} art is ${path.basename(f)}, reviewed ${ed.art[i]}: view it, then update art and alts`);
    else if (!/\.jpe?g$/i.test(f)) problems.push(`page ${i + 1} art is not a JPEG`);
  });
  book.pages.forEach((p, i) => {
    if (!p.riddle || !p.riddle.choices?.[p.riddle.correctIndex]) problems.push(`page ${i + 1} has no question with a right answer`);
  });
  return { book, files, problems };
}

let failed = false;
for (const id of ONLY ? [ONLY] : Object.keys(BOOKS)) {
  const { book, problems } = check(id);
  console.log(`${WRITE ? "write" : "dry  "} read/${BOOKS[id].slug}/  ${book ? `"${book.title}", ${book.pages.length} pages` : id}`);
  for (const p of problems) console.error(`  REFUSED: ${p}`);
  failed ||= problems.length > 0;
}
if (failed) process.exit(1);
if (!WRITE) process.exit(0);

// ── Render ───────────────────────────────────────────────────────────────
const ed = BOOKS[ONLY];
const { book, files } = check(ONLY);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const curly = (s) => s.replace(/(^|[\s(—])'/g, "$1‘").replace(/'/g, "’").replace(/(^|[\s(—])"/g, "$1“").replace(/"/g, "”");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "read/hen-berrys-digraph-dash/index.html"), "utf8");
const SHARED = TEMPLATE.slice(TEMPLATE.indexOf("<!-- pwa:generated -->"), TEMPLATE.indexOf("</head>"));
const HEADER = TEMPLATE.slice(TEMPLATE.indexOf('<header class="topbar">'), TEMPLATE.indexOf("<main>"));
const url = `${SITE}/read/${ed.slug}/`;
const n = book.pages.length;
const names = book.pages.map((_, i) => `page-${i + 1}.jpg`);
const sizes = files.map((f) => jpegSize(fs.readFileSync(f)));
// Plain <img>: build-webp wraps it in a <picture> only when it actually makes a
// WebP (it skips images under 120 KB), so no <source> can point at a missing file.
const img = (i, alt, lazy) =>
  `<img src="./pages/${names[i]}" alt="${esc(alt)}" width="${sizes[i].w}" height="${sizes[i].h}"${lazy ? ' loading="lazy"' : ""}>`;
const cards = book.pages.map((p, i) => {
  const r = p.riddle;
  const answer = r.choices[r.correctIndex];
  return `<article class="story-page-card" id="page-${i + 1}">${img(i, ed.alts[i], true)}<div class="story-page-copy"><span>Page ${i + 1} of ${n} · ${esc(curly(p.title))}</span><p>${esc(curly(p.body))}</p>`
    + `<div class="math-question"><p class="math-q"><strong>Try it:</strong> ${esc(curly(r.prompt))}</p>`
    + `<ul class="math-choices" data-answer="${esc(answer)}" aria-label="Choices">${r.choices.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`
    + `<details class="story-answer math-answer"><summary>Show the answer</summary><p><strong>${esc(answer)}.</strong> ${esc(curly(r.successText))}</p></details>`
    + `</div></div></article>`;
}).join("\n");
const [lo, hi] = book.ageRange;
const ages = lo === hi ? `Age ${lo}` : `Ages ${lo}–${hi}`;
const ld = JSON.stringify({
  "@context": "https://schema.org", "@type": "Book", name: book.title,
  author: { "@type": "Organization", name: "SnackPack Studios" },
  isAccessibleForFree: true, educationalLevel: ages, learningResourceType: "Interactive counting story",
  about: book.theme, image: `${url}pages/${names[0]}`, url,
});
const title = curly(book.title);
const [first, ...rest] = title.split(/ (?=and |the )/);
const h1 = rest.length ? `${esc(first)}<br>${esc(rest.join(" "))}` : esc(title);
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Free Counting Story</title>
<meta name="description" content="Read ${esc(title)}, a free ${n}-page illustrated counting story for ${ages.toLowerCase()}: ${esc(book.theme.toLowerCase())}. A question on every page, answers included, printable PDF.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(ed.blurb)}"><meta property="og:url" content="${url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">${ld}</script>
<!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
${SHARED}</head>
<body class="story-reader-page story-hero-landscape story-long-copy">
${HEADER}<main>
<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">Counting story · Free</span><h1>${h1}</h1><p class="lead">${esc(ed.lead)}</p><div class="tag-row"><span class="tag">${ages}</span><span class="tag">${esc(book.theme)}</span><span class="tag">Read together</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a></div>${img(0, "", false)}</div></section>

<section class="story-pages story-pages-landscape" aria-label="Story pages">
${cards}
</section>

<section><div class="shell story-finish-card"><span class="eyebrow">The end · Great counting</span><h2>${esc(ed.end.q)}</h2><details class="story-answer"><summary>Talk about the answer</summary><p>${esc(ed.end.a)}</p></details><p>${esc(curly(book.celebrationText))} SnackPack 123 Counting has more number stories, counting games and ten-frames.</p><!-- read-next:generated -->
<!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-primary" href="${PLAY}" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-2-123s-counting/">Explore the app</a><a class="btn btn-secondary" href="./${ed.slug}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story and illustrations from SnackPack 123 Counting.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-2-123s-counting/">Privacy</a></div></div></footer>
  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}'></script>
  <!-- End Cloudflare Web Analytics -->
</body></html>
`;
const dir = path.join(ROOT, "read", ed.slug);
fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
files.forEach((f, i) => fs.copyFileSync(f, path.join(dir, "pages", names[i])));
fs.writeFileSync(path.join(dir, "index.html"), html);
console.log(`  wrote read/${ed.slug}/index.html and ${files.length} images`);
