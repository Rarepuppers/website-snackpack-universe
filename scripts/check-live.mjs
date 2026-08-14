// Post-deploy smoke check: assert that every asset the site *declares* actually
// resolves on the live origin.
//
// Why this exists: on 2026-08-14 the maskable PWA icon and the `place.wav` audio
// pilot were both generated, wired, reviewed and recorded as "DONE + WIRED" in
// two plan documents — but never `git add`ed. `manifest.webmanifest` declared an
// icon that 404'd and `sw.js` precached a `.wav` that 404'd, for a week, while
// `check-site.mjs` passed cleanly on 166 pages. Nothing was wrong *in* the
// markup; the referenced bytes simply were not published.
//
// `check-site.mjs` validates the repo against itself, so it can never catch that
// class of bug. This script is the other half: it reads what the repo promises
// and asks the deployed origin to honour it.
//
// Usage:
//   node scripts/check-live.mjs                       # check the production origin
//   node scripts/check-live.mjs --origin http://...   # check somewhere else
//   node scripts/check-live.mjs --limit 40            # cap requests (default 250)
//
// Exits non-zero if any declared URL fails to return 200.

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const args = process.argv.slice(2);

function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
}

const ORIGIN = String(flag("origin", "https://www.snackpackuniverse.com")).replace(/\/+$/, "");
const LIMIT = Number(flag("limit", 250));
const CONCURRENCY = 8;

/** @type {Map<string, Set<string>>} url -> set of sources that declare it */
const declared = new Map();

function declare(url, source) {
  if (!url) return;
  // Only same-origin, absolute-path assets. External CDNs and mailto: are not ours.
  let pathname;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }
    if (`${parsed.protocol}//${parsed.host}` !== new URL(ORIGIN).origin) return;
    pathname = parsed.pathname;
  } else if (url.startsWith("/")) {
    pathname = url;
  } else {
    return; // relative paths are resolved by check-site.mjs already
  }
  if (!declared.has(pathname)) declared.set(pathname, new Set());
  declared.get(pathname).add(source);
}

function readIfPresent(rel) {
  const full = path.join(root, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

// ---------------------------------------------------------------------------
// 1. manifest.webmanifest — icons, start_url, shortcuts, screenshots
// ---------------------------------------------------------------------------
const manifestText = readIfPresent("manifest.webmanifest");
if (manifestText) {
  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch (err) {
    console.error(`manifest.webmanifest is not valid JSON: ${err.message}`);
    process.exit(1);
  }
  for (const icon of manifest.icons || []) declare(icon.src, "manifest.webmanifest icons");
  for (const shot of manifest.screenshots || []) declare(shot.src, "manifest.webmanifest screenshots");
  for (const cut of manifest.shortcuts || []) {
    declare(cut.url, "manifest.webmanifest shortcuts");
    for (const icon of cut.icons || []) declare(icon.src, "manifest.webmanifest shortcut icons");
  }
  declare(manifest.start_url, "manifest.webmanifest start_url");
}

// ---------------------------------------------------------------------------
// 2. sw.js — the SHELL precache array
//
// This one matters most: the install handler adds entries individually and
// tolerates misses by design, so a 404 here degrades in total silence.
// ---------------------------------------------------------------------------
const swText = readIfPresent("sw.js");
if (swText) {
  const shellMatch = swText.match(/const\s+SHELL\s*=\s*\[([\s\S]*?)\]/);
  if (shellMatch) {
    for (const m of shellMatch[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
      declare(m[1], "sw.js SHELL");
    }
  }
}

// ---------------------------------------------------------------------------
// 3. og:image / twitter:image across every page
//
// These are invisible when broken — the page looks perfect and only the link
// preview is blank, which nobody sees until someone shares it.
// ---------------------------------------------------------------------------
const skipDirs = new Set([".git", "node_modules", "dev", "desktop", "release", "stage", "art", "scripts"]);
function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

for (const file of walkHtml(root)) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(
    /<meta\s+(?:property|name)=["'](og:image|twitter:image)["']\s+content=["']([^"']+)["']/gi
  )) {
    declare(m[2], `${rel} ${m[1]}`);
  }
}

// ---------------------------------------------------------------------------
// Check them
// ---------------------------------------------------------------------------
const urls = [...declared.keys()].sort();
if (urls.length === 0) {
  console.error("No declared assets found — nothing to check. Is the working directory the site root?");
  process.exit(1);
}

const toCheck = urls.slice(0, LIMIT);
const skipped = urls.length - toCheck.length;

async function head(pathname) {
  const url = `${ORIGIN}${pathname}`;
  try {
    // Some static hosts answer HEAD inconsistently; GET with an early abort is
    // more faithful to what a browser actually does.
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    // Drain so the socket can be reused rather than left hanging.
    await res.arrayBuffer().catch(() => {});
    return { pathname, status: res.status, ok: res.ok };
  } catch (err) {
    return { pathname, status: 0, ok: false, error: err.message };
  }
}

const results = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, toCheck.length) }, async () => {
    while (cursor < toCheck.length) {
      const pathname = toCheck[cursor++];
      results.push(await head(pathname));
    }
  })
);

const failures = results.filter((r) => !r.ok).sort((a, b) => a.pathname.localeCompare(b.pathname));

console.log(`Checked ${results.length} declared asset URLs against ${ORIGIN}.`);
if (skipped > 0) console.log(`(${skipped} more skipped by --limit ${LIMIT}.)`);

if (failures.length === 0) {
  console.log("\nAll declared assets resolve.");
  process.exit(0);
}

console.error(`\n${failures.length} declared asset(s) do not resolve:\n`);
for (const f of failures) {
  const why = f.error ? `request failed: ${f.error}` : `HTTP ${f.status}`;
  console.error(`  ${f.pathname}  — ${why}`);
  for (const source of declared.get(f.pathname)) {
    console.error(`      declared by: ${source}`);
  }
}
console.error(
  "\nIf a file exists locally but 404s here, check it was committed — that is the\n" +
    "exact failure this script was written for (see the header comment)."
);
process.exit(1);
