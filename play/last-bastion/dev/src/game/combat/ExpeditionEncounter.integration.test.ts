import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import { WAVE_THREAT_BUDGETS } from "./DensityDirector";

function encounter(
  kind: ExpeditionEncounterDescriptor["kind"],
  column = 3,
): ExpeditionEncounterDescriptor {
  return {
    nodeId: 8,
    kind,
    column,
    themeId: "bastion-standard",
    seed: 2026,
    directorWaveIndex: column,
    threatBudget: WAVE_THREAT_BUDGETS[column]!,
    eliteKind: kind === "elite" ? "carapace-scuttler" : null,
    miniBossKind: kind === "mini-boss" ? "rift-stalker" : null,
  };
}

describe("Expedition encounter integration", () => {
  it("restores the carried build, including weapon tier and upgrade effects", () => {
    const simulation = new CombatSimulation({
      expeditionEncounter: encounter("supply-depot"),
      startingBuild: {
        health: 7,
        shield: 2,
        level: 4,
        experience: 11,
        scrap: 55,
        weapons: [{ weaponId: "bastion-service-rifle", tier: 2 }],
        upgrades: [{ upgradeId: "rapid-cycling", level: 1 }],
      },
    });
    const snapshot = simulation.snapshot();
    expect(snapshot.playerHealth).toBe(7);
    expect(snapshot.playerShield).toBe(2);
    expect(snapshot.level).toBe(4);
    expect(snapshot.experience).toBe(11);
    expect(snapshot.securedScrap).toBe(55);
    expect(snapshot.weaponInventory.rack[1]?.tile?.tier).toBe(2);
    expect(snapshot.weapon.projectileDamage).toBeCloseTo(3.2, 5);
    expect(snapshot.weapon.fireIntervalSeconds).toBeCloseTo(0.119, 5);
  });

  it("resolves safe nodes only after their full-screen decision is chosen", () => {
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("supply-depot") });
    expect(simulation.snapshot().pendingDecision?.kind).toBe("supply-depot");
    expect(simulation.snapshot().status).toBe("combat");
    expect(simulation.chooseOption("patch-up")).toBe(true);
    expect(simulation.step({
      move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
      evasiveMovePressed: false, ultimatePressed: false, kitPressed: false, interactPressed: false,
      pausePressed: false, restartPressed: false,
    }, 0.016).status).toBe("victory");
  });

  it("uses the existing depth-indexed threat budget for combat nodes", () => {
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("combat", 5) });
    expect(simulation.snapshot().density.threatBudget).toBe(WAVE_THREAT_BUDGETS[5]);
    expect(simulation.snapshot().totalWaves).toBe(10);
  });

  it("keeps Elite nodes kill-owned even at depths where ordinary waves are timed", () => {
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("elite", 5) });
    expect(simulation.snapshot().density.timerEndsWave).toBe(false);
    expect(simulation.snapshot().enemies.some((enemy) => enemy.eliteKind)).toBe(true);
  });
});
