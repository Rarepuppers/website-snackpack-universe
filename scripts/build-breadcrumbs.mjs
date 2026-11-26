import fs from "node:fs/promises";
import path from "node:path";
import { withBreadcrumbs } from "./lib/breadcrumbs.mjs";

/*
 * Injects BreadcrumbList structured data into every section page, so Google
 * renders "snackpackuniverse.com > Play > Solitaire" in results instead of a
 * raw URL. Idempotent: re-running replaces the previously generated block
 * rather than stacking duplicates.
 *
 * Run: node scripts/build-breadcrumbs.mjs
 */

const root = path.resolve(".");
const check = process.argv.includes("--check");

/**
 * `play/last-bastion/dev/index.html` is the Vite SOURCE for the published game
 * page, not a page of its own: the build copies it over
 * `play/last-bastion/index.html`. Walking into it gave that source a breadcrumb
 * trail ending at a `/play/last-bastion/dev/` URL that does not exist, and the
 * next `npm run build` would have published it. `desktop/` is the same kind of
 * source tree. `build-sitemap.mjs` already skips both; this generator did not,
 * which is how the bogus crumb appeared on 11 September 2026.
 */
const SOURCE_ONLY_TREES = new RegExp("^play/last-bastion/(?:dev|desktop)(?:/|$)");

async function* pages(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join("/");
    if (SOURCE_ONLY_TREES.test(rel)) continue;
    if (entry.isDirectory()) yield* pages(full);
    else if (entry.isFile() && entry.name === "index.html") yield full;
  }
}

async function main() {
  let changed = 0;
  let unchanged = 0;
  let skipped = 0;

  for await (const file of pages(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const dir = path.posix.dirname(rel);
    if (dir === ".") continue; // homepage needs no breadcrumb

    const html = await fs.readFile(file, "utf8");
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) {
      skipped++;
      continue;
    }

    // Some About pages describe an event before it has a story shelf.
    let omittedPath;
    if (/^read\/events\/[^/]+\/about$/.test(dir)) {
      const event = path.posix.dirname(dir);
      try {
        await fs.access(path.join(root, event, "index.html"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        omittedPath = `/${event}`;
      }
    }
    const next = withBreadcrumbs(html, rel, omittedPath);

    // Only touch the file when the block actually changed. Without this the
    // generator rewrote every indexable page on each run, so a one-page edit
    // arrived as a hundred-file diff.
    if (next === html) {
      unchanged++;
      continue;
    }

    if (check) console.error(`Regenerate breadcrumbs in ${rel}`);
    else await fs.writeFile(file, next, "utf8");
    changed++;
  }

  console.log(
    `breadcrumbs: ${changed} ${check ? "out of date" : "written"}, ${unchanged} already current, ${skipped} skipped (noindex)`
  );
  if (check && changed) process.exitCode = 1;
}

main();
