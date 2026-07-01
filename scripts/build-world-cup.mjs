import fs from "node:fs/promises";
import path from "node:path";

/*
 * Builder for the World Cup 2026 group pages.
 *
 * WHAT IT DOES
 *   By default it (re)writes the 12 group pages:
 *     world-cup/group-a/index.html ... world-cup/group-l/index.html
 *   from one template, using the data tables below (GROUPS, FLAGS, SCHEDULE).
 *
 * IT DOES *NOT* TOUCH data/world-cup-2026.json BY DEFAULT.
 *   That file is updated automatically every 20 minutes by GitHub Actions
 *   (.github/workflows/update-world-cup-data.yml -> scripts/update-world-cup-data.mjs)
 *   with live scores. Overwriting it here would wipe out those live results.
 *
 * COMMANDS
 *   node scripts/build-world-cup.mjs              # rebuild the 12 group pages only
 *   node scripts/build-world-cup.mjs --seed-data  # ALSO overwrite the JSON seed
 *                                                  # (only for first setup or a draw change;
 *                                                  #  the next Actions run will refresh it)
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

const TEAM_INFO = {
  "Mexico": { players: ["Raul Jimenez", "Hirving Lozano", "Santiago Gimenez"], fact: "Co-host with deep World Cup history and opening-match energy at Estadio Azteca." },
  "South Africa": { players: ["Percy Tau", "Teboho Mokoena", "Ronwen Williams"], fact: "Back on the World Cup stage after becoming the first African host in 2010." },
  "South Korea": { players: ["Son Heung-min", "Kim Min-jae", "Lee Kang-in"], fact: "Fast transitions, elite defensive talent, and recent knockout-round pedigree." },
  "Czechia": { players: ["Patrik Schick", "Tomas Soucek", "Ladislav Krejci"], fact: "Disciplined European side with aerial strength and set-piece danger." },
  "Canada": { players: ["Alphonso Davies", "Jonathan David", "Tajon Buchanan"], fact: "Co-host with pace, direct attacking, and home crowds in Toronto and Vancouver." },
  "Bosnia and Herzegovina": { players: ["Edin Dzeko", "Miralem Pjanic", "Sead Kolasinac"], fact: "Experienced spine and one of Europe's most passionate fan cultures." },
  "Qatar": { players: ["Akram Afif", "Almoez Ali", "Hassan Al-Haydos"], fact: "Asian Cup pedigree and recent tournament-hosting experience." },
  "Switzerland": { players: ["Granit Xhaka", "Manuel Akanji", "Breel Embolo"], fact: "Reliable knockout-stage contender built on structure and experience." },
  "Haiti": { players: ["Duckens Nazon", "Frantzdy Pierrot", "Johny Placide"], fact: "Caribbean qualifier with pace, emotion, and a proud football story." },
  "Scotland": { players: ["Scott McTominay", "Andy Robertson", "John McGinn"], fact: "High-energy midfield and one of football's loudest supporter cultures." },
  "Brazil": { players: ["Vinicius Junior", "Rodrygo", "Alisson"], fact: "Five-time champions with elite attacking depth and global star power." },
  "Morocco": { players: ["Achraf Hakimi", "Sofyan Amrabat", "Yassine Bounou"], fact: "2022 semi-finalists with defensive grit and dangerous wide play." },
  "United States": { players: ["Christian Pulisic", "Weston McKennie", "Tyler Adams"], fact: "Co-host with a young core and major home-field attention." },
  "Paraguay": { players: ["Miguel Almiron", "Julio Enciso", "Gustavo Gomez"], fact: "Traditionally tough South American side with counterattacking bite." },
  "Australia": { players: ["Mathew Ryan", "Jackson Irvine", "Craig Goodwin"], fact: "Physical, organized team with strong tournament resilience." },
  "Turkiye": { players: ["Hakan Calhanoglu", "Arda Guler", "Kenan Yildiz"], fact: "Technical midfield, quick attackers, and a rising generation." },
  "Cote d'Ivoire": { players: ["Sebastien Haller", "Franck Kessie", "Simon Adingra"], fact: "African champions with power, pace, and box presence." },
  "Ecuador": { players: ["Moises Caicedo", "Piero Hincapie", "Enner Valencia"], fact: "Athletic South American team with a strong defensive platform." },
  "Germany": { players: ["Jamal Musiala", "Florian Wirtz", "Joshua Kimmich"], fact: "Four-time champions with elite midfield creativity." },
  "Curacao": { players: ["Leandro Bacuna", "Juninho Bacuna", "Eloy Room"], fact: "Small-island story with Dutch-Caribbean roots and experienced professionals." },
  "Netherlands": { players: ["Virgil van Dijk", "Frenkie de Jong", "Cody Gakpo"], fact: "Historic football nation known for possession, width, and tournament consistency." },
  "Japan": { players: ["Kaoru Mitoma", "Takefusa Kubo", "Wataru Endo"], fact: "Technical, fast, and disciplined; famous for 2022 comeback wins." },
  "Sweden": { players: ["Alexander Isak", "Dejan Kulusevski", "Viktor Gyokeres"], fact: "Powerful European side with dangerous forwards." },
  "Tunisia": { players: ["Wahbi Khazri", "Ellyes Skhiri", "Hannibal Mejbri"], fact: "North African side known for compact defending and committed pressing." },
  "Iran": { players: ["Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh"], fact: "Experienced Asian side with strong forwards and tournament familiarity." },
  "New Zealand": { players: ["Chris Wood", "Liberato Cacace", "Sarpreet Singh"], fact: "Oceania standard-bearer with aerial threat and physical presence." },
  "Belgium": { players: ["Kevin De Bruyne", "Romelu Lukaku", "Jeremy Doku"], fact: "Elite attacking talent and a new generation around established stars." },
  "Egypt": { players: ["Mohamed Salah", "Omar Marmoush", "Mohamed Elneny"], fact: "African giants led by one of world football's most famous forwards." },
  "Saudi Arabia": { players: ["Salem Al-Dawsari", "Firas Al-Buraikan", "Mohammed Al-Owais"], fact: "Produced one of 2022's biggest shocks by beating Argentina." },
  "Uruguay": { players: ["Federico Valverde", "Darwin Nunez", "Ronald Araujo"], fact: "Two-time champions with intensity, history, and elite modern talent." },
  "Spain": { players: ["Pedri", "Lamine Yamal", "Rodri"], fact: "Possession powerhouse with young stars and deep midfield control." },
  "Cape Verde": { players: ["Ryan Mendes", "Bebe", "Vozinha"], fact: "Island nation with a compact squad and growing tournament reputation." },
  "France": { players: ["Kylian Mbappe", "Antoine Griezmann", "Aurelien Tchouameni"], fact: "Recent finalists with speed, depth, and elite knockout experience." },
  "Senegal": { players: ["Sadio Mane", "Kalidou Koulibaly", "Edouard Mendy"], fact: "African champions with pace, leadership, and physical strength." },
  "Iraq": { players: ["Aymen Hussein", "Ali Jasim", "Ibrahim Bayesh"], fact: "Proud Asian side with passionate support and dangerous forwards." },
  "Norway": { players: ["Erling Haaland", "Martin Odegaard", "Alexander Sorloth"], fact: "Headline attacking talent led by Haaland and Odegaard." },
  "Argentina": { players: ["Lionel Messi", "Julian Alvarez", "Emiliano Martinez"], fact: "Defending champions with elite mentality and world-famous leadership." },
  "Algeria": { players: ["Riyad Mahrez", "Ismael Bennacer", "Youcef Belaili"], fact: "North African side with flair, left-footed creativity, and tournament pedigree." },
  "Austria": { players: ["David Alaba", "Marcel Sabitzer", "Christoph Baumgartner"], fact: "Organized European team with strong pressing and versatile midfielders." },
  "Jordan": { players: ["Mousa Al-Taamari", "Yazan Al-Naimat", "Nizar Al-Rashdan"], fact: "Asian Cup finalists with quick counters and rising confidence." },
  "Portugal": { players: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva"], fact: "European powerhouse with generational icons and deep attacking options." },
  "DR Congo": { players: ["Chancel Mbemba", "Yoane Wissa", "Cedric Bakambu"], fact: "Physical, direct side with powerful forwards and strong defensive leaders." },
  "Uzbekistan": { players: ["Eldor Shomurodov", "Abbosbek Fayzullaev", "Oston Urunov"], fact: "Emerging Asian team with technical midfielders and a historic opportunity." },
  "Colombia": { players: ["Luis Diaz", "James Rodriguez", "Davinson Sanchez"], fact: "South American side with flair, speed, and a passionate fan base." },
  "Ghana": { players: ["Mohammed Kudus", "Thomas Partey", "Jordan Ayew"], fact: "Four-time African champions known for athleticism and attacking bursts." },
  "Panama": { players: ["Adalberto Carrasquilla", "Anibal Godoy", "Michael Murillo"], fact: "Central American side with energy, organization, and tournament grit." },
  "England": { players: ["Harry Kane", "Jude Bellingham", "Bukayo Saka"], fact: "Deep squad with major attacking options and high tournament expectations." },
  "Croatia": { players: ["Luka Modric", "Josko Gvardiol", "Mateo Kovacic"], fact: "Recent finalists and semi-finalists with elite midfield control." }
};

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function slug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function groupOf(team) {
  return Object.keys(GROUPS).find(function (g) { return GROUPS[g].indexOf(team) !== -1; }) || "";
}

function flagDataUrl(team) {
  var s = FLAGS[team] || { code: "FC", colors: ["#1f8f77", "#ffffff", "#de6a38"] };
  var sw = 60 / s.colors.length;
  var stripes = s.colors.map(function (c, i) { return '<rect x="' + (i * sw) + '" y="0" width="' + sw + '" height="40" fill="' + c + '"/>'; }).join("");
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">' + stripes + '<text x="30" y="25" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="800" fill="#201713" stroke="#fff" stroke-width="3" paint-order="stroke">' + s.code + '</text></svg>';
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

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
<meta property="og:image" content="https://www.snackpackuniverse.com/world-cup/og-world-cup.png">
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
  font-variant-numeric: tabular-nums;
}
.score-pill--live { background: #c73f3f; }
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
<body class="world-cup-page">
<a class="skip-link" href="#group-table">Skip to group table</a>
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
        <li><a href="/apps/">Apps</a></li>
        <li><a href="/play/">Play</a></li>
        <li><a href="/guides/">Guides</a></li>
        <li><a class="nav-wc" href="/world-cup/"><img class="nav-ball" src="/world-cup/officialball_transparent2-50.png" alt="" width="18" height="18">World Cup</a></li>
        <li><a href="/#pipeline">Roadmap</a></li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
        <li><a class="pill-link" href="mailto:support@snackpackuniverse.com">Support</a></li>
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
        <h2 id="group-table">Group ${letter} Table</h2>
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

<script src="/world-cup/wc-live.js"></script>
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
  function isLive(match) {
    var status = String(match.statusShort || match.time || "").toUpperCase();
    return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "IN PROGRESS"].indexOf(status) !== -1;
  }
  function matchHtml(match) {
    // Live matches carry their running score in lhs/las (separate from the final
    // hs/as so standings ignore it). Show the score if present, else "Live".
    var live = isLive(match);
    var score = typeof match.hs === "number" ? match.hs + "-" + match.as
      : live ? (typeof match.lhs === "number" ? match.lhs + "-" + match.las : "Live")
      : "Next";
    var pillClass = "score-pill" + (live ? " score-pill--live" : "");
    return '<div class="match-row"><div class="match-date">' + escapeHtml(match.date || "") + '<br>' + escapeHtml(match.time || "") + '</div><div><div class="match-teams">' + teamHtml(match.home) + teamHtml(match.away) + '</div><div class="match-meta">' + escapeHtml(match.venue || "") + '</div></div><span class="' + pillClass + '">' + escapeHtml(score) + '</span></div>';
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
  var pollTimer = null;
  function todayIso() {
    var n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
  }
  // Keep refreshing only while a match is live, or one is scheduled today and not
  // yet final. Otherwise stop polling and sit idle.
  function scheduleNext() {
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
    var today = todayIso();
    var live = matches.some(isLive);
    var pendingToday = matches.some(function (m) { return String(m.isoDate || "") === today && typeof m.hs !== "number"; });
    if (!live && !pendingToday) return;
    pollTimer = setTimeout(load, live ? 60000 : 120000);
  }
  // Overlay live scores straight from ESPN (only while a match is on).
  function withLive(data) {
    if (!data || !Array.isArray(data.matches)) return Promise.resolve(data);
    if (window.WCLive && WCLive.worthLive(data.matches)) {
      return WCLive.overlay(data.matches).then(function (merged) { data.matches = merged; return data; });
    }
    return Promise.resolve(data);
  }
  function load() {
    fetch("../../data/world-cup-2026.json", { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("World Cup data unavailable");
        return response.json();
      })
      .then(withLive)
      .then(applyData)
      .catch(function () {
        document.getElementById("updated-note").textContent = "Using built-in Group ${letter} fallback data.";
      })
      .then(function () { render(); scheduleNext(); });
  }
  load();
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

function teamFixtures(team) {
  return SCHEDULE.filter(function (r) { return r[2] === team || r[3] === team; })
    .map(function (r) {
      var home = r[2], away = r[3];
      var obj = { iso: r[1], date: shortDate(r[1]), home: home, away: away, venue: r[4] };
      if (typeof r[5] === "number") { obj.hs = r[5]; obj.as = r[6]; }
      return obj;
    })
    .sort(function (a, b) { return a.iso.localeCompare(b.iso); });
}

function teamPage(team) {
  var g = groupOf(team);
  var info = TEAM_INFO[team] || { players: [], fact: "" };
  var fixtures = teamFixtures(team);
  var oppFlags = {};
  (GROUPS[g] || []).forEach(function (t) { oppFlags[t] = flagDataUrl(t); });
  var players = info.players.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join("");

  function rowHtml(m) {
    var isHome = m.home === team;
    var opp = isHome ? m.away : m.home;
    var played = typeof m.hs === "number";
    var pill, cls = "";
    if (played) {
      var ours = isHome ? m.hs : m.as;
      var theirs = isHome ? m.as : m.hs;
      pill = ours + "-" + theirs;
      cls = ours > theirs ? " team-result--w" : ours < theirs ? " team-result--l" : " team-result--d";
    } else {
      pill = "Next";
      cls = " team-result--next";
    }
    return '<div class="team-fixture"><div class="tf-date">' + escapeHtml(m.date) + '</div>' +
      '<div class="tf-mid"><div class="tf-opp">' + escapeHtml(isHome ? "vs" : "at") + ' <img class="tf-flag" src="' + flagDataUrl(opp) + '" alt=""> ' + escapeHtml(opp) + '</div>' +
      '<div class="tf-venue">' + escapeHtml(m.venue || "") + '</div></div>' +
      '<span class="team-result' + cls + '">' + escapeHtml(pill) + '</span></div>';
  }

  var fixturesHtml = fixtures.map(rowHtml).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(team)} at the World Cup 2026: Group ${g}, Fixtures & Players | SnackPack</title>
<meta name="description" content="${escapeHtml(team)} at the 2026 World Cup: Group ${g}, full fixture list with dates and venues, players to know, and a quick team guide.">
<link rel="canonical" href="https://www.snackpackuniverse.com/world-cup/team/${slug(team)}/">
<meta name="theme-color" content="#1f8f77">
<link rel="icon" type="image/png" href="../../../snackpack-favicon-transparent.png">
<link rel="apple-touch-icon" href="../../../snackpack-favicon-transparent.png">
<meta property="og:title" content="${escapeHtml(team)} at the World Cup 2026">
<meta property="og:description" content="Group ${g} fixtures, players to know, and a quick guide to ${escapeHtml(team)} at the 2026 World Cup.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://www.snackpackuniverse.com/world-cup/team/${slug(team)}/">
<meta property="og:image" content="https://www.snackpackuniverse.com/world-cup/og-world-cup.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../../site.css">
<link rel="stylesheet" href="../../../play/play.css">
<style>
.team-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 22px;
  align-items: center;
  background:
    linear-gradient(145deg, rgba(8, 82, 73, 0.9), rgba(31, 143, 119, 0.78)),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 38px, rgba(255,255,255,0.02) 38px 76px);
  color: #fff;
}
.team-hero p, .team-hero .lead { color: rgba(255,255,255,0.88); }
.team-hero .eyebrow { color: #fff; background: rgba(255,255,255,0.14); }
.team-hero .btn-secondary { color: var(--ink); }
.team-hero-flag {
  width: 132px;
  height: 88px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.4);
  box-shadow: 0 18px 36px rgba(0,0,0,0.3);
}
.team-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
.team-panel, .team-side {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  box-shadow: var(--shadow);
  padding: 20px;
}
.team-side { position: sticky; top: 94px; }
.team-panel h2, .team-side h2 { margin: 0 0 12px; font-family: var(--serif); font-size: 1.4rem; }
.player-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 8px; padding: 0; list-style: none; }
.player-list li {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255,255,255,0.7);
  font-weight: 700;
  font-size: 0.92rem;
}
.team-fixtures { display: grid; gap: 10px; margin-top: 4px; }
.team-next-card {
  display: grid;
  gap: 6px;
  margin: 0 0 14px;
  padding: 14px;
  border: 1px solid rgba(31,143,119,0.24);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(31,143,119,0.12), rgba(239,181,77,0.12)),
    #fffdf8;
}
.team-next-card span {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.team-next-card strong {
  font-family: var(--serif);
  font-size: 1.18rem;
}
.team-next-card small {
  color: var(--muted);
  font-weight: 800;
  line-height: 1.45;
}
.team-fixture {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255,255,255,0.76);
}
.tf-date { color: var(--muted); font-size: 0.8rem; font-weight: 900; text-transform: uppercase; }
.tf-opp { font-weight: 800; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tf-flag { width: 22px; height: 16px; border-radius: 3px; border: 1px solid rgba(32,23,19,0.16); object-fit: cover; }
.tf-venue { color: var(--muted); font-size: 0.84rem; font-weight: 600; margin-top: 2px; }
.team-result {
  min-width: 56px; text-align: center; padding: 7px 9px; border-radius: 999px;
  background: var(--ink); color: #fff; font-weight: 900; font-variant-numeric: tabular-nums;
}
.team-result--w { background: var(--accent); }
.team-result--l { background: var(--brand-deep); }
.team-result--d { background: #6a5b52; }
.team-result--next { background: #1f8f77; }
.team-result--live { background: #c73f3f; }
.team-links { display: grid; gap: 9px; }
.team-links a {
  border: 1px solid var(--line); border-radius: 999px; color: var(--ink);
  font-weight: 800; padding: 10px 12px; text-decoration: none; background: rgba(255,255,255,0.74);
}
.team-links a:hover { border-color: var(--accent); color: var(--accent); }
.team-games-strip {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.team-game-link {
  position: relative;
  overflow: hidden;
  min-height: 112px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(226,243,239,0.82));
  color: var(--ink);
  text-decoration: none;
  box-shadow: 0 12px 26px rgba(32,23,19,0.08);
}
.team-game-link::after {
  content: "";
  position: absolute;
  right: -22px;
  bottom: -24px;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: rgba(31,143,119,0.12);
}
.team-game-link img {
  width: 42px;
  height: 42px;
  margin-bottom: 8px;
  border-radius: 10px;
  object-fit: cover;
}
.team-game-link strong {
  display: block;
  font-family: var(--serif);
  font-size: 1rem;
  line-height: 1.1;
}
.team-game-link span {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 800;
}
.team-game-link:hover,
.team-game-link:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
  outline: none;
}
.team-favorite-button[aria-pressed="true"] {
  background: var(--gold);
  border-color: rgba(151,103,22,0.36);
  color: #3a2507;
}
@media (max-width: 900px) {
  .team-hero { grid-template-columns: 1fr; }
  .team-layout { grid-template-columns: 1fr; }
  .team-side { position: static; }
  .team-games-strip { grid-template-columns: 1fr; }
}
@media (max-width: 560px) { .team-fixture { grid-template-columns: 1fr; } .team-result { width: fit-content; } }
</style>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  "name": ${JSON.stringify(team)},
  "sport": "Association football",
  "url": "https://www.snackpackuniverse.com/world-cup/team/${slug(team)}/",
  "memberOf": {
    "@type": "SportsEvent",
    "name": "FIFA World Cup 2026",
    "startDate": "2026-06-11",
    "endDate": "2026-07-19",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "url": "https://www.snackpackuniverse.com/world-cup/",
    "image": "https://www.snackpackuniverse.com/world-cup/og-world-cup.png",
    "location": {
      "@type": "Place",
      "name": "United States, Canada and Mexico",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "FIFA",
      "url": "https://www.fifa.com/"
    },
    "performer": {
      "@type": "SportsTeam",
      "name": ${JSON.stringify(team)}
    }
  }
}
</script>
</head>
<body class="world-cup-page">
<a class="skip-link" href="#team-fixtures">Skip to fixtures</a>
<header class="topbar">
  <div class="shell topbar-inner">
    <a class="brand" href="../../../">
      <img class="brand-mark" src="../../../snackpack-favicon-transparent.png" alt="SnackPack Studios icon">
      <span class="brand-copy">
        <span class="brand-title">SnackPack Studios</span>
        <span class="brand-subtitle">${escapeHtml(team)}</span>
      </span>
    </a>
    <nav aria-label="Primary">
      <ul class="nav-links">
        <li><a href="/apps/">Apps</a></li>
        <li><a href="/play/">Play</a></li>
        <li><a href="/guides/">Guides</a></li>
        <li><a class="nav-wc" href="/world-cup/"><img class="nav-ball" src="/world-cup/officialball_transparent2-50.png" alt="" width="18" height="18">World Cup</a></li>
        <li><a href="/#pipeline">Roadmap</a></li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
        <li><a class="pill-link" href="mailto:support@snackpackuniverse.com">Support</a></li>
      </ul>
    </nav>
  </div>
</header>

<main>
  <section class="page-hero">
    <div class="shell">
      <div class="page-hero-card team-hero">
        <div>
          <span class="eyebrow">World Cup 2026 &middot; Group ${g}</span>
          <h1>${escapeHtml(team)} at the World Cup 2026</h1>
          <p class="lead" style="max-width:680px;">${escapeHtml(info.fact)}</p>
          <div class="stack-inline">
            <a class="btn btn-primary" href="../../group-${g.toLowerCase()}/">Group ${g} table</a>
            <a class="btn btn-secondary" href="../../schedule/">Full schedule</a>
            <button class="btn btn-secondary team-favorite-button" id="team-favorite-button" type="button" aria-pressed="false">Set favorite team</button>
          </div>
        </div>
        <img class="team-hero-flag" src="${flagDataUrl(team)}" alt="${escapeHtml(team)} flag">
      </div>
    </div>
  </section>

  <section>
    <div class="shell team-layout">
      <article class="team-panel">
        <h2>${escapeHtml(team)} group fixtures</h2>
        <div class="team-next-card" id="team-next-card" aria-live="polite">
          <span>Next match</span>
          <strong>Loading ${escapeHtml(team)} fixtures...</strong>
          <small>Live data will update this card when the schedule file loads.</small>
        </div>
        <div class="team-fixtures" id="team-fixtures">${fixturesHtml}</div>
        <h2 style="margin-top:22px;">Players to know</h2>
        <ul class="player-list">${players}</ul>
        <p class="tf-venue" id="updated-note" style="margin-top:6px;">Group ${g} of the 2026 World Cup. Results update from the live data file.</p>
      </article>
      <aside class="team-side">
        <h2>More World Cup</h2>
        <div class="team-links">
          <a href="../../group-${g.toLowerCase()}/">Group ${g} table &amp; results</a>
          <a href="../../bracket/">Full bracket tracker</a>
          <a href="../../schedule/">Schedule &amp; fixtures</a>
          <a href="../../teams/">All 48 teams</a>
          <a href="../../../play/soccer-trivia-sprint/">Soccer Trivia Sprint</a>
        </div>
        <div class="team-games-strip" aria-label="World Cup games">
          <a class="team-game-link" href="../../../play/soccer-trivia-sprint/">
            <img src="../../../play/tiles/soccer-trivia-sprint.png" alt="" aria-hidden="true" loading="lazy" width="42" height="42">
            <strong>Soccer Trivia Sprint</strong>
            <span>Quiz the tournament</span>
          </a>
          <a class="team-game-link" href="../../../play/penalty-shootout/">
            <img src="../../../play/tiles/penalty-shootout.png" alt="" aria-hidden="true" loading="lazy" width="42" height="42">
            <strong>Penalty Shootout</strong>
            <span>Best-of-five duel</span>
          </a>
          <a class="team-game-link" href="../../../play/free-kick-curl/">
            <img src="../../../play/tiles/free-kick-curl.png" alt="" aria-hidden="true" loading="lazy" width="42" height="42">
            <strong>Free Kick Curl</strong>
            <span>Bend one top corner</span>
          </a>
        </div>
      </aside>
    </div>
  </section>

  <section>
    <div class="shell seo-prose">
      <h2>${escapeHtml(team)} World Cup 2026 guide</h2>
      <p>${escapeHtml(team)} is in Group ${g} at the 2026 World Cup, co-hosted by the United States, Canada, and Mexico. This page lists ${escapeHtml(team)}'s group-stage fixtures with dates and host cities, plus players to know. Results update automatically as the tournament is played.</p>
      <p>For the live group table, see the <a class="text-link" href="../../group-${g.toLowerCase()}/" style="color:var(--accent);font-weight:700;">Group ${g} page</a>. For the full tournament, open the <a class="text-link" href="../../bracket/" style="color:var(--accent);font-weight:700;">bracket tracker</a> or the <a class="text-link" href="../../schedule/" style="color:var(--accent);font-weight:700;">schedule</a>.</p>
      <p style="font-size:0.85rem;color:var(--muted);">Original SnackPack Studios guide. Not affiliated with, endorsed by, or connected to FIFA, the World Cup, any national team, league, or governing body. Player lists are a fan guide and final squads can change.</p>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="shell foot-support">
    <a class="donate-badge" href="https://buy.stripe.com/14A00k7Gi4TF3wl6AL0VO04" target="_blank" rel="noopener" aria-label="Tip or donate to support SnackPack Studios" title="Tip or donate to support SnackPack">
      <img src="../../../assets/donate2-50.png" alt="SnackPack - Tip or Donate - Support Us" width="104" height="81" loading="lazy">
    </a>
    <span class="foot-support-copy"><strong>Enjoying SnackPack?</strong><span>We're a small studio. Tips and donations help us keep building calm, ad-free games.</span></span>
  </div>
  <div class="shell foot-wrap">
    <p class="foot-note">${escapeHtml(team)} &mdash; World Cup 2026 guide from SnackPack Studios.</p>
    <div class="footer-links">
      <a class="text-link" href="../../">World Cup</a>
      <a class="text-link" href="../../../play/">Arcade</a>
      <a class="text-link" href="../../../privacy/">Privacy</a>
    </div>
  </div>
</footer>

<script src="/world-cup/wc-live.js"></script>
<script>
(function () {
  "use strict";
  var TEAM = ${JSON.stringify(team)};
  var FLAGS = ${JSON.stringify(oppFlags)};
  var FAVORITE_KEY = "snackpack_world_cup_favorite_team";
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function flag(team) { return FLAGS[team] || ""; }
  function isFavorite() {
    try { return localStorage.getItem(FAVORITE_KEY) === TEAM; } catch (error) { return false; }
  }
  function updateFavoriteButton() {
    var button = document.getElementById("team-favorite-button");
    if (!button) return;
    var favorite = isFavorite();
    button.setAttribute("aria-pressed", String(favorite));
    button.textContent = favorite ? "Favorite team" : "Set favorite team";
  }
  function setupFavoriteButton() {
    var button = document.getElementById("team-favorite-button");
    if (!button || button.dataset.ready === "true") return;
    button.dataset.ready = "true";
    button.addEventListener("click", function () {
      try {
        if (isFavorite()) localStorage.removeItem(FAVORITE_KEY);
        else localStorage.setItem(FAVORITE_KEY, TEAM);
      } catch (error) {}
      updateFavoriteButton();
    });
    updateFavoriteButton();
  }
  function isLive(m) {
    var status = String(m.statusShort || m.time || "").toUpperCase();
    return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "IN PROGRESS"].indexOf(status) !== -1;
  }
  function rowHtml(m) {
    var isHome = m.home === TEAM;
    var opp = isHome ? m.away : m.home;
    var played = typeof m.hs === "number";
    var pill, cls = "";
    if (played) {
      var ours = isHome ? m.hs : m.as, theirs = isHome ? m.as : m.hs;
      pill = ours + "-" + theirs;
      cls = ours > theirs ? " team-result--w" : ours < theirs ? " team-result--l" : " team-result--d";
    } else if (isLive(m)) {
      // Live score lives in lhs/las (separate from final hs/as). Show it if present.
      var lours = isHome ? m.lhs : m.las, ltheirs = isHome ? m.las : m.lhs;
      pill = typeof lours === "number" ? lours + "-" + ltheirs : "Live";
      cls = " team-result--live";
    } else { pill = "Next"; cls = " team-result--next"; }
    var fl = flag(opp) ? '<img class="tf-flag" src="' + flag(opp) + '" alt=""> ' : "";
    return '<div class="team-fixture"><div class="tf-date">' + esc(m.date || "") + '</div>' +
      '<div class="tf-mid"><div class="tf-opp">' + (isHome ? "vs" : "at") + ' ' + fl + esc(opp) + '</div>' +
      '<div class="tf-venue">' + esc(m.venue || "") + '</div></div>' +
      '<span class="team-result' + cls + '">' + esc(pill) + '</span></div>';
  }
  function renderNextCard(mine) {
    var root = document.getElementById("team-next-card");
    if (!root) return;
    var today = todayIso();
    var next = mine.filter(function (m) { return isLive(m) || (typeof m.hs !== "number" && String(m.isoDate || m.iso || "") >= today); })[0];
    if (!next) {
      root.innerHTML = '<span>Fixture status</span><strong>Group fixtures complete</strong><small>Open the knockout bracket to follow any remaining tournament path.</small>';
      return;
    }
    var isHome = next.home === TEAM;
    var opp = isHome ? next.away : next.home;
    var venue = next.venue ? " at " + next.venue : "";
    var score = isLive(next) ? "Live now" : (next.date || "Date TBD");
    root.innerHTML = '<span>Next match</span><strong>' + esc((isHome ? "vs " : "at ") + opp) + '</strong><small>' + esc(score + venue) + '</small>';
  }
  var pollTimer = null;
  function todayIso() {
    var n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
  }
  // Keep refreshing only while this team has a live match, or one scheduled today
  // and not yet final. Otherwise stop polling and sit idle.
  function scheduleNext(mine) {
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
    var today = todayIso();
    var live = mine.some(isLive);
    var pendingToday = mine.some(function (m) { return String(m.iso || m.isoDate || "") === today && typeof m.hs !== "number"; });
    if (!live && !pendingToday) return;
    pollTimer = setTimeout(load, live ? 60000 : 120000);
  }
  // Overlay live scores straight from ESPN (only while a match is on).
  function withLive(data) {
    if (!data || !Array.isArray(data.matches)) return Promise.resolve(data);
    if (window.WCLive && WCLive.worthLive(data.matches)) {
      return WCLive.overlay(data.matches).then(function (merged) { data.matches = merged; return data; });
    }
    return Promise.resolve(data);
  }
  function load() {
    fetch("../../../data/world-cup-2026.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("no data"); return r.json(); })
      .then(withLive)
      .then(function (data) {
        if (!data || !Array.isArray(data.matches)) return;
        var mine = data.matches.filter(function (m) { return m.home === TEAM || m.away === TEAM; })
          .sort(function (a, b) { return String(a.isoDate || a.date).localeCompare(String(b.isoDate || b.date)); });
        renderNextCard(mine);
        if (mine.length) document.getElementById("team-fixtures").innerHTML = mine.map(rowHtml).join("");
        if (data.updatedAt) {
          document.getElementById("updated-note").textContent = "Group ${g} of the 2026 World Cup. Results last updated " + new Date(data.updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + ".";
        }
        scheduleNext(mine);
      })
      .catch(function () {});
  }
  setupFavoriteButton();
  renderNextCard(${JSON.stringify(fixtures)});
  load();
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
  const seedData = process.argv.includes("--seed-data");

  if (seedData) {
    const data = {
      updatedAt: new Date().toISOString(),
      source: "Official 2026 World Cup match schedule (verified)",
      groups: GROUPS,
      matches: buildMatches()
    };
    await fs.writeFile(path.join(root, "data/world-cup-2026.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`--seed-data: overwrote data/world-cup-2026.json with ${data.matches.length} matches.`);
    console.log("   Note: GitHub Actions will refresh this file with live scores on its next run.");
  } else {
    console.log("Left data/world-cup-2026.json untouched (it is updated automatically by GitHub Actions).");
  }

  for (const letter of Object.keys(GROUPS)) {
    const dir = path.join(root, "world-cup", `group-${letter.toLowerCase()}`);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), groupPage(letter), "utf8");
  }
  console.log(`Wrote ${Object.keys(GROUPS).length} group pages (world-cup/group-a … group-l).`);

  const allTeams = Object.keys(GROUPS).reduce((acc, g) => acc.concat(GROUPS[g]), []);
  for (const team of allTeams) {
    const dir = path.join(root, "world-cup", "team", slug(team));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), teamPage(team), "utf8");
  }
  console.log(`Wrote ${allTeams.length} team pages (world-cup/team/<team>/).`);
}

main().catch((error) => { console.error(error); process.exit(1); });
