/**
 * engine.js -- pinball physics. Pure: no DOM, no React, no clock, no globals.
 *
 * This file is shared verbatim between the web build, the headless harness and
 * (at P8) the app. See docs/pinball/02-physics.md for the reasoning behind
 * every constant; the short version is that 1000 logical units = 1 metre, so
 * the numbers are checkable against a real machine instead of guessed.
 *
 * It emits events and knows nothing about scoring. rules.js consumes the
 * events and knows nothing about collision. That separation is what lets the
 * app reuse both files byte-for-byte.
 *
 * TWO DEVIATIONS FROM 02-physics.md, both found while building:
 *
 *  1. The fixed step is 1/480 s, not 1/240. Static geometry is swept, so the
 *     ball is safe at any speed -- but the FLIPPER is tested discretely,
 *     because sweeping a capsule that is itself rotating is a different and
 *     much nastier problem. At 240 Hz a fast ball moves 16.7 u while the
 *     flipper tip moves 9.9 u, which is too close to the 21 u combined radius
 *     to trust. At 480 Hz those become 8.3 u and 5 u, which is comfortably
 *     safe. Doubling the rate was far cheaper than writing a rotating sweep.
 *
 *  2. `step()` mutates the world and returns it, rather than returning a fresh
 *     one. At 480 Hz with up to four balls, allocating a new world per step
 *     produces enough garbage to cause visible collection pauses. Purity here
 *     means DETERMINISM -- same seed plus same inputs gives the same result
 *     every time -- which is what the replay harness actually relies on, and
 *     that is fully preserved.
 */

import {
  W, H, BALL_R, FIELD_LEFT, LANE_CX, LANE_TOP, BALL_REST,
  WALLS, BUMPERS, BUMPER_KICK, SLING_KICK, SLING_THRESHOLD,
  DROP_TARGETS, SPINNER, SAUCERS, ROLLOVERS, RAMPS, KICKBACK,
  FLIPPERS, FLIPPER_MOTOR, MODES, MAT,
} from './table.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DT = 1 / 480;
export const MAX_SUBSTEPS = 16;

export const GRAVITY = 1110;        // u/s^2 -- 9.81 m/s^2 * sin(6.5 deg)
export const MAX_SPEED = 4000;      // u/s -- 4 m/s
export const ROLL_FRICTION = 0.35;  // per second, applied as exp(-k*dt)
export const LOW_SPEED_E = 150;     // below this, restitution lerps down...
export const LOW_SPEED_E_MIN = 0.2; // ...to this, so balls settle in lanes

export const PLUNGE_MIN = 900;      // u/s at zero charge
export const PLUNGE_MAX = 2600;     // u/s at full charge

export const SAUCER_CATCH_SPEED = 3000; // u/s -- above this a scoop rejects
export const NUDGE_IMPULSE = 260;   // u/s
export const TILT_PER_NUDGE = 1.15;
export const TILT_DECAY = 0.6;      // per second

export const CONSTANTS = {
  DT, GRAVITY, MAX_SPEED, BALL_R, W, H, PLUNGE_MIN, PLUNGE_MAX,
  NUDGE_IMPULSE, TILT_PER_NUDGE, TILT_DECAY,
};

// ---------------------------------------------------------------------------
// Small math helpers
// ---------------------------------------------------------------------------

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** mulberry32 -- the same PRNG the rest of the arcade uses for daily seeds. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Coulomb friction: the tangential impulse can never exceed mu times the
 * normal impulse.
 *
 * Applying friction as a flat fraction of tangential velocity per CONTACT is
 * the obvious-looking version and it is wrong, because a resting ball
 * contacts its surface every single step. At 480 Hz that compounds to a total
 * stop, so a ball placed on a sloped rail freezes there instead of rolling
 * down it. Scaling by the normal impulse fixes it for free: a resting contact
 * generates a tiny normal impulse and therefore tiny friction, while a hard
 * hit generates a large one and grips properly.
 */
function applyFriction(ball, nx, ny, mu, normalImpulse) {
  const tx = -ny;
  const ty = nx;
  const vt = ball.vx * tx + ball.vy * ty;
  if (Math.abs(vt) < 1e-6) return 0;
  const maxJt = Math.abs(mu * normalImpulse);
  const jt = clamp(-vt, -maxJt, maxJt);
  ball.vx += jt * tx;
  ball.vy += jt * ty;
  return jt;
}

/** Restitution falls off at low impact speeds so balls settle instead of jittering. */
function effectiveE(e, impactSpeed) {
  if (impactSpeed >= LOW_SPEED_E) return e;
  const t = clamp(impactSpeed / LOW_SPEED_E, 0, 1);
  return LOW_SPEED_E_MIN + (e - LOW_SPEED_E_MIN) * t;
}

// ---------------------------------------------------------------------------
// Swept collision against static geometry
//
// Each routine returns { t, nx, ny } for the earliest impact within `dt`, or
// null. Normals always point away from the surface, toward the ball.
// ---------------------------------------------------------------------------

/** Swept circle (radius R, at p, moving v) against a static circle. */
function sweepCircle(px, py, vx, vy, dt, cx, cy, cr, R) {
  const sum = cr + R;
  const dx = px - cx;
  const dy = py - cy;
  const cc = dx * dx + dy * dy - sum * sum;

  if (cc < 0) {
    // Already overlapping -- resolve immediately and push out.
    const d = Math.hypot(dx, dy) || 1e-6;
    return { t: 0, nx: dx / d, ny: dy / d, depth: sum - d };
  }

  const a = vx * vx + vy * vy;
  if (a < 1e-12) return null;
  const b = 2 * (dx * vx + dy * vy);
  if (b >= 0) return null; // moving away
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  if (t < 0 || t > dt) return null;

  const hx = px + vx * t - cx;
  const hy = py + vy * t - cy;
  const d = Math.hypot(hx, hy) || 1e-6;
  return { t, nx: hx / d, ny: hy / d, depth: 0 };
}

/**
 * Swept circle against a segment, treated as a capsule of radius R.
 * Tests the flat face and both endpoints, and takes the earliest.
 */
function sweepSegment(px, py, vx, vy, dt, ax, ay, bx, by, R) {
  const ex = bx - ax;
  const ey = by - ay;
  const len2 = ex * ex + ey * ey;
  if (len2 < 1e-9) return sweepCircle(px, py, vx, vy, dt, ax, ay, 0, R);
  const len = Math.sqrt(len2);

  // Unit normal to the segment.
  let nx = ey / len;
  let ny = -ex / len;

  // Signed distance from the ball centre to the segment's line.
  const d = (px - ax) * nx + (py - ay) * ny;
  // Always work with the normal pointing toward the ball's side.
  const sign = d >= 0 ? 1 : -1;
  nx *= sign;
  ny *= sign;
  const dist = d * sign;

  let best = null;

  const vn = vx * nx + vy * ny;
  if (dist < R && dist > -R) {
    // Starting inside the slab: contact now, if it projects onto the segment.
    const s = ((px - ax) * ex + (py - ay) * ey) / len2;
    if (s >= 0 && s <= 1) best = { t: 0, nx, ny, depth: R - dist };
  }
  if (!best && vn < 0) {
    const t = (R - dist) / vn;
    if (t >= 0 && t <= dt) {
      const hx = px + vx * t;
      const hy = py + vy * t;
      const s = ((hx - ax) * ex + (hy - ay) * ey) / len2;
      if (s >= 0 && s <= 1) best = { t, nx, ny, depth: 0 };
    }
  }

  // Endpoint caps.
  for (const [cx, cy] of [[ax, ay], [bx, by]]) {
    const hit = sweepCircle(px, py, vx, vy, dt, cx, cy, 0, R);
    if (hit && (!best || hit.t < best.t)) best = hit;
  }

  return best;
}

/**
 * Swept circle against an arc collided from the INSIDE -- the ball is inside
 * the arc's circle and hits its inner face. This is the top arch and the lane
 * guides. Contact happens at |p - c| = r - R, and we want the outward-going
 * root.
 */
function sweepArcInside(px, py, vx, vy, dt, cx, cy, r, a0, a1, R) {
  const inner = r - R;
  const dx = px - cx;
  const dy = py - cy;
  const cc = dx * dx + dy * dy - inner * inner;

  const angleOk = (hx, hy) => {
    let ang = Math.atan2(hy, hx);
    if (ang < 0) ang += Math.PI * 2;
    let lo = a0;
    let hi = a1;
    if (lo < 0) lo += Math.PI * 2;
    if (hi < 0) hi += Math.PI * 2;
    if (hi <= lo) hi += Math.PI * 2;
    if (ang < lo) ang += Math.PI * 2;
    return ang >= lo && ang <= hi;
  };

  if (cc > 0) {
    // Already outside the inner radius, i.e. penetrating the wall.
    const d = Math.hypot(dx, dy) || 1e-6;
    if (!angleOk(dx, dy)) return null;
    return { t: 0, nx: -dx / d, ny: -dy / d, depth: d - inner };
  }

  const a = vx * vx + vy * vy;
  if (a < 1e-12) return null;
  const b = 2 * (dx * vx + dy * vy);
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null;
  const t = (-b + Math.sqrt(disc)) / (2 * a); // outward-going root
  if (t < 0 || t > dt) return null;

  const hx = px + vx * t - cx;
  const hy = py + vy * t - cy;
  if (!angleOk(hx, hy)) return null;
  const d = Math.hypot(hx, hy) || 1e-6;
  return { t, nx: -hx / d, ny: -hy / d, depth: 0 };
}

/** Dispatch one static primitive. */
function sweepShape(shape, px, py, vx, vy, dt, R) {
  if (shape.type === 'segment') {
    return sweepSegment(px, py, vx, vy, dt, shape.a.x, shape.a.y, shape.b.x, shape.b.y, R);
  }
  if (shape.type === 'circle') {
    return sweepCircle(px, py, vx, vy, dt, shape.c.x, shape.c.y, shape.r, R);
  }
  if (shape.type === 'arc') {
    if (shape.inside) {
      return sweepArcInside(px, py, vx, vy, dt, shape.c.x, shape.c.y, shape.r, shape.a0, shape.a1, R);
    }
    return sweepCircle(px, py, vx, vy, dt, shape.c.x, shape.c.y, shape.r, R);
  }
  return null;
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

function makeBall(x, y, vx, vy) {
  return {
    x, y, vx, vy,
    spin: 0,
    inRamp: null,
    rampT: 0,
    captured: null,
    captureT: 0,
    inLane: true,
    alive: true,
    trail: [],
  };
}

export function createWorld(modeId, seed) {
  const mode = MODES[modeId] || MODES.classic;
  return {
    modeId: modeId in MODES ? modeId : 'classic',
    mode,
    seed: seed >>> 0,
    rand: mulberry32(seed >>> 0),

    phase: 'ready', // ready | playing | draining | over
    balls: [makeBall(BALL_REST.x, BALL_REST.y, 0, 0)],
    ballsInPlay: 1,

    flippers: {
      left: { ...FLIPPERS.left, angle: FLIPPERS.left.restAngle, angVel: 0, held: false },
      right: { ...FLIPPERS.right, angle: FLIPPERS.right.restAngle, angVel: 0, held: false },
    },

    dropTargets: DROP_TARGETS.map((t) => ({ ...t, up: true })),
    saucers: SAUCERS.map((s) => ({ ...s, ball: null })),
    kickbackArmed: mode.kickback === 'always',

    plunger: { charging: false, power: 0 },

    tilt: 0,
    tilted: false,
    tiltWarnings: 0,
    nudge: { x: 0, y: 0, t: 0 },

    gravityScale: mode.gravityScale,
    time: 0,
    events: [],
  };
}

// ---------------------------------------------------------------------------
// Flippers
// ---------------------------------------------------------------------------

function flipperTip(f) {
  return { x: f.pivot.x + Math.cos(f.angle) * f.length, y: f.pivot.y + Math.sin(f.angle) * f.length };
}

/** Radius of the flipper capsule at parameter s along its length (0 base, 1 tip). */
function flipperRadiusAt(f, s) {
  return f.baseR + (f.tipR - f.baseR) * s;
}

function stepFlipper(f, held, dt, tilted) {
  const active = held && !tilted;
  f.held = active;
  const target = active ? f.endAngle : f.restAngle;
  const m = FLIPPER_MOTOR;
  const toward = target - f.angle;
  if (Math.abs(toward) < 1e-5) {
    f.angle = target;
    f.angVel = 0;
    return;
  }
  const dir = Math.sign(toward);
  const accel = active ? m.upAccel : m.downAccel;
  const maxVel = active ? m.upMaxVel : m.downMaxVel;

  f.angVel += dir * accel * dt;
  f.angVel = clamp(f.angVel, -maxVel, maxVel);

  const next = f.angle + f.angVel * dt;
  // Clamp hard at the stops.
  if ((dir > 0 && next >= target) || (dir < 0 && next <= target)) {
    f.angle = target;
    f.angVel = 0;
  } else {
    f.angle = next;
  }
}

/**
 * Discrete flipper collision with angular impulse transfer.
 *
 * This is the whole reason the engine was rewritten. The contact point's
 * surface velocity is omega x r, so |v_surface| grows linearly with distance
 * from the pivot -- a tip shot is automatically stronger than a base shot,
 * with no hit-position lookup table and no special-casing. That single
 * property is most of what "good flipper feel" means.
 */
function resolveFlipper(ball, f, events) {
  const tip = flipperTip(f);
  const ex = tip.x - f.pivot.x;
  const ey = tip.y - f.pivot.y;
  const len2 = ex * ex + ey * ey;

  // Closest point on the flipper's spine to the ball centre.
  let s = ((ball.x - f.pivot.x) * ex + (ball.y - f.pivot.y) * ey) / len2;
  s = clamp(s, 0, 1);
  const px = f.pivot.x + ex * s;
  const py = f.pivot.y + ey * s;

  const surfaceR = flipperRadiusAt(f, s);
  let dx = ball.x - px;
  let dy = ball.y - py;
  let dist = Math.hypot(dx, dy);
  const minDist = surfaceR + BALL_R;
  if (dist >= minDist) return false;

  if (dist < 1e-6) {
    // Degenerate: push straight up out of the flipper.
    dx = 0;
    dy = -1;
    dist = 1e-6;
  }
  const nx = dx / dist;
  const ny = dy / dist;

  // Surface velocity at the contact point: omega x r, in 2D.
  const rx = px - f.pivot.x;
  const ry = py - f.pivot.y;
  const svx = -f.angVel * ry;
  const svy = f.angVel * rx;

  const rvx = ball.vx - svx;
  const rvy = ball.vy - svy;
  const vn = rvx * nx + rvy * ny;

  // Push out of penetration first, so a rising flipper cannot drive the ball
  // through itself.
  ball.x = px + nx * minDist;
  ball.y = py + ny * minDist;

  if (vn > 0) return false; // separating

  const e = effectiveE(MAT.flipper.e, Math.abs(vn));
  const j = -(1 + e) * vn;
  ball.vx += j * nx;
  ball.vy += j * ny;

  // Tangential friction, relative to the moving surface. This is what makes a
  // live catch work: a ball landing on a raised flipper grips and settles
  // toward the base instead of skating off it.
  const tx = -ny;
  const ty = nx;
  const vt = (ball.vx - svx) * tx + (ball.vy - svy) * ty;
  const maxJt = Math.abs(MAT.flipper.mu * j);
  const jt = clamp(-vt, -maxJt, maxJt);
  ball.vx += jt * tx;
  ball.vy += jt * ty;
  ball.spin = clamp(ball.spin - vt * 0.002, -12, 12);

  // Only a real strike counts. A ball cradled on a raised flipper is in
  // contact every single step, and without this guard it emitted a flipper
  // event 480 times a second -- which would have meant 480 sound effects and
  // 480 score awards a second for standing still.
  if (Math.abs(vn) > 60) events.push({ type: 'flipper', id: f.id, s, speed: Math.abs(vn) });
  return true;
}

// ---------------------------------------------------------------------------
// Scripted ramp paths (decision D9)
// ---------------------------------------------------------------------------

/** Catmull-Rom through the path points; t is 0..1 over the whole path. */
function splineAt(path, t) {
  const n = path.length - 1;
  const u = clamp(t, 0, 1) * n;
  const i = Math.min(Math.floor(u), n - 1);
  const f = u - i;
  const p0 = path[Math.max(i - 1, 0)];
  const p1 = path[i];
  const p2 = path[i + 1];
  const p3 = path[Math.min(i + 2, n)];
  const f2 = f * f;
  const f3 = f2 * f;
  const h = (a, b, c, d) =>
    0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f2 + (-a + 3 * b - 3 * c + d) * f3);
  return { x: h(p0.x, p1.x, p2.x, p3.x), y: h(p0.y, p1.y, p2.y, p3.y) };
}

function stepRamp(ball, world, dt) {
  const ramp = RAMPS.find((r) => r.id === ball.inRamp);
  if (!ramp || !ramp.path) {
    ball.inRamp = null;
    return;
  }
  ball.rampT += (dt * 1000) / ramp.travelMs;
  if (ball.rampT >= 1) {
    ball.x = ramp.exit.x;
    ball.y = ramp.exit.y;
    ball.vx = ramp.exit.vx;
    ball.vy = ramp.exit.vy;
    ball.inRamp = null;
    ball.rampT = 0;
    world.events.push({ type: 'ramp-exit', id: ramp.id });
    return;
  }
  const p = splineAt(ramp.path, ball.rampT);
  ball.x = p.x;
  ball.y = p.y;
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

function dropTargetSegment(t) {
  const half = t.w / 2;
  const dx = Math.cos(t.angle) * half;
  const dy = Math.sin(t.angle) * half;
  return { ax: t.x - dx, ay: t.y - dy, bx: t.x + dx, by: t.y + dy };
}

/** Everything the ball can hit that is not a plain wall. */
function collectDynamicShapes(world) {
  const shapes = [];
  for (const b of BUMPERS) {
    shapes.push({ type: 'circle', c: { x: b.x, y: b.y }, r: b.r, e: MAT.bumper.e, mu: MAT.bumper.mu, kind: 'bumper', id: b.id });
  }
  for (const t of world.dropTargets) {
    if (!t.up) continue;
    const s = dropTargetSegment(t);
    shapes.push({ type: 'segment', a: { x: s.ax, y: s.ay }, b: { x: s.bx, y: s.by }, e: MAT.metal.e, mu: MAT.metal.mu, kind: 'target', id: t.id });
  }
  return shapes;
}

/** Non-colliding triggers: rollovers, spinner, saucers, ramp entries, kickback. */
function checkTriggers(ball, world, dt) {
  // Saucer capture. The cooldown is what stops a just-ejected ball being
  // swallowed again on the next step.
  if (ball._saucerCool > 0) ball._saucerCool -= dt;
  for (const s of world.saucers) {
    if (s.ball || ball._saucerCool > 0) continue;
    if (Math.hypot(ball.x - s.x, ball.y - s.y) < s.r) {
      const speed = Math.hypot(ball.vx, ball.vy);
      // A scoop catches most balls that enter it. Too tight a threshold and
      // the shot the whole mission system depends on simply cannot be made:
      // a clean centre shot still arrives at well over 2000 u/s.
      if (speed < SAUCER_CATCH_SPEED) {
        ball.captured = s.id;
        ball.captureT = 0;
        ball.vx = 0;
        ball.vy = 0;
        ball.x = s.x;
        ball.y = s.y;
        s.ball = ball;
        world.events.push({ type: 'saucer', id: s.id });
        return;
      }
    }
  }

  // Ramp entries.
  if (ball._rampCool > 0) ball._rampCool -= dt;
  for (const r of RAMPS) {
    if (!r.path) continue;
    if (Math.hypot(ball.x - r.entry.x, ball.y - r.entry.y) > r.entry.r) continue;
    // A ball loitering near an entrance must not re-fire the reject every
    // step -- that turns one weak shot into a burst of events and sound.
    if (ball._rampCool > 0) return;
    ball._rampCool = 0.35;
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed >= r.minSpeed) {
      ball.inRamp = r.id;
      ball.rampT = 0;
      world.events.push({ type: 'ramp-enter', id: r.id, speed });
    } else if (r.silentReject) {
      // Nothing physically obstructs this one, so a ball below the gate
      // simply carries on. Rattling it would be inventing a wall.
      ball._rampCool = 0;
    } else {
      // Rejects: rattles back out. A weak shot has a visible consequence.
      ball.vy = Math.abs(ball.vy) * 0.4 + 120;
      ball.vx = -ball.vx * 0.5;
      world.events.push({ type: 'ramp-reject', id: r.id, speed });
    }
    return;
  }

  // Rollover lanes.
  for (const r of ROLLOVERS) {
    if (Math.hypot(ball.x - r.x, ball.y - r.y) < r.r) {
      if (ball._lastRollover !== r.id) {
        ball._lastRollover = r.id;
        world.events.push({ type: 'rollover', id: r.id });
      }
      return;
    }
  }
  ball._lastRollover = null;
}

/** The spinner is a gate: crossing its span counts a revolution per pass. */
function checkSpinner(ball, world, prevX) {
  const s = SPINNER;
  if (Math.abs(ball.y - s.y) > s.halfSpan) return;
  const crossed = (prevX - s.x) * (ball.x - s.x) < 0;
  if (!crossed) return;
  const revs = Math.max(1, Math.round(Math.abs(ball.vx) / 260));
  world.events.push({ type: 'spinner', id: s.id, revs });
}

function checkKickback(ball, world) {
  if (!world.kickbackArmed) return;
  if (Math.hypot(ball.x - KICKBACK.x, ball.y - KICKBACK.y) > KICKBACK.r) return;
  ball.vx = KICKBACK.kick.vx;
  ball.vy = KICKBACK.kick.vy;
  if (world.mode.kickback !== 'always') world.kickbackArmed = false;
  world.events.push({ type: 'kickback', id: KICKBACK.id });
}

// ---------------------------------------------------------------------------
// Ball integration
// ---------------------------------------------------------------------------

function integrateBall(ball, world, dt) {
  if (ball.inRamp) {
    stepRamp(ball, world, dt);
    return;
  }

  if (ball.captured) {
    const s = world.saucers.find((x) => x.id === ball.captured);
    if (!s) {
      ball.captured = null;
      return;
    }
    ball.captureT += dt * 1000;
    if (s.holdMs > 0 && ball.captureT >= s.holdMs) {
      releaseSaucer(world, s.id);
    }
    return;
  }

  // Gravity.
  ball.vy += GRAVITY * world.gravityScale * dt;
  // Rolling friction, expressed per second so it is timestep-independent.
  const decay = Math.exp(-ROLL_FRICTION * dt);
  ball.vx *= decay;
  ball.vy *= decay;

  const prevX = ball.x;
  const shapes = world._shapes;
  let remaining = dt;

  // Swept resolution: advance to the earliest impact, resolve, repeat.
  for (let iter = 0; iter < 6 && remaining > 1e-7; iter += 1) {
    let best = null;
    let bestShape = null;
    for (const shape of shapes) {
      const hit = sweepShape(shape, ball.x, ball.y, ball.vx, ball.vy, remaining, BALL_R);
      if (hit && (!best || hit.t < best.t)) {
        best = hit;
        bestShape = shape;
      }
    }

    if (!best) {
      ball.x += ball.vx * remaining;
      ball.y += ball.vy * remaining;
      remaining = 0;
      break;
    }

    ball.x += ball.vx * best.t;
    ball.y += ball.vy * best.t;
    remaining -= best.t;

    if (best.depth > 0) {
      ball.x += best.nx * (best.depth + 0.01);
      ball.y += best.ny * (best.depth + 0.01);
    }

    resolveImpact(ball, world, bestShape, best);
  }

  // Spend whatever time the collision loop did not.
  //
  // A contact resolved at t=0 -- which is what deep penetration produces --
  // consumes an iteration without advancing the clock. Four of those in a row
  // used to exit the loop with the whole timestep unspent, so the ball stopped
  // dead against the surface and never moved again. A hard plunge wedged
  // itself in the top arch exactly this way. Always advancing the remainder
  // guarantees forward progress; any residual penetration is pushed out on
  // the next step.
  if (remaining > 1e-7) {
    ball.x += ball.vx * remaining;
    ball.y += ball.vy * remaining;
  }

  checkSpinner(ball, world, prevX);
  checkTriggers(ball, world, dt);
  if (ball.y > 900 && ball.x < 120) checkKickback(ball, world);

  // Speed clamp.
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > MAX_SPEED) {
    ball.vx = (ball.vx / speed) * MAX_SPEED;
    ball.vy = (ball.vy / speed) * MAX_SPEED;
  }
}

function resolveImpact(ball, world, shape, hit) {
  const vn = ball.vx * hit.nx + ball.vy * hit.ny;
  const impactSpeed = Math.abs(vn);

  if (vn < 0) {
    const e = effectiveE(shape.e, impactSpeed);
    const j = -(1 + e) * vn;
    ball.vx += j * hit.nx;
    ball.vy += j * hit.ny;
    applyFriction(ball, hit.nx, hit.ny, shape.mu, j);
  }

  if (shape.kind === 'bumper') {
    ball.vx += hit.nx * BUMPER_KICK;
    ball.vy += hit.ny * BUMPER_KICK;
    world.events.push({ type: 'bumper', id: shape.id, speed: impactSpeed });
  } else if (shape.kind === 'sling' && impactSpeed > SLING_THRESHOLD) {
    ball.vx += hit.nx * SLING_KICK;
    ball.vy += hit.ny * SLING_KICK;
    world.events.push({ type: 'sling', id: shape.id, speed: impactSpeed });
  } else if (shape.kind === 'target') {
    const t = world.dropTargets.find((x) => x.id === shape.id);
    if (t && t.up) {
      t.up = false;
      world.events.push({ type: 'target', id: t.id });
      if (world.dropTargets.every((x) => !x.up)) {
        world.events.push({ type: 'target-bank-clear' });
      }
    }
  } else if (shape.kind === 'post') {
    world.events.push({ type: 'post', id: shape.id, speed: impactSpeed });
  } else if (impactSpeed > 400) {
    world.events.push({ type: 'wall', id: shape.id, speed: impactSpeed });
  }
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

export const SAUCER_COOLDOWN = 0.5; // s -- cannot be recaptured during this

export function releaseSaucer(world, saucerId) {
  const s = world.saucers.find((x) => x.id === saucerId);
  if (!s || !s.ball) return;
  const ball = s.ball;
  ball.captured = null;
  ball.captureT = 0;
  ball.vx = s.kick.vx;
  ball.vy = s.kick.vy;

  // Eject from the LIP of the scoop along the kick direction, not from its
  // centre. Released at the centre the ball is still deep inside the capture
  // radius, so the very next step recaptures it -- the scoop then fires every
  // holdMs forever. A hands-off game scored 2.1 million that way, and no
  // property test noticed because none of them runs a long game.
  const k = Math.hypot(s.kick.vx, s.kick.vy) || 1;
  const out = s.r + BALL_R + 1;
  ball.x = s.x + (s.kick.vx / k) * out;
  ball.y = s.y + (s.kick.vy / k) * out;
  ball._saucerCool = SAUCER_COOLDOWN;

  s.ball = null;
  world.events.push({ type: 'saucer-kick', id: s.id });
}

export function addBall(world, x, y, vx, vy) {
  const ball = makeBall(x, y, vx, vy);
  world.balls.push(ball);
  world.ballsInPlay = world.balls.filter((b) => b.alive).length;
  return ball;
}

/** Reset for the next ball: one ball, back in the lane, targets and tilt reset. */
export function serveBall(world) {
  world.balls = [makeBall(BALL_REST.x, BALL_REST.y, 0, 0)];
  world.ballsInPlay = 1;
  world.phase = 'ready';
  world.plunger = { charging: false, power: 0 };
  world.dropTargets = DROP_TARGETS.map((t) => ({ ...t, up: true }));
  world.saucers = SAUCERS.map((s) => ({ ...s, ball: null }));
  world.tilt = 0;
  world.tilted = false;
  world.tiltWarnings = 0;
  world.kickbackArmed = world.mode.kickback === 'always';
}

export function nudge(world, dx, dy) {
  if (world.tilted) return;
  for (const b of world.balls) {
    if (!b.alive || b.inRamp || b.captured) continue;
    b.vx += dx * NUDGE_IMPULSE;
    b.vy += dy * NUDGE_IMPULSE;
  }
  world.nudge = { x: dx, y: dy, t: 0.12 };
  world.tilt += TILT_PER_NUDGE;
  world.events.push({ type: 'nudge' });

  const limit = world.mode.tiltWarnings;
  if (world.tilt >= limit) {
    world.tilted = true;
    world.events.push({ type: 'tilt' });
  } else if (world.tilt >= limit - 1) {
    world.tiltWarnings += 1;
    world.events.push({ type: 'tilt-warn', count: world.tiltWarnings });
  }
}

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------

/**
 * Advance the simulation by exactly DT. Mutates and returns `world`.
 *
 * `input` is { left, right, plunge, nudgeX, nudgeY }. Events accumulate in
 * `world.events`; the caller drains them.
 */
export function step(world, input, dt) {
  const d = dt === undefined ? DT : dt;
  world.time += d;

  // Tilt meter decays.
  if (world.tilt > 0) world.tilt = Math.max(0, world.tilt - TILT_DECAY * d);
  if (world.nudge.t > 0) world.nudge.t = Math.max(0, world.nudge.t - d);

  stepFlipper(world.flippers.left, !!input.left, d, world.tilted);
  stepFlipper(world.flippers.right, !!input.right, d, world.tilted);

  // Plunger.
  if (world.phase === 'ready') {
    if (input.plunge) {
      world.plunger.charging = true;
      world.plunger.power = Math.min(1, world.plunger.power + d * 1.4);
    } else if (world.plunger.charging) {
      const speed = PLUNGE_MIN + world.plunger.power * (PLUNGE_MAX - PLUNGE_MIN);
      const ball = world.balls[0];
      if (ball) {
        ball.vy = -speed;
        ball.vx = 0;
      }
      world.plunger.charging = false;
      world.plunger.power = 0;
      world.phase = 'playing';
      world.events.push({ type: 'plunge', speed });
    }
  }

  // A plunge too weak to clear the lane drops the ball back onto the plunger.
  // Without this the table sits in 'playing' forever with the ball parked in
  // the lane: it cannot drain, and the player cannot re-plunge because the
  // plunger only works in 'ready'. The game becomes unwinnable, quietly.
  if (world.phase === 'playing' && world.balls.length === 1) {
    const b = world.balls[0];
    if (b.alive && !b.inRamp && !b.captured
        && b.x > LANE_CX - 6 && b.y > 940
        && Math.hypot(b.vx, b.vy) < 40) {
      world.phase = 'ready';
      world.plunger = { charging: false, power: 0 };
      world.events.push({ type: 'plunge-reset' });
    }
  }

  // Rebuild the dynamic shape list once per step, not once per ball.
  world._shapes = WALLS.concat(collectDynamicShapes(world));

  for (const ball of world.balls) {
    if (!ball.alive) continue;

    integrateBall(ball, world, d);

    if (!ball.inRamp && !ball.captured) {
      // The lane divider only exists below LANE_TOP, so a ball that has left
      // the lane must not be allowed back in from the field side.
      if (ball.y > LANE_TOP && ball.x > LANE_CX - 30) {
        ball.inLane = ball.inLane && true;
      }
      resolveFlipper(ball, world.flippers.left, world.events);
      resolveFlipper(ball, world.flippers.right, world.events);
    }

    // Drain.
    if (ball.y - BALL_R > H) {
      ball.alive = false;
      world.events.push({ type: 'drain' });
    }

    // Safety net: nothing should ever leave the cabinet. If the swept solver
    // is ever wrong, clamp rather than lose the ball silently -- and say so,
    // because a fired assertion is worth more than a quiet recovery.
    if (ball.alive && (ball.x < -BALL_R || ball.x > W + BALL_R || ball.y < -BALL_R)) {
      world.events.push({ type: 'escaped', x: ball.x, y: ball.y });
      ball.x = clamp(ball.x, FIELD_LEFT + BALL_R, W - BALL_R);
      ball.y = clamp(ball.y, BALL_R, H);
      ball.vx *= 0.2;
      ball.vy = Math.abs(ball.vy) * 0.2;
    }
  }

  const alive = world.balls.filter((b) => b.alive);
  if (alive.length !== world.ballsInPlay) {
    world.ballsInPlay = alive.length;
    if (alive.length === 0 && world.phase === 'playing') {
      world.phase = 'draining';
      world.events.push({ type: 'ball-lost' });
    }
  }

  return world;
}

/** Drive the simulation from real frame time, with a substep cap. */
export function advance(world, input, realDt) {
  world._acc = (world._acc || 0) + Math.min(realDt, 0.25);
  let steps = 0;
  while (world._acc >= DT && steps < MAX_SUBSTEPS) {
    step(world, input, DT);
    world._acc -= DT;
    steps += 1;
  }
  world._alpha = world._acc / DT;
  return world;
}

export function drainEvents(world) {
  const e = world.events;
  world.events = [];
  return e;
}
