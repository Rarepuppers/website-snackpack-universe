import fs from "node:fs/promises";
import path from "node:path";

/*
 * Seed builder for the World Cup 2026 hub.
 * Writes the canonical data/world-cup-2026.json (full 72-match group schedule,
 * verified against the official draw and per-group fixture lists) and generates
 * the 12 group pages (world-cup/group-{a..l}/index.html) from one template.
 *
 * The live updater (scripts/update-world-cup-data.mjs) overwrites the JSON with
 * real API results when API_FOOTBALL_KEY is configured; this file is the seed
 * and the page generator. Re-run with: node scripts/build-world-cup.mjs
 */

const root = path.resolve(".");
const CF_TOKEN = "0e57cfb3eb86422ca40e5fac02b1cf94";
const BALL_IMG = "../officialball_transparent2-50.png";

const GROUPS = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["United States", "Paraguay", "Australia", "Turkiye"],
  E: ["Germany", "Curacao", "Cote d'Ivoire", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"]
};

const FLAGS = {
  "Mexico": { code: "MX", colors: ["#006847", "#ffffff", "#ce1126"] },
  "South Africa": { code: "ZA", colors: ["#007a4d", "#ffb612", "#de3831", "#002395"] },
  "South Korea": { code: "KR", colors: ["#ffffff", "#c60c30", "#003478"] },
  "Czechia": { code: "CZ", colors: ["#ffffff", "#d7141a", "#11457e"] },
  "Canada": { code: "CA", colors: ["#d52b1e", "#ffffff", "#d52b1e"] },
  "Bosnia and Herzegovina": { code: "BA", colors: ["#002f6c", "#f7d116", "#ffffff"] },
  "Qatar": { code: "QA", colors: ["#ffffff", "#8a1538"] },
  "Switzerland": { code: "CH", colors: ["#d52b1e", "#ffffff", "#d52b1e"] },
  "Haiti": { code: "HT", colors: ["#00209f", "#d21034"] },
  "Scotland": { code: "SCO", colors: ["#0065bd", "#ffffff"] },
  "Brazil": { code: "BR", colors: ["#009b3a", "#ffdf00", "#002776"] },
  "Morocco": { code: "MA", colors: ["#c1272d", "#006233"] },
  "United States": { code: "US", colors: ["#b22234", "#ffffff", "#3c3b6e"] },
  "Paraguay": { code: "PY", colors: ["#d52b1e", "#ffffff", "#0038a8"] },
  "Australia": { code: "AU", colors: ["#00008b", "#ffffff", "#e4002b"] },
  "Turkiye": { code: "TR", colors: ["#e30a17", "#ffffff"] },
  "Cote d'Ivoire": { code: "CI", colors: ["#f77f00", "#ffffff", "#009e60"] },
  "Ecuador": { code: "EC", colors: ["#ffdd00", "#034ea2", "#ed1c24"] },
  "Germany": { code: "DE", colors: ["#000000", "#dd0000", "#ffce00"] },
  "Curacao": { code: "CW", colors: ["#002b7f", "#f9e814", "#ffffff"] },
  "Netherlands": { code: "NL", colors: ["#ae1c28", "#ffffff", "#21468b"] },
  "Japan": { code: "JP", colors: ["#ffffff", "#bc002d"] },
  "Sweden": { code: "SE", colors: ["#006aa7", "#fecc00"] },
  "Tunisia": { code: "TN", colors: ["#e70013", "#ffffff"] },
  "Iran": { code: "IR", colors: ["#239f40", "#ffffff", "#da0000"] },
  "New Zealand": { code: "NZ", colors: ["#00247d", "#ffffff", "#cc142b"] },
  "Belgium": { code: "BE", colors: ["#000000", "#ffd90c", "#ef3340"] },
  "Egypt": { code: "EG", colors: ["#ce1126", "#ffffff", "#000000"] },
  "Saudi Arabia": { code: "SA", colors: ["#006c35", "#ffffff"] },
  "Uruguay": { code: "UY", colors: ["#ffffff", "#0038a8", "#fcd116"] },
  "Spain": { code: "ES", colors: ["#aa151b", "#f1bf00", "#aa151b"] },
  "Cape Verde": { code: "CV", colors: ["#003893", "#ffffff", "#cf2027"] },
  "France": { code: "FR", colors: ["#0055a4", "#ffffff", "#ef4135"] },
  "Senegal": { code: "SN", colors: ["#00853f", "#fdef42", "#e31b23"] },
  "Iraq": { code: "IQ", colors: ["#ce1126", "#ffffff", "#000000"] },
  "Norway": { code: "NO", colors: ["#ba0c2f", "#ffffff", "#00205b"] },
  "Argentina": { code: "AR", colors: ["#74acdf", "#ffffff", "#74acdf"] },
  "Algeria": { code: "DZ", colors: ["#006233", "#ffffff", "#d21034"] },
  "Austria": { code: "AT", colors: ["#ed2939", "#ffffff", "#ed2939"] },
  "Jordan": { code: "JO", colors: ["#000000", "#ffffff", "#007a3d", "#ce1126"] },
  "Portugal": { code: "PT", colors: ["#006600", "#ff0000"] },
  "DR Congo": { code: "CD", colors: ["#007fff", "#f7d618", "#ce1021"] },
  "Uzbekistan": { code: "UZ", colors: ["#1eb5e5", "#ffffff", "#009739"] },
  "Colombia": { code: "CO", colors: ["#fcd116", "#003893", "#ce1126"] },
  "Ghana": { code: "GH", colors: ["#ce1126", "#fcd116", "#006b3f"] },
  "Panama": { code: "PA", colors: ["#ffffff", "#005293", "#d21034"] },
  "England": { code: "ENG", colors: ["#ffffff", "#cf142b"] },
  "Croatia": { code: "HR", colors: ["#ff0000", "#ffffff", "#171796"] }
};

// [group, isoDate, home, away, venue, hs?, as?] — verified vs official per-group fixtures.
const SCHEDULE = [
  ["A", "2026-06-11", "Mexico", "South Africa", "Mexico City", 2, 0],
  ["A", "2026-06-11", "South Korea", "Czechia", "Guadalajara", 2, 1],
  ["A", "2026-06-18", "Czechia", "South Africa", "Atlanta"],
  ["A", "2026-06-18", "Mexico", "South Korea", "Guadalajara"],
  ["A", "2026-06-24", "Czechia", "Mexico", "Mexico City"],
  ["A", "2026-06-24", "South Africa", "South Korea", "Monterrey"],

  ["B", "2026-06-12", "Canada", "Bosnia and Herzegovina", "Toronto", 1, 1],
  ["B", "2026-06-13", "Qatar", "Switzerland", "San Francisco Bay Area"],
  ["B", "2026-06-18", "Switzerland", "Bosnia and Herzegovina", "Los Angeles"],
  ["B", "2026-06-18", "Canada", "Qatar", "Vancouver"],
  ["B", "2026-06-24", "Switzerland", "Canada", "Vancouver"],
  ["B", "2026-06-24", "Bosnia and Herzegovina", "Qatar", "Seattle"],

  ["C", "2026-06-13", "Brazil", "Morocco", "New York/New Jersey"],
  ["C", "2026-06-13", "Haiti", "Scotland", "Boston"],
  ["C", "2026-06-19", "Scotland", "Morocco", "Boston"],
  ["C", "2026-06-19", "Brazil", "Haiti", "Philadelphia"],
  ["C", "2026-06-24", "Scotland", "Brazil", "Miami"],
  ["C", "2026-06-24", "Morocco", "Haiti", "Atlanta"],

  ["D", "2026-06-12", "United States", "Paraguay", "Los Angeles"],
  ["D", "2026-06-13", "Australia", "Turkiye", "Vancouver"],
  ["D", "2026-06-19", "United States", "Australia", "Seattle"],
  ["D", "2026-06-19", "Turkiye", "Paraguay", "San Francisco Bay Area"],
  ["D", "2026-06-25", "Turkiye", "United States", "Los Angeles"],
  ["D", "2026-06-25", "Paraguay", "Australia", "San Francisco Bay Area"],

  ["E", "2026-06-14", "Germany", "Curacao", "Houston"],
  ["E", "2026-06-14", "Cote d'Ivoire", "Ecuador", "Philadelphia"],
  ["E", "2026-06-20", "Germany", "Cote d'Ivoire", "Toronto"],
  ["E", "2026-06-20", "Ecuador", "Curacao", "Kansas City"],
  ["E", "2026-06-25", "Curacao", "Cote d'Ivoire", "Philadelphia"],
  ["E", "2026-06-25", "Ecuador", "Germany", "New York/New Jersey"],

  ["F", "2026-06-14", "Netherlands", "Japan", "Dallas"],
  ["F", "2026-06-14", "Sweden", "Tunisia", "Monterrey"],
  ["F", "2026-06-20", "Netherlands", "Sweden", "Houston"],
  ["F", "2026-06-20", "Tunisia", "Japan", "Monterrey"],
  ["F", "2026-06-25", "Japan", "Sweden", "Dallas"],
  ["F", "2026-06-25", "Tunisia", "Netherlands", "Kansas City"],

  ["G", "2026-06-15", "Belgium", "Egypt", "Seattle"],
  ["G", "2026-06-15", "Iran", "New Zealand", "Los Angeles"],
  ["G", "2026-06-21", "Belgium", "Iran", "Los Angeles"],
  ["G", "2026-06-21", "New Zealand", "Egypt", "Vancouver"],
  ["G", "2026-06-26", "Egypt", "Iran", "Seattle"],
  ["G", "2026-06-26", "New Zealand", "Belgium", "Vancouver"],

  ["H", "2026-06-15", "Spain", "Cape Verde", "Atlanta"],
  ["H", "2026-06-15", "Saudi Arabia", "Uruguay", "Miami"],
  ["H", "2026-06-21", "Spain", "Saudi Arabia", "Atlanta"],
  ["H", "2026-06-21", "Uruguay", "Cape Verde", "Miami"],
  ["H", "2026-06-26", "Cape Verde", "Saudi Arabia", "Houston"],
  ["H", "2026-06-26", "Uruguay", "Spain", "Guadalajara"],

  ["I", "2026-06-16", "France", "Senegal", "New York/New Jersey"],
  ["I", "2026-06-16", "Iraq", "Norway", "Boston"],
  ["I", "2026-06-22", "France", "Iraq", "Philadelphia"],
  ["I", "2026-06-22", "Norway", "Senegal", "New York/New Jersey"],
  ["I", "2026-06-26", "Norway", "France", "Boston"],
  ["I", "2026-06-26", "Senegal", "Iraq", "Toronto"],

  ["J", "2026-06-16", "Argentina", "Algeria", "Kansas City"],
  ["J", "2026-06-16", "Austria", "Jordan", "San Francisco Bay Area"],
  ["J", "2026-06-22", "Argentina", "Austria", "Dallas"],
  ["J", "2026-06-22", "Jordan", "Algeria", "San Francisco Bay Area"],
  ["J", "2026-06-27", "Algeria", "Austria", "Kansas City"],
  ["J", "2026-06-27", "Jordan", "Argentina", "Dallas"],

  ["K", "2026-06-17", "Portugal", "DR Congo", "Houston"],
  ["K", "2026-06-17", "Uzbekistan", "Colombia", "Mexico City"],
  ["K", "2026-06-23", "Portugal", "Uzbekistan", "Houston"],
  ["K", "2026-06-23", "Colombia", "DR Congo", "Guadalajara"],
  ["K", "2026-06-27", "Colombia", "Portugal", "Miami"],
  ["K", "2026-06-27", "DR Congo", "Uzbekistan", "Atlanta"],

  ["L", "2026-06-17", "England", "Croatia", "Dallas"],
  ["L", "2026-06-17", "Ghana", "Panama", "Toronto"],
  ["L", "2026-06-23", "England", "Ghana", "Boston"],
  ["L", "2026-06-23", "Panama", "Croatia", "Toronto"],
  ["L", "2026-06-27", "Panama", "England", "New York/New Jersey"],
  ["L", "2026-06-27", "Croatia", "Ghana", "Philadelphia"]
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

function buildMatches() {
  return SCHEDULE.map(([group, iso, home, away, venue, hs, as]) => {
    const played = typeof hs === "number";
    const match = {
      date: shortDate(iso),
      isoDate: iso,
      time: played ? "FT" : "Upcoming",
      group,
      home,
      away,
      venue
    };
    if (played) { match.hs = hs; match.as = as; }
    return match;
  });
}

function listSentence(teams) {
  return teams.slice(0, -1).join(", ") + ", and " + teams[teams.length - 1];
}

function groupPage(letter) {
  const teams = GROUPS[letter];
  const lower = letter.toLowerCase();
  const flags = {};
  teams.forEach((t) => { flags[t] = FLAGS[t]; });
  const seedMatches = SCHEDULE.filter((r) => r[0] === letter).map(([group, iso, home, away, venue, hs, as]) => {
    const obj = { date: shortDate(iso), time: typeof hs === "number" ? "FT" : "Upcoming", group, home, away, venue };
    if (typeof hs === "number") { obj.hs = hs; obj.as = as; }
    return obj;
  });
  const sentence = listSentence(teams);
  const lead = `Follow ${sentence} in Group ${letter}: the live table, every result, and all six group-stage fixtures with dates and host cities.`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World Cup 2026 Group ${letter} Table, Teams, Schedule & Results | SnackPack</title>
<meta name="description" content="World Cup 2026 Group ${letter}: ${sentence}. Live standings, results, fixtures, host cities, and links to the full bracket and schedule.">
<link rel="canonical" href="https://www.snackpackuniverse.com/world-cup/group-${lower}/">
<meta name="theme-color" content="#1f8f77">
<link rel="icon" type="image/png" href="../../snackpack-favicon-transparent.png">
<link rel="apple-touch-icon" href="../../snackpack-favicon-transparent.png">
<meta property="og:title" content="World Cup 2026 Group ${letter} Table, Teams, Schedule & Results">
<meta property="og:description" content="Group ${letter} standings, results, fixtures, and links to the full World Cup 2026 tracker.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://www.snackpackuniverse.com/world-cup/group-${lower}/">
<meta property="og:image" content="https://www.snackpackuniverse.com/snackpack-social-share.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../site.css">
<link rel="stylesheet" href="../../play/play.css">
<style>
.group-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(200px, 0.45fr);
  gap: 22px;
  align-items: center;
  background:
    linear-gradient(145deg, rgba(8, 82, 73, 0.9), rgba(31, 143, 119, 0.78)),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 38px, rgba(255,255,255,0.02) 38px 76px);
  color: #fff;
}
.group-hero p,
.group-hero .lead { color: rgba(255,255,255,0.86); }
.group-hero .eyebrow { color: #fff; background: rgba(255,255,255,0.14); }
.cup-ball-art {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 190px;
}
.cup-ball-art img {
  width: min(100%, 230px);
  height: auto;
  filter: drop-shadow(0 24px 38px rgba(0,0,0,0.34));
}
.group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 6px 0 22px;
}
.group-tabs a {
  min-width: 38px;
  text-align: center;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  font-weight: 800;
  font-size: 0.88rem;
  text-decoration: none;
}
.group-tabs a[aria-current="page"] {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.group-tabs a:hover { border-color: var(--accent); }
.group-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: start;
}
.group-panel,
.group-side {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  box-shadow: var(--shadow);
  padding: 20px;
}
.group-side {
  position: sticky;
  top: 94px;
}
.group-panel h2,
.group-side h2 {
  margin: 0 0 12px;
  font-family: var(--serif);
  font-size: 1.45rem;
}
.team-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}
.team-tile,
.match-row {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255,255,255,0.76);
}
.team-tile {
  padding: 12px;
  display: grid;
  gap: 7px;
  min-height: 104px;
}
.team-flag {
  width: 34px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(32,23,19,0.16);
  object-fit: cover;
}
.team-name {
  font-weight: 900;
  line-height: 1.15;
}
.standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.standings th,
.standings td {
  padding: 9px 7px;
  border-top: 1px solid var(--line);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.standings th:first-child,
.standings td:first-child {
  text-align: left;
  font-weight: 900;
}
.standings th {
  color: var(--muted);
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.match-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}
.match-row {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 11px;
}
.match-date,
.match-meta,
.updated-note,
.empty-state {
  color: var(--muted);
  font-size: 0.84rem;
  font-weight: 750;
  line-height: 1.4;
}
.match-teams {
  display: grid;
  gap: 3px;
  font-weight: 900;
}
.score-pill {
  min-width: 58px;
  text-align: center;
  padding: 7px 9px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-weight: 900;
}
.quick-links {
  display: grid;
  gap: 9px;
}
.quick-links a {
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink);
  font-weight: 900;
  padding: 10px 12px;
  text-decoration: none;
  background: rgba(255,255,255,0.74);
}
.seo-note {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-top: 18px;
}
@media (max-width: 900px) {
  .group-hero { grid-template-columns: 1fr; }
  .group-layout { grid-template-columns: 1fr; }
  .group-side { position: static; }
  .team-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cup-ball-art { min-height: 160px; }
}
@media (max-width: 560px) {
  .team-strip,
  .match-row { grid-template-columns: 1fr; }
  .score-pill { width: fit-content; }
}
</style>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "World Cup 2026 Group ${letter}",
  "url": "https://www.snackpackuniverse.com/world-cup/group-${lower}/",
  "description": "World Cup 2026 Group ${letter} teams, standings, results, and fixtures.",
  "isPartOf": {
    "@type": "WebSite",
    "name": "SnackPack Universe",
    "url": "https://www.snackpackuniverse.com/"
  }
}
</script>
</head>
<body>
<header class="topbar">
  <div class="shell topbar-inner">
    <a class="brand" href="../../">
      <img class="brand-mark" src="../../snackpack-favicon-transparent.png" alt="SnackPack Studios icon">
      <span class="brand-copy">
        <span class="brand-title">SnackPack Studios</span>
        <span class="brand-subtitle">World Cup Group ${letter}</span>
      </span>
    </a>
    <nav aria-label="Primary">
      <ul class="nav-links">
        <li><a href="../">World Cup</a></li>
        <li><a href="../schedule/">Schedule</a></li>
        <li><a href="../teams/">Teams</a></li>
        <li><a href="../bracket/">Bracket</a></li>
        <li><a class="pill-link" href="../../play/">Play</a></li>
      </ul>
    </nav>
  </div>
</header>

<main>
  <section class="page-hero">
    <div class="shell">
      <div class="page-hero-card group-hero">
        <div>
          <span class="eyebrow">World Cup 2026 Group ${letter}</span>
          <h1>Group ${letter} table, teams, results, and fixtures.</h1>
          <p class="lead" style="max-width:760px;">${lead}</p>
          <div class="stack-inline">
            <a class="btn btn-primary" href="../bracket/">Full bracket</a>
            <a class="btn btn-secondary" href="../schedule/">Games today</a>
          </div>
        </div>
        <div class="cup-ball-art" aria-hidden="true">
          <img src="${BALL_IMG}" alt="" loading="eager" width="520" height="520">
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="shell">
      <nav class="group-tabs" aria-label="Jump to another group">
${"ABCDEFGHIJKL".split("").map((g) => `        <a href="../group-${g.toLowerCase()}/"${g === letter ? ' aria-current="page"' : ""}>${g}</a>`).join("\n")}
      </nav>
    </div>
  </section>

  <section style="padding-top:6px;">
    <div class="shell group-layout">
      <article class="group-panel">
        <h2>Group ${letter} Teams</h2>
        <div class="team-strip" id="team-strip"></div>
        <h2>Group ${letter} Table</h2>
        <table class="standings">
          <thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody id="standings-body"></tbody>
        </table>
        <h2 style="margin-top:22px;">Group ${letter} Matches</h2>
        <div class="match-list" id="match-list"></div>
        <p class="seo-note">Standings update automatically from the shared World Cup data file as results come in. Top two teams in each group, plus the eight best third-placed teams, advance to the Round of 32.</p>
      </article>
      <aside class="group-side">
        <h2>Quick Links</h2>
        <div class="quick-links">
          <a href="../bracket/">Full World Cup bracket</a>
          <a href="../schedule/">World Cup schedule today</a>
          <a href="../teams/">All 48 teams</a>
          <a href="../../play/soccer-trivia-sprint/">Soccer Trivia Sprint</a>
        </div>
        <p class="updated-note" id="updated-note">Loading data timestamp...</p>
      </aside>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="shell foot-support">
    <a class="donate-badge" href="https://buy.stripe.com/14A00k7Gi4TF3wl6AL0VO04" target="_blank" rel="noopener" aria-label="Tip or donate to support SnackPack Studios" title="Tip or donate to support SnackPack">
      <img src="../../assets/donate2-50.png" alt="SnackPack - Tip or Donate - Support Us" width="104" height="81" loading="lazy">
    </a>
    <span class="foot-support-copy"><strong>Enjoying SnackPack?</strong><span>We're a small studio. Tips and donations help us keep building calm, ad-free games.</span></span>
  </div>
  <div class="shell foot-wrap">
    <p class="foot-note">World Cup 2026 Group ${letter} from SnackPack Studios.</p>
    <div class="footer-links">
      <a class="text-link" href="../">World Cup games</a>
      <a class="text-link" href="../../play/">Arcade</a>
      <a class="text-link" href="../../privacy/">Privacy</a>
    </div>
  </div>
</footer>

<script>
(function () {
  "use strict";
  var groupId = ${JSON.stringify(letter)};
  var groups = ${JSON.stringify({ [letter]: teams })};
  var matches = ${JSON.stringify(seedMatches)};
  var flagStyles = ${JSON.stringify(flags)};
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function normalizeGroups(source) {
    if (!Array.isArray(source)) return source || groups;
    return source.reduce(function (mapped, group) {
      var key = String(group.name || "").replace(/^Group\\s+/i, "");
      if (key && Array.isArray(group.teams)) mapped[key] = group.teams;
      return mapped;
    }, {});
  }
  function flagDataUrl(team) {
    var style = flagStyles[team] || { code: "FC", colors: ["#1f8f77", "#ffffff", "#de6a38"] };
    var colors = style.colors;
    var stripeWidth = 60 / colors.length;
    var stripes = colors.map(function (color, index) {
      return '<rect x="' + (index * stripeWidth) + '" y="0" width="' + stripeWidth + '" height="40" fill="' + color + '"/>';
    }).join("");
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">' + stripes + '<text x="30" y="25" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="800" fill="#201713" stroke="#fff" stroke-width="3" paint-order="stroke">' + escapeHtml(style.code) + '</text></svg>';
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }
  function teamHtml(team) {
    return '<span title="' + escapeHtml(team) + '"><img class="team-flag" src="' + flagDataUrl(team) + '" alt="' + escapeHtml(team) + ' flag" loading="lazy"> <span class="team-name">' + escapeHtml(team) + '</span></span>';
  }
  function blankStats(team) {
    return { team: team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  }
  function standingsFor() {
    var table = {};
    (groups[groupId] || []).forEach(function (team) { table[team] = blankStats(team); });
    matches.filter(function (m) { return m.group === groupId && typeof m.hs === "number"; }).forEach(function (m) {
      var h = table[m.home], a = table[m.away];
      if (!h || !a) return;
      h.p++; a.p++;
      h.gf += m.hs; h.ga += m.as;
      a.gf += m.as; a.ga += m.hs;
      if (m.hs > m.as) { h.w++; a.l++; h.pts += 3; }
      else if (m.hs < m.as) { a.w++; h.l++; a.pts += 3; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    });
    return Object.keys(table).map(function (team) {
      table[team].gd = table[team].gf - table[team].ga;
      return table[team];
    }).sort(function (a, b) {
      return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team);
    });
  }
  function matchHtml(match) {
    var score = typeof match.hs === "number" ? match.hs + "-" + match.as : "Next";
    return '<div class="match-row"><div class="match-date">' + escapeHtml(match.date || "") + '<br>' + escapeHtml(match.time || "") + '</div><div><div class="match-teams">' + teamHtml(match.home) + teamHtml(match.away) + '</div><div class="match-meta">' + escapeHtml(match.venue || "") + '</div></div><span class="score-pill">' + escapeHtml(score) + '</span></div>';
  }
  function render() {
    document.getElementById("team-strip").innerHTML = (groups[groupId] || []).map(function (team) {
      return '<div class="team-tile">' + teamHtml(team) + '<span class="match-meta">Group ' + groupId + '</span></div>';
    }).join("");
    document.getElementById("standings-body").innerHTML = standingsFor().map(function (row) {
      return '<tr><td>' + teamHtml(row.team) + '</td><td>' + row.p + '</td><td>' + row.w + '</td><td>' + row.d + '</td><td>' + row.l + '</td><td>' + (row.gd > 0 ? "+" : "") + row.gd + '</td><td>' + row.pts + '</td></tr>';
    }).join("");
    var groupMatches = matches.filter(function (match) { return match.group === groupId; }).sort(function (a, b) {
      return String(a.isoDate || a.date).localeCompare(String(b.isoDate || b.date));
    });
    document.getElementById("match-list").innerHTML = groupMatches.length ? groupMatches.map(matchHtml).join("") : '<p class="empty-state">No Group ' + groupId + ' matches listed yet.</p>';
  }
  function applyData(data) {
    if (!data || !data.groups || !Array.isArray(data.matches)) return;
    groups = normalizeGroups(data.groups);
    matches = data.matches;
    if (data.updatedAt) {
      document.getElementById("updated-note").textContent = "Last updated: " + new Date(data.updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + ".";
    }
  }
  fetch("../../data/world-cup-2026.json", { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) throw new Error("World Cup data unavailable");
      return response.json();
    })
    .then(applyData)
    .catch(function () {
      document.getElementById("updated-note").textContent = "Using built-in Group ${letter} fallback data.";
    })
    .then(render);
})();
</script>
<!-- Cloudflare Web Analytics -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token": "${CF_TOKEN}"}'></script>
<!-- End Cloudflare Web Analytics -->
</body>
</html>
`;
}

async function main() {
  const data = {
    updatedAt: new Date().toISOString(),
    source: "Official 2026 World Cup match schedule (verified)",
    groups: GROUPS,
    matches: buildMatches()
  };
  await fs.writeFile(path.join(root, "data/world-cup-2026.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote data/world-cup-2026.json with ${data.matches.length} matches`);

  for (const letter of Object.keys(GROUPS)) {
    const dir = path.join(root, "world-cup", `group-${letter.toLowerCase()}`);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), groupPage(letter), "utf8");
  }
  console.log(`Wrote ${Object.keys(GROUPS).length} group pages`);
}

main().catch((error) => { console.error(error); process.exit(1); });
