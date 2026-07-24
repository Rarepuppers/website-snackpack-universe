import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";

function build(overrides: Partial<ExpeditionBuildSnapshot> = {}): ExpeditionBuildSnapshot {
  return {
    health: 8,
    shield: 0,
    level: 1,
    experience: 0,
    scrap: 0,
    weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }],
    upgrades: [],
    ...overrides,
  };
}

describe("combat relic/reward integration (Task 94 step 2)", () => {
  it("adds the Shrine max-health reward on top of base and level growth", () => {
    const plus = new CombatSimulation({ autoStartWaves: false, startingBuild: build({ maxHealthBonus: 5 }) });
    // Base 10 + level-1 growth 0 + reward 5.
    expect(plus.snapshot().playerMaxHealth).toBe(15);
  });

  it("floors max health so a costly bargain can never make the hero unplayable", () => {
    const gutted = new CombatSimulation({ autoStartWaves: false, startingBuild: build({ maxHealthBonus: -50 }) });
    expect(gutted.snapshot().playerMaxHealth).toBe(3);
    // Carried health is also clamped to the new ceiling.
    expect(gutted.snapshot().playerHealth).toBeLessThanOrEqual(3);
  });

  it("grants extra flexible rack slots from event weapon-slot rewards", () => {
    const baseline = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    const granted = new CombatSimulation({ autoStartWaves: false, startingBuild: build({ weaponSlotBonus: 2 }) });
    expect(granted.snapshot().weaponInventory.rack.length)
      .toBe(baseline.snapshot().weaponInventory.rack.length + 2);
  });

  it("carries owned relics and the equipped artifact through the combat snapshot so they survive a node", () => {
    const sim = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({
        relicIds: ["rel-blast-baffle", "rel-field-lattice"],
        equippedArtifactId: "art-event-horizon-core",
        maxHealthBonus: 4,
        weaponSlotBonus: 1,
      }),
    });
    const snapshot = sim.snapshot();
    expect(snapshot.relicIds).toEqual(["rel-blast-baffle", "rel-field-lattice"]);
    expect(snapshot.equippedArtifactId).toBe("art-event-horizon-core");
    expect(snapshot.rewardMaxHealthBonus).toBe(4);
    expect(snapshot.rewardWeaponSlotBonus).toBe(1);
  });

  it("constructs cleanly with each wired artifact equipped", () => {
    for (const artifact of ["art-scavengers-manifest", "art-symbiote-heart", "art-berserkers-chip", "art-aegis-reactor"] as const) {
      const sim = new CombatSimulation({ autoStartWaves: false, startingBuild: build({ equippedArtifactId: artifact }) });
      expect(sim.snapshot().equippedArtifactId).toBe(artifact);
    }
  });

  it("leaves a run with no reward carrier at neutral defaults", () => {
    const sim = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    const snapshot = sim.snapshot();
    expect(snapshot.relicIds).toEqual([]);
    expect(snapshot.equippedArtifactId).toBeNull();
    expect(snapshot.rewardMaxHealthBonus).toBe(0);
    expect(snapshot.rewardWeaponSlotBonus).toBe(0);
  });
});

describe("Phase 2 enabler carry-in (grantConsumable / grantLifesteal)", () => {
  it("activates a carried consumable kit as an immediate combat buff", () => {
    const sim = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ carriedConsumables: ["siege-loader"] }),
    });
    const buff = sim.snapshot().activeBuffs.find((candidate) => candidate.type === "siege-loader");
    expect(buff).toBeDefined();
    expect(buff!.remainingSeconds).toBeCloseTo(10);
  });

  it("adds bonus lifesteal-per-kill on top of any relic source", () => {
    const bonusOnly = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ health: 5, bonusLifestealPerKill: 0.1 }),
    });
    const stacked = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ health: 5, equippedArtifactId: "art-symbiote-heart", bonusLifestealPerKill: 0.1 }),
    });

    const bonusEggId = bonusOnly.spawnEnemy("egg-cluster", { x: 3, y: 3 });
    bonusOnly.dealDamage(bonusEggId, 9999);
    const bonusHeal = bonusOnly.snapshot().events.find((event) => event.type === "player-healed");
    expect(bonusHeal && "amount" in bonusHeal ? bonusHeal.amount : 0).toBeCloseTo(0.1);

    const stackedEggId = stacked.spawnEnemy("egg-cluster", { x: 3, y: 3 });
    stacked.dealDamage(stackedEggId, 9999);
    const stackedHeal = stacked.snapshot().events.find((event) => event.type === "player-healed");
    // Symbiote Heart's own 0.15 plus the 0.1 event bonus = 0.25.
    expect(stackedHeal && "amount" in stackedHeal ? stackedHeal.amount : 0).toBeCloseTo(0.25);
  });
});
