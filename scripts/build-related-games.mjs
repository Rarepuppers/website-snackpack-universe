import fs from "node:fs/promises";
import path from "node:path";
import { fileEol, replaceMarkerBlock, withEol } from "./lib/marker-block.mjs";

/*
 * Adds a "More free games" block to every arcade game page. Each game page
 * previously linked only back to the hub, so crawlers (and players who just
 * finished a round) had no lateral path between the 30+ games. Related games
 * are picked deterministically from the hub's own ordering, wrapping around,
 * so every game both links out and is linked to.
 *
 * Source of truth is play/index.html — it already lists every game with its
 * tile art and blurb, so titles never drift out of sync.
 *
 * Idempotent: re-running replaces the generated block. Run:
 *   node scripts/build-related-games.mjs
 */

const root = path.resolve(".");
const HUB = path.join(root, "play", "index.html");
const OPEN = "<!-- related-games:generated -->";
const CLOSE = "<!-- /related-games:generated -->";
const COUNT = 6;
const GUIDES = {
  solitaire: "solitaire-without-ads-or-signup",
  sudoku: "sudoku-without-ads-or-mistakes",
  freecell: "freecell-without-ads-solver-verified",
  checkers: "checkers-without-ads-or-signup",
  minesweeper: "minesweeper-without-ads",
  mahjong: "mahjong-solitaire-without-ads",
  thirteen: "thirteen-tien-len-rules",
  "flag-frenzy": "flag-quiz-without-ads",
  "water-sort": "water-sort-strategy",
};

/*
 * One curated entry pinned to the front of every block.
 *
 * Atlas Quest is the studio's flagship and it is not a play/<slug>/ page — it
 * lives at /atlas-quest/ and the game itself is on its own subdomain. The hub
 * parser below only recognises href="./slug/" tiles, so without this it was
 * absent from all 37 game pages: of 264 pages on the site, exactly two linked
 * to it. Rotation cannot fix that, because there is no slug to rotate.
 *
 * Kept deliberately small. This is a pinned link, not an ad slot — if a second
 * entry is ever added here, revisit whether the block is still "more games".
 */
const FEATURED = {
  href: "/atlas-quest/",
  tile: "atlas-quest.svg",
  title: "Atlas Quest",
};

function parseHub(html) {
  const games = [];
  // Some tiles carry a "New" badge between the anchor and the icon.
  const re =
    /<a class="game-tile" href="\.\/([^"]+?)\/">\s*(?:<span class="game-badge-new">[^<]*<\/span>\s*)?<img class="game-icon" src="\.\/tiles\/([^"]+)"[^>]*>\s*<h3>([^<]*)<\/h3>/g;
  let m;
  while ((m = re.exec(html))) {
    games.push({ slug: m[1], tile: m[2], title: m[3].trim() });
  }
  return games;
}

function tile(href, src, title) {
  return (
    `      <a class="game-tile" href="${href}">\n` +
    `        <img class="game-icon" src="${src}" alt="" aria-hidden="true" loading="lazy" width="72" height="72">\n` +
    `        <h3>${title}</h3>\n` +
    `      </a>`
  );
}

function block(current, related) {
  const tiles = [
    // Root-relative, because the featured page is not a sibling of the game pages.
    tile(FEATURED.href, `../tiles/${FEATURED.tile}`, FEATURED.title),
    ...related.map((g) => tile(`../${g.slug}/`, `../tiles/${g.tile}`, g.title)),
  ].join("\n");

  return (
    `${OPEN}\n` +
    `<section class="related-games" aria-label="More free browser games">\n` +
    `  <div class="shell">\n` +
    `    <h2 class="related-games-title">More free games</h2>\n` +
    `    <div class="game-grid game-grid--compact">\n` +
    tiles +
    `\n    </div>\n` +
    (GUIDES[current.slug]
      ? `    <p class="related-games-guide"><a class="text-link" href="../../guides/${GUIDES[current.slug]}/">Read the ${current.title} guide →</a></p>\n`
      : "") +
    `    <p class="related-games-more"><a class="text-link" href="../">See all games in the arcade →</a></p>\n` +
    `  </div>\n` +
    `</section>\n${CLOSE}`
  );
}

async function main() {
  const hub = await fs.readFile(HUB, "utf8");
  const games = parseHub(hub);
  if (games.length < COUNT + 1) {
    console.error("Could not parse the hub game list — aborting.");
    process.exit(1);
  }
  console.log(`parsed ${games.length} games from the arcade hub`);

  let updated = 0;
  let already = 0;
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const file = path.join(root, "play", g.slug, "index.html");
    let html;
    try {
      html = await fs.readFile(file, "utf8");
    } catch {
      console.warn("  no page for", g.slug);
      continue;
    }

    // Next COUNT games in hub order, wrapping — guarantees full coverage.
    const related = [];
    for (let k = 1; related.length < COUNT; k++) {
      related.push(games[(i + k) % games.length]);
    }

    const b = block(g, related);
    const eol = fileEol(html);
    let next = replaceMarkerBlock(html, OPEN, CLOSE, b);
    if (next === null) {
      const inserted = withEol(b, eol);
      if (html.includes('<footer class="foot">')) {
        next = html.replace('<footer class="foot">', inserted + eol + eol + '<footer class="foot">');
      } else if (html.includes("</body>")) {
        // A few pages have no footer — fall back to the end of the document.
        next = html.replace("</body>", inserted + eol + "</body>");
      } else {
        console.warn("  no insertion anchor in", g.slug);
        continue;
      }
    }
    if (next === html) {
      already++;
      continue;
    }
    await fs.writeFile(file, next, "utf8");
    updated++;
  }
  console.log(`related-games: ${updated} written, ${already} already current`);
}

main();
