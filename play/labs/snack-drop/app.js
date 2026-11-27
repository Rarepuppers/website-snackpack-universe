// Snack Drop page: menus, input, the fixed-step loop, sound and saved bests.
// ?bot=1 lets the careful bot play (for screenshots and quick checks).
import { Renderer, TIER_COLORS } from "./render3d.js";

const SD = window.SnackDrop;
const $ = (id) => document.getElementById(id);
const query = new URLSearchParams(location.search);
const BOT = query.get("bot") === "1";

// ════ Save ════════════════════════════════════════════════════════
const store = {
  get(k, d) { try { const v = localStorage.getItem("sp_snackdrop_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("sp_snackdrop_" + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
};
// Local calendar day, not UTC, so the Daily Drop changes at the player's midnight.
function dayKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ════ Sound ═══════════════════════════════════════════════════════
const sound = {
  ctx: null, muted: store.get("mute", false),
  wake() { if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); } if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },
  tone(freq, dur, type = "sine", vol = 0.18, slide = 0) {
    if (this.muted || !this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  drop() { this.tone(220, 0.12, "triangle", 0.12, 0.6); },
  merge(tier, chain) { const f = 330 * Math.pow(1.122, tier) * (1 + 0.06 * (chain - 1)); this.tone(f, 0.18, "sine", 0.2, 1.5); this.tone(f * 1.5, 0.12, "triangle", 0.08, 1.2); },
  packed() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, "triangle", 0.16), i * 90)); },
  over() { [392, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, "sine", 0.16), i * 160)); }
};

// ════ State ═══════════════════════════════════════════════════════
const view = new Renderer($("view"));
let game = null, mode = "classic", paused = true, acc = 0, last = performance.now();
let aimX = 0, botRand = SD.rng(99), overShown = false;

function bestKey() { return mode === "daily" ? "daily_" + dayKey() : "best"; }

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

function start(m) {
  mode = m;
  const seed = m === "daily" ? SD.hash("snackdrop-" + dayKey()) : (Math.random() * 2 ** 31) | 0;
  game = SD.createGame({ seed, mode: m });
  view.reset();
  aimX = 0; acc = 0; overShown = false; paused = false;
  $("hud").hidden = false; $("ladder").hidden = false;
  $("score").textContent = "0";
  $("bestline").textContent = (m === "daily" ? "Today's best " : "Best ") + store.get(bestKey(), 0);
  updateLadder();
  closeSheet();
  sound.wake();
}

// ════ Sheets ══════════════════════════════════════════════════════
function openSheet(html) { $("sheet").innerHTML = html; $("veil").classList.add("on"); const b = $("sheet").querySelector("button"); if (b) b.focus(); }
function closeSheet() { $("veil").classList.remove("on"); }
function tiersHtml() { return `<div class="tiers">${SD.TIERS.map((t, i) => `<span style="--c:${TIER_COLORS[i]}">${t.name}</span>`).join("")}</div>`; }

function home() {
  paused = true;
  const daily = store.get("daily_" + dayKey(), 0);
  openSheet(`
    <h1 id="sheet-title">Snack Drop</h1>
    <p>Drop snacks in the crate. Two of the same make the next snack up. Keep the pile under the red line.</p>
    ${tiersHtml()}
    <div class="stack">
      <button class="btn primary" data-go="classic">Play<small>Best ${store.get("best", 0)}</small></button>
      <button class="btn" data-go="daily">Daily Drop<small>${daily ? "Today's best " + daily : "Everyone gets the same snacks today"}</small></button>
    </div>
    <p class="how">Prototype. Move to aim, let go to drop. Keyboard: ← → and Space.</p>`);
}

function pauseSheet() {
  paused = true;
  openSheet(`
    <h2 id="sheet-title">Paused</h2>
    <p>Score ${game.score}</p>
    <div class="stack">
      <button class="btn primary" data-act="resume">Keep going</button>
      <button class="btn" data-go="${mode}">Start again</button>
      <button class="btn" data-act="home">Menu</button>
    </div>`);
}

function overSheet() {
  const key = bestKey(), prev = store.get(key, 0), isBest = game.score > prev;
  if (isBest) store.set(key, game.score);
  const biggest = SD.TIERS[game.best].name;
  if (game.best > store.get("biggest", 0)) store.set("biggest", game.best);
  sound.over();
  openSheet(`
    <h2 id="sheet-title">${isBest ? "New best!" : "Crate's full"}</h2>
    <div class="big">${game.score}</div>
    <p>Biggest snack: ${biggest}. ${game.drops} drops.${isBest ? "" : " Best " + prev + "."}</p>
    <div class="stack">
      <button class="btn primary" data-go="${mode}">${mode === "daily" ? "Try today's again" : "Play again"}</button>
      ${mode === "daily" ? '<button class="btn" data-act="share">Share result</button>' : ""}
      <button class="btn" data-act="home">Menu</button>
    </div>`);
}

$("sheet").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  sound.wake();
  if (b.dataset.go) return start(b.dataset.go);
  const act = b.dataset.act;
  if (act === "resume") { closeSheet(); paused = false; }
  if (act === "home") home();
  if (act === "share") {
    const text = `Snack Drop Daily ${dayKey()}: ${game.score} points, made a ${SD.TIERS[game.best].name}. https://www.snackpackuniverse.com/play/labs/snack-drop/`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { b.textContent = "Copied"; });
  }
});

$("pause").addEventListener("click", () => { if (game && game.status === "playing") pauseSheet(); });
function muteLabel() { $("mute").textContent = sound.muted ? "🔇" : "🔊"; $("mute").setAttribute("aria-label", sound.muted ? "Sound off" : "Sound on"); }
$("mute").addEventListener("click", () => { sound.muted = !sound.muted; store.set("mute", sound.muted); muteLabel(); sound.wake(); });
muteLabel();

// ════ Input ═══════════════════════════════════════════════════════
// Tap and hold: the snack follows the finger (or mouse) for as long as it is
// held, and letting go drops it. A quick tap drops where you tapped. A press
// that starts on a button never drops a snack.
// Phones would otherwise turn a long press into a context menu (Android) or a
// callout and text selection (iOS), which cancels the touch mid-hold, so those
// are switched off and the pointer is captured for the whole press.
let pressing = false, pendingDrop = false;
const canvas = $("view");
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (paused) return;
  pressing = true; aimX = view.worldX(e.clientX, e.clientY); sound.wake();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
});
canvas.addEventListener("pointermove", (e) => { if (paused) return; if (pressing || e.pointerType === "mouse") aimX = view.worldX(e.clientX, e.clientY); });
canvas.addEventListener("pointerup", (e) => { if (paused || !pressing) return; pressing = false; aimX = view.worldX(e.clientX, e.clientY); pendingDrop = true; });
canvas.addEventListener("pointercancel", () => { pressing = false; });
const keys = {};
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && game && game.status === "playing" && !paused) return pauseSheet();
  if (paused) return;
  keys[e.key] = true;
  if (e.key === " " || e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); pendingDrop = true; }
});
window.addEventListener("keyup", (e) => { keys[e.key] = false; });
document.addEventListener("visibilitychange", () => { if (document.hidden && game && game.status === "playing" && !paused && !BOT) pauseSheet(); });

// ════ Loop ════════════════════════════════════════════════════════
function handle(ev) {
  view.onEvent(ev);
  if (ev.type === "drop") { sound.drop(); updateLadder(); }
  if (ev.type === "merge") {
    sound.merge(ev.tier, ev.chain);
    if (ev.chain >= 2) toast(`Chain ×${ev.chain}  +${ev.points}`);
    if (ev.tier === game.best && game.made[ev.tier] === 1 && ev.tier >= 4) toast(`First ${SD.TIERS[ev.tier].name}!`);
    updateLadder(game.made[ev.tier] === 1 ? ev.tier : null);
  }
  if (ev.type === "packed") { sound.packed(); toast(`Hamper packed! +${ev.points}`); }
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (game && !paused && game.status === "playing") {
    const speed = 6 * dt;
    if (keys.ArrowLeft) aimX -= speed;
    if (keys.ArrowRight) aimX += speed;
    acc += dt;
    let n = 0;
    while (acc >= SD.STEP && n < 6) {
      let drop = null;
      if (BOT) { if (game.canDrop() && game.snacks.every((s) => s.landed)) { aimX = SD.botAim(game, "careful", botRand); drop = aimX; } }
      else if (pendingDrop && game.canDrop()) { drop = aimX; pendingDrop = false; }
      game.step({ aim: aimX, drop });
      aimX = game.aim;
      for (const ev of game.events) handle(ev);
      game.events.length = 0;
      acc -= SD.STEP; n++;
    }
    if (n === 6) acc = 0;
    $("score").textContent = game.score;
  } else if (game && game.status === "over") {
    game.step({});
    if (!overShown) { overShown = true; setTimeout(overSheet, 900); }
  }
  if (game) view.draw(game, dt, !paused);
  else view.renderer.render(view.scene, view.camera);
  requestAnimationFrame(frame);
}

buildLadder();
// A demo crate behind the menu, so the first thing you see is the game.
game = SD.createGame({ seed: 7 });
for (let i = 0; i < 60 * 14; i++) { if (game.canDrop() && game.snacks.every((s) => s.landed)) game.step({ drop: SD.botAim(game, "careful", botRand) }); else game.step({}); }
game.events.length = 0;
if (BOT) start("classic"); else home();
requestAnimationFrame(frame);
window.__snackdrop = { get game() { return game; } };
