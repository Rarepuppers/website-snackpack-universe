// Make outbound Play clicks countable, from every surface that has one.
//
// Why this exists: Cloudflare Web Analytics is the only analytics on this
// property, it is the beacon-only free tier, and that tier has no custom
// events -- so an onclick handler on a store link has nowhere to report. The
// single thing Cloudflare counts is a page view of a real page that a real
// browser renders. So every clickable Play link now points at a tiny
// interstitial, which loads (and is therefore counted) and immediately hands
// the visitor on to the tagged Play URL.
//
// That turns "does this page actually send anyone to the store?" -- previously
// unanswerable, and the question every traffic spike raises -- into a row in
// the Cloudflare page-views table.
//
// The path carries the answer:
//
//   /go/<surface>/<campaign>/<app>/
//        |         |          `-- which app they went to get
//        |         `------------- which page they clicked from
//        `----------------------- what kind of page that was
//
// so the Cloudflare table reads directly as a funnel, and build-play-links.mjs
// can recover the original tag from the path alone (see lib/play-surface.mjs).
// The referrer each interstitial sends is byte-identical to what the direct
// link sent, so Play Console series stay continuous rather than restarting.
//
// Three deliberate exclusions:
//
//   1. JSON-LD. Those Play URLs are identity claims about the app, not click
//      targets -- same reasoning as build-play-links.mjs.
//   2. /privacy/. Measured over ~1,070 views in a week on 2026-08-06, the
//      privacy-page store CTA moved nothing: that traffic is Play reviewers
//      and bots, not buyers. Counting it would mostly add bot noise to the
//      totals, and a redirect hop does not belong in a reviewer's path
//      through a compliance page.
//   3. play/funnel.js. It builds its URL in JS, so no HTML walk can see it.
//
// Usage:
//   node scripts/build-go-links.mjs           # generate + rewrite in place
//   node scripts/build-go-links.mjs --check   # fail if anything is stale (CI)

import fs from "node:fs";
import path from "node:path";

import { classify, referrerFor } from "./lib/play-surface.mjs";

const root = path.resolve(".");
const checkOnly = process.argv.includes("--check");

const PLAY_HOST = "https://play.google.com/store/apps/details";
const ORIGIN = "https://www.snackpackuniverse.com";
const BEACON = '{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}';

const SKIP_DIRS = new Set([
  ".git", "node_modules", "dev", "desktop", "release", "stage", "art",
  "scripts", "last-bastion",
  "go",       // our own output
  "privacy",  // see exclusion 2 above
]);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Strip JSON-LD, then hand back the remaining chunks and the blocks verbatim. */
function mapOutsideJsonLd(html, transform) {
  const blockRe = /<script type="application\/ld\+json">[\s\S]*?<\/script>/g;
  let result = "";
  let last = 0;
  for (const match of html.matchAll(blockRe)) {
    result += transform(html.slice(last, match.index));
    result += match[0];
    last = match.index + match[0].length;
  }
  result += transform(html.slice(last));
  return result;
}

// Any anchor pointing at a Play listing OR at an interstitial we already made.
//
// Both, so the script is idempotent and self-migrating: on a re-run the links
// it rewrote last time no longer contain a Play URL, so matching only Play URLs
// would leave them frozen in whatever scheme was current when they were
// written -- and pass 2, seeing nothing referencing the old interstitials,
// would delete them and turn every one of those links into a 404.
//
// Deliberately not limited to .store-badge-link: the first cut of this script
// matched only the badge and silently missed 11 secondary "btn btn-primary" /
// "text-link" CTAs across 9 app pages, undercounting exactly the pages that
// have two CTAs.
const anchorRe =
  /(<a\b[^>]*\bhref=")(https:\/\/play\.google\.com\/store\/apps\/details\?id=[A-Za-z0-9._]+[^"]*|\/go\/[^"]*)(")/g;

const shortName = (pkg) => pkg.replace(/^com\.snackpackuniverse\./, "");

// ---------------------------------------------------------------------------
// A human-readable app name per package, harvested from the app pages
// ---------------------------------------------------------------------------

const appNames = new Map();  // package id  -> display name
const pkgBySlug = new Map(); // apps/<slug> -> package id
const pkgByShort = new Map();// short name  -> package id
const appsDir = path.join(root, "apps");
for (const slug of fs.existsSync(appsDir) ? fs.readdirSync(appsDir) : []) {
  const file = path.join(appsDir, slug, "index.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  // The JSON-LD carries the Play id even after the visible links stop doing so,
  // which is what makes an already-migrated page still readable here.
  const pkg = (html.match(/details\?id=([A-Za-z0-9._]+)/) || [])[1];
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!pkg) continue;
  if (title && !appNames.has(pkg)) appNames.set(pkg, title.split("|")[0].trim());
  pkgBySlug.set(slug, pkg);
  pkgByShort.set(shortName(pkg), pkg);
}
const nameFor = (pkg) => appNames.get(pkg) || shortName(pkg);

/**
 * Which app is this href for? Handles a raw Play URL and both interstitial
 * layouts, so old links migrate to the current scheme instead of dangling.
 */
function packageFor(href) {
  const direct = href.match(/details\?id=([A-Za-z0-9._]+)/);
  if (direct) return direct[1];
  const parts = href.split("/").filter(Boolean); // ["go", ...]
  if (parts[0] !== "go") return null;
  // Current: /go/<surface>/<campaign>/<app>/ . Legacy: /go/<app-slug>/ .
  if (parts.length >= 4) return pkgByShort.get(parts[3]) || null;
  if (parts.length === 2) return pkgBySlug.get(parts[1]) || null;
  return null;
}

// ---------------------------------------------------------------------------
// Pass 1: repoint every Play anchor, collecting the interstitials they need
// ---------------------------------------------------------------------------

const wanted = new Map(); // repo-relative path -> file contents
const problems = [];
let repointed = 0;

function interstitial({ surface, campaign, pkg, from }) {
  const name = nameFor(pkg);
  const playUrl = `${PLAY_HOST}?id=${pkg}&referrer=${referrerFor({ surface, campaign })}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Opening Google Play — ${name}</title>
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<style>
  body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh;
         display: flex; align-items: center; justify-content: center;
         text-align: center; padding: 24px; }
</style>
</head>
<body>
<main>
  <p>Taking you to Google Play…</p>
  <!-- Single source of truth for the URL: the redirect below reads this
       anchor, so build-play-links.mjs tagging it tags the redirect too. It is
       also the no-JavaScript path -- without it this page is a dead end. -->
  <p><a id="go-link" href="${playUrl}" rel="noopener">Continue to ${name} on Google Play</a></p>
  <p><a href="${from}">Go back</a></p>
</main>
<!-- Cloudflare Web Analytics -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='${BEACON}'></script>
<!-- End Cloudflare Web Analytics -->
<script>
  // replace(), not assign(): Back from the Play listing should return to the
  // page the visitor came from, not to this one, which would bounce them
  // straight forward again and trap them.
  (function () {
    var a = document.getElementById("go-link");
    if (a) { window.location.replace(a.href); }
  })();
</script>
</body>
</html>
`;
}

for (const file of walkHtml(root)) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const original = fs.readFileSync(file, "utf8");
  const { surface, campaign } = classify(rel);
  const from = "/" + rel.replace(/index\.html$/, "");

  const updated = mapOutsideJsonLd(original, (chunk) =>
    chunk.replace(anchorRe, (match, open, href, close) => {
      const pkg = packageFor(href);
      if (!pkg) {
        problems.push(`${rel}: cannot tell which app "${href}" is for`);
        return match;
      }
      const dest = `/go/${surface}/${campaign}/${shortName(pkg)}/`;
      wanted.set(
        `go/${surface}/${campaign}/${shortName(pkg)}/index.html`,
        interstitial({ surface, campaign, pkg, from })
      );
      repointed += 1;
      return `${open}${dest}${close}`;
    })
  );

  // play/funnel.js's modal builds its link in JS from window.SP_PLAY_URL, so
  // the anchor walk above cannot see it -- yet the modal is the arcade's main
  // store CTA. Route it through the *same* interstitial as the page's inline
  // link: the question worth answering is "did this arcade page send anyone to
  // the store", not which of the two controls they used, and sharing the
  // interstitial keeps the Play referrer identical either way.
  //
  // Absolute on purpose: funnel.js decides between a new tab and same-tab
  // navigation with /^https?:/ on this value, so a root-relative path here
  // would silently stop the modal opening Play in a new tab.
  const withFunnel = updated.replace(
    /(window\.SP_PLAY_URL = ")(https:\/\/play\.google\.com\/store\/apps\/details\?id=[A-Za-z0-9._]+[^"]*|https:\/\/www\.snackpackuniverse\.com\/go\/[^"]*)(")/g,
    (match, open, href, close) => {
      const pkg = packageFor(href.replace(/^https:\/\/www\.snackpackuniverse\.com/, ""));
      if (!pkg) {
        problems.push(`${rel}: cannot tell which app SP_PLAY_URL "${href}" is for`);
        return match;
      }
      const dest =
        `${ORIGIN}/go/${surface}/${campaign}/${shortName(pkg)}/`;
      wanted.set(
        `go/${surface}/${campaign}/${shortName(pkg)}/index.html`,
        interstitial({ surface, campaign, pkg, from })
      );
      repointed += 1;
      return `${open}${dest}${close}`;
    }
  );

  if (withFunnel !== original) {
    if (checkOnly) problems.push(`${rel}: Play link(s) still pointing straight at the store`);
    else fs.writeFileSync(file, withFunnel);
  }
}

// ---------------------------------------------------------------------------
// play/funnel.js — the default behind the 17 arcade pages that set no override
// ---------------------------------------------------------------------------

// Those pages' modal clicks are the last uncounted store path on the site.
// The default's existing tag is arcade/funnel-modal, and an interstitial at
// go/arcade/funnel-modal/ classifies back to exactly that -- so this is a
// straight gain: the clicks become countable and Play attribution is untouched.
// Per-page granularity is not lost, because all 17 already shared one campaign.
{
  const rel = "play/funnel.js";
  const file = path.join(root, rel);
  if (fs.existsSync(file)) {
    const original = fs.readFileSync(file, "utf8");
    const updated = original.replace(
      /(var DEFAULT_PLAY_URL = ")([^"]*)(")/,
      (match, open, href, close) => {
        const pkg = packageFor(href.replace(/^https:\/\/www\.snackpackuniverse\.com/, ""));
        if (!pkg) {
          problems.push(`${rel}: cannot tell which app DEFAULT_PLAY_URL is for`);
          return match;
        }
        const tag = { surface: "arcade", campaign: "funnel-modal" };
        wanted.set(
          `go/${tag.surface}/${tag.campaign}/${shortName(pkg)}/index.html`,
          interstitial({ ...tag, pkg, from: "/play/" })
        );
        repointed += 1;
        return `${open}${ORIGIN}/go/${tag.surface}/${tag.campaign}/${shortName(pkg)}/${close}`;
      }
    );
    if (updated !== original) {
      if (checkOnly) problems.push(`${rel}: DEFAULT_PLAY_URL still points straight at the store`);
      else fs.writeFileSync(file, updated);
    }
  }
}

// ---------------------------------------------------------------------------
// Pass 2: reconcile go/ with exactly what pass 1 asked for
// ---------------------------------------------------------------------------

const goRoot = path.join(root, "go");
const onDisk = new Set();
if (fs.existsSync(goRoot)) {
  const stack = [goRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else onDisk.add(path.relative(root, full).replaceAll("\\", "/"));
    }
  }
}

let written = 0;
for (const [relPath, contents] of wanted) {
  const full = path.join(root, relPath);
  const current = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
  if (current === contents) continue;
  if (checkOnly) problems.push(`${relPath}: ${current === null ? "missing" : "out of date"}`);
  else {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
    written += 1;
  }
}

// An interstitial nothing links to any more is a page Google can still find.
// Remove it rather than leave a dangling redirect behind.
let removed = 0;
for (const relPath of onDisk) {
  if (wanted.has(relPath)) continue;
  if (checkOnly) problems.push(`${relPath}: orphaned (nothing links here)`);
  else {
    fs.rmSync(path.join(root, relPath));
    removed += 1;
  }
}
if (!checkOnly) {
  // Sweep up directories the removals emptied.
  const prune = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) prune(path.join(dir, e.name));
    }
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0 && dir !== goRoot) fs.rmdirSync(dir);
  };
  prune(goRoot);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (problems.length) {
  console.error(`${problems.length} download-click tracking problem(s):\n`);
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
  if (problems.length > 40) console.error(`  ...and ${problems.length - 40} more`);
  console.error("\nRun: node scripts/build-go-links.mjs");
  process.exit(1);
}

console.log(
  checkOnly
    ? `build-go-links: ${wanted.size} interstitial(s) current, covering ${repointed} link(s).`
    : `build-go-links: ${wanted.size} interstitial(s) cover ${repointed} link(s) ` +
      `(${written} written, ${removed} orphan(s) removed).`
);
