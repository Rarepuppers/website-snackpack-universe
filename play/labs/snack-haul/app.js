import { WINTER_PAINTS, WINTER_TOPPERS, migrateWinterSave, seasonProgress, seasonStars, canStartWinter, winterGoals, finishWinter } from "./winter.mjs";
// Snack Haul app shell: saves, menus, audio, the driving loop and progression.
import { World3D } from "./render3d.js";
import { Assets, loadAssets, soundData, has, url, hasModel } from "./assets.js";

const SH = window.SnackHaul;
const KEY = "sp_snackhaul_v1";
const $ = (id) => document.getElementById(id);
const ui = $("ui"), veil = $("veil"), sheet = $("sheet"), driveEl = $("drive"), canvas = $("view");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ════ Save ════════════════════════════════════════════════════════
// ════ The Android app: the game runs in a WebView there ════════════
// The app keeps its own copy of the save, outside the WebView, and passes it in
// as SNACKHAUL_NATIVE_SAVE before the page loads. On the website none of this exists.
const nativeApp = typeof window !== "undefined" && window.ReactNativeWebView ? window.ReactNativeWebView : null;
function tellApp(msg) { if (nativeApp) { try { nativeApp.postMessage(JSON.stringify(msg)); } catch (e) { /* the game carries on */ } } }

// The newer of the WebView's copy and the app's copy wins.
function load() {
  let local = null, kept = null;
  try { local = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* no local save */ }
  try { kept = window.SNACKHAUL_NATIVE_SAVE ? JSON.parse(window.SNACKHAUL_NATIVE_SAVE) : null; } catch (e) { /* no app save */ }
  if (kept && (!local || (kept.savedAt || 0) > (local.savedAt || 0))) return kept;
  return local || {};
}
const DEFAULTS = { driver: "corgi", topper: "", coins: 0, stars: {}, best: {}, express: {}, upgrades: {}, trucks: ["pickup"], truck: "pickup", achieved: {}, daily: { last: "", streak: 0 }, tutorial: 0, sound: true, quality: "auto", shake: true, days: [], medal: {}, ghost: {}, long: {}, jobs: { date: "", got: {}, paid: {} }, gifts: {}, challenge: {}, ghostOn: true, music: true, haptics: true, pro: false, v: 1, rival: {}, ghostWins: {}, crumb: {}, orders: {}, parts: 0, mastery: {}, paint: {}, extras: [], longBest: {}, longMile: {}, cup: { week: "", top: 0, best: {}, paid: {} }, week: { key: "", got: 0, paid: false } };
const save = Object.assign({}, DEFAULTS, load());
migrateWinterSave(save);
// 1.0.2 rebuilt the first roads. Stars, medals and challenges stay; best times,
// ghosts and Weekly Cup times from the old roads would not compare, so they go.
function migrateRoads() {
  const roads = SH.ROADS, rev = (id) => (roads[id] && roads[id].rev) || 1;
  if ((save.roads || 0) >= 2) return;
  Object.keys(roads).forEach((id) => {
    if (save.ghost[id] && (save.ghost[id].rev || 1) !== rev(id)) delete save.ghost[id];
    delete save.best[id];
    if (save.cup && save.cup.best) delete save.cup.best[id];
  });
  // Anyone who already earned stars on Bakery Hills 3 got the straps gift.
  if (save.stars["bakery-3"] || save.stars["bakery-4"]) save.gifts.straps = true;
  save.roads = 2;
}
migrateRoads();
save.stats = Object.assign({ deliveries: 0, crates: 0, eggs: 0, metres: 0, earned: 0, failed: 0, bestAir: 0, topSpeed: 0, melons: 0, cakes: 0, popcorn: 0, coldIcecream: 0, bridges: 0, landings: 0, longBest: 0, longMetres: 0, contracts: 0, tuktukAway: 0 }, save.stats);
function persist() {
  save.savedAt = Date.now();
  const json = JSON.stringify(save);
  try { localStorage.setItem(KEY, json); } catch (e) { /* plays on without storage */ }
  tellApp({ type: "save", data: json });
}
function buzz(kind) { if (save.haptics) tellApp({ type: "haptic", kind }); }
// Vibration in the app: losses and hard hits, never coins (too often).
const BUZZ = { lost: "warning", broken: "warning", ruined: "warning", dock: "heavy", pickup: "light" };
function buzzFor(ev) { if (BUZZ[ev.type]) buzz(BUZZ[ev.type]); else if (ev.type === "land" && ev.air > 0.6) buzz("medium"); }

function localDate(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// The Monday that starts this week, as a local date.
const params = new URLSearchParams(location.search);
const previewDate = params.get("date");
function eventDate() {
  if ((!nativeApp || window.SNACKHAUL_DEBUG) && /^\d{4}-\d{2}-\d{2}$/.test(previewDate || "")) {
    const value = new Date(previewDate + "T12:00:00");
    if (localDate(value) === previewDate) return value;
  }
  return new Date();
}
const currentEvent = () => SH.activeEvent(eventDate());
const decemberDressing = () => eventDate().getMonth() === 11;
const sleighOwned = () => save.trucks.includes("sleigh");
const drivingTruck = () => save.truck === "sleigh" && (!sleighOwned() || !currentEvent()) ? "pickup" : save.truck;
const menuMusic = () => decemberDressing() ? "music_winter_menu" : "music_menu";
function weekKey() { const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return localDate(d); }
const level = (id) => save.upgrades[id] || 0;
const totalStars = () => Object.values(save.stars).reduce((n, v) => n + v, 0);
// ════ The full-game unlock (Android app only) ═══════════════════════
// The unlisted web labs page stays fully free. In the app, Bakery Hills, the daily,
// the Weekly Cup, the Pickup and the Tuk-Tuk are free; one purchase opens the rest.
const FREE_TRUCKS = ["pickup", "tuktuk"];
// The website demo has the same free set as the app, with a link to Google Play in
// place of the purchase. ?full=1 (unlisted) and saves that already went further keep everything.
const fullWeb = !nativeApp && (params.get("full") === "1" || SH.DELIVERIES.some((d) => !SH.isFree(d.id) && save.stars[d.id]) || save.webFull);
if (fullWeb && !nativeApp) save.webFull = true;
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.snackhaul&referrer=utm_source%3Dwebsite%26utm_medium%3Dweb-demo%26utm_campaign%3Dsnack-haul";
const paywalled = () => !fullWeb && !save.pro;
// All of Bakery Hills is free (routes, Special Orders, Long Haul); elsewhere only the free routes.
const routePaid = (d) => paywalled() && d.region > 0 && !d.daily && !d.winter && !SH.isFree(d.id);
// A region is paid when none of its roads are free.
const regionPaid = (r) => r > 0 && paywalled() && !SH.DELIVERIES.some((d) => d.region === r && SH.isFree(d.id));
const truckPaid = (id) => paywalled() && id!=="sleigh" && !FREE_TRUCKS.includes(id);
const billing = { ready: false, price: "", busy: false, note: "" };
const regionReached = (r) => SH.isOpen(SH.DELIVERIES.find((d) => d.region === r).id, save.stars);
const regionOpen = (r) => !regionPaid(r) && regionReached(r);
// Regions open in full, for orders, Long Haul and goals (a free taste does not count).
const regionFull = (r) => regionOpen(r) && !(r > 0 && paywalled());
const maxRegion = () => { let m = 0; SH.REGIONS.forEach((_, r) => { if (regionOpen(r)) m = r; }); return m; };
function nextRoute() {
  const open = SH.DELIVERIES.filter((d) => !routePaid(d) && regionOpen(d.region) && SH.isOpen(d.id, save.stars));
  return open.find((d) => !save.stars[d.id]) || open.find((d) => save.stars[d.id] < 3) || open[open.length - 1];
}
const railFor = (truckId) => 0.2 + 0.14 * level("straps") + SH.truckSpec(truckId).rail;

// ════ Goals ═══════════════════════════════════════════════════════
const GOALS = [
  { id: "first", icon: "📦", name: "First Drop", desc: "Finish your first delivery.", coins: 20, test: () => save.stats.deliveries >= 1 },
  { id: "intact", icon: "⭐", name: "Not a Scratch", desc: "Deliver a whole load intact.", coins: 25, test: (r) => r && r.stars === 3 },
  { id: "express", icon: "⏱️", name: "Express Post", desc: "Win a gold medal.", coins: 40, test: (r) => r && r.express },
  { id: "air", icon: "🦅", name: "Hang Time", desc: "Stay in the air for 1.5 seconds.", coins: 30, test: () => save.stats.bestAir >= 1.5 },
  { id: "eggs", icon: "🥚", name: "Egg Whisperer", desc: "Deliver 20 trays of eggs.", coins: 60, test: () => save.stats.eggs >= 20 },
  { id: "crates", icon: "🏗️", name: "Heavy Lifter", desc: "Deliver 100 loads of cargo.", coins: 80, test: () => save.stats.crates >= 100 },
  { id: "bakery", icon: "🥐", name: "Bakery Boss", desc: "Three stars on all of Bakery Hills.", coins: 100, test: () => regionStars(0) === 24 },
  { id: "dunes", icon: "🥛", name: "Cream of the Crop", desc: "Reach Honey Harbour.", coins: 80, test: () => regionFull(2) },
  { id: "chilli", icon: "🌶️", name: "Feeling the Heat", desc: "Reach Chilli Ridge.", coins: 120, test: () => regionFull(4) },
  { id: "fleet", icon: "🚚", name: "Second Set of Wheels", desc: "Buy another truck.", coins: 50, test: () => save.trucks.length >= 2 },
  { id: "maxed", icon: "🔧", name: "Fully Tuned", desc: "Max out one upgrade.", coins: 100, test: () => SH.UPGRADES.some((u) => level(u.id) >= SH.MAX_LEVEL) },
  { id: "streak", icon: "📅", name: "Regular Run", desc: "Do the daily delivery 3 days in a row.", coins: 90, test: () => save.daily.streak >= 3 },
  { id: "harbour", icon: "⚓", name: "Harbour Master", desc: "Reach Frosty Pass.", coins: 100, test: () => regionFull(3) },
  { id: "market", icon: "🏮", name: "Night Shift", desc: "Reach Midnight Market.", coins: 150, test: () => regionFull(5) },
  { id: "frost", icon: "❄️", name: "Cold Chain", desc: "Finish every Frosty Pass route.", coins: 150, test: () => SH.DELIVERIES.every((d) => d.region !== 3 || save.stars[d.id] > 0) },
  { id: "melon", icon: "🍉", name: "Melon Minder", desc: "Deliver 15 melons.", coins: 60, test: () => save.stats.melons >= 15 },
  { id: "cake", icon: "🎂", name: "Right Way Up", desc: "Deliver 10 cakes.", coins: 70, test: () => save.stats.cakes >= 10 },
  { id: "popcorn", icon: "🍿", name: "Light Touch", desc: "Deliver 20 bags of popcorn.", coins: 80, test: () => save.stats.popcorn >= 20 },
  { id: "icecream", icon: "🍦", name: "Brain Freeze", desc: "Deliver 10 ice creams before they start to melt.", coins: 90, test: () => save.stats.coldIcecream >= 10 },
  { id: "bridge", icon: "🌉", name: "Bridge Builder", desc: "Make 10 deliveries over bridges.", coins: 60, test: () => save.stats.bridges >= 10 },
  { id: "ramp", icon: "🛬", name: "Stuck the Landing", desc: "Land 50 jumps.", coins: 50, test: () => save.stats.landings >= 50 },
  { id: "gold", icon: "🥇", name: "Gold Standard", desc: "Win 10 gold medals.", coins: 120, test: () => Object.values(save.medal).filter((m) => m === 3).length >= 10 },
  { id: "stars", icon: "🌟", name: "Star Collector", desc: "Collect 100 stars.", coins: 150, test: () => Object.values(save.stars).reduce((n, x) => n + x, 0) >= 100 },
  { id: "longhaul", icon: "🛣️", name: "Long Way Round", desc: "Drive 1 km in one Long Haul.", coins: 80, test: () => save.stats.longBest >= 1000 },
  { id: "longhaul5", icon: "🪧", name: "Five Kilometre Club", desc: "Drive 5 km in Long Haul, all runs together.", coins: 120, test: () => save.stats.longMetres >= 5000 },
  { id: "contracts", icon: "📋", name: "Reliable", desc: "Complete 15 contracts.", coins: 100, test: () => save.stats.contracts >= 15 },
  { id: "tuktuk", icon: "🛺", name: "Small but Mighty", desc: "Three stars in the Tart Tuk-Tuk outside Bakery Hills.", coins: 80, test: () => save.stats.tuktukAway >= 1 },
  { id: "monster", icon: "🛞", name: "Big Wheels", desc: "Buy the Big Muncher.", coins: 100, test: () => save.trucks.includes("monster") },
  { id: "challenges", icon: "🎯", name: "Up for It", desc: "Complete 10 route challenges.", coins: 120, test: () => Object.keys(save.challenge).length >= 10 },
  { id: "rival", icon: "🏁", name: "Dash Dashed", desc: "Beat Dash Dalloway on 10 routes.", coins: 150, test: () => Object.keys(save.rival).length >= 10 },
  { id: "ghostwins", icon: "👻", name: "Shadow Boxer", desc: "Beat your own ghost on 10 routes.", coins: 120, test: () => Object.keys(save.ghostWins).length >= 10 },
  { id: "orders10", icon: "📦", name: "Trusted Hauler", desc: "Complete 10 Special Orders.", coins: 150, test: () => Object.keys(save.orders).length >= 10 },
  { id: "orders30", icon: "🤝", name: "Everyone's Favourite", desc: "Complete all 30 Special Orders.", coins: 400, test: () => Object.keys(save.orders).length >= 30 },
  { id: "paint", icon: "🎨", name: "Fresh Coat", desc: "Earn a paint job and put it on a truck.", coins: 60, test: () => Object.values(save.paint).some(Boolean) },
  { id: "depot3", icon: "🏗️", name: "Open for Business", desc: "Grow the depot to stage 3.", coins: 150, test: () => depotStage() >= 3 },
  { id: "depot5", icon: "🌟", name: "Bright Lights", desc: "Grow the depot to stage 5.", coins: 300, test: () => depotStage() >= 5 },
  { id: "streak7", icon: "🗓️", name: "Full Week", desc: "Do the daily delivery 7 days in a row.", coins: 150, test: () => save.daily.streak >= 7 },
  { id: "cupgold", icon: "🏆", name: "Cup Winner", desc: "Win a gold Weekly Cup.", coins: 250, test: () => (save.stats.cupGolds || 0) >= 1 },
  { id: "crumbs", icon: "✨", name: "Golden Crumbs", desc: "Win 10 golden crumbs: three stars, gold and the challenge in one run.", coins: 200, test: () => Object.keys(save.crumb || {}).length >= 10 },
  { id: "done", icon: "🏆", name: "Haulage Legend", desc: "Finish every route.", coins: 300, test: () => SH.DELIVERIES.every((d) => save.stars[d.id] > 0) }
];
function regionStars(r) { return SH.regionStars(r, save.stars); }

// ════ Authored images: each falls back to the emoji or text it replaces ═
const ico = (name, fallback = "", cls = "ico") => (has("ui/" + name + ".webp") ? `<img class="${cls}" src="${url("ui/" + name + ".webp")}" alt="">` : fallback);
const artUrl = (name) => (has("art/" + name + ".webp") ? url("art/" + name + ".webp") : "");
const DRIVERS = [["corgi", "Corgi-on-the-Cob"], ["barkbq", "Bark-B-Q"], ["waffle", "Belgian Waffle"], ["booklava", "Booklava"]];
const TOPPERS = [["", "None"], ["croissant", "Croissant"], ["corn", "Corn cob"], ["chilli", "Chilli"], ["cone", "Ice-cream cone"], ["pretzel", "Pretzel"], ["donut", "Doughnut"], ["honey", "Honey pot"], ["crown", "Crown"]];
function look(truckId = drivingTruck()) {
  const p = PAINTS.concat(WINTER_PAINTS).find((x) => x.id === save.paint[truckId]);
  return { driver: save.driver, topper: save.topper, upgrades: save.upgrades, paint: p && paintOwned(p) ? p.colors : null };
}

// ════ Truck mastery: distance delivered in a truck, levels 1 to 10 ═
const MASTERY_KM = [0, 0.8, 2, 3.5, 5.5, 8, 11, 15, 20, 26];
function masteryLevel(truckId) { const km = (save.mastery[truckId] || 0) / 1000; return MASTERY_KM.filter((x) => km >= x).length; }
const masteryBonus = (truckId) => 0.02 * (masteryLevel(truckId) - 1);

// ════ Paint jobs: all earned, never sold ═══════════════════════════
// Three per truck from mastery (levels 3, 6 and 9), one per region for all
// 24 stars, and one per customer for all five of their Special Orders.
const PAINTS = [
  ...[["pickup", [["Barn Door", "#a8322a", "#e9dcc0"], ["Sage Farm", "#7f9a6a", "#f1ead7"], ["Copper Rust", "#b8693a", "#3a2a22"]]],
    ["tuktuk", [["Raspberry Tart", "#d14a6f", "#ffe9c9"], ["Lime Sorbet", "#9ccf4a", "#2f3a24"], ["Plum Jam", "#6d3a78", "#f6d8a8"]]],
    ["van", [["Fresh Loaf", "#e9c48a", "#7a4a2a"], ["Seaside", "#5fa8d3", "#fff7e6"], ["Midnight Rye", "#2e3448", "#e7a23c"]]],
    ["buggy", [["Sand Storm", "#d8b56a", "#3b2f22"], ["Coral", "#f07a5a", "#1f2a33"], ["Jungle", "#3f8a4e", "#f2d14a"]]],
    ["hauler", [["Glacier", "#a9d6e8", "#2b4a66"], ["Racing Green", "#245a3a", "#e9d9a8"], ["Royal", "#3c3f9a", "#f2c84b"]]],
    ["monster", [["Grape Soda", "#8a4fd0", "#ffe14d"], ["Lava", "#d63b1f", "#2a1d1a"], ["Toxic Lime", "#9be02f", "#202020"]]]]
    .flatMap(([truck, list]) => list.map(([name, a, b], i) => ({ id: truck + "-" + (i + 1), name, colors: [a, b], how: { truck, level: [3, 6, 9][i] } }))),
  ...[["Golden Crust", "#e0a43a", "#5a3a1e"], ["Buttermilk", "#f4ecd2", "#4f88b8"], ["Honeycomb", "#f2b42c", "#3a2a14"], ["Frostbite", "#dff2fa", "#3a78b0"], ["Ghost Pepper", "#e8452c", "#ffd23f"], ["Neon Night", "#1e1b3a", "#ff4fa3"]]
    .map(([name, a, b], r) => ({ id: "region-" + r, name, colors: [a, b], how: { region: r } })),
  ...[["Mabel's Apron", "#f3c7c9", "#7a3b3b"], ["Dairy Dot", "#ffffff", "#2a2a2a"], ["Captain's Navy", "#1f3a5f", "#e8c35a"], ["Sprinkles", "#fbe0ef", "#56b8c9"], ["Pepper Red", "#c42a22", "#2c6e2f"], ["Owl Feather", "#6b5a48", "#f2d27a"]]
    .map(([name, a, b], r) => ({ id: "customer-" + r, name, colors: [a, b], how: { customer: r } }))
];
// ════ The depot: grows in five stages with parts from Special Orders ═
const DEPOT_PARTS = [0, 3, 8, 15, 24];
const DEPOT_STAGES = ["A shed and a dirt yard", "A fuel pump and a sign", "A workshop", "A loading crane", "Neon lights and a café"];
const depotStage = () => DEPOT_PARTS.filter((n) => save.parts >= n).length;
// Extras: coins only, the late-game coin sink. Cheapest first.
const EXTRAS = [["flowers", "Flower boxes", 150], ["bench", "Bench", 200], ["bunting", "Bunting", 300], ["barrels", "Barrels", 350], ["hay", "Hay bales", 400],
  ["picnic", "Picnic table", 600], ["windsock", "Windsock", 800], ["lamp", "Lamp posts", 1100], ["lights", "String lights", 1500], ["fountain", "Fountain", 2000],
  ["tower", "Water tower", 2600], ["statue", "Golden croissant statue", 3500]];
const depotLook = () => ({ stage: depotStage(), extras: save.extras.slice().sort(), winter: decemberDressing(),
  decor: ["tree","lights","wreath","snowman"].filter((id)=>save.winterRewards[id]) });

function paintOwned(p) {
  const h = p.how;
  if (!h) return !!save.winterRewards[p.id];
  if (h.truck) return masteryLevel(h.truck) >= h.level;
  if (h.region != null) return regionStars(h.region) >= 24;
  return SH.ORDERS.filter((o) => o.region === h.customer).every((o) => save.orders[o.id]);
}
function paintHow(p) {
  const h = p.how;
  if (h.truck) return SH.truckSpec(h.truck).name + " mastery " + h.level;
  if (h.region != null) return "All 24 stars in " + SH.REGIONS[h.region].name;
  return "Every order for " + SH.CUSTOMERS[h.customer].name;
}

// ════ Contracts: three jobs a day, paid once each ═════════════════
function jobs() {
  const today = localDate();
  if (save.jobs.date !== today) save.jobs = { date: today, got: {}, paid: {} };
  return SH.contractsFor(today, maxRegion());
}
function weekJob() {
  const wk = weekKey();
  if (save.week.key !== wk) save.week = { key: wk, got: 0, paid: false };
  return SH.weeklyFor(wk);
}
// The Weekly Cup's legs are fixed for the week from the regions open when it is first seen.
function cup() {
  const wk = weekKey();
  if (save.cup.week !== wk) save.cup = { week: wk, top: maxRegion(), free: paywalled(), best: {}, paid: {} };
  return SH.cupFor(wk, save.cup.top, !!save.cup.free);
}
const CUP_PAY = { bronze: 120, silver: 220, gold: 360 };
function cupTotal(c) { return c.legs.every((d) => save.cup.best[d.id]) ? Math.round(c.legs.reduce((n, d) => n + save.cup.best[d.id], 0) * 10) / 10 : null; }
function cupTier(c) { const t = cupTotal(c); return t == null ? "" : t <= c.gold ? "gold" : t <= c.silver ? "silver" : t <= c.bronze ? "bronze" : ""; }
function countJobs(report) {
  const fresh = [];
  const w = weekJob();
  if (!save.week.paid) {
    save.week.got += w.count(report);
    if (save.week.got >= w.goal) { save.week.paid = true; save.coins += w.pay; fresh.push(w); }
  }
  jobs().forEach((c) => {
    if (save.jobs.paid[c.id]) return;
    save.jobs.got[c.id] = (save.jobs.got[c.id] || 0) + c.count(report);
    if (save.jobs.got[c.id] >= c.goal) { save.jobs.paid[c.id] = true; save.coins += c.pay; fresh.push(c); }
  });
  return fresh;
}
function checkGoals(report) {
  const fresh = [];
  GOALS.forEach((g) => {
    if (!save.achieved[g.id] && g.test(report)) { save.achieved[g.id] = true; save.coins += g.coins; fresh.push(g); }
  });
  return fresh;
}

// ════ Audio: an authored sample plays when assets.js has one, and the
// synthesiser below covers everything that has not been delivered ═══
const audio = { ctx: null, buffers: {}, decoding: {}, loops: null, music: null, musicName: "" };
function ensureAudio() {
  if (!save.sound) return;
  if (audio.ctx) { if (audio.ctx.state === "suspended") audio.ctx.resume(); return; }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio.ctx = ctx;
    audio.master = ctx.createGain(); audio.master.gain.value = 0.9; audio.master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 520; filter.Q.value = 1.5;
    audio.engineGain = ctx.createGain(); audio.engineGain.gain.value = 0;
    audio.o1 = ctx.createOscillator(); audio.o1.type = "sawtooth"; audio.o1.frequency.value = 60;
    audio.o2 = ctx.createOscillator(); audio.o2.type = "square"; audio.o2.frequency.value = 30;
    const sub = ctx.createGain(); sub.gain.value = 0.5;
    audio.o1.connect(filter); audio.o2.connect(sub); sub.connect(filter);
    filter.connect(audio.engineGain); audio.engineGain.connect(audio.master);
    audio.o1.start(); audio.o2.start();
    audio.filter = filter;
    // Road noise for wheelspin and gravel.
    const n = ctx.sampleRate, buffer = ctx.createBuffer(1, n, n), data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 900; nf.Q.value = 0.7;
    audio.noise = ctx.createGain(); audio.noise.gain.value = 0;
    src.connect(nf); nf.connect(audio.noise); audio.noise.connect(audio.master); src.start();
    decodeSounds();
  } catch (e) { audio.ctx = null; }
}
// Decodes every loaded sound once the audio context exists. Safe to call again.
// Music is the exception: a decoded loop holds about 25 MB, so only the track that
// is playing is decoded (see musicBuffer).
function decodeSounds() {
  if (!audio.ctx) return;
  Object.keys(Assets.sounds).forEach((name) => {
    if (name.startsWith("music/")) { if (audio.wantMusic && !audio.music) setMusic(audio.wantMusic); return; }
    if (audio.buffers[name] || audio.decoding[name]) return;
    audio.decoding[name] = true;
    try {
      audio.ctx.decodeAudioData(soundData(name).slice(0), (buffer) => {
        audio.buffers[name] = buffer;
        if (audio.wantEngine && !audio.loops) engineLoops(audio.wantEngine);
        if (audio.wantRoad && name.startsWith("road/") && !(audio.road || {})[name.slice(5)]) roadLoops(audio.wantRoad);
      }, () => {});
    } catch (e) { /* an undecodable file falls back to the synthesiser */ }
  });
}
function source(name, loop, gainValue) {
  const src = audio.ctx.createBufferSource(), gain = audio.ctx.createGain();
  src.buffer = audio.buffers[name]; src.loop = !!loop; gain.gain.value = gainValue;
  src.connect(gain); gain.connect(audio.master);
  return { src, gain };
}
// Plays an authored effect. Returns false when there is none, so callers can
// write play("coin") || beep(...).
function play(name, vol = 1, rate = 1) {
  if (!save.sound || !audio.ctx || !audio.buffers["sfx/" + name]) return false;
  const s = source("sfx/" + name, false, vol);
  s.src.playbackRate.value = rate;
  s.src.start();
  return true;
}
function stopLoop(loop) {
  if (!loop) return;
  try { loop.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.15); loop.src.stop(audio.ctx.currentTime + 0.8); } catch (e) { /* already stopped */ }
}
// Idle and drive loops for one truck. Without both files the oscillators stay in charge.
function engineLoops(truckId) {
  audio.wantEngine = truckId;
  if (!audio.ctx) return;
  if (audio.loops) { stopLoop(audio.loops.idle); stopLoop(audio.loops.drive); audio.loops = null; }
  if (!truckId || !audio.buffers["engine/" + truckId + "_idle"] || !audio.buffers["engine/" + truckId + "_drive"]) return;
  audio.loops = { idle: source("engine/" + truckId + "_idle", true, 0), drive: source("engine/" + truckId + "_drive", true, 0) };
  audio.loops.idle.src.start(); audio.loops.drive.src.start();
}
// Decodes one music track and lets every other decoded track go.
function musicBuffer(key, done) {
  const name = "music/" + key;
  Object.keys(audio.buffers).forEach((k) => { if (k.startsWith("music/") && k !== name) delete audio.buffers[k]; });
  if (audio.buffers[name]) return done(audio.buffers[name]);
  if (!Assets.sounds[name] || audio.decoding[name]) return;
  audio.decoding[name] = true;
  try {
    audio.ctx.decodeAudioData(soundData(name).slice(0), (buffer) => { audio.decoding[name] = false; audio.buffers[name] = buffer; done(buffer); }, () => { audio.decoding[name] = false; });
  } catch (e) { audio.decoding[name] = false; }
}
function setMusic(name, trackIndex = 0) {
  audio.wantMusic = name;
  if (!audio.ctx || (audio.musicName === name && !trackIndex && (audio.music || audio.musicPending === name))) return;
  stopLoop(audio.music); audio.music = null; audio.musicName = ""; audio.musicPending = "";
  if (!name || !save.sound || save.music === false) return;
  const have = (key) => !!Assets.sounds["music/" + key];
  const winter = name === "music_northpole";
  const tracks = winter ? [name, ...Object.keys(Assets.sounds).filter((key) => key.startsWith("music/music_carol_")).sort().map((key) => key.slice(6))].filter(have) : [name];
  if (!tracks.length || !have(tracks[0])) tracks[0] = winter ? "music_frost" : name === "music_winter_menu" ? "music_menu" : name;
  const track = tracks[trackIndex % tracks.length];
  if (!have(track)) return;
  audio.musicPending = name;
  musicBuffer(track, () => {
    if (audio.wantMusic !== name || audio.musicPending !== name) return;
    audio.musicPending = "";
    const loop = source("music/" + track, tracks.length === 1, 0);
    audio.music = loop;
    // A playlist changes track only at a natural end.
    if (tracks.length > 1) loop.src.onended = () => { if (audio.music === loop) setMusic(name, trackIndex + 1); };
    loop.gain.gain.setTargetAtTime(MUSIC_LEVEL, audio.ctx.currentTime, .6);
    loop.src.start();
    audio.musicName = name;
  });
}
const MUSIC_LEVEL = 0.32;
// Tyre noise by region, swapped on bridges and ice, plus a quiet backdrop.
const SURFACE = { northpole: "road_snow", bakery: "road_gravel", dunes: "road_sand", harbour: "road_sand", frost: "road_snow", chilli: "road_gravel", market: "road_cobble" };
const AMBIENT = { northpole: "night", dunes: "wind", harbour: "waves", frost: "wind", market: "night" };
function roadLoops(regionId) {
  audio.wantRoad = regionId;
  if (!audio.ctx) return;
  Object.values(audio.road || {}).forEach(stopLoop);
  audio.road = {}; audio.roadRegion = regionId;
  if (!regionId) return;
  const start = (name, level) => { if (!audio.buffers["road/" + name] || audio.road[name]) return; const l = source("road/" + name, true, 0); l.level = level; l.src.start(); audio.road[name] = l; };
  [SURFACE[regionId], "road_planks", "road_ice"].forEach((name) => start(name, 0));
  if (AMBIENT[regionId]) { start(AMBIENT[regionId], 0.22); if (audio.road[AMBIENT[regionId]]) audio.road[AMBIENT[regionId]].ambient = true; }
}
let lastSkid = 0, lastTick = 0;
function beep(freq, dur, type, vol, delay = 0) {
  if (!save.sound || !audio.ctx) return;
  const o = audio.ctx.createOscillator(), g = audio.ctx.createGain(), t = audio.ctx.currentTime + delay;
  o.type = type || "triangle"; o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.07, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(audio.master); o.start(t); o.stop(t + dur);
}
function thud(power) { play(power > 0.55 ? "land_hard" : "land_soft", 0.5 + power * 0.5) || beep(70 + power * 40, 0.22, "sine", Math.min(0.3, 0.1 + power * 0.14)); }
function engineSound(game, on) {
  if (!audio.ctx) return;
  const t = audio.ctx.currentTime, speed = game ? Math.abs(game.speed()) : 0, gas = game && game.gasOn;
  const rev = 46 + speed * 9 + (gas ? 22 : 0), live = on && save.sound;
  if (audio.loops) {
    // Authored loops: cross-fade idle into drive and pitch both with speed.
    const pitch = 0.85 + Math.min(1.1, speed * 0.045) + (gas ? 0.12 : 0);
    audio.loops.idle.src.playbackRate.setTargetAtTime(pitch, t, 0.1);
    audio.loops.drive.src.playbackRate.setTargetAtTime(pitch, t, 0.1);
    audio.loops.idle.gain.gain.setTargetAtTime(!live ? 0 : gas ? 0.12 : 0.5, t, 0.08);
    audio.loops.drive.gain.gain.setTargetAtTime(!live ? 0 : gas ? 0.6 : Math.min(0.3, speed * 0.03), t, 0.08);
  }
  if (audio.music) audio.music.gain.gain.setTargetAtTime(save.sound ? MUSIC_LEVEL : 0, t, 0.3);
  let tyres = false;
  if (audio.road) {
    const zone = game && game.zone ? game.zone.type : "", under = zone === "bridge" ? "road_planks" : zone === "slick" ? "road_ice" : SURFACE[audio.roadRegion];
    const rolling = live && game && game.grounded() ? Math.min(0.34, speed * 0.035) : 0;
    Object.keys(audio.road).forEach((name) => {
      const l = audio.road[name];
      if (!l.ambient) tyres = true;
      l.gain.gain.setTargetAtTime(l.ambient ? (live ? l.level : 0) : name === under ? rolling : 0, t, 0.12);
    });
  }
  if (live && game && game.brakeOn && speed > 5 && game.grounded() && t - lastSkid > 1.4) { lastSkid = t; play("brake_skid", Math.min(0.5, speed * 0.05)); }
  audio.o1.frequency.setTargetAtTime(rev, t, 0.08);
  audio.o2.frequency.setTargetAtTime(rev / 2, t, 0.08);
  audio.filter.frequency.setTargetAtTime(gas ? 900 : 420, t, 0.1);
  const sleigh=game && game.spec.runners;
  audio.engineGain.gain.setTargetAtTime(!live || audio.loops || sleigh ? 0 : gas ? 0.085 : 0.035, t, 0.06);
  if (live && sleigh && !audio.loops && speed>.5 && game.grounded() && t >= (audio.bellAt || 0)) {
    audio.bellAt=t+Math.max(.20,.78-speed*.056);
    beep(829,.10,"sine",.035);
    beep(1130,.19,"triangle",.026,.06);
  }
  audio.noise.gain.setTargetAtTime(!on || !save.sound || !game || tyres ? 0 : Math.min(0.05, game.slipRear * 0.006 + speed * 0.002), t, 0.08);
}

// ════ World ═══════════════════════════════════════════════════════
let world;
try { world = new World3D(canvas, save.quality); } catch (e) { world = null; }
const state = { mode: "menu", screen: "home", game: null, delivery: null, input: { gas: false, brake: false }, acc: 0, last: 0, toastUntil: 0, hintUntil: 0, regionTab: 0, endTimer: 0, hints: {} };

function sizeWorld() { world && world.resize(window.innerWidth, window.innerHeight); }
window.addEventListener("resize", sizeWorld);
sizeWorld();

function showcaseRegion() {
  const event=currentEvent();
  return state.screen==="winter" && event ? event.region : state.screen==="routes" ? state.regionTab : nextRoute().region;
}
function refreshShowcase() {
  if (!world) return;
  world.showView = state.screen === "home" ? "home" : "panel";
  world.depot = depotLook();
  const truck=state.screen==="garage" && save.truck==="sleigh" && sleighOwned() ? "sleigh" : drivingTruck();
  world.look=look(truck);
  world.showcase(truck, showcaseRegion(), railFor(truck));
}

let frameId = 0;
function kick() { cancelAnimationFrame(frameId); state.last = performance.now(); frameId = requestAnimationFrame(tick); }
let menuLag = 0;
function tick(now) {
  frameId = requestAnimationFrame(tick);
  // Recording builds only: draw on every other refresh of a 120 Hz screen, so a
  // 60 fps screen capture gets evenly spaced frames (see SnackHaulDebug below).
  if (state.frameCap && now - state.last < state.frameCap - 2) return;
  const dt = Math.min(0.1, (now - state.last) / 1000);
  state.last = now;
  if (state.mode === "menu") {
    // Menus render at half rate to save battery.
    menuLag += dt;
    if (menuLag >= 1 / 32 && world && world.showcasing) { world.frameShowcase(menuLag); menuLag = 0; }
    return;
  }
  if (state.mode === "paused") return;
  const g = state.game;
  if (state.slow > 0) { state.slow -= dt; state.acc += dt * 0.4; } else state.acc += dt;
  while (state.acc >= SH.STEP) {
    // Recording builds only: the bots' driver works the pedals (see SnackHaulDebug below).
    if (state.autopilot && g.status === "driving") { const b = SH.botInput(g, state.autopilot); state.input.gas = b.gas; state.input.brake = b.brake; }
    const driving = g.status === "driving";
    // The picture is drawn between the last two physics steps (see World3D.pose).
    snapBodies(g);
    if (state.ghost) snapBodies(state.ghost.game);
    g.step(state.input);
    if (driving) { stepGhost(); if (state.gap) state.gap.push(g.truck.getPosition().x, state.ghost.game.truck.getPosition().x, state.ghost.game.status === "driving"); }
    state.acc -= SH.STEP;
  }
  if (state.autopilot) syncPedals();
  world.alpha = Math.min(1, state.acc / SH.STEP);
  drainEvents(g);
  if (g.status === "driving") roadSounds(g);
  if (now > state.toastUntil) $("toast").classList.remove("on");
  if (now > state.hintUntil) $("hint").classList.remove("on");
  engineSound(g, g.status === "driving");
  world.frameGame(g, dt);
  hud(g);
  if (g.status === "driving") coach(g);
  else {
    state.endTimer += dt;
    if (state.endTimer > 1.5 && state.mode === "drive") { state.mode = "result"; buzz(g.status === "done" || g.delivery.long ? "success" : "error"); finishDelivery(g); }
  }
}

function snapBodies(g) {
  const keep = (b) => { const p = b.getPosition(); b.px = p.x; b.py = p.y; b.pa = b.getAngle(); };
  keep(g.truck); g.wheels.forEach(keep); g.cargo.forEach((c) => keep(c.body));
}
const LOST_SOUND = { melon: "melon_splat", jelly: "jelly_boing", milk: "milk_clink" };
// Sounds that follow the road rather than an engine event: logs under the wheels,
// and ice cream starting to melt once the gold time has gone.
function roadSounds(g) {
  const x = g.truck.getPosition().x;
  const logs = state.logs || (state.logs = g.rocks.filter((r) => r.kind === "log").map((r) => r.x));
  while (logs.length && logs[0] < x - 1) { logs.shift(); if (g.grounded() && Math.abs(g.speed()) > 1.5) play("log_bump", 0.55, 0.9 + Math.random() * 0.2); }
  if (!state.melted && g.time > g.par && g.cargo.some((c) => c.type === "icecream" && !c.lost && !c.broken)) { state.melted = true; play("icecream_melt", 0.6); toast("The ice cream is melting!", 1100); }
}
function drainEvents(g) {
  g.events.splice(0).forEach((ev) => {
    if (ev.type === "done") ev.at = g.truck.getPosition();
    world.react(ev);
    buzzFor(ev);
    if (ev.type === "coin") play("coin", 0.55, 0.94 + Math.random() * 0.12) || beep(1180 + Math.random() * 200, 0.08, "triangle", 0.05);
    else if (ev.type === "fuel") { play("fuel", 0.8) || (beep(520, 0.12, "sine", 0.1), beep(780, 0.16, "sine", 0.1, 0.1)); toast("Fuel!", 700); }
    else if (ev.type === "lost") { play(LOST_SOUND[ev.cargo] || "crate_lost", 0.8) || play("crate_lost", 0.8) || thud(0.6); toast("Cargo lost!", 800); }
    else if (ev.type === "broken") { play("egg_crack", 0.8) || beep(900, 0.1, "sawtooth", 0.05); toast("Eggs cracked!", 800); }
    else if (ev.type === "land") {
      thud(Math.min(1, ev.air));
      if (ev.air > 0.35 && g.live()) {
        play("crate_thud", Math.min(0.7, ev.air * 0.6));
        if (g.cargo.some((c) => c.type === "pudding" && !c.lost && !c.broken)) play("pudding_wobble", Math.min(0.5, ev.air * 0.4));
      }
      const aboard = (type) => g.cargo.some((c) => c.type === type && !c.lost && !c.broken && !c.delivered);
      if (ev.air > 0.3 && aboard("melon")) play("melon_roll", 0.5);
      if (ev.air > 0.3 && aboard("popcorn")) play("popcorn_pop", 0.5, 0.95 + Math.random() * 0.1);
    }
    else if (ev.type === "pickup") { play("pickup_load", 0.8) || (beep(660, 0.12, "triangle", 0.08), beep(880, 0.16, "triangle", 0.08, 0.1)); toast("Loaded " + ev.items.length + " more!", 1100); }
    else if (ev.type === "dropoff") { play("present_drop",.75) || (beep(680,.14,"sine",.08),beep(910,.18,"triangle",.06,.05)); toast("Porch delivered!",1000); }
    else if (ev.type === "missedDrop") { beep(247,.22,"triangle",.06); toast("Passed a porch",950); }
    else if (ev.type === "missed") { beep(247, 0.3, "triangle", 0.07); toast("Missed the pickup!", 1200); }
    else if (ev.type === "ruined") { (ev.cargo === "pudding" && play("pudding_wobble", 0.8)) || play("cake_squash", 0.8); toast(ev.cargo==="pudding" ? "Pudding toppled!" : "Cake toppled!", 900); }
    else if (ev.type === "dock") { thud(1); toast("Bumped the depot!", 1000); }
    else if (ev.type === "tailgateLoose") { toast("Tailgate loose. Ease over bumps.", 1600); buzz("warning"); }
    else if (ev.type === "tailgateLost") { thud(0.7); toast("Tailgate lost! Watch the load.", 1700); buzz("warning"); }
    else if (ev.type === "splash") play("splash", 0.6) || beep(300 + Math.random() * 200, 0.12, "sine", 0.04);
    else if (ev.type === "zone") {
      const say = { dropoff:"Stop on the doormat", drift:"Snowdrift: carry your speed", wind: "Gusty! Mind the load", slick: g.regionIndex === 3 || g.delivery.winter ? "Ice! Brake early" : "Wet cobbles!", bridge: "Bridge: take it steady", ford: "Ford: keep your speed up", pickup: "Pickup stop: pull up here" }[ev.feature];
      if (say) hint(say, 2600);
      const sound = { drift:"snow_drift", bridge: "bridge_creak", wind: "wind_gust", ramp: "ramp_whoosh", bump: "speed_bump" }[ev.feature];
      if (sound) play(sound, 0.6);
    }
  });
}

// ════ Ghost: your best run, replayed through a second copy of the physics ═
// Until you beat him on a route, the ghost is Dash Dalloway, the rival: the bot
// driver run live at his speed for that route. After that it is your best run.
const RIVAL = "Dash Dalloway";
function makeGhost(delivery) {
  if (save.ghostOn === false || delivery.long || delivery.daily) return null;
  const rival = SH.rivalFor(delivery.id), saved = save.ghost[delivery.id];
  try {
    if (rival && save.stars[delivery.id] && !save.rival[delivery.id]) {
      return { kind: "rival", rival, game: SH.createGame({ delivery, upgrades: SH.rivalUpgrades(rival.L), truck: "pickup", legacyCargoPhysics: true }) };
    }
    if (saved && saved.v === 2 && (saved.rev || 1) === (delivery.rev || 1)) return { kind: "mine", time: saved.time, game: SH.createGame({ delivery, upgrades: saved.upgrades, truck: saved.truck, legacyCargoPhysics: !saved.cargoPhysics }), rec: saved.rec, i: 0, k: 0 };
  } catch (e) { /* the run goes on without a ghost */ }
  return null;
}
function stepGhost() {
  const gh = state.ghost;
  if (!gh || gh.game.status !== "driving") return;
  if (gh.kind === "rival") gh.game.step(SH.botInput(gh.game, gh.rival.v));
  else {
    if (gh.i >= gh.rec.length) return;
    const bits = gh.rec[gh.i];
    gh.game.step({ gas: !!(bits & 1), brake: !!(bits & 2) });
    if (++gh.k >= gh.rec[gh.i + 1]) { gh.i += 2; gh.k = 0; }
  }
  gh.game.events.length = 0;
}

// ════ Delivery flow ═══════════════════════════════════════════════
function startDelivery(delivery) {
  if (!delivery) return;
  const event=currentEvent();
  if (delivery.winter) {
    const canonical=SH.winterDelivery(delivery.id);
    if (!event || !canStartWinter(event,seasonProgress(save,event.key),canonical,sleighOwned())) return toMenu(event ? "winter" : "home");
    delivery={...canonical,eventKey:event.key};
  } else if (decemberDressing() && delivery.region===0) {
    delivery={...delivery,snowy:true};
  }
  // Paid content never starts without the unlock (Next delivery can point past Bakery Hills).
  if (routePaid(delivery)) return showUnlock("route");
  if (delivery.truck && !delivery.loan && truckPaid(delivery.truck) && !save.trucks.includes(delivery.truck)) return showUnlock("truck");
  // Straps arrive before the first road that needs them, however the player got there.
  if (delivery.id === "bakery-4" && !save.gifts.straps) giveStraps();
  ensureAudio();
  state.delivery = delivery;
  // A Special Order can name its truck; it must be owned to start.
  const truckId = delivery.truck || drivingTruck();
  // The daily is driven in a loaner truck with set upgrades, the same for everyone.
  const game = SH.createGame({ delivery, upgrades: delivery.loan ? SH.rivalUpgrades(delivery.level) : save.upgrades, truck: truckId });
  state.logs = null; state.melted = false;
  state.game = game; state.acc = 0; state.endTimer = 0; state.hints = {}; state.mile = 0; state.slow = 0;
  state.input.gas = state.input.brake = false;
  syncPedals();
  engineLoops(truckId);
  const region=SH.regionFor(delivery.region);
  setMusic("music_" + region.id);
  roadLoops(region.id);
  state.hudLoad = state.hudCoins = state.hudClock = null;
  world.look = look(truckId);
  world.reduceMotion = !save.shake;
  state.ghost = delivery.winter ? null : makeGhost(delivery);
  world.ghostGame = state.ghost ? state.ghost.game : null;
  world.ghostKind = state.ghost ? state.ghost.kind : null;
  world.ghostLabel = !state.ghost ? "" : state.ghost.kind === "rival" ? RIVAL : "Your best " + state.ghost.time.toFixed(1) + "s";
  state.gap = state.ghost ? SH.ghostGap() : null;
  state.hudGap = null;
  $("gap").hidden = !state.gap;
  world.buildRoute(game);
  ui.innerHTML = ""; veil.classList.remove("on");
  driveEl.hidden = false;
  const label = delivery.long ? "Long Haul" : delivery.daily ? "World Tour Daily: " + SH.REGIONS[delivery.region].name + " in the " + SH.truckSpec(truckId).name : delivery.order ? SH.CUSTOMERS[delivery.customer].name + ": " + delivery.name : delivery.name || SH.REGIONS[delivery.region].name + " " + (delivery.index + 1);
  toast(label + ": " + (delivery.winter ? delivery.dropoffs + " porches" : game.total + " loads"), 1700);
  const ch = !delivery.long && !delivery.daily && save.stars[delivery.id] && !save.challenge[delivery.id] ? SH.challengeFor(delivery.id) : null;
  if (delivery.winter) hint("Stop on each doormat, then return to the depot",4500);
  else if (delivery.order) hint(SH.orderText(delivery), 4500);
  else if (state.ghost && state.ghost.kind === "rival") hint(RIVAL + " is racing you: " + state.ghost.rival.t + "s to beat", 4500);
  else if (ch) hint("Challenge: " + SH.challengeText(ch), 4500);
  else if (state.ghost) hint("Race your ghost: " + state.ghost.time.toFixed(1) + "s to beat", 4000);
  const d = localDate();
  if (!delivery.winter && !save.days.includes(d)) save.days = save.days.concat(d).slice(-60);
  persist();
  state.mode = "drive";
  hud(game);
  kick();
}

function toast(text, ms) { $("toast").textContent = text; $("toast").classList.add("on"); state.toastUntil = performance.now() + (ms || 1200); }
function hint(text, ms) { $("hint").textContent = text; $("hint").classList.add("on"); state.hintUntil = performance.now() + (ms || 3800); }

// Teaches by doing, on the first deliveries only.
function coach(g) {
  const h = state.hints, x = g.truck.getPosition().x, id = g.delivery.id;
  if (save.tutorial < 1 && id === "bakery-1") {
    if (!h.gas && g.time > 0.3 && !state.input.gas) { h.gas = true; hint("Hold GAS to drive", 6000); }
    // The first ramp: the game slows for a moment and says what to do. Only the
    // picture slows; the physics keeps its fixed step.
    const ramp = g.terrain.features.find((f) => f.type === "ramp");
    if (!h.ease && ramp && x > ramp.x0 - 7 && x < ramp.x0) { h.ease = true; state.slow = 0.7; hint("Let go of GAS before the ramp, or the crates fly out", 3200); }
    if (!h.air && !g.grounded() && g.airTime > 0.15 && performance.now() > state.hintUntil) { h.air = true; hint("In the air: GAS tips the nose up, BRAKE tips it down", 3200); }
    if (!h.brake && x > g.terrain.zoneStart - 26) { h.brake = true; hint("Depot ahead. Brake early and stop in the arrows", 5000); }
  }
  if (save.tutorial < 2 && !g.grounded() && g.airTime > 0.3 && !h.air && performance.now() > state.hintUntil) { h.air = true; hint("In the air: GAS tips the nose up, BRAKE tips it down"); }
  if (g.stuckTime > 3.5 && !h.stuck) { h.stuck = true; hint("Stuck? Hold BRAKE to back up, then take a run at it", 5000); }
  if (!h.fuel && g.fuel / g.maxFuel < 0.22) { h.fuel = true; toast("Low fuel!", 1100); play("low_fuel", 0.7) || beep(330, 0.2, "square", 0.04); }
}

function hud(g) {
  const live = g.live();
  const loadText = g.delivery.winter ? g.homes + "/" + g.delivery.dropoffs + " porches" :
    live + "/" + g.total + (g.pending.length ? " +" + g.pending.length : "");
  if (state.hudLoad !== loadText) { state.hudLoad = loadText; $("load").innerHTML = ico("load", "📦") + " " + loadText; }
  $("load").className = !g.delivery.winter && live + g.pending.length - 1 < g.need && g.total > 1 ? "chip warn" : "chip";
  if (state.hudCoins !== g.coinsTaken) { state.hudCoins = g.coinsTaken; $("coins").innerHTML = ico("coin", "🪙") + " " + g.coinsTaken; }
  if (g.delivery.long) {
    const metres = Math.max(0, Math.round(g.truck.getPosition().x - 8)), mile = Math.floor(metres / 250);
    $("clock").textContent = metres + " m · next " + (mile + 1) * 250;
    if (mile > (state.mile || 0)) { state.mile = mile; toast(mile * 250 + " m!", 1100); play("medal", 0.5); }
  } else {
    // The clock shows the medal still in reach, and turns as each one passes.
    const m = g.medals, t = g.time, tier = t <= m.gold ? 3 : t <= m.silver ? 2 : t <= m.bronze ? 1 : 0;
    const text = Math.floor(t) + "s" + (tier ? " / " + ["", "bronze ", "silver ", "gold "][tier] + [0, m.bronze, m.silver, m.gold][tier] + "s" : "");
    if (state.hudClock !== text) { state.hudClock = text; $("clock").textContent = text; $("clock").className = "chip m" + tier; }
  }
  // The gap to the ghost at the same point on the road: minus means you are ahead.
  if (state.gap && g.status === "driving") {
    const gap = Math.round(state.gap.gap() * 10) / 10;
    if (state.hudGap !== gap) {
      state.hudGap = gap;
      const el = $("gap");
      el.textContent = (gap > 0 ? "+" : gap < 0 ? "\u2212" : "") + Math.abs(gap).toFixed(1) + "s";
      el.className = "chip gap " + (gap < 0 ? "ahead" : gap > 0 ? "behind" : "");
      el.setAttribute("aria-label", gap < 0 ? Math.abs(gap).toFixed(1) + " seconds ahead of the ghost" : gap > 0 ? gap.toFixed(1) + " seconds behind the ghost" : "Level with the ghost");
    }
  }
  const f = g.fuel / g.maxFuel;
  $("fuel").style.width = (f * 100).toFixed(1) + "%";
  $("fuel").className = f < 0.25 ? "low" : "";
  $("prog").style.width = Math.min(100, (g.truck.getPosition().x / g.terrain.zoneStart) * 100).toFixed(1) + "%";
  const loading = g.status === "driving" && g.inPickup();
  const dropping = g.status === "driving" && g.inDropoff();
  const showStop = dropping || loading || (g.status === "driving" && g.inZone());
  $("stop").hidden = !showStop;
  $("stop").firstElementChild.textContent = dropping ? "Stop on the doormat" : loading ? "Stop to load" : g.delivery.winter ? "Stop at the depot" : "Stop to unload";
  if (showStop) {
    const progress = g.stopProgress();
    $("stopbar").style.width = (progress * 100).toFixed(0) + "%";
    if (progress > 0.02 && progress < 1 && g.time - lastTick > 0.3) { lastTick = g.time; play("stop_tick", 0.35, 0.9 + progress * 0.4); }
  }
}

function finishDelivery(g) {
  engineSound(null, false);
  const r = SH.report(g), d = state.delivery, today = localDate();
  if (d.winter) return finishWinterRun(r,d);
  const s = save.stats;
  s.metres += Math.round(Math.max(0, g.truck.getPosition().x - 8));
  s.bestAir = Math.max(s.bestAir, r.bestAir);
  s.topSpeed = Math.max(s.topSpeed, r.topSpeed);
  s.landings += r.landings || 0;
  // Mastery grows with distance driven on a delivery made, or any Long Haul.
  const truckId = g.spec.id, mBefore = masteryLevel(truckId);
  let masteryPay = 0, masteryUp = 0;
  if ((r.status === "done" || d.long) && save.trucks.includes(truckId)) {
    save.mastery[truckId] = (save.mastery[truckId] || 0) + r.metres;
    masteryPay = Math.round(r.earned * masteryBonus(truckId));
    if (masteryPay) { save.coins += masteryPay; s.earned += masteryPay; }
    if (masteryLevel(truckId) > mBefore) masteryUp = masteryLevel(truckId);
  }
  const newPaints = masteryUp ? PAINTS.filter((p) => p.how.truck === truckId && p.how.level > mBefore && p.how.level <= masteryUp) : [];
  save.coins += r.earned; s.earned += r.earned;
  const beforeRegion = maxRegion();
  let streakLine = "", longBest = false, gift = "", orderPay = 0, tip = 0, cupLine = "";
  const milestones = [];
  if (d.long) {
    s.longBest = Math.max(s.longBest, r.metres); s.longMetres += r.metres;
    // Every 250 m reached for the first time in a region pays once.
    const reg = d.region, before = save.longMile[reg] || 0, mile = Math.floor(r.metres / 250);
    for (let k = before + 1; k <= mile; k++) { const pay = Math.round(20 * k * SH.REGIONS[reg].pay); milestones.push({ m: k * 250, pay }); save.coins += pay; s.earned += pay; }
    save.longMile[reg] = Math.max(before, mile);
    save.longBest[reg] = Math.max(save.longBest[reg] || 0, r.metres);
    if (r.score > (save.long[r.truck] || 0)) { save.long[r.truck] = r.score; longBest = r.score > 0; }
  } else if (r.status === "done") {
    s.deliveries += 1; s.crates += r.kept; s.eggs += r.kinds.eggs;
    s.melons += r.kinds.melon; s.cakes += r.kinds.cake; s.popcorn += r.kinds.popcorn;
    if (r.time <= r.par) s.coldIcecream += r.kinds.icecream;
    if (r.featMax && r.featMax.bridge != null) s.bridges += 1;
    if (r.truck === "tuktuk" && r.stars === 3 && d.region > 0) s.tuktukAway += 1;
    if (d.order) {
      // A Special Order: paid and a depot part given the first time, with two stars.
      if (r.stars >= 2 && !save.orders[d.id]) {
        save.orders[d.id] = true; save.parts += 1;
        orderPay = Math.round(30 * SH.REGIONS[d.region].pay);
        save.coins += orderPay; s.earned += orderPay;
      }
      if (d.twist === "rush" && r.stars >= 2 && r.time <= r.medals.gold && !r.dockHit) {
        tip = Math.round(10 * SH.REGIONS[d.region].pay);
        save.coins += tip; s.earned += tip;
      }
    } else if (d.daily) {
      if (save.daily.last !== today) {
        const y = new Date(Date.now() - 864e5);
        const yesterday = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
        save.daily.streak = save.daily.last === yesterday ? save.daily.streak + 1 : 1;
        save.daily.last = today;
        streakLine = save.daily.streak + "-day daily streak";
        if (save.daily.streak % 7 === 0) { save.coins += 150; s.earned += 150; streakLine += ": a full week! +150"; }
      }
    } else {
      if (r.stars > (save.stars[d.id] || 0)) save.stars[d.id] = r.stars;
      if (!save.best[d.id] || r.time < save.best[d.id]) { if (save.best[d.id] && r.stars >= 2) setTimeout(() => play("saved", 0.6), 2000); save.best[d.id] = Math.round(r.time * 10) / 10; }
      if (r.express) save.express[d.id] = true;
      if (r.medal > (save.medal[d.id] || 0)) save.medal[d.id] = r.medal;
      // Keep the pedals of the fastest run, for the ghost.
      // The ghost replays these pedals through the same physics, so it needs the upgrades too.
      if (d.cup && d.cup === save.cup.week && r.stars >= 2 && !r.dockHit) {
        const t = Math.round(r.time * 10) / 10, c = cup();
        if (!save.cup.best[d.id] || t < save.cup.best[d.id]) save.cup.best[d.id] = t;
        const total = cupTotal(c), tier = cupTier(c), got = c.legs.filter((x) => save.cup.best[x.id]).length;
        cupLine = "Weekly Cup leg: " + t + "s" + (total != null ? ". Total " + total + "s" : ". " + got + " of 5 legs done");
        ["bronze", "silver", "gold"].forEach((k) => {
          if (tier && ["bronze", "silver", "gold"].indexOf(k) <= ["bronze", "silver", "gold"].indexOf(tier) && !save.cup.paid[k]) {
            save.cup.paid[k] = true; save.coins += CUP_PAY[k]; s.earned += CUP_PAY[k]; cupLine += ". " + k[0].toUpperCase() + k.slice(1) + " cup +" + CUP_PAY[k];
            if (k === "gold") s.cupGolds = (s.cupGolds || 0) + 1;
          }
        });
      } else if (d.cup) cupLine = "Cup legs count with two stars and a clean stop.";
      if (save.best[d.id] === Math.round(r.time * 10) / 10 && g.rec.length < 6000) save.ghost[d.id] = { v: 2, rev: d.rev || 1, cargoPhysics: g.cargoPhysics, truck: r.truck, upgrades: Object.assign({}, save.upgrades), rec: g.rec.slice(), time: r.time };
    }
    // Bakery Hills 4 is the first route where a bare truck loses its load, so the farm hands over spare straps first.
    if (d.id === "bakery-3" && !save.gifts.straps) gift = giveStraps();
    if (save.tutorial < 1 && d.id === "bakery-1") save.tutorial = 1;
    else if (save.tutorial < 2 && d.id === "bakery-2") save.tutorial = 2;
  } else s.failed += 1;
  // Route challenge: paid once, the first time it is met.
  const ch = !d.long && !d.daily ? SH.challengeFor(d.id) : null;
  let chPay = 0;
  // The golden crumb: three stars, gold and the route challenge, all in one run.
  const crumbNew = !!ch && !d.order && !d.cup && r.stars === 3 && r.medal === 3 && SH.challengeMet(ch, r) && !save.crumb[d.id];
  if (crumbNew) { save.crumb[d.id] = true; save.coins += 25; s.earned += 25; }
  if (ch && !save.challenge[d.id] && SH.challengeMet(ch, r)) {
    save.challenge[d.id] = true;
    chPay = Math.round(20 * SH.REGIONS[d.region].pay);
    save.coins += chPay; s.earned += chPay;
  }
  // The rival: paid once, the first time you beat his time with a clean delivery.
  const raced = state.ghost && state.ghost.kind === "rival" ? state.ghost.rival : null;
  let rivalLine = "", rivalPay = 0;
  if (raced) {
    const gap = Math.abs(r.time - raced.t).toFixed(1);
    if (r.status === "done" && r.stars >= 2 && !r.dockHit && r.time < raced.t) {
      save.rival[d.id] = true;
      rivalPay = Math.round(15 * SH.REGIONS[d.region].pay);
      save.coins += rivalPay; s.earned += rivalPay;
      rivalLine = "You beat " + RIVAL + " by " + gap + "s +" + rivalPay;
    } else if (r.status === "done" && r.time < raced.t) rivalLine = "Faster than " + RIVAL + ", but it only counts with two stars and a clean stop";
    else if (r.status === "done") rivalLine = RIVAL + " was " + gap + "s faster";
  }
  // Your own ghost: same rules as the rival, so it only counts with two stars and a clean stop.
  const mine = state.ghost && state.ghost.kind === "mine" ? state.ghost : null;
  let ghostLine = "", beatGhost = false;
  if (mine && r.status === "done") {
    const gap = Math.abs(r.time - mine.time).toFixed(1);
    if (r.time < mine.time && r.stars >= 2 && !r.dockHit) { beatGhost = true; save.ghostWins[d.id] = true; ghostLine = "You beat your ghost by " + gap + "s"; }
    else if (r.time < mine.time) ghostLine = "Faster than your ghost, but it only counts with two stars and a clean stop";
    else ghostLine = gap === "0.0" ? "Dead level with your ghost" : "Your ghost was " + gap + "s faster";
  }
  // Fast lane: three stars on the very first try at route 1 offers route 3 straight away.
  const fastLane = d.id === "bakery-1" && r.stars === 3 && !save.stars["bakery-2"] && !save.stars["bakery-3"] && s.deliveries === 1;
  askForReview(r, d);
  const stageNow = depotStage(), stageUp = d.order && orderPay && DEPOT_PARTS[stageNow - 1] === save.parts && stageNow > 1 ? stageNow : 0;
  r.beatRival = rivalPay > 0; r.beatGhost = beatGhost; r.challengeDone = chPay > 0; r.orderDone = !!d.order && r.status === "done" && r.stars >= 2;
  const done = countJobs(r);
  s.contracts += done.length;
  const goals = checkGoals(r);
  const newRegion = maxRegion() > beforeRegion ? SH.REGIONS[maxRegion()].name : null;
  persist();

  const why = { load: "Too much of the load is gone. You need " + g.need + " of " + r.total + " to make the delivery.", flip: "The truck ended up on its roof.", fuel: "You ran out of fuel." }[r.reason] || "";
  const list = r.lines.map((l) => `<li><span>${esc(l.label)}</span><b>+${l.coins}</b></li>`).join("");
  const next = d.daily || d.long || d.order || d.cup ? null : following(d);
  const medalName = ["", "Bronze", "Silver", "Gold"][r.medal];
  const canAdvance = r.status === "done" && next && !routePaid(next);
  // After a lost load, point to the garage when an upgrade is affordable.
  const toGarage = (r.status !== "done" && !d.long && r.reason !== "flip" && cheapestUpgrade() && save.coins >= cheapestUpgrade().cost) ||
    (d.id === "bakery-2" && r.status === "done" && !save.gifts.garageTip && bestNext() && save.coins >= bestNext().cost && (save.gifts.garageTip = true));
  const stars = "★".repeat(r.stars) + "☆".repeat(3 - r.stars);
  sheet.innerHTML = `<h2>${d.long ? "Long Haul: " + r.metres + " m" : r.status === "done" ? "Delivered!" : "Delivery failed"}</h2>
    ${d.long ? `<p>Score ${r.score}${longBest ? ". New best for this truck!" : ", best " + (save.long[r.truck] || 0) + "."} Best distance in ${esc(SH.REGIONS[d.region].name)}: ${save.longBest[d.region] || 0} m</p>` : `<div class="stars" aria-label="${r.stars} stars">${[...stars].map((c) => `<span>${c === "★" ? ico("star_on", c, "ico star") : ico("star_off", c, "ico star")}</span>`).join("")}</div>`}
    ${why && !d.long ? `<p>${esc(why)}</p>` : ""}
    ${r.dockHit && r.status === "done" && !d.long ? "<p>You hit the depot wall, so no medal this time. Brake and stop inside the arrows.</p>" : ""}
    ${r.missedPickup ? "<p>You drove past the pickup stop, so those loads were left behind.</p>" : ""}
    ${r.status === "done" && !d.long ? `<p>${r.time.toFixed(1)}s${medalName ? ", " + ico("medal_" + medalName.toLowerCase()) + " " + medalName + " medal" : ""}. Gold ${r.medals.gold}s, silver ${r.medals.silver}s, bronze ${r.medals.bronze}s</p>` : ""}
    ${list ? `<ul class="lines">${list}<li class="total"><span>Earned</span><span>${ico("coin", "🪙")} ${r.earned}</span></li></ul>` : ""}
    ${masteryPay ? `<div class="unlocked">${ico("garage", "🚚")} ${esc(SH.truckSpec(truckId).name)} mastery ${masteryLevel(truckId)} bonus +${masteryPay}</div>` : ""}
    ${masteryUp ? `<div class="unlocked">${ico("garage", "🚚")} ${esc(SH.truckSpec(truckId).name)} reached mastery level ${masteryUp}</div>` : ""}
    ${newPaints.map((p) => `<div class="unlocked">${ico("paint", "🎨")} New paint: ${esc(p.name)}</div>`).join("")}
    ${orderPay ? `<div class="unlocked">${SH.CUSTOMERS[d.customer].icon} ${esc(SH.CUSTOMERS[d.customer].name)} is delighted +${orderPay}, and a depot part</div>` : ""}
    ${milestones.map((x) => `<div class="unlocked">${ico("long_haul", "🛣️")} First time past ${x.m} m here +${x.pay}</div>`).join("")}
    ${cupLine ? `<div class="${/cup \+/.test(cupLine) ? "unlocked" : "challenge"}">${ico("medal_gold", "🏆")} ${esc(cupLine)}</div>` : ""}
    ${stageUp ? `<div class="unlocked">${ico("garage", "🏗️")} Your depot grew: ${esc(DEPOT_STAGES[stageUp - 1])}</div>` : ""}
    ${tip ? `<div class="unlocked">${ico("clock", "⏱️")} Rush tip +${tip}</div>` : ""}
    ${d.order && r.status === "done" && r.stars < 2 && !save.orders[d.id] ? `<p class="challenge">${esc(SH.CUSTOMERS[d.customer].name)} needs at least two stars.</p>` : ""}
    ${rivalLine ? `<div class="${rivalPay ? "unlocked" : "challenge"}">${ico("ghost", "🏁")} ${esc(rivalLine)}</div>` : ""}
    ${ghostLine ? `<div class="${beatGhost ? "unlocked" : "challenge"}">${ico("ghost", "👻")} ${esc(ghostLine)}</div>` : ""}
    ${crumbNew ? `<div class="unlocked">${ico("medal_crumb", "✨")} Golden crumb! Three stars, gold and the challenge in one run +25</div>` : ""}
    ${chPay ? `<div class="unlocked">${ico("challenge", "🎯")} Challenge done: ${esc(SH.challengeText(ch))} +${chPay}</div>` : ""}
    ${ch && !save.challenge[d.id] && r.status === "done" ? `<p class="challenge">${ico("challenge", "🎯")} Challenge: ${esc(SH.challengeText(ch))}</p>` : ""}
    ${gift ? `<div class="unlocked">${ico("up_straps", "🪢")} ${esc(gift)}</div>` : ""}
    ${streakLine ? `<div class="unlocked">${ico("daily", "📅")} ${esc(streakLine)}</div>` : ""}
    ${newRegion ? `<div class="unlocked">${ico("map", "🗺️")} New region: ${esc(newRegion)}</div>` : ""}
    ${done.map((c) => `<div class="unlocked">${ico("contracts", "📋")} ${esc(c.text)} +${c.pay}</div>`).join("")}
    ${goals.map((g2) => `<div class="unlocked">${ico("goal_" + g2.id, g2.icon)} ${esc(g2.name)} +${g2.coins}</div>`).join("")}
    ${r.status !== "done" && !d.long ? `<p>${esc(failTip(r))}</p>` : ""}
    ${offerCard(r, d)}
    ${d.daily ? `<p class="nextbest">${ico("daily", "📅")} Tomorrow: ${esc(SH.REGIONS[SH.dailyRegion(localDate(new Date(Date.now() + 864e5)))].name)}.</p>` : ""}
    ${fastLane ? `<div class="unlocked">Three stars first time. You can skip ahead to Egg Farm Drop. <button class="btn" data-act="skip" style="margin-top:6px">Skip ahead</button></div>` : ""}
    ${nextBest(r, d) ? `<p class="nextbest">${esc(nextBest(r, d))}</p>` : ""}
    <div class="row" style="margin-top:8px">
      ${canAdvance ? '<button class="btn primary" data-act="next">Next delivery</button>' : ""}
      <button class="btn${canAdvance || toGarage ? "" : " primary"}" data-act="retry">${d.long ? "Same road" : "Try again"}</button>
      ${d.long ? '<button class="btn" data-act="newroad">New road</button>' : ""}
      <button class="btn${toGarage && !canAdvance ? " primary" : ""}" data-act="garage">${toGarage && bestNext() ? "Garage: " + esc(bestNext().name) + " next" : "Garage"}</button>
    </div>`;
  veil.classList.add("on");
  engineLoops(null); roadLoops(null);
  if (r.status === "done" && !d.long) for (let i = 0; i < r.stars; i++) setTimeout(() => play("star", 0.6, 1 + i * 0.08), 500 + i * 170);
  if (r.medal) setTimeout(() => play("medal", 0.7), 1150);
  if (goals.length) setTimeout(() => play("goal", 0.7), 1500);
  if (done.length) setTimeout(() => play("contract_done", 0.7), 1800);
  if (r.status === "done" || d.long) play("delivered", 0.9) || [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.24, "triangle", 0.07, i * 0.1));
  else play("failed", 0.8) || [294, 247].forEach((f, i) => beep(f, 0.3, "triangle", 0.07, i * 0.16));
  $("drive").hidden = true;
}
function finishWinterRun(report, delivery) {
  const { rewards, coins } = finishWinter(save,delivery.eventKey,delivery,report,masteryLevel);
  persist();
  const done=report.status==="done";
  const reason={porches:"No porches received a load. Brake before the doormat and stop until the meter fills.",
    flip:"The truck ended up on its roof.",fuel:"You ran out of fuel."}[report.reason] || "";
  const next=delivery.orderKind==="route" && SH.WINTER_ROUTES[delivery.index+1];
  const event=currentEvent();
  const canAdvance=done && next && event && canStartWinter(event,seasonProgress(save,event.key),next,sleighOwned());
  sheet.innerHTML = `<h2>${done ? "Present round complete" : "Delivery failed"}</h2>
    <div class="stars" aria-label="${report.stars} stars">${"★".repeat(report.stars)}${"☆".repeat(3-report.stars)}</div>
    <p>${report.kept} of ${report.total} homes visited · ${coins} coins</p>
    ${reason ? `<p>${esc(reason)}</p>` : ""}
    ${rewards.map((reward)=>`<div class="unlocked">${esc(reward)}</div>`).join("")}
    ${delivery.orderKind==="workshop" && report.stars<2 ? "<p>Earn two stars to complete this order.</p>" : ""}
    <div class="row">
      ${canAdvance ? '<button class="btn primary" data-act="winter-next">Next route</button>' : ""}
      <button class="btn" data-act="retry">Try again</button>
      <button class="btn" data-act="winter">Back to Winter Haul</button>
    </div>`;
  veil.classList.add("on"); driveEl.hidden=true;
  engineLoops(null); roadLoops(null);
  if (done) play("jingle_sting",.7) || [523,659,784].forEach((f,i)=>beep(f,.16,"triangle",.07,i*.09));
  else play("failed",.6);
}

function giveStraps() {
  save.gifts.straps = true;
  if (level("straps") >= 1) return "";
  save.upgrades.straps = 1;
  persist();
  if (state.mode !== "result") toast("The egg farm gave you spare straps!", 2200);
  return "The egg farm gave you spare straps: Cargo Straps level 1";
}
// The garage's "Best next": straps first, then suspension and tyres. More engine
// throws more cargo, so it waits until Cargo Straps reach level 2.
function bestNext() {
  const order = level("straps") < 2 ? ["straps"] : ["suspension", "tyres", "straps", "engine", "tank"];
  const pick = order.map((id) => SH.UPGRADES.find((u) => u.id === id)).find((u) => SH.upgradeCost(level(u.id)) != null);
  return pick ? { id: pick.id, name: pick.name, level: level(pick.id) + 1, cost: SH.upgradeCost(level(pick.id)) } : null;
}
// A store review is asked for once, after a good run on route 5 or a Dunes road,
// never after a failure, and never in the same session as the unlock sheet.
function askForReview(r, d) {
  if (!nativeApp || save.gifts.review || state.offerShown || r.stars < 3) return;
  if (d.id !== "bakery-5" && d.region !== 1) return;
  save.gifts.review = true;
  setTimeout(() => tellApp({ type: "review" }), 2600);
}
function cheapestUpgrade() {
  return SH.UPGRADES.map((u) => ({ name: u.name, level: level(u.id) + 1, cost: SH.upgradeCost(level(u.id)) })).filter((u) => u.cost != null).sort((a, b) => a.cost - b.cost)[0] || null;
}
// One line on what is closest: a medal, the last stars, or the next upgrade.
function nextBest(r, d) {
  if (d.long || d.daily || d.order) return "";
  if (r.status === "done" && r.stars === 3 && r.medal < 3 && !r.dockHit) {
    const target = r.medal === 2 ? r.medals.gold : r.medal === 1 ? r.medals.silver : r.medals.bronze;
    const gap = r.time - target;
    if (gap > 0 && gap < 15) return (["Bronze", "Silver", "Gold"][r.medal]) + " is " + gap.toFixed(1) + "s faster.";
  }
  if (r.status === "done" && r.stars < 3) return "Keep the whole load for three stars" + (r.time <= r.medals.gold ? ", and the gold is yours." : ".");
  const ch = SH.challengeFor(d.id);
  if (r.status === "done" && r.medal === 3 && ch && !save.challenge[d.id]) return "Next: the route challenge.";
  const u = bestNext() || cheapestUpgrade();
  if (!u) return "";
  return save.coins >= u.cost ? "You can afford " + u.name + " level " + u.level + " in the garage." : (u.cost - save.coins) + " coins to " + u.name + " level " + u.level + ".";
}
function failTip(r) {
  if (r.reason === "fuel") return "Fuel Tank upgrades help, and so does coasting downhill.";
  if (r.reason === "flip") return "Ease off before steep crests, and use BRAKE in the air to level out.";
  return level("straps") < 2 ? "Cargo Straps in the garage hold your load down." : "Slow down before crests and let the truck settle.";
}
function following(d) {
  const i = SH.DELIVERIES.findIndex((item)=>item.id===d.id), n = SH.DELIVERIES[i + 1];
  return n && SH.isOpen(n.id, save.stars) ? n : null;
}
function toMenu(screen) {
  veil.classList.remove("on");
  driveEl.hidden = true;
  state.mode = "menu"; state.game = null; state.screen = screen || "home";
  engineLoops(null); roadLoops(null); setMusic(menuMusic());
  engineSound(null, false);
  renderScreen();
  kick();
}
// ════ Unlock sheet ════════════════════════════════════════════════
// The paid set, counted from the game data.
function paidCounts() {
  const routes = SH.DELIVERIES.filter((d) => !SH.isFree(d.id)).length;
  return { routes, regions: SH.REGIONS.length - 1, orders: SH.ORDERS.filter((o) => o.region > 0).length, trucks: SH.TRUCKS.filter((t) => !FREE_TRUCKS.includes(t.id)) };
}
// The offer on the results card, at the moments it helps: the last free Dunes road,
// all 24 Bakery stars, and the free roads all driven. At most once a session.
function offerCard(r, d) {
  if (!paywalled() || r.status !== "done" || state.offerShown) return "";
  const c = paidCounts(), bakery = regionStars(0);
  let title = "";
  if (d.id === "dunes-2") title = totalStars() + " stars so far. " + c.routes + " more roads are open with the full game";
  else if (d.region === 0 && bakery === 24 && !save.gifts.bakery24) { save.gifts.bakery24 = true; title = "All 24 Bakery stars! Dairy Dunes and four more regions are next"; }
  else if (!SH.FREE_ROUTES.some((id) => !save.stars[id]) && !d.daily) title = "You've driven every free road. " + c.routes + " more are waiting";
  if (!title) return "";
  state.offerShown = true;
  return `<div class="offer"><b>${esc(title)}</b>${nativeApp ? "One payment. No ads. Every future road included." : "The full game is on Google Play."}
    <button class="btn primary" data-unlock="results">${nativeApp ? "See the full game" : "Get it on Google Play"}</button></div>`;
}
const regionStrip = () => `<div class="strip">${SH.REGIONS.slice(1).map((r) => `<i style="background-image:url('${artUrl("region_" + r.id)}')"><span>${esc(r.name)}</span></i>`).join("")}</div>`;
function unlockSheet() {
  const price = billing.price || "";
  // Same shape as the other apps' custom unlock screens: hero, what you get, one-time
  // price, restore, and a plain message when the store can't be reached.
  if (save.pro) {
    sheet.innerHTML = `${artUrl("unlock_hero") ? `<div class="unlock-hero" style="background-image:url('${artUrl("unlock_hero")}')"></div>` : ""}
      <h2>You're all set</h2><p>Every region, Special Order, Long Haul and truck is open, and the Bread Van is parked in your garage. Thanks for supporting Snack Haul.</p>
      <div class="row" style="margin-top:10px"><button class="btn primary" data-act="unlock-close">Let's drive</button></div>`;
    return;
  }
  const c = paidCounts(), from = state.unlockFrom;
  const title = from === "truck" ? "Keep every truck" : from === "route" || from === "routes" ? "Open every road" : from === "long" ? "Long Haul everywhere" : from === "orders" ? "Meet every customer" : "Unlock the full game";
  const list = `<ul class="lines">
      <li><span>${c.regions} more regions and ${c.routes} more routes</span><b>✓</b></li>
      <li><span>${c.orders} Special Orders from ${c.regions} customers</span><b>✓</b></li>
      <li><span>${c.trucks.map((t) => t.name).join(", ")}. The Bread Van is yours straight away</span><b>✓</b></li>
      <li><span>Long Haul in every region</span><b>✓</b></li>
      <li><span>Future regions included</span><b>✓</b></li>
    </ul>`;
  if (!nativeApp) {
    sheet.innerHTML = `<h2>${esc(title)}</h2>${regionStrip()}${list}
      <div class="row" style="margin-top:10px"><button class="btn primary" data-act="play">Get it on Google Play</button><button class="btn" data-act="unlock-close">Not now</button></div>
      <p class="note">This web demo has the free part of the game. The full game is on Google Play: one payment, no ads.</p>`;
    return;
  }
  const unavailable = !billing.ready && billing.waited;
  const buy = billing.busy ? "Waiting for Google Play…" : unavailable ? "Try again" : !billing.ready ? "Loading the store…" : "Unlock" + (price ? " for " + price : "");
  sheet.innerHTML = `${artUrl("unlock_hero") ? `<div class="unlock-hero" style="background-image:url('${artUrl("unlock_hero")}')"><span class="badge-one">One-time</span></div>` : ""}
    <h2>${esc(title)}</h2>${regionStrip()}${list}
    ${billing.note ? `<p class="challenge">${esc(billing.note)}</p>` : unavailable ? `<p class="challenge">The store price isn't available right now. You can keep playing and try again later.</p>` : ""}
    <div class="row" style="margin-top:10px">
      <button class="btn primary" ${unavailable ? "data-retry" : "data-buy"}${billing.busy || (!billing.ready && !unavailable) ? " disabled" : ""}>${esc(buy)}</button>
      <button class="btn" data-restore${billing.busy ? " disabled" : ""}>Restore purchase</button>
      <button class="btn" data-act="unlock-close">Not now</button>
    </div>
    <p class="note">One payment. No ads. Every future road included.</p>`;
}
// Ask the app for the price; if it hasn't come within 6 s, say so and offer Try again.
function askForPrice() {
  billing.waited = false;
  tellApp({ type: "billing-hello" });
  clearTimeout(state.priceTimer);
  state.priceTimer = setTimeout(() => { if (!billing.ready) { billing.waited = true; if (state.unlockOpen) unlockSheet(); } }, 6000);
}
function showUnlock(from) {
  if (!paywalled()) return;
  state.unlockOpen = true; state.unlockFrom = from; state.offerShown = true;
  billing.note = "";
  if (nativeApp && !billing.ready) askForPrice();
  unlockSheet();
  veil.classList.add("on");
}
function closeUnlock() {
  state.unlockOpen = false;
  veil.classList.remove("on");
  if (state.mode === "result") toMenu("home"); else if (state.mode === "menu") renderScreen();
}
// The app answers with { ready, price, pro, busy, note }.
window.SnackHaulBilling = (b) => {
  const wasPro = !!save.pro;
  Object.assign(billing, b);
  if (typeof b.pro === "boolean" && b.pro !== wasPro) {
    save.pro = b.pro;
    // The owner's gift: the Bread Van, so the garage changes the moment the game is bought.
    if (b.pro && !save.gifts.van) { save.gifts.van = true; if (!save.trucks.includes("van")) save.trucks.push("van"); }
    persist();
    if (b.pro) { toast("Full game unlocked! The Bread Van is in your garage.", 2600); play("unlock", 0.8) || play("goal", 0.7); }
  }
  if (state.unlockOpen) unlockSheet();
  else if (state.mode === "menu") renderScreen();
};
function buyFullGame() { billing.busy = true; billing.note = ""; unlockSheet(); tellApp({ type: "buy" }); }
function restoreFullGame() { billing.busy = true; billing.note = ""; if (state.unlockOpen) unlockSheet(); tellApp({ type: "restore" }); }
tellApp({ type: "billing-hello" });

function pause() {
  if (state.mode !== "drive") return;
  state.mode = "paused";
  engineSound(null, false);
  const d = state.delivery, ch = d && !d.long && !d.daily && !d.winter ? SH.challengeFor(d.id) : null;
  const what = d.order ? SH.orderText(d) : ch ? "Challenge: " + SH.challengeText(ch) + (save.challenge[d.id] ? " ✓" : "") : "";
  const m = state.game.medals;
  sheet.innerHTML = `<h2>Paused</h2>${what ? `<p class="challenge">${esc(what)}</p>` : ""}${d.long || d.winter ? "" : `<p>Gold ${m.gold}s with the whole load, silver ${m.silver}s, bronze ${m.bronze}s.</p>`}
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="resume">Keep driving</button><button class="btn" data-act="retry">Restart</button><button class="btn" data-act="home">Home</button><button class="btn" data-act="settings">Settings</button></div>`;
  veil.classList.add("on");
}
sheet.addEventListener("click", (e) => {
  if (e.target.closest("[data-buy]") && !e.target.closest("[data-buy]").disabled) return buyFullGame();
  if (e.target.closest("[data-retry]")) { askForPrice(); return unlockSheet(); }
  if (e.target.closest("[data-restore]") && !e.target.closest("[data-restore]").disabled) return restoreFullGame();
  if (e.target.closest("[data-unlock]")) return showUnlock(e.target.closest("[data-unlock]").dataset.unlock);
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const a = b.dataset.act;
  ensureAudio();
  if (a === "unlock-close") return closeUnlock();
  if (a === "winter") return toMenu(currentEvent() ? "winter" : "home");
  if (a === "winter-next") return startDelivery(SH.WINTER_ROUTES[state.delivery.index+1]);
  if (a === "garage") { state.unlockOpen = false; toMenu("garage"); }
  if (a === "home") { state.unlockOpen = false; toMenu("home"); }
  if (a === "settings") { state.unlockOpen = false; toMenu("settings"); }
  if (a === "play") { state.unlockOpen = false; return location.assign(PLAY_URL); }
  if (a === "skip") return startDelivery(SH.findDelivery("bakery-3"));
  // Long Haul: the same road again, or a new one.
  if (a === "retry") startDelivery(state.delivery);
  if (a === "newroad") startDelivery(SH.longHaul(state.delivery.region, Date.now().toString(36)));
  if (a === "next") startDelivery(following(state.delivery));
  if (a === "resume") { veil.classList.remove("on"); state.mode = "drive"; kick(); }
  // An empty save with a newer timestamp, so an older copy held by the app can never win.
  if (a === "reset-yes") { try { localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now() })); } catch (x) { /* ignore */ } tellApp({ type: "reset" }); setTimeout(() => location.reload(), 150); }
  if (a === "close") veil.classList.remove("on");
});
$("pause").addEventListener("click", pause);
// Restart at once in the first seconds of a run; after that, through the pause sheet.
$("restart").addEventListener("click", () => { if (state.mode !== "drive") return; if (state.game.time < 5) startDelivery(state.delivery); else pause(); });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  else if (state.mode==="menu" && world) renderScreen();
});

// The app calls these for the Android back button and when it goes to the background.
window.SnackHaulBack = () => {
  if (state.mode === "drive") return pause();
  if (state.mode === "paused") { veil.classList.remove("on"); state.mode = "drive"; return kick(); }
  if (state.unlockOpen) return closeUnlock();
  if (state.mode === "result") return toMenu(state.delivery?.winter && currentEvent() ? "winter" : "home");
  if (veil.classList.contains("on")) return veil.classList.remove("on");
  if (state.screen !== "home") return toMenu("home");
  tellApp({ type: "exit" });
};
// Debug and recording builds only: the app sets SNACKHAUL_DEBUG when built with
// EXPO_PUBLIC_WEBVIEW_DEBUG=1. The website never does, so this does not exist there.
if (window.SNACKHAUL_DEBUG) window.SnackHaulDebug = {
  autopilot: (speed) => { state.autopilot = speed || 0; if (!speed) state.input.gas = state.input.brake = false; },
  fps: (cap) => { state.frameCap = cap ? 1000 / cap : 0; }
};
window.SnackHaulPause = () => { pause(); if (audio.ctx && audio.ctx.state === "running") audio.ctx.suspend(); };
window.SnackHaulResume = () => { if (audio.ctx && save.sound) audio.ctx.resume(); };

// ════ Controls: each pedal tracks its own pointers, so both work together ═
function syncPedals() {
  $("gas").classList.toggle("on", state.input.gas);
  $("brake").classList.toggle("on", state.input.brake);
}
function bindPedal(button, name) {
  const held = new Set();
  const update = () => { state.input[name] = held.size > 0; syncPedals(); };
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault(); held.add(e.pointerId);
    try { button.setPointerCapture(e.pointerId); } catch (x) { /* synthetic pointer */ }
    ensureAudio(); update();
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => button.addEventListener(type, (e) => { held.delete(e.pointerId); update(); }));
  button.addEventListener("contextmenu", (e) => e.preventDefault());
}
bindPedal($("gas"), "gas"); bindPedal($("brake"), "brake");
const KEYS = { ArrowRight: "gas", KeyD: "gas", ArrowLeft: "brake", KeyA: "brake" };
const HORNS = { pickup: "horn_pickup", van: "horn_pickup", hauler: "horn_monster", monster: "horn_monster", tuktuk: "horn_tuktuk", buggy: "horn_tuktuk" };
function horn() {
  if (state.mode !== "drive") return;
  if (state.game.spec.runners) play("horn_sleigh",.65) || [682,886,1082].forEach((f,i)=>beep(f,.20,"triangle",.05,i*.07));
  else play(HORNS[state.game.spec.id] || "horn_pickup",.7);
}
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyH" && !e.repeat) horn();
  if (KEYS[e.code] && state.mode === "drive") { state.input[KEYS[e.code]] = true; syncPedals(); e.preventDefault(); }
  if (e.code === "Escape") pause();
});
window.addEventListener("keyup", (e) => { if (KEYS[e.code]) { state.input[KEYS[e.code]] = false; syncPedals(); } });

// ════ Screens ═════════════════════════════════════════════════════
function renderScreen() {
  ({ home: homeScreen, routes: routesScreen, orders: ordersScreen, long: longScreen, events: eventsScreen, winter: winterScreen, garage: garageScreen, goals: goalsScreen, settings: settingsScreen })[state.screen]();
  refreshShowcase();
}
const purse = () => `<div class="purse"><span class="pill">${ico("coin", "🪙")} ${save.coins}</span><span class="pill">${ico("star_on", "★")} ${totalStars()}/${SH.DELIVERIES.length * 3}</span></div>`;
const panelHead = (title) => `<div class="phead"><button class="back" data-nav="home">${ico("home", "←")} Back</button><h2>${esc(title)}</h2>${purse()}</div>`;

function homeScreen() {
  const n = nextRoute(), today = localDate(), doneToday = save.daily.last === today;
  // Every free road driven: the Drive button becomes the road ahead.
  const freeDone = paywalled() && !SH.FREE_ROUTES.some((id) => !save.stars[id]) && SH.DELIVERIES.some((d) => routePaid(d) && SH.isOpen(d.id, save.stars));
  ui.innerHTML = `<div class="home">
    <div class="topbar"><div class="brand"><h1>${artUrl("logo") ? `<img class="logo" src="${artUrl("logo")}" alt="Snack Haul">` : "Snack Haul"}</h1><p>Get the load there in one piece.</p></div>${purse()}</div>
    <div class="menu">
      ${freeDone ? `<button class="btn primary mapcard" data-unlock="map"${artUrl("map") ? ` style="background-image:linear-gradient(90deg,#ffc94dee 45%,#ffc94d44),url('${artUrl("map")}')"` : ""}>The road ahead<small>${SH.FREE_ROUTES.length} free roads done. Honey Harbour, Frosty Pass and more are next</small></button>` :
      `<button class="btn primary" data-nav="play">Drive<small>${esc(SH.REGIONS[n.region].name)} ${n.index + 1}: ${esc(n.name)}</small></button>`}
      <button class="btn" data-nav="events">${ico("daily")} Daily and weekly<small>${doneToday ? "Daily done · " + save.daily.streak + "-day streak" : "World Tour: " + esc(SH.REGIONS[SH.dailyRegion(today)].name) + " +" + SH.BALANCE.dailyPay}${cupTier(cup()) ? " · " + cupTier(cup()) + " cup" : ""}</small></button>
      <button class="btn" data-nav="long">${ico("long_haul")} Long Haul<small>${Object.keys(save.longBest).length ? "Best " + Math.max(...Object.values(save.longBest)) + " m" : "How far can you get?"}</small></button>
      <button class="btn" data-nav="orders">${ico("contracts", "📋")} Special Orders<small>${ordersReady() ? '<i class="dot"></i> ' + esc(SH.CUSTOMERS[SH.ORDERS.find((o) => orderOpen(o) && !save.orders[o.id]).customer].name) + " has an order" : Object.keys(save.orders).length + " of " + SH.ORDERS.length + " done"}</small></button>
      ${currentEvent() ? `<button class="btn winter-entry"${artUrl("event_winter") ? ` style="--winter-art:url('${artUrl("event_winter")}')"` : ""} data-nav="winter">${ico("event_winter","❄")} Winter Haul<small>North Pole · Advent calendar</small></button>` : ""}
      <div class="dock">
        <button class="btn" data-nav="routes">${ico("routes")} Routes</button>
        <button class="btn" data-nav="garage">${ico("garage")} Garage</button>
        <button class="btn" data-nav="goals">${ico("goals")} Goals</button>
        <button class="btn" data-nav="settings" aria-label="Settings">${ico("settings", "⚙️")}</button>
      </div>
    </div></div>`;
}

// ════ Customers and Special Orders ════════════════════════════════
function orderOpen(o) { return regionFull(o.region) && SH.repLevel(o.region, save.stars) > o.slot; }
function ordersReady() { return SH.ORDERS.some((o) => orderOpen(o) && !save.orders[o.id]); }
function ordersScreen() {
  const cards = SH.CUSTOMERS.map((c, r) => {
    const region = SH.REGIONS[r];
    if (r > 0 && paywalled()) return `<button class="customer locked" data-unlock="orders"><b>${ico("lock", "🔒")} ${esc(region.name)}</b><small>Unlock the full game to meet ${esc(c.name)} and their 5 Special Orders.</small></button>`;
    if (!regionOpen(r)) return `<div class="customer locked"><b>${ico("lock", "🔒")} ${esc(region.name)}</b><small>Reach ${esc(region.name)} to meet ${esc(c.name)}.</small></div>`;
    const lvl = SH.repLevel(r, save.stars), stars = regionStars(r), next = SH.REP_STARS[lvl];
    const list = SH.ORDERS.filter((o) => o.region === r).map((o) => {
      const open = orderOpen(o), done = !!save.orders[o.id], needTruck = o.truck && !save.trucks.includes(o.truck);
      const why = !open ? "Reputation " + (o.slot + 1) : needTruck ? "Needs the " + SH.truckSpec(o.truck).name : done ? "Done ✓" : SH.orderText(o);
      return `<button class="order${done ? " done" : ""}" data-order="${o.id}"${open && !needTruck ? "" : " disabled"}><b>${esc(o.name)}</b><small>${esc(why)}</small></button>`;
    }).join("");
    return `<div class="customer"><div class="who"><span class="face" aria-hidden="true">${c.icon}</span><div><b>${esc(c.name)}</b><small>${esc(c.role)}, ${esc(region.name)}</small></div>
      <div class="rep" aria-label="Reputation ${lvl} of 5">${"★".repeat(lvl)}${"☆".repeat(5 - lvl)}<small>${next ? next - stars + " more stars here for the next order" : "Top reputation"}</small></div></div>
      <div class="orders">${list}</div></div>`;
  }).join("");
  ui.innerHTML = `<section class="panel">${panelHead("Special Orders")}
    <p class="sub">Stars in a region raise your reputation with its customer. Each level opens a Special Order. Orders pay well and give depot parts. ${save.parts} part${save.parts === 1 ? "" : "s"} so far.</p>${cards}</section>`;
}

// ════ Long Haul: one road per region, milestones every 250 m ══════
function longScreen() {
  const rows = SH.REGIONS.map((r, i) => {
    const open = regionFull(i), best = save.longBest[i] || 0, mile = save.longMile[i] || 0;
    if (i > 0 && paywalled()) return `<button class="order" data-unlock="long"><b>${ico("region_" + r.id)} ${esc(r.name)}</b><small>${ico("lock", "🔒")} Full game</small></button>`;
    return `<button class="order" data-long="${i}"${open ? "" : " disabled"}><b>${ico("region_" + r.id)} ${esc(r.name)}</b><small>${open ? (best ? "Best " + best + " m. " : "") + "Next milestone " + (mile + 1) * 250 + " m, +" + Math.round(20 * (mile + 1) * r.pay) : "Not reached yet"}</small></button>`;
  }).join("");
  ui.innerHTML = `<section class="panel">${panelHead("Long Haul")}<p class="sub">One long road that keeps getting steeper. Go as far as you can. Every 250 m pays a bonus the first time you pass it in a region.</p><div class="customer"><div class="orders">${rows}</div></div></section>`;
}

// ════ Daily and weekly: the daily delivery, the Weekly Cup, contracts ═
function eventsScreen() {
  const today = localDate(), doneToday = save.daily.last === today;
  // A streak only stands if the last daily was today or yesterday.
  const y = new Date(); y.setDate(y.getDate() - 1);
  const live = save.daily.last === today || save.daily.last === localDate(y) ? save.daily.streak : 0;
  const filled = live ? (live - 1) % 7 + 1 : 0;
  const cal = Array.from({ length: 7 }, (_, i) => `<i class="day${i < filled ? " on" : ""}${i === 6 ? " big" : ""}">${i === 6 ? "+150" : i + 1}</i>`).join("");
  const c = cup(), total = cupTotal(c), tier = cupTier(c);
  const legs = c.legs.map((d, i) => `<button class="order" data-cup="${d.id}"><b>${i + 1}. ${esc(d.name)}</b><small>${esc(SH.REGIONS[d.region].name)} · ${save.cup.best[d.id] ? "Best " + save.cup.best[d.id] + "s" : "Not driven"} · gold ${SH.medalTimes(d).gold}s</small></button>`).join("");
  const job = (c2, got, paid, when) => `<div class="goal${paid ? " done" : ""}"><span class="ic">${ico("contracts", "📋", "ico badge")}</span><b>${esc(c2.text)}${paid ? " ✓" : ""}</b><small>${Math.min(c2.goal, Math.floor(got))} of ${c2.goal} ${when}</small><em>+${c2.pay}</em></div>`;
  const w = weekJob();
  ui.innerHTML = `<section class="panel">${panelHead("Daily and weekly")}
    <h3 class="small">${ico("daily_tour", ico("daily"))} World Tour Daily</h3>
    <p class="sub">Today: ${esc(SH.REGIONS[SH.dailyRegion(today)].name)} in the ${esc(SH.truckSpec(SH.dailyDelivery(today).truck).name)}. The same road and the same loaner truck for everyone, in a different region each day. Day 7 of a streak pays 150 more.</p>
    <div class="cal">${cal}</div>
    <button class="btn${doneToday ? "" : " primary"}" data-nav="daily">${doneToday ? "Drive it again" : "Drive today's delivery +" + SH.BALANCE.dailyPay}</button>
    <h3 class="small">${ico("medal_gold", "🏆")} Weekly Cup</h3>
    <p class="sub">Five routes this week. Your best time on each, with two stars and a clean stop, adds up. Bronze ${c.bronze}s, silver ${c.silver}s, gold ${c.gold}s. ${total != null ? "Your total: " + total + "s" + (tier ? ", " + tier + " cup." : ".") : ""}</p>
    <div class="customer"><div class="orders">${legs}</div></div>
    <h3 class="small">${ico("contracts", "📋")} Contracts</h3>
    ${jobs().map((c2) => job(c2, save.jobs.got[c2.id] || 0, save.jobs.paid[c2.id], "today")).join("")}
    ${job(w, save.week.got, save.week.paid, "this week")}
  </section>`;
}

function routesScreen() {
  const tabs = SH.REGIONS.map((r, i) => `<button class="tab" ${regionPaid(i) ? 'data-unlock="routes"' : `data-region="${i}"`} aria-pressed="${state.regionTab === i}"${regionOpen(i) || regionPaid(i) ? "" : " disabled"}>${ico("region_" + r.id)} ${esc(r.name)}${regionOpen(i) ? "" : " " + ico("lock", "🔒")}</button>`).join("");
  const region = SH.REGIONS[state.regionTab];
  const cells = SH.DELIVERIES.filter((d) => d.region === state.regionTab).map((d) => {
    const open = SH.isOpen(d.id, save.stars), st = save.stars[d.id] || 0, md = save.medal[d.id] || 0, exp = md === 3, crumb = save.crumb[d.id];
    const ch = SH.challengeFor(d.id), chDone = !!save.challenge[d.id];
    if (routePaid(d)) return `<button class="route paid" data-unlock="routes" aria-label="${esc(d.name)}, full game"><b>${d.index + 1}</b><i class="rname">${esc(d.name || "")}</i><small>${ico("lock", "🔒")}</small><em>Full game</em></button>`;
    return `<button class="route${exp ? " express" : ""}" data-go="${d.id}"${open ? "" : " disabled"} aria-label="${esc(region.name)} route ${d.index + 1}, ${esc(d.name || "")}, ${st} stars${ch ? ", challenge " + (chDone ? "done" : "not done") : ""}">
      <b>${d.index + 1}</b><i class="rname">${esc(d.name || "")}</i>${ch ? `<span class="ch${chDone ? " on" : ""}" title="${esc(SH.challengeText(ch))}">${ico("challenge", "🎯")}${chDone ? " ✓" : ""}</span>` : ""}<small>${"★".repeat(st)}${"☆".repeat(3 - st)}</small>${ch && st && !chDone ? `<i class="chtext">${esc(SH.challengeText(ch))}</i>` : ""}<em>${crumb ? ico("medal_crumb", "✨") + " Golden crumb" : md ? ico("medal_" + ["", "bronze", "silver", "gold"][md]) + " " + ["", "Bronze", "Silver", "Gold"][md] + " medal" : d.load.length + " loads · " + d.len + "m" + (d.pickup ? " · pickup" : "")}</em></button>`;
  }).join("");
  ui.innerHTML = `<section class="panel">${panelHead("Routes")}<div class="tabs">${tabs}</div>
    ${artUrl("region_" + region.id) ? `<div class="banner" style="background-image:url('${artUrl("region_" + region.id)}')"><span>${(region.kinds || SH.CARGO_TYPES).map((k) => ico("cargo_" + k)).join("")}</span></div>` : ""}
    <p class="sub">${esc(region.blurb)} ${regionStars(state.regionTab)} of 24 stars here. ${SH.BALANCE.regionStars} open the next region.</p><div class="routes">${cells}</div>
    ${paywalled() ? `<p class="note">Free: all of Bakery Hills and the first two Dairy Dunes roads. ${nativeApp ? "The rest is one payment." : "The rest is in the full game on Google Play."}</p>` : ""}</section>`;
}

function winterScreen() {
  const event=currentEvent();
  if (!event) { state.screen="home"; return homeScreen(); }
  const progress=seasonProgress(save,event.key);
  const tile=(d, label, detail, rating) => {
    const open=canStartWinter(event,progress,d,sleighOwned());
    return `<button class="route winter-tile" data-winter="${d.id}" ${open ? "" : "disabled"} aria-label="${esc(label)}${open ? "" : ", locked"}"><b>${esc(label)}</b><small>${esc(rating ? "★".repeat(rating) : detail)}</small></button>`;
  };
  const routes=SH.WINTER_ROUTES.map((d)=>tile(d,d.name,d.index===7 && event.openDoors<24?"Opens 24 December":d.dropoffs+" porches",progress.routes[d.id])).join("");
  const doors=SH.WINTER_DOORS.map((d)=>tile(d,d.door===24?"24 · Christmas Eve":String(d.door),
    d.door>event.openDoors?"Locked":d.door===3?"Jingle Sleigh":"Open",progress.doors[d.door])).join("");
  const orders=["Santa","Tinsel"].map((customer)=>{
    const image=artUrl("customer_"+customer.toLowerCase());
    const cards=SH.WINTER_ORDERS.filter((d)=>d.customer===customer).map((d)=>tile(d,d.name,
      d.truck&&!sleighOwned()?"Requires the Jingle Sleigh":
      seasonStars(progress)<d.requiredStars?d.requiredStars+" North Pole stars":d.dropoffs+" porches",progress.orders[d.id])).join("");
    return `<div class="customer"><h4>${image?`<img class="ico" src="${image}" alt="">`:""}${customer}</h4><div class="orders">${cards}</div></div>`;
  }).join("");
  const goals=winterGoals(progress).map(([id,name,desc,done])=>`<div class="goal${done?" done":""}"><span class="ic">${ico("goal_"+id,"❄")}</span><b>${esc(name)}${done?" ✓":""}</b><small>${esc(desc)}</small></div>`).join("");
  ui.innerHTML=`<section class="panel winter-panel">${panelHead("Winter Haul")}
    ${artUrl("region_northpole") ? `<div class="banner winter-banner" style="background-image:url('${artUrl("region_northpole")}')"><span>${["present","sack","pudding"].map((k) => ico("cargo_" + k)).join("")}${ico("truck_sleigh")}</span></div>` : ""}
    <div class="winter-heading"><h3>North Pole</h3><p>Stop on each doormat to deliver a load, then return to the depot.</p><small>${seasonStars(progress)} of 24 North Pole stars</small></div>
    <div class="routes">${routes}</div>
    <h3 class="small">${ico("advent")} Advent calendar</h3><p class="sub">Missed days stay open through 6 January.</p>
    <div class="winter-doors${artUrl("advent_bg") ? " with-art" : ""}"${artUrl("advent_bg") ? ` style="background-image:url('${artUrl("advent_bg")}')"` : ""}>${doors}</div>
    <h3 class="small">Workshop Orders</h3>${orders}
    <h3 class="small">Winter goals</h3>${goals}</section>`;
}

function garageScreen() {
  const event=currentEvent();
  const fleet = event || sleighOwned() ? SH.TRUCKS.concat(SH.EVENT_TRUCKS) : SH.TRUCKS;
  const trucks = fleet.map((t) => {
    const owned = save.trucks.includes(t.id), selected = save.truck === t.id;
    if (t.id==="sleigh" && (!owned || !event)) return `<button class="truck" disabled><b>Jingle Sleigh</b><small>${owned?"Back next winter":"Earn it at Advent door 3"}</small></button>`;
    if (truckPaid(t.id) && !owned) return `<button class="truck" data-unlock="truck">${artUrl("portrait_" + t.id) ? `<img class="portrait" src="${artUrl("portrait_" + t.id)}" alt="">` : ""}<b>${esc(t.name)}</b><small>${esc(t.desc)}</small><span class="price">${ico("lock", "🔒")} Full game</span></button>`;
    return `<button class="truck" data-truck="${t.id}" aria-pressed="${selected}"${!owned && save.coins < t.cost ? " disabled" : ""}>
      ${artUrl("portrait_" + t.id) ? `<img class="portrait" src="${artUrl("portrait_" + t.id)}" alt="">` : ""}<b>${esc(t.name)}</b><small>${esc(t.desc)}</small>${owned ? `<small class="mastery">Mastery ${masteryLevel(t.id)}${masteryLevel(t.id) < 10 ? " · " + (MASTERY_KM[masteryLevel(t.id)] - (save.mastery[t.id] || 0) / 1000).toFixed(1) + " km to " + (masteryLevel(t.id) + 1) : ""}</small>` : ""}<span class="price">${selected ? "Driving" : owned ? "Owned" : ico("coin", "🪙") + " " + t.cost}</span></button>`;
  }).join("");
  const best = bestNext();
  const ups = SH.UPGRADES.map((u) => {
    const lv = level(u.id), cost = SH.upgradeCost(lv);
    return `<div class="up"><b>${ico("up_" + u.id, u.icon)} ${esc(u.name)}${best && best.id === u.id ? '<span class="best">Best next</span>' : ""}</b><span class="pips">${"●".repeat(lv)}${"○".repeat(SH.MAX_LEVEL - lv)}</span><small>${esc(u.desc)}${cost != null ? `<span class="next">${esc(UPGRADE_NEXT[u.id](lv))}</span>` : ""}</small>
      ${cost == null ? '<button class="btn" disabled>Max</button>' : `<button class="btn" data-up="${u.id}"${save.coins < cost ? " disabled" : ""}>${ico("coin", "🪙")} ${cost}</button>`}</div>`;
  }).join("");
  // Drivers and roof toppers appear once their models are delivered.
  const pick = (kind, list, folder, suffix) => {
    const have = list.filter(([id]) => id === "" || save.winterRewards[id] || hasModel(folder + id + suffix));
    if (have.length < 2) return "";
    return `<div class="set"><b>${ico(kind)} ${kind === "driver" ? "Driver" : "Roof topper"}</b><div class="opts">${have.map(([id, name]) => `<button class="tab" data-look="${kind}" data-val="${id}" aria-pressed="${save[kind] === id}">${esc(name)}</button>`).join("")}</div></div>`;
  };
  const paintRow = `<div class="set paintset"><b>${ico("paint", "🎨")} Paint for the ${esc(SH.truckSpec(save.truck).name)}</b><div class="swatches">
    <button class="swatch" data-paint="" aria-pressed="${!save.paint[save.truck]}" title="Factory"><i style="background:#888"></i>Factory</button>
    ${PAINTS.concat(WINTER_PAINTS.filter((p)=>save.winterRewards[p.id])).map((p) => { const own = save.winterRewards[p.id] || paintOwned(p); return `<button class="swatch" data-paint="${p.id}" aria-pressed="${save.paint[save.truck] === p.id}"${own ? "" : " disabled"} title="${esc(own ? p.name : paintHow(p))}"><i style="background:linear-gradient(135deg, ${p.colors[0]} 60%, ${p.colors[1]} 60%)"></i>${own ? esc(p.name) : ico("lock", "🔒") + `<span class="how">${esc(paintHow(p))}</span>`}</button>`; }).join("")}
    </div><small class="sub">${PAINTS.filter(paintOwned).length} of ${PAINTS.length} paints earned.</small></div>`;
  const style = paintRow + pick("driver", DRIVERS, "driver/", "_driver") + pick("topper", TOPPERS.concat(WINTER_TOPPERS.filter(([id])=>save.winterRewards[id])), "toppers/topper_", "");
  const stage = depotStage(), nextParts = DEPOT_PARTS[stage];
  const depot = `<h3 class="small">Depot</h3><p class="sub">Stage ${stage} of 5: ${esc(DEPOT_STAGES[stage - 1])}. ${nextParts != null ? (nextParts - save.parts) + " more depot part" + (nextParts - save.parts === 1 ? "" : "s") + " from Special Orders for the next stage." : "Fully built."}</p>
    <div class="swatches extras">${EXTRAS.map(([id, name, cost]) => { const own = save.extras.includes(id); return `<button class="swatch" data-extra="${id}"${own || save.coins < cost ? " disabled" : ""} aria-pressed="${own}">${esc(name)}<small>${own ? "Built ✓" : ico("coin", "🪙") + " " + cost}</small></button>`; }).join("")}</div>`;
  ui.innerHTML = `<section class="panel">${panelHead("Garage")}<h3 class="small">Trucks</h3><div class="tiles">${trucks}</div>${style ? '<h3 class="small">Style</h3>' + style : ""}<h3 class="small">Upgrades</h3><p class="sub">These apply to every truck.</p>${ups}${depot}</section>`;
}

// What the next level of each upgrade does, in numbers from the engine.
const UPGRADE_NEXT = {
  engine: (lv) => "Level " + (lv + 1) + ": " + Math.round(20 * (lv + 1)) + "% more pull. More speed throws more cargo",
  suspension: (lv) => "Level " + (lv + 1) + ": eggs " + Math.round(16 * (lv + 1)) + "% tougher, softer landings",
  tyres: (lv) => "Level " + (lv + 1) + ": " + Math.round(25 * (lv + 1)) + "% more grip",
  straps: (lv) => "Level " + (lv + 1) + ": rails " + Math.round((0.2 + 0.14 * (lv + 1)) * 100) + " cm, loads held down harder",
  tank: (lv) => "Level " + (lv + 1) + ": " + (SH.BALANCE.tankSeconds + 9 * (lv + 1)) + " s of fuel (now " + (SH.BALANCE.tankSeconds + 9 * lv) + ")"
};
function goalsScreen() {
  const s = save.stats;
  const stats = [[s.deliveries, "Deliveries"], [s.crates, "Loads delivered"], [(s.metres / 1000).toFixed(1) + " km", "Distance"], [s.bestAir.toFixed(1) + "s", "Best air"], [(s.topSpeed * 3.6).toFixed(0) + " km/h", "Top speed"], [s.earned, "Coins earned"]]
    .map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join("");
  const list = GOALS.map((g) => `<div class="goal${save.achieved[g.id] ? " done" : ""}"><span class="ic">${ico("goal_" + g.id, g.icon, "ico badge")}</span><b>${esc(g.name)}${save.achieved[g.id] ? " ✓" : ""}</b><small>${esc(g.desc)}</small><em>+${g.coins}</em></div>`).join("");
  ui.innerHTML = `<section class="panel">${panelHead("Goals")}<div class="stats">${stats}</div><h3 class="small">Goals</h3>${list}</section>`;
}

// Website only: Google Play does not allow an outside payment link inside the app.
const TIP_URL = "https://buy.stripe.com/14A00k7Gi4TF3wl6AL0VO04?client_reference_id=snack-haul";
function settingsScreen() {
  const opt = (group, value, label, on) => `<button class="tab" data-set="${group}" data-val="${value}" aria-pressed="${on}">${label}</button>`;
  ui.innerHTML = `<section class="panel">${panelHead("Settings")}
    <div class="set"><b>Sound</b><div class="opts">${opt("sound", 1, "On", save.sound)}${opt("sound", 0, "Off", !save.sound)}</div></div>
    <div class="set"><b>Music</b><div class="opts">${opt("music", 1, "On", save.music !== false)}${opt("music", 0, "Off", save.music === false)}</div></div>
    ${nativeApp ? `<div class="set"><b>Vibration</b><div class="opts">${opt("haptics", 1, "On", save.haptics !== false)}${opt("haptics", 0, "Off", save.haptics === false)}</div></div>` : ""}
    <div class="set"><b>Graphics</b><div class="opts">${["auto", "high", "medium", "low"].map((q) => opt("quality", q, q[0].toUpperCase() + q.slice(1), save.quality === q)).join("")}</div></div>
    <div class="set"><b>Ghost and rival</b><div class="opts">${opt("ghost", 1, "On", save.ghostOn !== false)}${opt("ghost", 0, "Off", save.ghostOn === false)}</div></div>
    <div class="set"><b>Camera shake</b><div class="opts">${opt("shake", 1, "On", save.shake)}${opt("shake", 0, "Off", !save.shake)}</div></div>
    <div class="set"><b>Progress</b><div class="opts"><button class="tab" data-reset>Reset game</button></div></div>
    ${nativeApp ? `<div class="set"><b>Full game</b><div class="opts">${save.pro ? '<span class="tab" aria-pressed="true">Unlocked ✓</span>' : '<button class="tab" data-unlock="settings">Unlock</button>'}<button class="tab" data-restore>Restore purchase</button></div></div>${billing.note ? `<p class="note">${esc(billing.note)}</p>` : ""}` : '<p class="note">Playtest build: your progress stays on this device. Turn your phone sideways for the best view. Arrow keys drive on a computer.</p>'}
    ${nativeApp ? "" : `<p class="note">Enjoying Snack Haul? <a href="${TIP_URL}" target="_blank" rel="noopener" style="color:inherit;font-weight:700">Tip the studio</a></p>`}
    ${nativeApp ? "" : '<p class="note"><a href="../../" style="color:inherit">Back to the arcade</a></p>'}</section>`;
}

ui.addEventListener("click", (e) => {
  const t = (s) => e.target.closest(s);
  let b;
  ensureAudio();
  if ((b = t("button")) && !b.disabled) play("button", 0.45);
  if ((b = t("[data-unlock]"))) return showUnlock(b.dataset.unlock);
  if ((b = t("[data-restore]"))) return restoreFullGame();
  if ((b = t("[data-look]"))) { save[b.dataset.look] = b.dataset.val; persist(); return renderScreen(); }
  if ((b = t("[data-nav]"))) {
    const nav = b.dataset.nav;
    if (nav === "play") return startDelivery(nextRoute());
    if (nav === "daily") {
      const d = SH.dailyDelivery(localDate());
      d.paid = save.daily.last === localDate();
      return startDelivery(d);
    }
    if (nav === "long" && maxRegion() === 0) return startDelivery(SH.longHaul(0, Date.now().toString(36)));
    if (nav === "routes") state.regionTab = nextRoute().region;
    state.screen = nav;
    return renderScreen();
  }
  if ((b = t("[data-winter]")) && !b.disabled) {
    if (b.closest(".winter-doors")) play("door_open", 0.7);
    return startDelivery(SH.winterDelivery(b.dataset.winter));
  }
  if ((b = t("[data-go]")) && !b.disabled) return startDelivery(SH.findDelivery(b.dataset.go));
  if ((b = t("[data-extra]")) && !b.disabled) {
    const e = EXTRAS.find((x) => x[0] === b.dataset.extra);
    if (e && save.coins >= e[2] && !save.extras.includes(e[0])) { save.coins -= e[2]; save.extras.push(e[0]); play("upgrade", 0.7); persist(); refreshShowcase(); checkGoals(null); persist(); }
    return renderScreen();
  }
  if ((b = t("[data-paint]")) && !b.disabled) { if (b.dataset.paint) save.paint[save.truck] = b.dataset.paint; else delete save.paint[save.truck]; persist(); refreshShowcase(); return renderScreen(); }
  if ((b = t("[data-long]")) && !b.disabled) return startDelivery(SH.longHaul(Number(b.dataset.long), Date.now().toString(36)));
  if ((b = t("[data-cup]")) && !b.disabled) return startDelivery(Object.assign({}, SH.findDelivery(b.dataset.cup), { cup: save.cup.week }));
  if ((b = t("[data-order]")) && !b.disabled) return startDelivery(SH.findOrder(b.dataset.order));
  if ((b = t("[data-region]")) && !b.disabled) { state.regionTab = Number(b.dataset.region); return renderScreen(); }
  if ((b = t("[data-truck]")) && !b.disabled) {
    const id = b.dataset.truck, spec = SH.truckSpec(id);
    if (id==="sleigh" && (!sleighOwned() || !currentEvent())) return;
    if (!save.trucks.includes(id)) {
      if (save.coins < spec.cost) return;
      save.coins -= spec.cost; save.trucks.push(id);
      play("buy", 0.8) || beep(880, 0.2, "triangle", 0.08);
    }
    save.truck = id;
    checkGoals(null); persist();
    return renderScreen();
  }
  if ((b = t("[data-up]")) && !b.disabled) {
    const id = b.dataset.up, cost = SH.upgradeCost(level(id));
    if (cost != null && save.coins >= cost) {
      save.coins -= cost; save.upgrades[id] = level(id) + 1;
      play("buy", 0.8) || beep(740, 0.14, "triangle", 0.08);
      checkGoals(null); persist(); renderScreen();
    }
    return;
  }
  if ((b = t("[data-set]"))) {
    const group = b.dataset.set, v = b.dataset.val;
    if (group === "music") { save.music = v === "1"; const keep = audio.wantMusic; if (save.music) { ensureAudio(); audio.musicName = ""; setMusic(keep || menuMusic()); } else { setMusic(""); audio.wantMusic = keep; } }
    if (group === "haptics") { save.haptics = v === "1"; if (save.haptics) buzz("light"); }
    if (group === "sound") { save.sound = v === "1"; if (save.sound) { ensureAudio(); setMusic(audio.wantMusic || menuMusic()); } else { engineSound(null, false); const keep = audio.wantMusic; setMusic(""); audio.wantMusic = keep; } }
    if (group === "shake") save.shake = v === "1";
    if (group === "ghost") save.ghostOn = v === "1";
    if (group === "quality") { save.quality = v; world && world.setQuality(v); }
    persist();
    return renderScreen();
  }
  if (t("[data-reset]")) {
    sheet.innerHTML = '<h2>Reset the game?</h2><p>This deletes your coins, trucks and stars on this device.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="close">Keep playing</button><button class="btn primary" data-act="reset-yes">Reset</button></div>';
    veil.classList.add("on");
  }
});

// ════ Start ═══════════════════════════════════════════════════════
if (!world) {
  ui.innerHTML = '<div class="veil on"><div class="sheet"><h2>3D is not available</h2><p>Snack Haul needs WebGL, which this browser has turned off.</p></div></div>';
} else {
  if (params.get("winter")==="1" && currentEvent()) state.screen="winter";
  renderScreen();
  kick();
  // Authored models and sounds arrive in the background. The menu truck is
  // rebuilt once they are in; a delivery already under way keeps what it has.
  loadAssets((a) => {
    decodeSounds();
    if (!a.done) return;
    // Icons, portraits and models are in: redraw the menu and dress the pedals.
    if (has("ui/gas.webp") && !$("gas").querySelector("img")) $("gas").insertAdjacentHTML("afterbegin", ico("gas", "", "ico pedal-ico"));
    if (has("ui/brake.webp") && !$("brake").querySelector("img")) $("brake").insertAdjacentHTML("afterbegin", ico("brake", "", "ico pedal-ico"));
    if (has("ui/pause.webp")) $("pause").innerHTML = ico("pause", "II");
    if (has("ui/restart.webp")) $("restart").innerHTML = ico("restart", "↻");
    world.assetStamp = a.version || String(a.files.size);
    // First launch: straight onto the first road once the trucks are in. The home screen comes after it.
    if (!save.stats.deliveries && !save.stats.failed && !Object.keys(save.stars).length && state.mode === "menu" && state.screen === "home" && !veil.classList.contains("on")) return startDelivery(SH.findDelivery("bakery-1"));
    if (a.files.size && state.mode === "menu") renderScreen();
  });
}
window.__snackHaul = { state, save: () => save, world: () => world, kick, startDelivery, finishDelivery, SH, assets: Assets, audio };
