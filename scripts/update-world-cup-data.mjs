import fs from "node:fs/promises";
import path from "node:path";

/*
 * Updates data/world-cup-2026.json with live results.
 *
 * Source: ESPN's public soccer scoreboard feed (no API key required).
 *   https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 * It is an undocumented endpoint but free and reliable; if it ever changes or
 * is unreachable, this script leaves the existing JSON untouched so the site
 * keeps its last good data (the seed schedule from build-world-cup.mjs).
 *
 * Strategy: we OVERLAY ESPN results onto the seed fixtures already in the JSON
 * rather than replacing them. The seed owns the authoritative dates, venues,
 * and groups (per the official schedule); ESPN only supplies scores/status.
 * Matches are paired by team names (each group-stage pairing happens once), so
 * ESPN's UTC kickoff dates can't create duplicates or shift the schedule.
 */

const outFile = path.resolve("data/world-cup-2026.json");
const ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

const seedGroups = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Haiti", "Scotland", "Brazil", "Morocco"],
  D: ["United States", "Paraguay", "Australia", "Turkiye"],
  E: ["Cote d'Ivoire", "Ecuador", "Germany", "Curacao"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Iran", "New Zealand", "Belgium", "Egypt"],
  H: ["Saudi Arabia", "Uruguay", "Spain", "Cape Verde"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["Ghana", "Panama", "England", "Croatia"]
};

const groupByPair = new Map();
for (const [group, teams] of Object.entries(seedGroups)) {
  for (const home of teams) {
    for (const away of teams) {
      if (home !== away) groupByPair.set(pairKey(home, away), group);
    }
  }
}

// ESPN display name -> our canonical name. Only the names that differ.
const espnNameMap = new Map([
  ["Bosnia-Herzegovina", "Bosnia and Herzegovina"],
  ["Congo DR", "DR Congo"],
  ["Curaçao", "Curacao"],
  ["Ivory Coast", "Cote d'Ivoire"],
  ["Türkiye", "Turkiye"]
]);

function normalizeTeam(name) {
  return espnNameMap.get(name) || name;
}

function pairKey(a, b) {
  return [a, b].sort().join("::");
}

// Knockout placeholders ESPN returns ("Group A Winner", "Round of 32 3 Winner",
// "Third Place Group ...") are not real teams — used to suppress false warnings.
function isPlaceholder(name) {
  return /winner|2nd place|third place|group [a-l]\b/i.test(name);
}

async function readCurrent() {
  try {
    return JSON.parse(await fs.readFile(outFile, "utf8"));
  } catch {
    return { groups: seedGroups, matches: [] };
  }
}

function dateRangeFor(matches) {
  const isos = matches.map((m) => m.isoDate).filter(Boolean).sort();
  const compact = (iso) => iso.replace(/-/g, "");
  if (!isos.length) return "20260611-20260712";
  return `${compact(isos[0])}-${compact(isos[isos.length - 1])}`;
}

async function fetchEspnResults(dateRange) {
  const response = await fetch(`${ESPN_URL}?dates=${dateRange}`);
  if (!response.ok) {
    throw new Error(`ESPN request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!Array.isArray(data.events)) {
    throw new Error("ESPN response did not contain an events array");
  }

  console.log(`ESPN returned ${data.events.length} events for ${dateRange}.`);

  const results = new Map();
  const unmatched = new Set();
  let completed = 0;
  let live = 0;

  for (const event of data.events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const competitors = comp.competitors || [];
    const home = competitors.find((c) => c.homeAway === "home");
    const away = competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeName = normalizeTeam(home.team?.displayName || "");
    const awayName = normalizeTeam(away.team?.displayName || "");
    const key = pairKey(homeName, awayName);
    if (!groupByPair.has(key)) {
      if (!isPlaceholder(homeName)) unmatched.add(homeName);
      if (!isPlaceholder(awayName)) unmatched.add(awayName);
      continue;
    }

    const type = comp.status?.type || {};
    const result = {
      home: homeName,
      away: awayName,
      state: type.state,
      completed: type.completed === true,
      statusShort: type.shortDetail || type.detail || "",
      hs: Number(home.score),
      as: Number(away.score)
    };
    if (result.completed) completed += 1;
    else if (result.state === "in") live += 1;
    results.set(key, result);
  }

  console.log(`Mapped ${results.size} group-stage fixtures (${completed} final, ${live} live).`);
  if (unmatched.size) {
    console.warn(`ESPN names not matched to a group (add to espnNameMap): ${Array.from(unmatched).sort().join(", ")}`);
  }
  return results;
}

// Overlay ESPN results onto a seed fixture.
//
// FINAL scores go in hs/as. The whole site treats "match has a numeric hs" as
// "this result is final and counts in the standings", so a live, in-progress
// score must NOT go there. Live scores are written to separate lhs/las fields
// that only the match-row display reads; standings ignore them entirely.
//
// Scheduled matches are left exactly as seeded.
function applyResult(match, result) {
  const next = { ...match };
  delete next.hs;
  delete next.as;
  delete next.lhs;
  delete next.las;
  delete next.statusShort;

  if (result && result.completed && Number.isFinite(result.hs) && Number.isFinite(result.as)) {
    const aligned = result.home === match.home;
    next.hs = aligned ? result.hs : result.as;
    next.as = aligned ? result.as : result.hs;
    next.time = "FT";
    next.statusShort = "FT";
  } else if (result && result.state === "in") {
    // Live match: keep the "Live" status and overlay the running score into
    // lhs/las. The score changes as goals go in, so a run during a live match
    // now commits on each score change (kickoff -> goals -> final), not only
    // on the kickoff/final transitions.
    next.time = "Live";
    next.statusShort = "LIVE";
    if (Number.isFinite(result.hs) && Number.isFinite(result.as)) {
      const aligned = result.home === match.home;
      next.lhs = aligned ? result.hs : result.as;
      next.las = aligned ? result.as : result.hs;
    }
  } else {
    next.time = "Upcoming";
  }
  return next;
}

async function main() {
  const current = await readCurrent();
  const base = current.matches || [];

  if (!base.length) {
    console.warn("No seed matches in JSON; run `node scripts/build-world-cup.mjs --seed-data` first.");
  }

  let matches = base;
  let source = current.source || "Manual seed";
  let fetched = false;

  try {
    const results = await fetchEspnResults(dateRangeFor(base));
    matches = base.map((m) => applyResult(m, results.get(pairKey(m.home, m.away))));
    source = "ESPN scoreboard (unofficial)";
    fetched = true;
  } catch (error) {
    console.warn(`World Cup data automation used existing JSON: ${error.message}`);
  }

  if (!fetched) {
    console.log(`No provider data fetched; left ${outFile} unchanged`);
    return;
  }

  // Only advance "updatedAt" when the match data actually changed. This job
  // runs every 20 minutes; bumping the timestamp on every run made the site's
  // "Last data update" claim fresh data even when nothing had changed. If the
  // feed brought nothing new we leave the file byte-identical so no spurious
  // commit is made and the timestamp stays honest.
  const matchesChanged = JSON.stringify(matches) !== JSON.stringify(base);
  if (!matchesChanged && current.updatedAt) {
    console.log(`Results unchanged; left ${outFile} as-is (last real update ${current.updatedAt})`);
    return;
  }

  const next = {
    updatedAt: matchesChanged ? new Date().toISOString() : (current.updatedAt || new Date().toISOString()),
    source,
    groups: current.groups || seedGroups,
    matches
  };
  await fs.writeFile(outFile, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile} with ${matches.length} matches (updatedAt advanced).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
