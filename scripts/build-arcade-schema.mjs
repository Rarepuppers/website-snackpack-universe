import fs from "node:fs";

const file = "play/index.html";
const check = process.argv.includes("--check");
const start = "<!-- arcade-itemlist:generated -->";
const end = "<!-- /arcade-itemlist:generated -->";
let html = fs.readFileSync(file, "utf8");
const gamesSection = html.match(/<section id="games">[\s\S]*?<\/section>/i)?.[0] || "";
const items = [];
for (const match of gamesSection.matchAll(/<a class="game-tile" href="([^"]+)"[\s\S]*?<h3>([\s\S]*?)<\/h3>/gi)) {
  const name = match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
  items.push({ "@type": "ListItem", position: items.length + 1, name, url: new URL(match[1], "https://www.snackpackuniverse.com/play/").href });
}
if (!items.length) throw new Error("No arcade tiles found; ItemList was not generated.");
const schema = { "@context": "https://schema.org", "@type": "ItemList", name: "Free games in the SnackPack Arcade", numberOfItems: items.length, itemListElement: items };
const block = `${start}\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n${end}`;
const re = new RegExp(`${start}[\\s\\S]*?${end}`);
const next = re.test(html) ? html.replace(re, block) : html.replace("</head>", `${block}\n</head>`);
if (check) {
  if (next !== html) { console.error("Arcade ItemList schema is stale. Run node scripts/build-arcade-schema.mjs"); process.exit(1); }
  console.log(`Arcade ItemList schema is current (${items.length} games).`);
} else {
  fs.writeFileSync(file, next);
  console.log(`Wrote ItemList schema for ${items.length} games.`);
}
