/**
 * table.js -- frozen playfield geometry.
 *
 * Pure data. No DOM, no imports. Shared verbatim by the web renderer, the
 * headless harness and (at P8) the app's Skia renderer.
 *
 * Coordinate system: origin top-left, +Y DOWNWARD, matching every other engine
 * in this repo. Angles are measured from +X increasing toward +Y, i.e.
 * clockwise on screen: 0 = right, 90 = down, 180 = left, 270 = up.
 *
 * Units: 1000 logical units = 1 metre. Every constant in engine.js derives
 * from that, so the numbers are checkable against a real machine rather than
 * guessed. See docs/pinball/02-physics.md.
 *
 * ONE DEVIATION FROM 01-design.md, found while laying the geometry out:
 * a real cabinet's 20.25" width INCLUDES the shooter lane, so carving a
 * 32-unit plunger lane out of the 500-unit cabinet leaves the main playfield
 * 450 wide, centred on x=243 rather than x=250. Every lower-playfield feature
 * therefore sits 7 units left of the value published in the design doc. The
 * arch is centred on x=259 because it spans the full cabinet including the
 * lane -- which is exactly how a real table looks, and is what lets the
 * plunged ball ride the outer wall around the top instead of needing a
 * separate exit fudge. Docs 01 and 05 carry these corrected numbers.
 */

export const W = 500;
export const H = 1040;
export const BALL_R = 13;

/** Main playfield, below the arch. The plunger lane is outside this. */
export const FIELD_LEFT = 18;
export const FIELD_RIGHT = 468;
export const FIELD_CX = (FIELD_LEFT + FIELD_RIGHT) / 2; // 243

/** The arch spans the whole cabinet, lane included. */
export const ARCH_C = { x: 259, y: 260 };
export const ARCH_R = 241; // 259-241=18 (left wall), 259+241=500 (outer wall)

/** Plunger lane: between the divider and the outer cabinet wall. */
export const LANE_LEFT = FIELD_RIGHT; // 468
export const LANE_RIGHT = W; // 500
export const LANE_CX = (LANE_LEFT + LANE_RIGHT) / 2; // 484
export const LANE_TOP = ARCH_C.y; // divider ends here; ball rides the arch out
export const BALL_REST = { x: LANE_CX, y: 1030 - BALL_R };

const deg = (d) => (d * Math.PI) / 180;

/** Surface materials. Restitution and friction, per 02-physics.md. */
export const MAT = {
  wood: { e: 0.35, mu: 0.12 },
  metal: { e: 0.5, mu: 0.06 },
  rubber: { e: 0.85, mu: 0.25 },
  sling: { e: 0.9, mu: 0.25 },
  bumper: { e: 0.55, mu: 0.15 },
  flipper: { e: 0.55, mu: 0.35 },
};

const seg = (x0, y0, x1, y1, mat, kind, id) => ({
  type: 'segment',
  a: { x: x0, y: y0 },
  b: { x: x1, y: y1 },
  e: MAT[mat].e,
  mu: MAT[mat].mu,
  kind: kind || 'wall',
  id: id || null,
});

const arc = (cx, cy, r, a0, a1, inside, mat, kind, id) => ({
  type: 'arc',
  c: { x: cx, y: cy },
  r,
  a0: deg(a0),
  a1: deg(a1),
  inside: inside !== false,
  e: MAT[mat].e,
  mu: MAT[mat].mu,
  kind: kind || 'wall',
  id: id || null,
});

const circ = (cx, cy, r, mat, kind, id) => ({
  type: 'circle',
  c: { x: cx, y: cy },
  r,
  e: MAT[mat].e,
  mu: MAT[mat].mu,
  kind: kind || 'post',
  id: id || null,
});

/**
 * Static collision geometry.
 *
 * `kind` carries the gameplay identity so rules.js can react to a hit without
 * the physics knowing anything about scoring, and vice versa.
 */
export const WALLS = [
  // -- Outer boundary -------------------------------------------------------
  // Left cabinet wall, from the drain up to where the arch takes over.
  seg(FIELD_LEFT, H, FIELD_LEFT, ARCH_C.y, 'wood'),
  // The arch: one sweep from the left wall, over the top, down to the outer
  // right wall. Collided from the inside. This is also what curls a plunged
  // ball leftward out of the shooter lane -- no special case needed.
  arc(ARCH_C.x, ARCH_C.y, ARCH_R, 180, 360, true, 'wood'),
  // Outer right cabinet wall: the far side of the plunger lane.
  seg(W, ARCH_C.y, W, H, 'wood'),

  // -- Plunger lane floor ---------------------------------------------------
  // The plunger tip itself. Without it the ball simply falls out of the
  // bottom of the shooter lane while the table sits in 'ready' -- which it
  // did, and which made the soft-plunge test pass for entirely the wrong
  // reason: the ball was already gone before the plunger ever fired.
  seg(LANE_LEFT, 1030, W, 1030, 'wood', 'wall', 'plunger-face'),

  // -- Plunger lane divider -------------------------------------------------
  // Ends at LANE_TOP; above that the ball is in the arch. The one-way gate
  // that stops it coming back down is a device, not a wall.
  seg(LANE_LEFT, H, LANE_LEFT, LANE_TOP, 'wood', 'wall', 'lane-divider'),

  // -- Lower-right field wall ----------------------------------------------
  // Below the lane divider the main field's right edge is the same line, so
  // no extra wall is needed here.

  // -- Slingshots -----------------------------------------------------------
  // The active face is close to vertical and faces INWARD, so a ball coming up
  // the side is flung across the table -- which is what a real slingshot does.
  // An angled face that the ball meets from below can only push it downward,
  // i.e. straight at the drain.
  //
  // The bottom of each sling sits at y=830, which leaves 35 units of clearance
  // above the inlane rail beneath it. That clearance is load-bearing: at 26
  // units of ball diameter, an earlier layout left 3.6 units here and silently
  // walled the inlane off from the flipper entirely.
  seg(98, 770, 118, 830, 'sling', 'sling', 'sling-left'),
  seg(388, 770, 368, 830, 'sling', 'sling', 'sling-right'),
  // Slingshot backs, so a ball cannot get behind them.
  seg(98, 770, 98, 830, 'wood'),
  seg(98, 830, 118, 830, 'wood'),
  seg(388, 770, 388, 830, 'wood'),
  seg(388, 830, 368, 830, 'wood'),

  // -- Outlane dividers -----------------------------------------------------
  // Left of this line is the outlane, which drains. Right of it is the inlane.
  seg(52, 760, 78, 990, 'wood', 'wall', 'guide-outlane-left'),
  seg(434, 760, 408, 990, 'wood', 'wall', 'guide-outlane-right'),

  // -- Inlane rails ---------------------------------------------------------
  // The ball rides the TOP of these. They slope down toward the flipper base,
  // so a returning ball rolls onto the flipper instead of past it. Getting
  // this wrong is why an inlane silently becomes a second drain.
  seg(66, 845, 152, 900, 'wood', 'wall', 'rail-inlane-left'),
  seg(420, 845, 334, 900, 'wood', 'wall', 'rail-inlane-right'),

  // -- Pop bumper cluster guides -------------------------------------------
  seg(120, 250, 100, 380, 'wood'),
  seg(366, 250, 386, 380, 'wood'),

  // -- Rubber posts ---------------------------------------------------------
  circ(150, 430, 11, 'rubber', 'post', 'post-left'),
  circ(336, 430, 11, 'rubber', 'post', 'post-right'),
  circ(243, 700, 11, 'rubber', 'post', 'post-centre'),
  circ(172, 800, 11, 'rubber', 'post', 'post-lower-left'),
  circ(314, 800, 11, 'rubber', 'post', 'post-lower-right'),
];

/** Pop bumpers -- circles that apply a fixed impulse on top of the bounce. */
export const BUMPERS = [
  { id: 'bumper-left', x: 178, y: 300, r: 26 },
  { id: 'bumper-right', x: 308, y: 300, r: 26 },
  { id: 'bumper-top', x: 243, y: 212, r: 26 },
];
export const BUMPER_KICK = 1350; // u/s added along the contact normal

/** Slingshot kick: applied when impact speed exceeds the threshold. */
export const SLING_KICK = 1600;
export const SLING_THRESHOLD = 220;

/** Drop target bank. Angled 15 degrees; clearing all three lights a lock. */
export const DROP_TARGETS = [
  { id: 'drop-1', x: 86, y: 604, w: 26, h: 8, angle: deg(15) },
  { id: 'drop-2', x: 111, y: 597, w: 26, h: 8, angle: deg(15) },
  { id: 'drop-3', x: 136, y: 590, w: 26, h: 8, angle: deg(15) },
];

/** Spinner: a gate the ball passes through, counting revolutions. */
export const SPINNER = { id: 'spinner', x: 94, y: 545, halfSpan: 23 };

/** Saucers and holes -- capture the ball, hold it, then kick it out. */
export const SAUCERS = [
  {
    id: 'saucer',
    x: 105,
    y: 452,
    r: 18,
    holdMs: 900,
    kick: { vx: 1500, vy: 250 },
  },
  {
    id: 'lock',
    x: 408,
    y: 330,
    r: 18,
    holdMs: 0, // holds indefinitely until multiball releases it
    kick: { vx: -300, vy: 900 },
  },
];

/** Rollover lanes across the arch. Build the bonus multiplier; host the skill shot. */
/**
 * Top rollover lanes. Positioned ON the arc an orbiting ball actually rides
 * (radius ~226 about ARCH_C, at 300/270/240 degrees), measured from real
 * traced plunges -- not guessed from the design sketch, which had them at
 * y=120 where no ball ever goes.
 */
export const ROLLOVERS = [
  { id: 'rollover-right', x: 372, y: 64, r: 18 },
  { id: 'rollover-centre', x: 259, y: 34, r: 18 },
  { id: 'rollover-left', x: 146, y: 64, r: 18 },
];

/**
 * Scripted paths (decision D9). A ball entering above `minSpeed` is captured
 * onto the spline and delivered to the exit; below it, it rejects back out.
 * Free-body physics on a ramp produces unpredictable exits and stuck balls.
 */
export const RAMPS = [
  {
    id: 'orbit-left',
    entry: { x: 48, y: 620, r: 20 },
    minSpeed: 1150,
    // Up the left rail, over the arch, down to the right inlane.
    path: [
      { x: 48, y: 620 },
      { x: 38, y: 500 },
      { x: 36, y: 400 },
      { x: 80, y: 180 },
      { x: 243, y: 60 },
      { x: 420, y: 150 },
      { x: 452, y: 330 },
      { x: 430, y: 600 },
      { x: 412, y: 782 },
    ],
    exit: { x: 412, y: 782, vx: 0, vy: 300 },
    travelMs: 1500,
  },
  {
    id: 'ramp-right',
    entry: { x: 400, y: 640, r: 20 },
    minSpeed: 1250,
    // Up and over, returning to the left inlane.
    path: [
      { x: 400, y: 640 },
      { x: 406, y: 520 },
      { x: 380, y: 360 },
      { x: 300, y: 250 },
      { x: 180, y: 300 },
      { x: 120, y: 520 },
      { x: 92, y: 700 },
      { x: 74, y: 782 },
    ],
    exit: { x: 74, y: 782, vx: 0, vy: 300 },
    travelMs: 1300,
  },
  {
    id: 'lane-feed',
    // The plunger lane one-way gate. Physically a kicker, not a shot.
    entry: { x: LANE_CX, y: LANE_TOP, r: 18 },
    minSpeed: 0,
    path: null,
    exit: null,
    travelMs: 0,
    oneWay: true,
  },
];

/** Kickback: saves a ball in the left outlane. */
export const KICKBACK = { id: 'kickback', x: 46, y: 960, r: 22, kick: { vx: 40, vy: -1900 } };

/** Flippers. Angles per the header's convention; sweep is 48 degrees. */
export const FLIPPERS = {
  left: {
    id: 'flipper-left',
    pivot: { x: 153, y: 905 },
    length: 85,
    baseR: 13,
    tipR: 8,
    restAngle: deg(30),
    endAngle: deg(-18),
    dir: -1, // pressing moves the angle negative
  },
  right: {
    id: 'flipper-right',
    pivot: { x: 333, y: 905 },
    length: 85,
    baseR: 13,
    tipR: 8,
    restAngle: deg(150),
    endAngle: deg(198),
    dir: 1,
  },
};

/** Solenoid up, spring down. The asymmetry is real and it is felt. */
export const FLIPPER_MOTOR = {
  upMaxVel: 28, // rad/s
  upAccel: 900, // rad/s^2
  downMaxVel: 12,
  downAccel: 260,
};

/** Drain: anything past this y with no ball left is lost. */
export const DRAIN_Y = H;

/** Mode tuning. Shape matches the app's existing MODE_CONFIG. */
export const MODES = {
  relaxed: { label: 'Relaxed', balls: 5, gravityScale: 0.85, kickback: 'always', tiltWarnings: 4, endless: false },
  classic: { label: 'Classic', balls: 3, gravityScale: 1.0, kickback: 'earned', tiltWarnings: 3, endless: false },
  expert: { label: 'Expert', balls: 3, gravityScale: 1.15, kickback: 'off', tiltWarnings: 2, endless: false },
  endless: { label: 'Endless', balls: Infinity, gravityScale: 1.0, kickback: 'earned', tiltWarnings: 3, endless: true },
};
