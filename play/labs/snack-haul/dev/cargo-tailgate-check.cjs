// Controlled contacts exercise the same fixed-step physics as a delivery.
const assert = require("node:assert/strict");
const SH = require("../engine.js");

const base = SH.findDelivery("bakery-1");
const delivery = Object.assign({}, base, { load: ["crate"] });
const idle = { gas: false, brake: false };

function game(truck = "pickup", extra = {}) {
  const g = SH.createGame({ delivery, truck, ...extra });
  for (let i = 0; i < 48; i++) g.step(idle);
  g.events.length = 0;
  return g;
}

function pose(body, x, y, vx, vy) {
  body.setTransform({ x, y }, 0);
  body.setLinearVelocity({ x: vx, y: vy });
  body.setAngularVelocity(0);
}

function restage(g, speed) {
  const x = 8, y = SH.heightAt(g.terrain, x) + 1.5;
  pose(g.truck, x, y, 0, -speed);
  g.wheels.forEach((wheel, i) => pose(wheel, x + (i ? g.dim.frontX : g.dim.rearX), y + g.dim.axleY, 0, -speed));
  pose(g.cargo[0].body, x - .20, y + g.dim.bedHeight + g.cargo[0].h / 2, 0, -speed);
  return { x, y };
}

function impacts(g, speed) {
  const after = [];
  for (let hit = 1; hit <= 4; hit++) {
    assert.equal(g.status, "driving");
    restage(g, speed);
    for (let step = 0; step < 24; step++) g.step(idle);
    after.push(g.events.splice(0).map(event => event.type).filter(type => type.startsWith("tailgate")));
  }
  return after;
}

function blocksRearCargo(g) {
  const cargo = g.cargo[0].body;
  const { x, y } = restage(g, 0);
  pose(cargo, x - g.dim.bedHalf + .37, y + g.dim.bedHeight + g.cargo[0].h / 2, -3, 0);
  for (let step = 0; step < 17; step++) g.step(idle);
  return g.truck.getLocalPoint(cargo.getPosition()).x > -g.dim.bedHalf;
}

function deckBounce(speed, legacyCargoPhysics) {
  const g = game("pickup", { legacyCargoPhysics });
  const { x, y } = restage(g, 0);
  const cargo = g.cargo[0];
  pose(cargo.body, x - .20, y + g.dim.bedHeight + cargo.h / 2 + .20, 0, -speed);
  const seen = [];
  g.world.on("pre-solve", contact => {
    const bodies = [contact.getFixtureA().getBody(), contact.getFixtureB().getBody()];
    if (bodies.includes(g.truck) && bodies.includes(cargo.body)) seen.push(contact.getRestitution());
  });
  for (let step = 0; step < 12; step++) g.step(idle);
  assert(seen.length);
  return Math.max(...seen);
}

assert.equal(deckBounce(2, false), .04);
assert.equal(deckBounce(7, false), SH.BALANCE.cargoBedBounce);
assert.equal(deckBounce(7, true), .04);

const gentle = game();
assert.deepEqual(impacts(gentle, 3), [[], [], [], []]);
assert.equal(blocksRearCargo(gentle), true);

for (const truck of SH.TRUCKS) {
  const fresh = game(truck.id), mass = fresh.truck.getMass();
  assert.deepEqual(impacts(fresh, 14), [[], ["tailgateLoose"], ["tailgateLost"], []], truck.id);
  assert(fresh.tailgateFall, truck.id);
  assert.equal(fresh.truck.getMass(), mass, truck.id);
}
const harsh = game();
impacts(harsh, 14);
assert.equal(blocksRearCargo(harsh), false);
assert.equal(game().tailgateFall, null);

const legacy = game("pickup", { legacyCargoPhysics: true });
assert.deepEqual(impacts(legacy, 14), [[], [], [], []]);
assert.equal(blocksRearCargo(legacy), true);

for (const legacyCargoPhysics of [false, true]) {
  const opts = { id: "bakery-5", truck: "pickup", upgrades: SH.rivalUpgrades(1), legacyCargoPhysics };
  const g = SH.createGame(opts);
  while (g.status === "driving" && g.clock < 180) g.step(SH.botInput(g, 6));
  assert.equal(g.status, "done");
  assert.deepEqual(SH.ghostPath(opts, g.rec).report, SH.report(g));
}
console.log("Deck bounce, tailgate wear, cargo escape, fresh gate, legacy mode and ghost replays passed.");
