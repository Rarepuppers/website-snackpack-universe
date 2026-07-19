import { describe, expect, it } from "vitest";
import {
  completeCurrentNode,
  hasPendingEncounter,
  isExpeditionComplete,
  moveToNode,
  nodePresentation,
  resumeExpeditionRun,
  selectableNodeIds,
  startExpeditionRun,
  type ExpeditionRun,
} from "./ExpeditionRun";
import { expeditionNodeById } from "./ExpeditionMap";

function completeRun(seed: number): ExpeditionRun {
  let run = startExpeditionRun(seed);
  for (let guard = 0; guard < 30 && !isExpeditionComplete(run); guard += 1) {
    const next = selectableNodeIds(run)[0]!;
    run = moveToNode(run, next)!;
    run = completeCurrentNode(run, {
      health: 10, shield: 0, level: 1, experience: 0, scrap: 0,
      weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }], upgrades: [],
    });
  }
  return run;
}

describe("Expedition run state", () => {
  it("starts on the drop site with only next-column nodes selectable", () => {
    const run = startExpeditionRun(77);
    expect(run.state.currentNodeId).toBe(run.map.startNodeId);
    expect(run.state.clearedNodeIds).toEqual([run.map.startNodeId]);
    for (const id of selectableNodeIds(run)) {
      expect(expeditionNodeById(run.map, id)!.column).toBe(1);
    }
  });

  it("refuses travel to any node that is not directly reachable", () => {
    const run = startExpeditionRun(77);
    expect(moveToNode(run, run.map.bossNodeId)).toBeNull();
    expect(moveToNode(run, run.map.startNodeId)).toBeNull();
    expect(moveToNode(run, 9999)).toBeNull();
  });

  it("keeps arrival pending until encounter completion, then advances", () => {
    let run = startExpeditionRun(41);
    run = moveToNode(run, selectableNodeIds(run)[0]!)!;
    expect(hasPendingEncounter(run)).toBe(true);
    expect(selectableNodeIds(run)).toEqual([]);
    expect(run.state.clearedNodeIds).toEqual([run.map.startNodeId]);
    run = completeCurrentNode(run, {
      health: 8, shield: 1, level: 2, experience: 3, scrap: 20,
      weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }], upgrades: [],
    });
    expect(hasPendingEncounter(run)).toBe(false);
    expect(run.state.build?.scrap).toBe(20);
    expect(selectableNodeIds(run).length).toBeGreaterThan(0);
  });

  it("travels forward, accumulating cleared nodes, and completes at the boss", () => {
    const run = completeRun(41);
    expect(isExpeditionComplete(run)).toBe(true);
    expect(run.state.currentNodeId).toBe(run.map.bossNodeId);
    // Drop site through boss inclusive: an 8-column chart crosses 8 nodes.
    expect(run.state.clearedNodeIds).toHaveLength(8);
    expect(selectableNodeIds(run)).toHaveLength(0);
  });

  it("classifies chart presentation: current, reachable, cleared, open, unreachable", () => {
    let run = startExpeditionRun(13);
    run = moveToNode(run, selectableNodeIds(run)[0]!)!;
    run = completeCurrentNode(run, {
      health: 10, shield: 0, level: 1, experience: 0, scrap: 0,
      weapons: [], upgrades: [],
    });
    expect(nodePresentation(run, run.state.currentNodeId)).toBe("current");
    expect(nodePresentation(run, run.map.startNodeId)).toBe("cleared");
    for (const id of selectableNodeIds(run)) {
      expect(nodePresentation(run, id)).toBe("reachable");
    }
    expect(nodePresentation(run, run.map.bossNodeId)).toBe("open");
    const abandoned = run.map.nodes.find((node) => (
      node.column === 1 && node.id !== run.state.currentNodeId
    ));
    if (abandoned) {
      expect(nodePresentation(run, abandoned.id)).toBe("unreachable");
    }
  });

  it("round-trips through persisted state and resumes at the same position", () => {
    let run = startExpeditionRun(2026);
    run = moveToNode(run, selectableNodeIds(run)[0]!)!;
    run = completeCurrentNode(run, {
      health: 10, shield: 0, level: 1, experience: 0, scrap: 0, weapons: [], upgrades: [],
    });
    run = moveToNode(run, selectableNodeIds(run)[0]!)!;
    const restored = resumeExpeditionRun({ ...run.state, clearedNodeIds: [...run.state.clearedNodeIds] })!;
    expect(restored).not.toBeNull();
    expect(restored.state.currentNodeId).toBe(run.state.currentNodeId);
    expect(restored.map.nodes.map((node) => node.type))
      .toEqual(run.map.nodes.map((node) => node.type));
    expect(hasPendingEncounter(restored)).toBe(true);
    expect(selectableNodeIds(restored)).toEqual([]);
  });

  it("rejects tampered or foreign persisted state", () => {
    const run = startExpeditionRun(5);
    expect(resumeExpeditionRun({ ...run.state, currentNodeId: 999 })).toBeNull();
    expect(resumeExpeditionRun({ ...run.state, clearedNodeIds: [1, 999] })).toBeNull();
    expect(resumeExpeditionRun({ ...run.state, currentNodeId: run.map.bossNodeId })).toBeNull();
  });
});
