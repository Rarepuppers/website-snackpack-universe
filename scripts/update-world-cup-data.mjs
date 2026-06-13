import fs from "node:fs/promises";
import path from "node:path";

const outFile = path.resolve("data/world-cup-2026.json");
const apiKey = process.env.API_FOOTBALL_KEY;

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

const nameMap = new Map([
  ["Korea Republic", "South Korea"],
  ["Czech Republic", "Czechia"],
  ["USA", "United States"],
  ["U.S.A.", "United States"],
  ["Turkey", "Turkiye"],
  ["T\u00fcrkiye", "Turkiye"],
  ["Ivory Coast", "Cote d'Ivoire"],
  ["C\u00f4te d'Ivoire", "Cote d'Ivoire"],
  ["Cura\u00e7ao", "Curacao"],
  ["Cape Verde Islands", "Cape Verde"],
  ["IR Iran", "Iran"],
  ["Congo DR", "DR Congo"],
  ["Korea Rep.", "South Korea"]
]);

function normalizeTeam(name) {
  return nameMap.get(name) || name;
}

function pairKey(a, b) {
  return [a, b].sort().join("::");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });
}

function normalizeFixture(fixture) {
  const home = normalizeTeam(fixture.teams?.home?.name || "");
  const away = normalizeTeam(fixture.teams?.away?.name || "");
  const group = groupByPair.get(pairKey(home, away)) || "";
  const fixtureId = fixture.fixture?.id ? String(fixture.fixture.id) : "";
  const statusShort = fixture.fixture?.status?.short;
  const statusLong = fixture.fixture?.status?.long || "";
  const elapsed = fixture.fixture?.status?.elapsed ?? null;
  const isPlayed = ["FT", "AET", "PEN"].includes(statusShort);
  const isLive = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(statusShort);
  const match = {
    id: fixtureId,
    date: formatDate(fixture.fixture?.date),
    isoDate: String(fixture.fixture?.date || "").slice(0, 10),
    time: isPlayed ? "FT" : isLive ? (statusShort === "HT" ? "HT" : "Live") : formatTime(fixture.fixture?.date),
    statusShort,
    statusLong,
    elapsed,
    group,
    home,
    away,
    venue: fixture.fixture?.venue?.city || fixture.fixture?.venue?.name || ""
  };
  if (isPlayed) {
    match.hs = fixture.goals?.home ?? 0;
    match.as = fixture.goals?.away ?? 0;
  }
  return match;
}

async function readCurrent() {
  try {
    return JSON.parse(await fs.readFile(outFile, "utf8"));
  } catch {
    return { groups: seedGroups, matches: [] };
  }
}

async function fetchApiFootball() {
  if (!apiKey) {
    throw new Error("Missing API_FOOTBALL_KEY");
  }

  const url = new URL("https://v3.football.api-sports.io/fixtures");
  url.searchParams.set("league", process.env.API_FOOTBALL_LEAGUE_ID || "1");
  url.searchParams.set("season", process.env.API_FOOTBALL_SEASON || "2026");

  const response = await fetch(url, {
    headers: { "x-apisports-key": apiKey }
  });
  if (!response.ok) {
    throw new Error(`API-FOOTBALL request failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload.response)) {
    throw new Error("API-FOOTBALL response did not contain a response array");
  }

  const league = url.searchParams.get("league");
  const season = url.searchParams.get("season");
  console.log(`API-FOOTBALL returned ${payload.response.length} fixtures (league ${league}, season ${season}).`);

  const normalized = payload.response.map(normalizeFixture).filter((match) => match.home && match.away);

  // Diagnostics: a fixture only updates our seed if both team names map to a
  // known group via nameMap/pairKey. When the feed returns no results (as with
  // the missing US-Paraguay score), the most common causes are an empty feed
  // for this league/season, or team names the nameMap doesn't recognize, which
  // leaves them ungrouped and unable to replace the seed fixture.
  const unmatched = new Set();
  let withGroup = 0;
  let finished = 0;
  for (const match of normalized) {
    if (match.group) withGroup += 1;
    else { unmatched.add(match.home); unmatched.add(match.away); }
    if (typeof match.hs === "number") finished += 1;
  }
  console.log(`Mapped ${withGroup}/${normalized.length} fixtures to a group; ${finished} finished with scores.`);
  if (unmatched.size) {
    console.warn(`Teams not matched to a group (add to nameMap): ${Array.from(unmatched).sort().join(", ")}`);
  }

  return normalized;
}

function mergeMatches(current, incoming) {
  const merged = new Map();
  for (const match of current.matches || []) merged.set(matchKey(match), match);
  for (const match of incoming) {
    merged.delete(legacyMatchKey(match));
    merged.set(matchKey(match), match);
  }
  return Array.from(merged.values()).sort((a, b) => {
    return String(a.isoDate || a.date).localeCompare(String(b.isoDate || b.date)) || a.home.localeCompare(b.home);
  });
}

function legacyMatchKey(match) {
  return `date:${match.isoDate || match.date || ""}::${pairKey(match.home, match.away)}`;
}

function matchKey(match) {
  return match.id ? `fixture:${match.id}` : legacyMatchKey(match);
}

async function main() {
  const current = await readCurrent();
  let matches = current.matches || [];
  let source = current.source || "Manual seed";
  let fetched = false;

  try {
    const incoming = await fetchApiFootball();
    matches = mergeMatches(current, incoming);
    source = "API-FOOTBALL fixtures endpoint";
    fetched = true;
  } catch (error) {
    console.warn(`World Cup data automation used existing JSON: ${error.message}`);
  }

  if (!fetched) {
    console.log(`No provider data fetched; left ${outFile} unchanged`);
    return;
  }

  // Only advance "updatedAt" when the match data actually changed. This job
  // runs every 20 minutes; previously it bumped the timestamp on every run, so
  // the site's "Last data update" claimed fresh data even when nothing had
  // changed. If the feed returns nothing new we leave the file byte-identical
  // so no spurious commit is made and the timestamp stays honest.
  const matchesChanged = JSON.stringify(matches) !== JSON.stringify(current.matches || []);
  if (!matchesChanged && current.updatedAt) {
    console.log(`Provider data unchanged; left ${outFile} as-is (last real update ${current.updatedAt})`);
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
