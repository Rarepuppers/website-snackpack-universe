// Pre-deploy integrity check for the whole site. Read-only — it never edits.
//
// The repo has five generators but had nothing that verified their output, so
// a broken internal link or a missing image only surfaced when a person hit it.
// This is the counterpart: run it before pushing.
//
//   node scripts/check-site.mjs          # report, exit 1 on any error
//   node scripts/check-site.mjs --warn   # report, always exit 0
//
// Checks, in rough order of how much they hurt when they break:
//   1. internal links resolve to a real file
//   2. referenced images/scripts/styles exist on disk
//   3. every JSON-LD block parses
//   4. sitemap matches the indexable pages on disk
//   5. house rules: canonical, title, description, analytics beacon

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const WARN_ONLY = process.argv.includes("--warn");

// Build output and vendored copies are not part of the published site.
const SKIP_DIRS = new Set(["node_modules", ".git", "dev", "desktop", "release", "stage", "steampipe"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const allFiles = walk(ROOT);
const htmlFiles = allFiles.filter((f) => f.endsWith(".html") && !f.includes(`${path.sep}last-bastion${path.sep}`));
const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");
const errors = [];
const warnings = [];

// A URL is servable if the exact file exists, or it is a directory with an
// index.html (which is how every page on this site is addressed).
function resolves(urlPath) {
  const clean = urlPath.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return fs.existsSync(path.join(ROOT, "index.html"));
  const p = path.join(ROOT, decodeURIComponent(clean));
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  return fs.existsSync(path.join(p, "index.html"));
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const here = path.dirname(file);
  const name = rel(file);
  const isNoindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);

  // Scan only static markup. Several pages build HTML in JS by string
  // concatenation (`'<img src="' + url + '"'`), and matching inside those
  // yields nonsense targets like `' + href + '` — 69 of them on first run.
  // JSON-LD is still checked below, straight from the full source.
  const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

  const toUrlPath = (href) => {
    if (href.startsWith("/")) return href;
    const abs = path.resolve(here, href.split("#")[0].split("?")[0]);
    return "/" + path.relative(ROOT, abs).split(path.sep).join("/");
  };

  // ── 1. internal links ──
  for (const m of markup.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(href)) continue;
    if (!resolves(toUrlPath(href))) errors.push(`${name}: dead link -> ${href}`);
  }

  // ── 2. referenced assets ──
  const assetAttrs = [
    /<img\b[^>]*\bsrc="([^"]+)"/g,
    /<source\b[^>]*\bsrcset="([^"]+)"/g,
    /<script\b[^>]*\bsrc="([^"]+)"/g,
    /<link\b[^>]*\bhref="([^"]+)"[^>]*\brel="(?:stylesheet|icon|apple-touch-icon|manifest)"/g,
    /<link\b[^>]*\brel="(?:stylesheet|icon|apple-touch-icon|manifest)"[^>]*\bhref="([^"]+)"/g,
  ];
  for (const re of assetAttrs) {
    for (const m of markup.matchAll(re)) {
      const src = m[1].split(",")[0].trim().split(" ")[0];
      if (/^(https?:|data:)/i.test(src)) continue;
      if (!resolves(toUrlPath(src))) errors.push(`${name}: missing asset -> ${src}`);
    }
  }

  // ── 3. JSON-LD ──
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      errors.push(`${name}: invalid JSON-LD (${String(e.message).slice(0, 60)})`);
    }
  }

  // ── 5. house rules ──
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${name}: no <title>`);
  if (!/name="description"/.test(html)) warnings.push(`${name}: no meta description`);
  if (!isNoindex && !/rel="canonical"/.test(html)) warnings.push(`${name}: no canonical`);
  if (!/cloudflareinsights/.test(html)) warnings.push(`${name}: no analytics beacon`);
}

// ── 4. sitemap vs disk ──
const sitemapPath = path.join(ROOT, "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const listed = new Set(
    [...xml.matchAll(/<loc>https:\/\/www\.snackpackuniverse\.com([^<]*)<\/loc>/g)].map((m) => m[1]),
  );
  for (const loc of listed) {
    if (!resolves(loc)) errors.push(`sitemap.xml: lists a page that does not exist -> ${loc}`);
  }
  // Indexable pages missing from the sitemap won't be crawled.
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) continue;
    const r = rel(file);
    if (r === "404.html") continue;
    const loc = "/" + r.replace(/index\.html$/, "");
    if (!listed.has(loc)) warnings.push(`sitemap.xml: missing ${loc}`);
  }
}

const line = (s) => console.log("  " + s);
console.log(`Checked ${htmlFiles.length} pages.\n`);
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  errors.slice(0, 40).forEach(line);
  if (errors.length > 40) line(`... and ${errors.length - 40} more`);
  console.log("");
}
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.slice(0, 25).forEach(line);
  if (warnings.length > 25) line(`... and ${warnings.length - 25} more`);
  console.log("");
}
if (!errors.length && !warnings.length) console.log("Clean.");
process.exit(errors.length && !WARN_ONLY ? 1 : 0);
