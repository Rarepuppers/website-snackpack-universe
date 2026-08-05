import fs from "node:fs/promises";
import path from "node:path";

/*
 * Injects BreadcrumbList structured data into every section page, so Google
 * renders "snackpackuniverse.com > Play > Solitaire" in results instead of a
 * raw URL. Idempotent: re-running replaces the previously generated block
 * rather than stacking duplicates.
 *
 * Run: node scripts/build-breadcrumbs.mjs
 */

const ORIGIN = "https://www.snackpackuniverse.com";
const root = path.resolve(".");
const MARKER_OPEN = "<!-- breadcrumbs:generated -->";
const MARKER_CLOSE = "<!-- /breadcrumbs:generated -->";

// Human labels for the section roots.
const SECTION = {
  apps: "Apps",
  play: "Play",
  guides: "Guides",
  privacy: "Privacy",
  terms: "Terms",
  "world-cup": "World Cup"
};

function titleOf(html) {
  const m = html.match(/<title>(.*?)<\/title>/s);
  if (!m) return null;
  // Strip the site suffix so the crumb reads as a page name, not a full title.
  return m[1]
    .split("|")[0]
    .split("—")[0]
    .trim()
    .replace(/&amp;/g, "&");
}

async function* pages(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(full);
    else if (entry.isFile() && entry.name === "index.html") yield full;
  }
}

async function main() {
  let added = 0;
  let skipped = 0;

  for await (const file of pages(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const dir = path.posix.dirname(rel);
    if (dir === ".") continue; // homepage needs no breadcrumb

    let html = await fs.readFile(file, "utf8");
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) {
      skipped++;
      continue;
    }

    const parts = dir.split("/");
    const items = [{ name: "Home", url: `${ORIGIN}/` }];
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      acc += `/${parts[i]}`;
      const isLast = i === parts.length - 1;
      const label = isLast
        ? titleOf(html) || SECTION[parts[i]] || parts[i]
        : SECTION[parts[i]] ||
          parts[i].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      items.push({ name: label, url: `${ORIGIN}${acc}/` });
    }

    const ld = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.url
      }))
    };

    const block =
      `${MARKER_OPEN}\n<script type="application/ld+json">\n` +
      JSON.stringify(ld, null, 2) +
      `\n</script>\n${MARKER_CLOSE}`;

    // Replace an earlier generated block, else insert before </head>.
    const existing = new RegExp(
      `${MARKER_OPEN}[\\s\\S]*?${MARKER_CLOSE}\\n?`,
      "m"
    );
    html = existing.test(html)
      ? html.replace(existing, block + "\n")
      : html.replace("</head>", block + "\n</head>");

    await fs.writeFile(file, html, "utf8");
    added++;
  }

  console.log(`breadcrumbs: ${added} pages, ${skipped} skipped (noindex)`);
}

main();
