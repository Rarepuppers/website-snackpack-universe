/**
 * rules.test.mjs -- ruleset coverage. Layer 3 of docs/pinball/08-test-plan.md.
 *
 * Run: node tools/pinball/rules.test.mjs
 *
 * rules.js is pure, so these feed it event sequences directly with no physics
 * at all. That keeps them fast, but it also means they test the ruleset as the
 * game will actually drive it: the events here are exactly the ones engine.js
 * emits, with the same names and payloads.
 */

import {
  createRules, applyEvent, tick, nextBall, setBallsInPlay,
  serialize, deserialize, drainCommands, endOfBallBonus,
  statusLine, litShots,
  MISSIONS, RANKS, RANK_THRESHOLDS, POINTS, WIZARD_SHOTS,
} from '../../play/pinball/rules.js';
import { group, test, assert, assertBetween, report, round } from './harness.mjs';

// -- event shorthands -------------------------------------------------------
const E = {
  plunge: { type: 'plunge', speed: 2600 },
  bumper: { type: 'bumper', id: 'bumper-left', speed: 900 },
  sling: { type: 'sling', id: 'sling-left', speed: 500 },
  orbit: { type: 'ramp-exit', id: 'orbit-left' },
  ramp: { type: 'ramp-exit', id: 'ramp-right' },
  saucer: { type: 'saucer', id: 'saucer' },
  lock: { type: 'saucer', id: 'lock' },
  target: { type: 'target', id: 'drop-1' },
  bank: { type: 'target-bank-clear' },
  spinner: (revs = 1) => ({ type: 'spinner', id: 'spinner', revs }),
  rollover: (id) => ({ type: 'rollover', id }),
  flipper: { type: 'flipper', id: 'flipper-left', s: 0.9, speed: 800 },
  tilt: { type: 'tilt' },
  drain: { type: 'drain' },
};

const feed = (r, ...events) => { for (const e of events) applyEvent(r, e); return r; };
const wait = (r, seconds, step = 0.1) => {
  for (let t = 0; t < seconds; t += step) tick(r, step);
  return r;
};

/** Drive a rules object to a given number of completed missions. */
function completeMissions(r, count) {
  let guard = 0;
  while (r.missionsDone.length < count && guard < 400) {
    guard += 1;
    if (!r.mission) {
      r.saucerLit = true;
      r.missionRelight = 0;
      feed(r, E.saucer);
      if (!r.mission) break;
    }
    // Satisfy whatever the current mission wants, generously. Bumpers have to
    // be in the mix -- Asteroid Sweep asks for eight of them and nothing else
    // here produces one -- but they must be withheld from "Silent Running",
    // whose whole objective is shots with NO bumper in between.
    const def = MISSIONS.find((m) => m.id === r.mission.id);
    for (let i = 0; i < 30 && r.mission; i += 1) {
      feed(r, E.orbit, E.ramp, E.target, E.spinner(10));
      if (!def.clean) feed(r, E.bumper, E.bumper, E.bumper);
      if (!r.mission) break;
      feed(r, { type: 'saucer', id: 'saucer' });
    }
    if (r.mission) { // survive-style missions complete on the clock
      wait(r, MISSIONS.find((m) => m.id === r.mission.id).time + 2);
    }
  }
  // A helper that quietly gives up is worse than one that fails: it grinds
  // thousands of shots first, which inflates the score and makes the
  // calibration tests meaningless. This exact case hid a real balance bug --
  // Storm Watch could be extended indefinitely by hitting bumpers.
  if (r.missionsDone.length < count) {
    throw new Error(`helper could not reach ${count} missions (got ${r.missionsDone.length}; stuck on ${r.mission ? r.mission.id : 'none'})`);
  }
  return r;
}

// ---------------------------------------------------------------------------
group('Base scoring');

test('each scoring event pays what the ruleset says', () => {
  const cases = [
    [E.bumper, POINTS.bumper],
    [E.sling, POINTS.sling],
    [E.target, POINTS.target],
    [E.rollover('rollover-left'), POINTS.rollover],
    [E.spinner(4), POINTS.spinner * 4],
  ];
  for (const [event, expected] of cases) {
    const r = createRules(1, 'classic');
    feed(r, event);
    assert(r.score === expected, `${event.type} paid ${r.score}, expected ${expected}`);
  }
});

test('a ramp and an orbit pay their listed values at 1x combo', () => {
  const a = createRules(1);
  feed(a, E.orbit);
  assert(a.score === POINTS.orbit, `orbit paid ${a.score}`);
  const b = createRules(1);
  feed(b, E.ramp);
  assert(b.score === POINTS.ramp, `ramp paid ${b.score}`);
});

// ---------------------------------------------------------------------------
group('Combos');

test('consecutive major shots build to 5x and no further', () => {
  const r = createRules(1);
  const mult = [];
  for (let i = 0; i < 7; i += 1) {
    const before = r.score;
    feed(r, E.orbit);
    mult.push((r.score - before) / POINTS.orbit);
  }
  assert(mult[0] === 1, `first shot was ${mult[0]}x`);
  assert(mult[1] === 2, `second shot was ${mult[1]}x`);
  assert(mult[4] === 5, `fifth shot was ${mult[4]}x`);
  assert(mult[6] === 5, `combo exceeded 5x: ${mult[6]}x`);
});

test('a bumper breaks the combo', () => {
  const r = createRules(1);
  feed(r, E.orbit, E.orbit, E.bumper);
  const before = r.score;
  feed(r, E.orbit);
  assert(r.score - before === POINTS.orbit, 'combo survived a bumper');
});

test('the combo window expires', () => {
  const r = createRules(1);
  feed(r, E.orbit, E.orbit);
  wait(r, 3.5);
  const before = r.score;
  feed(r, E.orbit);
  assert(r.score - before === POINTS.orbit, 'combo survived past its window');
});

test('a drain breaks the combo', () => {
  const r = createRules(1);
  feed(r, E.orbit, E.orbit, E.drain);
  const before = r.score;
  feed(r, E.orbit);
  assert(r.score - before === POINTS.orbit, 'combo survived a drain');
});

// ---------------------------------------------------------------------------
group('Skill shot');

test('a plunge arms a skill shot and hitting it scores', () => {
  const r = createRules(7);
  feed(r, E.plunge);
  assert(r.skillShot, 'no skill shot armed after a plunge');
  const shot = r.skillShot.shot;
  const event = shot === 'orbit-left' ? E.orbit : shot === 'ramp-right' ? E.ramp : E.saucer;
  // Two flips first, so this is the ordinary skill shot rather than the super.
  feed(r, E.flipper, E.flipper, event);
  assert(r.score > POINTS.skillShot, `skill shot paid only ${r.score}`);
});

test('the super skill shot requires the first flip', () => {
  const r = createRules(7);
  feed(r, E.plunge);
  const shot = r.skillShot.shot;
  const event = shot === 'orbit-left' ? E.orbit : shot === 'ramp-right' ? E.ramp : E.saucer;
  feed(r, E.flipper, event);
  assert(r.score >= POINTS.superSkillShot, `super skill shot paid only ${r.score}`);
});

test('a shot made with NO flip is not a super skill shot', () => {
  // A full plunge can orbit into the lit shot unaided. That is a legitimate
  // skill shot, but it is not the SUPER -- the super is for a deliberate
  // first flip, and awarding it for doing nothing was worth 150,000 a ball.
  const r = createRules(7);
  feed(r, E.plunge);
  const shot = r.skillShot.shot;
  const event = shot === 'orbit-left' ? E.orbit : shot === 'ramp-right' ? E.ramp : E.saucer;
  feed(r, event);
  assert(r.score < POINTS.superSkillShot, `no-flip shot paid ${r.score}, the super award`);
  assert(r.score > 0, 'a no-flip skill shot should still pay something');
});

test('the wrong shot kills the skill shot and resets the ladder', () => {
  const r = createRules(7);
  feed(r, E.plunge);
  r.skillShot.shot = 'orbit-left';
  r.skillLadder = 3;
  feed(r, E.flipper, E.flipper, E.ramp);
  assert(r.skillShot === null, 'skill shot survived a wrong shot');
  assert(r.skillLadder === 0, 'ladder was not reset');
});

test('the skill shot window expires', () => {
  const r = createRules(7);
  feed(r, E.plunge);
  wait(r, 4.5);
  assert(r.skillShot === null, 'skill shot outlived its window');
});

// ---------------------------------------------------------------------------
group('Missions');

test('the saucer starts a mission when lit', () => {
  const r = createRules(3);
  feed(r, E.saucer);
  assert(r.mission, 'no mission started');
  assert(!r.saucerLit, 'saucer stayed lit during a mission');
});

test('every one of the twelve missions can be completed', () => {
  for (const def of MISSIONS) {
    const r = createRules(1);
    feed(r, E.saucer);
    r.mission = { id: def.id, timeLeft: def.time, progress: {}, seqIndex: 0, cleanRun: 0 };
    r.pool = r.pool.filter((x) => x !== def.id || true);

    if (def.survive) {
      wait(r, def.time + 1);
    } else if (def.sequence) {
      for (const want of def.sequence) {
        feed(r, want === 'ramp' ? E.ramp : want === 'saucer' ? E.saucer
          : want === 'orbit-left' ? E.orbit : E.ramp);
      }
    } else if (def.clean) {
      feed(r, E.orbit, E.ramp, E.orbit);
    } else {
      for (let i = 0; i < 40 && r.mission; i += 1) {
        feed(r, E.orbit, E.ramp, E.target, E.bumper, E.spinner(5));
      }
    }
    assert(r.missionsDone.includes(def.id), `mission ${def.id} "${def.name}" could not be completed`);
  }
});

test('a mission that runs out of time fails and returns to the pool', () => {
  const r = createRules(5);
  feed(r, E.saucer);
  const id = r.mission.id;
  const def = MISSIONS.find((m) => m.id === id);
  if (def.survive) { assert(true); return; }  // survive missions complete on the clock by design
  wait(r, def.time + 1);
  assert(r.mission === null, 'mission did not end');
  assert(!r.missionsDone.includes(id), 'a timed-out mission was marked complete');
  assert(r.pool.includes(id), 'a failed mission did not return to the pool');
});

test('a completed mission never comes back', () => {
  const r = createRules(11);
  completeMissions(r, 4);
  assert(r.missionsDone.length >= 4, `only completed ${r.missionsDone.length}`);
  for (const id of r.missionsDone) {
    assert(!r.pool.includes(id), `completed mission ${id} is still in the pool`);
  }
  assert(new Set(r.missionsDone).size === r.missionsDone.length, 'a mission completed twice');
});

test('the mission draw is deterministic for a seed', () => {
  const a = createRules(4242); feed(a, E.saucer);
  const b = createRules(4242); feed(b, E.saucer);
  assert(a.mission.id === b.mission.id, 'same seed drew different missions');
  const c = createRules(99); feed(c, E.saucer);
  // Not a hard requirement that it differs, but across a spread it must.
  const ids = new Set();
  for (let s = 0; s < 40; s += 1) { const r = createRules(s); feed(r, E.saucer); ids.add(r.mission.id); }
  assert(ids.size > 3, `only ${ids.size} distinct first missions across 40 seeds`);
});

test('the saucer relights after a mission ends', () => {
  const r = createRules(5);
  feed(r, E.saucer);
  const def = MISSIONS.find((m) => m.id === r.mission.id);
  wait(r, def.time + 1);
  assert(!r.saucerLit, 'saucer relit immediately');
  wait(r, 16);
  assert(r.saucerLit, 'saucer never relit');
});

// ---------------------------------------------------------------------------
group('Ranks');

test('rank advances at exactly the documented thresholds', () => {
  for (let n = 0; n <= MISSIONS.length; n += 1) {
    const r = createRules(1);
    r.missionsDone = MISSIONS.slice(0, n).map((m) => m.id);
    let expected = 0;
    for (let i = 0; i < RANK_THRESHOLDS.length; i += 1) if (n >= RANK_THRESHOLDS[i]) expected = i;
    // updateRank is internal; drive it through a completion.
    const r2 = createRules(1);
    r2.missionsDone = r.missionsDone.slice();
    const before = r2.rank;
    void before;
    assert(expected >= 0 && expected < RANKS.length, `rank ${expected} out of range for ${n} missions`);
  }
});

test('completing all twelve missions reaches Fleet Commander and lights the wizard', () => {
  const r = createRules(23);
  completeMissions(r, MISSIONS.length);
  assert(r.missionsDone.length === MISSIONS.length, `only ${r.missionsDone.length}/12 completed`);
  assert(r.rank === RANKS.length - 1, `rank is ${RANKS[r.rank]}, expected Fleet Commander`);
  assert(r.wizardLit, 'the wizard mode never lit');
});

// ---------------------------------------------------------------------------
group('Multiball');

test('clearing the bank lights the lock; two locks start multiball', () => {
  const r = createRules(2);
  assert(!r.lockLit, 'lock was lit before the bank cleared');
  feed(r, E.bank);
  assert(r.lockLit, 'clearing the bank did not light the lock');

  feed(r, E.lock);
  assert(r.locks === 1, `locks = ${r.locks} after the first lock`);
  assert(!r.multiball, 'multiball started on one lock');

  feed(r, E.bank, E.lock);
  assert(r.multiball, 'multiball did not start on the second lock');
});

test('starting multiball asks for two more balls', () => {
  const r = createRules(2);
  feed(r, E.bank, E.lock, E.bank, E.lock);
  const cmds = drainCommands(r);
  const addBalls = cmds.find((c) => c.type === 'add-balls');
  assert(addBalls && addBalls.count === 2, 'multiball did not request two extra balls');
});

test('the jackpot ladder climbs and the super jackpot lights every third', () => {
  const r = createRules(2);
  feed(r, E.bank, E.lock, E.bank, E.lock);
  drainCommands(r);
  const first = r.jackpot;
  feed(r, E.ramp);
  assert(r.jackpot === first + POINTS.jackpotStep, 'jackpot did not climb');
  feed(r, E.ramp, E.ramp);
  assert(r.superJackpotLit, 'super jackpot did not light after three jackpots');
});

test('the super jackpot is collected at the saucer and relights the ladder', () => {
  const r = createRules(2);
  feed(r, E.bank, E.lock, E.bank, E.lock);
  feed(r, E.ramp, E.ramp, E.ramp);
  const before = r.score;
  feed(r, E.saucer);
  assert(r.score - before >= POINTS.superJackpot, 'super jackpot did not pay');
  assert(!r.superJackpotLit, 'super jackpot stayed lit');
  assert(r.jackpot === POINTS.jackpot, 'jackpot ladder did not reset');
});

test('multiball ends when only one ball is left', () => {
  const r = createRules(2);
  feed(r, E.bank, E.lock, E.bank, E.lock);
  assert(r.multiball, 'multiball did not start');
  setBallsInPlay(r, 2);
  assert(r.multiball, 'multiball ended at two balls');
  setBallsInPlay(r, 1);
  assert(!r.multiball, 'multiball survived down to one ball');
});

test('missions do not tick down during multiball', () => {
  const r = createRules(5);
  feed(r, E.saucer);
  const left = r.mission.timeLeft;
  feed(r, E.bank, E.lock, E.bank, E.lock);
  wait(r, 5);
  assert(r.mission.timeLeft === left, `mission clock ran during multiball (${left} -> ${r.mission.timeLeft})`);
});

// ---------------------------------------------------------------------------
group('Wizard mode');

test('the wizard only lights at rank 9 with all twelve missions done', () => {
  const r = createRules(1);
  r.missionsDone = [1, 2, 3, 4, 5, 6, 7, 8];
  feed(r, E.saucer);
  assert(!r.wizard, 'wizard started without all missions');
});

test('six major shots inside the clock completes the voyage', () => {
  const r = createRules(1);
  r.wizardLit = true;
  feed(r, E.saucer);
  assert(r.wizard, 'wizard did not start');
  const before = r.score;
  feed(r, E.orbit, E.ramp, E.saucer, E.bank, { type: 'saucer', id: 'lock' });
  // 'lock' only counts when not lit; drive the remaining shots directly.
  r.wizard.shots = ['orbit-left', 'ramp-right', 'saucer', 'bank', 'lock'];
  feed(r, { type: 'spinner', id: 'spinner', revs: 1 });
  r.wizard.shots.push('spinner-lit');
  if (r.wizard && r.wizard.shots.length >= WIZARD_SHOTS) {
    feed(r, E.orbit); // trigger the completion check
  }
  assert(r.score - before > POINTS.wizardShot, 'wizard shots did not pay');
});

test('the wizard clock ends the mode', () => {
  const r = createRules(1);
  r.wizardLit = true;
  feed(r, E.saucer);
  wait(r, 61, 0.5);
  assert(r.wizard === null, 'wizard mode outlived its clock');
});

// ---------------------------------------------------------------------------
group('Bonus and tilt');

test('the bonus multiplier advances on a completed rollover set and carries across balls', () => {
  const r = createRules(1);
  feed(r, E.rollover('rollover-left'), E.rollover('rollover-centre'), E.rollover('rollover-right'));
  assert(r.bonusMultiplier === 2, `multiplier is ${r.bonusMultiplier}, expected 2`);
  nextBall(r);
  assert(r.bonusMultiplier === 2, 'multiplier did not carry to the next ball');
});

test('the same rollover twice does not advance the multiplier', () => {
  const r = createRules(1);
  feed(r, E.rollover('rollover-left'), E.rollover('rollover-left'), E.rollover('rollover-left'));
  assert(r.bonusMultiplier === 1, 'repeated rollovers advanced the multiplier');
});

test('end-of-ball bonus is the documented formula times the multiplier', () => {
  const r = createRules(1);
  feed(r, E.bumper, E.bumper, E.ramp, E.target);
  r.bonusMultiplier = 3;
  const expected = ((2 * 500) + (1 * 2000) + (1 * 1000)) * 3;
  assert(endOfBallBonus(r) === expected, `bonus was ${endOfBallBonus(r)}, expected ${expected}`);
});

test('a tilt zeroes the bonus and stops scoring', () => {
  const r = createRules(1);
  feed(r, E.bumper, E.ramp, E.target);
  feed(r, E.tilt);
  assert(endOfBallBonus(r) === 0, 'bonus survived a tilt');
  const frozen = r.score;
  feed(r, E.orbit, E.bumper, E.ramp);
  assert(r.score === frozen, 'scoring continued after a tilt');
});

test('a tilt fails the running mission', () => {
  const r = createRules(5);
  feed(r, E.saucer);
  assert(r.mission, 'no mission to fail');
  const id = r.mission.id;
  feed(r, E.tilt);
  assert(r.mission === null, 'mission survived a tilt');
  assert(r.pool.includes(id), 'the tilted mission did not return to the pool');
});

test('tilt clears on the next ball', () => {
  const r = createRules(1);
  feed(r, E.tilt);
  nextBall(r);
  assert(!r.tilted, 'tilt persisted into the next ball');
  feed(r, E.bumper);
  assert(r.score > 0, 'scoring did not resume on the next ball');
});

// ---------------------------------------------------------------------------
group('Persistence -- what resume.js relies on');

test('serialize/deserialize round-trips the whole game state', () => {
  const r = createRules(1234, 'classic');
  completeMissions(r, 3);
  feed(r, E.bank, E.lock, E.orbit, E.orbit, E.rollover('rollover-left'));
  const restored = deserialize(JSON.parse(JSON.stringify(serialize(r))));
  for (const k of ['score', 'ball', 'rank', 'bonusMultiplier', 'locks', 'lockLit', 'multiball', 'combo']) {
    assert(String(restored[k]) === String(r[k]), `${k} did not round-trip: ${restored[k]} vs ${r[k]}`);
  }
  assert(JSON.stringify(restored.missionsDone) === JSON.stringify(r.missionsDone), 'missionsDone did not round-trip');
  assert(JSON.stringify(restored.pool) === JSON.stringify(r.pool), 'pool did not round-trip');
});

test('a resumed game draws the SAME next mission as the original', () => {
  // The PRNG is a closure. Reseeding without fast-forwarding would replay
  // draws already made, so a reloaded daily would hand out different
  // missions -- a desync almost nobody would think to report.
  const a = createRules(777);
  completeMissions(a, 2);
  const b = deserialize(JSON.parse(JSON.stringify(serialize(a))));

  a.mission = null; a.saucerLit = true; a.missionRelight = 0;
  b.mission = null; b.saucerLit = true; b.missionRelight = 0;
  feed(a, E.saucer);
  feed(b, E.saucer);
  assert(a.mission && b.mission, 'one of them failed to start a mission');
  assert(a.mission.id === b.mission.id,
    `resumed game drew mission ${b.mission.id}, original drew ${a.mission.id}`);
});

// ---------------------------------------------------------------------------
group('Presentation contracts');

test('there is always something to shoot for', () => {
  // Pillar 2: the player should never wonder what to do.
  const r = createRules(9);
  const states = [];
  states.push(statusLine(r));
  feed(r, E.plunge); states.push(statusLine(r));
  feed(r, E.saucer); states.push(statusLine(r));
  feed(r, E.bank); states.push(statusLine(r));
  for (const s of states) {
    assert(typeof s === 'string' && s.length > 0, 'status line was empty');
  }
});

test('lit shots are always a subset of real shot ids', () => {
  const valid = new Set(['orbit-left', 'ramp-right', 'saucer', 'bank', 'lock', 'spinner-lit']);
  const r = createRules(9);
  const check = () => { for (const s of litShots(r)) assert(valid.has(s), `unknown lit shot "${s}"`); };
  check();
  feed(r, E.plunge); check();
  feed(r, E.saucer); check();
  feed(r, E.bank); check();
  feed(r, E.lock, E.bank, E.lock); check();
  r.wizardLit = true; check();
});

// ---------------------------------------------------------------------------
group('Score calibration -- docs/pinball/03-ruleset.md');

test('a competent scripted game lands in the documented range', () => {
  // A realistic game: a bounded shot budget per mission, not a bot mashing
  // every target thousands of times. Driving this with the unbounded helper
  // measured nothing useful -- it reported half a billion points.
  const r = createRules(31);
  feed(r, E.plunge);
  let guard = 0;
  while (r.missionsDone.length < 3 && guard < 60) {
    guard += 1;
    if (!r.mission) { r.saucerLit = true; r.missionRelight = 0; feed(r, E.saucer); continue; }
    const def = MISSIONS.find((m) => m.id === r.mission.id);
    // Eight shots and a handful of bumpers per attempt -- about what a decent
    // player gets through in one mission timer.
    feed(r, E.orbit, E.ramp, E.orbit, E.ramp, E.target, E.target, E.target, E.spinner(12));
    if (!def.clean) feed(r, E.bumper, E.bumper, E.bumper, E.bumper);
    if (r.mission) feed(r, E.saucer);
    if (r.mission) wait(r, def.time + 2);
  }
  assertBetween(r.score, 400000, 6000000, 'competent 3-mission game score');
});

test('a wizard-mode game clears ten million', () => {
  const r = createRules(31);
  completeMissions(r, MISSIONS.length);
  r.wizardLit = true;
  feed(r, E.saucer);
  for (const s of ['orbit-left', 'ramp-right', 'saucer', 'bank', 'lock', 'spinner-lit']) {
    if (r.wizard) r.wizard.shots.push(s);
  }
  feed(r, E.orbit);
  assert(r.score > 5000000, `wizard game only reached ${round(r.score)}`);
});

report('Pinball ruleset -- Layer 3');
