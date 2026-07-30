import { describe, expect, it } from "vitest";
import { CombatSimulation, type PowerupType } from "./CombatSimulation";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import { WAVE_THREAT_BUDGETS } from "./DensityDirector";
import { buildExpeditionWavePlan } from "../expedition/ExpeditionNodeDirector";

/**
 * Guards the wave-drop rotation's *reachability*, not its tuning. Two bugs
 * lived here: four implemented powerups had no spawn route at all, and every
 * expedition node restarted the cycle at index 0, so a campaign could only ever
 * see the first four entries.
 */

const IDLE = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, ultimatePressed: false, kitPressed: false, interactPressed: false,
  pausePressed: false, restartPressed: false,
};

function encounter(seed: number): ExpeditionEncounterDescriptor {
  const column = 3;
  const waves = buildExpeditionWavePlan("combat", column, null, null);
  return {
    nodeId: 8,
    kind: "combat",
    column,
    themeId: "bastion-standard",
    seed,
    directorWaveIndex: column,
    threatBudget: waves[0]?.threatBudget ?? WAVE_THREAT_BUDGETS[column]!,
    eliteKind: null,
    miniBossKind: null,
    eventId: null,
    waves,
  };
}

/** The powerup dropped on the encounter's opening wave. */
function firstDrop(seed: number): PowerupType {
  const simulation = new CombatSimulation({ expeditionEncounter: encounter(seed) });
  simulation.step(IDLE, 0.05);
  const powerups = simulation.snapshot().powerups;
  expect(powerups.length).toBeGreaterThan(0);
  return powerups[0]!.type;
}

describe("powerup wave rotation", () => {
  it("reaches every powerup except the chest-only medkit across enough seeds", () => {
    const seen = new Set<PowerupType>();
    for (let seed = 0; seed < 40; seed += 1) seen.add(firstDrop(seed));

    // medkit is deliberately excluded: supply chests and Symbiote Heart drop it.
    const expected: PowerupType[] = [
      "overcharge", "magnet-pulse", "adrenaline", "aegis",
      "uranium-core-rounds", "phase-jacket", "siege-loader", "emp-charge",
      "hunter-optics", "last-stand-stimulant", "butchers-serum",
    ];
    for (const type of expected) {
      expect(seen.has(type), `${type} is unreachable from wave drops`).toBe(true);
    }
    expect(seen.has("medkit")).toBe(false);
  });

  it("varies the opening drop between nodes rather than always starting at index 0", () => {
    const drops = new Set([firstDrop(0), firstDrop(1), firstDrop(2), firstDrop(3)]);
    expect(drops.size).toBeGreaterThan(1);
  });

  it("is deterministic: the same seed always drops the same powerup", () => {
    expect(firstDrop(2026)).toBe(firstDrop(2026));
  });

  it("keeps Quick Drop's sequence anchored at the start of the cycle", () => {
    // No encounter means no offset, so the ten-wave run is unchanged.
    const simulation = new CombatSimulation({ autoStartWaves: true });
    simulation.step(IDLE, 0.05);
    expect(simulation.snapshot().powerups[0]?.type).toBe("overcharge");
  });
});
