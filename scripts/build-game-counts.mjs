// Keep every stated game count in sync with the actual number of games.
//
// Why this exists: the same number has now drifted three separate times.
//   - 2026-08-07: 14 game pages + apps/index.html said Brain Games Vol 1 had
//     "nine" or "eighteen" games. It had 24.
//   - 2026-08-14: four guides said the arcade had 32 games. It had 34.
//   - 2026-08-14: three pages said Vol 3 had 23 games. It had 24, because
//     chess-openings had been added.
//
// Root cause every time: whoever adds a game in-app has no reason to know the
// public site states the count in ~30 places, in four different phrasings, for
// four different entities. Fixing the numbers by hand is what produced three
// rounds of drift; this derives them instead.
//
// Counts are injected into spans carrying a data-game-count attribute:
//   <span data-game-count="arcade">34</span> games
// The attribute names the entity, so "23 games" meaning Vol 2 can never be
// confused with "23 games" meaning Vol 3 -- which is exactly the mistake a
// plain find-and-replace made.
//
// llms.txt has no markup, so it is handled by anchored phrase rules instead.
// It is included deliberately: it was missed by three consecutive audits
// because every audit grepped --include=*.html and llms.txt is not HTML.
//
// Usage:
//   node scripts/build-game-counts.mjs           # rewrite counts in place
//   node scripts/build-game-counts.mjs --check   # fail if anything is stale (CI)

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const checkOnly = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// Derive what we can, declare what we cannot
// ---------------------------------------------------------------------------

/** Playable arcade games = directories under play/ that are actual games. */
function countArcadeGames() {
  const notGames = new Set([
    "last-bastion",   // separate Phaser project
    "shared-assets",
    "sprites",
    "social",
    "tiles",
    "assets",
    "daily"           // the hub, not a game
  ]);
  return fs
    .readdirSync(path.join(root, "play"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !notGames.has(e.name))
    .filter((e) => fs.existsSync(path.join(root, "play", e.name, "index.html"))).length;
}

/** Games on the daily hub = one card per game, each tagged with data-game. */
function countDailyGames() {
  const hub = fs.readFileSync(path.join(root, "play", "daily", "index.html"), "utf8");
  return new Set([...hub.matchAll(/data-game="([a-z0-9-]+)"/g)].map((m) => m[1])).size;
}

const declared = JSON.parse(fs.readFileSync(path.join(root, "data", "game-counts.json"), "utf8"));

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty"
];

/** Spelled-out form for small numbers; digits beyond the table. */
function numberWord(n, capitalize = false) {
  const word = NUMBER_WORDS[n];
  if (!word) return String(n);
  return capitalize ? word[0].toUpperCase() + word.slice(1) : word;
}

/**
 * Cross-check the declared Android counts against the companion monorepo when
 * it is present. Absent (CI), we trust the JSON -- the check simply cannot run
 * without the source, and failing there would only teach people to skip it.
 */
function verifyAgainstMonorepo() {
  const apps = {
    vol1: "snackpack-brain-games",
    vol2: "snackpack-brain-games-vol-2",
    vol3: "snackpack-brain-games-vol-3"
  };
  const problems = [];
  let checked = 0;

  for (const [key, dir] of Object.entries(apps)) {
    const file = path.join(root, "..", "apps", dir, "constants", "games.ts");
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    // One registry entry per `id: '...'` at the top level of a game object.
    const actual = (source.match(/^\s+id: '[^']+'/gm) || []).length;
    checked += 1;
    if (actual !== declared.brainGames[key]) {
      problems.push(
        `data/game-counts.json says brainGames.${key} = ${declared.brainGames[key]}, ` +
          `but ${dir}/constants/games.ts registers ${actual}`
      );
    }
  }
  return { problems, checked };
}

const counts = {
  arcade: countArcadeGames(),
  daily: countDailyGames(),
  vol1: declared.brainGames.vol1,
  vol2: declared.brainGames.vol2,
  vol3: declared.brainGames.vol3
};

// "nine more" on the SnackWords page means the hub minus the game you are on.
counts.dailyOthers = counts.daily - 1;

const { problems: monorepoProblems, checked: monorepoChecked } = verifyAgainstMonorepo();

// Validate BEFORE touching a single file. An earlier draft rewrote first and
// checked afterwards, which meant a wrong number in data/game-counts.json was
// dutifully propagated into every page and llms.txt, and *then* reported as an
// error -- leaving the tree worse than before the run. Fail fast instead.
if (monorepoProblems.length > 0) {
  console.error("Declared counts disagree with the app source — no files were changed:\n");
  for (const problem of monorepoProblems) console.error(`  ${problem}`);
  console.error("\nUpdate data/game-counts.json to match, then re-run.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Rewrite
// ---------------------------------------------------------------------------

const skipDirs = new Set([".git", "node_modules", "dev", "desktop", "release", "stage", "art", "scripts", "last-bastion"]);
function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const stale = [];
let rewritten = 0;
let markers = 0;

for (const file of walkHtml(root)) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const original = fs.readFileSync(file, "utf8");

  const updated = original.replace(
    /(<span data-game-count="([a-zA-Z0-9]+)"([^>]*)>)([^<]*)(<\/span>)/g,
    (match, open, key, attrs, current, close) => {
      markers += 1;
      if (!(key in counts)) {
        stale.push(`${rel}: unknown data-game-count="${key}"`);
        return match;
      }
      // Mid-sentence prose reads better spelled out ("nine more", not "9 more").
      // Opt in per marker with data-game-count-format="word".
      const asWord = /data-game-count-format="word"/.test(attrs);
      const want = asWord ? numberWord(counts[key]) : String(counts[key]);
      if (current !== want) {
        stale.push(`${rel}: ${key} says ${current}, should be ${want}`);
        return `${open}${want}${close}`;
      }
      return match;
    }
  );

  if (updated !== original && !checkOnly) {
    fs.writeFileSync(file, updated);
    rewritten += 1;
  }
}

// Phrase rules, for places a <span> cannot go:
//
//   - llms.txt has no markup at all.
//   - <meta content="..."> attributes and JSON-LD string values are not HTML
//     bodies. An earlier draft wrapped a marker inside both on the Brain Games
//     app page and produced an unparseable JSON-LD block -- caught by
//     check-site.mjs, but it is the reason these are anchored on phrasing.
//
// Each rule must match exactly once. A rule that stops matching is a silent
// failure, so "matched zero times" is reported as an error rather than ignored.
const phraseFiles = {
  "llms.txt": [
    { key: "vol1", re: /(Free offline collection of )(\d+)( classics)/ },
    { key: "vol2", re: /(A second collection of )(\d+)( calm, offline classic games)/ },
    { key: "vol3", re: /(A third collection of )(\d+)( games headlined by)/ },
    { key: "arcade", re: /(\n)(\d+)( classic games playable instantly)/ },
    // Opens a paragraph, so it reads as a word rather than a digit.
    { key: "daily", re: /(\n)(\w+|\d+)( games have a shared daily puzzle)/, asWord: true }
  ],
  "apps/snackpack-brain-games/index.html": [
    { key: "vol1", re: /(calm, offline puzzle pack with )(\d+)( classics)/ },
    { key: "vol1", re: /(A calm, offline collection of )(\d+)( classic games)/ }
  ]
};

for (const [rel, rules] of Object.entries(phraseFiles)) {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) continue;
  const before = fs.readFileSync(filePath, "utf8");
  let after = before;

  for (const rule of rules) {
    if (!rule.re.test(after)) {
      stale.push(`${rel}: rule for "${rule.key}" no longer matches — update build-game-counts.mjs`);
      continue;
    }
    after = after.replace(rule.re, (match, pre, current, post) => {
      const value = counts[rule.key];
      const want = rule.asWord ? numberWord(value, true) : String(value);
      if (current !== want) stale.push(`${rel}: ${rule.key} says ${current}, should be ${want}`);
      return `${pre}${want}${post}`;
    });
  }

  if (after !== before && !checkOnly) {
    fs.writeFileSync(filePath, after);
    rewritten += 1;
  }
}

// ---------------------------------------------------------------------------

console.log(
  `Counts: arcade ${counts.arcade}, daily ${counts.daily}, ` +
    `Vol 1 ${counts.vol1}, Vol 2 ${counts.vol2}, Vol 3 ${counts.vol3}`
);
console.log(
  monorepoChecked > 0
    ? `Cross-checked ${monorepoChecked} volume(s) against the companion monorepo.`
    : "Companion monorepo not present — declared Android counts trusted (expected in CI)."
);
console.log(`Scanned ${markers} count marker(s).`);

if (stale.length > 0) {
  if (checkOnly) {
    console.error(`\n${stale.length} stale count(s):\n`);
    for (const item of stale) console.error(`  ${item}`);
    console.error("\nRun: node scripts/build-game-counts.mjs");
    process.exit(1);
  }
  console.log(`\nUpdated ${stale.length} stale count(s) across ${rewritten} file(s):`);
  for (const item of stale) console.log(`  ${item}`);
} else {
  console.log(checkOnly ? "\nAll counts current." : "\nAll counts already current.");
}
