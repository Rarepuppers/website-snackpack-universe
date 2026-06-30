import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const KO = require("../world-cup/wc-knockout.js");
const THIRD_ALLOCATION = require("../world-cup/third-place-allocation.js");

// Group games end June 27; the knockout starts June 28. Used to keep knockout
// result-matching from ever picking up a group-stage game between the same two
// teams (possible if group opponents meet again deep in the bracket).
const KO_START_ISO = "2026-06-28";

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

function penaltyKicks(competitor) {
  return competitor?.shootoutKicks || competitor?.penaltyKicks || competitor?.penaltyShootout || null;
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
  // Every event between two real (non-placeholder) teams, keyed by team pair.
  // Used to resolve knockout results once the bracket teams are known. If a pair
  // somehow appears twice, the later-dated event wins (the knockout rematch).
  const allByPair = new Map();
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
    const type = comp.status?.type || {};
    const isoDate = String(event.date || "").slice(0, 10);

    if (!isPlaceholder(homeName) && !isPlaceholder(awayName)) {
      const entry = {
        home: homeName,
        away: awayName,
        state: type.state,
        completed: type.completed === true,
        statusShort: type.shortDetail || type.detail || "",
        hs: Number(home.score),
        as: Number(away.score),
        hps: Number.isFinite(Number(home.shootoutScore)) ? Number(home.shootoutScore) : null,
        aps: Number.isFinite(Number(away.shootoutScore)) ? Number(away.shootoutScore) : null,
        hpk: penaltyKicks(home),
        apk: penaltyKicks(away),
        // ESPN flags the advancing side, which also covers penalty shootouts.
        winner: home.winner === true ? homeName : away.winner === true ? awayName : null,
        isoDate
      };
      const prev = allByPair.get(key);
      if (!prev || (entry.isoDate && entry.isoDate >= (prev.isoDate || ""))) allByPair.set(key, entry);
    }

    if (!groupByPair.has(key)) {
      if (isoDate >= KO_START_ISO) continue;
      if (!isPlaceholder(homeName)) unmatched.add(homeName);
      if (!isPlaceholder(awayName)) unmatched.add(awayName);
      continue;
    }

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
  return { results, allByPair };
}

// Build the resolved knockout bracket and overlay any ESPN results onto it.
// Returns the 32 knockout match objects, or null if the group stage isn't done.
function buildKnockout(groups, groupMatches, allByPair) {
  function lookup(n, home, away) {
    const e = allByPair.get(pairKey(home, away));
    // Ignore a same-pair group game (June) when resolving a knockout tie.
    if (!e || (e.isoDate && e.isoDate < KO_START_ISO)) return null;
    const aligned = e.home === home;
    const out = { statusShort: e.statusShort };
    if (e.completed && Number.isFinite(e.hs) && Number.isFinite(e.as)) {
      out.hs = aligned ? e.hs : e.as;
      out.as = aligned ? e.as : e.hs;
      out.time = "FT";
      out.winner = e.winner || (out.hs > out.as ? home : out.hs < out.as ? away : null);
      if (e.hps != null && e.aps != null) {
        out.hps = aligned ? e.hps : e.aps;
        out.aps = aligned ? e.aps : e.hps;
        if (e.hpk || e.apk) {
          out.hpk = aligned ? e.hpk : e.apk;
          out.apk = aligned ? e.apk : e.hpk;
        }
      }
    } else if (e.state === "in") {
      out.time = "Live";
      out.statusShort = "LIVE";
      if (Number.isFinite(e.hs) && Number.isFinite(e.as)) {
        out.lhs = aligned ? e.hs : e.as;
        out.las = aligned ? e.as : e.hs;
      }
    }
    return out;
  }
  const resolved = KO.resolve({ groups, groupMatches, allocation: THIRD_ALLOCATION, lookup });
  // Only publish once the Round of 32 is actually set (all groups finished).
  const r32Ready = resolved.filter((m) => m.round === "Round of 32").every((m) => m.home && m.away);
  return r32Ready ? resolved : null;
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
  let allByPair = new Map();

  try {
    const knownFixtures = base.concat(Array.isArray(current.knockout) ? current.knockout : []);
    const fetchResult = await fetchEspnResults(dateRangeFor(knownFixtures));
    allByPair = fetchResult.allByPair;
    matches = base.map((m) => applyResult(m, fetchResult.results.get(pairKey(m.home, m.away))));
    source = "ESPN scoreboard (unofficial)";
    fetched = true;
  } catch (error) {
    console.warn(`World Cup data automation used existing JSON: ${error.message}`);
  }

  if (!fetched) {
    console.log(`No provider data fetched; left ${outFile} unchanged`);
    return;
  }

  const groups = current.groups || seedGroups;
  const knockout = buildKnockout(groups, matches, allByPair);
  if (knockout) {
    const koScored = knockout.filter((m) => typeof m.hs === "number").length;
    console.log(`Resolved knockout bracket (${koScored} of 32 ties have results).`);
  }

  // Only advance "updatedAt" when the data actually changed. This job runs every
  // few minutes; bumping the timestamp on every run made the site's "Last data
  // update" claim fresh data even when nothing changed. Compare both the group
  // matches and the resolved knockout so a knockout-only change still publishes.
  const matchesChanged = JSON.stringify(matches) !== JSON.stringify(base);
  const knockoutChanged = JSON.stringify(knockout || null) !== JSON.stringify(current.knockout || null);
  if (!matchesChanged && !knockoutChanged && current.updatedAt) {
    console.log(`Results unchanged; left ${outFile} as-is (last real update ${current.updatedAt})`);
    return;
  }

  const next = {
    updatedAt: (matchesChanged || knockoutChanged) ? new Date().toISOString() : (current.updatedAt || new Date().toISOString()),
    source,
    groups,
    matches
  };
  if (knockout) next.knockout = knockout;
  await fs.writeFile(outFile, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile} with ${matches.length} group matches${knockout ? " + 32 knockout ties" : ""} (updatedAt advanced).`);
}

export { buildKnockout, fetchEspnResults };

// Only fetch + write when run directly (node scripts/update-world-cup-data.mjs).
// Importing the module for tests must not hit the network.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
