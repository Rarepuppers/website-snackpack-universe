// Snack Haul app shell: saves, menus, audio, the driving loop and progression.
import { World3D } from "./render3d.js";
import { Assets, loadAssets, soundData } from "./assets.js";

const SH = window.SnackHaul;
const KEY = "sp_snackhaul_v1";
const $ = (id) => document.getElementById(id);
const ui = $("ui"), veil = $("veil"), sheet = $("sheet"), driveEl = $("drive"), canvas = $("view");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ════ Save ════════════════════════════════════════════════════════
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
const DEFAULTS = { coins: 0, stars: {}, best: {}, express: {}, upgrades: {}, trucks: ["pickup"], truck: "pickup", achieved: {}, daily: { last: "", streak: 0 }, tutorial: 0, sound: true, quality: "auto", shake: true, days: [], medal: {}, ghost: {}, long: {}, jobs: { date: "", got: {}, paid: {} } };
const save = Object.assign({}, DEFAULTS, load());
save.stats = Object.assign({ deliveries: 0, crates: 0, eggs: 0, metres: 0, earned: 0, failed: 0, bestAir: 0, topSpeed: 0 }, save.stats);
function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* plays on without storage */ } }

function localDate() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
const level = (id) => save.upgrades[id] || 0;
const totalStars = () => Object.values(save.stars).reduce((n, v) => n + v, 0);
const regionOpen = (r) => SH.isOpen(SH.DELIVERIES.find((d) => d.region === r).id, save.stars);
const maxRegion = () => { let m = 0; SH.REGIONS.forEach((_, r) => { if (regionOpen(r)) m = r; }); return m; };
function nextRoute() {
  const open = SH.DELIVERIES.filter((d) => SH.isOpen(d.id, save.stars));
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
  { id: "dunes", icon: "🥛", name: "Cream of the Crop", desc: "Reach Honey Harbour.", coins: 80, test: () => regionOpen(2) },
  { id: "chilli", icon: "🌶️", name: "Feeling the Heat", desc: "Reach Chilli Ridge.", coins: 120, test: () => regionOpen(4) },
  { id: "fleet", icon: "🚚", name: "Second Set of Wheels", desc: "Buy another truck.", coins: 50, test: () => save.trucks.length >= 2 },
  { id: "maxed", icon: "🔧", name: "Fully Tuned", desc: "Max out one upgrade.", coins: 100, test: () => SH.UPGRADES.some((u) => level(u.id) >= SH.MAX_LEVEL) },
  { id: "streak", icon: "📅", name: "Regular Run", desc: "Do the daily delivery 3 days in a row.", coins: 90, test: () => save.daily.streak >= 3 },
  { id: "done", icon: "🏆", name: "Haulage Legend", desc: "Finish every route.", coins: 300, test: () => SH.DELIVERIES.every((d) => save.stars[d.id] > 0) }
];
function regionStars(r) { return SH.regionStars(r, save.stars); }

// ════ Contracts: three jobs a day, paid once each ═════════════════
function jobs() {
  const today = localDate();
  if (save.jobs.date !== today) save.jobs = { date: today, got: {}, paid: {} };
  return SH.contractsFor(today);
}
function countJobs(report) {
  const fresh = [];
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
function decodeSounds() {
  if (!audio.ctx) return;
  Object.keys(Assets.sounds).forEach((name) => {
    if (audio.buffers[name] || audio.decoding[name]) return;
    audio.decoding[name] = true;
    try {
      audio.ctx.decodeAudioData(soundData(name).slice(0), (buffer) => {
        audio.buffers[name] = buffer;
        if (audio.wantMusic && !audio.music) setMusic(audio.wantMusic);
        if (audio.wantEngine && !audio.loops) engineLoops(audio.wantEngine);
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
function setMusic(name) {
  audio.wantMusic = name;
  if (!audio.ctx || audio.musicName === name) return;
  stopLoop(audio.music); audio.music = null; audio.musicName = "";
  if (!name || !save.sound || !audio.buffers["music/" + name]) return;
  audio.music = source("music/" + name, true, 0);
  audio.music.gain.gain.setTargetAtTime(MUSIC_LEVEL, audio.ctx.currentTime, 0.6);
  audio.music.src.start();
  audio.musicName = name;
}
const MUSIC_LEVEL = 0.32;
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
  audio.o1.frequency.setTargetAtTime(rev, t, 0.08);
  audio.o2.frequency.setTargetAtTime(rev / 2, t, 0.08);
  audio.filter.frequency.setTargetAtTime(gas ? 900 : 420, t, 0.1);
  audio.engineGain.gain.setTargetAtTime(!live || audio.loops ? 0 : gas ? 0.085 : 0.035, t, 0.06);
  audio.noise.gain.setTargetAtTime(!on || !save.sound || !game ? 0 : Math.min(0.05, game.slipRear * 0.006 + speed * 0.002), t, 0.08);
}

// ════ World ═══════════════════════════════════════════════════════
let world;
try { world = new World3D(canvas, save.quality); } catch (e) { world = null; }
const state = { mode: "menu", screen: "home", game: null, delivery: null, input: { gas: false, brake: false }, acc: 0, last: 0, toastUntil: 0, hintUntil: 0, regionTab: 0, endTimer: 0, hints: {} };

function sizeWorld() { world && world.resize(window.innerWidth, window.innerHeight); }
window.addEventListener("resize", sizeWorld);
sizeWorld();

function showcaseRegion() { return state.screen === "routes" ? state.regionTab : nextRoute().region; }
function refreshShowcase() {
  if (!world) return;
  world.showView = state.screen === "home" ? "home" : "panel";
  world.showcase(save.truck, showcaseRegion(), railFor(save.truck));
}

let frameId = 0;
function kick() { cancelAnimationFrame(frameId); state.last = performance.now(); frameId = requestAnimationFrame(tick); }
let menuLag = 0;
function tick(now) {
  frameId = requestAnimationFrame(tick);
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
  state.acc += dt;
  while (state.acc >= SH.STEP) { g.step(state.input); state.acc -= SH.STEP; }
  drainEvents(g);
  if (now > state.toastUntil) $("toast").classList.remove("on");
  if (now > state.hintUntil) $("hint").classList.remove("on");
  engineSound(g, g.status === "driving");
  world.frameGame(g, dt);
  hud(g);
  if (g.status === "driving") coach(g);
  else {
    state.endTimer += dt;
    if (state.endTimer > 1.5 && state.mode === "drive") { state.mode = "result"; finishDelivery(g); }
  }
}

const LOST_SOUND = { melon: "melon_splat", jelly: "jelly_boing", milk: "milk_clink" };
function drainEvents(g) {
  g.events.splice(0).forEach((ev) => {
    if (ev.type === "done") ev.at = g.truck.getPosition();
    world.react(ev);
    if (ev.type === "coin") play("coin", 0.55, 0.94 + Math.random() * 0.12) || beep(1180 + Math.random() * 200, 0.08, "triangle", 0.05);
    else if (ev.type === "fuel") { play("fuel", 0.8) || (beep(520, 0.12, "sine", 0.1), beep(780, 0.16, "sine", 0.1, 0.1)); toast("Fuel!", 700); }
    else if (ev.type === "lost") { play(LOST_SOUND[ev.cargo] || "crate_lost", 0.8) || play("crate_lost", 0.8) || thud(0.6); toast("Cargo lost!", 800); }
    else if (ev.type === "broken") { play("egg_crack", 0.8) || beep(900, 0.1, "sawtooth", 0.05); toast("Eggs cracked!", 800); }
    else if (ev.type === "land") thud(Math.min(1, ev.air));
    else if (ev.type === "pickup") { play("pickup_load", 0.8) || (beep(660, 0.12, "triangle", 0.08), beep(880, 0.16, "triangle", 0.08, 0.1)); toast("Loaded " + ev.items.length + " more!", 1100); }
    else if (ev.type === "missed") { beep(247, 0.3, "triangle", 0.07); toast("Missed the pickup!", 1200); }
    else if (ev.type === "ruined") { play("cake_squash", 0.8); toast("Cake toppled!", 900); }
    else if (ev.type === "splash") play("splash", 0.6) || beep(300 + Math.random() * 200, 0.12, "sine", 0.04);
    else if (ev.type === "zone") {
      const say = { wind: "Gusty! Mind the load", slick: g.regionIndex === 3 ? "Ice! Brake early" : "Wet cobbles!", bridge: "Bridge: take it steady", ford: "Ford: keep your speed up", pickup: "Pickup stop: pull up here" }[ev.feature];
      if (say) hint(say, 2600);
    }
  });
}

// ════ Delivery flow ═══════════════════════════════════════════════
function startDelivery(delivery) {
  ensureAudio();
  state.delivery = delivery;
  const game = SH.createGame({ delivery, upgrades: save.upgrades, truck: save.truck });
  state.game = game; state.acc = 0; state.endTimer = 0; state.hints = {};
  state.input.gas = state.input.brake = false;
  syncPedals();
  engineLoops(save.truck);
  setMusic("music_" + SH.REGIONS[delivery.region].id);
  world.reduceMotion = !save.shake;
  world.buildRoute(game);
  ui.innerHTML = ""; veil.classList.remove("on");
  driveEl.hidden = false;
  const label = delivery.long ? "Long Haul" : delivery.daily ? "Daily delivery" : SH.REGIONS[delivery.region].name + " " + (delivery.index + 1);
  toast(label + ": " + game.total + " loads", 1700);
  const d = localDate();
  if (!save.days.includes(d)) save.days = save.days.concat(d).slice(-60);
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
    if (!h.ease && x > 30) { h.ease = true; hint("Ease off before crests, or your crates fly out"); }
    if (!h.brake && x > g.terrain.zoneStart - 26) { h.brake = true; hint("Depot ahead. Brake early and stop in the arrows", 5000); }
  }
  if (save.tutorial < 2 && !g.grounded() && g.airTime > 0.3 && !h.air) { h.air = true; hint("In the air: GAS tips the nose up, BRAKE tips it down"); }
  if (g.stuckTime > 3.5 && !h.stuck) { h.stuck = true; hint("Stuck? Hold BRAKE to back up, then take a run at it", 5000); }
  if (!h.fuel && g.fuel / g.maxFuel < 0.22) { h.fuel = true; toast("Low fuel!", 1100); play("low_fuel", 0.7) || beep(330, 0.2, "square", 0.04); }
}

function hud(g) {
  const live = g.live();
  $("load").textContent = "📦 " + live + "/" + g.total + (g.pending.length ? " +" + g.pending.length : "");
  $("load").className = live + g.pending.length - 1 < g.need && g.total > 1 ? "chip warn" : "chip";
  $("coins").textContent = "🪙 " + g.coinsTaken;
  $("clock").textContent = g.delivery.long ? Math.max(0, Math.round(g.truck.getPosition().x - 8)) + " m" : Math.floor(g.time) + "s / " + g.par + "s";
  const f = g.fuel / g.maxFuel;
  $("fuel").style.width = (f * 100).toFixed(1) + "%";
  $("fuel").className = f < 0.25 ? "low" : "";
  $("prog").style.width = Math.min(100, (g.truck.getPosition().x / g.terrain.zoneStart) * 100).toFixed(1) + "%";
  const loading = g.status === "driving" && g.inPickup();
  const showStop = loading || (g.status === "driving" && g.inZone());
  $("stop").hidden = !showStop;
  $("stop").firstElementChild.textContent = loading ? "Stop to load" : "Stop to unload";
  if (showStop) $("stopbar").style.width = (g.stopProgress() * 100).toFixed(0) + "%";
}

function finishDelivery(g) {
  engineSound(null, false);
  const r = SH.report(g), d = state.delivery, today = localDate();
  const s = save.stats;
  s.metres += Math.round(Math.max(0, g.truck.getPosition().x - 8));
  s.bestAir = Math.max(s.bestAir, r.bestAir);
  s.topSpeed = Math.max(s.topSpeed, r.topSpeed);
  save.coins += r.earned; s.earned += r.earned;
  const beforeRegion = maxRegion();
  let streakLine = "", longBest = false;
  if (d.long) {
    if (r.score > (save.long[r.truck] || 0)) { save.long[r.truck] = r.score; longBest = r.score > 0; }
  } else if (r.status === "done") {
    s.deliveries += 1; s.crates += r.kept; s.eggs += r.kinds.eggs;
    if (d.daily) {
      if (save.daily.last !== today) {
        const y = new Date(Date.now() - 864e5);
        const yesterday = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
        save.daily.streak = save.daily.last === yesterday ? save.daily.streak + 1 : 1;
        save.daily.last = today;
        streakLine = save.daily.streak + "-day daily streak";
      }
    } else {
      if (r.stars > (save.stars[d.id] || 0)) save.stars[d.id] = r.stars;
      if (!save.best[d.id] || r.time < save.best[d.id]) save.best[d.id] = Math.round(r.time * 10) / 10;
      if (r.express) save.express[d.id] = true;
      if (r.medal > (save.medal[d.id] || 0)) save.medal[d.id] = r.medal;
      // Keep the pedals of the fastest run, for the ghost.
      if (save.best[d.id] === Math.round(r.time * 10) / 10 && g.rec.length < 1200) save.ghost[d.id] = { truck: r.truck, rec: g.rec.slice() };
    }
    if (save.tutorial < 1 && d.id === "bakery-1") save.tutorial = 1;
    else if (save.tutorial < 2 && d.id === "bakery-2") save.tutorial = 2;
  } else s.failed += 1;
  const done = countJobs(r);
  const goals = checkGoals(r);
  const newRegion = maxRegion() > beforeRegion ? SH.REGIONS[maxRegion()].name : null;
  persist();

  const why = { load: "Too much of the load is gone. You need " + g.need + " of " + r.total + " to make the delivery.", flip: "The truck ended up on its roof.", fuel: "You ran out of fuel." }[r.reason] || "";
  const list = r.lines.map((l) => `<li><span>${esc(l.label)}</span><b>+${l.coins}</b></li>`).join("");
  const next = d.daily || d.long ? null : following(d);
  const medalName = ["", "Bronze", "Silver", "Gold"][r.medal];
  const canAdvance = r.status === "done" && next;
  const stars = "★".repeat(r.stars) + "☆".repeat(3 - r.stars);
  sheet.innerHTML = `<h2>${d.long ? "Long Haul: " + r.metres + " m" : r.status === "done" ? "Delivered!" : "Delivery failed"}</h2>
    ${d.long ? `<p>Score ${r.score}${longBest ? ". New best for this truck!" : ", best " + (save.long[r.truck] || 0)}</p>` : `<div class="stars" aria-label="${r.stars} stars">${[...stars].map((c) => `<span>${c}</span>`).join("")}</div>`}
    ${why && !d.long ? `<p>${esc(why)}</p>` : ""}
    ${r.missedPickup ? "<p>You drove past the pickup stop, so those loads were left behind.</p>" : ""}
    ${r.status === "done" && !d.long ? `<p>${r.time.toFixed(1)}s${medalName ? ", " + medalName + " medal" : ""}. Gold ${r.medals.gold}s, silver ${r.medals.silver}s, bronze ${r.medals.bronze}s</p>` : ""}
    ${list ? `<ul class="lines">${list}<li class="total"><span>Earned</span><span>🪙 ${r.earned}</span></li></ul>` : ""}
    ${streakLine ? `<div class="unlocked">📅 ${esc(streakLine)}</div>` : ""}
    ${newRegion ? `<div class="unlocked">🗺️ New region: ${esc(newRegion)}</div>` : ""}
    ${done.map((c) => `<div class="unlocked">📋 ${esc(c.text)} +${c.pay}</div>`).join("")}
    ${goals.map((g2) => `<div class="unlocked">${g2.icon} ${esc(g2.name)} +${g2.coins}</div>`).join("")}
    ${r.status !== "done" && !d.long ? `<p>${esc(failTip(r))}</p>` : ""}
    <div class="row" style="margin-top:8px">
      ${canAdvance ? '<button class="btn primary" data-act="next">Next delivery</button>' : ""}
      <button class="btn${canAdvance ? "" : " primary"}" data-act="retry">Try again</button>
      <button class="btn" data-act="garage">Garage</button>
    </div>`;
  veil.classList.add("on");
  engineLoops(null);
  if (r.status === "done" || d.long) play("delivered", 0.9) || [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.24, "triangle", 0.07, i * 0.1));
  else play("failed", 0.8) || [294, 247].forEach((f, i) => beep(f, 0.3, "triangle", 0.07, i * 0.16));
  $("drive").hidden = true;
}
function failTip(r) {
  if (r.reason === "fuel") return "Fuel Tank upgrades help, and so does coasting downhill.";
  if (r.reason === "flip") return "Ease off before steep crests, and use BRAKE in the air to level out.";
  return level("straps") < 2 ? "Cargo Straps in the garage hold your load down." : "Slow down before crests and let the truck settle.";
}
function following(d) {
  const i = SH.DELIVERIES.indexOf(d), n = SH.DELIVERIES[i + 1];
  return n && SH.isOpen(n.id, save.stars) ? n : null;
}
function toMenu(screen) {
  veil.classList.remove("on");
  driveEl.hidden = true;
  state.mode = "menu"; state.game = null; state.screen = screen || "home";
  engineLoops(null); setMusic("music_menu");
  engineSound(null, false);
  renderScreen();
  kick();
}
function pause() {
  if (state.mode !== "drive") return;
  state.mode = "paused";
  engineSound(null, false);
  sheet.innerHTML = '<h2>Paused</h2><div class="row" style="margin-top:12px"><button class="btn primary" data-act="resume">Keep driving</button><button class="btn" data-act="retry">Restart</button><button class="btn" data-act="garage">Garage</button></div>';
  veil.classList.add("on");
}
sheet.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const a = b.dataset.act;
  ensureAudio();
  if (a === "garage") toMenu("garage");
  if (a === "retry") startDelivery(state.delivery.long ? SH.longHaul(state.delivery.region, Date.now().toString(36)) : state.delivery);
  if (a === "next") startDelivery(following(state.delivery));
  if (a === "resume") { veil.classList.remove("on"); state.mode = "drive"; kick(); }
  if (a === "reset-yes") { try { localStorage.removeItem(KEY); } catch (x) { /* ignore */ } location.reload(); }
  if (a === "close") veil.classList.remove("on");
});
$("pause").addEventListener("click", pause);
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

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
window.addEventListener("keydown", (e) => {
  if (KEYS[e.code] && state.mode === "drive") { state.input[KEYS[e.code]] = true; syncPedals(); e.preventDefault(); }
  if (e.code === "Escape") pause();
});
window.addEventListener("keyup", (e) => { if (KEYS[e.code]) { state.input[KEYS[e.code]] = false; syncPedals(); } });

// ════ Screens ═════════════════════════════════════════════════════
function renderScreen() {
  ({ home: homeScreen, routes: routesScreen, garage: garageScreen, goals: goalsScreen, settings: settingsScreen })[state.screen]();
  refreshShowcase();
}
const purse = () => `<div class="purse"><span class="pill">🪙 ${save.coins}</span><span class="pill">★ ${totalStars()}/${SH.DELIVERIES.length * 3}</span></div>`;
const panelHead = (title) => `<div class="phead"><button class="back" data-nav="home">← Back</button><h2>${esc(title)}</h2>${purse()}</div>`;

function homeScreen() {
  const n = nextRoute(), today = localDate(), doneToday = save.daily.last === today;
  ui.innerHTML = `<div class="home">
    <div class="topbar"><div class="brand"><h1>Snack Haul</h1><p>Get the load there in one piece.</p></div>${purse()}</div>
    <div class="menu">
      <button class="btn primary" data-nav="play">Drive<small>${esc(SH.REGIONS[n.region].name)} ${n.index + 1}</small></button>
      <button class="btn" data-nav="daily">Daily delivery<small>${doneToday ? "Done today · " + save.daily.streak + "-day streak" : "+" + SH.BALANCE.dailyPay + " coins"}</small></button>
      <button class="btn" data-nav="long">Long Haul<small>${save.long[save.truck] ? "Best " + save.long[save.truck] : "How far can you get?"}</small></button>
      <div class="dock">
        <button class="btn" data-nav="routes">Routes</button>
        <button class="btn" data-nav="garage">Garage</button>
        <button class="btn" data-nav="goals">Goals</button>
        <button class="btn" data-nav="settings" aria-label="Settings">⚙️</button>
      </div>
    </div></div>`;
}

function routesScreen() {
  const tabs = SH.REGIONS.map((r, i) => `<button class="tab" data-region="${i}" aria-pressed="${state.regionTab === i}"${regionOpen(i) ? "" : " disabled"}>${esc(r.name)}${regionOpen(i) ? "" : " 🔒"}</button>`).join("");
  const region = SH.REGIONS[state.regionTab];
  const cells = SH.DELIVERIES.filter((d) => d.region === state.regionTab).map((d) => {
    const open = SH.isOpen(d.id, save.stars), st = save.stars[d.id] || 0, md = save.medal[d.id] || 0, exp = md === 3;
    return `<button class="route${exp ? " express" : ""}" data-go="${d.id}"${open ? "" : " disabled"} aria-label="${esc(region.name)} route ${d.index + 1}, ${st} stars">
      <b>${d.index + 1}</b><small>${"★".repeat(st)}${"☆".repeat(3 - st)}</small><em>${md ? ["", "Bronze", "Silver", "Gold"][md] + " medal" : d.load.length + " loads · " + d.len + "m" + (d.pickup ? " · pickup" : "")}</em></button>`;
  }).join("");
  ui.innerHTML = `<section class="panel">${panelHead("Routes")}<div class="tabs">${tabs}</div>
    <p class="sub">${esc(region.blurb)} ${regionStars(state.regionTab)} of 24 stars here. ${SH.BALANCE.regionStars} open the next region.</p><div class="routes">${cells}</div>
    <p class="note">Playtest build: every region is free. In the Play Store version, Bakery Hills would be free and the rest would be a one-time unlock.</p></section>`;
}

function garageScreen() {
  const trucks = SH.TRUCKS.map((t) => {
    const owned = save.trucks.includes(t.id), selected = save.truck === t.id;
    return `<button class="truck" data-truck="${t.id}" aria-pressed="${selected}"${!owned && save.coins < t.cost ? " disabled" : ""}>
      <b>${esc(t.name)}</b><small>${esc(t.desc)}</small><span class="price">${selected ? "Driving" : owned ? "Owned" : "🪙 " + t.cost}</span></button>`;
  }).join("");
  const ups = SH.UPGRADES.map((u) => {
    const lv = level(u.id), cost = SH.upgradeCost(lv);
    return `<div class="up"><b>${u.icon} ${esc(u.name)}</b><span class="pips">${"●".repeat(lv)}${"○".repeat(SH.MAX_LEVEL - lv)}</span><small>${esc(u.desc)}</small>
      ${cost == null ? '<button class="btn" disabled>Max</button>' : `<button class="btn" data-up="${u.id}"${save.coins < cost ? " disabled" : ""}>🪙 ${cost}</button>`}</div>`;
  }).join("");
  ui.innerHTML = `<section class="panel">${panelHead("Garage")}<h3 class="small">Trucks</h3><div class="tiles">${trucks}</div><h3 class="small">Upgrades</h3><p class="sub">These apply to every truck.</p>${ups}</section>`;
}

function goalsScreen() {
  const s = save.stats;
  const stats = [[s.deliveries, "Deliveries"], [s.crates, "Loads delivered"], [(s.metres / 1000).toFixed(1) + " km", "Distance"], [s.bestAir.toFixed(1) + "s", "Best air"], [(s.topSpeed * 3.6).toFixed(0) + " km/h", "Top speed"], [s.earned, "Coins earned"]]
    .map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join("");
  const work = jobs().map((c) => { const got = Math.min(c.goal, Math.floor(save.jobs.got[c.id] || 0)), paid = save.jobs.paid[c.id]; return `<div class="goal${paid ? " done" : ""}"><span class="ic">📋</span><b>${esc(c.text)}${paid ? " ✓" : ""}</b><small>${got} of ${c.goal} today</small><em>+${c.pay}</em></div>`; }).join("");
  const list = GOALS.map((g) => `<div class="goal${save.achieved[g.id] ? " done" : ""}"><span class="ic">${g.icon}</span><b>${esc(g.name)}${save.achieved[g.id] ? " ✓" : ""}</b><small>${esc(g.desc)}</small><em>+${g.coins}</em></div>`).join("");
  ui.innerHTML = `<section class="panel">${panelHead("Goals")}<div class="stats">${stats}</div><h3 class="small">Today's contracts</h3>${work}<h3 class="small">Goals</h3>${list}</section>`;
}

function settingsScreen() {
  const opt = (group, value, label, on) => `<button class="tab" data-set="${group}" data-val="${value}" aria-pressed="${on}">${label}</button>`;
  ui.innerHTML = `<section class="panel">${panelHead("Settings")}
    <div class="set"><b>Sound</b><div class="opts">${opt("sound", 1, "On", save.sound)}${opt("sound", 0, "Off", !save.sound)}</div></div>
    <div class="set"><b>Graphics</b><div class="opts">${["auto", "high", "medium", "low"].map((q) => opt("quality", q, q[0].toUpperCase() + q.slice(1), save.quality === q)).join("")}</div></div>
    <div class="set"><b>Camera shake</b><div class="opts">${opt("shake", 1, "On", save.shake)}${opt("shake", 0, "Off", !save.shake)}</div></div>
    <div class="set"><b>Progress</b><div class="opts"><button class="tab" data-reset>Reset game</button></div></div>
    <p class="note">Playtest build: your progress stays on this device. Turn your phone sideways for the best view. Arrow keys drive on a computer.</p>
    <p class="note"><a href="../../" style="color:inherit">Back to the arcade</a></p></section>`;
}

ui.addEventListener("click", (e) => {
  const t = (s) => e.target.closest(s);
  let b;
  ensureAudio();
  if ((b = t("[data-nav]"))) {
    const nav = b.dataset.nav;
    if (nav === "play") return startDelivery(nextRoute());
    if (nav === "daily") {
      const d = SH.dailyDelivery(localDate(), maxRegion());
      d.paid = save.daily.last === localDate();
      return startDelivery(d);
    }
    if (nav === "long") return startDelivery(SH.longHaul(maxRegion(), Date.now().toString(36)));
    if (nav === "routes") state.regionTab = nextRoute().region;
    state.screen = nav;
    return renderScreen();
  }
  if ((b = t("[data-go]")) && !b.disabled) return startDelivery(SH.findDelivery(b.dataset.go));
  if ((b = t("[data-region]")) && !b.disabled) { state.regionTab = Number(b.dataset.region); return renderScreen(); }
  if ((b = t("[data-truck]")) && !b.disabled) {
    const id = b.dataset.truck, spec = SH.truckSpec(id);
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
    if (group === "sound") { save.sound = v === "1"; if (save.sound) { ensureAudio(); setMusic(audio.wantMusic || "music_menu"); } else { engineSound(null, false); const keep = audio.wantMusic; setMusic(""); audio.wantMusic = keep; } }
    if (group === "shake") save.shake = v === "1";
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
  renderScreen();
  kick();
  // Authored models and sounds arrive in the background. The menu truck is
  // rebuilt once they are in; a delivery already under way keeps what it has.
  loadAssets((a) => {
    decodeSounds();
    if (a.done && Object.keys(a.models).length && state.mode === "menu") refreshShowcase();
  });
}
window.__snackHaul = { state, save: () => save, world: () => world, kick, startDelivery, finishDelivery, SH, assets: Assets, audio };
