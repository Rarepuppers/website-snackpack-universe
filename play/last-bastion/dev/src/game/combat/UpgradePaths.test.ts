import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import type { UpgradeId } from "../content/upgradeCatalog";
import { UPGRADE_CATALOG, upgradeLevelName } from "../content/upgradeCatalog";

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

/** Levels up repeatedly, choosing the target whenever offered. Returns picks made. */
function chooseUpgradeTimes(
  simulation: CombatSimulation,
  targetId: UpgradeId,
  times: number,
  maxLevels = 40,
): number {
  let picks = 0;
  for (let attempt = 0; attempt < maxLevels && picks < times; attempt += 1) {
    const snapshot = simulation.snapshot();
    if (snapshot.pendingDecision?.kind !== "upgrade") {
      simulation.addExperience(snapshot.experienceForNextLevel);
      continue;
    }
    const offered = snapshot.pendingDecision.options.some((option) => option.id === targetId);
    if (offered) {
      simulation.chooseOption(targetId);
      picks += 1;
    } else {
      simulation.chooseOption(snapshot.pendingDecision.options[0]!.id);
    }
  }
  return picks;
}

describe("leveled upgrade system", () => {
  it("labels repeat offers with the next level and tracks levels in the snapshot", () => {
    expect(upgradeLevelName("chain-lightning", 1)).toBe("Chain Lightning I");
    expect(upgradeLevelName("chain-lightning", 2)).toBe("Chain Lightning II");

    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(chooseUpgradeTimes(simulation, "chain-lightning", 2)).toBe(2);
    const snapshot = simulation.snapshot();
    expect(snapshot.upgradeLevels.find((entry) => entry.id === "chain-lightning")?.level).toBe(2);
    expect(snapshot.weapon.chainCount).toBe(2);
  });

  it("stops offering an upgrade at its maximum level", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const maxLevel = UPGRADE_CATALOG["rapid-cycling"].maxLevel;
    expect(chooseUpgradeTimes(simulation, "rapid-cycling", maxLevel)).toBe(maxLevel);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const snapshot = simulation.snapshot();
      if (snapshot.pendingDecision?.kind !== "upgrade") {
        simulation.addExperience(snapshot.experienceForNextLevel);
        continue;
      }
      expect(snapshot.pendingDecision.options.some((option) => option.id === "rapid-cycling"))
        .toBe(false);
      simulation.chooseOption(snapshot.pendingDecision.options[0]!.id);
    }
  });

  it("locks the Cryo path after committing to Incendiary", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(chooseUpgradeTimes(simulation, "incendiary-rounds", 1)).toBe(1);

    for (let attempt = 0; attempt < 14; attempt += 1) {
      const snapshot = simulation.snapshot();
      if (snapshot.pendingDecision?.kind !== "upgrade") {
        simulation.addExperience(snapshot.experienceForNextLevel);
        continue;
      }
      expect(snapshot.pendingDecision.options.some((option) => option.id === "cryo-coating"))
        .toBe(false);
      simulation.chooseOption(snapshot.pendingDecision.options[0]!.id);
    }
  });

  it("decays chain-lightning damage on each additional bounce", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["arc-carbine"],
    });
    expect(chooseUpgradeTimes(simulation, "chain-lightning", 1)).toBe(1);
    const player = simulation.snapshot().playerPosition;
    const firstId = simulation.spawnEnemy("egg-cluster", { x: player.x + 3, y: player.y });
    const secondId = simulation.spawnEnemy("egg-cluster", { x: player.x + 5, y: player.y });
    const thirdId = simulation.spawnEnemy("egg-cluster", { x: player.x + 7, y: player.y });

    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 30; frame += 1) {
      snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
      if (snapshot.enemies.every((enemy) => enemy.health < enemy.maxHealth)) break;
    }

    const health = (id: number) => snapshot.enemies.find((enemy) => enemy.id === id)!.health;
    const directLoss = 7 - health(firstId);
    const firstBounceLoss = 7 - health(secondId);
    const secondBounceLoss = 7 - health(thirdId);
    expect(directLoss).toBeGreaterThan(firstBounceLoss);
    expect(firstBounceLoss).toBeGreaterThan(secondBounceLoss);
    expect(secondBounceLoss).toBeGreaterThan(0);
  });

  it("detonates blazing aliens on death at Incendiary level three", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(chooseUpgradeTimes(simulation, "incendiary-rounds", 3)).toBe(3);

    const victimId = simulation.spawnEnemy("scuttler", { x: 4, y: 4 });
    const bystanderId = simulation.spawnEnemy("egg-cluster", { x: 5, y: 4 });

    // One large fire hit ignites (buildup ≥ threshold) and kills in the same
    // call, so the corpse must combust and burn the bystander.
    simulation.dealDamage(victimId, 60, "fire");

    const snapshot = simulation.snapshot();
    expect(snapshot.events.filter((event) => event.type === "explosion").length).toBeGreaterThan(0);
    const bystander = snapshot.enemies.find((enemy) => enemy.id === bystanderId);
    expect(bystander!.health).toBeLessThan(7);
  });

  it("freezes harder and longer at Cryo Coating level three", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(chooseUpgradeTimes(simulation, "cryo-coating", 3)).toBe(3);

    const player = simulation.snapshot().playerPosition;
    const eliteId = simulation.spawnElite("carapace-scuttler", { x: player.x + 8, y: player.y });
    simulation.dealDamage(eliteId, 8, "cryo");
    const frozen = simulation.snapshot().enemies.find((enemy) => enemy.id === eliteId);
    expect(frozen?.statuses).toContain("freeze");

    const before = frozen!.position.x;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 20; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    const after = snapshot.enemies.find((enemy) => enemy.id === eliteId)!.position.x;
    // Unfrozen pursuit covers ~1.85 m in this window; a level-three freeze
    // (15% speed) must keep it under half a metre.
    expect(Math.abs(before - after)).toBeLessThan(0.5);
  });
});
