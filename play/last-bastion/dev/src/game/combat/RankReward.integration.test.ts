import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

function advanceToRankReward(simulation: CombatSimulation): ReturnType<CombatSimulation["snapshot"]> {
  for (let frame = 0; frame < 30; frame += 1) {
    const snapshot = simulation.step(IDLE, 0.05);
    if (snapshot.pendingDecision?.kind === "rank-reward") return snapshot;
    if (snapshot.pendingDecision) simulation.chooseOption(snapshot.pendingDecision.options[0]!.id);
  }
  return simulation.snapshot();
}

describe("rank reward integration", () => {
  it("turns an elite cache into a three-item choice and applies the selection", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 17 });
    const enemyId = simulation.spawnElite("razorlord", simulation.snapshot().playerPosition);
    simulation.dealDamage(enemyId, 10_000);
    const reward = advanceToRankReward(simulation);
    expect(reward.pendingDecision?.options).toHaveLength(3);
    expect(reward.pendingDecision?.options.every(({ id }) => id.startsWith("item:"))).toBe(true);
    const chosen = reward.pendingDecision!.options[0]!.id;
    expect(simulation.chooseOption(chosen)).toBe(true);
    expect(simulation.snapshot().ownedItemIds).toContain(chosen.replace("item:", ""));
  });

  it("turns a mini-boss cache into a relic-or-upgrade choice", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 23 });
    const enemyId = simulation.spawnMiniBoss("siege-crusher", simulation.snapshot().playerPosition);
    simulation.dealDamage(enemyId, 100_000);
    const reward = advanceToRankReward(simulation);
    expect(reward.pendingDecision?.title).toBe("MINI-BOSS CACHE — RELIC OR UPGRADE");
    expect(reward.pendingDecision?.options.some(({ id }) => id.startsWith("relic:"))).toBe(true);
    expect(reward.pendingDecision?.options.some(({ id }) => id.startsWith("upgrade:"))).toBe(true);
    const chosen = reward.pendingDecision!.options.find(({ id }) => id.startsWith("relic:"))!.id;
    expect(simulation.chooseOption(chosen)).toBe(true);
    expect(simulation.snapshot().relicIds).toContain(chosen.replace("relic:", ""));
  });

  it("turns a boss victory into an artifact choice and equips the selection", () => {
    const simulation = new CombatSimulation({ scenario: "bastion-eater", autoStartWaves: false, seed: 29 });
    const enemyId = simulation.snapshot().enemies.find((enemy) => enemy.rank === "boss")!.id;
    simulation.dealDamage(enemyId, 1_000_000);
    const reward = simulation.snapshot();
    expect(reward.status).toBe("victory");
    expect(reward.pendingDecision?.title).toBe("BOSS VAULT — CHOOSE AN ARTIFACT");
    expect(reward.pendingDecision?.options).toHaveLength(3);
    const chosen = reward.pendingDecision!.options[0]!.id;
    expect(simulation.chooseOption(chosen)).toBe(true);
    expect(simulation.snapshot().equippedArtifactId).toBe(chosen.replace("artifact:", ""));
  });
});
