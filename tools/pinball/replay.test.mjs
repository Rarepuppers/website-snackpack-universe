/**
 * replay.test.mjs -- Layer 2 of docs/pinball/08-test-plan.md.
 *
 * Run:    node tools/pinball/replay.test.mjs
 * Rebase: node tools/pinball/replay.test.mjs --update
 *
 * A tape is a seed, a mode, and a scripted input sequence. Replaying it must
 * reproduce the same score, rank, ball count and event totals every time.
 *
 * What this catches that tune.test.mjs and rules.test.mjs cannot: those assert
 * on PROPERTIES ("a tip shot makes the ramp", "a bumper pays 250"). A tape
 * asserts on the whole system's behaviour end to end, physics and ruleset
 * together. A change that keeps every property true while quietly altering how
 * a real game plays out shows up here and nowhere else.
 *
 * HONEST LIMITATION: these tapes are SCRIPTED, not recorded from human play.
 * 08-test-plan.md asks for recorded tapes and that is still the better
 * artifact -- a human tape covers shot patterns no scripted flipper pattern
 * will find. These are a baseline lock, not a substitute. Record real ones by
 * capturing (frame, buttons) in the browser and dropping them in tapes/.
 *
 * The expectations are NOT auto-updated. If a tape's outcome changes, that is
 * either a regression or an intentional retune, and either way a human has to
 * look. `--update` exists for the intentional case and should be accompanied
 * by a note in the commit saying what changed and why.
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { createWorld, advance, drainEvents, serveBall, addBall, releaseSaucer, DT } from '../../play/pinball/engine.js';
import {
  createRules, applyEvent, tick as tickRules, nextBall, setBallsInPlay, drainCommands,
} from '../../play/pinball/rules.js';
import { MODES, SAUCERS } from '../../play/pinball/table.js';
import { group, test, assert, report, round } from './harness.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const TAPES = path.join(HERE, 'tapes');
const update = process.argv.includes('--update');

/**
 * Deterministic input patterns, as (frameIndex, world) -> input.
 *
 * They read `world.phase` because a tape that plunges once by frame index
 * stalls forever on ball two: the table serves the next ball to the plunger
 * and waits, exactly as a real machine does. Every early tape scored one drain
 * and then sat still for the remaining fifty seconds, which replayed
 * identically and proved nothing.
 *
 * `phase === 'ready' && (i % 600) < N` charges for N frames then releases,
 * because the plunger fires on the RELEASE edge.
 */
const PATTERNS = {
  /** Plunge every ball, then never touch a flipper. Every ball drains unaided. */
  'hands-off': (i, w) => ({ plunge: w.phase === 'ready' && (i % 600) < 500 }),

  /** Plunge every ball and flip both flippers on a steady beat. */
  'metronome': (i, w) => ({
    plunge: w.phase === 'ready' && (i % 600) < 500,
    left: w.phase === 'playing' && Math.floor(i / 55) % 2 === 0,
    right: w.phase === 'playing' && Math.floor(i / 71) % 2 === 0,
  }),

  /** Alternating single flips, roughly how a beginner plays. */
  'alternating': (i, w) => ({
    plunge: w.phase === 'ready' && (i % 600) < 500,
    left: w.phase === 'playing' && i % 190 < 26,
    right: w.phase === 'playing' && (i + 95) % 190 < 26,
  }),

  /**
   * Alternating weak and full plunges. A weak plunge cannot clear the lane, so
   * the ball falls back and the table re-arms -- a pure weak-plunge tape never
   * progresses at all and asserts nothing.
   */
  'soft-plunge': (i, w) => ({
    plunge: w.phase === 'ready' && (i % 600) < (Math.floor(i / 600) % 2 === 0 ? 18 : 500),
    left: w.phase === 'playing' && i % 150 < 20,
  }),
};

const TAPE_DEFS = [
  { name: 'hands-off-classic', seed: 1234, mode: 'classic', pattern: 'hands-off', frames: 480 * 180 },
  { name: 'metronome-classic', seed: 4242, mode: 'classic', pattern: 'metronome', frames: 480 * 180 },
  { name: 'alternating-classic', seed: 77, mode: 'classic', pattern: 'alternating', frames: 480 * 180 },
  { name: 'metronome-relaxed', seed: 555, mode: 'relaxed', pattern: 'metronome', frames: 480 * 180 },
  { name: 'soft-plunge', seed: 9, mode: 'classic', pattern: 'soft-plunge', frames: 480 * 120 },
];

/**
 * Drive a whole game exactly as game.js does: same order, same command
 * execution. If this diverges from game.js the tapes stop meaning anything,
 * so it deliberately mirrors that file's loop rather than simplifying it.
 */
function runTape(def) {
  const world = createWorld(def.mode, def.seed);
  const rules = createRules(def.seed, def.mode);

  // Two kinds of tape.
  //
  // 'frames' tapes are RECORDED through the real page: each entry is the
  // (dt, buttons) of one real rAF frame, so replaying the same dt sequence
  // reproduces the run exactly, frame jitter included. They exercise game.js
  // and the input handlers, which scripted tapes never touch.
  //
  // Pattern tapes are scripted straight into the engine: cheaper, fully
  // reproducible, and useful for pinning specific behaviours.
  const recorded = def.kind === 'frames';
  const input = recorded ? null : PATTERNS[def.pattern];
  const frames = recorded ? def.frames : null;
  const total = recorded ? frames.length : def.frames;

  let ballsLeft = MODES[def.mode].balls;
  let over = false;
  const pendingKicks = [];
  const counts = Object.create(null);

  for (let i = 0; i < total && !over; i += 1) {
    if (recorded) {
      const [dt, buttons] = frames[i];
      advance(world, { left: !!(buttons & 1), right: !!(buttons & 2), plunge: !!(buttons & 4) }, dt);
    } else {
      advance(world, input(i, world) || {}, DT);
    }

    for (const e of drainEvents(world)) {
      counts[e.type] = (counts[e.type] || 0) + 1;
      applyEvent(rules, e);
      if (e.type === 'ball-lost') {
        if (world.mode.endless) { serveBall(world); continue; }
        nextBall(rules);
        ballsLeft -= 1;
        if (ballsLeft <= 0) { over = true; break; }
        serveBall(world);
        pendingKicks.length = 0;
      }
    }
    if (over) break;

    tickRules(rules, DT);

    for (const c of drainCommands(rules)) {
      if (c.type === 'release-saucer') {
        if (c.delay) pendingKicks.push({ id: c.id, t: c.delay });
        else releaseSaucer(world, c.id);
      } else if (c.type === 'add-balls') {
        const from = SAUCERS.find((s) => s.id === 'lock');
        for (let k = 0; k < c.count; k += 1) addBall(world, from.x, from.y + k * 4, -260 - k * 40, 700);
      }
    }
    for (const k of pendingKicks) k.t -= DT;
    for (let k = pendingKicks.length - 1; k >= 0; k -= 1) {
      if (pendingKicks[k].t <= 0) { releaseSaucer(world, pendingKicks[k].id); pendingKicks.splice(k, 1); }
    }

    setBallsInPlay(rules, world.ballsInPlay);
  }

  return {
    score: rules.score,
    ball: rules.ball,
    rank: rules.rank,
    missions: rules.missionsDone.length,
    bonusMultiplier: rules.bonusMultiplier,
    gameOver: over,
    events: {
      bumper: counts.bumper || 0,
      sling: counts.sling || 0,
      drain: counts.drain || 0,
      rollover: counts.rollover || 0,
      'ramp-exit': counts['ramp-exit'] || 0,
      saucer: counts.saucer || 0,
      escaped: counts.escaped || 0,
    },
  };
}

fs.mkdirSync(TAPES, { recursive: true });

/**
 * Recorded tapes are files first and definitions second: anyone can drop one
 * into tapes/ (from `record-tape.mjs`, or by hand from the browser with
 * ?record=1) and it becomes part of the suite with no code change.
 */
const RECORDED = fs.readdirSync(TAPES)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(TAPES, f), 'utf8')))
  .filter((t) => t.kind === 'frames');

group('Replay regression -- scripted');

for (const def of TAPE_DEFS) {
  const file = path.join(TAPES, `${def.name}.json`);

  if (update || !fs.existsSync(file)) {
    const expect = runTape(def);
    fs.writeFileSync(file, `${JSON.stringify({ ...def, expect }, null, 2)}\n`);
  }

  test(`${def.name} replays identically`, () => {
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    const got = runTape(stored);

    // The containment invariant holds for every tape, always.
    assert(got.events.escaped === 0, `${stored.expect.escaped} balls escaped the cabinet`);

    for (const key of ['score', 'ball', 'rank', 'missions', 'bonusMultiplier', 'gameOver']) {
      assert(
        String(got[key]) === String(stored.expect[key]),
        `${key}: got ${round(got[key])}, tape expects ${round(stored.expect[key])}`,
      );
    }
    for (const key of Object.keys(stored.expect.events)) {
      assert(
        got.events[key] === stored.expect.events[key],
        `event ${key}: got ${got.events[key]}, tape expects ${stored.expect.events[key]}`,
      );
    }
  });
}

group('Replay regression -- recorded through the real page');

for (const tape of RECORDED) {
  const file = path.join(TAPES, `${tape.name}.json`);

  if (update || !tape.expect) {
    const expect = runTape(tape);
    fs.writeFileSync(file, `${JSON.stringify({ ...tape, expect }, null, 2)}
`);
    tape.expect = expect;
  }

  test(`${tape.name} (${tape.frames.length} recorded frames) replays identically`, () => {
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    const got = runTape(stored);
    assert(got.events.escaped === 0, 'a ball escaped the cabinet');
    for (const key of ['score', 'ball', 'rank', 'missions', 'gameOver']) {
      assert(
        String(got[key]) === String(stored.expect[key]),
        `${key}: got ${round(got[key])}, tape expects ${round(stored.expect[key])}`,
      );
    }
  });
}

test('at least one tape came from the real page, not the engine', () => {
  // A suite of engine-only tapes would never notice game.js breaking.
  assert(RECORDED.length > 0, 'no recorded tapes present — run tools/pinball/record-tape.mjs');
});

group('Tape sanity');

test('every tape actually exercised the table', () => {
  // A tape that scores nothing and hits nothing would replay identically
  // forever while proving precisely nothing.
  for (const def of TAPE_DEFS) {
    const stored = JSON.parse(fs.readFileSync(path.join(TAPES, `${def.name}.json`), 'utf8'));
    const e = stored.expect;
    const hits = e.events.bumper + e.events.sling + e.events.rollover + e.events['ramp-exit'];
    assert(hits > 0, `${def.name}: no scoring contact at all`);
    assert(e.score > 0, `${def.name}: scored nothing`);
  }
});

test('a hands-off game still ends', () => {
  const stored = JSON.parse(fs.readFileSync(path.join(TAPES, 'hands-off-classic.json'), 'utf8'));
  assert(stored.expect.gameOver === true, 'a game with no input never reached game over');
});

report(update ? 'Pinball replay -- TAPES REBASED' : 'Pinball replay -- Layer 2');
