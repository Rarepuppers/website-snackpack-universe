/* Snack Haul rules and physics. No DOM and no storage, so dev/sim.js can drive
 * real deliveries in Node and the file can move to the Android app as it is.
 * Physics: Planck.js (Box2D), vendored in vendor/. Units are metres and seconds.
 * The game plays on a 2D side-on plane; render3d.js draws that plane in 3D.
 * Everything here is deterministic: the same inputs always give the same run,
 * which is what makes the bots, the daily route and ghosts possible. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./vendor/planck-1.5.1.min.js"));
  else root.SnackHaul = factory(root.planck);
})(typeof self !== "undefined" ? self : this, function (planck) {
  "use strict";

  var STEP = 1 / 60;
  // Wheels ignore cargo: a fallen crate wedged against a tyre used to jam the wheel.
  var CARGO_BIT = 0x0002;

  // ════ Balance: every tunable number lives here ═══════════════════
  var BALANCE = {
    gravity: 10,
    torque: 15,
    topSpeed: 9,
    airTorque: 7,
    tankSeconds: 32,
    canSeconds: 22,
    canEvery: 110,
    passShare: 0.5,
    coinValue: 1,
    cargoPay: { crate: 6, eggs: 10, jelly: 8, milk: 8, melon: 9, cake: 14, popcorn: 7, icecream: 12 },
    eggBreak: 2.6,
    ballast: 2.4,                  // low weight under the bed, which keeps flips earned
    valleyBend: 0.3,               // how fast a valley floor may turn upward, in slope per metre
    strapReact: 0,
    strapHold: 0.3,                // share of a crate's weight pressed down, per Straps level
    flipSeconds: 1.6,
    stallSeconds: 2.5,
    stopSeconds: 0.7,
    stopSpeed: 0.7,
    parSpeed: 5.5,                 // metres a second for the gold medal
    silver: 1.25,                  // medal times, as multiples of the gold time
    bronze: 1.6,
    expressPay: 12,
    dailyPay: 40,
    regionStars: 14,               // stars in a region that open the next one
    slick: 0.6,                    // share of normal grip on ice and wet cobbles
    fordDrag: 2,
    bridgeBounce: 0.45,
    popLiftFrom: 6.5,              // popcorn starts to lift above this speed
    popLift: 0.35,
    cakeTilt: 0.6,                 // radians off upright before a cake is ruined
    meltFloor: 1 / 3,              // ice cream pay at 1.5 times the gold time
    longLen: 1200,
    longClimb: 1.6,                // extra heat per kilometre of a Long Haul
    longSteep: 1.5,                // a Long Haul may grow this much steeper than the region's routes
    longCanGrow: 0.035
  };

  // kinds: the two cargo types a region adds to plain crates.
  var REGIONS = [
    { id: "bakery", name: "Bakery Hills", blurb: "Gentle hills and good grip.", friction: 1.0, amp: 1.0, wave: 1.0, rough: 0.12, maxSlope: 0.5, pay: 1, kinds: ["eggs", "crate"], features: ["ramp"], ramp: [0.2, 0.34] },
    { id: "dunes", name: "Dairy Dunes", blurb: "Long dunes, loose sand and gusty wind.", friction: 0.72, amp: 1.5, wave: 1.45, rough: 0.08, maxSlope: 0.55, pay: 1.5, kinds: ["milk", "melon"], features: ["wind"] },
    { id: "harbour", name: "Honey Harbour", blurb: "Bouncy plank bridges and shallow fords.", friction: 0.9, amp: 1.6, wave: 1.2, rough: 0.14, maxSlope: 0.56, pay: 2, kinds: ["jelly", "cake"], features: ["bridge", "ford"] },
    { id: "frost", name: "Frosty Pass", blurb: "Steep ice. Brake early.", friction: 0.42, amp: 1.7, wave: 1.15, rough: 0.16, maxSlope: 0.6, pay: 2.6, kinds: ["icecream", "eggs"], features: ["slick"] },
    { id: "chilli", name: "Chilli Ridge", blurb: "Rough rock, sharp crests and big ramps.", friction: 0.85, amp: 1.75, wave: 0.9, rough: 0.22, maxSlope: 0.62, pay: 3.3, kinds: ["popcorn", "jelly"], features: ["ramp"], ramp: [0.5, 0.8] },
    { id: "market", name: "Midnight Market", blurb: "Night roads, speed bumps and wet cobbles.", friction: 0.95, amp: 1.8, wave: 1.0, rough: 0.14, maxSlope: 0.6, pay: 4, kinds: null, features: ["bump", "slick"] }
  ];
  var CARGO_TYPES = ["crate", "eggs", "milk", "jelly", "melon", "cake", "popcorn", "icecream"];

  // c is a crate; a and b are the region's own cargo. The first four letters form
  // the bottom row. Awkward cargo (b: melons, cakes) rides at the back with nothing on top. Route 7 is the long one, 8 the Big Order.
  var ROUTES = [
    { len: 130, heat: 0.45, load: "cccc" },
    { len: 170, heat: 0.6, load: "ccccc" },
    { len: 200, heat: 0.7, load: "cacac" },
    { len: 240, heat: 0.85, load: "ccacca" },
    { len: 270, heat: 0.95, load: "ccbbac", pickup: 2 },
    { len: 310, heat: 1.05, load: "ccabcac" },
    { len: 420, heat: 0.9, load: "cbcacac" },
    { len: 340, heat: 1.05, load: "cacbcaca", pickup: 3 }
  ];
  var FEATURE_LEN = { ramp: 4.5, bridge: 15, ford: 12, slick: 16, wind: 36, bump: 3, pickup: 14 };

  // Early regions rise more gently, so the free region never turns into a wall.
  function regionHeat(heat, r) { var rr = r * 0.75; return heat * (0.8 + rr * 0.075) + rr * 0.04; }
  function loadFor(region, r, i, code) {
    var a = region.kinds ? region.kinds[0] : CARGO_TYPES[1 + (i * 2 + 1) % 7];
    var b = region.kinds ? region.kinds[1] : CARGO_TYPES[1 + (i * 3 + 4) % 7];
    return code.split("").map(function (ch) { return ch === "a" ? a : ch === "b" ? b : "crate"; });
  }

  var DELIVERIES = [];
  REGIONS.forEach(function (region, r) {
    ROUTES.forEach(function (route, i) {
      DELIVERIES.push({
        id: region.id + "-" + (i + 1), region: r, index: i, len: route.len, heat: regionHeat(route.heat, r),
        load: loadFor(region, r, i, route.load), pickup: r > 0 ? route.pickup || 0 : 0
      });
    });
  });

  var UPGRADES = [
    { id: "engine", name: "Engine", icon: "🔧", desc: "More pull on the climbs, and more top speed." },
    { id: "suspension", name: "Suspension", icon: "🛞", desc: "Softer landings, and fewer cracked eggs." },
    { id: "tyres", name: "Tyres", icon: "⚙️", desc: "Better grip on sand and ice." },
    { id: "straps", name: "Cargo Straps", icon: "🪢", desc: "Taller rails, and crates held down." },
    { id: "tank", name: "Fuel Tank", icon: "⛽", desc: "Drive further on a full tank." }
  ];
  var UPGRADE_COST = [35, 100, 220, 440, 800];
  var MAX_LEVEL = UPGRADE_COST.length;

  // Offsets from the Rusty Pickup, which is the baseline for all tuning.
  var TRUCKS = [
    { id: "pickup", name: "Rusty Pickup", cost: 0, desc: "Honest, cheap and easy to handle.", bedHalf: 1.75, perRow: 4, wheelR: 0.5, rearX: -1.1, frontX: 1.2, torque: 1, top: 0, weight: 1, rail: 0, soft: 0, pay: 1, stats: { speed: 2, grip: 2, load: 2 } },
    { id: "tuktuk", name: "Tart Tuk-Tuk", cost: 250, desc: "Tiny and nimble, with a short bed that stacks high.", bedHalf: 1.5, perRow: 3, wheelR: 0.4, rearX: -0.95, frontX: 1.05, torque: 0.8, top: 0.6, weight: 0.8, rail: 0.14, soft: 0.2, pay: 1, stats: { speed: 3, grip: 2, load: 1 } },
    { id: "van", name: "Bread Van", cost: 420, desc: "High sides keep crates in, but it rolls on steep ground.", bedHalf: 1.75, perRow: 4, wheelR: 0.5, rearX: -1.1, frontX: 1.2, torque: 1.15, top: -1.2, weight: 1.25, rail: 0.42, soft: 0, pay: 1, stats: { speed: 1, grip: 2, load: 4 } },
    { id: "buggy", name: "Dune Buggy", cost: 680, desc: "Fast and grippy on sand, but it flips on steep ground.", bedHalf: 1.6, perRow: 4, wheelR: 0.62, rearX: -1.05, frontX: 1.12, torque: 1.2, top: 2.6, weight: 1, rail: 0.28, soft: 0.5, hold: 0.45, pay: 1, stats: { speed: 4, grip: 4, load: 1 } },
    { id: "hauler", name: "Long Hauler", cost: 1500, desc: "Long and strong. Pays 20% more on every load.", bedHalf: 2.25, perRow: 5, wheelR: 0.56, rearX: -1.55, frontX: 1.65, torque: 1.35, top: -0.8, weight: 1.35, rail: 0.1, soft: 0, pay: 1.2, stats: { speed: 2, grip: 3, load: 3 } },
    { id: "monster", name: "Big Muncher", cost: 2600, desc: "Huge soft wheels roll over anything. Drinks fuel.", bedHalf: 1.9, perRow: 4, wheelR: 0.85, rearX: -1.25, frontX: 1.4, torque: 1.9, top: 0.4, weight: 1.45, rail: 0.3, soft: 1.1, lift: 0.3, thirst: 1.35, hold: 0.2, brake: 0.4, pay: 1, stats: { speed: 3, grip: 4, load: 3 } }
  ];

  function truckSpec(id) { return TRUCKS.filter(function (t) { return t.id === id; })[0] || TRUCKS[0]; }

  function dimsFor(t) {
    var cabX = t.bedHalf - 0.6;
    return {
      bedHalf: t.bedHalf, bedHeight: 0.14, cabX: cabX, cabHalfX: 0.55, cabHalfY: 0.56, cabY: 0.68,
      wheelR: t.wheelR, rearX: t.rearX, frontX: t.frontX, axleY: -0.58 - (t.wheelR - 0.5) * 0.7 - (t.lift || 0),
      crate: 0.52, bedLeft: -t.bedHalf + 0.09, bedRight: cabX - 0.59
    };
  }
  var DIM = dimsFor(TRUCKS[0]);
  // Width and height of one unit of each cargo type. Melons are round.
  function cargoSize(type) {
    return type === "melon" ? { w: 0.5, h: 0.5, round: true } : type === "cake" ? { w: 0.5, h: 0.72 } : { w: 0.52, h: 0.52 };
  }

  // ════ Terrain ════════════════════════════════════════════════════
  function hash(text) {
    var h = 2166136261;
    text = String(text);
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var START_FLAT = 18, END_FLAT = 30, SAMPLE = 1.5;
  function heatAt(d, x) { return d.heat + (d.climb || 0) * Math.max(0, x - START_FLAT) / 1000; }

  // Where the road features sit. Positions come from the route's own seed.
  function planFeatures(d) {
    var region = REGIONS[d.region], r = rng(hash(d.id + "feat")), list = [];
    var lo = START_FLAT + 34, hi = START_FLAT + d.len - 30;
    function free(x0, x1) { return list.every(function (f) { return x1 + 16 < f.x0 || x0 - 16 > f.x1; }); }
    if (d.pickup) {
      var px = Math.round((START_FLAT + d.len * (0.45 + r() * 0.1)) / SAMPLE) * SAMPLE;
      list.push({ type: "pickup", x0: px - 7.5, x1: px + 7.5 });
    }
    var kinds = region.features, i = d.index;
    if (kinds.length && (d.long || d.region > 0 || i >= 3)) {
      var count = d.long ? Math.floor(d.len / 85) : 1 + Math.floor(i / 2);
      for (var n = 0; n < count; n++) {
        var type = kinds[n % kinds.length], len = FEATURE_LEN[type];
        for (var tries = 0; tries < 14; tries++) {
          var x0 = Math.round((lo + r() * Math.max(1, hi - lo - len)) / SAMPLE) * SAMPLE;
          if (!free(x0, x0 + len)) continue;
          var f = { type: type, x0: x0, x1: x0 + len };
          var hard = Math.min(1, (d.long ? (x0 / d.len) * 7 : i) / 7);
          if (type === "ramp") f.h = region.ramp[0] + (region.ramp[1] - region.ramp[0]) * hard;
          if (type === "wind") { f.power = 0.36 + 0.24 * hard; f.phase = r() * 6; }
          list.push(f);
          break;
        }
      }
    }
    return list.sort(function (a, b) { return a.x0 - b.x0; });
  }

  function buildTerrain(d) {
    var region = REGIONS[d.region], r = rng(hash(d.id));
    var layers = [
      { len: 62 * region.wave, amp: 3.4, ph: r() * 7 },
      { len: 31 * region.wave, amp: 1.7, ph: r() * 7 },
      { len: 13, amp: 0.55, ph: r() * 7 },
      { len: 5.5, amp: region.rough, ph: r() * 7 }
    ];
    var total = START_FLAT + d.len + END_FLAT, features = planFeatures(d);
    var pts = [], last = 0;
    function slopeAt(x) { return region.maxSlope * Math.min(d.long ? BALANCE.longSteep : 1, 0.65 + heatAt(d, x) * 0.4); }
    for (var x = 0; x <= total; x += SAMPLE) {
      var edge = Math.min((x - START_FLAT) / 28, (START_FLAT + d.len - x) / 28);
      var env = Math.max(0, Math.min(1, edge));
      env = env * env * (3 - 2 * env);
      var y = 0;
      layers.forEach(function (l) { y += l.amp * Math.sin((x / l.len) * Math.PI * 2 + l.ph); });
      y *= env * region.amp * heatAt(d, x);
      // Keep every slope driveable, then ease back to level at the far end.
      var step = slopeAt(x) * SAMPLE;
      y = Math.max(last - step, Math.min(last + step, y));
      pts.push({ x: x, y: y });
      last = y;
    }
    var endY = last;
    for (var k = pts.length - 1, n = 0; k >= 0 && n < END_FLAT / SAMPLE; k--, n++) pts[k].y = endY;
    function at(px) { return pts[Math.max(0, Math.min(pts.length - 1, Math.round(px / SAMPLE)))]; }
    // Pickup stops are level, and bridges and fords sag in the middle.
    features.forEach(function (f) {
      if (f.type === "pickup") {
        var level = at(f.x0).y;
        pts.forEach(function (p) {
          if (p.x >= f.x0 && p.x <= f.x1) p.y = level;
          else if (p.x > f.x0 - 9 && p.x < f.x0) p.y += (level - p.y) * ((p.x - (f.x0 - 9)) / 9);
          else if (p.x > f.x1 && p.x < f.x1 + 9) p.y = level + (p.y - level) * ((p.x - f.x1) / 9);
        });
      } else if (f.type === "slick") {
        // Ice on a steep climb cannot be driven, so slick stretches stay gentle.
        var prev = at(f.x0).y;
        pts.forEach(function (p) {
          if (p.x > f.x0 && p.x <= f.x1) { p.y = Math.max(prev - 0.16 * SAMPLE, Math.min(prev + 0.1 * SAMPLE, p.y)); prev = p.y; }
        });
      } else if (f.type === "ford" || f.type === "bridge") {
        var depth = f.type === "ford" ? 0.45 : 0.7;
        pts.forEach(function (p) {
          if (p.x > f.x0 && p.x < f.x1) { var s = Math.sin(Math.PI * (p.x - f.x0) / (f.x1 - f.x0)); p.y -= depth * s * s; }
        });
      }
    });
    // The run-in to the flat, and any edit above, can hold a step: smooth it.
    for (var pass = 0; pass < 3; pass++) {
      for (var i = pts.length - 2; i > 0; i--) {
        if (pts[i].x < START_FLAT) break;
        var limit = slopeAt(pts[i].x) * SAMPLE;
        pts[i].y = Math.max(pts[i + 1].y - limit, Math.min(pts[i + 1].y + limit, pts[i].y));
      }
    }
    // Slope limits alone leave sharp V-shaped valley floors, where a steep descent
    // meets a steep climb in one step and slams the truck. Fill each floor so the
    // slope turns upward gradually. Crests are left sharp: they are the jumps.
    var sag = BALANCE.valleyBend * SAMPLE * SAMPLE / 2;
    for (var fill = 0; fill < 12; fill++) {
      for (var v = 1; v < pts.length - 1; v++) {
        if (pts[v].x < START_FLAT) continue;
        var floor = (pts[v - 1].y + pts[v + 1].y) / 2 - sag;
        if (pts[v].y < floor) pts[v].y = floor;
      }
    }
    // Ramps go on last, because they are meant to be steeper than the road allows.
    // A ramp on a climb would end in a wall, so each one slides to the nearest
    // stretch that is level or falling, and is dropped if there is none close by.
    features.forEach(function (f) {
      if (f.type !== "ramp") return;
      var i0 = Math.round(f.x0 / SAMPLE), found = -1;
      for (var s = 0; s < 9 && found < 0; s++) {
        [i0 + s, i0 - s].forEach(function (k) {
          if (found < 0 && pts[k] && pts[k + 5] && pts[k].x > START_FLAT + 20 && pts[k + 3].y - pts[k].y <= 0.1 && pts[k + 5].y - pts[k + 3].y <= 0.1) found = k;
        });
      }
      if (found < 0) { f.dead = true; return; }
      f.x0 = pts[found].x; f.x1 = f.x0 + FEATURE_LEN.ramp;
      for (var j = 1; j <= 3; j++) pts[found + j].y += f.h * (j / 3) * (j / 3);
    });
    features = features.filter(function (f) { return !f.dead; });
    return { pts: pts, total: total, zoneStart: total - 16, zoneEnd: total - 1.5, features: features };
  }
  function heightAt(terrain, x) {
    var p = terrain.pts, i = Math.max(0, Math.min(p.length - 2, Math.floor(x / SAMPLE)));
    var t = (x - p[i].x) / SAMPLE;
    return p[i].y + (p[i + 1].y - p[i].y) * t;
  }
  function featureAt(terrain, x, type) {
    var f = terrain.features;
    for (var i = 0; i < f.length; i++) if (x >= f[i].x0 && x <= f[i].x1 && (!type || f[i].type === type)) return f[i];
    return null;
  }

  function buildPickups(d, terrain) {
    var r = rng(hash(d.id + "coins")), coins = [], cans = [], rocks = [], ridges = [];
    var clear = function (x) { return !terrain.features.some(function (f) { return x > f.x0 - 4 && x < f.x1 + 4 && f.type !== "wind"; }); };
    for (var x = START_FLAT + 22; x < terrain.total - END_FLAT - 12; x += 26 + r() * 16) {
      var count = 3 + Math.floor(r() * 3);
      // Coins over a ramp sit higher, as a reward for taking it at speed.
      var ramp = featureAt(terrain, x + 3, "ramp") || featureAt(terrain, x - 3, "ramp");
      for (var c = 0; c < count; c++) {
        var cx = x + c * 1.5;
        coins.push({ x: cx, y: heightAt(terrain, cx) + (ramp ? 3.1 : 2.1), taken: false });
      }
    }
    var gap = BALANCE.canEvery;
    for (var f = gap; f < terrain.total - END_FLAT - 10 - START_FLAT; f += gap) {
      var fx = START_FLAT + f;
      cans.push({ x: fx, y: heightAt(terrain, fx) + 1.5, taken: false });
      if (d.long) gap += f * BALANCE.longCanGrow;
    }
    // Road hazards start on the middle routes: a jolt, never a wall.
    if (heatAt(d, 0) >= 0.68 || d.long) {
      var space = 58 - Math.min(1.4, d.heat) * 18;
      for (var rx = START_FLAT + 36; rx < terrain.total - END_FLAT - 22; rx += space + r() * space) {
        if (d.long && heatAt(d, rx) < 0.68) continue;
        if (!clear(rx)) continue;
        var size = 0.2 + r() * 0.12 * Math.min(1.3, d.heat);
        rocks.push({ x: rx, r: size, y: heightAt(terrain, rx) + size * 0.25, kind: "log" });
      }
    }
    terrain.features.forEach(function (ft) {
      if (ft.type === "bump") {
        for (var b = 0; b < 3; b++) { var bx = ft.x0 + 0.4 + b * 1.1; rocks.push({ x: bx, r: 0.17, y: heightAt(terrain, bx) + 0.03, kind: "bump" }); }
      } else if (ft.type === "bridge") {
        for (var px = ft.x0 + 0.75; px < ft.x1; px += 0.75) ridges.push({ x: px, r: 0.07, y: heightAt(terrain, px) + 0.012 });
      }
    });
    return { coins: coins, cans: cans, rocks: rocks, ridges: ridges };
  }

  // ════ Deliveries ═════════════════════════════════════════════════
  function findDelivery(id) {
    return DELIVERIES.filter(function (x) { return x.id === id; })[0] || null;
  }
  // One shared route a day. maxRegion keeps it inside what a player has reached.
  function dailyDelivery(date, maxRegion) {
    var h = hash("daily" + date), region = h % (Math.max(0, maxRegion) + 1), index = 1 + (h >>> 8) % 6;
    var route = ROUTES[index];
    return {
      id: "daily-" + date, daily: true, region: region, index: index, len: route.len, heat: regionHeat(route.heat, region),
      load: loadFor(REGIONS[region], region, index, route.load), pickup: region > 0 ? route.pickup || 0 : 0
    };
  }
  // Long Haul: one long road that keeps getting steeper. Score is how far you get.
  function longHaul(region, seed) {
    var r = REGIONS[region];
    return {
      id: "long-" + r.id + "-" + seed, long: true, region: region, index: 3, len: BALANCE.longLen,
      heat: regionHeat(0.5, region), climb: BALANCE.longClimb, load: loadFor(r, region, 3, "cacbca"), pickup: 0
    };
  }
  function parTime(d) { return Math.round((START_FLAT + d.len + END_FLAT) / BALANCE.parSpeed) + (d.pickup ? 4 : 0); }
  function medalTimes(d) { var p = parTime(d); return { gold: p, silver: Math.round(p * BALANCE.silver), bronze: Math.round(p * BALANCE.bronze) }; }

  // ════ A delivery in progress ═════════════════════════════════════
  function createGame(opts) {
    var d = opts.delivery || findDelivery(opts.id);
    var spec = truckSpec(opts.truck);
    var D = dimsFor(spec);
    var up = Object.assign({ engine: 0, suspension: 0, tyres: 0, straps: 0, tank: 0 }, opts.upgrades || {});
    var region = REGIONS[d.region], terrain = buildTerrain(d), pick = buildPickups(d, terrain);
    var world = new planck.World({ gravity: { x: 0, y: -BALANCE.gravity }, allowSleep: false });

    var ground = world.createBody();
    ground.setUserData({ kind: "ground" });
    ground.createFixture({
      shape: new planck.Chain(terrain.pts.map(function (p) { return { x: p.x, y: p.y }; }), false),
      friction: region.friction
    });
    // End wall: pull up too hard and the load keeps going.
    var endY = terrain.pts[terrain.pts.length - 1].y;
    ground.createFixture({ shape: new planck.Box(0.3, 6, { x: terrain.total + 0.3, y: endY + 6 }, 0), friction: 0.5 });
    ground.createFixture({ shape: new planck.Box(0.3, 6, { x: -0.3, y: 6 }, 0), friction: 0.5 });
    pick.rocks.concat(pick.ridges).forEach(function (rock) {
      ground.createFixture({ shape: new planck.Circle({ x: rock.x, y: rock.y }, rock.r), friction: 0.9 });
    });

    // A tall truck on big wheels somersaults if its brakes bite as hard as its engine pulls.
    var brakeBite = spec.brake || 1;
    var rail = 0.2 + 0.14 * up.straps + spec.rail;
    var strapHold = BALANCE.strapHold * up.straps + (spec.hold || 0);
    var eggBreak = BALANCE.eggBreak * (1 + 0.16 * up.suspension + 0.16 * up.straps);
    var GROUP = { filterGroupIndex: -1 };
    var spawnX = 8;
    var spawnY = heightAt(terrain, spawnX) + 0.75 + spec.wheelR + (spec.lift || 0);
    var truck = world.createBody({ type: "dynamic", position: { x: spawnX, y: spawnY } });
    truck.setUserData({ kind: "truck" });
    function part(shape, density) {
      truck.createFixture(Object.assign({ shape: shape, density: density * spec.weight, friction: 0.5 }, GROUP));
    }
    part(new planck.Box(D.bedHalf, D.bedHeight, { x: 0, y: 0 }, 0), 2.2);
    part(new planck.Box(D.cabHalfX, D.cabHalfY, { x: D.cabX, y: D.cabY }, 0), 0.8);
    part(new planck.Box(D.bedHalf * 0.7, 0.1, { x: 0, y: -0.28 }, 0), BALANCE.ballast);
    part(new planck.Box(0.05, rail / 2, { x: -D.bedHalf + 0.03, y: D.bedHeight + rail / 2 }, 0), 0.4);

    var wheelGrip = 1 + 0.25 * up.tyres + (spec.id === "buggy" ? 0.3 : 0);
    function wheel(x) {
      var w = world.createBody({ type: "dynamic", position: { x: spawnX + x, y: spawnY + D.axleY } });
      w.setUserData({ kind: "wheel", touching: 0 });
      w.createFixture(Object.assign({ shape: new planck.Circle(D.wheelR), density: 1.1, friction: wheelGrip, filterMaskBits: 0xFFFF ^ CARGO_BIT }, GROUP));
      return world.createJoint(new planck.WheelJoint({
        enableMotor: true, motorSpeed: 0, maxMotorTorque: 0,
        frequencyHz: Math.max(1.8, 5 - 0.45 * up.suspension - spec.soft), dampingRatio: 0.6 + 0.04 * up.suspension
      }, truck, w, w.getPosition(), { x: 0, y: 1 }));
    }
    var rearJoint = wheel(D.rearX), frontJoint = wheel(D.frontX);
    var wheels = [rearJoint.getBodyB(), frontJoint.getBodyB()];

    var cargo = [];
    function addCargo(type, pos, angle) {
      var size = cargoSize(type);
      var body = world.createBody({ type: "dynamic", position: pos, angle: angle || 0, angularDamping: size.round ? 2 : 0 });
      var info = { kind: "cargo", type: type, lost: false, broken: false, body: body, id: cargo.length, w: size.w, h: size.h, round: !!size.round };
      body.setUserData(info);
      body.createFixture({
        shape: size.round ? new planck.Circle(size.w / 2) : new planck.Box(size.w / 2 - 0.005, size.h / 2 - 0.005),
        density: type === "milk" ? 2.6 : type === "popcorn" ? 0.28 : type === "icecream" ? 1.2 : 0.9,
        friction: (type === "melon" ? 0.7 : 0.5) + 0.1 * up.straps,
        restitution: type === "jelly" ? 0.55 : type === "popcorn" ? 0.2 : 0.04,
        filterCategoryBits: CARGO_BIT
      });
      cargo.push(info);
      return info;
    }
    // Stack the load on the bed, front of the bed first. Each column keeps its
    // own height, because cakes are taller than crates.
    var onBoard = d.load.slice(0, d.load.length - (d.pickup || 0)), pending = d.load.slice(onBoard.length);
    var columns = [];
    onBoard.forEach(function (type, i) {
      var col = i % spec.perRow, size = cargoSize(type), base = columns[col] || 0;
      addCargo(type, { x: spawnX + D.bedRight - D.crate * (col + 0.55) - col * 0.015, y: spawnY + D.bedHeight + base + size.h / 2 + 0.01 });
      columns[col] = base + size.h + 0.012;
    });

    var pickupZone = terrain.features.filter(function (f) { return f.type === "pickup"; })[0] || null;
    var g = {
      delivery: d, region: region, regionIndex: d.region, terrain: terrain, world: world, truck: truck, wheels: wheels,
      cargo: cargo, coins: pick.coins, cans: pick.cans, rocks: pick.rocks, rail: rail, upgrades: up, spec: spec, dim: D,
      status: "driving", reason: null, time: 0, coinsTaken: 0, par: parTime(d), medals: medalTimes(d),
      fuel: BALANCE.tankSeconds + 9 * up.tank, maxFuel: BALANCE.tankSeconds + 9 * up.tank,
      events: [], settle: 0.5, airTime: 0, airTotal: 0, bestAir: 0, topSpeed: 0, flipsNearly: 0, slipRear: 0, gasOn: false, brakeOn: false,
      total: d.load.length, pending: pending, pickup: pickupZone, pickupState: pickupZone ? "ahead" : "none", wind: 0, zone: null, rec: []
    };
    var topSpeed = (BALANCE.topSpeed + spec.top + 1.15 * up.engine) / D.wheelR;
    var torque = BALANCE.torque * spec.torque * (1 + 0.2 * up.engine);
    var thirst = spec.thirst || 1;
    var flipTimer = 0, stallTimer = 0, stopTimer = 0, loadTimer = 0, splash = 0;
    var need = d.long ? 1 : Math.ceil(g.total * BALANCE.passShare);
    var wasGrounded = true;

    function tagged(contact, kind) {
      var a = contact.getFixtureA().getBody().getUserData();
      var b = contact.getFixtureB().getBody().getUserData();
      if (a && a.kind === kind) return { self: a, other: b, body: contact.getFixtureA().getBody() };
      if (b && b.kind === kind) return { self: b, other: a, body: contact.getFixtureB().getBody() };
      return null;
    }
    world.on("begin-contact", function (c) {
      var hit = tagged(c, "cargo");
      if (hit && hit.other && hit.other.kind === "ground" && !hit.self.lost && !hit.self.broken) {
        if (g.settle <= 0) {
          hit.self.lost = true;
          var cp = hit.self.body.getPosition();
          g.events.push({ type: "lost", cargo: hit.self.type, x: cp.x, y: cp.y });
        }
      }
      var w = tagged(c, "wheel");
      if (w && w.other && w.other.kind === "ground") w.self.touching += 1;
    });
    world.on("end-contact", function (c) {
      var w = tagged(c, "wheel");
      if (w && w.other && w.other.kind === "ground") w.self.touching = Math.max(0, w.self.touching - 1);
    });
    // Ice, wet cobbles and plank bridges change how a tyre meets the road.
    var mixedGrip = Math.sqrt(wheelGrip * region.friction);
    world.on("pre-solve", function (c) {
      var w = tagged(c, "wheel");
      if (!w || !w.other || w.other.kind !== "ground") return;
      var f = featureAt(terrain, w.body.getPosition().x);
      c.setFriction(f && f.type === "slick" ? mixedGrip * BALANCE.slick * (1 + 0.12 * up.tyres) : f && f.type === "ford" ? mixedGrip * 0.8 : mixedGrip);
      c.setRestitution(f && f.type === "bridge" ? BALANCE.bridgeBounce : 0);
    });
    world.on("post-solve", function (c, impulse) {
      var hit = tagged(c, "cargo");
      if (!hit || hit.self.type !== "eggs" || hit.self.broken || hit.self.lost || g.settle > 0) return;
      var hardest = Math.max.apply(null, impulse.normalImpulses);
      if (hardest > eggBreak) {
        hit.self.broken = true;
        var cp = hit.self.body.getPosition();
        g.events.push({ type: "broken", cargo: "eggs", x: cp.x, y: cp.y });
      }
    });

    function liveCargo() { return cargo.filter(function (c) { return !c.lost && !c.broken; }).length; }
    function grounded() { return wheels.some(function (w) { return w.getUserData().touching > 0; }); }
    function onBed(c) {
      var local = truck.getLocalPoint(c.body.getPosition());
      return local.x > D.bedLeft - 0.2 && local.x < D.bedRight + 0.2 && local.y > 0 && local.y < 2.2 ? local : null;
    }

    // The waiting loads drop onto the bed, above whatever is already there.
    function loadPickup() {
      var top = D.bedHeight;
      cargo.forEach(function (c) { var l = !c.lost && !c.broken && onBed(c); if (l) top = Math.max(top, l.y + c.h / 2); });
      var added = pending.map(function (type, i) {
        var col = i % spec.perRow, row = Math.floor(i / spec.perRow), size = cargoSize(type);
        var local = { x: D.bedRight - D.crate * (col + 0.55) - col * 0.015, y: top + 0.25 + size.h / 2 + row * 0.8 };
        return addCargo(type, truck.getWorldPoint(local), truck.getAngle());
      });
      pending = g.pending = [];
      g.settle = 0.6;
      g.pickupState = "loaded";
      g.events.push({ type: "pickup", items: added, x: truck.getPosition().x, y: truck.getPosition().y });
    }

    function finish(status, reason) {
      if (status === "done") {
        // A cake only counts if it arrives the right way up.
        cargo.forEach(function (c) {
          if (c.type !== "cake" || c.lost || c.broken) return;
          if (Math.abs(normalAngle(c.body.getAngle() - truck.getAngle())) > BALANCE.cakeTilt) {
            c.broken = true;
            g.events.push({ type: "ruined", cargo: "cake", x: c.body.getPosition().x, y: c.body.getPosition().y });
          }
        });
      }
      g.status = status; g.reason = reason;
      rearJoint.setMotorSpeed(0); frontJoint.setMotorSpeed(0);
      rearJoint.setMaxMotorTorque(4); frontJoint.setMaxMotorTorque(4);
      g.events.push({ type: status, reason: reason });
    }

    g.live = liveCargo;
    g.need = need;
    g.grounded = grounded;
    g.speed = function () { return truck.getLinearVelocity().x; };

    // One fixed physics step. input = { gas: bool, brake: bool }
    g.step = function (input) {
      if (g.status !== "driving") { world.step(STEP); return; }
      g.time += STEP;
      if (g.settle > 0) g.settle -= STEP;
      var gas = !!input.gas && g.fuel > 0, brake = !!input.brake;
      // Record the pedals, run-length encoded, so a ghost can replay this run.
      var bits = (input.gas ? 1 : 0) | (brake ? 2 : 0), rec = g.rec;
      if (rec.length && rec[rec.length - 2] === bits) rec[rec.length - 1] += 1; else rec.push(bits, 1);
      g.gasOn = gas && !brake; g.brakeOn = brake;
      var vx = truck.getLinearVelocity().x;
      if (gas && !brake) {
        rearJoint.setMotorSpeed(-topSpeed); rearJoint.setMaxMotorTorque(torque);
        frontJoint.setMotorSpeed(-topSpeed); frontJoint.setMaxMotorTorque(torque * 0.5);
        g.fuel = Math.max(0, g.fuel - STEP * thirst);
      } else if (brake) {
        // Brakes while rolling forward, then a gentle reverse.
        var back = vx < 0.6;
        var speed = back ? topSpeed * 0.35 : 0;
        rearJoint.setMotorSpeed(speed); rearJoint.setMaxMotorTorque(back ? torque * 0.6 : torque * 2 * brakeBite);
        frontJoint.setMotorSpeed(speed); frontJoint.setMaxMotorTorque(back ? torque * 0.3 : torque * 2 * brakeBite);
        if (back) g.fuel = Math.max(0, g.fuel - STEP * 0.5 * thirst);
      } else {
        rearJoint.setMotorSpeed(0); rearJoint.setMaxMotorTorque(0.4);
        frontJoint.setMotorSpeed(0); frontJoint.setMaxMotorTorque(0.4);
      }
      var isGrounded = grounded();
      if (!isGrounded) {
        if (gas && !brake) truck.applyTorque(BALANCE.airTorque * (spec.air || 1));
        else if (brake) truck.applyTorque(-BALANCE.airTorque * (spec.air || 1));
        g.airTime += STEP; g.airTotal += STEP;
        g.bestAir = Math.max(g.bestAir, g.airTime);
      } else {
        if (!wasGrounded && g.airTime > 0.22) {
          var wp = wheels[0].getPosition();
          g.events.push({ type: "land", air: g.airTime, x: wp.x, y: wp.y });
        }
        g.airTime = 0;
      }
      wasGrounded = isGrounded;

      // Road features under the truck.
      var pos = truck.getPosition();
      var zone = featureAt(terrain, pos.x);
      if (zone !== g.zone) { g.zone = zone; if (zone) g.events.push({ type: "zone", feature: zone.type, x: pos.x, y: pos.y }); }
      g.wind = 0;
      if (zone && zone.type === "ford" && isGrounded) {
        var v = truck.getLinearVelocity(), mass = truck.getMass();
        truck.applyForceToCenter({ x: -v.x * mass * BALANCE.fordDrag, y: 0 }, true);
        splash -= STEP * Math.abs(v.x);
        if (splash <= 0) { splash = 0.9; g.events.push({ type: "splash", x: pos.x, y: heightAt(terrain, pos.x) }); }
      } else if (zone && zone.type === "wind") {
        // Gusts push on the load, not the truck, so light cargo goes first.
        g.wind = zone.power * (0.5 + 0.5 * Math.sin(g.time * 1.7 + zone.phase));
      }

      cargo.forEach(function (c) {
        if (c.lost || c.broken) return;
        var onTruck = onBed(c);
        // Straps press anything still on the bed down towards the truck.
        if (strapHold > 0 && onTruck && onTruck.y < 1.7) {
          var down = truck.getWorldVector({ x: 0, y: -1 });
          var pull = c.body.getMass() * BALANCE.gravity * strapHold;
          c.body.applyForceToCenter({ x: down.x * pull, y: down.y * pull }, true);
          // Part of the pull comes back on the truck, so straps steady it without
          // adding so much weight that it beaches on steep climbs.
          var back2 = pull * BALANCE.strapReact;
          if (back2) truck.applyForce({ x: -down.x * back2, y: -down.y * back2 }, c.body.getPosition(), true);
        }
        if (g.wind) c.body.applyForceToCenter({ x: -g.wind, y: g.wind * 0.15 }, true);
        if (c.type === "popcorn") {
          var s = c.body.getLinearVelocity().length() - BALANCE.popLiftFrom;
          if (s > 0) {
            var weight = c.body.getMass() * BALANCE.gravity;
            c.body.applyForceToCenter({ x: -weight * s * 0.12, y: weight * s * BALANCE.popLift }, true);
          }
        }
      });
      world.step(STEP);

      // How much the rear tyre is spinning against the road: drives the dust.
      var rearSurface = -wheels[0].getAngularVelocity() * D.wheelR;
      g.slipRear = wheels[0].getUserData().touching > 0 ? Math.abs(rearSurface - truck.getLinearVelocity().x) : 0;

      // Pickups
      pos = truck.getPosition();
      g.coins.forEach(function (c) {
        if (!c.taken && Math.abs(c.x - pos.x) < 2.1 && Math.abs(c.y - pos.y) < 2.6 + (spec.lift || 0)) {
          c.taken = true; g.coinsTaken += 1; g.events.push({ type: "coin", x: c.x, y: c.y });
        }
      });
      g.cans.forEach(function (c) {
        if (!c.taken && Math.abs(c.x - pos.x) < 2.2 && Math.abs(c.y - pos.y) < 3) {
          c.taken = true; g.fuel = Math.min(g.maxFuel, g.fuel + BALANCE.canSeconds); g.events.push({ type: "fuel", x: c.x, y: c.y });
        }
      });

      // A crate that falls through a gap in the physics still counts as lost.
      cargo.forEach(function (c) {
        if (!c.lost && c.body.getPosition().y < heightAt(terrain, c.body.getPosition().x) - 2) c.lost = true;
      });

      var speedNow = truck.getLinearVelocity().length();
      var angle = Math.abs(normalAngle(truck.getAngle()));
      g.topSpeed = Math.max(g.topSpeed, speedNow);
      g.stuckTime = gas && speedNow < 0.25 ? (g.stuckTime || 0) + STEP : 0;

      // Pickup stop: pull up inside it, or drive on and leave those loads behind.
      if (g.pickupState === "ahead") {
        var inStop = pos.x > pickupZone.x0 && pos.x < pickupZone.x1;
        loadTimer = inStop && speedNow < BALANCE.stopSpeed && angle < 0.5 ? loadTimer + STEP : 0;
        if (loadTimer > BALANCE.stopSeconds) loadPickup();
        else if (pos.x > pickupZone.x1 + 5) {
          g.pickupState = "missed"; pending = g.pending = [];
          g.events.push({ type: "missed", x: pos.x, y: pos.y });
        }
      }
      if (liveCargo() + pending.length < need) { finish("failed", "load"); return; }

      flipTimer = angle > 2 && speedNow < 3 ? flipTimer + STEP : 0;
      if (flipTimer > BALANCE.flipSeconds) { finish("failed", "flip"); return; }

      stallTimer = g.fuel <= 0 && speedNow < 0.4 ? stallTimer + STEP : 0;
      if (stallTimer > BALANCE.stallSeconds) { finish("failed", "fuel"); return; }

      var inZone = pos.x > terrain.zoneStart && pos.x < terrain.zoneEnd;
      stopTimer = inZone && speedNow < BALANCE.stopSpeed && angle < 0.7 ? stopTimer + STEP : 0;
      if (stopTimer > BALANCE.stopSeconds) finish("done", "delivered");
    };
    g.stopProgress = function () { return Math.min(1, Math.max(stopTimer, loadTimer) / BALANCE.stopSeconds); };
    g.inZone = function () { var x = truck.getPosition().x; return x > terrain.zoneStart && x < terrain.zoneEnd; };
    g.inPickup = function () { var x = truck.getPosition().x; return g.pickupState === "ahead" && x > pickupZone.x0 && x < pickupZone.x1; };
    return g;
  }

  function normalAngle(a) {
    a = a % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // ════ After a delivery ═══════════════════════════════════════════
  function report(g) {
    var total = g.total, kept = g.live();
    var region = g.region, pay = 0, kinds = {}, d = g.delivery;
    CARGO_TYPES.forEach(function (t) { kinds[t] = 0; });
    // Ice cream melts: full pay inside the gold time, a third by 1.5 times it.
    var melt = g.time <= g.par ? 1 : Math.max(BALANCE.meltFloor, 1 - ((g.time / g.par - 1) / 0.5) * (1 - BALANCE.meltFloor));
    g.cargo.forEach(function (c) {
      if (!c.lost && !c.broken) { pay += BALANCE.cargoPay[c.type] * (c.type === "icecream" ? melt : 1); kinds[c.type] += 1; }
    });
    pay = Math.round(pay * region.pay * g.spec.pay);
    var share = kept / total, done = g.status === "done";
    var metres = Math.max(0, Math.round(g.truck.getPosition().x - 8));
    var stars = !done || d.long ? 0 : share >= 1 ? 3 : share >= 0.75 ? 2 : 1;
    var medal = !done || stars < 2 || d.long ? 0 : g.time <= g.medals.gold ? 3 : g.time <= g.medals.silver ? 2 : g.time <= g.medals.bronze ? 1 : 0;
    var lines = [];
    var coins = Math.round(g.coinsTaken * BALANCE.coinValue);
    var score = 0;
    if (d.long) {
      score = Math.round(metres * (0.5 + 0.5 * share));
      lines.push({ label: metres + " m with " + kept + " of " + total + " loads", coins: Math.round(score / 12 * region.pay) });
    } else if (done) {
      lines.push({ label: kept + " of " + total + " delivered", coins: pay });
      if (kinds.icecream && melt < 1) lines.push({ label: "Ice cream melted a little", coins: 0 });
      if (stars === 3) lines.push({ label: "Whole load intact", coins: Math.round(10 * region.pay) });
      if (medal) lines.push({ label: ["", "Bronze", "Silver", "Gold"][medal] + " time", coins: Math.round(BALANCE.expressPay * region.pay * medal / 3) });
      if (d.daily && !d.paid) lines.push({ label: "Daily delivery", coins: BALANCE.dailyPay });
    }
    if (coins) lines.push({ label: "Coins on the road", coins: coins });
    return {
      status: g.status, reason: g.reason, kept: kept, total: total, stars: stars, time: g.time, express: medal === 3, medal: medal,
      par: g.par, medals: g.medals, kinds: kinds, bestAir: g.bestAir, airTotal: g.airTotal, topSpeed: g.topSpeed, truck: g.spec.id,
      long: !!d.long, metres: metres, score: score, coinsTaken: g.coinsTaken, missedPickup: g.pickupState === "missed",
      lines: lines, earned: lines.reduce(function (n, l) { return n + l.coins; }, 0)
    };
  }

  // ════ Ghosts ═════════════════════════════════════════════════════
  // Replays recorded pedals and returns x, y, angle for every `every` steps.
  function ghostPath(opts, rec, every) {
    var g = createGame(opts), path = [], n = 0;
    every = every || 4;
    for (var i = 0; i < rec.length && g.status === "driving"; i += 2) {
      var input = { gas: !!(rec[i] & 1), brake: !!(rec[i] & 2) };
      for (var k = 0; k < rec[i + 1] && g.status === "driving"; k++) {
        g.step(input);
        if (n++ % every === 0) { var p = g.truck.getPosition(); path.push(p.x, p.y, g.truck.getAngle()); }
      }
    }
    return { path: path, every: every, report: report(g) };
  }

  // ════ Contracts: three small jobs a day ══════════════════════════
  var CONTRACTS = [
    { id: "eggs", text: "Deliver 6 trays of eggs", goal: 6, pay: 40, count: function (r) { return r.status === "done" ? r.kinds.eggs : 0; } },
    { id: "intact", text: "Deliver 3 whole loads intact", goal: 3, pay: 50, count: function (r) { return r.stars === 3 ? 1 : 0; } },
    { id: "medals", text: "Win 3 medals", goal: 3, pay: 45, count: function (r) { return r.medal ? 1 : 0; } },
    { id: "gold", text: "Win a gold medal", goal: 1, pay: 40, count: function (r) { return r.medal === 3 ? 1 : 0; } },
    { id: "coins", text: "Pick up 40 coins on the road", goal: 40, pay: 35, count: function (r) { return r.coinsTaken; } },
    { id: "loads", text: "Deliver 25 loads of cargo", goal: 25, pay: 45, count: function (r) { return r.status === "done" ? r.kept : 0; } },
    { id: "air", text: "Spend 5 seconds in the air", goal: 5, pay: 35, count: function (r) { return r.airTotal; } },
    { id: "metres", text: "Drive 2 kilometres", goal: 2000, pay: 40, count: function (r) { return r.metres; } },
    { id: "runs", text: "Finish 4 deliveries", goal: 4, pay: 35, count: function (r) { return r.status === "done" ? 1 : 0; } },
    { id: "long", text: "Drive 400 metres in one Long Haul", goal: 1, pay: 50, count: function (r) { return r.long && r.metres >= 400 ? 1 : 0; } }
  ];
  function contractsFor(date) {
    var r = rng(hash("contracts" + date)), pool = CONTRACTS.slice(), out = [];
    while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }

  function upgradeCost(level) { return level >= MAX_LEVEL ? null : UPGRADE_COST[level]; }
  function regionStars(r, stars) {
    return DELIVERIES.reduce(function (n, x) { return n + (x.region === r ? stars[x.id] || 0 : 0); }, 0);
  }
  // A region opens on stars, so nobody is stuck behind one route. Inside a
  // region a route opens once either of the two before it has a star.
  function isOpen(id, stars) {
    var d = findDelivery(id);
    if (d.region > 0 && regionStars(d.region - 1, stars) < BALANCE.regionStars) return false;
    if (d.index === 0) return true;
    var region = DELIVERIES.filter(function (x) { return x.region === d.region; });
    return (stars[region[d.index - 1].id] || 0) > 0 || (d.index > 1 && (stars[region[d.index - 2].id] || 0) > 0);
  }

  return {
    STEP: STEP, BALANCE: BALANCE, REGIONS: REGIONS, ROUTES: ROUTES, DELIVERIES: DELIVERIES, UPGRADES: UPGRADES, MAX_LEVEL: MAX_LEVEL,
    TRUCKS: TRUCKS, CARGO_TYPES: CARGO_TYPES, CONTRACTS: CONTRACTS, truckSpec: truckSpec, dimsFor: dimsFor, DIM: DIM, SAMPLE: SAMPLE,
    cargoSize: cargoSize, createGame: createGame, report: report, upgradeCost: upgradeCost, isOpen: isOpen, regionStars: regionStars,
    findDelivery: findDelivery, dailyDelivery: dailyDelivery, longHaul: longHaul, parTime: parTime, medalTimes: medalTimes,
    contractsFor: contractsFor, ghostPath: ghostPath, featureAt: featureAt,
    heightAt: heightAt, normalAngle: normalAngle, hash: hash, rng: rng
  };
});
