/**
 * harness.mjs -- headless driver for the pinball engine.
 *
 * The engine reads no clock and no global randomness, so it can be driven
 * deterministically in Node with no browser, no rAF and no canvas. That is
 * what makes every assertion in tune.test.mjs a statement about the REAL
 * simulation rather than about a re-implementation of it.
 *
 * See docs/pinball/08-test-plan.md for why that distinction is the whole
 * point: this repo has a documented history of green boards over broken
 * games, and it always comes from tests that mark their own homework.
 */

import { createWorld, step, DT, drainEvents } from '../../play/pinball/engine.js';
import { BALL_R, H, W } from '../../play/pinball/table.js';

/** Seconds -> number of fixed steps. */
export const secs = (s) => Math.round(s / DT);

/**
 * Run the simulation.
 *
 * @param {object} opts
 *   mode      -- mode id, default 'classic'
 *   seed      -- PRNG seed, default 1
 *   steps     -- how many fixed steps to run
 *   setup     -- (world) => void, called once before stepping
 *   input     -- (i, world) => {left,right,plunge} or a static object
 *   stopWhen  -- (world, i) => boolean, ends the run early
 * @returns { world, events, path, steps }
 */
export function sim(opts = {}) {
  const world = createWorld(opts.mode || 'classic', opts.seed === undefined ? 1 : opts.seed);
  if (opts.setup) opts.setup(world);

  const events = [];
  const path = [];
  const total = opts.steps === undefined ? secs(10) : opts.steps;
  const inputFn = typeof opts.input === 'function' ? opts.input : () => opts.input || {};

  let i = 0;
  for (; i < total; i += 1) {
    // `at` lets a test fire an engine ACTION (nudge, saucer release, extra
    // ball) at a chosen step, which an input flag cannot express.
    if (opts.at) opts.at(i, world);
    step(world, inputFn(i, world) || {}, DT);
    const drained = drainEvents(world);
    for (const e of drained) events.push({ ...e, step: i, t: i * DT });
    const b = world.balls.find((x) => x.alive);
    if (b) path.push({ t: i * DT, x: b.x, y: b.y, vx: b.vx, vy: b.vy });
    if (opts.stopWhen && opts.stopWhen(world, i)) break;
  }

  return { world, events, path, steps: i };
}

/** Place the single ball at a known state, and start the table in play. */
export function place(world, x, y, vx = 0, vy = 0) {
  world.phase = 'playing';
  world.balls = [
    {
      x, y, vx, vy,
      spin: 0,
      inRamp: null,
      rampT: 0,
      captured: null,
      captureT: 0,
      inLane: false,
      alive: true,
      trail: [],
    },
  ];
  world.ballsInPlay = 1;
}

export const had = (events, type, id) =>
  events.some((e) => e.type === type && (id === undefined || e.id === id));

export const countOf = (events, type, id) =>
  events.filter((e) => e.type === type && (id === undefined || e.id === id)).length;

export const firstOf = (events, type, id) =>
  events.find((e) => e.type === type && (id === undefined || e.id === id));

/** Highest point the ball reached (smallest y). */
export const apex = (path) => path.reduce((m, p) => Math.min(m, p.y), Infinity);

/** Did the ball ever leave the cabinet? */
export const escaped = (path) =>
  path.some((p) => p.x < -BALL_R || p.x > W + BALL_R || p.y < -BALL_R || p.y > H + 200);

// ---------------------------------------------------------------------------
// A dependency-free test runner. `node tune.test.mjs` and nothing else.
// ---------------------------------------------------------------------------

const results = [];
let currentGroup = '';

export function group(name) {
  currentGroup = name;
}

export function test(name, fn) {
  try {
    fn();
    results.push({ ok: true, name, group: currentGroup });
  } catch (err) {
    results.push({ ok: false, name, group: currentGroup, err: err.message });
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

export function assertBetween(value, lo, hi, label) {
  if (!(value >= lo && value <= hi)) {
    throw new Error(`${label || 'value'} = ${round(value)}, expected ${lo}..${hi}`);
  }
}

export const round = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);

export function report(title) {
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  let group = '';
  console.log(`\n${title}\n${'='.repeat(title.length)}`);
  for (const r of results) {
    if (r.group !== group) {
      group = r.group;
      console.log(`\n  ${group}`);
    }
    console.log(`    ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n            ${r.err}`}`);
  }
  console.log(`\n  ${pass} passed, ${fail.length} failed\n`);
  if (fail.length) process.exitCode = 1;
  return fail.length === 0;
}
