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
import { isVariant, sourceTag } from "./lib/read-srcset.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.snackpackuniverse.com";
const CHECK = process.argv.includes("--check");

// Reading-path groups, in order. `intro` is shown under the group heading.
const GROUPS = [
  { id: "stage-1", title: "Stage 1 · first sounds", intro: "Start here. Every word uses only s, a, t, p, i and n, plus a few tricky words to read together." },
  { id: "stage-2", title: "Stage 2 · six more sounds", intro: "Adds c, e, h, r, m and d. Ready when Stage 1 words feel easy." },
  { id: "stage-3", title: "Stage 3 · short o and u", intro: "Adds g, o, u, l, f and b, so every short vowel is covered." },
  { id: "trail", title: "Reading Trail · next steps", intro: "Six read-together stories that carry on after Stage 3: short-vowel review, sh/ch/th/wh, blends, magic e, vowel teams and word endings." },
  { id: "short", title: "Short reads · four-page stories", intro: "Quick illustrated stories to read together, with a talk prompt on every page and a question at the end: friendship and kindness, adventures and mysteries, nature and the night sky." },
  { id: "numbers", title: "Number stories · maths on every page", intro: "Illustrated maths stories with a question on every page, from counting to negative numbers. Tap an answer to check it, or print the book and work on paper." },
  { id: "more", title: "More stories", intro: "Read-together stories." }
];

// The shelf, in reading order. The "next story" chain follows this order.
// `age` [min, max] drives the bookshelf age filter. Basic Math (ageBand) and
// 1-2-3 Counting (ageRange) ages come from the apps; the phonics books carry no
// age in their apps, so theirs follow the usual UK phonics timing (Stages 1-2
// Reception, Stage 3 and the early Reading Trail Reception/Year 1, later trail
// steps Year 1/2), and short reads use the Spelling app's 5-8 audience.
// `added` is the date the book first went live (git history); the hub marks
// books added in the last 30 days as "New", worked out in the reader's browser.
const SHELF = [
  { slug: "pip-sits", group: "stage-1", age: [4, 5], added: "2026-08-12", title: "Pip Sits", eyebrow: "Stage 1 · first reader · 6 pages", blurb: "A gentle read-it-myself story using the first letter sounds s, a, t, p, i and n.", cover: "pages/cover", ext: "jpg", alt: "Pip Sits first-reader book cover.", w: 1024, h: 1536 },
  { slug: "nan-and-pip", group: "stage-1", age: [4, 5], added: "2026-08-13", title: "Nan and Pip", eyebrow: "Stage 1 decodable · 6 pages", blurb: "A take-turns story that repeats a small set of words so a new reader builds confidence.", cover: "pages/cover", ext: "jpg", alt: "Nan and Pip decodable book cover.", w: 1024, h: 1536 },
  { slug: "ten-red-hens", group: "stage-2", age: [4, 5], added: "2026-08-13", title: "Ten Red Hens", eyebrow: "Stage 2 decodable · 8 pages", blurb: "Ten hens, one net and a runaway chase — a short-E story a new reader can sound out alone.", cover: "pages/cover", ext: "jpg", alt: "Ten Red Hens decodable book cover.", w: 1024, h: 1536 },
  { slug: "the-cat-and-the-rat", group: "stage-2", age: [4, 5], added: "2026-08-13", title: "The Cat and the Rat", eyebrow: "Stage 2 decodable · 8 pages", blurb: "Every word is a plain three-sound word — the best book on the shelf for a first independent read.", cover: "pages/cover", ext: "jpg", alt: "The Cat and the Rat decodable book cover.", w: 1024, h: 1536 },
  { slug: "bug-in-a-cup", group: "stage-3", age: [4, 6], added: "2026-08-13", title: "Bug in a Cup", eyebrow: "Stage 3 decodable · 8 pages", blurb: "A short-U story that adds g, o, u, l, f and b to the sounds a new reader already knows.", cover: "pages/cover", ext: "jpg", alt: "Bug in a Cup decodable book cover.", w: 1024, h: 1536 },
  { slug: "dog-in-the-fog", group: "stage-3", age: [4, 6], added: "2026-08-13", title: "Dog in the Fog", eyebrow: "Stage 3 decodable · 8 pages", blurb: "A short-O story for readers ready to move past the first six letter sounds.", cover: "pages/cover", ext: "jpg", alt: "Dog in the Fog decodable book cover.", w: 1024, h: 1536 },
  { slug: "ted-e-bears-short-vowel-kit", group: "trail", age: [5, 6], added: "2026-08-12", title: "Ted‑E‑Bear’s Short‑Vowel Kit", eyebrow: "Reading Trail step 1 · 5 pages", blurb: "A warm den-building story full of short-vowel words for beginning readers.", cover: "pages/reading-trail-ted-short-vowel-kit-p1", ext: "jpg", alt: "Ted-E-Bear with his box, rug and den-building kit.", w: 768, h: 1152 },
  { slug: "hen-berrys-digraph-dash", group: "trail", age: [5, 6], added: "2026-10-15", title: "Hen‑Berry’s Digraph Dash", eyebrow: "Reading Trail step 2 · 5 pages", blurb: "Fog hides the path home. A shell, a fish and a few sh, ch, th and wh words lead the way.", cover: "pages/reading-trail-hen-berry-digraph-dash-p1", ext: "jpg", alt: "Hen-Berry and a chick in her cosy shop at dusk.", w: 768, h: 1152 },
  { slug: "stripe-scouts-blend-bridge", group: "trail", age: [6, 7], added: "2026-10-15", title: "Stripe‑Scout’s Blend Bridge", eyebrow: "Reading Trail step 3 · 5 pages", blurb: "A branch blocks the bridge. A frog, a crab and plenty of blends help Stripe-Scout lift it.", cover: "pages/reading-trail-stripe-scout-blend-bridge-p1", ext: "jpg", alt: "Stripe-Scout the tiger on a wooden bridge blocked by a fallen branch.", w: 768, h: 1152 },
  { slug: "sub-zeros-magic-e-lantern", group: "trail", age: [6, 7], added: "2026-10-15", title: "Sub‑Zero’s Magic‑E Lantern", eyebrow: "Reading Trail step 4 · 5 pages", blurb: "A lost note, a runaway kite and a lantern made from tape, rope and a red cape.", cover: "pages/reading-trail-sub-zero-magic-e-lantern-p1", ext: "jpg", alt: "Sub-Zero the penguin ties a note to a kite in the snow.", w: 768, h: 1152 },
  { slug: "meow-inaras-vowel-team-duet", group: "trail", age: [6, 7], added: "2026-10-15", title: "Meow‑inara’s Vowel‑Team Duet", eyebrow: "Reading Trail step 5 · 5 pages", blurb: "The music never arrives, so Meow-inara listens, paints the beat and plays anyway.", cover: "pages/reading-trail-meow-inara-vowel-team-duet-p1", ext: "jpg", alt: "Meow-inara the cat waits by a green gate in the rain.", w: 768, h: 1152 },
  { slug: "quill-berrys-ending-clues", group: "trail", age: [6, 7], added: "2026-10-15", title: "Quill‑Berry’s Ending Clues", eyebrow: "Reading Trail step 6 · 5 pages", blurb: "A poem has lost its endings. Quill-Berry adds -ing, -ed and -er and claps the beats.", cover: "pages/reading-trail-quill-berry-ending-clues-p1", ext: "jpg", alt: "Quill-Berry the hedgehog looks at a book with blank spaces.", w: 768, h: 1152 },
  { slug: "baby-bulldogs-at-the-playground", group: "short", age: [5, 8], added: "2026-10-15", title: "Baby Bulldogs at the Playground", eyebrow: "Short read · Friendship · 4 pages", blurb: "A quiet puppy, a red ball and a chalk-line game that lets everyone join in.", cover: "pages/baby-bulldogs-playground-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "fe-line-mignons-moonlit-cafe", group: "short", age: [5, 8], added: "2026-10-15", title: "Fe‑Line‑Mignon’s Moonlit Café", eyebrow: "Short read · Kindness · 4 pages", blurb: "Every table is full, so the guests make one long table with room for a shy new kitten.", cover: "pages/fe-line-mignon-moonlit-cafe-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "octo-pops-ocean-adventure", group: "short", age: [5, 8], added: "2026-10-15", title: "Octo‑Pop’s Ocean Adventure", eyebrow: "Short read · Friendship · 4 pages", blurb: "A wave steals the welcome shell, and the shyest swimmer is the fastest to bring it back.", cover: "pages/octo-pop-ocean-adventure-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "hen-berrys-helping-day", group: "short", age: [5, 8], added: "2026-10-15", title: "Hen‑Berry’s Helping Day", eyebrow: "Short read · Kindness · 4 pages", blurb: "Hen-Berry’s basket breaks. Ted-E-Bear has advice; Wise Owl listens first.", cover: "pages/hen-berry-helping-day-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "stripe-scouts-trail-clues", group: "short", age: [5, 8], added: "2026-10-15", title: "Stripe‑Scout’s Trail Clues", eyebrow: "Short read · Adventure · 4 pages", blurb: "A short muddy path or a long starry one? A clue helps Stripe-Scout choose.", cover: "pages/stripe-scout-trail-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "lionnaise-and-the-dragon", group: "short", age: [5, 8], added: "2026-10-15", title: "Lionnaise and the Dragon", eyebrow: "Short read · Adventure · 4 pages", blurb: "A dragon blocks the bridge, and Lionnaise answers with an invitation instead of a roar.", cover: "pages/lionnaise-dragon-quest-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "polly-rogers-pirate-cove", group: "short", age: [5, 8], added: "2026-10-15", title: "Polly Roger’s Pirate Cove", eyebrow: "Short read · Adventure · 4 pages", blurb: "A chest full of gold, and Polly Roger spends it on the one thing the whole cove needs.", cover: "pages/polly-roger-pirate-cove-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "ham-and-cheeses-big-maze", group: "short", age: [5, 8], added: "2026-10-15", title: "Ham‑and‑Cheese’s Big Maze", eyebrow: "Short read · Kindness · 4 pages", blurb: "Ham-and-Cheese could beat his fastest time, or help a lost mouse find the way out.", cover: "pages/ham-and-cheese-maze-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "foxy-loxs-mystery-trail", group: "short", age: [5, 8], added: "2026-10-15", title: "Foxy‑Lox’s Mystery Trail", eyebrow: "Short read · Mystery · 4 pages", blurb: "A hoof print, a split crumb trail and a lost badge lead Foxy-Lox to the answer before the storm.", cover: "pages/foxy-lox-mystery-trail-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "nutmegs-garden-morning", group: "short", age: [5, 8], added: "2026-10-15", title: "Nutmeg’s Garden Morning", eyebrow: "Short read · Nature · 4 pages", blurb: "Nutmeg checks her seed before lunch, after lunch and every day until the seventh morning.", cover: "pages/nutmeg-garden-morning-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "captain-beakons-star-watch", group: "short", age: [5, 8], added: "2026-10-15", title: "Captain Beakon’s Star Watch", eyebrow: "Short read · Night sky · 4 pages", blurb: "Clouds hide the sky, so Captain Beakon and Luckybug give it five patient minutes.", cover: "pages/captain-beakon-star-watch-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "nutmegs-four-seasons", group: "short", age: [5, 8], added: "2026-10-15", title: "Nutmeg’s Four Seasons", eyebrow: "Short read · Nature · 4 pages", blurb: "One acorn, four seasons and a friend for every one of them.", cover: "pages/nutmeg-four-seasons-p1", ext: "jpg", alt: "", w: 768, h: 1152 },
  { slug: "ted-e-bear-and-the-button-trail", group: "numbers", age: [3, 4], added: "2026-08-12", title: "Ted‑E‑Bear and the Button Trail", eyebrow: "Counting · 6 pages", blurb: "Follow a missing-button mystery through counting, number order, comparisons and courage.", cover: "pages/cover", ext: "png", alt: "Ted-E-Bear and the Button Trail story cover.", w: 640, h: 640 },
  { slug: "luckybugs-market-morning", group: "numbers", age: [5, 7], added: "2026-10-15", title: "Luckybug and the Market Morning Mix‑Up", eyebrow: "Year 1 · adding to 20 · 7 pages", blurb: "Berries roll, eggs run low and signs need string. Seven quick sums get the market open by noon.", cover: "pages/cover", ext: "jpg", alt: "Luckybug and the Market Morning Mix-Up book cover.", w: 1024, h: 1536 },
  { slug: "biscuit-bouncers-parcel-parade", group: "numbers", age: [6, 8], added: "2026-10-15", title: "Biscuit‑Bouncer and the Parcel Parade", eyebrow: "Year 2 · add, subtract, measure · 9 pages", blurb: "The fastest route misses the quiet homes. Biscuit-Bouncer and Ginger-Deer find a better one, sum by sum.", cover: "pages/cover", ext: "jpg", alt: "Biscuit-Bouncer and the Parcel Parade book cover.", w: 1024, h: 1536 },
  { slug: "hop-tarts-stepping-stone-switch", group: "numbers", age: [7, 9], added: "2026-10-15", title: "Hop‑Tart and the Stepping‑Stone Switch", eyebrow: "Year 3 · times tables · 4 pages", blurb: "A current twists the stepping stones. Hop-Tart builds a path that waits for Centi-Peed.", cover: "pages/cover", ext: "jpg", alt: "Hop-Tart and the Stepping-Stone Switch book cover.", w: 1024, h: 1536 },
  { slug: "centi-peeds-below-zero-burrow", group: "numbers", age: [8, 10], added: "2026-10-15", title: "Centi‑Peed and the Below‑Zero Burrow", eyebrow: "Year 4 · negative numbers · 4 pages", blurb: "Firefly footprints lead below zero. Centi-Peed and Sub-Zero count every step through the cold.", cover: "pages/cover", ext: "jpg", alt: "Centi-Peed and the Below-Zero Burrow book cover.", w: 1024, h: 1536 }
];

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
const plainTitle = (t) => t.replace(/‑/g, "-");

function card(b, i) {
  const src = `./${b.slug}/${b.cover}`;
  return `<a class="read-library-card" href="./${b.slug}/" data-kind="${KIND[b.group]}" data-age="${b.age[0]}-${b.age[1]}" data-added="${b.added}"><picture>${sourceTag(path.join(ROOT, "read", b.slug, `${b.cover}.webp`), src, "hub")}<img src="${src}.${b.ext}" alt="${b.alt}" width="${b.w}" height="${b.h}"${i > 2 ? " loading=\"lazy\"" : ""}></picture><div><span class="eyebrow">${b.eyebrow}</span><h3>${plainTitle(b.title)}</h3><p>${b.blurb}</p><span class="btn btn-primary">Read the story</span></div></a>`;
}

// Stage shortcuts (a 13-book shelf is a long scroll on a phone) and the
// offline save, whose button read/offline.js reveals only where it can work.
// Bookshelf filters (READ-PLAN C2). The buttons are rendered `hidden` and only
// revealed by read/shelf-filter.js, so without JavaScript the whole shelf shows
// and nothing on the page pretends to work.
const KIND = { "stage-1": "phonics", "stage-2": "phonics", "stage-3": "phonics", trail: "phonics", short: "stories", numbers: "maths", more: "stories" };
const KINDS = [["phonics", "Phonics"], ["stories", "Stories"], ["maths", "Maths"]];
const AGES = [["3-4", "Ages 3–4"], ["5-6", "5–6"], ["7-8", "7–8"], ["9-10", "9–10"]];
function filterBar() {
  const btn = (attr, val, label, on) => `<button type="button" class="read-filter-btn" ${attr}="${val}" aria-pressed="${on}">${label}</button>`;
  return `<div class="read-filters" hidden>
<div class="read-filter-row" role="group" aria-label="Type of book">${btn("data-filter-kind", "all", "All books", "true")}${KINDS.map(([v, l]) => btn("data-filter-kind", v, l, "false")).join("")}</div>
<div class="read-filter-row" role="group" aria-label="Reader's age">${btn("data-filter-age", "all", "Any age", "true")}${AGES.map(([v, l]) => btn("data-filter-age", v, l, "false")).join("")}</div>
<p class="read-filter-status" aria-live="polite" data-filter-status></p>
</div>
<p class="read-filter-empty" hidden data-filter-empty>No books match both filters yet. <button type="button" class="text-link read-filter-reset" data-filter-reset>Show every book</button></p>
<script defer src="./shelf-filter.js"></script>`;
}

function shelfTools() {
  const chips = GROUPS.filter((g) => SHELF.some((b) => b.group === g.id))
    .map((g) => `<a class="read-jump-chip" href="#${g.id}">${g.title.split(" · ")[0]}</a>`).join("");
  return `<nav class="read-jump" aria-label="Jump to a stage">${chips}</nav>
${filterBar()}
<div class="read-offline" hidden><button class="btn btn-secondary" type="button" data-read-offline>Save the bookshelf for offline</button><p class="read-offline-status" data-read-offline-status aria-live="polite"></p></div>
<script defer src="./offline.js"></script>`;
}

function shelfBlock() {
  const out = [shelfTools()];
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
  const share = `<p class="story-share">Know a family or class who would enjoy it? ${SHARE_BUTTON("btn btn-secondary read-share-btn")}</p>\n<script defer src="../share.js"></script>\n<script defer src="../reader.js"></script>`;
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
          <picture>${sourceTag(path.join(ROOT, "read", b.slug, `${b.cover}.webp`), src, "home")}<img src="${src}.${b.ext}" loading="lazy" alt="${b.alt}"></picture>
          <span class="storybook-app">${label}</span>
          <strong>${b.title}</strong>
        </a>`;
  }).join("\n");
  return `    <div class="shell">
      <div class="section-head">
        <div>
          <span class="eyebrow">Free bookshelf</span>
          <h2 class="section-title">${words(SHELF.length).replace(/^./, (c) => c.toUpperCase())} illustrated readers, free to read or print</h2>
          <p class="section-copy">Complete picture books from the SnackPack apps, in phonics order from the first sounds s a t p i n to vowel teams and word endings, plus number stories with a maths question on every page. Read them in your browser or print the PDF. No account, no ads, no download.</p>
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

// Richer Book schema (READ-PLAN C5, 2026-10-16). The importers write each
// book's Book JSON-LD with its name, level and topic ("about"); this adds the
// fields search engines and assistants use to match "decodable reader stage 2"
// or "Year 3 maths story": age range, page count, language, format, the PDF,
// and an educationalAlignment (subject, phonics stage or school year, and what
// the book teaches, reusing the importer's "about"). Merged into the existing
// object, so the importer-owned fields stay as they are.
const SUBJECT = { phonics: "Phonics", stories: "Reading", maths: "Mathematics" };
// UK phonics timing, matching the ages on the shelf filters (C2).
// UK years only: they do not map one-to-one onto US grades (Reception is
// nearer Pre-K than Kindergarten), and the site is written for en-GB.
const PHONICS_YEAR = { "4-5": "Reception (UK)", "4-6": "Reception (UK)", "5-6": "Reception to Year 1 (UK)", "6-7": "Year 1 to Year 2 (UK)" };
const BOOK_RE = /<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"Book".*?\})<\/script>/;
function bookSchema(html, b, rel) {
  const m = html.match(BOOK_RE);
  if (!m) throw new Error(`${rel}: no one-line Book JSON-LD to enrich`);
  const book = JSON.parse(m[1]);
  const kind = KIND[b.group];
  const pages = (html.match(/<article class="story-page-card"/g) || []).length;
  if (!pages) throw new Error(`${rel}: no story pages counted`);
  const levels = [];
  const stage = b.group.match(/^stage-(\d)$/);
  if (stage) levels.push(`Phonics Stage ${stage[1]}`);
  const step = b.eyebrow.match(/Reading Trail step (\d)/);
  if (step) levels.push(`Reading Trail step ${step[1]} of 6`);
  if (kind === "phonics") levels.push(PHONICS_YEAR[`${b.age[0]}-${b.age[1]}`] ?? (() => { throw new Error(`${rel}: no school year for phonics ages ${b.age}`); })());
  if (kind === "maths") levels.push((String(book.educationalLevel).match(/^Year \d+ \(UK\)/) || ["Nursery (UK)"])[0]);
  const align = (type, name) => ({ "@type": "AlignmentObject", alignmentType: type, targetName: name });
  const pdf = fs.existsSync(path.join(ROOT, "read", b.slug, `${b.slug}.pdf`));
  Object.assign(book, {
    inLanguage: "en-GB",
    bookFormat: "https://schema.org/EBook",
    numberOfPages: pages,
    typicalAgeRange: `${b.age[0]}-${b.age[1]}`,
    educationalAlignment: [align("educationalSubject", SUBJECT[kind]), ...levels.map((l) => align("educationalLevel", l)), ...(book.about ? [align("teaches", book.about)] : [])],
  });
  if (pdf) book.encoding = { "@type": "MediaObject", encodingFormat: "application/pdf", contentUrl: `${SITE}/read/${b.slug}/${b.slug}.pdf` };
  return html.replace(m[0], () => `<script type="application/ld+json">${JSON.stringify(book)}</script>`);
}

SHELF.forEach((b, i) => {
  const rel = `read/${b.slug}/index.html`;
  let html = ensureShareTopMarker(fs.readFileSync(path.join(ROOT, rel), "utf8"), rel);
  html = splice(html, "read-share-top:generated", shareTopBlock(), rel);
  html = bookSchema(html, b, rel);
  write(rel, splice(html, "read-next:generated", nextBlock(i), rel));
});

// Everything read/offline.js saves: the hub, sound cards, every book page and
// its WebP art (the <picture> source every current browser picks), plus the
// shared CSS, scripts and fonts those pages need. PDFs are deliberately out.
function offlineManifest() {
  const urls = ["/read/", "/read/sound-cards/"];
  for (const b of SHELF) {
    urls.push(`/read/${b.slug}/`);
    const dir = path.join(ROOT, "read", b.slug, "pages");
    // Originals only: the -480w/-800w sizes would add ~65% to the download, and
    // sw.js answers an unsaved size with the saved original when offline.
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".webp") && !isVariant(f)).sort()) urls.push(`/read/${b.slug}/pages/${f}`);
  }
  urls.push("/site.css", "/theme.js", "/read/share.js", "/read/reader.js", "/read/offline.js", "/read/shelf-filter.js",
    "/assets/fonts/fonts.css", "/assets/favicon-32.png", "/assets/snackpack-mark-96.png");
  for (const f of fs.readdirSync(path.join(ROOT, "assets/fonts")).filter((f) => f.endsWith(".woff2")).sort()) urls.push(`/assets/fonts/${f}`);
  // The size shown to readers counts only the book art (~95% of the download).
  // Counting HTML/CSS too would make this file stale, and CI red, on every
  // unrelated stylesheet or nav edit anywhere on the site.
  const bytes = urls.reduce((n, u) => {
    const file = path.join(ROOT, u.endsWith("/") ? `${u}index.html` : u);
    if (!fs.existsSync(file)) throw new Error(`offline manifest: ${u} has no file at ${file}`);
    return u.endsWith(".webp") ? n + fs.statSync(file).size : n;
  }, 0);
  return JSON.stringify({ books: SHELF.length, bytes, urls }, null, 1) + "\n";
}
{
  const rel = "read/offline-manifest.json";
  const next = offlineManifest();
  const prev = fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), "utf8") : "";
  if (prev !== next) { changes.push(rel); if (!CHECK) fs.writeFileSync(path.join(ROOT, rel), next); }
}

// The printable-readers guide (the one /read/ page with Google clicks) keeps its
// eight hand-written cards, which are the copy that ranks; everything else on
// the shelf, plus the sound cards, is generated below them, and every stated
// count follows the shelf so the page can never again say "eight" for 17 books.
const GUIDE = "guides/free-printable-decodable-readers/index.html";
const GUIDE_FIXED = new Set(["pip-sits", "nan-and-pip", "the-cat-and-the-rat", "ten-red-hens", "dog-in-the-fog", "bug-in-a-cup", "ted-e-bears-short-vowel-kit", "ted-e-bear-and-the-button-trail"]);
function guideMoreBlock() {
  const card = (index, title, blurb, tags, read, pdf) =>
    `<article class="app-card"><div class="app-card-top"><span class="app-index">${index}</span><h2>${title}</h2><p>${blurb}</p><div class="tag-row">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div><div class="app-actions"><a class="text-link" href="${read}">${pdf ? "Read online" : "Open and print"}</a>${pdf ? `<a class="text-link" href="${pdf}" download>Download PDF</a>` : ""}</div></div></article>`;
  const rest = SHELF.filter((b) => !GUIDE_FIXED.has(b.slug));
  const cards = rest.map((b) => card(b.eyebrow, plainTitle(b.title), b.blurb, [GROUPS.find((g) => g.id === b.group).title.split(" · ")[0]], `../../read/${b.slug}/`, `../../read/${b.slug}/${b.slug}.pdf`));
  cards.push(card("Printable cards · one A4 page per stage", "Phonics sound cards", "Sound, word and tricky-word cards for every stage, from s a t p i n to vowel teams and word endings.", ["Printables"], "../../read/sound-cards/", null));
  return `<div style="max-width:760px;margin:48px auto 28px;text-align:center;"><span class="eyebrow">More on the shelf</span><h2 class="section-title">Next steps, short reads, number stories and sound cards</h2><p class="section-copy">When the first eight feel easy, the Reading Trail carries on through sh, ch, th and wh, blends, magic e, vowel teams and word endings. The short reads are four-page stories to read together, and the number stories add a maths question to every page. All free, all printable.</p></div><div class="grid app-grid">\n${cards.join("\n")}\n</div>`;
}
{
  // Two different counts, so every claim stays true. The title and H1 say
  // "decodable readers ... for early phonics practice", so they count only the
  // phonics books (Stages 1-3 + the Reading Trail). The descriptions say
  // "early readers", which covers the whole shelf.
  const n = SHELF.length;
  const Word = NUMBER_WORDS[n] ?? String(n);
  const phonics = SHELF.filter((b) => ["stage-1", "stage-2", "stage-3", "trail"].includes(b.group)).length;
  const PhonicsWord = NUMBER_WORDS[phonics] ?? String(phonics);
  let guide = splice(fs.readFileSync(path.join(ROOT, GUIDE), "utf8"), "read-guide-more:generated", guideMoreBlock(), GUIDE);
  const rules = [
    [/\b(\d+|Eight) Free Printable Decodable Readers/g, `${phonics} Free Printable Decodable Readers`],
    [/<h1>\w+ free printable readers for early phonics practice<\/h1>/, `<h1>${PhonicsWord} free printable readers for early phonics practice</h1>`],
    [/"description": "\w+ free illustrated early readers as A4 PDFs/, `"description": "${Word} free illustrated early readers as A4 PDFs`],
    [/Download \w+ free illustrated early readers as A4 PDFs/, `Download ${Word.toLowerCase()} free illustrated early readers as A4 PDFs`],
  ];
  for (const [re, to] of rules) {
    if (!re.test(guide)) throw new Error(`${GUIDE}: count rule no longer matches ${re} — update build-read-shelf.mjs`);
    re.lastIndex = 0;
    guide = guide.replace(re, to);
  }
  write(GUIDE, guide);
}

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
