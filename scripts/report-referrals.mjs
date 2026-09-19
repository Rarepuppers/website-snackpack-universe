// Who sends people here -- and specifically, which AI assistants do.
//
//   node scripts/report-referrals.mjs                 # last 30d vs prior 30d
//   node scripts/report-referrals.mjs --days=7
//   node scripts/report-referrals.mjs --host=chatgpt.com   # pages that referrer hit
//
// Why this exists
// ---------------
// On 2026-09-19 a re-measure found `chatgpt.com` referring ~60 pageviews in 30
// days -- at or slightly above `www.google.com` (40). An LLM had become a
// discovery channel roughly the size of organic search on this property, and
// nothing in the repository measured it. Search Console cannot see it at all:
// GSC reports *search*, and an assistant citation is not a search result.
//
// That matters more here than it would elsewhere. Every other channel this
// portfolio has is gated on inbound links, of which this site has ~zero and no
// prospect of more. Assistants weight "does this page answer the question"
// far above domain authority, so citation is the one discovery route a
// zero-backlink site can actually win. Whether it grows or was a blip is the
// question that decides whether to keep building guide pages -- so it needs to
// be measured repeatedly, not re-derived by hand each time.
//
// READ THE OUTPUT CAREFULLY -- two traps
// --------------------------------------
//  1. Cloudflare Web Analytics buckets counts to the nearest 10. A row reading
//     10 may be 5 or 14. Treat any single small row as noise and read only the
//     SHAPE; treat +/-10 swings between periods as no change at all.
//  2. Cloudflare counts bots. `mokka.corp.google.com` is Google's internal Play
//     review tooling, not an audience. It is labelled below so it is never
//     mistaken for one.
//
// Credentials are never printed. The Cloudflare token is read from
// SNACKPACK_CF_TOKEN, or from the CLOUDFLARE_API_TOKEN line of the env file at
// CF_ENV_FILE (default below). Note the two `cfat_` tokens in
// api-tokens/web-analytics.txt are DEAD -- the working one lives in the backup
// env file. A missing token is reported as skipped, never as a zero: a zero
// here is a finding, and one produced by a missing key is a lie.
import fs from "node:fs";

const ACCOUNT_TAG = "f58a3b6775dbe9c7cad11ec9ed6cfc80";
const DEFAULT_ENV_FILE = "D:/billing/backup-keys/_root/.env.local";
const GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";

// Every Cloudflare Web Analytics property on the account, discovered 2026-09-20
// by grouping rumPageloadEventsAdaptiveGroups on siteTag with no siteTag filter.
// Do that again rather than hunting for /rum/site_info/list, which this token
// cannot read (it returns "Authentication error", and that is not fixable here).
const SITES = {
  "www.snackpackuniverse.com": "1c270abb562c47788dad5c05b3ba2c2a",
  "atlas.snackpackuniverse.com": "509cda8885eb44dd838f0545823040a7",
  "isclaudedown.com": "0698e095c29249ebb30c57a820357b20",
  "iscodexup.com": "d76d454a223648b8bb3b55cf3941b954",
  "isclaudeup.com": "fb8ab1693757413481e4c7d401810a9d",
  "rarepuppers.github.io": "256121ecf3b542948f9858607cd221f1"
};

// Substrings, so subdomains and new surfaces of the same product still match.
const ASSISTANTS = [
  "chatgpt", "openai", "claude", "anthropic", "perplexity", "gemini",
  "bard", "copilot", "you.com", "phind", "poe.com", "mistral", "deepseek",
  "grok", "x.ai", "duckassist", "andi", "komo"
];
const SEARCH = ["google.", "bing.", "duckduckgo.", "yandex.", "ecosia.", "brave.", "search."];
// Things that are emphatically not an audience.
const KNOWN_BOTS = ["mokka.corp.google.com"];

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const DAYS = Number.parseInt(arg("days", "30"), 10);
const HOST_FILTER = arg("host", null);
const SITE = arg("site", "www.snackpackuniverse.com");
const SITE_TAG = SITES[SITE];
if (!SITE_TAG) {
  console.error(`report:referrals: unknown --site=${SITE}. Known: ${Object.keys(SITES).join(", ")}`);
  process.exit(1);
}
// A referral from the site to itself is internal navigation, not a discovery
// channel. This matters more than it sounds: "claude" is an ASSISTANTS
// substring, so on isclaudeup.com and isclaudedown.com the site's OWN host
// classifies as an AI assistant and invents a channel that does not exist.
// That is exactly the loose-pattern mistake that once accused the wrong app.
const isSelf = (h) => h === SITE || h.endsWith("." + SITE) || SITE.endsWith("." + h);
if (!Number.isFinite(DAYS) || DAYS < 1 || DAYS > 180) {
  console.error(`report:referrals: --days must be 1-180, not ${arg("days", "30")}`);
  process.exit(1);
}

function token() {
  if (process.env.SNACKPACK_CF_TOKEN) return process.env.SNACKPACK_CF_TOKEN.trim();
  const file = process.env.CF_ENV_FILE || DEFAULT_ENV_FILE;
  if (!fs.existsSync(file)) return null;
  // Read the line, not the whole file collapsed: these env files sit beside
  // notepads full of pasted shell transcripts, and stripping newlines before
  // extracting makes a key absorb the next line. (Same trap as the Brevo keys.)
  const line = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((l) => /^\s*(CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*=/.test(l));
  if (!line) return null;
  return line.replace(/^\s*\w+\s*=\s*/, "").replace(/^['"]|['"].*$/g, "").trim();
}

async function graphql(tok, query, variables) {
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors?.length) {
    // Never echo the body wholesale -- it can contain the Authorization header
    // on some error shapes.
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data?.viewer?.accounts?.[0] ?? null;
}

const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

async function referrers(tok, since, until) {
  const q = `query($a:String!,$t:String!,$s:Time!,$e:Time!){viewer{accounts(filter:{accountTag:$a}){
    rumPageloadEventsAdaptiveGroups(filter:{datetime_geq:$s,datetime_leq:$e,siteTag:$t},
      limit:200,orderBy:[count_DESC]){count dimensions{refererHost}}}}}`;
  const data = await graphql(tok, q, { a: ACCOUNT_TAG, t: SITE_TAG, s: iso(since), e: iso(until) });
  const out = new Map();
  for (const row of data?.rumPageloadEventsAdaptiveGroups ?? []) {
    out.set(row.dimensions.refererHost || "(none)", row.count);
  }
  return out;
}

async function pagesFor(tok, host, since, until) {
  const q = `query($a:String!,$t:String!,$s:Time!,$e:Time!,$h:String!){viewer{accounts(filter:{accountTag:$a}){
    rumPageloadEventsAdaptiveGroups(filter:{datetime_geq:$s,datetime_leq:$e,siteTag:$t,refererHost:$h},
      limit:50,orderBy:[count_DESC]){count dimensions{requestPath}}}}}`;
  const data = await graphql(tok, q, { a: ACCOUNT_TAG, t: SITE_TAG, s: iso(since), e: iso(until), h: host });
  return data?.rumPageloadEventsAdaptiveGroups ?? [];
}

const HISTORY_FILE = "data/referral-history.json";

// Cloudflare Web Analytics retention is short, so this script can only ever
// compare two adjacent windows. Persisting one row per run is what makes
// "did assistant traffic grow across the autumn?" answerable at all -- and that
// is the question the guide-page bet is judged on. Committed on purpose: the
// history is the asset, not a build artefact.
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return { rows: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(parsed.rows) ? parsed : { rows: [] };
  } catch {
    // A corrupt history must not take the report down with it.
    console.warn(`! ${HISTORY_FILE} is unreadable; starting a fresh history.`);
    return { rows: [] };
  }
}

function recordHistory(row) {
  const history = loadHistory();
  // One row per (date, window). Re-running today corrects today rather than
  // stacking duplicates that would read as growth.
  // The dedupe key MUST include the site. Without it, running --site=isclaudeup.com
  // silently overwrites that day's snackpackuniverse.com row and the history
  // quietly becomes a mix of properties. Rows written before 2026-09-20 have no
  // site field and are treated as the main site.
  history.rows = history.rows
    .filter((r) => !((r.site ?? "www.snackpackuniverse.com") === row.site
      && r.date === row.date && r.windowDays === row.windowDays))
    .concat(row)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  history.note =
    "Written by scripts/report-referrals.mjs. Counts come from Cloudflare Web " +
    "Analytics and are bucketed to the nearest 10 -- treat any +/-10 move as noise.";
  fs.writeFileSync(HISTORY_FILE, `${JSON.stringify(history, null, 2)}\n`);
  return history;
}

function printHistory() {
  const { rows } = loadHistory();
  if (rows.length === 0) {
    console.log("No history yet. Run `npm run report:referrals` to record the first row.");
    return;
  }
  console.log("date        site                         window  total  assistants  search");
  for (const r of rows) {
    const hosts = Object.entries(r.assistants ?? {}).map(([h, n]) => `${h}:${n}`).join(" ") || "-";
    console.log(
      `${r.date}  ${(r.site ?? "www.snackpackuniverse.com").padEnd(28)} ` +
        `${String(r.windowDays).padStart(5)}d  ${String(r.total).padStart(5)}  ` +
        `${String(r.assistantTotal).padStart(10)}  ${String(r.search).padStart(6)}  ${hosts}`
    );
  }
  console.log("\nCounts bucket to the nearest 10; a +/-10 move between rows is not a change.");
}

const isAssistant = (h) => !isSelf(h.toLowerCase()) && ASSISTANTS.some((a) => h.toLowerCase().includes(a));
const isSearch = (h) => SEARCH.some((x) => h.toLowerCase().includes(x));
const isBot = (h) => KNOWN_BOTS.some((b) => h.toLowerCase().includes(b));

if (process.argv.includes("--history")) {
  printHistory();
} else {

const tok = token();
if (!tok) {
  console.warn("! Cloudflare: skipped -- no token.");
  console.warn("  Set SNACKPACK_CF_TOKEN, or CF_ENV_FILE to an env file holding CLOUDFLARE_API_TOKEN.");
  console.warn("  (The two cfat_ tokens in api-tokens/web-analytics.txt are dead.)");
  process.exit(0);
}

const now = new Date();
const since = new Date(now.getTime() - DAYS * 864e5);
const prevSince = new Date(now.getTime() - 2 * DAYS * 864e5);

try {
  if (HOST_FILTER) {
    const rows = await pagesFor(tok, HOST_FILTER, since, now);
    console.log(`Pages referred by ${HOST_FILTER}, last ${DAYS}d:\n`);
    if (rows.length === 0) console.log("  (none)");
    for (const r of rows) console.log(`  ${String(r.count).padStart(6)}  ${r.dimensions.requestPath}`);
    console.log("\nCounts are bucketed to the nearest 10 -- read the shape, not the rows.");
    // Deliberately NOT process.exit(0): calling it here while fetch's sockets
    // are still closing trips a libuv assertion on Windows that prints after
    // the report and reads exactly like a crash. Fall through and let Node
    // drain instead.
  } else {
  const [cur, prev] = [await referrers(tok, since, now), await referrers(tok, prevSince, since)];
  const total = [...cur.values()].reduce((a, b) => a + b, 0);
  console.log(`${SITE} referrers -- last ${DAYS}d vs prior ${DAYS}d`);
  console.log(`total pageviews: ${total}\n`);

  const delta = (host, n) => {
    const was = prev.get(host) ?? 0;
    const d = n - was;
    if (Math.abs(d) <= 10) return `(was ${was}, flat within bucketing)`;
    return `(was ${was}, ${d > 0 ? "+" : ""}${d})`;
  };

  const assistants = [...cur].filter(([h]) => isAssistant(h));
  console.log("AI ASSISTANTS -- the channel this script exists for");
  if (assistants.length === 0) {
    console.log("  none detected. That is a finding, not an error.");
  }
  for (const [h, n] of assistants) console.log(`  ${String(n).padStart(6)}  ${h.padEnd(28)} ${delta(h, n)}`);
  const assistantTotal = assistants.reduce((a, [, n]) => a + n, 0);
  const search = [...cur].filter(([h]) => isSearch(h)).reduce((a, [, n]) => a + n, 0);
  console.log(`\n  assistants ${assistantTotal} vs search engines ${search}` +
    (Math.abs(assistantTotal - search) <= 10 ? "  (comparable, within bucketing)" : ""));

  console.log("\nEVERYTHING ELSE");
  for (const [h, n] of cur) {
    if (isAssistant(h) || n < 10) continue;
    const note = isBot(h)
      ? "   <-- BOT, not an audience"
      : h === "(none)"
        ? "   <-- direct/untagged"
        : isSelf(h.toLowerCase())
          ? "   <-- internal navigation, not a channel"
          : isSearch(h)
            ? "   <-- SEARCH"
            : "";
    console.log(`  ${String(n).padStart(6)}  ${h.padEnd(28)} ${delta(h, n)}${note}`);
  }
  console.log("\nCounts bucket to the nearest 10; +/-10 between periods is not a change.");
  console.log("Cloudflare sees referrals Search Console cannot. For search itself, use GSC.");

    if (!process.argv.includes("--no-write")) {
      const history = recordHistory({
        site: SITE,
        date: new Date().toISOString().slice(0, 10),
        windowDays: DAYS,
        total,
        assistants: Object.fromEntries(assistants),
        assistantTotal,
        search,
        internal: cur.get("www.snackpackuniverse.com") ?? 0,
        direct: cur.get("(none)") ?? 0
      });
      console.log(`\nRecorded to ${HISTORY_FILE} (${history.rows.length} row(s)). --history to see the trend.`);
    }
  }
} catch (error) {
  console.error(`x Cloudflare: ${error.message}`);
  process.exit(1);
}
}

