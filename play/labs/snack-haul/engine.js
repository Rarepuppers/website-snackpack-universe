/* Snack Haul rules and physics. No DOM and no storage, so dev/sim.js can drive
 * real deliveries in Node and the file can move to the Android app as it is.
 * Physics: Planck.js (Box2D), vendored in vendor/. Units are metres and seconds. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./vendor/planck-1.5.1.min.js"));
  else root.SnackHaul = factory(root.planck);
})(typeof self !== "undefined" ? self : this, function (planck) {
  "use strict";

  var STEP = 1 / 60;

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
    cargoPay: { crate: 6, eggs: 10, jelly: 8, milk: 8 },
    eggBreak: 2.6,
    strapHold: 0.3,                // share of a crate's weight pressed down, per Straps level
    flipSeconds: 1.6,
    stallSeconds: 2.5,
    stopSeconds: 0.7,
    stopSpeed: 0.7
  };

  var REGIONS = [
    { id: "bakery", name: "Bakery Hills", friction: 1.0, amp: 1.0, wave: 1.0, rough: 0.12, maxSlope: 0.5, pay: 1,
      sky: ["#ffd9a0", "#ffeed2"], far: "#e7b37c", near: "#c98f56", ground: "#7a9a4a", dirt: "#7a5a3c" },
    { id: "dunes", name: "Dairy Dunes", friction: 0.72, amp: 1.5, wave: 1.45, rough: 0.08, maxSlope: 0.55, pay: 1.6,
      sky: ["#a9dcf2", "#fdf1cf"], far: "#f1d596", near: "#e3bd76", ground: "#efd08a", dirt: "#c79a58" },
    { id: "frost", name: "Frosty Pass", friction: 0.42, amp: 1.7, wave: 1.15, rough: 0.16, maxSlope: 0.6, pay: 2.4,
      sky: ["#31466f", "#a8c7e6"], far: "#7f9dc4", near: "#5f7fa8", ground: "#eef6ff", dirt: "#9bb4cf" }
  ];

  // length in metres, then the load. Crate rows are stacked in this order.
  var ROUTES = [
    { len: 130, heat: 0.45, load: ["crate", "crate", "crate", "crate"] },
    { len: 170, heat: 0.6, load: ["crate", "crate", "crate", "crate", "crate"] },
    { len: 200, heat: 0.7, load: ["crate", "eggs", "crate", "eggs", "crate"] },
    { len: 240, heat: 0.85, load: ["crate", "crate", "eggs", "crate", "crate", "eggs"] },
    { len: 270, heat: 0.95, load: ["milk", "crate", "crate", "milk", "eggs", "crate"] },
    { len: 310, heat: 1.05, load: ["milk", "crate", "jelly", "milk", "eggs", "jelly", "crate"] }
  ];

  var DELIVERIES = [];
  REGIONS.forEach(function (region, r) {
    ROUTES.forEach(function (route, i) {
      DELIVERIES.push({ id: region.id + "-" + (i + 1), region: r, index: i, len: route.len, heat: route.heat + r * 0.04, load: route.load });
    });
  });

  var UPGRADES = [
    { id: "engine", name: "Engine", icon: "🔧", desc: "More pull on the climbs, and more top speed." },
    { id: "suspension", name: "Suspension", icon: "🛞", desc: "Softer landings, and fewer crates thrown about." },
    { id: "tyres", name: "Tyres", icon: "⚙️", desc: "Better grip on sand and ice." },
    { id: "straps", name: "Cargo Straps", icon: "🪢", desc: "Taller rails and grippier crates." },
    { id: "tank", name: "Fuel Tank", icon: "⛽", desc: "Drive further on a full tank." }
  ];
  var UPGRADE_COST = [30, 70, 140, 260, 450];
  var MAX_LEVEL = UPGRADE_COST.length;

  var DIM = {
    bedHalf: 1.75, bedHeight: 0.14, cabX: 1.15, cabHalfX: 0.55, cabHalfY: 0.56, cabY: 0.68,
    wheelR: 0.5, rearX: -1.1, frontX: 1.2, axleY: -0.58,
    crate: 0.52, bedLeft: -1.66, bedRight: 0.56
  };

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

  function buildTerrain(d) {
    var region = REGIONS[d.region], r = rng(hash(d.id));
    var layers = [
      { len: 62 * region.wave, amp: 3.4, ph: r() * 7 },
      { len: 31 * region.wave, amp: 1.7, ph: r() * 7 },
      { len: 13, amp: 0.55, ph: r() * 7 },
      { len: 5.5, amp: region.rough, ph: r() * 7 }
    ];
    var total = START_FLAT + d.len + END_FLAT;
    var pts = [], maxSlope = region.maxSlope * Math.min(1, 0.65 + d.heat * 0.4);
    var last = 0;
    for (var x = 0; x <= total; x += SAMPLE) {
      var edge = Math.min((x - START_FLAT) / 28, (START_FLAT + d.len - x) / 28);
      var env = Math.max(0, Math.min(1, edge));
      env = env * env * (3 - 2 * env);
      var y = 0;
      layers.forEach(function (l) { y += l.amp * Math.sin((x / l.len) * Math.PI * 2 + l.ph); });
      y *= env * region.amp * d.heat;
      // Keep every slope driveable, then ease back to level at the far end.
      var step = maxSlope * SAMPLE;
      y = Math.max(last - step, Math.min(last + step, y));
      pts.push({ x: x, y: y });
      last = y;
    }
    var endY = last;
    for (var k = pts.length - 1, n = 0; k >= 0 && n < END_FLAT / SAMPLE; k--, n++) pts[k].y = endY;
    // The run-in to the flat can hold a step after the clamp above: smooth it.
    for (var pass = 0; pass < 3; pass++) {
      for (var i = pts.length - 2; i > 0; i--) {
        if (pts[i].x < START_FLAT) break;
        var limit = maxSlope * SAMPLE;
        pts[i].y = Math.max(pts[i + 1].y - limit, Math.min(pts[i + 1].y + limit, pts[i].y));
      }
    }
    return { pts: pts, total: total, zoneStart: total - 16, zoneEnd: total - 1.5 };
  }
  function heightAt(terrain, x) {
    var p = terrain.pts, i = Math.max(0, Math.min(p.length - 2, Math.floor(x / SAMPLE)));
    var t = (x - p[i].x) / SAMPLE;
    return p[i].y + (p[i + 1].y - p[i].y) * t;
  }

  function buildPickups(d, terrain) {
    var r = rng(hash(d.id + "coins")), coins = [], cans = [];
    for (var x = START_FLAT + 22; x < terrain.total - END_FLAT - 12; x += 26 + r() * 16) {
      var count = 3 + Math.floor(r() * 3);
      for (var c = 0; c < count; c++) {
        var cx = x + c * 1.5;
        coins.push({ x: cx, y: heightAt(terrain, cx) + 2.1, taken: false });
      }
    }
    for (var f = BALANCE.canEvery; f < terrain.total - END_FLAT - 10; f += BALANCE.canEvery) {
      var fx = START_FLAT + f;
      cans.push({ x: fx, y: heightAt(terrain, fx) + 1.5, taken: false });
    }
    return { coins: coins, cans: cans };
  }

  // ════ A delivery in progress ═════════════════════════════════════
  function createGame(opts) {
    var d = DELIVERIES.filter(function (x) { return x.id === opts.id; })[0];
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

    var rail = 0.2 + 0.14 * up.straps;
    var strapHold = BALANCE.strapHold * up.straps;
    var eggBreak = BALANCE.eggBreak * (1 + 0.16 * up.suspension + 0.16 * up.straps);
    var GROUP = { filterGroupIndex: -1 };
    var spawnY = heightAt(terrain, 8) + 1.25;
    var truck = world.createBody({ type: "dynamic", position: { x: 8, y: spawnY } });
    truck.setUserData({ kind: "truck" });
    function part(shape, density) {
      truck.createFixture(Object.assign({ shape: shape, density: density, friction: 0.5 }, GROUP));
    }
    part(new planck.Box(DIM.bedHalf, DIM.bedHeight, { x: 0, y: 0 }, 0), 2.2);
    part(new planck.Box(DIM.cabHalfX, DIM.cabHalfY, { x: DIM.cabX, y: DIM.cabY }, 0), 0.8);
    part(new planck.Box(0.05, rail / 2, { x: -DIM.bedHalf + 0.03, y: DIM.bedHeight + rail / 2 }, 0), 0.4);

    function wheel(x) {
      var w = world.createBody({ type: "dynamic", position: { x: 8 + x, y: spawnY + DIM.axleY } });
      w.setUserData({ kind: "wheel", touching: 0 });
      w.createFixture(Object.assign({ shape: new planck.Circle(DIM.wheelR), density: 1.1, friction: 1 + 0.25 * up.tyres }, GROUP));
      return world.createJoint(new planck.WheelJoint({
        enableMotor: true, motorSpeed: 0, maxMotorTorque: 0,
        frequencyHz: 5 - 0.45 * up.suspension, dampingRatio: 0.6 + 0.04 * up.suspension
      }, truck, w, w.getPosition(), { x: 0, y: 1 }));
    }
    var rearJoint = wheel(DIM.rearX), frontJoint = wheel(DIM.frontX);
    var wheels = [rearJoint.getBodyB(), frontJoint.getBodyB()];

    // Stack the load on the bed: four to a row, front of the bed first.
    var cargo = d.load.map(function (type, i) {
      var perRow = 4, row = Math.floor(i / perRow), col = i % perRow;
      var size = DIM.crate;
      var x = 8 + DIM.bedRight - size * (col + 0.55) - col * 0.015;
      var y = spawnY + DIM.bedHeight + size * (row + 0.5) + row * 0.012 + 0.01;
      var body = world.createBody({ type: "dynamic", position: { x: x, y: y } });
      var info = { kind: "cargo", type: type, lost: false, broken: false, body: body };
      body.setUserData(info);
      body.createFixture({
        shape: new planck.Box(size / 2 - 0.005, size / 2 - 0.005),
        density: type === "milk" ? 2.6 : 0.9,
        friction: 0.5 + 0.1 * up.straps,
        restitution: type === "jelly" ? 0.55 : 0.04
      });
      return info;
    });

    var g = {
      delivery: d, region: region, terrain: terrain, world: world, truck: truck, wheels: wheels,
      cargo: cargo, coins: pick.coins, cans: pick.cans, rail: rail, upgrades: up,
      status: "driving", reason: null, time: 0, coinsTaken: 0,
      fuel: BALANCE.tankSeconds + 9 * up.tank, maxFuel: BALANCE.tankSeconds + 9 * up.tank,
      events: [], settle: 0.5
    };
    var topSpeed = (BALANCE.topSpeed + 1.15 * up.engine) / DIM.wheelR;
    var torque = BALANCE.torque * (1 + 0.2 * up.engine);
    var flipTimer = 0, stallTimer = 0, stopTimer = 0;
    var need = Math.ceil(cargo.length * BALANCE.passShare);

    function tagged(contact, kind) {
      var a = contact.getFixtureA().getBody().getUserData();
      var b = contact.getFixtureB().getBody().getUserData();
      if (a && a.kind === kind) return { self: a, other: b };
      if (b && b.kind === kind) return { self: b, other: a };
      return null;
    }
    world.on("begin-contact", function (c) {
      var hit = tagged(c, "cargo");
      if (hit && hit.other && hit.other.kind === "ground" && !hit.self.lost && !hit.self.broken) {
        if (g.settle <= 0) { hit.self.lost = true; g.events.push({ type: "lost", cargo: hit.self.type }); }
      }
      var w = tagged(c, "wheel");
      if (w && w.other && w.other.kind === "ground") w.self.touching += 1;
    });
    world.on("end-contact", function (c) {
      var w = tagged(c, "wheel");
      if (w && w.other && w.other.kind === "ground") w.self.touching = Math.max(0, w.self.touching - 1);
    });
    world.on("post-solve", function (c, impulse) {
      var hit = tagged(c, "cargo");
      if (!hit || hit.self.type !== "eggs" || hit.self.broken || hit.self.lost || g.settle > 0) return;
      var hardest = Math.max.apply(null, impulse.normalImpulses);
      if (hardest > eggBreak) {
        hit.self.broken = true;
        g.events.push({ type: "broken", cargo: "eggs" });
      }
    });

    function liveCargo() { return cargo.filter(function (c) { return !c.lost && !c.broken; }).length; }
    function grounded() { return wheels.some(function (w) { return w.getUserData().touching > 0; }); }

    function finish(status, reason) {
      g.status = status; g.reason = reason;
      rearJoint.setMotorSpeed(0); frontJoint.setMotorSpeed(0);
      g.events.push({ type: status });
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
      var vx = truck.getLinearVelocity().x;
      if (gas && !brake) {
        rearJoint.setMotorSpeed(-topSpeed); rearJoint.setMaxMotorTorque(torque);
        frontJoint.setMotorSpeed(-topSpeed); frontJoint.setMaxMotorTorque(torque * 0.5);
        g.fuel = Math.max(0, g.fuel - STEP);
      } else if (brake) {
        // Brakes while rolling forward, then a gentle reverse.
        var back = vx < 0.6;
        var speed = back ? topSpeed * 0.35 : 0;
        rearJoint.setMotorSpeed(speed); rearJoint.setMaxMotorTorque(back ? torque * 0.6 : torque * 2);
        frontJoint.setMotorSpeed(speed); frontJoint.setMaxMotorTorque(back ? torque * 0.3 : torque * 2);
        if (back) g.fuel = Math.max(0, g.fuel - STEP * 0.5);
      } else {
        rearJoint.setMotorSpeed(0); rearJoint.setMaxMotorTorque(0.4);
        frontJoint.setMotorSpeed(0); frontJoint.setMaxMotorTorque(0.4);
      }
      if (!grounded()) {
        if (gas && !brake) truck.applyTorque(BALANCE.airTorque);
        else if (brake) truck.applyTorque(-BALANCE.airTorque);
      }
      // Straps press anything still on the bed down towards the truck.
      if (strapHold > 0) {
        var down = truck.getWorldVector({ x: 0, y: -1 });
        cargo.forEach(function (c) {
          if (c.lost || c.broken) return;
          var local = truck.getLocalPoint(c.body.getPosition());
          if (local.x < DIM.bedLeft - 0.2 || local.x > DIM.bedRight + 0.2 || local.y < 0 || local.y > 1.7) return;
          var pull = c.body.getMass() * BALANCE.gravity * strapHold;
          c.body.applyForceToCenter({ x: down.x * pull, y: down.y * pull }, true);
        });
      }
      world.step(STEP);

      // Pickups
      var pos = truck.getPosition();
      g.coins.forEach(function (c) {
        if (!c.taken && Math.abs(c.x - pos.x) < 2.1 && Math.abs(c.y - pos.y) < 2.6) {
          c.taken = true; g.coinsTaken += 1; g.events.push({ type: "coin" });
        }
      });
      g.cans.forEach(function (c) {
        if (!c.taken && Math.abs(c.x - pos.x) < 2.2 && Math.abs(c.y - pos.y) < 3) {
          c.taken = true; g.fuel = Math.min(g.maxFuel, g.fuel + BALANCE.canSeconds); g.events.push({ type: "fuel" });
        }
      });

      // A crate that falls through a gap in the physics still counts as lost.
      cargo.forEach(function (c) {
        if (!c.lost && c.body.getPosition().y < heightAt(terrain, c.body.getPosition().x) - 2) c.lost = true;
      });

      var speedNow = truck.getLinearVelocity().length();
      if (liveCargo() < need) { finish("failed", "load"); return; }

      var angle = Math.abs(normalAngle(truck.getAngle()));
      flipTimer = angle > 2 && speedNow < 3 ? flipTimer + STEP : 0;
      if (flipTimer > BALANCE.flipSeconds) { finish("failed", "flip"); return; }

      stallTimer = g.fuel <= 0 && speedNow < 0.4 ? stallTimer + STEP : 0;
      if (stallTimer > BALANCE.stallSeconds) { finish("failed", "fuel"); return; }

      var inZone = pos.x > terrain.zoneStart && pos.x < terrain.zoneEnd;
      stopTimer = inZone && speedNow < BALANCE.stopSpeed && angle < 0.7 ? stopTimer + STEP : 0;
      if (stopTimer > BALANCE.stopSeconds) finish("done", "delivered");
    };
    g.stopProgress = function () { return Math.min(1, stopTimer / BALANCE.stopSeconds); };
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
    var total = g.cargo.length, kept = g.live();
    var region = g.region, pay = 0;
    g.cargo.forEach(function (c) {
      if (!c.lost && !c.broken) pay += BALANCE.cargoPay[c.type];
    });
    pay = Math.round(pay * region.pay);
    var share = kept / total;
    var stars = g.status !== "done" ? 0 : share >= 1 ? 3 : share >= 0.75 ? 2 : 1;
    var lines = [];
    var coins = Math.round(g.coinsTaken * BALANCE.coinValue);
    if (g.status === "done") {
      lines.push({ label: kept + " of " + total + " delivered", coins: pay });
      if (stars === 3) lines.push({ label: "Whole load intact", coins: Math.round(10 * region.pay) });
    }
    if (coins) lines.push({ label: "Coins on the road", coins: coins });
    return {
      status: g.status, reason: g.reason, kept: kept, total: total, stars: stars, time: g.time,
      lines: lines, earned: lines.reduce(function (n, l) { return n + l.coins; }, 0)
    };
  }

  function upgradeCost(level) { return level >= MAX_LEVEL ? null : UPGRADE_COST[level]; }
  // A region opens once every delivery in the one before has at least one star.
  function isOpen(id, stars) {
    var d = DELIVERIES.filter(function (x) { return x.id === id; })[0];
    if (d.index > 0) {
      var prev = DELIVERIES.filter(function (x) { return x.region === d.region && x.index === d.index - 1; })[0];
      return (stars[prev.id] || 0) > 0;
    }
    if (d.region === 0) return true;
    return DELIVERIES.filter(function (x) { return x.region === d.region - 1; })
      .every(function (x) { return (stars[x.id] || 0) > 0; });
  }

  return {
    STEP: STEP, BALANCE: BALANCE, REGIONS: REGIONS, DELIVERIES: DELIVERIES, UPGRADES: UPGRADES, MAX_LEVEL: MAX_LEVEL,
    DIM: DIM, createGame: createGame, report: report, upgradeCost: upgradeCost, isOpen: isOpen,
    heightAt: heightAt, normalAngle: normalAngle
  };
});
