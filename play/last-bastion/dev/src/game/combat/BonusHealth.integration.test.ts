import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import { WAVE_THREAT_BUDGETS } from "./DensityDirector";
import { buildExpeditionWavePlan } from "../expedition/ExpeditionNodeDirector";

/**
 * §11.3 option B: overheal as a separate `bonusHealth` pool.
 *
 * These drive the real simulation rather than the pure view helpers, because
 * the pool being wired into the snapshot proves nothing about whether any heal
 * actually reaches it or whether damage ever spends it. Registration is not
 * function.
 */

// Intent is written out in full and never cast. The fire field is `fireHeld`;
// an `as PlayerIntent` cast previously hid a test that never fired at all.
const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  fireHeld: false,
  evasiveMovePressed: false,
  ultimatePressed: false,
  kitPressed: false,
  interactPressed: false,
  pausePressed: false,
  restartPressed: false,
};

function encounter(
  kind: ExpeditionEncounterDescriptor["kind"],
  column = 2,
): ExpeditionEncounterDescriptor {
  const waves = buildExpeditionWavePlan(kind, column, null, null);
  return {
    nodeId: 8,
    kind,
    column,
    themeId: "bastion-standard",
    seed: 2026,
    directorWaveIndex: column,
    threatBudget: waves[0]?.threatBudget ?? WAVE_THREAT_BUDGETS[column]!,
    eliteKind: null,
    miniBossKind: null,
    eventId: null,
    waves,
  };
}

/** A run that starts at full health, where an ordinary heal has nothing to do. */
function fullHealthAtDepot(scrap = 400): CombatSimulation {
  return new CombatSimulation({
    expeditionEncounter: encounter("supply-depot", 2),
    startingBuild: {
      health: 999,
      shield: 0,
      level: 1,
      experience: 0,
      scrap,
      weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }],
      upgrades: [],
    },
  });
}

/** A live combat node at full health, where a medkit has nothing to heal. */
function fullHealthCombat(): CombatSimulation {
  return new CombatSimulation({
    expeditionEncounter: encounter("combat", 2),
    startingBuild: {
      health: 999,
      shield: 0,
      level: 1,
      experience: 0,
      scrap: 0,
      weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }],
      upgrades: [],
    },
  });
}

describe("bonus health (overheal)", () => {
  it("starts empty and reports a ceiling of half maximum health", () => {
    const simulation = fullHealthAtDepot();
    const snapshot = simulation.snapshot();
    expect(snapshot.playerBonusHealth).toBe(0);
    expect(snapshot.playerMaxBonusHealth).toBeCloseTo(snapshot.playerMaxHealth * 0.5, 6);
  });

  it("banks a heal taken at full health instead of discarding it", () => {
    const simulation = fullHealthAtDepot();
    const before = simulation.snapshot();
    // Precondition: the heal genuinely has nowhere to go.
    expect(before.playerHealth).toBe(before.playerMaxHealth);
    expect(before.playerBonusHealth).toBe(0);

    expect(simulation.chooseOption("patch-up")).toBe(true);

    const after = simulation.snapshot();
    expect(after.playerHealth).toBe(after.playerMaxHealth);
    expect(after.playerBonusHealth).toBeGreaterThan(0);
  });

  it("never exceeds the ceiling across repeated heals", () => {
    const simulation = fullHealthAtDepot();
    expect(simulation.chooseOption("patch-up")).toBe(true);
    simulation.step(IDLE, 0.016);
    // The depot hands off to the shop, whose repair is a second full-health heal.
    expect(simulation.snapshot().pendingDecision?.kind).toBe("scrap-shop");
    for (let purchase = 0; purchase < 6; purchase += 1) {
      simulation.chooseOption("shop-repair");
      simulation.step(IDLE, 0.016);
    }
    const snapshot = simulation.snapshot();
    expect(snapshot.playerBonusHealth).toBeLessThanOrEqual(snapshot.playerMaxBonusHealth + 1e-9);
    expect(snapshot.playerHealth).toBe(snapshot.playerMaxHealth);
  });

  it("does not bank anything when the heal was actually needed", () => {
    const simulation = new CombatSimulation({
      expeditionEncounter: encounter("supply-depot", 2),
      startingBuild: {
        health: 1,
        shield: 0,
        level: 1,
        experience: 0,
        scrap: 0,
        weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }],
        upgrades: [],
      },
    });
    expect(simulation.chooseOption("patch-up")).toBe(true);
    const after = simulation.snapshot();
    expect(after.playerHealth).toBeGreaterThan(1);
    expect(after.playerBonusHealth).toBe(0);
  });

  it("banks a medkit collected at full health instead of wasting it", () => {
    const simulation = fullHealthCombat();
    const position = simulation.snapshot().playerPosition;
    simulation.spawnPowerup("medkit", { ...position });
    for (let frame = 0; frame < 10; frame += 1) simulation.step(IDLE, 0.05);

    const snapshot = simulation.snapshot();
    expect(snapshot.playerHealth).toBe(snapshot.playerMaxHealth);
    expect(snapshot.playerBonusHealth).toBeGreaterThan(0);
  });

  it("is spent before health when the player is hit", () => {
    const simulation = fullHealthCombat();
    const position = simulation.snapshot().playerPosition;
    simulation.spawnPowerup("medkit", { ...position });
    for (let frame = 0; frame < 10; frame += 1) simulation.step(IDLE, 0.05);
    const banked = simulation.snapshot().playerBonusHealth;
    expect(banked).toBeGreaterThan(0);

    simulation.spawnEnemy("scuttler", { ...simulation.snapshot().playerPosition });

    let sawBonusSpentWithHealthIntact = false;
    for (let frame = 0; frame < 60; frame += 1) {
      simulation.step(IDLE, 0.05);
      const snapshot = simulation.snapshot();
      if (snapshot.playerBonusHealth < banked && snapshot.playerHealth === snapshot.playerMaxHealth) {
        sawBonusSpentWithHealthIntact = true;
        break;
      }
    }
    expect(sawBonusSpentWithHealthIntact).toBe(true);
  });

  it("falls through to health only once the pool is empty", () => {
    const simulation = fullHealthCombat();
    const position = simulation.snapshot().playerPosition;
    simulation.spawnPowerup("medkit", { ...position });
    for (let frame = 0; frame < 10; frame += 1) simulation.step(IDLE, 0.05);
    expect(simulation.snapshot().playerBonusHealth).toBeGreaterThan(0);

    simulation.spawnEnemy("scuttler", { ...simulation.snapshot().playerPosition });
    for (let frame = 0; frame < 600; frame += 1) simulation.step(IDLE, 0.05);

    const snapshot = simulation.snapshot();
    expect(snapshot.playerBonusHealth).toBe(0);
    expect(snapshot.playerHealth).toBeLessThan(snapshot.playerMaxHealth);
  });
});
