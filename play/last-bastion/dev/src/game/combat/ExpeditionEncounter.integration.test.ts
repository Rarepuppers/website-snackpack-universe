import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import { WAVE_THREAT_BUDGETS } from "./DensityDirector";
import { buildExpeditionWavePlan } from "../expedition/ExpeditionNodeDirector";

const IDLE = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, ultimatePressed: false, kitPressed: false, interactPressed: false,
  pausePressed: false, restartPressed: false,
};

function advance(simulation: CombatSimulation, seconds: number): void {
  for (let tick = 0; tick < Math.ceil(seconds / 0.05); tick += 1) simulation.step(IDLE, 0.05);
}

function encounter(
  kind: ExpeditionEncounterDescriptor["kind"],
  column = 3,
): ExpeditionEncounterDescriptor {
  const eliteKind = kind === "elite" ? "carapace-scuttler" as const : null;
  const miniBossKind = kind === "mini-boss" ? "rift-stalker" as const : null;
  const waves = buildExpeditionWavePlan(kind, column, eliteKind, miniBossKind);
  return {
    nodeId: 8,
    kind,
    column,
    themeId: "bastion-standard",
    seed: 2026,
    directorWaveIndex: column,
    threatBudget: waves[0]?.threatBudget ?? WAVE_THREAT_BUDGETS[column]!,
    eliteKind,
    miniBossKind,
    eventId: null,
    waves,
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
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("supply-depot", 2) });
    expect(simulation.snapshot().pendingDecision?.kind).toBe("supply-depot");
    expect(simulation.snapshot().status).toBe("combat");
    expect(simulation.step(IDLE, 0.016).status).toBe("combat");
    expect(simulation.snapshot().pendingDecision?.kind).toBe("supply-depot");
    expect(simulation.chooseOption("patch-up")).toBe(true);
    expect(simulation.step({
      move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
      evasiveMovePressed: false, ultimatePressed: false, kitPressed: false, interactPressed: false,
      pausePressed: false, restartPressed: false,
    }, 0.016).status).toBe("victory");
  });

  it("opens a depth-priced campaign shop after a mid-route safe node", () => {
    const simulation = new CombatSimulation({
      expeditionEncounter: encounter("supply-depot", 3),
      startingBuild: {
        health: 5,
        shield: 0,
        level: 1,
        experience: 0,
        scrap: 35,
        weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }],
        upgrades: [],
      },
    });
    expect(simulation.chooseOption("patch-up")).toBe(true);
    simulation.step(IDLE, 0.016);
    const shop = simulation.snapshot();
    expect(shop.pendingDecision?.kind).toBe("scrap-shop");
    expect(shop.pendingDecision?.shopRerollCost).toBe(30);
    expect(shop.pendingDecision?.options.some((option) => option.id === "shop-repair")).toBe(true);
    expect(shop.securedScrap).toBe(45);
    expect(simulation.chooseOption("shop-leave")).toBe(true);
    expect(simulation.step(IDLE, 0.016).status).toBe("victory");
  });

  it("uses the node-depth budget sequence for combat nodes", () => {
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("combat", 5) });
    expect(simulation.snapshot().density.threatBudget).toBe(65);
    expect(simulation.snapshot().waveNumber).toBe(1);
    expect(simulation.snapshot().totalWaves).toBe(4);
  });

  it("stages Elite nodes as two lead waves followed by a kill-owned elite wave", () => {
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("elite", 5) });
    expect(simulation.snapshot().totalWaves).toBe(3);
    expect(simulation.snapshot().density.threatBudget).toBe(96);
    expect(simulation.snapshot().enemies.some((enemy) => enemy.eliteKind)).toBe(false);
  });

  it("advances internal node waves without returning to the expedition map", () => {
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("elite", 5) });
    (simulation as unknown as { waveElapsedSeconds: number }).waveElapsedSeconds = 1_000;
    simulation.step(IDLE, 0.05);
    advance(simulation, 2.1);
    expect(simulation.snapshot().waveNumber).toBe(2);
    expect(simulation.snapshot().status).toBe("combat");
    (simulation as unknown as { waveElapsedSeconds: number }).waveElapsedSeconds = 1_000;
    simulation.step(IDLE, 0.05);
    advance(simulation, 2.1);
    expect(simulation.snapshot().waveNumber).toBe(3);
    expect(simulation.snapshot().status).toBe("combat");
    expect(simulation.snapshot().density.timerEndsWave).toBe(false);
    expect(simulation.snapshot().enemies.some((enemy) => enemy.eliteKind === "carapace-scuttler")).toBe(true);
  });

  it("stages Mini-boss nodes as one arena wave plus the authored fight", () => {
    const simulation = new CombatSimulation({ expeditionEncounter: encounter("mini-boss", 6) });
    expect(simulation.snapshot().totalWaves).toBe(2);
    expect(simulation.snapshot().density.threatBudget).toBe(108);
    expect(simulation.snapshot().enemies.some((enemy) => enemy.miniBossKind)).toBe(false);
  });

  it("keeps Quick Drop on its independent ten-wave script", () => {
    const simulation = new CombatSimulation();
    expect(simulation.snapshot().totalWaves).toBe(10);
    expect(simulation.snapshot().density.threatBudget).toBe(30);
  });
});
