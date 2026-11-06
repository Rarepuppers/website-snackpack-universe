/* Snack Haul rules and physics. No DOM and no storage, so dev/sim.js can drive
 * real deliveries in Node and the file can move to the Android app as it is.
 * Physics: Planck.js (Box2D), vendored in vendor/. Units are metres and seconds.
 * The game plays on a 2D side-on plane; render3d.js draws that plane in 3D. */
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
    cargoPay: { crate: 6, eggs: 10, jelly: 8, milk: 8 },
    eggBreak: 2.6,
    ballast: 2.4,                  // low weight under the bed, which keeps flips earned
    strapReact: 0,
    strapHold: 0.3,                // share of a crate's weight pressed down, per Straps level
    flipSeconds: 1.6,
    stallSeconds: 2.5,
    stopSeconds: 0.7,
    stopSpeed: 0.7,
    parSpeed: 5.5,                 // metres a second for the Express bonus
    expressPay: 12,
    dailyPay: 40
  };

  var REGIONS = [
    { id: "bakery", name: "Bakery Hills", blurb: "Gentle hills and good grip.", friction: 1.0, amp: 1.0, wave: 1.0, rough: 0.12, maxSlope: 0.5, pay: 1 },
    { id: "dunes", name: "Dairy Dunes", blurb: "Long dunes and loose sand.", friction: 0.72, amp: 1.5, wave: 1.45, rough: 0.08, maxSlope: 0.55, pay: 1.6 },
    { id: "frost", name: "Frosty Pass", blurb: "Steep ice. Brake early.", friction: 0.42, amp: 1.7, wave: 1.15, rough: 0.16, maxSlope: 0.6, pay: 2.4 },
    { id: "chilli", name: "Chilli Ridge", blurb: "Rough rock, sharp crests and a hot road.", friction: 0.85, amp: 1.9, wave: 0.9, rough: 0.22, maxSlope: 0.62, pay: 3.4 }
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

  // Early regions rise more gently, so the free region never turns into a wall.
  function regionHeat(heat, r) { return heat * (0.8 + r * 0.075) + r * 0.04; }

  var DELIVERIES = [];
  REGIONS.forEach(function (region, r) {
    ROUTES.forEach(function (route, i) {
      DELIVERIES.push({ id: region.id + "-" + (i + 1), region: r, index: i, len: route.len, heat: regionHeat(route.heat, r), load: route.load });
    });
  });

  var UPGRADES = [
    { id: "engine", name: "Engine", icon: "🔧", desc: "More pull on the climbs, and more top speed." },
    { id: "suspension", name: "Suspension", icon: "🛞", desc: "Softer landings, and fewer cracked eggs." },
    { id: "tyres", name: "Tyres", icon: "⚙️", desc: "Better grip on sand and ice." },
    { id: "straps", name: "Cargo Straps", icon: "🪢", desc: "Taller rails, and crates held down." },
    { id: "tank", name: "Fuel Tank", icon: "⛽", desc: "Drive further on a full tank." }
  ];
  var UPGRADE_COST = [30, 70, 140, 260, 450];
  var MAX_LEVEL = UPGRADE_COST.length;

  // Offsets from the Rusty Pickup, which is the baseline for all tuning.
  var TRUCKS = [
    { id: "pickup", name: "Rusty Pickup", cost: 0, desc: "Honest, cheap and easy to handle.", bedHalf: 1.75, perRow: 4, wheelR: 0.5, rearX: -1.1, frontX: 1.2, torque: 1, top: 0, weight: 1, rail: 0, soft: 0, pay: 1, stats: { speed: 2, grip: 2, load: 2 } },
    { id: "van", name: "Bread Van", cost: 420, desc: "High sides keep crates in, but it rolls on steep ground.", bedHalf: 1.75, perRow: 4, wheelR: 0.5, rearX: -1.1, frontX: 1.2, torque: 1.15, top: -1.2, weight: 1.25, rail: 0.42, soft: 0, pay: 1, stats: { speed: 1, grip: 2, load: 4 } },
    { id: "buggy", name: "Dune Buggy", cost: 680, desc: "Fast and grippy on sand, but it flips on steep ground.", bedHalf: 1.6, perRow: 4, wheelR: 0.62, rearX: -1.05, frontX: 1.12, torque: 1.2, top: 2.6, weight: 1, rail: 0.28, soft: 0.5, hold: 0.45, pay: 1, stats: { speed: 4, grip: 4, load: 1 } },
    { id: "hauler", name: "Long Hauler", cost: 1500, desc: "Long and strong. Pays 20% more on every load.", bedHalf: 2.25, perRow: 5, wheelR: 0.56, rearX: -1.55, frontX: 1.65, torque: 1.35, top: -0.8, weight: 1.35, rail: 0.1, soft: 0, pay: 1.2, stats: { speed: 2, grip: 3, load: 3 } }
  ];

  function truckSpec(id) { return TRUCKS.filter(function (t) { return t.id === id; })[0] || TRUCKS[0]; }

  function dimsFor(t) {
    var cabX = t.bedHalf - 0.6;
    return {
      bedHalf: t.bedHalf, bedHeight: 0.14, cabX: cabX, cabHalfX: 0.55, cabHalfY: 0.56, cabY: 0.68,
      wheelR: t.wheelR, rearX: t.rearX, frontX: t.frontX, axleY: -0.58 - (t.wheelR - 0.5) * 0.7,
      crate: 0.52, bedLeft: -t.bedHalf + 0.09, bedRight: cabX - 0.59
    };
  }
  var DIM = dimsFor(TRUCKS[0]);

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
    var r = rng(hash(d.id + "coins")), coins = [], cans = [], rocks = [];
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
    // Road hazards start on the middle routes: a jolt, never a wall.
    if (d.heat >= 0.68) {
      var gap = 58 - d.heat * 18;
      for (var rx = START_FLAT + 36; rx < terrain.total - END_FLAT - 22; rx += gap + r() * gap) {
        var size = 0.2 + r() * 0.12 * Math.min(1.3, d.heat);
        rocks.push({ x: rx, r: size, y: heightAt(terrain, rx) + size * 0.25 });
      }
    }
    return { coins: coins, cans: cans, rocks: rocks };
  }

  // ════ Deliveries ═════════════════════════════════════════════════
  function findDelivery(id) {
    return DELIVERIES.filter(function (x) { return x.id === id; })[0] || null;
  }
  // One shared route a day. maxRegion keeps it inside what a player has reached.
  function dailyDelivery(date, maxRegion) {
    var h = hash("daily" + date), region = h % (Math.max(0, maxRegion) + 1), index = 1 + (h >>> 8) % 4;
    var route = ROUTES[index];
    return { id: "daily-" + date, daily: true, region: region, index: index, len: route.len, heat: regionHeat(route.heat, region), load: route.load };
  }
  function parTime(d) { return Math.round((START_FLAT + d.len + END_FLAT) / BALANCE.parSpeed); }

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
    pick.rocks.forEach(function (rock) {
      ground.createFixture({ shape: new planck.Circle({ x: rock.x, y: rock.y }, rock.r), friction: 0.9 });
    });

    var rail = 0.2 + 0.14 * up.straps + spec.rail;
    var strapHold = BALANCE.strapHold * up.straps + (spec.hold || 0);
    var eggBreak = BALANCE.eggBreak * (1 + 0.16 * up.suspension + 0.16 * up.straps);
    var GROUP = { filterGroupIndex: -1 };
    var spawnX = 8;
    var spawnY = heightAt(terrain, spawnX) + 0.75 + spec.wheelR;
    var truck = world.createBody({ type: "dynamic", position: { x: spawnX, y: spawnY } });
    truck.setUserData({ kind: "truck" });
    function part(shape, density) {
      truck.createFixture(Object.assign({ shape: shape, density: density * spec.weight, friction: 0.5 }, GROUP));
    }
    part(new planck.Box(D.bedHalf, D.bedHeight, { x: 0, y: 0 }, 0), 2.2);
    part(new planck.Box(D.cabHalfX, D.cabHalfY, { x: D.cabX, y: D.cabY }, 0), 0.8);
    part(new planck.Box(D.bedHalf * 0.7, 0.1, { x: 0, y: -0.28 }, 0), BALANCE.ballast);
    part(new planck.Box(0.05, rail / 2, { x: -D.bedHalf + 0.03, y: D.bedHeight + rail / 2 }, 0), 0.4);

    function wheel(x) {
      var w = world.createBody({ type: "dynamic", position: { x: spawnX + x, y: spawnY + D.axleY } });
      w.setUserData({ kind: "wheel", touching: 0 });
      w.createFixture(Object.assign({ shape: new planck.Circle(D.wheelR), density: 1.1, friction: 1 + 0.25 * up.tyres + (spec.id === "buggy" ? 0.3 : 0), filterMaskBits: 0xFFFF ^ CARGO_BIT }, GROUP));
      return world.createJoint(new planck.WheelJoint({
        enableMotor: true, motorSpeed: 0, maxMotorTorque: 0,
        frequencyHz: Math.max(1.8, 5 - 0.45 * up.suspension - spec.soft), dampingRatio: 0.6 + 0.04 * up.suspension
      }, truck, w, w.getPosition(), { x: 0, y: 1 }));
    }
    var rearJoint = wheel(D.rearX), frontJoint = wheel(D.frontX);
    var wheels = [rearJoint.getBodyB(), frontJoint.getBodyB()];

    // Stack the load on the bed, front of the bed first.
    var cargo = d.load.map(function (type, i) {
      var row = Math.floor(i / spec.perRow), col = i % spec.perRow;
      var size = D.crate;
      var x = spawnX + D.bedRight - size * (col + 0.55) - col * 0.015;
      var y = spawnY + D.bedHeight + size * (row + 0.5) + row * 0.012 + 0.01;
      var body = world.createBody({ type: "dynamic", position: { x: x, y: y } });
      var info = { kind: "cargo", type: type, lost: false, broken: false, body: body, id: i };
      body.setUserData(info);
      body.createFixture({
        shape: new planck.Box(size / 2 - 0.005, size / 2 - 0.005),
        density: type === "milk" ? 2.6 : 0.9,
        friction: 0.5 + 0.1 * up.straps,
        restitution: type === "jelly" ? 0.55 : 0.04,
        filterCategoryBits: CARGO_BIT
      });
      return info;
    });

    var g = {
      delivery: d, region: region, regionIndex: d.region, terrain: terrain, world: world, truck: truck, wheels: wheels,
      cargo: cargo, coins: pick.coins, cans: pick.cans, rocks: pick.rocks, rail: rail, upgrades: up, spec: spec, dim: D,
      status: "driving", reason: null, time: 0, coinsTaken: 0, par: parTime(d),
      fuel: BALANCE.tankSeconds + 9 * up.tank, maxFuel: BALANCE.tankSeconds + 9 * up.tank,
      events: [], settle: 0.5, airTime: 0, bestAir: 0, topSpeed: 0, flipsNearly: 0, slipRear: 0, gasOn: false, brakeOn: false
    };
    var topSpeed = (BALANCE.topSpeed + spec.top + 1.15 * up.engine) / D.wheelR;
    var torque = BALANCE.torque * spec.torque * (1 + 0.2 * up.engine);
    var flipTimer = 0, stallTimer = 0, stopTimer = 0;
    var need = Math.ceil(cargo.length * BALANCE.passShare);
    var wasGrounded = true;

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

    function finish(status, reason) {
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
      g.gasOn = gas && !brake; g.brakeOn = brake;
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
      var isGrounded = grounded();
      if (!isGrounded) {
        if (gas && !brake) truck.applyTorque(BALANCE.airTorque);
        else if (brake) truck.applyTorque(-BALANCE.airTorque);
        g.airTime += STEP;
        g.bestAir = Math.max(g.bestAir, g.airTime);
      } else {
        if (!wasGrounded && g.airTime > 0.22) {
          var wp = wheels[0].getPosition();
          g.events.push({ type: "land", air: g.airTime, x: wp.x, y: wp.y });
        }
        g.airTime = 0;
      }
      wasGrounded = isGrounded;
      // Straps press anything still on the bed down towards the truck.
      if (strapHold > 0) {
        var down = truck.getWorldVector({ x: 0, y: -1 });
        cargo.forEach(function (c) {
          if (c.lost || c.broken) return;
          var local = truck.getLocalPoint(c.body.getPosition());
          if (local.x < D.bedLeft - 0.2 || local.x > D.bedRight + 0.2 || local.y < 0 || local.y > 1.7) return;
          var pull = c.body.getMass() * BALANCE.gravity * strapHold;
          c.body.applyForceToCenter({ x: down.x * pull, y: down.y * pull }, true);
          // Part of the pull comes back on the truck, so straps steady it without
          // adding so much weight that it beaches on steep climbs.
          var back = pull * BALANCE.strapReact;
          truck.applyForce({ x: -down.x * back, y: -down.y * back }, c.body.getPosition(), true);
        });
      }
      world.step(STEP);

      // How much the rear tyre is spinning against the road: drives the dust.
      var rearSurface = -wheels[0].getAngularVelocity() * D.wheelR;
      g.slipRear = wheels[0].getUserData().touching > 0 ? Math.abs(rearSurface - truck.getLinearVelocity().x) : 0;

      // Pickups
      var pos = truck.getPosition();
      g.coins.forEach(function (c) {
        if (!c.taken && Math.abs(c.x - pos.x) < 2.1 && Math.abs(c.y - pos.y) < 2.6) {
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
      g.topSpeed = Math.max(g.topSpeed, speedNow);
      g.stuckTime = gas && speedNow < 0.25 ? (g.stuckTime || 0) + STEP : 0;
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
    g.inZone = function () { var x = truck.getPosition().x; return x > terrain.zoneStart && x < terrain.zoneEnd; };
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
    var region = g.region, pay = 0, kinds = { crate: 0, eggs: 0, jelly: 0, milk: 0 };
    g.cargo.forEach(function (c) {
      if (!c.lost && !c.broken) { pay += BALANCE.cargoPay[c.type]; kinds[c.type] += 1; }
    });
    pay = Math.round(pay * region.pay * g.spec.pay);
    var share = kept / total;
    var stars = g.status !== "done" ? 0 : share >= 1 ? 3 : share >= 0.75 ? 2 : 1;
    var lines = [];
    var coins = Math.round(g.coinsTaken * BALANCE.coinValue);
    var express = g.status === "done" && stars >= 2 && g.time <= g.par;
    if (g.status === "done") {
      lines.push({ label: kept + " of " + total + " delivered", coins: pay });
      if (stars === 3) lines.push({ label: "Whole load intact", coins: Math.round(10 * region.pay) });
      if (express) lines.push({ label: "Express: beat " + g.par + "s", coins: Math.round(BALANCE.expressPay * region.pay) });
      if (g.delivery.daily && !g.delivery.paid) lines.push({ label: "Daily delivery", coins: BALANCE.dailyPay });
    }
    if (coins) lines.push({ label: "Coins on the road", coins: coins });
    return {
      status: g.status, reason: g.reason, kept: kept, total: total, stars: stars, time: g.time, express: express,
      par: g.par, kinds: kinds, bestAir: g.bestAir, topSpeed: g.topSpeed, truck: g.spec.id,
      lines: lines, earned: lines.reduce(function (n, l) { return n + l.coins; }, 0)
    };
  }

  function upgradeCost(level) { return level >= MAX_LEVEL ? null : UPGRADE_COST[level]; }
  // A route opens once the one before has a star; a region once the last is cleared.
  function isOpen(id, stars) {
    var d = findDelivery(id);
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
    TRUCKS: TRUCKS, truckSpec: truckSpec, dimsFor: dimsFor, DIM: DIM, SAMPLE: SAMPLE,
    createGame: createGame, report: report, upgradeCost: upgradeCost, isOpen: isOpen,
    findDelivery: findDelivery, dailyDelivery: dailyDelivery, parTime: parTime,
    heightAt: heightAt, normalAngle: normalAngle, hash: hash, rng: rng
  };
});
