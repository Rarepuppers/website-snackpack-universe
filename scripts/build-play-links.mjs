// Tag every outbound Google Play link so installs are attributable.
//
// Why this exists: the 2026-08-15 audit found 137 outbound Play Store links on
// the property and exactly ONE of them carried a referrer parameter (a World
// Cup link). Play Console attributes installs by acquisition channel using the
// `referrer` parameter on the store URL; without it, every install this website
// drives is filed as organic Play search. So the question "does the site
// convert at all?" -- arguably the most valuable open question about this
// property -- has been unanswerable the whole time for want of a query string.
//
// Same reasoning as build-game-counts.mjs: derive, don't hand-type. 137 links
// hand-tagged would drift the first time someone adds a page.
//
// The tag we build:
//   &referrer=utm_source%3Dwebsite%26utm_medium%3D<surface>%26utm_campaign%3D<slug>
//
//   - `referrer` is the parameter Play actually reads. A plain `utm_source=...`
//     on the store URL is ignored -- the UTM pairs have to be URL-encoded
//     *inside* referrer, which is why this looks doubly escaped. It isn't a bug.
//   - <surface> is the kind of page (arcade, guide, app-page, read, ...), so
//     Play Console answers "which part of the site converts".
//   - <slug> is the individual page, so it also answers "which page".
//
// Two things this deliberately does NOT touch:
//
//   1. JSON-LD blocks. 13 app pages carry the Play URL as the entity's "url"
//      in schema.org markup. That is an identity claim about the app, not a
//      click target -- appending campaign parameters there would assert the
//      canonical URL of the app *is* the tagged one. Skipped by construction.
//   2. play/funnel.js. It builds its Play URL in JavaScript, so no HTML-walking
//      generator can see it. It is tagged by hand and asserted here instead --
//      see checkFunnel() below, which fails if that hand-tagging is ever lost.
//
// Usage:
//   node scripts/build-play-links.mjs           # tag links in place
//   node scripts/build-play-links.mjs --check   # fail if anything is untagged (CI)

import fs from "node:fs";
import path from "node:path";

// Shared with build-go-links.mjs -- see that file for why they must agree.
import { classify, referrerFor } from "./lib/play-surface.mjs";

const root = path.resolve(".");
const checkOnly = process.argv.includes("--check");

const PLAY_HOST = "https://play.google.com/store/apps/details";

// ---------------------------------------------------------------------------
// Rewrite
// ---------------------------------------------------------------------------

const skipDirs = new Set([
  ".git", "node_modules", "dev", "desktop", "release", "stage", "art",
  "scripts", "last-bastion"
]);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

/**
 * Replace Play URLs everywhere EXCEPT inside application/ld+json blocks.
 * Done by splitting on those blocks rather than by regex lookaround, because a
 * lookaround that has to span a whole document is the kind of thing that works
 * until one page nests a script tag differently.
 */
function mapOutsideJsonLd(html, transform) {
  const blockRe = /<script type="application\/ld\+json">[\s\S]*?<\/script>/g;
  let result = "";
  let last = 0;
  for (const match of html.matchAll(blockRe)) {
    result += transform(html.slice(last, match.index));
    result += match[0]; // left exactly as-is
    last = match.index + match[0].length;
  }
  result += transform(html.slice(last));
  return result;
}

// id, then any existing query tail we are going to replace wholesale.
const linkRe = new RegExp(
  PLAY_HOST.replace(/[.?]/g, "\\$&") + "\\?id=([A-Za-z0-9._]+)([^\"'\\s>]*)",
  "g"
);

const untagged = [];
let rewritten = 0;
let links = 0;

for (const file of walkHtml(root)) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const original = fs.readFileSync(file, "utf8");
  const tag = classify(rel);
  const want = referrerFor(tag);

  const updated = mapOutsideJsonLd(original, (chunk) =>
    chunk.replace(linkRe, (match, pkg, tail) => {
      links += 1;
      // Preserve any non-referrer parameters someone added deliberately.
      const kept = tail
        .split("&")
        .filter((p) => p && !p.startsWith("referrer="))
        .join("&");
      const rebuilt =
        `${PLAY_HOST}?id=${pkg}` + (kept ? `&${kept}` : "") + `&referrer=${want}`;
      if (rebuilt !== match) untagged.push(`${rel}: ${pkg} (${tag.surface}/${tag.campaign})`);
      return rebuilt;
    })
  );

  if (updated !== original && !checkOnly) {
    fs.writeFileSync(file, updated);
    rewritten += 1;
  }
}

// ---------------------------------------------------------------------------
// play/funnel.js — the one target no HTML walk can reach
// ---------------------------------------------------------------------------

/**
 * funnel.js builds its store URL in JS, and pages override it via
 * window.SP_PLAY_URL. The overrides live in HTML and are handled above; the
 * default in funnel.js is not, so it is tagged by hand. Assert that here, so
 * losing the hand-tag fails the build instead of silently going dark.
 */
function checkFunnel() {
  const rel = "play/funnel.js";
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return [`${rel}: missing`];
  const source = fs.readFileSync(file, "utf8");
  const problems = [];
  for (const match of source.matchAll(/"(https:\/\/play\.google\.com[^"]*)"/g)) {
    if (!match[1].includes("referrer=")) problems.push(`${rel}: untagged Play URL ${match[1]}`);
  }
  // Since 2026-08-23 the default goes through a /go/ interstitial so the modal's
  // clicks are countable, which means there is normally no Play URL left in
  // here for the loop above to check -- and a vacuous assertion is worse than
  // none, because it looks like cover it is not providing. So require the
  // default to be one of the two acceptable shapes, explicitly.
  const dflt = (source.match(/var DEFAULT_PLAY_URL = "([^"]*)"/) || [])[1];
  if (!dflt) {
    problems.push(`${rel}: DEFAULT_PLAY_URL not found`);
  } else {
    const viaInterstitial = /^https:\/\/www\.snackpackuniverse\.com\/go\//.test(dflt);
    const taggedDirect = dflt.includes("play.google.com") && dflt.includes("referrer=");
    if (!viaInterstitial && !taggedDirect) {
      problems.push(`${rel}: DEFAULT_PLAY_URL is neither a /go/ interstitial nor a tagged Play URL: ${dflt}`);
    }
  }
  return problems;
}

const funnelProblems = checkFunnel();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const problems = [...untagged, ...funnelProblems];

if (checkOnly) {
  if (problems.length > 0) {
    console.error(`${problems.length} Play link(s) missing or carrying a stale referrer:\n`);
    for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
    if (problems.length > 40) console.error(`  ...and ${problems.length - 40} more`);
    console.error("\nRun: node scripts/build-play-links.mjs");
    process.exit(1);
  }
  console.log(`Checked ${links} Play links across the site. All tagged.`);
} else {
  if (funnelProblems.length > 0) {
    // Not auto-fixable: the default URL in funnel.js is a deliberate choice of
    // which app the arcade funnel points at, so it wants a human, not a regex.
    console.error("play/funnel.js needs tagging by hand:\n");
    for (const p of funnelProblems) console.error(`  ${p}`);
    process.exitCode = 1;
  }
  console.log(`Tagged ${links} Play links; rewrote ${rewritten} file(s).`);
}
