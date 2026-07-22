import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import {
  STORM_REGENT_COIL_RADIUS_METRES,
  STORM_REGENT_NODE_COUNT,
  createStormRegentBehavior,
  damageStormRegentNode,
  selectStormRegentMove,
  stepStormRegentBehavior,
  stormRegentHasEscapeLane,
  type StormRegentContext,
  type StormRegentState,
} from "./StormRegentBehavior";
import { createConductiveNode } from "./StormSavantLightning";

const ARENA: ArenaDefinition = {
  id: "regent-test",
  widthMetres: 24,
  heightMetres: 16,
  tileSizeMetres: 1,
  obstacles: [],
};

const BASE: StormRegentContext = {
  ownerPosition: { x: 3, y: 8 },
  playerPosition: { x: 12, y: 8 },
  ownerHealth: 760,
  ownerMaxHealth: 760,
  arena: ARENA,
  playerRadiusMetres: 0.55,
};

function setupState(seed = 0, context = BASE): StormRegentState {
  return stepStormRegentBehavior(createStormRegentBehavior(seed, context, 100), 1, context).state;
}

describe("Storm Regent behavior boundary", () => {
  it("owns exactly three deterministic finite nodes outside collision", () => {
    const first = createStormRegentBehavior(4, BASE, 100);
    const repeat = createStormRegentBehavior(4, BASE, 100);
    expect(first.nodes).toEqual(repeat.nodes);
    expect(first.nodes).toHaveLength(STORM_REGENT_NODE_COUNT);
    expect(first.nodes.map((node) => node.id)).toEqual([100, 101, 102]);
  });

  it("locks at most two chain hops and never retargets after warning", () => {
    const begun = stepStormRegentBehavior(setupState(0), 1, BASE);
    expect(begun).toMatchObject({ moveStarted: "chain-strike" });
    expect(begun.state.lockedChain?.segments).toHaveLength(2);
    const moved = stepStormRegentBehavior(begun.state, 0.2, {
      ...BASE,
      playerPosition: { x: 20, y: 2 },
    });
    expect(moved.state.lockedChain).toEqual(begun.state.lockedChain);
  });

  it("clips the committed chain at first cover and removes downstream propagation", () => {
    const context: StormRegentContext = {
      ...BASE,
      ownerPosition: { x: 2, y: 4 },
      playerPosition: { x: 10, y: 4 },
      arena: {
        ...ARENA,
        obstacles: [{ id: "cover", kind: "barricade", x: 5, y: 3, width: 1, height: 2 }],
      },
    };
    const state = {
      ...setupState(0, context),
      nodes: [createConductiveNode(1, { x: 8, y: 4 }), createConductiveNode(2, { x: 12, y: 4 })],
    };
    const begun = stepStormRegentBehavior(state, 1, context).state;
    expect(begun.lockedChain?.segments).toHaveLength(1);
    expect(begun.lockedChain?.segments[0]).toMatchObject({
      to: { x: 5, y: 4 },
      blockedByObstacleId: "cover",
    });
  });

  it("destroying any committed chain node cancels into vulnerable recovery", () => {
    const begun = stepStormRegentBehavior(setupState(0), 1, BASE).state;
    const nodeId = begun.lockedChain!.lockedNodeIds[0]!;
    const interrupted = stepStormRegentBehavior(damageStormRegentNode(begun, nodeId, 99), 0.01, BASE);
    expect(interrupted).toMatchObject({
      interrupted: true,
      moveResolved: "chain-strike",
      state: { phase: "recovery", lockedChain: null },
    });
  });

  it("locks one destructible overcharge node and preserves a sampled escape lane", () => {
    const begun = stepStormRegentBehavior(setupState(1), 1, BASE).state;
    expect(begun).toMatchObject({ move: "node-overcharge" });
    expect(begun.overchargeNodeId).not.toBeNull();
    expect(stormRegentHasEscapeLane(begun, BASE)).toBe(true);
    const interrupted = stepStormRegentBehavior(
      damageStormRegentNode(begun, begun.overchargeNodeId!, 99),
      0.01,
      BASE,
    );
    expect(interrupted).toMatchObject({ interrupted: true, state: { phase: "recovery" } });
  });

  it("frenzy shortens tells without adding nodes, hops, radius, or simultaneous patterns", () => {
    const normal = stepStormRegentBehavior(setupState(2), 1, BASE).state;
    const frenzyContext = { ...BASE, ownerHealth: 100 };
    const frenzy = stepStormRegentBehavior(setupState(2, frenzyContext), 1, frenzyContext).state;
    expect(normal.move).toBe("coil-burst");
    expect(frenzy.phaseRemainingSeconds).toBeLessThan(normal.phaseRemainingSeconds);
    expect(frenzy.nodes).toHaveLength(STORM_REGENT_NODE_COUNT);
    expect(frenzy.lockedChain).toBeNull();
    expect(STORM_REGENT_COIL_RADIUS_METRES).toBe(2.8);
    expect(stormRegentHasEscapeLane(frenzy, frenzyContext)).toBe(true);
  });

  it("waits instead of repeating coil burst when every node counter is gone", () => {
    let state = setupState(0);
    for (const node of state.nodes) state = damageStormRegentNode(state, node.id, 99);
    state = { ...state, previousMove: "coil-burst", attackIndex: 2 };
    expect(selectStormRegentMove(state, BASE)).toBeNull();
    expect(stepStormRegentBehavior(state, 1, BASE)).toMatchObject({
      moveStarted: null,
      state: { phase: "setup" },
    });
  });
});
