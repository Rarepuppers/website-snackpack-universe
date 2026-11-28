/* Snack Drop rules and physics. No DOM and no storage, so dev/sim.js can play
 * real games in Node and the file can move to the Android app as it is.
 * Physics: Planck.js (Box2D), vendored in vendor/. Units are metres and seconds.
 * The game plays on a 2D front-on plane; render3d.js draws that plane in 3D.
 * Deterministic: the same seed and the same drops always give the same game,
 * which is what makes the bots and the Daily Drop possible. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./vendor/planck-1.5.1.min.js"));
  else root.SnackDrop = factory(root.planck);
})(typeof self !== "undefined" ? self : this, function (planck) {
  "use strict";

  var STEP = 1 / 60;
  // Bump whenever a change alters how a game plays out (physics, rules, scoring).
  // Saves, bests and share cards carry it, so old results are never mixed with new ones.
  var RULES_VERSION = 2;  // 2: Fever and the x4 cap on multipliers (28 Nov 2026)
  var RUSH_VERSION = 1;
  var RUSH = { stock: 2, earnEvery: 8, interval: 12, maxBlocked: 15,
    maxBodies: 40, lanes: [-2.3, -1.15, 0, 1.15, 2.3] };

  // The crate. x = 0 is the middle, y = 0 is the floor.
  var CRATE = { half: 3.3, wall: 0.3, height: 10.4, line: 8.2, dropY: 9.35 };

  var BALANCE = {
    gravity: 15,
    dropGap: 0.5,       // seconds between drops
    overLimit: 2.0,     // seconds a snack may sit above the line before the game ends
    landGrace: 1.2,     // a falling snack doesn't count against the line until it lands or this passes
    chainWindow: 1.1,   // merges closer together than this build a chain
    friction: 0.45,
    restitution: 0.08
  };

  // Containers (PLAN section 4a). Each changes only a few numbers from the
  // Pantry Box, which is the prototype's crate exactly. Collision walls follow
  // the Codex brief's section 4.2, so authored models line up with them.
  //   floor, wall: friction of the floor and the side walls
  //   grip: snack friction in this container (default BALANCE.friction; boxes 0.1 less)
  //   lightBounce: restitution for Crumb, Cracker and Cookie (others keep BALANCE.restitution)
  // Wall friction alone barely shows, because most snacks rest on other snacks,
  // so the Ice Cooler and Market Crate change the snacks' grip too.
  //   fillet: radius of rounded inside bottom corners
  var CONTAINERS = {
    pantry:    { id: "pantry",    name: "Pantry Box",   free: true,  line: 8.2, floor: 0.6,  wall: 0.3,  blurb: "Balanced and forgiving" },
    toybox:    { id: "toybox",    name: "Toy Box",      free: true,  line: 8.2, floor: 0.6,  wall: 0.3,  lightBounce: 0.3, fillet: 0.6, blurb: "Rounded corners, bouncy little snacks" },
    icecooler: { id: "icecooler", name: "Ice Cooler",   free: false, line: 8.2, floor: 0.03, wall: 0.03, grip: 0.08, blurb: "Snacks slide into tight gaps" },
    market:    { id: "market",    name: "Market Crate", free: false, line: 8.2, floor: 0.8,  wall: 0.95, grip: 1.0,  blurb: "Rough slats: snacks stay where they land" }
  };
  var CONTAINER_ORDER = ["pantry", "toybox", "icecooler", "market"];

  // Modes (PLAN 4, 4b). Classic is pure; Arcade adds the tools, specials and
  // helper cameos as they are built; Pro is Classic with less room, less time
  // and no preview of the next snack. The Daily Drop plays Arcade rules.
  var MODES = {
    classic: { id: "classic", name: "Classic" },
    arcade:  { id: "arcade",  name: "Arcade", tools: true, specials: true, helpers: true },
    pro:     { id: "pro",     name: "Pro", lineDrop: 0.7, overLimit: 1.0, hideNext: true },
    daily:   { id: "daily",   name: "Daily Drop", tools: true, specials: true, helpers: true },
    rush:    { id: "rush",    name: "Rush" }
  };
  // Fever (PLAN 5): one drop that sets off 3 or more merges.
  var FEVER = { merges: 3, time: 8, extend: 3, max: 15, mult: 1.5 };
  var MAX_MULT = 4;  // Chain x Fever never goes over this

  // Tools (PLAN 9), Arcade and Daily Drop only. Each is an input to step(),
  // so a game with tools still replays exactly. maxTier: Pie (6) or smaller.
  var TOOLS = {
    swap:    { id: "swap",    name: "Swap",     target: false },
    spatula: { id: "spatula", name: "Spatula",  target: true, maxTier: 6 },
    levelup: { id: "levelup", name: "Level Up", target: true, maxTier: 6 },
    // The shakes (PLAN 9a) move the crate itself; the snacks react to its walls.
    rumble:  { id: "rumble",  name: "Rumble",   shake: true },
    bump:    { id: "bump",    name: "Bump",     shake: true, side: true },
    quake:   { id: "quake",   name: "Earthquake", shake: true, rare: true }
  };
  // Tools that can be earned at random or picked to start with. Earthquake is
  // only ever earned (Chain x6 or 4,000 points, once a game).
  var TOOL_ORDER = ["swap", "spatula", "levelup", "rumble", "bump"];
  // Shake shapes: how long the crate moves, and the guard after it during
  // which the line timer stays stopped and a lid keeps snacks in.
  var SHAKE = { rumble: { time: 0.5, amp: 0.04, hz: 14 }, bump: { lead: 0.35, push: 0.12, back: 0.3, amp: 0.25 },
    quake: { time: 1.2, amp: 0.14 }, guard: 1.5, quakeChain: 6, quakeScore: 4000, gap: 0.3 };
  // A tool at 1,000 points and every 1,500 after, and one for each Chain x5.
  var TOOL_EARN = { first: 1000, every: 1500, chain: 5, slots: 3 };

  // The snack ladder. Two of the same merge into the next one. Shapes matter:
  // round snacks roll into gaps, square ones stack, the wedge tips over.
  var TIERS = [
    { id: "crumb", name: "Crumb", shape: "circle", r: 0.3 },
    { id: "cracker", name: "Cracker", shape: "box", w: 0.7, h: 0.7 },
    { id: "cookie", name: "Cookie", shape: "circle", r: 0.52 },
    { id: "cheese", name: "Cheese Wedge", shape: "wedge", w: 1.35, h: 1.1 },
    { id: "donut", name: "Donut", shape: "circle", r: 0.74 },
    { id: "sandwich", name: "Sandwich", shape: "box", w: 1.6, h: 1.25 },
    { id: "pie", name: "Pie", shape: "circle", r: 1.0 },
    { id: "pizza", name: "Pizza", shape: "circle", r: 1.2 },
    { id: "cake", name: "Layer Cake", shape: "box", w: 2.2, h: 1.75 },
    { id: "burger", name: "Big Burger", shape: "circle", r: 1.5 },
    { id: "hamper", name: "Golden Hamper", shape: "box", w: 2.85, h: 2.25 }
  ];
  var TOP = TIERS.length - 1;
  var SCORE = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
  var HAMPER_BONUS = 150;    // two hampers meet and are packed off together
  var DROP_TIERS = [0, 1, 2, 3, 4];
  var DROP_WEIGHTS = [30, 25, 20, 15, 10];

  TIERS.forEach(function (t, i) {
    t.tier = i;
    if (t.shape === "circle") { t.halfW = t.r; t.halfH = t.r; }
    else if (t.shape === "box") { t.halfW = t.w / 2; t.halfH = t.h / 2; }
    else {
      // Right-angled wedge, centroid at the origin, right angle bottom left.
      t.points = [{ x: -t.w / 3, y: -t.h / 3 }, { x: 2 * t.w / 3, y: -t.h / 3 }, { x: -t.w / 3, y: 2 * t.h / 3 }];
      t.halfW = 2 * t.w / 3; t.halfH = 2 * t.h / 3;
    }
  });

  // ════ Random ══════════════════════════════════════════════════════
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // The state, so a saved game can carry on with the same snack queue.
    next.get = function () { return a; };
    next.set = function (v) { a = v | 0; };
    return next;
  }
  function pick(rand) {
    var total = 0, i;
    for (i = 0; i < DROP_WEIGHTS.length; i++) total += DROP_WEIGHTS[i];
    var roll = rand() * total;
    for (i = 0; i < DROP_WEIGHTS.length; i++) { roll -= DROP_WEIGHTS[i]; if (roll < 0) return DROP_TIERS[i]; }
    return DROP_TIERS[0];
  }

  // ════ Game ════════════════════════════════════════════════════════
  // opts = { seed: number, mode: "classic" | "daily", container: id, restore: snapshot }
  function createGame(opts) {
    opts = opts || {};
    var rules = MODES[opts.mode] || MODES.classic;
    var isRush = rules.id === "rush", restore = opts.restore;
    if (restore && isRush !== (restore.mode === "rush")) restore = null;
    if (restore && isRush && (restore.rules !== RUSH_VERSION || !restore.rush)) restore = null;
    var box = isRush ? CONTAINERS.pantry : CONTAINERS[opts.container] || CONTAINERS.pantry;
    var rand = rng(opts.seed == null ? 1 : opts.seed);
    var world = new planck.World({ gravity: { x: 0, y: -BALANCE.gravity }, allowSleep: true });
    var crate = world.createBody();
    var H = CRATE.half, Wl = CRATE.wall;
    crate.createFixture({ shape: new planck.Box(H + Wl, Wl, { x: 0, y: -Wl }, 0), friction: box.floor });
    crate.createFixture({ shape: new planck.Box(Wl, CRATE.height / 2 + Wl, { x: -H - Wl, y: CRATE.height / 2 }, 0), friction: box.wall });
    crate.createFixture({ shape: new planck.Box(Wl, CRATE.height / 2 + Wl, { x: H + Wl, y: CRATE.height / 2 }, 0), friction: box.wall });
    if (box.fillet) {
      // Quarter-round fillets in the bottom corners, as short straight edges.
      var R = box.fillet;
      [-1, 1].forEach(function (side) {
        var pts = [];
        for (var i = 0; i <= 8; i++) {
          var a = (i / 8) * Math.PI / 2;
          pts.push({ x: side * (H - R + R * Math.sin(a)), y: R - R * Math.cos(a) });
        }
        if (side < 0) pts.reverse();
        crate.createFixture({ shape: new planck.Chain(pts, false), friction: box.wall });
      });
    }
    crate.setUserData({ crate: true });

    var g = {
      mode: rules.id, rules: rules, seed: opts.seed, world: world, container: box.id,
      line: box.line - (rules.lineDrop || 0), overLimit: rules.overLimit || BALANCE.overLimit,
      fever: 0, fevers: 0, dropMerges: 0, maxChain: 0,
      tray: [], toolsUsed: 0, nextToolAt: TOOL_EARN.first, quakeGiven: false,
      shake: null, guard: 0, crateOffset: { x: 0, y: 0 }, lastDrop: -99,
      snacks: [], nextId: 1, time: 0, status: "playing",
      score: 0, drops: 0, merges: 0, best: 0, made: TIERS.map(function () { return 0; }),
      current: pick(rand), next: pick(rand), aim: 0, wait: 0,
      chain: 0, lastMerge: -99, danger: 0, events: []
    };
    var pairs = [];
    // Tools draw from their own random stream, so the snack queue is the same
    // with or without them, and every Daily Drop player gets the same tools.
    var toolRand = rng(hash("tools-" + (opts.seed == null ? 1 : opts.seed)));
    var rushRand = isRush ? rng(hash("rush-" + (opts.seed == null ? 1 : opts.seed))) : null;
    if (rushRand) g.rush = { tick: 0, charges: 1, drops: 0, active: null, queued: null };
    function giveQuake() {
      if (!rules.tools || g.quakeGiven || g.tray.length >= TOOL_EARN.slots) return;
      g.quakeGiven = true; g.tray.push("quake");
      g.events.push({ type: "tool", id: "quake", why: "rare" });
    }
    function giveTool(id, why) {
      if (!rules.tools || g.tray.length >= TOOL_EARN.slots) return;
      id = id || TOOL_ORDER[Math.floor(toolRand() * TOOL_ORDER.length)];
      g.tray.push(id);
      g.events.push({ type: "tool", id: id, why: why });
    }
    function canUse(id, target) {
      var tool = TOOLS[id];
      if (!tool || g.status !== "playing" || g.tray.indexOf(id) < 0) return null;
      // One shake at a time, and not while the last drop is still falling.
      if (tool.shake) return !g.shake && g.time - g.lastDrop >= SHAKE.gap && (!tool.side || target === "l" || target === "r") ? true : null;
      if (!tool.target) return true;
      for (var i = 0; i < g.snacks.length; i++) if (g.snacks[i].id === target) return g.snacks[i].tier <= tool.maxTier ? g.snacks[i] : null;
      return null;
    }
    // ── Shakes ──
    // For a shake the crate becomes kinematic and follows an offset curve; the
    // snacks only feel its walls and floor. Every number comes from the seed
    // (the Earthquake's phases) or is fixed, so a replay shakes the same.
    var lid = null;
    function startShake(kind, side) {
      var sh = { kind: kind, side: side, t: 0, ph1: 0, ph2: 0 };
      if (kind === "rumble") sh.end = SHAKE.rumble.time;
      else if (kind === "bump") sh.end = SHAKE.bump.lead + SHAKE.bump.push + SHAKE.bump.back;
      else { sh.end = SHAKE.quake.time; sh.ph1 = toolRand() * Math.PI * 2; sh.ph2 = toolRand() * Math.PI * 2; }
      g.shake = sh;
      g.guard = sh.end + SHAKE.guard;
      crate.setKinematic();
      for (var i = 0; i < g.snacks.length; i++) g.snacks[i].body.setAwake(true);
      if (!lid) lid = crate.createFixture({ shape: new planck.Box(CRATE.half + CRATE.wall, 0.15, { x: 0, y: CRATE.height + 0.15 }, 0), friction: 0.2 });
      g.events.push({ type: "shake", kind: kind, side: side, time: sh.end, lead: kind === "bump" ? SHAKE.bump.lead : 0 });
    }
    function ease(u) { return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u); }
    function shakeOffset(sh, t) {
      if (sh.kind === "rumble") {
        var R = SHAKE.rumble, env = Math.sin(Math.PI * Math.min(1, t / R.time));
        return { x: R.amp * env * Math.sin(2 * Math.PI * R.hz * t), y: 0 };
      }
      if (sh.kind === "bump") {
        // Hit from the left pushes the crate right, so the snacks slide left.
        var B = SHAKE.bump, dir = sh.side === "l" ? 1 : -1, u = t - B.lead;
        if (u <= 0) return { x: 0, y: 0 };
        var k = u < B.push ? ease(u / B.push) : 1 - ease((u - B.push) / B.back);
        return { x: dir * B.amp * k, y: 0 };
      }
      var Q = SHAKE.quake, e = Math.sin(Math.PI * Math.min(1, t / Q.time));
      return { x: Q.amp * e * Math.sin(2 * Math.PI * 5 * t + sh.ph1), y: Q.amp * 0.8 * e * Math.sin(2 * Math.PI * 7 * t + sh.ph2) };
    }
    function stepShake() {
      if (g.guard > 0) { g.guard -= STEP; if (g.guard <= 0) { g.guard = 0; if (lid && !g.shake) { crate.destroyFixture(lid); lid = null; } } }
      var sh = g.shake;
      if (!sh) return;
      sh.t += STEP;
      if (sh.t >= sh.end) {
        // Back exactly where it started, and still again.
        crate.setLinearVelocity({ x: 0, y: 0 });
        crate.setPosition({ x: 0, y: 0 });
        crate.setStatic();
        g.crateOffset = { x: 0, y: 0 };
        g.shake = null;
        g.events.push({ type: "shakeEnd", kind: sh.kind });
        return;
      }
      var next = shakeOffset(sh, sh.t + STEP), now = crate.getPosition();
      crate.setLinearVelocity({ x: (next.x - now.x) / STEP, y: (next.y - now.y) / STEP });
      g.crateOffset = { x: now.x, y: now.y };
    }

    function useTool(id, target) {
      var s = canUse(id, target);
      if (!s) return false;
      g.tray.splice(g.tray.indexOf(id), 1);
      g.toolsUsed++;
      if (TOOLS[id].shake) { startShake(id, target); return true; }
      if (id === "swap") {
        var held = g.current; g.current = g.next; g.next = held;
        g.events.push({ type: "swap" });
        return true;
      }
      var p = s.body.getPosition(), a = s.body.getAngle(), v = s.body.getLinearVelocity();
      var ev = { type: id, tier: s.tier, x: p.x, y: p.y, id: s.id };
      remove(s);
      if (id === "levelup") {
        // The next snack up, in the same place; if it now touches its match they merge.
        var nt = TIERS[s.tier + 1], ux = Math.max(-CRATE.half + nt.halfW, Math.min(CRATE.half - nt.halfW, p.x));
        var up = makeBody(s.tier + 1, ux, Math.max(p.y, nt.halfH), a, { x: v.x, y: v.y });
        up.landed = true; ev.newId = up.id; ev.tier = s.tier + 1;
      }
      g.events.push(ev);
      return true;
    }

    function snackShape(tier) {
      var t = TIERS[tier];
      return t.shape === "circle" ? new planck.Circle(t.r)
        : t.shape === "box" ? new planck.Box(t.w / 2, t.h / 2)
        : new planck.Polygon(t.points);
    }

    function makeBody(tier, x, y, angle, vel) {
      var t = TIERS[tier];
      var body = world.createBody({ type: "dynamic", position: { x: x, y: y }, angle: angle || 0, angularDamping: 0.3, linearDamping: 0.05 });
      var fixture = body.createFixture({ shape: snackShape(tier), density: 1, friction: (box.grip != null ? box.grip : BALANCE.friction) - (t.shape === "box" ? Math.min(0.1, (box.grip != null ? box.grip : BALANCE.friction) / 3) : 0), restitution: box.lightBounce != null && tier <= 2 ? box.lightBounce : BALANCE.restitution });
      if (vel) body.setLinearVelocity(vel);
      var s = { id: g.nextId++, tier: tier, body: body, fixture: fixture, born: g.time, landed: false, over: 0, alive: true };
      body.setUserData(s);
      g.snacks.push(s);
      if (tier > g.best) g.best = tier;
      g.made[tier]++;
      return s;
    }

    world.on("begin-contact", function (c) {
      var a = c.getFixtureA().getBody().getUserData(), b = c.getFixtureB().getBody().getUserData();
      if (a && a.tier != null) a.landed = true;
      if (b && b.tier != null) b.landed = true;
      if (a && b && a.tier != null && a.tier === b.tier) pairs.push([a, b]);
    });

    function clampAim(x, tier) {
      var lim = CRATE.half - TIERS[tier].halfW - 0.02;
      return Math.max(-lim, Math.min(lim, x));
    }

    function canDrop() { return g.status === "playing" && g.wait <= 0 && (!g.rush || !g.rush.active); }

    function drop(x) {
      if (!canDrop()) return false;
      var tier = g.current;
      x = clampAim(x, tier);
      makeBody(tier, x, CRATE.dropY, 0, { x: 0, y: -1 });
      g.drops++;
      g.dropMerges = 0; g.lastDrop = g.time;
      g.events.push({ type: "drop", tier: tier, x: x });
      g.current = g.next; g.next = pick(rand); g.wait = BALANCE.dropGap;
      if (g.rush && g.drops % RUSH.earnEvery === 0 && g.rush.charges < RUSH.stock) {
        g.rush.charges++;
        g.events.push({ type: "rush", action: "earned" });
      }
      return true;
    }

    function canRush() {
      return !!(g.rush && g.status === "playing" && !g.rush.queued &&
        g.rush.charges > (g.rush.active && !g.rush.active.spent ? 1 : 0));
    }

    // Preview and confirmation draw the same plan. Only acceptance advances the stream.
    function rushPlan(next) {
      var lanes = RUSH.lanes.map(function (_, i) { return i; });
      for (var i = lanes.length - 1; i > 0; i--) {
        var j = Math.floor(next() * (i + 1)), swap = lanes[i];
        lanes[i] = lanes[j]; lanes[j] = swap;
      }
      return lanes.map(function (lane) { return { lane: lane, tier: 1 + Math.floor(next() * 3) }; });
    }

    function rushLane(slot) {
      if (g.snacks.length >= RUSH.maxBodies) return null;
      var shape = snackShape(slot.tier);
      var bounds = new planck.AABB();
      var lanes = RUSH.lanes.map(function (_, i) { return i; }).sort(function (a, b) {
        return Math.abs(a - slot.lane) - Math.abs(b - slot.lane) || a - b;
      });
      for (var lane of lanes) {
        var x = RUSH.lanes[lane], transform = new planck.Transform({ x: x, y: CRATE.dropY }, 0);
        var blocked = false;
        shape.computeAABB(bounds, transform, 0);
        world.queryAABB(bounds, function (fixture) {
          blocked = planck.testOverlap(shape, 0, fixture.getShape(), 0, transform, fixture.getBody().getTransform());
          return !blocked;
        });
        if (!blocked) return x;
      }
      return null;
    }

    function rushBurst(slots, due) {
      return { slots: slots, index: 0, due: due, blockedAt: null, spent: false };
    }

    function acceptRush() {
      if (!canRush()) return;
      var rush = g.rush, next = rng(rushRand.get()), slots = rushPlan(next);
      if (!rush.active && rushLane(slots[0]) == null) {
        g.events.push({ type: "rush", action: "blocked" });
        return;
      }
      rushRand.set(next.get());
      if (rush.active) rush.queued = slots;
      else rush.active = rushBurst(slots, rush.tick);
      g.events.push({ type: "rush", action: rush.queued ? "queued" : "started" });
    }

    function stepRush() {
      var rush = g.rush, run = rush.active;
      if (!run || rush.tick < run.due) return;
      var slot = run.slots[run.index], x = rushLane(slot);
      if (x == null) {
        if (run.blockedAt == null) run.blockedAt = rush.tick;
        if (rush.tick - run.blockedAt < RUSH.maxBlocked) return;
        run.index = run.spent ? run.index + 1 : run.slots.length;
        g.events.push({ type: "rush", action: run.spent ? "skipped" : "blocked" });
      } else {
        if (!run.spent) {
          run.spent = true; rush.charges--; g.dropMerges = 0;
        }
        makeBody(slot.tier, x, CRATE.dropY, 0, { x: 0, y: -1 });
        rush.drops++; run.index++;
        g.lastDrop = g.time;
        g.events.push({ type: "drop", tier: slot.tier, x: x, rapid: true });
        g.events.push({ type: "rush", action: "drop" });
      }
      run.blockedAt = null;
      run.due = rush.tick + RUSH.interval;
      if (run.index === run.slots.length) {
        rush.active = rush.queued ? rushBurst(rush.queued, run.due) : null;
        rush.queued = null;
        g.events.push({ type: "rush", action: "ended" });
      }
    }

    function remove(s) {
      s.alive = false;
      world.destroyBody(s.body);
      g.snacks.splice(g.snacks.indexOf(s), 1);
    }

    function merges() {
      var list = pairs; pairs = [];
      for (var i = 0; i < list.length; i++) {
        var a = list[i][0], b = list[i][1];
        if (!a.alive || !b.alive) continue;
        var pa = a.body.getPosition(), pb = b.body.getPosition();
        var x = (pa.x + pb.x) / 2, y = (pa.y + pb.y) / 2;
        var va = a.body.getLinearVelocity(), vb = b.body.getLinearVelocity();
        var tier = a.tier;
        g.chain = g.time - g.lastMerge < BALANCE.chainWindow ? g.chain + 1 : 1;
        g.lastMerge = g.time;
        remove(a); remove(b);
        g.merges++;
        if (g.chain > g.maxChain) g.maxChain = g.chain;
        if (g.chain === TOOL_EARN.chain) giveTool(null, "chain");
        if (g.chain === SHAKE.quakeChain) giveQuake();
        // Fever: the third merge from one drop starts it, or adds time to it.
        if (++g.dropMerges === FEVER.merges) {
          var started = g.fever <= 0;
          g.fever = started ? FEVER.time : Math.min(FEVER.max, g.fever + FEVER.extend);
          if (started) g.fevers++;
          g.events.push({ type: "fever", start: started, time: g.fever, x: x, y: y });
        }
        var mult = Math.min(MAX_MULT, (1 + 0.25 * (g.chain - 1)) * (g.fever > 0 ? FEVER.mult : 1));
        if (tier === TOP) {
          var bonus = Math.round(HAMPER_BONUS * mult);
          g.score += bonus;
          g.events.push({ type: "packed", tier: tier, x: x, y: y, points: bonus, chain: g.chain, mult: mult });
          continue;
        }
        var t = TIERS[tier + 1];
        // Keep the new snack inside the crate and off the floor.
        x = Math.max(-CRATE.half + t.halfW, Math.min(CRATE.half - t.halfW, x));
        y = Math.max(t.halfH, y);
        var made = makeBody(tier + 1, x, y, 0, { x: (va.x + vb.x) / 2, y: Math.max(0, (va.y + vb.y) / 2) });
        made.landed = true;
        var points = Math.round(SCORE[tier + 1] * mult);
        g.score += points;
        g.events.push({ type: "merge", tier: tier + 1, x: x, y: y, points: points, chain: g.chain, mult: mult, id: made.id });
      }
    }

    // Top of a snack from its fixture's bounding box, so tipped wedges count properly.
    function topOf(s) { return s.fixture.getAABB(0).upperBound.y; }

    function step(input) {
      input = input || {};
      if (input.aim != null) g.aim = clampAim(input.aim, g.current);
      if (g.status !== "playing") { world.step(STEP); return; }
      g.time += STEP;
      if (g.wait > 0) g.wait -= STEP;
      if (g.fever > 0) { g.fever -= STEP; if (g.fever <= 0) { g.fever = 0; g.events.push({ type: "feverEnd" }); } }
      if (g.rush) { g.rush.tick++; if (input.rush) acceptRush(); }
      if (input.tool) useTool(input.tool.id, input.tool.target);
      stepShake();
      if (input.drop != null) drop(input.drop);
      if (g.rush) stepRush();
      world.step(STEP);
      merges();
      while (rules.tools && g.score >= g.nextToolAt) { g.nextToolAt += TOOL_EARN.every; giveTool(null, "points"); }
      if (rules.tools && g.score >= SHAKE.quakeScore) giveQuake();
      var worst = 0;
      for (var i = 0; i < g.snacks.length; i++) {
        var s = g.snacks[i];
        if (!s.landed && g.time - s.born > BALANCE.landGrace) s.landed = true;
        if (!s.landed) continue;
        // During a shake and its guard the line timer stops: a shake never loses the game.
        if (topOf(s) > g.line) { if (!g.guard) s.over += STEP; } else s.over = 0;
        if (s.over > worst) worst = s.over;
      }
      g.danger = Math.min(1, worst / g.overLimit);
      if (worst >= g.overLimit) {
        g.status = "over";
        g.events.push({ type: "over", score: g.score });
      }
    }

    // A saved game: every field that matters plus each snack's position and
    // speed. Restoring puts the crate back exactly as it looked; from there it
    // plays on normally (Box2D's contact cache isn't saved, so it is not a
    // bit-for-bit continuation, which only the drop-log replay is).
    function snapshot() {
      var snap = {
        rules: g.rush ? RUSH_VERSION : RULES_VERSION, seed: g.seed, mode: g.mode, container: box.id, tray: g.tray.slice(), toolsUsed: g.toolsUsed, nextToolAt: g.nextToolAt, toolRand: toolRand.get(), quakeGiven: g.quakeGiven, lastDrop: g.lastDrop, fever: g.fever, fevers: g.fevers, maxChain: g.maxChain, rand: rand.get(), time: g.time, score: g.score, drops: g.drops,
        merges: g.merges, best: g.best, made: g.made.slice(), current: g.current, next: g.next, aim: g.aim, wait: g.wait,
        chain: g.chain, lastMerge: g.lastMerge, nextId: g.nextId,
        snacks: g.snacks.map(function (s) {
          var p = s.body.getPosition(), v = s.body.getLinearVelocity();
          return [s.id, s.tier, p.x, p.y, s.body.getAngle(), v.x, v.y, s.body.getAngularVelocity(), s.born, s.landed ? 1 : 0, s.over];
        })
      };
      if (g.rush) snap.rush = Object.assign({}, g.rush, {
        active: g.rush.active ? Object.assign({}, g.rush.active) : null,
        rand: rushRand.get(), dropMerges: g.dropMerges
      });
      return snap;
    }
    if (restore) {
      var r = restore;
      r.snacks.forEach(function (a) {
        var s = makeBody(a[1], a[2], a[3], a[4], { x: a[5], y: a[6] });
        s.body.setAngularVelocity(a[7]); s.id = a[0]; s.born = a[8]; s.landed = !!a[9]; s.over = a[10];
      });
      rand.set(r.rand);
      if (r.toolRand != null) toolRand.set(r.toolRand);
      if (r.tray) g.tray = r.tray.slice();
      ["quakeGiven", "lastDrop", "toolsUsed", "nextToolAt", "fever", "fevers", "maxChain", "time", "score", "drops", "merges", "best", "current", "next", "aim", "wait", "chain", "lastMerge", "nextId"].forEach(function (k) { if (r[k] != null) g[k] = r[k]; });
      g.made = r.made.slice();
      if (g.rush) {
        var saved = r.rush;
        g.rush = { tick: saved.tick, charges: saved.charges, drops: saved.drops,
          active: saved.active ? Object.assign({}, saved.active) : null, queued: saved.queued };
        rushRand.set(saved.rand);
        g.dropMerges = saved.dropMerges;
      }
    }

    // The tool a game starts with: the player's choice in Arcade, the same
    // seeded one for everybody in the Daily Drop.
    if (rules.tools && !restore) giveTool(opts.mode === "daily" ? null : (TOOLS[opts.startTool] ? opts.startTool : "swap"), "start");
    g.canUse = function (id, target) { return !!canUse(id, target); };
    if (g.rush) {
      g.canRush = canRush;
      g.rushPreview = function () { return canRush() ? rushPlan(rng(rushRand.get())) : []; };
    }

    g.step = step; g.drop = drop; g.canDrop = canDrop; g.clampAim = clampAim; g.topOf = topOf; g.snapshot = snapshot;
    return g;
  }

  // ════ Bot ═════════════════════════════════════════════════════════
  // Picks where to drop. "careful" reads the pile like a decent player;
  // "random" drops anywhere and is the floor every tuning change must beat.
  function botAim(g, style, rand) {
    var t = TIERS[g.current], lim = CRATE.half - t.halfW - 0.02;
    if (style === "random") return -lim + rand() * 2 * lim;
    var b = botBest(g, g.current);
    // A human doesn't hit the exact spot.
    return b.x + (rand() - 0.5) * 0.3;
  }
  // The careful bot's best drop for a tier: where, and how good it looks.
  function botBest(g, tier) {
    var t = TIERS[tier], lim = CRATE.half - t.halfW - 0.02;
    var best = -1e9, bestX = 0, n = 25;
    for (var k = 0; k < n; k++) {
      var x = -lim + (2 * lim * k) / (n - 1);
      var top = 0, under = null;
      for (var i = 0; i < g.snacks.length; i++) {
        var s = g.snacks[i], box = s.fixture.getAABB(0);
        if (box.upperBound.x < x - t.halfW || box.lowerBound.x > x + t.halfW) continue;
        if (box.upperBound.y > top) { top = box.upperBound.y; under = s; }
      }
      var score = -top * 1.2;
      if (under) {
        if (under.tier === tier) score += 9 - Math.abs(under.body.getPosition().x - x) * 3;
        else if (under.tier < tier) score -= (tier - under.tier) * 1.1;
        else score -= (under.tier - tier) * 0.35;
      }
      // Big snacks to the walls keeps the middle open for merges.
      if (tier >= 3) score += Math.abs(x) / lim * 0.6;
      if (score > best) { best = score; bestX = x; }
    }
    return { x: bestX, score: best };
  }

  // The tool bot (PLAN 20, item 5): simple rules a decent player would use.
  // Returns a tool input for step() or null.
  function botTool(g) {
    if (!g.tray.length) return null;
    var has = function (id) { return g.tray.indexOf(id) >= 0; };
    // Spatula: a small snack over the line, before it ends the game.
    if (has("spatula")) {
      var worst = null;
      for (var i = 0; i < g.snacks.length; i++) { var s = g.snacks[i]; if (s.over > 0.3 && s.tier <= 6 && (!worst || s.over > worst.over)) worst = s; }
      if (worst) return { id: "spatula", target: worst.id };
    }
    // Level Up: a snack touching a snack one tier bigger.
    if (has("levelup")) {
      for (var a = 0; a < g.snacks.length; a++) {
        var sa = g.snacks[a];
        if (sa.tier > 6 || !sa.landed) continue;
        for (var b = 0; b < g.snacks.length; b++) {
          var sb = g.snacks[b];
          if (sb.tier !== sa.tier + 1) continue;
          var pa = sa.body.getPosition(), pb = sb.body.getPosition();
          if (Math.hypot(pa.x - pb.x, pa.y - pb.y) < TIERS[sa.tier].halfW + TIERS[sb.tier].halfW + 0.15) return { id: "levelup", target: sa.id };
        }
      }
    }
    var canShake = !g.shake && g.time - g.lastDrop >= SHAKE.gap;
    // Earthquake: the pile is within 1 m of the line.
    if (has("quake") && canShake) {
      var top = 0;
      for (var q = 0; q < g.snacks.length; q++) if (g.snacks[q].landed) top = Math.max(top, g.snacks[q].fixture.getAABB(0).upperBound.y);
      if (top > g.line - 1) return { id: "quake" };
    }
    // Rumble: two matching snacks almost touching.
    if (has("rumble") && canShake) {
      for (var r1 = 0; r1 < g.snacks.length; r1++) for (var r2 = r1 + 1; r2 < g.snacks.length; r2++) {
        var x1 = g.snacks[r1], x2 = g.snacks[r2];
        if (x1.tier !== x2.tier || !x1.landed || !x2.landed) continue;
        var p1 = x1.body.getPosition(), p2 = x2.body.getPosition(), gap = Math.hypot(p1.x - p2.x, p1.y - p2.y) - 2 * TIERS[x1.tier].halfW;
        if (gap > 0.02 && gap < 0.3) return { id: "rumble" };
      }
    }
    // Bump: the pile leans to one side; knock it from the other so it slides into the gap.
    if (has("bump") && canShake && g.snacks.length > 5) {
      var sum = 0;
      for (var m = 0; m < g.snacks.length; m++) sum += g.snacks[m].body.getPosition().x;
      var avg = sum / g.snacks.length;
      if (Math.abs(avg) > 0.6) return { id: "bump", target: avg > 0 ? "l" : "r" };
    }
    // Swap: the next snack has a good spot and the held one doesn't.
    if (has("swap") && g.canDrop() && botBest(g, g.next).score > botBest(g, g.current).score + 4) return { id: "swap" };
    return null;
  }

  return {
    STEP: STEP, RULES_VERSION: RULES_VERSION, RUSH_VERSION: RUSH_VERSION, RUSH: RUSH, CRATE: CRATE, CONTAINERS: CONTAINERS, CONTAINER_ORDER: CONTAINER_ORDER, MODES: MODES, FEVER: FEVER, MAX_MULT: MAX_MULT, BALANCE: BALANCE, TIERS: TIERS, TOP: TOP, SCORE: SCORE, HAMPER_BONUS: HAMPER_BONUS,
    DROP_TIERS: DROP_TIERS, createGame: createGame, botAim: botAim, botTool: botTool, TOOLS: TOOLS, TOOL_ORDER: TOOL_ORDER, TOOL_EARN: TOOL_EARN, SHAKE: SHAKE, hash: hash, rng: rng
  };
});
