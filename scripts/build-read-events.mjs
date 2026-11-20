// Build the holiday and event bookshelves for /read/ from scripts/lib/read-events.mjs.
//
//   node scripts/build-read-events.mjs           # write pages and the hub band
//   node scripts/build-read-events.mjs --check   # exit 1 if anything is stale or wrong
//
// Writes:
//   read/events/index.html            every event: in season first, then coming up
//   read/events/<id>/index.html       one page per event that has finished books
//   read/index.html                   the in-season band   <!-- read-events:generated -->
//
// Run after scripts/build-read-shelf.mjs: book titles, ages, blurbs and cover
// pictures are read from the generated hub cards, so the shelf stays the one
// place a book's card copy is written. Book pages get their "Part of …" links
// from build-read-shelf.mjs, which owns those blocks.
//
// Checks (both modes): every listed slug is on the shelf, no book belongs to
// two events, every event has a date in the next 24 months, accents keep light
// text readable, and shared dates match Badgify's holidayEvents.ts when the
// monorepo checkout is beside this site.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { READ_EVENTS, eventDates, eventBooks, eventEntries, publishedEvents, eventIconPath, eventIcon } from "./lib/read-events.mjs";

import { renderReadEventActivity } from "./lib/read-event-activities.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.snackpackuniverse.com";
const CHECK = process.argv.includes("--check");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const bannerPaths = (e) => {
  const base = `/read/events/${e.id}/banner`;
  const primary = `${base}.webp`;
  return fs.existsSync(path.join(ROOT, primary)) ? {
    primary, medium: `${base}-1200w.webp`, small: `${base}-720w.webp`,
  } : null;
};
const DAY_LABEL = { christmas: "Christmas Day", "new-year": "New Year’s Day", "lunar-new-year": "Lunar New Year", easter: "Easter Sunday", thanksgiving: "Thanksgiving" };
const christmasGuide = JSON.parse(read("data/christmas-reading-guide.json"));
const guideLinks = [
  { href: "/read/events/christmas/christmas-reading-guide-a4.pdf", label: "Reading guide · A4 PDF" },
  { href: "/read/events/christmas/christmas-reading-guide-letter.pdf", label: "Reading guide · US Letter PDF" },
];

// ---------------------------------------------------------------- the shelf
const hub = read("read/index.html");
const CARDS = new Map();
for (const m of hub.matchAll(/<a class="read-library-card" href="\.\/([^/]+)\/"[^>]*data-pages="(\d+)"[^>]*data-age="(\d+)-(\d+)"[^>]*>(<picture>[\s\S]*?<\/picture>)<div><span class="eyebrow">([^<]*)<\/span><h3>([^<]*)<\/h3>[\s\S]*?<p>([^<]*)<\/p>/g)) {
  const [, slug, pages, a0, a1, picture, eyebrow, title, blurb] = m;
  CARDS.set(slug, { slug, pages: Number(pages), age: [Number(a0), Number(a1)], picture, eyebrow, title, blurb });
}
if (!CARDS.size) throw new Error("read/index.html: no shelf cards found — run scripts/build-read-shelf.mjs first");

// ---------------------------------------------------------------- checks
const problems = [];
const seen = new Map();
const todayIso = new Date().toISOString().slice(0, 10);
const horizon = new Date(Date.now() + 730 * 86400000).toISOString().slice(0, 10);
for (const e of READ_EVENTS) {
  const required = [eventIconPath(e)];
  required.push(...Object.values(bannerPaths(e) ?? {}));
  if (e.activity) required.push("/read/activities/events.css", `/read/activities/${e.activity}.js`);
  if (e.timeline.length) for (const printable of e.printables ?? []) required.push(printable.href);
  if (e.id === "christmas") required.push(...guideLinks.map(({href}) => href));
  for (const asset of required) if (!fs.existsSync(path.join(ROOT, asset))) problems.push(`${e.id}: missing ${asset}`);
  for (const slug of [...eventBooks(e), ...(e.alsoGood ?? []), ...(e.tonight ?? [])]) if (!CARDS.has(slug)) problems.push(`${e.id}: ${slug} is not on the shelf`);
  for (const slug of eventBooks(e)) {
    if (seen.has(slug)) problems.push(`${slug} belongs to both ${seen.get(slug)} and ${e.id}; a book has one event`);
    seen.set(slug, e.id);
  }
  for (const slug of e.tonight ?? []) if (!eventBooks(e).includes(slug)) problems.push(`${e.id}: tonight pick ${slug} is not one of its books`);
  const specialDates = new Set();
  for (const [slug, {date, label}] of Object.entries(e.tonightSpecial ?? {})) {
    const parsed = new Date(`2000-${date}T00:00:00Z`);
    const validDate = Number.isFinite(+parsed) && parsed.toISOString().slice(5, 10) === date;
    if (!e.tonight?.includes(slug) || !validDate || !label?.trim() || specialDates.has(date)) {
      problems.push(`${e.id}: invalid special pick ${slug} for ${date}`);
    }
    specialDates.add(date);
  }
  if (e.id === "christmas") for (const {slug} of christmasGuide.choices) {
    if (!eventBooks(e).includes(slug)) problems.push(`Christmas reading guide: ${slug} is not a Christmas book`);
  }
  if (!eventDates(e).some((d) => d.date >= todayIso && d.date <= horizon)) problems.push(`${e.id}: no date in the next 24 months — extend its date table`);
  if (contrast(e.accent, "#fffdf8") < 4.5) problems.push(`${e.id}: accent ${e.accent} is too light for light text (${contrast(e.accent, "#fffdf8").toFixed(2)}:1)`);
  if (!DAY_LABEL[e.id]) problems.push(`${e.id}: no day label`);
}
badgifyParity();
if (problems.length) {
  console.error(`build-read-events: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Badgify keeps the same events for its holiday shelf. Compare the dates both
// tables produce so a corrected calendar in one is noticed in the other.
function badgifyParity() {
  const candidates = [path.join(ROOT, "../apps/badgify/constants/holidayEvents.ts"), path.join(ROOT, "../../apps/badgify/constants/holidayEvents.ts")];
  const file = candidates.find((f) => fs.existsSync(f));
  if (!file) { if (!CHECK) console.log("build-read-events: Badgify table not found beside this checkout; date parity skipped."); return; }
  const src = fs.readFileSync(file, "utf8");
  // Lunar New Year is the one listed table both share; the computed rules are
  // the same algorithms, so a listed-date comparison catches real drift.
  const block = src.match(/id: 'lunar-new-year'[\s\S]*?dates: \{([^}]*)\}/);
  if (!block) { problems.push("Badgify holidayEvents.ts: lunar-new-year listed dates not found — update the parity check"); return; }
  const theirs = Object.fromEntries([...block[1].matchAll(/(\d{4}): \[(\d+), (\d+)\]/g)].map((m) => [m[1], `${m[2]}-${m[3]}`]));
  const ours = READ_EVENTS.find((e) => e.id === "lunar-new-year").dates[0].dates;
  for (const [y, [m, d]] of Object.entries(ours)) if (theirs[y] && theirs[y] !== `${m}-${d}`) problems.push(`Lunar New Year ${y}: Reads says ${m}-${d}, Badgify says ${theirs[y]}`);
}

// ---------------------------------------------------------------- markup
const dataAttrs = (e) => `data-read-event="${e.id}" data-dates="${eventDates(e).map((d) => d.date).join(" ")}" data-lead="${e.leadDays}" data-tail="${e.tailDays}" data-day="${esc(DAY_LABEL[e.id])}" data-books="${eventBooks(e).length}" style="--event-accent:${e.accent}"`;
const relPicture = (card, prefix, sizes) => card.picture.replace(/(src(?:set)?=")\.\//g, `$1${prefix}`).replace(/, \.\//g, `, ${prefix}`).replace(/sizes="[^"]*"/, `sizes="${sizes}"`).replace(/<img /, '<img loading="lazy" ');
const ages = (c) => `Ages ${c.age[0]}–${c.age[1]}`;
const pagesLabel = (c) => `${c.pages} pages`;

function hubBand() {
  const events = publishedEvents().map((e) => {
    const books = eventEntries(e).map((t) => {
      const c = CARDS.get(t.slug);
      return `<li><a class="read-season-book" href="./${c.slug}/">${relPicture(c, "./", "(max-width: 760px) 34vw, 150px")}<span class="read-season-when">${esc(t.when)}</span><strong>${c.title}</strong><span class="read-season-age">${ages(c)} · ${pagesLabel(c)}</span></a></li>`;
    }).join("");
    return `<div class="read-season-event" ${dataAttrs(e)} hidden><div class="read-season-head"><span class="eyebrow">${eventIcon(e)}In season · <span data-event-countdown>${esc(e.title)}</span></span><h2>${esc(e.heading)}</h2><p>${esc(e.tagline)}</p><a class="text-link" href="./events/${e.id}/">See all ${eventBooks(e).length} ${esc(e.title)} stories${e.summer?.length ? "" : ", in reading order"} →</a></div><ol class="read-season-books">${books}</ol></div>`;
  }).join("\n");
  return `<section class="read-season" data-read-season aria-label="Stories for this time of year" hidden><div class="shell">\n${events}\n<p class="read-season-all"><a class="text-link" href="./events/">Holiday and event stories all year →</a></p></div></section>\n<script src="./events.js"></script>`;
}

// Shared page frame, copied from a published book page like the printable
// collections are, so nav, theme, PWA and analytics stay identical.
const template = read("read/ted-e-bears-blanket-fort/index.html");
const sharedHead = template.slice(template.indexOf("<!-- pwa:generated -->"), template.indexOf("</head>"));
const header = template.slice(template.indexOf('<header class="topbar">'), template.indexOf("<main>"));
const BEACON = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"0e57cfb3eb86422ca40e5fac02b1cf94","spa":false}'></script>`;
function page({ title, desc, url, image, body, jsonld, activity }) {
  return `<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | SnackPack Reads</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${SITE}${image}"><meta property="og:url" content="${SITE}${url}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}${image}"><link rel="icon" href="/assets/favicon-32.png"><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="/site.css">${activity ? '<link rel="stylesheet" href="/read/activities/events.css">' : ""}<script type="application/ld+json">${JSON.stringify(jsonld)}</script><!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
${sharedHead}</head><body>${header}<main>${body}</main><footer class="foot"><div class="shell"><p>Free to read and print. No account, sign-up or ads.</p><a href="/privacy/">Privacy</a></div></footer>${activity ? "" : BEACON}</body></html>
`;
}

function eventPage(e) {
  const renderBooks = (entries, numbered) => entries.map((t, i) => {
    const c = CARDS.get(t.slug);
    return `<li class="read-event-book"><a href="../../${c.slug}/">${relPicture(c, "../../", "(max-width: 760px) 40vw, 220px")}</a><div><span class="read-event-step">${numbered ? `${i + 1} · ` : ""}${esc(t.when)}</span><h3><a href="../../${c.slug}/">${c.title}</a></h3><p class="read-event-meta">${ages(c)} · ${pagesLabel(c)} · <a class="text-link" href="../../${c.slug}/${c.slug}.pdf" download>PDF</a></p><p>${c.blurb}</p></div></li>`;
  }).join("\n");
  const books = renderBooks(e.timeline, true);
  const summer = e.summer?.length
    ? `<section aria-labelledby="summer-christmas"><div class="shell"><h2 id="summer-christmas" class="read-shelf-heading">Summer Christmas</h2><p class="read-shelf-intro">Christmas by the sea, with long summer days and friends around the table.</p><ul class="read-event-books">${renderBooks(e.summer, false)}</ul></div></section>`
    : "";
  const tonight = (e.tonight ?? []).map((slug, i) => {
    const c = CARDS.get(slug);
    const special = e.tonightSpecial?.[slug];
    const dateAttrs = special ? ` data-tonight-date="${special.date}" data-tonight-special="${esc(special.label)}"` : "";
    return `<a class="read-event-tonight-pick" data-tonight${dateAttrs} href="../../${c.slug}/"${i ? " hidden" : ""}>${relPicture(c, "../../", "120px")}<span><span class="eyebrow"${special ? " data-tonight-label" : ""}>Read together tonight</span><strong>${c.title}</strong><span>${ages(c)} · ${pagesLabel(c)}</span></span></a>`;
  }).join("");
  const also = (e.alsoGood ?? []).map((slug) => {
    const c = CARDS.get(slug);
    return `<li><a href="../../${c.slug}/">${c.title}</a> <span>· ${ages(c)} · ${pagesLabel(c)}</span></li>`;
  }).join("");
  const extras = (e.extras ?? []).map((x) => `<li><a href="${x.href}">${esc(x.label)}</a></li>`).join("");
  const desc = `${eventBooks(e).length} free illustrated ${e.title} stories for children${summer ? ", with snowy woodland and summer coastal stories" : ", in the order they happen"}: read online, read aloud or print. ${e.tagline}`;
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: e.heading, description: desc, url: `${SITE}/read/events/${e.id}/`, inLanguage: "en-GB", isAccessibleForFree: true,
    mainEntity: { "@type": "ItemList", itemListOrder: summer ? "https://schema.org/ItemListUnordered" : "https://schema.org/ItemListOrderAscending", numberOfItems: eventBooks(e).length, itemListElement: eventEntries(e).map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/read/${t.slug}/`, name: CARDS.get(t.slug).title })) } };
  const printables = (e.printables ?? []).map(({ href, label }) => {
    const kb = Math.ceil(fs.statSync(path.join(ROOT, href)).size / 1024);
    const size = kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
    return `<li><a href="${esc(href)}" download>${esc(label)}</a> <span>· ${size}</span></li>`;
  }).join("");
  const sources = bannerPaths(e);
  const banner = sources ? `<picture class="read-event-banner"><source srcset="${sources.small} 720w, ${sources.medium} 1200w, ${sources.primary} 1800w" sizes="(max-width: 1180px) 100vw, 1180px"><img src="${sources.primary}" alt="" width="1800" height="600" loading="eager" fetchpriority="high"></picture>` : "";
  const activity = e.activity ? renderReadEventActivity(e.activity) : "";
  const body = `<section class="read-event-hero" ${dataAttrs(e)}><div class="shell"><p class="read-event-crumbs"><a href="/read/">Reads</a> › <a href="/read/events/">Holidays and events</a> › ${esc(e.title)}</p>${banner}<span class="eyebrow">${eventIcon(e)}<span data-event-countdown>Free ${esc(e.title)} picture books</span></span><h1>${esc(e.heading)}</h1><p class="lead">${esc(e.intro ?? e.tagline)}${summer ? " Find a summer Christmas by the sea in its own section." : ""}</p>${tonight ? `<div class="read-event-tonight" data-read-tonight>${tonight}</div>` : ""}</div></section>${e.id === "christmas" ? `\n${renderChristmasGuide(Boolean(summer))}` : ""}
<section><div class="shell"><h2 class="read-shelf-heading">Read them in order</h2><p class="read-shelf-intro">Each story happens a little later in the season than the one before. Every book stands on its own, so start anywhere.</p><ol class="read-event-books">
${books}
</ol>${also || extras ? `<h2 class="read-shelf-heading read-event-sub">Also good this season</h2><ul class="read-event-also">${also}${extras}</ul>` : ""}<p class="read-event-note">Every book is free to read online, read aloud with your device’s voice, save for offline or print as a PDF. They stay on the shelf all year.</p><p><a class="text-link" href="/read/events/">All holiday and event stories</a> · <a class="text-link" href="/read/">The whole bookshelf</a></p></div></section>
${summer ? `${summer}\n` : ""}${activity}
${printables ? `<section><div class="shell"><h2 class="read-shelf-heading">Printables</h2><ul class="read-event-also">${printables}</ul></div></section>` : ""}
<script src="../../events.js"></script>`;
  return page({ title: `${e.heading}: free illustrated picture books`, desc, url: `/read/events/${e.id}/`, image: socialImage(e), body, jsonld, activity: e.activity });
}

function renderChristmasGuide(hasSummer) {
  const guide = christmasGuide;
  const choices = guide.choices.map(({slug, time, mode, why}) => {
    const c = CARDS.get(slug);
    return `<li><strong><a href="../../${c.slug}/">${c.title}</a></strong><br>${ages(c)} · ${esc(time)} · ${esc(mode)}. ${esc(why)}</li>`;
  }).join("\n");
  return `<section aria-labelledby="christmas-reading-guide"><div class="shell"><div class="content-card">
<h2 class="read-shelf-heading" id="christmas-reading-guide">${esc(guide.title)}</h2><p class="read-shelf-intro">${esc(guide.intro)}</p>
<div class="stack-inline">${guideLinks.map(({href, label}) => `<a class="btn btn-secondary" href="${href}" download>${esc(label)}</a>`).join("")}</div>
<ul class="read-event-also">${choices}</ul><p class="read-event-note">${esc(guide.timeNote)}</p>${hasSummer ? '<p><a class="text-link" href="#summer-christmas">Browse Summer Christmas stories →</a></p>' : ""}
<h3>Talk about the story</h3><ol>${guide.questions.map(question => `<li>${esc(question)}</li>`).join("")}</ol>
<h3>${esc(guide.activity.title)}</h3><p>${esc(guide.activity.instruction)}</p></div></div></section>`;
}

function socialImage(e) {
  return fs.existsSync(path.join(ROOT, "read/events", e.id, "social-card.jpg")) ? `/read/events/${e.id}/social-card.jpg` : "/read/social-card.jpg";
}

function indexPage() {
  const cards = READ_EVENTS.map((e) => {
    const has = eventBooks(e).length;
    const covers = has ? `<div class="read-event-stack">${e.timeline.slice(0, 3).map((t) => relPicture(CARDS.get(t.slug), "../", "120px")).join("")}</div>` : "";
    const inner = `${covers}<span class="eyebrow">${eventIcon(e)}<span data-event-countdown>Every year</span></span><h2>${esc(e.title)}</h2><p>${esc(e.tagline)}</p><p class="read-event-count">${has ? `${has} stories` : "Stories coming soon"}</p>`;
    return has ? `<a class="read-event-card" href="./${e.id}/" ${dataAttrs(e)}>${inner}</a>` : `<div class="read-event-card is-coming" ${dataAttrs(e)}>${inner}</div>`;
  }).join("\n");
  const desc = "Free illustrated stories for Christmas, New Year, Lunar New Year, Easter and Thanksgiving. The current season comes first; every book stays readable all year.";
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Holiday and event stories", description: desc, url: `${SITE}/read/events/`, inLanguage: "en-GB", isAccessibleForFree: true,
    hasPart: publishedEvents().map((e) => ({ "@type": "CollectionPage", name: e.heading, url: `${SITE}/read/events/${e.id}/` })) };
  const body = `<section class="read-hub-hero"><div class="shell"><p class="read-event-crumbs"><a href="/read/">Reads</a> › Holidays and events</p><span class="eyebrow">Holiday and event stories</span><h1>Stories for every season</h1><p class="lead">${esc(desc)}</p></div></section>
<section><div class="shell"><div class="read-event-grid" data-read-event-list>
${cards}
</div><p><a class="text-link" href="/read/">Back to the whole bookshelf</a></p></div></section>
<script src="../events.js"></script>`;
  return page({ title: "Holiday and event stories for children", desc, url: "/read/events/", image: socialImage(READ_EVENTS[0]), body, jsonld });
}

// ---------------------------------------------------------------- write
const changes = [];
function write(rel, next) {
  const abs = path.join(ROOT, rel);
  const prev = fs.existsSync(abs) ? read(rel) : "";
  // Breadcrumb JSON-LD is owned by build-breadcrumbs.mjs; keep its block.
  const crumb = prev.match(/<!-- breadcrumbs:generated -->[\s\S]*?<!-- \/breadcrumbs:generated -->/);
  if (crumb) next = next.replace(/<!-- breadcrumbs:generated -->[\s\S]*?<!-- \/breadcrumbs:generated -->/, () => crumb[0]);
  if (prev === next) return;
  changes.push(rel);
  if (!CHECK) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, next); }
}

const OPEN = "<!-- read-events:generated -->", CLOSE = "<!-- /read-events:generated -->";
let hubNext = hub;
if (!hubNext.includes(OPEN)) {
  const anchor = '<section><div class="shell"><!-- read-shelf:generated -->';
  if (!hubNext.includes(anchor)) throw new Error("read/index.html: cannot find where to place the events band");
  hubNext = hubNext.replace(anchor, `${OPEN}\n${CLOSE}\n${anchor}`);
}
const a = hubNext.indexOf(OPEN), b = hubNext.indexOf(CLOSE);
hubNext = hubNext.slice(0, a + OPEN.length) + "\n" + hubBand() + "\n" + hubNext.slice(b);
write("read/index.html", hubNext);
write("read/events/index.html", indexPage());
for (const e of publishedEvents()) write(`read/events/${e.id}/index.html`, eventPage(e));
for (const dir of fs.existsSync(path.join(ROOT, "read/events")) ? fs.readdirSync(path.join(ROOT, "read/events"), { withFileTypes: true }) : []) {
  if (dir.isDirectory() && fs.existsSync(path.join(ROOT, "read/events", dir.name, "index.html")) &&
      !publishedEvents().some((e) => e.id === dir.name)) problems.push(`read/events/${dir.name}/ has no published event — remove the old index page`);
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

if (CHECK) {
  if (changes.length) { console.error(`build-read-events: ${changes.length} file(s) stale — run node scripts/build-read-events.mjs\n  ${changes.join("\n  ")}`); process.exit(1); }
  console.log(`build-read-events: ${READ_EVENTS.length} events (${publishedEvents().length} with books), all generated pages current.`);
} else {
  console.log(`build-read-events: ${READ_EVENTS.length} events (${publishedEvents().length} with books); updated ${changes.length} file(s).`);
  for (const c of changes) console.log(`  ${c}`);
}
