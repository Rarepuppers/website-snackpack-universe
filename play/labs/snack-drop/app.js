// Snack Drop page: menus, input, the fixed-step loop, sound and saved bests.
// ?bot=1 lets the careful bot play (for screenshots and quick checks).
import { Renderer, TIER_COLORS } from "./render3d.js";
import { loadAssets, soundData, has, url } from "./assets.js";

const SD = window.SnackDrop;
const $ = (id) => document.getElementById(id);
const query = new URLSearchParams(location.search);
const BOT = query.get("bot") === "1";
const DEV = query.get("dev") === "1";
const RUSH_ENABLED = DEV && query.get("rush") === "1";
const PERF = query.get("perf") === "1" ? [] : null;  // ?perf=1: main-thread milliseconds per frame, for dev/perf.mjs

// ════ Save ════════════════════════════════════════════════════════
// Everything lives in one versioned entry, so the app shell has one thing to
// read and back up. Bests and saved games carry the rules version, so results
// from older rules are never mixed with new ones.
const SAVE_KEY = "sp_snackdrop_v1";
function blankSave() { return { v: 1, container: "pantry", mode: "arcade", startTool: "swap", bests: {}, daily: {}, biggest: 0, mute: false, resume: null, counters: { games: 0, finished: 0, days: [], first: "" } }; }
function loadSave() {
  try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.v === 1) return Object.assign(blankSave(), d); } catch (e) { /* fall through */ }
  // First run on this version: bring over the prototype's separate keys.
  const d = blankSave(), old = (k) => { try { const v = localStorage.getItem("sp_snackdrop_" + k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } };
  if (old("best")) d.bests["pantry:classic"] = { score: old("best"), rules: 1 };
  d.biggest = old("biggest") || 0; d.mute = !!old("mute");
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^sp_snackdrop_daily_(\d{4}-\d{2}-\d{2})$/.exec(localStorage.key(i));
      if (m) d.daily[m[1]] = { best: old("daily_" + m[1]) || 0, first: old("daily_" + m[1]) || 0, rules: 1 };
    }
  } catch (e) { /* private mode */ }
  return d;
}
const save = loadSave();
function writeSave() {
  // Keep the daily history short.
  const days = Object.keys(save.daily).sort();
  while (days.length > 60) delete save.daily[days.shift()];
  persistSave();
}
function persistSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* private mode or full */ }
}
// Containers (PLAN 4a). The Daily Drop uses a different one each day, the
// unlock containers included, so every player tries each of them once a week.
const BOXES = SD.CONTAINERS, ORDER = SD.CONTAINER_ORDER;
if (!BOXES[save.container]) save.container = "pantry";
function dailyContainer(key = dayKey()) {
  const [y, m, d] = key.split("-").map(Number);
  return ORDER[Math.floor(Date.UTC(y, m - 1, d) / 86400000) % ORDER.length];
}
function containerFor(m) { return m === "rush" ? "pantry" : m === "daily" ? dailyContainer() : save.container; }
function rushSave() {
  if (!save.rush || typeof save.rush !== "object" || Array.isArray(save.rush)) save.rush = {};
  return save.rush;
}
function bestOf(m, c = containerFor(m)) {
  if (m === "rush") return save.rush?.best?.rules === SD.RUSH_VERSION ? save.rush.best.score : 0;
  if (m === "daily") { const d = save.daily[dayKey()]; return d && d.rules === SD.RULES_VERSION ? d.best : 0; }
  const b = save.bests[c + ":" + m]; return b && b.rules === SD.RULES_VERSION ? b.score : 0;
}
// A best from older rules is kept and shown as such, never mixed with new ones.
function oldBest(m, c) { const b = save.bests[c + ":" + m]; return b && b.rules !== SD.RULES_VERSION ? b.score : 0; }
function bestLabel(m, c) { const b = bestOf(m, c), o = oldBest(m, c); return b ? "best " + b : o ? "best " + o + " (old rules)" : "no best yet"; }
// Pro opens in a container once you score this much in Classic there (PLAN 4b).
const PRO_GATE = 2500;
function proOpen(c) { return DEV || Math.max(bestOf("classic", c), oldBest("classic", c)) >= PRO_GATE; }
if (!["classic", "arcade", "pro"].includes(save.mode)) save.mode = "arcade";
if (!SD.TOOLS[save.startTool]) save.startTool = "swap";

// Local calendar day, not UTC, so the Daily Drop changes at the player's midnight.
function dayKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ════ Sound ═══════════════════════════════════════════════════════
// C major pentatonic, two octaves up from G4.
const CHAIN_NOTES = [392, 440, 523, 587, 659, 784, 880, 1047, 1175, 1319];
// Authored sounds (assets/audio/sfx/*.ogg) play when present; otherwise the
// synthesised tones below stand in.
const buffers = {};
function sample(name, rate = 1, vol = 1) {
  if (sound.muted || !sound.ctx) return false;
  const b = buffers[name];
  if (b === undefined) {
    const data = soundData(name);
    if (!data) return false;
    buffers[name] = null;
    sound.ctx.decodeAudioData(data.slice(0)).then((d) => { buffers[name] = d; }, () => { buffers[name] = false; });
    return false;
  }
  if (!b) return false;
  const src = sound.ctx.createBufferSource(), g = sound.ctx.createGain();
  src.buffer = b; src.playbackRate.value = rate; g.gain.value = vol;
  src.connect(g).connect(sound.ctx.destination); src.start();
  return true;
}
const sound = {
  ctx: null, muted: save.mute,
  wake() { if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); } if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },
  tone(freq, dur, type = "sine", vol = 0.18, slide = 0) {
    if (this.muted || !this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  drop(tier) { if (!sample(SD.TIERS[tier].shape === "circle" ? "sfx/drop_soft" : "sfx/drop_clack")) this.tone(220, 0.12, "triangle", 0.12, 0.6); },
  merge(tier, chain) {
    if (!sample(tier >= 6 ? "sfx/merge_big" : "sfx/merge_small", Math.pow(1.06, tier))) {
      const f = 330 * Math.pow(1.122, tier); this.tone(f, 0.18, "sine", 0.2, 1.5); this.tone(f * 1.5, 0.12, "triangle", 0.08, 1.2);
    }
    // Each chain step plays the next note of a scale, so a long chain sounds like a little tune.
    if (chain >= 2) { const n = CHAIN_NOTES[Math.min(chain - 2, CHAIN_NOTES.length - 1)]; setTimeout(() => this.tone(n, 0.22, "triangle", 0.13), 40); }
  },
  packed() {
    if (sample("sfx/hamper_fanfare")) return; [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, "triangle", 0.16), i * 90)); },
  tool(kind) {
    if (sample("sfx/tool_" + kind)) return;
    if (kind === "get") [784, 988].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, "triangle", 0.1), i * 70));
    else if (kind === "levelup") [523, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, "sine", 0.13), i * 60));
    else if (kind === "spatula") this.tone(440, 0.2, "triangle", 0.12, 1.8);
    else this.tone(660, 0.12, "triangle", 0.1, 0.7);
  },
  shake(kind, lead) {
    if (sample("sfx/shake_" + kind)) return;
    if (kind === "rumble") for (let i = 0; i < 6; i++) setTimeout(() => this.tone(70 + (i % 2) * 15, 0.08, "sawtooth", 0.06), i * 80);
    else if (kind === "bump") setTimeout(() => { this.tone(90, 0.25, "sine", 0.3, 0.5); this.tone(240, 0.12, "triangle", 0.08, 0.6); }, (lead || 0) * 1000);
    else for (let i = 0; i < 12; i++) setTimeout(() => this.tone(45 + (i * 7) % 30, 0.14, "sawtooth", 0.08), i * 100);
  },
  fever() { if (!sample("sfx/fever_start")) [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, "triangle", 0.12), i * 55)); },
  feverEnd() { if (!sample("sfx/fever_end")) this.tone(880, 0.35, "sine", 0.08, 0.5); },
  over() {
    if (sample("sfx/game_over")) return; [392, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, "sine", 0.16), i * 160)); }
};

// ════ State ═══════════════════════════════════════════════════════
const view = new Renderer($("view"));
let game = null, mode = "classic", paused = true, acc = 0, last = performance.now();
let aimX = 0, botRand = SD.rng(99), overShown = false;
// Slow motion and hit-stop only change how many fixed physics steps run per
// frame, never the step itself, so the game plays out the same either way.
let steps = 0, dropLog = [], dirty = false, realGame = false;  // realGame: not the demo crate behind the menu  // physics steps this game and the drops made, for the save and bug reports
let timeScale = 1, hitStop = 0, slowFor = 0, overAt = 0, cardUrl = "", cardBlob = null;
let rushPreview = null, pendingRush = false, rushResult = null;
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;


function buildLadder() {
  const ol = $("ladder");
  ol.innerHTML = SD.TIERS.map((t, i) => `<li style="--c:${TIER_COLORS[i]}" title="${t.name}"></li>`).join("");
}
function updateLadder(newTier) {
  [...$("ladder").children].forEach((li, i) => {
    li.classList.toggle("got", i <= game.best);
    li.classList.toggle("new", i === newTier);
  });
  if (newTier != null) setTimeout(() => $("ladder").children[newTier] && $("ladder").children[newTier].classList.remove("new"), 400);
}

let toastTimer = 0;
function toast(text) {
  const t = $("toast"); t.textContent = text; t.classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 1200);
}

function start(m, resume) {
  if (m === "rush" && !RUSH_ENABLED) return;
  if (m === "rush" || mode === "rush") { pendingDrop = false; pressing = false; }
  rushPreview = null; pendingRush = false; rushResult = null;
  mode = m; realGame = true;
  if (resume) {
    game = SD.createGame({ seed: resume.snap.seed, mode: m, container: resume.snap.container || "pantry", restore: resume.snap });
    steps = resume.steps; dropLog = resume.log.slice();
  } else {
    const seed = m === "daily" ? SD.hash("snackdrop-" + dayKey()) : (Math.random() * 2 ** 31) | 0;
    game = SD.createGame({ seed, mode: m, container: containerFor(m), startTool: save.startTool });
    steps = 0; dropLog = [];
    if (!BOT && m !== "rush") {
      const c = save.counters, d = dayKey();
      c.games++; if (!c.first) c.first = d;
      if (!c.days.includes(d)) { c.days.push(d); if (c.days.length > 90) c.days.shift(); }
    }
  }
  if (m !== "rush") { save.resume = null; writeSave(); }
  view.reset();
  view.setContainer(game.container);
  aimX = m === "rush" && resume ? game.aim : 0; acc = 0; overShown = false; paused = false;
  timeScale = 1; hitStop = 0; slowFor = 0; overAt = 0;
  feverEl.classList.remove("on"); $("score").classList.remove("hot");
  $("hud").classList.toggle("no-next", !!game.rules.hideNext);
  disarm(); pendingTool = null; game.events.length = 0; updateTray();
  chainEl.classList.remove("on");
  $("hud").hidden = false; $("ladder").hidden = false;
  $("score").textContent = String(game.score);
  $("bestline").textContent = (m === "rush" ? "Rush best " : m === "daily" ? "Today's best " : "Best ") + bestOf(m);
  updateLadder();
  closeSheet();
  if (m === "rush") saveGame();
  renderRush();
  sound.wake();
}

// The game in progress, saved after every drop and when the page is hidden,
// so closing the tab or the app picks up where it left off.
function saveGame() {
  if (BOT || !realGame || !game || game.status !== "playing") return;
  if (mode === "rush") {
    rushSave().resume = { mode, steps, log: dropLog, snap: game.snapshot() };
    persistSave();
  } else {
    if (!game.drops || game.shake || game.guard > 0) return;
    save.resume = { mode, day: dayKey(), steps, log: dropLog, snap: game.snapshot() };
    writeSave();
  }
  dirty = false;
}
function savedGame() {
  const r = save.resume;
  if (!r || !r.snap || r.snap.rules !== SD.RULES_VERSION) return null;
  if (r.mode === "daily" && r.day !== dayKey()) return null;  // yesterday's Daily Drop is over
  return r;
}
function savedRush() {
  const r = RUSH_ENABLED && save.rush?.resume;
  return r?.mode === "rush" && r.snap?.mode === "rush" && r.snap.rules === SD.RUSH_VERSION &&
    r.snap.rush && Array.isArray(r.log) ? r : null;
}
// Dev only (?dev=1): the seed and every drop, which replays this exact game in dev/sim.js.
function gameCode() { return JSON.stringify({ rules: mode === "rush" ? SD.RUSH_VERSION : SD.RULES_VERSION, seed: game.seed, mode, steps, log: dropLog }); }

// ════ Sheets ══════════════════════════════════════════════════════
function openSheet(html) { $("sheet").innerHTML = html; $("veil").classList.add("on"); const b = $("sheet").querySelector("button"); if (b) b.focus(); }
function closeSheet() { $("veil").classList.remove("on"); }
function tiersHtml() { return `<div class="tiers">${SD.TIERS.map((t, i) => `<span style="--c:${TIER_COLORS[i]}">${t.name}</span>`).join("")}</div>`; }

// The mode the Play button starts: the last one picked, if open in this container.
function playMode() { return save.mode === "pro" ? (proOpen(save.container) ? "pro" : "arcade") : save.mode; }

function home() {
  paused = true;
  const today = save.daily[dayKey()] && save.daily[dayKey()].rules === SD.RULES_VERSION ? save.daily[dayKey()] : null, resume = savedGame();
  const rush = savedRush();
  renderRush();
  const daily = today ? (today.first === today.best ? "Today " + today.best : "First try " + today.first + " · best " + today.best) : "";
  openSheet(`
    <h1 id="sheet-title">Snack Drop</h1>
    <p>Drop snacks in the crate. Two of the same make the next snack up. Keep the pile under the red line.</p>
    ${tiersHtml()}
    <div class="stack">
      ${resume ? `<button class="btn primary" data-act="continue">Continue<small>${SD.MODES[resume.mode].name} · ${BOXES[resume.snap.container || "pantry"].name} · ${resume.snap.score} points</small></button>` : ""}
      <button class="btn${resume ? "" : " primary"}" data-go="${playMode()}">${resume ? "New game" : "Play"}<small>${SD.MODES[playMode()].name} · ${BOXES[save.container].name} · ${bestLabel(playMode(), save.container)}</small></button>
      <div class="modes" role="radiogroup" aria-label="Mode">${["classic", "arcade", "pro"].map((m) => {
        const locked = m === "pro" && !proOpen(save.container);
        return `<button class="mode${m === playMode() ? " on" : ""}" role="radio" aria-checked="${m === playMode()}" data-mode="${m}"${locked ? " disabled" : ""}><b>${SD.MODES[m].name}</b><small>${m === "classic" ? "Pure: drops, merges, chains" : m === "arcade" ? "With tools" : locked ? "Score " + PRO_GATE.toLocaleString("en-US") + " in Classic here to open" : "Lower line, 1 second, no preview"}</small></button>`;
      }).join("")}</div>
      ${playMode() === "arcade" ? `<div class="start-tool" role="radiogroup" aria-label="Starting tool"><span>Start with</span>${SD.TOOL_ORDER.map((t) => `<button class="chip${t === save.startTool ? " on" : ""}" role="radio" aria-checked="${t === save.startTool}" data-start="${t}">${toolGlyph(t)} ${SD.TOOLS[t].name}</button>`).join("")}</div>` : ""}
      <div class="boxes" role="radiogroup" aria-label="Container">${ORDER.map((id) => `<button class="box${id === save.container ? " on" : ""}" role="radio" aria-checked="${id === save.container}" data-box="${id}"><b>${BOXES[id].name}</b><small>${BOXES[id].blurb}</small>${BOXES[id].free ? "" : '<i>Full game</i>'}</button>`).join("")}</div>
      <button class="btn" data-go="daily">Daily Drop<small>${daily || "Today in the " + BOXES[dailyContainer()].name + ", same snacks for everyone"}</small></button>
      ${RUSH_ENABLED ? `${rush ? `<button class="btn" data-act="continue-rush">Continue Rush<small>${rush.snap.score} points</small></button>` : ""}<button class="btn" data-go="rush">${rush ? "New Rush game" : "Play Rush"}<small>Rapid Drop · Pantry Box · Best ${bestOf("rush")}</small></button>` : ""}
    </div>
    <p class="how">Prototype. Move to aim, let go to drop. Keyboard: ← → and Space.</p>`);
}

function pauseSheet() {
  paused = true;
  if (mode === "rush") { saveGame(); renderRush(); }
  openSheet(`
    <h2 id="sheet-title">Paused</h2>
    <p>Score ${game.score}</p>
    <div class="stack">
      <button class="btn primary" data-act="resume">Keep going</button>
      <button class="btn" data-go="${mode}">Start again</button>
      <button class="btn" data-act="home">Menu</button>
      ${DEV ? '<button class="btn" data-act="code">Copy game code</button>' : ""}
    </div>`);
}


// The score card: a picture of the crate as it ended plus the numbers, made on
// a 2D canvas so it can be shared as an image.
function makeCard(isBest) {
  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#f6e3c8"; x.fillRect(0, 0, W, H);
  // The crate at the normal camera, rendered this instant so the WebGL buffer
  // is still there to copy, cropped around the crate.
  view.release(); view.push.amount = 0;
  view.draw(game, 0, false);
  const src = view.renderer.domElement, sw = src.width, sh = src.height, r = src.getBoundingClientRect();
  const tl = view.toScreen(-SD.CRATE.half - 0.6, SD.CRATE.height + 0.6), br = view.toScreen(SD.CRATE.half + 0.6, -0.4);
  const sx0 = (tl.x - r.left) / r.width * sw, sy0 = (tl.y - r.top) / r.height * sh;
  const cw = (br.x - tl.x) / r.width * sw, ch = (br.y - tl.y) / r.height * sh;
  const box = { x: 90, y: 260, w: 900, h: 720 }, k = Math.min(box.w / cw, box.h / ch);
  const dw = cw * k, dh = ch * k;
  x.save(); roundRect(x, box.x, box.y, box.w, box.h, 40); x.clip();
  x.fillStyle = "#f3dcc0"; x.fillRect(box.x, box.y, box.w, box.h);
  x.drawImage(src, sx0, sy0, cw, ch, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
  x.restore();
  x.textAlign = "center"; x.fillStyle = "#3a2414";
  x.font = "700 64px Fraunces, Georgia, serif"; x.fillText("Snack Drop", W / 2, 110);
  x.font = "700 34px 'DM Sans', system-ui, sans-serif"; x.fillStyle = "#7a5a40";
  x.fillText(SD.MODES[mode].name + " · " + BOXES[game.container].name + " · " + dayKey(), W / 2, 170);
  if (isBest) { x.fillStyle = "#f7b73d"; roundRect(x, W / 2 - 150, 196, 300, 48, 24); x.fill(); x.fillStyle = "#33210a"; x.font = "800 28px 'DM Sans', system-ui, sans-serif"; x.fillText("New best!", W / 2, 230); }
  x.fillStyle = "#3a2414"; x.font = "700 150px Fraunces, Georgia, serif"; x.fillText(String(game.score), W / 2, 1120);
  const stats = [["Best snack", SD.TIERS[game.best].name], ["Longest chain", game.maxChain >= 2 ? "×" + game.maxChain : "—"], ["Fevers", String(game.fevers)], ["Drops", String(game.drops)]];
  stats.forEach(([label, value], i) => {
    const cx = [190, 450, 690, 900][i];
    x.font = "700 28px 'DM Sans', system-ui, sans-serif"; x.fillStyle = "#7a5a40"; x.fillText(label, cx, 1190);
    x.font = "800 40px 'DM Sans', system-ui, sans-serif"; x.fillStyle = "#3a2414"; x.fillText(value, cx, 1245);
  });
  x.fillStyle = TIER_COLORS[game.best]; x.beginPath(); x.arc(190 - x.measureText(stats[0][1]).width / 2 - 24, 1231, 13, 0, Math.PI * 2); x.fill();
  x.font = "600 26px 'DM Sans', system-ui, sans-serif"; x.fillStyle = "#7a5a40"; x.fillText("snackpackuniverse.com/play", W / 2, 1310);
  return c;
}
function roundRect(x, l, t, w, h, r) { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); }

function shareText() {
  return `Snack Drop ${mode === "daily" ? "Daily " + dayKey() : SD.MODES[mode].name} in the ${BOXES[game.container].name}: ${game.score} points, made a ${SD.TIERS[game.best].name}${game.maxChain >= 2 ? ", chain ×" + game.maxChain : ""}${game.fevers ? ", " + game.fevers + " Fever" + (game.fevers > 1 ? "s" : "") : ""}. https://www.snackpackuniverse.com/play/labs/snack-drop/`;
}

function overSheet() {
  if (mode === "rush") {
    const { prev, isBest } = rushResult;
    openSheet(`
      <h2 id="sheet-title">${isBest ? "New Rush best!" : "Rush complete"}</h2>
      <p>${game.score} points · Best ${Math.max(prev, game.score)}</p>
      <p>${game.drops} manual drops · ${game.rush.drops} conveyor drops</p>
      <div class="stack">
        <button class="btn primary" data-go="rush">Play Rush again</button>
        <button class="btn" data-act="home">Menu</button>
      </div>`);
    return;
  }
  const prev = bestOf(mode, game.container), isBest = game.score > prev && game.score > 0;
  if (mode === "daily") {
    // The first finished game of the day is the one that counts; replays are practice.
    let d = save.daily[dayKey()];
    if (!d || d.rules !== SD.RULES_VERSION) d = save.daily[dayKey()] = { best: 0, first: 0, rules: SD.RULES_VERSION };
    if (!d.first) d.first = game.score;
    d.best = Math.max(d.best, game.score);
  } else if (isBest) save.bests[game.container + ":" + mode] = { score: game.score, rules: SD.RULES_VERSION };
  if (game.best > save.biggest) save.biggest = game.best;
  save.counters.finished++; save.resume = null; writeSave();
  view.release();
  const card = makeCard(isBest);
  if (cardUrl) URL.revokeObjectURL(cardUrl);
  cardUrl = ""; cardBlob = null;
  card.toBlob((b) => { cardBlob = b; if (b) { cardUrl = URL.createObjectURL(b); const img = $("card"); if (img) img.src = cardUrl; } }, "image/png");
  openSheet(`
    <h2 id="sheet-title">${isBest ? "New best!" : "Crate's full"}</h2>
    <img class="card" id="card" alt="Score card: ${game.score} points, best snack ${SD.TIERS[game.best].name}">
    <p class="sr">${game.score} points. Best snack ${SD.TIERS[game.best].name}. ${game.drops} drops.${isBest ? "" : " Best " + prev + "."}</p>
    <div class="stack">
      <button class="btn primary" data-go="${mode}">${mode === "daily" ? "Try today's again" : "Play again"}</button>
      <button class="btn" data-act="share">Share card</button>
      <button class="btn" data-act="home">Menu</button>
    </div>`);
}

$("sheet").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  sound.wake();
  if (b.dataset.go) return start(b.dataset.go);
  if (b.dataset.start) { save.startTool = b.dataset.start; writeSave(); home(); const f = $("sheet").querySelector(`[data-start="${save.startTool}"]`); if (f) f.focus(); return; }
  if (b.dataset.mode) { save.mode = b.dataset.mode; writeSave(); home(); const f = $("sheet").querySelector(`[data-mode="${save.mode}"]`); if (f) f.focus(); return; }
  if (b.dataset.box) { save.container = b.dataset.box; writeSave(); demo(save.container); home(); const f = $("sheet").querySelector(`[data-box="${save.container}"]`); if (f) f.focus(); return; }
  const act = b.dataset.act;
  if (act === "resume") { closeSheet(); paused = false; renderRush(); }
  if (act === "continue") { const r = savedGame(); if (r) start(r.mode, r); return; }
  if (act === "continue-rush") { const r = savedRush(); if (r) start("rush", r); return; }
  if (act === "code" && navigator.clipboard) navigator.clipboard.writeText(gameCode()).then(() => { b.textContent = "Copied"; });
  if (act === "home") { saveGame(); home(); }
  if (act === "share") {
    const text = shareText();
    const file = cardBlob && typeof File === "function" ? new File([cardBlob], "snack-drop-" + game.score + ".png", { type: "image/png" }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], text }).catch(() => {});
    else if (navigator.share) navigator.share({ text }).catch(() => {});
    else {
      // Desktop: save the picture and copy the text.
      if (cardUrl) { const a = document.createElement("a"); a.href = cardUrl; a.download = "snack-drop-" + game.score + ".png"; a.click(); }
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { b.textContent = "Saved and copied"; });
    }
  }
});

$("pause").addEventListener("click", () => { if (game && game.status === "playing") pauseSheet(); });
function muteLabel() {
  const f = sound.muted ? "ui/sound_off.webp" : "ui/sound_on.webp";
  if (has(f)) $("mute").innerHTML = `<img src="${url(f)}" alt="">`; else $("mute").textContent = sound.muted ? "🔇" : "🔊"; $("mute").setAttribute("aria-label", sound.muted ? "Sound off" : "Sound on"); }
$("mute").addEventListener("click", () => { sound.muted = !sound.muted; save.mute = sound.muted; writeSave(); muteLabel(); sound.wake(); });
muteLabel();

// ════ Input ═══════════════════════════════════════════════════════
// Tap and hold: the snack follows the finger (or mouse) for as long as it is
// held, and letting go drops it. A quick tap drops where you tapped. A press
// that starts on a button never drops a snack.
// Phones would otherwise turn a long press into a context menu (Android) or a
// callout and text selection (iOS), which cancels the touch mid-hold, so those
// are switched off and the pointer is captured for the whole press.
let pressing = false, pendingDrop = false, armedPress = false;
const canvas = $("view");
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (paused || game?.rush?.active || pendingRush) return;
  // With a tool armed, a press picks a snack and never drops one.
  if (armed) { armedPress = true; pendingDrop = false; return; }
  pressing = true; aimX = view.worldX(e.clientX, e.clientY); sound.wake();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
});
canvas.addEventListener("pointermove", (e) => { if (paused) return; if (pressing || e.pointerType === "mouse") aimX = view.worldX(e.clientX, e.clientY); });
canvas.addEventListener("pointerup", (e) => {
  if (armedPress) { armedPress = false; if (!paused && armed) pickTarget(e.clientX, e.clientY); return; }
  if (paused || !pressing) return;
  pressing = false;
  if (game?.rush?.active || pendingRush) return;
  aimX = view.worldX(e.clientX, e.clientY); pendingDrop = true; });
canvas.addEventListener("pointercancel", () => { pressing = false; });
const keys = {};
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && rushPreview && !paused) { cancelRushPreview(); return; }
  if (e.key === "Escape" && armed) return disarm();
  if (e.key === "Escape" && game && game.status === "playing" && !paused) return pauseSheet();
  if (paused) return;
  keys[e.key] = true;
  if ((e.key === " " || e.key === "ArrowDown" || e.key === "Enter") && !armed) {
    if (game?.rush && (e.key === " " || e.key === "Enter") &&
      (e.target === $("rush-action") || e.target === $("rush-cancel"))) return;
    e.preventDefault();
    if (!game?.rush?.active && !pendingRush) pendingDrop = true;
  }
});
window.addEventListener("keyup", (e) => { keys[e.key] = false; });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden || !realGame || !game || game.status !== "playing" || BOT) return;
  saveGame();
  if (!paused) pauseSheet();
});
window.addEventListener("pagehide", () => { if (game && game.status === "playing" && !paused) saveGame(); });

function renderRush() {
  const controls = $("rush-controls"), action = $("rush-action"), cancel = $("rush-cancel");
  const active = game?.rush?.active;
  controls.hidden = !(game?.rush && realGame && !paused && game.status === "playing");
  const slots = rushPreview || active?.slots;
  $("rush-rail").hidden = controls.hidden || !slots;
  if (controls.hidden) return;
  const { charges, queued } = game.rush;
  $("rush-count").textContent = `${charges}/${SD.RUSH.stock} charges · ${queued ? "Next burst queued"
    : active ? `Conveyor ${active.index}/${active.slots.length}`
    : charges ? "Earn a charge every 8 manual drops" : `${game.drops % SD.RUSH.earnEvery}/${SD.RUSH.earnEvery} manual drops to recharge`}`;
  action.disabled = pendingRush || !game.canRush();
  action.textContent = rushPreview ? (active ? "Queue burst" : "Start burst") : active ? "Preview next burst" : "Rapid Drop";
  cancel.hidden = !rushPreview;
  const lanes = $("rush-lanes");
  lanes.hidden = !slots;
  if (!slots) return;
  const labels = slots.map(({ lane, tier }, i) => ({ lane, tier, order: i + 1 })).sort((a, b) => a.lane - b.lane);
  const next = (order) => !rushPreview && order === active.index + 1 ? ' class="next"' : "";
  lanes.innerHTML = labels.map(({ tier, order }) => `<li${next(order)}>
    <b>${order}</b> ${SD.TIERS[tier].name}</li>`).join("");
  $("rush-rail").innerHTML = labels.map(({ order }) => `<span${next(order)}>${order}</span>`).join("");
}

function positionRushRail() {
  const rail = $("rush-rail");
  if (rail.hidden) return;
  const lanes = SD.RUSH.lanes, y = SD.CRATE.dropY + .82;
  const left = view.toScreen(lanes[0], y), right = view.toScreen(lanes.at(-1), y);
  rail.style.left = `${left.x - 11}px`;
  rail.style.top = `${(left.y + right.y) / 2 - 11}px`;
  rail.style.width = `${right.x - left.x + 22}px`;
}

function cancelRushPreview() { rushPreview = null; renderRush(); $("rush-action").focus(); }
$("rush-cancel").addEventListener("click", cancelRushPreview);
$("rush-action").addEventListener("click", () => {
  if (paused || pendingRush || !game?.canRush?.()) return;
  if (!rushPreview) rushPreview = game.rushPreview();
  else {
    rushPreview = null; pendingRush = true; pendingDrop = false; pressing = false;
    sound.wake();
  }
  renderRush();
});

// ════ Tools ═══════════════════════════════════════════════════════
// Arcade and Daily Drop (PLAN 9). Tap a tool to use it: Swap works straight
// away; Spatula and Level Up arm, the snacks they can act on get a ring, and
// the next tap on one of them uses the tool. Tap the tool again, or outside
// the crate, to cancel. While a tool is armed, nothing drops.
let armed = null, pendingTool = null;
const tray = $("tray"), hint = $("hint");
const GLYPH = {
  rumble: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="8" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 9v6M21 9v6M1 11v2M23 11v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  bump: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="10" y="7" width="11" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M2 13h6M5.5 10 8.5 13l-3 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  quake: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M2 20l4-3 3 3 3-3 3 3 3-3 4 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h12l-3-3M19 15H7l3 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spatula: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="9" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8.5 11v1.5l8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  levelup: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 17V8M8 11.5 12 7.5l4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function toolGlyph(id) { const f = "ui/tool_" + id + ".webp"; return has(f) ? `<img src="${url(f)}" alt="">` : GLYPH[id]; }
function updateTray() {
  const on = !!(game && game.rules && game.rules.tools && realGame);
  tray.hidden = !on;
  if (!on) return;
  const slots = [];
  for (let i = 0; i < SD.TOOL_EARN.slots; i++) {
    const id = game.tray[i];
    slots.push(id
      ? `<button class="tool${armed === id && game.tray.indexOf(id) === i ? " armed" : ""}${SD.TOOLS[id].rare ? " rare" : ""}${SD.TOOLS[id].shake && !game.canUse(id, "l") ? " wait" : ""}" data-tool="${id}" aria-label="${SD.TOOLS[id].name}">${toolGlyph(id)}<small>${SD.TOOLS[id].name}</small></button>`
      : `<span class="tool empty" aria-hidden="true"></span>`);
  }
  tray.innerHTML = slots.join("");
}
function disarm() { armed = null; view.armed = null; hint.classList.remove("on"); document.body.classList.remove("arming"); updateTray(); }
function arm(id) {
  armed = id; document.body.classList.add("arming");
  hint.textContent = id === "spatula" ? "Tap a snack to lift it out" : id === "bump" ? "Tap the side of the crate to knock" : "Tap a snack to make it one bigger";
  hint.classList.add("on"); updateTray();
}
tray.addEventListener("click", (e) => {
  const b = e.target.closest("[data-tool]");
  if (!b || paused || !game || game.status !== "playing") return;
  sound.wake();
  const id = b.dataset.tool;
  if (armed === id) return disarm();
  const T = SD.TOOLS[id];
  if (T.shake && !T.side) { if (!game.canUse(id)) return; disarm(); pendingTool = { id }; return; }
  if (!T.target && !T.side) { disarm(); pendingTool = { id }; return; }
  arm(id);
});
// Which snack a tap means: the one under the finger, or the nearest one it can act on.
function pickTarget(cx, cy) {
  const p = view.worldPoint(cx, cy), C = SD.CRATE;
  if (armed === "bump") {
    // Bump: whichever side of the crate was tapped is the side that gets knocked.
    if (p.y < -1 || p.y > C.height + 2) return disarm();
    const side = p.x < 0 ? "l" : "r";
    if (game.canUse("bump", side)) { pendingTool = { id: "bump", target: side }; disarm(); }
    return;
  }
  if (Math.abs(p.x) > C.half + 0.5 || p.y < -0.6 || p.y > C.height + 1.5) return disarm();
  let best = null, bestD = 1e9;
  for (const sn of game.snacks) {
    if (!game.canUse(armed, sn.id)) continue;
    const q = sn.body.getPosition(), t = SD.TIERS[sn.tier];
    const d = sn.fixture.testPoint(p) ? 0 : Math.hypot(q.x - p.x, q.y - p.y) - Math.max(t.halfW, t.halfH);
    if (d < bestD) { bestD = d; best = sn; }
  }
  if (best && bestD < 0.45) { pendingTool = { id: armed, target: best.id }; disarm(); }
}

// ════ Pop-ups and the chain counter ═════════════════════════════════
const popLayer = $("pops"), chainEl = $("chain");
const popPool = Array.from({ length: 14 }, () => { const d = document.createElement("div"); d.className = "pop"; popLayer.appendChild(d); return d; });
let popNext = 0, chainTimer = 0;
function scorePop(ev) {
  const d = popPool[popNext]; popNext = (popNext + 1) % popPool.length;
  const at = view.toScreen(ev.x, ev.y);
  d.textContent = "+" + ev.points + (ev.mult > 1 ? " ×" + ev.mult.toFixed(2).replace(/\.?0+$/, "") : "");
  d.className = "pop" + (ev.mult > 1 || ev.type === "packed" ? " gold" : "") + (ev.tier >= 8 ? " big" : "");
  d.style.left = at.x + "px"; d.style.top = at.y + "px";
  void d.offsetWidth; d.classList.add("go");
}
// Fever badge: shows while it lasts, with a bar that drains.
const feverEl = $("fever"), feverBar = feverEl.querySelector("i");
let feverMax = SD.FEVER.time;
function feverHud() {
  const on = game && game.fever > 0 && game.status === "playing";
  feverEl.classList.toggle("on", on);
  $("score").classList.toggle("hot", on);
  if (on) feverBar.style.transform = `scaleX(${Math.min(1, game.fever / feverMax)})`;
}
// Colours climb with the chain, from cream to gold to hot pink.
const CHAIN_COLORS = ["#fff8ee", "#ffe39a", "#f7b73d", "#f28c3a", "#ee6b5f", "#e0448f"];
function showChain(n) {
  chainEl.textContent = "Chain ×" + n;
  chainEl.style.setProperty("--c", CHAIN_COLORS[Math.min(n - 2, CHAIN_COLORS.length - 1)]);
  chainEl.style.setProperty("--s", String(1 + Math.min(n - 2, 6) * 0.12));
  chainEl.classList.remove("bump"); void chainEl.offsetWidth; chainEl.classList.add("on", "bump");
  clearTimeout(chainTimer); chainTimer = setTimeout(() => chainEl.classList.remove("on"), (SD.BALANCE.chainWindow + 0.5) * 1000);
}

// ════ Loop ════════════════════════════════════════════════════════
function handle(ev) {
  view.onEvent(ev);
  if (ev.type === "drop") { sound.drop(ev.tier); updateLadder(); dirty = true; }
  if (ev.type === "rush" && ev.action === "blocked") toast("Conveyor blocked · charge kept");
  if (ev.type === "merge") {
    sound.merge(ev.tier, ev.chain);
    scorePop(ev);
    if (ev.chain >= 2) showChain(ev.chain);
    if (ev.tier === game.best && game.made[ev.tier] === 1 && ev.tier >= 4) toast(`First ${SD.TIERS[ev.tier].name}!`);
    updateLadder(game.made[ev.tier] === 1 ? ev.tier : null);
    // Hit-stop from Layer Cake up; a short slow motion and camera push for Big Burger.
    if (!REDUCED && ev.tier >= 8) hitStop = 0.06;
    if (!REDUCED && ev.tier >= 9) { slowFor = 0.3; view.pushTo(ev.x, ev.y, 0.25); }
  }
  if (ev.type === "tool") { updateTray(); if (ev.why !== "start") toast(ev.why === "rare" ? "Rare tool: Earthquake!" : "New tool: " + SD.TOOLS[ev.id].name); sound.tool("get"); }
  if (ev.type === "swap" || ev.type === "spatula" || ev.type === "levelup") { updateTray(); sound.tool(ev.type); }
  if (ev.type === "shake") { updateTray(); sound.shake(ev.kind, ev.lead); if (ev.kind === "quake") toast("Earthquake!"); }
  if (ev.type === "shakeEnd") updateTray();
  if (ev.type === "fever") {
    feverMax = ev.time;
    if (ev.start) { sound.fever(); toast("Fever! ×" + SD.FEVER.mult + " for " + SD.FEVER.time + " s"); view.shake = Math.max(view.shake, 0.12); }
    else toast("Fever +" + SD.FEVER.extend + " s");
  }
  if (ev.type === "feverEnd") sound.feverEnd();
  if (ev.type === "packed") {
    sound.packed(); scorePop(ev); toast(`Hamper packed! +${ev.points}`);
    if (!REDUCED) { hitStop = 0.06; slowFor = 0.3; view.pushTo(ev.x, ev.y, 0.25); }
  }
  if (ev.type === "over") {
    if (game.rush) {
      const prev = bestOf("rush"), isBest = game.score > prev;
      rushResult = { prev, isBest };
      if (isBest) rushSave().best = { rules: SD.RUSH_VERSION, score: game.score };
      rushSave().resume = null;
      persistSave();
      renderRush();
    }
    // Slow motion and a camera push onto the snack that went over the line.
    let worst = null;
    for (const s of game.snacks) if (!worst || s.over > worst.over) worst = s;
    if (worst) { const p = worst.body.getPosition(); view.pushTo(p.x, p.y, 0.55); }
    feverEl.classList.remove("on"); $("score").classList.remove("hot");
    disarm(); tray.hidden = true;
    sound.over();
  }
}

function frame(now) {
  const t0 = PERF ? performance.now() : 0;
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (game && !paused && game.status === "playing") {
    const speed = 6 * dt;
    if (keys.ArrowLeft) aimX -= speed;
    if (keys.ArrowRight) aimX += speed;
    if (hitStop > 0) { hitStop -= dt; timeScale = 0; }
    else if (slowFor > 0) { slowFor -= dt; timeScale = 0.35; if (slowFor <= 0) view.release(); }
    else timeScale = 1;
    acc += dt * timeScale;
    let n = 0;
    while (acc >= SD.STEP && n < 6) {
      view.beforeStep(game);
      let drop = null;
      if (BOT) { if (game.canDrop() && game.snacks.every((s) => s.landed)) { aimX = SD.botAim(game, "careful", botRand); drop = aimX; } }
      else if (pendingDrop && game.canDrop()) { drop = aimX; pendingDrop = false; }
      let tool = null;
      if (pendingTool && !BOT) { tool = pendingTool; pendingTool = null; drop = null; dropLog.push([steps, "t", tool.id, tool.target == null ? null : tool.target]); }
      if (drop != null && game.status === "playing") dropLog.push([steps, drop]);
      const rush = pendingRush;
      if (rush) { pendingRush = false; dropLog.push([steps, "rush"]); }
      game.step({ aim: aimX, drop, tool, rush });
      steps++;
      aimX = game.aim;
      for (const ev of game.events) handle(ev);
      if (game.rush && (rush || game.events.some((ev) => ev.type === "rush" || ev.type === "drop"))) {
        renderRush();
        saveGame();
      }
      game.events.length = 0;
      acc -= SD.STEP; n++;
    }
    if (n === 6) acc = 0;
    view.alpha = Math.min(1, acc / SD.STEP);
    $("score").textContent = game.score;
    feverHud();
    // The shake buttons wait while the last drop is still falling.
    if (game.rules.tools && (game.time - game.lastDrop) < SD.SHAKE.gap + 0.05 && (game.time - game.lastDrop) > SD.SHAKE.gap - 0.05) updateTray();
    if (armed) {
      const ids = new Set(); for (const sn of game.snacks) if (game.canUse(armed, sn.id)) ids.add(sn.id);
      view.armed = ids;
      if (!game.tray.includes(armed)) disarm();
    }
    // Save once the drop has settled a little, not mid-fall.
    if (dirty && game.status === "playing" && game.snacks.every((s) => s.landed)) saveGame();
  } else if (game && game.status === "over") {
    // The pile keeps settling in slow motion while the camera moves in.
    overAt += dt;
    acc += dt * (REDUCED ? 1 : 0.3);
    while (acc >= SD.STEP) { view.beforeStep(game); game.step({}); acc -= SD.STEP; }
    view.alpha = Math.min(1, acc / SD.STEP);
    game.events.length = 0;
    if (!overShown && overAt > 1.3) { overShown = true; overSheet(); }
  } else view.alpha = 1;
  if (game) {
    view.draw(game, dt, !paused && !game.rush?.active);
    if (game.rush) positionRushRail();
  }
  else view.renderer.render(view.scene, view.camera);
  if (PERF && PERF.length < 20000) PERF.push(performance.now() - t0);
  requestAnimationFrame(frame);
}

buildLadder();
// A demo crate behind the menu, so the first thing you see is the game, in
// the container the player has picked.
function demo(c) {
  realGame = false;
  game = SD.createGame({ seed: 7, container: c });
  const r = SD.rng(99);
  for (let i = 0; i < 60 * 14; i++) { if (game.canDrop() && game.snacks.every((s) => s.landed)) game.step({ drop: SD.botAim(game, "careful", r) }); else game.step({}); }
  game.events.length = 0;
  view.reset(); view.setContainer(c);
  if (typeof updateTray === "function") updateTray();
}
demo(save.container);
if (BOT) start("classic"); else home();
requestAnimationFrame(frame);
window.__snackdrop = { get game() { return game; }, view, save, gameCode, perf: PERF };

// Authored art and sound, when the manifest lists any. Until then, and if
// anything fails, the code-built models and synthesised sounds stay.
function applyAssets() {
  view.refreshAssets();
  [...$("ladder").children].forEach((li, i) => {
    const f = "ui/snack_" + SD.TIERS[i].id + ".webp";
    if (has(f)) { li.style.backgroundImage = `url("${url(f)}")`; li.classList.add("pic"); }
  });
  [["pause", "ui/pause.webp"], ["mute", sound.muted ? "ui/sound_off.webp" : "ui/sound_on.webp"]].forEach(([id, f]) => {
    const b = $(id);
    if (has(f)) b.innerHTML = `<img src="${url(f)}" alt="">`;
  });
}
loadAssets(applyAssets);
