#!/usr/bin/env node
// read-site-events.mjs — summarise the anonymous GoatCounter counts sent by
// play/game-events.js and read/read-events.js (see /privacy/arcade/).
//
//   node scripts/read-site-events.mjs [--from 2026-11-06] [--to 2026-11-26] [--json]
//
// Token: GOATCOUNTER_TOKEN, else the "### read access" key in
// ~/billing/goatcounter.txt. Read-only is enough. The site's day boundaries are
// Australia/Sydney (GoatCounter site setting).
//
// Prints, per game: starts, wins, wins per visit (a start is counted once per
// page visit and a player can win several games in one, so this is not a win
// rate; Asteroid Destroyer "wins" are new bests), dailies, friend tables and
// play-time bands, with Honduras counts for starts, dailies and bands.
// Books show starts, finishes and finish rate worldwide and in Honduras,
// plus read-to-me and PDF. Hub clicks are grouped by tile and position.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const today = new Date().toISOString().slice(0, 10);
const FROM = arg("--from", "2026-11-06");
const TO = arg("--to", today);
const JSON_OUT = args.includes("--json");
const SITE = "https://snackpack.goatcounter.com/api/v0";

function token() {
  if (process.env.GOATCOUNTER_TOKEN) return process.env.GOATCOUNTER_TOKEN.trim();
  const file = path.join(os.homedir(), "billing", "goatcounter.txt");
  const text = fs.readFileSync(file, "utf8");
  const section = text.split(/^### /m).find((s) => /^read access/i.test(s));
  const m = section && /^key:\s*(\S+)/m.exec(section);
  if (!m) throw new Error("No read-access key in " + file + " and no GOATCOUNTER_TOKEN");
  return m[1];
}
const TOKEN = token();

async function api(endpoint, params = {}) {
  const url = new URL(SITE + "/" + endpoint);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" } });
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 1500 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(endpoint + " → HTTP " + r.status);
    return r.json();
  }
  throw new Error(endpoint + " → rate limited");
}

async function allHits() {
  const hits = [];
  let exclude = [];
  for (;;) {
    const page = await api("stats/hits", { start: FROM, end: TO, limit: 100, ...(exclude.length ? { exclude_paths: exclude.join(",") } : {}) });
    hits.push(...page.hits);
    if (!page.more || !page.hits.length) break;
    exclude = hits.map((h) => h.path_id);
  }
  return hits.filter((h) => h.event);
}

async function honduras(pathId) {
  const r = await api("stats/locations", { start: FROM, end: TO, limit: 50, include_paths: pathId });
  const total = r.stats.reduce((n, s) => n + s.count, 0);
  const hn = (r.stats.find((s) => s.id === "HN") || { count: 0 }).count;
  return { total, hn };
}

const hits = await allHits();
const games = {}, books = {}, hub = {}, hubPosition = {};
const BANDS = ["under-1m", "1-5m", "5-15m", "15m-plus"];
const gamePaths = {};
const bookPaths = {};
for (const h of hits) {
  const p = h.path.replace(/^\//, "").split("/");
  if (p[0] === "arcade" && p[1] === "hub") hub[p[2]] = (hub[p[2]] || 0) + h.count;
  else if (p[0] === "arcade" && p[1] === "hub-position") hubPosition[p[2]] = (hubPosition[p[2]] || 0) + h.count;
  else if (p[0] === "arcade" && p.length === 3) {
    const g = (games[p[1]] ||= { start: 0, win: 0, daily: 0, friends: 0, bands: {} });
    if (p[2].startsWith("time-")) g.bands[p[2].slice(5)] = h.count;
    else g[p[2]] = h.count;
    (gamePaths[p[1]] ||= {})[p[2]] = h.path_id;
  } else if (p[0] === "books" && p.length === 3) {
    const b = (books[p[1]] ||= { start: 0, finish: 0, listen: 0, pdf: 0 });
    b[p[2]] = h.count;
    (bookPaths[p[1]] ||= {})[p[2]] = h.path_id;
  }
}
for (const [slug, g] of Object.entries(games)) {
  const paths = gamePaths[slug];
  if (paths.start) g.where = await honduras(paths.start);
  if (paths.daily) g.dailyWhere = await honduras(paths.daily);
  g.bandWhere = {};
  for (const band of BANDS) {
    if (paths["time-" + band]) g.bandWhere[band] = await honduras(paths["time-" + band]);
  }
}
for (const [slug, b] of Object.entries(books)) {
  const paths = bookPaths[slug];
  if (paths.start) b.where = await honduras(paths.start);
  if (paths.finish) b.finishWhere = await honduras(paths.finish);
}

if (JSON_OUT) { console.log(JSON.stringify({ from: FROM, to: TO, games, books, hub, hubPosition }, null, 2)); process.exit(0); }

const pct = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "–");
console.log(`GoatCounter events ${FROM} → ${TO} (time bands, daily, hub and books only exist from 2026-11-26)\n`);
console.log("GAME".padEnd(24) + "start  win win/vis daily friends  HN start   HN%  HN daily  time bands (all | HN)");
console.log("Time bands: " + BANDS.join(" / "));
for (const [slug, g] of Object.entries(games).sort((a, b) => b[1].start - a[1].start)) {
  console.log(slug.padEnd(24) + String(g.start).padStart(5) + String(g.win).padStart(5) + pct(g.win, g.start).padStart(6) +
    String(g.daily).padStart(6) + String(g.friends).padStart(8) +
    String(g.where?.hn ?? 0).padStart(10) + pct(g.where?.hn ?? 0, g.where?.total).padStart(6) +
    String(g.dailyWhere?.hn ?? 0).padStart(10) + "  " +
    BANDS.map((k) => g.bands[k] || 0).join(" / ") + " | " +
    BANDS.map((k) => g.bandWhere[k]?.hn ?? 0).join(" / "));
}
if (Object.keys(books).length) {
  console.log("\nBOOK".padEnd(41) + "start finish  fin%  listen  pdf  HN start   HN%  HN finish  HN fin%");
  let hnStarts = 0;
  let hnFinishes = 0;
  for (const [slug, b] of Object.entries(books).sort((a, c) => c[1].start - a[1].start)) {
    const starts = b.where?.hn ?? 0;
    const finishes = b.finishWhere?.hn ?? 0;
    hnStarts += starts;
    hnFinishes += finishes;
    console.log(slug.slice(0, 39).padEnd(40) + String(b.start).padStart(5) + String(b.finish).padStart(7) + pct(b.finish, b.start).padStart(6) +
      String(b.listen).padStart(8) + String(b.pdf).padStart(5) +
      String(starts).padStart(10) + pct(starts, b.where?.total).padStart(6) +
      String(finishes).padStart(11) + pct(finishes, starts).padStart(9));
  }
  console.log(`Honduras books: ${hnFinishes} finishes / ${hnStarts} starts (${pct(hnFinishes, hnStarts)})`);
}
if (Object.keys(hub).length) {
  console.log("\nHUB TILES: " + Object.entries(hub).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join(", "));
  console.log("HUB POSITION: " + Object.entries(hubPosition).map(([k, v]) => k + " " + v).join(", "));
}
