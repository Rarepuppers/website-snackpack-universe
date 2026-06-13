import process from "node:process";

/*
 * One-shot diagnostic for the API-FOOTBALL integration.
 *
 * It does NOT write any files. It calls three read-only endpoints and prints
 * what the account can actually see, so we can tell whether the empty fixture
 * list is a plan-coverage problem or a wrong league/season value:
 *   1. /status        -> subscription plan + request limits
 *   2. /leagues?id=N  -> the league name and which seasons it covers
 *   3. /fixtures      -> fixture count for the configured league + season
 *
 * Run via the "Diagnose World Cup API" workflow (workflow_dispatch) so the key
 * stays in the GitHub secret store.
 */

const apiKey = process.env.API_FOOTBALL_KEY;
const leagueId = process.env.API_FOOTBALL_LEAGUE_ID || "1";
const season = process.env.API_FOOTBALL_SEASON || "2026";
const BASE = "https://v3.football.api-sports.io";

if (!apiKey) {
  console.error("Missing API_FOOTBALL_KEY");
  process.exit(1);
}

async function get(path) {
  const response = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": apiKey } });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

async function main() {
  console.log(`Config: league=${leagueId}, season=${season}\n`);

  // 1. Subscription / plan.
  const status = await get("/status");
  if (status.ok && status.payload?.response) {
    const r = status.payload.response;
    console.log("== Account status ==");
    console.log(`Plan:      ${r.subscription?.plan || "unknown"} (active: ${r.subscription?.active})`);
    console.log(`Requests:  ${r.requests?.current ?? "?"} / ${r.requests?.limit_day ?? "?"} per day\n`);
  } else {
    console.warn(`/status failed: ${status.status} ${JSON.stringify(status.payload?.errors || status.payload)}\n`);
  }

  // 2. League coverage — which seasons this league offers.
  const leagues = await get(`/leagues?id=${encodeURIComponent(leagueId)}`);
  if (leagues.ok && Array.isArray(leagues.payload?.response) && leagues.payload.response.length) {
    const entry = leagues.payload.response[0];
    console.log("== League ==");
    console.log(`id ${entry.league?.id} — ${entry.league?.name} (${entry.league?.type})`);
    const seasons = Array.isArray(entry.seasons) ? entry.seasons : [];
    console.log(`Available seasons: ${seasons.map((s) => s.year).join(", ") || "(none)"}`);
    const match = seasons.find((s) => String(s.year) === String(season));
    console.log(`Season ${season} present: ${match ? "YES" : "NO"}`);
    if (match) console.log(`Season ${season} fixtures coverage: ${match.coverage?.fixtures?.events ? "yes" : JSON.stringify(match.coverage?.fixtures)}`);
    console.log("");
  } else {
    console.warn(`/leagues failed or empty: ${leagues.status} ${JSON.stringify(leagues.payload?.errors || leagues.payload)}\n`);
  }

  // 3. Actual fixtures for the configured league + season.
  const fixtures = await get(`/fixtures?league=${encodeURIComponent(leagueId)}&season=${encodeURIComponent(season)}`);
  console.log("== Fixtures ==");
  if (fixtures.ok && Array.isArray(fixtures.payload?.response)) {
    console.log(`league=${leagueId} season=${season} -> ${fixtures.payload.response.length} fixtures`);
    if (fixtures.payload.errors && Object.keys(fixtures.payload.errors).length) {
      console.log(`API errors: ${JSON.stringify(fixtures.payload.errors)}`);
    }
  } else {
    console.warn(`/fixtures failed: ${fixtures.status} ${JSON.stringify(fixtures.payload?.errors || fixtures.payload)}`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
