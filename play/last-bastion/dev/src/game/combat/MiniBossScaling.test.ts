import { describe, expect, it } from "vitest";
import { CombatSimulation, type EnemySnapshot } from "./CombatSimulation";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import { buildExpeditionWavePlan } from "../expedition/ExpeditionNodeDirector";
import { rankDefeatScrap } from "../expedition/CampaignTuning";
import { ENEMY_CATALOG } from "../content/enemyCatalog";
import { waveScaling } from "./WaveScaling";

/**
 * Phase 5: mini-bosses used to be pinned at their catalog stat block with
 * `movementSpeedMultiplier = 1` and `damageMultiplier = 1` forever, which made a
 * column-7 mini-boss *less* threatening than the elites escorting it — the
 * opposite of a climactic node.
 */
function miniBossEncounter(column: number): ExpeditionEncounterDescriptor {
  const waves = buildExpeditionWavePlan("mini-boss", column, null, "siege-crusher");
  return {
    nodeId: 8,
    kind: "mini-boss",
    column,
    themeId: "bastion-standard",
    seed: 2026,
    directorWaveIndex: column,
    threatBudget: waves[0]?.threatBudget ?? 0,
    eliteKind: null,
    miniBossKind: "siege-crusher",
    eventId: null,
    waves,
  };
}

/** Spawns the node's mini-boss directly at the node's depth and reads it back. */
function miniBossAtColumn(column: number): EnemySnapshot {
  const simulation = new CombatSimulation({ expeditionEncounter: miniBossEncounter(column) });
  simulation.spawnMiniBoss("siege-crusher", { x: 10, y: 10 });
  return simulation.snapshot().enemies.find((enemy) => enemy.miniBossKind === "siege-crusher")!;
}

describe("mini-boss wave scaling", () => {
  it("scales a deep mini-boss in health, speed, damage, armour and body size", () => {
    const shallow = miniBossAtColumn(0);
    const deep = miniBossAtColumn(7);

    expect(shallow.maxHealth).toBe(ENEMY_CATALOG["siege-crusher"].maxHealth);
    expect(shallow.movementSpeedMultiplier).toBe(1);
    expect(shallow.damageMultiplier).toBe(1);

    expect(deep.maxHealth).toBeGreaterThan(shallow.maxHealth);
    expect(deep.movementSpeedMultiplier).toBeGreaterThan(1);
    expect(deep.damageMultiplier).toBeGreaterThan(1);
    expect(deep.armour).toBeGreaterThan(shallow.armour);
    // Size is simulation-owned, so the hitbox grows with the silhouette.
    expect(deep.radiusScale).toBeGreaterThan(1);
    expect(deep.radiusMetres).toBeGreaterThan(shallow.radiusMetres);
  });

  it("stays gentler than the elite curve so the fixed windup telegraphs remain readable", () => {
    const miniBoss = waveScaling(8, "siege-crusher", { miniBoss: true });
    const elite = waveScaling(8, "scuttler", { elite: true });
    expect(miniBoss.speedMultiplier).toBeLessThan(elite.speedMultiplier);
    expect(miniBoss.damageMultiplier).toBeLessThan(elite.damageMultiplier);
  });

  it("pays out more for a deeper kill", () => {
    expect(rankDefeatScrap(40, 7)).toBeGreaterThan(rankDefeatScrap(40, 0));
    expect(rankDefeatScrap(40, 0)).toBe(40);
  });

  it("drops a distinct relic-or-upgrade cache as well as scrap", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const id = simulation.spawnMiniBoss("brood-warden", simulation.snapshot().playerPosition);

    simulation.dealDamage(id, 99999);
    for (let frame = 0; frame < 30; frame += 1) {
      const snapshot = simulation.step({
        move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
        evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
        kitPressed: false, pausePressed: false, restartPressed: false,
      }, 0.05);
      if (snapshot.pendingDecision?.kind === "rank-reward") break;
      if (snapshot.pendingDecision) simulation.chooseOption(snapshot.pendingDecision.options[0]!.id);
    }
    const reward = simulation.snapshot().pendingDecision;
    expect(reward?.kind).toBe("rank-reward");
    expect(reward?.options.some(({ id: optionId }) => optionId.startsWith("relic:"))).toBe(true);
    expect(reward?.options.some(({ id: optionId }) => optionId.startsWith("upgrade:"))).toBe(true);
  });
});
