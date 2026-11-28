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
  var RULES_VERSION = 1;

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
  // opts = { seed: number, mode: "classic" | "daily", restore: snapshot }
  function createGame(opts) {
    opts = opts || {};
    var rand = rng(opts.seed == null ? 1 : opts.seed);
    var world = new planck.World({ gravity: { x: 0, y: -BALANCE.gravity }, allowSleep: true });
    var crate = world.createBody();
    var H = CRATE.half, Wl = CRATE.wall;
    crate.createFixture({ shape: new planck.Box(H + Wl, Wl, { x: 0, y: -Wl }, 0), friction: 0.6 });
    crate.createFixture({ shape: new planck.Box(Wl, CRATE.height / 2 + Wl, { x: -H - Wl, y: CRATE.height / 2 }, 0), friction: 0.3 });
    crate.createFixture({ shape: new planck.Box(Wl, CRATE.height / 2 + Wl, { x: H + Wl, y: CRATE.height / 2 }, 0), friction: 0.3 });
    crate.setUserData({ crate: true });

    var g = {
      mode: opts.mode || "classic", seed: opts.seed, world: world,
      snacks: [], nextId: 1, time: 0, status: "playing",
      score: 0, drops: 0, merges: 0, best: 0, made: TIERS.map(function () { return 0; }),
      current: pick(rand), next: pick(rand), aim: 0, wait: 0,
      chain: 0, lastMerge: -99, danger: 0, events: []
    };
    var pairs = [];

    function makeBody(tier, x, y, angle, vel) {
      var t = TIERS[tier];
      var body = world.createBody({ type: "dynamic", position: { x: x, y: y }, angle: angle || 0, angularDamping: 0.3, linearDamping: 0.05 });
      var shape = t.shape === "circle" ? new planck.Circle(t.r)
        : t.shape === "box" ? new planck.Box(t.w / 2, t.h / 2)
        : new planck.Polygon(t.points);
      var fixture = body.createFixture({ shape: shape, density: 1, friction: t.shape === "box" ? BALANCE.friction - 0.1 : BALANCE.friction, restitution: BALANCE.restitution });
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

    function canDrop() { return g.status === "playing" && g.wait <= 0; }

    function drop(x) {
      if (!canDrop()) return false;
      var tier = g.current;
      x = clampAim(x, tier);
      makeBody(tier, x, CRATE.dropY, 0, { x: 0, y: -1 });
      g.drops++;
      g.events.push({ type: "drop", tier: tier, x: x });
      g.current = g.next; g.next = pick(rand); g.wait = BALANCE.dropGap;
      return true;
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
        var mult = 1 + 0.25 * (g.chain - 1);
        if (tier === TOP) {
          var bonus = Math.round(HAMPER_BONUS * mult);
          g.score += bonus;
          g.events.push({ type: "packed", tier: tier, x: x, y: y, points: bonus, chain: g.chain });
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
        g.events.push({ type: "merge", tier: tier + 1, x: x, y: y, points: points, chain: g.chain, id: made.id });
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
      if (input.drop != null) drop(input.drop);
      world.step(STEP);
      merges();
      var worst = 0;
      for (var i = 0; i < g.snacks.length; i++) {
        var s = g.snacks[i];
        if (!s.landed && g.time - s.born > BALANCE.landGrace) s.landed = true;
        if (!s.landed) continue;
        if (topOf(s) > CRATE.line) s.over += STEP; else s.over = 0;
        if (s.over > worst) worst = s.over;
      }
      g.danger = Math.min(1, worst / BALANCE.overLimit);
      if (worst >= BALANCE.overLimit) {
        g.status = "over";
        g.events.push({ type: "over", score: g.score });
      }
    }

    // A saved game: every field that matters plus each snack's position and
    // speed. Restoring puts the crate back exactly as it looked; from there it
    // plays on normally (Box2D's contact cache isn't saved, so it is not a
    // bit-for-bit continuation, which only the drop-log replay is).
    function snapshot() {
      return {
        rules: RULES_VERSION, seed: g.seed, mode: g.mode, rand: rand.get(), time: g.time, score: g.score, drops: g.drops,
        merges: g.merges, best: g.best, made: g.made.slice(), current: g.current, next: g.next, aim: g.aim, wait: g.wait,
        chain: g.chain, lastMerge: g.lastMerge, nextId: g.nextId,
        snacks: g.snacks.map(function (s) {
          var p = s.body.getPosition(), v = s.body.getLinearVelocity();
          return [s.id, s.tier, p.x, p.y, s.body.getAngle(), v.x, v.y, s.body.getAngularVelocity(), s.born, s.landed ? 1 : 0, s.over];
        })
      };
    }
    if (opts.restore) {
      var r = opts.restore;
      r.snacks.forEach(function (a) {
        var s = makeBody(a[1], a[2], a[3], a[4], { x: a[5], y: a[6] });
        s.body.setAngularVelocity(a[7]); s.id = a[0]; s.born = a[8]; s.landed = !!a[9]; s.over = a[10];
      });
      rand.set(r.rand);
      ["time", "score", "drops", "merges", "best", "current", "next", "aim", "wait", "chain", "lastMerge", "nextId"].forEach(function (k) { g[k] = r[k]; });
      g.made = r.made.slice();
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
        if (under.tier === g.current) score += 9 - Math.abs(under.body.getPosition().x - x) * 3;
        else if (under.tier < g.current) score -= (g.current - under.tier) * 1.1;
        else score -= (under.tier - g.current) * 0.35;
      }
      // Big snacks to the walls keeps the middle open for merges.
      if (g.current >= 3) score += Math.abs(x) / lim * 0.6;
      if (score > best) { best = score; bestX = x; }
    }
    // A human doesn't hit the exact spot.
    return bestX + (rand() - 0.5) * 0.3;
  }

  return {
    STEP: STEP, RULES_VERSION: RULES_VERSION, CRATE: CRATE, BALANCE: BALANCE, TIERS: TIERS, TOP: TOP, SCORE: SCORE, HAMPER_BONUS: HAMPER_BONUS,
    DROP_TIERS: DROP_TIERS, createGame: createGame, botAim: botAim, hash: hash, rng: rng
  };
});
