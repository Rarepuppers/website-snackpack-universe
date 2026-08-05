import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/*
 * Generates a WebP beside every large PNG/JPG the site references, and wraps
 * the referencing <img> in a <picture> that prefers it. The PNG stays as the
 * fallback, so nothing breaks on old clients.
 *
 * Illustrated artwork (feature graphics, story covers, game icons) was shipping
 * as full-colour PNG, which is the worst possible format for it — a 467x700
 * cover was 650 KB as PNG and is ~70 KB as WebP.
 *
 * Idempotent: existing <picture> blocks are left alone. Requires ImageMagick.
 * Run: node scripts/build-webp.mjs
 */

const root = path.resolve(".");
const MIN_BYTES = 120 * 1024; // below this, WebP rarely pays for the extra file
const QUALITY = "82";

async function* files(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else yield full;
  }
}

async function main() {
  // Collect every image referenced from HTML, so we never convert dead assets.
  const html = [];
  for await (const f of files(root)) if (f.endsWith(".html")) html.push(f);

  const referenced = new Set();
  for (const page of html) {
    const s = await fs.readFile(page, "utf8");
    for (const m of s.matchAll(/(?:src|srcset)="([^"]+\.(?:png|jpg|jpeg))"/gi)) {
      referenced.add(path.basename(m[1]));
    }
  }

  // Convert the big ones.
  let converted = 0;
  let savedBytes = 0;
  for await (const f of files(root)) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue;
    if (!referenced.has(path.basename(f))) continue;
    const { size } = await fs.stat(f);
    if (size < MIN_BYTES) continue;

    const out = f.replace(/\.(png|jpe?g)$/i, ".webp");
    try {
      await fs.access(out);
      const cur = await fs.stat(out);
      if (cur.mtimeMs >= (await fs.stat(f)).mtimeMs) continue; // already fresh
    } catch {
      /* not generated yet */
    }
    await run("magick", [f, "-quality", QUALITY, "-define", "webp:method=6", out]);
    const after = (await fs.stat(out)).size;
    savedBytes += size - after;
    converted++;
  }
  console.log(
    `webp: ${converted} images converted, ~${Math.round(savedBytes / 1048576)} MB lighter when served`
  );

  // Wrap referencing <img> tags in <picture>.
  const IMG = /<img([^>]*?)src="([^"]+\.(?:png|jpg|jpeg))"([^>]*?)>/gi;
  let wrapped = 0;
  let pagesChanged = 0;

  for (const page of html) {
    const original = await fs.readFile(page, "utf8");

    // Split out existing <picture> blocks so they're never re-wrapped.
    const parts = original.split(/(<picture>[\s\S]*?<\/picture>)/);
    let out = "";
    for (const part of parts) {
      if (part.startsWith("<picture>")) {
        out += part;
        continue;
      }
      out += part.replace(IMG, (whole, pre, src, post) => {
        const abs = src.startsWith("/")
          ? path.join(root, src)
          : path.resolve(path.dirname(page), src);
        const webpAbs = abs.replace(/\.(png|jpe?g)$/i, ".webp");
        if (!fsSyncExists(webpAbs)) return whole;
        const webpSrc = src.replace(/\.(png|jpe?g)$/i, ".webp");
        wrapped++;
        return `<picture><source srcset="${webpSrc}" type="image/webp"><img${pre}src="${src}"${post}></picture>`;
      });
    }

    if (out !== original) {
      await fs.writeFile(page, out, "utf8");
      pagesChanged++;
    }
  }
  console.log(`wrapped ${wrapped} <img> tags across ${pagesChanged} pages`);
}

import { existsSync } from "node:fs";
function fsSyncExists(p) {
  return existsSync(p);
}

main();
