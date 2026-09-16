/**
 * tune.test.mjs -- physics tuning assertions. Gate G1.
 *
 * Run: node tools/pinball/tune.test.mjs
 *
 * Every test here places a ball in a known state, drives a scripted input tape
 * through the REAL engine, and asserts on where the ball actually ended up.
 * None of them recompute physics to check the physics -- that is the exact
 * pattern that produced 558 green tests over four live defects in Atlas Quest.
 *
 * This file is the definition of "the flippers feel right" in a form that
 * cannot rot. See docs/pinball/08-test-plan.md.
 */

import {
  sim, place, secs, had, countOf, firstOf, apex, escaped,
  group, test, assert, assertBetween, report, round,
} from './harness.mjs';
import { GRAVITY, nudge } from '../../play/pinball/engine.js';
import { ROLLOVERS, BALL_REST } from '../../play/pinball/table.js';

// Resting contact points on each flipper, derived from the table geometry.
// Pivots are at x=144 and x=342; at rest the tips sit at 217.6 and 268.4.
const LEFT_TIP = { x: 217.6, y: 926.5 };
const LEFT_MID = { x: 184, y: 916 };
const LEFT_BASE = { x: 166, y: 909 };
const RIGHT_TIP = { x: 268.4, y: 926.5 };

/** The window in which a ball is on a flipper and the player can hit it. */
const STRIKE = {
  left: { x0: 144, x1: 222, y0: 855, y1: 968 },
  right: { x0: 264, x1: 342, y0: 855, y1: 968 },
};

const inStrikeZone = (p, side) => {
  const z = STRIKE[side];
  return p.x >= z.x0 && p.x <= z.x1 && p.y >= z.y0 && p.y <= z.y1;
};

/** First moment the ball is on the given flipper, or null. */
function arrivesAt(path, side) {
  const hit = path.find((p) => inStrikeZone(p, side));
  return hit ? hit.t : null;
}

/**
 * A ball that stops moving and never starts again is wedged. It is NOT a
 * drain, NOT an escape, and nothing else in this suite would notice it -- the
 * game simply stops being playable while every other assertion stays green.
 * Saucers and the lock hold the ball on purpose, so those are exempt.
 */
function assertNotWedged(r, label) {
  const STILL = 18;             // u/s -- below this the ball is not going anywhere
  const LIMIT = secs(3.5);      // steps of stillness that count as wedged

  // The test is really "can the player still act on this ball?". A ball
  // cradled on a flipper and a ball sitting on the plunger are both
  // motionless for as long as you like and both entirely fine, because a
  // button press moves them. Anywhere else, stillness means the game has
  // stopped. Saucers hold the ball by design too.
  const actionable = (p) => {
    if (p.x > 468) return true;                              // in the shooter lane
    if (p.y > 845 && p.x > 120 && p.x < 370) return true;    // cradled on a flipper
    return false;
  };

  let run = 0;
  for (const p of r.path) {
    const held = r.world.saucers.some((sc) => sc.ball);
    if (held || actionable(p) || Math.hypot(p.vx, p.vy) > STILL) { run = 0; continue; }
    run += 1;
    if (run > LIMIT) {
      throw new Error(`${label}: ball wedged at (${Math.round(p.x)}, ${Math.round(p.y)})`);
    }
  }
}

/** Hold a flipper from `at` seconds for `hold` seconds. */
const flip = (side, at = 0.1, hold = 0.4) => (i) =>
  ({ [side]: i >= secs(at) && i < secs(at + hold) });

// ---------------------------------------------------------------------------
group('Flipper power and the tip/base gradient');

test('T1  full tip shot from the left flipper makes the right ramp', () => {
  const r = sim({ steps: secs(3), setup: (w) => place(w, LEFT_TIP.x, LEFT_TIP.y), input: flip('left') });
  assert(had(r.events, 'ramp-enter', 'ramp-right'), 'left tip shot did not enter the right ramp');
});

test('T2  base shot from the left flipper does NOT make the right ramp', () => {
  const r = sim({ steps: secs(3), setup: (w) => place(w, LEFT_BASE.x, LEFT_BASE.y), input: flip('left') });
  assert(!had(r.events, 'ramp-enter', 'ramp-right'), 'a base shot should not reach the right ramp');
});

test('T1b full tip shot from the right flipper makes the left orbit', () => {
  const r = sim({ steps: secs(3), setup: (w) => place(w, RIGHT_TIP.x, RIGHT_TIP.y), input: flip('right') });
  assert(had(r.events, 'ramp-enter', 'orbit-left'), 'right tip shot did not enter the left orbit');
});

test('T2b launch speed falls off monotonically from tip to base', () => {
  const launch = (x, y) => {
    const r = sim({ steps: secs(1), setup: (w) => place(w, x, y), input: flip('left') });
    return r.path.filter((p) => p.t > 0.1 && p.t < 0.3)
      .reduce((m, p) => Math.max(m, Math.hypot(p.vx, p.vy)), 0);
  };
  const tip = launch(LEFT_TIP.x, LEFT_TIP.y);
  const mid = launch(LEFT_MID.x, LEFT_MID.y);
  const base = launch(LEFT_BASE.x, LEFT_BASE.y);
  assert(tip > mid && mid > base, `not monotonic: tip ${round(tip)}, mid ${round(mid)}, base ${round(base)}`);
  // The gradient is the whole point -- it must be large enough to feel.
  assert(tip / base > 1.7, `tip/base ratio only ${round(tip / base)}, needs to be clearly felt`);
});

test('T2c a full tip shot clears the height needed to reach the top arch', () => {
  // 900 units of climb against gravity needs sqrt(2*g*900) at the flipper.
  const needed = Math.sqrt(2 * GRAVITY * 900);
  const r = sim({ steps: secs(1), setup: (w) => place(w, LEFT_TIP.x, LEFT_TIP.y), input: flip('left') });
  const peak = r.path.filter((p) => p.t > 0.1 && p.t < 0.3)
    .reduce((m, p) => Math.max(m, Math.hypot(p.vx, p.vy)), 0);
  assert(peak > needed, `tip shot leaves at ${round(peak)} u/s, needs more than ${round(needed)}`);
});

// ---------------------------------------------------------------------------
group('Gravity');

test('T3  free fall in a clear column matches the analytic time', () => {
  // The column must actually be clear, so the test asserts that too rather
  // than trusting a comment: a device moved into the path once already, and
  // the only symptom was a fall time 2% out.
  const drop = 240;
  const r = sim({
    steps: secs(2),
    setup: (w) => place(w, 270, 470),
    input: {},
    stopWhen: (w) => w.balls[0] && w.balls[0].y >= 470 + drop,
  });
  const touched = r.events.filter((e) => e.type !== 'plunge-reset');
  assert(touched.length === 0, `column was not clear: ${touched.map((e) => e.type + ':' + (e.id || '')).join(', ')}`);
  const t = r.steps / 480;
  const ideal = Math.sqrt((2 * drop) / GRAVITY);
  assertBetween(t, ideal * 0.98, ideal * 1.10, `fall time (ideal ${round(ideal)}s)`);
});

// ---------------------------------------------------------------------------
group('Plunger');

test('T4  a full plunge crosses all three top rollover lanes', () => {
  const r = sim({ steps: secs(5), input: (i) => ({ plunge: i < secs(1.0) }) });
  assert(had(r.events, 'plunge'), 'the plunger never fired');
  assert(countOf(r.events, 'rollover') >= 3, `only crossed ${countOf(r.events, 'rollover')} lanes`);
});

test('T4c a full plunge delivers the ball to a flipper, playably', () => {
  // The opening five seconds of every game. If a full plunge never reaches a
  // flipper, the first thing a new player experiences is losing a ball for
  // doing the one obvious thing. Note the ball is NOT expected to sit there
  // forever: a flipper at rest lets the ball roll off, which is correct --
  // cradling requires holding the flipper up.
  const r = sim({ steps: secs(8), input: (i) => ({ plunge: i < secs(1.0) }) });
  const t = arrivesAt(r.path, 'right') || arrivesAt(r.path, 'left');
  assert(t !== null, 'a full plunge never put the ball on a flipper');
  assert(t < 6, `ball took ${round(t)}s to reach a flipper`);
});

test('T4d a cradled ball does not re-fire the flipper event every step', () => {
  // It used to emit ~1700 events for one plunge: 480 sounds and 480 score
  // awards per second, for a ball sitting still.
  const r = sim({ steps: secs(8), input: (i) => ({ plunge: i < secs(1.0) }) });
  assert(countOf(r.events, 'flipper') < 12, `${countOf(r.events, 'flipper')} flipper events for one plunge`);
});

test('T5  a soft plunge does not reach the rollovers', () => {
  const r = sim({
    steps: secs(5),
    input: (i) => ({ plunge: i < secs(0.05) }),
  });
  assert(had(r.events, 'plunge'), 'the plunger never fired');
  assert(!had(r.events, 'rollover'), 'a soft plunge should fall short of the rollovers');
});

test('T4b plunge power scales the launch speed', () => {
  const speedOf = (hold) => {
    const r = sim({ steps: secs(2), input: (i) => ({ plunge: i < secs(hold) }) });
    const e = firstOf(r.events, 'plunge');
    return e ? e.speed : 0;
  };
  assert(speedOf(1.0) > speedOf(0.3) && speedOf(0.3) > speedOf(0.02), 'plunge power does not scale');
});

// ---------------------------------------------------------------------------
group('Flipper feel: catching, cradling, dead bounce');

test('T6  a ball landing on a raised flipper settles toward the base', () => {
  const r = sim({
    steps: secs(1.6),
    setup: (w) => place(w, 215, 830, 0, 260),
    input: { left: true },
  });
  const late = r.path.filter((p) => p.t > 1.0);
  assert(late.length > 0, 'ball did not survive');
  const end = late.at(-1);
  // It must still be on the flipper, and have moved toward the pivot at x=153.
  assert(end.y < 980, `ball fell off the flipper (y ${round(end.y)})`);
  assert(end.x < 215, `ball did not settle toward the base (x ${round(end.x)})`);
});

test('T7  a dead bounce off the raised left flipper crosses to the right side', () => {
  const r = sim({
    steps: secs(1.2),
    setup: (w) => place(w, 200, 700, 90, 900),
    input: { left: true },
  });
  const crossed = r.path.some((p) => p.t > 0.2 && p.x > 250);
  assert(crossed, 'the ball never crossed to the right half');
});

test('T8  a cradled ball can be flipped again without being re-placed', () => {
  // Cradle first, then drop and re-flip. This is the shot a player actually
  // makes: hold to settle the ball, release to let it roll down the flipper,
  // then flip for power.
  const r = sim({
    steps: secs(3),
    setup: (w) => place(w, 200, 830, 0, 260),
    input: (i) => ({ left: i < secs(1.2) || i >= secs(1.55) }),
  });
  const after = r.path.filter((p) => p.t > 1.55 && p.t < 2.0);
  const vmax = after.reduce((m, p) => Math.max(m, Math.hypot(p.vx, p.vy)), 0);
  assert(vmax > 700, `re-flip only produced ${round(vmax)} u/s`);
});

// ---------------------------------------------------------------------------
group('Lane returns');

test('R1  the right ramp returns the ball onto the left flipper', () => {
  // This is a regression test. An earlier slingshot placement left 3.6 units
  // of clearance above the inlane rail, so every inlane return was silently a
  // drain -- and nothing else in the suite would have caught it.
  const r = sim({ steps: secs(5), setup: (w) => place(w, 74, 782, 0, 300), input: {} });
  const t = arrivesAt(r.path, 'left');
  assert(t !== null, 'the left inlane never delivered the ball to the flipper');
  assert(t < 3, `inlane return took ${round(t)}s`);
});

test('R2  the left orbit returns the ball onto the right flipper', () => {
  const r = sim({ steps: secs(5), setup: (w) => place(w, 412, 782, 0, 300), input: {} });
  const t = arrivesAt(r.path, 'right');
  assert(t !== null, 'the right inlane never delivered the ball to the flipper');
  assert(t < 3, `inlane return took ${round(t)}s`);
});

test('R3  a ball delivered by an inlane can be flipped into a real shot', () => {
  // Reaching the flipper is not enough -- it has to arrive in a state the
  // player can actually do something with.
  for (const [label, x, side, floor] of [
    ['right ramp return', 74, 'left', 1500],
    ['left orbit return', 412, 'right', 1500],
  ]) {
    const probe = sim({ steps: secs(5), setup: (w) => place(w, x, 782, 0, 300), input: {} });
    const t = arrivesAt(probe.path, side);
    assert(t !== null, `${label}: never reached the flipper`);
    const shot = sim({
      steps: secs(5),
      setup: (w) => place(w, x, 782, 0, 300),
      input: (i) => ({ [side]: i >= secs(t + 0.25) && i < secs(t + 0.65) }),
    });
    const after = shot.path.filter((p) => p.t > t + 0.25 && p.t < t + 0.9);
    const vmax = after.reduce((m, p) => Math.max(m, Math.hypot(p.vx, p.vy)), 0);
    assert(vmax > floor, `${label}: flipping produced only ${round(vmax)} u/s`);
  }
});

test('R4  a ball left alone on a resting flipper eventually drains', () => {
  // A flipper at rest must let the ball roll off. When it does not, no ball
  // is ever lost and no game can end -- which is exactly what happened when
  // the drain gap was measured between tip CENTRES instead of tip edges,
  // leaving 16.8 units of clearance for a 26-unit ball.
  const r = sim({ steps: secs(12), setup: (w) => place(w, 412, 782, 0, 300), input: {} });
  assert(had(r.events, 'drain'), 'the ball never drained with no input at all');
});

// ---------------------------------------------------------------------------
group('Ramps');

test('T11 a ramp entered at or above threshold is captured and delivered', () => {
  const r = sim({
    steps: secs(4),
    setup: (w) => place(w, 296, 560, 0, -1500),
    input: {},
  });
  assert(had(r.events, 'ramp-enter', 'ramp-right'), 'ramp was not entered');
  assert(had(r.events, 'ramp-exit', 'ramp-right'), 'ramp did not deliver the ball');
});

test('T12 a ramp entered below threshold rejects', () => {
  const r = sim({
    steps: secs(2),
    setup: (w) => place(w, 296, 560, 0, -700),
    input: {},
  });
  assert(had(r.events, 'ramp-reject', 'ramp-right'), 'a weak shot should reject');
  assert(!had(r.events, 'ramp-enter', 'ramp-right'), 'a weak shot should not be captured');
});

test('T12b a rejecting ball does not machine-gun the reject event', () => {
  const r = sim({ steps: secs(2), setup: (w) => place(w, 296, 560, 0, -700), input: {} });
  assert(countOf(r.events, 'ramp-reject') <= 3, `reject fired ${countOf(r.events, 'ramp-reject')} times`);
});

// ---------------------------------------------------------------------------
group('Nudge and tilt');

test('T13 three nudges inside a second tilt the table', () => {
  const r = sim({
    steps: secs(2),
    setup: (w) => place(w, 270, 500),
    input: {},
    at: (i, w) => {
      if (i === 10 || i === 120 || i === 230) nudge(w, 1, 0);
    },
  });
  assert(had(r.events, 'tilt'), 'three fast nudges did not tilt the table');
  assert(r.world.tilted, 'world.tilted was not set');
});

test('T13b a tilted table kills the flippers', () => {
  // The tilt is set directly rather than nudged into existence. Nudging three
  // times also flings the ball sideways into a slingshot, and the 1600 u/s
  // kick from that was being read as "the flipper launched it" -- the test
  // was measuring the nudge, not the flipper. T13 already covers that three
  // nudges cause a tilt.
  const r = sim({
    steps: secs(2),
    setup: (w) => place(w, LEFT_TIP.x, LEFT_TIP.y),
    input: (i) => ({ left: i >= 30 }),
    at: (i, w) => { if (i === 1) w.tilted = true; },
  });
  assert(r.world.tilted, 'table did not tilt');
  assert(r.world.flippers.left.angle === r.world.flippers.left.restAngle, 'flipper left its rest position');
  // A dead flipper is still a solid surface, so a ball striking it legitimately
  // emits a contact event -- the thing that must not happen is PROPULSION.
  const launched = r.path.some((p) => p.t > 30 / 480 && p.vy < -400);
  assert(!launched, 'a tilted flipper still launched the ball');
});

test('T14 nudges spaced out do not tilt', () => {
  const r = sim({
    steps: secs(6),
    setup: (w) => place(w, 270, 500),
    input: {},
    at: (i, w) => {
      // One nudge every 2 s. The meter decays at 1.0/s, so it never stacks.
      if (i === 10 || i === 10 + secs(2) || i === 10 + secs(4)) nudge(w, 1, 0);
    },
  });
  assert(!had(r.events, 'tilt'), 'spaced nudges should never tilt');
  assert(r.world.tilt < 1.2, `tilt meter did not decay (at ${round(r.world.tilt)})`);
});

test('T14b a nudge actually moves the ball', () => {
  // Not at (243, 400): that is inside the centre scoop, and a captured ball
  // is deliberately immune to nudging -- which made this pass zero movement.
  const noNudge = sim({ steps: secs(0.5), setup: (w) => place(w, 270, 500), input: {} });
  const withNudge = sim({
    steps: secs(0.5),
    setup: (w) => place(w, 270, 500),
    input: {},
    at: (i, w) => { if (i === 10) nudge(w, 1, 0); },
  });
  const dx = withNudge.path.at(-1).x - noNudge.path.at(-1).x;
  assert(dx > 40, `nudge only shifted the ball ${round(dx)} units`);
});

// ---------------------------------------------------------------------------
group('Containment -- the anti-tunnelling tests');

test('T9  a ball at full speed fired at every wall never escapes', () => {
  const dirs = 24;
  for (let i = 0; i < dirs; i += 1) {
    const a = (i / dirs) * Math.PI * 2;
    const r = sim({
      steps: secs(2.5),
      setup: (w) => place(w, 243, 500, Math.cos(a) * 3900, Math.sin(a) * 3900),
      input: {},
    });
    assert(!escaped(r.path), `ball escaped on heading ${Math.round((a * 180) / Math.PI)} deg`);
    assert(!had(r.events, 'escaped'), `containment net fired on heading ${Math.round((a * 180) / Math.PI)} deg`);
  }
});

test('T10 fuzz: 120 seeds of random input never escape or wedge the ball', () => {
  for (let s = 0; s < 120; s += 1) {
    const rnd = (() => {
      let a = (s * 2654435761) >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })();
    let left = false;
    let right = false;
    const r = sim({
      seed: s,
      steps: secs(12),
      input: (i) => {
        if (i % 40 === 0) { left = rnd() > 0.5; right = rnd() > 0.5; }
        return { left, right, plunge: i < secs(0.6) };
      },
    });
    assert(!escaped(r.path), `seed ${s}: ball left the cabinet`);
    assert(!had(r.events, 'escaped'), `seed ${s}: containment net fired`);
    assertNotWedged(r, s);
  }
});

test('T10b a hard plunge at every power never wedges the ball', () => {
  // The regression that motivated assertNotWedged. A contact resolved at t=0
  // used to consume a loop iteration without advancing the clock, and four of
  // those discarded the whole timestep -- so a hard plunge stopped dead
  // against the top arch and stayed there for the rest of the game. Nothing
  // escaped and nothing drained, so every containment test stayed green.
  for (let h = 2; h <= 20; h += 1) {
    const hold = h / 20;
    const r = sim({ steps: secs(8), input: (i) => ({ plunge: i < secs(hold) }) });
    assertNotWedged(r, `plunge hold ${hold}`);
  }
});

// ---------------------------------------------------------------------------
group('Determinism -- decision D8');

test('D1  the same seed and inputs produce a bit-identical run', () => {
  // Everything downstream leans on this: the daily challenge, the replay
  // regression tapes, and web/app builds behaving the same. If it ever stops
  // being true, the tapes become noise and nobody notices.
  const tape = (i) => ({ left: i % 97 < 20, right: i % 131 < 25, plunge: i < secs(0.7) });
  const a = sim({ seed: 4242, steps: secs(10), input: tape });
  const b = sim({ seed: 4242, steps: secs(10), input: tape });
  assert(a.path.length === b.path.length, 'runs diverged in length');
  for (let i = 0; i < a.path.length; i += 1) {
    if (a.path[i].x !== b.path[i].x || a.path[i].y !== b.path[i].y) {
      throw new Error(`diverged at step ${i}: (${round(a.path[i].x)},${round(a.path[i].y)}) vs (${round(b.path[i].x)},${round(b.path[i].y)})`);
    }
  }
  assert(a.events.length === b.events.length, 'event streams differ in length');
});

test('D2  a different seed does not change the physics', () => {
  // Only the ruleset draws on the PRNG. If the seed moves the BALL, then the
  // physics is reading randomness it should not be, and replay is unsound.
  const tape = (i) => ({ left: i % 97 < 20, plunge: i < secs(0.7) });
  const a = sim({ seed: 1, steps: secs(6), input: tape });
  const b = sim({ seed: 999999, steps: secs(6), input: tape });
  const end = (r) => r.path.at(-1);
  assert(end(a).x === end(b).x && end(a).y === end(b).y,
    `seed changed the ball path: (${round(end(a).x)},${round(end(a).y)}) vs (${round(end(b).x)},${round(end(b).y)})`);
});

test('D3  the engine never reads the wall clock', () => {
  // Freezing Date.now and Math.random must change nothing at all.
  const tape = (i) => ({ left: i % 71 < 18, plunge: i < secs(0.7) });
  const before = sim({ seed: 77, steps: secs(6), input: tape });
  const realNow = Date.now;
  const realRandom = Math.random;
  Date.now = () => 0;
  Math.random = () => 0.5;
  try {
    const after = sim({ seed: 77, steps: secs(6), input: tape });
    assert(after.path.at(-1).x === before.path.at(-1).x
      && after.path.at(-1).y === before.path.at(-1).y, 'engine depends on the ambient clock or Math.random');
  } finally {
    Date.now = realNow;
    Math.random = realRandom;
  }
});

report('Pinball physics tuning -- gate G1');
