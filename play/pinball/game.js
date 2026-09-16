/**
 * game.js -- loop, input, and arcade integration.
 *
 * Routing only. The engine owns physics, rules.js owns scoring, and this file
 * owns input, timing and the DOM -- it hands every engine event to the ruleset
 * and executes the commands the ruleset asks for. It deliberately contains no
 * scoring logic of its own.
 *
 * The engine never reads a clock; this file owns all of the timing.
 */

import { createWorld, advance, drainEvents, serveBall, nudge, addBall, releaseSaucer, DT } from './engine.js';
import { createRenderer } from './render.js';
import { MODES, SAUCERS } from './table.js';
import {
  createRules, applyEvent, tick as tickRules, nextBall, setBallsInPlay,
  drainCommands, drainLog, statusLine, RANKS, MISSIONS,
} from './rules.js';

const el = (id) => document.getElementById(id);

const state = {
  world: null,
  rules: null,
  renderer: null,
  mode: 'classic',
  ballsLeft: 3,
  pendingKicks: [],
  running: false,
  paused: false,
  last: 0,
  flashes: new Map(),
  input: { left: false, right: false, plunge: false },
  raf: 0,
};

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

function frame(now) {
  state.raf = requestAnimationFrame(frame);
  if (!state.world) return;

  const dt = state.last ? Math.min((now - state.last) / 1000, 0.25) : 0;
  state.last = now;

  if (state.running && !state.paused) {
    advance(state.world, state.input, dt);
    handleEvents(drainEvents(state.world));
    tickRules(state.rules, dt);
    runCommands(drainCommands(state.rules));
    runPendingKicks(dt);
    setBallsInPlay(state.rules, state.world.ballsInPlay);
    showLog(drainLog(state.rules));
    paint();
  }

  // Decay bumper flashes on real time, not on simulation steps, so they look
  // the same whether the tab is running fast or catching up.
  for (const [k, v] of state.flashes) {
    const next = v - dt;
    if (next <= 0) state.flashes.delete(k); else state.flashes.set(k, next);
  }

  state.renderer.draw(state.world, state.flashes);
}

function handleEvents(events) {
  for (const e of events) {
    if (e.type === 'bumper' || e.type === 'sling') state.flashes.set(e.id, 0.12);

    // The ruleset owns all scoring. This file only routes.
    applyEvent(state.rules, e);

    if (e.type === 'ball-lost') onBallLost();
    if (e.type === 'escaped') {
      // Should never happen. If it does it is a physics bug, and it must be
      // loud rather than quietly recovered from.
      console.warn('pinball: ball escaped the cabinet', e);
    }
  }
}

/**
 * rules.js is pure and cannot touch the world, so it emits commands instead.
 * This is the only place they are executed.
 */
function runCommands(commands) {
  for (const c of commands) {
    switch (c.type) {
      case 'release-saucer':
        if (c.delay) state.pendingKicks.push({ id: c.id, t: c.delay });
        else releaseSaucer(state.world, c.id);
        break;
      case 'add-balls': {
        const from = SAUCERS.find((x) => x.id === 'lock') || { x: 408, y: 330 };
        for (let i = 0; i < c.count; i += 1) {
          addBall(state.world, from.x, from.y + i * 4, -260 - i * 40, 700);
        }
        break;
      }
      // Audio arrives at P5. Routing the cues now keeps the wiring honest: if
      // one is missing then, it will be missing HERE rather than never having
      // been emitted in the first place.
      case 'sound':
      case 'voice':
      case 'music':
        break;
      default:
        break;
    }
  }
}

function runPendingKicks(dt) {
  if (!state.pendingKicks.length) return;
  for (const k of state.pendingKicks) k.t -= dt;
  const due = state.pendingKicks.filter((k) => k.t <= 0);
  state.pendingKicks = state.pendingKicks.filter((k) => k.t > 0);
  for (const k of due) releaseSaucer(state.world, k.id);
}

function showLog(entries) {
  for (const entry of entries) announce(entry.text);
}

function onBallLost() {
  if (state.world.mode.endless) {
    serveBall(state.world);
    return;
  }
  const bonus = nextBall(state.rules);
  state.ballsLeft -= 1;
  if (state.ballsLeft <= 0) {
    gameOver();
    return;
  }
  serveBall(state.world);
  state.pendingKicks = [];
  announce(bonus > 0 ? `Bonus ${bonus.toLocaleString()}` : `Ball ${state.rules.ball}`);
  paint();
}

function gameOver() {
  state.running = false;
  const r = state.rules;
  announce(`Game over. ${r.score.toLocaleString()} points.`);
  el('pb-overlay').hidden = false;
  el('pb-overlay-title').textContent = 'Game over';
  el('pb-overlay-body').textContent = `${r.score.toLocaleString()} points`;
  el('pb-overlay-note').textContent =
    `${RANKS[r.rank]} • ${r.missionsDone.length} of ${MISSIONS.length} missions`;
  saveBest();
}

// ---------------------------------------------------------------------------
// Persistence -- arcade convention, sp_-prefixed via SnackPackStore
// ---------------------------------------------------------------------------

const bestKey = () => `pinball_best_${state.mode}`;

function readBest() {
  try {
    if (window.SnackPackStore) return Number(window.SnackPackStore.get('pinball', 'best', state.mode)) || 0;
    return Number(localStorage.getItem(`sp_${bestKey()}`)) || 0;
  } catch (err) { return 0; }
}

function saveBest() {
  try {
    if (state.rules.score <= readBest()) return;
    if (window.SnackPackStore) window.SnackPackStore.set('pinball', 'best', state.mode, state.rules.score);
    else localStorage.setItem(`sp_${bestKey()}`, String(state.rules.score));
  } catch (err) { /* storage can be blocked; never break the game over it */ }
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

function paint() {
  const r = state.rules;
  el('pb-score').textContent = r ? r.score.toLocaleString() : '0';
  el('pb-ball').textContent = state.world && state.world.mode.endless
    ? '∞'
    : `${r ? r.ball : 1} / ${MODES[state.mode].balls}`;
  el('pb-best').textContent = readBest().toLocaleString();
  el('pb-rank').textContent = r ? RANKS[r.rank] : RANKS[0];
  if (r) el('pb-dmd').textContent = statusLine(r);
}

let announceTimer = 0;
function announce(text) {
  const live = el('pb-live');
  live.textContent = text;
  const banner = el('pb-banner');
  banner.textContent = text;
  banner.hidden = false;
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { banner.hidden = true; }, 1600);
}

function describeTable() {
  if (!state.world || !state.rules) return 'Pinball table';
  const b = state.world.balls.find((x) => x.alive);
  if (!b || !state.rules) return 'Pinball table, ball lost';
  const where = b.y < 300 ? 'the top arch' : b.y < 700 ? 'the middle of the table' : 'near the flippers';
  const r = state.rules;
  return `Pinball. Score ${r.score}. Ball ${r.ball}. ${statusLine(r)}. Ball is at ${where}.`;
}

// ---------------------------------------------------------------------------
// Start / mode select
// ---------------------------------------------------------------------------

function start(modeId) {
  state.mode = modeId;
  const seed = seedForRun();
  state.world = createWorld(modeId, seed);
  state.rules = createRules(seed, modeId);
  state.ballsLeft = MODES[modeId].balls;
  state.pendingKicks = [];
  state.running = true;
  state.paused = false;
  state.flashes.clear();
  el('pb-overlay').hidden = true;
  el('pb-modes').hidden = true;
  el('pb-hud').hidden = false;
  state.renderer.resize();
  paint();
  announce(`${MODES[modeId].label}. Hold the plunger.`);
}

/** Daily runs share a seed so everyone gets the same game. */
function seedForRun() {
  const daily = new URLSearchParams(location.search).get('daily');
  if (daily) {
    let h = 2166136261;
    for (let i = 0; i < daily.length; i += 1) {
      h ^= daily.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const KEYS_LEFT = ['KeyZ', 'ArrowLeft', 'ShiftLeft'];
const KEYS_RIGHT = ['Slash', 'ArrowRight', 'ShiftRight'];

function bindKeys() {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (KEYS_LEFT.includes(e.code)) { state.input.left = true; e.preventDefault(); }
    else if (KEYS_RIGHT.includes(e.code)) { state.input.right = true; e.preventDefault(); }
    else if (e.code === 'Space') { state.input.plunge = true; e.preventDefault(); }
    else if (e.code === 'Comma' && state.world) nudge(state.world, -1, 0);
    else if (e.code === 'Period' && state.world) nudge(state.world, 1, 0);
    else if (e.code === 'KeyN' && state.world) nudge(state.world, 0, -1);
  });
  window.addEventListener('keyup', (e) => {
    if (KEYS_LEFT.includes(e.code)) state.input.left = false;
    else if (KEYS_RIGHT.includes(e.code)) state.input.right = false;
    else if (e.code === 'Space') state.input.plunge = false;
  });
}

/**
 * Touch: full-height columns, not buttons near the flippers -- a player's
 * thumbs rest at the bottom of a phone, and both flippers at once is not
 * optional in pinball, so each pointer is tracked by id.
 *
 * Coordinates come from getBoundingClientRect, never pageX. Brain Games has a
 * live defect from exactly that: pageX breaks under a transformed game area.
 */
function bindTouch(stage) {
  const zones = new Map();

  const zoneFor = (clientX) => {
    const r = stage.getBoundingClientRect();
    const f = (clientX - r.left) / r.width;
    if (f < 0.34) return 'left';
    if (f > 0.66) return 'right';
    return 'plunge';
  };

  const apply = () => {
    const active = new Set(zones.values());
    state.input.left = active.has('left');
    state.input.right = active.has('right');
    state.input.plunge = active.has('plunge');
  };

  stage.addEventListener('pointerdown', (e) => {
    // Anything interactive inside the stage -- the mode buttons, the game-over
    // button -- must keep working. Capturing the pointer and calling
    // preventDefault here swallows the click before it ever reaches them, so a
    // player simply could not start a game by tapping. Bail out early instead.
    if (e.target.closest('button, a, [role="button"]')) return;
    if (!state.running) return;

    stage.setPointerCapture(e.pointerId);
    zones.set(e.pointerId, zoneFor(e.clientX));
    apply();
    e.preventDefault();
  });
  const release = (e) => { zones.delete(e.pointerId); apply(); };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('pointerleave', release);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot() {
  const canvas = el('pb-canvas');
  const stage = canvas.parentElement;
  state.renderer = createRenderer(canvas);
  state.world = createWorld('classic', 1);

  bindKeys();
  bindTouch(stage);
  window.addEventListener('resize', () => state.renderer.resize());

  for (const btn of document.querySelectorAll('[data-mode]')) {
    btn.addEventListener('click', () => start(btn.dataset.mode));
  }
  el('pb-again').addEventListener('click', () => {
    el('pb-overlay').hidden = true;
    el('pb-modes').hidden = false;
    el('pb-hud').hidden = true;
    state.running = false;
  });

  // Shared arcade pause. It stops the accumulator; rAF keeps running so the
  // table stays painted.
  if (window.SnackPackPause) {
    window.SnackPackPause.attach({
      mount: document.querySelector('.pb-controls'),
      stage,
      isPlaying: () => state.running && !state.paused,
      pause: () => { state.paused = true; },
      resume: () => { state.paused = false; state.last = 0; },
    });
  }

  // Keep the accessible description current without touching it every frame.
  setInterval(() => { canvas.setAttribute('aria-label', describeTable()); }, 1200);

  paint();
  state.raf = requestAnimationFrame(frame);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
