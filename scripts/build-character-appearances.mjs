import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isPublicBookEntry, publishedOriginals } from "./lib/character-release.mjs";

const root = new URL("../", import.meta.url);
const at = file => new URL(file, root);
const read = file => fs.readFileSync(at(file), "utf8");
const json = file => JSON.parse(read(file));
const source = process.argv.find(arg => arg.startsWith("--source="))?.slice(9);
const { characters } = source
  ? JSON.parse(fs.readFileSync(path.join(source, "shared-assets/text/characters/catalog.json")))
  : json("data/character-board.json");
const publicCharacters = characters.filter(character => (character.status ?? "public") === "public");
const releases = publishedOriginals(root);
const roles = ["lead", "support", "cameo"];
const shelfTitles = new Map(json("data/read-collections.json").flatMap(collection =>
  collection.sources.map(book => [book.slug, book.title])
));
const bookPages = new Map();
const looksLikeBook = /data-offline-book=|data-read-reader|class="story-page-card"/;
for (const entry of fs.readdirSync(at("read/"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = `read/${entry.name}/index.html`;
  if (!fs.existsSync(at(file))) continue;
  const html = read(file);
  if (!looksLikeBook.test(html) || /<meta[^>]+name="robots"[^>]+noindex/i.test(html)) continue;
  const title = shelfTitles.get(entry.name) ??
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ??
    html.match(/<title>([^|<]+)/)?.[1]?.trim();
  assert(title, `Missing book title: ${file}`);
  bookPages.set(entry.name, { title: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"'), html });
}
const result = Object.fromEntries(publicCharacters.flatMap(character => {
  const appearances = (character.appearances ?? []).flatMap(appearance => {
    if (appearance.kind !== "book" || !isPublicBookEntry(appearance, appearance.id, releases)) return [];
    const book = bookPages.get(appearance.id);
    assert(book, `Published appearance has no book page: ${character.id} in ${appearance.id}`);
    assert(roles.includes(appearance.role), `Invalid role for ${character.id} in ${appearance.id}`);
    return [{ book: appearance.id, title: book.title, role: appearance.role }];
  });
  return appearances.length ? [[character.id, appearances]] : [];
}));

if (process.argv.includes("--candidates")) {
  // Review story prose only. Reader controls, alt text and metadata can name
  // characters from another book. Detected names never create a public role.
  const normalize = value => value.normalize("NFKC").toLowerCase()
    .replace(/[’‘]|&#(?:39|8217);|&apos;/g, "'").replace(/[‐‑–—]/g, "-");
  for (const [slug, { html }] of bookPages) {
    const story = normalize([...html.matchAll(/<article\b[^>]*class="[^"]*story-page-card[^"]*"[^>]*>([\s\S]*?)<\/article>/g)]
      .map(([, text]) => text.replace(/<[^>]+>/g, " ")).join(" "));
    const matches = publicCharacters.filter(character =>
      [character.name, ...(character.aliases ?? [])].some(name => {
        const escaped = normalize(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(?<![\\p{L}\\p{N}-])${escaped}(?![\\p{L}\\p{N}-])`, "u").test(story);
      }));
    if (matches.length) console.log(`${slug}\t${matches.map(character => character.id).join(",")}`);
  }
} else {
  const destination = at("data/character-appearances.json");
  const output = JSON.stringify(result, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    assert.equal(fs.readFileSync(destination, "utf8"), output, "Regenerate data/character-appearances.json");
  } else fs.writeFileSync(destination, output);
  console.log(`Reviewed book appearances for ${Object.keys(result).length} characters.`);
}
