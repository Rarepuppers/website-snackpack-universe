import fs from "node:fs";

export function publishedOriginals(site) {
  const readJson = file => JSON.parse(fs.readFileSync(new URL(file, site), "utf8"));
  const registry = readJson("data/web-originals.json");
  return new Map(Object.entries(registry).flatMap(([slug, file]) => {
    const manifest = readJson(file);
    if (manifest.publicationStatus !== "published") return [];
    const page = new URL(`read/${slug}/index.html`, site);
    if (!fs.existsSync(page) || /<meta[^>]+name="robots"[^>]+noindex/i.test(fs.readFileSync(page, "utf8"))) return [];
    return [[slug, manifest.event]];
  }));
}

export function isPublicBookEntry(entry, book, releases) {
  return !entry.draft || (entry.releaseWithBook === true && releases.has(book));
}
