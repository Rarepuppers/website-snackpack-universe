import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatSnapshot } from "./CombatSimulation";

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    kitPressed: false,
    pausePressed: false,
    restartPressed: false,
    ...overrides,
  };
}

/** Steps the wave loop, instantly killing everything, until a decision appears. */
function runUntilDecision(simulation: CombatSimulation, maxFrames: number): CombatSnapshot {
  let snapshot = simulation.snapshot();
  for (let frame = 0; frame < maxFrames; frame += 1) {
    snapshot = simulation.step(intent(), 0.05);
    if (snapshot.pendingDecision) {
      return snapshot;
    }
    for (const enemy of snapshot.enemies) {
      simulation.dealDamage(enemy.id, 9999);
    }
  }
  return snapshot;
}

describe("damage types, resistances, and armour", () => {
  it("multiplies typed damage by enemy resistances", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const eggId = simulation.spawnEnemy("egg-cluster", { x: 3, y: 3 });

    simulation.dealDamage(eggId, 10, "fire");

    const egg = simulation.snapshot().enemies.find((enemy) => enemy.id === eggId);
    expect(egg?.health).toBeCloseTo(35 - 15);
  });

  it("applies rare flat damage reduction per hit", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const bossId = simulation.spawnMiniBoss("siege-crusher", { x: 4, y: 4 });

    simulation.dealDamage(bossId, 10, "physical");

    const boss = simulation.snapshot().enemies.find((enemy) => enemy.id === bossId);
    expect(boss?.health).toBeCloseTo(3000 - 8);
  });

  it("builds up and applies an Overload stun from shock damage", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    const eliteId = simulation.spawnElite("carapace-scuttler", { x: player.x + 6, y: player.y });

    simulation.dealDamage(eliteId, 45, "shock");
    const applied = simulation.snapshot();
    const elite = applied.enemies.find((enemy) => enemy.id === eliteId);
    expect(applied.events.some((event) => event.type === "status-applied" && event.status === "overload")).toBe(true);
    expect(elite?.statuses).toContain("overload");

    const before = elite!.position.x;
    const stepped = simulation.step(intent(), 0.05);
    const after = stepped.enemies.find((enemy) => enemy.id === eliteId);
    expect(after?.position.x).toBeCloseTo(before);
  });

  it("ticks Blaze damage over time after fire buildup", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    const eliteId = simulation.spawnElite("carapace-scuttler", { x: player.x + 6, y: player.y });

    simulation.dealDamage(eliteId, 42, "fire");
    const burning = simulation.snapshot().enemies.find((enemy) => enemy.id === eliteId);
    expect(burning?.statuses).toContain("blaze");

    const healthAfterHit = burning!.health;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 20; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    const after = snapshot.enemies.find((enemy) => enemy.id === eliteId);
    expect(after!.health).toBeLessThan(healthAfterHit);
  });
});

describe("player shields", () => {
  it("absorbs contact damage with an Aegis shield before health", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnPowerup("aegis", { x: player.x, y: player.y });
    let snapshot = simulation.step(intent(), 0.05);
    expect(snapshot.playerShield).toBe(25);

    simulation.spawnEnemy("scuttler", { x: player.x, y: player.y });
    for (let frame = 0; frame < 10; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    expect(snapshot.playerHealth).toBe(snapshot.playerMaxHealth);
    expect(snapshot.playerShield).toBeLessThan(25);
  });
});

describe("powerups and timed buffs", () => {
  it("collects a powerup into a timed buff", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnPowerup("overcharge", { x: player.x, y: player.y });

    const snapshot = simulation.step(intent(), 0.05);

    expect(snapshot.events.some((event) => event.type === "powerup-collected")).toBe(true);
    expect(snapshot.powerups).toHaveLength(0);
    const buff = snapshot.activeBuffs.find((candidate) => candidate.type === "overcharge");
    expect(buff).toBeDefined();
    expect(buff!.remainingSeconds).toBeGreaterThan(5);
  });

  it("expires uncollected powerups", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.spawnPowerup("adrenaline", { x: 2, y: 2 });
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 245; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    expect(snapshot.powerups).toHaveLength(0);
    expect(snapshot.activeBuffs).toHaveLength(0);
  });

  it("activates Uranium-Core Rounds from the kit slot and expires after twelve seconds", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingUraniumKit: true });
    let snapshot = simulation.step(intent({ kitPressed: true }), 0.05);

    expect(snapshot.uraniumKitAvailable).toBe(false);
    expect(snapshot.events.some((event) => event.type === "kit-activated")).toBe(true);
    const uranium = snapshot.activeBuffs.find((buff) => buff.type === "uranium-core-rounds");
    expect(uranium?.durationSeconds).toBe(12);
    expect(uranium?.remainingSeconds).toBeGreaterThan(11.9);

    for (let frame = 0; frame < 245; frame += 1) snapshot = simulation.step(intent(), 0.05);
    expect(snapshot.activeBuffs.some((buff) => buff.type === "uranium-core-rounds")).toBe(false);
  });

  it("refreshes Uranium-Core Rounds without stacking duration or magnitude", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startWithUraniumBuff: true });
    for (let frame = 0; frame < 80; frame += 1) simulation.step(intent(), 0.05);
    const player = simulation.snapshot().playerPosition;
    simulation.spawnPowerup("uranium-core-rounds", player);
    const snapshot = simulation.step(intent(), 0.05);
    const uranium = snapshot.activeBuffs.find((buff) => buff.type === "uranium-core-rounds");
    expect(uranium?.remainingSeconds).toBeGreaterThan(11.9);
    expect(uranium?.remainingSeconds).toBeLessThanOrEqual(12);
  });

  it("adds twenty-five percent damage to direct ring-weapon hits", () => {
    const baseline = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["patrol-blade"],
    });
    const boosted = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["patrol-blade"],
      startWithUraniumBuff: true,
    });
    const basePlayer = baseline.snapshot().playerPosition;
    const boostPlayer = boosted.snapshot().playerPosition;
    baseline.spawnEnemy("egg-cluster", { x: basePlayer.x + 1.4, y: basePlayer.y });
    boosted.spawnEnemy("egg-cluster", { x: boostPlayer.x + 1.4, y: boostPlayer.y });

    const baseBefore = baseline.snapshot().enemies[0]!.health;
    const boostBefore = boosted.snapshot().enemies[0]!.health;
    const baseAfter = baseline.step(intent(), 0.05).enemies[0]!.health;
    const boostAfter = boosted.step(intent(), 0.05).enemies[0]!.health;
    const baseDamage = baseBefore - baseAfter;
    const boostedDamage = boostBefore - boostAfter;
    expect(boostedDamage).toBeCloseTo(baseDamage * 1.25);
  });
});

describe("new enemies", () => {
  it("detonates a Blast Mite near the player", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("blast-mite", { x: player.x + 0.6, y: player.y });

    let observedExplosion = false;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 30 && !observedExplosion; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      observedExplosion ||= snapshot.events.some((event) => event.type === "explosion");
    }

    expect(observedExplosion).toBe(true);
    expect(snapshot.playerHealth).toBeLessThan(snapshot.playerMaxHealth);
    expect(snapshot.enemies).toHaveLength(0);
  });

  it("teleports a Warp Flanker beside the player after a telegraph", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 3 });
    const player = simulation.snapshot().playerPosition;
    const flankerId = simulation.spawnEnemy("warp-flanker", { x: player.x + 11, y: player.y });

    const observedPhases = new Set<string>();
    let observedArrival = false;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 80; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      const flanker = snapshot.enemies.find((enemy) => enemy.id === flankerId);
      if (flanker?.warpPhase) observedPhases.add(flanker.warpPhase);
      observedArrival ||= snapshot.events.some((event) => event.type === "warp-arrival");
      if (observedArrival) break;
    }

    expect(observedPhases).toContain("warp-windup");
    expect(observedArrival).toBe(true);
    const flanker = snapshot.enemies.find((enemy) => enemy.id === flankerId);
    const distanceToPlayer = Math.hypot(
      flanker!.position.x - snapshot.playerPosition.x,
      flanker!.position.y - snapshot.playerPosition.y,
    );
    expect(distanceToPlayer).toBeLessThanOrEqual(2.5);
  });
});

describe("five-wave run and intermission rewards", () => {
  it("runs five total waves", () => {
    const simulation = new CombatSimulation({ seed: 11 });
    expect(simulation.snapshot().totalWaves).toBe(5);
  });

  it("offers a weapon chest after wave one and a Supply Depot after wave two", () => {
    const simulation = new CombatSimulation({ seed: 21 });

    const chest = runUntilDecision(simulation, 260);
    expect(chest.pendingDecision?.kind).toBe("weapon-chest");
    const optionIds = chest.pendingDecision!.options.map((option) => option.id);
    expect(optionIds).toContain("scattergun");
    expect(optionIds).toContain("arc-carbine");
    expect(optionIds).not.toContain("bastion-service-rifle");

    expect(simulation.chooseOption("scattergun")).toBe(true);
    expect(simulation.snapshot().equippedWeapons.map((weapon) => weapon.weaponId))
      .toEqual(["bastion-service-rifle", "scattergun"]);

    const depot = runUntilDecision(simulation, 500);
    expect(depot.pendingDecision?.kind).toBe("supply-depot");
    expect(simulation.chooseOption("aegis-lattice")).toBe(true);
    expect(simulation.snapshot().playerShield).toBe(25);
  });

  it("spawns a wave powerup from wave two onward", () => {
    const simulation = new CombatSimulation({ seed: 21 });
    const chest = runUntilDecision(simulation, 260);
    expect(chest.pendingDecision?.kind).toBe("weapon-chest");
    simulation.chooseOption("arc-carbine");

    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 60 && snapshot.powerups.length === 0; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      for (const enemy of snapshot.enemies) {
        simulation.dealDamage(enemy.id, 9999);
      }
    }
    expect(snapshot.powerups.length).toBeGreaterThan(0);
  });
});
