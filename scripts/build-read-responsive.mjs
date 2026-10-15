// Responsive images for the /read/ book pages.
//
//   node scripts/build-read-responsive.mjs           # make missing 480/800 px WebPs, rewrite pages
//   node scripts/build-read-responsive.mjs --check   # fail if a page or variant is stale (CI)
//
// Why: most /read/ readers are on phones (mobile views tripled in October
// 2026), and every picture shipped one size, 768-1200 px. Each <source> now
// offers the 480/800 px variants plus the original, with `sizes` matching the
// measured layout, so desktops and 2x phones download far fewer pixels. See
// scripts/lib/read-srcset.mjs for the measurements behind the widths.
//
// Run after any importer (they write plain single-file <source> tags) and
// before build-read-shelf.mjs, whose hub/homepage cards use the same helper.
// Variants are made with ImageMagick from the JPEG/PNG original (quality 82,
// method 6, the same as build-webp.mjs); --check needs no ImageMagick.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isVariant, sourceTag, variantPath, wantedWidths, webpWidth } from "./lib/read-srcset.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const READ = path.join(ROOT, "read");
const CHECK = process.argv.includes("--check");
const stale = [];
let made = 0;

const books = fs.readdirSync(READ).filter((d) => fs.existsSync(path.join(READ, d, "pages")) && fs.existsSync(path.join(READ, d, "index.html")));

// 1. Variants for every original WebP under read/<book>/pages/.
for (const book of books) {
  const dir = path.join(READ, book, "pages");
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".webp") && !isVariant(f))) {
    const webp = path.join(dir, f);
    const base = webp.replace(/\.webp$/, "");
    const raster = [".jpg", ".png"].map((e) => base + e).find((p) => fs.existsSync(p)) || webp;
    for (const w of wantedWidths(webpWidth(webp))) {
      const out = variantPath(webp, w);
      const fresh = fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(raster).mtimeMs - 1000;
      if (fresh) continue;
      if (CHECK) {
        // mtimes are not preserved by git checkouts, so CI only asks "does it exist".
        if (!fs.existsSync(out)) stale.push(path.relative(ROOT, out));
        continue;
      }
      execFileSync("magick", [raster, "-resize", `${w}x`, "-quality", "82", "-define", "webp:method=6", out]);
      made++;
    }
  }
}

// 2. Rewrite each book page's <source> tags. The title picture and the story
// pages render at different widths, so they get different `sizes`.
const SOURCE = /<source srcset="([^"]+)"(?: sizes="[^"]*")? type="image\/webp">/g;
for (const book of books) {
  const rel = path.join("read", book, "index.html");
  const file = path.join(ROOT, rel);
  const html = fs.readFileSync(file, "utf8");
  const next = html.replace(SOURCE, (tag, set, offset) => {
    const urls = set.split(",").map((s) => s.trim().split(/\s+/)[0]);
    const orig = urls.find((u) => !/-\d+w\.webp$/.test(u)) || urls[urls.length - 1];
    if (!orig.startsWith("./pages/")) return tag; // not one of this book's pictures
    const abs = path.join(READ, book, orig.slice(2));
    const before = html.slice(0, offset);
    const hero = before.lastIndexOf('class="story-title-section"') > before.lastIndexOf('class="story-page-card"');
    return sourceTag(abs, orig.replace(/\.webp$/, ""), hero ? "hero" : "page");
  });
  if (next !== html) {
    stale.push(rel);
    if (!CHECK) fs.writeFileSync(file, next);
  }
}

if (CHECK) {
  if (stale.length) {
    console.error(`build-read-responsive: ${stale.length} stale — run node scripts/build-read-responsive.mjs\n  ${stale.slice(0, 20).join("\n  ")}`);
    process.exit(1);
  }
  console.log(`build-read-responsive: ${books.length} books, every picture responsive and current.`);
} else {
  console.log(`build-read-responsive: ${made} variant(s) made; ${stale.length} page(s) updated across ${books.length} books.`);
}
