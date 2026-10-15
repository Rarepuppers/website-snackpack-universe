// Build the /read/ bookshelf from one ordered list.
//
//   node scripts/build-read-shelf.mjs           # rewrite the generated blocks
//   node scripts/build-read-shelf.mjs --check   # exit 1 if anything is stale
//
// Why this exists
// ---------------
// /read/ became the site's busiest surface in October 2026. Readers arrive,
// finish one book, and want the next one, but the hub listed books in
// arbitrary order and every book ended at "Back to the bookshelf".
// READ-PLAN-2026-10.md Phase 1 fixes that, and Phase 2 adds books, so the
// shelf must stay consistent as books are added. Everything that depends on
// the shelf order is generated from SHELF below:
//
//   read/index.html     the grouped card grid      <!-- read-shelf:generated -->
//                       the ItemList JSON-LD        <!-- read-itemlist:generated -->
//                       the "N free reader PDFs"    <!-- read-pdf-count:generated -->
//   read/<slug>/        the "Next story" link       <!-- read-next:generated -->
//
// To add a book: import it (scripts/import-decodable-book.mjs or by hand), then
// add one entry to SHELF in reading order and re-run this script.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.snackpackuniverse.com";
const CHECK = process.argv.includes("--check");

// Reading-path groups, in order. `intro` is shown under the group heading.
const GROUPS = [
  { id: "stage-1", title: "Stage 1 · first sounds", intro: "Start here. Every word uses only s, a, t, p, i and n, plus a few tricky words to read together." },
  { id: "stage-2", title: "Stage 2 · six more sounds", intro: "Adds c, e, h, r, m and d. Ready when Stage 1 words feel easy." },
  { id: "stage-3", title: "Stage 3 · short o and u", intro: "Adds g, o, u, l, f and b, so every short vowel is covered." },
  { id: "trail", title: "Reading Trail · next steps", intro: "Six read-together stories that carry on after Stage 3: short-vowel review, sh/ch/th/wh, blends, magic e, vowel teams and word endings." },
  { id: "more", title: "More stories", intro: "A read-together counting adventure." }
];

// The shelf, in reading order. The "next story" chain follows this order.
const SHELF = [
  { slug: "pip-sits", group: "stage-1", title: "Pip Sits", eyebrow: "Stage 1 · first reader · 6 pages", blurb: "A gentle read-it-myself story using the first letter sounds s, a, t, p, i and n.", cover: "pages/cover", ext: "jpg", alt: "Pip Sits first-reader book cover.", w: 1024, h: 1536 },
  { slug: "nan-and-pip", group: "stage-1", title: "Nan and Pip", eyebrow: "Stage 1 decodable · 6 pages", blurb: "A take-turns story that repeats a small set of words so a new reader builds confidence.", cover: "pages/cover", ext: "jpg", alt: "Nan and Pip decodable book cover.", w: 1024, h: 1536 },
  { slug: "ten-red-hens", group: "stage-2", title: "Ten Red Hens", eyebrow: "Stage 2 decodable · 8 pages", blurb: "Ten hens, one net and a runaway chase — a short-E story a new reader can sound out alone.", cover: "pages/cover", ext: "jpg", alt: "Ten Red Hens decodable book cover.", w: 1024, h: 1536 },
  { slug: "the-cat-and-the-rat", group: "stage-2", title: "The Cat and the Rat", eyebrow: "Stage 2 decodable · 8 pages", blurb: "Every word is a plain three-sound word — the best book on the shelf for a first independent read.", cover: "pages/cover", ext: "jpg", alt: "The Cat and the Rat decodable book cover.", w: 1024, h: 1536 },
  { slug: "bug-in-a-cup", group: "stage-3", title: "Bug in a Cup", eyebrow: "Stage 3 decodable · 8 pages", blurb: "A short-U story that adds g, o, u, l, f and b to the sounds a new reader already knows.", cover: "pages/cover", ext: "jpg", alt: "Bug in a Cup decodable book cover.", w: 1024, h: 1536 },
  { slug: "dog-in-the-fog", group: "stage-3", title: "Dog in the Fog", eyebrow: "Stage 3 decodable · 8 pages", blurb: "A short-O story for readers ready to move past the first six letter sounds.", cover: "pages/cover", ext: "jpg", alt: "Dog in the Fog decodable book cover.", w: 1024, h: 1536 },
  { slug: "ted-e-bears-short-vowel-kit", group: "trail", title: "Ted‑E‑Bear’s Short‑Vowel Kit", eyebrow: "Reading Trail step 1 · 5 pages", blurb: "A warm den-building story full of short-vowel words for beginning readers.", cover: "pages/reading-trail-ted-short-vowel-kit-p1", ext: "jpg", alt: "Ted-E-Bear with his box, rug and den-building kit.", w: 768, h: 1152 },
  { slug: "hen-berrys-digraph-dash", group: "trail", title: "Hen‑Berry’s Digraph Dash", eyebrow: "Reading Trail step 2 · 5 pages", blurb: "Fog hides the path home. A shell, a fish and a few sh, ch, th and wh words lead the way.", cover: "pages/reading-trail-hen-berry-digraph-dash-p1", ext: "jpg", alt: "Hen-Berry and a chick in her cosy shop at dusk.", w: 768, h: 1152 },
  { slug: "stripe-scouts-blend-bridge", group: "trail", title: "Stripe‑Scout’s Blend Bridge", eyebrow: "Reading Trail step 3 · 5 pages", blurb: "A branch blocks the bridge. A frog, a crab and plenty of blends help Stripe-Scout lift it.", cover: "pages/reading-trail-stripe-scout-blend-bridge-p1", ext: "jpg", alt: "Stripe-Scout the tiger on a wooden bridge blocked by a fallen branch.", w: 768, h: 1152 },
  { slug: "sub-zeros-magic-e-lantern", group: "trail", title: "Sub‑Zero’s Magic‑E Lantern", eyebrow: "Reading Trail step 4 · 5 pages", blurb: "A lost note, a runaway kite and a lantern made from tape, rope and a red cape.", cover: "pages/reading-trail-sub-zero-magic-e-lantern-p1", ext: "jpg", alt: "Sub-Zero the penguin ties a note to a kite in the snow.", w: 768, h: 1152 },
  { slug: "meow-inaras-vowel-team-duet", group: "trail", title: "Meow‑inara’s Vowel‑Team Duet", eyebrow: "Reading Trail step 5 · 5 pages", blurb: "The music never arrives, so Meow-inara listens, paints the beat and plays anyway.", cover: "pages/reading-trail-meow-inara-vowel-team-duet-p1", ext: "jpg", alt: "Meow-inara the cat waits by a green gate in the rain.", w: 768, h: 1152 },
  { slug: "quill-berrys-ending-clues", group: "trail", title: "Quill‑Berry’s Ending Clues", eyebrow: "Reading Trail step 6 · 5 pages", blurb: "A poem has lost its endings. Quill-Berry adds -ing, -ed and -er and claps the beats.", cover: "pages/reading-trail-quill-berry-ending-clues-p1", ext: "jpg", alt: "Quill-Berry the hedgehog looks at a book with blank spaces.", w: 768, h: 1152 },
  { slug: "ted-e-bear-and-the-button-trail", group: "more", title: "Ted‑E‑Bear and the Button Trail", eyebrow: "Counting adventure · 6 pages", blurb: "Follow a missing-button mystery through counting, number order, comparisons and courage.", cover: "pages/cover", ext: "png", alt: "Ted-E-Bear and the Button Trail story cover.", w: 640, h: 640 }
];

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
const plainTitle = (t) => t.replace(/‑/g, "-");

function card(b, i) {
  const src = `./${b.slug}/${b.cover}`;
  return `<a class="read-library-card" href="./${b.slug}/"><picture><source srcset="${src}.webp" type="image/webp"><img src="${src}.${b.ext}" alt="${b.alt}" width="${b.w}" height="${b.h}"${i > 2 ? " loading=\"lazy\"" : ""}></picture><div><span class="eyebrow">${b.eyebrow}</span><h3>${b.title}</h3><p>${b.blurb}</p><span class="btn btn-primary">Read the story</span></div></a>`;
}

function shelfBlock() {
  const out = [];
  for (const g of GROUPS) {
    const books = SHELF.filter((b) => b.group === g.id);
    if (!books.length) continue;
    out.push(`<div class="read-shelf-group" id="${g.id}"><h2 class="read-shelf-heading">${g.title}</h2><p class="read-shelf-intro">${g.intro}</p><div class="read-library-grid">`);
    for (const b of books) out.push(card(b, SHELF.indexOf(b)));
    out.push(`</div></div>`);
  }
  return out.join("\n");
}

function itemListBlock() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free illustrated reading books",
    description: "Free decodable readers and illustrated stories in reading order, with printable PDFs. No account, ads or download.",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: SHELF.length,
    itemListElement: SHELF.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/read/${b.slug}/`,
      name: plainTitle(b.title)
    }))
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

// Sharing is how /read/ grows (October 2026: Telegram and direct visits, almost
// no search), so every book offers it twice: beside "Begin the story" and again
// at the end, when a reader has just enjoyed it. read/share.js does the work.
const SHARE_BUTTON = (cls) =>
  `<button class="${cls}" type="button" data-read-share aria-live="polite">Share this book</button>`;

function shareTopBlock() {
  return SHARE_BUTTON("btn btn-secondary read-share-btn");
}

function nextBlock(i) {
  const next = SHELF[i + 1];
  const share = `<p class="story-share">Know a family or class who would enjoy it? ${SHARE_BUTTON("btn btn-secondary read-share-btn")}</p>\n<script defer src="../share.js"></script>`;
  if (!next) {
    return `<p class="story-next">That’s the whole shelf, and every book has a printable PDF. <a class="text-link" href="../">Back to the bookshelf</a></p>\n${share}`;
  }
  const g = GROUPS.find((x) => x.id === next.group);
  const label = g.id === SHELF[i].group ? "Next story" : `Next: ${g.title.split(" · ")[0]}`;
  return `<p class="story-next"><span class="eyebrow">${label}</span><a class="story-next-link" href="../${next.slug}/">${next.title} <span aria-hidden="true">→</span></a></p>\n${share}`;
}

// The homepage section: a few books spread across the reading path, so the
// first thing a parent sees is something they can read now, not an app page.
const HOME_FEATURED = ["pip-sits", "ten-red-hens", "dog-in-the-fog", "hen-berrys-digraph-dash", "sub-zeros-magic-e-lantern", "meow-inaras-vowel-team-duet"];

function homeBlock() {
  const words = (n) => (NUMBER_WORDS[n] ?? String(n)).toLowerCase();
  const cards = HOME_FEATURED.map((slug) => {
    const b = SHELF.find((x) => x.slug === slug);
    if (!b) throw new Error(`HOME_FEATURED: ${slug} is not on the shelf`);
    const src = `/read/${b.slug}/${b.cover}`;
    const label = b.eyebrow.split(" · ")[0].replace(/ decodable$/, "");
    return `        <a class="storybook-card" href="/read/${b.slug}/">
          <picture><source srcset="${src}.webp" type="image/webp"><img src="${src}.${b.ext}" loading="lazy" alt="${b.alt}"></picture>
          <span class="storybook-app">${label}</span>
          <strong>${b.title}</strong>
        </a>`;
  }).join("\n");
  return `    <div class="shell">
      <div class="section-head">
        <div>
          <span class="eyebrow">Free bookshelf</span>
          <h2 class="section-title">${words(SHELF.length).replace(/^./, (c) => c.toUpperCase())} illustrated readers, free to read or print</h2>
          <p class="section-copy">Complete picture books from the SnackPack apps, in phonics order from the first sounds s a t p i n to vowel teams and word endings. Read them in your browser or print the PDF. No account, no ads, no download.</p>
        </div>
        <div class="stack-inline"><a class="btn btn-primary" href="/read/">Open the bookshelf</a><a class="text-link" href="/read/sound-cards/">Print phonics sound cards</a></div>
      </div>
      <div class="storybook-grid">
${cards}
      </div>
    </div>`;
}

// One-time migration: books built before the share button existed get the
// marker inserted right after their "Begin the story" link.
function ensureShareTopMarker(html, rel) {
  if (html.includes("<!-- read-share-top:generated -->")) return html;
  const anchor = 'href="#page-1">Begin the story</a>';
  if (!html.includes(anchor)) throw new Error(`${rel}: no "Begin the story" link to place the share button after`);
  return html.replace(anchor, `${anchor}<!-- read-share-top:generated -->\n<!-- /read-share-top:generated -->`);
}

// Replace the content between <!-- name --> and <!-- /name -->, or report it missing.
function splice(html, name, body, file) {
  const open = `<!-- ${name} -->`;
  const close = `<!-- /${name} -->`;
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  if (a === -1 || b === -1 || b < a) throw new Error(`${file}: missing ${open} … ${close} markers`);
  return html.slice(0, a + open.length) + "\n" + body + "\n" + html.slice(b);
}

const changes = [];
function write(rel, next) {
  const abs = path.join(ROOT, rel);
  const prev = fs.readFileSync(abs, "utf8");
  if (prev === next) return;
  changes.push(rel);
  if (!CHECK) fs.writeFileSync(abs, next);
}

for (const b of SHELF) {
  if (!fs.existsSync(path.join(ROOT, "read", b.slug, "index.html"))) throw new Error(`read/${b.slug}/index.html does not exist`);
  if (!fs.existsSync(path.join(ROOT, "read", b.slug, `${b.cover}.${b.ext}`))) throw new Error(`read/${b.slug}/${b.cover}.${b.ext} does not exist`);
}
const pdfs = SHELF.filter((b) => fs.existsSync(path.join(ROOT, "read", b.slug, `${b.slug}.pdf`))).length;

let hub = fs.readFileSync(path.join(ROOT, "read/index.html"), "utf8");
hub = splice(hub, "read-shelf:generated", shelfBlock(), "read/index.html");
hub = splice(hub, "read-itemlist:generated", itemListBlock(), "read/index.html");
hub = splice(hub, "read-pdf-count:generated", `${NUMBER_WORDS[pdfs] ?? pdfs} free reader PDFs`, "read/index.html");
write("read/index.html", hub);

SHELF.forEach((b, i) => {
  const rel = `read/${b.slug}/index.html`;
  let html = ensureShareTopMarker(fs.readFileSync(path.join(ROOT, rel), "utf8"), rel);
  html = splice(html, "read-share-top:generated", shareTopBlock(), rel);
  write(rel, splice(html, "read-next:generated", nextBlock(i), rel));
});

write("index.html", splice(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), "read-home:generated", homeBlock(), "index.html"));

if (CHECK) {
  if (changes.length) {
    console.error(`build-read-shelf: ${changes.length} file(s) stale — run node scripts/build-read-shelf.mjs\n  ${changes.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`build-read-shelf: ${SHELF.length} books, ${pdfs} PDFs, all generated blocks current.`);
} else {
  console.log(`build-read-shelf: ${SHELF.length} books, ${pdfs} PDFs; updated ${changes.length} file(s).`);
  for (const c of changes) console.log(`  ${c}`);
}
