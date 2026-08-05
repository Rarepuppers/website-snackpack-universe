import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

/*
 * Regenerates sitemap.xml from the pages that actually exist on disk, so newly
 * added app/game pages can't silently drop out of the index. <lastmod> comes
 * from each file's last git commit date, so it reflects real content changes
 * rather than a hand-maintained date that goes stale.
 *
 * Excluded: anything marked noindex, the 404 page, and dev/prototype harnesses.
 * Run: node scripts/build-sitemap.mjs
 */

const ORIGIN = "https://www.snackpackuniverse.com";
const root = path.resolve(".");

// Priority by section — the homepage and the two hub pages lead, then app
// pages, then everything else.
function priorityFor(urlPath) {
  if (urlPath === "/") return "1.0";
  if (["/apps/", "/play/", "/guides/"].includes(urlPath)) return "0.9";
  if (urlPath.startsWith("/apps/") || urlPath.startsWith("/guides/")) return "0.8";
  if (urlPath.startsWith("/play/")) return "0.7";
  if (urlPath.startsWith("/world-cup/")) return "0.6";
  return "0.4";
}

async function* htmlFiles(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.isFile() && entry.name === "index.html") yield full;
  }
}

function gitLastMod(file) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      cwd: root,
      encoding: "utf8"
    }).trim();
    if (out) return out;
  } catch {
    /* file not committed yet — fall through */
  }
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const entries = [];
  const skipped = [];

  for await (const file of htmlFiles(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const dir = path.posix.dirname(rel);
    const urlPath = dir === "." ? "/" : `/${dir}/`;

    const html = await fs.readFile(file, "utf8");
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) {
      skipped.push(urlPath + " (noindex)");
      continue;
    }

    entries.push({
      loc: ORIGIN + urlPath,
      lastmod: gitLastMod(rel),
      priority: priorityFor(urlPath)
    });
  }

  entries.sort((a, b) => a.loc.localeCompare(b.loc));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <priority>${e.priority}</priority>\n  </url>`
    ),
    "</urlset>",
    ""
  ].join("\n");

  await fs.writeFile(path.join(root, "sitemap.xml"), xml, "utf8");
  console.log(`sitemap.xml: ${entries.length} URLs`);
  if (skipped.length) console.log("skipped:", skipped.join(", "));
}

main();
