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
    cargoPay: { crate: 6, eggs: 10, jelly: 8, milk: 8, melon: 9, cake: 14, popcorn: 7, icecream: 12, baguette: 9, cheese: 12, pizza: 7, soda: 9 },
    baguetteDensity: 0.45,         // light, long loaves
    baguetteGrip: 0.55,            // crust on crate: steep climbs slide them off; Straps 1 (the farm gift) holds a start
    fizzPop: 1,                    // soda fizz that pops the crate; shake adds it, smooth driving bleeds it
    fizzBleed: 0.12,               // fizz lost per second
    fizzFrom: 0.35,                // contact impulse a soda crate shrugs off
    fizzGain: 0.6,                 // fizz per unit of impulse above that
    eggBreak: 2.6,
    ballast: 2.4,                  // low weight under the bed, which keeps flips earned
    valleyBend: 0.3,               // how fast a valley floor may turn upward, in slope per metre
    strapReact: 0,
    strapHold: 0.3,                // share of a crate's weight pressed down, per Straps level
    flipSeconds: 1.6,
    stallSeconds: 2.5,
    stopSeconds: 0.7,
    stopSpeed: 0.7,
    dockSpeed: 2,                  // hitting the depot wall faster than this costs the medal
    parSpeed: 5.5,                 // metres a second for the gold medal
    silver: 1.25,                  // medal times, as multiples of the gold time
    bronze: 1.6,
    careerSilver: 1.25,            // the same for routes with a gold time of their own
    careerBronze: 1.7,
    expressPay: 12,
    dailyPay: 40,
    regionStars: 14,               // stars in a region that open the next one
    slick: 0.6,                    // share of normal grip on ice and wet cobbles
    fordDrag: 2,
    hayDrag: 0.9,                  // drag while ploughing through a smashed hay stack
    duckPenalty: 2,                // seconds added for driving into the ducks
    bridgeBounce: 0.45,
    popLiftFrom: 6.5,              // popcorn starts to lift above this speed
    popLift: 0.35,
    cakeTilt: 0.6,                 // radians off upright before a cake is ruined
    meltFloor: 1 / 3,              // ice cream pay at 1.5 times the length-based par time
    longLen: 2500,                 // long enough that nobody reaches the end; heat keeps climbing
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
  // Seasonal regions stay outside the permanent region, route and goal totals.
  var NORTH_POLE = { id: "northpole", name: "North Pole", friction: 0.60, amp: 0.85, wave: 1.4,
    rough: 0.06, maxSlope: 0.37, pay: 2, features: ["drift", "slick"], kinds: ["present", "sack", "pudding"] };
  var EVENTS = [{ id: "winter", name: "Winter Haul", start: "12-01", end: "01-06", region: REGIONS.length,
    vehicle: "sleigh", cargo: NORTH_POLE.kinds, music: "music_northpole", advent: true }];
  function activeEvent(date) {
    if (!date || !Number.isFinite(date.getTime())) return null;
    var month = date.getMonth() + 1, day = date.getDate();
    var key = String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    var event = EVENTS.find(function (e) { return e.start <= e.end ? key >= e.start && key <= e.end : key >= e.start || key <= e.end; });
    if (!event) return null;
    var year = date.getFullYear() - (event.start > event.end && key <= event.end ? 1 : 0);
    return Object.assign({}, event, { key: event.id + year, openDoors: month === 12 ? Math.min(day,24) : 24 });
  }
  function regionFor(index) { return index === EVENTS[0].region ? NORTH_POLE : REGIONS[index]; }

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
  // One name per route, in region order. Route 7 is the long one, 8 the Big Order.
  var ROUTE_NAMES = [
    ["Windmill Lane", "Sourdough Rise", "Egg Farm Drop", "Crumb Corner", "Rolling Pin Ridge", "Muffin Top", "Long Loaf Road", "The Big Bake"],
    ["Creamery Track", "Buttermilk Bowl", "Melon Mile", "Gusty Gap", "Whey Out West", "Churn Ridge", "The Long Dairy", "The Big Churn"],
    ["Jetty Jaunt", "Honeycomb Hop", "Lighthouse Lane", "Tidal Ford", "Wobbly Pier", "Beeswax Bay", "Harbour Loop", "The Big Hive"],
    ["Sleet Street", "Sundae Slope", "Frozen Lake", "Brain Freeze Bend", "Avalanche Gully", "Ski-Jump Crest", "Glacier Run", "The Big Freeze"],
    ["Salsa Switchback", "Popcorn Pass", "Canyon Gap", "Jalape\u00f1o Jump", "Scorched Ridge", "Volcano Ramp", "Ember Trail", "Ghost Pepper Run"],
    ["Lantern Alley", "Cobble Crawl", "Night Bus Hill", "Clock Tower Climb", "Rainy Arcade", "Noodle Stall Dash", "Midnight Mile", "The Last Order"]
  ];
  var FEATURE_LEN = { ramp: 4.5, bridge: 15, ford: 12, slick: 16, wind: 36, bump: 3, pickup: 14, ducks: 3, sails: 2, hay: 2.4, seesaw: 21 };
  // The seesaw bridge: a plank this long tips this far either way on a hinge.
  var SEESAW = { half: 4.5, tilt: 0.16, thick: 0.15, damp: 2 };

  // Early regions rise more gently, so the free region never turns into a wall.
  function regionHeat(heat, r) { var rr = r * 0.75; return heat * (0.8 + rr * 0.075) + rr * 0.04; }
  function loadFor(region, r, i, code) {
    var a = region.kinds ? region.kinds[0] : CARGO_TYPES[1 + (i * 2 + 1) % 7];
    var b = region.kinds ? region.kinds[1] : CARGO_TYPES[1 + (i * 3 + 4) % 7];
    // g, z, p and s are the 1.1 cargo: baguette, cheese wheel, pizza boxes, soda crate.
    var extra = { g: "baguette", z: "cheese", p: "pizza", s: "soda" };
    return code.split("").map(function (ch) { return ch === "a" ? a : ch === "b" ? b : extra[ch] || "crate"; });
  }

  // Roads with their own design, for the routes a new player meets first. heat is
  // the final value. seed picks the base hills. shapes are authored pieces of road
  // (metres along the road): hill, drop, rollers. ramps are placed exactly; arc adds
  // coins only a clean jump reaches. feat is how many more features the seed places.
  // rev is the road's version: a ghost or best time from another version is dropped.
  // `node dev/sim.js opening` proves the targets these roads were built for.
  var ROADS = {
    "bakery-1": { rev: 2, seed: "bakery-1-r2-A350", len: 120, heat: 0.6, load: "cccc", ramps: [{ at: 33, h: 0.44 }, { at: 69, h: 0.48 }], feat: 0 },
    "bakery-2": { rev: 2, seed: "bakery-2-r2-A102", len: 160, heat: 0.52, load: "ccccc", ramps: [{ at: 57, h: 0.45, arc: true }], shapes: [{ type: "drop", at: 78, w: 34, h: 3 }], feat: 1 },
    "bakery-3": { rev: 2, seed: "bakery-3-r2-A2", len: 200, heat: 0.64, load: "cacac", ramps: [{ at: 147, h: 0.36 }], shapes: [{ type: "drop", at: 81, w: 51, h: 11.7 }], feat: 1 },
    "bakery-4": { rev: 2, seed: "bakery-4-r2-A54", len: 230, heat: 0.75, load: "ccacca", ramps: [{ at: 105, h: 0.4 }, { at: 124, h: 0.42 }], feat: 1 },
    "bakery-5": { rev: 2, seed: "bakery-5-r2-A142", len: 270, heat: 0.764, load: "ccccaa", pickup: 2, pickupAt: 149, shapes: [{ type: "rollers", at: 74, w: 36, n: 3, h: 1.5 }], feat: 2 },
    "bakery-6": { rev: 2, seed: "bakery-6-r2-K72", len: 310, heat: 0.797, load: "ccabcac", shapes: [{ type: "hill", at: 115, w: 96, h: 11.1 }], feat: 2 },
    "bakery-7": { rev: 2, seed: "bakery-7-r2-A53", len: 380, heat: 0.743, load: "cbcacac", shapes: [{ type: "hill", at: 96, w: 80, h: 7.5 }, { type: "rollers", at: 244, w: 48, n: 4, h: 1.7 }], feat: 1 },
    "bakery-8": { rev: 2, seed: "bakery-8-r2-A104", len: 340, heat: 0.825, load: "cacbcaca", pickup: 3, pickupAt: 153, ramps: [{ at: 223, h: 0.4 }], shapes: [{ type: "rollers", at: 72, w: 36, n: 3, h: 1.5 }, { type: "drop", at: 253, w: 44, h: 8.5 }], feat: 2 },
    "dunes-1": { rev: 2, seed: "dunes-1-r2-E540", len: 140, heat: 0.64, load: "cccac", ramps: [{ at: 90, h: 0.6 }], shapes: [{ type: "rollers", at: 31, w: 48, n: 2, h: 3 }], feat: 1 },
    "dunes-2": { rev: 2, seed: "dunes-2-r2-F489", len: 180, heat: 0.73, load: "ccaca", ramps: [{ at: 126, h: 0.57 }], shapes: [{ type: "hill", at: 60, w: 47, h: -4 }], feat: 1 },
    "dunes-3": { rev: 2, seed: "dunes-3-r2-B116", len: 200, heat: 0.62, load: "cacac", ramps: [{at: 159, h: 0.55}], shapes: [{type: "rollers", at: 101, w: 41, n: 2, h: 3.9}], feats: [{type: "wind", at: 32, len: 31, power: 0.59}], feat: 0 },
    "harbour-1": { rev: 2, seed: "harbour-1-r2-B44", len: 130, heat: 0.67, load: "cccc", ramps: [{at: 88, h: 0.36}], feats: [{type: "bridge", at: 29}], feat: 1 },
    "harbour-2": { rev: 2, seed: "harbour-2-r2-B125", len: 170, heat: 0.69, load: "ccccc", ramps: [{at: 125, h: 0.43}], feats: [{type: "bridge", at: 34}, {type: "bridge", at: 79}], feat: 0 },
    "harbour-3": { rev: 2, seed: "harbour-3-r2-B256", len: 200, heat: 0.69, load: "cacac", ramps: [{at: 157, h: 0.55}], shapes: [{type: "drop", at: 85, w: 41, h: 9.5}], feats: [{type: "ford", at: 29}], feat: 0 },
    "frost-1": { rev: 2, seed: "frost-1-r2-B105", len: 130, heat: 0.73, load: "cccc", shapes: [{type: "rollers", at: 71, w: 30, n: 2, h: 1.9}], feats: [{type: "slick", at: 33, len: 27}], feat: 0 },
    "frost-2": { rev: 2, seed: "frost-2-r2-B10", len: 170, heat: 0.82, load: "ccccc", ramps: [{at: 139, h: 0.42}], shapes: [{type: "drop", at: 85, w: 42, h: 5}], feats: [{type: "slick", at: 36, len: 20}], feat: 0 },
    "frost-3": { rev: 2, seed: "frost-3-r2-B210", len: 200, heat: 0.75, load: "cacac", ramps: [{at: 31, h: 0.45}], feats: [{type: "slick", at: 63, len: 47}], feat: 0 },
    "chilli-1": { rev: 2, seed: "chilli-1-r2-B57", len: 130, heat: 0.83, load: "cccc", ramps: [{at: 29, h: 0.57}, {at: 84, h: 0.62}], feat: 0 },
    "chilli-2": { rev: 2, seed: "chilli-2-r2-B75", len: 170, heat: 0.74, load: "ccccc", ramps: [{at: 33, h: 0.67}, {at: 111, h: 0.62}], shapes: [{type: "hill", at: 63, w: 36, h: 4.1}], feat: 0 },
    "chilli-3": { rev: 2, seed: "chilli-3-r2-B616", len: 200, heat: 1.02, load: "cacac", ramps: [{at: 28, h: 0.58}, {at: 144, h: 0.76}], shapes: [{type: "drop", at: 74, w: 52, h: 11.8}], feat: 0 },
    "market-1": { rev: 2, seed: "market-1-r2-C261", len: 130, heat: 0.76, load: "cccc", feats: [{type: "bump", at: 31}, {type: "bump", at: 63}], ramps: [{at: 94, h: 0.45}], feat: 0 },
    "market-2": { rev: 2, seed: "market-2-r2-B44", len: 170, heat: 0.85, load: "ccccc", feats: [{type: "bump", at: 31}, {type: "slick", at: 71, len: 23}, {type: "bump", at: 133}], feat: 0 },
    "market-3": { rev: 2, seed: "market-3-r2-B194", len: 200, heat: 0.9, load: "cacac", ramps: [{at: 165, h: 0.41}], shapes: [{type: "hill", at: 55, w: 65, h: 6.3}], feats: [{type: "bump", at: 30}], feat: 0 }
  };
  var DELIVERIES = [];
  REGIONS.forEach(function (region, r) {
    ROUTES.forEach(function (route, i) {
      var id = region.id + "-" + (i + 1), d = {
        id: id, name: ROUTE_NAMES[r][i], region: r, index: i, len: route.len, heat: regionHeat(route.heat, r),
        load: loadFor(region, r, i, route.load), pickup: r > 0 ? route.pickup || 0 : 0
      }, road = ROADS[id];
      if (road) {
        Object.assign(d, road);
        if (road.load) d.load = loadFor(region, r, i, road.load);
      }
      DELIVERIES.push(d);
    });
  });

  var SEASONAL_CARGO = { present: 6, sack: 7, pudding: 9 };
  var WINTER_ROUTES = [
    ["Workshop Yard", 118, 3, .34], ["Candy Cane Lane", 137, 4, .43],
    ["Reindeer Ridge", 166, 5, .53], ["Snowdrift Hollow", 182, 5, .55],
    ["Gingerbread Village", 206, 6, .60, 2], ["Aurora Climb", 232, 7, .76],
    ["The Long Way Round", 282, 8, .68], ["Christmas Eve Run", 392, 12, .69]
  ].map(function (r,i) {
    var load = Array.from({length:r[2]},function (_,j) { return i===7 && (j===3 || j===8) ? "pudding" : i===4 && j===1 ? "sack" : "present"; });
    return { id: "northpole-" + (i+1), name:r[0], region:EVENTS[0].region, index:i,
      len:r[1], heat:r[3], load:load, pickup:r[4]||0, dropoffs:r[2], winter:true, orderKind:"route" };
  });
  var WINTER_ORDERS = [
    ["Toys for Every Town","Santa",0,145,4,0,"rush"], ["Lost Sack","Tinsel",0,155,4,1,"sack"],
    ["Pudding Panic","Tinsel",3,180,5,0,"pudding"], ["Blizzard Run","Santa",6,200,6,0,"blizzard"],
    ["Reindeer Required","Tinsel",9,226,7,0,"sleigh"], ["The Big Night","Santa",12,340,10,0,"rush"]
  ].map(function (o,i) {
    var load=Array.from({length:o[4]},function (_,j) { return o[6]==="pudding"?"pudding":o[6]==="sack"&&j===o[4]-1?"sack":"present"; });
    return { id:"workshop-"+(i+1), name:o[0], customer:o[1], requiredStars:o[2], region:EVENTS[0].region,
      index:i, len:o[3], heat:.45+i*.055, load:load, pickup:o[5], dropoffs:o[4], winter:true, orderKind:"workshop",
      twist:o[6], grip:o[6]==="blizzard" ? .94 : 1, truck:o[6]==="sleigh"?"sleigh":null };
  });
  var WINTER_DOORS = Array.from({length:24},function (_,i) {
    var day=i+1, end=day===24;
    var r=WINTER_ROUTES[i % 6];
    if(end) return Object.assign({},WINTER_ROUTES[7],{id:"winter-door-24", seed:"northpole-8", orderKind:"advent",door:day});
    var stops=2+Math.floor(i/8);
    return {id:"winter-door-"+day, name:"Advent door "+day, region:[4,11,18].includes(i)?0:EVENTS[0].region,
      index:r.index, len:96+stops*13, heat:.30+i*.013, load:Array(stops).fill("present"),
      dropoffs:stops, winter:true, orderKind:"advent", door:day};
  });
  function winterDelivery(id) {
    return WINTER_ROUTES.concat(WINTER_DOORS,WINTER_ORDERS).find(function (d) { return d.id===id; }) || null;
  }

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

  // Seasonal vehicles (Winter Haul plan, apps/snackpack-snack-haul/docs/WINTER_EVENT_PLAN.md).
  // The event garage controls ownership and season access; physics still uses two hidden wheels.
  // Runner bottoms correspond to axleY - wheelR and the region changes the sleigh's grip.
  var EVENT_TRUCKS = [
    { id: "sleigh", event: "winter", name: "Jingle Sleigh", cost: 0, desc: "Glides fast on snow and ice. Slow and twitchy on dry roads.", bedHalf: 1.6, perRow: 4, wheelR: 0.32, rearX: -1.0, frontX: 1.1, torque: 1.1, top: 1.0, weight: 0.9, rail: 0.2, soft: 0.3, pay: 1, runners: true, snowGrip: 1.35, dryGrip: 0.8, snowRegions: ["frost", "northpole"], hitchX: 2.25, hitchY: 0.1, stats: { speed: 3, grip: 3, load: 2 } }
  ];

  function truckSpec(id) { return TRUCKS.concat(EVENT_TRUCKS).filter(function (t) { return t.id === id; })[0] || TRUCKS[0]; }

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
  // New in 1.1, outside CARGO_TYPES so region loads and stats keep their shape:
  // baguettes (long, they overhang the rail), cheese wheels (heavy and round),
  // pizza boxes (wide, flat, slippery, stacked in one column) and soda crates (fizz).
  var NEW_CARGO = ["baguette", "cheese", "pizza", "soda"];
  function cargoSize(type) {
    if (type === "baguette") return { w: 0.95, h: 0.16 };
    if (type === "cheese") return { w: 0.54, h: 0.54, round: true };
    if (type === "pizza") return { w: 0.62, h: 0.1 };
    if (type === "sack") return { w: 0.56, h: 0.5 };      // winter cargo, not yet in CARGO_TYPES
    if (type === "pudding") return { w: 0.5, h: 0.6 };
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
    var region = regionFor(d.region), r = rng(hash((d.seed || d.id) + "feat")), list = [];
    if (d.dropoffs) {
      // Level approaches, ordered stops, and room to brake from normal speed.
      var first = 39, last = START_FLAT + d.len - 20;
      for (var stop=0;stop<d.dropoffs;stop++) {
        var mark=Math.round((first+(last-first)*stop/Math.max(1,d.dropoffs-1))/SAMPLE)*SAMPLE;
        list.push({type:"dropoff",x0:mark-5.25,x1:mark+5.25,x:mark});
      }
    }
    var lo = START_FLAT + 34, hi = START_FLAT + d.len - 30;
    function free(x0, x1) { return list.concat(shapes).every(function (f) { return x1 + 16 < f.x0 || x0 - 16 > f.x1; }); }
    // Top-Up Run: a pickup stop every 70 to 90 m, each adding one load.
    if (d.topup) {
      for (var tx = START_FLAT + 60; tx < START_FLAT + d.len - 40; tx += 70 + r() * 20) {
        var sx = Math.round(tx / SAMPLE) * SAMPLE;
        list.push({ type: "pickup", x0: sx - 7.5, x1: sx + 7.5 });
      }
    }
    if (d.pickup) {
      var px = Math.round((START_FLAT + d.len * (0.45 + r() * 0.1)) / SAMPLE) * SAMPLE;
      if (d.winter) {
        // Put every pickup before the last delivery, using the widest suitable gap.
        var gaps = list.slice(1).map(function (stop, index) { return [list[index].x1,stop.x0]; })
          .filter(function (gap) { return gap[1]-gap[0] >= 17; });
        var gap=gaps[Math.floor(gaps.length/2)];
        if (gap) px=(gap[0]+gap[1])/2;
      }
      if (d.pickupAt) px = Math.round((START_FLAT + d.pickupAt) / SAMPLE) * SAMPLE;
      list.push({ type: "pickup", x0: px - (d.winter ? 5.25 : 7.5), x1: px + (d.winter ? 5.25 : 7.5) });
    }
    (d.ramps || []).forEach(function (a) {
      var ax = Math.round((START_FLAT + a.at) / SAMPLE) * SAMPLE;
      list.push({ type: "ramp", x0: ax, x1: ax + FEATURE_LEN.ramp, h: a.h, arc: !!a.arc, set: true });
    });
    // Authored region features (bridge, ford, slick, wind, bump) at a set place; len may override the usual length.
    (d.feats || []).forEach(function (a) {
      var fx = Math.round((START_FLAT + a.at) / SAMPLE) * SAMPLE, f = { type: a.type, x0: fx, x1: fx + (a.len || FEATURE_LEN[a.type]), set: true };
      if (a.type === "wind") { f.power = a.power || 0.42; f.phase = a.phase || 0; }
      if (a.type === "ducks" || a.type === "sails") { f.period = a.period || 7; f.cross = a.cross || 3; f.phase = a.phase || 0; }
      if (a.type === "hay") f.rows = a.rows || 2;
      if (a.type === "seesaw") f.xc = Math.round((fx + f.x1) / 2 / SAMPLE) * SAMPLE;
      list.push(f);
    });
    var shapes = (d.shapes || []).map(function (s) { return { x0: START_FLAT + s.at, x1: START_FLAT + s.at + s.w }; });
    var kinds = d.winter ? (d.twist === "blizzard" ? ["slick","drift"] : ["drift","slick"]) : region.features, i = d.index;
    if (d.winter) {
      // Road features fit between stops rather than displacing a doormat.
      var ordered=list.slice().sort(function (a,b) { return a.x0-b.x0; });
      var placed=0;
      for (var gapIndex=1;gapIndex<ordered.length && placed<2;gapIndex++) {
        var end=ordered[gapIndex].x0, start=ordered[gapIndex-1].x1;
        if (end-start < 15) continue;
        var center=(start+end)/2;
        list.push({type:kinds[placed++],x0:center-3.5,x1:center+3.5});
      }
      return list.sort(function (a,b) { return a.x0-b.x0; });
    }
    if (kinds.length && (d.long || d.daily || d.region > 0 || i >= 3 || d.feat != null)) {
      var count = d.long ? Math.floor(d.len / 85) : d.feat != null ? d.feat : 1 + Math.floor(i / 2);
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
    var region = regionFor(d.region), r = rng(hash(d.seed || d.id));
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
      // Authored shapes: the seed's hills fade out inside one, so it reads clearly.
      (d.shapes || []).forEach(function (s) {
        var u = (x - START_FLAT - s.at) / s.w;
        if (u > -0.2 && u < 1.2) y *= 1 - 0.8 * Math.min(1, Math.max(0, Math.min((u + 0.2) / 0.25, (1.2 - u) / 0.25)));
        if (u <= 0) return;
        if (s.type === "hill" && u < 1) y += s.h * Math.pow(Math.sin(Math.PI * u), 2);
        if (s.type === "drop") { var k = Math.min(1, u); y -= s.h * k * k * (3 - 2 * k); }
        if (s.type === "rollers" && u < 1) y += s.h * (0.5 - 0.5 * Math.cos(Math.PI * 2 * u * s.n));
      });
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
      if (f.type === "pickup" || f.type === "dropoff" || f.type === "ducks" || f.type === "sails" || f.type === "seesaw" || f.type === "hay") {
        // Hay gets a few metres of level run-up too: on a climb it stalls the truck.
        var level = at(f.x0).y, pad = f.type === "hay" ? 6 : 0;
        pts.forEach(function (p) {
          if (p.x >= f.x0 - pad && p.x <= f.x1 + pad) p.y = level;
          else if (p.x > f.x0 - pad - 9 && p.x < f.x0 - pad) p.y += (level - p.y) * ((p.x - (f.x0 - pad - 9)) / 9);
          else if (p.x > f.x1 + pad && p.x < f.x1 + pad + 9) p.y = level + (p.y - level) * ((p.x - f.x1 - pad) / 9);
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
    // The seesaw's mill stream is cut after smoothing, which would fill it in. The
    // plank's ends rest on the banks; only the stream bed lies under it.
    features.forEach(function (f) {
      if (f.type !== "seesaw") return;
      var level = at(f.xc).y;
      pts.forEach(function (p) {
        var off = Math.abs(p.x - f.xc);
        if (off < SEESAW.half - 0.1) p.y = level - 1.6;
        else if (off < SEESAW.half + 0.1) p.y = level - 0.45;
      });
      f.level = level;
    });
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
    return { pts: pts, total: total, zoneStart: total - 16, zoneEnd: total - 1.5, features: features, shapes: d.shapes || [] };
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
    var r = rng(hash((d.seed || d.id) + "coins")), coins = [], cans = [], rocks = [], ridges = [];
    var clear = function (x) {
      return !terrain.features.some(function (f) { return x > f.x0 - 4 && x < f.x1 + 4 && f.type !== "wind"; }) &&
        !terrain.shapes.some(function (s) { return x > START_FLAT + s.at - 4 && x < START_FLAT + s.at + s.w + 4; });
    };
    // A coin arc over an authored ramp: only a clean jump reaches the top of it.
    var arcs = terrain.features.filter(function (f) { return f.type === "ramp" && f.arc; });
    arcs.forEach(function (f) {
      for (var a = 0; a < 7; a++) {
        var ax = f.x1 + 1 + a * 1.4, u = a / 6;
        coins.push({ x: ax, y: heightAt(terrain, f.x1 - 1) + 2 + 2.4 * 4 * u * (1 - u) - 0.9 * u, taken: false });
      }
    });
    function underArc(x) { return arcs.some(function (f) { return x > f.x0 - 3 && x < f.x1 + 13; }); }
    for (var x = START_FLAT + 22; x < terrain.total - END_FLAT - 12; x += 26 + r() * 16) {
      var count = 3 + Math.floor(r() * 3);
      // Coins over a ramp sit higher, as a reward for taking it at speed.
      var ramp = featureAt(terrain, x + 3, "ramp") || featureAt(terrain, x - 3, "ramp");
      for (var c = 0; c < count; c++) {
        var cx = x + c * 1.5;
        if (underArc(cx)) continue;
        coins.push({ x: cx, y: heightAt(terrain, cx) + (ramp ? 3.1 : 2.1), taken: false });
      }
    }
    var gap = d.winter ? 72 : BALANCE.canEvery;
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

  // ════ Side roads: Back Roads and the Extra Mile ═════════════════
  // Free Bakery roads outside the career. Their stars go into the same save as the
  // career's and count towards total stars, but never towards region unlocks or
  // reputation, so no existing count moves. `track` says which list a road is on.
  // Back Roads open at 8 Bakery stars; the Extra Mile at 18. Each road opens once
  // either of the two before it on its track has a star.
  // `light` sets the time of day. New features: ducks (a crossing on a fixed clock),
  // hay (light stacks that break), seesaw (a plank on a hinge). `node dev/sim.js side`.
  // SIDE-BEGIN
  var SIDE_ROADS = [
    { id: "back-1", track: "back", name: "Duck Crossing", light: "dawn", rev: 1, seed: "back-1-A1", len: 150, heat: 0.62, load: "ccacc", feats: [{type: "ducks", at: 40, period: 7, cross: 3, phase: 1.5}, {type: "ducks", at: 118, period: 6, cross: 2.6, phase: 4}], ramps: [{at: 66, h: 0.56, arc: true}], shapes: [{type: "drop", at: 80, w: 20, h: 4.5}], feat: 0 },
    { id: "back-2", track: "back", name: "Hay Maze", light: "morning", rev: 1, seed: "back-2-A1", len: 180, heat: 0.6, load: "ccacc", feats: [{type: "hay", at: 40, rows: 2}, {type: "hay", at: 92, rows: 3}, {type: "hay", at: 140, rows: 2}], feat: 0 },
    { id: "back-3", track: "back", name: "Mill Race", light: "midday", rev: 1, seed: "back-3-A1", len: 190, heat: 0.58, load: "cacac", feats: [{type: "seesaw", at: 46}, {type: "seesaw", at: 118}], feat: 0 },
    { id: "back-4", track: "back", name: "Orchard Rollers", light: "golden", rev: 1, seed: "back-4-A1", len: 220, heat: 0.52, load: "ccacca", shapes: [{type: "rollers", at: 40, w: 60, n: 4, h: 0.95}, {type: "rollers", at: 140, w: 45, n: 3, h: 1.25}], feat: 0 },
    { id: "back-5", track: "back", name: "Lantern Lane", light: "dusk", rev: 1, seed: "back-5-A1", len: 240, heat: 0.56, load: "ccacac", feats: [{type: "ducks", at: 56, period: 6.5, cross: 2.8, phase: 2}, {type: "hay", at: 160, rows: 2}], ramps: [{at: 108, h: 0.32}], feat: 0 },
    { id: "back-6", track: "back", name: "The Moonlit Bake", light: "night", rev: 1, seed: "back-6-A1", len: 290, heat: 0.54, load: "ccacacac", pickup: 4, pickupAt: 80, feats: [{type: "ducks", at: 40, period: 6, cross: 2.4, phase: 0}, {type: "seesaw", at: 120}, {type: "hay", at: 222, rows: 2}], shapes: [{type: "rollers", at: 168, w: 36, n: 3, h: 0.9}], feat: 0 },
    // The Extra Mile: "The Village Fair" (REGION_EXPANSION_PLAN 3.1). Opens at 18 Bakery stars.
    { id: "bakery-9", track: "extra", name: "Hay Bale Hop", light: "morning", rev: 1, seed: "bakery-9-A1", len: 220, heat: 0.66, load: "cccac", shapes: [{type: "hill", at: 52, w: 46, h: -3.2}], feats: [{type: "hay", at: 74, rows: 3}, {type: "hay", at: 150, rows: 2}], feat: 0 },
    { id: "bakery-10", track: "extra", name: "Baguette Brae", light: "midday", rev: 1, seed: "bakery-10-A1", len: 260, heat: 0.62, load: "ccccggg", shapes: [{type: "hill", at: 60, w: 90, h: 11}, {type: "drop", at: 160, w: 30, h: 6}], feat: 0 },
    { id: "bakery-11", track: "extra", name: "Windmill Sails", light: "golden", rev: 1, seed: "bakery-11-A1", len: 300, heat: 0.6, load: "zccac", feats: [{type: "sails", at: 70, period: 4, cross: 1.2, phase: 0.4}, {type: "sails", at: 170, period: 4, cross: 1.3, phase: 1.9}], ramps: [{at: 120, h: 0.42, arc: true}], feat: 0 },
    { id: "bakery-12", track: "extra", name: "The Harvest Fair", light: "golden", rev: 1, seed: "bakery-12-A1", len: 380, heat: 0.66, load: "ccaccggg", pickup: 3, pickupAt: 150, feats: [{type: "ducks", at: 44, period: 6.5, cross: 2.6, phase: 1}, {type: "hay", at: 110, rows: 2}, {type: "seesaw", at: 200}, {type: "sails", at: 300, period: 4, cross: 1.2, phase: 0.8}], feat: 0 }
  ];
  // SIDE-END
  var SIDE_OPEN = { back: 8, extra: 18 };
  var SIDE = SIDE_ROADS.map(function (s, i) {
    var region = REGIONS[0], d = Object.assign({ region: 0, index: 1 + i % 6, pickup: 0, side: true }, s);
    d.trackIndex = SIDE_ROADS.filter(function (x, k) { return k < i && x.track === s.track; }).length;
    d.load = loadFor(region, 0, d.index, s.load);
    return d;
  });
  function sideTrack(track) { return SIDE.filter(function (d) { return d.track === track; }); }
  function sideStars(track, stars) { return sideTrack(track).reduce(function (n, d) { return n + (stars[d.id] || 0); }, 0); }
  // The ducks: on the road for `cross` seconds of every `period`, waddling up for two
  // seconds before. A clock, not physics, so every run and ghost sees the same ducks.
  function duckState(f, clock) {
    var c = ((clock + (f.phase || 0)) % f.period + f.period) % f.period;
    return { active: c < f.cross, warn: c > f.period - 2, u: c < f.cross ? c / f.cross : 0 };
  }

  // ════ Deliveries ═════════════════════════════════════════════════
  // The free game: all of Bakery Hills and the first roads of Dairy Dunes.
  var FREE_ROUTES = DELIVERIES.filter(function (d) { return d.region === 0 || d.id === "dunes-1" || d.id === "dunes-2"; }).map(function (d) { return d.id; });
  function isFree(id) { return FREE_ROUTES.indexOf(id) >= 0; }
  function findDelivery(id) {
    return DELIVERIES.filter(function (x) { return x.id === id; })[0] || SIDE.filter(function (x) { return x.id === id; })[0] || null;
  }
  // ════ Customers and Special Orders ══════════════════════════════
  // Each region has one customer. Stars in a region raise their reputation, and
  // each reputation level opens one Special Order: a fresh road (its own seed)
  // shaped like one of the career routes, with a twist.
  var CUSTOMERS = [
    { id: "mabel", name: "Mabel Crumb", role: "the baker", icon: "\ud83e\udd50" },
    { id: "dot", name: "Farmer Dot", role: "the dairy farmer", icon: "\ud83e\udd5b" },
    { id: "comb", name: "Captain Comb", role: "the harbour master", icon: "\u2693" },
    { id: "yolanda", name: "Yolanda Frost", role: "the ice-cream maker", icon: "\ud83c\udf66" },
    { id: "pepper", name: "Pepper Pete", role: "the popcorn seller", icon: "\ud83c\udf36\ufe0f" },
    { id: "nora", name: "Night Owl Nora", role: "the market keeper", icon: "\ud83c\udfee" },
    // Free customer on the Back Roads: his orders open on Back Roads stars, not reputation.
    { id: "crust", name: "Old Crust", role: "the miller", icon: "\ud83c\udf3e", region: 0, track: "back" }
  ];
  var REP_STARS = [3, 8, 13, 18, 22];      // region stars for reputation levels 1 to 5
  // Twist per order slot. `fragile` is the region's delicate cargo; `truck` the truck it suits.
  var FRAGILE = [["eggs", "eggs", "crate"], ["melon", "milk", "melon"], ["cake", "jelly", "cake"], ["icecream", "eggs", "icecream"], ["popcorn", "jelly", "popcorn"], ["cake", "eggs", "melon"]];
  var ORDER_TRUCK = ["tuktuk", "buggy", "van", "hauler", "buggy", "van"];
  var ORDER_NAMES = [
    ["Breakfast Rush", "Soggy Sourdough", "Egg Express", "Little Tuk Delivery", "The Wedding Bake"],
    ["Cold Milk Dash", "Rain on the Dunes", "Melon Medley", "Buggy Run", "The Cheese Fair"],
    ["Tide Is Turning", "Harbour Squall", "Cake for the Captain", "Van Over the Water", "The Honey Festival"],
    ["Before It Melts", "Sleet Storm", "Sundae Best", "Hauler Over the Pass", "The Winter Carnival"],
    ["Hot Delivery", "Monsoon Ridge", "Popcorn Pyramid", "Buggy on the Ridge", "The Chilli Cook-Off"],
    ["Last Orders", "Midnight Drizzle", "Fragile Night Shift", "Van After Dark", "The Night Market Feast"]
  ];
  var ORDERS = [];
  REGIONS.forEach(function (region, r) {
    var frag = FRAGILE[r];
    [
      { route: 1, twist: "rush" },
      { route: 3, twist: "rain", grip: 0.75 },
      { route: 2, twist: "fragile", load: [frag[0], frag[1], frag[2], frag[0], frag[1]] },
      { route: 4, twist: "truck", truck: ORDER_TRUCK[r] },
      { route: 5, twist: "big", extra: 2 }
    ].forEach(function (o, n) {
      var route = ROUTES[o.route], base = loadFor(region, r, o.route, route.load);
      // The big order's two extra loads bring each region's 1.1 cargo: cheese wheels to the
      // Cheese Fair, soda to the Honey Festival, pizza boxes to the Night Market Feast.
      var bigExtra = [null, "cheese", "soda", null, null, "pizza"][r] || "crate";
      var load = o.load || (o.extra ? (bigExtra === "cheese" ? ["cheese"].concat(base, ["crate"]) : base.concat([bigExtra, bigExtra])) : base);
      ORDERS.push({
        id: region.id + "-order-" + (n + 1), order: true, slot: n, name: ORDER_NAMES[r][n], customer: r, twist: o.twist,
        region: r, index: o.route, len: route.len + (o.extra ? 40 : 0), heat: regionHeat(route.heat, r) * 1.05,
        load: load, pickup: r > 0 && o.twist === "big" ? 2 : 0, grip: o.grip || 1, truck: o.truck || null
      });
    });
  });
  // Old Crust's orders: fresh roads in the Back Roads style, opening at `at` Back Roads stars.
  [
    { name: "Dawn Flour Run", twist: "rush", at: 3, light: "dawn", len: 170, load: ["crate", "crate", "crate", "crate", "eggs"], feats: [{type: "ducks", at: 50, period: 6.5, cross: 2.8, phase: 1}, {type: "ducks", at: 118, period: 7, cross: 3, phase: 5}] },
    { name: "Hay Day", twist: "big", at: 8, light: "golden", len: 210, load: ["crate", "crate", "eggs", "crate", "crate", "eggs", "crate"], feats: [{type: "hay", at: 44, rows: 2}, {type: "hay", at: 104, rows: 2}, {type: "seesaw", at: 150}] },
    { name: "Flour Power", twist: "rush", track: "extra", at: 3, light: "morning", len: 230, load: ["crate", "crate", "crate", "crate", "baguette", "baguette"], feats: [{type: "hay", at: 60, rows: 2}, {type: "sails", at: 150, period: 4, cross: 1.2, phase: 1}] },
    { name: "Stack 'Em High", twist: "baguettes", track: "extra", at: 6, light: "midday", len: 240, load: ["crate", "crate", "crate", "crate", "baguette", "baguette", "baguette", "baguette"], shapes: [{type: "hill", at: 60, w: 80, h: 6}] },
    { name: "Judges' Breakfast", twist: "fragile", track: "extra", at: 9, light: "dawn", len: 260, load: ["eggs", "eggs", "crate", "eggs", "baguette", "baguette"], feats: [{type: "ducks", at: 50, period: 6, cross: 2.4, phase: 2}, {type: "seesaw", at: 140}] },
    { name: "Millstones by Moonlight", twist: "fragile", at: 14, light: "night", len: 230, load: ["eggs", "eggs", "crate", "eggs", "eggs"], feats: [{type: "seesaw", at: 40}, {type: "ducks", at: 120, period: 6, cross: 2.6, phase: 3}], shapes: [{type: "rollers", at: 160, w: 40, n: 3, h: 1.3}] }
  ].forEach(function (o, n, all) {
    var track = o.track || "back", k = all.slice(0, n).filter(function (x) { return (x.track || "back") === track; }).length;
    ORDERS.push({
      id: track + "-order-" + (k + 1), order: true, slot: n, name: o.name, customer: 6, twist: o.twist, track: o.track || "back", at: o.at, light: o.light,
      region: 0, index: 2 + n, len: o.len, heat: 0.55 + n * 0.04, load: o.load, pickup: 0, grip: 1, truck: null, feats: o.feats, shapes: o.shapes, feat: 0,
      seed: track + "-order-" + (k + 1) + "-A1"
    });
  });
  function findOrder(id) { return ORDERS.filter(function (o) { return o.id === id; })[0] || null; }
  function repLevel(r, stars) { var n = regionStars(r, stars); return REP_STARS.filter(function (x) { return n >= x; }).length; }
  function orderText(o) {
    return ({
      rush: "Rush order: beat the gold time for a big tip.",
      rain: "It is pouring. Less grip everywhere.",
      fragile: "Nothing but delicate cargo.",
      truck: "Must go in the " + truckSpec(o.truck).name + ".",
      big: "The biggest load yet" + (o.pickup ? ", with a pickup on the way." : "."),
      baguettes: "A stack of baguettes. Keep the nose down on climbs."
    })[o.twist] || "";
  }

  // Test Drives: one short road in each locked region, free, in a loaner truck with
  // set upgrades. Each opens at a number of Bakery Hills stars (`at`). Roads are
  // designed like ROADS and checked by `node dev/sim.js testdrives`.
  // TESTDRIVES-BEGIN
  var TEST_DRIVE_ROADS = [
    { id: "test-harbour", name: "Pier Review", region: 2, at: 6, truck: "van", level: 2, len: 160, load: "ccacb", seed: "test-harbour-B164", feats: [{type: "bridge", at: 32}, {type: "ford", at: 80}], ramps: [], feat: 0, heat: 0.51 },
    { id: "test-frost", name: "Ice to Meet You", region: 3, at: 12, truck: "hauler", level: 2, len: 170, load: "cccac", seed: "test-frost-A260", feats: [{type: "slick", at: 32, len: 28}], ramps: [{at: 125, h: 0.44}], feat: 0, heat: 0.68 },
    { id: "test-chilli", name: "Hot Stuff", region: 4, at: 18, truck: "pickup", level: 3, len: 160, load: "ccacc", seed: "test-chilli-A75", ramps: [{at: 34, h: 0.51}, {at: 109, h: 0.58}], feat: 0, heat: 0.63 },
    { id: "test-market", name: "Last Orders, First Taste", region: 5, at: 24, truck: "monster", level: 2, len: 150, load: "ccacc", seed: "test-market-A159", feats: [{type: "bump", at: 24}, {type: "slick", at: 81, len: 21}], feat: 0, heat: 0.73 }
  ];
  // TESTDRIVES-END
  var TEST_DRIVES = TEST_DRIVE_ROADS.map(function (t) {
    var region = REGIONS[t.region];
    return Object.assign({}, t, { testDrive: true, loan: true, index: 1, load: loadFor(region, t.region, 1, t.load), pickup: 0 });
  });
  function findTestDrive(id) { return TEST_DRIVES.filter(function (t) { return t.id === id; })[0] || null; }

  // World Tour Daily: one road a day, the same for everyone, in a loaner truck with
  // set upgrades, so a player's own garage and regions make no difference. Regions
  // take turns (a fresh order every six days). The roads come from a pool the bots
  // have driven, written by `node dev/sim.js daily --write`.
  // DAILY-BEGIN
  var DAILY_TRUCK = ["pickup","van","hauler","monster","hauler","hauler"],
    DAILY_POOL = [[0,1,2,3,6,7,8,12,13,14,16,18,19,20,21,22,24,25,26,27,30,31,32,33],[0,1,3,4,6,7,8,9,12,13,14,16,18,19,21,22,24,25,27,30,31,32,36,37],[0,1,4,6,7,8,10,12,13,14,16,18,19,20,24,25,26,30,31,32,36,37,38,39],[0,1,3,6,12,18,20,24,27,30,36,42,43,48,54,60,61,66,67,70,72,73,78,80],[0,6,8,12,18,20,24,30,32,42,45,66,72,78,90,96,102,114,138,144,150,156,168,176],[0,6,12,18,24,26,30,32,36,44,48,54,55,60,66,72,78,84,90,96,97,102,104,108]];
  // DAILY-END
  var DAILY_LEVEL = [2, 2, 3, 3, 4, 4];
  function dayNumber(date) { var p = String(date).split("-"); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); }
  function dailyRegion(date) {
    var day = dayNumber(date), turn = Math.floor(day / 6), n = REGIONS.length;
    function order(t) {
      var r = rng(hash("tour" + t)), list = REGIONS.map(function (_, i) { return i; });
      for (var i = n - 1; i > 0; i--) { var k = Math.floor(r() * (i + 1)), x = list[i]; list[i] = list[k]; list[k] = x; }
      return list;
    }
    var list = order(turn);
    // Two turns never meet on the same region.
    if (list[0] === order(turn - 1)[n - 1] && day % 6 < 2) return list[1 - day % 6];
    return list[day % 6];
  }
  // One candidate road: the pool holds the numbers the bots have passed.
  function dailyRoad(region, k) {
    var index = 1 + k % 6, route = ROUTES[index], level = DAILY_LEVEL[region];
    return {
      daily: true, seed: "tour-" + REGIONS[region].id + "-" + k, region: region, index: index, len: Math.min(300, route.len), heat: regionHeat(route.heat, region),
      load: loadFor(REGIONS[region], region, index, route.load), pickup: region > 0 ? route.pickup || 0 : 0,
      loan: true, truck: DAILY_TRUCK[region], level: level
    };
  }
  function dailyDelivery(date) {
    var region = dailyRegion(date), pool = DAILY_POOL[region];
    // Each region comes round once every six days and steps through its own pool,
    // so no road repeats until the whole pool has been driven.
    var turn = Math.floor(dayNumber(date) / 6), d = dailyRoad(region, pool.length ? pool[(turn % pool.length + pool.length) % pool.length] : 0);
    d.id = "daily-" + date;
    return d;
  }
  // Long Haul: one long road that keeps getting steeper. Score is how far you get.
  function longHaul(region, seed) {
    var r = REGIONS[region];
    return {
      id: "long-" + r.id + "-" + seed, long: true, region: region, index: 3, len: BALANCE.longLen,
      heat: regionHeat(0.5, region), climb: BALANCE.longClimb, load: loadFor(r, region, 3, "cacbca"), pickup: 0
    };
  }
  // Top-Up Run: an endless road that starts with two crates, adds one at every stop
  // and gets steeper. The same road all day; a new one tomorrow.
  function topUpRun(region, date) {
    var r = REGIONS[region];
    return {
      id: "topup-" + r.id + "-" + date, seed: "topup-" + r.id + "-" + date, long: true, topup: true, region: region, index: 3,
      len: BALANCE.longLen, heat: regionHeat(0.35, region), climb: BALANCE.longClimb * 0.8, load: ["crate", "crate"], pickup: 0
    };
  }
  function parTime(d) { return Math.round((START_FLAT + d.len + END_FLAT) / BALANCE.parSpeed) + (d.pickup ? 4 : 0); }
  // Career gold times, written by `node dev/sim.js medals --write`: 1.08 times the best
  // clean bot run at the upgrade level expected there, and never looser than the old
  // time. A route missing here keeps the length-based time.
  // MEDALS-BEGIN
  var MEDALS = {"bakery-1": 23, "bakery-2": 29, "bakery-3": 38, "bakery-4": 41, "bakery-5": 49, "bakery-6": 49, "bakery-7": 62, "dunes-1": 23, "dunes-2": 30, "dunes-3": 34, "harbour-1": 23, "harbour-2": 32, "harbour-3": 29, "harbour-5": 54, "harbour-6": 63, "frost-1": 26, "frost-2": 24, "frost-3": 28, "frost-5": 57, "chilli-1": 23, "chilli-2": 33, "chilli-3": 32, "market-1": 24, "market-2": 28, "market-3": 29, "market-4": 47, "market-7": 76, "back-1": 30, "back-2": 28, "back-3": 29, "back-4": 32, "back-5": 38, "bakery-9": 30, "bakery-10": 34, "bakery-11": 42, "bakery-12": 54};
  // MEDALS-END
  // What the route sheet shows before a drive: the features in road order (each
  // kind once), the authored shapes, and the medal times.
  function routePreview(d) {
    var t = buildTerrain(d), seen = {}, ahead = [];
    t.features.concat((d.shapes || []).map(function (s) { return { type: s.type === "hill" && s.h < 0 ? "dip" : s.type, x0: START_FLAT + s.at }; }))
      .sort(function (a, b) { return a.x0 - b.x0; })
      .forEach(function (f) { if (!seen[f.type] && f.type !== "dropoff") { seen[f.type] = true; ahead.push(f.type); } });
    return { ahead: ahead, medals: medalTimes(d), len: d.len, load: d.load, pickup: d.pickup || 0 };
  }
  function medalTimes(d) {
    var best = d.daily || d.long || d.order ? 0 : MEDALS[d.id];
    if (best) return { gold: best, silver: Math.round(best * BALANCE.careerSilver), bronze: Math.round(best * BALANCE.careerBronze) };
    var p = parTime(d);
    return { gold: p, silver: Math.round(p * BALANCE.silver), bronze: Math.round(p * BALANCE.bronze) };
  }

  // ════ A delivery in progress ═════════════════════════════════════
  function createGame(opts) {
    var d = opts.delivery || findDelivery(opts.id);
    var spec = truckSpec(opts.truck);
    var D = dimsFor(spec);
    var up = Object.assign({ engine: 0, suspension: 0, tyres: 0, straps: 0, tank: 0 }, opts.upgrades || {});
    var region = regionFor(d.region), terrain = buildTerrain(d), pick = buildPickups(d, terrain);
    // A Special Order in the rain has less grip everywhere.
    var sleighGrip = spec.runners ? (spec.snowRegions.includes(region.id) || d.winter ? spec.snowGrip : spec.dryGrip) : 1;
    var roadGrip = region.friction * (d.grip || 1) * sleighGrip;
    var world = new planck.World({ gravity: { x: 0, y: -BALANCE.gravity }, allowSleep: false });

    var ground = world.createBody();
    ground.setUserData({ kind: "ground" });
    ground.createFixture({
      shape: new planck.Chain(terrain.pts.map(function (p) { return { x: p.x, y: p.y }; }), false),
      friction: roadGrip
    });
    // End wall: pull up too hard and the load keeps going.
    var endY = terrain.pts[terrain.pts.length - 1].y;
    ground.createFixture({ shape: new planck.Box(0.3, 6, { x: terrain.total + 0.3, y: endY + 6 }, 0), friction: 0.5 });
    ground.createFixture({ shape: new planck.Box(0.3, 6, { x: -0.3, y: 6 }, 0), friction: 0.5 });
    pick.rocks.concat(pick.ridges).forEach(function (rock) {
      ground.createFixture({ shape: new planck.Circle({ x: rock.x, y: rock.y }, rock.r), friction: 0.9 });
    });
    // Hay stacks: light bales two wide, `rows` high. The truck smashes through and the
    // hay drags at it (BALANCE.hayDrag). Bales go 3 s after the stack is first hit.
    var hay = [];
    terrain.features.forEach(function (f) {
      if (f.type !== "hay") return;
      f.bales = [];
      var y0 = heightAt(terrain, f.x0 + 1.2);
      for (var row = 0; row < f.rows; row++) for (var col = 0; col < 2; col++) {
        var bale = world.createBody({ type: "dynamic", position: { x: f.x0 + 0.6 + col * 1.2, y: y0 + 0.33 + row * 0.66 } });
        bale.setUserData({ kind: "hay", stack: f });
        // Bales pass through the load: sweeping a bed clean was too harsh. The jolt of
        // ploughing in fast is what shakes crates loose.
        bale.createFixture({ shape: new planck.Box(0.58, 0.32), density: 0.22, friction: 0.8, filterMaskBits: 0xFFFF ^ CARGO_BIT });
        f.bales.push(bale); hay.push(bale);
      }
    });
    // Seesaw bridges: a plank on a hinge, resting with its far end up. It counts as
    // ground, so a load that lands on it is lost, as on the road.
    var seesaws = [];
    terrain.features.forEach(function (f) {
      if (f.type !== "seesaw") return;
      var py = f.level + SEESAW.half * Math.sin(SEESAW.tilt) - SEESAW.thick;
      var plank = world.createBody({ type: "dynamic", position: { x: f.xc, y: py }, angle: SEESAW.tilt });
      plank.setUserData({ kind: "ground", seesaw: f });
      plank.createFixture({ shape: new planck.Box(SEESAW.half, SEESAW.thick), density: 0.6, friction: roadGrip });
      world.createJoint(new planck.RevoluteJoint({
        enableLimit: true, lowerAngle: -SEESAW.tilt, upperAngle: SEESAW.tilt, referenceAngle: 0,
        enableMotor: true, motorSpeed: 0, maxMotorTorque: SEESAW.damp
      }, ground, plank, { x: f.xc, y: py }));
      f.plank = plank; seesaws.push(plank);
    });
    var crossings = terrain.features.filter(function (f) { return f.type === "ducks" || f.type === "sails"; });

    // A tall truck on big wheels somersaults if its brakes bite as hard as its engine pulls.
    var brakeBite = spec.brake || 1;
    var rail = 0.2 + 0.14 * up.straps + spec.rail;
    var strapHold = BALANCE.strapHold * up.straps + (spec.hold || 0) + (d.winter ? .45 : 0);
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
      var body = world.createBody({ type: "dynamic", position: pos, angle: angle || 0, angularDamping: type === "cheese" ? 0.4 : size.round ? 2 : 0 });
      var info = { kind: "cargo", type: type, lost: false, broken: false, body: body, id: cargo.length, w: size.w, h: size.h, round: !!size.round };
      body.setUserData(info);
      body.createFixture({
        shape: size.round ? new planck.Circle(size.w / 2) : new planck.Box(size.w / 2 - 0.005, size.h / 2 - 0.005),
        density: type === "sack" ? 2.0 : type === "milk" ? 2.6 : type === "cheese" ? 2.4 : type === "soda" ? 1.6 : type === "popcorn" ? 0.28 : type === "pizza" ? 0.5 : type === "baguette" ? BALANCE.baguetteDensity : type === "icecream" ? 1.2 : 0.9,
        friction: (type === "sack" ? .82 : type === "melon" ? 0.7 : type === "cheese" ? 0.45 : type === "pizza" ? 0.22 : type === "baguette" ? BALANCE.baguetteGrip : 0.5) + 0.1 * up.straps,
        restitution: type === "jelly" ? 0.55 : type === "popcorn" ? 0.2 : 0.04,
        filterCategoryBits: CARGO_BIT
      });
      cargo.push(info);
      return info;
    }
    // Stack the load on the bed, front of the bed first. Each column keeps its
    // own height, because cakes are taller than crates.
    var onBoard = d.load.slice(0, d.load.length - (d.pickup || 0)), pending = d.load.slice(onBoard.length);
    var columns = [], slot = 0, pizzaCol = -1, laid = [];
    onBoard.forEach(function (type) {
      // Baguettes go on last, lying on top at the back, sticking out past the rail.
      if (type === "baguette") { laid.push(type); return; }
      // Pizza boxes share one column, stacked high.
      var col = type === "pizza" && pizzaCol >= 0 ? pizzaCol : slot++ % spec.perRow, size = cargoSize(type), base = columns[col] || 0;
      if (type === "pizza" && pizzaCol < 0) pizzaCol = col;
      addCargo(type, { x: spawnX + D.bedRight - D.crate * (col + 0.55) - col * 0.015, y: spawnY + D.bedHeight + base + size.h / 2 + 0.01 });
      columns[col] = base + size.h + 0.012;
    });
    // On a full back row they lie across its top; otherwise on the bed against the
    // rail. The body stays over the bed (an overhanging stack pivoted off under
    // throttle); the model is drawn longer, so the bread still pokes out the back.
    var backTop = Math.min(columns[spec.perRow - 1] || 0, columns[spec.perRow - 2] || 0);
    laid.forEach(function (type, k) {
      var size = cargoSize(type), x = D.bedLeft + size.w / 2 + 0.04;
      addCargo(type, { x: spawnX + x, y: spawnY + D.bedHeight + backTop + size.h / 2 + 0.02 + k * (size.h + 0.012) });
    });

    var pickupZones = terrain.features.filter(function (f) { return f.type === "pickup"; }), pickupZone = pickupZones[0] || null, zoneIndex = 0;
    if (d.topup && pickupZone) pending = [d.topupCargo || "crate"];
    var deliveries = terrain.features.filter(function (f) { return f.type === "dropoff"; });
    var g = {
      delivery: d, region: region, regionIndex: d.region, terrain: terrain, world: world, truck: truck, wheels: wheels,
      cargo: cargo, coins: pick.coins, cans: pick.cans, rocks: pick.rocks, rail: rail, upgrades: up, spec: spec, dim: D,
      status: "driving", reason: null, time: 0, coinsTaken: 0, par: parTime(d), medals: medalTimes(d),
      fuel: BALANCE.tankSeconds + 9 * up.tank, maxFuel: BALANCE.tankSeconds + 9 * up.tank,
      dropoffs: deliveries, homes: 0, given: {},
      events: [], settle: 0.5, airTime: 0, airTotal: 0, bestAir: 0, topSpeed: 0, flipsNearly: 0, slipRear: 0, gasOn: false, brakeOn: false,
      total: d.load.length, pending: pending, pickup: pickupZone, pickupState: pickupZone ? "ahead" : "none", wind: 0, zone: null, rec: [],
      brakeUsed: false, featMax: {}, lassoLeft: opts.lasso ? 1 : 0, lassoUsed: false,
      clock: 0, hay: hay, seesaws: seesaws, crossings: crossings, honks: 0
    };
    var topSpeed = (BALANCE.topSpeed + spec.top + 1.15 * up.engine) * (spec.runners && sleighGrip < 1 ? .80 : 1) / D.wheelR;
    var torque = BALANCE.torque * spec.torque * (1 + 0.2 * up.engine);
    var thirst = spec.thirst || 1;
    var flipTimer = 0, stallTimer = 0, stopTimer = 0, loadTimer = 0, splash = 0;
    var need = d.long ? 1 : Math.ceil(g.total * BALANCE.passShare);
    var wasGrounded = true, dropTimer = 0;

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
        if (g.settle <= 0 && g.lassoLeft > 0 && !d.dropoffs) {
          // The lasso: the first load to hit the ground is roped back onto the bed
          // after this step (a body can't be moved inside a contact callback).
          g.lassoLeft -= 1; g.lassoUsed = true; hit.self.rescue = true;
        } else if (g.settle <= 0) {
          hit.self.lost = true;
          var cp = hit.self.body.getPosition();
          g.events.push({ type: "lost", cargo: hit.self.type, x: cp.x, y: cp.y });
        }
      }
      var w = tagged(c, "wheel");
      if (w && w.other && w.other.kind === "ground") w.self.touching += 1;
      // The truck breaks into a hay stack: it pays a coin and starts the clock.
      var h = tagged(c, "hay");
      if (h && h.other && (h.other.kind === "truck" || h.other.kind === "wheel") && h.self.stack.hitAt == null) {
        h.self.stack.hitAt = g.clock;
        g.coinsTaken += 1;
        var hp = h.body.getPosition();
        g.events.push({ type: "hay", x: hp.x, y: hp.y });
      }
    });
    world.on("end-contact", function (c) {
      var w = tagged(c, "wheel");
      if (w && w.other && w.other.kind === "ground") w.self.touching = Math.max(0, w.self.touching - 1);
    });
    // Ice, wet cobbles and plank bridges change how a tyre meets the road.
    var mixedGrip = Math.sqrt(wheelGrip * roadGrip);
    world.on("pre-solve", function (c) {
      var w = tagged(c, "wheel");
      if (!w || !w.other || w.other.kind !== "ground") return;
      var f = featureAt(terrain, w.body.getPosition().x);
      c.setFriction(f && f.type === "slick" ? mixedGrip * BALANCE.slick * (1 + 0.12 * up.tyres) : f && f.type === "ford" ? mixedGrip * 0.8 : mixedGrip);
      c.setRestitution(f && f.type === "bridge" ? BALANCE.bridgeBounce : 0);
    });
    world.on("post-solve", function (c, impulse) {
      var hit = tagged(c, "cargo");
      // Soda takes shake from every knock; enough and the crate pops.
      if (hit && hit.self.type === "soda" && !hit.self.broken && !hit.self.lost && g.settle <= 0) {
        hit.self.fizz = (hit.self.fizz || 0) + Math.max(0, Math.max.apply(null, impulse.normalImpulses) - BALANCE.fizzFrom) * BALANCE.fizzGain;
      }
      if (!hit || hit.self.type !== "eggs" || hit.self.broken || hit.self.lost || g.settle > 0) return;
      var hardest = Math.max.apply(null, impulse.normalImpulses);
      if (hardest > eggBreak) {
        hit.self.broken = true;
        var cp = hit.self.body.getPosition();
        g.events.push({ type: "broken", cargo: "eggs", x: cp.x, y: cp.y });
      }
    });

    function liveCargo() { return cargo.filter(function (c) { return !c.lost && !c.broken && !c.delivered; }).length; }
    function grounded() { return wheels.some(function (w) { return w.getUserData().touching > 0; }); }
    function onBed(c) {
      var local = truck.getLocalPoint(c.body.getPosition());
      return local.x > D.bedLeft - 0.2 && local.x < D.bedRight + 0.2 && local.y > 0 && local.y < 2.2 ? local : null;
    }

    // The waiting loads drop onto the bed, above whatever is already there.
    function loadPickup() {
      var top = D.bedHeight;
      cargo.forEach(function (c) { var l = !c.lost && !c.broken && !c.delivered && onBed(c); if (l) top = Math.max(top, l.y + c.h / 2); });
      // Baguettes go on the back of the stack, so measure the back two columns only.
      var long = 0, backTop = D.bedHeight;
      cargo.forEach(function (c) { var l = !c.lost && !c.broken && !c.delivered && onBed(c); if (l && l.x < D.bedLeft + 1.15) backTop = Math.max(backTop, l.y + c.h / 2); });
      var added = pending.map(function (type, i) {
        var col = i % spec.perRow, row = Math.floor(i / spec.perRow), size = cargoSize(type);
        var local = { x: D.bedRight - D.crate * (col + 0.55) - col * 0.015, y: top + 0.25 + size.h / 2 + row * 0.8 };
        // Baguettes are handed up lying across the back of the stack.
        if (type === "baguette") local = { x: D.bedLeft + size.w / 2 + 0.04, y: backTop + 0.04 + size.h / 2 + (long++) * (size.h + 0.02) };
        return addCargo(type, truck.getWorldPoint(local), truck.getAngle());
      });
      pending = g.pending = [];
      g.settle = 0.6;
      g.pickupState = "loaded";
      if (d.topup) { g.stops = (g.stops || 0) + 1; g.topupScore = (g.topupScore || 0) + liveCargo(); nextZone(); }
      g.events.push({ type: "pickup", items: added, x: truck.getPosition().x, y: truck.getPosition().y });
    }

    // Top-Up Run: the next stop comes up as soon as this one is loaded or passed.
    function nextZone() {
      pickupZone = pickupZones[++zoneIndex] || null;
      g.pickup = pickupZone;
      if (pickupZone) { pending = g.pending = [d.topupCargo || "crate"]; g.pickupState = "ahead"; }
    }
    function finish(status, reason) {
      if (status === "done") {
        // A cake only counts if it arrives the right way up.
        cargo.forEach(function (c) {
          if ((c.type !== "cake" && c.type !== "pudding") || c.lost || c.broken || c.delivered) return;
          if (Math.abs(normalAngle(c.body.getAngle() - truck.getAngle())) > BALANCE.cakeTilt) {
            c.broken = true;
            g.events.push({ type: "ruined", cargo: c.type, x: c.body.getPosition().x, y: c.body.getPosition().y });
          }
        });
      }
      g.status = status; g.reason = reason;
      rearJoint.setMotorSpeed(0); frontJoint.setMotorSpeed(0);
      rearJoint.setMaxMotorTorque(4); frontJoint.setMaxMotorTorque(4);
      g.events.push({ type: status, reason: reason });
    }

    function nextDrop() { return deliveries.find(function (f) { return !f.done && !f.missed; }); }
    function readyCargo() {
      return cargo.filter(function (c) { return !c.lost && !c.broken && !c.delivered && onBed(c) &&
        (c.type !== "pudding" || Math.abs(normalAngle(c.body.getAngle()-truck.getAngle()))<=BALANCE.cakeTilt); });
    }
    function drop(zone) {
      var eligible=readyCargo();
      eligible.sort(function (a,b) { return onBed(a).x-onBed(b).x; });
      var item=eligible[0];
      if (!item) return;
      item.delivered=true;
      item.body.setActive(false);
      zone.done=true;
      g.homes++;
      g.given[item.type]=(g.given[item.type]||0)+1;
      g.events.push({type:"dropoff",x:zone.x,y:heightAt(terrain,zone.x),cargo:item.type});
    }
    g.nextDrop = nextDrop;
    g.canDrop = function () { return readyCargo().length > 0; };
    g.live = liveCargo;
    g.need = need;
    g.grounded = grounded;
    g.speed = function () { return truck.getLinearVelocity().x; };

    // One fixed physics step. input = { gas: bool, brake: bool }
    g.step = function (input) {
      if (g.status !== "driving") { world.step(STEP); return; }
      g.time += STEP; g.clock += STEP;
      if (g.settle > 0) g.settle -= STEP;
      var gas = !!input.gas && g.fuel > 0, brake = !!input.brake;
      // Record the pedals, run-length encoded, so a ghost can replay this run.
      var bits = (input.gas ? 1 : 0) | (brake ? 2 : 0), rec = g.rec;
      if (rec.length && rec[rec.length - 2] === bits) rec[rec.length - 1] += 1; else rec.push(bits, 1);
      g.gasOn = gas && !brake; g.brakeOn = brake;
      if (brake) g.brakeUsed = true;
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
          g.landings = (g.landings || 0) + 1;
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
      } else if (zone && zone.type === "drift" && isGrounded) {
        truck.applyForceToCenter({x:-vx*truck.getMass()*(Math.abs(vx)>3 ? .24 : .52),y:0},true);
      } else if (zone && zone.type === "hay" && zone.hitAt != null && !zone.gone) {
        // Ploughing through loose hay drags like a ford.
        truck.applyForceToCenter({ x: -vx * truck.getMass() * BALANCE.hayDrag, y: 0 }, true);
      } else if (zone && zone.type === "wind") {
        // Gusts push on the load, not the truck, so light cargo goes first.
        g.wind = zone.power * (0.5 + 0.5 * Math.sin(g.time * 1.7 + zone.phase));
      }

      cargo.forEach(function (c) {
        if (c.lost || c.broken || c.delivered) return;
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
      // Ducks on the road: driving into them honks and costs 2 s, and the truck pulls up short.
      crossings.forEach(function (f) {
        var on = duckState(f, g.clock).active, front = pos.x + D.bedHalf + 0.3, back = pos.x - D.bedHalf;
        var win = Math.floor((g.clock + (f.phase || 0)) / f.period);
        if (on && front > f.x0 && back < f.x1 && f.honked !== win) {
          f.honked = win; g.honks += 1; g.time += BALANCE.duckPenalty;
          // A gentle check, not a wall: a hard stop would throw the load.
          var lv = truck.getLinearVelocity();
          truck.setLinearVelocity({ x: lv.x * 0.8, y: lv.y });
          g.events.push({ type: "honk", what: f.type, x: (f.x0 + f.x1) / 2, y: heightAt(terrain, f.x0) });
        }
      });
      world.step(STEP);
      // A stack the truck has hit bursts: its bales stop touching the truck and fly
      // ahead (a bale wedged under the chassis could stand the truck on its tail).
      // The slowing comes from the hay's drag. Bales clear away 3 s later.
      terrain.features.forEach(function (f) {
        if (f.type !== "hay" || f.hitAt == null) return;
        if (!f.burst) {
          f.burst = true;
          var tv = truck.getLinearVelocity().x;
          f.bales.forEach(function (b, k) {
            b.getFixtureList().setFilterData({ groupIndex: -1, categoryBits: 1, maskBits: 0xFFFF ^ CARGO_BIT });
            b.setLinearVelocity({ x: tv * 1.1 + (k % 2) * 0.8, y: 2.2 + Math.floor(k / 2) * 0.9 });
            b.setAngularVelocity(k % 2 ? -2 : 2);
          });
        } else if (!f.gone && g.clock - f.hitAt >= 3) {
          f.gone = true;
          f.bales.forEach(function (b) { b.setActive(false); });
        }
      });

      // Lasso: put a roped load back on top of the stack, moving with the truck.
      cargo.forEach(function (c) {
        if (!c.rescue) return;
        c.rescue = false;
        var from = c.body.getPosition(), top = D.bedHeight;
        cargo.forEach(function (o) { var l = o !== c && !o.lost && !o.broken && !o.delivered && onBed(o); if (l) top = Math.max(top, l.y + o.h / 2); });
        var at = truck.getWorldPoint({ x: (D.bedLeft + D.bedRight) / 2, y: top + c.h / 2 + 0.08 });
        g.events.push({ type: "lasso", id: c.id, cargo: c.type, x: from.x, y: from.y, toX: at.x, toY: at.y });
        c.body.setTransform(at, truck.getAngle());
        c.body.setLinearVelocity(truck.getLinearVelocity());
        c.body.setAngularVelocity(0);
        g.settle = Math.max(g.settle, 0.4);
      });

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

      // Soda: fizz bleeds away on smooth roads; a full gauge pops the crate and
      // shoves its neighbours.
      var fizzMax = 0;
      cargo.forEach(function (c) {
        if (c.type !== "soda" || c.lost || c.broken || c.delivered) return;
        c.fizz = Math.max(0, (c.fizz || 0) - BALANCE.fizzBleed * STEP);
        if (c.fizz >= BALANCE.fizzPop) {
          c.broken = true; c.fizz = 0;
          var sp = c.body.getPosition();
          cargo.forEach(function (o) {
            if (o === c || o.lost || o.broken || o.delivered) return;
            var op = o.body.getPosition(), dx = op.x - sp.x, dy = op.y - sp.y, dist = Math.hypot(dx, dy);
            if (dist < 1.1) o.body.applyLinearImpulse({ x: dx / (dist + 0.1) * 0.35, y: 0.45 }, op, true);
          });
          g.events.push({ type: "pop", cargo: "soda", x: sp.x, y: sp.y });
        } else fizzMax = Math.max(fizzMax, c.fizz / BALANCE.fizzPop);
      });
      g.fizz = fizzMax;

      // A crate that falls through a gap in the physics still counts as lost.
      cargo.forEach(function (c) {
        if (!c.lost && !c.delivered && c.body.getPosition().y < heightAt(terrain, c.body.getPosition().x) - 2) c.lost = true;
      });

      var speedNow = truck.getLinearVelocity().length();
      var angle = Math.abs(normalAngle(truck.getAngle()));
      g.topSpeed = Math.max(g.topSpeed, speedNow);
      g.stuckTime = gas && speedNow < 0.25 ? (g.stuckTime || 0) + STEP : 0;
      if (zone) g.featMax[zone.type] = Math.max(g.featMax[zone.type] || 0, speedNow);
      // Driving into the depot wall is not a stop: it costs the medal.
      if (!g.dockHit && pos.x + spec.bedHalf + 0.3 > terrain.total && speedNow > BALANCE.dockSpeed) {
        g.dockHit = true; g.events.push({ type: "dock", x: pos.x, y: pos.y, speed: speedNow });
      }

      // Pickup stop: pull up inside it, or drive on and leave those loads behind.
      if (g.pickupState === "ahead") {
        var inStop = pos.x > pickupZone.x0 && pos.x < pickupZone.x1;
        loadTimer = inStop && speedNow < BALANCE.stopSpeed && angle < 0.5 ? loadTimer + STEP : 0;
        if (loadTimer > BALANCE.stopSeconds) loadPickup();
        else if (pos.x > pickupZone.x1 + 5) {
          g.pickupState = "missed"; pending = g.pending = [];
          if (d.topup) nextZone();
          g.events.push({ type: "missed", x: pos.x, y: pos.y });
        }
      }
      var porch=nextDrop();
      dropTimer=porch && zone===porch && speedNow<BALANCE.stopSpeed && angle<.5 ? dropTimer+STEP : 0;
      if (porch && dropTimer>BALANCE.stopSeconds) { drop(porch); dropTimer=0; }
      if (porch && !porch.done && pos.x>porch.x1+4) {
        porch.missed=true;
        g.events.push({type:"missedDrop",x:pos.x,y:pos.y});
      }
      if (d.topup) {
        // Three loads gone in all ends the run; it always ends as a run, never a failure.
        var gone = cargo.filter(function (c) { return c.lost || c.broken; }).length;
        if (gone >= 3) { finish("failed", "load"); return; }
      } else if (!d.dropoffs && liveCargo() + pending.length < need) { finish("failed", "load"); return; }

      flipTimer = angle > 2 && speedNow < 3 ? flipTimer + STEP : 0;
      if (flipTimer > BALANCE.flipSeconds) { finish("failed", "flip"); return; }

      stallTimer = g.fuel <= 0 && speedNow < 0.4 ? stallTimer + STEP : 0;
      if (stallTimer > BALANCE.stallSeconds) { finish("failed", "fuel"); return; }

      var inZone = pos.x > terrain.zoneStart && pos.x < terrain.zoneEnd;
      stopTimer = inZone && speedNow < BALANCE.stopSpeed && angle < 0.7 ? stopTimer + STEP : 0;
      if (stopTimer > BALANCE.stopSeconds) {
        if (d.dropoffs && !g.homes) finish("failed","porches");
        else finish("done","delivered");
      }
    };
    g.stopProgress = function () { return Math.min(1, Math.max(stopTimer, loadTimer, dropTimer) / BALANCE.stopSeconds); };
    g.inZone = function () { var x = truck.getPosition().x; return x > terrain.zoneStart && x < terrain.zoneEnd; };
    g.inDropoff = function () { var f=nextDrop(), x=truck.getPosition().x; return !!f && x>f.x0 && x<f.x1; };
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
    var total = g.delivery.dropoffs || g.total, kept = g.delivery.dropoffs ? g.homes : g.live();
    var region = g.region, pay = 0, kinds = {}, d = g.delivery;
    CARGO_TYPES.forEach(function (t) { kinds[t] = 0; });
    // Ice cream melts: full pay inside the par time, a third by 1.5 times it.
    var melt = g.time <= g.par ? 1 : Math.max(BALANCE.meltFloor, 1 - ((g.time / g.par - 1) / 0.5) * (1 - BALANCE.meltFloor));
    g.cargo.forEach(function (c) {
      if (d.dropoffs ? c.delivered : !c.lost && !c.broken) {
        pay += (BALANCE.cargoPay[c.type] || SEASONAL_CARGO[c.type]) * (c.type === "icecream" ? melt : 1);
        kinds[c.type] = (kinds[c.type] || 0) + 1;
      }
    });
    pay = Math.round(pay * region.pay * g.spec.pay);
    var share = kept / total, done = g.status === "done";
    var metres = Math.max(0, Math.round(g.truck.getPosition().x - 8));
    var stars = !done || d.long ? 0 : share >= 1 ? 3 : share >= 0.75 ? 2 : 1;
    var medal = !done || stars < 2 || d.long || g.dockHit ? 0 : g.time <= g.medals.gold && stars === 3 ? 3 : g.time <= g.medals.silver ? 2 : g.time <= g.medals.bronze ? 1 : 0;
    var lines = [];
    var coins = Math.round(g.coinsTaken * BALANCE.coinValue);
    var score = 0;
    if (d.topup) {
      score = g.topupScore || 0;
      lines.push({ label: "Reached stop " + (g.stops || 0) + " with " + kept + " on board", coins: Math.round(score * 2 * region.pay) });
    } else if (d.long) {
      score = Math.round(metres * (0.5 + 0.5 * share));
      lines.push({ label: metres + " m with " + kept + " of " + total + " loads", coins: Math.round(score / 12 * region.pay) });
    } else if (done) {
      lines.push({ label: kept + " of " + total + (d.dropoffs ? " homes visited" : " delivered"), coins: pay });
      if (kinds.icecream && melt < 1) lines.push({ label: "Ice cream melted a little", coins: 0 });
      if (stars === 3) lines.push({ label: d.dropoffs ? "Every porch delivered" : "Whole load intact", coins: Math.round(10 * region.pay) });
      if (medal) lines.push({ label: ["", "Bronze", "Silver", "Gold"][medal] + " time", coins: Math.round(BALANCE.expressPay * region.pay * medal / 3) });
      if (d.daily && !d.paid) lines.push({ label: "Daily delivery", coins: BALANCE.dailyPay });
    }
    if (coins) lines.push({ label: "Coins on the road", coins: coins });
    return {
      status: g.status, reason: g.reason, kept: kept, stops: g.stops || 0, lassoUsed: !!g.lassoUsed, topup: !!d.topup, total: total, stars: stars, time: g.time, express: medal === 3, medal: medal,
      par: g.par, medals: g.medals, kinds: kinds, bestAir: g.bestAir, airTotal: g.airTotal, topSpeed: g.topSpeed, truck: g.spec.id,
      long: !!d.long, dockHit: !!g.dockHit, metres: metres, brakeUsed: g.brakeUsed, featMax: g.featMax, landings: g.landings || 0,
      honks: g.honks || 0, coinsAll: g.coins.length, fuelShare: g.fuel / g.maxFuel, delivery: d.id, score: score, coinsTaken: g.coinsTaken, missedPickup: g.pickupState === "missed",
      lines: lines, earned: lines.reduce(function (n, l) { return n + l.coins; }, 0)
    };
  }

  // ════ Bot driver ═════════════════════════════════════════════════
  // A careful driver that cruises at `target` metres a second, slows for crests
  // and dips ahead, and pulls up at stops. dev/sim.js tests the game with it, and
  // the rival in the game is this same driver, so its runs are exact.
  function botInput(g, target) {
    var t = g.terrain, pos = g.truck.getPosition(), vx = g.truck.getLinearVelocity().x;
    var angle = normalAngle(g.truck.getAngle());
    var ahead = 5 + vx;
    var s1 = (heightAt(t, pos.x + 2) - heightAt(t, pos.x)) / 2;
    var s2 = (heightAt(t, pos.x + ahead + 2) - heightAt(t, pos.x + ahead)) / 2;
    var want = target - Math.min(target * 0.55, Math.abs(s2 - s1) * 9);
    var toStop = (t.zoneStart + t.zoneEnd) / 2 - pos.x;
    // A pickup stop is a second place to pull up, part-way along.
    if (g.pickupState === "ahead") toStop = (g.pickup.x0 + g.pickup.x1) / 2 - pos.x;
    var porch=g.nextDrop();
    if (porch && (porch.x-pos.x > 9 || g.canDrop())) toStop=Math.min(toStop,porch.x-pos.x);
    if (toStop < 40) want = Math.min(want, Math.max(0.1, toStop * 0.28));
    // Ducks ahead: wait at the verge when they will be on the road as we get there.
    (g.crossings || []).forEach(function (f) {
      var gap = f.x0 - (pos.x + g.dim.bedHalf + 0.3);
      if (gap < -0.5 || gap > 16 || pos.x - g.dim.bedHalf > f.x1) return;
      var eta = Math.max(0, gap) / Math.max(1, vx);
      if (duckState(f, g.clock + eta).active || duckState(f, g.clock + eta + 1.4).active || duckState(f, g.clock).active && gap < 3) {
        want = Math.min(want, Math.max(0, (gap - 1.5) * 0.3));
        if (gap < 2.5) toStop = 0.6;
      }
    });
    var input = { gas: false, brake: false };
    if (!g.grounded()) {
      if (angle > 0.14) input.brake = true;
      else if (angle < -0.14) input.gas = true;
    } else if (toStop < 1 && vx > 0.2) input.brake = true;
    else if (toStop < 0.5) input.brake = false;
    else if (vx < want) input.gas = true;
    else if (vx > want + 1.6) input.brake = true;
    return input;
  }

  // ════ The rival: Dash Dalloway ═══════════════════════════════════
  // The bot driver at a set cruising speed (v) and upgrade level (L) for each
  // route, written by `node dev/sim.js rivals --write`. t is Dash's time.
  // RIVALS-BEGIN
  var RIVALS = {
    "bakery-1": {"v":9,"L":1,"t":25.4},
    "bakery-2": {"v":8,"L":1,"t":32.4},
    "bakery-3": {"v":7,"L":1,"t":42.9},
    "bakery-4": {"v":8,"L":1,"t":48.6},
    "bakery-5": {"v":8,"L":1,"t":59.1},
    "bakery-6": {"v":8,"L":1,"t":60.4},
    "bakery-7": {"v":7,"L":1,"t":83.8},
    "bakery-8": {"v":4.5,"L":1,"t":114.3},
    "dunes-1": {"v":10,"L":2,"t":28.8},
    "dunes-2": {"v":9,"L":2,"t":34.5},
    "dunes-3": {"v":9,"L":2,"t":38.3},
    "dunes-4": {"v":7,"L":2,"t":57.3},
    "dunes-5": {"v":7,"L":3,"t":68.2},
    "dunes-6": {"v":6.5,"L":3,"t":81.7},
    "dunes-7": {"v":7,"L":4,"t":95.9},
    "dunes-8": {"v":7,"L":3,"t":84.5},
    "harbour-1": {"v":10,"L":3,"t":27.4},
    "harbour-2": {"v":10,"L":3,"t":35.7},
    "harbour-3": {"v":10,"L":3,"t":34.8},
    "harbour-4": {"v":6.5,"L":3,"t":62.8},
    "harbour-5": {"v":10,"L":3,"t":56.2},
    "harbour-6": {"v":7.5,"L":3,"t":72.9},
    "harbour-7": {"v":4,"L":3,"t":162.1},
    "harbour-8": {"v":4,"L":5,"t":137.9},
    "frost-1": {"v":9,"L":4,"t":29.2},
    "frost-2": {"v":10,"L":4,"t":32.5},
    "frost-3": {"v":10,"L":4,"t":35.1},
    "frost-4": {"v":6.5,"L":4,"t":64.8},
    "frost-5": {"v":8,"L":4,"t":64},
    "frost-6": {"v":7.5,"L":5,"t":72},
    "frost-7": {"v":7,"L":4,"t":100.3},
    "frost-8": {"v":8,"L":4,"t":80},
    "chilli-1": {"v":10,"L":5,"t":29.5},
    "chilli-2": {"v":9,"L":5,"t":36.5},
    "chilli-3": {"v":8,"L":5,"t":46.2},
    "chilli-4": {"v":8,"L":5,"t":57.3},
    "chilli-5": {"v":7,"L":5,"t":70.7},
    "chilli-6": {"v":5.5,"L":5,"t":92.5},
    "chilli-7": {"v":6,"L":5,"t":119},
    "chilli-8": {"v":5,"L":5,"t":113.5},
    "market-1": {"v":10,"L":5,"t":29.6},
    "market-2": {"v":10,"L":5,"t":36.4},
    "market-3": {"v":10,"L":5,"t":37.7},
    "market-4": {"v":9,"L":5,"t":50.6},
    "market-6": {"v":7.5,"L":5,"t":72},
    "market-7": {"v":9,"L":5,"t":83},
    "market-8": {"v":8,"L":5,"t":85.3},
    "back-1": {"v":7.5,"L":1,"t":34.6},
    "back-2": {"v":8,"L":1,"t":36.4},
    "back-3": {"v":10,"L":1,"t":32.9},
    "back-4": {"v":9,"L":1,"t":36.7},
    "back-5": {"v":10,"L":1,"t":43.5},
    "back-6": {"v":6.5,"L":1,"t":69.6},
    "bakery-9": {"v":10,"L":2,"t":35.8},
    "bakery-10": {"v":10,"L":2,"t":38.5},
    "bakery-11": {"v":10,"L":2,"t":57.5},
    "bakery-12": {"v":10,"L":2,"t":65.2}
  };
  // RIVALS-END
  function rivalFor(id) { return RIVALS[id] || null; }
  function rivalUpgrades(L) { var u = {}; UPGRADES.forEach(function (x) { u[x.id] = L; }); return u; }

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

  // The live gap to a ghost, in seconds: positive means you are behind it.
  // Both runs step in lockstep, so each keeps its furthest x per step and the gap
  // is when you reached a point against when the ghost did. Whoever is behind is
  // measured from now, so stopping costs time; a finished ghost is measured from
  // its arrival, so pulling deeper into the stop zone does not count as gaining.
  function ghostGap() {
    var me = [], gh = [], meMax = -Infinity, ghMax = -Infinity, ghEnd = -1;
    function firstAt(list, x) {
      var lo = 0, hi = list.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (list[mid] >= x) hi = mid; else lo = mid + 1; }
      return lo;
    }
    return {
      push: function (xMe, xGhost, ghostDriving) {
        meMax = Math.max(meMax, xMe); ghMax = Math.max(ghMax, xGhost);
        me.push(meMax); gh.push(ghMax);
        if (!ghostDriving && ghEnd < 0) ghEnd = gh.length - 1;
      },
      gap: function () {
        var now = me.length - 1;
        if (now < 0) return 0;
        if (meMax >= ghMax) return (firstAt(me, ghMax) - (ghEnd >= 0 ? firstAt(gh, ghMax) : now)) * STEP;
        return (now - firstAt(gh, meMax)) * STEP;
      }
    };
  }

  // ════ Route challenges: one extra objective per career route ═════
  // The table is written by `node dev/sim.js challenges --write`, which sets each
  // target from what a bot driver manages, so every challenge is proven possible.
  var FEATURE_NAMES = { bridge: "the bridges", ford: "the fords", slick: "the ice", bump: "the speed bumps", wind: "the windy stretch", ramp: "the ramps", hay: "the hay", seesaw: "the seesaw bridges", ducks: "the duck crossings", sails: "the windmill sails" };
  // CHALLENGES-BEGIN
  var CHALLENGES = {
    "bakery-1": {"kind":"coins","n":9},
    "bakery-2": {"kind":"speed","n":12},
    "bakery-3": {"kind":"fuel","n":0.8},
    "bakery-4": {"kind":"air","n":0.7},
    "bakery-5": {"kind":"truck","truck":"tuktuk"},
    "bakery-6": {"kind":"flat","n":0.4},
    "bakery-7": {"kind":"fuel","n":0.8},
    "bakery-8": {"kind":"coins","n":32},
    "dunes-1": {"kind":"speed","n":12},
    "dunes-2": {"kind":"coins","n":20},
    "dunes-3": {"kind":"flat","n":0.4},
    "dunes-4": {"kind":"truck","truck":"buggy"},
    "dunes-5": {"kind":"flat","n":0.4},
    "dunes-6": {"kind":"air","n":0.6},
    "dunes-7": {"kind":"fuel","n":0.75},
    "dunes-8": {"kind":"coins","n":42},
    "harbour-1": {"kind":"coins","n":14},
    "harbour-2": {"kind":"calm","feature":"bridge","n":5},
    "harbour-3": {"kind":"speed","n":13},
    "harbour-4": {"kind":"calm","feature":"ford","n":4},
    "harbour-5": {"kind":"truck","truck":"van"},
    "harbour-6": {"kind":"flat","n":0.4},
    "harbour-7": {"kind":"fuel","n":0.75},
    "harbour-8": {"kind":"calm","feature":"bridge","n":4.5},
    "frost-1": {"kind":"coins","n":16},
    "frost-2": {"kind":"calm","feature":"slick","n":4},
    "frost-3": {"kind":"coins","n":23},
    "frost-4": {"kind":"fuel","n":0.8},
    "frost-5": {"kind":"truck","truck":"hauler"},
    "frost-6": {"kind":"calm","feature":"slick","n":7.5},
    "frost-7": {"kind":"flat","n":0.4},
    "frost-8": {"kind":"coins","n":34},
    "chilli-1": {"kind":"air","n":0.9},
    "chilli-2": {"kind":"coins","n":10},
    "chilli-3": {"kind":"flat","n":0.4},
    "chilli-4": {"kind":"coins","n":24},
    "chilli-5": {"kind":"truck","truck":"monster"},
    "chilli-6": {"kind":"coins","n":35},
    "chilli-7": {"kind":"fuel","n":0.75},
    "chilli-8": {"kind":"coins","n":38},
    "market-1": {"kind":"coins","n":14},
    "market-2": {"kind":"calm","feature":"bump","n":5.5},
    "market-3": {"kind":"air","n":0.9},
    "market-4": {"kind":"calm","feature":"slick","n":7.5,"wet":true},
    "market-5": {"kind":"truck","truck":"hauler"},
    "market-6": {"kind":"flat","n":0.5},
    "market-7": {"kind":"fuel","n":0.75},
    "market-8": {"kind":"coins","n":37},
    "back-1": {"kind":"coins","n":21},
    "back-2": {"kind":"calm","feature":"hay","n":3.5},
    "back-3": {"kind":"calm","feature":"seesaw","n":4.5},
    "back-4": {"kind":"flat","n":0.4},
    "back-5": {"kind":"coins","n":24},
    "back-6": {"kind":"fuel","n":0.8},
    "bakery-9": {"kind":"coins","n":24},
    "bakery-10": {"kind":"coins","n":25},
    "bakery-11": {"kind":"coins","n":29},
    "bakery-12": {"kind":"coins","n":41}
  };
  // CHALLENGES-END
  function challengeFor(id) { return CHALLENGES[id] || null; }
  function challengeText(c) {
    if (!c) return "";
    if (c.kind === "coins") return "Pick up " + c.n + " road coins";
    if (c.kind === "nobrake") return "Stop at the depot without touching BRAKE or the wall";
    if (c.kind === "fuel") return "Finish with " + Math.round(c.n * 100) + "% of the tank left";
    if (c.kind === "flat") return "No jump longer than " + c.n + "s";
    if (c.kind === "air") return "Get " + c.n + "s of air in one jump";
    if (c.kind === "speed") return "Reach " + c.n + " m/s";
    if (c.kind === "truck") return "Deliver in the " + truckSpec(c.truck).name;
    if (c.kind === "calm") return "Cross " + (c.wet ? "the wet cobbles" : FEATURE_NAMES[c.feature] || c.feature) + " below " + c.n + " m/s";
    return "";
  }
  // Every challenge also needs the delivery made with at least two stars.
  function challengeMet(c, r) {
    if (!c || r.status !== "done" || r.stars < 2 || r.long) return false;
    if (c.kind === "coins") return r.coinsTaken >= c.n;
    if (c.kind === "nobrake") return !r.brakeUsed && !r.dockHit;
    if (c.kind === "fuel") return r.fuelShare >= c.n;
    if (c.kind === "flat") return r.bestAir <= c.n;
    if (c.kind === "air") return r.bestAir >= c.n;
    if (c.kind === "speed") return r.topSpeed >= c.n;
    if (c.kind === "truck") return r.truck === c.truck;
    if (c.kind === "calm") return r.featMax[c.feature] != null && r.featMax[c.feature] <= c.n;
    return false;
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
    { id: "long", text: "Drive 400 metres in one Long Haul", goal: 1, pay: 50, count: function (r) { return r.long && r.metres >= 400 ? 1 : 0; } },
    // app.js adds beatRival, beatGhost, challengeDone and orderDone to the report before counting.
    { id: "rival", text: "Beat Dash Dalloway on any route", goal: 1, pay: 50, count: function (r) { return r.beatRival ? 1 : 0; } },
    { id: "ghost", text: "Beat your own ghost on any route", goal: 1, pay: 45, count: function (r) { return r.beatGhost ? 1 : 0; } },
    { id: "challenge", text: "Complete a route challenge", goal: 1, pay: 50, count: function (r) { return r.challengeDone ? 1 : 0; } },
    { id: "order", text: "Deliver a Special Order", goal: 1, pay: 60, count: function (r) { return r.orderDone ? 1 : 0; } },
    { id: "landings", text: "Land 10 jumps", goal: 10, pay: 35, count: function (r) { return r.landings || 0; } },
    { id: "silver", text: "Win 2 silver or gold medals", goal: 2, pay: 45, count: function (r) { return r.medal >= 2 ? 1 : 0; } },
    { id: "speed", text: "Reach 10 m/s", goal: 1, pay: 30, count: function (r) { return r.topSpeed >= 10 ? 1 : 0; } },
    { id: "milk", region: 1, text: "Deliver 6 bottles of milk", goal: 6, pay: 45, count: function (r) { return r.status === "done" ? r.kinds.milk : 0; } },
    { id: "melon", region: 1, text: "Deliver 4 melons", goal: 4, pay: 45, count: function (r) { return r.status === "done" ? r.kinds.melon : 0; } },
    { id: "cake", region: 2, text: "Deliver 4 cakes", goal: 4, pay: 50, count: function (r) { return r.status === "done" ? r.kinds.cake : 0; } },
    { id: "icecream", region: 3, text: "Deliver 4 ice creams", goal: 4, pay: 55, count: function (r) { return r.status === "done" ? r.kinds.icecream : 0; } },
    { id: "popcorn", region: 4, text: "Deliver 6 bags of popcorn", goal: 6, pay: 55, count: function (r) { return r.status === "done" ? r.kinds.popcorn : 0; } }
  ];
  // One bigger job a week.
  var WEEKLY = [
    { id: "w-loads", text: "Deliver 60 loads this week", goal: 60, pay: 220, count: function (r) { return r.status === "done" ? r.kept : 0; } },
    { id: "w-stars", text: "Earn 30 stars in deliveries this week", goal: 30, pay: 220, count: function (r) { return r.status === "done" ? r.stars : 0; } },
    { id: "w-medals", text: "Win 8 medals this week", goal: 8, pay: 240, count: function (r) { return r.medal ? 1 : 0; } },
    { id: "w-metres", text: "Drive 10 kilometres this week", goal: 10000, pay: 220, count: function (r) { return r.metres; } },
    { id: "w-orders", text: "Deliver 3 Special Orders this week", goal: 3, pay: 260, count: function (r) { return r.orderDone ? 1 : 0; } }
  ];
  function weeklyFor(week) { return WEEKLY[hash("weekly" + week) % WEEKLY.length]; }

  // ════ Weekly Cup: five career routes a week, best times added up ═══
  // The legs come from the week and the regions a player has reached, so
  // everyone at the same point gets the same cup.
  function cupFor(week, maxRegion, freeOnly) {
    var r = rng(hash("cup" + week + ":" + maxRegion)), legs = [];
    var pool = DELIVERIES.filter(function (d) { return d.region <= maxRegion && d.index !== 6 && (!freeOnly || isFree(d.id)); });
    while (legs.length < 5 && pool.length) legs.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    legs.sort(function (a, b) { return a.region - b.region || a.index - b.index; });
    var sum = function (k) { return legs.reduce(function (n, d) { return n + medalTimes(d)[k]; }, 0); };
    return { week: week, legs: legs, gold: sum("gold"), silver: sum("silver"), bronze: sum("bronze") };
  }
  function contractsFor(date, maxRegion) {
    var top = maxRegion == null ? REGIONS.length : maxRegion;
    var r = rng(hash("contracts" + date)), pool = CONTRACTS.filter(function (c) { return (c.region || 0) <= top; }), out = [];
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
    if (d && d.side) {
      if (regionStars(0, stars) < SIDE_OPEN[d.track]) return false;
      var list = sideTrack(d.track), k = list.indexOf(d);
      return k === 0 || (stars[list[k - 1].id] || 0) > 0 || (k > 1 && (stars[list[k - 2].id] || 0) > 0);
    }
    if (d.region > 0 && regionStars(d.region - 1, stars) < BALANCE.regionStars) return false;
    if (d.index === 0) return true;
    var region = DELIVERIES.filter(function (x) { return x.region === d.region; });
    return (stars[region[d.index - 1].id] || 0) > 0 || (d.index > 1 && (stars[region[d.index - 2].id] || 0) > 0);
  }

  return {
    STEP: STEP, BALANCE: BALANCE, REGIONS: REGIONS, ROUTES: ROUTES, DELIVERIES: DELIVERIES, UPGRADES: UPGRADES, MAX_LEVEL: MAX_LEVEL,
    EVENTS: EVENTS, activeEvent: activeEvent, regionFor: regionFor, WINTER_ROUTES: WINTER_ROUTES, WINTER_DOORS: WINTER_DOORS, WINTER_ORDERS: WINTER_ORDERS, winterDelivery: winterDelivery,
    TRUCKS: TRUCKS, EVENT_TRUCKS: EVENT_TRUCKS, CARGO_TYPES: CARGO_TYPES, CONTRACTS: CONTRACTS, truckSpec: truckSpec, dimsFor: dimsFor, DIM: DIM, SAMPLE: SAMPLE,
    cargoSize: cargoSize, NEW_CARGO: NEW_CARGO, createGame: createGame, report: report, upgradeCost: upgradeCost, isOpen: isOpen, regionStars: regionStars,
    findDelivery: findDelivery, dailyDelivery: dailyDelivery, topUpRun: topUpRun, dailyRoad: dailyRoad, TEST_DRIVES: TEST_DRIVES, findTestDrive: findTestDrive, loadFor: loadFor, dailyRegion: dailyRegion, DAILY_TRUCK: DAILY_TRUCK, DAILY_POOL: DAILY_POOL, DAILY_LEVEL: DAILY_LEVEL, isFree: isFree, FREE_ROUTES: FREE_ROUTES, longHaul: longHaul, parTime: parTime, medalTimes: medalTimes,
    contractsFor: contractsFor, weeklyFor: weeklyFor, cupFor: cupFor, WEEKLY: WEEKLY, ghostPath: ghostPath, ghostGap: ghostGap, featureAt: featureAt,
    CUSTOMERS: CUSTOMERS, ORDERS: ORDERS, REP_STARS: REP_STARS, findOrder: findOrder, repLevel: repLevel, orderText: orderText,
    botInput: botInput, rivalFor: rivalFor, rivalUpgrades: rivalUpgrades, RIVALS: RIVALS, MEDALS: MEDALS, ROADS: ROADS, challengeFor: challengeFor, challengeText: challengeText, challengeMet: challengeMet, CHALLENGES: CHALLENGES,
    heightAt: heightAt, normalAngle: normalAngle, hash: hash, rng: rng,
    routePreview: routePreview, medalTimes: medalTimes,
    SIDE: SIDE, SIDE_ROADS: SIDE_ROADS, SIDE_OPEN: SIDE_OPEN, sideTrack: sideTrack, sideStars: sideStars, duckState: duckState, SEESAW: SEESAW
  };
});
