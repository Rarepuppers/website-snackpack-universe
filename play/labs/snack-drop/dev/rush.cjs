const assert = require("node:assert/strict");
const path = require("node:path");
const SD = require("../engine.js");
const planck = require("../vendor/planck-1.5.1.min.js");

const seed = 42;
const newRush = (restore) => SD.createGame({ seed, mode: "rush", container: "icecooler", restore });
const snapshot = (game) => JSON.parse(JSON.stringify(game.snapshot()));

function tick(game, input) {
  game.events.length = 0;
  game.step(input);
  return game.events.slice();
}

function manualDrops(game, count) {
  for (let n = 0; n < count; n++) {
    for (let i = 0; i < 70 && !game.canDrop(); i++) tick(game);
    assert(game.canDrop());
    tick(game, { drop: SD.RUSH.lanes[n % SD.RUSH.lanes.length] });
  }
}

function blockEntries(game) {
  let crate = game.world.getBodyList();
  while (!crate.getUserData()?.crate) crate = crate.getNext();
  return crate.createFixture({ shape: new planck.Box(SD.CRATE.half, .1,
    { x: 0, y: SD.CRATE.dropY }), isSensor: true });
}

{
  const old = SD.createGame({ seed, mode: "arcade" });
  tick(old, { drop: 0 });
  assert.equal(newRush(snapshot(old)).drops, 0);
  const rush = newRush();
  tick(rush, { rush: true });
  const normal = SD.createGame({ seed, mode: "arcade", restore: snapshot(rush) });
  assert.equal(normal.snacks.length, 0);
  assert.deepEqual(normal.tray, ["swap"]);
  const previous = snapshot(rush);
  previous.rules = SD.RUSH_VERSION + 1;
  assert.equal(newRush(previous).rush.charges, 1);
}

{
  const g = newRush(), before = snapshot(g);
  assert.equal(g.container, "pantry");
  assert.equal(before.rules, SD.RUSH_VERSION);
  assert.equal(g.rush.charges, 1);
  assert.deepEqual(g.tray, []);
  const plan = g.rushPreview();
  assert.deepEqual(plan, g.rushPreview(), "preview is read-only");
  assert.equal(new Set(plan.map((s) => s.lane)).size, 5);
  assert(plan.every((s) => s.tier >= 1 && s.tier <= 3));
  g.dropMerges = 2;
  const emissions = [];
  for (let i = 1; i <= 49; i++) {
    const events = tick(g, { rush: i === 1, drop: 0 });
    for (const ev of events) if (ev.rapid) emissions.push([i, ev.tier, ev.x]);
    if (i === 1) {
      assert.equal(g.dropMerges, 0);
      g.dropMerges = 2;
    }
    if (i === 13) assert.equal(g.dropMerges, 2, "later slots retain the burst's Fever count");
  }
  assert.deepEqual(emissions, plan.map((slot, i) => [1 + 12 * i, slot.tier, SD.RUSH.lanes[slot.lane]]));
  assert.equal(g.drops, 0, "manual input is blocked through the final dispense tick");
  assert.equal(g.rush.drops, 5);
  assert.equal(g.rush.charges, 0);
  assert.equal(g.rush.active, null);
  const after = snapshot(g);
  for (const key of ["current", "next", "rand"]) assert.equal(after[key], before[key]);
}

{
  const initial = snapshot(newRush()), first = newRush().rushPreview()[0];
  initial.snacks = [[1, 3, SD.RUSH.lanes[first.lane], SD.CRATE.dropY, .48, 0, 0, 0, 0, 0, 0]];
  initial.nextId = 2;
  const g = newRush(initial);
  const drop = tick(g, { rush: true }).find((e) => e.rapid);
  assert(drop && drop.x !== SD.RUSH.lanes[first.lane], "a rotated blocker sends the drop to an alternate lane");
}

{
  const g = newRush(), before = snapshot(g);
  blockEntries(g);
  const events = tick(g, { rush: true });
  assert(events.some((e) => e.action === "blocked"));
  assert.equal(g.rush.active, null);
  assert.equal(g.rush.charges, 1);
  assert.equal(snapshot(g).rush.rand, before.rush.rand);
}

{
  const state = snapshot(newRush());
  for (let i = 0; i < SD.RUSH.maxBodies; i++) {
    const x = -2.8 + .7 * (i % 8), y = .4 + .7 * Math.floor(i / 8);
    state.snacks.push([state.nextId++, 0, x, y, 0, 0, 0, 0, 0, 0, 0]);
  }
  const g = newRush(state);
  assert(tick(g, { rush: true }).some((e) => e.action === "blocked"));
  assert.equal(g.rush.drops, 0);
  assert.equal(g.rush.charges, 1);
}

{
  const g = newRush();
  manualDrops(g, 7); assert.equal(g.rush.charges, 1);
  manualDrops(g, 1); assert.equal(g.rush.charges, 2);
  manualDrops(g, 8); assert.equal(g.rush.charges, 2, "stock cap");
  tick(g, { rush: true }); tick(g, { rush: true });
  const saved = snapshot(g), restored = newRush(saved);
  assert(saved.rush.active.spent && saved.rush.queued);
  const resumed = snapshot(restored);
  assert.deepEqual(resumed.rush, saved.rush, "resume preserves queue, due tick, RNG and prior spend");
  assert.deepEqual(resumed.snacks.map((s) => s.slice(0, 4)), saved.snacks.map((s) => s.slice(0, 4)));
  assert.equal(restored.canRush(), false, "a third burst cannot queue");
  for (let i = 0; i < 180 && restored.rush.active; i++) tick(restored);
  assert.equal(restored.rush.drops, 10, "both bursts finish after resume");
  assert.equal(restored.rush.charges, 0);
  assert.equal(restored.rush.active, null);
}

{
  const state = snapshot(newRush());
  state.rush.charges = 2;
  const g = newRush(state);
  tick(g, { rush: true }); tick(g, { rush: true }); blockEntries(g);
  const actions = [];
  for (let i = 0; i < 180 && g.rush.active; i++) {
    for (const ev of tick(g)) if (ev.type === "rush") actions.push(ev.action);
  }
  assert.equal(actions.filter((a) => a === "skipped").length, 4);
  assert.equal(actions.filter((a) => a === "blocked").length, 1);
  assert.equal(g.rush.drops, 1);
  assert.equal(g.rush.charges, 1, "queued burst is free when every first lane stays blocked");
  assert.equal(g.rush.active, null);
}

{
  const initial = snapshot(newRush());
  initial.snacks = [[1, 8, 0, SD.CRATE.line, 0, 0, 0, 0, 0, 1, SD.BALANCE.overLimit - SD.STEP / 2]];
  initial.nextId = 2;
  const g = newRush(initial);
  tick(g, { rush: true });
  assert.equal(g.status, "over", "Rapid Drop gives no grace to the existing pile");
  assert.equal(g.guard, 0);
}

{
  function replay() {
    const game = newRush(), events = [];
    for (let i = 0; i < 1200; i++) {
      const input = { rush: i === 400, drop: i % 35 === 0 ? SD.RUSH.lanes[(i / 35) % 5] : null };
      events.push(...tick(game, input));
    }
    return { state: snapshot(game), events };
  }
  assert.deepEqual(replay(), replay(), "same seed and logged Rush actions replay exactly");
}

if (process.argv[2]) {
  const base = require(path.resolve(process.argv[2]));
  for (const mode of ["classic", "arcade", "pro", "daily"]) {
    for (const container of SD.CONTAINER_ORDER) {
      const opts = { seed, mode, container };
      const old = base.createGame(opts), current = SD.createGame(opts), rand = SD.rng(seed);
      for (let i = 0; i < 21600; i++) {
        const drop = old.canDrop() && old.snacks.every((s) => s.landed) ? base.botAim(old, "careful", rand) : null;
        const tool = i % 60 === 0 ? base.botTool(old) : null;
        const input = { drop, tool, rush: i % 30 === 0 };
        assert.deepEqual(tick(current, input), tick(old, input), `${mode}/${container} events at tick ${i}`);
        if (i % 60 === 0 || current.status === "over") {
          assert.deepEqual(snapshot(current), snapshot(old), `${mode}/${container} snapshot at tick ${i}`);
        }
        if (old.status === "over") break;
      }
      assert.deepEqual(snapshot(current), snapshot(old));
      assert.equal(current.status, "over", `${mode}/${container} reaches game over`);
    }
  }
  console.log("Existing engines match across 16 mode and container combinations.");
}
console.log("Rush engine checks passed.");
